// components/userComponents/MapLayers.jsx
import React from "react";
import { Source, Layer } from "react-map-gl";

const MapLayers = ({ mask, inverseMask, route }) => {
  return (
    <>
      {/* Mask */}
      {mask && (
        <Source type="geojson" data={mask}>
          <Layer
            id="mask-fill"
            type="fill"
            paint={{ "fill-color": "#000", "fill-opacity": 0 }}
          />
        </Source>
      )}

      {/* Inverse Mask */}
      {inverseMask && (
        <Source type="geojson" data={inverseMask}>
          <Layer
            id="inverse-mask-fill"
            type="fill"
            paint={{ "fill-color": "#000", "fill-opacity": 0.7 }}
          />
        </Source>
      )}

      {/* Route */}
      {route && (
        <Source type="geojson" data={route}>
          <Layer
            id="route-line"
            type="line"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": "#3b9ddd",
              "line-width": 4,
              "line-opacity": 0.8,
            }}
          />
        </Source>
      )}
    </>
  );
};

export default MapLayers;
