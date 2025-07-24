import React from "react";
import { Pencil, Trash } from "lucide-react";

export default function UpdateEmergency({ onEdit, onDelete }) {
  return (
    <div className="flex gap-3">
      <button onClick={onDelete} className="hover:opacity-80">
        <Trash className="w-5 h-5" />
      </button>
      <button onClick={onEdit} className="hover:opacity-80">
        <Pencil className="w-5 h-5" />
      </button>
    </div>
  );
}
