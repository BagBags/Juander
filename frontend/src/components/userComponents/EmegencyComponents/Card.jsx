export default function Card({ title, contacts, logo, icon }) {
  return (
    <div
      className="bg-[#f04e37] text-white rounded-2xl p-6 w-full max-w-md 
                    border-2 border-[#d94b36] shadow-md hover:shadow-lg 
                    transition-all duration-300"
    >
      {/* Title with Logo and Card Icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <img
            src="https://intramuros.gov.ph/wp-content/uploads/2015/09/cropped-iaLogo.png"
            alt="logo"
            className="w-8 h-8 object-contain"
          />
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>

        {icon && (
          <div className="w-9 h-9 flex items-center justify-center bg-white rounded-full border border-gray-200 shadow">
            <img
              src={icon}
              alt="card icon"
              className="w-5 h-5 object-contain"
            />
          </div>
        )}
      </div>

      {/* Contacts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {contacts.map((contact, index) => (
          <a
            key={index}
            href={`tel:${contact.value}`}
            className="flex flex-col items-center justify-center px-4 py-3 rounded-xl 
                       bg-white text-black font-medium border border-gray-200 shadow 
                       hover:shadow-lg transition-all duration-300"
          >
            <p className="text-[0.7rem] uppercase tracking-wide text-gray-600">
              {contact.label}
            </p>
            <p className="text-sm mt-1">{contact.value}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
