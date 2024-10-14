"use client";

import React, { useEffect, useState } from "react";
import useTotalUsers from "@/hooks/useTotalUsers";
import useTotalConnections from "@/hooks/useTotalConnections";
import useUsersPerMonth from "@/hooks/useUsersPerMonth";
import { GiFarmer } from "react-icons/gi";
import { FaUserTie } from "react-icons/fa";
import { IoLinkSharp } from "react-icons/io5";
import UsersPerMonthChart from "./UsersPerMonthChart";
import { Select, SelectItem } from "@nextui-org/react";
import useUserCreationYears from "@/hooks/useUserCreationYears";

const AdminDashboard = () => {
  const { totalFarmers, totalTechnicians } = useTotalUsers();
  const { totalConnections } = useTotalConnections();
  const [userType, setUserType] = useState("all");
  const { creationYears } = useUserCreationYears();
  const [creationYearsFormatted, setCreationYearsFormatted] = useState<any[]>(
    []
  );
  const [selectedYear, setSelectedYear] = useState("all");
  const { usersPerMonth, loading, error } = useUsersPerMonth(
    userType,
    selectedYear
  );

  useEffect(() => {
    // Transform the creationYears data
    const formattedData = creationYears.map((item: any) => ({
      key: item.year.toString(),
      label: item.year.toString(),
    }));

    // Append the "all" option
    formattedData.unshift({ key: "all", label: "All" });

    setCreationYearsFormatted(formattedData);
  }, [creationYears]);

  return (
    <div className="h-full w-full flex flex-col gap-5 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      <div className="h-full grid md:grid-cols-3 gap-3 md:gap-5">
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
          value={totalConnections.toString()}
          icon={<IoLinkSharp size={80} />}
        />
      </div>
      <div className="h-full w-full mt-10 pb-20">
        <div className="w-full flex justify-between items-center mb-5">
          <h2 className="w-full text-xl font-semibold">Users Per Month</h2>
          <div className="w-full flex justify-end gap-3">
            <Select
              items={creationYearsFormatted}
              label="Year"
              disallowEmptySelection={true}
              size="sm"
              className="max-w-48"
              defaultSelectedKeys={["all"]}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>

            <Select
              label="User Type"
              disallowEmptySelection={true}
              size="sm"
              className="max-w-48"
              defaultSelectedKeys={["all"]}
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <SelectItem key="all" value="all">
                All
              </SelectItem>
              <SelectItem key="technician" value="technician">
                Technician
              </SelectItem>
              <SelectItem key="farmer" value="farmer">
                Farmer
              </SelectItem>
            </Select>
          </div>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error loading data</p>
        ) : (
          <UsersPerMonthChart data={usersPerMonth} />
        )}
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
