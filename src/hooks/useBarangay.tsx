import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

// Bunawan Brook
// Consuelo
// Imelda
// Libertad
// Mambalili
// Nueva Era
// Poblacion
// San Andres
// San Marcos
// San Teodoro

const useBarangay = () => {
  const [barangay, setBarangay] = useState<any[]>([]);
  const [isLoadingBarangay, setIsLoadingBarangay] = useState<boolean>(true);

  const fetchBarangay = useCallback(async () => {
    try {
      const response: PostgrestResponse<any> = await supabase
        .from("Barangay")
        .select("*")
        .order("barangay_name");

      if (response.error) {
        throw response.error;
      }

      const barangay = response.data || [];
      setBarangay(barangay);
      setIsLoadingBarangay(false);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching barangay:", err.message);
      } else {
        console.error("An unknown error occurred while fetching barangay");
      }
    } finally {
      setIsLoadingBarangay(false);
    }
  }, []);

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("barangay_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Barangay",
        },
        (payload) => {
          fetchBarangay();
        }
      )
      .subscribe((status: any) => {
        if (status !== "SUBSCRIBED") {
          //   console.error("Error subscribing to channel:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBarangay]);

  useEffect(() => {
    fetchBarangay();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchBarangay, subscribeToChanges]);

  return { barangay, isLoadingBarangay, fetchBarangay };
};

export default useBarangay;
