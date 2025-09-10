export default function Card({ title, contacts }) {
  return (
    <div className="bg-white text-black rounded-2xl p-6 w-full max-w-md shadow-md hover:shadow-lg transition">
      {/* Title */}
      <h3 className="font-semibold text-lg mb-4 text-gray-800">{title}</h3>

      {/* Contacts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {contacts.map((contact, index) => (
          <a
            key={index}
            href={`tel:${contact.value}`}
            className="flex flex-col items-center justify-center px-4 py-3 rounded-xl bg-yellow-400 text-black font-medium hover:bg-yellow-300 transition"
          >
            <p className="text-[0.7rem] uppercase tracking-wide text-gray-800/70">
              {contact.label}
            </p>
            <p className="text-sm mt-1">{contact.value}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
