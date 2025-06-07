"use client";
import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  Truck,
  Wrench,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  MultiEquipmentMaintenancePlan,
  EquipmentMileageRecord,
  EquipmentMaintenancePlan,
} from "@/types/equipment";
import { CalendarModal } from "@/components/CalendarModal";
import { NoiseType } from "@/types/noise";
import { Noise } from "@/components/Noise";
import { NavBar } from "@/components/NavBar";
import { SideBar } from "@/components/SideBar";
import { useSession } from "next-auth/react";
import { PaginationComponent } from "@/components/Pagination";
import { FETCH_SIZE } from "@/lib/const";

const MILLISECONDS_PER_DAY = 86400000;

// Función para obtener el color según remaining_days
const getStatusColor = (remainingDays?: number) => {
  if (!remainingDays && remainingDays !== 0) return "gray";
  if (remainingDays <= 7) return "red";
  if (remainingDays <= 30) return "yellow";
  return "green";
};

// Función para obtener las clases CSS según el color
const getStatusClasses = (color: string) => {
  const classes = {
    red: {
      bg: "bg-red-50 border-red-200",
      badge: "bg-red-100 text-red-800 border-red-200",
      icon: "text-red-600",
    },
    yellow: {
      bg: "bg-yellow-50 border-yellow-200",
      badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: "text-yellow-600",
    },
    green: {
      bg: "bg-green-50 border-green-200",
      badge: "bg-green-100 text-green-800 border-green-200",
      icon: "text-green-600",
    },
    gray: {
      bg: "bg-white",
      badge: "bg-gray-100 text-gray-800 border-gray-200",
      icon: "text-gray-600",
    },
  };
  return classes[color as keyof typeof classes] || classes.gray;
};

export default function Home() {
  const { data: session } = useSession();
  const [data, setData] = useState<MultiEquipmentMaintenancePlan>({
    data: [],
    total: 0,
    limit: FETCH_SIZE,
    offset: 0,
    pages: 0,
  });
  const [loadingPage, setLoadingPage] = useState<boolean>(false);
  const [pagItems, setPagItems] = useState<{
    start: number;
    end: number;
  }>({
    start: 0,
    end: FETCH_SIZE,
  });
  const [selectedEquipment, setSelectedEquipment] = useState<{
    equipment: EquipmentMileageRecord;
    lastMaintenanceDate?: Date;
    nextMaintenanceDate?: Date;
  } | null>(null);
  const [noise, setNoise] = useState<NoiseType | null>({
    type: "loading",
    message: "Cargando datos...",
    styleType: "page",
  });

  useEffect(() => {
    const fetchMaintenancePlans = async () => {
      try {
        const res = await fetch(
          `/api/equipments/maintenance-plans?limit=${FETCH_SIZE}`
        );
        if (!res.ok) {
          const errorData = await res.json();
          console.error(
            "Error al cargar los planes de mantenimiento:",
            errorData
          );
          throw new Error("Error al cargar los planes de mantenimiento");
        }
        const responseText = await res.text();
        const fullResponse = JSON.parse(responseText);
        const result: MultiEquipmentMaintenancePlan = fullResponse.data;

        const formatedData = result.data.map((plan) => ({
          ...plan,
          equipment: {
            ...plan.equipment,
            last_mileage_record_date: plan.equipment.last_mileage_record_date
              ? new Date(plan.equipment.last_mileage_record_date)
              : undefined,
          },
          remaining_days:
            plan.remaining_days && plan.equipment.last_mileage_record_date
              ? Math.round(
                  new Date(
                    new Date(
                      plan.equipment.last_mileage_record_date
                    ).getTime() +
                      plan.remaining_days * MILLISECONDS_PER_DAY -
                      new Date().getTime()
                  ).getTime() / MILLISECONDS_PER_DAY
                )
              : undefined,
        }));
        result.data = formatedData;
        console.log("Datos formateados:", formatedData);
        setData({
          ...result,
          data: formatedData,
        });
        setNoise(null);
      } catch (err) {
        setNoise({
          type: "error",
          message: "Error al cargar los datos",
          styleType: "page",
        });
        console.error("Error al cargar los planes de mantenimiento:", err);
      }
    };
    fetchMaintenancePlans();
  }, []);

  if (!session) {
    return null;
  }

  const isNeededFetch = (newOffset: number) => {
    const totalLoadedEquipments = data.data.length || 0;
    const equipmentNeeded =
      newOffset + data.limit > data.total ? data.total : data.limit + newOffset;
    return totalLoadedEquipments < equipmentNeeded;
  };

  const handlePageChange = async (newOffset: number) => {
    if (isNeededFetch(newOffset)) {
      try {
        setLoadingPage(true);
        const res = await fetch(
          `/api/equipments/maintenance-plans?limit=${data.limit}&offset=${newOffset}`
        );
        if (!res.ok) {
          const errorData = await res.json();
          console.error(
            "Error al cambiar de página en los planes de mantenimiento:",
            errorData
          );
          throw new Error(
            "Error al cambiar de página en los planes de mantenimiento"
          );
        }
        const result: MultiEquipmentMaintenancePlan = (await res.json()).data;
        console.log("Planes de mantenimiento actualizados:", result);
        setData({
          ...result,
          data: data.data.concat(
            result.data.map((plan) => ({
              ...plan,
              equipment: {
                ...plan.equipment,
                last_mileage_record_date: plan.equipment
                  .last_mileage_record_date
                  ? new Date(plan.equipment.last_mileage_record_date)
                  : undefined,
              },
              remaining_days:
                plan.remaining_days && plan.equipment.last_mileage_record_date
                  ? Math.round(
                      new Date(
                        new Date(
                          plan.equipment.last_mileage_record_date
                        ).getTime() +
                          plan.remaining_days * MILLISECONDS_PER_DAY -
                          new Date().getTime()
                      ).getTime() / MILLISECONDS_PER_DAY
                    )
                  : undefined,
            }))
          ),
        });
        setNoise(null);
        setLoadingPage(false);
      } catch (err) {
        setNoise({
          type: "error",
          message: "Error al cambiar de página",
          styleType: "page",
        });
        setLoadingPage(false);
        console.error(
          "Error al cambiar de página en los planes de mantenimiento:",
          err
        );
        return;
      }
    }

    setPagItems({
      start: newOffset,
      end: Math.min(newOffset + data.limit, data.total),
    });
  };

  const handleCalendarClick = (plan: EquipmentMaintenancePlan) => {
    const lastMaintenanceDate = plan.equipment.last_mileage_record_date;
    const nextMaintenanceDate = plan.remaining_days
      ? new Date(Date.now() + plan.remaining_days * 24 * 60 * 60 * 1000)
      : undefined;

    setSelectedEquipment({
      equipment: plan.equipment,
      lastMaintenanceDate,
      nextMaintenanceDate,
    });
  };

  const getStatusIcon = (remainingDays?: number) => {
    if (!remainingDays) return Clock;
    if (remainingDays <= 7) return AlertTriangle;
    if (remainingDays <= 30) return Clock;
    return CheckCircle;
  };

  if (noise && noise.styleType === "page") return <Noise noise={noise} />;

  return (
    <div className="min-h-screen">
      <NavBar title="Panel de Mantenimiento de Equipos">
        <SideBar session={session} />
      </NavBar>
      {noise && <Noise noise={noise} />}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-6">
        {data.data.length === 0 && !loadingPage ? (
          <div className="text-center text-gray-500 mt-10">
            No hay planes de mantenimiento disponibles.
            <span className="block mt-2">Puedes agregar nuevos equipos</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data
            .slice(pagItems.start, pagItems.end)
            .sort((a, b) =>
              a.remaining_days && b.remaining_days
                ? a.remaining_days - b.remaining_days
                : 0
            )
            .map((plan) => {
              const statusColor = getStatusColor(plan.remaining_days);
              const statusClasses = getStatusClasses(statusColor);
              const StatusIcon = getStatusIcon(plan.remaining_days);

              return (
                <div
                  key={plan.equipment.id}
                  className={`rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-lg ${statusClasses.bg}`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {plan.equipment.code}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {plan.equipment.type}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <StatusIcon className={`w-5 h-5 ${statusClasses.icon}`} />
                      <button
                        onClick={() => handleCalendarClick(plan)}
                        className="p-1 rounded hover:bg-white hover:bg-opacity-50 transition-colors"
                      >
                        <CalendarDays className="w-5 h-5 text-gray-600 hover:text-gray-800" />
                      </button>
                    </div>
                  </div>

                  {/* Información principal */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">
                        {plan.equipment.license_plate}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          Kilometraje Promedio
                        </p>
                        <p className="font-semibold">
                          {plan.equipment.avg_mileage.toLocaleString()} km
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Días Restantes</p>
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-sm font-medium border ${statusClasses.badge}`}
                        >
                          {plan.remaining_days || plan.remaining_days === 0
                            ? plan.remaining_days
                            : "N/A"}{" "}
                          días
                        </span>
                      </div>
                    </div>

                    {plan.next_maintenance_type && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Próximo Mantenimiento
                        </p>
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {plan.next_maintenance_type.type}
                          </span>
                        </div>
                      </div>
                    )}

                    {plan.remaining_mileage && (
                      <div>
                        <p className="text-sm text-gray-600">
                          Kilometraje Restante
                        </p>
                        <p className="font-medium">
                          {plan.remaining_mileage.toLocaleString()} km
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        <PaginationComponent
          paginationData={{
            ...data,
            start: pagItems.start,
            end: pagItems.end,
          }}
          onPageChange={handlePageChange}
          loading={loadingPage}
        />

        {/* Modal del calendario */}
        {selectedEquipment && (
          <CalendarModal
            isOpen={true}
            onClose={() => setSelectedEquipment(null)}
            equipment={selectedEquipment?.equipment}
            lastMaintenanceDate={selectedEquipment?.lastMaintenanceDate}
            nextMaintenanceDate={selectedEquipment?.nextMaintenanceDate}
          />
        )}
      </div>
    </div>
  );
}
