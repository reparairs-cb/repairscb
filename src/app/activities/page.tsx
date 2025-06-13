"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataCard } from "@/components/DataCard";
import { Plus, Trash2 } from "lucide-react";
import { ActivityFormData } from "@/lib/schemas";
import type {
  ActivityBase,
  MaintenanceType,
  MultiActivity,
} from "@/types/activity";
import type {
  MaintenanceTypeBase,
  MaintenanceTypeWithChildren,
} from "@/types/maintenance-type";
import { activitySchema } from "@/lib/schemas";
import { Modal } from "@/components/Modal";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NoiseType } from "@/types/noise";
import { Noise } from "@/components/Noise";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { toastVariables } from "@/components/ToastVariables";
import { MaintenanceTypeSelect } from "@/components/MaintenanceTypeSelect";

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
  const [details, setDetails] = useState<ActivityBase | null>(null);
  const [editingItem, setEditingItem] = useState<ActivityBase | null>(null);
  const [updateRestrictions, setUpdateRestrictions] = useState<{
    [key: string]: boolean;
  }>({});
  const [loadingRestrictions, setLoadingRestrictions] = useState(false);
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
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: "",
      description: "",
      maintenance_type_ids: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "maintenance_type_ids",
  });

  const watchedMaintenanceTypeIds = watch("maintenance_type_ids");
  const activityName = watch("name");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getMaintenanceTypeName = (maintenanceTypeId: string): string => {
    const maintenanceType = flatMaintenanceTypes.find(
      (mt) => mt.id === maintenanceTypeId
    );
    return maintenanceType?.type || "Tipo no encontrado";
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getMaintenanceTypePath = (maintenanceTypeId: string): string => {
    const maintenanceType = flatMaintenanceTypes.find(
      (mt) => mt.id === maintenanceTypeId
    );
    if (!maintenanceType) return "";

    if (maintenanceType.path) {
      return maintenanceType.path;
    }

    return maintenanceType.type;
  };

  const getMaintenanceTypesByIds = (ids: string[]): MaintenanceType[] => {
    return ids
      .map((id) => flatMaintenanceTypes.find((mt) => mt.id === id))
      .map((mt) => {
        if (!mt) return undefined;
        return {
          id: mt.id,
          type: mt.type,
          level: mt.level,
        };
      })
      .filter((mt): mt is MaintenanceType => mt !== undefined);
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
        const activitiesRes = await fetch("/api/activities?limit=0");
        if (!activitiesRes.ok) {
          const err = await activitiesRes.json();
          console.error("Error fetching activities:", err);
          throw new Error("Failed to fetch activities");
        }
        const activitiesData = (await activitiesRes.json())
          .data as MultiActivity;

        // Fetch maintenance types
        const maintenanceTypesRes = await fetch(
          "/api/maintenance-type?limit=0"
        );
        if (!maintenanceTypesRes.ok) {
          const err = await maintenanceTypesRes.json();
          console.error("Error fetching maintenance types:", err);
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

  useEffect(() => {
    if (activityName) {
      if (activities.find((item) => item.name === activityName)) {
        setError("name", {
          type: "manual",
          message: "Ya existe una actividad con este nombre.",
        });
      } else {
        clearErrors("name");
      }
    }
  }, [activityName]);

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
      const activityData = {
        name: data.name,
        description: data.description || "",
        maintenance_type_ids: data.maintenance_type_ids.map((mt) => mt.id),
      };

      const res = await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activityData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create activity");
      }

      const newActivityData = (await res.json()).data as {
        id: string;
        created_at: Date;
      };

      console.log("New activity created:", newActivityData);

      const newActivity: ActivityBase = {
        id: newActivityData.id,
        name: data.name,
        description: data.description,
        maintenance_types: getMaintenanceTypesByIds(
          data.maintenance_type_ids.map((mt) => mt.id)
        ),
        created_at: new Date(newActivityData.created_at),
        user_id: session.user.id,
      };
      setActivities((prev) => [...prev, newActivity]);

      setNoise(null);
      toastVariables.success("Actividad creada exitosamente.");
    } catch (error) {
      console.error("Error creating activity:", error);
      toastVariables.error(
        error instanceof Error ? error.message : "Error al crear la actividad."
      );
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

    const updatedData = {
      id: editingItem.id,
      name: data.name,
      description: data.description,
      maintenance_type_ids: data.maintenance_type_ids.map((mt) => mt.id),
    };

    try {
      const res = await fetch(`/api/activities`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update activity");
      }

      const updatedActivities = activities.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: data.name,
              description: data.description,
              maintenance_types: getMaintenanceTypesByIds(
                data.maintenance_type_ids.map((mt) => mt.id)
              ),
              updated_at: new Date(),
            }
          : item
      );

      setActivities(updatedActivities);
      setEditingItem(null);
      setNoise(null);
      toastVariables.success("Actividad actualizada exitosamente.");
    } catch (error) {
      console.error("Error updating activity:", error);
      toastVariables.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar la actividad."
      );
      setNoise(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/activities`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete activity");
      }

      setActivities(activities.filter((item) => item.id !== id));
      toastVariables.success("Actividad eliminada exitosamente.");
    } catch (error) {
      console.error("Error deleting activity:", error);
      toastVariables.error(
        error instanceof Error
          ? error.message
          : "Error al eliminar la actividad."
      );
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      name: "",
      description: "",
      maintenance_type_ids: [],
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setUpdateRestrictions({});
    setLoadingRestrictions(false);
    reset();
  };

  const handleRestrictionCheck = async (activityId: string) => {
    setLoadingRestrictions(true);
    try {
      const res = await fetch("/api/activities/in-maintenance-record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activityId }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Error checking restrictions:", err);
        throw new Error("Failed to check restrictions");
      }

      const result = (await res.json()).data as boolean;

      setUpdateRestrictions((prev) => ({
        ...prev,
        ["maintenance_type"]: result,
      }));

      setLoadingRestrictions(false);
    } catch (error) {
      console.error("Error checking restrictions:", error);
      setLoadingRestrictions(false);
      return false;
    }
  };

  const openEditModal = (item: ActivityBase) => {
    handleRestrictionCheck(item.id);
    setEditingItem(item);
    setValue("name", item.name);
    setValue("description", item.description || "");
    setValue(
      "maintenance_type_ids",
      item.maintenance_types.map((mt) => ({
        id: mt.id,
      }))
    );
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

  const addMaintenanceType = () => {
    append({
      id: "",
    });
  };

  const removeMaintenanceType = (index: number) => {
    remove(index);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAvailableMaintenanceTypes = (currentIndex: number) => {
    const selectedIds = watchedMaintenanceTypeIds.filter(
      (mt, index) => index !== currentIndex && mt.id !== ""
    );
    return flatMaintenanceTypes.filter(
      (mt) => !selectedIds.find((s) => s.id === mt.id)
    );
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
            subtitle={
              item.maintenance_types.length > 0
                ? `${item.maintenance_types.length} tipo${
                    item.maintenance_types.length > 1 ? "s" : ""
                  } de mantenimiento`
                : "Sin tipos"
            }
            badges={item.maintenance_types.map((mt) => ({
              label: mt.type,
              variant: "secondary" as const,
            }))}
            fields={[
              { label: "Nombre", value: item.name },
              {
                label: "Descripción",
                value: item.description || "No disponible",
              },
            ]}
            onEdit={() => {
              openEditModal(item);
            }}
            onDelete={() => {
              handleDelete(item.id);
            }}
            onDetails={() => {
              setDetails(item);
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
          <div className="p-6 max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
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
                <div className="flex items-center justify-between mb-2">
                  <Label>Tipos de Mantenimiento</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMaintenanceType}
                    disabled={fields.length >= 10}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Tipo
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Controller
                          name={`maintenance_type_ids.${index}.id`}
                          control={control}
                          render={({ field: selectField }) => (
                            <MaintenanceTypeSelect
                              maintenanceTypes={maintenanceTypes}
                              selectedValue={selectField.value}
                              onChange={(value) => {
                                if (
                                  !editingItem ||
                                  !updateRestrictions["maintenance_type"]
                                ) {
                                  selectField.onChange(value);
                                }
                              }}
                            />
                          )}
                        />
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMaintenanceType(index)}
                          disabled={
                            (editingItem &&
                              updateRestrictions["maintenance_type"]) ||
                            false
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {errors.maintenance_type_ids && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.maintenance_type_ids.message}
                  </p>
                )}

                <div className="mt-2">
                  {editingItem && loadingRestrictions && (
                    <p className="text-yellow-500 text-sm">
                      Verificando restricciones de actualización...
                    </p>
                  )}
                  {editingItem && updateRestrictions["maintenance_type"] && (
                    <p className="text-red-500 text-sm">
                      No puedes modificar los tipos de mantenimiento de esta
                      actividad porque ya está asociada a un registro de
                      mantenimiento.
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Puedes agregar hasta 10 tipos de mantenimiento por
                    actividad.
                  </p>
                </div>
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
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={(editingItem && loadingRestrictions) || false}
                >
                  {editingItem ? "Actualizar Actividad" : "Crear Actividad"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {details && (
        <Modal onClose={() => setDetails(null)}>
          <div className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Detalles de la Actividad
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Nombre</span>
                  <span>{details.name}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Descripción</span>
                  <span>{details.description || "No disponible"}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    Tipos de Mantenimiento ({details.maintenance_types.length})
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {details.maintenance_types.map((mt) => (
                      <span
                        key={mt.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {mt.path || mt.type}
                      </span>
                    ))}
                    {details.maintenance_types.length === 0 && (
                      <span className="text-gray-500 text-sm">
                        No hay tipos asignados
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    Fecha de Creación
                  </span>
                  <span>
                    {details.created_at.toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}{" "}
                    {details.created_at.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {details.updated_at && (
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      Fecha de Actualización
                    </span>
                    <span>
                      {details.updated_at.toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}{" "}
                      {details.updated_at.toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t">
              <Button onClick={() => setDetails(null)} className="w-full">
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
