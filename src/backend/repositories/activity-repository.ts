import { Pool } from "pg";
import {
  ActivityBase,
  ActivityCreate,
  ActivityUpdate,
  MultiActivity,
  DeleteActivity,
  ActivityWithMaintenanceType,
  ActivityWithUsage,
  ActivityStats,
  ActivityGroupedByType,
  AdvancedActivitySearch,
} from "@/types/activity";
import { pool } from "@/lib/supabase";

class ActivityRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * Crear nueva actividad
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
          activity.maintenance_type_id,
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
   * Obtener actividad por ID
   */
  async getById(id: string): Promise<ActivityBase | null> {
    try {
      const result = await this.db.query("SELECT get_activity_by_id($1)", [id]);

      const activityData = result.rows[0].get_activity_by_id;

      if (!activityData) {
        return null;
      }

      return {
        id: activityData.id,
        name: activityData.name,
        description: activityData.description,
        maintenance_type_id: activityData.maintenance_type_id,
        created_at: new Date(activityData.created_at),
        updated_at: activityData.updated_at
          ? new Date(activityData.updated_at)
          : undefined,
        user_id: activityData.user_id,
      };
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

      const data: ActivityBase[] = response.data.map(
        (activity: ActivityBase) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description,
          maintenance_type_id: activity.maintenance_type_id,
          created_at: new Date(activity.created_at),
          updated_at: activity.updated_at
            ? new Date(activity.updated_at)
            : undefined,
          user_id: activity.user_id,
        })
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
   * Actualizar actividad
   */
  async update(activity: ActivityUpdate): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT update_activity($1, $2, $3, $4)",
        [
          activity.id,
          activity.name,
          activity.description,
          activity.maintenance_type_id,
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

      return activities.map((activity: ActivityBase) => ({
        id: activity.id,
        name: activity.name,
        description: activity.description,
        maintenance_type_id: activity.maintenance_type_id,
        created_at: new Date(activity.created_at),
        updated_at: activity.updated_at
          ? new Date(activity.updated_at)
          : undefined,
        user_id: activity.user_id,
      }));
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
   * Buscar actividades por nombre
   */
  async searchByName(
    searchTerm: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MultiActivity & { search_term: string }> {
    try {
      const result = await this.db.query(
        "SELECT search_activities_by_name($1, $2, $3, $4)",
        [searchTerm, userId, limit, offset]
      );

      const response = result.rows[0].search_activities_by_name;

      const data: ActivityBase[] = response.data.map(
        (activity: ActivityBase) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description,
          maintenance_type_id: activity.maintenance_type_id,
          created_at: new Date(activity.created_at),
          updated_at: activity.updated_at
            ? new Date(activity.updated_at)
            : undefined,
          user_id: activity.user_id,
        })
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        search_term: response.search_term,
        data,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al buscar activities por nombre:", err.stack);
      } else {
        console.error("Error al buscar activities por nombre:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener actividades con información del tipo de mantenimiento
   */
  async getWithMaintenanceType(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<MultiActivity & { data: ActivityWithMaintenanceType[] }> {
    try {
      const result = await this.db.query(
        "SELECT get_activities_with_maintenance_type($1, $2, $3)",
        [userId, limit, offset]
      );

      const response = result.rows[0].get_activities_with_maintenance_type;

      const data: ActivityWithMaintenanceType[] = response.data.map(
        (activity: ActivityWithMaintenanceType) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description,
          maintenance_type_id: activity.maintenance_type_id,
          created_at: new Date(activity.created_at),
          updated_at: activity.updated_at
            ? new Date(activity.updated_at)
            : undefined,
          user_id: activity.user_id,
          maintenance_type: activity.maintenance_type,
        })
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

  /**
   * Obtener actividades más utilizadas
   */
  async getMostUsed(
    userId: string,
    limit: number = 10
  ): Promise<ActivityWithUsage[]> {
    try {
      const result = await this.db.query(
        "SELECT get_most_used_activities($1, $2)",
        [userId, limit]
      );

      const activities = result.rows[0].get_most_used_activities;

      if (!activities || activities.length === 0) {
        return [];
      }

      return activities.map((activity: ActivityWithUsage) => ({
        id: activity.id,
        name: activity.name,
        description: activity.description,
        maintenance_type_id: activity.maintenance_type_id,
        created_at: new Date(activity.created_at),
        updated_at: activity.updated_at
          ? new Date(activity.updated_at)
          : undefined,
        user_id: activity.user_id,
        usage_count: activity.usage_count,
        completion_rate: activity.completion_rate,
        last_used: activity.last_used
          ? new Date(activity.last_used)
          : undefined,
      }));
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener activities más utilizadas:", err.stack);
      } else {
        console.error("Error al obtener activities más utilizadas:", err);
      }
      throw err;
    }
  }

  /**
   * Verificar si existe nombre en tipo de mantenimiento
   */
  async nameExistsInType(
    name: string,
    maintenanceTypeId: string,
    userId: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const result = await this.db.query(
        "SELECT activity_name_exists_in_type($1, $2, $3, $4)",
        [name, maintenanceTypeId, userId, excludeId || null]
      );

      return result.rows[0].activity_name_exists_in_type;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al verificar nombre en tipo:", err.stack);
      } else {
        console.error("Error al verificar nombre en tipo:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener estadísticas de actividades
   */
  async getStats(userId: string): Promise<ActivityStats> {
    try {
      const result = await this.db.query("SELECT get_activities_stats($1)", [
        userId,
      ]);

      const stats = result.rows[0].get_activities_stats;

      return {
        total_activities: stats.total_activities,
        activities_by_maintenance_type:
          stats.activities_by_maintenance_type || {},
        activities_with_description: stats.activities_with_description,
        activities_without_description: stats.activities_without_description,
        most_used_activity: stats.most_used_activity
          ? {
              ...stats.most_used_activity,
              created_at: new Date(stats.most_used_activity.created_at),
              updated_at: stats.most_used_activity.updated_at
                ? new Date(stats.most_used_activity.updated_at)
                : undefined,
            }
          : null,
        latest_activity: stats.latest_activity
          ? {
              ...stats.latest_activity,
              created_at: new Date(stats.latest_activity.created_at),
              updated_at: stats.latest_activity.updated_at
                ? new Date(stats.latest_activity.updated_at)
                : undefined,
            }
          : null,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error(
          "Error al obtener estadísticas de activities:",
          err.stack
        );
      } else {
        console.error("Error al obtener estadísticas de activities:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener actividades agrupadas por tipo de mantenimiento
   */
  async getGroupedByType(userId: string): Promise<ActivityGroupedByType[]> {
    try {
      const result = await this.db.query(
        "SELECT get_activities_grouped_by_type($1)",
        [userId]
      );

      const groups = result.rows[0].get_activities_grouped_by_type;

      if (!groups || groups.length === 0) {
        return [];
      }

      return groups.map((group: ActivityGroupedByType) => ({
        maintenance_type: group.maintenance_type,
        activities: group.activities.map((activity: ActivityBase) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description,
          maintenance_type_id: group.maintenance_type.id,
          created_at: new Date(activity.created_at),
          updated_at: activity.updated_at
            ? new Date(activity.updated_at)
            : undefined,
          user_id: userId, // Se infiere del contexto
        })),
        activity_count: group.activity_count,
      }));
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener activities agrupadas:", err.stack);
      } else {
        console.error("Error al obtener activities agrupadas:", err);
      }
      throw err;
    }
  }

  /**
   * Búsqueda avanzada de actividades
   */
  async advancedSearch(
    filters: AdvancedActivitySearch,
    userId: string
  ): Promise<
    MultiActivity & {
      filters: AdvancedActivitySearch;
      data: ActivityWithMaintenanceType[];
    }
  > {
    try {
      const result = await this.db.query(
        "SELECT advanced_search_activities($1, $2, $3, $4, $5, $6)",
        [
          filters.searchTerm || null,
          filters.maintenanceTypeId || null,
          filters.hasDescription || null,
          userId,
          filters.limit || 50,
          filters.offset || 0,
        ]
      );

      const response = result.rows[0].advanced_search_activities;

      const data: ActivityWithMaintenanceType[] = response.data.map(
        (activity: ActivityWithMaintenanceType) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description,
          maintenance_type_id: activity.maintenance_type_id,
          created_at: new Date(activity.created_at),
          updated_at: activity.updated_at
            ? new Date(activity.updated_at)
            : undefined,
          user_id: activity.user_id,
          maintenance_type: activity.maintenance_type,
        })
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        filters: response.filters,
        data,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error en búsqueda avanzada de activities:", err.stack);
      } else {
        console.error("Error en búsqueda avanzada de activities:", err);
      }
      throw err;
    }
  }

  // ==================== FUNCIONES AVANZADAS ====================

  /**
   * Crear plantilla de actividades para tipo de mantenimiento
   */
  async createTemplate(
    maintenanceTypeId: string,
    userId: string
  ): Promise<{
    maintenance_type_id: string;
    maintenance_type_name: string;
    activities_created: number;
    template_activities: string[];
  }> {
    try {
      const result = await this.db.query(
        "SELECT create_activity_template_from_type($1, $2)",
        [maintenanceTypeId, userId]
      );

      return result.rows[0].create_activity_template_from_type;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al crear plantilla de activities:", err.stack);
      } else {
        console.error("Error al crear plantilla de activities:", err);
      }
      throw err;
    }
  }

  /**
   * Duplicar actividades entre tipos de mantenimiento
   */
  async duplicateBetweenTypes(
    sourceMaintenanceTypeId: string,
    targetMaintenanceTypeId: string,
    userId: string,
    prefix?: string
  ): Promise<{
    source_maintenance_type_id: string;
    target_maintenance_type_id: string;
    activities_copied: number;
    prefix_used: string | null;
  }> {
    try {
      const result = await this.db.query(
        "SELECT duplicate_activities_between_types($1, $2, $3, $4)",
        [
          sourceMaintenanceTypeId,
          targetMaintenanceTypeId,
          userId,
          prefix || null,
        ]
      );

      return result.rows[0].duplicate_activities_between_types;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al duplicar activities entre tipos:", err.stack);
      } else {
        console.error("Error al duplicar activities entre tipos:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener actividades recomendadas
   */
  /* async getRecommended(
    maintenanceTypeId: string,
    userId: string,
    limit: number = 10
  ): Promise<ActivityWithUsage[]> {
    try {
      const result = await this.db.query(
        "SELECT get_recommended_activities($1, $2, $3)",
        [maintenanceTypeId, userId, limit]
      );

      const activities = result.rows[0].get_recommended_activities;

      if (!activities || activities.length === 0) {
        return [];
      }

      return activities.map((activity: ActivityWithUsage) => ({
        id: activity.id,
        name: activity.name,
        description: activity.description,
        maintenance_type_id: maintenanceTypeId,
        created_at: new Date(activity.created_at),
        updated_at: activity.updated_at
          ? new Date(activity.updated_at)
          : undefined,
        user_id: userId,
        usage_count: activity.usage_frequency,
        completion_rate: activity.success_rate,
        last_used: activity.last_used
          ? new Date(activity.last_used)
          : undefined,
      }));
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener activities recomendadas:", err.stack);
      } else {
        console.error("Error al obtener activities recomendadas:", err);
      }
      throw err;
    }
  } */

  /**
   * Obtener actividades problemáticas
   */
  /* async getProblematic(
    userId: string,
    completionThreshold: number = 70.0,
    minUsage: number = 5
  ): Promise<ActivityWithUsage[]> {
    try {
      const result = await this.db.query(
        "SELECT get_problematic_activities($1, $2, $3)",
        [userId, completionThreshold, minUsage]
      );

      const activities = result.rows[0].get_problematic_activities;

      if (!activities || activities.length === 0) {
        return [];
      }

      return activities.map((activity: any) => ({
        id: activity.id,
        name: activity.name,
        description: activity.description,
        maintenance_type_id: activity.maintenance_type_id,
        created_at: new Date(activity.created_at),
        updated_at: activity.updated_at
          ? new Date(activity.updated_at)
          : undefined,
        user_id: activity.user_id,
        usage_count: activity.usage_count,
        completion_rate: activity.completion_rate,
        last_used: undefined, // No disponible en esta consulta
      }));
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener activities problemáticas:", err.stack);
      } else {
        console.error("Error al obtener activities problemáticas:", err);
      }
      throw err;
    }
  } */

  /**
   * Validar consistencia de actividades
   */
  async validateConsistency(userId: string): Promise<{
    is_consistent: boolean;
    issues: {
      orphaned_activities: number;
      activities_without_type: number;
      duplicate_names: number;
      empty_names: number;
    };
    total_issues: number;
    recommendations: string[];
  }> {
    try {
      const result = await this.db.query(
        "SELECT validate_activities_consistency($1)",
        [userId]
      );

      return result.rows[0].validate_activities_consistency;
    } catch (err) {
      if (err instanceof Error) {
        console.error(
          "Error al validar consistencia de activities:",
          err.stack
        );
      } else {
        console.error("Error al validar consistencia de activities:", err);
      }
      throw err;
    }
  }
}

export const activityRepository = new ActivityRepository();
