import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Calendar, Users, Globe, Check } from "lucide-react";
import { FaMars, FaVenus, FaGenderless } from "react-icons/fa";
import { countries } from "countries-list";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthday: { month: "", date: "", year: "" },
    gender: "",
    country: "",
    parentalConsent: false,
  });
  const [countrySearch, setCountrySearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/login");
      return;
    }
    setCurrentUser(user);

    // Pre-fill existing data
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      birthday: { month: "", date: "", year: "" },
      gender: user.gender || "",
      country: user.country || "",
      parentalConsent: false,
    });
  }, [navigate]);

  // Helper: allow valid name characters (letters, numbers, spaces, hyphens, apostrophes)
  const validateNameInput = (val) => /^[\p{L}0-9\s'-]*$/u.test(val);

  // Validation helpers
  const isValidName = (name) => {
    const trimmed = name.trim();
    const nameRegex = /^[\p{L}\s'-]+$/u;
    const repeatedCharRegex = /(.)\1{2,}/;
    const hasTriple = (str) =>
      str.split(/\s+/).some((w) => repeatedCharRegex.test(w));
    const invalidCharRegex = /[!@#$%^&*()_+=[\]{};:"\\|,.<>/?~`]+/;
    return (
      trimmed &&
      nameRegex.test(trimmed) &&
      trimmed.length >= 2 &&
      trimmed.length <= 50 &&
      !hasTriple(trimmed) &&
      !invalidCharRegex.test(trimmed) &&
      !isProfaneText(trimmed)
    );
  };

  const handleNext = async () => {
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Validation and save for each step
      if (step === 1) {
        // Name validation logic similar to signup
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const nextErrors = {};
        if (!firstName) nextErrors.firstName = "First name is required";
        if (!lastName) nextErrors.lastName = "Last name is required";
        if (!nextErrors.firstName && isProfaneText(firstName))
          nextErrors.firstName = "No badwords allowed";
        if (!nextErrors.lastName && isProfaneText(lastName))
          nextErrors.lastName = "No badwords allowed";
        if (!nextErrors.firstName && !isValidName(firstName))
          nextErrors.firstName = "Invalid first name";
        if (!nextErrors.lastName && !isValidName(lastName))
          nextErrors.lastName = "Invalid last name";
        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
          setLoading(false);
          return;
        }
        // Save name immediately (include email as required by endpoint)
        await axios.put(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/auth/account`,
          {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: currentUser.email, // Required by endpoint
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (step === 2) {
        const nextErrors = {};
        if (!formData.birthday.month)
          nextErrors.birthdayMonth = "Month is required";
        if (!formData.birthday.date)
          nextErrors.birthdayDate = "Day is required";
        if (!formData.birthday.year)
          nextErrors.birthdayYear = "Year is required";
        // Save birthday immediately (convert date and year to integers)
        // Convert full month name to short format (e.g., "January" -> "Jan")
        const monthShort = formData.birthday.month.substring(0, 3);
        const ageCalc = () => {
          const yr = parseInt(formData.birthday.year, 10);
          const mnIdx = months.indexOf(formData.birthday.month);
          const dt = parseInt(formData.birthday.date, 10);
          if (isNaN(yr) || mnIdx < 0 || isNaN(dt)) return null;
          const today = new Date();
          let age = today.getFullYear() - yr;
          const m = today.getMonth() - mnIdx;
          if (m < 0 || (m === 0 && today.getDate() < dt)) age--;
          return age;
        };
        const age = ageCalc();
        if (age !== null && age < 18 && !formData.parentalConsent) {
          nextErrors.parentalConsent = "Parental consent is required";
        }
        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
          setLoading(false);
          return;
        }
        const birthdayPayload = {
          month: monthShort,
          date: parseInt(formData.birthday.date, 10),
          year: parseInt(formData.birthday.year, 10),
          parentalConsent: formData.parentalConsent,
        };
        console.log("Sending birthday payload:", birthdayPayload);
        await axios.post(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/auth/birthday`,
          birthdayPayload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (step === 3) {
        const age = new Date().getFullYear() - formData.birthday.year;
        if (age < 13) {
          setError(
            "Sorry, you must be at least 13 years old to use Juander. You will be logged out."
          );
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setLoading(false);
          setTimeout(() => navigate("/"), 1500);
          return;
        }
        if (!formData.gender) {
          setFieldErrors({ gender: "Please select a gender" });
          setLoading(false);
          return;
        }
        // Save gender immediately
        await axios.post(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/auth/gender`,
          { gender: formData.gender },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (step === 4) {
        if (!formData.country) {
          setFieldErrors({ country: "Country is required" });
          setLoading(false);
          return;
        }
        // Save country and complete profile
        await axios.post(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/auth/country`,
          { country: formData.country },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Mark profile as completed
        await axios.post(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/auth/complete-profile`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Fetch updated user data
        const userRes = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Update local storage
        const updatedUser = {
          ...userRes.data,
          profileCompleted: true,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("storage"));

        // Navigate to homepage
        navigate("/Homepage");
        return;
      }

      // Move to next step
      if (step < 4) {
        setStep(step + 1);
        setFieldErrors({});
      }
    } catch (err) {
      console.error("Error saving data:", err);
      console.error("Error details:", err.response?.data);
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Failed to save. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Calculate max days in selected month (handles leap years)
  const getDaysInMonth = (month, year) => {
    if (!month) return 31;
    const monthIndex = months.indexOf(month);
    if (monthIndex === -1) return 31;

    // Use provided year or current year for leap year calculation
    const yearToUse = year || new Date().getFullYear();
    return new Date(yearToUse, monthIndex + 1, 0).getDate();
  };

  const maxDays = getDaysInMonth(
    formData.birthday.month,
    formData.birthday.year
  );

  // Disable logic helpers
  const invalidNames = !(
    isValidName(formData.firstName) && isValidName(formData.lastName)
  );
  // Detect if user is minor (<18)
  const ageNeedsConsent = () => {
    const { month, year, date } = formData.birthday;
    if (!month || !year || !date) return false;
    const yr = parseInt(year, 10);
    const mnIdx = months.indexOf(month);
    const dt = parseInt(date, 10);
    if (isNaN(yr) || mnIdx < 0 || isNaN(dt)) return false;
    const today = new Date();
    let age = today.getFullYear() - yr;
    const m = today.getMonth() - mnIdx;
    if (m < 0 || (m === 0 && today.getDate() < dt)) age--;
    return age < 18;
  };
  const minorNeedsConsent = ageNeedsConsent() && !formData.parentalConsent;
  const disableNext =
    loading ||
    (step === 1 && invalidNames) ||
    (step === 2 &&
      (!formData.birthday.month ||
        !formData.birthday.date ||
        !formData.birthday.year ||
        minorNeedsConsent)) ||
    (step === 3 && !formData.gender) ||
    (step === 4 && !formData.country);
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);
  const years = Array.from({ length: 2012 - 1902 + 1 }, (_, i) => 2012 - i);

  // Filtered country list
  const countryArray = Object.entries(countries)
    .map(([code, info]) => ({ code, name: info.name }))
    .filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full border border-gray-100"
      >
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-1/4 h-2 rounded-full mx-1 transition-all ${
                  s <= step ? "bg-[#f04e37]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-600">Step {step} of 4</p>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">Help us personalize your experience</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-50 p-3 rounded-full">
                <User className="text-[#f04e37]" size={24} />
              </div>
              <h2 className="text-xl font-semibold">What's your name?</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!validateNameInput(val)) return;
                  setFormData({ ...formData, firstName: val });
                  const msg = isProfaneText(val.trim())
                    ? "No badwords allowed"
                    : undefined;
                  setFieldErrors((prev) => ({ ...prev, firstName: msg }));
                }}
                maxLength={50}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
                placeholder="Enter your first name"
              />
              {fieldErrors.firstName && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.firstName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!validateNameInput(val)) return;
                  setFormData({ ...formData, lastName: val });
                  const msg = isProfaneText(val.trim())
                    ? "No badwords allowed"
                    : undefined;
                  setFieldErrors((prev) => ({ ...prev, lastName: msg }));
                }}
                maxLength={50}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
                placeholder="Enter your last name"
              />
              {fieldErrors.lastName && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Birthday */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-50 p-3 rounded-full">
                <Calendar className="text-[#f04e37]" size={24} />
              </div>
              <h2 className="text-xl font-semibold">When's your birthday?</h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month
                </label>
                <select
                  value={formData.birthday.month}
                  onChange={(e) => {
                    const newMonth = e.target.value;
                    const newMaxDays = getDaysInMonth(
                      newMonth,
                      formData.birthday.year
                    );
                    // Reset date if current date is invalid for new month
                    const newDate =
                      formData.birthday.date > newMaxDays
                        ? ""
                        : formData.birthday.date;
                    setFormData({
                      ...formData,
                      birthday: {
                        ...formData.birthday,
                        month: newMonth,
                        date: newDate,
                      },
                    });
                    if (fieldErrors.birthdayMonth)
                      setFieldErrors((prev) => ({
                        ...prev,
                        birthdayMonth: undefined,
                      }));
                  }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
                >
                  <option value="" disabled>
                    Month
                  </option>
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                {fieldErrors.birthdayMonth && (
                  <p className="text-red-500 text-xs mt-1">
                    {fieldErrors.birthdayMonth}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day
                </label>
                <select
                  value={formData.birthday.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      birthday: { ...formData.birthday, date: e.target.value },
                    })
                  }
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
                >
                  <option value="" disabled>
                    Day
                  </option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                {fieldErrors.birthdayDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {fieldErrors.birthdayDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={formData.birthday.year}
                  onChange={(e) => {
                    const newYear = e.target.value;
                    const newMaxDays = getDaysInMonth(
                      formData.birthday.month,
                      newYear
                    );
                    // Reset date if current date is invalid for new year (leap year check)
                    const newDate =
                      formData.birthday.date > newMaxDays
                        ? ""
                        : formData.birthday.date;
                    setFormData({
                      ...formData,
                      birthday: {
                        ...formData.birthday,
                        year: newYear,
                        date: newDate,
                      },
                    });
                    if (fieldErrors.birthdayYear)
                      setFieldErrors((prev) => ({
                        ...prev,
                        birthdayYear: undefined,
                      }));
                  }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
                >
                  <option value="" disabled>
                    Year
                  </option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {fieldErrors.birthdayYear && (
                  <p className="text-red-500 text-xs mt-1">
                    {fieldErrors.birthdayYear}
                  </p>
                )}
              </div>
            </div>

            {/* Parental consent checkbox */}
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.parentalConsent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parentalConsent: e.target.checked,
                  })
                }
                className="mt-1 w-4 h-4 text-[#f04e37] border-gray-300 rounded focus:ring-[#f04e37] focus:ring-2"
              />
              <span>
                I have parental consent to use this application (required if you
                are 13-17&nbsp;years&nbsp;old).
              </span>
            </label>
            {fieldErrors.parentalConsent && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.parentalConsent}
              </p>
            )}
          </motion.div>
        )}

        {/* Step 3: Gender */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-50 p-3 rounded-full">
                <Users className="text-[#f04e37]" size={24} />
              </div>
              <h2 className="text-xl font-semibold">What's your gender?</h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: "Male",
                  icon: <FaMars className="text-blue-600 text-xl" />,
                },
                {
                  label: "Female",
                  icon: <FaVenus className="text-pink-500 text-xl" />,
                },
                {
                  label: "Other",
                  icon: <FaGenderless className="text-purple-500 text-xl" />,
                },
              ].map((gender) => (
                <button
                  key={gender.label}
                  onClick={() =>
                    setFormData({ ...formData, gender: gender.label })
                  }
                  className={`w-full px-6 py-4 rounded-lg border-2 transition-all ${
                    formData.gender === gender.label
                      ? "border-[#f04e37] bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{gender.label}</span>
                    {gender.icon}
                  </div>
                </button>
              ))}
              {fieldErrors.gender && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.gender}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4: Country */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-50 p-3 rounded-full">
                <Globe className="text-[#f04e37]" size={24} />
              </div>
              <h2 className="text-xl font-semibold">Where are you from?</h2>
            </div>

            {/* Search Input */}
            <div>
              <input
                type="text"
                placeholder="Search country..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent mb-3"
              />
            </div>

            {/* Country List */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {countryArray.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setFormData({ ...formData, country: c.name })}
                  className={`w-full flex items-center justify-between px-4 py-3 border-b transition ${
                    formData.country === c.name
                      ? "bg-red-50 border-[#f04e37]"
                      : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <img
                      src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                      alt={`${c.name} flag`}
                      className="w-6 h-4 object-cover rounded-sm"
                    />
                    <span className="text-sm">{c.name}</span>
                  </span>
                  {formData.country === c.name && (
                    <Check className="text-[#f04e37]" size={18} />
                  )}
                </button>
              ))}
            </div>
            {fieldErrors.country && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.country}</p>
            )}

            {/* Selected Country Display */}
            {formData.country && (
              <div className="text-center text-sm text-gray-600 mt-3">
                Selected:{" "}
                <span className="font-medium text-[#f04e37]">
                  {formData.country}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={disableNext}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all
              ${
                disableNext
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#f04e37] text-white hover:bg-[#b42c21]"
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : step === 4 ? (
              "Complete Profile"
            ) : (
              "Next"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const TAGALOG_BAD_WORDS = [
  "putangina",
  "putang ina",
  "putang-ina",
  "puta",
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
  "shit",
  "fuck",
  "bitch",
  "asshole",
  "dick",
  "cunt",
  "bastard",
  "slut",
  "whore",
];
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
  for (const w of TAGALOG_BAD_WORDS) {
    const wn = normalizeProfanity(w);
    if (normalized.includes(wn)) return true;
  }
  return false;
};
