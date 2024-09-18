import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";

const useChatConnectionChecker = (chatConnectionId: string | null) => {
  const [chatConnectionData, setChatConnectionData] = useState<any[]>([]);
  const [loadingConnectionData, setLoadingConnectionData] = useState(true);
  const [errorConnectionData, setErrorConnectionData] = useState<string | null>(
    null
  );

  const checkChatConnectionData = useCallback(async () => {
    if (!chatConnectionId) {
      setErrorConnectionData("Invalid chat connection ID");
      setLoadingConnectionData(false);
      return;
    }

    try {
      setLoadingConnectionData(true);
      let query = supabase.from("ViewFullChatConnectionsInfo").select("*");

      query = query.eq("chat_connection_id", chatConnectionId);

      const { data, error } = await query.single();

      if (error) {
        throw error;
      }

      if (data) {
        setChatConnectionData(data);
      } else {
        setChatConnectionData([]);
        setErrorConnectionData(
          "No data found for the given chat connection ID"
        );
      }
    } catch (err) {
      setErrorConnectionData("Error checking chat connection ID");
    } finally {
      setLoadingConnectionData(false);
    }
  }, [chatConnectionId]);

  useEffect(() => {
    checkChatConnectionData();
  }, [checkChatConnectionData, chatConnectionId]);

  return { chatConnectionData, loadingConnectionData, errorConnectionData };
};

export default useChatConnectionChecker;
