import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "./Card";
import MainLayout from "../MainLayout";
import BackHeader from "../BackButton";
import ttsService from "../../../utils/textToSpeech";
import { useTranslation } from "react-i18next";
import { Phone, AlertCircle } from "lucide-react";

export default function EmergencyPage() {
  const { t } = useTranslation();
  const [hotlines, setHotlines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Announce page load
  useEffect(() => {
    ttsService.speak(t('tts_emergencyPage'));
  }, [t]);

  useEffect(() => {
    const fetchHotlines = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/emergency`);
        const transformed = res.data.map((agency) => ({
          title: agency.name,
          icon: agency.icon
            ? agency.icon.startsWith("http")
              ? agency.icon
              : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000"}${agency.icon}`
            : null,
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
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-[#f04e37] to-orange-600 flex flex-col relative" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Global TTS Button */}

      {/* Sticky Back Header */}
      <BackHeader title="Emergency Hotlines" />

      <MainLayout includeSideButtons={false}>
        <div className="w-full max-w-4xl mx-auto px-4 pt-20 pb-8">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-2xl mb-4 animate-pulse">
              <Phone className="w-10 h-10 text-[#f04e37]" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
              Emergency Contacts
            </h1>
            <p className="text-white/90 text-sm md:text-base max-w-2xl mx-auto">
              Quick access to emergency services in Intramuros. Tap any number to call immediately.
            </p>
          </div>

          {/* Alert Banner */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
            <p className="text-white/90 text-sm">
              <span className="font-semibold">Important:</span> These hotlines are for emergencies only. 
              For non-urgent inquiries, please visit the Intramuros Administration office.
            </p>
          </div>

          {/* Hotlines Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="text-white/80 text-lg">Loading emergency contacts...</p>
            </div>
          ) : hotlines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hotlines.map((item, index) => (
                <Card
                  key={index}
                  title={item.title}
                  contacts={item.contacts}
                  icon={item.icon}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-white/80 text-lg">No emergency contacts available at the moment.</p>
            </div>
          )}
        </div>
      </MainLayout>

      {/* Footer */}
      <div className="mt-auto py-6 text-center">
        <p className="text-white/60 text-xs">
          © 2025 Intramuros Administration. All rights reserved.
        </p>
      </div>
    </div>
  );
}
