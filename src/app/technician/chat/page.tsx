import ChatPageComponent from "@/components/chatComponents/NewChat";
import ClientChatRouter from "@/components/ClientChatRouter";

export default function TechnicianChatPage() {
  return (
    <ClientChatRouter userType="technician">
      <ChatPageComponent />
    </ClientChatRouter>
  );
}
