"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NoiseType } from "@/types/noise";
import { Noise } from "@/components/Noise";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { toastVariables } from "@/components/ToastVariables";
import { MaintenanceTypeSelect } from "@/components/MaintenanceTypeSelect";
import { z } from "zod";
import type {
  MaintenanceTypeBase,
  MaintenanceTypeWithChildren,
} from "@/types/maintenance-type";
import {
  MaintenanceStageBase,
  MultiMaintenanceStage,
} from "@/types/maintenance-stage";

// Schema mejorado para MaintenanceStage con validación de valor único
const createMaintenanceStageSchema = (
  existingStages: MaintenanceStageBase[],
  editingId?: string
) => {
  return z.object({
    maintenance_type_id: z
      .string()
      .min(1, "Tipo de mantenimiento es requerido"),
    value: z
      .number()
      .min(0, "El valor debe ser mayor o igual a 0")
      .refine((value) => {
        const duplicateStage = existingStages.find(
          (stage) =>
            stage.value === value && (editingId ? stage.id !== editingId : true)
        );
        return !duplicateStage;
      }, "Ya existe una etapa con este valor"),
  });
};

type MaintenanceStageFormData = {
  maintenance_type_id: string;
  value: number;
};

// Componente simple para mostrar cada etapa
interface StageItemProps {
  stage: MaintenanceStageBase;
  maintenanceTypeName: string;
  position: number;
  onEdit: (stage: MaintenanceStageBase) => void;
  onDelete: (id: string) => void;
}

function StageItem({
  stage,
  maintenanceTypeName,
  position,
  onEdit,
  onDelete,
}: StageItemProps) {
  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
              #{position}
            </span>
            <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">
              {stage.value.toLocaleString()} km.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(stage)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(stage.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <span className="text-sm font-medium text-gray-700">
            Tipo de Mantenimiento:{" "}
            <p className="text-sm text-gray-900">{maintenanceTypeName}</p>
          </span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">
            Valor de Referencia:
          </span>
          <p className="text-sm text-gray-900 font-semibold">
            {stage.value.toLocaleString()} km.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceStagePage() {
  const { data: session } = useSession();
  const [stages, setStages] = useState<MaintenanceStageBase[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<
    MaintenanceTypeWithChildren[]
  >([]);
  const [flatMaintenanceTypes, setFlatMaintenanceTypes] = useState<
    MaintenanceTypeBase[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaintenanceStageBase | null>(
    null
  );
  const [askingDelete, setAskingDelete] = useState<string | undefined>();
  const [noise, setNoise] = useState<NoiseType | null>({
    type: "loading",
    styleType: "page",
    message: "Cargando etapas de mantenimiento...",
  });

  // Schema dinámico basado en las etapas existentes
  const currentSchema = createMaintenanceStageSchema(stages, editingItem?.id);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<MaintenanceStageFormData>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      maintenance_type_id: "",
      value: 0,
    },
  });

  // Get maintenance type name by ID
  const getMaintenanceTypeName = (maintenanceTypeId: string): string => {
    const maintenanceType = flatMaintenanceTypes.find(
      (mt) => mt.id === maintenanceTypeId
    );
    return maintenanceType?.type || "Tipo no encontrado";
  };

  // Get available maintenance types (those without stages)
  const getAvailableMaintenanceTypes = (
    excludeId?: string
  ): MaintenanceTypeWithChildren[] => {
    const usedMaintenanceTypeIds = stages
      .filter((stage) => (excludeId ? stage.id !== excludeId : true))
      .map((stage) => stage.maintenance_type_id);

    const filterAvailableTypes = (
      types: MaintenanceTypeWithChildren[]
    ): MaintenanceTypeWithChildren[] => {
      return types
        .filter((type) => !usedMaintenanceTypeIds.includes(type.id))
        .map((type) => ({
          ...type,
          children: type.children
            ? filterAvailableTypes(type.children)
            : undefined,
        }))
        .filter((type) => type.children?.length || !type.children);
    };

    return filterAvailableTypes(maintenanceTypes);
  };

  // Ordenar etapas por valor
  const getSortedStages = (
    stagesList: MaintenanceStageBase[]
  ): MaintenanceStageBase[] => {
    return [...stagesList].sort((a, b) => a.value - b.value);
  };

  // Validar valor en tiempo real
  const validateValue = (value: number): boolean => {
    const duplicateStage = stages.find(
      (stage) =>
        stage.value === value &&
        (editingItem ? stage.id !== editingItem.id : true)
    );

    if (duplicateStage) {
      setError("value", {
        type: "manual",
        message: "Ya existe una etapa con este valor",
      });
      return false;
    } else {
      clearErrors("value");
      return true;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setNoise({
        type: "loading",
        styleType: "page",
        message: "Cargando etapas de mantenimiento...",
      });

      try {
        // Fetch maintenance stages
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

        // Process stages
        const processedStages = stagesData.data.map((item) => ({
          ...item,
          created_at: new Date(item.created_at),
          updated_at: item.updated_at ? new Date(item.updated_at) : undefined,
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

        // Process hierarchical maintenance types
        const processHierarchicalData = (
          items: MaintenanceTypeWithChildren[]
        ): MaintenanceTypeWithChildren[] => {
          return items.map((item) => ({
            ...item,
            created_at: new Date(item.created_at),
            children: item.children
              ? processHierarchicalData(item.children)
              : undefined,
          }));
        };

        setStages(processedStages);
        setFlatMaintenanceTypes(flatMaintenanceTypesData);
        setMaintenanceTypes(processHierarchicalData(maintenanceTypesData));
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

  const handleCreate = async (data: MaintenanceStageFormData) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Creando etapa de mantenimiento...",
    });

    try {
      const res = await fetch("/api/maintenance-stage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          stage_index: stages.length,
          stages: stages,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Failed to create maintenance stage"
        );
      }

      const newStageData = (await res.json()).data as {
        id: string;
        created_at: Date;
      };

      const newStage: MaintenanceStageBase = {
        ...data,
        id: newStageData.id,
        created_at: new Date(newStageData.created_at),
        user_id: session.user.id,
        stage_index: 0, // Se calculará automáticamente en el backend
      };

      setStages((prev) => [...prev, newStage]);
      setNoise(null);
      toastVariables.success("Etapa de mantenimiento creada exitosamente.");
    } catch (error) {
      console.error("Error creating maintenance stage:", error);
      toastVariables.error(
        error instanceof Error
          ? error.message
          : "Error al crear la etapa de mantenimiento."
      );
      setNoise(null);
    }
  };

  const handleUpdate = async (data: MaintenanceStageFormData) => {
    if (!editingItem) return;

    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Actualizando etapa de mantenimiento...",
    });

    try {
      const res = await fetch(`/api/maintenance-stage`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingItem.id,
          maintenance_type_id: data.maintenance_type_id,
          value: data.value,
          user_id: session.user?.id,
          stage_index: editingItem.stage_index,
          stages: stages.map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  maintenance_type_id: data.maintenance_type_id,
                  value: data.value,
                  updated_at: new Date(),
                }
              : item
          ),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Failed to update maintenance stage"
        );
      }

      const updatedStages = stages.map((item) =>
        item.id === editingItem.id
          ? { ...item, ...data, updated_at: new Date() }
          : item
      );

      setStages(updatedStages);
      setEditingItem(null);
      setNoise(null);
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
      setNoise(null);
    }
  };

  const handleDelete = async (id: string) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Eliminando etapa de mantenimiento...",
    });
    try {
      const res = await fetch(`/api/maintenance-stage`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error deleting maintenance stage:", errorData);
        throw new Error("Failed to delete maintenance stage");
      }

      setStages((prev) => prev.filter((item) => item.id !== id));
      setNoise(null);
      toastVariables.success("Etapa de mantenimiento eliminada exitosamente.");
    } catch (error) {
      setNoise(null);
      console.error("Error deleting maintenance stage:", error);
      toastVariables.error("Error al eliminar la etapa de mantenimiento.");
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      maintenance_type_id: "",
      value: 0,
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    reset();
    clearErrors();
  };

  const openEditModal = (item: MaintenanceStageBase) => {
    setEditingItem(item);
    setValue("maintenance_type_id", item.maintenance_type_id);
    setValue("value", item.value);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: MaintenanceStageFormData) => {
    if (editingItem) {
      await handleUpdate(data);
    } else {
      await handleCreate(data);
    }
    setIsModalOpen(false);
  };

  if (noise && noise.styleType === "page") {
    return <Noise noise={noise} />;
  }

  // Obtener etapas ordenadas por valor
  const sortedStages = getSortedStages(stages);

  return (
    <div className="container mx-auto px-4 py-8">
      {noise && <Noise noise={noise} />}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Gestión de Etapas de Mantenimiento
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Las etapas se ordenan automáticamente por valor de menor a mayor
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Etapa
        </Button>
      </div>

      {sortedStages.length === 0 && !noise ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No hay etapas de mantenimiento registradas
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Haz clic en &quot;Crear Etapa&quot; para agregar la primera etapa
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedStages.map((stage, index) => (
            <StageItem
              key={stage.id}
              stage={stage}
              position={index + 1}
              maintenanceTypeName={getMaintenanceTypeName(
                stage.maintenance_type_id
              )}
              onEdit={openEditModal}
              onDelete={(id) => {
                setAskingDelete(id);
              }}
            />
          ))}
        </div>
      )}

      {askingDelete && (
        <Modal onClose={() => setAskingDelete(undefined)}>
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
                onClick={() => setAskingDelete(undefined)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDelete(askingDelete);
                  setAskingDelete(undefined);
                }}
                className="flex-1"
              >
                Eliminar Etapa
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal para crear/editar etapa */}

      {isModalOpen && (
        <Modal onClose={handleCancel}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingItem
                ? "Editar Etapa de Mantenimiento"
                : "Crear Etapa de Mantenimiento"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="mb-4">
                <Label htmlFor="maintenance_type_id">
                  Tipo de Mantenimiento
                </Label>
                <Controller
                  name="maintenance_type_id"
                  control={control}
                  render={({ field }) => (
                    <MaintenanceTypeSelect
                      maintenanceTypes={getAvailableMaintenanceTypes(
                        editingItem?.id
                      )}
                      selectedValue={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                      }}
                    />
                  )}
                />
                {errors.maintenance_type_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.maintenance_type_id.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="value">
                  Valor de Referencia
                  <span className="text-gray-500 text-sm ml-2">
                    (determina el orden automáticamente)
                  </span>
                </Label>
                <Controller
                  name="value"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                        // Validar en tiempo real
                        if (e.target.value) {
                          validateValue(value);
                        }
                      }}
                    />
                  )}
                />
                {errors.value && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.value.message}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Cada etapa debe tener un valor único. Las etapas se ordenarán
                  automáticamente por este valor.
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingItem ? "Actualizar Etapa" : "Crear Etapa"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
