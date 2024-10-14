import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

type RequestYear = {
  requestYear: number;
};

const useRequestYears = () => {
  const [requestYears, setRequestYears] = useState<RequestYear[]>([]);
  const [isRequestYears, setIsRequestYears] = useState<boolean>(true);
  const [requestYearsError, setRequestYearsError] = useState<string | null>(
    null
  );

  const fetchCreationYears = useCallback(async () => {
    setIsRequestYears(true);
    setRequestYearsError(null);

    try {
      const response: PostgrestResponse<RequestYear> = await supabase
        .from("ViewRequestYears")
        .select("*");

      if (response.error) {
        throw response.error;
      }

      setRequestYears(response.data || []);
    } catch (err) {
      if (err instanceof Error) {
        setRequestYearsError(err.message || "Error fetching years");
      } else {
        setRequestYearsError("An unknown error occurred");
      }
    } finally {
      setIsRequestYears(false);
    }
  }, []);

  useEffect(() => {
    fetchCreationYears();
  }, [fetchCreationYears]);

  return {
    requestYears,
    isRequestYears,
    requestYearsError,
  };
};

export default useRequestYears;
