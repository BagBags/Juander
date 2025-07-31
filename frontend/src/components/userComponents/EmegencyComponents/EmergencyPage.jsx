import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "./Card";
import SideButtons from "../sideButtons";

export default function EmergencyPage() {
  const [hotlines, setHotlines] = useState([]);

  useEffect(() => {
    const fetchHotlines = async () => {
      try {
        const res = await axios.get("/api/emergency");
        const transformed = res.data.map((agency) => ({
          title: agency.name,
          contacts: agency.contactChannels.map((channel) => ({
            label: channel.label,
            value: channel.number,
          })),
        }));
        setHotlines(transformed);
      } catch (error) {
        console.error("Failed to fetch emergency contacts:", error);
      }
    };

    fetchHotlines();
  }, []);

  return (
    <div className="bg-[#f04e37] min-h-screen py-10 px-4 text-white relative">
      <div className="max-w-xl mx-auto text-center px-4 pl-10 pr-22 md:pl-20 md:pr-28 lg:pl-24 lg:pr-32">
        <h2 className="text-3xl font-bold mb-8">Emergency Hotlines</h2>
        <div className="flex flex-col items-center gap-6">
          {hotlines.map((item, index) => (
            <Card key={index} title={item.title} contacts={item.contacts} />
          ))}
        </div>
        <p className="mt-10 text-xs text-white opacity-70">
          © 2024 Intramuros Administration
        </p>
      </div>

      <SideButtons />
    </div>
  );
}
