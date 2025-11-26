import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useTranslation } from "react-i18next";
import NotificationModal from "../../shared/NotificationModal";
import { getAge } from "../../../utils/age";
import PullToRefresh from "../../shared/PullToRefresh";

export default function Birthday() {
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);

  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");
  const [year, setYear] = useState("");
  const [parentalConsent, setParentalConsent] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    autoClose: false,
    autoCloseDuration: 2000,
  });

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Calculate max days in selected month (handles leap years)
  const getDaysInMonth = (monthShort, year) => {
    if (!monthShort) return 31;
    const monthIndex = months.indexOf(monthShort);
    if (monthIndex === -1) return 31;
    
    // Use provided year or current year for leap year calculation
    const yearToUse = year || new Date().getFullYear();
    return new Date(yearToUse, monthIndex + 1, 0).getDate();
  };

  // Fetch birthday on mount
  useEffect(() => {
    const fetchBirthday = async () => {
      try {
        const token =
          sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) return;

        const { data } = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (data?.birthday) {
          const d = new Date(data.birthday);
          setMonth(months[d.getMonth()]);
          setDate(d.getDate().toString());
          setYear(d.getFullYear().toString());
        }
      } catch (err) {
        console.error("Error fetching birthday:", err.response?.data || err);
      }
    };

    fetchBirthday();
  }, []);

  const handleSave = async () => {
    try {
      const token =
        sessionStorage.getItem("token") || localStorage.getItem("token");

      if (!token) {
        setNotification({
          isOpen: true,
          type: "warning",
          title: t("notLoggedIn"),
          message: t("pleaseLoginToContinue") || "Please log in to continue.",
          autoClose: true,
          autoCloseDuration: 2000,
        });
        return;
      }

      if (!month || !date || !year) {
        setNotification({
          isOpen: true,
          type: "warning",
          title: t("completeAllFields"),
          message: t("fillOutAllFields") || "Fill out all fields.",
          autoClose: true,
          autoCloseDuration: 2000,
        });
        return;
      }

      // Validate date is valid for selected month
      const maxDays = getDaysInMonth(month, year);
      const dateNum = parseInt(date, 10);
      if (dateNum < 1 || dateNum > maxDays) {
        setNotification({
          isOpen: true,
          type: "warning",
          title: t("invalidDate") || "Invalid Date",
          message: `${month} only has ${maxDays} days. Please select a valid date.`,
          autoClose: true,
          autoCloseDuration: 3000,
        });
        return;
      }

      // Age check
      const age = getAge(year, months.indexOf(month), parseInt(date,10));
      if (age < 13) {
        setNotification({
          isOpen: true,
          type: "error",
          title: "Minimum age 13",
          message: "Users must be at least 13 years old.",
          autoClose: true,
          autoCloseDuration: 3000,
        });
        return;
      }
      if (age < 18 && !parentalConsent) {
        setNotification({
          isOpen: true,
          type: "warning",
          title: "Parental consent required",
          message: "Users aged 13-17 must have parental consent.",
          autoClose: true,
          autoCloseDuration: 3000,
        });
        return;
      }

      const { data } = await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/auth/birthday`,
        { month, date, year, parentalConsent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Birthday saved:", data);
      setNotification({
        isOpen: true,
        type: "success",
        title: t("birthdaySavedSuccess"),
        message: "",
        autoClose: true,
        autoCloseDuration: 2000,
      });
    } catch (err) {
      console.error(
        "Error saving birthday:",
        err.response?.data || err.message
      );
      setNotification({
        isOpen: true,
        type: "error",
        title: t("birthdaySaveFailed"),
        message: err.response?.data?.message || "",
      });
    }
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-full bg-white overflow-hidden"
    >
      <PullToRefresh onRefresh={async () => { setRefreshKey((prev) => prev + 1); await new Promise((r) => setTimeout(r, 1000)); }}>
      <div className="w-full max-w-md mt-6 flex flex-col gap-6 min-h-full" key={refreshKey}>
        <h2 className="text-lg font-semibold text-center">
          {t("dobQuestion")}
        </h2>

        <div className="flex justify-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-[#cf3325]"
          >
            <option value="">{t("month")}</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder={t("date")}
            min="1"
            max={month ? getDaysInMonth(month, year) : 31}
            value={date}
            onChange={(e) => {
              const value = e.target.value;
              const maxDays = month ? getDaysInMonth(month, year) : 31;
              // Only allow values within valid range
              if (value === "" || (parseInt(value, 10) >= 1 && parseInt(value, 10) <= maxDays)) {
                setDate(value);
              }
            }}
            className="border border-gray-300 rounded-md px-3 py-2 w-20 text-center focus:outline-none focus:ring-2 focus:ring-[#cf3325]"
          />

          <input
            type="number"
            placeholder={t("year")}
            min="1900"
            max={new Date().getFullYear()}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-28 text-center focus:outline-none focus:ring-2 focus:ring-[#cf3325]"
          />
        </div>

        {/* Parental consent checkbox */}
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={parentalConsent}
            onChange={(e)=>setParentalConsent(e.target.checked)}
            className="mt-1 w-4 h-4 text-[#cf3325] border-gray-300 rounded focus:ring-[#cf3325] focus:ring-2"
          />
          <span> I have parental consent to use this application (required if you are 13-17&nbsp;years&nbsp;old).</span>
        </label>

        <button
          className="mt-4 bg-[#cf3325] hover:bg-[#b42c21] transition text-white py-3 rounded-xl font-semibold w-full"
          onClick={handleSave}
        >
          {t("save")}
        </button>
      <p className="mt-auto mb-8 text-xs text-center text-gray-400">
        © {new Date().getFullYear()} {t("intramurosAdmin")}. Developed by UST
        College of Information and Computing Sciences.
      </p>
      </div>
      </PullToRefresh>
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoClose={notification.autoClose}
        autoCloseDuration={notification.autoCloseDuration}
      />
    </motion.div>
  );
}
