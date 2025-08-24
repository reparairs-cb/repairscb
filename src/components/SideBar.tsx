"use client";
import React, { useState } from "react";
import { signOut } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Session } from "next-auth";
import {
  LogOut,
  SquareDashedKanban,
  Wrench,
  Activity,
  Settings,
  Package,
  Gauge,
  Car,
  GitCompare,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Option {
  onClick?: () => void;
  onRedirect?: (router: ReturnType<typeof useRouter>) => void;
  icon?: React.ReactNode;
  label: string;
  className?: string;
}

interface SideBarProps {
  session: Session;
  options?: Option[];
}

export const SideBar = ({ session, options }: SideBarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="h-10 rounded-full border-0 p-0 pl-3 mr-3 bg-white hover:bg-slate-100 hover:scale-105 ease-in-out transform transition">
          {session?.user?.name && (
            <span className="sm:block ml-2 text-secondary-foreground hover:text-slate-800 font-semibold mr-2">
              {session.user.name}
            </span>
          )}
          <Avatar className="hover:scale-90 ease-in-out transform transition">
            {session?.user?.image && session.user.name ? (
              <AvatarImage src={session.user.image} alt={session.user.name} />
            ) : (
              <AvatarImage src={"images/avatar-default.svg"} alt={"user"} />
            )}
          </Avatar>
        </Button>
      </SheetTrigger>
      <VisuallyHidden>
        <SheetTitle>Menú</SheetTitle>
      </VisuallyHidden>
      <SheetContent
        aria-describedby={undefined}
        side="right"
        className="w-[300px] sm:w-[400px] overflow-y-auto"
      >
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4">Menú</h2>
            <div className="space-y-4">
              <MenuOptions
                options={
                  options || [
                    DashboardRoute,
                    MileageRoute,
                    MaintenanceRoute,
                    EquipmentRoute,
                    ActivitiesRoute,
                    MaintenanceTypeRoute,
                    SparePartsRoute,
                    MaintenanceStageRoute,
                  ]
                }
                onClose={() => setOpen(false)}
              />
            </div>
          </div>
          <div className="min-h-[5vh]"></div>
          <Button
            variant="ghost"
            className="justify-start mt-auto text-red-800 hover:bg-red-900 hover:text-primary"
            onClick={async () => {
              await signOut();
              setOpen(false);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const MenuOptions = ({
  options,
  onClose,
}: {
  options: Option[];
  onClose: () => void;
}) => {
  const router = useRouter();

  return options.map((option, index) => (
    <Button
      key={index}
      variant="ghost"
      className={cn("w-full justify-start text-wrap text-left", option.className)}
      onClick={() => {
        option.onClick?.();
        option.onRedirect?.(router);
        onClose();
      }}
    >
      {option.icon}
      {option.label}
    </Button>
  ));
};

const EquipmentRoute: Option = {
  label: "Equipos",
  icon: <Wrench className="mr-2 h-4 w-4" />,
  onRedirect: (router) => router.push("/equipment"),
};
const ActivitiesRoute: Option = {
  label: "Actividades",
  icon: <Activity className="mr-2 h-4 w-4" />,
  onRedirect: (router) => router.push("/activities"),
};
const MaintenanceTypeRoute: Option = {
  label: "Tipos de Mantenimiento",
  icon: <Settings className="mr-2 h-4 w-4" />,
  onRedirect: (router) => router.push("/maintenance-type"),
};
const SparePartsRoute: Option = {
  label: "Repuestos",
  icon: <Package className="mr-2 h-4 w-4" />,
  onRedirect: (router) => router.push("/spare-parts"),
};
const DashboardRoute: Option = {
  label: "Seguimiento de Mantenimiento",
  icon: <SquareDashedKanban className="mr-2 h-4 w-4" />,
  onRedirect: (router) => router.replace("/"),
};
const MileageRoute: Option = {
  label: "Registros de Kilometraje",
  icon: <Gauge className="mr-2 h-4 w-4" />,
  onRedirect: (router) => router.push("/mileage-record"),
};
const MaintenanceRoute: Option = {
  label: "Registros de Mantenimiento",
  icon: <Car className="mr-2 h-4 w-4" />,
  onRedirect: (router) => router.push("/maintenance-record"),
};
const MaintenanceStageRoute: Option = {
  label: "Etapas de Mantenimiento Planeado",
  icon: <GitCompare className="mr-2 h-4 w-4" />,
  onRedirect: (router) => router.push("/maintenance-stage"),
};
