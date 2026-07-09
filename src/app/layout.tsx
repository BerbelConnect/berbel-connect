import type { Metadata } from "next";
import "./globals.css";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Berbel Connect",
  description: "CRM e ERP comercial para representantes",

  // PWA
  manifest: "/manifest.json",

  themeColor: "#0f172a",

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}