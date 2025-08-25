import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

export default function Account() {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const token = localStorage.getItem("token"); // stored at login

  // Fetch user details on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser({
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
          email: res.data.email || "",
          password: "", // don’t expose password
        });
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    if (token) fetchUser();
  }, [token]);

  // Handle input changes
  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.type === "password" ? "password" : e.target.name]:
        e.target.value,
    });
  };

  // Handle submit (update user details)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        "http://localhost:5000/api/auth/account",
        user,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // update localStorage
      const updatedUser = res.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Update local state
      setUser({
        ...updatedUser,
        password: "",
      });

      alert("Profile updated!");
    } catch (err) {
      console.error("Update error:", err);

      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message); // Show backend message like "Email already in use"
      } else {
        alert("Failed to update profile");
      }
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={user.firstName}
                onChange={handleChange}
                placeholder="Juan"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cf3325]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={user.lastName}
                onChange={handleChange}
                placeholder="Dela Cruz"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cf3325]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                placeholder="juan@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cf3325]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={user.password}
                onChange={handleChange}
                placeholder="********"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cf3325]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#cf3325] text-white font-semibold py-3 rounded-xl shadow-md hover:bg-[#b42c21] transition"
            >
              Save Changes
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
