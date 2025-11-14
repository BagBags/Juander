import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Users, FileText, Star, TrendingUp, MapPin, Calendar, Activity, BarChart3, Shield } from "lucide-react";
import { UserContext } from "../../../contexts/UserContext";
import { useNavigate } from "react-router-dom";

export default function AdminHomeMain() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalReviews: 0,
    avgRating: 0,
    totalSites: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentAdmin } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch users
      const usersRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Fetch reviews
      const reviewsRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/reviews/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Fetch sites
      const sitesRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/pins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const users = usersRes.data;
      const reviews = reviewsRes.data;
      const sites = sitesRes.data;
      
      // Calculate stats
      const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;
      
      setStats({
        totalUsers: users.length,
        totalAdmins: users.filter(u => u.role === "admin" || u.email === "aaronbagain@gmail.com").length,
        totalReviews: reviews.length,
        avgRating,
        totalSites: sites.length,
        totalItineraries: 0, // Can be fetched if needed
      });
      
      // Get recent reviews for activity
      const recent = reviews.slice(0, 5).map(r => ({
        type: "review",
        user: `${r.userId?.firstName || "Unknown"} ${r.userId?.lastName || "User"}`,
        site: r.siteId?.siteName || "Unknown Site",
        rating: r.rating,
        date: new Date(r.createdAt),
      }));
      
      setRecentActivity(recent);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const quickActions = [
    { icon: Users, label: "Manage Roles", description: "Assign and manage user roles", route: "/AdminManageRole", color: "blue" },
    { icon: FileText, label: "Manage Content", description: "Update tour sites and content", route: "/AdminManageContent", color: "green" },
    { icon: TrendingUp, label: "View Reports", description: "Analytics and insights", route: "/AdminReports", color: "purple" },
    { icon: Activity, label: "System Logs", description: "Monitor system activity", route: "/AdminLog", color: "orange" },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
      green: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
      purple: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
      orange: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    };
    return colors[color] || colors.blue;
  };


  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#f04e37] to-[#ff6b54] rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {currentAdmin?.firstName || "Admin"}!
            </h1>
            <p className="text-white/90 text-lg">
              Manage your Intramuros administration system with ease
            </p>
          </div>
          <Shield className="w-24 h-24 opacity-20" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Users</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.totalUsers}
              </h3>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Administrators</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.totalAdmins}
              </h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Reviews</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.totalReviews}
              </h3>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Average Rating</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.avgRating || "N/A"}
              </h3>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(action.route)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${getColorClasses(action.color)}`}
              >
                <Icon className="w-10 h-10 mb-3" />
                <h3 className="font-bold text-lg mb-1">{action.label}</h3>
                <p className="text-sm opacity-80">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          <Activity className="w-6 h-6 text-gray-400" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f04e37]"></div>
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="bg-[#f04e37] p-2 rounded-lg flex-shrink-0">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium">
                    <span className="font-bold">{activity.user}</span> reviewed{" "}
                    <span className="font-semibold text-[#f04e37]">{activity.site}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < activity.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-300 text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(activity.date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">System Information</h3>
            <p className="text-gray-600">Intramuros Administration v1.0</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last login</p>
            <p className="text-gray-900 font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
