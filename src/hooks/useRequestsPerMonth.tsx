import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

interface RequestsPerMonth {
  year: number;
  month: string;
  count: number;
}

const useRequestsPerMonth = (userId: string, yearFilter: string) => {
  const [requestsPerMonth, setRequestsPerMonth] = useState<RequestsPerMonth[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequestsPerMonth = async () => {
      try {
        let query = supabase
          .from("ViewTechnicianRequestsPerMonthInAYear")
          .select("year, month, user_1, user_2");

        if (userId !== "all") {
          query = query.or(`user_1.eq.${userId},user_2.eq.${userId}`);
        }

        if (yearFilter && yearFilter !== "all") {
          query = query.eq("year", parseInt(yearFilter));
        }

        const { data, error } = await query;

        if (error) throw error;

        const groupedData: { [key: string]: number } = {};

        data.forEach((request: { year: number; month: number }) => {
          const year = request.year;
          const month = new Date(
            request.year,
            request.month - 1
          ).toLocaleString("default", { month: "long" });

          const key = `${year}-${month}`;

          if (!groupedData[key]) {
            groupedData[key] = 0;
          }
          groupedData[key] += 1;
        });

        const formattedData: RequestsPerMonth[] = Object.keys(groupedData).map(
          (key) => {
            const [year, month] = key.split("-");
            return {
              year: parseInt(year),
              month,
              count: groupedData[key],
            };
          }
        );

        setRequestsPerMonth(formattedData);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestsPerMonth();
  }, [userId, yearFilter]);

  return {
    requestsPerMonth,
    loading,
    error,
  };
};

export default useRequestsPerMonth;
