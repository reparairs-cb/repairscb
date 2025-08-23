import { maintenanceStageRepository } from "../repositories/maintenance-stage-repository";
import {
  MaintenanceStageBase,
  MaintenanceStageCreate,
  MaintenanceStageUpdate,
  MultiMaintenanceStage,
} from "@/types/maintenance-stage";

/**
 * Servicio para manejar las etapas de mantenimiento
 */
class MaintenanceStageService {
  private repository = maintenanceStageRepository;

  constructor() {}

  /**
   * Crear nueva etapa de mantenimiento
   */
  async create(
    stage: MaintenanceStageCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      // Validaciones de negocio
      if (!stage.maintenance_type_id?.trim()) {
        throw new Error("El tipo de mantenimiento es requerido");
      }

      if (!stage.maintenance_plan_id?.trim()) {
        throw new Error("El plan de mantenimiento es requerido");
      }

      if (stage.stage_index < 1) {
        throw new Error("El índice de etapa debe ser mayor a 0");
      }

      if (stage.stage_index > 1000) {
        throw new Error("El índice de etapa no puede exceder 1000");
      }

      if (stage.kilometers < 0) {
        throw new Error("Los kilómetros de la etapa no pueden ser negativos");
      }

      if (stage.days < 0) {
        throw new Error("Los días de la etapa no pueden ser negativos");
      }

      const stageData: MaintenanceStageCreate = {
        ...stage,
        maintenance_type_id: stage.maintenance_type_id.trim(),
        maintenance_plan_id: stage.maintenance_plan_id.trim(),
        user_id: stage.user_id.trim(),
        kilometers: Math.round(stage.kilometers * 100) / 100, // Redondear a 2 decimales
        days: Math.round(stage.days * 100) / 100, // Redondear a 2 decimales
      };

      return await this.repository.create(stageData);
    } catch (error) {
      console.error("Error en MaintenanceStageService.create:", error);
      throw error;
    }
  }

  /**
   * Obtener etapa por ID
   */
  async getById(
    id: string,
    userId: string
  ): Promise<MaintenanceStageBase | null> {
    try {
      if (!id?.trim()) {
        throw new Error("El ID de la etapa es requerido");
      }

      const stage = await this.repository.getById(id, userId);

      // Verificar que la etapa pertenezca al usuario
      if (stage && stage.user_id !== userId) {
        return null;
      }

      return stage;
    } catch (error) {
      console.error("Error en MaintenanceStageService.getById:", error);
      throw error;
    }
  }

  /**
   * Obtener todas las etapas del usuario
   */
  async getAll(
    userId: string,
    planId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<MultiMaintenanceStage> {
    try {
      if (offset < 0) {
        throw new Error("El offset no puede ser negativo");
      }

      return await this.repository.getAll(userId, planId, limit, offset);
    } catch (error) {
      console.error("Error en MaintenanceStageService.getAll:", error);
      throw error;
    }
  }
  
  /**
   * Actualizar etapa
   */
  async update(
    stage: MaintenanceStageUpdate,
    userId: string
  ): Promise<{ id: string } | null> {
    try {
      if (!stage.id?.trim()) {
        throw new Error("El ID es requerido para actualizar");
      }

      // Verificar que la etapa existe y pertenece al usuario
      const existing = await this.getById(stage.id, userId);
      if (!existing) {
        throw new Error(
          "Etapa de mantenimiento no encontrada o no tiene permisos para modificarla"
        );
      }

      // Validaciones de campos opcionales
      if (stage.stage_index !== undefined) {
        if (stage.stage_index < 1) {
          throw new Error("El índice de etapa debe ser mayor a 0");
        }

        if (stage.stage_index > 1000) {
          throw new Error("El índice de etapa no puede exceder 1000");
        }
      }

      if (stage.kilometers !== undefined && stage.kilometers < 0) {
        throw new Error("Los kilómetros de la etapa no pueden ser negativos");
      }
      if (stage.days !== undefined && stage.days < 0) {
        throw new Error("Los días de la etapa no pueden ser negativos");
      }

      // Sanitizar datos
      const updateData: MaintenanceStageUpdate = {
        ...stage,
        maintenance_type_id: stage.maintenance_type_id?.trim(),
        maintenance_plan_id: stage.maintenance_plan_id?.trim(),
        kilometers:
          stage.kilometers !== undefined
            ? Math.round(stage.kilometers * 100) / 100
            : undefined,
        days:
          stage.days !== undefined
            ? Math.round(stage.days * 100) / 100
            : undefined,
      };

      return await this.repository.update(updateData, userId);
    } catch (error) {
      console.error("Error en MaintenanceStageService.update:", error);
      throw error;
    }
  }

  /**
   * Eliminar etapa
   */
  async delete(id: string, userId: string): Promise<{ id: string } | null> {
    try {
      if (!id?.trim()) {
        throw new Error("El ID es requerido");
      }

      // Verificar que la etapa existe y pertenece al usuario
      const existing = await this.getById(id, userId);
      if (!existing) {
        throw new Error(
          "Etapa de mantenimiento no encontrada o no tiene permisos para eliminarla"
        );
      }

      return await this.repository.delete(id, userId);
    } catch (error) {
      console.error("Error en MaintenanceStageService.delete:", error);
      throw error;
    }
  }

  /**
   * Reordenar etapas manualmente
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @param newOrder - Array con el nuevo orden de IDs de etapas
   * @returns Número de etapas reordenadas
   */
  async reorderStages(userId: string, newOrder: string[]): Promise<number> {
    try {
      let reorderedCount = 0;

      // Actualizar cada etapa con su nuevo índice
      for (let i = 0; i < newOrder.length; i++) {
        const stageId = newOrder[i];
        const newIndex = i + 1; // Los índices empiezan en 1

        await this.repository.update(
          { id: stageId, stage_index: newIndex },
          userId
        );
        reorderedCount++;
      }

      return reorderedCount;
    } catch (error) {
      console.error("Error al reordenar etapas:", error);
      throw error;
    }
  }
}

export const maintenanceStageService = new MaintenanceStageService();
