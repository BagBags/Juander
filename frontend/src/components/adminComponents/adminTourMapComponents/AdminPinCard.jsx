// components/adminComponents/AdminPinCard.jsx
import React, { Suspense, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faCheck, faUpload, faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei";
const BACKEND_URL = "http://localhost:5000";

// 3D Model Preview Component
const ModelPreview = ({ url }) => {
  const { scene } = useGLTF(url, true);
  // Rotate to match Blender's coordinate system: -Y front, X right, Z up
  return <primitive object={scene} scale={0.5} rotation={[0, 0, 0]} />;
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
  handleMediaUpload,
  handleRemoveMedia,
  previewGlb,
  onClose,
}) => {
  if (!pin) return null;

  // Initialize description sections from existing siteDescription
  const [descriptionSections, setDescriptionSections] = useState([]);

  useEffect(() => {
    // Split existing description into sections (by double line breaks or keep as single section)
    if (pin.siteDescription) {
      const sections = pin.siteDescription.split('\n\n').filter(s => s.trim());
      setDescriptionSections(sections.length > 0 ? sections : [pin.siteDescription]);
    } else {
      setDescriptionSections(['']);
    }
  }, [pin._id]); // Only reset when pin changes

  // Add a new description section
  const addDescriptionSection = () => {
    setDescriptionSections([...descriptionSections, '']);
  };

  // Remove a description section
  const removeDescriptionSection = (index) => {
    if (descriptionSections.length > 1) {
      const newSections = descriptionSections.filter((_, i) => i !== index);
      setDescriptionSections(newSections);
      // Update the pin field immediately
      updatePinField(selectedPinIndex, 'siteDescription', newSections.join('\n\n'));
    }
  };

  // Update a specific section
  const updateDescriptionSection = (index, value) => {
    const newSections = [...descriptionSections];
    newSections[index] = value;
    setDescriptionSections(newSections);
    // Compile all sections into one paragraph and update pin
    updatePinField(selectedPinIndex, 'siteDescription', newSections.join('\n\n'));
  };

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
        {/* Site Description - Multiple Sections */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Site Description
            </label>
            <button
              type="button"
              onClick={addDescriptionSection}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              Add Section
            </button>
          </div>
          <div className="space-y-3">
            {descriptionSections.map((section, index) => (
              <div key={index} className="relative">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Section {index + 1}
                    </label>
                    <textarea
                      value={section}
                      onChange={(e) => updateDescriptionSection(index, e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      rows="3"
                      placeholder={`Enter description section ${index + 1}`}
                    />
                  </div>
                  {descriptionSections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDescriptionSection(index)}
                      className="mt-6 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Remove section"
                    >
                      <FontAwesomeIcon icon={faMinus} className="text-xs" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Multiple sections will be combined into one paragraph when saved.
          </p>
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
        {/* Media Files Upload */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media Files (Images/Videos)
          </label>
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => handleMediaUpload(e, selectedPinIndex)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors duration-200">
                <FontAwesomeIcon
                  icon={faUpload}
                  className="text-gray-400 text-lg mb-2"
                />
                <p className="text-sm text-gray-600">
                  {pin.mediaFiles && pin.mediaFiles.length > 0
                    ? "Add More Media Files"
                    : "Upload Images/Videos"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Select multiple files (Max 10)
                </p>
              </div>
            </div>
            
            {/* Media Files Preview */}
            {pin.mediaFiles && pin.mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {pin.mediaFiles.map((media, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200">
                    {media.type === "video" ? (
                      <video
                        src={`${BACKEND_URL}${media.url}`}
                        className="w-full h-32 object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={`${BACKEND_URL}${media.url}`}
                        alt={`Media ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(selectedPinIndex, index)}
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow hover:bg-red-600 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                    <ambientLight intensity={1.2} />
                    <directionalLight position={[10, 10, 10]} intensity={1.5} />
                    <directionalLight position={[-5, 5, -5]} intensity={0.5} />
                    <Bounds fit clip observe margin={0.8}>
                      <Center>
                        <ModelPreview
                          url={
                            pin.glbUrl
                              ? `${BACKEND_URL}${
                                  pin.glbUrl.startsWith("/") ? "" : "/"
                                }${pin.glbUrl}`
                              : null
                          }
                        />
                      </Center>
                    </Bounds>
                    <OrbitControls
                      enableZoom={true}
                      minPolarAngle={Math.PI / 3}
                      maxPolarAngle={Math.PI / 2}
                    />
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
          
          {/* Reason for Inactive Status */}
          {pin.status === "inactive" && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Unavailability
              </label>
              <select
                value={pin.inactiveReason || ""}
                onChange={(e) =>
                  updatePinField(selectedPinIndex, "inactiveReason", e.target.value)
                }
                className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">Select a reason</option>
                <option value="under_construction">Under Construction</option>
                <option value="temporarily_closed">Temporarily Closed</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="no_longer_exists">No Longer Exists</option>
                <option value="restricted_access">Restricted Access</option>
                <option value="safety_concerns">Safety Concerns</option>
                <option value="other">Other</option>
              </select>
              
              {/* Additional notes for "Other" reason */}
              {pin.inactiveReason === "other" && (
                <textarea
                  value={pin.inactiveReasonDetails || ""}
                  onChange={(e) =>
                    updatePinField(selectedPinIndex, "inactiveReasonDetails", e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-xl p-3 mt-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows="2"
                  placeholder="Please specify the reason..."
                  required
                />
              )}
            </div>
          )}
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
