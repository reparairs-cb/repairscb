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

  async getByEquipmentWithSearchTerm(
    equipmentId: string,
    searchTerm: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    total: number;
    limit: number;
    offset: number;
    pages: number;
    equipment_id: string;
    data: MaintenanceRecordWithDetails[];
  }> {
    try {
      return await this.repository.getByEquipmentWithSearchTerm(
        equipmentId,
        searchTerm,
        userId,
        limit,
        offset
      );
    } catch (error) {
      console.error(
        "Error al obtener registros de mantenimiento por equipo y término de búsqueda:",
        error
      );
      throw error;
    }
  }

  /**
   * Obtener registros de mantenimiento por rango de kilometraje
   * @param minKilometers - Kilometraje mínimo
   * @param maxKilometers - Kilometraje máximo
   * @param userId - ID del usuario
   * @param limit - Límite de registros
   * @param offset - Offset para paginación
   * @returns Lista de registros en el rango de kilometraje
   */
  async getByMileageRange(
    minKilometers: number,
    maxKilometers: number,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    total: number;
    limit: number;
    offset: number;
    pages: number;
    min_kilometers: number;
    max_kilometers: number;
    data: MaintenanceRecordBase[];
  }> {
    try {
      return await this.repository.getByMileageRange(
        minKilometers,
        maxKilometers,
        userId,
        limit,
        offset
      );
    } catch (error) {
      console.error(
        "Error al obtener registros por rango de kilometraje:",
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
   * Obtener mantenimientos en progreso (sin fecha de finalización)
   * @param userId - ID del usuario
   * @returns Lista de mantenimientos en progreso
   */
  /* async getInProgress(userId: string): Promise<MaintenanceRecordBase[]> {
    try {
      return await this.repository.getInProgress(userId);
    } catch (error) {
      console.error("Error al obtener mantenimientos en progreso:", error);
      throw error;
    }
  } */

  /**
   * Completar un mantenimiento (establecer fecha de finalización)
   * @param id - ID del registro de mantenimiento
   * @param endDateTime - Fecha y hora de finalización (opcional, por defecto la actual)
   * @returns El ID del registro actualizado
   */
  async complete(
    id: string,
    endDateTime?: Date
  ): Promise<{ id: string } | null> {
    try {
      const existingRecord = await this.repository.getById(id);
      if (!existingRecord) {
        throw new MaintenanceRecordError(
          MaintenanceRecordErrorCodes.NOT_FOUND,
          `Maintenance record with ID ${id} not found`
        );
      }

      if (existingRecord.end_datetime) {
        throw new MaintenanceRecordError(
          MaintenanceRecordErrorCodes.INVALID_DATETIME_RANGE,
          "Maintenance record is already completed"
        );
      }

      const finalEndDateTime = endDateTime || new Date();

      if (finalEndDateTime <= existingRecord.start_datetime) {
        throw new MaintenanceRecordError(
          MaintenanceRecordErrorCodes.INVALID_DATETIME_RANGE,
          "End datetime must be after start datetime"
        );
      }

      return await this.repository.complete(id, finalEndDateTime);
    } catch (error) {
      console.error("Error al completar el mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Buscar registros de mantenimiento por observaciones
   * @param query - Texto a buscar en las observaciones
   * @param userId - ID del usuario
   * @param limit - Límite de resultados
   * @returns Lista de registros que coinciden con la búsqueda
   */
  /* async searchByObservations(
    query: string,
    userId: string,
    limit: number = 50
  ): Promise<MaintenanceRecordBase[]> {
    try {
      if (!query.trim()) {
        throw new MaintenanceRecordError(
          MaintenanceRecordErrorCodes.DATABASE_ERROR,
          "Search query cannot be empty"
        );
      }

      return await this.repository.searchByObservations(
        query.trim(),
        userId,
        limit
      );
    } catch (error) {
      console.error("Error al buscar por observaciones:", error);
      throw error;
    }
  } */

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

  /**
   * Obtener estadísticas de mantenimiento para un usuario
   * @param userId - ID del usuario
   * @returns Estadísticas de mantenimiento
   */
  /* async getMaintenanceStatistics(userId: string): Promise<{
    total_records: number;
    in_progress: number;
    completed: number;
    avg_duration_hours: number | null;
    most_maintained_equipment: string | null;
  }> {
    try {
      const [allRecords, inProgressRecords] = await Promise.all([
        this.repository.getAll(1000, 0, userId), // Obtener muchos para estadísticas
        this.repository.getInProgress(userId),
      ]);

      const completedRecords = allRecords.data.filter(
        (record) => record.end_datetime
      );

      // Calcular duración promedio para registros completados
      const totalDuration = completedRecords.reduce((sum, record) => {
        if (record.end_datetime) {
          const duration =
            record.end_datetime.getTime() - record.start_datetime.getTime();
          return sum + duration / (1000 * 60 * 60); // Convertir a horas
        }
        return sum;
      }, 0);

      const avgDurationHours =
        completedRecords.length > 0
          ? totalDuration / completedRecords.length
          : null;

      // Encontrar equipo con más mantenimientos
      const equipmentCounts = allRecords.data.reduce((counts, record) => {
        counts[record.equipment_id] = (counts[record.equipment_id] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      const mostMaintainedEquipment =
        Object.keys(equipmentCounts).length > 0
          ? Object.keys(equipmentCounts).reduce((a, b) =>
              equipmentCounts[a] > equipmentCounts[b] ? a : b
            )
          : null;

      return {
        total_records: allRecords.total,
        in_progress: inProgressRecords.length,
        completed: completedRecords.length,
        avg_duration_hours: avgDurationHours,
        most_maintained_equipment: mostMaintainedEquipment,
      };
    } catch (error) {
      console.error("Error al obtener estadísticas de mantenimiento:", error);
      throw error;
    }
  } */

  /**
   * Validaciones de reglas de negocio para creación
   * @param maintenanceRecord - Datos del registro a validar
   */
  /* private async validateBusinessRules(
    maintenanceRecord: MaintenanceRecordCreate
  ): Promise<void> {
    // Validar que la fecha de inicio no sea en el futuro lejano
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 7); // Máximo 7 días en el futuro

    if (maintenanceRecord.start_datetime > maxFutureDate) {
      throw new MaintenanceRecordError(
        MaintenanceRecordErrorCodes.INVALID_DATETIME_RANGE,
        "Start datetime cannot be more than 7 days in the future"
      );
    }

    // Validar que no hay otro mantenimiento en progreso para el mismo equipo
    const inProgressRecords = await this.repository.getInProgress(
      maintenanceRecord.user_id
    );
    const hasEquipmentInProgress = inProgressRecords.some(
      (record) => record.equipment_id === maintenanceRecord.equipment_id
    );

    if (hasEquipmentInProgress) {
      throw new MaintenanceRecordError(
        MaintenanceRecordErrorCodes.DATABASE_ERROR,
        "Equipment already has a maintenance in progress"
      );
    }
  } */

  /**
   * Validaciones de reglas de negocio para actualización
   * @param updateData - Datos de actualización
   * @param existingRecord - Registro existente
   */
  /* private async validateUpdateBusinessRules(
    updateData: MaintenanceRecordUpdate,
    existingRecord: MaintenanceRecordBase
  ): Promise<void> {
    // Si se está cambiando de equipo, validar que no hay mantenimiento en progreso
    if (
      updateData.equipment_id &&
      updateData.equipment_id !== existingRecord.equipment_id
    ) {
      const inProgressRecords = await this.repository.getInProgress(
        existingRecord.user_id
      );
      const hasNewEquipmentInProgress = inProgressRecords.some(
        (record) =>
          record.equipment_id === updateData.equipment_id &&
          record.id !== existingRecord.id
      );

      if (hasNewEquipmentInProgress) {
        throw new MaintenanceRecordError(
          MaintenanceRecordErrorCodes.DATABASE_ERROR,
          "Target equipment already has a maintenance in progress"
        );
      }
    }

    // Validar que no se puede cambiar un mantenimiento completado a en progreso
    if (existingRecord.end_datetime && updateData.end_datetime === null) {
      throw new MaintenanceRecordError(
        MaintenanceRecordErrorCodes.INVALID_DATETIME_RANGE,
        "Cannot change a completed maintenance back to in progress"
      );
    }
  } */
}

export const maintenanceRecordService = new MaintenanceRecordService();
