import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import CreateEmergency from "../createEmergencyComponents/createEmergency";
import UpdateEmergency from "../updateEmergencyComponents/updateEmergency";
import { Phone, Link2, Edit, Trash2, Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ManageEmergency() {
  const [hotlines, setHotlines] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  useEffect(() => {
    fetchHotlines();
  }, []);

  const fetchHotlines = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/emergency`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Hotlines fetched:", res.data); // <-- add this
      const sorted = res.data.sort((a, b) => a.position - b.position);
      setHotlines(sorted);
    } catch (err) {
      console.error("Error fetching hotlines:", err);
    }
  };

  const handleAddAgency = () => {
    setSelectedAgency(null);
    setShowForm(true);
  };

  const handleSaveAgency = async (agencyData) => {
    try {
      const token = localStorage.getItem("token");
      if (selectedAgency) {
        await axios.put(`/api/emergency/${selectedAgency._id}`, agencyData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        agencyData.append("position", hotlines.length);
        await axios.post(`/api/emergency`, agencyData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }
      setShowForm(false);
      setSelectedAgency(null);
      fetchHotlines();
    } catch (err) {
      console.error("Error saving agency:", err);
    }
  };

  const handleEdit = (agency) => {
    setSelectedAgency(agency);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/emergency/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHotlines();
    } catch (err) {
      console.error("Error deleting agency:", err);
    }
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
        `/api/emergency/reorder`,
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
        <div className="w-full bg-white shadow-md px-8 py-4">
          <h1 className="text-2xl text-gray-800 pr-20 pl-20 font-medium">
            Emergency Hotlines
          </h1>
        </div>

        {/* Main Section */}
        <main className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Hotline List */}
            <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-lg p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-red-500">Hotlines</h2>
                <button
                  onClick={handleAddAgency}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transition"
                >
                  <Plus size={16} /> Add Agency
                </button>
              </div>

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
                              className="flex justify-between items-start p-4 rounded-2xl bg-red-100 shadow hover:shadow-md transition"
                            >
                              <div className="flex gap-3">
                                {agency.icon ? (
                                  <img
                                    src={
                                      agency.icon
                                        ? typeof agency.icon === "string"
                                          ? agency.icon.startsWith("http")
                                            ? agency.icon
                                            : `http://localhost:5000${agency.icon}` // prepend backend URL
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
                                  <p className="font-semibold text-red-600 text-lg">
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
                                  className="flex items-center gap-1 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm shadow transition"
                                >
                                  <Edit size={14} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(agency._id)}
                                  className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm shadow transition"
                                >
                                  <Trash2 size={14} /> Delete
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
            </div>

            {/* Form */}
            <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-lg p-5 min-h-[480px] flex items-center justify-center">
              {showForm ? (
                <CreateEmergency
                  onSave={handleSaveAgency}
                  agencyToEdit={selectedAgency}
                />
              ) : (
                <p className="text-gray-400 italic">
                  Select or add an agency to view the form
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
