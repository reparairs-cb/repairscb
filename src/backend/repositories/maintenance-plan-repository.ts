import { Pool } from "pg";
import { pool } from "@/lib/supabase";

import {
  MaintenancePlanBase,
  MaintenancePlanCreate,
  MaintenancePlanUpdate,
  MultiMaintenancePlan,
  MaintenancePlanWithStages,
  CanDeleteResult,
} from "@/types/maintenance-plan";

class MaintenancePlanRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * Mapear datos de plan desde la base de datos
   */
  private mapPlanData(planData: MaintenancePlanBase): MaintenancePlanBase {
    return {
      id: planData.id,
      name: planData.name,
      description: planData.description,
      created_at: new Date(planData.created_at),
      updated_at: planData.updated_at
        ? new Date(planData.updated_at)
        : undefined,
      user_id: planData.user_id,
      stage_count: planData.stage_count || 0,
      maintenance_type_count: planData.maintenance_type_count || 0,
    };
  }

  /**
   * Crear un nuevo plan de mantenimiento
   */
  async create(
    plan: MaintenancePlanCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      const result = await this.db.query(
        "SELECT mnt.create_maintenance_plan($1, $2, $3)",
        [plan.name, plan.description || null, plan.user_id]
      );

      const response = result.rows[0].create_maintenance_plan;
      return {
        id: response.id,
        created_at: new Date(response.created_at),
      };
    } catch (err) {
      console.error("Error al insertar maintenance plan:", err);
      throw err;
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
      const result = await this.db.query(
        "SELECT mnt.get_maintenance_plan_by_id($1, $2)",
        [id, userId]
      );

      const planData = result.rows[0].get_maintenance_plan_by_id;
      if (!planData) return null;

      return this.mapPlanData(planData);
    } catch (err) {
      console.error("Error al obtener maintenance plan por ID:", err);
      throw err;
    }
  }

  /**
   * Obtener todos los planes con paginación
   */
  async getAll(
    limit: number = 100,
    offset: number = 0,
    userId: string
  ): Promise<MultiMaintenancePlan> {
    try {
      const result = await this.db.query(
        "SELECT mnt.get_all_maintenance_plans($1, $2, $3)",
        [userId, limit, offset]
      );

      const response = result.rows[0].get_all_maintenance_plans;

      const data: MaintenancePlanBase[] = response.data.map(
        (plan: MaintenancePlanBase) => this.mapPlanData(plan)
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data,
      };
    } catch (err) {
      console.error("Error al obtener maintenance plans:", err);
      throw err;
    }
  }

  /**
   * Actualizar plan
   */
  async update(
    plan: MaintenancePlanUpdate,
    userId: string
  ): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT mnt.update_maintenance_plan($1, $2, $3, $4)",
        [plan.id, userId, plan.name, plan.description]
      );

      return result.rows[0].update_maintenance_plan;
    } catch (err) {
      console.error("Error al actualizar maintenance plan:", err);
      throw err;
    }
  }

  /**
   * Eliminar plan
   */
  async delete(id: string, userId: string): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT mnt.delete_maintenance_plan($1, $2)",
        [id, userId]
      );

      return result.rows[0].delete_maintenance_plan;
    } catch (err) {
      console.error("Error al eliminar maintenance plan:", err);
      throw err;
    }
  }

  /**
   * Verificar si existe un nombre
   */
  async nameExists(
    name: string,
    userId: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const result = await this.db.query(
        "SELECT mnt.maintenance_plan_name_exists($1, $2, $3)",
        [name, userId, excludeId || null]
      );

      return result.rows[0].maintenance_plan_name_exists;
    } catch (err) {
      console.error("Error al verificar nombre de plan:", err);
      throw err;
    }
  }

  /**
   * Verificar si se puede eliminar
   */
  async canDelete(id: string, userId: string): Promise<CanDeleteResult> {
    try {
      const result = await this.db.query(
        "SELECT mnt.can_delete_maintenance_plan($1, $2)",
        [id, userId]
      );

      return result.rows[0].can_delete_maintenance_plan;
    } catch (err) {
      console.error("Error al verificar si se puede eliminar plan:", err);
      throw err;
    }
  }

  /**
   * Obtener todos los planes con sus etapas
   */
  async getAllWithStages(
    limit: number = 100,
    offset: number = 0,
    userId: string,
    includeEmptyPlans: boolean = true
  ): Promise<MultiMaintenancePlan & { data: MaintenancePlanWithStages[] }> {
    try {
      const result = await this.db.query(
        "SELECT mnt.get_all_maintenance_plans_with_stages($1, $2, $3, $4)",
        [userId, limit, offset, includeEmptyPlans]
      );

      const response = result.rows[0].get_all_maintenance_plans_with_stages;

      const data: MaintenancePlanWithStages[] = response.data.map(
        (plan: MaintenancePlanWithStages) => ({
          ...this.mapPlanData(plan),
          stages: plan.stages || [],
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
      console.error("Error al obtener planes con etapas:", err);
      throw err;
    }
  }
}

export const maintenancePlanRepository = new MaintenancePlanRepository();
