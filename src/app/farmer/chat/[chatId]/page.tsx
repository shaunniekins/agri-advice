// src/app/farmer/page.tsx

"use client";

import { useEffect, useState } from "react";

export default function FarmerChatSlugPage() {
  const [chatItems, setChatItems] = useState<any[]>([]);

  useEffect(() => {
    setChatItems([
      {
        title: "Chat 1",
        subtitle: "Chat 1 subtitle",
      },
      {
        title: "Chat 2",
        subtitle: "Chat 2 subtitle",
      },
      {
        title: "Chat 3",
        subtitle: "Chat 3 subtitle",
      },
      {
        title: "Chat 4",
        subtitle: "Chat 4 subtitle",
      },
    ]);
  }, []);

  return <>hello</>;
}
