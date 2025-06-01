"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataCard } from "@/components/DataCard";
import { Plus } from "lucide-react";
import type { ActivityFormData } from "@/lib/schemas";
import type { ActivityBase, MultiActivity } from "@/types/activity";
import type {
  MaintenanceTypeBase,
  MaintenanceTypeWithChildren,
} from "@/types/maintenance-type";
import { activitySchema } from "@/lib/schemas";
import { Modal } from "@/components/Modal";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NoiseType } from "@/types/noise";
import { Noise } from "@/components/Noise";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { toastVariables } from "@/components/ToastVariables";

// Recursive component for maintenance type selection dropdown
interface MaintenanceTypeOptionProps {
  node: MaintenanceTypeWithChildren;
  level: number;
  selectedValue?: string;
}

const MaintenanceTypeOption: React.FC<MaintenanceTypeOptionProps> = ({
  node,
  level,
  selectedValue,
}) => {
  const indent = "—".repeat(level);

  return (
    <>
      <SelectItem
        value={node.id}
        className={selectedValue === node.id ? "bg-blue-50" : ""}
      >
        {indent} {node.type} (Nivel {node.level})
      </SelectItem>
      {node.children?.map((child) => (
        <MaintenanceTypeOption
          key={child.id}
          node={child}
          level={level + 1}
          selectedValue={selectedValue}
        />
      ))}
    </>
  );
};

export default function ActivityPage() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<ActivityBase[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<
    MaintenanceTypeWithChildren[]
  >([]);
  const [flatMaintenanceTypes, setFlatMaintenanceTypes] = useState<
    MaintenanceTypeBase[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityBase | null>(null);
  const [noise, setNoise] = useState<NoiseType | null>({
    type: "loading",
    styleType: "page",
    message: "Loading activities...",
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: "",
      description: "",
      maintenance_type_id: "",
    },
  });

  // Get maintenance type name by ID
  const getMaintenanceTypeName = (maintenanceTypeId: string): string => {
    const maintenanceType = flatMaintenanceTypes.find(
      (mt) => mt.id === maintenanceTypeId
    );
    return maintenanceType?.type || "Tipo no encontrado";
  };

  // Get maintenance type path for display
  const getMaintenanceTypePath = (maintenanceTypeId: string): string => {
    const maintenanceType = flatMaintenanceTypes.find(
      (mt) => mt.id === maintenanceTypeId
    );
    if (!maintenanceType) return "";

    if (maintenanceType.path) {
      return `${maintenanceType.path}/${maintenanceType.type}`;
    }
    return maintenanceType.type;
  };

  useEffect(() => {
    // Fetch both activities and maintenance types
    const fetchData = async () => {
      setNoise({
        type: "loading",
        styleType: "page",
        message: "Cargando actividades...",
      });

      try {
        // Fetch activities
        const activitiesRes = await fetch("/api/activities");
        if (!activitiesRes.ok) {
          throw new Error("Failed to fetch activities");
        }
        const activitiesData = (await activitiesRes.json())
          .data as MultiActivity;

        // Fetch maintenance types
        const maintenanceTypesRes = await fetch("/api/maintenance-type");
        if (!maintenanceTypesRes.ok) {
          throw new Error("Failed to fetch maintenance types");
        }
        const maintenanceTypesData = (await maintenanceTypesRes.json())
          .data as MaintenanceTypeWithChildren[];

        console.log("Fetched activities:", activitiesData);
        console.log("Fetched maintenance types:", maintenanceTypesData);

        // Process activities
        const processedActivities = activitiesData.data.map((item) => ({
          ...item,
          created_at: new Date(item.created_at),
          updated_at: item.updated_at ? new Date(item.updated_at) : undefined,
        }));

        // Flatten maintenance types and process dates
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

        setActivities(processedActivities);
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

  const handleCreate = async (data: ActivityFormData) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Creando actividad...",
    });

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to create activity");
      }

      const newActivityData = (await res.json()).data as {
        id: string;
        created_at: Date;
      };

      console.log("New activity created:", newActivityData);

      const newActivity: ActivityBase = {
        ...data,
        id: newActivityData.id,
        created_at: new Date(newActivityData.created_at),
        user_id: session.user.id,
      };

      setActivities((prev) => [...prev, newActivity]);
      setNoise(null);
      toastVariables.success("Actividad creada exitosamente.");
    } catch (error) {
      console.error("Error creating activity:", error);
      toastVariables.error("Error al crear la actividad.");
      setNoise(null);
    }
  };

  const handleUpdate = async (data: ActivityFormData) => {
    if (!editingItem) return;

    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Actualizando actividad...",
    });

    try {
      const res = await fetch(`/api/activities/${editingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to update activity");
      }

      const updatedActivities = activities.map((item) =>
        item.id === editingItem.id
          ? { ...item, ...data, updated_at: new Date() }
          : item
      );

      setActivities(updatedActivities);
      setEditingItem(null);
      setNoise(null);
      toastVariables.success("Actividad actualizada exitosamente.");
    } catch (error) {
      console.error("Error updating activity:", error);
      toastVariables.error("Error al actualizar la actividad.");
      setNoise(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete activity");
      }

      setActivities(activities.filter((item) => item.id !== id));
      toastVariables.success("Actividad eliminada exitosamente.");
    } catch (error) {
      console.error("Error deleting activity:", error);
      toastVariables.error("Error al eliminar la actividad.");
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      name: "",
      description: "",
      maintenance_type_id: "",
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    reset();
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openEditModal = (item: ActivityBase) => {
    setEditingItem(item);
    setValue("name", item.name);
    setValue("description", item.description || "");
    setValue("maintenance_type_id", item.maintenance_type_id);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ActivityFormData) => {
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

  return (
    <div className="container mx-auto px-4 py-8">
      {noise && <Noise noise={noise} />}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gestión de Actividades</h1>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Actividad
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activities.map((item) => (
          <DataCard
            key={item.id}
            title={item.name}
            subtitle={getMaintenanceTypeName(item.maintenance_type_id)}
            badges={[
              {
                label: getMaintenanceTypeName(item.maintenance_type_id),
                variant: "secondary",
              },
            ]}
            fields={[
              { label: "Nombre", value: item.name },
              {
                label: "Tipo de Mantenimiento",
                value: getMaintenanceTypePath(item.maintenance_type_id),
              },
              {
                label: "Descripción",
                value: item.description || "Sin descripción",
              },
              {
                label: "Creado",
                value: item.created_at.toLocaleDateString(),
              },
              ...(item.updated_at
                ? [
                    {
                      label: "Actualizado",
                      value: item.updated_at.toLocaleDateString(),
                    },
                  ]
                : []),
            ]}
            onEdit={() => {
              /* openEditModal(item); */
            }}
            onDelete={() => {
              /* handleDelete(item.id); */
            }}
          />
        ))}
      </div>

      {activities.length === 0 && !noise && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No hay actividades registradas
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Haz clic en &quot;Crear Actividad&quot; para agregar la primera
            actividad
          </p>
        </div>
      )}

      {isModalOpen && (
        <Modal onClose={handleCancel}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingItem ? "Editar Actividad" : "Crear Actividad"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="mb-4">
                <Label htmlFor="name">Nombre de la Actividad</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="name"
                      placeholder="Ej: Cambio de aceite, Revisión de frenos"
                      {...field}
                    />
                  )}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="maintenance_type_id">
                  Tipo de Mantenimiento
                </Label>
                <Controller
                  name="maintenance_type_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de mantenimiento..." />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        {maintenanceTypes.map((node) => (
                          <MaintenanceTypeOption
                            key={node.id}
                            node={node}
                            level={0}
                            selectedValue={field.value}
                          />
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.maintenance_type_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.maintenance_type_id.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      id="description"
                      placeholder="Descripción detallada de la actividad..."
                      rows={3}
                      {...field}
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description.message}
                  </p>
                )}
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
                  {editingItem ? "Actualizar Actividad" : "Crear Actividad"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
