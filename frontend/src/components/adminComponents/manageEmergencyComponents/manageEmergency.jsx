import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import CreateEmergency from "../createEmergencyComponents/createEmergency";
import UpdateEmergency from "../updateEmergencyComponents/updateEmergency";
import { Phone, Link2, Edit, Trash2, Plus, Archive, RotateCcw } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ConfirmModal from "../../shared/ConfirmModal";

export default function ManageEmergency() {
  const [hotlines, setHotlines] = useState([]);
  const [archivedHotlines, setArchivedHotlines] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // "active" or "archived"
  const [formKey, setFormKey] = useState(0); // Force form remount
  
  // Validation errors for CreateEmergency form
  const [formErrors, setFormErrors] = useState({});
  const [iconFile, setIconFile] = useState(null); // Track icon file for validation
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
  });

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  useEffect(() => {
    fetchHotlines();
    fetchArchivedHotlines();
  }, []);

  const fetchHotlines = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/emergency`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const sorted = res.data.sort((a, b) => a.position - b.position);
      setHotlines(sorted);
    } catch (err) {
      console.error("Error fetching hotlines:", err);
    }
  };

  const fetchArchivedHotlines = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/emergency/archived`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArchivedHotlines(res.data);
    } catch (err) {
      console.error("Error fetching archived hotlines:", err);
    }
  };

  const handleAddAgency = () => {
    setSelectedAgency(null);
    setFormErrors({}); // Clear any existing errors
    setFormKey(prev => prev + 1); // Force form remount
    setShowForm(true);
  };

  const handleSaveAgency = (agencyData) => {
    const agencyName = agencyData.get('name') || 'this hotline';
    
    // Validation
    const newErrors = {};
    if (!agencyData.get('name') || !agencyData.get('name').trim()) {
      newErrors.agency = "Agency name is required";
    }
    
    // Check icon upload (only for new agencies, not when editing)
    if (!selectedAgency && !agencyData.get('icon')) {
      newErrors.icon = "Agency icon is required";
    }
    
    const contactChannels = agencyData.get('contactChannels');
    if (!contactChannels || JSON.parse(contactChannels).length === 0) {
      newErrors.contactChannelLabel = "Contact channel label is required";
      newErrors.contactChannelNumber = "Contact number/link is required";
    } else {
      const channels = JSON.parse(contactChannels);
      const firstChannel = channels[0];
      if (!firstChannel.label || !firstChannel.label.trim()) {
        newErrors.contactChannelLabel = "Contact channel label is required";
      }
      if (!firstChannel.number || !firstChannel.number.trim()) {
        newErrors.contactChannelNumber = "Contact number/link is required";
      }
    }
    
    setFormErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    setConfirmModal({
      isOpen: true,
      type: "success",
      title: selectedAgency ? "Update Hotline?" : "Add New Hotline?",
      message: selectedAgency 
        ? `Are you sure you want to update the hotline "${agencyName}"?`
        : `Are you sure you want to add the hotline "${agencyName}"?`,
      confirmText: selectedAgency ? "Update" : "Add Hotline",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          const token = localStorage.getItem("token");
          if (selectedAgency) {
            await axios.put(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/emergency/${selectedAgency._id}`, agencyData, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            });
          } else {
            agencyData.append("position", hotlines.length);
            await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/emergency`, agencyData, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            });
          }
          setShowForm(false);
          setSelectedAgency(null);
          fetchHotlines();
          fetchArchivedHotlines();
          setFormErrors({}); // Clear errors
          
          // Log the action
          try {
            await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/logs`,
              {
                action: selectedAgency 
                  ? `Updated emergency hotline: ${agencyName}`
                  : `Added new emergency hotline: ${agencyName}`,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
          } catch (logErr) {
            console.error("Error logging action:", logErr);
          }
          
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Error saving agency:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedAgency(null);
    setFormErrors({}); // Clear form errors
    setFormKey(prev => prev + 1); // Force form remount on next open
  };

  const handleEdit = (agency) => {
    setSelectedAgency(agency);
    setFormErrors({}); // Clear any existing errors
    setFormKey(prev => prev + 1); // Force form remount
    setShowForm(true);
  };

  const handleArchive = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "info",
      title: "Archive Emergency Hotline?",
      message: "This hotline will be moved to the archived section. You can restore it later if needed.",
      confirmText: "Archive",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          const token = localStorage.getItem("token");
          await axios.put(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/emergency/${id}/archive`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchHotlines();
          fetchArchivedHotlines();
          
          // Log the action
          try {
            const hotline = hotlines.find(h => h._id === id);
            await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/logs`,
              {
                action: `Archived emergency hotline: ${hotline?.name || "Unknown"}`,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
          } catch (logErr) {
            console.error("Error logging action:", logErr);
          }
          
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Error archiving agency:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleRestore = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "restore",
      title: "Restore Emergency Hotline?",
      message: "This hotline will be restored to the active hotlines list and will be available for users again.",
      confirmText: "Restore",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          const token = localStorage.getItem("token");
          await axios.put(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/emergency/${id}/restore`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchHotlines();
          fetchArchivedHotlines();
          
          // Log the action
          try {
            const hotline = archivedHotlines.find(h => h._id === id);
            await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/logs`,
              {
                action: `Restored emergency hotline: ${hotline?.name || "Unknown"}`,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
          } catch (logErr) {
            console.error("Error logging action:", logErr);
          }
          
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Error restoring agency:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handlePermanentDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Permanent Delete?",
      message: "WARNING: This action cannot be undone! The emergency hotline will be permanently deleted from the database.",
      confirmText: "Delete Forever",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/emergency/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchArchivedHotlines();
          
          // Log the action
          try {
            const hotline = archivedHotlines.find(h => h._id === id);
            await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/logs`,
              {
                action: `Permanently deleted emergency hotline: ${hotline?.name || "Unknown"}`,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
          } catch (logErr) {
            console.error("Error logging action:", logErr);
          }
          
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Error deleting agency:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const reordered = Array.from(hotlines);
    const [movedItem] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, movedItem);
    setHotlines(reordered);

    const updated = reordered.map((item, index) => ({
      _id: item._id,
      position: index,
    }));

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/emergency/reorder`,
        { agencies: updated },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  return (
    <>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        loading={confirmModal.loading}
      />
      
      <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isExpanded ? "ml-80" : "ml-20"
        }`}
      >
        {/* Page Header */}
        <div className="w-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] border-b-2 border-gray-300 px-8 py-4">
          <h1 className="text-2xl text-gray-800 pr-20 pl-20 font-medium">
            Emergency Hotlines
          </h1>
        </div>

        {/* Main Section */}
        <main className="p-6 bg-gray-50 min-h-screen">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Hotline List */}
            <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Emergency Hotlines</h2>
                <button
                  onClick={handleAddAgency}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:scale-105 text-white px-5 py-2.5 rounded-xl font-semibold transition-all"
                >
                  <Plus size={18} /> Add Agency
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab("active")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    activeTab === "active"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Active Hotlines ({hotlines.length})
                </button>
                <button
                  onClick={() => setActiveTab("archived")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    activeTab === "archived"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Archived ({archivedHotlines.length})
                </button>
              </div>

              {activeTab === "active" ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="agency-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex flex-col gap-4"
                    >
                      {hotlines.map((agency, index) => (
                        <Draggable
                          key={agency._id}
                          draggableId={agency._id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex justify-between items-start p-5 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-red-300 hover:shadow-md transition-all cursor-move"
                            >
                              <div className="flex gap-3">
                                {agency.icon ? (
                                  <img
                                    src={
                                      agency.icon
                                        ? typeof agency.icon === "string"
                                          ? agency.icon.startsWith("http")
                                            ? agency.icon
                                            : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000"}${agency.icon}` // prepend backend URL
                                          : "/placeholder.png"
                                        : "/placeholder.png"
                                    }
                                    alt={agency.name || "Agency Icon"}
                                    className="w-12 h-12 rounded-full object-cover border border-white shadow-sm"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.png";
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-red-500 text-lg border shadow-sm">
                                    🏢
                                  </div>
                                )}

                                <div>
                                  <p className="font-bold text-gray-800 text-lg mb-1">
                                    {agency.name}
                                  </p>
                                  {agency.contactChannels?.map(
                                    (channel, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-2 text-sm text-gray-700"
                                      >
                                        {channel.number.startsWith("http") ? (
                                          <Link2 className="w-4 h-4 text-gray-700" />
                                        ) : (
                                          <Phone className="w-4 h-4 text-gray-700" />
                                        )}
                                        <span>
                                          {channel.label}: {channel.number}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 mt-2 lg:mt-0">
                                <button
                                  onClick={() => handleEdit(agency)}
                                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition"
                                >
                                  <Edit size={16} /> Edit
                                </button>
                                <button
                                  onClick={() => handleArchive(agency._id)}
                                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition"
                                >
                                  <Archive size={16} /> Archive
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
                <div className="flex flex-col gap-4">
                  {archivedHotlines.map((agency) => (
                    <div
                      key={agency._id}
                      className="flex justify-between items-start p-5 rounded-xl bg-gray-100 border-2 border-gray-300 opacity-75"
                    >
                      <div className="flex gap-3">
                        {agency.icon ? (
                          <img
                            src={
                              agency.icon
                                ? typeof agency.icon === "string"
                                  ? agency.icon.startsWith("http")
                                    ? agency.icon
                                    : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000"}${agency.icon}`
                                  : "/placeholder.png"
                                : "/placeholder.png"
                            }
                            alt={agency.name || "Agency Icon"}
                            className="w-12 h-12 rounded-full object-cover border border-white shadow-sm grayscale"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.png";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-lg border shadow-sm">
                            🏢
                          </div>
                        )}

                        <div>
                          <p className="font-bold text-gray-600 text-lg mb-1">
                            {agency.name}
                          </p>
                          {agency.contactChannels?.map(
                            (channel, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm text-gray-600"
                              >
                                {channel.number.startsWith("http") ? (
                                  <Link2 className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <Phone className="w-4 h-4 text-gray-600" />
                                )}
                                <span className="font-medium">
                                  {channel.label}:
                                </span>
                                <span>{channel.number}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleRestore(agency._id)}
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition"
                        >
                          <RotateCcw size={16} /> Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(agency._id)}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {archivedHotlines.length === 0 && (
                    <p className="text-gray-400 text-center py-8">No archived hotlines</p>
                  )}
                </div>
              )}
            </div>

            {/* Form */}
            <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-lg p-6 min-h-[480px] flex flex-col">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {selectedAgency ? "Edit Agency" : "Add Agency"}
              </h2>
              {showForm ? (
                <CreateEmergency
                  key={`form-${formKey}-${selectedAgency?._id || 'new'}`}
                  onSave={handleSaveAgency}
                  onCancel={handleCancel}
                  agencyToEdit={selectedAgency}
                  formErrors={formErrors}
                  setFormErrors={setFormErrors}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-400 italic text-center">
                    Click "Add Agency" to create a new hotline
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
