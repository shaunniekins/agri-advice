import ChatSidebar from "@/components/chatComponents/ChatSidebar";

export default function FarmerChatsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ChatSidebar>{children}</ChatSidebar>;
}
