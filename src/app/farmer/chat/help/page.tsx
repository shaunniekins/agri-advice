"use client";

import HelpComponent from "@/components/chatComponents/Help";
import { useState } from "react";

export default function FarmerChatHelpPage() {
  const [isLoading, setIsLoading] = useState(false);

  return <HelpComponent setIsLoading={setIsLoading} />;
}
