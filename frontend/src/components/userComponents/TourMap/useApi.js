// components/userComponents/useApi.js
import { useState, useEffect } from "react";
import { createInverseMask } from "./mapConfig";

export const useApi = (api) => {
  const [mask, setMask] = useState(null);
  const [inverseMask, setInverseMask] = useState(null);
  const [pins, setPins] = useState([]);
  const BACKEND_URL = "http://localhost:5000";

  // ------------------ Fetch mask ------------------
  useEffect(() => {
    const fetchMask = async () => {
      try {
        const { data } = await api.get("/mask");
        if (!data?.geometry) return;
        const feature = {
          type: "Feature",
          properties: {},
          geometry: data.geometry,
        };
        setMask(feature);
        setInverseMask(createInverseMask(feature));
      } catch (err) {
        console.error("❌ Error fetching mask:", err);
      }
    };
    fetchMask();
  }, [api]);

  // ------------------ Fetch pins ------------------
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const { data } = await api.get("/pins");
        const raw = Array.isArray(data) ? data : data?.pins || [];
        const normalized = raw.map((p) => ({
          _id: p._id,
          latitude: p.latitude,
          longitude: p.longitude,
          title: p.siteName || "Site",
          description: p.siteDescription || "",
          mediaType: p.mediaType || "image",
          mediaUrl: p.mediaUrl || "",
          glbUrl: p.glbUrl
            ? `${BACKEND_URL}${p.glbUrl.startsWith("/") ? "" : "/"}${p.glbUrl}`
            : null,
          arEnabled: p.arEnabled === true,
          arLink: p.arLink || "",
          status: p.status || "active",
        }));

        setPins(normalized);
      } catch (err) {
        console.error("❌ Error fetching pins:", err);
      }
    };
    fetchPins();
  }, [api]);

  return { mask, inverseMask, pins };
};
