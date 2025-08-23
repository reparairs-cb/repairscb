import {
  maintenanceRecordRepository,
  MaintenanceRecordError,
} from "../repositories/maintenance-record-repository";
import { MaintenanceRecordErrorCodes } from "@/lib/errors";
import {
  MaintenanceRecordBase,
  MaintenanceRecordWithDetails,
  MaintenanceRecordCreate,
  MaintenanceRecordUpdate,
  MultiMaintenanceRecord,
} from "@/types/maintenance-record";
import { maintenanceActivityService } from "./maintenance-activity-service";
import { maintenanceSparePartService } from "./maintenance-spare-part-service";
import { equipmentRepository } from "../repositories/equipment-repository";

/**
 * Servicio para gestionar registros de mantenimiento
 * Proporciona lógica de negocio y validaciones adicionales
 */
class MaintenanceRecordService {
  private repository = maintenanceRecordRepository;
  private equipmentRepository = equipmentRepository;

  constructor() {}

  /**
   * Crear un nuevo registro de mantenimiento
   * @param maintenanceRecord - Datos del registro de mantenimiento a crear
   * @returns El registro de mantenimiento creado
   */
  async create(
    maintenanceRecord: MaintenanceRecordCreate
  ): Promise<{ id: string; created_at: Date } | null> {
    try {
      // Validaciones de negocio adicionales
      // await this.validateBusinessRules(maintenanceRecord);
      // Validar que el equipo existe
      if (
        !(await this.equipmentRepository.getById(
          maintenanceRecord.equipment_id
        ))
      ) {
        throw new MaintenanceRecordError(
          MaintenanceRecordErrorCodes.EQUIPMENT_NOT_FOUND,
          `Equipment with ID ${maintenanceRecord.equipment_id} not found`
        );
      }

      return await this.repository.create(maintenanceRecord);
    } catch (error) {
      console.error("Error al crear el registro de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Obtener un registro de mantenimiento por su ID
   * @param id - ID del registro de mantenimiento a buscar
   * @returns El registro encontrado o null si no existe
   */
  async getById(id: string): Promise<MaintenanceRecordBase | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error(
        "Error al obtener el registro de mantenimiento por ID:",
        error
      );
      throw error;
    }
  }

  /**
   * Obtener todos los registros de mantenimiento de un usuario
   * @param limit - Límite de registros por página
   * @param offset - Offset para paginación
   * @param userId - ID del usuario
   * @returns Lista paginada de registros de mantenimiento
   */
  async getAll(
    limit: number,
    offset: number,
    userId: string
  ): Promise<MultiMaintenanceRecord> {
    try {
      return await this.repository.getAll(limit, offset, userId);
    } catch (error) {
      console.error(
        "Error al obtener todos los registros de mantenimiento:",
        error
      );
      throw error;
    }
  }

  /**
   * Obtener registros de mantenimiento con detalles (equipment, maintenance_type, etc.)
   * @param limit - Límite de registros por página
   * @param offset - Offset para paginación
   * @param userId - ID del usuario
   * @returns Lista paginada de registros con detalles
   */
  async getAllWithDetails(
    limit: number,
    offset: number,
    userId: string
  ): Promise<{
    total: number;
    limit: number;
    offset: number;
    pages: number;
    data: MaintenanceRecordWithDetails[];
  }> {
    try {
      const mr = await this.repository.getAllWithDetails(limit, offset, userId);
      for (const record of mr.data) {
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
      return mr;
    } catch (error) {
      console.error(
        "Error al obtener registros de mantenimiento con detalles:",
        error
      );
      throw error;
    }
  }

  /**
   * Obtener registros de mantenimiento por equipo
   * @param equipmentId - ID del equipo
   * @param userId - ID del usuario
   * @param limit - Límite de registros por página
   * @param offset - Offset para paginación
   * @returns Lista paginada de registros del equipo
   */
  async getByEquipment(
    equipmentId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    total: number;
    limit: number;
    offset: number;
    pages: number;
    equipment_id: string;
    data: MaintenanceRecordBase[];
  }> {
    try {
      return await this.repository.getByEquipment(
        equipmentId,
        userId,
        limit,
        offset
      );
    } catch (error) {
      console.error(
        "Error al obtener registros de mantenimiento por equipo:",
        error
      );
      throw error;
    }
  }

  /**
   * Actualizar un registro de mantenimiento
   * @param maintenanceRecord - Datos actualizados del registro
   * @returns El ID del registro actualizado
   */
  async update(
    maintenanceRecord: MaintenanceRecordUpdate
  ): Promise<{ id: string } | null> {
    try {
      // Validar que el registro existe antes de actualizar
      const existingRecord = await this.repository.getById(
        maintenanceRecord.id
      );
      if (!existingRecord) {
        throw new MaintenanceRecordError(
          MaintenanceRecordErrorCodes.NOT_FOUND,
          `Maintenance record with ID ${maintenanceRecord.id} not found`
        );
      }

      // Validaciones de negocio para actualizaciones
      // await this.validateUpdateBusinessRules(maintenanceRecord, existingRecord);

      return await this.repository.update(maintenanceRecord);
    } catch (error) {
      console.error("Error al actualizar el registro de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Eliminar un registro de mantenimiento
   * @param id - ID del registro a eliminar
   * @returns El ID del registro eliminado
   */
  async delete(id: string): Promise<{ id: string } | null> {
    try {
      // Validar que el registro existe antes de eliminar
      const existingRecord = await this.repository.getById(id);
      if (!existingRecord) {
        throw new MaintenanceRecordError(
          MaintenanceRecordErrorCodes.NOT_FOUND,
          `Maintenance record with ID ${id} not found`
        );
      }

      return await this.repository.delete({ id });
    } catch (error) {
      console.error("Error al eliminar el registro de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Verificar si existe un registro de mantenimiento
   * @param id - ID del registro
   * @param userId - ID del usuario
   * @returns true si existe, false en caso contrario
   */
  async exists(id: string, userId: string): Promise<boolean> {
    try {
      return await this.repository.exists(id, userId);
    } catch (error) {
      console.error("Error al verificar existencia del registro:", error);
      throw error;
    }
  }
}

export const maintenanceRecordService = new MaintenanceRecordService();
