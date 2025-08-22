import { pool } from "@/lib/supabase";
import { Pool, PoolClient } from "pg";
import {
  MaintenanceSparePartBase,
  MaintenanceSparePartWithDetails,
  MaintenanceSparePartCreate,
  MaintenanceSparePartUpdate,
  MultiMaintenanceSparePart,
  DeleteMaintenanceSparePart,
  MaintenanceSparePartSummary,
  MostUsedSparePart,
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
        "SELECT create_maintenance_spare_part($1, $2, $3, $4, $5)",
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
        "SELECT get_maintenance_spare_part_by_id($1)",
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
   * Obtener todos los repuestos de un registro de mantenimiento
   */
  async getByMaintenanceRecord(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceSparePartBase[]> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_spare_parts_by_maintenance($1, $2)",
        [maintenanceRecordId, userId]
      );

      const spareParts =
        result.rows[0].get_maintenance_spare_parts_by_maintenance;

      if (!spareParts || spareParts.length === 0) {
        return [];
      }

      return spareParts.map((sparePart: MaintenanceSparePartBase) =>
        this.mapToMaintenanceSparePart(sparePart)
      );
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "getByMaintenanceRecord", {
        maintenanceRecordId,
        userId,
      });
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
        "SELECT get_maintenance_spare_parts_with_details($1, $2)",
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
        "SELECT get_all_maintenance_spare_parts($1, $2, $3)",
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
        "SELECT update_maintenance_spare_part($1, $2, $3, $4)",
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
        "SELECT delete_maintenance_spare_part($1, $2)",
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
   * Obtener resumen de repuestos para un mantenimiento
   */
  async getMaintenanceSummary(
    maintenanceRecordId: string,
    userId: string
  ): Promise<MaintenanceSparePartSummary> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_spare_parts_summary($1, $2)",
        [maintenanceRecordId, userId]
      );

      const summary = result.rows[0].get_maintenance_spare_parts_summary;

      return {
        maintenance_record_id: summary.maintenance_record_id,
        total_spare_parts: summary.total_spare_parts,
        total_quantity: summary.total_quantity,
        total_cost: summary.total_cost,
        spare_parts_list: summary.spare_parts_list || [],
      };
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "getMaintenanceSummary", {
        maintenanceRecordId,
        userId,
      });
    }
  }

  /**
   * Obtener repuestos más utilizados por usuario
   */
  async getMostUsedSpareParts(
    userId: string,
    limit: number = 10
  ): Promise<MostUsedSparePart[]> {
    try {
      const result = await this.db.query(
        "SELECT get_most_used_spare_parts($1, $2)",
        [userId, limit]
      );

      const mostUsed = result.rows[0].get_most_used_spare_parts;

      if (!mostUsed || mostUsed.length === 0) {
        return [];
      }

      return mostUsed.map((item: MostUsedSparePart) => ({
        spare_part_id: item.spare_part_id,
        spare_part_name: item.spare_part_name,
        part_number: item.part_number,
        total_usage_count: item.total_usage_count,
        total_quantity_used: item.total_quantity_used,
        average_quantity_per_maintenance: item.average_quantity_per_maintenance,
      }));
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "getMostUsedSpareParts", {
        userId,
        limit,
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
        "SELECT bulk_update_maintenance_spare_parts($1, $2, $3)",
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
   * Obtener el costo total de repuestos para un mantenimiento
   */
  async getTotalCostByMaintenance(
    maintenanceRecordId: string,
    userId: string
  ): Promise<number> {
    try {
      const summary = await this.getMaintenanceSummary(
        maintenanceRecordId,
        userId
      );
      return summary.total_cost || 0;
    } catch (err) {
      this.handleError(
        err as GlobalErrorResponse,
        "getTotalCostByMaintenance",
        {
          maintenanceRecordId,
          userId,
        }
      );
    }
  }

  /**
   * Buscar repuestos por nombre o número de parte
   */
  async searchBySparePartName(
    query: string,
    userId: string,
    limit: number = 50
  ): Promise<MaintenanceSparePartWithDetails[]> {
    try {
      const result = await this.db.query(
        `
        SELECT json_agg(
          json_build_object(
            'id', msp.id,
            'maintenance_record_id', msp.maintenance_record_id,
            'spare_part_id', msp.spare_part_id,
            'quantity', msp.quantity,
            'unit_price', msp.unit_price,
            'created_at', msp.created_at,
            'spare_part', json_build_object(
              'id', sp.id,
              'name', sp.name,
              'part_number', sp.part_number,
              'description', sp.description,
              'unit_price', sp.unit_price,
              'stock_quantity', sp.stock_quantity,
              'supplier', sp.supplier,
              'category', sp.category
            ),
            'total_cost', CASE
              WHEN msp.unit_price IS NOT NULL THEN msp.quantity * msp.unit_price
              WHEN sp.unit_price IS NOT NULL THEN msp.quantity * sp.unit_price
              ELSE NULL
            END
          )
        ) as spare_parts
        FROM mnt.maintenance_spare_parts msp
        INNER JOIN mnt.spare_parts sp ON msp.spare_part_id = sp.id
        INNER JOIN mnt.maintenance_records mr ON msp.maintenance_record_id = mr.id
        WHERE mr.user_id = $1 
          AND (sp.name ILIKE $2 OR sp.part_number ILIKE $2)
        ORDER BY msp.created_at DESC
        LIMIT $3
      `,
        [userId, `%${query}%`, limit]
      );

      const spareParts = result.rows[0].spare_parts || [];
      return spareParts.map((sparePart: MaintenanceSparePartWithDetails) =>
        this.mapToMaintenanceSparePartWithDetails(sparePart)
      );
    } catch (err) {
      this.handleError(err as GlobalErrorResponse, "searchBySparePartName", {
        query,
        userId,
        limit,
      });
    }
  }

  /**
   * Operación con transacción
   */
  async withTransaction<T>(
    operation: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
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
