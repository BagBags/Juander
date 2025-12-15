import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Filter } from "bad-words";
import {
  Edit,
  Trash2,
  Plus,
  Check,
  Upload,
  Archive,
  RotateCcw,
  X,
  Clock,
  Info,
  MapPin,
  Tag,
  GripVertical,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ConfirmModal from "../../shared/ConfirmModal";
import NotificationModal from "../../shared/NotificationModal";

// ---------- Profanity Filter Utilities ----------
const TAGALOG_BAD_WORDS = (() => {
  const base = [
    "putangina",
    "putang ina",
    "putang-ina",
    "puta",
    "puta ka",
    "putragis",
    "putaragis",
    "pakshet",
    "pakshit",
    "pakyu",
    "fakyu",
    "kantot",
    "kantutan",
    "hindot",
    "hindutan",
    "titi",
    "burat",
    "puke",
    "puki",
    "pekpek",
    "pepe",
    "kiki",
    "kupal",
    "gago",
    "gaga",
    "tanga",
    "bobo",
    "ulol",
    "tarantado",
    "bwisit",
    "leche",
    "lintik",
    "punyeta",
    "pucha",
    "animal",
    "hayop",
    "ogag",
    "buraot",
    "syet",
    "shit",
    "bitch",
    "fuck",
    "asshole",
  ];
  const extra = [
    "amputa",
    "animal ka",
    "bilat",
    "binibrocha",
    "bogo",
    "boto",
    "brocha",
    "bwesit",
    "demonyo ka",
    "engot",
    "etits",
    "gagi",
    "habal",
    "hayop ka",
    "hayup",
    "hinampak",
    "hinayupak",
    "hudas",
    "iniyot",
    "inutel",
    "inutil",
    "iyot",
    "kagaguhan",
    "kagang",
    "kantotan",
    "kantut",
    "kaululan",
    "kayat",
    "kikinginamo",
    "kingina",
    "leching",
    "lechugas",
    "nakakaburat",
    "nimal",
    "olok",
    "pakingshet",
    "pesteng yawa",
    "poke",
    "poki",
    "pokpok",
    "poyet",
    "pu'keng",
    "puchanggala",
    "puchangina",
    "pukinangina",
    "puking",
    "ratbu",
    "shunga",
    "sira ulo",
    "siraulo",
    "suso",
    "susu",
    "tae",
    "taena",
    "tamod",
    "tangina",
    "taragis",
    "tete",
    "teti",
    "timang",
    "tinil",
    "tite",
    "tungaw",
    "ulul",
    "ungas",
  ];
  return Array.from(new Set([...base, ...extra].map((s) => s.toLowerCase())));
})();

const profanityFilter = (() => {
  const f = new Filter();
  try {
    f.addWords(...TAGALOG_BAD_WORDS);
  } catch {}
  return f;
})();

const normalizeProfanity = (s = "") => {
  const map = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", $: "s", "!": "i" };
  const lowered = String(s).toLowerCase();
  const leetFixed = lowered
    .split("")
    .map((c) => (map[c] ? map[c] : c))
    .join("");
  return leetFixed.replace(/[\s\-_.]+/g, "");
};

const isProfaneText = (s = "") => {
  const normalized = normalizeProfanity(s);
  if (profanityFilter.isProfane(normalized)) return true;
  for (const w of TAGALOG_BAD_WORDS) {
    const wn = normalizeProfanity(w);
    if (normalized.includes(wn)) return true;
  }
  return false;
};
// ------------------------------------------------

export default function AdminItineraryMain() {
  const [pins, setPins] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(""); // Duration in hours
  const [imageFile, setImageFile] = useState(null); // <-- File state
  const [imagePreview, setImagePreview] = useState(""); // <-- Preview URL
  const [imageUrl, setImageUrl] = useState(""); // <-- Store the actual image URL for deletion
  const [itineraries, setItineraries] = useState([]);
  const [archivedItineraries, setArchivedItineraries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); // "active" or "archived"
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItinerary, setDetailsItinerary] = useState(null);
  const [showSiteDetailsModal, setShowSiteDetailsModal] = useState(false);
  const [detailsSelectedSite, setDetailsSelectedSite] = useState(null);
  const [siteDetailsAllowAdd, setSiteDetailsAllowAdd] = useState(true);
  const [rHour, setRHour] = useState("7");
  const [rMinute, setRMinute] = useState("00");
  const [rPeriod, setRPeriod] = useState("AM");
  const [autoDurationEnabled, setAutoDurationEnabled] = useState(true);
  const computedTotals = useMemo(() => {
    const baseMinutes = selectedSites.reduce((sum, s) => {
      const v =
        typeof s?.averageTimeSpent === "number"
          ? s.averageTimeSpent
          : Number(s?.averageTimeSpent);
      return sum + (isNaN(v) || v <= 0 ? 0 : v);
    }, 0);
    const breakMinutes = breaks.reduce(
      (sum, b) => sum + (Number(b.minutes) > 0 ? Number(b.minutes) : 0),
      0
    );
    const spacingMinutes = Math.max(selectedSites.length - 1, 0) * 10;
    const totalMinutes = baseMinutes + breakMinutes + spacingMinutes;
    const hours = Math.round((totalMinutes / 60) * 2) / 2;
    return { totalMinutes, hours };
  }, [selectedSites, breaks]);
  useEffect(() => {
    if (autoDurationEnabled) {
      if (computedTotals.hours > 0) {
        const clamped = Math.max(1, Math.min(12, computedTotals.hours));
        setDuration(String(clamped));
        if (errors.duration) {
          setErrors({ ...errors, duration: "" });
        }
      } else if (selectedSites.length > 0) {
        setDuration("");
      }
    }
  }, [computedTotals, autoDurationEnabled]);

  // Validation errors
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    duration: "",
    image: "",
    sites: "",
    recommendedStartTime: "",
  });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
  });

  // Notification modal state
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const ICON_SIZE = 20;
  const COVER_IMAGE_HEIGHT = 192;
  const formatMinutesToClock = (min) => {
    if (min === undefined || min === null) return "";
    const h = Math.floor(min / 60);
    const m = min % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = h % 12 || 12;
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm} ${ampm}`;
  };
  const formatClockRange = (startMin, endMin) => {
    const sh = Math.floor(startMin / 60);
    const sm = startMin % 60;
    const eh = Math.floor(endMin / 60);
    const em = endMin % 60;
    const sp = sh >= 12 ? "PM" : "AM";
    const ep = eh >= 12 ? "PM" : "AM";
    const shh = sh % 12 || 12;
    const ehh = eh % 12 || 12;
    const smm = String(sm).padStart(2, "0");
    const emm = String(em).padStart(2, "0");
    if (sp === ep) return `${shh}:${smm}–${ehh}:${emm} ${ep}`;
    return `${shh}:${smm} ${sp} – ${ehh}:${emm} ${ep}`;
  };

  const resolveUrl = (url) => {
    if (!url || url.trim() === "") return null;
    if (url.startsWith("http")) return url;
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${
      import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
      "http://localhost:5000"
    }${path}`;
  };

  const roundToStep = (min, step = 5) => Math.round(min / step) * step;

  const selectsToMinutes = (hour, minute, period) => {
    if (!hour && hour !== 0) return null;
    const h12 = Number(hour);
    const m = Number(minute);
    if (isNaN(h12) || isNaN(m)) return null;
    let h24 = h12 % 12;
    if (period === "PM") h24 += 12;
    return h24 * 60 + m;
  };
  const minutesToSelects = (min) => {
    if (min === undefined || min === null)
      return { hour: "", minute: "", period: "AM" };
    const h24 = Math.floor(min / 60);
    const minute = min % 60;
    const period = h24 >= 12 ? "PM" : "AM";
    const hour = h24 % 12 || 12;
    return {
      hour: String(hour),
      minute: String(minute).padStart(2, "0"),
      period,
    };
  };

  const openDetails = (itinerary) => {
    setDetailsItinerary(itinerary);
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setShowDetailsModal(false);
    setDetailsItinerary(null);
  };

  const openSiteDetails = (site, allowAdd = true) => {
    setSiteDetailsAllowAdd(allowAdd);
    setDetailsSelectedSite(site);
    setShowSiteDetailsModal(true);
  };

  const closeSiteDetails = () => {
    setShowSiteDetailsModal(false);
    setDetailsSelectedSite(null);
  };

  const fmtTime = (s) => {
    if (!s) return "—";
    const m = String(s)
      .trim()
      .match(/^([0-2]?\d):(\d{2})(?:\s*([AP]M))?$/i);
    if (m) {
      let h = parseInt(m[1], 10);
      const min = m[2];
      const p = m[3] ? m[3].toUpperCase() : h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${min} ${p}`;
    }
    return String(s);
  };

  const parseToMinutes = (s) => {
    if (!s) return null;
    const m = String(s)
      .trim()
      .match(/^([0-2]?\d):(\d{2})(?:\s*([AP]M))?$/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const p = m[3] ? m[3].toUpperCase() : h >= 12 ? "PM" : "AM";
    let h24 = h % 12;
    if (p === "PM") h24 += 12;
    return h24 * 60 + min;
  };

  useEffect(() => {
    const startBase = selectsToMinutes(Number(rHour), Number(rMinute), rPeriod);
    if (startBase === null || selectedSites.length === 0) {
      setErrors((prev) => ({ ...prev, sites: "" }));
      return;
    }
    const seq = [];
    const preBreaks = (breaks || []).filter((b) => Number(b.position) === 0);
    for (const b of preBreaks) seq.push({ type: "break", data: b });
    for (let idx = 0; idx < selectedSites.length; idx++) {
      const site = selectedSites[idx];
      seq.push({ type: "site", data: site });
      const afterBreaks = (breaks || []).filter(
        (b) => Number(b.position) === idx + 1
      );
      for (const b of afterBreaks) seq.push({ type: "break", data: b });
    }
    let prevEnd = null;
    const slots = seq.map((it) => {
      if (it.type === "break") {
        const s = prevEnd === null ? startBase : prevEnd;
        const e = roundToStep(s + (Number(it.data.minutes) || 0), 5);
        prevEnd = e;
        return { start: s, end: e };
      } else {
        const vRaw =
          typeof it.data?.averageTimeSpent === "number"
            ? it.data.averageTimeSpent
            : Number(it.data?.averageTimeSpent);
        const v = isNaN(vRaw) || vRaw <= 0 ? 0 : vRaw;
        const s = prevEnd === null ? startBase : roundToStep(prevEnd + 10, 5);
        const e = roundToStep(s + v, 5);
        prevEnd = e;
        return { start: s, end: e };
      }
    });
    const conflictMessages = [];
    for (let i = 0; i < seq.length; i++) {
      if (seq[i].type !== "site") continue;
      const site = seq[i].data;
      const slot = slots[i];
      const open = parseToMinutes(site.openingTime);
      const range = formatClockRange(slot.start, slot.end);
      if (open !== null && slot.start < open) {
        conflictMessages.push(
          `${
            site.siteName || site.title
          } — ${range} is outside opening hours (opens ${fmtTime(
            site.openingTime
          )}).`
        );
      }
    }
    setErrors((prev) => ({ ...prev, sites: conflictMessages.join("\n") }));
  }, [selectedSites, breaks, rHour, rMinute, rPeriod]);

  // Helper function to get fresh config with token
  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  // Fetch pins
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/admin/login";
          return;
        }

        const res = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/pins`,
          getConfig()
        );
        setPins(res.data);
      } catch (err) {
        console.error("Failed to fetch pins:", err);
        if (err.response?.status === 401) {
          window.location.href = "/admin/login";
        }
      }
    };
    fetchPins();
  }, []);

  // Initial fetch for both active and archived itineraries
  useEffect(() => {
    fetchItineraries();
    fetchArchivedItineraries();
  }, []);

  // Refetch the relevant list whenever the tab changes
  useEffect(() => {
    if (activeTab === "active") {
      fetchItineraries();
    } else if (activeTab === "archived") {
      fetchArchivedItineraries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchItineraries = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/itineraries`,
        getConfig()
      );
      setItineraries(res.data);
    } catch (err) {
      console.error("Failed to fetch itineraries:", err);
      if (err.response?.status === 401) {
        window.location.href = "/admin/login";
      }
    }
  };

  const fetchArchivedItineraries = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/itineraries/archived`,
        getConfig()
      );
      setArchivedItineraries(res.data);
    } catch (err) {
      console.error("Failed to fetch archived itineraries:", err);
      if (err.response?.status === 401) {
        window.location.href = "/admin/login";
      }
    }
  };

  const toggleSite = (pin) => {
    setSelectedSites((prev) =>
      prev.find((s) => s._id === pin._id)
        ? prev.filter((s) => s._id !== pin._id)
        : [...prev, pin]
    );
  };

  const onDragEnd = (result) => {
    const { source, destination } = result || {};
    if (!destination) return;
    const sequence = [];
    const preBreaks = (breaks || []).filter((b) => Number(b.position) === 0);
    for (const b of preBreaks) sequence.push({ type: "break", data: b });
    for (let idx = 0; idx < selectedSites.length; idx++) {
      sequence.push({ type: "site", data: selectedSites[idx] });
      const afterBreaks = (breaks || []).filter(
        (b) => Number(b.position) === idx + 1
      );
      for (const b of afterBreaks) sequence.push({ type: "break", data: b });
    }
    const [moved] = sequence.splice(source.index, 1);
    sequence.splice(destination.index, 0, moved);
    const newSites = sequence
      .filter((it) => it.type === "site")
      .map((it) => it.data);
    setSelectedSites(newSites);
    let sitesSeen = 0;
    const newBreaks = [];
    for (const it of sequence) {
      if (it.type === "site") sitesSeen += 1;
      else if (it.type === "break")
        newBreaks.push({ ...it.data, position: sitesSeen });
    }
    setBreaks(newBreaks);
  };

  const addBreak = (minutes, label = "Break/Lunch") => {
    const dur = Number(minutes) || 0;
    if (dur <= 0) return;
    setBreaks((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        position: selectedSites.length,
        minutes: dur,
        label,
      },
    ]);
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file); // store file to upload
    setImagePreview(URL.createObjectURL(file)); // preview immediately
  };

  // Handle save / update itinerary
  const handleSave = () => {
    // Validation
    const newErrors = {};
    const trimmedName = name.trim();
    const nameLen = trimmedName.length;
    if (nameLen < 5 || nameLen > 70) {
      newErrors.name = "Itinerary name must be 5-70 characters";
    } else if (trimmedName && isProfaneText(trimmedName)) {
      newErrors.name = "No bad words allowed";
    }
    const trimmedDescription = description.trim();
    const descLen = trimmedDescription.length;
    if (descLen < 5 || descLen > 400) {
      newErrors.description = "Description must be 5-400 characters";
    } else if (descLen && isProfaneText(trimmedDescription)) {
      newErrors.description = "No bad words allowed";
    }
    const durNum = Number(duration);
    if (!duration || isNaN(durNum) || durNum < 1 || durNum > 12) {
      newErrors.duration = "Duration must be 1-12 hours";
    }
    // Image is required for both new and edit
    if (!imageFile && !imagePreview) {
      newErrors.image = "Image is required";
    }
    if (selectedSites.length === 0) {
      newErrors.sites = "Please select at least one site";
    }
    if (rHour === "" || rMinute === "") {
      newErrors.recommendedStartTime = "Recommended start time is required";
    }

    if (!newErrors.recommendedStartTime && selectedSites.length > 0) {
      const startBase = selectsToMinutes(
        Number(rHour),
        Number(rMinute),
        rPeriod
      );
      const seq = [];
      const preBreaks = (breaks || []).filter((b) => Number(b.position) === 0);
      for (const b of preBreaks) seq.push({ type: "break", data: b });
      for (let idx = 0; idx < selectedSites.length; idx++) {
        const site = selectedSites[idx];
        seq.push({ type: "site", data: site });
        const afterBreaks = (breaks || []).filter(
          (b) => Number(b.position) === idx + 1
        );
        for (const b of afterBreaks) seq.push({ type: "break", data: b });
      }
      let prevEnd = null;
      const slots = seq.map((it) => {
        if (it.type === "break") {
          const s = prevEnd === null ? startBase : prevEnd;
          const e = roundToStep(s + (Number(it.data.minutes) || 0), 5);
          prevEnd = e;
          return { start: s, end: e };
        } else {
          const vRaw =
            typeof it.data?.averageTimeSpent === "number"
              ? it.data.averageTimeSpent
              : Number(it.data?.averageTimeSpent);
          const v = isNaN(vRaw) || vRaw <= 0 ? 0 : vRaw;
          const s = prevEnd === null ? startBase : roundToStep(prevEnd + 10, 5);
          const e = roundToStep(s + v, 5);
          prevEnd = e;
          return { start: s, end: e };
        }
      });
      const conflictMessages = [];
      for (let i = 0; i < seq.length; i++) {
        if (seq[i].type !== "site") continue;
        const site = seq[i].data;
        const slot = slots[i];
        const open = parseToMinutes(site.openingTime);
        const range = formatClockRange(slot.start, slot.end);
        if (open !== null && slot.start < open) {
          conflictMessages.push(
            `${
              site.siteName || site.title
            } — ${range} is outside opening hours (opens ${fmtTime(
              site.openingTime
            )}).`
          );
        }
      }
      if (conflictMessages.length > 0) {
        newErrors.sites = conflictMessages.join("\n");
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setConfirmModal({
      isOpen: true,
      type: "success",
      title: editingId ? "Update Itinerary?" : "Add New Itinerary?",
      message: editingId
        ? `Are you sure you want to update the itinerary "${name}"?`
        : `Are you sure you want to add the itinerary "${name}"?`,
      confirmText: editingId ? "Update" : "Add Itinerary",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          // Check if token exists
          const token = localStorage.getItem("token");
          if (!token) {
            setNotification({
              isOpen: true,
              type: "error",
              title: "Session Expired",
              message: "Please login again.",
            });
            setTimeout(() => {
              window.location.href = "/admin/login";
            }, 2000);
            return;
          }

          let imageUrl = "";

          // If user selected a new image, upload it
          if (imageFile) {
            const formData = new FormData();
            formData.append("image", imageFile);

            const res = await axios.post(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/itineraries/upload`,
              formData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            imageUrl = res.data.imageUrl;
          } else if (editingId) {
            const existing = itineraries.find((i) => i._id === editingId);
            imageUrl = existing?.imageUrl || "";
          }

          const payload = {
            name,
            description,
            imageUrl,
            duration: duration ? Number(duration) : 0,
            recommendedStartMinutes:
              rHour !== "" && rMinute !== ""
                ? selectsToMinutes(Number(rHour), Number(rMinute), rPeriod)
                : undefined,
            sites: selectedSites.map((s) => s._id),
            isAdminCreated: true,
            breaks,
          };

          if (editingId) {
            await axios.put(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/itineraries/${editingId}`,
              payload,
              getConfig()
            );
          } else {
            await axios.post(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/itineraries`,
              payload,
              getConfig()
            );
          }

          // Reset form
          setName("");
          setDescription("");
          setDuration("");
          setImageFile(null);
          setImagePreview("");
          setImageUrl("");
          setSelectedSites([]);
          setBreaks([]);
          setRHour("7");
          setRMinute("00");
          setRPeriod("AM");
          setEditingId(null);
          fetchItineraries();
          setErrors({
            name: "",
            description: "",
            duration: "",
            image: "",
            sites: "",
            recommendedStartTime: "",
          }); // Clear errors
          setConfirmModal({
            isOpen: false,
            type: "warning",
            title: "",
            message: "",
            onConfirm: null,
            loading: false,
          });

          // Show success notification
          setNotification({
            isOpen: true,
            type: "success",
            title: editingId ? "Itinerary Updated" : "Itinerary Added",
            message: editingId
              ? "The itinerary has been updated successfully."
              : "New itinerary has been added successfully.",
          });
        } catch (err) {
          console.error("Failed to save itinerary:", err);
          setConfirmModal((prev) => ({ ...prev, loading: false }));

          // Handle 401 Unauthorized
          if (err.response?.status === 401) {
            setNotification({
              isOpen: true,
              type: "error",
              title: "Session Expired",
              message: "Please login again.",
            });
            setTimeout(() => {
              window.location.href = "/admin/login";
            }, 2000);
          } else {
            setNotification({
              isOpen: true,
              type: "error",
              title: "Error",
              message:
                err.response?.data?.error ||
                "Failed to save itinerary. Please try again.",
            });
          }
        }
      },
    });
  };
  const handleArchive = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "info",
      title: "Archive Itinerary?",
      message:
        "This itinerary will be moved to the archived section. You can restore it later if needed.",
      confirmText: "Archive",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await axios.put(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
            }/itineraries/${id}/archive`,
            {},
            getConfig()
          );
          // Optimistically update local state for immediate UI feedback
          setItineraries((prev) => prev.filter((it) => it._id !== id));
          setArchivedItineraries((prev) => {
            const archivedItem = itineraries.find((it) => it._id === id);
            return archivedItem ? [...prev, { ...archivedItem, isArchived: true }] : prev;
          });
          // Refresh only the active list to remove the archived item
          fetchItineraries();
          // Switch tab so admin immediately sees the archived itinerary
          setActiveTab("archived");
          setConfirmModal({
            isOpen: false,
            type: "warning",
            title: "",
            message: "",
            onConfirm: null,
            loading: false,
          });

          // Show success notification
          setNotification({
            isOpen: true,
            type: "success",
            title: "Itinerary Archived",
            message: "The itinerary has been archived successfully.",
          });
        } catch (err) {
          console.error("Failed to archive itinerary:", err);
          setConfirmModal((prev) => ({ ...prev, loading: false }));
          setNotification({
            isOpen: true,
            type: "error",
            title: "Error",
            message: "Failed to archive itinerary. Please try again.",
          });
        }
      },
    });
  };

  const handleRestore = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "restore",
      title: "Restore Itinerary?",
      message:
        "This itinerary will be restored to the active itineraries list and will be available for users again.",
      confirmText: "Restore",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await axios.put(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
            }/itineraries/${id}/restore`,
            {},
            getConfig()
          );
          fetchItineraries();
          fetchArchivedItineraries();
          setConfirmModal({
            isOpen: false,
            type: "warning",
            title: "",
            message: "",
            onConfirm: null,
            loading: false,
          });

          // Show success notification
          setNotification({
            isOpen: true,
            type: "success",
            title: "Itinerary Restored",
            message: "The itinerary has been restored successfully.",
          });
        } catch (err) {
          console.error("Failed to restore itinerary:", err);
          setConfirmModal((prev) => ({ ...prev, loading: false }));
          setNotification({
            isOpen: true,
            type: "error",
            title: "Error",
            message: "Failed to restore itinerary. Please try again.",
          });
        }
      },
    });
  };

  const handlePermanentDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Permanent Delete?",
      message:
        "WARNING: This action cannot be undone! The itinerary will be permanently deleted from the database.",
      confirmText: "Delete Forever",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await axios.delete(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
            }/itineraries/${id}`,
            getConfig()
          );
          // Optimistically remove from local state
          setArchivedItineraries((prev) => prev.filter((it) => it._id !== id));
          fetchArchivedItineraries();
          setConfirmModal({
            isOpen: false,
            type: "warning",
            title: "",
            message: "",
            onConfirm: null,
            loading: false,
          });

          // Show success notification
          setNotification({
            isOpen: true,
            type: "success",
            title: "Itinerary Deleted",
            message: "The itinerary has been permanently deleted.",
          });
        } catch (err) {
          console.error("Failed to delete itinerary:", err);
          setConfirmModal((prev) => ({ ...prev, loading: false }));
          setNotification({
            isOpen: true,
            type: "error",
            title: "Error",
            message: "Failed to delete itinerary. Please try again.",
          });
        }
      },
    });
  };

  const handleEdit = (itinerary) => {
    // Clear any existing validation errors
    setErrors({
      name: "",
      description: "",
      duration: "",
      image: "",
      sites: "",
      recommendedStartTime: "",
    });

    setName(itinerary.name);
    setDescription(itinerary.description);

    // Only set preview if imageUrl exists
    if (itinerary.imageUrl) {
      setImageUrl(itinerary.imageUrl); // Store the actual URL
      setImagePreview(
        itinerary.imageUrl.startsWith("http")
          ? itinerary.imageUrl
          : `${
              import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
              "http://localhost:5000"
            }${itinerary.imageUrl}`
      ); // <-- prepend localhost if needed
    } else {
      setImageUrl("");
      setImagePreview(""); // show placeholder
    }

    setImageFile(null); // clear any previously selected file
    setDuration(itinerary.duration || "");
    const s = minutesToSelects(itinerary.recommendedStartMinutes);
    setRHour(s.hour);
    setRMinute(s.minute);
    setRPeriod(s.period);

    const selected = pins.filter((pin) =>
      itinerary.sites?.some((site) => site._id === pin._id)
    );
    setSelectedSites(selected);
    setBreaks(Array.isArray(itinerary.breaks) ? itinerary.breaks : []);
    setEditingId(itinerary._id);
  };

  const handleDeleteImage = () => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Delete Image?",
      message:
        "Are you sure you want to remove this image? This action cannot be undone.",
      confirmText: "Delete Image",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          // If editing an existing itinerary with an image URL, delete from server
          if (editingId && imageUrl) {
            await axios.delete(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/itineraries/delete-image`,
              {
                ...getConfig(),
                data: { imageUrl },
              }
            );
          }

          // Clear local state
          setImageFile(null);
          setImagePreview("");
          setImageUrl("");
          setErrors({ ...errors, image: "" });
          setConfirmModal({
            isOpen: false,
            type: "warning",
            title: "",
            message: "",
            onConfirm: null,
            loading: false,
          });

          // Show success notification
          setNotification({
            isOpen: true,
            type: "success",
            title: "Image Deleted",
            message: "The image has been deleted successfully.",
          });
        } catch (err) {
          console.error("Failed to delete image:", err);
          setConfirmModal((prev) => ({ ...prev, loading: false }));
          setNotification({
            isOpen: true,
            type: "error",
            title: "Error",
            message: "Failed to delete image. Please try again.",
          });
        }
      },
    });
  };

  return (
    <>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            type: "warning",
            title: "",
            message: "",
            onConfirm: null,
            loading: false,
          })
        }
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        loading={confirmModal.loading}
      />
      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() =>
          setNotification({
            isOpen: false,
            type: "info",
            title: "",
            message: "",
          })
        }
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      {showDetailsModal && detailsItinerary && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDetails}
          />
          <div className="relative bg-white w-full sm:max-w-3xl md:max-w-4xl mx-0 sm:mx-4 rounded-3xl shadow-2xl animate-fadeIn h-[90vh] sm:h-[85vh] overflow-y-auto modern-scrollbar">
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-[#f04e37]" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {detailsItinerary.name}
                  </h3>
                  <p className="text-xs text-gray-500">Itinerary overview</p>
                </div>
              </div>
              <button
                onClick={closeDetails}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {resolveUrl(detailsItinerary.imageUrl) && (
              <div className="h-36 sm:h-56 md:h-64 w-full overflow-hidden">
                <img
                  src={resolveUrl(detailsItinerary.imageUrl)}
                  alt={detailsItinerary.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="px-6 py-5 sm:px-8 sm:py-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {detailsItinerary.duration
                      ? `${detailsItinerary.duration} ${
                          detailsItinerary.duration === 1 ? "hour" : "hours"
                        }`
                      : "Flexible"}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {(detailsItinerary.sites || []).length} site(s)
                  </span>
                </div>
              </div>

              {detailsItinerary.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">
                    Description
                  </h4>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {detailsItinerary.description}
                  </p>
                  {typeof detailsItinerary.recommendedStartMinutes ===
                    "number" && (
                    <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md bg-gray-50 border border-gray-200">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700 whitespace-nowrap">
                        Recommended Start:{" "}
                        {formatMinutesToClock(
                          detailsItinerary.recommendedStartMinutes
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {(() => {
                const start =
                  typeof detailsItinerary.recommendedStartMinutes === "number"
                    ? detailsItinerary.recommendedStartMinutes
                    : 8 * 60;
                let cursor = roundToStep(start, 5);
                const items = [];
                const preBreaks = (detailsItinerary.breaks || []).filter(
                  (b) => Number(b.position) === 0
                );
                for (const b of preBreaks) {
                  const dur = Number(b.minutes) || 0;
                  if (dur > 0) {
                    const s = cursor;
                    const e = roundToStep(cursor + dur, 5);
                    items.push({
                      time: s,
                      break: { label: b.label || "Break", minutes: dur },
                      end: e,
                    });
                    cursor = e;
                  }
                }
                for (
                  let idx = 0;
                  idx < (detailsItinerary.sites || []).length;
                  idx++
                ) {
                  const site = detailsItinerary.sites[idx];
                  const v =
                    typeof site?.averageTimeSpent === "number"
                      ? site.averageTimeSpent
                      : Number(site?.averageTimeSpent);
                  const item = { time: roundToStep(cursor, 5), site };
                  items.push(item);
                  cursor = roundToStep(
                    cursor + (isNaN(v) || v <= 0 ? 0 : v),
                    5
                  );
                  const afterBreaks = (detailsItinerary.breaks || []).filter(
                    (b) => Number(b.position) === idx + 1
                  );
                  for (const b of afterBreaks) {
                    const dur = Number(b.minutes) || 0;
                    if (dur > 0) {
                      const s = cursor;
                      const e = roundToStep(cursor + dur, 5);
                      items.push({
                        time: s,
                        break: { label: b.label || "Break", minutes: dur },
                        end: e,
                      });
                      cursor = e;
                    }
                  }
                }
                if (!items.length) return null;
                return (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">
                      Suggested Schedule
                    </h4>
                    {(() => {
                      const segments = [];
                      let prevEnd = null;
                      for (let i = 0; i < items.length; i++) {
                        if (items[i].break) {
                          const s = items[i].time;
                          const e = items[i].end;
                          segments.push({
                            start: s,
                            end: e,
                            break: items[i].break,
                          });
                          prevEnd = e;
                          continue;
                        }
                        const site = items[i].site;
                        const v =
                          typeof site?.averageTimeSpent === "number"
                            ? site.averageTimeSpent
                            : Number(site?.averageTimeSpent);
                        const s =
                          i === 0
                            ? items[i].time
                            : roundToStep(prevEnd + 10, 5);
                        const e = roundToStep(
                          s + (isNaN(v) || v <= 0 ? 0 : v),
                          5
                        );
                        segments.push({ start: s, end: e, site });
                        prevEnd = e;
                      }
                      return (
                        <div className="space-y-3 sm:space-y-4">
                          {segments.map((seg, i) => (
                            <div
                              key={(seg.site && seg.site._id) || i}
                              className="flex items-center gap-4 sm:gap-5 py-1.5"
                            >
                              <div className="w-[160px] sm:w-[220px] flex-shrink-0 flex items-center justify-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-2 py-1 sm:px-3 sm:py-1.5">
                                <Clock className="w-4 h-4 text-gray-600" />
                                <span className="text-sm sm:hidden font-semibold text-gray-900 whitespace-nowrap">
                                  {`${formatMinutesToClock(
                                    seg.start
                                  )} – ${formatMinutesToClock(seg.end)}`}
                                </span>
                                <span className="hidden sm:inline text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">
                                  {`${formatMinutesToClock(
                                    seg.start
                                  )} to ${formatMinutesToClock(seg.end)}`}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                {seg.break ? (
                                  <p className="text-sm font-medium text-gray-800">
                                    {(seg.break.label || "Break") +
                                      ` (${seg.break.minutes} min)`}
                                  </p>
                                ) : (
                                  <p className="text-sm font-medium text-gray-800 line-clamp-2 sm:line-clamp-1">
                                    {seg.site.siteName || seg.site.title}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">
                  Included Sites
                </h4>
                <div className="space-y-3 pr-2">
                  {(detailsItinerary.sites || []).map((site) => {
                    const thumb =
                      site.mediaFiles?.find((m) => m.type === "image")?.url ||
                      site.mediaUrl;
                    const img = resolveUrl(thumb);
                    return (
                      <div
                        key={site._id}
                        className="flex text-left gap-3 p-3 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-orange-300 hover:shadow-sm transition"
                        onClick={() => openSiteDetails(site, false)}
                      >
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {img ? (
                            <img
                              src={img}
                              alt={site.siteName || site.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <MapPin className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-gray-900 truncate">
                            {site.siteName || site.title}
                          </p>
                          {site.category && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                                <Tag className="w-3 h-3" />
                                {site.category?.name || site.category}
                              </span>
                            </div>
                          )}
                          {(site.openingTime || site.closingTime) && (
                            <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-600">
                              <Clock className="w-3 h-3" />
                              <span>{`Open ${fmtTime(
                                site.openingTime
                              )} • Close ${fmtTime(site.closingTime)}`}</span>
                            </div>
                          )}
                          {site.siteDescription && (
                            <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                              {site.siteDescription}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start gap-6 p-6 min-w-0">
        {/* Form Panel */}
        <div className="w-full lg:basis-1/2 min-w-0 bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-gradient-red mb-4">
            {editingId ? "Edit Itinerary" : "Add Itinerary"}
          </h2>

          {/* Cover Image Preview */}
          <div
            className="w-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center relative"
            style={{ height: COVER_IMAGE_HEIGHT }}
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="Itinerary Preview"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/192"; // fallback
                  }}
                />
                <button
                  onClick={handleDeleteImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition"
                  title="Delete image"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <span className="text-gray-400">Image Preview</span>
            )}
          </div>

          {/* File Upload */}
          <div className="w-full">
            {!imageFile && !imagePreview ? (
              <label
                className={`flex flex-col items-center justify-center w-full h-13 px-4 border-2 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition ${
                  errors.image ? "border-red-500" : "border-gray-300"
                }`}
              >
                <span className="text-gray-500 text-sm">Click to upload</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => {
                    handleFileChange(e);
                    if (errors.image) {
                      setErrors({ ...errors, image: "" });
                    }
                  }}
                  className="hidden"
                />
              </label>
            ) : (
              <p className="text-sm text-green-600">Image uploaded ✓</p>
            )}
            {errors.image && (
              <p className="text-red-500 text-xs mt-1">{errors.image}</p>
            )}
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Itinerary Name
            </label>
            <input
              type="text"
              placeholder="Itinerary Name"
              value={name}
              onChange={(e) => {
                const raw = e.target.value;
                setName(raw);
                if (raw.trim() && isProfaneText(raw)) {
                  setErrors({ ...errors, name: "No bad words allowed" });
                } else if (errors.name) {
                  setErrors({ ...errors, name: "" });
                }
              }}
              minLength={5}
              maxLength={70}
              className={`w-full border-2 rounded-lg p-3 text-sm focus:ring-2 outline-none transition ${
                errors.name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:border-red-400 focus:ring-red-200"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              const rawDesc = e.target.value;
              setDescription(rawDesc);
              if (rawDesc.trim() && isProfaneText(rawDesc)) {
                setErrors({ ...errors, description: "No bad words allowed" });
              } else if (errors.description) {
                setErrors({ ...errors, description: "" });
              }
            }}
            placeholder="Description"
            minLength={5}
            maxLength={400}
            className={`w-full p-3 border-2 border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none text-gray-700 text-sm resize-none ${
              errors.description
                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                : ""
            }`}
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}

          {/* Recommended Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              Recommended Start
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={rHour}
                onChange={(e) => {
                  setRHour(e.target.value);
                  if (errors.recommendedStartTime && e.target.value) {
                    setErrors({ ...errors, recommendedStartTime: "" });
                  }
                }}
                className={`w-full p-3 border-2 rounded-lg text-sm ${
                  errors.recommendedStartTime
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              >
                <option value="" disabled>
                  Hour
                </option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <select
                value={rMinute}
                onChange={(e) => {
                  setRMinute(e.target.value);
                  if (errors.recommendedStartTime && e.target.value) {
                    setErrors({ ...errors, recommendedStartTime: "" });
                  }
                }}
                className={`w-full p-3 border-2 rounded-lg text-sm ${
                  errors.recommendedStartTime
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              >
                <option value="" disabled>
                  Minute
                </option>
                {["00", "15", "30", "45"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={rPeriod}
                onChange={(e) => setRPeriod(e.target.value)}
                className={`w-full p-3 border-2 rounded-lg text-sm ${
                  errors.recommendedStartTime
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            {errors.recommendedStartTime && (
              <p className="text-red-500 text-xs mt-1">
                {errors.recommendedStartTime}
              </p>
            )}
          </div>

          {/* Duration input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <input
              type="number"
              min="1"
              max="12"
              step="0.5"
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                if (errors.duration && e.target.value > 0) {
                  setErrors({ ...errors, duration: "" });
                }
              }}
              placeholder="Duration (hours)"
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 outline-none text-gray-700 text-sm transition ${
                errors.duration
                  ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:border-gray-400 focus:ring-gray-200"
              }`}
            />
            {errors.duration && (
              <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-600">
                Auto-calculate from site average time
              </span>
              <label className="flex items-center space-x-2 cursor-pointer">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={autoDurationEnabled}
                    onChange={(e) => setAutoDurationEnabled(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </div>
                <span className="text-xs text-gray-600">
                  {autoDurationEnabled ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>
            {selectedSites.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Total: {computedTotals.totalMinutes} min • Suggested:{" "}
                {computedTotals.hours}{" "}
                {computedTotals.hours === 1 ? "hour" : "hours"}
              </p>
            )}
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selected Sites
          </label>
          <div className="w-full max-w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-700 text-sm max-h-48 overflow-y-auto overflow-x-hidden">
            {selectedSites.length || breaks.length ? (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="selectedMixedDroppable">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 w-full min-w-0"
                    >
                      {(() => {
                        const seq = [];
                        const preBreaks = (breaks || []).filter(
                          (b) => Number(b.position) === 0
                        );
                        for (const b of preBreaks)
                          seq.push({
                            type: "break",
                            data: b,
                            key: `break-${b.id || Math.random()}`,
                          });
                        for (let idx = 0; idx < selectedSites.length; idx++) {
                          const site = selectedSites[idx];
                          seq.push({
                            type: "site",
                            data: site,
                            key: `site-${site._id}`,
                            index: idx,
                          });
                          const afterBreaks = (breaks || []).filter(
                            (b) => Number(b.position) === idx + 1
                          );
                          for (const b of afterBreaks)
                            seq.push({
                              type: "break",
                              data: b,
                              key: `break-${b.id || Math.random()}`,
                            });
                        }
                        const start =
                          rHour !== "" && rMinute !== ""
                            ? selectsToMinutes(
                                Number(rHour),
                                Number(rMinute),
                                rPeriod
                              )
                            : 8 * 60;
                        let prevEnd = null;
                        const slotTimes = seq.map((it) => {
                          if (it.type === "break") {
                            const s = prevEnd === null ? start : prevEnd;
                            const e = roundToStep(
                              s + (Number(it.data.minutes) || 0),
                              5
                            );
                            prevEnd = e;
                            return { start: s, end: e };
                          } else {
                            const vRaw =
                              typeof it.data?.averageTimeSpent === "number"
                                ? it.data.averageTimeSpent
                                : Number(it.data?.averageTimeSpent);
                            const v = isNaN(vRaw) || vRaw <= 0 ? 0 : vRaw;
                            const s =
                              prevEnd === null
                                ? start
                                : roundToStep(prevEnd + 10, 5);
                            const e = roundToStep(s + v, 5);
                            prevEnd = e;
                            return { start: s, end: e };
                          }
                        });
                        return seq.map((it, index) => (
                          <Draggable
                            key={it.key}
                            draggableId={it.key}
                            index={index}
                          >
                            {(drag, snapshot) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                className={`w-full max-w-full flex items-center justify-between p-2 rounded-md border transition-transform duration-150 cursor-grab active:cursor-grabbing ${
                                  it.type === "break"
                                    ? "border-green-300 bg-green-50"
                                    : "border-gray-200 bg-white"
                                } ${
                                  snapshot.isDragging
                                    ? "shadow-md scale-[1.01]"
                                    : ""
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <GripVertical
                                      className={`w-4 h-4 ${
                                        it.type === "break"
                                          ? "text-green-400"
                                          : "text-gray-400"
                                      }`}
                                    />
                                    {it.type === "site" ? (
                                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-gray-100 text-gray-700 rounded-full">
                                        {(it.index ??
                                          selectedSites.findIndex(
                                            (s) => s._id === it.data._id
                                          )) + 1}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-green-200 text-green-800 rounded-full">
                                        B
                                      </span>
                                    )}
                                    <span
                                      className={`truncate ${
                                        it.type === "break"
                                          ? "font-medium text-green-800"
                                          : ""
                                      }`}
                                    >
                                      {it.type === "site"
                                        ? it.data.siteName || it.data.title
                                        : `${it.data.label || "Break"} (${
                                            it.data.minutes
                                          } min)`}
                                    </span>
                                  </div>
                                  <div className="mt-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-700 w-[160px] sm:w-[180px]">
                                    <Clock
                                      className={`w-3 h-3 ${
                                        it.type === "break"
                                          ? "text-green-700"
                                          : "text-gray-600"
                                      }`}
                                    />
                                    <span>{`${formatMinutesToClock(
                                      slotTimes[index].start
                                    )} – ${formatMinutesToClock(
                                      slotTimes[index].end
                                    )}`}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    it.type === "site"
                                      ? toggleSite(it.data)
                                      : setBreaks((prev) =>
                                          prev.filter(
                                            (b) =>
                                              (b.id || b) !==
                                              (it.data.id || it.data)
                                          )
                                        )
                                  }
                                  className={`p-1.5 rounded-md ${
                                    it.type === "break"
                                      ? "bg-green-100 hover:bg-green-200"
                                      : "bg-gray-100 hover:bg-gray-200"
                                  }`}
                                  title="Remove"
                                >
                                  <X
                                    className={`w-4 h-4 ${
                                      it.type === "break"
                                        ? "text-green-800"
                                        : "text-gray-700"
                                    }`}
                                  />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ));
                      })()}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <span className="text-gray-400">No selections</span>
            )}
          </div>
          {errors.sites && (
            <p className="text-red-500 text-xs mt-1 whitespace-pre-line">
              {errors.sites}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg hover:opacity-90 transition"
            >
              {editingId ? (
                <Check size={ICON_SIZE} />
              ) : (
                <Plus size={ICON_SIZE} />
              )}
              {editingId ? "Update" : "Save"}
            </button>
            <button
              onClick={() => {
                setName("");
                setDescription("");
                setDuration("");
                setImageFile(null);
                setImagePreview("");
                setImageUrl("");
                setSelectedSites([]);
                setRHour("7");
                setRMinute("00");
                setRPeriod("AM");
                setEditingId(null);
                setErrors({
                  name: "",
                  description: "",
                  duration: "",
                  image: "",
                  sites: "",
                  recommendedStartTime: "",
                });
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Itineraries & Sites Panel */}
        <div className="w-full lg:flex-1 lg:basis-1/2 min-w-0 flex flex-col gap-6">
          {/* Existing Itineraries Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Itineraries</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("active")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  activeTab === "active"
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Active Itineraries ({itineraries.length})
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  activeTab === "archived"
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Archived ({archivedItineraries.length})
              </button>
            </div>

            {/* Scrollable itineraries list */}
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[65vh] pr-2">
              {activeTab === "active" ? (
                itineraries.length ? (
                  itineraries.map((itinerary) => (
                    <div
                      key={itinerary._id}
                      className="border border-gray-200 rounded-xl p-5 bg-white 
               shadow-sm hover:shadow-lg transition"
                    >
                      {/* Title + Subtitle */}
                      <h3 className="text-lg font-semibold text-gray-800">
                        {itinerary.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {itinerary.description}
                      </p>

                      {itinerary.duration > 0 && (
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          Duration: {itinerary.duration}{" "}
                          {itinerary.duration === 1 ? "hour" : "hours"}
                        </p>
                      )}
                      {itinerary.recommendedStartMinutes >= 0 && (
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          Recommended Start:{" "}
                          {formatMinutesToClock(
                            itinerary.recommendedStartMinutes
                          )}
                        </p>
                      )}

                      {/* Image */}
                      {itinerary.imageUrl && (
                        <img
                          src={
                            itinerary.imageUrl.startsWith("http")
                              ? itinerary.imageUrl
                              : `${
                                  import.meta.env.VITE_API_BASE_URL?.replace(
                                    "/api",
                                    ""
                                  ) || "http://localhost:5000"
                                }${itinerary.imageUrl}`
                          }
                          alt={itinerary.name}
                          className="w-full h-48 object-cover rounded-xl mt-3"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/192";
                          }}
                        />
                      )}

                      {/* Sites */}
                      {itinerary.sites?.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Sites: {itinerary.sites.length}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => openDetails(itinerary)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition"
                        >
                          <Info size={16} /> Info
                        </button>
                        <button
                          onClick={() => handleEdit(itinerary)}
                          className="flex items-center justify-center gap-2 px-4 py-2 
                bg-yellow-500 hover:bg-yellow-700
                text-white text-sm font-medium rounded-lg shadow-sm transition"
                        >
                          <Edit size={16} /> Edit
                        </button>

                        <button
                          onClick={() => handleArchive(itinerary._id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 
                bg-orange-500 hover:bg-orange-600 
                text-white text-sm font-medium rounded-lg shadow-sm transition"
                        >
                          <Archive size={16} /> Archive
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No active itineraries found</p>
                )
              ) : archivedItineraries.length ? (
                archivedItineraries.map((itinerary) => (
                  <div
                    key={itinerary._id}
                    className="border border-gray-200 rounded-xl p-5 bg-gray-50 
               shadow-sm hover:shadow-lg transition"
                  >
                    {/* Title + Subtitle */}
                    <h3 className="text-lg font-semibold text-gray-500">
                      {itinerary.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {itinerary.description}
                    </p>
                    {itinerary.duration > 0 && (
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        Duration: {itinerary.duration}{" "}
                        {itinerary.duration === 1 ? "hour" : "hours"}
                      </p>
                    )}
                    {itinerary.recommendedStartMinutes >= 0 && (
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        Recommended Start:{" "}
                        {formatMinutesToClock(
                          itinerary.recommendedStartMinutes
                        )}
                      </p>
                    )}

                    {/* Image */}
                    {itinerary.imageUrl && (
                      <img
                        src={
                          itinerary.imageUrl.startsWith("http")
                            ? itinerary.imageUrl
                            : `${
                                import.meta.env.VITE_API_BASE_URL?.replace(
                                  "/api",
                                  ""
                                ) || "http://localhost:5000"
                              }${itinerary.imageUrl}`
                        }
                        alt={itinerary.name}
                        className="w-full h-48 object-cover rounded-xl mt-3 opacity-60"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/192";
                        }}
                      />
                    )}

                    {/* Sites */}
                    {itinerary.sites?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        Sites: {itinerary.sites.length}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleRestore(itinerary._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 
                bg-green-500 hover:bg-green-600
                text-white text-sm font-medium rounded-lg shadow-sm transition"
                      >
                        <RotateCcw size={16} /> Restore
                      </button>

                      <button
                        onClick={() => handlePermanentDelete(itinerary._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 
                bg-red-600 hover:bg-red-700 
                text-white text-sm font-medium rounded-lg shadow-sm transition"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No archived itineraries</p>
              )}
            </div>
          </div>

          {/* Sites Card - Separate section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Sites</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {pins.length} available
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select sites to add to your itinerary
            </p>

            {/* Scrollable sites list */}
            <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-2">
              <BreakCard onAddBreak={addBreak} addedCount={breaks.length} />
              {pins.map((pin) => {
                const isSelected = selectedSites.some((s) => s._id === pin._id);
                return (
                  <div
                    key={pin._id}
                    className="flex items-center gap-4 rounded-2xl p-4 border border-gray-200 
          bg-white shadow-sm hover:shadow-md transition cursor-pointer hover:border-orange-300"
                    onClick={() => openSiteDetails(pin)}
                  >
                    {/* Thumbnail */}
                    <img
                      src={(() => {
                        // Get first image from mediaFiles array
                        const firstMediaFile = pin.mediaFiles?.find(
                          (m) => m.type === "image"
                        );
                        if (firstMediaFile?.url) {
                          // Check if URL is already a full URL (S3) or relative path
                          return firstMediaFile.url.startsWith("http")
                            ? firstMediaFile.url
                            : `${
                                import.meta.env.VITE_API_BASE_URL?.replace(
                                  "/api",
                                  ""
                                ) || "http://localhost:5000"
                              }${firstMediaFile.url}`;
                        }

                        // Fallback: placeholder
                        return "https://via.placeholder.com/80?text=No+Image";
                      })()}
                      alt={pin.siteName || pin.title}
                      className="object-cover rounded-xl flex-shrink-0"
                      style={{ width: 80, height: 80 }}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/80?text=Error";
                      }}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-800 truncate">
                        {pin.siteName || pin.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2">
                        {pin.description}
                      </p>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSite(pin);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition 
            ${
              isSelected
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
                    >
                      {isSelected ? <Check size={20} /> : <Plus size={20} />}
                      {isSelected ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {showSiteDetailsModal && detailsSelectedSite && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeSiteDetails}
            />
            <div className="relative bg-white w-full sm:max-w-3xl md:max-w-4xl mx-0 sm:mx-4 rounded-3xl shadow-2xl animate-fadeIn max-h-[90vh] sm:max-h-[85vh] overflow-y-auto modern-scrollbar">
              <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Info className="w-6 h-6 text-[#f04e37]" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {detailsSelectedSite.siteName ||
                        detailsSelectedSite.title}
                    </h3>
                    <p className="text-xs text-gray-500">Site details</p>
                  </div>
                </div>
                <button
                  onClick={closeSiteDetails}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {(() => {
                const hero =
                  detailsSelectedSite.mediaFiles?.find(
                    (m) => m.type === "image"
                  )?.url ||
                  detailsSelectedSite.mediaUrl ||
                  "";
                const full = resolveUrl(hero);
                return full ? (
                  <div className="h-36 sm:h-56 md:h-64 w-full overflow-hidden px-6 sm:px-8 pt-3">
                    <img
                      src={full}
                      alt={
                        detailsSelectedSite.siteName ||
                        detailsSelectedSite.title
                      }
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : null;
              })()}

              <div className="px-6 py-5 sm:px-8 sm:py-6">
                <div className="flex items-center gap-2 mb-3">
                  {typeof detailsSelectedSite.category === "object" &&
                    detailsSelectedSite.category?.name && (
                      <span className="inline-flex items-center gap-1.5 bg-orange-100 text-[#f04e37] px-3 py-1 rounded-full text-xs font-semibold">
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20 6h-8l-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zm-6 9H6v-2h8v2zm4-4H6V9h12v2z" />
                        </svg>
                        {detailsSelectedSite.category.name}
                      </span>
                    )}
                  {(() => {
                    const v =
                      typeof detailsSelectedSite.averageTimeSpent === "number"
                        ? detailsSelectedSite.averageTimeSpent
                        : Number(detailsSelectedSite?.averageTimeSpent);
                    const minutes = isNaN(v) || v <= 0 ? null : v;
                    if (minutes === null) return null;
                    return (
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 8v5h4v-2h-2V8h-2zm0-6a10 10 0 100 20 10 10 0 000-20z" />
                        </svg>
                        Avg visit: {minutes} min
                      </span>
                    );
                  })()}
                  {(detailsSelectedSite.openingTime ||
                    detailsSelectedSite.closingTime) && (
                    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 8v5h4v-2h-2V8h-2zm0-6a10 10 0 100 20 10 10 0 000-20z" />
                      </svg>
                      {`Open ${fmtTime(
                        detailsSelectedSite.openingTime
                      )} • Close ${fmtTime(detailsSelectedSite.closingTime)}`}
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-700">
                  {detailsSelectedSite.siteDescription ? (
                    <p className="leading-relaxed">
                      {detailsSelectedSite.siteDescription
                        .split("\n\n")[0]
                        .trim()}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">
                      No description available
                    </p>
                  )}
                </div>

                <div className="mt-5 flex gap-2" hidden={!siteDetailsAllowAdd}>
                  <button
                    onClick={() => {
                      toggleSite(detailsSelectedSite);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition ${
                      selectedSites.some(
                        (s) => s._id === detailsSelectedSite._id
                      )
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gradient-to-r from-[#f04e37] to-orange-600 hover:shadow-md"
                    }`}
                  >
                    {selectedSites.some(
                      (s) => s._id === detailsSelectedSite._id
                    ) ? (
                      <>
                        {" "}
                        <Check className="w-4 h-4" /> Added to Itinerary{" "}
                      </>
                    ) : (
                      <>
                        {" "}
                        <Plus className="w-4 h-4" /> Add to Itinerary{" "}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function BreakCard({ onAddBreak, addedCount = 0 }) {
  const [minutes, setMinutes] = useState(30);
  const [label, setLabel] = useState("Break/Lunch");
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl p-4 border shadow-sm ${
        addedCount > 0
          ? "border-green-300 bg-green-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-800">
          {label}
          {addedCount > 0 && (
            <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-green-200 text-green-800 font-semibold">
              {addedCount}
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-500">
          Add a time-only stop. Not shown on map.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <select
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full px-3 py-2 border-2 rounded-lg text-sm border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
          >
            {[15, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border-2 rounded-lg text-sm border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
          >
            {["Break", "Lunch"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onAddBreak && onAddBreak(minutes, label)}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition w-full mt-2 ${
            addedCount > 0
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          <Plus size={16} /> Add {label}
        </button>
      </div>
    </div>
  );
}
