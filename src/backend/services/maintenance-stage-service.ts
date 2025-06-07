import { maintenanceStageRepository } from "../repositories/maintenance-stage-repository";
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
import { MaintenanceStageError } from "../repositories/maintenance-stage-repository";
import { MaintenanceStageErrorCodes } from "@/lib/errors";
/**
 * Servicio para manejar las etapas de mantenimiento
 */
class MaintenanceStageService {
  private repository = maintenanceStageRepository;

  constructor() {}

  /**
   * Crear una nueva etapa de mantenimiento
   * @param maintenanceStage - Datos de la etapa de mantenimiento a crear
   * @returns La etapa de mantenimiento creada
   */
  async create(
    maintenanceStage: MaintenanceStageCreate
  ): Promise<{ id: string; created_at: Date } | null> {
    try {
      // Validaciones de negocio adicionales
      await this.validateBusinessRules(maintenanceStage);

      // Validar que el maintenance_type existe y pertenece al usuario
      const isValidMaintenanceType =
        await this.repository.validateMaintenanceTypeOwnership(
          maintenanceStage.maintenance_type_id,
          maintenanceStage.user_id
        );

      if (!isValidMaintenanceType) {
        throw new MaintenanceStageError(
          MaintenanceStageErrorCodes.MAINTENANCE_TYPE_NOT_FOUND,
          `Maintenance type with ID ${maintenanceStage.maintenance_type_id} not found or access denied`
        );
      }

      return await this.repository.create(maintenanceStage);
    } catch (error) {
      console.error("Error al crear la etapa de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Obtener una etapa de mantenimiento por su ID
   * @param id - ID de la etapa de mantenimiento a buscar
   * @param userId - ID del usuario
   * @returns La etapa encontrada o null si no existe
   */
  async getById(
    id: string,
    userId: string
  ): Promise<MaintenanceStageBase | null> {
    try {
      return await this.repository.getById(id, userId);
    } catch (error) {
      console.error(
        "Error al obtener la etapa de mantenimiento por ID:",
        error
      );
      throw error;
    }
  }

  async getAll(
    limit: number = 100,
    offset: number = 0,
    userId: string
  ): Promise<MultiMaintenanceStage> {
    try {
      return await this.repository.getAll(limit, offset, userId);
    } catch (error) {
      console.error(
        "Error al obtener todas las etapas de mantenimiento:",
        error
      );
      throw error;
    }
  }

  /**
   * Obtener todas las etapas de mantenimiento de un tipo específico con paginación
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @param limit - Límite de registros por página
   * @param offset - Offset para paginación
   * @returns Lista paginada de etapas de mantenimiento
   */
  async getAllByMaintenanceType(
    maintenanceTypeId: string,
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<MultiMaintenanceStage> {
    try {
      return await this.repository.getAllByMaintenanceType(
        maintenanceTypeId,
        userId,
        limit,
        offset
      );
    } catch (error) {
      console.error(
        "Error al obtener etapas de mantenimiento por tipo:",
        error
      );
      throw error;
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
      return await this.repository.getAllByUser(userId, limit, offset);
    } catch (error) {
      console.error(
        "Error al obtener todas las etapas de mantenimiento del usuario:",
        error
      );
      throw error;
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
      return await this.repository.getByMaintenanceType(
        maintenanceTypeId,
        userId
      );
    } catch (error) {
      console.error(
        "Error al obtener etapas de mantenimiento ordenadas:",
        error
      );
      throw error;
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
      return await this.repository.getByStageIndex(
        maintenanceTypeId,
        userId,
        stageIndex
      );
    } catch (error) {
      console.error("Error al obtener etapa por índice:", error);
      throw error;
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
      return await this.repository.getNextAvailableIndex(
        maintenanceTypeId,
        userId
      );
    } catch (error) {
      console.error("Error al obtener siguiente índice disponible:", error);
      throw error;
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
      return await this.repository.getStageStatistics(
        maintenanceTypeId,
        userId
      );
    } catch (error) {
      console.error("Error al obtener estadísticas de etapas:", error);
      throw error;
    }
  }

  /**
   * Actualizar una etapa de mantenimiento
   * @param maintenanceStage - Datos actualizados de la etapa
   * @returns El ID de la etapa actualizada
   */
  async update(
    maintenanceStage: MaintenanceStageUpdate
  ): Promise<{ id: string } | null> {
    try {
      // Validar que la etapa existe antes de actualizar
      const existingStage = await this.repository.getById(
        maintenanceStage.id,
        maintenanceStage.user_id
      );
      if (!existingStage) {
        throw new MaintenanceStageError(
          MaintenanceStageErrorCodes.NOT_FOUND,
          `Maintenance stage with ID ${maintenanceStage.id} not found`
        );
      }

      // Validaciones de negocio para actualizaciones
      await this.validateUpdateBusinessRules(maintenanceStage, existingStage);

      return await this.repository.update(maintenanceStage);
    } catch (error) {
      console.error("Error al actualizar la etapa de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Eliminar una etapa de mantenimiento
   * @param id - ID de la etapa a eliminar
   * @param userId - ID del usuario
   * @param reorderSubsequent - Si debe reordenar las etapas posteriores
   * @returns El ID de la etapa eliminada
   */
  async delete(
    id: string,
    userId: string,
    reorderSubsequent: boolean = true
  ): Promise<{ id: string } | null> {
    try {
      // Validar que la etapa existe antes de eliminar
      const existingStage = await this.repository.getById(id, userId);
      if (!existingStage) {
        throw new MaintenanceStageError(
          MaintenanceStageErrorCodes.NOT_FOUND,
          `Maintenance stage with ID ${id} not found`
        );
      }

      // TODO: Validar que no existan registros de mantenimiento asociados
      // await this.validateStageCanBeDeleted(id, userId);

      const result = await this.repository.delete(id, userId);

      // Reordenar etapas posteriores si se solicita
      if (reorderSubsequent && result) {
        await this.repository.reorderStagesAfterDelete(
          existingStage.maintenance_type_id,
          userId,
          existingStage.stage_index
        );
      }

      return result;
    } catch (error) {
      console.error("Error al eliminar la etapa de mantenimiento:", error);
      throw error;
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
      return await this.repository.exists(id, userId);
    } catch (error) {
      console.error("Error al verificar existencia de la etapa:", error);
      throw error;
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
      return await this.repository.checkStageIndexExists(
        maintenanceTypeId,
        userId,
        stageIndex,
        excludeId
      );
    } catch (error) {
      console.error(
        "Error al verificar existencia del índice de etapa:",
        error
      );
      throw error;
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
      // Validar que ambos tipos de mantenimiento existen y pertenecen al usuario
      const sourceValid =
        await this.repository.validateMaintenanceTypeOwnership(
          sourceMaintenanceTypeId,
          userId
        );
      const targetValid =
        await this.repository.validateMaintenanceTypeOwnership(
          targetMaintenanceTypeId,
          userId
        );

      if (!sourceValid) {
        throw new MaintenanceStageError(
          MaintenanceStageErrorCodes.MAINTENANCE_TYPE_NOT_FOUND,
          `Source maintenance type with ID ${sourceMaintenanceTypeId} not found or access denied`
        );
      }

      if (!targetValid) {
        throw new MaintenanceStageError(
          MaintenanceStageErrorCodes.MAINTENANCE_TYPE_NOT_FOUND,
          `Target maintenance type with ID ${targetMaintenanceTypeId} not found or access denied`
        );
      }

      // Verificar que el tipo destino no tenga etapas existentes
      const existingStages = await this.repository.getByMaintenanceType(
        targetMaintenanceTypeId,
        userId
      );

      if (existingStages.data.length > 0) {
        throw new MaintenanceStageError(
          MaintenanceStageErrorCodes.DUPLICATE_STAGE_INDEX,
          "Target maintenance type already has stages. Please delete them first."
        );
      }

      return await this.repository.cloneStages(
        sourceMaintenanceTypeId,
        targetMaintenanceTypeId,
        userId
      );
    } catch (error) {
      console.error("Error al clonar etapas de mantenimiento:", error);
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

        await this.repository.update({
          id: stageId,
          user_id: userId,
          stage_index: newIndex,
        });
        reorderedCount++;
      }

      return reorderedCount;
    } catch (error) {
      console.error("Error al reordenar etapas:", error);
      throw error;
    }
  }

  /**
   * Obtener resumen completo de etapas por tipo de mantenimiento
   * @param maintenanceTypeId - ID del tipo de mantenimiento
   * @param userId - ID del usuario
   * @returns Resumen completo con etapas y estadísticas
   */
  async getCompleteSummary(
    maintenanceTypeId: string,
    userId: string
  ): Promise<{
    stages: MaintenanceStageBase[];
    statistics: MaintenanceStageStatistics;
    next_available_index: number;
  }> {
    try {
      const [stagesResponse, statistics, nextIndexResponse] = await Promise.all(
        [
          this.repository.getByMaintenanceType(maintenanceTypeId, userId),
          this.repository.getStageStatistics(maintenanceTypeId, userId),
          this.repository.getNextAvailableIndex(maintenanceTypeId, userId),
        ]
      );

      return {
        stages: stagesResponse.data,
        statistics,
        next_available_index: nextIndexResponse.next_index,
      };
    } catch (error) {
      console.error("Error al obtener resumen completo:", error);
      throw error;
    }
  }

  /**
   * Validaciones de reglas de negocio para creación
   * @param maintenanceStage - Datos de la etapa a validar
   */
  private async validateBusinessRules(
    maintenanceStage: MaintenanceStageCreate
  ): Promise<void> {
    // Validar que el stage_index sea positivo
    if (maintenanceStage.stage_index <= 0) {
      throw new MaintenanceStageError(
        MaintenanceStageErrorCodes.INVALID_STAGE_INDEX,
        "Stage index must be greater than zero"
      );
    }

    // Validar que el valor sea positivo
    if (maintenanceStage.value < 0) {
      throw new MaintenanceStageError(
        MaintenanceStageErrorCodes.INVALID_VALUE,
        "Value must be greater than or equal to zero"
      );
    }

    // Validar que no exista ya una etapa con el mismo índice
    const indexCheck = await this.checkStageIndexExists(
      maintenanceStage.maintenance_type_id,
      maintenanceStage.user_id,
      maintenanceStage.stage_index
    );

    if (indexCheck.exists) {
      throw new MaintenanceStageError(
        MaintenanceStageErrorCodes.DUPLICATE_STAGE_INDEX,
        `A maintenance stage with index ${maintenanceStage.stage_index} already exists for this maintenance type`
      );
    }
  }

  /**
   * Validaciones de reglas de negocio para actualización
   * @param updateData - Datos de actualización
   * @param existingStage - Etapa existente
   */
  private async validateUpdateBusinessRules(
    updateData: MaintenanceStageUpdate,
    existingStage: MaintenanceStageBase
  ): Promise<void> {
    // Si se está cambiando el maintenance_type_id, validar que el nuevo pertenezca al usuario
    if (
      updateData.maintenance_type_id &&
      updateData.maintenance_type_id !== existingStage.maintenance_type_id
    ) {
      const isValid = await this.repository.validateMaintenanceTypeOwnership(
        updateData.maintenance_type_id,
        updateData.user_id
      );

      if (!isValid) {
        throw new MaintenanceStageError(
          MaintenanceStageErrorCodes.MAINTENANCE_TYPE_NOT_FOUND,
          `Maintenance type with ID ${updateData.maintenance_type_id} not found or access denied`
        );
      }
    }

    // Si se está cambiando el stage_index, validar que sea positivo
    if (updateData.stage_index !== undefined && updateData.stage_index <= 0) {
      throw new MaintenanceStageError(
        MaintenanceStageErrorCodes.INVALID_STAGE_INDEX,
        "Stage index must be greater than zero"
      );
    }

    // Si se está cambiando el valor, validar que sea positivo
    if (updateData.value !== undefined && updateData.value < 0) {
      throw new MaintenanceStageError(
        MaintenanceStageErrorCodes.INVALID_VALUE,
        "Value must be greater than or equal to zero"
      );
    }

    // Si se está cambiando el stage_index, validar que no exista duplicado
    if (
      updateData.stage_index !== undefined &&
      updateData.stage_index !== existingStage.stage_index
    ) {
      const finalMaintenanceTypeId =
        updateData.maintenance_type_id || existingStage.maintenance_type_id;

      const indexCheck = await this.checkStageIndexExists(
        finalMaintenanceTypeId,
        updateData.user_id,
        updateData.stage_index,
        updateData.id
      );

      if (indexCheck.exists) {
        throw new MaintenanceStageError(
          MaintenanceStageErrorCodes.DUPLICATE_STAGE_INDEX,
          `A maintenance stage with index ${updateData.stage_index} already exists for this maintenance type`
        );
      }
    }
  }
}

export const maintenanceStageService = new MaintenanceStageService();
