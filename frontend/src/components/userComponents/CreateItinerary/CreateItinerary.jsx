import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import MainLayout from "../MainLayout";
import PullToRefresh from "../../shared/PullToRefresh";
import BackHeader from "../BackButton";
import { useTranslation } from "react-i18next";
import OnlineRequiredModal from "../../shared/OnlineRequiredModal";
import ConfirmModal from "../../shared/ConfirmModal";
import NotificationModal from "../../shared/NotificationModal";
import {
  FaCheck,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import {
  Info,
  X,
  Filter as FilterIcon,
  Clock,
  MapPin,
  Tag,
  GripVertical,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TourProvider from "../../TourComponents/TourProvider";
import { useTour } from "../../TourComponents/TourContext";
import { createItineraryTourSteps } from "../../TourComponents/tourSteps";
import { getCreateItineraryTourStatus } from "../../../utils/tourApi";
import { Filter } from "bad-words";

function FortSantiagoModal({ isOpen, onClose, onDontShowAgain }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = async () => {
    if (dontShowAgain && onDontShowAgain) {
      await onDontShowAgain();
    }
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-[#f04e37] p-4 flex items-center gap-3">
          <Info className="text-white w-7 h-7" />
          <h2 className="text-lg font-semibold text-white">
            Fort Santiago Notice
          </h2>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4 text-sm leading-relaxed">
            You've selected a site inside Fort Santiago.
          </p>

          <div className="bg-orange-50 p-4 rounded-lg flex items-start gap-3 mb-5">
            <div className="w-2 h-2 bg-[#f04e37] rounded-full mt-1.5 flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-gray-700 text-sm leading-relaxed mb-2">
                An entrance fee is required to access Fort Santiago and its
                sites.
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Please purchase tickets at the Fort Santiago entrance before
                visiting.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 text-[#f04e37] border-gray-300 rounded focus:ring-[#f04e37] cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                Don't show this again
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-[#f04e37] hover:bg-[#c53d27] text-white font-medium rounded-lg transition-colors text-sm"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon-only, accessible dropdown for category filtering
function CategoryFilterButton({ value, onChange, categories }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={value === "all" ? "All Categories" : `Category: ${value}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className="w-full h-10 rounded-xl bg-white border-2 border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 outline-none transition-all relative flex items-center justify-center overflow-hidden"
      >
        <FilterIcon
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Filter by category"
          className="absolute right-0 mt-2 w-44 max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg z-50 p-1"
        >
          <button
            role="option"
            aria-selected={value === "all"}
            onClick={() => handleSelect("all")}
            className={`w-full text-left px-3 py-2 rounded-lg text-gray-900 hover:bg-gray-100 ${
              value === "all" ? "bg-gray-100" : ""
            }`}
          >
            All Categories
          </button>
          {categories.map((name) => (
            <button
              key={name}
              role="option"
              aria-selected={value === name}
              onClick={() => handleSelect(name)}
              className={`w-full text-left px-3 py-2 rounded-lg text-gray-900 hover:bg-gray-100 ${
                value === name ? "bg-gray-100" : ""
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateItineraryPage() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [userItineraries, setUserItineraries] = useState([]);
  const [itineraryName, setItineraryName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [sites, setSites] = useState([]);
  const [descriptionToggles, setDescriptionToggles] = useState({});
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [activeTab, setActiveTab] = useState("create"); // "create" or "myItineraries"
  const [showFortModal, setShowFortModal] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState("");
  const [hideFortModalPreference, setHideFortModalPreference] = useState(false);
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [showDeleteItineraryModal, setShowDeleteItineraryModal] =
    useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState(null);
  // Search and filter state for Available Sites
  const [siteSearchQuery, setSiteSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });
  // Confirmation modal state for saving itinerary
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    confirmText: "",
    onConfirm: null,
    loading: false,
  });
  const [sitesErrorMsg, setSitesErrorMsg] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItinerary, setDetailsItinerary] = useState(null);
  const [showSiteDetailsModal, setShowSiteDetailsModal] = useState(false);
  const [detailsSelectedSite, setDetailsSelectedSite] = useState(null);
  const [showSiteDetailsAction, setShowSiteDetailsAction] = useState(true);
  const [rHour, setRHour] = useState("7");
  const [rMinute, setRMinute] = useState("00");
  const [rPeriod, setRPeriod] = useState("AM");
  const [nameError, setNameError] = useState("");
  const TAGALOG_BAD_WORDS = useMemo(() => {
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
    const set = new Set([...base, ...extra].map((s) => s.toLowerCase()));
    return Array.from(set);
  }, []);
  const badWords = useMemo(() => {
    const f = new Filter();
    try {
      f.addWords(...TAGALOG_BAD_WORDS);
    } catch {}
    return f;
  }, [TAGALOG_BAD_WORDS]);
  const normalizeProfanity = (s) => {
    if (!s) return "";
    const map = {
      0: "o",
      1: "i",
      3: "e",
      4: "a",
      5: "s",
      7: "t",
      "@": "a",
      $: "s",
      "!": "i",
    };
    const lowered = String(s).toLowerCase();
    const leetFixed = lowered
      .split("")
      .map((c) => (map[c] ? map[c] : c))
      .join("");
    return leetFixed.replace(/[\s\-_.]+/g, "");
  };
  const isProfaneText = (s) => {
    const normalized = normalizeProfanity(s);
    if (badWords.isProfane(normalized)) return true;
    for (const w of TAGALOG_BAD_WORDS) {
      const wn = normalizeProfanity(w);
      if (normalized.includes(wn)) return true;
    }
    return false;
  };

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const BACKEND_URL =
    import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
    "http://localhost:5000";

  // Validation helper functions
  const containsHTML = (str = "") => /<[^>]*>/g.test(str);
  const containsEmoji = (str = "") =>
    /[\p{Extended_Pictographic}\u{1F300}-\u{1F6FF}\u{1F600}-\u{1F64F}]/u.test(str);
  const isValidNamePattern = (str = "") =>
    /^[A-Za-z0-9\s&,.'\-]+$/.test(str);

  useEffect(() => {
    // No TTS here; voice guidance is exclusive to itinerary maps
    fetchSites();
    fetchItineraries();
    fetchUserPreference();
  }, [t]);

  // Respond to tutorial events
  useEffect(() => {
    const openMyItineraries = () => {
      setActiveTab("myItineraries");
    };
    const expandFirstItinerary = () => {
      try {
        setExpandedIndex(0);
      } catch {}
    };
    const returnToCreateItinerary = () => {
      setActiveTab("create");
    };
    window.addEventListener("tour:openMyItineraries", openMyItineraries);
    window.addEventListener("tour:expandFirstItinerary", expandFirstItinerary);
    window.addEventListener(
      "tour:returnToCreateItinerary",
      returnToCreateItinerary
    );
    return () => {
      window.removeEventListener("tour:openMyItineraries", openMyItineraries);
      window.removeEventListener(
        "tour:expandFirstItinerary",
        expandFirstItinerary
      );
      window.removeEventListener(
        "tour:returnToCreateItinerary",
        returnToCreateItinerary
      );
    };
  }, []);

  const fetchUserPreference = async () => {
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/auth/me`,
        config
      );
      setHideFortModalPreference(res.data.hideFortSantiagoModal || false);
    } catch (err) {
      console.error("Error fetching user preference:", err);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/pins`
      );
      setSites(res.data);
    } catch {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Failed to load sites",
        message: "Please try again.",
      });
    }
  };

  const fetchItineraries = async () => {
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/itineraries`,
        config
      );
      setUserItineraries(res.data.filter((i) => !i.isAdminCreated));
    } catch {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Failed to load itineraries",
        message: "Please try again.",
      });
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/userItineraries/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setImageUrl(res.data.imageUrl);
    } catch (err) {
      console.error("Upload failed", err);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Image upload failed",
        message: "Please try again.",
      });
    }
  };

  const handleDeleteImage = async () => {
    try {
      // If there's an imageUrl, delete from server
      if (imageUrl) {
        await axios.delete(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/userItineraries/delete-image`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: { imageUrl },
          }
        );
      }
      setImageUrl("");
      setShowDeleteImageModal(false);
    } catch (err) {
      console.error("Failed to delete image:", err);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Failed to delete image",
        message: "Please try again.",
      });
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${
      import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
      "http://localhost:5000"
    }${url}`;
  };

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
  const computeSiteConflicts = () => {
    const selectedSitesOrdered = selected
      .map((id) => sites.find((s) => s._id === id))
      .filter(Boolean);
    const items = [];
    const preBreaks = (breaks || []).filter((b) => Number(b.position) === 0);
    for (const b of preBreaks)
      items.push({ type: "break", break: b, index: -1 });
    for (let idx = 0; idx < selectedSitesOrdered.length; idx++) {
      const site = selectedSitesOrdered[idx];
      items.push({ type: "site", site, index: idx });
      const afterBreaks = (breaks || []).filter(
        (b) => Number(b.position) === idx + 1
      );
      for (const b of afterBreaks)
        items.push({ type: "break", break: b, index: idx });
    }
    if (!items.length) return [];
    const start =
      rHour !== "" && rMinute !== ""
        ? selectsToMinutes(Number(rHour), Number(rMinute), rPeriod)
        : 7 * 60;
    let prevEnd = null;
    const times = items.map((it) => {
      if (it.type === "break") {
        const s0 = prevEnd === null ? start : prevEnd;
        const e0 = roundToStep(s0 + (Number(it.break.minutes) || 0), 5);
        prevEnd = e0;
        return { start: s0, end: e0 };
      } else {
        const vRaw =
          typeof it.site?.averageTimeSpent === "number"
            ? it.site.averageTimeSpent
            : Number(it.site?.averageTimeSpent);
        const v = isNaN(vRaw) || vRaw <= 0 ? 0 : vRaw;
        const s0 = prevEnd === null ? start : roundToStep(prevEnd + 10, 5);
        const e0 = roundToStep(s0 + v, 5);
        prevEnd = e0;
        return { start: s0, end: e0 };
      }
    });
    const messages = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.type !== "site") continue;
      const openM = parseToMinutes(it.site?.openingTime);
      const s0 = times[i].start;
      const e0 = times[i].end;
      if (openM !== null && s0 < openM) {
        const name = it.site?.siteName || it.site?.title || "Site";
        const range = formatClockRange(s0, e0);
        messages.push(
          `${name} — ${range} is outside opening hours (opens ${formatMinutesToClock(
            openM
          )}).`
        );
      }
    }
    return messages;
  };

  const openDetails = (itinerary) => {
    setDetailsItinerary(itinerary);
    setShowDetailsModal(true);
  };
  const closeDetails = () => {
    setShowDetailsModal(false);
    setDetailsItinerary(null);
  };

  const openSiteDetails = (site, allowAction = true) => {
    setDetailsSelectedSite(site);
    setShowSiteDetailsAction(Boolean(allowAction));
    setShowSiteDetailsModal(true);
  };
  const closeSiteDetails = () => {
    setShowSiteDetailsModal(false);
    setDetailsSelectedSite(null);
  };

  const addBreak = (minutes, label = "Break/Lunch") => {
    const dur = Number(minutes) || 0;
    if (dur <= 0) return;
    setBreaks((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        position: selected.length,
        minutes: dur,
        label,
      },
    ]);
  };

  const onPreviewDragEnd = (result) => {
    const { source, destination } = result || {};
    if (!destination) return;

    const mixed = [];
    const preBreaks = (breaks || []).filter((b) => Number(b.position) === 0);
    for (const b of preBreaks) mixed.push({ type: "break", data: b });
    for (let idx = 0; idx < selected.length; idx++) {
      const site = sites.find((s) => s._id === selected[idx]);
      if (!site) continue;
      mixed.push({ type: "site", data: site });
      const afterBreaks = (breaks || []).filter(
        (b) => Number(b.position) === idx + 1
      );
      for (const b of afterBreaks) mixed.push({ type: "break", data: b });
    }

    const reordered = Array.from(mixed);
    const [movedItem] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, movedItem);

    const newSelected = reordered
      .filter((it) => it.type === "site")
      .map((it) => it.data._id);
    setSelected(newSelected);

    let seenSites = 0;
    const newBreaks = [];
    for (const it of reordered) {
      if (it.type === "site") seenSites += 1;
      else newBreaks.push({ ...it.data, position: seenSites });
    }
    setBreaks(newBreaks);
  };

  const toggleSelection = (siteId) => {
    const site = sites.find((s) => s._id === siteId);

    if (
      site?.insideFortSantiago &&
      !selected.includes(siteId) &&
      !hideFortModalPreference
    ) {
      // Only show modal when adding a Fort Santiago site and user hasn't disabled it
      setShowFortModal(true);
    }
    setSelected((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleDontShowAgain = async () => {
    try {
      await axios.put(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/auth/fort-santiago-modal`,
        { hideFortSantiagoModal: true },
        config
      );
      setHideFortModalPreference(true);
    } catch (err) {
      console.error("Error updating preference:", err);
    }
  };

  const handleSave = async () => {
    // Check if offline
    if (!navigator.onLine) {
      setOfflineMessage(
        editingItineraryId
          ? "Updating itineraries requires an internet connection"
          : "Creating itineraries requires an internet connection"
      );
      setShowOfflineModal(true);
      return;
    }

    const trimmedName = (itineraryName || "").trim();

    // --- Itinerary Name validations ---
    if (!trimmedName) {
      setNameError("Itinerary name is required");
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Itinerary name required",
        message: "Please enter an itinerary name.",
      });
      return;
    }

    if (trimmedName.length < 3 || trimmedName.length > 100) {
      setNameError("Invalid length");
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Invalid Length",
        message: "Itinerary name must be between 3 and 100 characters.",
      });
      return;
    }

    if (itineraryName !== trimmedName) {
      setNameError("No leading/trailing spaces");
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Invalid Format",
        message: "Itinerary name cannot start or end with spaces.",
      });
      return;
    }

    if (!isValidNamePattern(trimmedName)) {
      setNameError("Invalid characters");
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Invalid Characters",
        message:
          "Use only letters, numbers, spaces, and basic punctuation (- & , . ').",
      });
      return;
    }

    if (containsEmoji(trimmedName) || containsHTML(trimmedName)) {
      setNameError("Invalid characters");
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Invalid Characters",
        message: "Itinerary name cannot contain emojis or HTML.",
      });
      return;
    }

    // Local profanity filter
    if (isProfaneText(trimmedName)) {
      setNameError("No bad words allowed");
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Inappropriate Content",
        message: "No bad words allowed in itinerary name.",
      });
      return;
    }

    // OpenAI Moderation API
    try {
      const moderationResponse = await axios.post(
        `${BACKEND_URL}/api/openai/moderate`,
        { input: trimmedName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = moderationResponse.data.results?.[0];
      if (result && result.flagged) {
        const categories = Object.entries(result.categories)
          .filter(([_, v]) => v)
          .map(([k]) => k);
        let warningMessage =
          "Your itinerary name contains inappropriate content.";
        if (categories.length) {
          warningMessage += ` (${categories.join(", ")})`;
        }
        setNameError("Inappropriate content");
        setNotification({
          isOpen: true,
          type: "warning",
          title: "Content Warning",
          message: warningMessage,
        });
        return;
      }
    } catch (err) {
      console.error("Moderation API error:", err);
      // proceed, fallback filters already applied
    }

    // Uniqueness check (case-insensitive)
    const nameExists = userItineraries.some(
      (it) =>
        it.name &&
        it.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        it._id !== editingItineraryId
    );
    if (nameExists) {
      setNameError("Name already exists");
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Duplicate Name",
        message:
          "Another itinerary with this name already exists. Please choose a different name.",
      });
      return;
    }

    // Start time validation
    if (rHour === "" || rMinute === "") {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Start Time Required",
        message: "Please select a start time for your itinerary.",
      });
      return;
    }

    // Selected sites validation
    if (selected.length === 0) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "No sites selected",
        message: "Select at least one site for your itinerary.",
      });
      return;
    }

    // Ensure all selected sites are active
    const hasInactiveSite = selected.some((id) => {
      const s = sites.find((site) => site._id === id);
      return !s || s.status !== "active" || s.isArchived;
    });
    if (hasInactiveSite) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Inactive Site Selected",
        message:
          "One or more selected sites are inactive. Please remove them from your itinerary.",
      });
      return;
    }

    const conflictMessages = computeSiteConflicts();
    if (conflictMessages.length) {
      setSitesErrorMsg(conflictMessages.join("\n"));
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Time conflicts detected",
        message: conflictMessages[0],
      });
      return;
    }

    // Build payload for submission
    const payload = {
      name: trimmedName,
      imageUrl: imageUrl ? imageUrl.trim() : "",
      sites: selected,
      isAdminCreated: false,
      recommendedStartMinutes:
        rHour !== "" && rMinute !== ""
          ? selectsToMinutes(Number(rHour), Number(rMinute), rPeriod)
          : undefined,
      breaks,
    };

    // Show confirmation modal before actually saving
    setConfirmModal({
      isOpen: true,
      type: "success",
      title: editingItineraryId ? "Update Itinerary?" : "Add New Itinerary?",
      message: editingItineraryId
        ? `Are you sure you want to update the itinerary "${trimmedName}"?`
        : `Are you sure you want to add the itinerary "${trimmedName}"?`,
      confirmText: editingItineraryId ? "Update" : "Save Itinerary",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          if (editingItineraryId) {
            await axios.put(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/itineraries/${editingItineraryId}`,
              payload,
              config
            );

            // Clear caches to force refresh
            localStorage.removeItem("user_itineraries");
            localStorage.removeItem("tourist_itineraries_cache");
            localStorage.removeItem("tourist_itinerary_preloaded_v2");

            setNotification({
              isOpen: true,
              type: "success",
              title: "Itinerary updated",
              message: "Your itinerary was updated successfully.",
            });
          } else {
            const res = await axios.post(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/itineraries`,
              payload,
              config
            );

            // Clear caches to force refresh
            localStorage.removeItem("user_itineraries");
            localStorage.removeItem("tourist_itineraries_cache");
            localStorage.removeItem("tourist_itinerary_preloaded_v2");

            setUserItineraries((prev) => [res.data, ...prev]);

            setNotification({
              isOpen: true,
              type: "success",
              title: "Itinerary created",
              message: "Your itinerary was created successfully.",
            });
          }

          resetForm();
          fetchItineraries();

          setConfirmModal({
            isOpen: false,
            type: "warning",
            title: "",
            message: "",
            confirmText: "",
            onConfirm: null,
            loading: false,
          });
        } catch (err) {
          console.error("Save error:", err);
          setConfirmModal((prev) => ({ ...prev, loading: false }));

          if (!navigator.onLine || err.message === "Network Error") {
            setOfflineMessage(
              "Lost connection while saving. Please try again when online."
            );
            setShowOfflineModal(true);
          } else {
            setNotification({
              isOpen: true,
              type: "error",
              title: "Failed to save itinerary",
              message: "Please try again.",
            });
          }
        }
      },
    });
  };

  const handleDelete = (id) => {
    // Check if offline
    if (!navigator.onLine) {
      setOfflineMessage("Deleting itineraries requires an internet connection");
      setShowOfflineModal(true);
      return;
    }

    // Show confirmation modal
    setItineraryToDelete(id);
    setShowDeleteItineraryModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/itineraries/${itineraryToDelete}`,
        config
      );
      // Clear all itinerary cache to force refresh in Start Tour
      localStorage.removeItem("user_itineraries");
      localStorage.removeItem("tourist_itineraries_cache");
      localStorage.removeItem("tourist_itinerary_preloaded_v2");
      setUserItineraries(
        userItineraries.filter((i) => i._id !== itineraryToDelete)
      );
      setShowDeleteItineraryModal(false);
      setItineraryToDelete(null);

      // Show success notification
      setNotification({
        isOpen: true,
        type: "success",
        title: "Itinerary Deleted",
        message: "Your itinerary has been successfully deleted.",
      });
    } catch (err) {
      if (!navigator.onLine || err.message === "Network Error") {
        setOfflineMessage(
          "Lost connection while deleting. Please try again when online."
        );
        setShowOfflineModal(true);
      } else {
        setNotification({
          isOpen: true,
          type: "error",
          title: "Failed to delete itinerary",
          message: "Please try again.",
        });
      }
      setShowDeleteItineraryModal(false);
      setItineraryToDelete(null);
    }
  };

  const handleEdit = (itinerary) => {
    setEditingItineraryId(itinerary._id);
    setItineraryName(itinerary.name);
    setImageUrl(itinerary.imageUrl || "");
    setSelected(itinerary.sites.map((s) => s._id));
    setBreaks(Array.isArray(itinerary.breaks) ? itinerary.breaks : []);

    const s = minutesToSelects(itinerary.recommendedStartMinutes);
    setRHour(s.hour || "7");
    setRMinute(s.minute || "00");
    setRPeriod(s.period || "AM");
    setActiveTab("create"); // Switch to Create tab
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelUpdate = () => resetForm();

  const resetForm = () => {
    setEditingItineraryId(null);
    setItineraryName("");
    setSelected([]);
    setImageUrl("");
    setRHour("7");
    setRMinute("00");
    setRPeriod("AM");
    setBreaks([]);
    setRHour("7");
    setRMinute("00");
    setRPeriod("AM");
  };

  const toggleExpand = (idx) =>
    setExpandedIndex(expandedIndex === idx ? null : idx);
  const toggleDescription = (id) =>
    setDescriptionToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    const msgs = computeSiteConflicts();
    setSitesErrorMsg(msgs.length ? msgs.join("\n") : "");
  }, [selected, breaks, rHour, rMinute, rPeriod]);

  return (
    <TourProvider
      steps={createItineraryTourSteps}
      userRole="tourist"
      scrollToFirstStep={false}
      disableScrolling={false}
      tourType="createItinerary"
    >
      <CreateItineraryTourAutostart />
      <div
        className="min-h-screen bg-gradient-to-br from-red-500 via-[#f04e37] to-orange-600 flex flex-col relative"
        style={{
          // paddingTop handled by BackHeader
          paddingBottom: "env(safe-area-inset-bottom)",
          height: "100dvh",
          overflow: "hidden",
          overscrollBehavior: "none",
        }}
      >
        {/* Fort Santiago Modal */}
        {showFortModal && (
          <FortSantiagoModal
            isOpen={showFortModal}
            onClose={() => setShowFortModal(false)}
            onDontShowAgain={handleDontShowAgain}
          />
        )}

        {/* Save Itinerary Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() =>
            setConfirmModal({
              isOpen: false,
              type: "warning",
              title: "",
              message: "",
              confirmText: "",
              onConfirm: null,
              loading: false,
            })
          }
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          type={confirmModal.type}
          loading={confirmModal.loading}
        />

        {/* Delete Image Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteImageModal}
          onClose={() => setShowDeleteImageModal(false)}
          onConfirm={handleDeleteImage}
          title="Delete Image?"
          message="Are you sure you want to remove this image? This action cannot be undone."
          confirmText="Delete Image"
          type="danger"
        />

        {/* Delete Itinerary Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteItineraryModal}
          onClose={() => {
            setShowDeleteItineraryModal(false);
            setItineraryToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Itinerary?"
          message="Are you sure you want to delete this itinerary? This action cannot be undone."
          confirmText="Delete Itinerary"
          type="danger"
        />

        {/* Notification Modal */}
        <NotificationModal
          isOpen={notification.isOpen}
          onClose={() => setNotification({ ...notification, isOpen: false })}
          type={notification.type}
          title={notification.title}
          message={notification.message}
        />

        {/* Global TTS Button */}

        <BackHeader title="Itinerary Manager" className="text-white" />

        {/* === TAB NAVIGATION === */}
        <div className="px-4 pt-6 pb-4 md:pt-4 md:pb-3">
          <div className="max-w-[1100px] mx-auto">
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl md:rounded-xl p-1.5 border border-white/20">
              {/* Sliding Background */}
              <div
                className="absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-white rounded-xl shadow-lg transition-transform duration-300 ease-out"
                style={{
                  transform:
                    activeTab === "create"
                      ? "translateX(0)"
                      : "translateX(calc(100% + 0.75rem))",
                }}
              />

              {/* Tab Buttons */}
              <div className="relative grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setActiveTab("create")}
                  className={`py-3 px-4 rounded-xl md:py-2.5 md:px-3 md:rounded-lg font-bold text-base md:text-sm transition-colors duration-300 itinerary-tab-create-btn ${
                    activeTab === "create"
                      ? "text-[#f04e37]"
                      : "text-white hover:text-white/80"
                  }`}
                >
                  {editingItineraryId ? "Update Itinerary" : "Create Itinerary"}
                </button>
                <button
                  onClick={() => setActiveTab("myItineraries")}
                  className={`py-3 px-4 rounded-xl md:py-2.5 md:px-3 md:rounded-lg font-bold text-base md:text-sm transition-colors duration-300 my-itineraries-tab-btn ${
                    activeTab === "myItineraries"
                      ? "text-[#f04e37]"
                      : "text-white hover:text-white/80"
                  }`}
                >
                  My Itineraries
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* === MAIN CONTENT === */}
        <MainLayout includeSideButtons={false}>
          <PullToRefresh
            onRefresh={async () => {
              await fetchSites();
              await fetchItineraries();
            }}
            activationAreaPx={96}
          >
            <div
              className="flex-1 w-full max-w-[1100px] mx-auto px-4 pb-8 md:pb-6 overflow-y-auto tour-page-scroll"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {/* CREATE ITINERARY TAB */}
              {activeTab === "create" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Form Section */}
                  <div className="bg-white/95 backdrop-blur-md rounded-3xl md:rounded-2xl px-8 py-8 md:px-12 md:py-10 lg:px-16 lg:py-12 shadow-2xl border border-white/20 available-sites-section">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <span className="w-2 h-8 bg-gradient-to-b from-[#f04e37] to-orange-600 rounded-full"></span>
                      {editingItineraryId
                        ? "Update Your Itinerary"
                        : "Create New Itinerary"}
                    </h2>

                    <div className="space-y-4 max-w-[640px] mx-auto">
                      {/* Itinerary Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Itinerary Name *
                        </label>
                        <input
                          type="text"
                          value={itineraryName}
                          maxLength={25}
                          onChange={(e) => {
                            const raw = e.target.value.slice(0, 25);
                            setItineraryName(raw);
                            if (raw.trim() && isProfaneText(raw)) {
                              setNameError("No bad words allowed");
                            } else if (nameError) {
                              setNameError("");
                            }
                          }}
                          placeholder="e.g., Historical Tour, Weekend Adventure"
                          className="w-full px-4 py-3 md:py-2.5 md:text-sm rounded-xl md:rounded-lg bg-white text-gray-900 placeholder-gray-400 border-2 border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 transition-all outline-none"
                        />
                        {nameError && (
                          <p className="text-xs text-red-600 mt-1">
                            {nameError}
                          </p>
                        )}
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Cover Image (Optional)
                        </label>
                        {imageUrl ? (
                          <div className="relative group">
                            <img
                              src={getFullImageUrl(imageUrl)}
                              alt="Itinerary Preview"
                              className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                            />
                            <button
                              onClick={() => setShowDeleteImageModal(true)}
                              className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 shadow-lg transition opacity-0 group-hover:opacity-100"
                              title="Remove image"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl md:rounded-lg hover:border-[#f04e37] hover:bg-gray-50 transition-all group">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-10 h-10 text-gray-400 group-hover:text-[#f04e37] transition-colors"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="mt-2 text-sm text-gray-500 group-hover:text-[#f04e37] transition-colors">
                              Click to upload cover image
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* Selected Sites Counter */}
                      <div className="flex items-center justify-between p-4 md:p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl md:rounded-lg border border-orange-200">
                        <span className="text-sm font-semibold text-gray-700">
                          Sites Selected
                        </span>
                        <span className="text-2xl font-bold text-[#f04e37]">
                          {selected.length}
                        </span>
                      </div>

                      {/* Selected Preview with Remove buttons */}
                      {(() => {
                        const selectedSitesOrdered = selected
                          .map((id) => sites.find((s) => s._id === id))
                          .filter(Boolean);
                        const items = [];
                        const preBreaks = (breaks || []).filter(
                          (b) => Number(b.position) === 0
                        );
                        for (const b of preBreaks) {
                          items.push({ type: "break", break: b, index: -1 });
                        }
                        for (
                          let idx = 0;
                          idx < selectedSitesOrdered.length;
                          idx++
                        ) {
                          const site = selectedSitesOrdered[idx];
                          items.push({ type: "site", site, index: idx });
                          const afterBreaks = (breaks || []).filter(
                            (b) => Number(b.position) === idx + 1
                          );
                          for (const b of afterBreaks) {
                            items.push({ type: "break", break: b, index: idx });
                          }
                        }
                        if (!items.length) return null;
                        const removeSiteAt = (id) => {
                          const siteIndex = selected.indexOf(id);
                          const newSelected = selected.filter((x) => x !== id);
                          setSelected(newSelected);
                          setBreaks((prev) => {
                            const adjusted = prev.map((b) => ({
                              ...b,
                              position:
                                b.position > siteIndex + 1
                                  ? b.position - 1
                                  : b.position,
                            }));
                            return adjusted.filter(
                              (b) =>
                                b.position >= 1 &&
                                b.position <= newSelected.length
                            );
                          });
                        };
                        const removeBreakById = (bid) => {
                          setBreaks((prev) => prev.filter((b) => b.id !== bid));
                        };
                        const start =
                          rHour !== "" && rMinute !== ""
                            ? selectsToMinutes(
                                Number(rHour),
                                Number(rMinute),
                                rPeriod
                              )
                            : 7 * 60;
                        let prevEnd = null;
                        const times = items.map((it) => {
                          if (it.type === "break") {
                            const s = prevEnd === null ? start : prevEnd;
                            const e = roundToStep(
                              s + (Number(it.break.minutes) || 0),
                              5
                            );
                            prevEnd = e;
                            return { start: s, end: e };
                          } else {
                            const vRaw =
                              typeof it.site?.averageTimeSpent === "number"
                                ? it.site.averageTimeSpent
                                : Number(it.site?.averageTimeSpent);
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
                        return (
                          <>
                            <DragDropContext onDragEnd={onPreviewDragEnd}>
                              <Droppable droppableId="createSelectedDroppable">
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="mt-3 space-y-2 overflow-x-hidden"
                                  >
                                    {items.map((it, i) => (
                                      <Draggable
                                        key={
                                          (it.type === "site"
                                            ? it.site._id
                                            : it.break.id) || `${i}`
                                        }
                                        draggableId={`${it.type}-${
                                          (it.type === "site"
                                            ? it.site._id
                                            : it.break.id) || i
                                        }`}
                                        index={i}
                                      >
                                        {(drag, snapshot) => (
                                          <div
                                            ref={drag.innerRef}
                                            {...drag.draggableProps}
                                            {...drag.dragHandleProps}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition-shadow duration-150 cursor-move w-full overflow-hidden box-border ${
                                              it.type === "break"
                                                ? "bg-green-50 border-green-300"
                                                : "bg-white border-gray-200"
                                            } ${
                                              snapshot.isDragging
                                                ? "shadow-md"
                                                : ""
                                            }`}
                                          >
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-3 min-w-0">
                                                <GripVertical
                                                  className={`${
                                                    it.type === "break"
                                                      ? "text-green-400"
                                                      : "text-gray-400"
                                                  } w-4 h-4`}
                                                />
                                                {it.type === "site" ? (
                                                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-gray-100 text-gray-700 rounded-full">
                                                    {it.index + 1}
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-green-200 text-green-800 rounded-full">
                                                    B
                                                  </span>
                                                )}
                                                <span className="text-sm font-medium text-gray-800 truncate">
                                                  {it.type === "site"
                                                    ? it.site.siteName ||
                                                      it.site.title
                                                    : `${
                                                        it.break.label ||
                                                        "Break"
                                                      } (${
                                                        it.break.minutes
                                                      } min)`}
                                                </span>
                                              </div>
                                              <div className="mt-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-700 w-[140px] sm:w-[160px]">
                                                <Clock className="w-3 h-3 text-gray-600" />
                                                <span>{`${formatMinutesToClock(
                                                  times[i].start
                                                )} – ${formatMinutesToClock(
                                                  times[i].end
                                                )}`}</span>
                                              </div>
                                            </div>
                                            <button
                                              onClick={() =>
                                                it.type === "site"
                                                  ? removeSiteAt(it.site._id)
                                                  : removeBreakById(it.break.id)
                                              }
                                              className={`p-2 rounded-md ${
                                                it.type === "break"
                                                  ? "bg-green-100 hover:bg-green-200"
                                                  : "bg-gray-100 hover:bg-gray-200"
                                              }`}
                                              title="Remove"
                                            >
                                              <X
                                                className={`${
                                                  it.type === "break"
                                                    ? "text-green-700"
                                                    : "text-gray-700"
                                                } w-4 h-4`}
                                              />
                                            </button>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </DragDropContext>
                            {sitesErrorMsg && (
                              <p className="text-xs text-red-600 mt-2 whitespace-pre-line">
                                {sitesErrorMsg}
                              </p>
                            )}
                          </>
                        );
                      })()}

                      {/* Recommended Start */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Time
                        </label>
                        <div className="grid grid-cols-3 gap-2 md:max-w-[360px] md:mx-auto">
                          <select
                            value={rHour}
                            onChange={(e) => setRHour(e.target.value)}
                            className="w-full px-2.5 py-3 md:py-2 border-2 rounded-lg md:rounded-md text-sm border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 outline-none"
                          >
                            <option value="" disabled>
                              Hour
                            </option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(
                              (h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              )
                            )}
                          </select>
                          <select
                            value={rMinute}
                            onChange={(e) => setRMinute(e.target.value)}
                            className="w-full px-2.5 py-3 md:py-2 border-2 rounded-lg md:rounded-md text-sm border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 outline-none"
                          >
                            <option value="" disabled>
                              Minute
                            </option>
                            {Array.from({ length: 12 }, (_, i) =>
                              String(i * 5).padStart(2, "0")
                            ).map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                          <select
                            value={rPeriod}
                            onChange={(e) => setRPeriod(e.target.value)}
                            className="w-full px-2.5 py-3 md:py-2 border-2 rounded-lg md:rounded-md text-sm border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 outline-none"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleSave}
                          className="flex-1 bg-gradient-to-r from-[#f04e37] to-orange-600 text-white font-bold py-3.5 md:py-2.5 px-6 md:px-4 rounded-xl md:rounded-lg md:text-sm hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 create-itinerary-save-btn"
                        >
                          {editingItineraryId
                            ? "Update Itinerary"
                            : "Save Itinerary"}
                        </button>
                        {editingItineraryId && (
                          <button
                            onClick={handleCancelUpdate}
                            className="px-6 md:px-4 py-3.5 md:py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl md:rounded-lg md:text-sm hover:bg-gray-300 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Available Sites Section */}
                  <div className="bg-white/95 backdrop-blur-md rounded-3xl md:rounded-2xl px-8 py-8 md:px-12 md:py-10 lg:px-16 lg:py-12 shadow-2xl border border-white/20">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <span className="w-2 h-8 bg-gradient-to-b from-[#f04e37] to-orange-600 rounded-full"></span>
                      Available Sites
                    </h2>
                    {/* Search and Category Filter (Category on the right of Search, all breakpoints) */}
                    <div className="flex flex-row items-center gap-3 mb-4">
                      <div className="flex-1">
                        <label className="sr-only">Search Sites</label>
                        <div className="relative">
                          <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                          <input
                            type="text"
                            value={siteSearchQuery}
                            onChange={(e) => setSiteSearchQuery(e.target.value)}
                            placeholder="Search by name or description"
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 border-2 border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 transition-all outline-none create-itinerary-search"
                          />
                        </div>
                      </div>
                      <div className="w-14 sm:w-16 flex-shrink-0">
                        <label className="sr-only">Category</label>
                        <CategoryFilterButton
                          value={selectedCategoryFilter}
                          onChange={setSelectedCategoryFilter}
                          categories={Array.from(
                            new Set(
                              (sites || [])
                                .map((s) => {
                                  const cat = s.category;
                                  return typeof cat === "object"
                                    ? cat?.name || ""
                                    : "";
                                })
                                .filter(Boolean)
                            )
                          ).sort((a, b) => a.localeCompare(b))}
                        />
                      </div>
                    </div>

                    {/* Compute filtered sites */}
                    {(() => {
                      const query = siteSearchQuery.trim().toLowerCase();
                      const filtered = (sites || []).filter((s) => {
                        const name = (s.siteName || "").toLowerCase();
                        const desc = (s.siteDescription || "").toLowerCase();
                        const matchesQuery = query
                          ? name.includes(query) || desc.includes(query)
                          : true;
                        const catName =
                          typeof s.category === "object"
                            ? s.category?.name || ""
                            : "";
                        const matchesCategory =
                          selectedCategoryFilter === "all"
                            ? true
                            : catName === selectedCategoryFilter;
                        return matchesQuery && matchesCategory;
                      });
                      return (
                        <SmoothScrollSiteList
                          sites={filtered}
                          selected={selected}
                          descriptionToggles={descriptionToggles}
                          toggleDescription={toggleDescription}
                          toggleSelection={toggleSelection}
                          getFullImageUrl={getFullImageUrl}
                          onOpenSiteDetails={openSiteDetails}
                          onAddBreak={addBreak}
                          addedBreakCount={breaks.length}
                        />
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* MY ITINERARIES TAB */}
              {activeTab === "myItineraries" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white/95 backdrop-blur-md rounded-3xl md:rounded-2xl px-8 py-8 md:px-12 md:py-10 lg:px-16 lg:py-12 shadow-2xl border border-white/20">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <span className="w-2 h-8 bg-gradient-to-b from-[#f04e37] to-orange-600 rounded-full"></span>
                      My Itineraries
                    </h2>

                    {userItineraries.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-10 h-10 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-lg font-medium mb-2">
                          No itineraries yet
                        </p>
                        <p className="text-gray-400 text-sm mb-6">
                          Create your first itinerary to get started
                        </p>
                        <button
                          onClick={() => setActiveTab("create")}
                          className="bg-gradient-to-r from-[#f04e37] to-orange-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-xl hover:scale-105 transition-all"
                        >
                          Create Itinerary
                        </button>
                      </div>
                    ) : (
                      <div
                        className="space-y-4 max-w-[640px] mx-auto"
                        style={{ touchAction: "pan-y pinch-zoom" }}
                      >
                        {userItineraries.map((itinerary, idx) => (
                          <ItineraryCard
                            key={itinerary._id}
                            itinerary={itinerary}
                            expanded={expandedIndex === idx}
                            toggleExpand={() => toggleExpand(idx)}
                            handleDelete={handleDelete}
                            handleEdit={handleEdit}
                            getFullImageUrl={getFullImageUrl}
                            onOpenDetails={openDetails}
                            onOpenSiteDetails={openSiteDetails}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <p className="mt-8 mb-8 text-xs text-center text-white">
                © {new Date().getFullYear()} {t("intramurosAdmin")}. Developed
                by UST College of Information and Computing Sciences.
              </p>
            </div>
          </PullToRefresh>
        </MainLayout>

        {/* Offline Modal */}
        <OnlineRequiredModal
          isOpen={showOfflineModal}
          onClose={() => setShowOfflineModal(false)}
          message={offlineMessage}
          showLoginOption={false}
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

              {getFullImageUrl(detailsItinerary.imageUrl) && (
                <div className="h-36 sm:h-56 md:h-64 w-full overflow-hidden">
                  <img
                    src={getFullImageUrl(detailsItinerary.imageUrl)}
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
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
                      {(() => {
                        const totalMinutes = (
                          detailsItinerary.sites || []
                        ).reduce((sum, s) => {
                          const v =
                            typeof s?.averageTimeSpent === "number"
                              ? s.averageTimeSpent
                              : Number(s?.averageTimeSpent);
                          return sum + (isNaN(v) || v <= 0 ? 0 : v);
                        }, 0);
                        const computedHours =
                          Math.round((totalMinutes / 60) * 2) / 2;
                        const value =
                          detailsItinerary.duration &&
                          detailsItinerary.duration > 0
                            ? detailsItinerary.duration
                            : computedHours;
                        return value && value > 0
                          ? `Duration: ${value} ${
                              value === 1 ? "hour" : "hours"
                            }`
                          : "Duration: Flexible";
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
                      {`Sites: ${
                        (detailsItinerary.sites || []).length
                      } site(s)`}
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
                      <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-200">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
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
                      : 7 * 60;
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
                      <h4 className="text-sm font-semibold text-gray-500 mb-1">
                        Schedule
                      </h4>
                      <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>Start Time: {formatMinutesToClock(start)}</span>
                      </div>
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
                      const img = thumb ? getFullImageUrl(thumb) : "";
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
                                <span>
                                  {(() => {
                                    const fmt = (s) => {
                                      if (!s) return "—";
                                      const m = String(s)
                                        .trim()
                                        .match(
                                          /^([0-2]?\d):(\d{2})(?:\s*([AP]M))?$/i
                                        );
                                      if (m) {
                                        let h = parseInt(m[1], 10);
                                        const min = m[2];
                                        const p = m[3]
                                          ? m[3].toUpperCase()
                                          : h >= 12
                                          ? "PM"
                                          : "AM";
                                        h = h % 12 || 12;
                                        return `${h}:${min} ${p}`;
                                      }
                                      return String(s);
                                    };
                                    return `Open ${fmt(
                                      site.openingTime
                                    )} • Close ${fmt(site.closingTime)}`;
                                  })()}
                                </span>
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

        {showSiteDetailsModal && detailsSelectedSite && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeSiteDetails}
            />
            <div
              className="relative bg-white w-full sm:max-w-3xl md:max-w-4xl mx-0 sm:mx-4 rounded-3xl shadow-2xl animate-fadeIn max-h-[90vh] sm:max-h-[85vh] overflow-y-auto modern-scrollbar"
              style={{
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
              }}
            >
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
                const full = getFullImageUrl(hero);
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
              <SiteDetailsBody
                site={detailsSelectedSite}
                isSelected={selected.includes(detailsSelectedSite._id)}
                onToggle={() => toggleSelection(detailsSelectedSite._id)}
                showAction={showSiteDetailsAction}
                isExpanded={Boolean(
                  descriptionToggles[detailsSelectedSite._id]
                )}
                onToggleDescription={() =>
                  toggleDescription(detailsSelectedSite._id)
                }
              />
            </div>
          </div>
        )}
      </div>
    </TourProvider>
  );
}

/* === SmoothScrollSiteList Component === */
function SmoothScrollSiteList({
  sites,
  selected,
  descriptionToggles,
  toggleDescription,
  toggleSelection,
  getFullImageUrl,
  onOpenSiteDetails,
  onAddBreak,
  addedBreakCount,
}) {
  const scrollContainerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setScrollProgress(progress);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className="overflow-y-auto max-h-[600px]"
      style={{
        scrollBehavior: "smooth",
        scrollSnapType: "y mandatory", // Enable vertical scroll snapping
        scrollPaddingTop: "0px", // Snap strictly at the top
        scrollPaddingBottom: "0px",
        overflowX: "hidden", // Prevent horizontal scrolling
        touchAction: "pan-y pinch-zoom", // Only allow vertical panning and pinch zoom
      }}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-3 pt-4 md:pt-3"
        style={{ paddingBottom: "300px" }}
      >
        {onAddBreak && (
          <BreakCard onAddBreak={onAddBreak} addedCount={addedBreakCount} />
        )}
        {sites.map((site, index) => (
          <SiteCard
            key={site._id}
            site={site}
            index={index}
            totalSites={sites.length}
            scrollProgress={scrollProgress}
            isSelected={selected.includes(site._id)}
            isExpanded={descriptionToggles[site._id]}
            toggleDescription={toggleDescription}
            toggleSelection={toggleSelection}
            getFullImageUrl={getFullImageUrl}
            onOpenSiteDetails={onOpenSiteDetails}
          />
        ))}
      </div>
    </div>
  );
}

/* === SiteCard Component with Smooth Animations === */
function SiteCard({
  site,
  index,
  totalSites,
  scrollProgress,
  isSelected,
  isExpanded,
  toggleDescription,
  toggleSelection,
  getFullImageUrl,
  onOpenSiteDetails,
}) {
  const cardRef = useRef(null);
  const descriptionRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [cardStyle, setCardStyle] = useState({
    opacity: 1,
    transform: "scale(1)",
  });

  // Detect if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!cardRef.current || !isMobile) {
      // On desktop, keep default style
      setCardStyle({
        opacity: 1,
        transform: "scale(1)",
      });
      return;
    }

    const card = cardRef.current;
    const container = card.closest(".overflow-y-auto");
    if (!container) return;

    const updateCardStyle = () => {
      const cardRect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Calculate distance from the CENTER of the container
      const containerCenter = containerRect.top + containerRect.height / 2;
      const cardCenter = cardRect.top + cardRect.height / 2;
      const distanceFromCenter = Math.abs(cardCenter - containerCenter);
      const cardHeight = cardRect.height;

      // Define the glow zone (centered around middle of container)
      const glowZoneRadius = cardHeight * 1.5;

      if (distanceFromCenter < glowZoneRadius) {
        // Card is in the glow zone near the center
        const normalizedPosition = distanceFromCenter / glowZoneRadius;

        // Full glow at center (0), fades as it moves away
        const opacity = 1 - normalizedPosition * 0.6;
        const scale = 1.05 - normalizedPosition * 0.15;

        setCardStyle({
          opacity: Math.max(0.4, opacity),
          transform: `scale(${Math.max(0.9, scale)})`,
        });
      } else {
        // Cards outside glow zone have reduced opacity/scale
        setCardStyle({
          opacity: 0.4,
          transform: "scale(0.9)",
        });
      }
    };

    const handleScroll = () => {
      requestAnimationFrame(updateCardStyle);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    updateCardStyle(); // Initial calculation

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [isInView, isMobile]);

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl md:rounded-xl shadow-lg hover:shadow-xl p-4 md:p-3 flex flex-col transition-all duration-300 ease-out border border-gray-100 cursor-pointer"
      style={{
        opacity: isMobile ? cardStyle.opacity : 1,
        transform: isMobile ? cardStyle.transform : "scale(1)",
        scrollSnapAlign: "start", // Snap to top of viewport
        touchAction: "pan-y pinch-zoom", // Only allow vertical panning
      }}
      onClick={() => onOpenSiteDetails && onOpenSiteDetails(site, true)}
    >
      <div className="relative mb-3 overflow-hidden rounded-xl group">
        <img
          src={
            site.mediaFiles?.find((m) => m.type === "image")?.url
              ? getFullImageUrl(
                  site.mediaFiles.find((m) => m.type === "image").url
                )
              : site.mediaUrl
              ? getFullImageUrl(site.mediaUrl)
              : "https://via.placeholder.com/150"
          }
          alt={site.siteName}
          className="w-full h-40 md:h-32 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/150";
          }}
        />
        {isSelected && (
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
            <FaCheck className="text-sm" />
          </div>
        )}
      </div>

      <h3
        className="font-bold text-gray-800 text-base md:text-sm mb-1"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordWrap: "break-word",
          overflowWrap: "break-word",
          lineHeight: "1.3",
        }}
      >
        {site.siteName}
      </h3>
      {/* Category badge: show icon and category name */}
      {(() => {
        const catName =
          typeof site.category === "object" ? site.category?.name || "" : "";
        return catName ? (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 bg-orange-100 text-[#f04e37] px-2.5 py-1 rounded-full text-xs font-semibold">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20 6h-8l-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zm-6 9H6v-2h8v2zm4-4H6V9h12v2z" />
              </svg>
              {catName}
            </span>
          </div>
        ) : null;
      })()}

      <div className="mb-3">
        <div
          ref={descriptionRef}
          className={`text-sm text-gray-600 ${
            isExpanded ? "max-h-48 overflow-y-auto pr-2" : ""
          }`}
          style={{
            overflow: isExpanded ? "auto" : "hidden",
            width: "100%",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            wordBreak: "normal",
            whiteSpace: isExpanded ? "normal" : "normal",
            display: isExpanded ? "block" : "-webkit-box",
            WebkitLineClamp: isExpanded ? "unset" : 3,
            WebkitBoxOrient: "vertical",
            scrollbarWidth: "thin",
            scrollbarColor: "#f04e37 #f3f4f6",
            lineHeight: "1.5",
          }}
        >
          {site.siteDescription ? (
            isExpanded ? (
              <div className="space-y-2">
                {site.siteDescription.split("\n\n").map((paragraph, idx) => (
                  <p
                    key={idx}
                    style={{
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            ) : (
              <span
                style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
              >
                {site.siteDescription.replace(/\n\n/g, " ")}
              </span>
            )
          ) : (
            <p className="text-gray-400 italic">No description available</p>
          )}
        </div>
        {site.siteDescription && site.siteDescription.length > 150 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSiteDetails && onOpenSiteDetails(site, true);
            }}
            className="text-xs text-[#f04e37] hover:text-orange-600 mt-2 font-medium"
          >
            See more
          </button>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleSelection(site._id);
        }}
        className={`w-full py-3 md:py-2.5 rounded-xl md:rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-all duration-200 create-itinerary-add-btn ${
          isSelected
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-gradient-to-r from-[#f04e37] to-orange-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-95"
        }`}
      >
        {isSelected ? (
          <>
            <FaCheck className="text-sm" /> Added to Itinerary
          </>
        ) : (
          <>
            <FaPlus className="text-sm" /> Add to Itinerary
          </>
        )}
      </button>
    </div>
  );
}

function BreakCard({ onAddBreak, addedCount = 0 }) {
  const [minutes, setMinutes] = useState(30);
  const [label, setLabel] = useState("Break/Lunch");
  return (
    <div
      className={`${
        addedCount > 0
          ? "bg-green-50 border-green-300"
          : "bg-white border-gray-200"
      } rounded-2xl md:rounded-xl shadow-lg p-4 md:p-3 flex flex-col border col-span-full md:col-span-2 lg:col-span-3`}
      style={{ scrollSnapAlign: "start" }}
    >
      <div className="flex items-center gap-3 mb-2">
        <svg
          className="w-5 h-5 text-[#f04e37]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 3h18v2H3zM4 7h16l-1 11H5L4 7zm3 13a2 2 0 104 0H7z" />
        </svg>
        <h3 className="font-bold text-gray-800 text-base md:text-sm">
          {label}
          {addedCount > 0 && (
            <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-green-200 text-green-800 font-semibold">
              {addedCount}
            </span>
          )}
        </h3>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Add a time-only stop for meals or rest. Not shown on map.
      </p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <select
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="w-full px-3 py-2 border-2 rounded-lg text-sm border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 outline-none"
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
          className="w-full px-3 py-2 border-2 rounded-lg text-sm border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 outline-none"
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
        className={`${
          addedCount > 0
            ? "bg-green-500 hover:bg-green-600"
            : "bg-gradient-to-r from-[#f04e37] to-orange-600"
        } w-full py-3 md:py-2.5 rounded-xl md:rounded-lg font-bold flex items-center justify-center gap-2 text-sm text-white hover:shadow-lg hover:scale-[1.02] active:scale-95 transition`}
      >
        Add {label}
      </button>
    </div>
  );
}

/* === ItineraryCard Component === */
function ItineraryCard({
  itinerary,
  expanded,
  toggleExpand,
  handleDelete,
  handleEdit,
  getFullImageUrl,
  onOpenDetails,
  onOpenSiteDetails,
}) {
  const [descExpanded, setDescExpanded] = useState({});
  const toggleSiteDescription = (idx) =>
    setDescExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const formatMinutesToClock = (min) => {
    if (min === undefined || min === null) return "";
    const h = Math.floor(min / 60);
    const m = min % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = h % 12 || 12;
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm} ${ampm}`;
  };
  const roundToStep = (min, step = 5) => Math.round(min / step) * step;

  return (
    <div
      className="bg-white rounded-2xl md:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
      style={{ touchAction: "pan-y pinch-zoom" }}
    >
      {/* Horizontal Layout */}
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        {itinerary.imageUrl && (
          <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
            <img
              src={getFullImageUrl(itinerary.imageUrl)}
              alt={itinerary.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 to-transparent"></div>
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 p-6 md:p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-2xl md:text-xl text-gray-800 mb-2">
                {itinerary.name}
              </h3>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#f04e37] px-3 py-1 rounded-full text-sm font-semibold">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  {itinerary.sites?.length || 0}{" "}
                  {itinerary.sites?.length === 1 ? "site" : "sites"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(itinerary)}
                className="flex-1 flex items-center justify-center gap-2 px-4 md:px-3 py-2 md:py-2 bg-blue-500 text-white font-semibold rounded-lg md:text-sm hover:bg-blue-600 transition-all my-itinerary-edit-btn"
              >
                <FaEdit className="text-sm" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(itinerary._id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 md:px-3 py-2 md:py-2 bg-red-500 text-white font-semibold rounded-lg md:text-sm hover:bg-red-600 transition-all my-itinerary-delete-btn"
              >
                <FaTrash className="text-sm" />
                <span>Delete</span>
              </button>
            </div>
            <button
              onClick={() => onOpenDetails && onOpenDetails(itinerary)}
              className="w-full flex items-center justify-center gap-2 px-4 md:px-3 py-2 md:py-2 bg-gray-100 text-gray-800 font-semibold rounded-lg md:text-sm hover:bg-gray-200 transition-all my-itinerary-view-sites-btn"
            >
              <Info className="w-4 h-4" />
              <span>Info</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details & Sites */}
      {expanded && itinerary.sites?.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-6 md:p-5 animate-fadeIn space-y-5">
          {(() => {
            const start =
              typeof itinerary.recommendedStartMinutes === "number"
                ? itinerary.recommendedStartMinutes
                : 8 * 60;
            let cursor = roundToStep(start, 5);
            const items = [];
            const preBreaks = (itinerary.breaks || []).filter(
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
            for (let idx = 0; idx < (itinerary.sites || []).length; idx++) {
              const site = itinerary.sites[idx];
              const v =
                typeof site?.averageTimeSpent === "number"
                  ? site.averageTimeSpent
                  : Number(site?.averageTimeSpent);
              const item = { time: roundToStep(cursor, 5), site };
              items.push(item);
              cursor = roundToStep(cursor + (isNaN(v) || v <= 0 ? 0 : v), 5);
              const afterBreaks = (itinerary.breaks || []).filter(
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
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">
                  Schedule
                </h4>
                <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Start Time: {formatMinutesToClock(start)}</span>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {items.map((item, i) => (
                    <div
                      key={(item.site && item.site._id) || i}
                      className="flex items-start gap-4 sm:gap-5 py-1.5"
                    >
                      <div className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {formatMinutesToClock(item.time)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.break ? (
                          <p className="text-sm font-medium text-gray-800">
                            {(item.break.label || "Break") +
                              ` (${item.break.minutes} min)`}
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-gray-800">
                            {item.site.siteName || item.site.title}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
            Included Sites
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {itinerary.sites.map((site, idx) => {
              const expandedDesc = descExpanded[idx];
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() =>
                    onOpenSiteDetails && onOpenSiteDetails(site, false)
                  }
                >
                  <img
                    src={
                      site.mediaFiles?.find((m) => m.type === "image")?.url
                        ? getFullImageUrl(
                            site.mediaFiles.find((m) => m.type === "image").url
                          )
                        : site.mediaUrl
                        ? getFullImageUrl(site.mediaUrl)
                        : "https://via.placeholder.com/60"
                    }
                    alt={site.siteName}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/60";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h5
                      className="font-semibold text-gray-800 text-sm mb-1"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {site.siteName}
                    </h5>
                    <p
                      className="text-xs text-gray-500"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        lineHeight: "1.4",
                      }}
                    >
                      {site.siteDescription || "No description available"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateItineraryTourAutostart() {
  const { startTour, isTourRunning } = useTour();
  const didStartRef = useRef(false);
  useEffect(() => {
    if (didStartRef.current) return;
    (async () => {
      try {
        const status = await getCreateItineraryTourStatus();
        const shouldStart = !status.hasCompletedCreateItineraryTour;
        if (shouldStart && !isTourRunning) {
          didStartRef.current = true;
          setTimeout(() => {
            startTour();
          }, 600);
        }
      } catch (err) {
        try {
          if (!isTourRunning) {
            didStartRef.current = true;
            setTimeout(() => {
              startTour();
            }, 600);
          }
        } catch {}
      }
    })();
  }, [startTour, isTourRunning]);
  return null;
}

function SiteDetailsBody({
  site,
  isSelected,
  onToggle,
  showAction = true,
  isExpanded = false,
  onToggleDescription,
}) {
  const catName =
    typeof site.category === "object" ? site.category?.name || "" : "";
  const avg =
    typeof site.averageTimeSpent === "number"
      ? site.averageTimeSpent
      : Number(site?.averageTimeSpent);
  const minutes = isNaN(avg) || avg <= 0 ? null : avg;
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

  return (
    <div className="px-6 py-5 sm:px-8 sm:py-6">
      <div className="flex items-center gap-2 mb-3">
        {catName && (
          <span className="inline-flex items-center gap-1.5 bg-orange-100 text-[#f04e37] px-3 py-1 rounded-full text-xs font-semibold">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6h-8l-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zm-6 9H6v-2h8v2zm4-4H6V9h12v2z" />
            </svg>
            {catName}
          </span>
        )}
        {minutes !== null && (
          <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8v5h4v-2h-2V8h-2zm0-6a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
            Avg visit: {minutes} min
          </span>
        )}
        {(site.openingTime || site.closingTime) && (
          <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8v5h4v-2h-2V8h-2zm0-6a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
            Open {fmtTime(site.openingTime)} • Close {fmtTime(site.closingTime)}
          </span>
        )}
      </div>

      <div className="text-sm text-gray-700">
        {site.siteDescription ? (
          <p className="leading-relaxed">
            {site.siteDescription.split("\n\n")[0].trim()}
          </p>
        ) : (
          <p className="text-gray-400 italic">No description available</p>
        )}
      </div>

      {showAction && (
        <div className="mt-5 flex gap-2">
          <button
            onClick={onToggle}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition ${
              isSelected
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gradient-to-r from-[#f04e37] to-orange-600 hover:shadow-md"
            }`}
          >
            {isSelected ? (
              <>
                <FaCheck className="text-sm" /> Added to Itinerary
              </>
            ) : (
              <>
                <FaPlus className="text-sm" /> Add to Itinerary
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
