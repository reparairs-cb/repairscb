import {
  MaintenancePlanCreate,
  MaintenancePlanUpdate,
  MaintenancePlanBase,
  MultiMaintenancePlan,
  MaintenancePlanWithStages,
  CanDeleteResult,
} from "@/types/maintenance-plan";
import { maintenancePlanRepository } from "../repositories/maintenance-plan-repository";

class MaintenancePlanService {
  private repository = maintenancePlanRepository;

  constructor() {}

  /**
   * Crear nuevo plan de mantenimiento
   */
  async create(
    plan: MaintenancePlanCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      // Validaciones de negocio
      if (!plan.name?.trim()) {
        throw new Error("El nombre del plan es requerido");
      }

      if (plan.name.trim().length < 3) {
        throw new Error("El nombre del plan debe tener al menos 3 caracteres");
      }

      if (plan.name.trim().length > 200) {
        throw new Error("El nombre del plan no puede exceder 200 caracteres");
      }

      if (plan.description && plan.description.length > 1000) {
        throw new Error("La descripción no puede exceder 1000 caracteres");
      }

      // Verificar que no exista un plan con el mismo nombre
      const existingByName = await this.repository.nameExists(
        plan.name.trim(),
        plan.user_id
      );
      if (existingByName) {
        throw new Error("Ya existe un plan de mantenimiento con ese nombre");
      }

      const planData: MaintenancePlanCreate = {
        ...plan,
        name: plan.name.trim(),
        description: plan.description?.trim() || undefined,
        user_id: plan.user_id.trim(),
      };

      return await this.repository.create(planData);
    } catch (error) {
      console.error("Error en MaintenancePlanService.create:", error);
      throw error;
    }
  }

  /**
   * Obtener plan por ID
   */
  async getById(
    id: string,
    userId: string
  ): Promise<MaintenancePlanBase | null> {
    try {
      if (!id?.trim()) {
        throw new Error("El ID del plan es requerido");
      }

      const plan = await this.repository.getById(id, userId);

      // Verificar que el plan pertenezca al usuario
      if (plan && plan.user_id !== userId) {
        return null; // No tiene acceso a este plan
      }

      return plan;
    } catch (error) {
      console.error("Error en MaintenancePlanService.getById:", error);
      throw error;
    }
  }

  /**
   * Obtener todos los planes con paginación
   */
  async getAll(
    limit: number,
    offset: number,
    userId: string
  ): Promise<MultiMaintenancePlan> {
    try {
      if (offset < 0) {
        throw new Error("El offset no puede ser negativo");
      }

      if (limit <= 0 || limit > 100) {
        throw new Error("El límite debe estar entre 1 y 100");
      }

      return await this.repository.getAll(limit, offset, userId);
    } catch (error) {
      console.error("Error en MaintenancePlanService.getAll:", error);
      throw error;
    }
  }

  /**
   * Actualizar plan
   */
  async update(
    plan: MaintenancePlanUpdate,
    userId: string
  ): Promise<{ id: string } | null> {
    try {
      if (!plan.id?.trim()) {
        throw new Error("El ID es requerido para actualizar");
      }

      // Verificar que el plan existe y pertenece al usuario
      const existing = await this.getById(plan.id, userId);
      if (!existing) {
        throw new Error(
          "Plan de mantenimiento no encontrado o no tiene permisos para modificarlo"
        );
      }

      // Validaciones de campos opcionales
      if (plan.name !== undefined) {
        if (!plan.name.trim()) {
          throw new Error("El nombre del plan no puede estar vacío");
        }

        if (plan.name.trim().length < 3) {
          throw new Error(
            "El nombre del plan debe tener al menos 3 caracteres"
          );
        }

        if (plan.name.trim().length > 200) {
          throw new Error("El nombre del plan no puede exceder 200 caracteres");
        }

        // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
        if (plan.name.trim() !== existing.name) {
          const existingByName = await this.repository.nameExists(
            plan.name.trim(),
            userId,
            plan.id
          );
          if (existingByName) {
            throw new Error(
              "Ya existe otro plan de mantenimiento con ese nombre"
            );
          }
        }
      }

      if (plan.description !== undefined && plan.description.length > 1000) {
        throw new Error("La descripción no puede exceder 1000 caracteres");
      }

      // Sanitizar datos
      const updateData: MaintenancePlanUpdate = {
        ...plan,
        name: plan.name?.trim(),
        description: plan.description?.trim(),
      };

      return await this.repository.update(updateData, userId);
    } catch (error) {
      console.error("Error en MaintenancePlanService.update:", error);
      throw error;
    }
  }

  /**
   * Eliminar plan
   */
  async delete(id: string, userId: string): Promise<{ id: string } | null> {
    try {
      if (!id?.trim()) {
        throw new Error("El ID es requerido");
      }

      // Verificar que el plan existe y pertenece al usuario
      const existing = await this.getById(id, userId);
      if (!existing) {
        throw new Error(
          "Plan de mantenimiento no encontrado o no tiene permisos para eliminarlo"
        );
      }

      // Verificar si se puede eliminar
      const canDelete = await this.repository.canDelete(id, userId);
      if (!canDelete.can_delete) {
        throw new Error(
          `No se puede eliminar el plan: ${canDelete.blocking_reason}`
        );
      }

      return await this.repository.delete(id, userId);
    } catch (error) {
      console.error("Error en MaintenancePlanService.delete:", error);
      throw error;
    }
  }

  /**
   * Verificar si se puede eliminar un plan
   */
  async canDelete(id: string, userId: string): Promise<CanDeleteResult> {
    try {
      if (!id?.trim()) {
        throw new Error("El ID del plan es requerido");
      }

      return await this.repository.canDelete(id, userId);
    } catch (error) {
      console.error("Error en MaintenancePlanService.canDelete:", error);
      throw error;
    }
  }

  /**
   * Obtener todos los planes con sus etapas
   */
  async getAllWithStages(
    limit: number,
    offset: number,
    userId: string,
    includeEmptyPlans: boolean = true
  ): Promise<MultiMaintenancePlan & { data: MaintenancePlanWithStages[] }> {
    try {
      if (offset < 0) {
        throw new Error("El offset no puede ser negativo");
      }

      return await this.repository.getAllWithStages(
        limit,
        offset,
        userId,
        includeEmptyPlans
      );
    } catch (error) {
      console.error("Error en MaintenancePlanService.getAllWithStages:", error);
      throw error;
    }
  }
}

export const maintenancePlanService = new MaintenancePlanService();
