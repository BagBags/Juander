import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Eye, EyeOff, AlertTriangle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    authProvider: "local",
  });
  const [originalEmail, setOriginalEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [otpMessage, setOtpMessage] = useState("");
  const otpRefs = useRef([]);
  const otpLength = 6;

  const [errors, setErrors] = useState({});
  const [changePassword, setChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Deactivation states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [deactivating, setDeactivating] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser({
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
          email: res.data.email || "",
          authProvider: res.data.authProvider || "local",
          password: "",
          confirmPassword: "",
        });
        setOriginalEmail(res.data.email || "");
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // OTP countdown
  useEffect(() => {
    if (otpStep && otpTimeLeft > 0) {
      const timer = setInterval(() => setOtpTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [otpStep, otpTimeLeft]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${mins}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Input handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSuccessMessage("");
  };

  const handleOtpChange = (value, index) => {
    if (/^\d$/.test(value)) {
      const newOtp = otp.split("");
      newOtp[index] = value;
      setOtp(newOtp.join(""));
      if (index < otpLength - 1) otpRefs.current[index + 1]?.focus();
    } else if (value === "") {
      const newOtp = otp.split("");
      newOtp[index] = "";
      setOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d+$/.test(pasteData)) {
      const digits = pasteData.split("").slice(0, otpLength);
      setOtp(digits.join(""));
      digits.forEach((d, i) => {
        if (otpRefs.current[i]) otpRefs.current[i].value = d;
      });
      otpRefs.current[digits.length]?.focus();
    }
  };

  const sendEmailOtp = async () => {
    if (!user.email) {
      setOtpMessage(t("enterNewEmailFirst"));
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/send-email-verification-otp`,
        { email: user.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOtpStep(true);
      setOtpTimeLeft(600);
      setOtpSent(true);
      setOtpMessage(t("otpSentToNewEmail"));
    } catch (err) {
      console.error(err);
      setOtpMessage(err.response?.data?.message || t("otpSendFailed"));
    }
  };

  const verifyEmailOtp = async () => {
    if (!otp || otp.length < otpLength) {
      setOtpMessage(t("enterFullOtp"));
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/verify-email-otp`,
        { otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOtpStep(false);
      setOtp("");
      setOtpTimeLeft(0);
      setOtpSent(false);
      setOtpMessage(t("emailVerified"));
      await handleSubmitEmailChange();
    } catch (err) {
      console.error(err);
      setOtpMessage(err.response?.data?.message || t("otpVerificationFailed"));
    }
  };

  const handleSubmitEmailChange = async () => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/account`,
        { email: user.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = res.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setOriginalEmail(updatedUser.email);
    } catch (err) {
      console.error(err);
      setOtpMessage(err.response?.data?.message || t("emailUpdateFailed"));
    }
  };

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validate = () => {
    const newErrors = {};
    if (!user.firstName.trim()) newErrors.firstName = t("firstNameRequired");
    if (!user.lastName.trim()) newErrors.lastName = t("lastNameRequired");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user.email) newErrors.email = t("emailRequired");
    else if (!emailRegex.test(user.email)) newErrors.email = t("invalidEmail");

    if (user.authProvider === "local" && changePassword) {
      if (!user.password) newErrors.password = t("passwordRequired");
      else if (!passwordRegex.test(user.password))
        newErrors.password = t("passwordFormat");
      if (!user.confirmPassword)
        newErrors.confirmPassword = t("confirmPasswordRequired");
      else if (user.password !== user.confirmPassword)
        newErrors.confirmPassword = t("passwordsDoNotMatch");
    }
    return newErrors;
  };

  const isFormValidForSubmit = () => Object.keys(validate()).length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (user.email !== originalEmail && !otpStep && !otpSent) {
      setOtpMessage(t("verifyEmailBeforeSaving"));
      return;
    }
    if (user.email !== originalEmail && otpStep) {
      setOtpMessage(t("completeOtpBeforeSaving"));
      return;
    }

    try {
      setLoading(true);
      const payload = {
        firstName: user.firstName.trim(),
        lastName: user.lastName.trim(),
        email: user.email.trim(),
      };
      if (user.authProvider === "local" && changePassword && user.password) {
        payload.password = user.password;
      }

      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/account`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = res.data.user || res.data;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser({
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        email: updatedUser.email || "",
        password: "",
        confirmPassword: "",
        authProvider: updatedUser.authProvider || "local",
      });
      setOriginalEmail(updatedUser.email || "");
      setChangePassword(false);
      setShowPassword(false);
      setShowConfirm(false);
      setErrors({});
      setSuccessMessage(t("profileUpdated"));
      setOtpMessage("");
    } catch (err) {
      console.error("Update error:", err);
      setOtpMessage(err.response?.data?.message || t("profileUpdateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (confirmationText !== "DELETE") {
      alert("Please type DELETE to confirm account deactivation");
      return;
    }

    setDeactivating(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/deactivate-account`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { confirmationText },
        }
      );

      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Redirect to home
      alert("Your account has been successfully deactivated. All your itineraries and reviews have been deleted.");
      navigate("/");
    } catch (err) {
      console.error("Deactivation error:", err);
      alert(err.response?.data?.message || "Failed to deactivate account");
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white flex flex-col items-center text-sm relative px-4 md:px-0"
    >
      <div className="w-full max-w-md">
        <div className="mt-4 w-full bg-white rounded-2xl p-6 shadow-md">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {successMessage && (
              <p className="text-green-600 text-sm mb-2">{successMessage}</p>
            )}

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("firstName")}
              </label>
              <input
                name="firstName"
                value={user.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                  errors.firstName
                    ? "border-red-400 focus:ring-red-500"
                    : "focus:ring-2 focus:ring-[#cf3325]"
                }`}
                disabled={loading}
              />
              {errors.firstName && (
                <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("lastName")}
              </label>
              <input
                name="lastName"
                value={user.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                  errors.lastName
                    ? "border-red-400 focus:ring-red-500"
                    : "focus:ring-2 focus:ring-[#cf3325]"
                }`}
                disabled={loading}
              />
              {errors.lastName && (
                <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
              )}
            </div>

            {/* Email Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("email")}
              </label>
              <input
                name="email"
                type="email"
                value={user.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                  errors.email
                    ? "border-red-400 focus:ring-red-500"
                    : "focus:ring-2 focus:ring-[#cf3325]"
                }`}
                disabled={loading || user.authProvider === "google"}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}

              {/* OTP Section */}
              {user.email !== originalEmail && !otpStep && (
                <>
                  {otpSent ? (
                    <p className="text-green-600 text-sm mt-1">
                      {t("otpSentToNewEmail")}
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="text-sm text-[#cf3325] hover:underline mt-2"
                      onClick={sendEmailOtp}
                    >
                      {t("verifyNewEmail")}
                    </button>
                  )}
                </>
              )}

              {otpStep && (
                <div className="mt-4">
                  <div
                    className="flex justify-center gap-3 flex-wrap"
                    onPaste={handlePaste}
                  >
                    {Array.from({ length: otpLength }).map((_, i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength="1"
                        className="w-12 h-12 border rounded-lg text-center text-lg focus:ring-2 focus:ring-[#cf3325]"
                        value={otp[i] || ""}
                        onChange={(e) => handleOtpChange(e.target.value, i)}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                        ref={(el) => (otpRefs.current[i] = el)}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t("expiresIn")}: {formatTime(otpTimeLeft)}
                  </p>
                  <button
                    type="button"
                    className="w-full bg-[#cf3325] text-white py-2 rounded mt-3 hover:bg-[#b42c21] transition"
                    onClick={verifyEmailOtp}
                  >
                    {t("verifyOtp")}
                  </button>
                  {otpMessage && (
                    <p
                      className={`text-sm mt-2 ${
                        otpMessage.includes("successfully") ||
                        otpMessage.includes("sent")
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {otpMessage}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Password Section */}
            {user.authProvider === "local" ? (
              <>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    id="changePassword"
                    type="checkbox"
                    checked={changePassword}
                    onChange={(e) => {
                      setChangePassword(e.target.checked);
                      setUser((prev) => ({
                        ...prev,
                        password: "",
                        confirmPassword: "",
                      }));
                      setErrors({});
                    }}
                    disabled={loading}
                  />
                  <label
                    htmlFor="changePassword"
                    className="text-sm text-gray-700"
                  >
                    {t("changePassword")}
                  </label>
                </div>
                {changePassword && (
                  <>
                    {/* New Password */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("newPassword")}
                      </label>
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={user.password}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none pr-10 ${
                          errors.password
                            ? "border-red-400 focus:ring-red-500"
                            : "focus:ring-2 focus:ring-[#cf3325]"
                        }`}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-9 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword((s) => !s)}
                        tabIndex={-1}
                        aria-label={
                          showPassword ? t("hidePassword") : t("showPassword")
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                      {errors.password ? (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.password}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          {t("passwordHint")}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("confirmNewPassword")}
                      </label>
                      <input
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={user.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter new password"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none pr-10 ${
                          errors.confirmPassword
                            ? "border-red-400 focus:ring-red-500"
                            : "focus:ring-2 focus:ring-[#cf3325]"
                        }`}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-9 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowConfirm((s) => !s)}
                        tabIndex={-1}
                        aria-label={
                          showConfirm
                            ? t("hideConfirmPassword")
                            : t("showConfirmPassword")
                        }
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-sm mt-2">
                {t("googleAccountNotice")}
              </p>
            )}

            <button
              type="submit"
              disabled={!isFormValidForSubmit() || loading}
              className={`w-full text-white font-semibold py-3 rounded-xl shadow-md transition ${
                !isFormValidForSubmit() || loading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#cf3325] hover:bg-[#b42c21]"
              }`}
            >
              {loading ? t("saving") : t("saveChanges")}
            </button>
          </form>
        </div>

        {/* Deactivate Account Section */}
        <div className="mt-6 w-full bg-white rounded-2xl p-6 shadow-md border-2 border-red-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 mb-2 text-base">
                Deactivate Account
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Permanently delete your account and all associated data. This action cannot be undone.
                All your itineraries and reviews will be permanently deleted.
              </p>
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Trash2 size={18} />
                Deactivate Account
              </button>
            </div>
          </div>
        </div>

        {/* Deactivation Confirmation Modal */}
        {showDeactivateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <h2 className="text-xl font-bold text-gray-800">
                  Confirm Account Deactivation
                </h2>
              </div>

              <div className="mb-6 space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  This action will permanently delete:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                  <li>Your account and profile</li>
                  <li>All your itineraries</li>
                  <li>All your reviews</li>
                  <li>All associated data</li>
                </ul>
                <p className="text-sm font-semibold text-red-600 mt-4">
                  This action cannot be undone!
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={deactivating}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setConfirmationText("");
                  }}
                  disabled={deactivating}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivateAccount}
                  disabled={confirmationText !== "DELETE" || deactivating}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deactivating ? "Deactivating..." : "Deactivate"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <p className="mt-20 text-xs text-center text-[#cf3325] opacity-70">
          ©2025 Intramuros Administration
        </p>
      </div>
    </motion.div>
  );
}
