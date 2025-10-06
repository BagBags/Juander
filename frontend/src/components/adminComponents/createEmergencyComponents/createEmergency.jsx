import React, { useEffect, useState } from "react";

export default function CreateEmergency({ onSave, agencyToEdit }) {
  const [name, setName] = useState("");
  const [channels, setChannels] = useState([{ label: "", number: "" }]);
  const [icon, setIcon] = useState(null);
  const [preview, setPreview] = useState(null); // For image preview

  useEffect(() => {
    if (agencyToEdit) {
      setName(agencyToEdit.name);
      setChannels(agencyToEdit.contactChannels || [{ label: "", number: "" }]);
      setIcon(agencyToEdit.icon || null); // could be string URL
      setPreview(null); // reset preview so it uses existing icon URL
    } else {
      setName("");
      setChannels([{ label: "", number: "" }]);
      setIcon(null);
      setPreview(null);
    }
  }, [agencyToEdit]);

  const handleAddChannel = () =>
    setChannels([...channels, { label: "", number: "" }]);

  const handleChannelChange = (index, field, value) => {
    const updated = [...channels];
    updated[index][field] = value;
    setChannels(updated);
  };

  const handleRemoveChannel = (index) => {
    const updated = [...channels];
    updated.splice(index, 1);
    setChannels(updated);
  };

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIcon(file); // Store file instead of URL
      setPreview(URL.createObjectURL(file)); // For preview
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("contactChannels", JSON.stringify(channels));
    if (icon) formData.append("icon", icon); // ✅ append file

    await onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 bg-white rounded-2xl shadow-md"
    >
      <h2 className="text-2xl font-semibold text-[#f04e37]">
        {agencyToEdit ? "Update Agency" : "Add Agency"}
      </h2>

      {/* Image Upload */}
      <div className="flex flex-col items-center space-y-3">
        <img
          src={
            preview // newly uploaded file preview
              ? preview
              : typeof icon === "string" // existing image URL
              ? icon.startsWith("http") // if full URL
                ? icon
                : `http://localhost:5000${icon}` // prepend backend URL if needed
              : "/placeholder.png"
          }
          alt="Agency Icon"
          className="w-54 h-54 object-cover rounded-full shadow-md border border-gray-200"
        />

        <label className="cursor-pointer px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow transition-all">
          Upload Icon
          <input
            type="file"
            accept="image/*"
            onChange={handleIconUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Agency Name */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Name
      </label>
      <input
        type="text"
        placeholder="Agency/Department"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/40 rounded-lg px-4 py-2 text-sm outline-none transition"
      />
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Contacts
      </label>
      {/* Channels */}
      {channels.map((channel, idx) => (
        <div
          key={idx}
          className="relative mb-5 space-y-3 p-5 rounded-xl bg-gray-50 shadow-sm"
        >
          {/* Remove button on top-right */}
          {channels.length > 1 && (
            <button
              type="button"
              onClick={() => handleRemoveChannel(idx)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition"
            >
              ✕
            </button>
          )}

          <input
            type="text"
            placeholder={`Contact Channel${idx > 0 ? " (Secondary)" : ""}`}
            value={channel.label}
            onChange={(e) => handleChannelChange(idx, "label", e.target.value)}
            className="w-full border border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/40 rounded-lg px-4 py-2 text-sm outline-none transition"
          />
          <input
            type="text"
            placeholder="Contact Number/Link"
            value={channel.number}
            onChange={(e) => handleChannelChange(idx, "number", e.target.value)}
            className="w-full border border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/40 rounded-lg px-4 py-2 text-sm outline-none transition"
          />
        </div>
      ))}

      {/* Add Contact */}
      <button
        type="button"
        onClick={handleAddChannel}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-gray-700 text-sm font-medium shadow-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md transition"
      >
        <span className="text-base font-bold leading-none">+</span>
        Add Contact
      </button>

      {/* Save */}
      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-medium transition shadow-md"
      >
        Save
      </button>
    </form>
  );
}
