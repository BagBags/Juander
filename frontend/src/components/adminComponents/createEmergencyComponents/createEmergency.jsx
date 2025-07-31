import React, { useEffect, useState } from "react";

export default function CreateEmergency({ onSave, agencyToEdit }) {
  const [name, setName] = useState("");
  const [channels, setChannels] = useState([{ label: "", number: "" }]);

  useEffect(() => {
    if (agencyToEdit) {
      setName(agencyToEdit.name);
      setChannels(agencyToEdit.contactChannels || [{ label: "", number: "" }]);
    } else {
      setName("");
      setChannels([{ label: "", number: "" }]);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAgency = {
      name,
      contactChannels: channels,
    };
    onSave(newAgency);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-[#f04e37] mb-4">
        {agencyToEdit ? "Update Agency" : "Add Agency"}
      </h2>

      <input
        type="text"
        placeholder="Agency/Department"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-3"
      />

      {channels.map((channel, idx) => (
        <div key={idx} className="mb-3 relative">
          <input
            type="text"
            placeholder={`Contact Channel${idx > 0 ? " (Secondary)" : ""}`}
            value={channel.label}
            onChange={(e) => handleChannelChange(idx, "label", e.target.value)}
            className="w-full border rounded px-3 py-2 mb-2"
          />
          <input
            type="text"
            placeholder="Contact Number/Link"
            value={channel.number}
            onChange={(e) => handleChannelChange(idx, "number", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          {channels.length > 1 && (
            <button
              type="button"
              onClick={() => handleRemoveChannel(idx)}
              className="absolute top-0 right-0 text-red-500 text-xs hover:underline"
            >
              ✕ Remove
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddChannel}
        className="text-[#f04e37] text-sm mb-4 flex items-center gap-1"
      >
        <span className="text-lg">+</span> Add Another Contact Channel
      </button>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Save
      </button>
    </form>
  );
}
