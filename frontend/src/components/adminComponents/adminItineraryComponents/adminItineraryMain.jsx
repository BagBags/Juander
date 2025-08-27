import { useEffect, useState } from "react";
import axios from "axios";

export default function AddItinerary() {
  const [pins, setPins] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Fetch pins from backend
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/pins") // adjust if needed
      .then((res) => setPins(res.data))
      .catch((err) => console.error("Error fetching pins:", err));
  }, []);

  // Toggle site selection
  const toggleSite = (pin) => {
    setSelectedSites((prev) =>
      prev.find((s) => s._id === pin._id)
        ? prev.filter((s) => s._id !== pin._id)
        : [...prev, pin]
    );
  };

  // Save itinerary
  const handleSave = async () => {
    try {
      await axios.post("http://localhost:5000/api/itineraries", {
        name,
        description,
        sites: selectedSites.map((s) => s._id), // store only pin IDs
      });
      alert("Itinerary saved!");
      setName("");
      setDescription("");
      setSelectedSites([]);
    } catch (err) {
      console.error(err);
      alert("Failed to save itinerary");
    }
  };

  // Delete itinerary placeholder
  const handleDelete = async () => {
    alert("Delete functionality not yet implemented");
  };

  return (
    <div className="flex p-6 gap-6">
      {/* Left Panel */}
      <div className="w-1/2 bg-gray-100 rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Add Itinerary</h2>

        {/* Cover image placeholder */}
        <div className="w-full h-40 bg-gray-300 rounded mb-4 flex items-center justify-center">
          <span className="text-gray-600">Image Preview</span>
        </div>

        {/* Name */}
        <label className="block mb-2 font-medium">Itinerary Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-2 mb-4"
          placeholder="Enter itinerary name"
        />

        {/* Description */}
        <label className="block mb-2 font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded p-2 mb-4"
          placeholder="Enter description"
        />

        {/* Selected Sites Preview */}
        <label className="block mb-2 font-medium">Selected Sites</label>
        <div className="border rounded p-2 h-24 overflow-y-auto bg-white mb-4">
          {selectedSites.length > 0 ? (
            selectedSites.map((site) => (
              <div key={site._id} className="text-sm text-gray-700">
                • {site.siteName || site.title}
              </div>
            ))
          ) : (
            <p className="text-gray-400">No sites selected</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Save
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Sites</h2>
        <div className="flex flex-col gap-4">
          {pins.map((pin) => (
            <div
              key={pin._id}
              className="flex items-center gap-4 border-2 border-yellow-400 bg-yellow-200 p-3 rounded-lg"
            >
              <img
                src={
                  pin.mediaUrl || pin.image || "https://via.placeholder.com/80"
                }
                alt={pin.siteName || pin.title}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-500">
                  {pin.siteName || pin.title}
                </h3>
                <p className="text-sm text-gray-600">{pin.description}</p>
              </div>
              <button
                onClick={() => toggleSite(pin)}
                className={`px-3 py-1 rounded text-white ${
                  selectedSites.find((s) => s._id === pin._id)
                    ? "bg-green-600"
                    : "bg-blue-500"
                }`}
              >
                {selectedSites.find((s) => s._id === pin._id) ? "Added" : "Add"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
