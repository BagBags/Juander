import { X } from "lucide-react";

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[60vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Privacy Policy</h2>
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
              1. Information We Collect
            </h3>
            <p className="text-gray-600 leading-relaxed mb-2">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
              <li>Name and contact information (email address)</li>
              <li>Account credentials (username and password)</li>
              <li>Profile information and preferences</li>
              <li>Itinerary data and travel plans</li>
              <li>Communication data when you contact us</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              2. How We Use Your Information
            </h3>
            <p className="text-gray-600 leading-relaxed mb-2">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Personalize and improve your experience</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              3. Information Sharing
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>With your consent or at your direction</li>
              <li>With service providers who assist in our operations</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              4. Data Security
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              5. Cookies and Tracking
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              6. Third-Party Services
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Our service may contain links to third-party websites or services that are not owned or controlled by Juander. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              7. Data Retention
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              8. Your Rights
            </h3>
            <p className="text-gray-600 leading-relaxed mb-2">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
              <li>Access and receive a copy of your personal data</li>
              <li>Rectify inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              9. Children's Privacy
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              10. Changes to This Policy
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              11. Contact Us
            </h3>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at privacy@juander.com
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
