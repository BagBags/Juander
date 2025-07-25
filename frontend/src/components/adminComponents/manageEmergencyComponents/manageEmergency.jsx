import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import CreateEmergency from "../createEmergencyComponents/createEmergency";
import UpdateEmergency from "../updateEmergencyComponents/updateEmergency";
import { Phone, Link2 } from "lucide-react";

export default function ManageEmergency() {
  const [hotlines, setHotlines] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState(null); // Agency object
  const [isExpanded, setIsExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  // Fetch data on load
  useEffect(() => {
    fetchHotlines();
  }, []);

  const fetchHotlines = async () => {
    try {
      const res = await axios.get("/api/emergency");
      setHotlines(res.data);
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
        // Update existing
        await axios.put(`/api/emergency/${selectedAgency._id}`, agencyData);
      } else {
        // Add new
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />

      <main
        className={`flex-1 p-6 transition-all duration-300 ${
          isExpanded ? "ml-80" : "ml-20"
        }`}
      >
        <h1 className="text-3xl font-bold text-[#f04e37] mb-6">
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

            <div className="space-y-3">
              {hotlines.map((agency) => (
                <div
                  key={agency._id}
                  className="bg-[#f04e37] text-white rounded-lg p-4 flex justify-between items-start"
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
              ))}
            </div>
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
