import ChatPageComponent from "@/components/chatComponents/NewChat";
import ClientChatRouter from "@/components/ClientChatRouter";

export default function FarmerChatPage() {
  return (
    <ClientChatRouter userType="farmer">
      <ChatPageComponent />
    </ClientChatRouter>
  );
}
