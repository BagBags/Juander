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
        const res = await axios.get("http://localhost:5000/api/pins", config);
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
        "http://localhost:5000/api/itineraries",
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
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Itinerary Name"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-400 outline-none resize-none"
        />

        {/* Selected Sites */}
        <div className="p-3 border rounded-lg bg-gray-50 h-28 overflow-y-auto">
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
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[50vh]">
            {itineraries.length ? (
              itineraries.map((itinerary) => (
                <div
                  key={itinerary._id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 border rounded-xl p-4 hover:shadow-md transition"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-500">
                      {itinerary.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {itinerary.description}
                    </p>
                    {itinerary.imageUrl && (
                      <img
                        src={itinerary.imageUrl}
                        alt={itinerary.name}
                        className="w-full h-48 object-cover rounded-xl mt-2"
                      />
                    )}
                    {itinerary.sites?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Sites: {itinerary.sites.length}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                      onClick={() => handleEdit(itinerary)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg shadow hover:from-red-600 hover:to-red-700 transition"
                    >
                      <Edit size={ICON_SIZE} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(itinerary._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold rounded-lg shadow hover:from-gray-500 hover:to-gray-600 transition"
                    >
                      <Trash2 size={ICON_SIZE} /> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No itineraries found</p>
            )}
          </div>

          {/* Sites */}
          <h2 className="text-2xl font-bold text-gradient-red mt-6 mb-4">
            Sites
          </h2>
          <div className="flex flex-col gap-4 max-h-[35vh] overflow-y-auto">
            {pins.map((pin) => (
              <div
                key={pin._id}
                className="flex items-center gap-4 border rounded-xl p-3 hover:shadow-md transition bg-yellow-50"
              >
                <img
                  src={
                    pin.mediaUrl ||
                    pin.image ||
                    "https://via.placeholder.com/80"
                  }
                  alt={pin.siteName || pin.title}
                  className="object-cover rounded-xl"
                  style={{ width: SITE_IMAGE_SIZE, height: SITE_IMAGE_SIZE }}
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-500">
                    {pin.siteName || pin.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{pin.description}</p>
                </div>
                <button
                  onClick={() => toggleSite(pin)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold shadow transition ${
                    selectedSites.find((s) => s._id === pin._id)
                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  }`}
                >
                  {selectedSites.find((s) => s._id === pin._id) ? (
                    <Check size={ICON_SIZE} />
                  ) : (
                    <Plus size={ICON_SIZE} />
                  )}
                  {selectedSites.find((s) => s._id === pin._id)
                    ? "Added"
                    : "Add"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
