import { pool } from "@/lib/supabase";
import { Pool } from "pg";
import {
  MaintenanceSparePartBase,
  MaintenanceSparePartWithDetails,
  MaintenanceSparePartCreate,
  MaintenanceSparePartUpdate,
  MultiMaintenanceSparePart,
  DeleteMaintenanceSparePart,
  BulkMaintenanceSparePartUpdate,
} from "@/types/maintenance-spare-part";
import { GlobalErrorResponse } from "@/lib/errors";

// Error handling
export class MaintenanceSparePartError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = "MaintenanceSparePartError";
  }
}

export enum MaintenanceSparePartErrorCodes {
  NOT_FOUND = "MAINTENANCE_SPARE_PART_NOT_FOUND",
  MAINTENANCE_RECORD_NOT_FOUND = "MAINTENANCE_RECORD_NOT_FOUND",
  SPARE_PART_NOT_FOUND = "SPARE_PART_NOT_FOUND",
  DUPLICATE_SPARE_PART = "DUPLICATE_SPARE_PART",
  INVALID_QUANTITY = "INVALID_QUANTITY",
  INVALID_PRICE = "INVALID_PRICE",
  ACCESS_DENIED = "ACCESS_DENIED",
  DATABASE_ERROR = "DATABASE_ERROR",
}

class MaintenanceSparePartRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * Crear nuevo registro de repuesto en mantenimiento
   */
  async create(
    maintenanceSparePart: MaintenanceSparePartCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      const result = await this.db.query(
        "SELECT mnt.create_maintenance_spare_part($1, $2, $3, $4, $5)",
        [
          maintenanceSparePart.maintenance_record_id,
          maintenanceSparePart.spare_part_id,
          maintenanceSparePart.quantity,
          maintenanceSparePart.unit_price || null,
          maintenanceSparePart.user_id,
        ]
      );

      const response = result.rows[0].create_maintenance_spare_part;
      return {
        id: response.id,
        created_at: new Date(response.created_at),
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "create", {
        maintenanceSparePart,
      });
    }
  }

  /**
   * Obtener registro de repuesto en mantenimiento por ID
   */
  async getById(id: string): Promise<MaintenanceSparePartBase | null> {
    try {
      const result = await this.db.query(
        "SELECT mnt.get_maintenance_spare_part_by_id($1)",
        [id]
      );

      const sparePartData = result.rows[0].get_maintenance_spare_part_by_id;

      if (!sparePartData) {
        return null;
      }

      return this.mapToMaintenanceSparePart(sparePartData);
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "getById", { id });
    }
  }

  /**
   * Obtener repuestos de mantenimiento con detalles del repuesto
   */
  async getByMaintenanceRecordWithDetails(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceSparePartWithDetails[]> {
    try {
      const result = await this.db.query(
        "SELECT mnt.get_maintenance_spare_parts_with_details($1, $2)",
        [maintenanceRecordId, userId]
      );

      const spareParts =
        result.rows[0].get_maintenance_spare_parts_with_details;

      if (!spareParts || spareParts.length === 0) {
        return [];
      }

      return spareParts.map((sparePart: MaintenanceSparePartWithDetails) =>
        this.mapToMaintenanceSparePartWithDetails(sparePart)
      );
    } catch (err) {
      this.handleError(
        err as GlobalErrorResponse,
        "getByMaintenanceRecordWithDetails",
        {
          maintenanceRecordId,
          userId,
        }
      );
    }
  }

  /**
   * Obtener todos los registros de repuestos de mantenimiento de un usuario con paginación
   */
  async getAll(
    limit: number = 100,
    offset: number = 0,
    userId: string
  ): Promise<MultiMaintenanceSparePart> {
    try {
      const result = await this.db.query(
        "SELECT mnt.get_all_maintenance_spare_parts($1, $2, $3)",
        [userId, limit, offset]
      );

      const response = result.rows[0].get_all_maintenance_spare_parts;

      const data: MaintenanceSparePartBase[] = response.data.map(
        (sparePart: MaintenanceSparePartBase) =>
          this.mapToMaintenanceSparePart(sparePart)
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data,
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "getAll", {
        limit,
        offset,
        userId,
      });
    }
  }

  /**
   * Actualizar registro de repuesto en mantenimiento
   */
  async update(
    maintenanceSparePart: MaintenanceSparePartUpdate
  ): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT mnt.update_maintenance_spare_part($1, $2, $3, $4)",
        [
          maintenanceSparePart.id,
          maintenanceSparePart.quantity || null,
          maintenanceSparePart.unit_price || null,
          maintenanceSparePart.user_id,
        ]
      );

      const response = result.rows[0].update_maintenance_spare_part;
      return {
        id: response.id,
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "update", {
        maintenanceSparePart,
      });
    }
  }

  /**
   * Eliminar registro de repuesto en mantenimiento
   */
  async delete(
    deleteSparePart: DeleteMaintenanceSparePart
  ): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT mnt.delete_maintenance_spare_part($1, $2)",
        [deleteSparePart.id, deleteSparePart.user_id]
      );

      const response = result.rows[0].delete_maintenance_spare_part;
      return {
        id: response.id,
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "delete", {
        id: deleteSparePart.id,
        userId: deleteSparePart.user_id,
      });
    }
  }

  /**
   * Actualización masiva de repuestos para un mantenimiento
   */
  async bulkUpdate(bulkUpdate: BulkMaintenanceSparePartUpdate): Promise<{
    maintenance_record_id: string;
    processed_spare_parts: { id: string; created_at: Date }[];
  }> {
    try {
      console.log("Bulk updating maintenance spare parts:", bulkUpdate);
      const result = await this.db.query(
        "SELECT mnt.bulk_update_maintenance_spare_parts($1, $2, $3)",
        [
          bulkUpdate.maintenance_record_id,
          JSON.stringify(bulkUpdate.spare_parts),
          bulkUpdate.user_id,
        ]
      );

      const response = result.rows[0].bulk_update_maintenance_spare_parts;
      return {
        maintenance_record_id: response.maintenance_record_id,
        processed_spare_parts: response.processed_spare_parts,
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "bulkUpdate", {
        bulkUpdate,
      });
    }
  }

  /**
   * Verificar si existe un registro de repuesto en mantenimiento
   */
  async exists(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        `
        SELECT EXISTS(
          SELECT 1 
          FROM mnt.maintenance_spare_parts msp
          INNER JOIN mnt.maintenance_records mr ON msp.maintenance_record_id = mr.id
          WHERE msp.id = $1 AND mr.user_id = $2
        ) as exists
      `,
        [id, userId]
      );

      return result.rows[0].exists;
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "exists", { id, userId });
    }
  }

  /**
   * Verificar si un repuesto ya está en un mantenimiento
   */
  async existsSparePartInMaintenance(
    maintenanceRecordId: string,
    sparePartId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const result = await this.db.query(
        `
        SELECT EXISTS(
          SELECT 1 
          FROM mnt.maintenance_spare_parts msp
          INNER JOIN mnt.maintenance_records mr ON msp.maintenance_record_id = mr.id
          WHERE msp.maintenance_record_id = $1 
            AND msp.spare_part_id = $2 
            AND mr.user_id = $3
        ) as exists
      `,
        [maintenanceRecordId, sparePartId, userId]
      );

      return result.rows[0].exists;
    } catch (err) {
      this.handleError(
        err as GlobalErrorResponse,
        "existsSparePartInMaintenance",
        {
          maintenanceRecordId,
          sparePartId,
          userId,
        }
      );
    }
  }

  /**
   * Mapear datos de la base de datos a MaintenanceSparePartBase
   */
  private mapToMaintenanceSparePart(
    data: MaintenanceSparePartBase
  ): MaintenanceSparePartBase {
    return {
      id: data.id,
      maintenance_record_id: data.maintenance_record_id,
      spare_part_id: data.spare_part_id,
      quantity: data.quantity,
      unit_price: data.unit_price,
      created_at: new Date(data.created_at),
    };
  }

  /**
   * Mapear datos de la base de datos a MaintenanceSparePartWithDetails
   */
  private mapToMaintenanceSparePartWithDetails(
    data: MaintenanceSparePartWithDetails
  ): MaintenanceSparePartWithDetails {
    const baseSparePart = this.mapToMaintenanceSparePart(data);

    return {
      ...baseSparePart,
      spare_part: data.spare_part
        ? {
            id: data.spare_part.id,
            name: data.spare_part.name,
            factory_code: data.spare_part.factory_code,
            description: data.spare_part.description,
            unit_price: data.spare_part.unit_price,
            created_at: new Date(data.spare_part.created_at || data.created_at),
            updated_at: data.spare_part.updated_at
              ? new Date(data.spare_part.updated_at)
              : undefined,
            user_id: data.spare_part.user_id,
          }
        : undefined,
      total_cost: data.total_cost,
    };
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(
    err: GlobalErrorResponse,
    operation: string,
    context?: unknown
  ): never {
    // Log estructurado del error
    console.error({
      operation: `maintenance_spare_part.${operation}`,
      error: err.message,
      context,
      stack: err.stack,
    });

    if (err instanceof MaintenanceSparePartError) {
      throw err;
    }

    // Manejo de errores específicos de PostgreSQL
    if (
      err.message?.includes("Maintenance record with ID") &&
      err.message?.includes("not found")
    ) {
      throw new MaintenanceSparePartError(
        MaintenanceSparePartErrorCodes.MAINTENANCE_RECORD_NOT_FOUND,
        "Maintenance record not found or access denied"
      );
    }

    if (
      err.message?.includes("Spare part with ID") &&
      err.message?.includes("not found")
    ) {
      throw new MaintenanceSparePartError(
        MaintenanceSparePartErrorCodes.SPARE_PART_NOT_FOUND,
        "Spare part not found or access denied"
      );
    }

    if (
      err.message?.includes(
        "Spare part already exists in this maintenance record"
      )
    ) {
      throw new MaintenanceSparePartError(
        MaintenanceSparePartErrorCodes.DUPLICATE_SPARE_PART,
        "Spare part already exists in this maintenance record"
      );
    }

    if (err.message?.includes("Quantity must be greater than zero")) {
      throw new MaintenanceSparePartError(
        MaintenanceSparePartErrorCodes.INVALID_QUANTITY,
        "Quantity must be greater than zero"
      );
    }

    if (err.message?.includes("Unit price cannot be negative")) {
      throw new MaintenanceSparePartError(
        MaintenanceSparePartErrorCodes.INVALID_PRICE,
        "Unit price cannot be negative"
      );
    }

    if (
      err.message?.includes("Maintenance spare part with ID") &&
      err.message?.includes("not found")
    ) {
      throw new MaintenanceSparePartError(
        MaintenanceSparePartErrorCodes.NOT_FOUND,
        "Maintenance spare part not found"
      );
    }

    // Error genérico de base de datos
    throw new MaintenanceSparePartError(
      MaintenanceSparePartErrorCodes.DATABASE_ERROR,
      `Database operation failed: ${err.message}`
    );
  }
}

export const maintenanceSparePartRepository =
  new MaintenanceSparePartRepository();
