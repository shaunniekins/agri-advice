import ChatDisplayComponent from "@/components/chatComponents/ChatDisplay";
import ClientChatRouter from "@/components/ClientChatRouter";

export default function FarmerChatViewPage() {
  return (
    <ClientChatRouter userType="farmer">
      <ChatDisplayComponent />
    </ClientChatRouter>
  );
}
