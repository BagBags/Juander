import React, { useState, useEffect, useRef } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import mbxDirections from "@mapbox/mapbox-sdk/services/directions";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiY2hhcmxlczI5ZyIsImEiOiJjbWNrYWVzYmUwYzY4MmpweGcwZDN0c25iIn0.JJ7mcLEqZchHFAV5XY776A";

const directionsClient = mbxDirections({ accessToken: MAPBOX_TOKEN });

const INTRAMUROS_BOUNDS = [
  [120.969, 14.5833],
  [120.9802, 14.5966],
];

const initialMaskFeature = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [120.973, 14.5889],
        [120.9749, 14.5885],
        [120.9773, 14.5901],
        [120.9784, 14.5919],
        [120.9784, 14.5939],
        [120.9765, 14.5949],
        [120.9741, 14.5944],
        [120.9722, 14.593],
        [120.9715, 14.5912],
        [120.9719, 14.5893],
        [120.973, 14.5889],
      ],
    ],
  },
};

const createInverseMask = (mask) => {
  return polygon([
    [
      [120.969, 14.5833],
      [120.9802, 14.5833],
      [120.9802, 14.5966],
      [120.969, 14.5966],
      [120.969, 14.5833],
    ],
    mask.geometry.coordinates[0],
  ]);
};

export default function TourMap() {
  const [viewState, setViewState] = useState({
    latitude: 14.5896,
    longitude: 120.9747,
    zoom: 16,
  });

  const [maskGeoJson, setMaskGeoJson] = useState(initialMaskFeature);
  const [inverseMaskGeoJson, setInverseMaskGeoJson] = useState(null);
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [pins, setPins] = useState([
    {
      latitude: 14.5896,
      longitude: 120.9747,
      title: "Welcome to Intramuros!",
      mediaType: "image",
      mediaUrl:
        "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_960_720.jpg",
    },
  ]);

  const [userLocation, setUserLocation] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [isInsideMask, setIsInsideMask] = useState(false);

  const drawRef = useRef(null);
  const adminMapRef = useRef(null);

  useEffect(() => {
    setInverseMaskGeoJson(createInverseMask(maskGeoJson));
  }, [maskGeoJson]);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ latitude, longitude });
        setViewState((prev) => ({ ...prev, latitude, longitude }));

        const pt = point([longitude, latitude]);
        const inside = booleanPointInPolygon(pt, maskGeoJson);
        setIsInsideMask(inside);
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [maskGeoJson]);

  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat;
    const newPin = {
      latitude: lat,
      longitude: lng,
      title: "New Location",
      mediaUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
      mediaType: "video",
    };
    setPins((prev) => [...prev, newPin]);
  };

  const renderPopup = (pin) => (
    <Popup
      latitude={pin.latitude}
      longitude={pin.longitude}
      anchor="top"
      closeOnClick={false}
      onClose={() => {
        setSelectedPin(null);
        setSelectedDistance(null);
        setRouteGeoJson(null);
      }}
    >
      <div style={{ maxWidth: 250, color: "black" }}>
        <h4>{pin.title}</h4>
        {selectedDistance !== null && (
          <p>🛣️ Distance: {(selectedDistance / 1000).toFixed(2)} km</p>
        )}
        {pin.mediaType === "image" ? (
          <img src={pin.mediaUrl} alt="media" style={{ width: "100%" }} />
        ) : (
          <video src={pin.mediaUrl} controls width="100%" />
        )}
      </div>
    </Popup>
  );

  const enableMaskEditing = () => {
    if (!adminMapRef.current) return;
    const map = adminMapRef.current.getMap();

    if (drawRef.current) {
      map.removeControl(drawRef.current);
    }

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: false,
        trash: false,
      },
    });

    drawRef.current = draw;
    map.addControl(draw, "top-left");

    draw.add(maskGeoJson);
  };

  const saveMask = () => {
    if (drawRef.current) {
      const data = drawRef.current.getAll();
      if (data.features.length > 0) {
        const newMask = data.features[0];
        setMaskGeoJson(newMask);
        console.log("💾 Saved Mask GeoJSON:", JSON.stringify(newMask, null, 2));
        alert("Mask saved and applied!");
      } else {
        alert("No mask found.");
      }
    }
  };

  const handleFeedbackClick = () => {
    if (!userLocation) {
      alert(
        "🚫 GPS is disabled. Turn on location services to submit feedback."
      );
      return;
    }

    const userPoint = point([userLocation.longitude, userLocation.latitude]);
    const isReallyInside = booleanPointInPolygon(userPoint, maskGeoJson);

    if (!isReallyInside) {
      alert(
        "🔴 You're outside Intramuros. Move inside the boundary to submit feedback."
      );
      return;
    }

    alert("📣 Feedback submitted!");
  };

  return (
    <div style={{ padding: "1rem", color: "black" }}>
      <h2>User Map with Directions</h2>
      <div style={{ position: "relative" }}>
        <Map
          initialViewState={{ ...viewState, minZoom: 15.5 }}
          maxBounds={INTRAMUROS_BOUNDS}
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          style={{ width: "100%", height: "500px" }}
          onClick={() => {
            setSelectedPin(null);
            setSelectedDistance(null);
            setRouteGeoJson(null);
          }}
        >
          {userLocation && (
            <Marker
              latitude={userLocation.latitude}
              longitude={userLocation.longitude}
              anchor="bottom"
            >
              <div
                style={{ textAlign: "center", transform: "translateY(-20px)" }}
              >
                <div style={{ fontSize: "24px" }}>🧍</div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#000",
                    background: "#fff",
                    borderRadius: "4px",
                    padding: "2px 4px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }}
                >
                  You
                </div>
              </div>
            </Marker>
          )}

          {pins.map((pin, index) => (
            <Marker
              key={index}
              latitude={pin.latitude}
              longitude={pin.longitude}
              anchor="bottom"
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPin(index);
                  setSelectedDistance(null);
                  setRouteGeoJson(null);

                  if (userLocation) {
                    directionsClient
                      .getDirections({
                        profile: "walking",
                        geometries: "geojson",
                        waypoints: [
                          {
                            coordinates: [
                              userLocation.longitude,
                              userLocation.latitude,
                            ],
                          },
                          { coordinates: [pin.longitude, pin.latitude] },
                        ],
                      })
                      .send()
                      .then((res) => {
                        const distance = res.body.routes[0].distance;
                        const geometry = res.body.routes[0].geometry;
                        setSelectedDistance(distance);
                        setRouteGeoJson({
                          type: "Feature",
                          geometry: geometry,
                          properties: {},
                        });
                      })
                      .catch((err) => console.error("Route error:", err));
                  }
                }}
                style={{ fontSize: "24px", cursor: "pointer" }}
              >
                📍
              </div>
            </Marker>
          ))}

          {selectedPin !== null && renderPopup(pins[selectedPin])}

          {/* Main mask (shows the allowed area) */}
          <Source id="mask" type="geojson" data={maskGeoJson}>
            <Layer
              id="mask-layer"
              type="fill"
              paint={{
                "fill-color": "#000000",
                "fill-opacity": 0.3,
              }}
            />
          </Source>

          {/* Inverse mask (darkens/blurs outside area) */}
          {inverseMaskGeoJson && (
            <Source id="inverse-mask" type="geojson" data={inverseMaskGeoJson}>
              <Layer
                id="inverse-mask-layer"
                type="fill"
                paint={{
                  "fill-color": "#000",
                  "fill-opacity": 0.7,
                  "fill-outline-color": "transparent",
                }}
              />
            </Source>
          )}

          {routeGeoJson && (
            <Source id="route" type="geojson" data={routeGeoJson}>
              <Layer
                id="route-layer"
                type="line"
                paint={{
                  "line-color": "#ff0000",
                  "line-width": 4,
                }}
              />
            </Source>
          )}
        </Map>

        {/* Overlay message when outside */}
        {!isInsideMask && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "1rem",
              borderRadius: "8px",
              textAlign: "center",
              zIndex: 1,
              pointerEvents: "none",
            }}
          >
            <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
              You must be inside Intramuros to interact
            </p>
            <p>Current status: Outside boundary</p>
          </div>
        )}
      </div>

      {/* Feedback Button */}
      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={handleFeedbackClick}
          disabled={!isInsideMask}
          style={{
            backgroundColor: isInsideMask ? "#28a745" : "#ccc",
            color: isInsideMask ? "white" : "#666",
            padding: "10px 20px",
            fontSize: "16px",
            border: "none",
            borderRadius: "6px",
            cursor: isInsideMask ? "pointer" : "not-allowed",
          }}
        >
          📝 Give Feedback
        </button>
        <p
          style={{
            marginTop: "0.5rem",
            color: isInsideMask ? "green" : "gray",
          }}
        >
          {isInsideMask
            ? "📍 You are inside the boundary."
            : "🔒 You must be inside Intramuros to send feedback."}
        </p>
      </div>

      {/* Admin Map */}
      <h2 style={{ marginTop: "2rem" }}>Admin Map (Draggable Mask)</h2>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={enableMaskEditing}>🧲 Enable Draggable Mask</button>
        <button onClick={saveMask} style={{ marginLeft: "1rem" }}>
          💾 Save Mask
        </button>
      </div>

      <Map
        ref={adminMapRef}
        initialViewState={{ ...viewState, minZoom: 15.5, maxZoom: 18 }}
        maxBounds={INTRAMUROS_BOUNDS}
        mapboxAccessToken={MAPBOX_TOKEN}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        style={{ width: "100%", height: "500px" }}
      >
        {pins.map((pin, index) => (
          <Marker
            key={index}
            latitude={pin.latitude}
            longitude={pin.longitude}
            anchor="bottom"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                textAlign: "center",
                transform: "translateY(-30px)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  color: "black",
                  fontSize: "12px",
                  background: "#fff",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  marginBottom: "4px",
                }}
              >
                📍 {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
              </div>
              <div style={{ fontSize: "24px", color: "blue" }}>🛠️</div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
