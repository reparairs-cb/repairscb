import { equipmentRepository } from "../repositories/equipment-repository";
import {
  EquipmentBase,
  EquipmentCreate,
  EquipmentUpdate,
  MultiEquipmentMaintenancePlan,
  MultiEquipmentWithRecords,
  MultiEqWithPendingInProgressMRs,
} from "@/types/equipment";
import { maintenanceActivityService } from "./maintenance-activity-service";
import { maintenanceSparePartService } from "./maintenance-spare-part-service";

/**
 * Servicio para crear un nuevo equipo
 * @param equipment - Datos del equipo a crear
 * @returns El equipo creado
 */
class EquipmentService {
  private repository = equipmentRepository;
  constructor() {}

  /**
   * Crear un nuevo equipo
   * @param equipment - Datos del equipo a crear
   * @returns El equipo creado
   */
  async create(
    equipment: EquipmentCreate
  ): Promise<{ id: string; created_at: Date } | null> {
    try {
      return await this.repository.create(equipment);
    } catch (error) {
      console.error("Error al crear el equipo:", error);
      throw error;
    }
  }

  /**
   * Obtener un equipo por su ID
   * @param id - ID del equipo a buscar
   * @returns El equipo encontrado o null si no existe
   */
  async getById(id: string): Promise<EquipmentBase | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Error al obtener el equipo por ID:", error);
      throw error;
    }
  }

  /**
   * Obtener todos los equipos de un usuario
   * @param userId - ID del usuario
   * @returns Lista de equipos del usuario
   */
  async getAll(
    limit: number,
    offset: number,
    userId: string
  ): Promise<{ total: number; data: EquipmentBase[] }> {
    try {
      return await this.repository.getAll(limit, offset, userId);
    } catch (error) {
      console.error("Error al obtener todos los equipos:", error);
      throw error;
    }
  }

  async getAllWithPendingMRs(
    userId: string,
    limit: number,
    offset: number
  ): Promise<MultiEqWithPendingInProgressMRs> {
    try {
      const data = await this.repository.getAllWithPendingMRs(
        userId,
        limit,
        offset
      );
      for (const equipment of data.data) {
        if (equipment.maintenance_records) {
          for (const record of equipment.maintenance_records) {
            record.activities =
              await maintenanceActivityService.getByMaintenanceRecordWithDetails(
                record.id,
                userId
              );
          }
        }
      }
      return data;
    } catch (error) {
      console.error(
        "Error al obtener todos los equipos con MR pendientes:",
        error
      );
      throw error;
    }
  }

  /**
   * Actualizar un equipo por su ID
   * @param id - ID del equipo a actualizar
   * @param equipment - Nuevos datos del equipo
   * @returns El equipo actualizado
   */
  async update(equipment: EquipmentUpdate): Promise<{ id: string } | null> {
    try {
      return await this.repository.update(equipment);
    } catch (error) {
      console.error("Error al actualizar el equipo:", error);
      throw error;
    }
  }

  /**
   * Eliminar un equipo por su ID
   * @param id - ID del equipo a eliminar
   * @returns El ID del equipo eliminado
   */
  async delete(id: string): Promise<{ id: string } | null> {
    try {
      const has_records = await this.repository.hasRecords(id);
      if (has_records) {
        throw new Error(
          "No se puede eliminar el equipo porque tiene registros asociados."
        );
      }
      return await this.repository.delete({ id });
    } catch (error) {
      console.error("Error al eliminar el equipo:", error);
      throw error;
    }
  }

  async getAllWithRecords(
    userId: string,
    limit: number,
    offset: number,
    maintenanceLimit?: number,
    maintenanceOffset?: number,
    mileageLimit?: number,
    mileageOffset?: number
  ): Promise<MultiEquipmentWithRecords> {
    try {
      const eqs = await this.repository.getAllWithRecords(
        userId,
        limit,
        offset,
        maintenanceLimit,
        maintenanceOffset,
        mileageLimit,
        mileageOffset
      );

      for (const equipment of eqs.data) {
        if (equipment.maintenance_records) {
          for (const record of equipment.maintenance_records.data) {
            record.activities =
              await maintenanceActivityService.getByMaintenanceRecordWithDetails(
                record.id,
                userId
              );

            record.spare_parts =
              await maintenanceSparePartService.getByMaintenanceRecordWithDetails(
                record.id,
                userId
              );
          }
        }
      }

      return eqs;
    } catch (error) {
      console.error("Error al obtener todos los equipos con registros:", error);
      throw error;
    }
  }

  async getAllWithRecordsByPriorityAndStatus(
    userId: string,
    limit: number,
    offset: number,
    maintenanceLimit?: number,
    maintenanceOffset?: number,
    mileageLimit?: number,
    mileageOffset?: number,
    by_priority: string[] | null = null,
    by_status: string[] | null = null,
    sort_by: { by: string; order: "asc" | "desc" } | null = null
  ): Promise<MultiEquipmentWithRecords> {
    try {
      const eqs = await this.repository.getAllWithRecords(
        userId,
        limit,
        offset,
        maintenanceLimit,
        maintenanceOffset,
        mileageLimit,
        mileageOffset,
        by_priority,
        by_status,
        sort_by
      );

      for (const equipment of eqs.data) {
        if (equipment.maintenance_records) {
          for (const record of equipment.maintenance_records.data) {
            record.activities =
              await maintenanceActivityService.getByMaintenanceRecordWithDetails(
                record.id,
                userId
              );

            record.spare_parts =
              await maintenanceSparePartService.getByMaintenanceRecordWithDetails(
                record.id,
                userId
              );
          }
        }
      }

      return eqs;
    } catch (error) {
      console.error(
        "Error al obtener todos los equipos con registros por prioridad y estado:",
        error
      );
      throw error;
    }
  }

  async hasRecords(equipment_id: string): Promise<boolean> {
    try {
      return await this.repository.hasRecords(equipment_id);
    } catch (error) {
      console.error("Error al obtener registros de equipos:", error);
      throw error;
    }
  }

  /**
   * Obtener el plan de mantenimiento de un usuario
   * @param userId - ID del usuario
   * @param limit - Límite de resultados
   * @param offset - Desplazamiento para la paginación
   * @returns Plan de mantenimiento del usuario
   */
  async getMaintenancePlan(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<MultiEquipmentMaintenancePlan> {
    try {
      return await this.repository.getMaintenancePlan(userId, limit, offset);
    } catch (error) {
      console.error("Error al obtener el plan de mantenimiento:", error);
      throw error;
    }
  }
}

export const equipmentService = new EquipmentService();
