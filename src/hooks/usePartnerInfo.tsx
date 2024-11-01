import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

interface PartnerData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  password?: string;
  mobile_number?: string;
  address?: string;
  user_type: string;
  birth_date?: string;
  account_status?: string;
  profile_picture?: string;
  license_number?: string | null;
  specialization?: string | null;
  experiences?: string | null;
  num_heads?: string | null;
  experience_years?: string | null;
  operations?: string | null;
}

const usePartnerInfo = (userId: string) => {
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [isLoadingPartner, setIsLoadingPartner] = useState<boolean>(true);

  const fetchAndSubscribePartner = useCallback(async () => {
    if (!userId) return;

    try {
      let query = supabase.from("ViewUsers").select("*").eq("id", userId);

      const response: PostgrestResponse<PartnerData> = await query.single();

      if (response.error) {
        throw response.error;
      }

      setPartnerData((response.data as any) || []);
      setIsLoadingPartner(false);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching users:", err.message);
      } else {
        console.error("An unknown error occurred while fetching users");
      }
    } finally {
      setIsLoadingPartner(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAndSubscribePartner();
  }, [fetchAndSubscribePartner]);

  return {
    partnerData,
    isLoadingPartner,
    fetchAndSubscribePartner,
  };
};

export default usePartnerInfo;
