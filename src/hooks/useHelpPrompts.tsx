"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export interface HelpPrompt {
  id: string;
  category: string;
  prompts: string[];
  descriptions: string[];
  instructions: string[];
}

export const useHelpPrompts = () => {
  const [helpPrompts, setHelpPrompts] = useState<HelpPrompt[]>([]);
  const [isLoadingHelpPrompts, setIsLoadingHelpPrompts] =
    useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchHelpPrompts = async () => {
      try {
        setIsLoadingHelpPrompts(true);
        const { data, error } = await supabase.from("help_prompts").select("*");

        if (error) {
          throw error;
        }

        // Properly type and transform the data
        const typedData: HelpPrompt[] = data.map((item: any) => ({
          id: item.id,
          category: item.category || "Unknown",
          prompts: Array.isArray(item.prompts) ? item.prompts : [],
          descriptions: Array.isArray(item.descriptions)
            ? item.descriptions
            : [],
          instructions: Array.isArray(item.instructions)
            ? item.instructions
            : [],
        }));

        setHelpPrompts(typedData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        console.error("Error fetching help prompts:", err);
      } finally {
        setIsLoadingHelpPrompts(false);
      }
    };

    fetchHelpPrompts();
  }, []);

  return { helpPrompts, isLoadingHelpPrompts, error };
};
