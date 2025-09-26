import { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Trash2, Plus, Check } from "lucide-react";

export default function AdminItineraryMain() {
  const [pins, setPins] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [itineraries, setItineraries] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const ICON_SIZE = 20;
  const SITE_IMAGE_SIZE = 80;
  const COVER_IMAGE_HEIGHT = 192;

  const token = localStorage.getItem("token"); // Get admin token
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Fetch pins
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const res = await axios.get(
          "https://juander.onrender.com/api/pins",
          config
        );
        setPins(res.data);
      } catch (err) {
        console.error("Failed to fetch pins:", err);
      }
    };
    fetchPins();
  }, []);

  // Fetch itineraries
  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      const res = await axios.get(
        "https://juander.onrender.com/api/itineraries",
        config
      );
      setItineraries(res.data);
    } catch (err) {
      console.error("Failed to fetch itineraries:", err);
    }
  };

  const toggleSite = (pin) => {
    setSelectedSites((prev) =>
      prev.find((s) => s._id === pin._id)
        ? prev.filter((s) => s._id !== pin._id)
        : [...prev, pin]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return alert("Please enter a name");

    // New validation: prevent saving if no sites are selected
    if (selectedSites.length === 0) {
      return alert(
        "Please select at least one site before saving an itinerary"
      );
    }

    const payload = {
      name,
      description,
      imageUrl,
      sites: selectedSites.map((s) => s._id),
      isAdminCreated: true,
    };

    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/itineraries/${editingId}`,
          payload,
          config
        );
        alert("Itinerary updated!");
      } else {
        await axios.post(
          "http://localhost:5000/api/itineraries",
          payload,
          config
        );
        alert("Itinerary saved!");
      }

      setName("");
      setDescription("");
      setImageUrl("");
      setSelectedSites([]);
      setEditingId(null);
      fetchItineraries();
    } catch (err) {
      console.error("Failed to save itinerary:", err);
      alert("Failed to save itinerary");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this itinerary?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/itineraries/${id}`, config);
      setItineraries(itineraries.filter((i) => i._id !== id));
    } catch (err) {
      console.error("Failed to delete itinerary:", err);
      alert("Failed to delete itinerary");
    }
  };

  const handleEdit = (itinerary) => {
    setName(itinerary.name);
    setDescription(itinerary.description);
    setImageUrl(itinerary.imageUrl || "");
    const selected = pins.filter((pin) =>
      itinerary.sites?.some((site) => site._id === pin._id)
    );
    setSelectedSites(selected);
    setEditingId(itinerary._id);
  };

  return (
    <div className="flex gap-6 p-6">
      {/* Form Panel */}
      <div className="w-1/2 bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-gradient-red mb-4">
          {editingId ? "Edit Itinerary" : "Add Itinerary"}
        </h2>

        {/* Cover Image */}
        <div
          className="w-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center"
          style={{ height: COVER_IMAGE_HEIGHT }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Itinerary Preview"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <span className="text-gray-400">Image Preview</span>
          )}
        </div>

        {/* Inputs */}
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL"
          className="w-full p-3 border-2 border-gray-300 rounded-lg 
               focus:border-gray-400 focus:ring-2 focus:ring-gray-200 
               outline-none transition text-gray-700 bg-white p-2 text-sm outline-none"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Itinerary Name"
          className="w-full p-3 border-2 border-gray-300 rounded-lg 
               focus:border-gray-400 focus:ring-2 focus:ring-gray-200 
               outline-none transition text-gray-700 bg-white p-2 text-sm outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full p-3 border-2 border-gray-300 rounded-lg 
               focus:border-gray-400 focus:ring-2 focus:ring-gray-200 
               outline-none transition text-gray-700 bg-white p-2 text-sm outline-none resize-none"
        />

        {/* Selected Sites */}
        <div
          className="p-3 border-2 border-gray-300 rounded-lg 
               focus:border-gray-400 focus:ring-2 focus:ring-gray-200 
               outline-none transition text-gray-700 bg-white p-2 text-sm h-28 overflow-y-auto"
        >
          {selectedSites.length ? (
            selectedSites.map((site) => (
              <span key={site._id} className="block text-gray-700 text-sm">
                • {site.siteName || site.title}
              </span>
            ))
          ) : (
            <span className="text-gray-400">No sites selected</span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg hover:opacity-90 transition"
          >
            {editingId ? <Check size={ICON_SIZE} /> : <Plus size={ICON_SIZE} />}
            {editingId ? "Update" : "Save"}
          </button>
          <button
            onClick={() => {
              setName("");
              setDescription("");
              setImageUrl("");
              setSelectedSites([]);
              setEditingId(null);
            }}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Itineraries & Sites Panel */}
      <div className="w-1/2 flex flex-col gap-6">
        {/* Existing Itineraries */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex-1 flex flex-col">
          <h2 className="text-2xl font-bold text-gradient-red mb-4">
            Existing Itineraries
          </h2>

          {/* Scrollable itineraries list */}
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[50vh] pr-2">
            {itineraries.length ? (
              itineraries.map((itinerary) => (
                <div
                  key={itinerary._id}
                  className="border border-gray-200 rounded-xl p-5 bg-white 
             shadow-sm hover:shadow-lg transition"
                >
                  {/* Title + Subtitle */}
                  <h3 className="text-lg font-semibold text-gray-800">
                    {itinerary.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {itinerary.description}
                  </p>

                  {/* Image */}
                  {itinerary.imageUrl && (
                    <img
                      src={itinerary.imageUrl}
                      alt={itinerary.name}
                      className="w-full h-48 object-cover rounded-xl mt-3"
                    />
                  )}

                  {/* Sites */}
                  {itinerary.sites?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Sites: {itinerary.sites.length}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleEdit(itinerary)}
                      className="flex items-center justify-center gap-2 px-4 py-2 
              bg-blue-500 hover:bg-blue-600 
              text-white text-sm font-medium rounded-lg shadow-sm transition"
                    >
                      <Edit size={16} /> Edit
                    </button>

                    <button
                      onClick={() => handleDelete(itinerary._id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 
              bg-red-500 hover:bg-red-600 
              text-white text-sm font-medium rounded-lg shadow-sm transition"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No itineraries found</p>
            )}
          </div>

          {/* Sites below */}
          <h2 className="text-2xl font-bold text-gradient-red mt-6 mb-4">
            Sites
          </h2>

          <div className="flex flex-col gap-4 max-h-[35vh] overflow-y-auto pr-2">
            {pins.map((pin) => {
              const isSelected = selectedSites.some((s) => s._id === pin._id);
              return (
                <div
                  key={pin._id}
                  className="flex items-center gap-4 rounded-2xl p-4 border border-gray-200 
          bg-white shadow-sm hover:shadow-md transition"
                >
                  {/* Thumbnail */}
                  <img
                    src={
                      pin.mediaUrl ||
                      pin.image ||
                      "https://via.placeholder.com/80"
                    }
                    alt={pin.siteName || pin.title}
                    className="object-cover rounded-xl flex-shrink-0"
                    style={{ width: 80, height: 80 }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-800 truncate">
                      {pin.siteName || pin.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {pin.description}
                    </p>
                  </div>

                  {/* Action button */}
                  <button
                    onClick={() => toggleSite(pin)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition 
            ${
              isSelected
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
                  >
                    {isSelected ? <Check size={20} /> : <Plus size={20} />}
                    {isSelected ? "Added" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
