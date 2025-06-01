import type React from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import { ClientSessionProvider } from "@/components/ClientSessionProvider";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Equipment Management System",
  description: "Manage equipment, activities, maintenance types, and spare parts",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientSessionProvider>
          <Toaster />
          <LoadingScreen>{children}</LoadingScreen>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
