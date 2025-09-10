import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "./Card";
import SideButtons from "../sideButtons";
import BackHeader from "../BackButton";

export default function EmergencyPage() {
  const [hotlines, setHotlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotlines = async () => {
      try {
        const res = await axios.get(`/api/emergency`);
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
      } finally {
        setLoading(false);
      }
    };

    fetchHotlines();
  }, []);

  return (
    <div className="min-h-screen bg-[#f04e37] flex flex-col items-center text-sm relative px-4 md:px-0 text-white">
      <div className="w-full max-w-xl">
        {/* Sticky Back Header */}
        <div className="pt-4 sticky top-0 bg-[#f04e37] z-20">
          <BackHeader title="Emergency Hotlines" />
        </div>

        {/* Page content */}
        <div className="mt-6 text-center">
          {loading ? (
            <p className="text-white/80 animate-pulse">Loading hotlines...</p>
          ) : hotlines.length > 0 ? (
            <div className="flex flex-col items-center gap-6">
              {hotlines.map((item, index) => (
                <Card key={index} title={item.title} contacts={item.contacts} />
              ))}
            </div>
          ) : (
            <p className="text-white/80">No hotlines available.</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-10 mb-4 text-xs text-center text-white/70">
        ©2025 Intramuros Administration
      </p>
    </div>
  );
}
