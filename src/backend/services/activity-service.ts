import { activityRepository } from "../repositories/activity-repository";
import {
  ActivityBase,
  ActivityCreate,
  ActivityUpdate,
  MultiActivity,
  ActivityWithMaintenanceType,
  ActivityWithUsage,
  ActivityStats,
  AdvancedActivitySearch,
  ActivityGroupedByType,
  BulkValidationResult,
} from "@/types/activity";

/**
 * Servicio para gestionar actividades de mantenimiento
 */
class ActivityService {
  private repository = activityRepository;

  constructor() {}

  /**
   * Crear una nueva actividad
   * @param activity - Datos de la actividad a crear
   * @param userId - ID del usuario
   * @returns La actividad creada
   */
  async create(
    activity: ActivityCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      // Validaciones de negocio
      if (!activity.name?.trim()) {
        throw new Error("El nombre de la actividad es requerido");
      }

      if (!activity.maintenance_type_id?.trim()) {
        throw new Error("El tipo de mantenimiento es requerido");
      }

      // Verificar que no exista una actividad con el mismo nombre en el tipo
      const existingByName = await this.repository.nameExistsInType(
        activity.name.trim(),
        activity.maintenance_type_id,
        activity.user_id
      );
      if (existingByName) {
        throw new Error(
          "Ya existe una actividad con ese nombre en este tipo de mantenimiento"
        );
      }

      const activityData: ActivityCreate = {
        ...activity,
        name: activity.name.trim(),
        description: activity.description?.trim() || undefined,
        user_id: activity.user_id.trim(),
      };

      return await this.repository.create(activityData);
    } catch (error) {
      console.error("Error en ActivityService.create:", error);
      throw error;
    }
  }

  /**
   * Obtener una actividad por su ID
   * @param id - ID de la actividad a buscar
   * @param userId - ID del usuario
   * @returns La actividad encontrada o null si no existe
   */
  async getById(id: string, userId: string): Promise<ActivityBase | null> {
    try {
      if (!id?.trim()) {
        throw new Error("El ID de la actividad es requerido");
      }

      const activity = await this.repository.getById(id);

      // Verificar que la actividad pertenezca al usuario
      if (activity && activity.user_id !== userId) {
        return null; // No tiene acceso a esta actividad
      }

      return activity;
    } catch (error) {
      console.error("Error en ActivityService.getById:", error);
      throw error;
    }
  }

  /**
   * Obtener todas las actividades de un usuario con paginación
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @param userId - ID del usuario
   * @returns Lista paginada de actividades
   */
  async getAll(
    limit: number,
    offset: number,
    userId: string
  ): Promise<MultiActivity> {
    try {
      if (offset < 0) {
        throw new Error("El offset no puede ser negativo");
      }

      return await this.repository.getAll(limit, offset, userId);
    } catch (error) {
      console.error("Error en ActivityService.getAll:", error);
      throw error;
    }
  }

  /**
   * Obtener actividades por tipo de mantenimiento
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @returns Lista de actividades del tipo especificado
   */
  async getByMaintenanceType(
    maintenanceTypeId: string,
    userId: string
  ): Promise<ActivityBase[]> {
    try {
      if (!maintenanceTypeId?.trim()) {
        throw new Error("El ID del tipo de mantenimiento es requerido");
      }

      return await this.repository.getByMaintenanceType(
        maintenanceTypeId,
        userId
      );
    } catch (error) {
      console.error("Error en ActivityService.getByMaintenanceType:", error);
      throw error;
    }
  }

  /**
   * Buscar actividades por nombre
   * @param searchTerm - Término de búsqueda
   * @param userId - ID del usuario
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de actividades que coinciden con la búsqueda
   */
  async searchByName(
    searchTerm: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MultiActivity & { search_term: string }> {
    try {
      if (!searchTerm?.trim()) {
        throw new Error("El término de búsqueda es requerido");
      }

      if (limit <= 0 || limit > 100) {
        throw new Error("El límite debe estar entre 1 y 100");
      }

      return await this.repository.searchByName(
        searchTerm.trim(),
        userId,
        limit,
        offset
      );
    } catch (error) {
      console.error("Error en ActivityService.searchByName:", error);
      throw error;
    }
  }

  /**
   * Obtener actividades con información del tipo de mantenimiento
   * @param userId - ID del usuario
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de actividades con información del tipo
   */
  async getWithMaintenanceType(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<MultiActivity & { data: ActivityWithMaintenanceType[] }> {
    try {
      if (limit <= 0 || limit > 100) {
        throw new Error("El límite debe estar entre 1 y 100");
      }

      return await this.repository.getWithMaintenanceType(
        userId,
        limit,
        offset
      );
    } catch (error) {
      console.error("Error en ActivityService.getWithMaintenanceType:", error);
      throw error;
    }
  }

  /**
   * Obtener actividades más utilizadas
   * @param userId - ID del usuario
   * @param limit - Número de actividades a retornar
   * @returns Lista de actividades más utilizadas
   */
  async getMostUsed(
    userId: string,
    limit: number = 10
  ): Promise<ActivityWithUsage[]> {
    try {
      if (limit <= 0 || limit > 50) {
        throw new Error("El límite debe estar entre 1 y 50");
      }

      return await this.repository.getMostUsed(userId, limit);
    } catch (error) {
      console.error("Error en ActivityService.getMostUsed:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de actividades
   * @param userId - ID del usuario
   * @returns Estadísticas detalladas de las actividades
   */
  async getStats(userId: string): Promise<ActivityStats> {
    try {
      return await this.repository.getStats(userId);
    } catch (error) {
      console.error("Error en ActivityService.getStats:", error);
      throw error;
    }
  }

  /**
   * Obtener actividades agrupadas por tipo de mantenimiento
   * @param userId - ID del usuario
   * @returns Actividades organizadas jerárquicamente por tipo
   */
  async getGroupedByType(userId: string): Promise<ActivityGroupedByType[]> {
    try {
      return await this.repository.getGroupedByType(userId);
    } catch (error) {
      console.error("Error en ActivityService.getGroupedByType:", error);
      throw error;
    }
  }

  /**
   * Búsqueda avanzada con múltiples filtros
   * @param filters - Filtros de búsqueda
   * @param userId - ID del usuario
   * @returns Resultados de búsqueda con filtros aplicados
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
      // Validar filtros
      if (
        filters.limit !== undefined &&
        (filters.limit <= 0 || filters.limit > 100)
      ) {
        throw new Error("El límite debe estar entre 1 y 100");
      }

      if (filters.offset !== undefined && filters.offset < 0) {
        throw new Error("El offset no puede ser negativo");
      }

      if (filters.searchTerm !== undefined && !filters.searchTerm.trim()) {
        throw new Error("El término de búsqueda no puede estar vacío");
      }

      // Sanitizar filtros
      const sanitizedFilters = {
        ...filters,
        searchTerm: filters.searchTerm?.trim(),
      };

      return await this.repository.advancedSearch(sanitizedFilters, userId);
    } catch (error) {
      console.error("Error en ActivityService.advancedSearch:", error);
      throw error;
    }
  }

  /**
   * Actualizar una actividad
   * @param activity - Datos de la actividad a actualizar
   * @param userId - ID del usuario
   * @returns El ID de la actividad actualizada
   */
  async update(
    activity: ActivityUpdate,
    userId: string
  ): Promise<{ id: string } | null> {
    try {
      if (!activity.id?.trim()) {
        throw new Error("El ID es requerido para actualizar");
      }

      // Verificar que la actividad existe y pertenece al usuario
      const existing = await this.getById(activity.id, userId);
      if (!existing) {
        throw new Error(
          "Actividad no encontrada o no tiene permisos para modificarla"
        );
      }

      // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre en el tipo
      if (activity.name && activity.name.trim() !== existing.name) {
        const maintenanceTypeId =
          activity.maintenance_type_id || existing.maintenance_type_id;
        const existingByName = await this.repository.nameExistsInType(
          activity.name.trim(),
          maintenanceTypeId,
          userId,
          activity.id
        );
        if (existingByName) {
          throw new Error(
            "Ya existe otra actividad con ese nombre en este tipo de mantenimiento"
          );
        }
      }

      // Sanitizar datos
      const updateData: ActivityUpdate = {
        ...activity,
        name: activity.name?.trim(),
        description: activity.description?.trim(),
      };

      return await this.repository.update(updateData);
    } catch (error) {
      console.error("Error en ActivityService.update:", error);
      throw error;
    }
  }

  /**
   * Eliminar una actividad
   * @param id - ID de la actividad a eliminar
   * @param userId - ID del usuario
   * @returns El ID de la actividad eliminada
   */
  async delete(id: string, userId: string): Promise<{ id: string } | null> {
    try {
      if (!id?.trim()) {
        throw new Error("El ID es requerido");
      }

      // Verificar que la actividad existe y pertenece al usuario
      const existing = await this.getById(id, userId);
      if (!existing) {
        throw new Error(
          "Actividad no encontrada o no tiene permisos para eliminarla"
        );
      }

      // Aquí podrías agregar validaciones adicionales:
      // - Verificar que no esté siendo usada en mantenimientos activos
      // - Verificar que no esté en plantillas importantes

      return await this.repository.delete({ id });
    } catch (error) {
      console.error("Error en ActivityService.delete:", error);
      throw error;
    }
  }

  async existsInMaintenanceRecord(
    activityId: string,
    userId: string
  ): Promise<boolean> {
    try {
      if (!activityId?.trim()) {
        throw new Error("El ID de la actividad es requerido");
      }

      return await this.repository.existsInMaintenanceRecord(
        activityId,
        userId
      );
    } catch (error) {
      console.error(
        "Error en ActivityService.existsInMaintenanceRecord:",
        error
      );
      throw error;
    }
  }

  // ==================== MÉTODOS AVANZADOS ====================

  /**
   * Crear plantilla estándar de actividades para un tipo de mantenimiento
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @returns Resultado de la creación de plantilla
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
      if (!maintenanceTypeId?.trim()) {
        throw new Error("El ID del tipo de mantenimiento es requerido");
      }

      return await this.repository.createTemplate(maintenanceTypeId, userId);
    } catch (error) {
      console.error("Error en ActivityService.createTemplate:", error);
      throw error;
    }
  }

  /**
   * Duplicar actividades entre tipos de mantenimiento
   * @param sourceMaintenanceTypeId - ID del tipo origen
   * @param targetMaintenanceTypeId - ID del tipo destino
   * @param userId - ID del usuario
   * @param prefix - Prefijo opcional para las actividades duplicadas
   * @returns Resultado de la duplicación
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
      if (!sourceMaintenanceTypeId?.trim()) {
        throw new Error("El ID del tipo origen es requerido");
      }

      if (!targetMaintenanceTypeId?.trim()) {
        throw new Error("El ID del tipo destino es requerido");
      }

      if (sourceMaintenanceTypeId === targetMaintenanceTypeId) {
        throw new Error("El tipo origen y destino no pueden ser el mismo");
      }

      return await this.repository.duplicateBetweenTypes(
        sourceMaintenanceTypeId,
        targetMaintenanceTypeId,
        userId,
        prefix?.trim()
      );
    } catch (error) {
      console.error("Error en ActivityService.duplicateBetweenTypes:", error);
      throw error;
    }
  }

  /**
   * Obtener actividades recomendadas basadas en uso y éxito
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @param limit - Número de recomendaciones
   * @returns Lista de actividades recomendadas
   */
  /* async getRecommended(
    maintenanceTypeId: string,
    userId: string,
    limit: number = 10
  ): Promise<ActivityWithUsage[]> {
    try {
      if (!maintenanceTypeId?.trim()) {
        throw new Error("El ID del tipo de mantenimiento es requerido");
      }

      if (limit <= 0 || limit > 50) {
        throw new Error("El límite debe estar entre 1 y 50");
      }

      return await this.repository.getRecommended(
        maintenanceTypeId,
        userId,
        limit
      );
    } catch (error) {
      console.error("Error en ActivityService.getRecommended:", error);
      throw error;
    }
  } */

  /**
   * Obtener actividades problemáticas (baja tasa de finalización)
   * @param userId - ID del usuario
   * @param completionThreshold - Umbral de completion rate (por defecto 70%)
   * @param minUsage - Uso mínimo para considerar (por defecto 5)
   * @returns Lista de actividades problemáticas
   */
  /* async getProblematic(
    userId: string,
    completionThreshold: number = 70.0,
    minUsage: number = 5
  ): Promise<ActivityWithUsage[]> {
    try {
      if (completionThreshold < 0 || completionThreshold > 100) {
        throw new Error("El umbral de completion debe estar entre 0 y 100");
      }

      if (minUsage < 1) {
        throw new Error("El uso mínimo debe ser mayor a 0");
      }

      return await this.repository.getProblematic(
        userId,
        completionThreshold,
        minUsage
      );
    } catch (error) {
      console.error("Error en ActivityService.getProblematic:", error);
      throw error;
    }
  } */

  /**
   * Obtener dashboard completo de actividades
   * @param userId - ID del usuario
   * @returns Dashboard con estadísticas, recomendaciones y análisis
   */
  /* async getDashboard(userId: string): Promise<ActivityDashboard> {
    try {
      // Ejecutar todas las consultas en paralelo
      const [stats, mostUsed, problematic, recentlyAdded, groupedByType] =
        await Promise.all([
          this.getStats(userId),
          this.getMostUsed(userId, 5),
          this.getProblematic(userId, 70, 3),
          this.getAll(5, 0, userId), // Últimos 5 agregados
          this.getGroupedByType(userId),
        ]);

      return {
        stats,
        mostUsed,
        problematic,
        recentlyAdded: recentlyAdded.data,
        groupedByType,
      };
    } catch (error) {
      console.error("Error en ActivityService.getDashboard:", error);
      throw error;
    }
  } */

  /**
   * Validar datos de actividades para operaciones masivas
   * @param activities - Array de actividades a validar
   * @param userId - ID del usuario
   * @returns Reporte de validación con errores y advertencias
   */
  async validateBulkData(
    activities: Omit<ActivityCreate, "user_id">[],
    userId: string
  ): Promise<BulkValidationResult> {
    try {
      const valid: Omit<ActivityCreate, "user_id">[] = [];
      const invalid: {
        index: number;
        data: Omit<ActivityCreate, "user_id">;
        errors: string[];
      }[] = [];
      const warnings: {
        index: number;
        data: Omit<ActivityCreate, "user_id">;
        warnings: string[];
      }[] = [];

      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const errors: string[] = [];
        const warns: string[] = [];

        // Validaciones obligatorias
        if (!activity.name?.trim()) {
          errors.push("Nombre requerido");
        }

        if (!activity.maintenance_type_id?.trim()) {
          errors.push("Tipo de mantenimiento requerido");
        }

        // Validaciones de unicidad
        if (activity.name?.trim() && activity.maintenance_type_id?.trim()) {
          const exists = await this.repository.nameExistsInType(
            activity.name.trim(),
            activity.maintenance_type_id,
            userId
          );
          if (exists) {
            errors.push("Nombre ya existe en este tipo de mantenimiento");
          }

          // Verificar duplicados en el mismo lote
          const duplicateInBatch = activities.findIndex(
            (act, idx) =>
              idx !== i &&
              act.name?.trim().toLowerCase() ===
                activity.name?.trim().toLowerCase() &&
              act.maintenance_type_id === activity.maintenance_type_id
          );
          if (duplicateInBatch !== -1) {
            errors.push(`Nombre duplicado en la fila ${duplicateInBatch + 1}`);
          }
        }

        // Advertencias
        if (!activity.description?.trim()) {
          warns.push("Sin descripción");
        }

        if (activity.name && activity.name.length > 200) {
          warns.push("Nombre muy largo (>200 caracteres)");
        }

        if (activity.description && activity.description.length > 1000) {
          warns.push("Descripción muy larga (>1000 caracteres)");
        }

        // Clasificar resultado
        if (errors.length > 0) {
          invalid.push({ index: i, data: activity, errors });
        } else {
          valid.push(activity);
          if (warns.length > 0) {
            warnings.push({ index: i, data: activity, warnings: warns });
          }
        }
      }

      return { valid, invalid, warnings };
    } catch (error) {
      console.error("Error en ActivityService.validateBulkData:", error);
      throw error;
    }
  }

  /**
   * Validar consistencia del sistema de actividades
   * @param userId - ID del usuario
   * @returns Reporte de consistencia con problemas y recomendaciones
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
      return await this.repository.validateConsistency(userId);
    } catch (error) {
      console.error("Error en ActivityService.validateConsistency:", error);
      throw error;
    }
  }

  /**
   * Exportar actividades a formato CSV
   * @param userId - ID del usuario
   * @param filters - Filtros opcionales para exportación
   * @returns String CSV con los datos
   */
  /* async exportToCSV(
    userId: string,
    filters?: AdvancedActivitySearch
  ): Promise<string> {
    try {
      const searchFilters = {
        ...filters,
        limit: 10000, // Exportar hasta 10k registros
        offset: 0,
      };

      const result = await this.advancedSearch(searchFilters, userId);

      // Crear headers CSV
      const headers = [
        "ID",
        "Nombre",
        "Descripción",
        "Tipo de Mantenimiento",
        "Ruta del Tipo",
        "Fecha Creación",
        "Última Actualización",
      ];

      // Convertir datos a CSV
      const csvRows = [headers.join(",")];

      result.data.forEach((activity) => {
        const row = [
          activity.id,
          `"${activity.name}"`,
          `"${activity.description || ""}"`,
          `"${activity.maintenance_type.type}"`,
          `"${activity.maintenance_type.path || ""}"`,
          activity.created_at.toISOString(),
          activity.updated_at?.toISOString() || "",
        ];
        csvRows.push(row.join(","));
      });

      return csvRows.join("\n");
    } catch (error) {
      console.error("Error en ActivityService.exportToCSV:", error);
      throw error;
    }
  } */
}

export const activityService = new ActivityService();
