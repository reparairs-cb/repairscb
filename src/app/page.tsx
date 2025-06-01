"use client";
import { NavBar } from "@/components/NavBar";
import { SideBar } from "@/components/SideBar";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Activity, Settings, Package } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  const modules = [
    {
      title: "Equipos",
      description: "Gestiona el inventario y los detalles de tus equipos",
      icon: Wrench,
      href: "/equipment",
      color: "text-blue-600",
    },
    {
      title: "Actividades",
      description: "Registra y gestiona las actividades de mantenimiento",
      icon: Activity,
      href: "/activities",
      color: "text-green-600",
    },
    {
      title: "Tipos de Mantenimiento",
      description: "Configura las categorías de tipos de mantenimiento",
      icon: Settings,
      href: "/maintenance-type",
      color: "text-orange-600",
    },
    {
      title: "Repuestos",
      description: "Administra el inventario y precios de repuestos",
      icon: Package,
      href: "/spare-parts",
      color: "text-purple-600",
    },
  ];

  return (
    <main className="flex flex-col min-h-screen">
      <NavBar title="Sistema de Gestión de Equipos">
        <SideBar session={session} />
      </NavBar>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <p className="text-muted-foreground mt-2">
            Gestiona el mantenimiento de tus equipos de manera eficiente y
            organizada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.title}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-6 w-6 ${module.color}`} />
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={module.href}>Gestiona {module.title}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
