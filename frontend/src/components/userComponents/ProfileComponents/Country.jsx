import React, { useState, useEffect } from "react";
import { countries } from "countries-list";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function CountrySelector() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const countryArray = Object.entries(countries)
    .map(([code, info]) => ({
      name: info.name,
      code: code,
    }))
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-[calc(100dvh-4rem)] bg-white"
    >
      {/* Header and Search */}
      <div className="p-4 shrink-0">
        <h2 className="text-center text-lg font-semibold mb-4">
          Change Country
        </h2>
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#cf3325]"
        />
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-4">
        {countryArray.map((c) => (
          <button
            key={c.code}
            onClick={() => setSelected(c.name)}
            className={`w-full flex items-center justify-between py-3 border-b ${
              selected === c.name ? "bg-red-50" : ""
            }`}
          >
            <span className="flex items-center gap-3">
              <img
                src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                alt={`${c.name} flag`}
                className="w-6 h-4 object-cover rounded-sm"
              />
              <span>{c.name}</span>
            </span>
            {selected === c.name && (
              <span className="text-[#cf3325] font-medium">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Sticky Footer */}
      <div className="pb-7 pt-3 text-center text-sm text-gray-500 border-t shrink-0">
        Selected Country:{" "}
        {selected ? (
          <span className="inline-flex items-center gap-2 font-medium text-black">
            <img
              src={`https://flagcdn.com/w40/${countryArray
                .find((c) => c.name === selected)
                ?.code.toLowerCase()}.png`}
              alt={`${selected} flag`}
              className="w-6 h-4 object-cover rounded-sm"
            />
            {selected}
          </span>
        ) : (
          <span className="font-medium text-black">None</span>
        )}
      </div>
    </motion.div>
  );
}
