import { Pool } from "pg";
import { pool } from "@/lib/supabase";
import {
  MaintenanceStageBase,
  MaintenanceStageCreate,
  MaintenanceStageUpdate,
  MultiMaintenanceStage,
} from "@/types/maintenance-stage";
class MaintenanceStageRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * Mapear datos de etapa desde la base de datos
   */
  private mapStageData(
    stageData: MaintenanceStageBase & {
      kilometers: string | number;
      days: string | number;
    }
  ): MaintenanceStageBase {
    return {
      id: stageData.id,
      maintenance_type_id: stageData.maintenance_type_id,
      maintenance_plan_id: stageData.maintenance_plan_id,
      stage_index: stageData.stage_index,
      kilometers:
        typeof stageData.kilometers === "string"
          ? parseFloat(stageData.kilometers)
          : stageData.kilometers,
      days:
        typeof stageData.days === "string"
          ? parseFloat(stageData.days)
          : stageData.days,
      created_at: new Date(stageData.created_at),
      updated_at: stageData.updated_at
        ? new Date(stageData.updated_at)
        : undefined,
      user_id: stageData.user_id,
      maintenance_type: stageData.maintenance_type,
      maintenance_plan: stageData.maintenance_plan,
    };
  }

  /**
   * Crear nueva etapa
   */
  async create(
    stage: MaintenanceStageCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      const result = await this.db.query(
        "SELECT mnt.create_maintenance_stage($1, $2, $3, $4, $5, $6)",
        [
          stage.maintenance_type_id,
          stage.maintenance_plan_id,
          stage.user_id,
          stage.stage_index,
          stage.kilometers,
          stage.days,
        ]
      );

      const response = result.rows[0].create_maintenance_stage;
      return {
        id: response.id,
        created_at: new Date(response.created_at),
      };
    } catch (err) {
      console.error("Error al insertar maintenance stage:", err);
      throw err;
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
      const result = await this.db.query(
        "SELECT mnt.get_maintenance_stage_by_id($1, $2)",
        [id, userId]
      );

      const stageData = result.rows[0].get_maintenance_stage_by_id;
      if (!stageData) return null;

      return this.mapStageData(stageData);
    } catch (err) {
      console.error("Error al obtener maintenance stage por ID:", err);
      throw err;
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
      const result = await this.db.query(
        "SELECT mnt.get_all_maintenance_stages($1, $2, $3, $4)",
        [userId, planId || null, limit, offset]
      );

      const response = result.rows[0].get_all_maintenance_stages;

      const data: MaintenanceStageBase[] = response.data.map(
        (stage: MaintenanceStageBase) => this.mapStageData(stage)
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        maintenance_plan_id: response.maintenance_plan_id,
        data,
      };
    } catch (err) {
      console.error("Error al obtener maintenance stages:", err);
      throw err;
    }
  }

  /**
   * Actualizar etapa
   */
  async update(
    stage: MaintenanceStageUpdate,
    userId: string
  ): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT mnt.update_maintenance_stage($1, $2, $3, $4, $5, $6, $7)",
        [
          stage.id,
          userId,
          stage.maintenance_type_id,
          stage.maintenance_plan_id,
          stage.stage_index,
          stage.kilometers,
          stage.days,
        ]
      );

      return result.rows[0].update_maintenance_stage;
    } catch (err) {
      console.error("Error al actualizar maintenance stage:", err);
      throw err;
    }
  }

  /**
   * Eliminar etapa
   */
  async delete(id: string, userId: string): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT mnt.delete_maintenance_stage($1, $2)",
        [id, userId]
      );

      return result.rows[0].delete_maintenance_stage;
    } catch (err) {
      console.error("Error al eliminar maintenance stage:", err);
      throw err;
    }
  }
}

export const maintenanceStageRepository = new MaintenanceStageRepository();
