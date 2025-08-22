"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NoiseType } from "@/types/noise";
import { Noise } from "@/components/Noise";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { toastVariables } from "@/components/ToastVariables";
import { MaintenanceTypeSelect } from "@/components/MaintenanceTypeSelect";
import { z } from "zod";
import type {
  MaintenanceTypeBase,
  MaintenanceTypeWithChildren,
} from "@/types/maintenance-type";
import {
  MaintenancePlanBase,
  MaintenancePlanWithStages,
  MultiMaintenancePlan,
} from "@/types/maintenance-plan";
import {
  MaintenanceStageBase,
  MultiMaintenanceStage,
} from "@/types/maintenance-stage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const unitTimeType: {
  value: "month" | "day" | "year" | "week";
  label: string;
  days: number;
}[] = [
  { value: "month", label: "Meses", days: 30 },
  { value: "day", label: "Días", days: 1 },
  { value: "year", label: "Años", days: 365 },
  { value: "week", label: "Semanas", days: 7 },
];

const getUnitTimeTypeByDays = (
  days: number
): {
  daysInUnitType: number;
  unitType: {
    value: "month" | "day" | "year" | "week";
    label: string;
    days: number;
  };
} => {
  const unitType =
    unitTimeType.find((type) => days % type.days === 0) || unitTimeType[1];
  return {
    daysInUnitType: days / unitType.days,
    unitType,
  };
};

// Schemas de validación
const maintenancePlanSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z.string().optional(),
});

const createMaintenanceStageSchema = (
  existingStages: MaintenanceStageBase[],
  planId: string,
  editingId?: string
) => {
  return z.object({
    maintenance_type_id: z
      .string()
      .min(1, "Tipo de mantenimiento es requerido"),
    maintenance_plan_id: z
      .string()
      .min(1, "El ID del plan de mantenimiento es requerido"),
    kilometers: z
      .number()
      .min(0, "Los kilómetros deben ser mayores o iguales a 0")
      .refine((value) => {
        const duplicateStage = existingStages.find(
          (stage) =>
            stage.maintenance_plan_id === planId &&
            stage.kilometers === value &&
            (editingId ? stage.id !== editingId : true)
        );
        return !duplicateStage;
      }, "Ya existe una etapa con estos kilómetros en este plan"),
    days: z
      .number()
      .min(0, "Los días deben ser mayores o iguales a 0")
      .refine((value) => {
        const duplicateStage = existingStages.find(
          (stage) =>
            stage.maintenance_plan_id === planId &&
            stage.days === value &&
            (editingId ? stage.id !== editingId : true)
        );
        return !duplicateStage;
      }, "Ya existe una etapa con estos días en este plan"),
  });
};

type MaintenancePlanFormData = z.infer<typeof maintenancePlanSchema>;

type MaintenanceStageFormData = {
  maintenance_type_id: string;
  maintenance_plan_id: string;
  kilometers: number;
  days: number;
};

// Componente para mostrar cada plan con sus stages
interface PlanSectionProps {
  plan: MaintenancePlanWithStages;
  maintenanceTypes: MaintenanceTypeWithChildren[];
  flatMaintenanceTypes: MaintenanceTypeBase[];
  allStages: MaintenanceStageBase[];
  onEditPlan: (plan: MaintenancePlanBase) => void;
  onDeletePlan: (id: string) => void;
  onCreateStage: (planId: string) => void;
  onEditStage: (stage: MaintenanceStageBase) => void;
  onDeleteStage: (id: string) => void;
}

function PlanSection({
  plan,
  flatMaintenanceTypes,
  onEditPlan,
  onDeletePlan,
  onCreateStage,
  onEditStage,
  onDeleteStage,
}: PlanSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMaintenanceTypeName = (maintenanceTypeId: string): string => {
    const maintenanceType = flatMaintenanceTypes.find(
      (mt) => mt.id === maintenanceTypeId
    );
    return maintenanceType?.type || "Tipo no encontrado";
  };

  const sortedStages = [...plan.stages].sort(
    (a, b) => a.kilometers - b.kilometers
  );

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Plan Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="flex gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                  {plan.stages.length} etapas
                </span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                  {new Set(plan.stages.map((s) => s.maintenance_type_id)).size}{" "}
                  tipos
                </span>
              </div>
            </div>
            {plan.description && (
              <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCreateStage(plan.id)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Etapa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditPlan(plan)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeletePlan(plan.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Stages Section (Collapsible) */}
      {isExpanded && (
        <div className="p-4">
          {sortedStages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay etapas en este plan</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateStage(plan.id)}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Crear Primera Etapa
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedStages.map((stage, index) => {
                const dateInfo = getUnitTimeTypeByDays(stage.days);
                return (
                  <div
                    key={stage.id}
                    className="bg-gray-50 rounded-lg border p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                          #{index + 1}
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                          {stage.kilometers} km
                        </span>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                          {stage.days} días
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditStage(stage)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteStage(stage.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">
                        Tipo:{" "}
                        {getMaintenanceTypeName(stage.maintenance_type_id)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Kilometros: {stage.kilometers.toLocaleString()} km
                      </p>
                      <p className="text-sm text-gray-600">
                        {dateInfo.unitType.label}: {dateInfo.daysInUnitType}{" "}
                        {dateInfo.unitType.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MaintenancePlanPage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<MaintenancePlanWithStages[]>([]);
  const [allStages, setAllStages] = useState<MaintenanceStageBase[]>([]);
  const [selectedUnitTimeType, setSelectedUnitTimeType] = useState<{
    value: "month" | "day" | "year" | "week";
    label: string;
    days: number;
  }>(unitTimeType[0]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<
    MaintenanceTypeWithChildren[]
  >([]);
  const [flatMaintenanceTypes, setFlatMaintenanceTypes] = useState<
    MaintenanceTypeBase[]
  >([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MaintenancePlanBase | null>(
    null
  );
  const [editingStage, setEditingStage] = useState<MaintenanceStageBase | null>(
    null
  );
  const [selectedPlanForStage, setSelectedPlanForStage] = useState<string>("");
  const [askingDeletePlan, setAskingDeletePlan] = useState<
    string | undefined
  >();
  const [askingDeleteStage, setAskingDeleteStage] = useState<
    string | undefined
  >();
  const [noise, setNoise] = useState<NoiseType | null>({
    type: "loading",
    styleType: "page",
    message: "Cargando planes de mantenimiento...",
  });

  // Form configurations
  const planForm = useForm<MaintenancePlanFormData>({
    resolver: zodResolver(maintenancePlanSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const stageSchema = selectedPlanForStage
    ? createMaintenanceStageSchema(
        allStages,
        selectedPlanForStage,
        editingStage?.id
      )
    : z.object({
        maintenance_type_id: z
          .string()
          .min(1, "Tipo de mantenimiento es requerido"),
        maintenance_plan_id: z
          .string()
          .min(1, "El ID del plan de mantenimiento es requerido"),
        kilometers: z
          .number()
          .min(0, "Los kilómetros deben ser mayores o iguales a 0"),
        days: z.number().min(0, "Los días deben ser mayores o iguales a 0"),
      });

  const stageForm = useForm<MaintenanceStageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      maintenance_type_id: "",
      maintenance_plan_id: "",
      kilometers: 0,
      days: 0,
    },
  });

  useEffect(() => {
    stageForm.setValue("maintenance_plan_id", selectedPlanForStage);
  }, [selectedPlanForStage]);

  // Get available maintenance types for stage creation
  const getAvailableMaintenanceTypes = useCallback(
    (
      planId: string,
      excludeStageId?: string
    ): MaintenanceTypeWithChildren[] => {
      const planStages = allStages.filter(
        (stage) =>
          stage.maintenance_plan_id === planId &&
          (excludeStageId ? stage.id !== excludeStageId : true)
      );
      const usedMaintenanceTypeIds = planStages.map(
        (stage) => stage.maintenance_type_id
      );

      const filterAvailableTypes = (
        types: MaintenanceTypeWithChildren[]
      ): MaintenanceTypeWithChildren[] => {
        return types
          .filter((type) => !usedMaintenanceTypeIds.includes(type.id))
          .map((type) => ({
            ...type,
            children:
              type.children && type.children.length > 0
                ? filterAvailableTypes(type.children)
                : undefined,
          }))
          .filter(
            (type) => type.children === undefined || type.children.length > 0
          );
      };
      return filterAvailableTypes(maintenanceTypes);
    },
    [allStages, editingStage, maintenanceTypes]
  );

  // Validate stage value in real time
  const validateStageValue = (
    value: number,
    field: "kilometers" | "days",
    planId: string
  ): boolean => {
    const duplicateStage = allStages.find(
      (stage) =>
        stage.maintenance_plan_id === planId &&
        stage[field] === value &&
        (editingStage ? stage.id !== editingStage.id : true)
    );

    if (duplicateStage) {
      stageForm.setError(field, {
        type: "manual",
        message: `Ya existe una etapa con ${
          field === "days" ? "este tiempo" : "estos kilómetros"
        } en este plan`,
      });
      return false;
    } else {
      stageForm.clearErrors(field);
      return true;
    }
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setNoise({
        type: "loading",
        styleType: "page",
        message: "Cargando planes de mantenimiento...",
      });

      try {
        // Fetch maintenance plans
        const plansRes = await fetch("/api/maintenance-plan?limit=0");
        if (!plansRes.ok) {
          throw new Error("Failed to fetch maintenance plans");
        }
        const plansData = (await plansRes.json()).data as MultiMaintenancePlan;

        // Fetch all stages
        const stagesRes = await fetch("/api/maintenance-stage?limit=0");
        if (!stagesRes.ok) {
          throw new Error("Failed to fetch maintenance stages");
        }
        const stagesData = (await stagesRes.json())
          .data as MultiMaintenanceStage;

        // Fetch maintenance types
        const maintenanceTypesRes = await fetch("/api/maintenance-type");
        if (!maintenanceTypesRes.ok) {
          throw new Error("Failed to fetch maintenance types");
        }
        const maintenanceTypesData = (await maintenanceTypesRes.json())
          .data as MaintenanceTypeWithChildren[];

        // Process data
        const processedStages = stagesData.data.map((item) => ({
          ...item,
          created_at: new Date(item.created_at),
          updated_at: item.updated_at ? new Date(item.updated_at) : undefined,
        }));

        const processedPlans = plansData.data.map((plan) => ({
          ...plan,
          created_at: new Date(plan.created_at),
          updated_at: plan.updated_at ? new Date(plan.updated_at) : undefined,
          stages: processedStages.filter(
            (stage) => stage.maintenance_plan_id === plan.id
          ),
        }));

        // Flatten maintenance types
        const flattenMaintenanceTypes = (
          items: MaintenanceTypeWithChildren[]
        ): MaintenanceTypeBase[] => {
          const result: MaintenanceTypeBase[] = [];
          const processItem = (
            item: MaintenanceTypeWithChildren
          ): MaintenanceTypeBase => {
            const processed: MaintenanceTypeBase = {
              id: item.id,
              type: item.type,
              parent_id: item.parent_id,
              level: item.level,
              path: item.path,
              created_at: new Date(item.created_at),
              user_id: item.user_id,
            };
            result.push(processed);
            if (item.children && item.children.length > 0) {
              item.children.forEach((child) => processItem(child));
            }
            return processed;
          };
          items.forEach((item) => processItem(item));
          return result;
        };

        const flatMaintenanceTypesData =
          flattenMaintenanceTypes(maintenanceTypesData);

        setPlans(processedPlans);
        setAllStages(processedStages);
        setFlatMaintenanceTypes(flatMaintenanceTypesData);
        setMaintenanceTypes(maintenanceTypesData);
        setNoise(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setNoise({
          type: "error",
          styleType: "page",
          message: "Error al cargar los datos.",
        });
      }
    };

    fetchData();
  }, []);

  if (!session || !session.user?.id) {
    return null;
  }

  const handleCreatePlan = async (data: MaintenancePlanFormData) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Creando plan de mantenimiento...",
    });

    try {
      const res = await fetch("/api/maintenance-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          user_id: session.user.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create maintenance plan");
      }

      const newPlanData = (await res.json()).data as MaintenancePlanBase;
      const newPlan: MaintenancePlanWithStages = {
        id: newPlanData.id,
        user_id: session.user.id,
        name: data.name.trim(),
        description:
          data.description && data.description !== ""
            ? data.description.trim()
            : "",
        created_at: new Date(newPlanData.created_at),
        stages: [],
      };

      setPlans((prev) => [...prev, newPlan]);
      setNoise(null);
      toastVariables.success("Plan de mantenimiento creado exitosamente.");
    } catch (error) {
      console.error("Error creating maintenance plan:", error);
      toastVariables.error(
        error instanceof Error
          ? error.message
          : "Error al crear el plan de mantenimiento."
      );
      setNoise(null);
    }
  };

  const handleUpdatePlan = async (data: MaintenancePlanFormData) => {
    if (!editingPlan) return;

    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Actualizando plan de mantenimiento...",
    });

    try {
      const res = await fetch("/api/maintenance-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPlan.id,
          ...data,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update maintenance plan");
      }

      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === editingPlan.id
            ? { ...plan, ...data, updated_at: new Date() }
            : plan
        )
      );

      setEditingPlan(null);
      setNoise(null);
      toastVariables.success("Plan de mantenimiento actualizado exitosamente.");
    } catch (error) {
      console.error("Error updating maintenance plan:", error);
      toastVariables.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar el plan de mantenimiento."
      );
      setNoise(null);
    }
  };

  const handleDeletePlan = async (id: string) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Eliminando plan de mantenimiento...",
    });

    try {
      const res = await fetch("/api/maintenance-plan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete maintenance plan");
      }

      setPlans((prev) => prev.filter((plan) => plan.id !== id));
      setAllStages((prev) =>
        prev.filter((stage) => stage.maintenance_plan_id !== id)
      );
      setNoise(null);
      toastVariables.success("Plan de mantenimiento eliminado exitosamente.");
    } catch (error) {
      console.error("Error deleting maintenance plan:", error);
      toastVariables.error("Error al eliminar el plan de mantenimiento.");
      setNoise(null);
    }
  };

  const handleCreateStage = async (data: MaintenanceStageFormData) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Creando etapa de mantenimiento...",
    });

    try {
      let planStages = allStages.filter(
        (s) => s.maintenance_plan_id === data.maintenance_plan_id
      );

      const res = await fetch("/api/maintenance-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          days: data.days * selectedUnitTimeType.days,
          stage_index: planStages.length + 1,
          user_id: session.user.id,
          stages: planStages.map((stage) => ({
            id: stage.id,
            maintenance_type_id: stage.maintenance_type_id,
            maintenance_plan_id: stage.maintenance_plan_id,
            kilometers: stage.kilometers,
            days: stage.days,
            created_at: stage.created_at.toISOString(),
            stage_index: stage.stage_index,
            user_id: stage.user_id,
          })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error creating maintenance stage:", errorData);
        throw new Error(
          errorData.error || "Failed to create maintenance stage"
        );
      }

      const newStageData = (await res.json()).data as MaintenanceStageBase & {
        sorted_stages: string[];
      };
      const newStage: MaintenanceStageBase = {
        id: newStageData.id,
        stage_index: newStageData.stage_index,
        user_id: session.user.id,
        maintenance_plan_id: data.maintenance_plan_id,
        maintenance_type_id: data.maintenance_type_id,
        kilometers: data.kilometers,
        days: data.days * selectedUnitTimeType.days,
        created_at: new Date(newStageData.created_at),
      };

      const sorted_stages = newStageData.sorted_stages;
      planStages.push(newStage);
      sorted_stages.forEach((stageId, index) => {
        const stage = planStages.find((s) => s.id === stageId);
        if (stage && stage.stage_index !== index + 1) {
          planStages = planStages.map((s) =>
            s.id === stageId ? { ...s, stage_index: index + 1 } : s
          );
        }
      });

      setAllStages((prev) => [
        ...prev.map((stage) => {
          const updatedStage = planStages.find((s) => s.id === stage.id);
          return updatedStage ? updatedStage : stage;
        }),
        newStage,
      ]);

      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === data.maintenance_plan_id
            ? { ...plan, stages: planStages }
            : plan
        )
      );

      setNoise(null);
      toastVariables.success("Etapa de mantenimiento creada exitosamente.");
      setSelectedUnitTimeType(unitTimeType[0]);
    } catch (error) {
      console.error("Error creating maintenance stage:", error);
      toastVariables.error(
        error instanceof Error
          ? error.message
          : "Error al crear la etapa de mantenimiento."
      );
      setSelectedUnitTimeType(unitTimeType[0]);
      setNoise(null);
    }
  };

  const handleUpdateStage = async (data: MaintenanceStageFormData) => {
    if (!editingStage) return;

    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Actualizando etapa de mantenimiento...",
    });

    try {
      console.log("Datos recibidos en PUT:", data);
      let planStages = allStages.filter(
        (s) => s.maintenance_plan_id === data.maintenance_plan_id
      );

      const uploadPayload = {
        ...data,
        days: data.days * selectedUnitTimeType.days,
        id: editingStage.id,
        stage_index: editingStage.stage_index,
        stages: planStages.map((stage) => ({
          id: stage.id,
          maintenance_type_id: stage.maintenance_type_id,
          maintenance_plan_id: stage.maintenance_plan_id,
          stage_index: stage.stage_index,
          kilometers: stage.kilometers,
          days: stage.days,
          created_at: stage.created_at,
          user_id: stage.user_id,
        })),
      };
      const res = await fetch("/api/maintenance-stage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Failed to update maintenance stage"
        );
      }

      const updatedStageData = (await res.json())
        .data as MaintenanceStageBase & {
        sorted_stages: string[];
      };

      const updatedStage: MaintenanceStageBase = {
        id: updatedStageData.id,
        stage_index: updatedStageData.stage_index,
        user_id: session.user.id,
        maintenance_plan_id: data.maintenance_plan_id,
        maintenance_type_id: data.maintenance_type_id,
        kilometers: data.kilometers,
        days: data.days * selectedUnitTimeType.days,
        created_at: new Date(editingStage.created_at),
      };

      const sorted_stages = updatedStageData.sorted_stages;
      planStages = planStages.map((stage) =>
        stage.id === updatedStage.id ? updatedStage : stage
      );
      sorted_stages.forEach((stageId, index) => {
        const stage = planStages.find((s) => s.id === stageId);
        if (stage && stage.stage_index !== index + 1) {
          planStages = planStages.map((s) =>
            s.id === stageId ? { ...s, stage_index: index + 1 } : s
          );
        }
      });

      setAllStages((prev) => [
        ...prev.map((stage) => {
          const updatedStage = planStages.find((s) => s.id === stage.id);
          return updatedStage ? updatedStage : stage;
        }),
        updatedStage,
      ]);

      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === data.maintenance_plan_id
            ? { ...plan, stages: planStages }
            : plan
        )
      );

      setEditingStage(null);
      setNoise(null);
      setSelectedUnitTimeType(unitTimeType[0]);
      toastVariables.success(
        "Etapa de mantenimiento actualizada exitosamente."
      );
    } catch (error) {
      console.error("Error updating maintenance stage:", error);
      toastVariables.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar la etapa de mantenimiento."
      );
      setSelectedUnitTimeType(unitTimeType[0]);
      setNoise(null);
    }
  };

  const handleDeleteStage = async (id: string) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Eliminando etapa de mantenimiento...",
    });

    try {
      const res = await fetch("/api/maintenance-stage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error deleting maintenance stage:", errorData);
        throw new Error("Failed to delete maintenance stage");
      }

      setAllStages((prev) => prev.filter((stage) => stage.id !== id));
      setPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          stages: plan.stages.filter((stage) => stage.id !== id),
        }))
      );

      setNoise(null);
      toastVariables.success("Etapa de mantenimiento eliminada exitosamente.");
    } catch (error) {
      console.error("Error deleting maintenance stage:", error);
      toastVariables.error("Error al eliminar la etapa de mantenimiento.");
      setNoise(null);
    }
  };

  // Modal handlers
  const openCreatePlanModal = () => {
    setEditingPlan(null);
    planForm.reset({ name: "", description: "" });
    setIsPlanModalOpen(true);
  };

  const openEditPlanModal = (plan: MaintenancePlanBase) => {
    setEditingPlan(plan);
    planForm.setValue("name", plan.name);
    planForm.setValue("description", plan.description || "");
    setIsPlanModalOpen(true);
  };

  const openCreateStageModal = (planId: string) => {
    setSelectedPlanForStage(planId);
    setSelectedUnitTimeType(unitTimeType[0]);
    setEditingStage(null);
    stageForm.reset({
      maintenance_type_id: "",
      maintenance_plan_id: planId,
      kilometers: 0,
      days: 0,
    });
    setIsStageModalOpen(true);
  };

  const openEditStageModal = (stage: MaintenanceStageBase) => {
    setSelectedPlanForStage(stage.maintenance_plan_id);
    setEditingStage(stage);
    const dateInfo = getUnitTimeTypeByDays(stage.days);
    setSelectedUnitTimeType(dateInfo.unitType);
    stageForm.setValue("maintenance_type_id", stage.maintenance_type_id);
    stageForm.setValue("maintenance_plan_id", stage.maintenance_plan_id);
    stageForm.setValue("kilometers", stage.kilometers);
    stageForm.setValue("days", dateInfo.daysInUnitType);
    setIsStageModalOpen(true);
  };

  const handleCancelPlan = () => {
    setIsPlanModalOpen(false);
    setEditingPlan(null);
    planForm.reset();
  };

  const handleCancelStage = () => {
    setIsStageModalOpen(false);
    setEditingStage(null);
    setSelectedPlanForStage("");
    setSelectedUnitTimeType(unitTimeType[0]);
    stageForm.reset();
  };

  // Form submit handlers
  const onSubmitPlan = async (data: MaintenancePlanFormData) => {
    if (editingPlan) {
      await handleUpdatePlan(data);
    } else {
      await handleCreatePlan(data);
    }
    setIsPlanModalOpen(false);
  };

  const onSubmitStage = async (data: MaintenanceStageFormData) => {
    if (editingStage) {
      await handleUpdateStage(data);
    } else {
      await handleCreateStage(data);
    }
    setIsStageModalOpen(false);
  };

  if (noise && noise.styleType === "page") {
    return <Noise noise={noise} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {noise && <Noise noise={noise} />}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Gestión de Planes de Mantenimiento
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Administra planes de mantenimiento y sus etapas correspondientes
          </p>
        </div>
        <Button onClick={openCreatePlanModal}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Plan
        </Button>
      </div>

      {plans.length === 0 && !noise ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No hay planes de mantenimiento registrados
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Haz clic en &quot;Crear Plan&quot; para agregar el primer plan
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <PlanSection
              key={plan.id}
              plan={plan}
              maintenanceTypes={maintenanceTypes}
              flatMaintenanceTypes={flatMaintenanceTypes}
              allStages={allStages}
              onEditPlan={openEditPlanModal}
              onDeletePlan={(id) => setAskingDeletePlan(id)}
              onCreateStage={openCreateStageModal}
              onEditStage={openEditStageModal}
              onDeleteStage={(id) => setAskingDeleteStage(id)}
            />
          ))}
        </div>
      )}

      {/* Delete Plan Confirmation Modal */}
      {askingDeletePlan && (
        <Modal onClose={() => setAskingDeletePlan(undefined)}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Confirmar Eliminación
            </h2>
            <p className="text-gray-700 mb-4">
              ¿Estás seguro de que deseas eliminar este plan de mantenimiento?
              Esta acción también eliminará todas las etapas asociadas.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setAskingDeletePlan(undefined)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeletePlan(askingDeletePlan);
                  setAskingDeletePlan(undefined);
                }}
                className="flex-1"
              >
                Eliminar Plan
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Stage Confirmation Modal */}
      {askingDeleteStage && (
        <Modal onClose={() => setAskingDeleteStage(undefined)}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Confirmar Eliminación
            </h2>
            <p className="text-gray-700 mb-4">
              ¿Estás seguro de que deseas eliminar esta etapa de mantenimiento?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setAskingDeleteStage(undefined)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteStage(askingDeleteStage);
                  setAskingDeleteStage(undefined);
                }}
                className="flex-1"
              >
                Eliminar Etapa
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Plan Modal (Create/Edit) */}
      {isPlanModalOpen && (
        <Modal onClose={handleCancelPlan}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingPlan
                ? "Editar Plan de Mantenimiento"
                : "Crear Plan de Mantenimiento"}
            </h2>
            <form
              onSubmit={planForm.handleSubmit(onSubmitPlan)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Nombre del Plan</Label>
                <Controller
                  name="name"
                  control={planForm.control}
                  render={({ field }) => (
                    <Input
                      id="name"
                      placeholder="Ingresa el nombre del plan"
                      {...field}
                    />
                  )}
                />
                {planForm.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {planForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Controller
                  name="description"
                  control={planForm.control}
                  render={({ field }) => (
                    <Textarea
                      id="description"
                      placeholder="Describe el propósito del plan"
                      rows={3}
                      {...field}
                    />
                  )}
                />
                {planForm.formState.errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {planForm.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelPlan}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingPlan ? "Actualizar Plan" : "Crear Plan"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Stage Modal (Create/Edit) */}
      {isStageModalOpen && selectedPlanForStage && (
        <Modal onClose={handleCancelStage}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingStage
                ? "Editar Etapa de Mantenimiento"
                : "Crear Etapa de Mantenimiento"}
            </h2>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Plan:</strong>{" "}
                {plans.find((p) => p.id === selectedPlanForStage)?.name}
              </p>
            </div>
            <form
              onSubmit={stageForm.handleSubmit(onSubmitStage)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="maintenance_type_id">
                  Tipo de Mantenimiento
                </Label>
                <Controller
                  name="maintenance_type_id"
                  control={stageForm.control}
                  render={({ field }) => (
                    <MaintenanceTypeSelect
                      maintenanceTypes={getAvailableMaintenanceTypes(
                        selectedPlanForStage,
                        editingStage?.id
                      )}
                      selectedValue={field.value}
                      onChange={(value) => field.onChange(value)}
                    />
                  )}
                />
                {stageForm.formState.errors.maintenance_type_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {stageForm.formState.errors.maintenance_type_id.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="kilometers">
                  Valor de Referencia (km)
                  <span className="text-gray-500 text-sm ml-2">
                    (determina el orden automáticamente)
                  </span>
                </Label>
                <Controller
                  name="kilometers"
                  control={stageForm.control}
                  render={({ field }) => (
                    <Input
                      id="kilometers"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                        if (e.target.value) {
                          validateStageValue(
                            value,
                            "kilometers",
                            selectedPlanForStage
                          );
                        }
                      }}
                    />
                  )}
                />
                {stageForm.formState.errors.kilometers && (
                  <p className="text-red-500 text-sm mt-1">
                    {stageForm.formState.errors.kilometers.message}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Cada etapa debe tener un valor único dentro del plan.
                </p>
              </div>

              <div className="flex-col gap-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="days">Días de Referencia</Label>
                    <Controller
                      name="days"
                      control={stageForm.control}
                      render={({ field }) => (
                        <Input
                          id="days"
                          type="number"
                          step="1"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            field.onChange(value);
                            if (e.target.value) {
                              validateStageValue(
                                value,
                                "days",
                                selectedPlanForStage
                              );
                            }
                          }}
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="unit_time_type">Unidad de Tiempo</Label>
                    <Select
                      onValueChange={(value) => {
                        setSelectedUnitTimeType(
                          unitTimeType.find((type) => type.value === value) ||
                            unitTimeType[0]
                        );
                      }}
                      value={selectedUnitTimeType.value}
                    >
                      <SelectTrigger id="unit_time_type">
                        <SelectValue placeholder="Selecciona unidad" />
                      </SelectTrigger>
                      <SelectContent className="z-[1000]">
                        {unitTimeType.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {stageForm.formState.errors.days && (
                  <p className="text-red-500 text-sm mt-1">
                    {stageForm.formState.errors.days.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelStage}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingStage ? "Actualizar Etapa" : "Crear Etapa"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
