// components/userComponents/useUserLocation.js
import { useState, useEffect } from "react";

export const useUserLocation = (setViewState) => {
  const [userLocation, setUserLocation] = useState(null);

  // ------------------ User location ------------------
  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setUserLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setViewState((v) => ({
          ...v,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [setViewState]);

  return userLocation;
};
