import { X } from "lucide-react";

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[60vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Terms of Service</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          <p className="text-sm text-gray-500">
            Last Updated: October 11, 2025
          </p>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              1. Acceptance of Terms
            </h3>
            <p className="text-gray-600 leading-relaxed">
              By accessing and using Juander, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              2. Use License
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Permission is granted to temporarily use Juander for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or other proprietary notations</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              3. User Account
            </h3>
            <p className="text-gray-600 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              4. Prohibited Activities
            </h3>
            <p className="text-gray-600 leading-relaxed">
              You may not use Juander to:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit any harmful or malicious code</li>
              <li>Engage in any form of harassment or abuse</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              5. Content Ownership
            </h3>
            <p className="text-gray-600 leading-relaxed">
              All content you submit, post, or display on Juander remains your property. However, by submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such content.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              6. Service Modifications
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              7. Limitation of Liability
            </h3>
            <p className="text-gray-600 leading-relaxed">
              In no event shall Juander or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Juander.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              8. Termination
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              9. Governing Law
            </h3>
            <p className="text-gray-600 leading-relaxed">
              These Terms shall be governed and construed in accordance with the laws of your jurisdiction, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              10. Contact Information
            </h3>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about these Terms, please contact us at support@juander.com
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-[#f04e37] text-white px-4 py-3 rounded-lg shadow-md font-semibold hover:bg-[#d9442f] transition duration-200 active:scale-95"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
