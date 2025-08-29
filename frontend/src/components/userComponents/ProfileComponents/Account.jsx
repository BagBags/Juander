import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

export default function Account() {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    authProvider: "local",
  });

  const [errors, setErrors] = useState({});
  const [changePassword, setChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const token = localStorage.getItem("token");

  // fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser((u) => ({
          ...u,
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
          email: res.data.email || "",
          authProvider: res.data.authProvider || "local",
          password: "",
          confirmPassword: "",
        }));
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // basic handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validate = () => {
    const newErrors = {};

    if (!user.firstName.trim()) newErrors.firstName = "First name is required";
    if (!user.lastName.trim()) newErrors.lastName = "Last name is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user.email) newErrors.email = "Email is required";
    else if (!emailRegex.test(user.email)) newErrors.email = "Invalid email";

    if (user.authProvider === "local" && changePassword) {
      if (!user.password) newErrors.password = "Password is required";
      else if (!passwordRegex.test(user.password))
        newErrors.password =
          "At least 8 chars, 1 uppercase, 1 number, 1 special character";

      if (!user.confirmPassword)
        newErrors.confirmPassword = "Please confirm your password";
      else if (user.password !== user.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const isFormValidForSubmit = () => {
    const v = validate();
    return Object.keys(v).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
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
        "http://localhost:5000/api/auth/account",
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

      setChangePassword(false);
      setShowPassword(false);
      setShowConfirm(false);
      setErrors({});
      alert("Profile updated!");
    } catch (err) {
      console.error("Update error:", err);
      const message = err.response?.data?.message || "Failed to update profile";
      alert(message);
    } finally {
      setLoading(false);
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
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                name="firstName"
                value={user.firstName}
                onChange={handleChange}
                placeholder="Juan"
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
                Last Name
              </label>
              <input
                name="lastName"
                value={user.lastName}
                onChange={handleChange}
                placeholder="Dela Cruz"
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

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={user.email}
                onChange={handleChange}
                placeholder="juan@example.com"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                  errors.email
                    ? "border-red-400 focus:ring-red-500"
                    : "focus:ring-2 focus:ring-[#cf3325]"
                }`}
                disabled={loading || user.authProvider === "google"} // 👈 lock email if Google
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password section */}
            {user.authProvider === "local" ? (
              <>
                {/* Change password toggle */}
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
                    Change Password
                  </label>
                </div>

                {/* Password fields */}
                {changePassword && (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={user.password}
                        onChange={handleChange}
                        placeholder="New password"
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
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                      {errors.password && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.password}
                        </p>
                      )}
                      {!errors.password && changePassword && (
                        <p className="text-xs text-gray-500 mt-1">
                          At least 8 chars, 1 uppercase, 1 number, 1 special
                          char
                        </p>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={user.confirmPassword}
                        onChange={handleChange}
                        placeholder="Retype new password"
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
                            ? "Hide confirm password"
                            : "Show confirm password"
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
                This account uses Google login. Email and Password cannot be
                changed here.
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        <p className="mt-20 text-xs text-center text-[#cf3325] opacity-70">
          ©2025 Intramuros Administration
        </p>
      </div>
    </motion.div>
  );
}
