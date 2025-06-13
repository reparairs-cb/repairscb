import { activityRepository } from "../repositories/activity-repository";
import {
  ActivityBase,
  ActivityCreate,
  ActivityUpdate,
  MultiActivity,
  ActivityMaintenanceTypeAdd,
  ActivityMaintenanceTypeRemove,
  ActivityMaintenanceTypeResult,
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

      if (
        !activity.maintenance_type_ids ||
        activity.maintenance_type_ids.length === 0
      ) {
        throw new Error("Al menos un tipo de mantenimiento es requerido");
      }

      // Verificar que no exista una actividad con el mismo nombre
      const existingByName = await this.repository.nameExists(
        activity.name.trim(),
        activity.user_id
      );

      if (existingByName) {
        throw new Error("Ya existe una actividad con ese nombre");
      }

      const activityData: ActivityCreate = {
        ...activity,
        name: activity.name.trim(),
        description: activity.description?.trim() || undefined,
        user_id: activity.user_id.trim(),
        maintenance_type_ids: activity.maintenance_type_ids,
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
   * Obtener actividades por múltiples tipos de mantenimiento
   * @param maintenanceTypeIds - IDs de los tipos de mantenimiento
   * @param userId - ID del usuario
   * @param matchAll - Si debe tener TODOS los tipos (true) o AL MENOS UNO (false)
   * @returns Lista de actividades que coinciden con los criterios
   */
  async getByMultipleMaintenanceTypes(
    maintenanceTypeIds: string[],
    userId: string,
    matchAll: boolean = false
  ): Promise<ActivityBase[]> {
    try {
      if (!maintenanceTypeIds || maintenanceTypeIds.length === 0) {
        throw new Error("Al menos un ID de tipo de mantenimiento es requerido");
      }

      return await this.repository.getByMultipleMaintenanceTypes(
        maintenanceTypeIds,
        userId,
        matchAll
      );
    } catch (error) {
      console.error(
        "Error en ActivityService.getByMultipleMaintenanceTypes:",
        error
      );
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

      // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
      if (activity.name && activity.name.trim() !== existing.name) {
        const existingByName = await this.repository.nameExists(
          activity.name.trim(),
          userId,
          activity.id
        );
        if (existingByName) {
          throw new Error("Ya existe otra actividad con ese nombre");
        }
      }

      // Validar que si se proporcionan tipos, no esté vacío
      if (
        activity.maintenance_type_ids &&
        activity.maintenance_type_ids.length === 0
      ) {
        throw new Error("Al menos un tipo de mantenimiento debe permanecer");
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

      // Verificar que no esté siendo usada en mantenimientos activos
      const isUsed = await this.repository.existsInMaintenanceRecord(
        id,
        userId
      );
      if (isUsed) {
        throw new Error(
          "No se puede eliminar la actividad porque está siendo utilizada en registros de mantenimiento"
        );
      }

      return await this.repository.delete({ id });
    } catch (error) {
      console.error("Error en ActivityService.delete:", error);
      throw error;
    }
  }

  /**
   * Verificar si una actividad existe en registros de mantenimiento
   * @param activityId - ID de la actividad
   * @param userId - ID del usuario
   * @returns true si existe en registros de mantenimiento
   */
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

  // ==================== MÉTODOS PARA GESTIÓN DE TIPOS ====================

  /**
   * Agregar tipos de mantenimiento a una actividad existente
   * @param data - Datos para agregar tipos
   * @param userId - ID del usuario
   * @returns Resultado de la operación
   */
  async addMaintenanceTypes(
    data: ActivityMaintenanceTypeAdd,
    userId: string
  ): Promise<ActivityMaintenanceTypeResult> {
    try {
      if (!data.activity_id?.trim()) {
        throw new Error("El ID de la actividad es requerido");
      }

      if (
        !data.maintenance_type_ids ||
        data.maintenance_type_ids.length === 0
      ) {
        throw new Error("Al menos un tipo de mantenimiento es requerido");
      }

      // Verificar que la actividad existe y pertenece al usuario
      const existing = await this.getById(data.activity_id, userId);
      if (!existing) {
        throw new Error(
          "Actividad no encontrada o no tiene permisos para modificarla"
        );
      }

      return await this.repository.addMaintenanceTypes(data, userId);
    } catch (error) {
      console.error("Error en ActivityService.addMaintenanceTypes:", error);
      throw error;
    }
  }

  /**
   * Remover tipos de mantenimiento de una actividad
   * @param data - Datos para remover tipos
   * @param userId - ID del usuario
   * @returns Resultado de la operación
   */
  async removeMaintenanceTypes(
    data: ActivityMaintenanceTypeRemove,
    userId: string
  ): Promise<ActivityMaintenanceTypeResult> {
    try {
      if (!data.activity_id?.trim()) {
        throw new Error("El ID de la actividad es requerido");
      }

      if (
        !data.maintenance_type_ids ||
        data.maintenance_type_ids.length === 0
      ) {
        throw new Error(
          "Al menos un tipo de mantenimiento debe especificarse para remover"
        );
      }

      // Verificar que la actividad existe y pertenece al usuario
      const existing = await this.getById(data.activity_id, userId);
      if (!existing) {
        throw new Error(
          "Actividad no encontrada o no tiene permisos para modificarla"
        );
      }

      // Verificar que no se intente remover todos los tipos
      const currentTypeCount = existing.maintenance_types.length;
      if (data.maintenance_type_ids.length >= currentTypeCount) {
        throw new Error(
          "No se pueden remover todos los tipos de mantenimiento. Al menos uno debe permanecer."
        );
      }

      return await this.repository.removeMaintenanceTypes(data, userId);
    } catch (error) {
      console.error("Error en ActivityService.removeMaintenanceTypes:", error);
      throw error;
    }
  }
}

export const activityService = new ActivityService();
