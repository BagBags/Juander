import React, { useState, useEffect } from "react";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import CreateEmergency from "../createEmergencyComponents/createEmergency";
import UpdateEmergency from "../updateEmergencyComponents/updateEmergency";

export default function ManageEmergency() {
  const [hotlines, setHotlines] = useState([]);
  const [selectedAgencyIndex, setSelectedAgencyIndex] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  // Load from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("emergencyHotlines");
    if (stored) {
      setHotlines(JSON.parse(stored));
    }
  }, []);

  // Save to sessionStorage whenever hotlines update
  useEffect(() => {
    sessionStorage.setItem("emergencyHotlines", JSON.stringify(hotlines));
  }, [hotlines]);

  const handleAddAgency = () => {
    setSelectedAgencyIndex(null);
    setShowForm(true);
  };

  const handleSaveAgency = (agencyData) => {
    if (selectedAgencyIndex !== null) {
      // 🛠 Update existing
      const updated = [...hotlines];
      updated[selectedAgencyIndex] = agencyData;
      setHotlines(updated);
    } else {
      // ➕ Add new
      setHotlines([...hotlines, agencyData]);
    }

    setShowForm(false);
    setSelectedAgencyIndex(null);
  };

  const handleEdit = (index) => {
    setSelectedAgencyIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index) => {
    const updated = [...hotlines];
    updated.splice(index, 1);
    setHotlines(updated);
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
              {hotlines.map((agency, idx) => (
                <div
                  key={idx}
                  className="bg-[#f04e37] text-white rounded-lg p-4 flex justify-between items-center"
                >
                  <span className="font-bold text-lg">{agency.name}</span>
                  <UpdateEmergency
                    onEdit={() => handleEdit(idx)}
                    onDelete={() => handleDelete(idx)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Form Area */}
          <div className="w-full lg:w-1/3 min-h-[450px] bg-white rounded-lg shadow p-4">
            {showForm ? (
              <CreateEmergency
                onSave={handleSaveAgency}
                agencyToEdit={hotlines[selectedAgencyIndex] || null}
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
