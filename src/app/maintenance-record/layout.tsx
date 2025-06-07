"use client";
import React from "react";
import { NavBar } from "@/components/NavBar";
import { SideBar } from "@/components/SideBar";
import { useSession } from "next-auth/react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <main className="flex flex-col min-h-screen">
      <NavBar title="Mantenimiento">
        <SideBar session={session} />
      </NavBar>
      {children}
    </main>
  );
}
