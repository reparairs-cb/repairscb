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
  MaintenanceActivityProgress,
  MaintenanceActivityStats,
  BulkMaintenanceActivityUpdate,
  PendingMaintenanceActivity,
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
   * Obtener todas las actividades de un registro de mantenimiento
   * @param maintenanceRecordId - ID del registro de mantenimiento
   * @param userId - ID del usuario
   * @returns Lista de actividades del mantenimiento
   */
  async getByMaintenanceRecord(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceActivityBase[]> {
    try {
      return await this.repository.getByMaintenanceRecord(
        maintenanceRecordId,
        userId
      );
    } catch (error) {
      console.error("Error al obtener actividades por mantenimiento:", error);
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

  /**
   * Marcar una actividad como completada
   * @param id - ID de la actividad
   * @param userId - ID del usuario
   * @param observations - Observaciones opcionales
   * @returns El resultado de la operación
   */
  async complete(
    id: string,
    userId: string,
    observations?: string
  ): Promise<{ id: string; completed: boolean } | null> {
    try {
      // Validar que el registro existe antes de completar
      const existingRecord = await this.repository.getById(id);
      if (!existingRecord) {
        throw new MaintenanceActivityError(
          MaintenanceActivityErrorCodes.NOT_FOUND,
          `Maintenance activity with ID ${id} not found`
        );
      }

      if (existingRecord.completed) {
        throw new MaintenanceActivityError(
          MaintenanceActivityErrorCodes.INVALID_STATUS,
          "Activity is already completed"
        );
      }

      return await this.repository.complete(id, userId, observations);
    } catch (error) {
      console.error("Error al completar la actividad de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Marcar una actividad como pendiente
   * @param id - ID de la actividad
   * @param userId - ID del usuario
   * @returns El resultado de la operación
   */
  async markPending(
    id: string,
    userId: string
  ): Promise<{ id: string; completed: boolean } | null> {
    try {
      // Validar que el registro existe antes de marcar como pendiente
      const existingRecord = await this.repository.getById(id);
      if (!existingRecord) {
        throw new MaintenanceActivityError(
          MaintenanceActivityErrorCodes.NOT_FOUND,
          `Maintenance activity with ID ${id} not found`
        );
      }

      if (!existingRecord.completed) {
        throw new MaintenanceActivityError(
          MaintenanceActivityErrorCodes.INVALID_STATUS,
          "Activity is already pending"
        );
      }

      return await this.repository.markPending(id, userId);
    } catch (error) {
      console.error("Error al marcar actividad como pendiente:", error);
      throw error;
    }
  }

  /**
   * Obtener el progreso de un mantenimiento
   * @param maintenanceRecordId - ID del registro de mantenimiento
   * @param userId - ID del usuario
   * @returns Progreso del mantenimiento
   */
  async getMaintenanceProgress(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceActivityProgress> {
    try {
      return await this.repository.getMaintenanceProgress(
        maintenanceRecordId,
        userId
      );
    } catch (error) {
      console.error("Error al obtener progreso del mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Obtener actividades pendientes de un usuario
   * @param userId - ID del usuario
   * @param limit - Límite de resultados
   * @returns Lista de actividades pendientes
   */
  async getPendingActivities(
    userId: string,
    limit: number = 50
  ): Promise<PendingMaintenanceActivity[]> {
    try {
      return await this.repository.getPendingActivities(userId, limit);
    } catch (error) {
      console.error("Error al obtener actividades pendientes:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de actividades de mantenimiento
   * @param userId - ID del usuario
   * @returns Estadísticas de actividades
   */
  async getActivitiesStats(userId: string): Promise<MaintenanceActivityStats> {
    try {
      return await this.repository.getActivitiesStats(userId);
    } catch (error) {
      console.error("Error al obtener estadísticas de actividades:", error);
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
    created_activities: { id: string; created_at: Date }[];
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
   * Verificar si existe un registro de actividad en mantenimiento
   * @param id - ID del registro
   * @param userId - ID del usuario
   * @returns true si existe, false en caso contrario
   */
  async exists(id: string, userId: string): Promise<boolean> {
    try {
      return await this.repository.exists(id, userId);
    } catch (error) {
      console.error("Error al verificar existencia de la actividad:", error);
      throw error;
    }
  }

  /**
   * Agregar actividad a mantenimiento (método de conveniencia)
   * @param maintenanceRecordId - ID del mantenimiento
   * @param activityId - ID de la actividad
   * @param completed - Si está completada inicialmente
   * @param observations - Observaciones opcionales
   * @param userId - ID del usuario
   * @returns El registro creado
   */
  async addActivityToMaintenance(
    maintenanceRecordId: string,
    activityId: string,
    completed: boolean = false,
    observations: string | undefined,
    userId: string
  ): Promise<{ id: string; created_at: Date } | null> {
    try {
      // Verificar que la actividad no esté ya en el mantenimiento
      const alreadyExists = await this.repository.existsActivityInMaintenance(
        maintenanceRecordId,
        activityId,
        userId
      );

      if (alreadyExists) {
        throw new MaintenanceActivityError(
          MaintenanceActivityErrorCodes.DUPLICATE_ACTIVITY,
          "Activity already exists in this maintenance record. Use update instead."
        );
      }

      return await this.create({
        maintenance_record_id: maintenanceRecordId,
        activity_id: activityId,
        completed,
        observations,
        user_id: userId,
      });
    } catch (error) {
      console.error("Error al agregar actividad al mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Alternar el estado de completitud de una actividad
   * @param id - ID del registro
   * @param userId - ID del usuario
   * @param observations - Observaciones opcionales
   * @returns El resultado de la operación
   */
  async toggleCompletion(
    id: string,
    userId: string,
    observations?: string
  ): Promise<{ id: string; completed: boolean } | null> {
    try {
      const existingRecord = await this.repository.getById(id);
      if (!existingRecord) {
        throw new MaintenanceActivityError(
          MaintenanceActivityErrorCodes.NOT_FOUND,
          `Maintenance activity with ID ${id} not found`
        );
      }

      if (existingRecord.completed) {
        return await this.repository.markPending(id, userId);
      } else {
        return await this.repository.complete(id, userId, observations);
      }
    } catch (error) {
      console.error("Error al alternar estado de completitud:", error);
      throw error;
    }
  }

  /**
   * Obtener actividades completadas de un mantenimiento
   * @param maintenanceRecordId - ID del mantenimiento
   * @param userId - ID del usuario
   * @returns Lista de actividades completadas
   */
  async getCompletedActivities(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceActivityBase[]> {
    try {
      return await this.repository.getCompletedActivities(
        maintenanceRecordId,
        userId
      );
    } catch (error) {
      console.error("Error al obtener actividades completadas:", error);
      throw error;
    }
  }

  /**
   * Buscar actividades por observaciones
   * @param query - Texto a buscar
   * @param userId - ID del usuario
   * @param limit - Límite de resultados
   * @returns Lista de actividades que coinciden con la búsqueda
   */
  async searchByObservations(
    query: string,
    userId: string,
    limit: number = 50
  ): Promise<MaintenanceActivityWithDetails[]> {
    try {
      if (!query.trim()) {
        throw new MaintenanceActivityError(
          MaintenanceActivityErrorCodes.DATABASE_ERROR,
          "Search query cannot be empty"
        );
      }

      return await this.repository.searchByObservations(
        query.trim(),
        userId,
        limit
      );
    } catch (error) {
      console.error("Error al buscar actividades por observaciones:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de progreso y eficiencia para un usuario
   * @param userId - ID del usuario
   * @returns Estadísticas detalladas de actividades
   */
  async getActivityProgressStatistics(userId: string): Promise<{
    total_activities: number;
    completed_activities: number;
    pending_activities: number;
    completion_rate_percentage: number;
    total_maintenance_records_with_activities: number;
    average_activities_per_maintenance: number;
    most_efficient_maintenance: string | null;
    most_common_activity: {
      activity_id: string;
      activity_name: string;
      usage_count: number;
    } | null;
    activities_by_status: {
      completed: number;
      pending: number;
    };
  }> {
    try {
      const [allActivities, stats] = await Promise.all([
        this.repository.getAll(1000, 0, userId), // Obtener muchos para estadísticas
        this.repository.getActivitiesStats(userId),
      ]);

      // Agrupar por mantenimiento para calcular estadísticas
      const maintenanceGroups = allActivities.data.reduce(
        (groups, activity) => {
          const maintenanceId = activity.maintenance_record_id;
          if (!groups[maintenanceId]) {
            groups[maintenanceId] = [];
          }
          groups[maintenanceId].push(activity);
          return groups;
        },
        {} as Record<string, MaintenanceActivityBase[]>
      );

      const maintenanceRecordsWithActivities =
        Object.keys(maintenanceGroups).length;
      const totalActivities = allActivities.data.length;
      const averageActivitiesPerMaintenance =
        maintenanceRecordsWithActivities > 0
          ? totalActivities / maintenanceRecordsWithActivities
          : 0;

      // Encontrar mantenimiento más eficiente (mayor % de actividades completadas)
      let mostEfficientMaintenanceId: string | null = null;
      let maxEfficiencyRate = 0;

      for (const [maintenanceId, activities] of Object.entries(
        maintenanceGroups
      )) {
        const completedCount = activities.filter((a) => a.completed).length;
        const efficiencyRate =
          activities.length > 0
            ? (completedCount / activities.length) * 100
            : 0;

        if (efficiencyRate > maxEfficiencyRate && activities.length >= 3) {
          // Solo considerar mantenimientos con al menos 3 actividades
          maxEfficiencyRate = efficiencyRate;
          mostEfficientMaintenanceId = maintenanceId;
        }
      }

      // Obtener la actividad más común de las estadísticas
      const mostCommonActivity =
        stats.most_common_activities && stats.most_common_activities.length > 0
          ? stats.most_common_activities[0]
          : null;

      return {
        total_activities: stats.total_activities,
        completed_activities: stats.completed_activities,
        pending_activities: stats.pending_activities,
        completion_rate_percentage: stats.completion_rate_percentage,
        total_maintenance_records_with_activities:
          maintenanceRecordsWithActivities,
        average_activities_per_maintenance:
          Math.round(averageActivitiesPerMaintenance * 100) / 100,
        most_efficient_maintenance: mostEfficientMaintenanceId,
        most_common_activity: mostCommonActivity,
        activities_by_status: {
          completed: stats.completed_activities,
          pending: stats.pending_activities,
        },
      };
    } catch (error) {
      console.error(
        "Error al obtener estadísticas de progreso de actividades:",
        error
      );
      throw error;
    }
  }

  /**
   * Completar múltiples actividades de un mantenimiento
   * @param maintenanceRecordId - ID del mantenimiento
   * @param activityIds - IDs de las actividades a completar
   * @param userId - ID del usuario
   * @param observations - Observaciones generales
   * @returns Resultado de las operaciones
   */
  async completeMultipleActivities(
    maintenanceRecordId: string,
    activityIds: string[],
    userId: string,
    observations?: string
  ): Promise<Array<{ id: string; completed: boolean; success: boolean }>> {
    try {
      if (!activityIds || activityIds.length === 0) {
        throw new MaintenanceActivityError(
          MaintenanceActivityErrorCodes.DATABASE_ERROR,
          "Activity IDs list cannot be empty"
        );
      }

      if (activityIds.length > 20) {
        throw new MaintenanceActivityError(
          MaintenanceActivityErrorCodes.DATABASE_ERROR,
          "Cannot complete more than 20 activities at once"
        );
      }

      const results: Array<{
        id: string;
        completed: boolean;
        success: boolean;
      }> = [];

      for (const activityId of activityIds) {
        try {
          const result = await this.complete(activityId, userId, observations);
          results.push({
            id: activityId,
            completed: result?.completed || false,
            success: true,
          });
        } catch (error) {
          console.warn(`Failed to complete activity ${activityId}:`, error);
          results.push({
            id: activityId,
            completed: false,
            success: false,
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error al completar múltiples actividades:", error);
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
      updateData.completed === true &&
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
    if (!bulkUpdate.activities || bulkUpdate.activities.length === 0) {
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
