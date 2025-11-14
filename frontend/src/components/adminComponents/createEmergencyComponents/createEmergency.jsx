import React, { useEffect, useState } from "react";

export default function CreateEmergency({ onSave, onCancel, agencyToEdit, formErrors = {}, setFormErrors }) {
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
      // Clear icon error when file is uploaded
      if (formErrors && formErrors.icon && setFormErrors) {
        setFormErrors({ ...formErrors, icon: "" });
      }
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
      {/* <h2 className="text-2xl font-semibold text-[#f04e37]">
        {agencyToEdit ? "Update Agency" : "Add Agency"}
      </h2> */}

      {/* Image Upload */}
      <div className="flex flex-col items-center space-y-3">
        <img
          src={
            preview // newly uploaded file preview
              ? preview
              : typeof icon === "string" // existing image URL
              ? icon.startsWith("http") // if full URL
                ? icon
                : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000"}${icon}` // prepend backend URL if needed
              : "/placeholder.png"
          }
          alt="Agency Icon"
          className="w-54 h-54 object-cover rounded-full shadow-md border border-gray-200"
        />

        <label className={`cursor-pointer px-4 py-2 rounded-lg border bg-white text-sm font-medium hover:bg-gray-50 hover:shadow transition-all ${
          formErrors.icon ? "border-red-500 text-red-600" : "border-gray-200 text-gray-700"
        }`}>
          Upload Icon
          <input
            type="file"
            accept="image/*"
            onChange={handleIconUpload}
            className="hidden"
          />
        </label>
        {formErrors.icon && (
          <p className="text-red-500 text-xs">{formErrors.icon}</p>
        )}
      </div>

      {/* Agency Name */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Agency Name</h3>
        {formErrors.agency && (
          <p className="text-red-500 text-xs mb-2">{formErrors.agency}</p>
        )}
        <input
          type="text"
          placeholder="Agency Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (formErrors.agency && e.target.value.trim()) {
              setFormErrors({ ...formErrors, agency: "" });
            }
          }}
          className={`w-full p-3 border-2 rounded-lg focus:ring-2 outline-none transition ${
            formErrors.agency ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-gray-400 focus:ring-gray-200"
          }`}
        />
      </div>

      {/* Contact Channels */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Contact Channels</h3>
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

            <div className="w-full">
              <input
                type="text"
                placeholder={`Contact Channel${idx > 0 ? " (Secondary)" : ""}`}
                value={channel.label}
                onChange={(e) => {
                  handleChannelChange(idx, "label", e.target.value);
                  if (formErrors.contactChannelLabel && e.target.value.trim()) {
                    setFormErrors({ ...formErrors, contactChannelLabel: "" });
                  }
                }}
                className={`w-full p-2 border-2 rounded-lg focus:ring-2 outline-none transition ${
                  formErrors.contactChannelLabel && idx === 0 ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-gray-400 focus:ring-gray-200"
                }`}
              />
              {formErrors.contactChannelLabel && idx === 0 && (
                <p className="text-red-500 text-xs mt-1">{formErrors.contactChannelLabel}</p>
              )}
            </div>
            <div className="w-full">
              <input
                type="text"
                placeholder="Contact Number/Link"
                value={channel.number}
                onChange={(e) => {
                  handleChannelChange(idx, "number", e.target.value);
                  if (formErrors.contactChannelNumber && e.target.value.trim()) {
                    setFormErrors({ ...formErrors, contactChannelNumber: "" });
                  }
                }}
                className={`w-full p-2 border-2 rounded-lg focus:ring-2 outline-none transition ${
                  formErrors.contactChannelNumber && idx === 0 ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-gray-400 focus:ring-gray-200"
                }`}
              />
              {formErrors.contactChannelNumber && idx === 0 && (
                <p className="text-red-500 text-xs mt-1">{formErrors.contactChannelNumber}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Contact */}
      <button
        type="button"
        onClick={handleAddChannel}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-gray-700 text-sm font-medium shadow-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md transition"
      >
        <span className="text-base font-bold leading-none">+</span>
        Add Contact
      </button>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-5 py-3 rounded-lg font-medium transition shadow-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-medium transition shadow-md"
        >
          Save
        </button>
      </div>
    </form>
  );
}
