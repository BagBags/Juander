import { useEffect } from "react";
import * as THREE from "three";
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
          0 // altitude in meters
        );

        // Convert to real-world meter scale
        const meterScale = merc.meterInMercatorCoordinateUnits();
        const scale = meterScale * 30; // adjust (30m tall)
        modelScene.scale.set(scale, scale, scale);

        // Position model
    // Position model
modelScene.position.set(merc.x, merc.y, merc.z);

// Reset rotation and properly orient for Mapbox (Z-up)
modelScene.rotation.set(0, 0, 0);
modelScene.rotation.x = Math.PI / 2; // Rotate -90° around X-axis

// If your model is facing the wrong direction, you might also need:
// modelScene.rotation.z = Math.PI; // 180° around Z-axis if facing wrong way

        const customLayer = {
          id: layerId,
          type: "custom",
          renderingMode: "3d",
          onAdd: function (map, gl) {
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();

            // Lights
            const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
            dirLight.position.set(0, 70, 100).normalize();
            this.scene.add(dirLight);
            this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

            this.scene.add(modelScene);

            this.renderer = new THREE.WebGLRenderer({
              canvas: map.getCanvas(),
              context: gl,
              antialias: true,
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

      // 🔹 Add invisible click layer (GeoJSON with all pin points)
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
          paint: {
            "circle-radius": 20, // bigger hitbox
            "circle-opacity": 0, // invisible
          },
        });
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
  }, [mapRef, pins, selectedPin]);
}
