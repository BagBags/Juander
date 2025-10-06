// components/adminComponents/AdminPinCard.jsx
import React, { Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faCheck, faUpload } from "@fortawesome/free-solid-svg-icons";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei";
const BACKEND_URL = "http://localhost:5000";

// 3D Model Preview Component
const ModelPreview = ({ url }) => {
  const { scene } = useGLTF(url, true);
  return <primitive object={scene} scale={0.5} />;
};

const AdminPinCard = ({
  pin,
  selectedPinIndex,
  updatePinField,
  handleFormSubmit,
  handleDeletePin,
  handleGlbUpload,
  handleFacadeUpload,
  handleRemoveFacade,
  handleRemoveGlb,
  previewGlb,
  onClose,
}) => {
  if (!pin) return null;

  return (
    <div className="absolute top-6 left-6 w-[380px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col z-40 border border-gray-100 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 rounded-t-2xl bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-semibold text-gray-800">Pin Details</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      {/* Scrollable Form */}
      <form
        onSubmit={(e) => handleFormSubmit(e, selectedPinIndex)}
        className="flex-1 overflow-y-auto p-5 space-y-5"
      >
        {/* Site Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site Name
          </label>
          <input
            type="text"
            value={pin.siteName || ""}
            onChange={(e) =>
              updatePinField(selectedPinIndex, "siteName", e.target.value)
            }
            className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter site name"
            required
          />
        </div>
        {/* Site Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site Description
          </label>
          <textarea
            value={pin.siteDescription || ""}
            onChange={(e) =>
              updatePinField(
                selectedPinIndex,
                "siteDescription",
                e.target.value
              )
            }
            className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            rows="3"
            placeholder="Enter site description"
          />
        </div>
        {/* 2D Facade Landmark */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            2D Facade Image
          </label>
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFacadeUpload(e, selectedPinIndex)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors duration-200">
                <FontAwesomeIcon
                  icon={faUpload}
                  className="text-gray-400 text-lg mb-2"
                />
                <p className="text-sm text-gray-600">
                  {pin.facadeUrl
                    ? "Replace Facade Image"
                    : "Upload Facade Image"}
                </p>
              </div>
            </div>
            {pin.facadeUrl && (
              <div className="w-full h-40 relative rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={`${BACKEND_URL}${pin.facadeUrl}`}
                  alt="Facade preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFacade(selectedPinIndex)}
                  className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Media */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Media URL
          </label>
          <input
            type="text"
            value={pin.mediaUrl || ""}
            onChange={(e) =>
              updatePinField(selectedPinIndex, "mediaUrl", e.target.value)
            }
            className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="https://example.com/media.jpg"
          />
          <div className="mt-3 flex items-center space-x-2">
            <label className="text-sm text-gray-600">Media Type:</label>
            <select
              className="border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={pin.mediaType || "image"}
              onChange={(e) =>
                updatePinField(selectedPinIndex, "mediaType", e.target.value)
              }
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>

          {/* Media Preview */}
          {pin.mediaUrl && (
            <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
              {pin.mediaType === "video" ? (
                <video
                  src={pin.mediaUrl}
                  controls
                  className="w-full h-48 object-cover"
                />
              ) : (
                <img
                  src={pin.mediaUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              )}
            </div>
          )}
        </div>
        {/* 3D Model Section */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            3D Model (.glb)
          </label>
          <div className="flex flex-col space-y-3">
            {/* File Upload */}
            <div className="relative">
              <input
                type="file"
                accept=".glb"
                onChange={(e) => handleGlbUpload(e, selectedPinIndex)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors duration-200">
                <FontAwesomeIcon
                  icon={faUpload}
                  className="text-gray-400 text-lg mb-2"
                />
                <p className="text-sm text-gray-600">
                  {pin.glbUrl ? "Replace 3D Model" : "Upload GLB File"}
                </p>
              </div>
            </div>
            {/* Live 3D Model Preview */}
            {pin.glbUrl && (
              <div className="relative mb-3 w-full h-64 border border-gray-200 rounded-lg">
                <Canvas>
                  <Suspense fallback={null}>
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[5, 5, 5]} />
                    <Bounds fit clip observe margin={1.2}>
                      <ModelPreview
                        url={
                          pin.glbUrl
                            ? `${BACKEND_URL}${
                                pin.glbUrl.startsWith("/") ? "" : "/"
                              }${pin.glbUrl}`
                            : null
                        }
                      />
                    </Bounds>
                    <OrbitControls enableZoom={true} />
                  </Suspense>
                </Canvas>
                <button
                  type="button"
                  onClick={() => handleRemoveGlb(selectedPinIndex)}
                  className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
        {/* AR Link */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              AR Experience
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={pin.arEnabled || false}
                  onChange={(e) =>
                    updatePinField(
                      selectedPinIndex,
                      "arEnabled",
                      e.target.checked
                    )
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
              <span className="text-sm text-gray-600">
                {pin.arEnabled ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
          <input
            type="text"
            value={pin.arLink || ""}
            onChange={(e) =>
              updatePinField(selectedPinIndex, "arLink", e.target.value)
            }
            className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="https://example.com/ar-link"
          />
          <p className="text-xs text-gray-500 mt-2">
            This link will only be visible to tourists if enabled.
          </p>
        </div>
        {/* Site Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site Status
          </label>
          <select
            value={pin.status || "active"}
            onChange={(e) =>
              updatePinField(selectedPinIndex, "status", e.target.value)
            }
            className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {/* Footer Buttons */}
        <div className="pt-4 flex justify-between">
          <button
            type="button"
            onClick={() => handleDeletePin(pin._id)}
            className="px-5 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors duration-200 flex items-center shadow-sm hover:shadow-md"
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
          >
            <FontAwesomeIcon icon={faCheck} />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPinCard;
