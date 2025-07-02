// app/admin/[idName]/page.tsx

import AdminClientPage from "@/components/adminComponents/AdminClientPage";

// Server component that provides static params
export function generateStaticParams() {
  return [
    { idName: "dashboard" },
    { idName: "users" },
    { idName: "settings" },
    { idName: "report" },
    { idName: "remarks" },
    { idName: "monitor" },
  ];
}

// Server component just returns the client component
export default function AdminSlugPage() {
  return <AdminClientPage />;
}
