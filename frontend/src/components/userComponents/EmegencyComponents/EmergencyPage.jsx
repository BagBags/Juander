import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "./Card";
import MainLayout from "../MainLayout";
import BackHeader from "../BackButton";
import ttsService from "../../../utils/textToSpeech";
import GlobalTTSButton from "../../GlobalTTSButton";
import { useTranslation } from "react-i18next";

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
        const res = await axios.get(`/api/emergency`);
        const transformed = res.data.map((agency) => ({
          title: agency.name,
          icon: agency.icon
            ? agency.icon.startsWith("http")
              ? agency.icon
              : `http://localhost:5000${agency.icon}`
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
    <div className="min-h-screen  flex flex-col items-center text-sm relative px-4 md:px-0 text-white ">
      {/* Global TTS Button */}
      <GlobalTTSButton />

      {/* Sticky Back Header */}
      <div className="pt-4 sticky top-0 text-black bg-white z-20 w-full">
        <BackHeader title="Emergency Hotlines" />
      </div>

      <MainLayout includeSideButtons={false}>
        <div className="w-full max-w-xl">
          {/* Page content */}
          <div className="mt-6 text-center">
          {loading ? (
            <p className="text-white/80 animate-pulse">Loading hotlines...</p>
          ) : hotlines.length > 0 ? (
            <div className="flex flex-col items-center gap-6">
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
            <p className="text-white/80">No hotlines available.</p>
          )}
        </div>
        </div>
      </MainLayout>

      {/* Footer */}
      <p className="mt-10 mb-4 text-xs text-center text-white/70">
        ©2025 Intramuros Administration
      </p>
    </div>
  );
}
