import React, { useEffect, useState } from "react";
import TouristItineraryMain from "./TouristItineraryMain";
import MainLayout from "../MainLayout";
import BackHeader from "../BackButton";
import PullToRefresh from "../../shared/PullToRefresh";
import axios from "axios";
import ModernLoader from "../../shared/ModernLoader";

export default function TouristItinerary() {
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [prefetchedItineraries, setPrefetchedItineraries] = useState({
    admin: [],
    user: [],
  });

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  // Helper to resolve full image URL (mirrors TouristItineraryMain)
  const getFullImageUrl = (url) => {
    if (!url || url.trim() === "") return null;
    if (url.startsWith("http")) return url;
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${
      import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
      "http://localhost:5000"
    }${path}`;
  };

  // One-time preload with skip-once behavior, including data/images
  useEffect(() => {
    let mounted = true;
    let progressLocked = false;

    const updateProgress = (value) => {
      if (!progressLocked && mounted) {
        setLoadingProgress((prev) => Math.max(prev, value));
      }
    };

    const runPreload = async () => {
      try {
        // Use a new key to ensure a single preload run applies the improved logic
        const already =
          localStorage.getItem("tourist_itinerary_preloaded_v2") === "true";
        if (already) {
          // Try to hydrate from cached itineraries for instant render
          try {
            const cached = localStorage.getItem("tourist_itineraries_cache");
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed && (parsed.admin?.length || parsed.user?.length)) {
                setPrefetchedItineraries(parsed);
              }
            }
          } catch {}

          setComponentsLoaded(true);
          setLoadingProgress(100);
          progressLocked = true;
          return;
        }
        // Step 1: Initial bump
        updateProgress(20);

        // Step 2: Fetch itineraries list
        const token = localStorage.getItem("token");
        const apiBase =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
        let adminItineraries = [];
        let userItineraries = [];

        if (token) {
          try {
            const res = await axios.get(`${apiBase}/itineraries`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const allItineraries = res.data || [];
            adminItineraries = allItineraries.filter((i) => i.isAdminCreated);
            userItineraries = allItineraries.filter((i) => !i.isAdminCreated);
          } catch (e) {
            adminItineraries = [];
            userItineraries = [];
          }
        }

        updateProgress(50);

        // Step 3: Compute completion status for each itinerary
        const computeStatuses = async (list) => {
          if (!token) return list;
          const headers = { Authorization: `Bearer ${token}` };
          const results = await Promise.all(
            list.map(async (it) => {
              try {
                const progressRes = await axios.get(
                  `${apiBase}/itinerary-progress/${it._id}`,
                  { headers }
                );
                const visitedCount = (progressRes.data?.visitedSites || [])
                  .length;
                const activeSitesCount = (it.sites || []).filter(
                  (s) => s.status === "active"
                ).length;
                const isCompleted =
                  activeSitesCount > 0 && visitedCount >= activeSitesCount;
                return { ...it, isCompleted };
              } catch {
                return { ...it, isCompleted: false };
              }
            })
          );
          return results;
        };

        const adminWithStatus = await computeStatuses(adminItineraries);
        const userWithStatus = await computeStatuses(userItineraries);

        updateProgress(70);

        // Step 4: Preload card images for better first paint
        const imageUrls = [...adminWithStatus, ...userWithStatus]
          .map((it) => getFullImageUrl(it.imageUrl))
          .filter(Boolean);

        await Promise.all(
          imageUrls.map(
            (src) =>
              new Promise((resolve) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = resolve;
                img.src = src;
                setTimeout(resolve, 1500);
              })
          )
        );

        updateProgress(95);

        // Step 5: Finalize and store
        if (!mounted) return;
        setPrefetchedItineraries({
          admin: adminWithStatus,
          user: userWithStatus,
        });
        try {
          localStorage.setItem(
            "tourist_itineraries_cache",
            JSON.stringify({
              admin: adminWithStatus,
              user: userWithStatus,
              ts: Date.now(),
            })
          );
        } catch {}
        updateProgress(100);
        progressLocked = true;
        await new Promise((r) => setTimeout(r, 150));
        if (!mounted) return;
        setComponentsLoaded(true);
        localStorage.setItem("tourist_itinerary_preloaded_v2", "true");
      } catch {
        setComponentsLoaded(true);
        localStorage.setItem("tourist_itinerary_preloaded_v2", "true");
      }
    };

    runPreload();
    return () => {
      mounted = false;
      progressLocked = true;
    };
  }, []);

  const handleRefresh = async () => {
    // Trigger refresh by updating key
    setRefreshKey((prev) => prev + 1);
    // Wait a bit to simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  if (!componentsLoaded) {
    return <ModernLoader progress={loadingProgress} />;
  }

  return (
    <div
      className="min-h-screen bg-orange-600 via-[#f04e37] flex flex-col relative"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        height: "100dvh",
        overflow: "hidden",
        overscrollBehavior: "none",
        touchAction: "pan-y",
      }}
    >
      {!modalOpen && (
        <BackHeader
          title={<span className="text-white">Available Itineraries</span>}
          className="text-white"
        />
      )}

      {/* Main Content */}
      <MainLayout includeSideButtons={false}>
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="flex flex-col items-center justify-center pt-6 px-4 md:px-0">
            <div className="flex-1 max-w-6xl w-full flex flex-col gap-4">
              <TouristItineraryMain onModalStateChange={setModalOpen}
                key={refreshKey}
                initialItineraries={prefetchedItineraries}
              />
            </div>
          </div>
        </PullToRefresh>
      </MainLayout>
    </div>
  );
}
