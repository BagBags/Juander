import { X, FileText, Shield, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function TermsModal({ isOpen, onClose, onAccept, requireAcceptance = false }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;
    if (bottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (requireAcceptance && onAccept) {
      onAccept();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#f04e37] to-orange-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Terms & Conditions</h2>
                <p className="text-white/90 text-sm">Please read carefully before proceeding</p>
              </div>
            </div>
            {!requireAcceptance && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <X size={24} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          className="overflow-y-auto p-6 space-y-6 flex-1 bg-gray-50"
          onScroll={handleScroll}
        >
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Important Notice</p>
                <p className="text-xs text-blue-700 mt-1">Last Updated: November 11, 2025</p>
              </div>
            </div>
          </div>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Acceptance of Terms
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              By creating an account and using <span className="font-semibold text-[#f04e37]">Juander</span>, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our service.
            </p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Service Usage & License
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              Juander grants you a limited, non-exclusive, non-transferable license to access and use our tourism guide services for personal, non-commercial purposes. You agree not to:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Modify, copy, or create derivative works from our content</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Use the service for commercial purposes without authorization</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Reverse engineer, decompile, or disassemble any part of the application</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Remove or alter any copyright, trademark, or proprietary notices</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Account Responsibilities
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              You are solely responsible for:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Shield className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span>Maintaining the confidentiality of your account credentials</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Shield className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span>All activities that occur under your account</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Shield className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span>Notifying us immediately of any unauthorized access</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Shield className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span>Providing accurate and complete registration information</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">4</span>
              Prohibited Conduct
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              When using Juander, you must not:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-1">✗</span>
                <span>Violate any local, national, or international laws or regulations</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-1">✗</span>
                <span>Infringe on intellectual property rights of others</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-1">✗</span>
                <span>Upload viruses, malware, or any harmful code</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-1">✗</span>
                <span>Harass, abuse, or harm other users</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-1">✗</span>
                <span>Impersonate any person, entity, or falsify your identity</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-1">✗</span>
                <span>Attempt to gain unauthorized access to our systems</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">5</span>
              User Content & Intellectual Property
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              You retain ownership of all content you submit (reviews, photos, itineraries). However, by posting content on Juander, you grant us a worldwide, non-exclusive, royalty-free license to:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Use, display, and distribute your content within the platform</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Modify and adapt content for technical compatibility</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Promote Juander using your submitted content</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">6</span>
              Service Availability & Modifications
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              Juander reserves the right to modify, suspend, or discontinue any part of our service at any time, with or without notice. We are not liable for any modifications, interruptions, or discontinuance of the service. We strive to provide accurate tourism information, but cannot guarantee the completeness or accuracy of all content.
            </p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">7</span>
              Limitation of Liability
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              To the maximum extent permitted by law, Juander and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, revenue, or profits, arising from your use of or inability to use our service. Our total liability shall not exceed the amount you paid us in the past 12 months.
            </p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">8</span>
              Account Termination
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              We reserve the right to suspend or terminate your account immediately if:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>You violate these Terms and Conditions</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Your account is used for fraudulent or illegal activities</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>You request account deletion</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">9</span>
              Governing Law & Dispute Resolution
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              These Terms are governed by the laws of the Republic of the Philippines. Any disputes arising from these Terms or your use of Juander shall be resolved through binding arbitration in Metro Manila, Philippines, except where prohibited by law.
            </p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">10</span>
              Changes to Terms
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              We may update these Terms from time to time. We will notify you of any material changes by posting the new Terms on this page and updating the "Last Updated" date. Your continued use of Juander after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">11</span>
              Contact Us
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              For questions, concerns, or feedback regarding these Terms and Conditions, please contact us at:
            </p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700"><span className="font-semibold">Email:</span> support@juander.com</p>
              <p className="text-sm text-gray-700 mt-1"><span className="font-semibold">Location:</span> Intramuros, Manila, Philippines</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          {requireAcceptance ? (
            <>
              {!hasScrolledToBottom && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800">
                    Please scroll to the bottom to read all terms before accepting
                  </p>
                </div>
              )}
              
              <label className="flex items-start gap-3 mb-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={hasAccepted}
                  onChange={(e) => setHasAccepted(e.target.checked)}
                  disabled={!hasScrolledToBottom}
                  className="mt-1 w-5 h-5 text-[#f04e37] border-gray-300 rounded focus:ring-[#f04e37] focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={`text-sm leading-relaxed ${
                  hasScrolledToBottom ? 'text-gray-700 group-hover:text-gray-900' : 'text-gray-400'
                }`}>
                  I have read and agree to the <span className="font-semibold text-[#f04e37]">Terms and Conditions</span> of Juander
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition duration-200 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!hasAccepted || !hasScrolledToBottom}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition duration-200 active:scale-95 ${
                    hasAccepted && hasScrolledToBottom
                      ? 'bg-[#f04e37] text-white hover:bg-[#d9442f] shadow-md'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Accept & Continue
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-[#f04e37] text-white px-4 py-3 rounded-lg shadow-md font-semibold hover:bg-[#d9442f] transition duration-200 active:scale-95"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
