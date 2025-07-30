export default function Card({ title, contacts }) {
  return (
    <div className="bg-white text-black rounded-xl p-4 w-full max-w-md shadow-md">
      <h3 className="font-bold text-lg mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {contacts.map((contact, index) => (
          <div
            key={index}
            className="bg-yellow-400 px-3 py-2 rounded-md font-medium text-center"
          >
            <p className="text-xs">{contact.label}</p>
            <p className="text-sm">{contact.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
