import ChatDisplayComponent from "@/components/chatComponents/ChatDisplay";

// Since this is a dynamic route, we need to provide static params for export
export function generateStaticParams() {
  // For static export, we'll create a placeholder chat ID
  // In production, your app will handle client-side navigation to actual chat IDs
  return [{ chatId: "placeholder" }];
}

export default function FarmerChatSlugPage() {
  return <ChatDisplayComponent />;
}
