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
   * Actualización masiva de repuestos para un mantenimiento
   * @param bulkUpdate - Datos para actualización masiva
   * @returns Resultado de la operación
   */
  async bulkUpdate(bulkUpdate: BulkMaintenanceSparePartUpdate): Promise<{
    maintenance_record_id: string;
    processed_spare_parts: { id: string; created_at: Date }[];
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
