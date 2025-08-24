"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import type { MaintenanceTypeFormData } from "@/lib/schemas";
import type {
  MaintenanceTypeBase,
  MaintenanceTypeWithChildren,
} from "@/types/maintenance-type";
import { maintenanceTypeSchema } from "@/lib/schemas";
import { Modal } from "@/components/Modal";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NoiseType } from "@/types/noise";
import { Noise } from "@/components/Noise";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { toastVariables } from "@/components/ToastVariables";

// Hierarchical tree component for displaying maintenance types
interface TreeNodeProps {
  node: MaintenanceTypeWithChildren;
  level: number;
  onEdit: (item: MaintenanceTypeBase) => void;
  onDelete: (id: string) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  onEdit,
  onDelete,
  expandedNodes,
  onToggleExpand,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const indent = level * 20;

  return (
    <div className="border rounded-lg m-1 sm:m-2">
      <div
        className="p-2 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 cursor-pointer gap-2"
        style={{ paddingLeft: `${8 + indent}px` }}
        onClick={() => hasChildren && onToggleExpand(node.id)}
      >
        <div className="flex items-center flex-1 w-full">
          {hasChildren && (
            <div className="mr-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-6" />}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-sm sm:text-base truncate">
                {node.type}
              </h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Nivel {node.level}
              </span>
              {node.path && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded truncate max-w-[120px] sm:max-w-xs">
                  {node.path}
                </span>
              )}
            </div>
            {hasChildren && (
              <p className="text-xs text-gray-400 mt-1">
                {node.children!.length} subtipo
                {node.children!.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        <div
          className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onEdit(node);
            }}
            className="w-full sm:w-auto"
          >
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDelete(node.id);
            }}
            className="w-full sm:w-auto"
          >
            Eliminar
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="border-t bg-gray-50">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Recursive component for parent selection dropdown
interface ParentOptionProps {
  node: MaintenanceTypeWithChildren;
  level: number;
  onSelect: (value: string) => void;
  selectedValue?: string;
}

const ParentOption: React.FC<ParentOptionProps> = ({
  node,
  level,
  onSelect,
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
        <ParentOption
          key={child.id}
          node={child}
          level={level + 1}
          onSelect={onSelect}
          selectedValue={selectedValue}
        />
      ))}
    </>
  );
};

export default function MaintenanceTypePage() {
  const { data: session } = useSession();
  const [maintenanceTypes, setMaintenanceTypes] = useState<
    MaintenanceTypeWithChildren[]
  >([]);
  const [flatMaintenanceTypes, setFlatMaintenanceTypes] = useState<
    MaintenanceTypeBase[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaintenanceTypeBase | null>(
    null
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [noise, setNoise] = useState<NoiseType | null>({
    type: "loading",
    styleType: "page",
    message: "Loading maintenance types...",
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MaintenanceTypeFormData>({
    resolver: zodResolver(maintenanceTypeSchema),
    defaultValues: {
      type: "",
      parent_id: "",
    },
  });

  // Build hierarchical tree structure
  const buildTree = (
    items: MaintenanceTypeBase[]
  ): MaintenanceTypeWithChildren[] => {
    const itemMap = new Map<string, MaintenanceTypeWithChildren>();
    const rootItems: MaintenanceTypeWithChildren[] = [];

    // Create map of all items
    items.forEach((item) => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Build parent-child relationships
    items.forEach((item) => {
      const node = itemMap.get(item.id)!;

      if (item.parent_id && itemMap.has(item.parent_id)) {
        console.log(`Adding child ${node.type} to parent ${item.parent_id}`);
        const parent = itemMap.get(item.parent_id)!;
        parent.children!.push(node);
      } else {
        rootItems.push(node);
      }
    });

    return rootItems;
  };

  useEffect(() => {
    // Fetch maintenance types from API
    const fetchMaintenanceTypes = async () => {
      setNoise({
        type: "loading",
        styleType: "page",
        message: "Cargando tipos de mantenimiento...",
      });

      try {
        const res = await fetch("/api/maintenance-type?limit=0");

        if (!res.ok) {
          throw new Error("Failed to fetch maintenance types");
        }

        const data = (await res.json()).data as MaintenanceTypeWithChildren[];
        console.log("Fetched maintenance types:", data);

        // Flatten the hierarchical data and process dates
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

            // Process children recursively
            if (item.children && item.children.length > 0) {
              item.children.forEach((child) => processItem(child));
            }

            return processed;
          };

          items.forEach((item) => processItem(item));
          return result;
        };

        const flatData = flattenMaintenanceTypes(data);

        // Process the hierarchical data for display (convert dates)
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

        setFlatMaintenanceTypes(flatData);
        setMaintenanceTypes(processHierarchicalData(data));
        setNoise(null);
      } catch (error) {
        console.error("Error fetching maintenance types:", error);
        setNoise({
          type: "error",
          styleType: "page",
          message: "Error al cargar los tipos de mantenimiento.",
        });
      }
    };

    fetchMaintenanceTypes();
  }, []);

  if (!session || !session.user?.id) {
    return null;
  }

  const handleCreate = async (data: MaintenanceTypeFormData) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Creando tipo de mantenimiento...",
    });

    try {
      const res = await fetch("/api/maintenance-type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          parent_id: data.parent_id === "none" ? null : data.parent_id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create maintenance type");
      }

      const newMaintenanceTypeData = (await res.json()).data as {
        id: string;
        created_at: Date;
        level: number;
        path: string | null;
      };

      const newMaintenanceType: MaintenanceTypeBase = {
        ...data,
        id: newMaintenanceTypeData.id,
        created_at: new Date(newMaintenanceTypeData.created_at),
        user_id: session.user.id,
        parent_id: data.parent_id || undefined,
        level: newMaintenanceTypeData.level,
        path: newMaintenanceTypeData.path || "",
      };

      const updatedFlat = [...flatMaintenanceTypes, newMaintenanceType];
      setFlatMaintenanceTypes(updatedFlat);
      setMaintenanceTypes(buildTree(updatedFlat));

      setNoise(null);
      toastVariables.success("Tipo de mantenimiento creado exitosamente.");
    } catch (error) {
      console.error("Error creating maintenance type:", error);
      toastVariables.error("Error al crear el tipo de mantenimiento.");
      setNoise(null);
    }
  };

  const handleUpdate = async (data: MaintenanceTypeFormData) => {
    if (!editingItem) return;

    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Actualizando tipo de mantenimiento...",
    });

    try {
      const res = await fetch(`/api/maintenance-type`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingItem.id,
          type: data.type,
          level: editingItem.level,
          path: editingItem.path,
          parent_id: data.parent_id === "none" ? null : data.parent_id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update maintenance type");
      }

      const updatedFlat = flatMaintenanceTypes.map((item) =>
        item.id === editingItem.id
          ? { ...item, ...data, parent_id: data.parent_id || undefined }
          : item
      );

      setFlatMaintenanceTypes(updatedFlat);
      setMaintenanceTypes(buildTree(updatedFlat));
      setEditingItem(null);
      setNoise(null);
      toastVariables.success("Tipo de mantenimiento actualizado exitosamente.");
    } catch (error) {
      console.error("Error updating maintenance type:", error);
      toastVariables.error("Error al actualizar el tipo de mantenimiento.");
      setNoise(null);
    }
  };

  const handleDelete = async (id: string) => {
    // Check if this item has children
    const hasChildren = flatMaintenanceTypes.some(
      (item) => item.parent_id === id
    );
    if (hasChildren) {
      toastVariables.error("No se puede eliminar un tipo que tiene subtipos.");
      return;
    }

    try {
      const res = await fetch(`/api/maintenance-type`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete maintenance type");
      }

      const updatedFlat = flatMaintenanceTypes.filter((item) => item.id !== id);
      setFlatMaintenanceTypes(updatedFlat);
      setMaintenanceTypes(buildTree(updatedFlat));
      toastVariables.success("Tipo de mantenimiento eliminado exitosamente.");
    } catch (error) {
      console.error("Error deleting maintenance type:", error);
      toastVariables.error("Error al eliminar el tipo de mantenimiento.");
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      type: "",
      parent_id: "",
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    reset();
  };

  const openEditModal = (item: MaintenanceTypeBase) => {
    setEditingItem(item);
    setValue("type", item.type);
    setValue("parent_id", item.parent_id || "");
    setIsModalOpen(true);
  };

  const onSubmit = async (data: MaintenanceTypeFormData) => {
    if (editingItem) {
      await handleUpdate(data);
    } else {
      await handleCreate(data);
    }
    setIsModalOpen(false);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  if (noise && noise.styleType === "page") {
    return <Noise noise={noise} />;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {noise && <Noise noise={noise} />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end mb-6 sm:mb-8 gap-4 sm:gap-0">
        {/* <h1 className="text-xl sm:text-2xl font-bold">
          Tipos de Mantenimiento
        </h1> */}
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden xs:inline">Crear Tipo de Mantenimiento</span>
          <span className="inline xs:hidden">Crear</span>
        </Button>
      </div>

      <div className="space-y-4">
        {maintenanceTypes.map((item) => (
          <TreeNode
            key={item.id}
            node={item}
            level={0}
            onEdit={openEditModal}
            onDelete={handleDelete}
            expandedNodes={expandedNodes}
            onToggleExpand={toggleExpanded}
          />
        ))}
      </div>

      {maintenanceTypes.length === 0 && !noise && (
        <div className="text-center py-8 sm:py-12">
          <p className="text-gray-500 text-base sm:text-lg">
            No hay tipos de mantenimiento registrados
          </p>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">
            Haz clic en &quot;Crear Tipo de Mantenimiento&quot; para agregar el
            primer tipo
          </p>
        </div>
      )}

      {isModalOpen && (
        <Modal onClose={handleCancel}>
          <div className="p-4 sm:p-6 w-full max-w-xs sm:max-w-md mx-auto">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              {editingItem
                ? "Editar Tipo de Mantenimiento"
                : "Crear Tipo de Mantenimiento"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="mb-4">
                <Label htmlFor="type">Tipo de Mantenimiento</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="type"
                      placeholder="Ej: Preventivo, Correctivo, Predictivo"
                      {...field}
                      className="w-full"
                    />
                  )}
                />
                {errors.type && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.type.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="parent_id">Tipo Padre (Opcional)</Label>
                <Controller
                  name="parent_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar tipo padre..." />
                      </SelectTrigger>
                      <SelectContent className="z-[10000] lg:max-h-[30vh] md:max-h-[40vh] max-h-[60vh]">
                        {maintenanceTypes.map((node) => (
                          <ParentOption
                            key={node.id}
                            node={node}
                            level={0}
                            onSelect={field.onChange}
                            selectedValue={field.value}
                          />
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.parent_id && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.parent_id.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingItem ? "Actualizar Tipo" : "Crear Tipo"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
