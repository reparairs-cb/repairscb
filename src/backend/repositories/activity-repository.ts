import { Pool } from "pg";
import {
  ActivityBase,
  ActivityCreate,
  ActivityUpdate,
  MultiActivity,
  DeleteActivity,
  ActivityMaintenanceTypeAdd,
  ActivityMaintenanceTypeRemove,
  ActivityMaintenanceTypeResult,
} from "@/types/activity";
import { pool } from "@/lib/supabase";

class ActivityRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * Mapear datos de actividad desde la base de datos
   */
  private mapActivityData(activityData: ActivityBase): ActivityBase {
    return {
      id: activityData.id,
      name: activityData.name,
      description: activityData.description,
      created_at: new Date(activityData.created_at),
      updated_at: activityData.updated_at
        ? new Date(activityData.updated_at)
        : undefined,
      user_id: activityData.user_id,
      maintenance_types: activityData.maintenance_types || [],
    };
  }

  /**
   * Crear nueva actividad con tipos de mantenimiento
   */
  async create(
    activity: ActivityCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      const result = await this.db.query(
        "SELECT create_activity($1, $2, $3, $4)",
        [
          activity.name,
          activity.description || null,
          activity.maintenance_type_ids,
          activity.user_id,
        ]
      );

      const response = result.rows[0].create_activity;
      return {
        id: response.id,
        created_at: new Date(response.created_at),
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al insertar activity:", err.stack);
      } else {
        console.error("Error al insertar activity:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener actividad por ID con todos sus tipos de mantenimiento
   */
  async getById(id: string): Promise<ActivityBase | null> {
    try {
      const result = await this.db.query("SELECT get_activity_by_id($1)", [id]);

      const activityData = result.rows[0].get_activity_by_id;

      if (!activityData) {
        return null;
      }

      return this.mapActivityData(activityData);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener activity por ID:", err.stack);
      } else {
        console.error("Error al obtener activity por ID:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener todas las actividades con paginación
   */
  async getAll(
    limit: number = 10,
    offset: number = 0,
    userId: string
  ): Promise<MultiActivity> {
    try {
      const result = await this.db.query(
        "SELECT get_all_activities($1, $2, $3)",
        [userId, limit, offset]
      );

      const response = result.rows[0].get_all_activities;

      const data: ActivityBase[] = response.data.map((activity: ActivityBase) =>
        this.mapActivityData(activity)
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener activities paginados:", err.stack);
      } else {
        console.error("Error al obtener activities paginados:", err);
      }
      throw err;
    }
  }

  /**
   * Actualizar actividad y sus tipos de mantenimiento
   */
  async update(activity: ActivityUpdate): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT update_activity($1, $2, $3, $4)",
        [
          activity.id,
          activity.name,
          activity.description,
          activity.maintenance_type_ids || null,
        ]
      );

      const response = result.rows[0].update_activity;
      return {
        id: response.id,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al actualizar activity:", err.stack);
      } else {
        console.error("Error al actualizar activity:", err);
      }
      throw err;
    }
  }

  /**
   * Eliminar actividad
   */
  async delete(deleteActivity: DeleteActivity): Promise<{ id: string }> {
    try {
      const result = await this.db.query("SELECT delete_activity($1)", [
        deleteActivity.id,
      ]);

      const response = result.rows[0].delete_activity;
      return {
        id: response.id,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al eliminar activity:", err.stack);
      } else {
        console.error("Error al eliminar activity:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener actividades por tipo de mantenimiento
   */
  async getByMaintenanceType(
    maintenanceTypeId: string,
    userId: string
  ): Promise<ActivityBase[]> {
    try {
      const result = await this.db.query(
        "SELECT get_activities_by_maintenance_type($1, $2)",
        [maintenanceTypeId, userId]
      );

      const activities = result.rows[0].get_activities_by_maintenance_type;

      if (!activities || activities.length === 0) {
        return [];
      }

      return activities.map((activity: ActivityBase) =>
        this.mapActivityData(activity)
      );
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener activities por tipo:", err.stack);
      } else {
        console.error("Error al obtener activities por tipo:", err);
      }
      throw err;
    }
  }

  /**
   * Verificar si existe nombre en actividades del usuario
   */
  async nameExists(
    name: string,
    userId: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const result = await this.db.query(
        "SELECT activity_name_exists($1, $2, $3)",
        [name, userId, excludeId || null]
      );

      return result.rows[0].activity_name_exists;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al verificar nombre:", err.stack);
      } else {
        console.error("Error al verificar nombre:", err);
      }
      throw err;
    }
  }

  /**
   * Verificar si la actividad existe en registros de mantenimiento
   */
  async existsInMaintenanceRecord(
    activityId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const result = await this.db.query(
        "SELECT activity_exists_in_maintenance($1, $2)",
        [activityId, userId]
      );

      const res = result.rows[0].activity_exists_in_maintenance;
      return res.exists;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al verificar existencia de actividad:", err.stack);
      } else {
        console.error("Error al verificar existencia de actividad:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener actividades con información del tipo de mantenimiento
   * (ActivityWithMaintenanceType es ahora equivalente a ActivityBase)
   */
  async getWithMaintenanceType(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<MultiActivity & { data: ActivityBase[] }> {
    try {
      const result = await this.db.query(
        "SELECT get_activities_with_maintenance_type($1, $2, $3)",
        [userId, limit, offset]
      );

      const response = result.rows[0].get_activities_with_maintenance_type;

      const data: ActivityBase[] = response.data.map((activity: ActivityBase) =>
        this.mapActivityData(activity)
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error(
          "Error al obtener activities con tipo de mantenimiento:",
          err.stack
        );
      } else {
        console.error(
          "Error al obtener activities con tipo de mantenimiento:",
          err
        );
      }
      throw err;
    }
  }

  // ==================== FUNCIONES PARA GESTIÓN DE TIPOS ====================

  /**
   * Agregar tipos de mantenimiento a una actividad existente
   */
  async addMaintenanceTypes(
    data: ActivityMaintenanceTypeAdd,
    userId: string
  ): Promise<ActivityMaintenanceTypeResult> {
    try {
      const result = await this.db.query(
        "SELECT add_maintenance_types_to_activity($1, $2, $3)",
        [data.activity_id, data.maintenance_type_ids, userId]
      );

      return result.rows[0].add_maintenance_types_to_activity;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al agregar tipos a actividad:", err.stack);
      } else {
        console.error("Error al agregar tipos a actividad:", err);
      }
      throw err;
    }
  }

  /**
   * Remover tipos de mantenimiento de una actividad
   */
  async removeMaintenanceTypes(
    data: ActivityMaintenanceTypeRemove,
    userId: string
  ): Promise<ActivityMaintenanceTypeResult> {
    try {
      const result = await this.db.query(
        "SELECT remove_maintenance_types_from_activity($1, $2, $3)",
        [data.activity_id, data.maintenance_type_ids, userId]
      );

      return result.rows[0].remove_maintenance_types_from_activity;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al remover tipos de actividad:", err.stack);
      } else {
        console.error("Error al remover tipos de actividad:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener actividades que tienen múltiples tipos específicos
   */
  async getByMultipleMaintenanceTypes(
    maintenanceTypeIds: string[],
    userId: string,
    matchAll: boolean = false
  ): Promise<ActivityBase[]> {
    try {
      const result = await this.db.query(
        "SELECT get_activities_by_multiple_types($1, $2, $3)",
        [maintenanceTypeIds, userId, matchAll]
      );

      const activities = result.rows[0].get_activities_by_multiple_types;

      if (!activities || activities.length === 0) {
        return [];
      }

      return activities.map((activity: ActivityBase) =>
        this.mapActivityData(activity)
      );
    } catch (err) {
      if (err instanceof Error) {
        console.error(
          "Error al obtener activities por múltiples tipos:",
          err.stack
        );
      } else {
        console.error("Error al obtener activities por múltiples tipos:", err);
      }
      throw err;
    }
  }
}

export const activityRepository = new ActivityRepository();
