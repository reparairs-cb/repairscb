import { pool } from "@/lib/supabase";
import { Pool, PoolClient } from "pg";
import {
  MaintenanceActivityBase,
  MaintenanceActivityWithDetails,
  MaintenanceActivityCreate,
  MaintenanceActivityUpdate,
  MultiMaintenanceActivity,
  DeleteMaintenanceActivity,
  MaintenanceActivityProgress,
  MaintenanceActivityStats,
  BulkMaintenanceActivityUpdate,
  PendingMaintenanceActivity,
} from "@/types/maintenance-activity";
import { GlobalErrorResponse } from "@/lib/errors";

// Error handling
export class MaintenanceActivityError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = "MaintenanceActivityError";
  }
}

export enum MaintenanceActivityErrorCodes {
  NOT_FOUND = "MAINTENANCE_ACTIVITY_NOT_FOUND",
  MAINTENANCE_RECORD_NOT_FOUND = "MAINTENANCE_RECORD_NOT_FOUND",
  ACTIVITY_NOT_FOUND = "ACTIVITY_NOT_FOUND",
  DUPLICATE_ACTIVITY = "DUPLICATE_ACTIVITY",
  INVALID_STATUS = "INVALID_STATUS",
  ACCESS_DENIED = "ACCESS_DENIED",
  DATABASE_ERROR = "DATABASE_ERROR",
}

class MaintenanceActivityRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * Crear nuevo registro de actividad en mantenimiento
   */
  async create(
    maintenanceActivity: MaintenanceActivityCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      const result = await this.db.query(
        "SELECT create_maintenance_activity($1, $2, $3, $4, $5)",
        [
          maintenanceActivity.maintenance_record_id,
          maintenanceActivity.activity_id,
          maintenanceActivity.status,
          maintenanceActivity.observations || null,
          maintenanceActivity.user_id,
        ]
      );

      const response = result.rows[0].create_maintenance_activity;
      return {
        id: response.id,
        created_at: new Date(response.created_at),
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "create", {
        maintenanceActivity,
      });
    }
  }

  /**
   * Obtener registro de actividad en mantenimiento por ID
   */
  async getById(id: string): Promise<MaintenanceActivityBase | null> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_activity_by_id($1)",
        [id]
      );

      const activityData = result.rows[0].get_maintenance_activity_by_id;

      if (!activityData) {
        return null;
      }

      return this.mapToMaintenanceActivity(activityData);
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "getById", { id });
    }
  }

  /**
   * Obtener todas las actividades de un registro de mantenimiento
   */
  async getByMaintenanceRecord(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceActivityBase[]> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_activities_by_maintenance($1, $2)",
        [maintenanceRecordId, userId]
      );

      const activities =
        result.rows[0].get_maintenance_activities_by_maintenance;

      if (!activities || activities.length === 0) {
        return [];
      }

      return activities.map((activity: MaintenanceActivityBase) =>
        this.mapToMaintenanceActivity(activity)
      );
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "getByMaintenanceRecord", {
        maintenanceRecordId,
        userId,
      });
    }
  }

  /**
   * Obtener actividades de mantenimiento con detalles de la actividad
   */
  async getByMaintenanceRecordWithDetails(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceActivityWithDetails[]> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_activities_with_details($1, $2)",
        [maintenanceRecordId, userId]
      );

      const activities = result.rows[0].get_maintenance_activities_with_details;

      if (!activities || activities.length === 0) {
        return [];
      }

      return activities.map((activity: MaintenanceActivityWithDetails) =>
        this.mapToMaintenanceActivityWithDetails(activity)
      );
    } catch (err) {
      this.handleError(
        err as GlobalErrorResponse,
        "getByMaintenanceRecordWithDetails",
        {
          maintenanceRecordId,
          userId,
        }
      );
    }
  }

  /**
   * Obtener todos los registros de actividades de mantenimiento de un usuario con paginación
   */
  async getAll(
    limit: number = 100,
    offset: number = 0,
    userId: string
  ): Promise<MultiMaintenanceActivity> {
    try {
      const result = await this.db.query(
        "SELECT get_all_maintenance_activities($1, $2, $3)",
        [userId, limit, offset]
      );

      const response = result.rows[0].get_all_maintenance_activities;

      const data: MaintenanceActivityBase[] = response.data.map(
        (activity: MaintenanceActivityBase) =>
          this.mapToMaintenanceActivity(activity)
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data,
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "getAll", {
        limit,
        offset,
        userId,
      });
    }
  }

  /**
   * Actualizar registro de actividad en mantenimiento
   */
  async update(
    maintenanceActivity: MaintenanceActivityUpdate
  ): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT update_maintenance_activity($1, $2, $3, $4, $5, $6)",
        [
          maintenanceActivity.id,
          maintenanceActivity.maintenance_record_id || null,
          maintenanceActivity.activity_id || null,
          maintenanceActivity.status !== undefined
            ? maintenanceActivity.status
            : null,
          maintenanceActivity.observations || null,
          maintenanceActivity.user_id,
        ]
      );

      const response = result.rows[0].update_maintenance_activity;
      return {
        id: response.id,
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "update", {
        maintenanceActivity,
      });
    }
  }

  /**
   * Eliminar registro de actividad en mantenimiento
   */
  async delete(
    deleteActivity: DeleteMaintenanceActivity
  ): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT delete_maintenance_activity($1, $2)",
        [deleteActivity.id, deleteActivity.user_id]
      );

      const response = result.rows[0].delete_maintenance_activity;
      return {
        id: response.id,
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "delete", {
        id: deleteActivity.id,
        userId: deleteActivity.user_id,
      });
    }
  }

  /**
   * Marcar una actividad como completada
   */
  async complete(
    id: string,
    userId: string,
    observations?: string
  ): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT complete_maintenance_activity($1, $2, $3)",
        [id, observations || null, userId]
      );

      const response = result.rows[0].complete_maintenance_activity;
      return {
        id: response.id,
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "complete", {
        id,
        userId,
        observations,
      });
    }
  }

  /**
   * Marcar una actividad como pendiente
   */
  async markPending(
    id: string,
    userId: string
  ): Promise<{ id: string; completed: boolean }> {
    try {
      const result = await this.db.query(
        "SELECT mark_maintenance_activity_pending($1, $2)",
        [id, userId]
      );

      const response = result.rows[0].mark_maintenance_activity_pending;
      return {
        id: response.id,
        completed: response.completed,
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "markPending", {
        id,
        userId,
      });
    }
  }

  /**
   * Obtener el progreso de un mantenimiento
   */
  async getMaintenanceProgress(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceActivityProgress> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_progress($1, $2)",
        [maintenanceRecordId, userId]
      );

      const progress = result.rows[0].get_maintenance_progress;

      return {
        maintenance_record_id: progress.maintenance_record_id,
        total_activities: progress.total_activities,
        completed_activities: progress.completed_activities,
        pending_activities: progress.pending_activities,
        progress_percentage: progress.progress_percentage,
        is_complete: progress.is_complete,
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "getMaintenanceProgress", {
        maintenanceRecordId,
        userId,
      });
    }
  }

  /**
   * Obtener actividades pendientes de un usuario
   */
  async getPendingActivities(
    userId: string,
    limit: number = 50
  ): Promise<PendingMaintenanceActivity[]> {
    try {
      const result = await this.db.query(
        "SELECT get_pending_maintenance_activities($1, $2)",
        [userId, limit]
      );

      const pendingActivities =
        result.rows[0].get_pending_maintenance_activities;

      if (!pendingActivities || pendingActivities.length === 0) {
        return [];
      }

      return pendingActivities.map((activity: PendingMaintenanceActivity) => ({
        id: activity.id,
        maintenance_record_id: activity.maintenance_record_id,
        activity_id: activity.activity_id,
        status: activity.status,
        observations: activity.observations,
        created_at: new Date(activity.created_at),
        updated_at: activity.updated_at
          ? new Date(activity.updated_at)
          : undefined,
        activity: activity.activity,
        maintenance_info: activity.maintenance_info,
      }));
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "getPendingActivities", {
        userId,
        limit,
      });
    }
  }

  /**
   * Obtener estadísticas de actividades de mantenimiento
   */
  async getActivitiesStats(userId: string): Promise<MaintenanceActivityStats> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_activities_stats($1)",
        [userId]
      );

      const stats = result.rows[0].get_maintenance_activities_stats;

      return {
        total_activities: stats.total_activities,
        completed_activities: stats.completed_activities,
        pending_activities: stats.pending_activities,
        completion_rate_percentage: stats.completion_rate_percentage,
        most_common_activities: stats.most_common_activities || [],
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "getActivitiesStats", {
        userId,
      });
    }
  }

  async bulkCreate(bulkCreate: BulkMaintenanceActivityUpdate): Promise<{
    maintenance_record_id: string;
    created_activities: { id: string; created_at: Date }[];
  }> {
    try {
      const result = await this.db.query(
        "SELECT bulk_create_maintenance_activities($1, $2, $3)",
        [
          bulkCreate.maintenance_record_id,
          JSON.stringify(bulkCreate.activities),
          bulkCreate.user_id,
        ]
      );

      const response = result.rows[0].bulk_create_maintenance_activities;
      return {
        maintenance_record_id: response.maintenance_record_id,
        created_activities: response.created_activities,
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "bulkCreate", {
        bulkCreate,
      });
    }
  }

  /**
   * Actualización masiva de actividades para un mantenimiento
   */
  async bulkUpdate(bulkUpdate: BulkMaintenanceActivityUpdate): Promise<{
    maintenance_record_id: string;
    processed_activities: { id: string; created_at: Date }[];
  }> {
    try {
      const result = await this.db.query(
        "SELECT bulk_update_maintenance_activities($1, $2, $3)",
        [
          bulkUpdate.maintenance_record_id,
          JSON.stringify(bulkUpdate.activities),
          bulkUpdate.user_id,
        ]
      );

      const response = result.rows[0].bulk_update_maintenance_activities;
      return {
        maintenance_record_id: response.maintenance_record_id,
        processed_activities: response.processed_activities,
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "bulkUpdate", {
        bulkUpdate,
      });
    }
  }

  /**
   * Verificar si existe un registro de actividad en mantenimiento
   */
  async exists(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        `
        SELECT EXISTS(
          SELECT 1 
          FROM mnt.maintenance_activities ma
          INNER JOIN mnt.maintenance_records mr ON ma.maintenance_record_id = mr.id
          WHERE ma.id = $1 AND mr.user_id = $2
        ) as exists
      `,
        [id, userId]
      );

      return result.rows[0].exists;
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "exists", { id, userId });
    }
  }

  /**
   * Verificar si una actividad ya está en un mantenimiento
   */
  async existsActivityInMaintenance(
    maintenanceRecordId: string,
    activityId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const result = await this.db.query(
        `
        SELECT EXISTS(
          SELECT 1 
          FROM mnt.maintenance_activities ma
          INNER JOIN mnt.maintenance_records mr ON ma.maintenance_record_id = mr.id
          WHERE ma.maintenance_record_id = $1 
            AND ma.activity_id = $2 
            AND mr.user_id = $3
        ) as exists
      `,
        [maintenanceRecordId, activityId, userId]
      );

      return result.rows[0].exists;
    } catch (err) {
      this.handleError(
        err as GlobalErrorResponse,
        "existsActivityInMaintenance",
        {
          maintenanceRecordId,
          activityId,
          userId,
        }
      );
    }
  }

  /**
   * Obtener actividades completadas de un mantenimiento
   */
  async getCompletedActivities(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceActivityBase[]> {
    try {
      const result = await this.db.query(
        `
        SELECT json_agg(
          json_build_object(
            'id', ma.id,
            'maintenance_record_id', ma.maintenance_record_id,
            'activity_id', ma.activity_id,
            'status', ma.status,
            'observations', ma.observations,
            'created_at', ma.created_at,
            'updated_at', ma.updated_at
          )
        ) as activities
        FROM mnt.maintenance_activities ma
        INNER JOIN mnt.maintenance_records mr ON ma.maintenance_record_id = mr.id
        WHERE ma.maintenance_record_id = $1 
          AND ma.status = 'completed' 
          AND mr.user_id = $2
        ORDER BY ma.updated_at DESC
      `,
        [maintenanceRecordId, userId]
      );

      const activities = result.rows[0].activities || [];
      return activities.map((activity: MaintenanceActivityBase) =>
        this.mapToMaintenanceActivity(activity)
      );
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "getCompletedActivities", {
        maintenanceRecordId,
        userId,
      });
    }
  }

  /**
   * Buscar actividades por observaciones
   */
  async searchByObservations(
    query: string,
    userId: string,
    limit: number = 50
  ): Promise<MaintenanceActivityWithDetails[]> {
    try {
      const result = await this.db.query(
        `
        SELECT json_agg(
          json_build_object(
            'id', ma.id,
            'maintenance_record_id', ma.maintenance_record_id,
            'activity_id', ma.activity_id,
            'status', ma.status,
            'observations', ma.observations,
            'created_at', ma.created_at,
            'updated_at', ma.updated_at,
            'activity', json_build_object(
              'id', a.id,
              'name', a.name,
              'description', a.description,
              'estimated_duration_minutes', a.estimated_duration_minutes,
              'category', a.category,
              'difficulty_level', a.difficulty_level,
              'required_tools', a.required_tools,
              'safety_requirements', a.safety_requirements
            ),
            'completion_status', CASE
              WHEN ma.completed THEN 'completed'
              ELSE 'pending'
            END
          )
        ) as activities
        FROM mnt.maintenance_activities ma
        INNER JOIN mnt.activities a ON ma.activity_id = a.id
        INNER JOIN mnt.maintenance_records mr ON ma.maintenance_record_id = mr.id
        WHERE mr.user_id = $1 
          AND ma.observations ILIKE $2
        ORDER BY ma.created_at DESC
        LIMIT $3
      `,
        [userId, `%${query}%`, limit]
      );

      const activities = result.rows[0].activities || [];
      return activities.map((activity: MaintenanceActivityWithDetails) =>
        this.mapToMaintenanceActivityWithDetails(activity)
      );
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "searchByObservations", {
        query,
        userId,
        limit,
      });
    }
  }

  /**
   * Operación con transacción
   */
  async withTransaction<T>(
    operation: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Mapear datos de la base de datos a MaintenanceActivityBase
   */
  private mapToMaintenanceActivity(
    data: MaintenanceActivityBase
  ): MaintenanceActivityBase {
    return {
      id: data.id,
      maintenance_record_id: data.maintenance_record_id,
      activity_id: data.activity_id,
      status: data.status,
      observations: data.observations,
      created_at: new Date(data.created_at),
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }

  /**
   * Mapear datos de la base de datos a MaintenanceActivityWithDetails
   */
  private mapToMaintenanceActivityWithDetails(
    data: MaintenanceActivityWithDetails
  ): MaintenanceActivityWithDetails {
    const baseActivity = this.mapToMaintenanceActivity(data);

    return {
      ...baseActivity,
      activity: data.activity
        ? {
            id: data.activity.id,
            name: data.activity.name,
            description: data.activity.description,
            estimated_duration_minutes:
              data.activity.estimated_duration_minutes,
            category: data.activity.category,
            difficulty_level: data.activity.difficulty_level,
            required_tools: data.activity.required_tools,
            safety_requirements: data.activity.safety_requirements,
            created_at: new Date(data.activity.created_at || data.created_at),
            updated_at: data.activity.updated_at
              ? new Date(data.activity.updated_at)
              : undefined,
            user_id: data.activity.user_id,
          }
        : undefined,
      completion_status: data.completion_status,
    };
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(
    err: GlobalErrorResponse,
    operation: string,
    context?: unknown
  ): never {
    // Log estructurado del error
    console.error({
      operation: `maintenance_activity.${operation}`,
      error: err.message,
      context,
      stack: err.stack,
    });

    if (err instanceof MaintenanceActivityError) {
      throw err;
    }

    // Manejo de errores específicos de PostgreSQL
    if (
      err.message?.includes("Maintenance record with ID") &&
      err.message?.includes("not found")
    ) {
      throw new MaintenanceActivityError(
        MaintenanceActivityErrorCodes.MAINTENANCE_RECORD_NOT_FOUND,
        "Maintenance record not found or access denied"
      );
    }

    if (
      err.message?.includes("Activity with ID") &&
      err.message?.includes("not found")
    ) {
      throw new MaintenanceActivityError(
        MaintenanceActivityErrorCodes.ACTIVITY_NOT_FOUND,
        "Activity not found or access denied"
      );
    }

    if (
      err.message?.includes(
        "Activity already exists in this maintenance record"
      ) ||
      err.message?.includes(
        "Activity already exists in the target maintenance record"
      )
    ) {
      throw new MaintenanceActivityError(
        MaintenanceActivityErrorCodes.DUPLICATE_ACTIVITY,
        "Activity already exists in this maintenance record"
      );
    }

    if (
      err.message?.includes("Maintenance activity with ID") &&
      err.message?.includes("not found")
    ) {
      throw new MaintenanceActivityError(
        MaintenanceActivityErrorCodes.NOT_FOUND,
        "Maintenance activity not found"
      );
    }

    // Error genérico de base de datos
    throw new MaintenanceActivityError(
      MaintenanceActivityErrorCodes.DATABASE_ERROR,
      `Database operation failed: ${err.message}`
    );
  }
}

export const maintenanceActivityRepository =
  new MaintenanceActivityRepository();
