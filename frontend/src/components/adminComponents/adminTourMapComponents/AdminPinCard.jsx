// components/adminComponents/AdminPinCard.jsx
import React, { Suspense, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faCheck, faUpload, faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei";
import { Lightbulb, Search, X } from "lucide-react";
import axios from "axios";
// Extract base URL from VITE_API_BASE_URL (remove /api suffix if present)
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
  : "http://localhost:5000";

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
  handleArchive,
  handleGlbUpload,
  handleFacadeUpload,
  handleRemoveFacade,
  handleRemoveGlb,
  handleMediaUpload,
  handleRemoveMedia,
  previewGlb,
  onClose,
  categories = [],
  fetchCategories,
  validationErrors = {},
  setValidationErrors,
}) => {
  if (!pin) return null;

  // Language toggle state
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  
  // Category search state
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // English sections
  const [descriptionSections, setDescriptionSections] = useState([]);
  // Tagalog sections
  const [tagalogSections, setTagalogSections] = useState([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCategoryDropdown && !e.target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
        setCategorySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown]);

  useEffect(() => {
    // Initialize English sections
    if (pin.siteDescription) {
      const sections = pin.siteDescription.split('\n\n').filter(s => s.trim());
      setDescriptionSections(sections.length > 0 ? sections : ['']);
    } else {
      setDescriptionSections(['']);
    }
    
    // Initialize Tagalog sections
    if (pin.siteDescriptionTagalog) {
      const sections = pin.siteDescriptionTagalog.split('\n\n').filter(s => s.trim());
      setTagalogSections(sections.length > 0 ? sections : ['']);
    } else {
      setTagalogSections(['']);
    }
  }, [pin._id]);

  // English section handlers
  const addEnglishSection = () => {
    setDescriptionSections([...descriptionSections, '']);
  };

  const removeEnglishSection = (index) => {
    if (descriptionSections.length > 1) {
      const newSections = descriptionSections.filter((_, i) => i !== index);
      setDescriptionSections(newSections);
      updatePinField(selectedPinIndex, 'siteDescription', newSections.join('\n\n'));
    }
  };

  const updateEnglishSection = (index, value) => {
    const newSections = [...descriptionSections];
    newSections[index] = value;
    setDescriptionSections(newSections);
    updatePinField(selectedPinIndex, 'siteDescription', newSections.join('\n\n'));
  };

  // Tagalog section handlers
  const addTagalogSection = () => {
    setTagalogSections([...tagalogSections, '']);
  };

  const removeTagalogSection = (index) => {
    if (tagalogSections.length > 1) {
      const newSections = tagalogSections.filter((_, i) => i !== index);
      setTagalogSections(newSections);
      updatePinField(selectedPinIndex, 'siteDescriptionTagalog', newSections.join('\n\n'));
    }
  };

  const updateTagalogSection = (index, value) => {
    const newSections = [...tagalogSections];
    newSections[index] = value;
    setTagalogSections(newSections);
    updatePinField(selectedPinIndex, 'siteDescriptionTagalog', newSections.join('\n\n'));
  };

  // Category handlers
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleAddNewCategory = async () => {
    if (!categorySearch.trim()) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/categories`,
        { name: categorySearch.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (fetchCategories) {
        await fetchCategories();
      }
      
      // Set the newly created category
      updatePinField(selectedPinIndex, "category", res.data._id);
      setCategorySearch('');
      setShowCategoryDropdown(false);
    } catch (err) {
      console.error("Error creating category:", err);
      alert(err.response?.data?.message || "Failed to create category");
    }
  };

  const selectedCategory = categories.find(cat => cat._id === pin.category);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
      <div className="w-full max-w-[900px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-100 animate-fade-in pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b border-gray-100 rounded-t-2xl bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-xl font-bold text-gray-800">Pin Details</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
        >
          <span className="text-2xl">✕</span>
        </button>
      </div>

      {/* Scrollable Form */}
      <form
        onSubmit={(e) => handleFormSubmit(e, selectedPinIndex)}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        {/* Site Name */}
        <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">
            Site Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={pin.siteName || ""}
            onChange={(e) => {
              updatePinField(selectedPinIndex, "siteName", e.target.value);
              if (setValidationErrors) {
                setValidationErrors(prev => ({ ...prev, siteName: "" }));
              }
            }}
            className={`w-full border rounded-xl p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              validationErrors.siteName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter site name"
          />
          {validationErrors.siteName && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.siteName}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="relative category-dropdown-container">
          <label className="block text-base font-semibold text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div
              className={`w-full border rounded-xl p-4 text-base transition-all duration-200 cursor-pointer bg-white flex items-center justify-between ${
                validationErrors.category ? 'border-red-500' : 'border-gray-300'
              }`}
              style={{ borderColor: '#d1d5db' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f04e37'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <span className={selectedCategory ? "text-gray-800" : "text-gray-400"}>
                {selectedCategory ? selectedCategory.name : "Choose Category"}
              </span>
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            
            {showCategoryDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-white border-2 rounded-xl shadow-lg max-h-64 overflow-hidden flex flex-col" style={{ borderColor: '#f9c5bd' }}>
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Search or add new category..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                      onFocus={(e) => { e.target.style.borderColor = '#f04e37'; e.target.style.boxShadow = '0 0 0 3px rgba(240, 78, 55, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                
                <div className="overflow-y-auto max-h-48">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <div
                        key={cat._id}
                        className="px-4 py-2.5 cursor-pointer text-sm transition"
                        style={pin.category === cat._id ? { backgroundColor: '#fef2f0', color: '#f04e37', fontWeight: '500' } : { color: '#374151' }}
                        onMouseEnter={(e) => { if (pin.category !== cat._id) e.currentTarget.style.backgroundColor = '#fef2f0'; }}
                        onMouseLeave={(e) => { if (pin.category !== cat._id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        onClick={() => {
                          updatePinField(selectedPinIndex, "category", cat._id);
                          if (setValidationErrors) {
                            setValidationErrors(prev => ({ ...prev, category: "" }));
                          }
                          setShowCategoryDropdown(false);
                          setCategorySearch('');
                        }}
                      >
                        {cat.name}
                      </div>
                    ))
                  ) : categorySearch.trim() ? (
                    <div
                      className="px-4 py-3 hover:bg-green-50 cursor-pointer text-sm text-green-700 font-medium border-t border-green-200 bg-green-50/50"
                      onClick={handleAddNewCategory}
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add "{categorySearch}"
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 italic">
                      No categories found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {validationErrors.category && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.category}
            </p>
          )}
        </div>

        {/* Site Description - Language Toggle with Sections */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-base font-semibold text-gray-700">
              Site Description <span className="text-red-500">*</span>
            </label>
            {/* Language Toggle Slider */}
            <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setSelectedLanguage('english')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  selectedLanguage === 'english'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage('tagalog')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  selectedLanguage === 'tagalog'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tagalog
              </button>
            </div>
          </div>
          
          {/* English Description Sections */}
          {selectedLanguage === 'english' && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-600">
                  English Description (Sections)
                </label>
                <button
                  type="button"
                  onClick={addEnglishSection}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
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
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Section {index + 1}
                        </label>
                        <textarea
                          value={section}
                          onChange={(e) => updateEnglishSection(index, e.target.value)}
                          className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          rows="4"
                          placeholder={`Enter English section ${index + 1}`}
                        />
                      </div>
                      {descriptionSections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEnglishSection(index)}
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
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                <Lightbulb className="w-3.5 h-3.5" />
                <p>Each section will be a separate paragraph</p>
              </div>
            </div>
          )}
          
          {/* Tagalog Description Sections */}
          {selectedLanguage === 'tagalog' && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-600">
                  Tagalog Description (Mga Seksyon)
                </label>
                <button
                  type="button"
                  onClick={addTagalogSection}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                  Add Section
                </button>
              </div>
              <div className="space-y-3">
                {tagalogSections.map((section, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Section {index + 1}
                        </label>
                        <textarea
                          value={section}
                          onChange={(e) => updateTagalogSection(index, e.target.value)}
                          className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          rows="4"
                          placeholder={`Enter Tagalog section ${index + 1}`}
                        />
                      </div>
                      {tagalogSections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTagalogSection(index)}
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
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                <Lightbulb className="w-3.5 h-3.5" />
                <p>Each section will be a separate paragraph</p>
              </div>
            </div>
          )}
          
          {/* Status Indicators */}
          <div className="flex gap-2 mt-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              (pin.siteDescription || '').trim() 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                (pin.siteDescription || '').trim() ? 'bg-green-500' : 'bg-gray-400'
              }`}></span>
              English: {(pin.siteDescription || '').trim() ? `${descriptionSections.length} section(s)` : 'Empty'}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              (pin.siteDescriptionTagalog || '').trim() 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                (pin.siteDescriptionTagalog || '').trim() ? 'bg-green-500' : 'bg-gray-400'
              }`}></span>
              Tagalog: {(pin.siteDescriptionTagalog || '').trim() ? `${tagalogSections.length} sections` : 'Empty'}
            </div>
          </div>
          {validationErrors.siteDescription && (
            <p className="text-red-500 text-sm mt-2">
              {validationErrors.siteDescription}
            </p>
          )}
        </div>
        {/* 2D Facade Landmark */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            2D Facade Image <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleFacadeUpload(e, selectedPinIndex);
                  if (setValidationErrors) {
                    setValidationErrors(prev => ({ ...prev, facadeUrl: "" }));
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`border-2 border-dashed rounded-xl p-4 text-center hover:border-blue-400 transition-colors duration-200 ${
                validationErrors.facadeUrl ? 'border-red-500' : 'border-gray-300'
              }`}>
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
                  src={
                    pin.facadeUrl.startsWith('http') 
                      ? pin.facadeUrl 
                      : pin.facadeUrl.includes('s3.amazonaws.com')
                        ? pin.facadeUrl
                        : `${BACKEND_URL}${pin.facadeUrl}`
                  }
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
            {validationErrors.facadeUrl && (
              <p className="text-red-500 text-sm mt-2">
                {validationErrors.facadeUrl}
              </p>
            )}
          </div>
        </div>
        {/* Media Files Upload */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media Files (Images/Videos) <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => {
                  handleMediaUpload(e, selectedPinIndex);
                  if (setValidationErrors) {
                    setValidationErrors(prev => ({ ...prev, mediaFiles: "" }));
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`border-2 border-dashed rounded-xl p-4 text-center hover:border-blue-400 transition-colors duration-200 ${
                validationErrors.mediaFiles ? 'border-red-500' : 'border-gray-300'
              }`}>
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
                {pin.mediaFiles.map((media, index) => {
                  // Priority: S3 URL > HTTP URL > Local path
                  const mediaUrl = media.url?.startsWith('http') 
                    ? media.url 
                    : media.url?.includes('s3.amazonaws.com')
                      ? media.url
                      : `${BACKEND_URL}${media.url}`;
                  
                  return (
                    <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200">
                      {media.type === "video" ? (
                        <video
                          src={mediaUrl}
                          className="w-full h-32 object-cover"
                          controls
                        >
                          <track kind="captions" />
                        </video>
                      ) : (
                        <img
                          src={mediaUrl}
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
                  );
                })}
              </div>
            )}
            {validationErrors.mediaFiles && (
              <p className="text-red-500 text-sm mt-2">
                {validationErrors.mediaFiles}
              </p>
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
                              ? pin.glbUrl.startsWith('http') 
                                ? pin.glbUrl 
                                : `${BACKEND_URL}${pin.glbUrl.startsWith("/") ? "" : "/"}${pin.glbUrl}`
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
        
        {/* Entrance Fee Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entrance Fee
          </label>
          <select
            value={pin.feeType || "none"}
            onChange={(e) => {
              const newFeeType = e.target.value;
              updatePinField(selectedPinIndex, "feeType", newFeeType);
              
              if (newFeeType === "none") {
                updatePinField(selectedPinIndex, "feeAmount", null);
              }
            }}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="none">None (Free Entry)</option>
            <option value="fort_santiago">Inside Fort Santiago</option>
            <option value="custom_fee">Custom Entrance Fee</option>
          </select>
          
          {/* Fee Amount Input - Show only when Fort Santiago or Custom Fee is selected */}
          {(pin.feeType === "fort_santiago" || pin.feeType === "custom_fee") && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Regular Price (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pin.feeAmount || ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : Number(e.target.value);
                      updatePinField(selectedPinIndex, "feeAmount", value);
                    }}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter regular price"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Discounted Price (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pin.feeAmountDiscounted || ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : Number(e.target.value);
                      updatePinField(selectedPinIndex, "feeAmountDiscounted", value);
                    }}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-medium mb-1">
                  Discounted Price Information
                </p>
                <p className="text-xs text-blue-600">
                  Discounted price applies to Students, PWD (Persons with Disabilities), and Senior Citizens. Leave blank if no discount is available.
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {pin.feeType === "fort_santiago" 
                  ? "Leave prices empty to use the default Fort Santiago entrance fee message" 
                  : "Specify the entrance fee amounts for this site"}
              </p>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
            Configure the entrance fee information for this site.
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
                />
              )}
              {validationErrors.inactiveReasonDetails && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.inactiveReasonDetails}
                </p>
              )}
            </div>
          )}
        </div>
        {/* Footer Buttons */}
        <div className="pt-4 flex justify-between">
          <button
            type="button"
            onClick={() => handleArchive(pin._id)}
            className="px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            <FontAwesomeIcon icon={faTrash} />
            Archive
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
    </div>
  );
};

export default AdminPinCard;
