import { useEffect } from "react";
import { cleanupFullyDeletedChats } from "@/app/api/chatConnectionsIUD";

/**
 * Hook to automatically clean up fully deleted chat connections
 * This will run the cleanup function periodically and when the component mounts
 */
const useAutoCleanup = () => {
  useEffect(() => {
    // Run cleanup once when component mounts
    cleanupFullyDeletedChats();

    // Set up interval to run cleanup periodically (every 15 minutes)
    const cleanupInterval = setInterval(() => {
      cleanupFullyDeletedChats();
    }, 15 * 60 * 1000);

    // Clean up interval on unmount
    return () => clearInterval(cleanupInterval);
  }, []);
};

export default useAutoCleanup;
