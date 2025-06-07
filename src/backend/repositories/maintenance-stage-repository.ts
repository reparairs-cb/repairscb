import { Pool } from "pg";
import { pool } from "@/lib/supabase";
import {
  MaintenanceStageBase,
  MaintenanceStageCreate,
  MaintenanceStageUpdate,
  MultiMaintenanceStage,
  MaintenanceStagesByTypeResponse,
  NextStageIndexResponse,
  StageIndexExistsResponse,
  MaintenanceStageStatistics,
} from "@/types/maintenance-stage";
import { MaintenanceStageErrorCodes } from "@/lib/errors";

export class MaintenanceStageError extends Error {
  public readonly code: MaintenanceStageErrorCodes;
  public readonly details?: unknown;

  constructor(
    code: MaintenanceStageErrorCodes,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "MaintenanceStageError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Repositorio para gestionar etapas de mantenimiento
 * Maneja las operaciones de base de datos para las etapas de mantenimiento
 */
class MaintenanceStageRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * Crear una nueva etapa de mantenimiento
   * @param maintenanceStage - Datos de la etapa a crear
   * @returns El ID y fecha de creación de la etapa creada
   */
  async create(
    maintenanceStage: MaintenanceStageCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      // Validaciones en el cliente antes de enviar a la base de datos
      if (maintenanceStage.stage_index < 0) {
        throw new MaintenanceStageError(
          MaintenanceStageErrorCodes.INVALID_STAGE_INDEX,
          "Stage index must be greater than or equal to zero"
        );
      }

      if (maintenanceStage.value < 0) {
        throw new MaintenanceStageError(
          MaintenanceStageErrorCodes.INVALID_VALUE,
          "Value must be greater than or equal to zero"
        );
      }

      const result = await this.db.query(
        "SELECT create_maintenance_stage($1, $2, $3, $4)",
        [
          maintenanceStage.maintenance_type_id,
          maintenanceStage.user_id,
          maintenanceStage.stage_index,
          maintenanceStage.value,
        ]
      );

      const response = result.rows[0].create_maintenance_stage;
      return {
        id: response.id,
        created_at: new Date(response.created_at),
      };
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "create", {
        maintenanceStage,
      });
    }
  }

  /**
   * Obtener una etapa de mantenimiento por ID
   * @param id - ID de la etapa
   * @param userId - ID del usuario
   * @returns La etapa encontrada o null
   */
  async getById(
    id: string,
    userId: string
  ): Promise<MaintenanceStageBase | null> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_stage_by_id($1, $2)",
        [id, userId]
      );

      const data = result.rows[0]?.get_maintenance_stage_by_id;
      if (!data) return null;

      return {
        id: data.id,
        maintenance_type_id: data.maintenance_type_id,
        user_id: data.user_id,
        stage_index: data.stage_index,
        value: parseFloat(data.value),
        created_at: new Date(data.created_at),
        updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
      };
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "getById", {
        id,
        userId,
      });
    }
  }

  async getAll(
    limit: number = 100,
    offset: number = 0,
    userId: string
  ): Promise<MultiMaintenanceStage> {
    try {
      const result = await this.db.query(
        "SELECT get_all_maintenance_stages($1, $2, $3)",
        [userId, limit, offset]
      );

      const response = result.rows[0].get_all_maintenance_stages;

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data: response.data.map((stage: MaintenanceStageBase) => ({
          id: stage.id,
          maintenance_type_id: stage.maintenance_type_id,
          user_id: stage.user_id,
          stage_index: stage.stage_index,
          value: parseFloat(stage.value.toString()),
          created_at: new Date(stage.created_at),
          updated_at: stage.updated_at ? new Date(stage.updated_at) : undefined,
        })),
      };
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "getAll", {
        limit,
        offset,
        userId,
      });
    }
  }

  /**
   * Obtener todas las etapas de mantenimiento de un tipo específico con paginación
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @param limit - Límite de registros por página
   * @param offset - Offset para paginación
   * @returns Lista paginada de etapas
   */
  async getAllByMaintenanceType(
    maintenanceTypeId: string,
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<MultiMaintenanceStage> {
    try {
      const result = await this.db.query(
        "SELECT get_all_maintenance_stages($1, $2, $3, $4)",
        [maintenanceTypeId, userId, limit, offset]
      );

      const response = result.rows[0].get_all_maintenance_stages;

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data: response.data.map((stage: MaintenanceStageBase) => ({
          id: stage.id,
          maintenance_type_id: stage.maintenance_type_id,
          user_id: stage.user_id,
          stage_index: stage.stage_index,
          value: parseFloat(stage.value.toString()),
          created_at: new Date(stage.created_at),
          updated_at: stage.updated_at ? new Date(stage.updated_at) : undefined,
        })),
      };
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "getAllByMaintenanceType",
        { maintenanceTypeId, userId, limit, offset }
      );
    }
  }

  /**
   * Obtener todas las etapas de un usuario con paginación
   * @param userId - ID del usuario
   * @param limit - Límite de registros por página
   * @param offset - Offset para paginación
   * @returns Lista paginada de todas las etapas del usuario
   */
  async getAllByUser(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<MultiMaintenanceStage> {
    try {
      const result = await this.db.query(
        "SELECT get_all_user_maintenance_stages($1, $2, $3)",
        [userId, limit, offset]
      );

      const response = result.rows[0].get_all_user_maintenance_stages;

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data: response.data.map((stage: MaintenanceStageBase) => ({
          id: stage.id,
          maintenance_type_id: stage.maintenance_type_id,
          user_id: stage.user_id,
          stage_index: stage.stage_index,
          value: parseFloat(stage.value.toString()),
          created_at: new Date(stage.created_at),
          updated_at: stage.updated_at ? new Date(stage.updated_at) : undefined,
        })),
      };
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "getAllByUser",
        { userId, limit, offset }
      );
    }
  }

  /**
   * Obtener todas las etapas de un tipo ordenadas por stage_index (sin paginación)
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @returns Lista de etapas ordenadas
   */
  async getByMaintenanceType(
    maintenanceTypeId: string,
    userId: string
  ): Promise<MaintenanceStagesByTypeResponse> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_stages_by_type($1, $2)",
        [maintenanceTypeId, userId]
      );

      const response = result.rows[0].get_maintenance_stages_by_type;

      return {
        maintenance_type_id: maintenanceTypeId,
        data: response.map((stage: MaintenanceStageBase) => ({
          id: stage.id,
          maintenance_type_id: stage.maintenance_type_id,
          user_id: stage.user_id,
          stage_index: stage.stage_index,
          value: parseFloat(stage.value.toString()),
          created_at: new Date(stage.created_at),
          updated_at: stage.updated_at ? new Date(stage.updated_at) : undefined,
        })),
      };
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "getByMaintenanceType",
        { maintenanceTypeId, userId }
      );
    }
  }

  /**
   * Actualizar una etapa de mantenimiento
   * @param maintenanceStage - Datos actualizados de la etapa
   * @returns El ID de la etapa actualizada
   */
  async update(
    maintenanceStage: MaintenanceStageUpdate
  ): Promise<{ id: string }> {
    try {
      // Validaciones en el cliente
      if (
        maintenanceStage.stage_index !== undefined &&
        maintenanceStage.stage_index < 0
      ) {
        throw new MaintenanceStageError(
          MaintenanceStageErrorCodes.INVALID_STAGE_INDEX,
          "Stage index must be greater than or equal to zero"
        );
      }

      if (maintenanceStage.value !== undefined && maintenanceStage.value < 0) {
        throw new MaintenanceStageError(
          MaintenanceStageErrorCodes.INVALID_VALUE,
          "Value must be greater than or equal to zero"
        );
      }

      const result = await this.db.query(
        "SELECT update_maintenance_stage($1, $2, $3, $4, $5)",
        [
          maintenanceStage.id,
          maintenanceStage.user_id,
          maintenanceStage.maintenance_type_id || null,
          maintenanceStage.stage_index !== undefined
            ? maintenanceStage.stage_index
            : null,
          maintenanceStage.value !== undefined ? maintenanceStage.value : null,
        ]
      );

      const response = result.rows[0].update_maintenance_stage;
      return { id: response.id };
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "update", {
        maintenanceStage,
      });
    }
  }

  /**
   * Eliminar una etapa de mantenimiento
   * @param id - ID de la etapa a eliminar
   * @param userId - ID del usuario
   * @returns El ID de la etapa eliminada
   */
  async delete(id: string, userId: string): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT delete_maintenance_stage($1, $2)",
        [id, userId]
      );

      const response = result.rows[0].delete_maintenance_stage;
      return { id: response.id };
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "delete", {
        id,
        userId,
      });
    }
  }

  /**
   * Verificar si existe una etapa de mantenimiento
   * @param id - ID de la etapa
   * @param userId - ID del usuario
   * @returns true si existe, false en caso contrario
   */
  async exists(id: string, userId: string): Promise<boolean> {
    try {
      const stage = await this.getById(id, userId);
      return stage !== null;
    } catch (error) {
      console.error("Error checking maintenance stage existence:", error);
      return false;
    }
  }

  /**
   * Verificar si existe una etapa con el mismo índice para un tipo de mantenimiento
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @param stageIndex - Índice de la etapa
   * @param excludeId - ID a excluir de la búsqueda (para actualizaciones)
   * @returns Información sobre la existencia del índice
   */
  async checkStageIndexExists(
    maintenanceTypeId: string,
    userId: string,
    stageIndex: number,
    excludeId?: string
  ): Promise<StageIndexExistsResponse> {
    try {
      const result = await this.db.query(
        "SELECT check_stage_index_exists($1, $2, $3, $4)",
        [maintenanceTypeId, userId, stageIndex, excludeId || null]
      );

      const response = result.rows[0].check_stage_index_exists;

      return {
        maintenance_type_id: response.maintenance_type_id,
        stage_index: response.stage_index,
        exists: response.exists,
        existing_id: response.existing_id,
      };
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "checkStageIndexExists",
        { maintenanceTypeId, userId, stageIndex, excludeId }
      );
    }
  }

  /**
   * Obtener etapa por índice específico
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @param stageIndex - Índice de la etapa
   * @returns La etapa encontrada o null
   */
  async getByStageIndex(
    maintenanceTypeId: string,
    userId: string,
    stageIndex: number
  ): Promise<MaintenanceStageBase | null> {
    try {
      const stages = await this.getByMaintenanceType(maintenanceTypeId, userId);
      const stage = stages.data.find((s) => s.stage_index === stageIndex);

      return stage || null;
    } catch (error) {
      console.error("Error getting stage by index:", error);
      return null;
    }
  }

  /**
   * Obtener la siguiente etapa disponible para un tipo de mantenimiento
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @returns El siguiente índice disponible
   */
  async getNextAvailableIndex(
    maintenanceTypeId: string,
    userId: string
  ): Promise<NextStageIndexResponse> {
    try {
      const result = await this.db.query(
        "SELECT get_next_stage_index($1, $2)",
        [maintenanceTypeId, userId]
      );

      const response = result.rows[0].get_next_stage_index;

      return {
        maintenance_type_id: response.maintenance_type_id,
        next_index: response.next_index,
      };
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "getNextAvailableIndex",
        { maintenanceTypeId, userId }
      );
    }
  }

  /**
   * Obtener estadísticas de etapas por tipo de mantenimiento
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @returns Estadísticas de las etapas
   */
  async getStageStatistics(
    maintenanceTypeId: string,
    userId: string
  ): Promise<MaintenanceStageStatistics> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_stage_statistics($1, $2)",
        [maintenanceTypeId, userId]
      );

      const response = result.rows[0].get_maintenance_stage_statistics;

      return {
        maintenance_type_id: response.maintenance_type_id,
        total_stages: response.total_stages,
        min_value: parseFloat(response.min_value),
        max_value: parseFloat(response.max_value),
        avg_value: parseFloat(response.avg_value),
        total_value: parseFloat(response.total_value),
      };
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "getStageStatistics",
        { maintenanceTypeId, userId }
      );
    }
  }

  /**
   * Clonar etapas de un tipo de mantenimiento a otro
   * @param sourceMaintenanceTypeId - ID del tipo de mantenimiento origen
   * @param targetMaintenanceTypeId - ID del tipo de mantenimiento destino
   * @param userId - ID del usuario
   * @returns Array de IDs de las etapas creadas
   */
  async cloneStages(
    sourceMaintenanceTypeId: string,
    targetMaintenanceTypeId: string,
    userId: string
  ): Promise<string[]> {
    try {
      const sourceStages = await this.getByMaintenanceType(
        sourceMaintenanceTypeId,
        userId
      );

      const createdIds: string[] = [];

      for (const stage of sourceStages.data) {
        const newStage = await this.create({
          maintenance_type_id: targetMaintenanceTypeId,
          user_id: userId,
          stage_index: stage.stage_index,
          value: stage.value,
        });
        createdIds.push(newStage.id);
      }

      return createdIds;
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "cloneStages",
        { sourceMaintenanceTypeId, targetMaintenanceTypeId, userId }
      );
    }
  }

  /**
   * Reordenar etapas después de eliminar una
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @param deletedIndex - Índice de la etapa eliminada
   * @returns Número de etapas reordenadas
   */
  async reorderStagesAfterDelete(
    maintenanceTypeId: string,
    userId: string,
    deletedIndex: number
  ): Promise<number> {
    try {
      const stages = await this.getByMaintenanceType(maintenanceTypeId, userId);

      // Filtrar etapas que necesitan reordenamiento
      const stagesToReorder = stages.data.filter(
        (stage) => stage.stage_index > deletedIndex
      );

      let reorderedCount = 0;

      // Actualizar cada etapa decrementando su índice
      for (const stage of stagesToReorder) {
        await this.update({
          id: stage.id,
          user_id: userId,
          stage_index: stage.stage_index - 1,
        });
        reorderedCount++;
      }

      return reorderedCount;
    } catch (error) {
      console.error("Error reordering stages:", error);
      return 0;
    }
  }

  /**
   * Validar que un tipo de mantenimiento pertenezca al usuario
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @returns true si pertenece al usuario
   */
  async validateMaintenanceTypeOwnership(
    maintenanceTypeId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Esta función requeriría acceso a la tabla maintenance_types
      // o podríamos usar una función SQL específica para esta validación
      const result = await this.db.query(
        "SELECT EXISTS(SELECT 1 FROM mnt.maintenance_types WHERE id = $1 AND user_id = $2)",
        [maintenanceTypeId, userId]
      );

      return result.rows[0].exists;
    } catch (error) {
      console.error("Error validating maintenance type ownership:", error);
      return false;
    }
  }

  /**
   * Manejo centralizado de errores
   * @param error - Error capturado
   * @param operation - Operación que falló
   * @param params - Parámetros de la operación
   */
  private handleError(
    error: { message?: string; stack?: string },
    operation: string,
    params?: unknown
  ): never {
    console.error(`Error in MaintenanceStageRepository.${operation}:`, {
      error: error.message,
      stack: error.stack,
      params,
    });

    // Determinar el tipo de error basado en el mensaje
    if (
      error.message?.includes("not found") ||
      error.message?.includes("access denied")
    ) {
      throw new MaintenanceStageError(
        MaintenanceStageErrorCodes.NOT_FOUND,
        error.message
      );
    }

    if (
      error.message?.includes("already exists") ||
      error.message?.includes("duplicate")
    ) {
      throw new MaintenanceStageError(
        MaintenanceStageErrorCodes.DUPLICATE_STAGE_INDEX,
        error.message
      );
    }

    if (
      error.message?.includes("stage_index") ||
      error.message?.includes("Stage index")
    ) {
      throw new MaintenanceStageError(
        MaintenanceStageErrorCodes.INVALID_STAGE_INDEX,
        error.message
      );
    }

    if (error.message?.includes("value") || error.message?.includes("Value")) {
      throw new MaintenanceStageError(
        MaintenanceStageErrorCodes.INVALID_VALUE,
        error.message
      );
    }

    if (
      error.message?.includes("maintenance_type") ||
      error.message?.includes("Maintenance type")
    ) {
      throw new MaintenanceStageError(
        MaintenanceStageErrorCodes.MAINTENANCE_TYPE_NOT_FOUND,
        error.message
      );
    }

    if (error.message?.includes("maintenance records")) {
      throw new MaintenanceStageError(
        MaintenanceStageErrorCodes.HAS_MAINTENANCE_RECORDS,
        error.message
      );
    }

    // Error genérico de base de datos
    throw new MaintenanceStageError(
      MaintenanceStageErrorCodes.DATABASE_ERROR,
      `Database operation failed: ${error.message}`,
      error
    );
  }
}

export const maintenanceStageRepository = new MaintenanceStageRepository();
