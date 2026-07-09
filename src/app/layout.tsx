import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { OfflineStatus } from "@/components/offline/OfflineStatus";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";

export const metadata: Metadata = {
  title: "Berbel Connect",
  description: "CRM e ERP comercial para representantes",
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Berbel Connect",
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthGuard>{children}</AuthGuard>
        <OfflineStatus />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}