import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

// Define a type for the grouped data
interface UsersPerMonth {
  year: number;
  month: string;
  count: number;
}

const useUsersPerMonth = (userType: string, yearFilter: string) => {
  const [usersPerMonth, setUsersPerMonth] = useState<UsersPerMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsersPerMonth = async () => {
      try {
        let query = supabase
          .from("OverviewUsers")
          .select("created_at, raw_user_meta_data->>user_type");

        if (userType !== "all") {
          query = query.eq("raw_user_meta_data->>user_type", userType);
        } else {
          query = query.in("raw_user_meta_data->>user_type", [
            "technician",
            "farmer",
          ]);
        }

        if (yearFilter && yearFilter !== "all") {
          query = query
            .gte("created_at", `${yearFilter}-01-01T00:00:00.000Z`)
            .lte("created_at", `${yearFilter}-12-31T23:59:59.999Z`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Process the data
        const groupedData: { [key: string]: number } = {};

        data.forEach((user: { created_at: string }) => {
          const date = new Date(user.created_at);
          const year = date.getFullYear();
          const month = date.toLocaleString("default", { month: "long" }); // Get month name

          const key = `${year}-${month}`;

          if (!groupedData[key]) {
            groupedData[key] = 0;
          }
          groupedData[key] += 1;
        });

        const formattedData: UsersPerMonth[] = Object.keys(groupedData).map(
          (key) => {
            const [year, month] = key.split("-");
            return {
              year: parseInt(year),
              month,
              count: groupedData[key],
            };
          }
        );

        setUsersPerMonth(formattedData);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersPerMonth();
  }, [userType]);

  return { usersPerMonth, loading, error };
};

export default useUsersPerMonth;
