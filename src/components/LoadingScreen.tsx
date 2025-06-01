"use client";
import { useSession } from "next-auth/react";
import { Noise } from "@/components/Noise";

export const LoadingScreen = ({ children }: { children: React.ReactNode }) => {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <Noise
        noise={{
          type: "loading",
          styleType: "page",
          message: "Obteniendo sus datos...",
        }}
      />
    );
  }

  return children;
};
