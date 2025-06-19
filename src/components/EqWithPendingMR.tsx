"use client";
import React, { useState, useEffect } from "react";
import {
  Clock,
  Truck,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Circle,
  MapPin,
  ChevronUp,
  ChevronDown,
  User,
  Settings,
  Pause,
  Play,
  Construction,
} from "lucide-react";
import {
  MultiEqWithPendingInProgressMRs,
  EqWithPendingInProgressMRs,
} from "@/types/equipment";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Modal } from "./Modal";

const getStatusColor = (status: string) => {
  switch (status) {
    case "in_progress":
      return "blue";
    case "pending":
      return "yellow";
    case "completed":
      return "green";
    default:
      return "gray";
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "in_progress":
      return "default";
    case "pending":
      return "secondary";
    case "completed":
      return "default";
    default:
      return "outline";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "in_progress":
      return Play;
    case "pending":
      return Clock;
    case "completed":
      return CheckCircle;
    default:
      return AlertTriangle;
  }
};

const getActivityStatusIcon = (status: string) => {
  switch (status) {
    case "in_progress":
      return Settings;
    case "pending":
      return Pause;
    case "completed":
      return CheckCircle;
    default:
      return Clock;
  }
};

export const EqWithPendingInProgressMaintenanceRecords = () => {
  const [data, setData] = useState<MultiEqWithPendingInProgressMRs>({
    total: 0,
    limit: 0,
    offset: 0,
    pages: 0,
    data: [],
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedEquipment, setSelectedEquipment] = useState<
    MultiEqWithPendingInProgressMRs["data"][number] | null
  >(null);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "/api/equipments/with-pending-records?limit=0"
        );
        const result = (await response.json()).data;

        if (!response.ok) {
          throw new Error(result.message || "Error fetching data");
        }
        console.log("Fetched data:", result);

        const formattedData: MultiEqWithPendingInProgressMRs = {
          ...result,
          data: result.data.map((equipment: EqWithPendingInProgressMRs) => ({
            ...equipment,
            maintenance_records: equipment.maintenance_records.map(
              (record) => ({
                ...record,
                start_datetime: new Date(record.start_datetime),
                end_datetime: record.end_datetime
                  ? new Date(record.end_datetime)
                  : null,
                activities: record.activities || [],
              })
            ),
          })),
        };
        console.log("Formatted data:", formattedData);
        setData(formattedData);
      } catch (error) {
        console.error("Error fetching equipment data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleRecordExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRecords(newExpanded);
  };

  const getEquipmentOverallStatus = (equipment: EqWithPendingInProgressMRs) => {
    const hasInProgress = equipment.maintenance_records.some((record) =>
      record.activities?.some((activity) => activity.status === "in_progress")
    );

    if (hasInProgress) return "in_progress";

    const hasPending = equipment.maintenance_records.some((record) =>
      record.activities?.some((activity) => activity.status === "pending")
    );

    if (hasPending) return "pending";

    return "completed";
  };

  const getRecordProgress = (
    record: MultiEqWithPendingInProgressMRs["data"][number]["maintenance_records"][number]
  ) => {
    if (!record.activities || record.activities.length === 0) return 0;

    const completedActivities = record.activities.filter(
      (activity) => activity.status === "completed"
    ).length;

    return Math.round((completedActivities / record.activities.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Circle className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-6">
      {data.data.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          No hay equipos con mantenimientos pendientes o en progreso.
          <span className="block mt-2">
            Todos los mantenimientos están al día
          </span>
        </div>
      ) : null}

      <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.data.map((equipment) => {
          const overallStatus = getEquipmentOverallStatus(equipment);
          const statusColor = getStatusColor(overallStatus);
          const StatusIcon = getStatusIcon(overallStatus);

          return (
            <Card
              key={equipment.id}
              className="transition-all duration-200 hover:shadow-lg cursor-pointer"
              onClick={() => setSelectedEquipment(equipment)}
            >
              <CardHeader className="border-b">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusIcon
                        className={`w-6 h-6 text-${statusColor}-600`}
                      />
                      <h3 className="font-bold text-xl text-gray-900">
                        {equipment.code}
                      </h3>
                      <Badge variant={getStatusVariant(overallStatus)}>
                        {overallStatus === "in_progress"
                          ? "En Progreso"
                          : overallStatus === "pending"
                          ? "Pendiente"
                          : "Completado"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-500" />
                        <span>{equipment.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{equipment.license_plate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-gray-500" />
                        <span>
                          {equipment.maintenance_plan?.name || "Sin plan"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {equipment.maintenance_records.length} registro(s) de
                    mantenimiento
                  </span>
                  {/*                   <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">En progreso</span>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full ml-2"></div>
                    <span className="text-xs text-gray-500">Pendiente</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                    <span className="text-xs text-gray-500">Completado</span>
                  </div> */}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
      {selectedEquipment && (
        <Modal onClose={() => setSelectedEquipment(null)}>
          <div className="p-6 max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Mantenimientos de {selectedEquipment.code}
            </h2>

            {selectedEquipment.maintenance_records.map((record) => {
              const isRecordExpanded = expandedRecords.has(record.id);
              const progress = getRecordProgress(record);

              return (
                <Card key={record.id} className="border">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Construction className="w-4 h-4 text-gray-500" />
                            <span>
                              {record.start_datetime.toLocaleDateString()} -{" "}
                              {record.maintenance_type?.type || "No tipo"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>Progreso: {progress}%</span>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="mt-3">
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRecordExpansion(record.id)}
                      >
                        {isRecordExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {/* Detalles del Registro */}
                  {isRecordExpanded && (
                    <CardContent className="space-y-4">
                      {/* Actividades */}
                      {record.activities && record.activities.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Actividades ({record.activities.length})
                          </h5>
                          <div className="space-y-2">
                            {record.activities.map((activity) => {
                              const activityStatusColor = getStatusColor(
                                activity.status
                              );
                              const ActivityStatusIcon = getActivityStatusIcon(
                                activity.status
                              );

                              return (
                                <Card key={activity.id} className="p-3">
                                  <div className="flex items-start gap-3">
                                    <ActivityStatusIcon
                                      className={`w-4 h-4 mt-0.5 text-${activityStatusColor}-600`}
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-900">
                                          {activity.activity.name}
                                        </span>
                                        <Badge
                                          variant={getStatusVariant(
                                            activity.status
                                          )}
                                        >
                                          {activity.status === "in_progress"
                                            ? "En Progreso"
                                            : activity.status === "pending"
                                            ? "Pendiente"
                                            : "Completado"}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        {activity.activity.description ||
                                          "Sin descripción"}
                                      </p>
                                      {activity.observations && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          <strong>Observaciones:</strong>{" "}
                                          {activity.observations}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
};
