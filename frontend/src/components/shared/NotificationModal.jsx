import React from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

/**
 * Modern Notification Modal - Replaces alert() and confirm()
 * Types: success, error, warning, info
 * 
 * For alerts: Just provide isOpen, onClose, title, message, type
 * For confirmations: Also provide onConfirm callback to show Cancel/Confirm buttons
 */
export default function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info", // "success", "error", "warning", "info"
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm, // If provided, shows confirmation dialog with two buttons
  autoClose = false,
  autoCloseDuration = 3000,
}) {
  React.useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDuration, onClose]);

  if (!isOpen) return null;

  // Icon and color config based on type
  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      buttonColor: "bg-green-500 hover:bg-green-600",
    },
    error: {
      icon: XCircle,
      iconColor: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      buttonColor: "bg-red-500 hover:bg-red-600",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      buttonColor: "bg-yellow-500 hover:bg-yellow-600",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
    },
  };

  const currentConfig = config[type] || config.info;
  const Icon = currentConfig.icon;

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-slideUp">
        {/* Icon Circle */}
        <div className="flex justify-center pt-8 pb-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${currentConfig.bgColor} ${currentConfig.borderColor} border-2`}
          >
            <Icon className={`w-8 h-8 ${currentConfig.iconColor}`} />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 text-center">
          {title && <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>}
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="px-8 pb-8">
          {onConfirm ? (
            // Confirmation mode: Show Cancel + Confirm buttons
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-4 py-3 ${currentConfig.buttonColor} text-white font-medium rounded-xl transition-colors`}
              >
                {confirmText}
              </button>
            </div>
          ) : (
            // Alert mode: Show single OK button
            <button
              onClick={onClose}
              className={`w-full px-4 py-3 ${currentConfig.buttonColor} text-white font-medium rounded-xl transition-colors`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
