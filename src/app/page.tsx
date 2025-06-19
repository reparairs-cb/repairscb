"use client";
import React from "react";
import { NavBar } from "@/components/NavBar";
import { SideBar } from "@/components/SideBar";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenancePlans } from "@/components/MaintenancePlans";
import { EqWithPendingInProgressMaintenanceRecords } from "@/components/EqWithPendingMR";

export default function Home() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <NavBar title="Panel de Mantenimiento de Equipos">
        <SideBar session={session} />
      </NavBar>

      <Tabs defaultValue="plan" className="w-full">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center">
          <TabsList>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="pending_activities">
              Actividades Pendientes
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="plan" className="w-full">
          <MaintenancePlans />
        </TabsContent>
        <TabsContent value="pending_activities">
          <EqWithPendingInProgressMaintenanceRecords />
        </TabsContent>
      </Tabs>
    </div>
  );
}
