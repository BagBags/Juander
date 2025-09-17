import { useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import mapboxgl from "mapbox-gl";

export default function useMapLayers(mapRef, pins, selectedPin, onPinClick) {
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
      for (const pin of pins) {
        const layerId = `pin-3d-${pin._id}`;
        if (map.getLayer(layerId)) continue;

        const modelUrl =
          selectedPin && selectedPin._id === pin._id
            ? "/3DModels/Pin2.glb"
            : "/3DModels/Pin1.glb";

        const modelScene = await loadModel(modelUrl);

        const merc = mapboxgl.MercatorCoordinate.fromLngLat(
          [pin.longitude, pin.latitude],
          0
        );

        const meterScale = merc.meterInMercatorCoordinateUnits();
        const scale = meterScale * 30;
        modelScene.scale.set(scale, scale, scale);
        modelScene.position.set(merc.x, merc.y, merc.z);
        modelScene.rotation.set(Math.PI / 2, 0, 0);

        const customLayer = {
          id: layerId,
          type: "custom",
          renderingMode: "3d",
          onAdd: function (map, gl) {
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();

            this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
            this.scene.add(modelScene);

            this.renderer = new THREE.WebGLRenderer({
              canvas: map.getCanvas(),
              context: gl,
              antialias: true,
              alpha: true,
            });

            this.renderer.autoClear = false;
          },
          render: function (gl, matrix) {
            const m = new THREE.Matrix4().fromArray(matrix);
            this.camera.projectionMatrix = m;
            this.renderer.resetState();
            this.renderer.render(this.scene, this.camera);
            map.triggerRepaint();
          },
        };

        map.addLayer(customLayer);
      }

      // 🔹 Invisible click layer
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

      if (!map.getSource("pins-click")) {
        map.addSource("pins-click", { type: "geojson", data: geojson });

        map.addLayer({
          id: "pins-click-layer",
          type: "circle",
          source: "pins-click",
          paint: { "circle-radius": 20, "circle-opacity": 0 },
        });
      } else {
        map.getSource("pins-click").setData(geojson);
      }

      // 🔹 Click handler
      if (!map.__pinClickHandlerAdded) {
        map.on("click", "pins-click-layer", (e) => {
          if (!e.features?.length) return;
          const clickedId = e.features[0].properties.id;
          const clickedPin = pins.find((p) => p._id === clickedId);
          if (clickedPin && onPinClick) onPinClick(clickedPin);
        });

        map.on("mouseenter", "pins-click-layer", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "pins-click-layer", () => {
          map.getCanvas().style.cursor = "";
        });

        map.__pinClickHandlerAdded = true;
      }
    };

    if (map.isStyleLoaded()) {
      add3DPins();
    } else {
      map.once("style.load", add3DPins);
    }

    return () => {
      pins.forEach((pin) => {
        const layerId = `pin-3d-${pin._id}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      if (map.getLayer("pins-click-layer")) map.removeLayer("pins-click-layer");
      if (map.getSource("pins-click")) map.removeSource("pins-click");
    };
  }, [mapRef, pins, selectedPin, onPinClick]);
}
