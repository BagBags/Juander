import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import ConfirmModal from "../../shared/ConfirmModal";
import NotificationModal from "../../shared/NotificationModal";

export default function RolesPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "danger",
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

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
    
    // Add modern custom scrollbar styles
    const style = document.createElement('style');
    style.textContent = `
      .admin-table-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .admin-table-scrollbar::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 8px;
      }
      .admin-table-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #f04e37, #e53e3e);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 2px 4px rgba(240, 78, 55, 0.2);
        transition: all 0.3s ease;
      }
      .admin-table-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #e53e3e, #c53030);
        box-shadow: 0 4px 8px rgba(240, 78, 55, 0.3);
        transform: scale(1.1);
      }
      .admin-table-scrollbar::-webkit-scrollbar-thumb:active {
        background: linear-gradient(135deg, #c53030, #9c2a2a);
        box-shadow: 0 2px 4px rgba(240, 78, 55, 0.4);
      }
      .admin-table-scrollbar::-webkit-scrollbar-corner {
        background: transparent;
      }
      
      /* Modern Firefox scrollbar */
      .admin-table-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #f04e37 transparent;
      }
      
      /* Smooth scrolling behavior */
      .admin-table-scrollbar {
        scroll-behavior: smooth;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/users`, {
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
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/me`, {
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
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/users/${id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) =>
        prev.map((user) =>
          user._id === id ? { ...user, role: newRole } : user
        )
      );

      setNotification({
        isOpen: true,
        type: "success",
        title: "Role Updated",
        message: `User role has been successfully changed to ${newRole}.`,
      });
    } catch (err) {
      console.error("Error updating role:", err);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: "There was a problem updating the role. Please try again.",
      });
    }
  };

  const handleDeleteUser = (user) => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Delete User?",
      message: `WARNING: This action cannot be undone! User "${user.firstName} ${user.lastName}" (${user.email}) will be permanently deleted from the database.`,
      confirmText: "Delete Forever",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          const token = localStorage.getItem("token");
          await axios.delete(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/users/${user._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Remove user from local state
          setUsers((prev) => prev.filter((u) => u._id !== user._id));
          
          // Reset to page 1 if current page becomes empty
          const remainingUsers = users.filter((u) => u._id !== user._id);
          const newTotalPages = Math.ceil(remainingUsers.length / usersPerPage);
          if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(1);
          }

          setConfirmModal({ isOpen: false, type: "danger", title: "", message: "", onConfirm: null, loading: false });
          
          setNotification({
            isOpen: true,
            type: "success",
            title: "User Deleted",
            message: "User has been permanently deleted from the system.",
          });
        } catch (err) {
          console.error("Error deleting user:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
          setNotification({
            isOpen: true,
            type: "error",
            title: "Delete Failed",
            message: err.response?.data?.message || "There was a problem deleting the user. Please try again.",
          });
        }
      },
    });
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

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

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

  const SUPER_ADMIN_EMAILS = [
    "aaronbagain@gmail.com",
    "sophiamikhaela.fabian.cics@ust.edu.ph",
    "juander714@gmail.com"
  ];
  
  const isSuperAdmin = currentUser?.email && SUPER_ADMIN_EMAILS.includes(currentUser.email);

  // ✅ Helper for header with sort arrows
  const renderSortableHeader = (label, key) => {
    const isActive = sortConfig.key === key;

    return (
      <th
        onClick={() => requestSort(key)}
        className="px-6 py-3 cursor-pointer select-none min-w-[120px]"
      >
        <div className="flex items-center gap-1">
          {label}
          <span className="flex flex-col leading-none">
            <ChevronUp
              size={12}
              className={`${
                isActive && sortConfig.direction === "asc"
                  ? "text-gray-800"
                  : "text-gray-300"
              }`}
            />
            <ChevronDown
              size={12}
              className={`-mt-1 ${
                isActive && sortConfig.direction === "desc"
                  ? "text-gray-800"
                  : "text-gray-300"
              }`}
            />
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-1">User Roles</h2>
      <p className="font-medium text-gray-500 mb-4">
        Manage and assign roles to registered users
      </p>

      {/* ✅ Search bar */}
      <div className="relative mb-4 w-full sm:w-1/3">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by name, last name, or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#f04e37] focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : sortedUsers.length === 0 ? (
        <p className="text-gray-500 italic">No users found.</p>
      ) : (
        <>
        <div 
          className="overflow-x-scroll overflow-y-visible rounded-xl border border-gray-200 admin-table-scrollbar shadow-sm"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#f04e37 transparent'
          }}
        >
          <table className="min-w-max text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 min-w-[60px]">#</th>
                {renderSortableHeader("First Name", "firstName")}
                {renderSortableHeader("Last Name", "lastName")}
                {renderSortableHeader("Email", "email")}
                {renderSortableHeader("Role", "role")}
                <th className="px-6 py-3 min-w-[140px]">Action</th>
                {renderSortableHeader("Country", "country")}
                {renderSortableHeader("Language", "language")}
                {renderSortableHeader("Gender", "gender")}
                {renderSortableHeader("Birthday", "birthday")}
                {renderSortableHeader("Date Created", "createdAt")}
                {renderSortableHeader("Last Updated", "updatedAt")}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentUsers.map((user, idx) => (
                <tr key={user._id} className="bg-white hover:bg-gray-50">
                  <td className="px-6 py-3 min-w-[60px]">{indexOfFirstUser + idx + 1}</td>
                  <td className="px-6 py-3 font-medium text-gray-800 min-w-[120px]">
                    {formatName(user.firstName)}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-800 min-w-[120px]">
                    {formatName(user.lastName)}
                  </td>
                  <td className="px-6 py-3 text-gray-600 min-w-[200px]">{user.email}</td>
                  <td className="px-6 py-3 min-w-[100px]">
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-md ${
                        user.role === "admin"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                          : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      {SUPER_ADMIN_EMAILS.includes(user.email) ? (
                        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md">
                          Super
                        </span>
                      ) : isSuperAdmin ? (
                        <>
                          <select
                            value={user.role}
                            onChange={(e) =>
                              confirmRoleChange(user._id, e.target.value)
                            }
                            className="min-w-[100px] border-2 border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white hover:border-[#f04e37] hover:shadow-md focus:ring-2 focus:ring-[#f04e37]/30 focus:border-[#f04e37] focus:outline-none transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23f04e37%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:14px] bg-[right_8px_center] bg-no-repeat pr-8 text-gray-700"
                          >
                            <option value="tourist">tourist</option>
                            <option value="admin">admin</option>
                          </select>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 hover:shadow-lg transition-all duration-200 flex items-center gap-1 shadow-md hover:scale-105 active:scale-95"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <select
                          value={user.role}
                          disabled
                          className="min-w-[100px] border-2 border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold bg-gray-50 text-gray-400 cursor-not-allowed appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23ccc%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:14px] bg-[right_8px_center] bg-no-repeat pr-8"
                        >
                          <option>{user.role}</option>
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-600 min-w-[120px]">
                    {user.country || "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-500 min-w-[100px]">
                    {formatLanguage(user.language)}
                  </td>
                  <td className="px-6 py-3 text-gray-600 min-w-[80px]">
                    {user.gender || "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-600 min-w-[120px]">
                    {user.birthday ? formatDate(user.birthday) : "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-500 min-w-[120px]">
                    {user.createdAt ? formatDate(user.createdAt) : "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-500 min-w-[120px]">
                    {user.updatedAt ? formatDate(user.updatedAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({sortedUsers.length} total users)
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
            Next
          </button>
        </div>
        </>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: "danger", title: "", message: "", onConfirm: null, loading: false })}
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
        onClose={() => setNotification({ isOpen: false, type: "info", title: "", message: "" })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}
