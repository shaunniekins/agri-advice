import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReduxProviders } from "./redux_providers";
import ClientRouteGuard from "@/components/ClientRouteGuard";
import ClientRedirectGuard from "@/components/ClientRedirectGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agri Advice",
  description: "Agri Advice for farmers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProviders>
          <ClientRedirectGuard allowUnauthenticated={true}>
            <ClientRouteGuard>{children}</ClientRouteGuard>
          </ClientRedirectGuard>
        </ReduxProviders>
      </body>
    </html>
  );
}
