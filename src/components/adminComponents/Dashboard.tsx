"use client";

import useTotalUsers from "@/hooks/useTotalUsers";
import React from "react";
import { GiFarmer } from "react-icons/gi";
import { FaUserTie } from "react-icons/fa";
import useTotalConnections from "@/hooks/useTotalConnections";
import { IoLinkSharp } from "react-icons/io5";

const AdminDashboard = () => {
  const { totalFarmers, totalTechnicians } = useTotalUsers();
  const { totalConnections } = useTotalConnections();
  return (
    <div className="flex flex-col gap-5">
      {/* <h1 className="mb-10 font-bold text-3xl">Dashboard</h1> */}
      <div className="grid md:grid-cols-3 gap-3 md:gap-5">
        <CardStats
          title="Total Farmers"
          subtitle="Total number of farmers"
          value={totalFarmers.toString()}
          icon={<GiFarmer size={80} />}
        />
        <CardStats
          title="Total Technicians"
          subtitle="Total number of technicians"
          value={totalTechnicians.toString()}
          icon={<FaUserTie size={80} />}
        />
        <CardStats
          title="Total Connections"
            subtitle="Total number of links"
        //   subtitle="Farmers connected to technicians"
          value={totalConnections.toString()}
          icon={<IoLinkSharp size={80} />}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;

interface CardStatsProps {
  title: string;
  subtitle: string;
  value: string;
  icon: React.ReactNode;
}

const CardStats: React.FC<CardStatsProps> = ({
  title,
  subtitle,
  value,
  icon,
}) => {
  return (
    <div className="bg-white shadow-lg flex justify-between rounded-xl p-3 md:px-5 md:py-7">
      <div className="w-full">
        <h2 className="text-3xl md:text-5xl font-bold text-[#007057]">
          {value}
        </h2>
        <h3 className="text-lg md:text-2xl font-semibold text-[#007057]">
          {title}
        </h3>
        <h4 className="text-md text-slate-400">{subtitle}</h4>
      </div>
      <div className="self-end w-full flex justify-end text-xl text-[#007057]">
        {icon}
      </div>
    </div>
  );
};
