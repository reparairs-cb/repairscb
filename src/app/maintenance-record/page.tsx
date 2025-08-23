"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataCard } from "@/components/DataCard";
import { Loader, Plus, Sheet } from "lucide-react";
import type {
  MaintenanceActivityFormData,
  MaintenanceRecordFormData,
} from "@/lib/schemas";
import type { MaintenanceRecordWithDetails } from "@/types/maintenance-record";
import type {
  EquipmentWithMaintenanceCounts,
  MultiEquipmentWithRecords,
  MultiEquipmentWithRecordsAndCounts,
} from "@/types/equipment";
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
import {
  createLocalDate,
  dateToLocalISOString,
  statusOptions,
  priorityOptions,
  getPriorityLabel,
  getStatusLabel,
  getMaintenanceCount,
  getDate,
} from "@/lib/utils";
import { FETCH_SIZE } from "@/lib/const";
import { PaginationComponent } from "@/components/Pagination";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  bgByCod,
  StatusPriority,
  StatusPriorityIcon,
} from "@/components/StatusPriority";
import { downloadMRExcel } from "@/lib/excel";
import { Filter, FilterOption } from "@/components/Filter";
import { Sorter, SorterOption } from "@/components/Sorter";
import { SelectModal } from "@/components/SelectModal";

const optionsFilter: FilterOption[] = [
  {
    id: "byStatus",
    label: "Estado",
    options: statusOptions.map((opt) => ({
      value: opt.value,
      label: opt.label,
    })),
  },
  {
    id: "byPriority",
    label: "Prioridad",
    options: priorityOptions.map((opt) => ({
      value: opt.value,
      label: opt.label,
    })),
  },
];

const optionsOrder: SorterOption[] = [
  {
    id: "by",
    label: "Ordenar por",
    options: [
      {
        label: "Fecha de creación",
        value: "created_at",
      },
      { label: "Prioridad", value: "priority" },
      { label: "Estado", value: "status" },
    ],
  },
  {
    id: "order",
    label: "Orden",
    options: [
      { label: "Ascendente", value: "asc" },
      { label: "Descendente", value: "desc" },
    ],
  },
];

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

const isMaintenanceTypeAllowedByActivities = (
  maintenanceTypeId: string,
  selectedActivities: MaintenanceActivityFormData[],
  activities: ActivityBase[]
): boolean => {
  if (selectedActivities.length === 0) return true;

  const maintenanceTypesAllowed = activities
    .filter((act) => selectedActivities.find((sa) => sa.id === act.id))
    .flatMap((act) => act.maintenance_types);

  return (
    maintenanceTypesAllowed.find((mt) => mt.id === maintenanceTypeId) !==
    undefined
  );
};

export default function MaintenanceRecordsPage() {
  const { data: session } = useSession();
  const [equipment, setEquipment] =
    useState<MultiEquipmentWithRecordsAndCounts>({
      total: 0,
      limit: 0,
      offset: 0,
      pages: 0,
      data: [],
    });
  const [maintenanceTypes, setMaintenanceTypes] = useState<
    MaintenanceTypeWithChildren[]
  >([]);
  const [activities, setActivities] = useState<ActivityBase[]>([]);
  const [spareParts, setSpareParts] = useState<SparePartBase[]>([]);
  const [mileageRecords, setMileageRecords] = useState<MileageRecordBase[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [selectedMileageRecord, setSelectedMileageRecord] =
    useState<MileageRecordBase | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsEquipment, setDetailsEquipment] =
    useState<EquipmentWithMaintenanceCounts | null>(null);
  const [editingItem, setEditingItem] =
    useState<MaintenanceRecordWithDetails | null>(null);
  const [loadingMaintenanceRecords, setLoadingMaintenanceRecords] =
    useState(false);
  const [noise, setNoise] = useState<NoiseType | null>({
    type: "loading",
    styleType: "page",
    message: "Cargando equipos...",
  });
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});
  const [selectedOrder, setSelectedOrder] = useState<{
    by: string;
    order: "asc" | "desc";
  }>({
    by: "priority",
    order: "desc",
  });
  const [pagItems, setPagItems] = useState<{
    start: number;
    end: number;
  }>({
    start: 0,
    end: FETCH_SIZE,
  });

  const [selectActOpen, setSelectActOpen] = useState(false);
  const [selectSpPartOpen, setSelectSpPartOpen] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
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
    //update: updtSparePart,
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

  useEffect(() => {
    console.log(activitiesFields);
  }, [activitiesFields]);

  // Fetch equipment with maintenance records
  useEffect(() => {
    const fetchEquipment = async () => {
      setNoise({
        type: "loading",
        styleType: "page",
        message: "Cargando equipos...",
      });

      try {
        // Fetch equipments with maintenance records
        const res = await fetch("/api/equipments/with-records", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: session?.user?.id,
            offset: 0,
            limit: 0,
            maintenanceLimit: FETCH_SIZE,
            maintenanceOffset: 0,
            sortBy: {
              by: "priority",
              order: "desc",
            },
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          console.error("Error fetching equipment:", err);
          throw new Error("Failed to fetch equipment");
        }

        const data = (await res.json()).data as MultiEquipmentWithRecords;

        console.log("Fetched equipment:", data.data);
        setEquipment({
          ...data,
          data: data.data.map((item) => ({
            ...item,
            created_at: new Date(item.created_at),
            updated_at: item.updated_at ? new Date(item.updated_at) : undefined,
            maintenance_records: item.maintenance_records
              ? {
                  total: item.maintenance_records.total,
                  limit: item.maintenance_records.limit,
                  offset: item.maintenance_records.offset,
                  pages: item.maintenance_records.pages,
                  data: item.maintenance_records.data
                    .map((record) => ({
                      ...record,
                      start_datetime: new Date(record.start_datetime),
                      end_datetime: record.end_datetime
                        ? new Date(record.end_datetime)
                        : undefined,
                      created_at: new Date(record.created_at),
                      updated_at: record.updated_at
                        ? new Date(record.updated_at)
                        : undefined,
                    }))
                    .sort(
                      (a, b) =>
                        b.start_datetime.getTime() - a.start_datetime.getTime()
                    ),
                }
              : undefined,
            maintenance_count: getMaintenanceCount(
              item.maintenance_records?.data || []
            ),
          })),
        });
        setNoise(null);
      } catch (error) {
        console.error("Error fetching equipment:", error);
        setNoise({
          type: "error",
          styleType: "page",
          message: "Error al cargar los equipos.",
        });
      }
    };
    fetchEquipment();
  }, []);

  // Fetch additional data for form
  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        const [maintenanceTypesRes, activitiesRes, sparePartsRes, mileageRes] =
          await Promise.all([
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
          !maintenanceTypesRes.ok ||
          !activitiesRes.ok ||
          !sparePartsRes.ok ||
          !mileageRes.ok
        ) {
          throw new Error("Failed to fetch additional data");
        }

        const [
          maintenanceTypesData,
          activitiesData,
          sparePartsData,
          mileageData,
        ] = await Promise.all([
          maintenanceTypesRes.json(),
          activitiesRes.json(),
          sparePartsRes.json(),
          mileageRes.json(),
        ]);

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
      } catch (error) {
        console.error("Error fetching additional data:", error);
      }
    };

    fetchAdditionalData();
  }, []);

  // Función para cargar más datos de mantenimiento cuando cambie de página
  const handlePageChange = async (newOffset: number) => {
    const selectedMaintenance = equipment.data.find(
      (item) => item.id === detailsEquipment?.id
    )?.maintenance_records;

    if (!selectedMaintenance) return;

    // Verificar si ya tenemos estos datos
    const totalLoadedRecords = selectedMaintenance.data.length;
    const recordsNeeded =
      newOffset + selectedMaintenance.limit > selectedMaintenance.total
        ? selectedMaintenance.total
        : newOffset + selectedMaintenance.limit;

    if (totalLoadedRecords < recordsNeeded) {
      setLoadingMaintenanceRecords(true);
      setNoise(null);

      try {
        const res = await fetch(`/api/maintenance-records/by-equipment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            equipment_id: detailsEquipment?.id,
            limit: selectedMaintenance.limit,
            offset: newOffset,
          }),
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const newData = (await res.json()).data;

        newData.data = newData.data.map(
          (record: MaintenanceRecordWithDetails) => ({
            ...record,
            start_datetime: new Date(record.start_datetime),
            end_datetime: record.end_datetime
              ? new Date(record.end_datetime)
              : undefined,
            created_at: new Date(record.created_at),
            updated_at: record.updated_at
              ? new Date(record.updated_at)
              : undefined,
            maintenance_type: getMaintenanceTypesById(
              record.maintenance_type_id,
              maintenanceTypes
            ),
          })
        );

        console.log("New maintenance records:", newData);

        if (newData.data.length > 0) {
          let newEquipment = equipment.data.find(
            (item) => item.id === detailsEquipment?.id
          );

          if (
            newEquipment === undefined ||
            newEquipment.maintenance_records === undefined
          )
            return;

          newEquipment = {
            ...newEquipment,
            maintenance_records: {
              ...newData,
              data: newEquipment.maintenance_records.data
                .concat(
                  newData.data.filter(
                    (newRecord: MaintenanceRecordWithDetails) =>
                      !newEquipment?.maintenance_records?.data.some(
                        (existingRecord) => existingRecord.id === newRecord.id
                      )
                  )
                )
                .sort(
                  (a, b) =>
                    b.start_datetime.getTime() - a.start_datetime.getTime()
                ),
            },
          };

          setEquipment((prevEquipment) => ({
            ...prevEquipment,
            data: prevEquipment.data.map((eq) => {
              if (eq.id === detailsEquipment?.id) {
                return newEquipment;
              }
              return eq;
            }),
          }));

          setDetailsEquipment(newEquipment);
        }
      } catch (err) {
        setNoise({
          type: "error",
          styleType: "modal",
          message: "Error al cargar los registros de mantenimiento.",
        });
        console.error("Error fetching maintenance records:", err);
      } finally {
        setLoadingMaintenanceRecords(false);
      }
    }

    setPagItems({
      start: newOffset,
      end: Math.min(
        newOffset + selectedMaintenance.limit,
        selectedMaintenance.total
      ),
    });
  };

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
        start_datetime: data.start_datetime.toISOString(),
        end_datetime: data.end_datetime
          ? data.end_datetime.toISOString()
          : undefined,
        mileage_record: selectedMileageRecord,
        activities: data.activities.map((act) => ({
          activity_id: act.activity_id,
          status: act.status,
          observations: act.observations || "",
          priority: act.priority || "no",
        })),
        spare_parts: data.spare_parts.map((sp) => ({
          spare_part_id: sp.spare_part_id,
          quantity: sp.quantity,
          unit_price: sp.unit_price,
        })),
      };

      console.log("Creating maintenance record:", maintenancePayload);

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

      // Update equipment state with new maintenance record
      setEquipment((prev) => {
        return {
          ...prev,
          data: prev.data.map((item) => {
            if (item.id === data.equipment_id) {
              const newMaintenanceRecord: MaintenanceRecordWithDetails = {
                ...newRecord,
                start_datetime: new Date(data.start_datetime),
                end_datetime: data.end_datetime
                  ? new Date(data.end_datetime)
                  : undefined,
                created_at: new Date(),
                equipment: item,
                maintenance_type: getMaintenanceTypesById(
                  data.maintenance_type_id,
                  maintenanceTypes
                ),
              };

              return {
                ...item,
                maintenance_records: item.maintenance_records
                  ? {
                      ...item.maintenance_records,
                      data: [
                        newMaintenanceRecord,
                        ...item.maintenance_records.data,
                      ].sort(
                        (a, b) =>
                          b.start_datetime.getTime() -
                          a.start_datetime.getTime()
                      ),
                      total: item.maintenance_records.total + 1,
                    }
                  : {
                      total: 1,
                      limit: FETCH_SIZE,
                      offset: 0,
                      pages: 1,
                      data: [newMaintenanceRecord],
                    },
                maintenance_count: getMaintenanceCount(
                  item.maintenance_records?.data
                    ? item.maintenance_records.data.concat(newMaintenanceRecord)
                    : [newMaintenanceRecord]
                ),
              };
            }
            return item;
          }),
        };
      });

      setNoise(null);
      toastVariables.success("Registro de mantenimiento creado exitosamente.");
      reset();
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
        setNoise(null);
        return;
      }

      if (data.activities.some((act) => !act.activity_id)) {
        toastVariables.error(
          "Necesita seleccionar las actividades para el mantenimiento."
        );
        setNoise(null);
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
          priority: act.priority || "no",
          observations: act.observations || "",
        })),
        original_spare_parts: editingItem.spare_parts || [],
        original_activities: editingItem.activities || [],
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

      const updatedRecord = (await res.json())
        .data as MaintenanceRecordWithDetails;

      if (!updatedRecord) {
        throw new Error("No se pudo actualizar el registro de mantenimiento");
      }

      console.log("Updated record:", updatedRecord);

      const updatedMaintenance = {
        ...updatedRecord,
        start_datetime: new Date(data.start_datetime),
        end_datetime: data.end_datetime
          ? new Date(data.end_datetime)
          : undefined,

        maintenance_type_id: data.maintenance_type_id,
        observations: data.observations || "",
        maintenance_type: getMaintenanceTypesById(
          data.maintenance_type_id,
          maintenanceTypes
        ),
        mileage_info: {
          kilometers: data.mileage,
          record_date: updatedRecord.mileage_info?.record_date || new Date(),
          id: updatedRecord.mileage_info?.id || crypto.randomUUID(),
        },
        spare_parts: updatedRecord.spare_parts
          ? updatedRecord.spare_parts.map((sp) => ({
              id: sp.id || crypto.randomUUID(),
              spare_part_id: sp.spare_part_id,
              quantity: sp.quantity,
              unit_price: sp.unit_price,
              spare_part: spareParts.find(
                (spare) => spare.id === sp.spare_part_id
              ) as SparePartBase,
              maintenance_record_id: updatedRecord.id,
              created_at: new Date(sp.created_at) || new Date(),
            }))
          : [],
        activities: updatedRecord.activities
          ? updatedRecord.activities.map((act) => ({
              id: act.id || crypto.randomUUID(),
              activity_id: act.activity_id,
              status: act.status,
              priority: act.priority || "no",
              observations: act.observations || "",
              activity: activities.find(
                (activity) => activity.id === act.activity_id
              ) as ActivityBase,
              maintenance_record_id: updatedRecord.id,
              created_at: new Date(act.created_at) || new Date(),
            }))
          : [],
        updated_at: new Date(),
      };

      // Update equipment state with updated maintenance record
      setEquipment((prev) => ({
        ...prev,
        data: prev.data.map((item) => {
          if (
            item.maintenance_records?.data.some(
              (record) => record.id === editingItem.id
            )
          ) {
            console.log("Updating item:", item);
            return {
              ...item,
              maintenance_count: getMaintenanceCount(
                item.maintenance_records?.data.map((record) =>
                  record.id === editingItem.id ? updatedMaintenance : record
                ) || []
              ),
              maintenance_records: {
                ...item.maintenance_records,
                data: item.maintenance_records.data
                  .map((record) =>
                    record.id === editingItem.id ? updatedMaintenance : record
                  )
                  .sort(
                    (a, b) =>
                      b.start_datetime.getTime() - a.start_datetime.getTime()
                  ),
              },
            };
          }
          return item;
        }),
      }));

      setDetailsEquipment((prev) => {
        if (!prev || !prev.maintenance_records?.total) return null;

        return {
          ...prev,
          maintenance_records: {
            ...prev.maintenance_records,
            data: prev.maintenance_records?.data.map((record) =>
              record.id === editingItem.id ? updatedMaintenance : record
            ),
          },
          maintenance_count: getMaintenanceCount(
            prev.maintenance_records?.data.map((record) =>
              record.id === editingItem.id ? updatedMaintenance : record
            ) || []
          ),
        };
      });

      setNoise(null);
      toastVariables.success(
        "Registro de mantenimiento actualizado exitosamente."
      );
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      setNoise(null);
      console.error("Error updating maintenance record:", error);
      toastVariables.error("Error al actualizar el registro de mantenimiento.");
    }
  };

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

      // Update equipment state by removing the deleted maintenance record
      setEquipment((prev) => ({
        ...prev,
        data: prev.data.map((item) => {
          if (
            item.maintenance_records?.data.some((record) => record.id === id)
          ) {
            return {
              ...item,
              maintenance_records: {
                ...item.maintenance_records,
                data: item.maintenance_records.data.filter(
                  (record) => record.id !== id
                ),
                total: item.maintenance_records.total - 1,
              },
              maintenance_count: getMaintenanceCount(
                item.maintenance_records.data.filter(
                  (record) => record.id !== id
                )
              ),
            };
          }
          return item;
        }),
      }));

      setDetailsEquipment((prev) => {
        if (!prev || !prev.maintenance_records?.total) return null;
        return {
          ...prev,
          maintenance_records: {
            ...prev.maintenance_records,
            data: prev.maintenance_records.data.filter(
              (record) => record.id !== id
            ),
          },
          maintenance_count: getMaintenanceCount(
            prev.maintenance_records.data.filter((record) => record.id !== id)
          ),
        };
      });

      toastVariables.success(
        "Registro de mantenimiento eliminado exitosamente."
      );
    } catch (error) {
      console.error("Error deleting maintenance record:", error);
      toastVariables.error("Error al eliminar el registro de mantenimiento.");
    }
  };

  const handleFilterSelect = async (
    selectedFilters: Record<string, string[]>
  ) => {
    console.log("Selected filters:", selectedFilters);
    const resEq = await fetch("/api/equipments/with-records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        limit: 0,
        maintenanceLimit: FETCH_SIZE,
        maintenanceOffset: 0,
        ...selectedFilters,
        sortBy: selectedOrder,
      }),
    });

    if (!resEq.ok) {
      const err = resEq.json();
      console.error("Error fetching equipment:", err);
      toastVariables.error("Error al filtrar equipos.");
      return;
    }

    const data = (await resEq.json())
      .data as MultiEquipmentWithRecordsAndCounts;

    setSelectedFilters(selectedFilters);
    setEquipment({
      ...data,
      data: data.data.map((item) => ({
        ...item,
        created_at: new Date(item.created_at),
        updated_at: item.updated_at ? new Date(item.updated_at) : undefined,
        maintenance_records: item.maintenance_records
          ? {
              total: item.maintenance_records.total,
              limit: item.maintenance_records.limit,
              offset: item.maintenance_records.offset,
              pages: item.maintenance_records.pages,
              data: item.maintenance_records.data
                .map((record) => ({
                  ...record,
                  start_datetime: new Date(record.start_datetime),
                  end_datetime: record.end_datetime
                    ? new Date(record.end_datetime)
                    : undefined,
                  created_at: new Date(record.created_at),
                  updated_at: record.updated_at
                    ? new Date(record.updated_at)
                    : undefined,
                }))
                .sort(
                  (a, b) =>
                    b.start_datetime.getTime() - a.start_datetime.getTime()
                ),
            }
          : undefined,
        maintenance_count: getMaintenanceCount(
          item.maintenance_records?.data || []
        ),
      })),
    });
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setSelectedEquipmentId("");
    reset();
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setSelectedEquipmentId("");
    reset();
  };

  const handleOpenSelectActivity = () => {
    setSelectActOpen(true);
  };

  const handleOpenSelectSpPart = () => {
    setSelectSpPartOpen(true);
  };

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
        id: sp.id,
        spare_part_id: sp.spare_part_id,
        quantity: sp.quantity,
        unit_price: sp.unit_price,
      })) || []
    );
    setValue(
      "activities",
      item.activities?.map((act) => ({
        id: act.id,
        activity_id: act.activity_id,
        status: act.status,
        observations: act.observations || "",
        priority: act.priority || "no",
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
    console.log("mileage record for editing:", mileageRecords);
    setIsModalOpen(true);
  };

  const onDetailModal = (item: EquipmentWithMaintenanceCounts) => {
    setDetailsEquipment(item);
    setIsDetailsModalOpen(true);
  };

  const addSparePart = (id: string) => {
    appSparePart({
      spare_part_id: id,
      quantity: 1,
      unit_price: undefined,
    });
  };

  const addActivity = (id: string) => {
    appActivity({
      activity_id: id,
      status: "pending",
      observations: "",
      priority: "no",
    });
  };

  const handleExportExcel = async () => {
    setLoadingExcel(true);
    try {
      await downloadMRExcel();
      toastVariables.success("Datos exportados a Excel exitosamente.");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toastVariables.error("Error al exportar a Excel.");
    } finally {
      setLoadingExcel(false);
    }
  };

  const handleSelectOrder = async (selectedOption: Record<string, string>) => {
    console.log("Selected order:", selectedOption);
    const resEq = await fetch("/api/equipments/with-records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        limit: 0,
        maintenanceLimit: FETCH_SIZE,
        maintenanceOffset: 0,
        ...selectedFilters,
        sortBy: selectedOption,
      }),
    });

    if (!resEq.ok) {
      const err = resEq.json();
      console.error("Error fetching equipment:", err);
      toastVariables.error("Error al ordenar equipos.");
      return;
    }

    const data = (await resEq.json())
      .data as MultiEquipmentWithRecordsAndCounts;

    setSelectedOrder({
      by: selectedOption.by,
      order: selectedOption.order as "asc" | "desc",
    });
    setEquipment({
      ...data,
      data: data.data.map((item) => ({
        ...item,
        created_at: new Date(item.created_at),
        updated_at: item.updated_at ? new Date(item.updated_at) : undefined,
        maintenance_records: item.maintenance_records
          ? {
              total: item.maintenance_records.total,
              limit: item.maintenance_records.limit,
              offset: item.maintenance_records.offset,
              pages: item.maintenance_records.pages,
              data: item.maintenance_records.data
                .map((record) => ({
                  ...record,
                  start_datetime: new Date(record.start_datetime),
                  end_datetime: record.end_datetime
                    ? new Date(record.end_datetime)
                    : undefined,
                  created_at: new Date(record.created_at),
                  updated_at: record.updated_at
                    ? new Date(record.updated_at)
                    : undefined,
                }))
                .sort(
                  (a, b) =>
                    b.start_datetime.getTime() - a.start_datetime.getTime()
                ),
            }
          : undefined,
        maintenance_count: getMaintenanceCount(
          item.maintenance_records?.data || []
        ),
      })),
    });
  };

  const onSubmit = async (data: MaintenanceRecordFormData) => {
    if (editingItem) {
      await handleUpdate(data);
    } else {
      await handleCreate(data);
    }
  };

  if (noise && noise.styleType === "page") {
    return <Noise noise={noise} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {noise && <Noise noise={noise} />}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">
          Gestión de Mantenimiento por Equipos
        </h1>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Mantenimiento
        </Button>
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-start md:justify-between gap-2  mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-start md:justify-between gap-2">
          <Filter
            options={optionsFilter}
            selectedFilters={selectedFilters}
            onFilterSelect={handleFilterSelect}
          />
          <Sorter
            options={optionsOrder}
            selectedOption={selectedOrder}
            onSelect={handleSelectOrder}
          />
        </div>
        <Button onClick={handleExportExcel} variant="outline" className="ml-4">
          {loadingExcel ? (
            <Loader className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sheet className="h-4 w-4 mr-2" />
          )}
          Exportar a Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {equipment.data.map((item) => {
          const badges: {
            label: string;
            icon?: JSX.Element;
            variant?: "default" | "secondary" | "destructive" | "outline";
            className?: string;
          }[] = [
            { label: item.code, variant: "secondary" },
            {
              label: `${item.maintenance_count.total}`,
              icon: <StatusPriorityIcon cod="total" />,
            },
          ];

          for (const status of Object.keys(item.maintenance_count.status)) {
            const count =
              item.maintenance_count.status[
                status as keyof typeof item.maintenance_count.status
              ];
            if (count > 0) {
              badges.push({
                label: `${count}`,
                className: bgByCod[status] || "bg-gray-500",
                icon: <StatusPriorityIcon cod={status} />,
              });
            }
          }

          for (const priority of Object.keys(item.maintenance_count.priority)) {
            const count =
              item.maintenance_count.priority[
                priority as keyof typeof item.maintenance_count.priority
              ];
            if (count > 0) {
              badges.push({
                label: `${count}`,
                className: bgByCod[priority] || "bg-gray-500",
                icon: <StatusPriorityIcon cod={priority} />,
              });
            }
          }

          return (
            <DataCard
              key={item.id}
              title={item.license_plate}
              subtitle={item.type}
              badges={badges}
              fields={[]}
              onDetails={() => {
                onDetailModal(item);
              }}
            />
          );
        })}
      </div>

      {equipment.data.length === 0 && !noise && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No hay equipos con registros de mantenimiento
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Haz clic en &quot;Nuevo mantenimiento&quot; para agregar tu primer
            registro
          </p>
        </div>
      )}

      {/* Modal para crear/editar mantenimiento */}
      {isModalOpen && (
        <Modal customZIndex={2000} onClose={handleCancel}>
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
                          {equipment.data.map((eq) => (
                            <SelectItem key={eq.id} value={eq.id}>
                              {eq.type} - {eq.code} ({eq.license_plate})
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
                        onChange={(value) => {
                          if (
                            isMaintenanceTypeAllowedByActivities(
                              value,
                              watch("activities"),
                              activities
                            )
                          ) {
                            field.onChange(value);
                          } else {
                            toastVariables.error(
                              "Acabas de seleccionar un tipo de mantenimiento que no es compatible con las actividades actuales del mantenimiento."
                            );
                          }
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
                        type="text"
                        placeholder="Ingresa el kilometraje..."
                        value={field.value >= 0 ? field.value : ""}
                        onChange={(e) => {
                          try {
                            field.onChange(parseFloat(e.target.value));
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          } catch (e) {}
                        }}
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
                    onClick={handleOpenSelectActivity}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Seleccionar Actividades
                  </Button>
                </div>

                <SelectModal
                  isOpen={selectActOpen}
                  onClose={() => setSelectActOpen(false)}
                  onSelect={addActivity}
                  onUnselect={(id, idx) => {
                    rmActivity(idx);
                  }}
                  data={activities
                    .filter((act) =>
                      act.maintenance_types.find(
                        (mt) => mt.id === watch("maintenance_type_id")
                      )
                    )
                    .map((act) => ({
                      id: act.id,
                      title: act.name,
                      description: act.description,
                      badges: act.maintenance_types.map((mt) => ({
                        label: mt.type,
                      })),
                    }))}
                  selected={activitiesFields.map((act, index) => ({
                    id: act.activity_id,
                    original_index: index,
                  }))}
                />

                <div className="space-y-3">
                  {activitiesFields.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="border rounded-lg p-4 mb-3 relative"
                    >
                      <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label>
                              Actividad
                              {` ${
                                activities.find(
                                  (act) => act.id === activity.activity_id
                                )?.name
                              }`}
                            </Label>
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
                          <Label className="flex-1">Prioridad</Label>
                          <Controller
                            name={`activities.${index}.priority`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar prioridad" />
                                </SelectTrigger>
                                <SelectContent className="z-[10000] lg:max-h-[30vh] md:max-h-[40vh] max-h-[60vh]">
                                  {priorityOptions.map((option) => (
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
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            )}
                          />
                        </div>
                        {errors.activities?.[index]?.activity_id && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.activities[index].activity_id?.message}
                          </p>
                        )}
                        {errors.activities?.[index]?.status && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.activities[index].status?.message}
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
              </div>

              {/* Spare Parts Section */}
              <div className="w-full md:w-[60%]">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Repuestos</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenSelectSpPart}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Seleccionar Repuesto
                  </Button>
                </div>

                <SelectModal
                  isOpen={selectSpPartOpen}
                  onClose={() => setSelectSpPartOpen(false)}
                  onSelect={addSparePart}
                  onUnselect={(id, idx) => {
                    rmSparePart(idx);
                  }}
                  data={spareParts.map((sp) => ({
                    id: sp.id,
                    title: sp.name,
                    description: sp.description,
                    badges: [
                      { label: `S/. ${sp.price}` },
                      { label: sp.factory_code },
                    ],
                  }))}
                  selected={sparePartsFields.map((sp, index) => ({
                    id: sp.spare_part_id,
                    original_index: index,
                  }))}
                />

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
                              <Label>
                                Repuesto
                                {` ${
                                  spareParts.find(
                                    (sp) => sp.id === sparePart.spare_part_id
                                  )?.name
                                }`}
                              </Label>
                              {/* <Controller
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
                              /> */}
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
                              {errors.spare_parts[index].quantity?.message}
                            </p>
                          )}
                          {errors.spare_parts?.[index]?.spare_part_id && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.spare_parts[index].spare_part_id?.message}
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

      {/* Modal para ver detalles de mantenimientos del equipo */}
      {isDetailsModalOpen && detailsEquipment && (
        <Modal customZIndex={1000} onClose={() => setIsDetailsModalOpen(false)}>
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              Mantenimientos - {detailsEquipment.type} (
              {detailsEquipment.license_plate})
            </h2>
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {detailsEquipment.maintenance_count.total}
                  </p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {detailsEquipment.maintenance_count.status.pending}
                  </p>
                  <p className="text-sm text-gray-600">Pendientes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {detailsEquipment.maintenance_count.status.in_progress}
                  </p>
                  <p className="text-sm text-gray-600">En Progreso</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {detailsEquipment.maintenance_count.status.completed}
                  </p>
                  <p className="text-sm text-gray-600">Completados</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {detailsEquipment.maintenance_count.priority.immediate}
                  </p>
                  <p className="text-sm text-gray-600">Pr. Inmediata</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {detailsEquipment.maintenance_count.priority.low}
                  </p>
                  <p className="text-sm text-gray-600">Pr. Baja</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {detailsEquipment.maintenance_count.priority.medium}
                  </p>
                  <p className="text-sm text-gray-600">Pr. Media</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {detailsEquipment.maintenance_count.priority.high}
                  </p>
                  <p className="text-sm text-gray-600">Pr. Alta</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-4">
              Lista de Mantenimientos
            </h3>

            {loadingMaintenanceRecords && (
              <div className="text-center py-4">
                <Noise
                  noise={{
                    type: "loading",
                    styleType: "modal",
                    message: "Cargando más registros...",
                  }}
                />
              </div>
            )}

            <div className="space-y-4">
              {detailsEquipment.maintenance_records?.data
                .slice(pagItems.start, pagItems.end)
                .map((maintenance) => {
                  const pendingAct =
                    maintenance.activities?.filter(
                      (activity) => activity.status === "pending"
                    ).length || 0;
                  const inProgressAct =
                    maintenance.activities?.filter(
                      (activity) => activity.status === "in_progress"
                    ).length || 0;
                  const completedAct =
                    maintenance.activities?.filter(
                      (activity) => activity.status === "completed"
                    ).length || 0;
                  const noPriorityAct =
                    maintenance.activities?.filter(
                      (activity) => activity.priority === "no"
                    ).length || 0;
                  const lowAct =
                    maintenance.activities?.filter(
                      (activity) => activity.priority === "low"
                    ).length || 0;
                  const mediumAct =
                    maintenance.activities?.filter(
                      (activity) => activity.priority === "medium"
                    ).length || 0;
                  const highAct =
                    maintenance.activities?.filter(
                      (activity) => activity.priority === "high"
                    ).length || 0;
                  const immediateAct =
                    maintenance.activities?.filter(
                      (activity) => activity.priority === "immediate"
                    ).length || 0;
                  const totalAct = maintenance.activities?.length || 0;

                  return (
                    <div
                      key={maintenance.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {maintenance.maintenance_type?.type ||
                              "Tipo no especificado"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {getDate(maintenance.start_datetime)}
                            {maintenance.end_datetime && (
                              <span>
                                {" "}
                                - {getDate(maintenance.end_datetime)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(maintenance)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(maintenance.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <p className="text-sm">
                            <strong>Kilometraje:</strong>{" "}
                            {maintenance.mileage_info?.kilometers === 0
                              ? "0"
                              : maintenance.mileage_info?.kilometers ||
                                "N/A"}{" "}
                            km
                          </p>
                          <p className="text-sm">
                            <strong>Observaciones:</strong>{" "}
                            {maintenance.observations || "Sin observaciones"}
                          </p>
                        </div>
                        <div>
                          {maintenance.activities &&
                            maintenance.activities.length > 0 && (
                              <Accordion type="single" collapsible>
                                <AccordionItem value="item-1">
                                  <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center justify-between flex-wrap">
                                      <span className="font-medium">
                                        Actividades
                                      </span>
                                      <StatusPriority
                                        count={totalAct}
                                        cod="total"
                                      />
                                      {completedAct > 0 && (
                                        <StatusPriority
                                          count={completedAct}
                                          cod="completed"
                                        />
                                      )}
                                      {inProgressAct > 0 && (
                                        <StatusPriority
                                          count={inProgressAct}
                                          cod="in_progress"
                                        />
                                      )}
                                      {pendingAct > 0 && (
                                        <StatusPriority
                                          count={pendingAct}
                                          cod="pending"
                                        />
                                      )}
                                      {immediateAct > 0 && (
                                        <StatusPriority
                                          count={immediateAct}
                                          cod="immediate"
                                        />
                                      )}
                                      {highAct > 0 && (
                                        <StatusPriority
                                          count={highAct}
                                          cod="high"
                                        />
                                      )}
                                      {mediumAct > 0 && (
                                        <StatusPriority
                                          count={mediumAct}
                                          cod="medium"
                                        />
                                      )}
                                      {lowAct > 0 && (
                                        <StatusPriority
                                          count={lowAct}
                                          cod="low"
                                        />
                                      )}
                                      {noPriorityAct > 0 && (
                                        <StatusPriority
                                          count={noPriorityAct}
                                          cod="no"
                                        />
                                      )}
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-1">
                                      {maintenance.activities.map(
                                        (activity, idx) => (
                                          <div
                                            key={idx}
                                            className="text-xs bg-gray-100 rounded px-2 py-1"
                                          >
                                            <span className="font-medium">
                                              {activity.activity?.name}
                                            </span>
                                            <span className="text-gray-600 ml-2">
                                              ({getStatusLabel(activity.status)}{" "}
                                              -{" "}
                                              {getPriorityLabel(
                                                activity.priority || "no"
                                              )}
                                              )
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                          {maintenance.spare_parts &&
                            maintenance.spare_parts.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium mb-1">
                                  Repuestos:
                                </p>
                                <div className="space-y-1">
                                  {maintenance.spare_parts.map(
                                    (sparePart, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs bg-blue-50 rounded px-2 py-1"
                                      >
                                        {sparePart.spare_part?.name} (Cant:{" "}
                                        {sparePart.quantity})
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {detailsEquipment.maintenance_records && (
              <div className="mt-6">
                <PaginationComponent
                  paginationData={{
                    ...detailsEquipment.maintenance_records,
                    start: pagItems.start,
                    end: pagItems.end,
                  }}
                  onPageChange={handlePageChange}
                  loading={loadingMaintenanceRecords}
                />
              </div>
            )}

            {(!detailsEquipment.maintenance_records ||
              detailsEquipment.maintenance_records.data.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No hay registros de mantenimiento para este equipo
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
