import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import Swal from "sweetalert2";

export default function RolesPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const confirmRoleChange = (id, newRole) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to change this user's role to "${newRole}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f04e37",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, change it",
    }).then((result) => {
      if (result.isConfirmed) {
        handleRoleChange(id, newRole);
      }
    });
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/admin/users/${id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) =>
        prev.map((user) =>
          user._id === id ? { ...user, role: newRole } : user
        )
      );

      Swal.fire("Updated!", "User role has been changed.", "success");
    } catch (err) {
      console.error("Error updating role:", err);
      Swal.fire("Error!", "There was a problem updating the role.", "error");
    }
  };

  // ✅ Search filter
  const filteredUsers = users.filter((user) => {
    const searchTerm = search.toLowerCase();
    return Object.values(user).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm)
    );
  });

  // ✅ Sorting logic
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let valA = a[sortConfig.key] ?? "";
    let valB = b[sortConfig.key] ?? "";

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // ✅ Formatters
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatName = (name) => {
    if (!name) return "—";
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatLanguage = (lang) => {
    if (!lang) return "—";
    const map = { en: "English", tl: "Filipino" };
    return map[lang] || lang;
  };

  const isSuperAdmin = currentUser?.email === "aaronbagain@gmail.com";

  // ✅ Helper for header with sort arrows
  const renderSortableHeader = (label, key) => {
    const isActive = sortConfig.key === key;

    return (
      <th
        onClick={() => requestSort(key)}
        className="px-6 py-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-1">
          {label}
          <span className="flex flex-col leading-none">
            <ChevronUp
              size={12}
              className={`${
                isActive && sortConfig.direction === "asc"
                  ? "text-white"
                  : "text-gray-300"
              }`}
            />
            <ChevronDown
              size={12}
              className={`-mt-1 ${
                isActive && sortConfig.direction === "desc"
                  ? "text-white"
                  : "text-gray-300"
              }`}
            />
          </span>
        </div>
      </th>
    );
  };

  return (
    <section>
      <h1 className="text-4xl font-bold text-[#f04e37] mb-2">
        Manage User Roles
      </h1>
      <p className="text-gray-600 mb-6">
        Total Users:{" "}
        <span className="font-semibold">{filteredUsers.length}</span>
      </p>

      {/* ✅ Search bar */}
      <div className="relative mb-6 w-full sm:w-1/3">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by name, last name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#f04e37] focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-[#f04e37] text-white">
              <tr>
                <th className="px-6 py-3">#</th>
                {renderSortableHeader("First Name", "firstName")}
                {renderSortableHeader("Last Name", "lastName")}
                {renderSortableHeader("Email", "email")}
                {renderSortableHeader("Role", "role")}
                <th className="px-6 py-3">Action</th>
                {renderSortableHeader("Country", "country")}
                {renderSortableHeader("Language", "language")}
                {renderSortableHeader("Gender", "gender")}
                {renderSortableHeader("Birthday", "birthday")}
                {renderSortableHeader("Date Created", "createdAt")}
                {renderSortableHeader("Last Updated", "updatedAt")}
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user, idx) => (
                <tr
                  key={user._id}
                  className={`${
                    idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-orange-50 transition`}
                >
                  <td className="px-6 py-3 text-gray-800">{idx + 1}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">
                    {formatName(user.firstName)}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-800">
                    {formatName(user.lastName)}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{user.email}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold mr-2 ${
                        user.role === "admin"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {user.email === "aaronbagain@gmail.com" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Super
                      </span>
                    ) : isSuperAdmin ? (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          confirmRoleChange(user._id, e.target.value)
                        }
                        className="border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-[#f04e37]"
                      >
                        <option value="tourist">Tourist</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <select
                        value={user.role}
                        disabled
                        className="border rounded-lg px-3 py-1 text-sm bg-gray-100 text-gray-400"
                      >
                        <option>{user.role}</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {user.country || "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {formatLanguage(user.language)}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {user.gender || "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {user.birthday ? formatDate(user.birthday) : "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {user.createdAt ? formatDate(user.createdAt) : "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {user.updatedAt ? formatDate(user.updatedAt) : "—"}
                  </td>
                </tr>
              ))}
              {sortedUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="12"
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
