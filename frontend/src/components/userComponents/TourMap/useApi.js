// components/userComponents/useApi.js
import { useState, useEffect } from "react";
import { createInverseMask } from "./mapConfig";

export const useApi = (api) => {
  const [mask, setMask] = useState(null);
  const [inverseMask, setInverseMask] = useState(null);
  const [pins, setPins] = useState([]);
  const BACKEND_URL = "http://localhost:5000";

  // ✅ Utility to resolve relative URLs into absolute URLs
  const resolveUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http")
      ? url
      : `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

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
          mediaUrl: resolveUrl(p.mediaUrl), // ✅ fixed
          mediaFiles: p.mediaFiles?.map((media) => ({
            url: resolveUrl(media.url),
            type: media.type,
          })) || [], // ✅ added mediaFiles array
          facadeUrl: resolveUrl(p.facadeUrl), // ✅ added
          glbUrl: resolveUrl(p.glbUrl), // ✅ fixed
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
