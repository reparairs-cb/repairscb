import { pool } from "@/lib/supabase";
import { Pool, PoolClient } from "pg";
import {
  MaintenanceRecordBase,
  MaintenanceRecordWithDetails,
  MaintenanceRecordCreate,
  MaintenanceRecordUpdate,
  MultiMaintenanceRecord,
  DeleteMaintenanceRecord,
} from "@/types/maintenance-record";
import { MaintenanceRecordErrorCodes } from "@/lib/errors";

// Error handling
export class MaintenanceRecordError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = "MaintenanceRecordError";
  }
}

class MaintenanceRecordRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * Crear nuevo registro de mantenimiento
   */
  async create(
    maintenanceRecord: MaintenanceRecordCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      // Validar fechas en el cliente antes de enviar a la base de datos
      if (
        maintenanceRecord.end_datetime &&
        maintenanceRecord.end_datetime <= maintenanceRecord.start_datetime
      ) {
        throw new MaintenanceRecordError(
          MaintenanceRecordErrorCodes.INVALID_DATETIME_RANGE,
          "End datetime must be after start datetime"
        );
      }

      const result = await this.db.query(
        "SELECT create_maintenance_record($1, $2, $3, $4, $5, $6, $7)",
        [
          maintenanceRecord.equipment_id,
          maintenanceRecord.start_datetime,
          maintenanceRecord.end_datetime || null,
          maintenanceRecord.maintenance_type_id,
          maintenanceRecord.observations || null,
          maintenanceRecord.mileage_record_id,
          maintenanceRecord.user_id,
        ]
      );

      const response = result.rows[0].create_maintenance_record;
      return {
        id: response.id,
        created_at: new Date(response.created_at),
      };
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "create", {
        maintenanceRecord,
      });
    }
  }

  /**
   * Obtener registro de mantenimiento por ID
   */
  async getById(id: string): Promise<MaintenanceRecordBase | null> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_record_by_id($1)",
        [id]
      );

      const recordData = result.rows[0].get_maintenance_record_by_id;

      if (!recordData) {
        return null;
      }

      return this.mapToMaintenanceRecord(recordData);
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "getById", {
        id,
      });
    }
  }

  /**
   * Obtener todos los registros de mantenimiento con paginación
   */
  async getAll(
    limit: number = 10,
    offset: number = 0,
    user_id: string
  ): Promise<MultiMaintenanceRecord> {
    try {
      const result = await this.db.query(
        "SELECT get_all_maintenance_records($1, $2, $3)",
        [user_id, limit, offset]
      );

      const response = result.rows[0].get_all_maintenance_records;

      const data: MaintenanceRecordBase[] = response.data.map(
        (record: MaintenanceRecordBase) => this.mapToMaintenanceRecord(record)
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data,
      };
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "getAll", {
        limit,
        offset,
        user_id,
      });
    }
  }

  /**
   * Obtener registros de mantenimiento con detalles (equipment, maintenance_type, etc.)
   */
  async getAllWithDetails(
    limit: number = 10,
    offset: number = 0,
    user_id: string
  ): Promise<{
    total: number;
    limit: number;
    offset: number;
    pages: number;
    data: MaintenanceRecordWithDetails[];
  }> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_records_with_details($1, $2, $3)",
        [user_id, limit, offset]
      );

      const response = result.rows[0].get_maintenance_records_with_details;

      const data: MaintenanceRecordWithDetails[] = response.data.map(
        (record: MaintenanceRecordWithDetails) =>
          this.mapToMaintenanceRecordWithDetails(record)
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data,
      };
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "getAllWithDetails",
        { limit, offset, user_id }
      );
    }
  }

  /**
   * Obtener registros de mantenimiento por equipo
   */
  async getByEquipment(
    equipment_id: string,
    user_id: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    total: number;
    limit: number;
    offset: number;
    pages: number;
    equipment_id: string;
    data: MaintenanceRecordBase[];
  }> {
    try {
      const result = await this.db.query(
        "SELECT get_maintenance_records_by_equipment($1, $2, $3, $4)",
        [equipment_id, user_id, limit, offset]
      );

      const response = result.rows[0].get_maintenance_records_by_equipment;

      const data: MaintenanceRecordBase[] = response.data.map(
        (record: MaintenanceRecordBase) => this.mapToMaintenanceRecord(record)
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        equipment_id: response.equipment_id,
        data,
      };
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "getByEquipment",
        {
          equipment_id,
          user_id,
          limit,
          offset,
        }
      );
    }
  }

  async getByEquipmentWithSearchTerm(
    equipment_id: string,
    search_term: string,
    user_id: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    total: number;
    limit: number;
    offset: number;
    pages: number;
    equipment_id: string;
    data: MaintenanceRecordWithDetails[];
  }> {
    try {
      const result = await this.db.query(
        "SELECT get_last_maintenance_records_by_equipment_search_term($1, $2, $3, $4, $5)",
        [user_id, equipment_id, search_term, limit, offset]
      );

      const response =
        result.rows[0].get_last_maintenance_records_by_equipment_search_term;

      const data: MaintenanceRecordWithDetails[] = response.data.map(
        (record: MaintenanceRecordWithDetails) =>
          this.mapToMaintenanceRecordWithDetails(record)
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        equipment_id: response.equipment_id,
        data,
      };
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "getByEquipment",
        {
          equipment_id,
          user_id,
          limit,
          offset,
        }
      );
    }
  }

  /**
   * Obtener registros de mantenimiento por rango de kilometraje
   */
  async getByMileageRange(
    min_kilometers: number,
    max_kilometers: number,
    user_id: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    total: number;
    limit: number;
    offset: number;
    pages: number;
    min_kilometers: number;
    max_kilometers: number;
    data: MaintenanceRecordBase[];
  }> {
    try {
      if (max_kilometers < min_kilometers) {
        throw new MaintenanceRecordError(
          MaintenanceRecordErrorCodes.INVALID_DATETIME_RANGE,
          "Max kilometers must be greater than min kilometers"
        );
      }

      const result = await this.db.query(
        "SELECT get_maintenance_records_by_mileage_range($1, $2, $3, $4, $5)",
        [min_kilometers, max_kilometers, user_id, limit, offset]
      );

      const response = result.rows[0].get_maintenance_records_by_mileage_range;

      const data: MaintenanceRecordBase[] = response.data.map(
        (record: MaintenanceRecordBase) => this.mapToMaintenanceRecord(record)
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        min_kilometers: response.min_kilometers,
        max_kilometers: response.max_kilometers,
        data,
      };
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "getByMileageRange",
        {
          min_kilometers,
          max_kilometers,
          user_id,
          limit,
          offset,
        }
      );
    }
  }

  /**
   * Actualizar registro de mantenimiento
   */
  async update(
    maintenanceRecord: MaintenanceRecordUpdate
  ): Promise<{ id: string }> {
    try {
      // Validar fechas si se proporcionan ambas
      if (
        maintenanceRecord.start_datetime &&
        maintenanceRecord.end_datetime &&
        maintenanceRecord.end_datetime <= maintenanceRecord.start_datetime
      ) {
        throw new MaintenanceRecordError(
          MaintenanceRecordErrorCodes.INVALID_DATETIME_RANGE,
          "End datetime must be after start datetime"
        );
      }

      const result = await this.db.query(
        "SELECT update_maintenance_record($1, $2, $3, $4, $5, $6, $7)",
        [
          maintenanceRecord.id,
          maintenanceRecord.equipment_id || null,
          maintenanceRecord.start_datetime || null,
          maintenanceRecord.end_datetime || null,
          maintenanceRecord.maintenance_type_id || null,
          maintenanceRecord.observations || null,
          maintenanceRecord.mileage_record_id || null,
        ]
      );

      const response = result.rows[0].update_maintenance_record;
      return {
        id: response.id,
      };
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "update", {
        maintenanceRecord,
      });
    }
  }

  /**
   * Eliminar registro de mantenimiento
   */
  async delete(
    deleteMaintenanceRecord: DeleteMaintenanceRecord
  ): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT delete_maintenance_record($1)",
        [deleteMaintenanceRecord.id]
      );

      const response = result.rows[0].delete_maintenance_record;
      return {
        id: response.id,
      };
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "delete", {
        id: deleteMaintenanceRecord.id,
      });
    }
  }

  /**
   * Verificar si existe un registro de mantenimiento
   */
  async exists(id: string, user_id: string): Promise<boolean> {
    try {
      const record = await this.getById(id);
      return record !== null && record.user_id === user_id;
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "exists", {
        id,
        user_id,
      });
    }
  }

  /**
   * Completar mantenimiento (establecer end_datetime)
   */
  async complete(
    id: string,
    end_datetime: Date = new Date()
  ): Promise<{ id: string }> {
    try {
      return await this.update({
        id,
        end_datetime,
      });
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "complete",
        { id, end_datetime }
      );
    }
  }

  /**
   * Operación con transacción para múltiples registros
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
   * Mapear datos de la base de datos a MaintenanceRecordBase
   */
  private mapToMaintenanceRecord(
    data: MaintenanceRecordBase
  ): MaintenanceRecordBase {
    return {
      id: data.id,
      equipment_id: data.equipment_id,
      start_datetime: new Date(data.start_datetime),
      end_datetime: data.end_datetime ? new Date(data.end_datetime) : undefined,
      maintenance_type_id: data.maintenance_type_id,
      observations: data.observations,
      mileage_record_id: data.mileage_record_id,
      created_at: new Date(data.created_at),
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
      user_id: data.user_id,
    };
  }

  /**
   * Mapear datos de la base de datos a MaintenanceRecordWithDetails
   */
  private mapToMaintenanceRecordWithDetails(
    data: MaintenanceRecordWithDetails
  ): MaintenanceRecordWithDetails {
    const baseRecord = this.mapToMaintenanceRecord(data);

    return {
      ...baseRecord,
      equipment: data.equipment
        ? {
            id: data.equipment.id,
            type: data.equipment.type,
            license_plate: data.equipment.license_plate,
            code: data.equipment.code,
            created_at: new Date(data.equipment.created_at || data.created_at),
            maintenance_plan_id: data.equipment.maintenance_plan_id,
            maintenance_plan: data.equipment.maintenance_plan
              ? {
                  id: data.equipment.maintenance_plan.id,
                  name: data.equipment.maintenance_plan.name,
                  description: data.equipment.maintenance_plan.description,
                }
              : undefined,
            updated_at: data.equipment.updated_at
              ? new Date(data.equipment.updated_at)
              : undefined,
            user_id: data.equipment.user_id || data.user_id,
          }
        : undefined,
      maintenance_type: data.maintenance_type
        ? {
            id: data.maintenance_type.id,
            type: data.maintenance_type.type,
            level: data.maintenance_type.level,
            path: data.maintenance_type.path,
            created_at: new Date(
              data.maintenance_type.created_at || data.created_at
            ),
            user_id: data.maintenance_type.user_id || data.user_id,
          }
        : undefined,
      mileage_info: data.mileage_info,
    };
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(
    err: { message?: string; stack?: string },
    operation: string,
    context?: unknown
  ): never {
    // Log estructurado del error
    console.error({
      operation: `maintenance_record.${operation}`,
      error: err.message || "Unknown error",
      context,
      stack: err.stack,
    });

    if (err instanceof MaintenanceRecordError) {
      throw err;
    }

    // Manejo de errores específicos de PostgreSQL
    if (
      err.message?.includes("Equipment with ID") &&
      err.message?.includes("not found")
    ) {
      throw new MaintenanceRecordError(
        MaintenanceRecordErrorCodes.EQUIPMENT_NOT_FOUND,
        "Equipment not found or access denied"
      );
    }

    if (
      err.message?.includes("Maintenance type with ID") &&
      err.message?.includes("not found")
    ) {
      throw new MaintenanceRecordError(
        MaintenanceRecordErrorCodes.MAINTENANCE_TYPE_NOT_FOUND,
        "Maintenance type not found or access denied"
      );
    }

    if (
      err.message?.includes("Mileage record with ID") &&
      err.message?.includes("not found")
    ) {
      throw new MaintenanceRecordError(
        MaintenanceRecordErrorCodes.MILEAGE_RECORD_NOT_FOUND,
        "Mileage record not found or access denied"
      );
    }

    if (err.message?.includes("End datetime must be after start datetime")) {
      throw new MaintenanceRecordError(
        MaintenanceRecordErrorCodes.INVALID_DATETIME_RANGE,
        "End datetime must be after start datetime"
      );
    }

    if (
      err.message?.includes("Maintenance record with ID") &&
      err.message?.includes("not found")
    ) {
      throw new MaintenanceRecordError(
        MaintenanceRecordErrorCodes.NOT_FOUND,
        "Maintenance record not found"
      );
    }

    // Error genérico de base de datos
    throw new MaintenanceRecordError(
      MaintenanceRecordErrorCodes.DATABASE_ERROR,
      `Database operation failed: ${err.message}`
    );
  }
}

export const maintenanceRecordRepository = new MaintenanceRecordRepository();
