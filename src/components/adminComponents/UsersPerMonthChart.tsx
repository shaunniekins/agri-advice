import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface UsersPerMonthChartProps {
  data: { month: string; year: number; count: number }[];
}

const UsersPerMonthChart: React.FC<UsersPerMonthChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#007057" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default UsersPerMonthChart;
