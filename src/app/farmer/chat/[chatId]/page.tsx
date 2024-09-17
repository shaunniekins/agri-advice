// src/app/farmer/page.tsx

"use client";

import useChatSessionChecker from "@/hooks/useChatSessionChecker";
import useTechnicianUsers from "@/hooks/useTechnicianUsers";
import { getIdFromPathname } from "@/utils/compUtils";
import { Textarea } from "@nextui-org/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoSendOutline } from "react-icons/io5";

export default function FarmerChatSlugPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [messageInput, setMessageInput] = useState("");

  // chatId === chatSessionId
  const chatId = getIdFromPathname(pathname);

  const { exists, loading, error } = useChatSessionChecker(chatId);
  const {
    technicianUsers,
    isLoadingTechnicianUsers,
    totalTechnicianEntries,
    fetchAndSubscribeTechnicianUsers,
    updateTechnicianUser,
  } = useTechnicianUsers();

  return (
    <>
      {!exists ? (
        "Chat session no longer exists"
      ) : (
        <div className="h-full w-full overflow-auto relative">
          <h1>components</h1>

          <div className="w-full absolute bottom-0 pb-6">
            <Textarea
              size="lg"
              radius="lg"
              maxRows={3}
              minRows={1}
              color="success"
              endContent={
                <div className="flex gap-4 text-2xl">
                  <button
                    className={`${!messageInput && "hidden"}`}
                    // onClick={handleSubmit}
                  >
                    <IoSendOutline />
                  </button>
                </div>
              }
              placeholder="Enter message here"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
          </div>
        </div>
      )}
    </>
  );
}
