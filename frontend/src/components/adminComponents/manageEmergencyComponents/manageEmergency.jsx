import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import CreateEmergency from "../createEmergencyComponents/createEmergency";
import UpdateEmergency from "../updateEmergencyComponents/updateEmergency";
import { Phone, Link2 } from "lucide-react";
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
      const res = await axios.get("/api/emergency");
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
      if (selectedAgency) {
        await axios.put(`/api/emergency/${selectedAgency._id}`, agencyData);
      } else {
        agencyData.position = hotlines.length;
        await axios.post("/api/emergency", agencyData);
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
      await axios.delete(`/api/emergency/${id}`);
      fetchHotlines();
    } catch (err) {
      console.error("Error deleting agency:", err);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination } = result;

    if (!destination) return;

    const reordered = Array.from(hotlines); // copy
    const [movedItem] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, movedItem);

    // ✅ Update local state (this is the missing part in most bugs)
    setHotlines(reordered);

    // ✅ Reassign correct positions
    const updated = reordered.map((item, index) => ({
      _id: item._id,
      position: index,
    }));

    console.log("UPDATED (to send):", updated);

    try {
      await axios.put("/api/emergency/reorder", { agencies: updated });
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />

      <main
        className={`flex-1 p-6 transition-all duration-300 ${
          isExpanded ? "ml-80" : "ml-20"
        }`}
      >
        <h1 className="text-4xl font-bold text-[#f04e37] mb-6">
          Emergency Hotlines
        </h1>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Hotline List */}
          <div className="w-full lg:w-2/3 bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#f04e37]">Hotlines</h2>
              <button
                onClick={handleAddAgency}
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
              >
                + Add Agency
              </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="agency-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
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
                            className="bg-[#f04e37] text-white rounded-lg p-4 flex justify-between items-start mb-3"
                          >
                            <div>
                              <p className="font-bold text-lg">{agency.name}</p>
                              {agency.contactChannels?.map((channel, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 ml-1 text-sm"
                                >
                                  {channel.number.startsWith("http") ? (
                                    <Link2 className="w-4 h-4 text-white" />
                                  ) : (
                                    <Phone className="w-4 h-4 text-white" />
                                  )}
                                  <span>
                                    {channel.label}: {channel.number}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <UpdateEmergency
                              onEdit={() => handleEdit(agency)}
                              onDelete={() => handleDelete(agency._id)}
                            />
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
          <div className="w-full lg:w-1/3 min-h-[450px] bg-white rounded-lg shadow p-4">
            {showForm ? (
              <CreateEmergency
                onSave={handleSaveAgency}
                agencyToEdit={selectedAgency}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic">
                Select or add an agency to view the form
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
