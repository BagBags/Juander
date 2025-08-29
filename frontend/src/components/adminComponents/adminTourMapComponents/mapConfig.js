import mbxDirections from "@mapbox/mapbox-sdk/services/directions";
import { polygon } from "@turf/helpers";

export const MAPBOX_TOKEN =
  "pk.eyJ1IjoiY2hhcmxlczI5ZyIsImEiOiJjbWNrYWVzYmUwYzY4MmpweGcwZDN0c25iIn0.JJ7mcLEqZchHFAV5XY776A";

export const directionsClient = mbxDirections({ accessToken: MAPBOX_TOKEN });

export const INTRAMUROS_BOUNDS = [
  [120.968, 14.5833], // southwest (slightly left)
  [120.982, 14.5985], // northeast (slightly higher & right)
];

export const initialMaskFeature = {
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

// export const createInverseMask = (mask) => {
//   return polygon([
//     [
//       [120.969, 14.5833],
//       [120.9802, 14.5833],
//       [120.9802, 14.5966],
//       [120.969, 14.5966],
//       [120.969, 14.5833],
//     ],
//     mask.geometry.coordinates[0],
//   ]);
// };
