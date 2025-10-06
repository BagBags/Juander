export default function Card({ title, contacts, icon }) {
  return (
    <div
      className="bg-[#f04e37] text-white rounded-2xl p-6 w-full max-w-md 
                 border-2 border-[#d94b36] shadow-md hover:shadow-lg 
                 transition-all duration-300"
    >
      {/* Title with Icon */}
      <div className="flex items-center gap-3 mb-4">
        {icon ? (
          <img
            src={icon}
            alt={title}
            className="w-10 h-10 rounded-full object-cover border border-white shadow"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.png";
            }}
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-red-500 text-lg shadow">
            🏢
          </div>
        )}

        <h3 className="font-semibold text-lg">{title}</h3>
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
