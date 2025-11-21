import { Phone } from "lucide-react";

export default function Card({ title, contacts, icon, highlightFirstContact = false }) {
  return (
    <div
      className="bg-white/95 backdrop-blur-md rounded-3xl p-6 w-full
                 border border-white/20 shadow-2xl hover:shadow-3xl hover:scale-[1.02]
                 transition-all duration-300 group"
    >
      {/* Title with Icon */}
      <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-200">
        {icon ? (
          <div className="relative">
            <div className="absolute inset-0 bg-[#f04e37]/20 rounded-full blur-md"></div>
            <img
              src={icon}
              alt={title}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#f04e37] shadow-lg relative"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="w-14 h-14 hidden items-center justify-center bg-gradient-to-br from-[#f04e37] to-orange-600 rounded-full text-white text-2xl shadow-lg relative">
              🏢
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 bg-[#f04e37]/20 rounded-full blur-md"></div>
            <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-[#f04e37] to-orange-600 rounded-full text-white text-2xl shadow-lg relative">
              🏢
            </div>
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-bold text-xl text-gray-800 group-hover:text-[#f04e37] transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">Emergency Hotline</p>
        </div>
      </div>

      {/* Contacts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {contacts.map((contact, index) => (
          <a
            key={index}
            href={`tel:${contact.value}`}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl 
                       bg-gradient-to-r from-[#f04e37] to-orange-600 text-white font-medium 
                       shadow-md hover:shadow-xl hover:scale-105 active:scale-95
                       transition-all duration-200 group/button ${highlightFirstContact && index === 0 ? 'emergency-first-contact' : ''}`}
          >
            <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-full group-hover/button:bg-white/30 transition-colors">
              <Phone className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[0.65rem] uppercase tracking-wider text-white/80 font-semibold">
                {contact.label}
              </p>
              <p className="text-base font-bold mt-0.5">{contact.value}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
