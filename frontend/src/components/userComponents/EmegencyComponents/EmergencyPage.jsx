import React from "react";
import Card from "./Card";
import SideButtons from "../sideButtons";

export default function EmergencyPage() {
  const hotlines = [
    {
      title: "National Capital Region Police Office",
      contacts: [
        { label: "GLOBE", value: "0915 888 8181" },
        { label: "SMART", value: "0999 901 8181" },
        { label: "FACEBOOK", value: "@NCRPO.PH" },
        { label: "TWITTER", value: "@NCRPOreact" },
      ],
    },
    {
      title: "Manila Police District",
      contacts: [
        { label: "GLOBE", value: "0917 899 2092" },
        { label: "SMART", value: "0999 905 0976" },
        { label: "FACEBOOK", value: "@manilapolice.district2017" },
        { label: "VIBER", value: "0905 453 4104" },
      ],
    },
    {
      title: "Intramuros Administration Hotline",
      contacts: [{ label: "SMART", value: "0998 884 9224" }],
    },
    {
      title: "Red Cross Intramuros Hotline",
      contacts: [
        { label: "Landline", value: "8527 – 2161" },
        { label: "Mobile", value: "0998 190 2309" },
      ],
    },
  ];

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
