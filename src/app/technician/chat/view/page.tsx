import ChatDisplayComponent from "@/components/chatComponents/ChatDisplay";
import ClientChatRouter from "@/components/ClientChatRouter";

export default function TechnicianChatViewPage() {
  return (
    <ClientChatRouter userType="technician">
      <ChatDisplayComponent />
    </ClientChatRouter>
  );
}
