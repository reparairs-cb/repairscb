import {
  maintenanceActivityRepository,
  MaintenanceActivityError,
  MaintenanceActivityErrorCodes,
} from "../repositories/maintenance-activity-repository";
import {
  MaintenanceActivityBase,
  MaintenanceActivityWithDetails,
  MaintenanceActivityCreate,
  MaintenanceActivityUpdate,
  MultiMaintenanceActivity,
  BulkMaintenanceActivityUpdate,
} from "@/types/maintenance-activity";

/**
 * Servicio para gestionar actividades en registros de mantenimiento
 * Proporciona lógica de negocio y validaciones adicionales
 */
class MaintenanceActivityService {
  private repository = maintenanceActivityRepository;

  constructor() {}

  /**
   * Crear un nuevo registro de actividad en mantenimiento
   * @param maintenanceActivity - Datos de la actividad a agregar
   * @returns El registro creado
   */
  async create(
    maintenanceActivity: MaintenanceActivityCreate
  ): Promise<{ id: string; created_at: Date } | null> {
    try {
      // Validaciones de negocio adicionales
      await this.validateBusinessRules(maintenanceActivity);

      return await this.repository.create(maintenanceActivity);
    } catch (error) {
      console.error("Error al crear la actividad de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Obtener un registro de actividad por su ID
   * @param id - ID del registro a buscar
   * @returns El registro encontrado o null si no existe
   */
  async getById(id: string): Promise<MaintenanceActivityBase | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error(
        "Error al obtener la actividad de mantenimiento por ID:",
        error
      );
      throw error;
    }
  }

  /**
   * Obtener actividades de mantenimiento con detalles de la actividad
   * @param maintenanceRecordId - ID del registro de mantenimiento
   * @param userId - ID del usuario
   * @returns Lista de actividades con detalles completos
   */
  async getByMaintenanceRecordWithDetails(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceActivityWithDetails[]> {
    try {
      return await this.repository.getByMaintenanceRecordWithDetails(
        maintenanceRecordId,
        userId
      );
    } catch (error) {
      console.error("Error al obtener actividades con detalles:", error);
      throw error;
    }
  }

  /**
   * Obtener todos los registros de actividades de mantenimiento de un usuario
   * @param limit - Límite de registros por página
   * @param offset - Offset para paginación
   * @param userId - ID del usuario
   * @returns Lista paginada de actividades de mantenimiento
   */
  async getAll(
    limit: number,
    offset: number,
    userId: string
  ): Promise<MultiMaintenanceActivity> {
    try {
      return await this.repository.getAll(limit, offset, userId);
    } catch (error) {
      console.error(
        "Error al obtener todas las actividades de mantenimiento:",
        error
      );
      throw error;
    }
  }

  /**
   * Actualizar un registro de actividad en mantenimiento
   * @param maintenanceActivity - Datos actualizados de la actividad
   * @returns El ID del registro actualizado
   */
  async update(
    maintenanceActivity: MaintenanceActivityUpdate
  ): Promise<{ id: string } | null> {
    try {
      // Validar que el registro existe antes de actualizar
      const existingRecord = await this.repository.getById(
        maintenanceActivity.id
      );
      if (!existingRecord) {
        throw new MaintenanceActivityError(
          MaintenanceActivityErrorCodes.NOT_FOUND,
          `Maintenance activity with ID ${maintenanceActivity.id} not found`
        );
      }

      // Validaciones de negocio para actualizaciones
      await this.validateUpdateBusinessRules(
        maintenanceActivity,
        existingRecord
      );

      return await this.repository.update(maintenanceActivity);
    } catch (error) {
      console.error(
        "Error al actualizar la actividad de mantenimiento:",
        error
      );
      throw error;
    }
  }

  /**
   * Eliminar un registro de actividad en mantenimiento
   * @param id - ID del registro a eliminar
   * @param userId - ID del usuario
   * @returns El ID del registro eliminado
   */
  async delete(id: string, userId: string): Promise<{ id: string } | null> {
    try {
      // Validar que el registro existe antes de eliminar
      const existingRecord = await this.repository.getById(id);
      if (!existingRecord) {
        throw new MaintenanceActivityError(
          MaintenanceActivityErrorCodes.NOT_FOUND,
          `Maintenance activity with ID ${id} not found`
        );
      }

      return await this.repository.delete({ id, user_id: userId });
    } catch (error) {
      console.error("Error al eliminar la actividad de mantenimiento:", error);
      throw error;
    }
  }

  async bulkCreate(bulkCreate: BulkMaintenanceActivityUpdate): Promise<{
    maintenance_record_id: string;
    created_activities: { id: string; created_at: Date }[];
  }> {
    try {
      // Validaciones de negocio para creación masiva
      await this.validateBulkUpdateBusinessRules(bulkCreate);

      return await this.repository.bulkCreate(bulkCreate);
    } catch (error) {
      console.error("Error en creación masiva de actividades:", error);
      throw error;
    }
  }

  /**
   * Actualización masiva de actividades para un mantenimiento
   * @param bulkUpdate - Datos para actualización masiva
   * @returns Resultado de la operación
   */
  async bulkUpdate(bulkUpdate: BulkMaintenanceActivityUpdate): Promise<{
    maintenance_record_id: string;
    processed_activities: { id: string; created_at: Date }[];
  }> {
    try {
      // Validaciones de negocio para actualización masiva
      await this.validateBulkUpdateBusinessRules(bulkUpdate);

      return await this.repository.bulkUpdate(bulkUpdate);
    } catch (error) {
      console.error("Error en actualización masiva de actividades:", error);
      throw error;
    }
  }

  /**
   * Validaciones de reglas de negocio para creación
   * @param maintenanceActivity - Datos de la actividad a validar
   */
  private async validateBusinessRules(
    maintenanceActivity: MaintenanceActivityCreate
  ): Promise<void> {
    // Verificar que la actividad no esté ya en el mantenimiento
    const alreadyExists = await this.repository.existsActivityInMaintenance(
      maintenanceActivity.maintenance_record_id,
      maintenanceActivity.activity_id,
      maintenanceActivity.user_id
    );

    if (alreadyExists) {
      throw new MaintenanceActivityError(
        MaintenanceActivityErrorCodes.DUPLICATE_ACTIVITY,
        "Activity already exists in this maintenance record"
      );
    }
  }

  /**
   * Validaciones de reglas de negocio para actualización
   * @param updateData - Datos de actualización
   * @param existingRecord - Registro existente
   */
  private async validateUpdateBusinessRules(
    updateData: MaintenanceActivityUpdate,
    existingRecord: MaintenanceActivityBase
  ): Promise<void> {
    // Si se está cambiando de mantenimiento o actividad, verificar duplicados
    if (updateData.maintenance_record_id || updateData.activity_id) {
      const targetMaintenanceId =
        updateData.maintenance_record_id ||
        existingRecord.maintenance_record_id;
      const targetActivityId =
        updateData.activity_id || existingRecord.activity_id;

      // Solo verificar si realmente está cambiando
      if (
        targetMaintenanceId !== existingRecord.maintenance_record_id ||
        targetActivityId !== existingRecord.activity_id
      ) {
        const alreadyExists = await this.repository.existsActivityInMaintenance(
          targetMaintenanceId,
          targetActivityId,
          updateData.user_id
        );

        if (alreadyExists) {
          throw new MaintenanceActivityError(
            MaintenanceActivityErrorCodes.DUPLICATE_ACTIVITY,
            "Activity already exists in the target maintenance record"
          );
        }
      }
    }

    // Si se está marcando como completada, debe tener observaciones
    if (
      updateData.status === "completed" &&
      !updateData.observations?.trim() &&
      !existingRecord.observations?.trim()
    ) {
      throw new MaintenanceActivityError(
        MaintenanceActivityErrorCodes.INVALID_STATUS,
        "Completed activities must have observations"
      );
    }
  }

  /**
   * Validaciones de reglas de negocio para actualización masiva
   * @param bulkUpdate - Datos de actualización masiva
   */
  private async validateBulkUpdateBusinessRules(
    bulkUpdate: BulkMaintenanceActivityUpdate
  ): Promise<void> {
    if (!bulkUpdate.activities) {
      throw new MaintenanceActivityError(
        MaintenanceActivityErrorCodes.DATABASE_ERROR,
        "Activities list cannot be empty for bulk update"
      );
    }

    if (bulkUpdate.activities.length > 50) {
      throw new MaintenanceActivityError(
        MaintenanceActivityErrorCodes.DATABASE_ERROR,
        "Cannot update more than 50 activities at once"
      );
    }

    // Verificar que no hay actividades duplicadas en la lista
    const activityIds = bulkUpdate.activities.map((a) => a.activity_id);
    const uniqueIds = new Set(activityIds);
    if (uniqueIds.size !== activityIds.length) {
      throw new MaintenanceActivityError(
        MaintenanceActivityErrorCodes.DUPLICATE_ACTIVITY,
        "Duplicate activities found in bulk update list"
      );
    }
  }
}

export const maintenanceActivityService = new MaintenanceActivityService();
