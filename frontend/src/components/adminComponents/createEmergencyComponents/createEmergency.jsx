import React, { useEffect, useState } from "react";

export default function CreateEmergency({ onSave, agencyToEdit }) {
  const [name, setName] = useState("");
  const [channels, setChannels] = useState([{ label: "", number: "" }]);

  // Prefill form if editing
  useEffect(() => {
    if (agencyToEdit) {
      setName(agencyToEdit.name);
      setChannels(agencyToEdit.channels || [{ label: "", number: "" }]);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAgency = { name, channels };
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
        <div key={idx} className="mb-3">
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
