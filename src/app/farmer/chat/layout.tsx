import FarmerChatsSidebar from "@/components/farmerComponents/FarmerChatsSidebar";

export default function FarmerChatsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <FarmerChatsSidebar>{children}</FarmerChatsSidebar>;
}
