import { pool } from "@/lib/supabase";
import { Pool } from "pg";
import {
  MaintenanceActivityBase,
  MaintenanceActivityWithDetails,
  MaintenanceActivityCreate,
  MaintenanceActivityUpdate,
  MultiMaintenanceActivity,
  DeleteMaintenanceActivity,
  BulkMaintenanceActivityUpdate,
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
        "SELECT mnt.create_maintenance_activity($1, $2, $3, $4, $5, $6)",
        [
          maintenanceActivity.maintenance_record_id,
          maintenanceActivity.activity_id,
          maintenanceActivity.status,
          maintenanceActivity.observations || null,
          maintenanceActivity.priority || "no",
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
        "SELECT mnt.get_maintenance_activity_by_id($1)",
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
   * Obtener actividades de mantenimiento con detalles de la actividad
   */
  async getByMaintenanceRecordWithDetails(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceActivityWithDetails[]> {
    try {
      const result = await this.db.query(
        "SELECT mnt.get_maintenance_activities_with_details($1, $2)",
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
        "SELECT mnt.get_all_maintenance_activities($1, $2, $3)",
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
        "SELECT mnt.update_maintenance_activity($1, $2, $3, $4, $5, $6)",
        [
          maintenanceActivity.id,
          maintenanceActivity.maintenance_record_id || null,
          maintenanceActivity.activity_id || null,
          maintenanceActivity.status !== undefined
            ? maintenanceActivity.status
            : null,
          maintenanceActivity.priority !== undefined
            ? maintenanceActivity.priority
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
        "SELECT mnt.delete_maintenance_activity($1, $2)",
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

  async bulkCreate(bulkCreate: BulkMaintenanceActivityUpdate): Promise<{
    maintenance_record_id: string;
    created_activities: { id: string; created_at: Date }[];
  }> {
    try {
      const result = await this.db.query(
        "SELECT mnt.bulk_create_maintenance_activities($1, $2, $3)",
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
      console.log("Bulk update activities:", bulkUpdate);
      const result = await this.db.query(
        "SELECT mnt.bulk_update_maintenance_activities($1, $2, $3)",
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
   * Mapear datos de la base de datos a MaintenanceActivityBase
   */
  private mapToMaintenanceActivity(
    data: MaintenanceActivityBase
  ): MaintenanceActivityBase {
    return {
      id: data.id,
      maintenance_record_id: data.maintenance_record_id,
      activity_id: data.activity_id,
      priority: data.priority,
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
