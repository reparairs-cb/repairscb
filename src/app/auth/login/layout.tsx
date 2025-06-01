"use client";
import React from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="h-screen flex items-center justify-center bg-foreground">
      <div className="w-full h-screen rounded-lg outline outline-4 outline-offset-8 p-6 outline-primary bg-background">
        {children}
      </div>
    </main>
  );
}
