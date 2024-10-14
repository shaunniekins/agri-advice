import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

type CreationYear = {
  creationYear: number;
};

const useUserCreationYears = () => {
  const [creationYears, setCreationYears] = useState<CreationYear[]>([]);
  const [isCreationYearsLoading, setIsCreationYearsLoading] =
    useState<boolean>(true);
  const [creationYearsError, setCreationYearsError] = useState<string | null>(
    null
  );

  const fetchCreationYears = useCallback(async () => {
    setIsCreationYearsLoading(true);
    setCreationYearsError(null);

    try {
      const response: PostgrestResponse<CreationYear> = await supabase
        .from("ViewUserCreationYears")
        .select("*");

      if (response.error) {
        throw response.error;
      }

      setCreationYears(response.data || []);
    } catch (err) {
      if (err instanceof Error) {
        setCreationYearsError(err.message || "Error fetching years");
      } else {
        setCreationYearsError("An unknown error occurred");
      }
    } finally {
      setIsCreationYearsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreationYears();
  }, [fetchCreationYears]);

  return {
    creationYears,
    isCreationYearsLoading,
    creationYearsError,
  };
};

export default useUserCreationYears;
