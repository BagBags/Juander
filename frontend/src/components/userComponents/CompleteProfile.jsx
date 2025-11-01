import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
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
  });
  const [countrySearch, setCountrySearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    });
  }, [navigate]);

  const handleNext = async () => {
    setError("");
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");

      // Validation and save for each step
      if (step === 1) {
        if (!formData.firstName || !formData.lastName) {
          setError("Please enter your first and last name");
          setLoading(false);
          return;
        }
        // Save name immediately (include email as required by endpoint)
        await axios.put(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/account`, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: currentUser.email, // Required by endpoint
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (step === 2) {
        if (!formData.birthday.month || !formData.birthday.date || !formData.birthday.year) {
          setError("Please select your complete birthday");
          setLoading(false);
          return;
        }
        // Save birthday immediately (convert date and year to integers)
        // Convert full month name to short format (e.g., "January" -> "Jan")
        const monthShort = formData.birthday.month.substring(0, 3);
        const birthdayPayload = {
          month: monthShort,
          date: parseInt(formData.birthday.date, 10),
          year: parseInt(formData.birthday.year, 10),
        };
        console.log("Sending birthday payload:", birthdayPayload);
        await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/birthday`, birthdayPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (step === 3) {
        if (!formData.gender) {
          setError("Please select your gender");
          setLoading(false);
          return;
        }
        // Save gender immediately
        await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/gender`, { gender: formData.gender }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (step === 4) {
        if (!formData.country) {
          setError("Please select your country");
          setLoading(false);
          return;
        }
        // Save country and complete profile
        await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/country`, { country: formData.country }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Mark profile as completed
        await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/complete-profile`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch updated user data
        const userRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

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
      }
    } catch (err) {
      console.error("Error saving data:", err);
      console.error("Error details:", err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

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
          <p className="text-center text-sm text-gray-600">
            Step {step} of 4
          </p>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Help us personalize your experience
          </p>
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
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
                placeholder="Enter your last name"
              />
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
                  onChange={(e) => setFormData({
                    ...formData,
                    birthday: { ...formData.birthday, month: e.target.value }
                  })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
                >
                  <option value="">Month</option>
                  {months.map((month, idx) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day
                </label>
                <select
                  value={formData.birthday.date}
                  onChange={(e) => setFormData({
                    ...formData,
                    birthday: { ...formData.birthday, date: e.target.value }
                  })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
                >
                  <option value="">Day</option>
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={formData.birthday.year}
                  onChange={(e) => setFormData({
                    ...formData,
                    birthday: { ...formData.birthday, year: e.target.value }
                  })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
                >
                  <option value="">Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
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
                { label: "Male", icon: <FaMars className="text-blue-600 text-xl" /> },
                { label: "Female", icon: <FaVenus className="text-pink-500 text-xl" /> },
                { label: "Other", icon: <FaGenderless className="text-purple-500 text-xl" /> }
              ].map((gender) => (
                <button
                  key={gender.label}
                  onClick={() => setFormData({ ...formData, gender: gender.label })}
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

            {/* Selected Country Display */}
            {formData.country && (
              <div className="text-center text-sm text-gray-600 mt-3">
                Selected: <span className="font-medium text-[#f04e37]">{formData.country}</span>
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
            disabled={loading}
            className="flex-1 px-6 py-3 bg-[#f04e37] text-white rounded-lg hover:bg-[#b42c21] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : step === 4 ? "Complete Profile" : "Next"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
