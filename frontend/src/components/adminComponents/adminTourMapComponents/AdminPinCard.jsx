// components/adminComponents/AdminPinCard.jsx
import React, { Suspense, lazy } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faCheck, faUpload } from "@fortawesome/free-solid-svg-icons";

// ✅ Lazy load the heavy 3D preview
const ThreeDModelPreview = lazy(() => import("./ThreeDModelPreview"));

export default function AdminPinCard({ pin, onApprove, onDelete }) {
  return (
    <div className="p-4 border rounded-lg shadow bg-white">
      <h3 className="text-lg font-semibold">{pin.name}</h3>
      <p className="text-gray-600">{pin.description}</p>

      {/* ✅ Load 3D preview ONLY if the pin has a GLB file */}
      {pin.glbUrl && (
        <Suspense fallback={<p>Loading 3D preview...</p>}>
          <ThreeDModelPreview url={pin.glbUrl} />
        </Suspense>
      )}

      <div className="flex space-x-2 mt-3">
        <button
          className="bg-green-500 text-white px-3 py-1 rounded"
          onClick={() => onApprove(pin.id)}
        >
          <FontAwesomeIcon icon={faCheck} /> Approve
        </button>
        <button
          className="bg-red-500 text-white px-3 py-1 rounded"
          onClick={() => onDelete(pin.id)}
        >
          <FontAwesomeIcon icon={faTrash} /> Delete
        </button>
      </div>
    </div>
  );
}
