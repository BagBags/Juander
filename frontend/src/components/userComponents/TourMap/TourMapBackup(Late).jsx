import React, { useState, useEffect } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  directionsClient,
  initialMaskFeature,
  createInverseMask,
} from "./mapConfig";
import * as THREE from "three";

import "../../../App.css";

function BouncingMarker() {
  return (
    <svg
      className="bouncing-marker"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="36"
      height="36"
      fill="none"
      stroke="#e03e2f"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21C12 21 5 13.5 5 8.5a7 7 0 0 1 14 0c0 5-7 12.5-7 12.5z" />
      <circle cx="12" cy="8.5" r="2.5" />
    </svg>
  );
}

export default function UserMap() {
  const [viewState, setViewState] = useState({
    latitude: 14.5896,
    longitude: 120.9747,
    zoom: 16,
  });
  const [maskGeoJson, setMaskGeoJson] = useState(initialMaskFeature);
  const [inverseMaskGeoJson, setInverseMaskGeoJson] = useState(null);
  const [pins] = useState([
    {
      latitude: 14.5896,
      longitude: 120.9747,
      title: "Welcome to Intramuros!",
      description:
        "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus.",
      mediaType: "image",
      mediaUrl:
        "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_960_720.jpg",
      reviews: [
        {
          name: "George Olsen",
          date: "July 25",
          review: "Sample review from user who visited the tour mode site.",
          stars: 5,
          img: "https://via.placeholder.com/40",
        },
        {
          name: "Ares Bautista",
          date: "July 25",
          review: "Had a great time here, such educational and fun site walk.",
          stars: 4,
          img: "https://via.placeholder.com/40",
        },
        {
          name: "Martin Gonzales",
          date: "July 25",
          review: "Love the AR mode, such an informative learning walk.",
          stars: 5,
          img: "https://via.placeholder.com/40",
        },
      ],
    },
  ]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [isInsideMask, setIsInsideMask] = useState(false);

  useEffect(() => {
    setInverseMaskGeoJson(createInverseMask(maskGeoJson));
  }, [maskGeoJson]);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ latitude, longitude });
        setViewState((prev) => ({ ...prev, latitude, longitude }));

        const inside = booleanPointInPolygon(
          point([longitude, latitude]),
          maskGeoJson
        );
        setIsInsideMask(inside);
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [maskGeoJson]);

  const renderSiteCard = (pin) => (
    <div className="absolute top-1/2 left-1/2 z-50 w-[320px] -translate-x-1/2 -translate-y-1/2">
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg p-4 font-sans">
        {/* Close Button */}
        <button
          onClick={() => {
            setSelectedPin(null);
            setSelectedDistance(null);
            setRouteGeoJson(null);
          }}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {/* Info Box */}
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col">
            <p className="text-sm leading-snug text-gray-700 mb-3">
              {pin.description}
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 text-sm font-medium rounded-lg shadow-sm w-fit">
              View in AR Mode
            </button>
          </div>
          <div className="flex-shrink-0">
            {pin.mediaType === "image" ? (
              <img
                src={pin.mediaUrl}
                alt="media"
                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <video
                src={pin.mediaUrl}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                muted
              />
            )}
          </div>
        </div>

        {/* Distance */}
        {selectedDistance !== null && (
          <div className="bg-gray-50 text-xs px-3 py-2 mt-3 rounded-md shadow-sm border border-gray-200">
            🛣️ Distance: {(selectedDistance / 1000).toFixed(2)} km
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-xl overflow-hidden shadow-lg mt-3 border border-gray-200">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-white font-semibold text-center text-sm tracking-wide">
            Reviews
          </div>
          <div className="max-h-[160px] overflow-y-auto px-4 py-3 space-y-3">
            {pin.reviews.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <img
                  src={r.img}
                  alt={r.name}
                  className="w-10 h-10 rounded-full border border-gray-300"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm">{r.name}</strong>
                    <span className="text-xs text-gray-500">{r.date}</span>
                  </div>
                  <div className="text-yellow-400 text-xs">
                    {"★".repeat(r.stars)}
                    {"☆".repeat(5 - r.stars)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{r.review}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen">
      <Map
        initialViewState={{ ...viewState, minZoom: 15.5 }}
        maxBounds={INTRAMUROS_BOUNDS}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        className="w-full h-full"
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
            🧍
          </Marker>
        )}

        {pins.map((pin, index) => (
          <Marker
            key={index}
            latitude={pin.latitude}
            longitude={pin.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedPin(index);
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
                    setSelectedDistance(distance);
                    setRouteGeoJson({
                      type: "Feature",
                      geometry: res.body.routes[0].geometry,
                      properties: {},
                    });
                  });
              }
            }}
          >
            <BouncingMarker />
          </Marker>
        ))}

        {selectedPin !== null && renderSiteCard(pins[selectedPin])}

        {/* Mask Layers */}
        <Source id="mask" type="geojson" data={maskGeoJson}>
          <Layer
            id="mask-layer"
            type="fill"
            paint={{ "fill-color": "#000", "fill-opacity": 0.3 }}
          />
        </Source>

        {inverseMaskGeoJson && (
          <Source id="inverse-mask" type="geojson" data={inverseMaskGeoJson}>
            <Layer
              id="inverse-mask-layer"
              type="fill"
              paint={{ "fill-color": "#000", "fill-opacity": 0.7 }}
            />
          </Source>
        )}

        {routeGeoJson && (
          <Source id="route" type="geojson" data={routeGeoJson}>
            <Layer
              id="route-layer"
              type="line"
              paint={{ "line-color": "#ff0000", "line-width": 4 }}
            />
          </Source>
        )}
      </Map>

      {/* Go To Next Site button outside popup */}
      {selectedPin !== null && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
          <button className="bg-blue-700 text-white px-5 py-2 rounded-md cursor-pointer shadow-lg">
            Go to next site
          </button>
        </div>
      )}

      {/* Tour Map Footer fixed */}
      <div className="absolute bottom-0 w-full bg-orange-600 text-white text-center py-2 font-bold z-50">
        Tour Map
      </div>
    </div>
  );
}
