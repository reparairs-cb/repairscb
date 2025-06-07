import {
  maintenanceSparePartRepository,
  MaintenanceSparePartError,
  MaintenanceSparePartErrorCodes,
} from "../repositories/maintenance-spare-part-repository";
import {
  MaintenanceSparePartBase,
  MaintenanceSparePartWithDetails,
  MaintenanceSparePartCreate,
  MaintenanceSparePartUpdate,
  MultiMaintenanceSparePart,
  MaintenanceSparePartSummary,
  MostUsedSparePart,
  BulkMaintenanceSparePartUpdate,
} from "@/types/maintenance-spare-part";

/**
 * Servicio para gestionar repuestos en registros de mantenimiento
 * Proporciona lógica de negocio y validaciones adicionales
 */
class MaintenanceSparePartService {
  private repository = maintenanceSparePartRepository;

  constructor() {}

  /**
   * Crear un nuevo registro de repuesto en mantenimiento
   * @param maintenanceSparePart - Datos del repuesto a agregar
   * @returns El registro creado
   */
  async create(
    maintenanceSparePart: MaintenanceSparePartCreate
  ): Promise<{ id: string; created_at: Date } | null> {
    try {
      // Validaciones de negocio adicionales
      await this.validateBusinessRules(maintenanceSparePart);

      return await this.repository.create(maintenanceSparePart);
    } catch (error) {
      console.error("Error al crear el repuesto de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Obtener un registro de repuesto por su ID
   * @param id - ID del registro a buscar
   * @returns El registro encontrado o null si no existe
   */
  async getById(id: string): Promise<MaintenanceSparePartBase | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error(
        "Error al obtener el repuesto de mantenimiento por ID:",
        error
      );
      throw error;
    }
  }

  /**
   * Obtener todos los repuestos de un registro de mantenimiento
   * @param maintenanceRecordId - ID del registro de mantenimiento
   * @param userId - ID del usuario
   * @returns Lista de repuestos del mantenimiento
   */
  async getByMaintenanceRecord(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceSparePartBase[]> {
    try {
      return await this.repository.getByMaintenanceRecord(
        maintenanceRecordId,
        userId
      );
    } catch (error) {
      console.error("Error al obtener repuestos por mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Obtener repuestos de mantenimiento con detalles del repuesto
   * @param maintenanceRecordId - ID del registro de mantenimiento
   * @param userId - ID del usuario
   * @returns Lista de repuestos con detalles completos
   */
  async getByMaintenanceRecordWithDetails(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceSparePartWithDetails[]> {
    try {
      return await this.repository.getByMaintenanceRecordWithDetails(
        maintenanceRecordId,
        userId
      );
    } catch (error) {
      console.error("Error al obtener repuestos con detalles:", error);
      throw error;
    }
  }

  /**
   * Obtener todos los registros de repuestos de mantenimiento de un usuario
   * @param limit - Límite de registros por página
   * @param offset - Offset para paginación
   * @param userId - ID del usuario
   * @returns Lista paginada de repuestos de mantenimiento
   */
  async getAll(
    limit: number,
    offset: number,
    userId: string
  ): Promise<MultiMaintenanceSparePart> {
    try {
      return await this.repository.getAll(limit, offset, userId);
    } catch (error) {
      console.error(
        "Error al obtener todos los repuestos de mantenimiento:",
        error
      );
      throw error;
    }
  }

  /**
   * Actualizar un registro de repuesto en mantenimiento
   * @param maintenanceSparePart - Datos actualizados del repuesto
   * @returns El ID del registro actualizado
   */
  async update(
    maintenanceSparePart: MaintenanceSparePartUpdate
  ): Promise<{ id: string } | null> {
    try {
      // Validar que el registro existe antes de actualizar
      const existingRecord = await this.repository.getById(
        maintenanceSparePart.id
      );
      if (!existingRecord) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.NOT_FOUND,
          `Maintenance spare part with ID ${maintenanceSparePart.id} not found`
        );
      }

      // Validaciones de negocio para actualizaciones
      await this.validateUpdateBusinessRules(maintenanceSparePart);

      return await this.repository.update(maintenanceSparePart);
    } catch (error) {
      console.error("Error al actualizar el repuesto de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Eliminar un registro de repuesto en mantenimiento
   * @param id - ID del registro a eliminar
   * @param userId - ID del usuario
   * @returns El ID del registro eliminado
   */
  async delete(id: string, userId: string): Promise<{ id: string } | null> {
    try {
      // Validar que el registro existe antes de eliminar
      const existingRecord = await this.repository.getById(id);
      if (!existingRecord) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.NOT_FOUND,
          `Maintenance spare part with ID ${id} not found`
        );
      }

      return await this.repository.delete({ id, user_id: userId });
    } catch (error) {
      console.error("Error al eliminar el repuesto de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Obtener resumen de repuestos para un mantenimiento
   * @param maintenanceRecordId - ID del registro de mantenimiento
   * @param userId - ID del usuario
   * @returns Resumen con totales y estadísticas
   */
  async getMaintenanceSummary(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceSparePartSummary> {
    try {
      return await this.repository.getMaintenanceSummary(
        maintenanceRecordId,
        userId
      );
    } catch (error) {
      console.error("Error al obtener resumen de repuestos:", error);
      throw error;
    }
  }

  /**
   * Obtener repuestos más utilizados por usuario
   * @param userId - ID del usuario
   * @param limit - Límite de resultados
   * @returns Lista de repuestos más utilizados con estadísticas
   */
  async getMostUsedSpareParts(
    userId: string,
    limit: number = 10
  ): Promise<MostUsedSparePart[]> {
    try {
      return await this.repository.getMostUsedSpareParts(userId, limit);
    } catch (error) {
      console.error("Error al obtener repuestos más utilizados:", error);
      throw error;
    }
  }

  /**
   * Actualización masiva de repuestos para un mantenimiento
   * @param bulkUpdate - Datos para actualización masiva
   * @returns Resultado de la operación
   */
  async bulkUpdate(bulkUpdate: BulkMaintenanceSparePartUpdate): Promise<{
    maintenance_record_id: string;
    created_spare_parts: { id: string; created_at: Date }[];
  }> {
    try {
      // Validaciones de negocio para actualización masiva
      await this.validateBulkUpdateBusinessRules(bulkUpdate);

      return await this.repository.bulkUpdate(bulkUpdate);
    } catch (error) {
      console.error("Error en actualización masiva de repuestos:", error);
      throw error;
    }
  }

  /**
   * Verificar si existe un registro de repuesto en mantenimiento
   * @param id - ID del registro
   * @param userId - ID del usuario
   * @returns true si existe, false en caso contrario
   */
  async exists(id: string, userId: string): Promise<boolean> {
    try {
      return await this.repository.exists(id, userId);
    } catch (error) {
      console.error("Error al verificar existencia del repuesto:", error);
      throw error;
    }
  }

  /**
   * Agregar repuesto a mantenimiento (método de conveniencia)
   * @param maintenanceRecordId - ID del mantenimiento
   * @param sparePartId - ID del repuesto
   * @param quantity - Cantidad a agregar
   * @param unitPrice - Precio unitario (opcional)
   * @param userId - ID del usuario
   * @returns El registro creado
   */
  async addSparePartToMaintenance(
    maintenanceRecordId: string,
    sparePartId: string,
    quantity: number,
    unitPrice: number | undefined,
    userId: string
  ): Promise<{ id: string; created_at: Date } | null> {
    try {
      // Verificar que el repuesto no esté ya en el mantenimiento
      const alreadyExists = await this.repository.existsSparePartInMaintenance(
        maintenanceRecordId,
        sparePartId,
        userId
      );

      if (alreadyExists) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.DUPLICATE_SPARE_PART,
          "Spare part already exists in this maintenance record. Use update instead."
        );
      }

      return await this.create({
        maintenance_record_id: maintenanceRecordId,
        spare_part_id: sparePartId,
        quantity,
        unit_price: unitPrice,
        user_id: userId,
      });
    } catch (error) {
      console.error("Error al agregar repuesto al mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Actualizar cantidad de un repuesto en mantenimiento
   * @param id - ID del registro
   * @param newQuantity - Nueva cantidad
   * @param userId - ID del usuario
   * @returns El ID del registro actualizado
   */
  async updateQuantity(
    id: string,
    newQuantity: number,
    userId: string
  ): Promise<{ id: string } | null> {
    try {
      if (newQuantity <= 0) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.INVALID_QUANTITY,
          "Quantity must be greater than zero"
        );
      }

      return await this.update({
        id,
        quantity: newQuantity,
        user_id: userId,
      });
    } catch (error) {
      console.error("Error al actualizar cantidad del repuesto:", error);
      throw error;
    }
  }

  /**
   * Actualizar precio unitario de un repuesto en mantenimiento
   * @param id - ID del registro
   * @param newUnitPrice - Nuevo precio unitario
   * @param userId - ID del usuario
   * @returns El ID del registro actualizado
   */
  async updateUnitPrice(
    id: string,
    newUnitPrice: number,
    userId: string
  ): Promise<{ id: string } | null> {
    try {
      if (newUnitPrice < 0) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.INVALID_PRICE,
          "Unit price cannot be negative"
        );
      }

      return await this.update({
        id,
        unit_price: newUnitPrice,
        user_id: userId,
      });
    } catch (error) {
      console.error("Error al actualizar precio del repuesto:", error);
      throw error;
    }
  }

  /**
   * Obtener el costo total de repuestos para un mantenimiento
   * @param maintenanceRecordId - ID del mantenimiento
   * @param userId - ID del usuario
   * @returns Costo total
   */
  async getTotalCostByMaintenance(
    maintenanceRecordId: string,
    userId: string
  ): Promise<number> {
    try {
      return await this.repository.getTotalCostByMaintenance(
        maintenanceRecordId,
        userId
      );
    } catch (error) {
      console.error("Error al obtener costo total de repuestos:", error);
      throw error;
    }
  }

  /**
   * Buscar repuestos por nombre o número de parte
   * @param query - Texto a buscar
   * @param userId - ID del usuario
   * @param limit - Límite de resultados
   * @returns Lista de repuestos que coinciden con la búsqueda
   */
  async searchBySparePartName(
    query: string,
    userId: string,
    limit: number = 50
  ): Promise<MaintenanceSparePartWithDetails[]> {
    try {
      if (!query.trim()) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.DATABASE_ERROR,
          "Search query cannot be empty"
        );
      }

      return await this.repository.searchBySparePartName(
        query.trim(),
        userId,
        limit
      );
    } catch (error) {
      console.error("Error al buscar repuestos por nombre:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de uso de repuestos para un usuario
   * @param userId - ID del usuario
   * @returns Estadísticas de uso de repuestos
   */
  async getSparePartUsageStatistics(userId: string): Promise<{
    total_spare_parts_used: number;
    total_maintenance_records_with_spare_parts: number;
    average_spare_parts_per_maintenance: number;
    total_cost_spent: number;
    most_expensive_maintenance: string | null;
    most_used_spare_part: MostUsedSparePart | null;
  }> {
    try {
      const [allSpareParts, mostUsed] = await Promise.all([
        this.repository.getAll(1000, 0, userId), // Obtener muchos para estadísticas
        this.repository.getMostUsedSpareParts(userId, 1),
      ]);

      // Agrupar por mantenimiento para calcular estadísticas
      const maintenanceGroups = allSpareParts.data.reduce(
        (groups, sparePart) => {
          const maintenanceId = sparePart.maintenance_record_id;
          if (!groups[maintenanceId]) {
            groups[maintenanceId] = [];
          }
          groups[maintenanceId].push(sparePart);
          return groups;
        },
        {} as Record<string, MaintenanceSparePartBase[]>
      );

      const maintenanceRecordsWithSpareParts =
        Object.keys(maintenanceGroups).length;
      const totalSparePartsUsed = allSpareParts.data.length;
      const averageSparePartsPerMaintenance =
        maintenanceRecordsWithSpareParts > 0
          ? totalSparePartsUsed / maintenanceRecordsWithSpareParts
          : 0;

      // Calcular costo total y mantenimiento más costoso
      let totalCostSpent = 0;
      let mostExpensiveMaintenanceId: string | null = null;
      let maxMaintenanceCost = 0;

      for (const [maintenanceId, spareParts] of Object.entries(
        maintenanceGroups
      )) {
        const maintenanceCost = spareParts.reduce((sum, sp) => {
          if (sp.unit_price) {
            return sum + sp.quantity * sp.unit_price;
          }
          return sum;
        }, 0);

        totalCostSpent += maintenanceCost;

        if (maintenanceCost > maxMaintenanceCost) {
          maxMaintenanceCost = maintenanceCost;
          mostExpensiveMaintenanceId = maintenanceId;
        }
      }

      return {
        total_spare_parts_used: totalSparePartsUsed,
        total_maintenance_records_with_spare_parts:
          maintenanceRecordsWithSpareParts,
        average_spare_parts_per_maintenance:
          Math.round(averageSparePartsPerMaintenance * 100) / 100,
        total_cost_spent: totalCostSpent,
        most_expensive_maintenance: mostExpensiveMaintenanceId,
        most_used_spare_part: mostUsed.length > 0 ? mostUsed[0] : null,
      };
    } catch (error) {
      console.error(
        "Error al obtener estadísticas de uso de repuestos:",
        error
      );
      throw error;
    }
  }

  /**
   * Validaciones de reglas de negocio para creación
   * @param maintenanceSparePart - Datos del repuesto a validar
   */
  private async validateBusinessRules(
    maintenanceSparePart: MaintenanceSparePartCreate
  ): Promise<void> {
    // Validar cantidad mínima y máxima razonable
    if (maintenanceSparePart.quantity <= 0) {
      throw new MaintenanceSparePartError(
        MaintenanceSparePartErrorCodes.INVALID_QUANTITY,
        "Quantity must be greater than zero"
      );
    }

    if (maintenanceSparePart.quantity > 1000) {
      throw new MaintenanceSparePartError(
        MaintenanceSparePartErrorCodes.INVALID_QUANTITY,
        "Quantity cannot exceed 1000 units per maintenance record"
      );
    }

    // Validar precio unitario
    if (maintenanceSparePart.unit_price !== undefined) {
      if (maintenanceSparePart.unit_price < 0) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.INVALID_PRICE,
          "Unit price cannot be negative"
        );
      }

      if (maintenanceSparePart.unit_price > 100000) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.INVALID_PRICE,
          "Unit price cannot exceed $100,000 per unit"
        );
      }
    }

    // Verificar que el repuesto no esté ya en el mantenimiento
    const alreadyExists = await this.repository.existsSparePartInMaintenance(
      maintenanceSparePart.maintenance_record_id,
      maintenanceSparePart.spare_part_id,
      maintenanceSparePart.user_id
    );

    if (alreadyExists) {
      throw new MaintenanceSparePartError(
        MaintenanceSparePartErrorCodes.DUPLICATE_SPARE_PART,
        "Spare part already exists in this maintenance record"
      );
    }
  }

  /**
   * Validaciones de reglas de negocio para actualización
   * @param updateData - Datos de actualización
   * @param existingRecord - Registro existente
   */
  private async validateUpdateBusinessRules(
    updateData: MaintenanceSparePartUpdate
  ): Promise<void> {
    // Validar cantidad si se está actualizando
    if (updateData.quantity !== undefined) {
      if (updateData.quantity <= 0) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.INVALID_QUANTITY,
          "Quantity must be greater than zero"
        );
      }

      if (updateData.quantity > 1000) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.INVALID_QUANTITY,
          "Quantity cannot exceed 1000 units per maintenance record"
        );
      }
    }

    // Validar precio unitario si se está actualizando
    if (updateData.unit_price !== undefined) {
      if (updateData.unit_price < 0) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.INVALID_PRICE,
          "Unit price cannot be negative"
        );
      }

      if (updateData.unit_price > 100000) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.INVALID_PRICE,
          "Unit price cannot exceed $100,000 per unit"
        );
      }
    }
  }

  /**
   * Validaciones de reglas de negocio para actualización masiva
   * @param bulkUpdate - Datos de actualización masiva
   */
  private async validateBulkUpdateBusinessRules(
    bulkUpdate: BulkMaintenanceSparePartUpdate
  ): Promise<void> {
    if (!bulkUpdate.spare_parts || bulkUpdate.spare_parts.length === 0) {
      throw new MaintenanceSparePartError(
        MaintenanceSparePartErrorCodes.DATABASE_ERROR,
        "Spare parts list cannot be empty for bulk update"
      );
    }

    if (bulkUpdate.spare_parts.length > 50) {
      throw new MaintenanceSparePartError(
        MaintenanceSparePartErrorCodes.DATABASE_ERROR,
        "Cannot update more than 50 spare parts at once"
      );
    }

    // Validar cada repuesto en la lista
    for (const sparePart of bulkUpdate.spare_parts) {
      if (sparePart.quantity <= 0 || sparePart.quantity > 1000) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.INVALID_QUANTITY,
          `Invalid quantity for spare part ${sparePart.spare_part_id}: must be between 1 and 1000`
        );
      }

      if (
        sparePart.unit_price !== undefined &&
        (sparePart.unit_price < 0 || sparePart.unit_price > 100000)
      ) {
        throw new MaintenanceSparePartError(
          MaintenanceSparePartErrorCodes.INVALID_PRICE,
          `Invalid unit price for spare part ${sparePart.spare_part_id}: must be between 0 and 100000`
        );
      }
    }

    // Verificar que no hay repuestos duplicados en la lista
    const sparePartIds = bulkUpdate.spare_parts.map((sp) => sp.spare_part_id);
    const uniqueIds = new Set(sparePartIds);
    if (uniqueIds.size !== sparePartIds.length) {
      throw new MaintenanceSparePartError(
        MaintenanceSparePartErrorCodes.DUPLICATE_SPARE_PART,
        "Duplicate spare parts found in bulk update list"
      );
    }
  }
}

export const maintenanceSparePartService = new MaintenanceSparePartService();
