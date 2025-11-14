import { X, Shield, Lock, Eye, Database, AlertCircle } from "lucide-react";

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#f04e37] to-orange-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
                <p className="text-white/90 text-sm">Your privacy is important to us</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 bg-gray-50">
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
              Information We Collect
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              To provide you with the best tourism experience, we collect the following information:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Database className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Personal Information:</span> Name, email address, and profile details</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Lock className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Account Credentials:</span> Securely encrypted passwords</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Database className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Travel Data:</span> Itineraries, site visits, reviews, and photos</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Eye className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Usage Information:</span> Device data, location (with permission), and app interactions</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Database className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Communication:</span> Messages and feedback you send to us</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              How We Use Your Information
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              Your information helps us deliver and improve Juander's services:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Provide personalized tourism recommendations and itinerary planning</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Process and manage your account, bookings, and preferences</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Send important notifications about your trips and app updates</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Respond to your inquiries and provide customer support</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Improve app functionality and user experience</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Analyze usage patterns to enhance our tourism content</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Information Sharing & Disclosure
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              <span className="font-semibold text-[#f04e37]">We do not sell your personal information.</span> We only share your data in these limited circumstances:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">With Your Consent:</span> When you explicitly authorize us to share</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Service Providers:</span> Trusted partners who help operate our platform (hosting, analytics)</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Legal Requirements:</span> When required by law or to protect rights</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Safety & Security:</span> To prevent fraud and ensure platform security</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">4</span>
              Data Security
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              We take your data security seriously and implement multiple layers of protection:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Lock className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Encryption:</span> All data transmitted is encrypted using industry-standard SSL/TLS</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Lock className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Secure Storage:</span> Passwords are hashed and salted before storage</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Lock className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Access Controls:</span> Strict internal policies limit data access to authorized personnel only</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Lock className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Regular Audits:</span> Continuous monitoring and security assessments</span>
              </li>
            </ul>
            <p className="text-xs text-gray-600 mt-3 italic">
              Note: While we implement robust security measures, no method of internet transmission is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">5</span>
              Cookies & Tracking Technologies
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              We use cookies and similar technologies to enhance your experience:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span><span className="font-semibold">Essential Cookies:</span> Required for basic app functionality and security</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span><span className="font-semibold">Preference Cookies:</span> Remember your settings and language choices</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span><span className="font-semibold">Analytics:</span> Help us understand how you use Juander to improve features</span>
              </li>
            </ul>
            <p className="text-sm text-gray-700 mt-3">
              You can control cookies through your browser settings, though some features may not work properly if disabled.
            </p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">6</span>
              Third-Party Services
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              Juander integrates with trusted third-party services to enhance functionality:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span><span className="font-semibold">Google Services:</span> For authentication and maps</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span><span className="font-semibold">Mapbox:</span> For interactive mapping features</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span><span className="font-semibold">Cloud Storage:</span> For secure media hosting</span>
              </li>
            </ul>
            <p className="text-sm text-gray-700 mt-3">
              These services have their own privacy policies. We are not responsible for their practices and encourage you to review their policies.
            </p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">7</span>
              Data Retention
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              We retain your personal information only as long as necessary for the purposes outlined in this policy. Specifically:
            </p>
            <ul className="space-y-2 ml-4 mt-3">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span><span className="font-semibold">Active Accounts:</span> Data retained while your account is active</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span><span className="font-semibold">Deleted Accounts:</span> Most data removed within 30 days, some retained for legal compliance</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span><span className="font-semibold">Legal Requirements:</span> Some data may be retained longer as required by law</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">8</span>
              Your Privacy Rights
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              You have full control over your personal information. Your rights include:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Eye className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Access:</span> Request a copy of all personal data we hold about you</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Eye className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Correction:</span> Update or correct inaccurate information</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Eye className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Deletion:</span> Request removal of your personal data (right to be forgotten)</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Eye className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Portability:</span> Receive your data in a structured, machine-readable format</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Eye className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Objection:</span> Object to processing of your data for specific purposes</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Eye className="w-4 h-4 text-[#f04e37] mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Withdraw Consent:</span> Revoke consent at any time where we rely on it</span>
              </li>
            </ul>
            <p className="text-sm text-gray-700 mt-3">
              To exercise these rights, contact us at <span className="font-semibold text-[#f04e37]">privacy@juander.com</span>
            </p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">9</span>
              Children's Privacy
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              Juander is designed for users aged <span className="font-semibold">13 and above</span>. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately at <span className="font-semibold text-[#f04e37]">privacy@juander.com</span> and we will delete such information from our systems.
            </p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">10</span>
              Changes to This Privacy Policy
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. When we make material changes, we will:
            </p>
            <ul className="space-y-2 ml-4 mt-3">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Update the "Last Updated" date at the top of this policy</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Notify you via email or in-app notification</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#f04e37] mt-1">•</span>
                <span>Provide a reasonable notice period before changes take effect</span>
              </li>
            </ul>
            <p className="text-sm text-gray-700 mt-3">
              Your continued use of Juander after changes indicates acceptance of the updated policy.
            </p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-[#f04e37] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">11</span>
              Contact Us
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm mb-3">
              We're here to help with any privacy concerns or questions. Reach out to us:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="font-semibold min-w-[80px]">Email:</span>
                <span className="text-[#f04e37] font-semibold">privacy@juander.com</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="font-semibold min-w-[80px]">Support:</span>
                <span className="text-[#f04e37] font-semibold">support@juander.com</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="font-semibold min-w-[80px]">Location:</span>
                <span>Intramuros, Manila, Philippines</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 italic">
              We aim to respond to all privacy-related inquiries within 48 hours.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-[#f04e37] text-white px-4 py-3 rounded-lg shadow-md font-semibold hover:bg-[#d9442f] transition duration-200 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
