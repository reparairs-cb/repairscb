"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataCard } from "@/components/DataCard";
import { Plus } from "lucide-react";
import type { MaintenanceRecordFormData } from "@/lib/schemas";
import type { MaintenanceRecordWithDetails } from "@/types/maintenance-record";
import type { EquipmentBase } from "@/types/equipment";
import type {
  MaintenanceTypeBase,
  MaintenanceTypeWithChildren,
} from "@/types/maintenance-type";
import type { ActivityBase } from "@/types/activity";
import type { SparePartBase } from "@/types/spare-part";
import type { MileageRecordBase } from "@/types/mileage-record";
import { maintenanceRecordSchema } from "@/lib/schemas";
import { Modal } from "@/components/Modal";
import { Controller, useForm, useFieldArray } from "react-hook-form";
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
import { MaintenanceTypeSelect } from "@/components/MaintenanceTypeSelect";
import { createLocalDate, dateToLocalISOString } from "@/lib/utils";

interface SelectedSparePart {
  spare_part_id: string;
  spare_part: SparePartBase;
  quantity: number;
  unit_price?: number;
}

const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En Progreso" },
  { value: "completed", label: "Completado" },
];

interface SelectedActivity {
  activity_id: string;
  activity: ActivityBase;
  status: "pending" | "in_progress" | "completed";
  observations?: string;
}

const getMaintenanceTypesById = (
  id: string,
  maintenanceTypes: MaintenanceTypeWithChildren[]
): MaintenanceTypeBase | undefined => {
  for (const type of maintenanceTypes) {
    if (type.id === id) {
      return type;
    }
    if (type.children) {
      const found = getMaintenanceTypesById(id, type.children);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};

export default function MaintenanceRecordsPage() {
  const { data: session } = useSession();
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecordWithDetails[]
  >([]);
  const [equipments, setEquipments] = useState<EquipmentBase[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<
    MaintenanceTypeWithChildren[]
  >([]);
  const [activities, setActivities] = useState<ActivityBase[]>([]);
  const [spareParts, setSpareParts] = useState<SparePartBase[]>([]);
  const [mileageRecords, setMileageRecords] = useState<MileageRecordBase[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [selectedMileageRecord, setSelectedMileageRecord] =
    useState<MileageRecordBase | null>(null);
  const [selectedSpareParts, setSelectedSpareParts] = useState<
    SelectedSparePart[]
  >([]);
  const [selectedActivities, setSelectedActivities] = useState<
    SelectedActivity[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<MaintenanceRecordWithDetails | null>(null);
  const [noise, setNoise] = useState<NoiseType | null>({
    type: "loading",
    styleType: "page",
    message: "Loading maintenance records...",
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MaintenanceRecordFormData>({
    resolver: zodResolver(maintenanceRecordSchema),
    defaultValues: {
      equipment_id: "",
      start_datetime: new Date(),
      end_datetime: new Date(new Date().getTime() + 3600000), // 1 hour later
      maintenance_type_id: "",
      observations: "",
      mileage: 0.0,
      spare_parts: [],
      activities: [],
    },
  });

  const {
    fields: sparePartsFields,
    append: appSparePart,
    update: updtSparePart,
    remove: rmSparePart,
  } = useFieldArray({
    control,
    name: "spare_parts",
  });

  const {
    fields: activitiesFields,
    append: appActivity,
    remove: rmActivity,
  } = useFieldArray({
    control,
    name: "activities",
  });

  // Fetch all necessary data
  useEffect(() => {
    const fetchData = async () => {
      setNoise({
        type: "loading",
        styleType: "page",
        message: "Cargando datos de mantenimiento...",
      });

      try {
        const [
          maintenanceRes,
          equipmentRes,
          maintenanceTypesRes,
          activitiesRes,
          sparePartsRes,
          mileageRes,
        ] = await Promise.all([
          fetch("/api/maintenance-records"),
          fetch("/api/equipments?limit=0"),
          fetch("/api/maintenance-type"),
          fetch("/api/activities"),
          fetch("/api/spare-parts?limit=0"),
          fetch("/api/mileage-record/by-date-range", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              start_date: new Date(),
              end_date: new Date(),
            }),
          }),
        ]);

        if (
          !maintenanceRes.ok ||
          !equipmentRes.ok ||
          !maintenanceTypesRes.ok ||
          !activitiesRes.ok ||
          !sparePartsRes.ok ||
          !mileageRes.ok
        ) {
          if (!maintenanceRes.ok) {
            const err = await maintenanceRes.json();
            console.error(err);
          }
          if (!equipmentRes.ok) {
            const err = await equipmentRes.json();
            console.error(err);
          }
          if (!maintenanceTypesRes.ok) {
            const err = await maintenanceTypesRes.json();
            console.error(err);
          }
          if (!activitiesRes.ok) {
            const err = await activitiesRes.json();
            console.error(err);
          }
          if (!sparePartsRes.ok) {
            const err = await sparePartsRes.json();
            console.error(err);
          }
          if (!mileageRes.ok) {
            const err = await mileageRes.json();
            console.error(err);
          }

          throw new Error("Failed to fetch data");
        }

        const [
          maintenanceData,
          equipmentData,
          maintenanceTypesData,
          activitiesData,
          sparePartsData,
          mileageData,
        ] = await Promise.all([
          maintenanceRes.json(),
          equipmentRes.json(),
          maintenanceTypesRes.json(),
          activitiesRes.json(),
          sparePartsRes.json(),
          mileageRes.json(),
        ]);

        setMaintenanceRecords(
          maintenanceData.data.data.map(
            (item: MaintenanceRecordWithDetails) => ({
              ...item,
              start_datetime: new Date(item.start_datetime),
              end_datetime: item.end_datetime
                ? new Date(item.end_datetime)
                : undefined,
              created_at: new Date(item.created_at),
              updated_at: item.updated_at
                ? new Date(item.updated_at)
                : undefined,
            })
          )
        );

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

        setEquipments(equipmentData.data.data);
        const processedMaintenanceTypes = processHierarchicalData(
          maintenanceTypesData.data
        );
        setMaintenanceTypes(processedMaintenanceTypes);

        setActivities(activitiesData.data.data);
        setSpareParts(sparePartsData.data.data);
        setMileageRecords(
          mileageData.data.data.map(
            (record: MileageRecordBase & { record_date: string }) => {
              return {
                ...record,
                record_date: new Date(createLocalDate(record.record_date)),
                created_at: new Date(record.created_at),
              };
            }
          )
        );

        console.log("Fetched data successfully:", {
          maintenanceRecords: maintenanceData.data.data,
          equipments: equipmentData.data.data,
          maintenanceTypes: maintenanceTypesData.data,
          activities: activitiesData.data.data,
          spareParts: sparePartsData.data.data,
          mileageRecords: mileageData.data.data,
        });

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

  // Fetch mileage records when equipment is selected
  useEffect(() => {
    if (mileageRecords.length > 0) {
      console.log(
        "Using cached mileage records for equipment:",
        selectedEquipmentId
      );

      const todayMileageEquipment = mileageRecords.find((record) => {
        console.log("Checking mileage record:", record);
        console.log("Selected equipment ID:", selectedEquipmentId);
        console.log("Today's date:", new Date().toDateString());
        console.log("Record date:", record.record_date.toDateString());

        return (
          record.equipment_id === selectedEquipmentId &&
          record.record_date.toDateString() === new Date().toDateString()
        );
      });

      if (todayMileageEquipment) {
        console.log(
          "Found today's mileage record for equipment:",
          todayMileageEquipment
        );
        setValue("mileage", todayMileageEquipment.kilometers);
        setSelectedMileageRecord(todayMileageEquipment);
      } else {
        setValue("mileage", 0);
        setSelectedMileageRecord(null);
      }
    }
  }, [selectedEquipmentId]);

  if (!session || !session.user?.id) {
    return null;
  }

  const handleCreate = async (data: MaintenanceRecordFormData) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Creando registro de mantenimiento...",
    });

    try {
      const maintenancePayload = {
        ...data,
        start_datetime: dateToLocalISOString(data.start_datetime),
        end_datetime: data.end_datetime
          ? dateToLocalISOString(data.end_datetime)
          : undefined,
        mileage_record: selectedMileageRecord,
        activities: data.activities.map((act) => ({
          activity_id: act.activity_id,
          status: act.status,
          observations: act.observations || "",
        })),
        spare_parts: data.spare_parts.map((sp) => ({
          spare_part_id: sp.spare_part_id,
          quantity: sp.quantity,
          unit_price: sp.unit_price,
        })),
      };

      const res = await fetch("/api/maintenance-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(maintenancePayload),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Error creating maintenance record:", err);
        throw new Error("Failed to create maintenance record");
      }

      const newRecord = (await res.json()).data as MaintenanceRecordWithDetails;

      if (selectedMileageRecord) {
        setMileageRecords((prev) =>
          prev.map((record) =>
            record.id === selectedMileageRecord.id
              ? {
                  ...record,
                  kilometers: data.mileage,
                  updated_at: new Date(),
                }
              : record
          )
        );
      } else {
        const newMileageRecord = newRecord.mileage_info;

        if (!newMileageRecord) {
          throw new Error(
            "No mileage record created for new maintenance record"
          );
        }

        setMileageRecords((prev) => [
          ...prev,
          {
            equipment_id: data.equipment_id,
            kilometers: newMileageRecord.kilometers,
            record_date: new Date(newMileageRecord.record_date),
            id: newMileageRecord.id,
            created_at: newMileageRecord.record_date,
          },
        ]);
      }

      console.log("New maintenance record created:", newRecord);

      setNoise(null);
      toastVariables.success("Registro de mantenimiento creado exitosamente.");
      setMaintenanceRecords((prev) => [
        ...prev,
        {
          ...data,
          id: newRecord.id,
          start_datetime: new Date(data.start_datetime),
          end_datetime: data.end_datetime
            ? new Date(data.end_datetime)
            : undefined,
          created_at: new Date(),
          updated_at: new Date(),
          equipment: equipments.find(
            (eq) => eq.id === data.equipment_id
          ) as EquipmentBase,
          maintenance_type: getMaintenanceTypesById(
            data.maintenance_type_id,
            maintenanceTypes
          ),
          mileage_record_id: newRecord.mileage_record_id,
          mileage_info: {
            kilometers: data.mileage,
            record_date: newRecord.mileage_info?.record_date,
            id: newRecord.mileage_record_id,
          },
          spare_parts: selectedSpareParts.map((sp) => ({
            id: crypto.randomUUID(),
            spare_part_id: sp.spare_part_id,
            quantity: sp.quantity,
            unit_price: sp.unit_price,
            spare_part: spareParts.find(
              (spare) => spare.id === sp.spare_part_id
            ) as SparePartBase,
            maintenance_record_id: newRecord.id,
            created_at: new Date(),
          })),
          activities: selectedActivities.map((act, index) => ({
            id: newRecord.activities?.[index].id || crypto.randomUUID(),
            activity_id: act.activity_id,
            observations: act.observations,
            activity: activities.find(
              (activity) => activity.id === act.activity_id
            ) as ActivityBase,
            maintenance_record_id: newRecord.id, // Simulate new ID for demo purposes
            created_at: new Date(),
            status: act.status,
          })),
          user_id: session.user.id,
        } as MaintenanceRecordWithDetails,
      ]);
      setIsModalOpen(false);
    } catch (error) {
      setNoise(null);
      console.error("Error creating maintenance record:", error);
      toastVariables.error("Error al crear el registro de mantenimiento.");
    }
  };

  const handleUpdate = async (data: MaintenanceRecordFormData) => {
    if (!editingItem) return;

    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Actualizando registro de mantenimiento...",
    });

    try {
      if (data.spare_parts.some((sp) => !sp.spare_part_id)) {
        toastVariables.error(
          "Necesita seleccionar los repuestos para el mantenimiento."
        );
        return;
      }

      if (data.activities.some((act) => !act.activity_id)) {
        toastVariables.error(
          "Necesita seleccionar las actividades para el mantenimiento."
        );
        return;
      }

      const updatePayload = {
        ...data,
        start_datetime: dateToLocalISOString(data.start_datetime),
        end_datetime: data.end_datetime
          ? dateToLocalISOString(data.end_datetime)
          : undefined,
        mileage_record: editingItem.mileage_info,
        id: editingItem.id,
        spare_parts: data.spare_parts.map((sp) => ({
          id: sp.id,
          spare_part_id: sp.spare_part_id,
          quantity: sp.quantity,
          unit_price: sp.unit_price,
        })),
        activities: data.activities.map((act) => ({
          id: act.id,
          activity_id: act.activity_id,
          status: act.status,
          observations: act.observations || "",
        })),
        original_spare_parts: editingItem.spare_parts
          ? editingItem.spare_parts.map((sp) => ({
              id: sp.id,
              spare_part_id: sp.spare_part_id,
              quantity: sp.quantity,
              unit_price: sp.unit_price,
            }))
          : [],
        original_activities: editingItem.activities
          ? editingItem.activities.map((act) => ({
              id: act.id,
              activity_id: act.activity_id,
              status: act.status,
              observations: act.observations || "",
            }))
          : [],
      };

      const res = await fetch(`/api/maintenance-records`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Error updating maintenance record:", err);
        throw new Error("Failed to update maintenance record");
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const updatedRecord = (await res.json())
        .data as MaintenanceRecordWithDetails;

      setMaintenanceRecords((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                start_datetime: new Date(data.start_datetime),
                end_datetime: data.end_datetime
                  ? new Date(data.end_datetime)
                  : undefined,
                maintenance_type_id: data.maintenance_type_id,
                observations: data.observations || "",
                mileage_info: {
                  kilometers: data.mileage,
                  record_date: item.mileage_info?.record_date || new Date(),
                  id: item.mileage_info?.id || crypto.randomUUID(),
                },
                spare_parts: data.spare_parts.map((sp) => ({
                  id: sp.id || crypto.randomUUID(),
                  spare_part_id: sp.spare_part_id,
                  quantity: sp.quantity,
                  unit_price: sp.unit_price,
                  spare_part: spareParts.find(
                    (spare) => spare.id === sp.spare_part_id
                  ) as SparePartBase,
                  maintenance_record_id: item.id,
                  created_at: new Date(),
                })),
                activities: data.activities.map((act) => ({
                  id: act.id || crypto.randomUUID(),
                  activity_id: act.activity_id,
                  status: act.status,
                  observations: act.observations || "",
                  activity: activities.find(
                    (activity) => activity.id === act.activity_id
                  ) as ActivityBase,
                  maintenance_record_id: item.id, // Simulate new ID for demo purposes
                  created_at: new Date(),
                })),
              }
            : item
        )
      );

      setNoise(null);
      toastVariables.success(
        "Registro de mantenimiento actualizado exitosamente."
      );
    } catch (error) {
      setNoise(null);
      console.error("Error updating maintenance record:", error);
      toastVariables.error("Error al actualizar el registro de mantenimiento.");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/maintenance-records`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Error deleting maintenance record:", err);
        throw new Error("Failed to delete maintenance record");
      }

      setMaintenanceRecords((prev) => prev.filter((item) => item.id !== id));
      toastVariables.success(
        "Registro de mantenimiento eliminado exitosamente."
      );
    } catch (error) {
      console.error("Error deleting maintenance record:", error);
      toastVariables.error("Error al eliminar el registro de mantenimiento.");
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setSelectedSpareParts([]);
    setSelectedActivities([]);
    setSelectedEquipmentId("");
    reset();
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setSelectedSpareParts([]);
    setSelectedActivities([]);
    setSelectedEquipmentId("");
    reset();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openEditModal = (item: MaintenanceRecordWithDetails) => {
    setEditingItem(item);
    console.log("Editing item:", item);
    setValue("equipment_id", item.equipment_id);
    setValue("start_datetime", item.start_datetime);
    setValue("end_datetime", item.end_datetime);
    setValue("maintenance_type_id", item.maintenance_type_id);
    setValue("observations", item.observations || "");
    setValue("mileage", item.mileage_info?.kilometers || 0.0);
    setValue(
      "spare_parts",
      item.spare_parts?.map((sp) => ({
        spare_part_id: sp.spare_part_id,
        quantity: sp.quantity,
        unit_price: sp.unit_price,
      })) || []
    );
    setValue(
      "activities",
      item.activities?.map((act) => ({
        activity_id: act.activity_id,
        status: act.status,
        observations: act.observations || "",
      })) || []
    );
    setSelectedMileageRecord(
      mileageRecords.find(
        (record) =>
          record.id === item.mileage_info?.id ||
          (record.equipment_id === item.equipment_id &&
            record.record_date.toDateString() ===
              item.start_datetime.toDateString())
      ) || null
    );
    setIsModalOpen(true);
  };

  const addSparePart = () => {
    appSparePart({
      spare_part_id: "",
      quantity: 1,
      unit_price: undefined,
    });
  };

  const addActivity = () => {
    appActivity({
      activity_id: "",
      status: "pending",
      observations: "",
    });
  };

  const onSubmit = async (data: MaintenanceRecordFormData) => {
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
        <h1 className="text-2xl font-bold">Gestión de Mantenimiento</h1>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Mantenimiento
        </Button>
      </div>

      {maintenanceRecords.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No hay registros de mantenimiento disponibles.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Haz clic en &quot;Nuevo mantenimiento&quot; para agregar tu primer
            registro
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {maintenanceRecords
          .sort(
            (a, b) => b.start_datetime.getTime() - a.start_datetime.getTime()
          )
          .map((item) => (
            <DataCard
              key={item.id}
              title={`${
                item.equipment?.type
              } - ${item.start_datetime.toLocaleDateString()}`}
              subtitle={item.maintenance_type?.type}
              badges={[
                {
                  label: item.equipment?.license_plate || "N/A",
                  variant: "outline",
                },
              ]}
              fields={[
                {
                  label: "Equipo",
                  value: `${item.equipment?.type} (${item.equipment?.code})`,
                },
                { label: "Tipo", value: item.maintenance_type?.type },
                {
                  label: "Kilometraje",
                  value: `${item.mileage_info?.kilometers || "N/A"} km`,
                },
                {
                  label: "Descripción",
                  value: item.observations || "N/A",
                },
              ]}
              onEdit={() => {
                openEditModal(item);
              }}
              onDelete={() => {
                handleDelete(item.id);
              }}
            />
          ))}
      </div>

      {isModalOpen && (
        <Modal onClose={handleCancel}>
          <div className="p-6 max-h-[90vh] max-w-[90vw] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingItem
                ? "Editar Registro de Mantenimiento"
                : "Crear Registro de Mantenimiento"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Equipment Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipment_id">Equipo *</Label>
                  <Controller
                    name="equipment_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedEquipmentId(value);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar equipo" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000] lg:max-h-[30vh] md:max-h-[40vh] max-h-[60vh]">
                          {equipments.map((equipment) => (
                            <SelectItem key={equipment.id} value={equipment.id}>
                              {equipment.type} - {equipment.code} (
                              {equipment.license_plate})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.equipment_id && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.equipment_id.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="maintenance_type_id">
                    Tipo de Mantenimiento *
                  </Label>
                  <Controller
                    name="maintenance_type_id"
                    control={control}
                    render={({ field }) => (
                      <MaintenanceTypeSelect
                        maintenanceTypes={maintenanceTypes}
                        selectedValue={field.value}
                        onChange={(value) => field.onChange(value)}
                      />
                    )}
                  />
                  {errors.maintenance_type_id && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.maintenance_type_id.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Date and Mileage */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="start_datetime">
                    Fecha y Hora de Inicio *
                  </Label>
                  <Controller
                    name="start_datetime"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="datetime-local"
                        value={
                          field.value instanceof Date
                            ? dateToLocalISOString(field.value)
                            : field.value
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    )}
                  />
                  {errors.start_datetime && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.start_datetime.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="end_datetime">Fecha y Hora de Fin</Label>
                  <Controller
                    name="end_datetime"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="datetime-local"
                        value={
                          field.value instanceof Date
                            ? dateToLocalISOString(field.value)
                            : field.value || ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined
                          )
                        }
                      />
                    )}
                  />
                  {errors.end_datetime && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.end_datetime.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="mileage_record_id">
                    Registro de Kilometraje *
                  </Label>
                  <Controller
                    name="mileage"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        placeholder="Ingresa el kilometraje..."
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    )}
                  />
                  {errors.mileage && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.mileage.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Observations */}
              <div>
                <Label htmlFor="observations">Observaciones</Label>
                <Controller
                  name="observations"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      id="observations"
                      placeholder="Ingrese observaciones del mantenimiento..."
                      rows={3}
                      {...field}
                    />
                  )}
                />
                {errors.observations && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.observations.message}
                  </p>
                )}
              </div>

              {/* Activities Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Actividades</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addActivity}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Actividad
                  </Button>
                </div>

                <Controller
                  name="activities"
                  control={control}
                  render={() => (
                    <div className="space-y-3">
                      {activitiesFields.map((activity, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 mb-3 relative"
                        >
                          <div className="grid grid-cols-1 gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Actividad</Label>
                                <Controller
                                  name={`activities.${index}.activity_id`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select
                                      onValueChange={(value) => {
                                        const selectedActivity =
                                          activities.find(
                                            (a) => a.id === value
                                          );
                                        if (!selectedActivity) return;
                                        field.onChange(value);
                                      }}
                                      value={field.value}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar actividad" />
                                      </SelectTrigger>
                                      <SelectContent className="z-[10000] lg:max-h-[30vh] md:max-h-[40vh] max-h-[60vh]">
                                        {activities.map((act) => (
                                          <SelectItem
                                            key={act.id}
                                            value={act.id}
                                          >
                                            {act.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full">
                              <Label className="flex-1">Estado</Label>
                              <Controller
                                name={`activities.${index}.status`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[10000] lg:max-h-[30vh] md:max-h-[40vh] max-h-[60vh]">
                                      {statusOptions.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>

                            <div className="flex flex-col gap-2 w-full">
                              <Label className="flex-1">Observaciones</Label>
                              <Controller
                                name={`activities.${index}.observations`}
                                control={control}
                                render={({ field }) => (
                                  <Textarea
                                    placeholder="Observaciones"
                                    className="max-h-[20vh] md:max-h-[10vh]"
                                    value={field.value || ""}
                                    onChange={(e) =>
                                      field.onChange(e.target.value)
                                    }
                                  />
                                )}
                              />
                            </div>
                            {errors.activities?.[index]?.activity_id && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.activities[index].activity_id.message}
                              </p>
                            )}
                            {errors.activities?.[index]?.status && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.activities[index].status.message}
                              </p>
                            )}
                          </div>
                          <div className="absolute -top-1 -right-1">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => rmActivity(index)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Spare Parts Section */}
              <div className="w-full md:w-[60%]">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Repuestos</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSparePart}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Repuesto
                  </Button>
                </div>

                <Controller
                  name="spare_parts"
                  control={control}
                  render={() => (
                    <div className="space-y-3">
                      {sparePartsFields.map((sparePart, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 mb-3 relative"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Repuesto</Label>
                              <Controller
                                name={`spare_parts.${index}.spare_part_id`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    onValueChange={(value) => {
                                      const selectedPart = spareParts.find(
                                        (sp) => sp.id === value
                                      );
                                      field.onChange(value);
                                      updtSparePart(index, {
                                        spare_part_id: value,
                                        quantity: 1,
                                        unit_price: selectedPart?.price,
                                      });
                                    }}
                                    value={field.value}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar repuesto" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[10000] lg:max-h-[30vh] md:max-h-[40vh] max-h-[60vh]">
                                      {spareParts.map((part) => (
                                        <SelectItem
                                          key={part.id}
                                          value={part.id}
                                        >
                                          {part.name} - S/.
                                          {part.price.toFixed(2)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>

                            <div>
                              <Label>Cantidad</Label>
                              <Controller
                                name={`spare_parts.${index}.quantity`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    min="1"
                                    value={field.value}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                  />
                                )}
                              />
                            </div>

                            <div className="flex items-end absolute -top-1 -right-1">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => rmSparePart(index)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                          {errors.spare_parts?.[index]?.quantity && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.spare_parts[index].quantity.message}
                            </p>
                          )}
                          {errors.spare_parts?.[index]?.spare_part_id && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.spare_parts[index].spare_part_id.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                />
              </div>

              <div className="flex space-x-4">
                <Button type="submit" className="flex-1">
                  {editingItem
                    ? "Actualizar Mantenimiento"
                    : "Crear Mantenimiento"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
