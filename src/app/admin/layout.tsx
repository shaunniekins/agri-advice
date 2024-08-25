import AdminHeaderComponent from "@/components/adminComponents/Header";
import TopNavComponent from "@/components/adminComponents/TopNav";
import { Suspense } from "react";

export default function AdminSlugLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="w-screen">
        <AdminHeaderComponent />
        <TopNavComponent />
        <Suspense fallback={<div>Loading...</div>}>
          <div className="custom-w-margin bg-yellow-200 h-[94svh] flex justify-center items-center">{children}</div>
        </Suspense>
      </body>
    </html>
  );
}
