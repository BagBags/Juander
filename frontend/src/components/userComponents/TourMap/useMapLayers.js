import { useEffect } from "react";
import {
  Camera,
  Scene,
  DirectionalLight,
  AmbientLight,
  WebGLRenderer,
  Matrix4,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import mapboxgl from "mapbox-gl";

export default function useMapLayers(mapRef, pins, selectedPin) {
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !pins?.length) return;

    const loader = new GLTFLoader();
    const modelCache = {};

    const loadModel = (url) =>
      new Promise((resolve, reject) => {
        if (modelCache[url]) return resolve(modelCache[url].clone());
        loader.load(
          url,
          (gltf) => {
            modelCache[url] = gltf.scene;
            resolve(gltf.scene.clone());
          },
          undefined,
          reject
        );
      });

    const add3DPins = async () => {
      const layerIds = [];
      for (const pin of pins) {
        const layerId = `pin-3d-${pin._id}`;
        if (map.getLayer(layerId)) continue;

        const modelUrl =
          selectedPin && selectedPin._id === pin._id
            ? "/3DModels/Pin2.glb"
            : "/3DModels/Pin1.glb";

        let modelScene;
        try {
          modelScene = await loadModel(modelUrl);
        } catch {
          continue;
        }

        const merc = mapboxgl.MercatorCoordinate.fromLngLat(
          [pin.longitude, pin.latitude],
          0
        );

        const meterScale = merc.meterInMercatorCoordinateUnits();
        const scale = meterScale * 30; // 30m tall
        modelScene.scale.set(scale, scale, scale);

        modelScene.position.set(merc.x, merc.y, merc.z);
        modelScene.rotation.set(Math.PI / 2, 0, 0);

        const customLayer = {
          id: layerId,
          type: "custom",
          renderingMode: "3d",
          onAdd: function (map, gl) {
            this.camera = new Camera();
            this.scene = new Scene();
            this.map = map;

            // Lights
            const dirLight = new DirectionalLight(0xffffff, 0.8);
            dirLight.position.set(0, 70, 100).normalize();
            this.scene.add(dirLight);
            this.scene.add(new AmbientLight(0xffffff, 0.6));
            this.scene.add(modelScene);

            // Prefer WebGL2 if available
            const canvas = map.getCanvas();
            this.renderer = new WebGLRenderer({
              canvas,
              context: gl,
              antialias: true,
            });
            try {
              this.renderer.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, 2)
              );
            } catch {
              null;
            }

            this.renderer.autoClear = false;
            try {
              /* rely on gl.isContextLost() checks in render */
            } catch {
              null;
            }
            try {
              const canvas = map.getCanvas();
              const onLost = (evt) => {
                try {
                  if (evt && typeof evt.preventDefault === "function") {
                    evt.preventDefault();
                  }
                } catch {
                  null;
                }
                try {
                  this.renderer = null;
                } catch {
                  null;
                }
                try {
                  this.map &&
                    this.map.setLayoutProperty(layerId, "visibility", "none");
                } catch {
                  null;
                }
              };
              const onRestored = () => {
                try {
                  this.map &&
                    this.map.setLayoutProperty(
                      layerId,
                      "visibility",
                      "visible"
                    );
                  this.map &&
                    this.map.triggerRepaint &&
                    this.map.triggerRepaint();
                } catch {
                  null;
                }
              };
              canvas.addEventListener("webglcontextlost", onLost, false);
              canvas.addEventListener(
                "webglcontextrestored",
                onRestored,
                false
              );
              this._onCtxLost = onLost;
              this._onCtxRestored = onRestored;
            } catch {
              null;
            }
          },
          onRemove: function (map) {
            try {
              const canvas = map.getCanvas();
              if (this._onCtxLost)
                canvas.removeEventListener(
                  "webglcontextlost",
                  this._onCtxLost,
                  false
                );
              if (this._onCtxRestored)
                canvas.removeEventListener(
                  "webglcontextrestored",
                  this._onCtxRestored,
                  false
                );
            } catch {
              null;
            }
            try {
              this.renderer = null;
            } catch {
              null;
            }
          },

          render: function (gl, matrix) {
            if (gl && gl.isContextLost && gl.isContextLost()) {
              try {
                this.renderer = null;
              } catch {
                null;
              }
              return;
            }
            if (!this.renderer && gl) {
              try {
                const canvas = gl.canvas || this.map?.getCanvas?.();
                this.renderer = new WebGLRenderer({
                  canvas,
                  context: gl,
                  antialias: true,
                });
                this.renderer.autoClear = false;
                try {
                  this.map &&
                    this.map.setLayoutProperty(
                      layerId,
                      "visibility",
                      "visible"
                    );
                } catch {
                  null;
                }
              } catch {
                null;
              }
            }
            const m = new Matrix4().fromArray(matrix);
            this.camera.projectionMatrix = m;
            this.renderer.resetState();
            try {
              // Prevent previous 3D pass from occluding base map tiles
              this.renderer.clearDepth();
              if (gl && typeof gl.clear === "function" && gl.DEPTH_BUFFER_BIT) {
                gl.clear(gl.DEPTH_BUFFER_BIT);
              }
            } catch {
              null;
            }
            this.renderer.render(this.scene, this.camera);
            map.triggerRepaint();
          },
        };

        map.addLayer(customLayer);
        layerIds.push(layerId);
      }

      // Invisible click layer
      const geojson = {
        type: "FeatureCollection",
        features: pins.map((pin) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [pin.longitude, pin.latitude],
          },
          properties: { id: pin._id },
        })),
      };

      if (map.getSource("pins-click")) {
        map.getSource("pins-click").setData(geojson);
      } else {
        map.addSource("pins-click", { type: "geojson", data: geojson });
        map.addLayer({
          id: "pins-click-layer",
          type: "circle",
          source: "pins-click",
          paint: { "circle-radius": 20, "circle-opacity": 0 },
        });
      }

      const hide3D = () => {
        try {
          layerIds.forEach((id) => {
            if (map.getLayer(id))
              map.setLayoutProperty(id, "visibility", "none");
          });
          map && map.triggerRepaint && map.triggerRepaint();
        } catch {
          null;
        }
      };
      const show3D = () => {
        try {
          layerIds.forEach((id) => {
            if (map.getLayer(id))
              map.setLayoutProperty(id, "visibility", "visible");
          });
          map && map.triggerRepaint && map.triggerRepaint();
        } catch {
          null;
        }
      };
      const onZoomStart = () => hide3D();
      const onZoomEnd = () => show3D();
      const onMoveStart = () => {
        try {
          if (map.isZooming() || map.isRotating() || map.isMoving()) hide3D();
        } catch {
          null;
        }
      };
      const onMoveEnd = () => show3D();
      map.on("zoomstart", onZoomStart);
      map.on("zoomend", onZoomEnd);
      map.on("movestart", onMoveStart);
      map.on("moveend", onMoveEnd);

      return () => {
        map.off("zoomstart", onZoomStart);
        map.off("zoomend", onZoomEnd);
        map.off("movestart", onMoveStart);
        map.off("moveend", onMoveEnd);
      };
    };

    let detachHandlers = null;
    if (map.isStyleLoaded()) {
      add3DPins()
        .then((d) => {
          detachHandlers = d;
        })
        .catch(() => {
          null;
        });
    } else {
      map.once("style.load", () => {
        add3DPins()
          .then((d) => {
            detachHandlers = d;
          })
          .catch(() => {
            null;
          });
      });
    }

    return () => {
      try {
        if (detachHandlers) detachHandlers();
      } catch {
        null;
      }
      pins.forEach((pin) => {
        const layerId = `pin-3d-${pin._id}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      if (map.getLayer("pins-click-layer")) map.removeLayer("pins-click-layer");
      if (map.getSource("pins-click")) map.removeSource("pins-click");
    };
  }, [mapRef, pins, selectedPin]);
}
