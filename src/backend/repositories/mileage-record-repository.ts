import { pool } from "@/lib/supabase";
import { Pool } from "pg";
import {
  MileageRecordBase,
  MileageRecordCreate,
  MileageRecordUpdate,
  MultiMileageRecord,
  MileageRecordWithEquipment,
  MileageRecordsByEquipmentResponse,
  MileageRecordsByDateRangeResponse,
} from "@/types/mileage-record";
import { MileageRecordErrorCodes } from "@/lib/errors";
import { dateToLocalISOString } from "@/lib/utils";

export class MileageRecordError extends Error {
  public readonly code: MileageRecordErrorCodes;
  public readonly details?: unknown;

  constructor(
    code: MileageRecordErrorCodes,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "MileageRecordError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Repositorio para gestionar registros de kilometraje
 * Maneja las operaciones de base de datos para los registros de kilometraje
 */
class MileageRecordRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * Crear un nuevo registro de kilometraje
   * @param mileageRecord - Datos del registro a crear
   * @returns El ID y fecha de creación del registro creado
   */
  async create(
    mileageRecord: MileageRecordCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      // Validaciones en el cliente antes de enviar a la base de datos
      if (mileageRecord.kilometers < 0) {
        throw new MileageRecordError(
          MileageRecordErrorCodes.INVALID_KILOMETERS,
          "Kilometers must be greater than or equal to zero"
        );
      }

      if (mileageRecord.record_date > new Date()) {
        throw new MileageRecordError(
          MileageRecordErrorCodes.INVALID_DATE_RANGE,
          "Record date cannot be in the future"
        );
      }

      console.log("Creating mileage record with data:", mileageRecord);

      const result = await this.db.query(
        "SELECT create_mileage_record($1, $2, $3, $4)",
        [
          mileageRecord.equipment_id,
          mileageRecord.record_date,
          mileageRecord.kilometers,
          mileageRecord.user_id,
        ]
      );

      const response = result.rows[0].create_mileage_record;
      return {
        id: response.id,
        created_at: new Date(response.created_at),
      };
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "create", {
        mileageRecord,
      });
    }
  }

  /**
   * Obtener un registro de kilometraje por ID
   * @param id - ID del registro
   * @param userId - ID del usuario
   * @returns El registro encontrado o null
   */
  async getById(id: string, userId: string): Promise<MileageRecordBase | null> {
    try {
      const result = await this.db.query(
        "SELECT get_mileage_record_by_id($1, $2)",
        [id, userId]
      );

      const data = result.rows[0]?.get_mileage_record_by_id;
      if (!data) return null;

      return {
        id: data.id,
        equipment_id: data.equipment_id,
        record_date: new Date(data.record_date),
        kilometers: parseFloat(data.kilometers),
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

  /**
   * Obtener todos los registros de kilometraje de un usuario
   * @param limit - Límite de registros por página
   * @param offset - Offset para paginación
   * @param userId - ID del usuario
   * @returns Lista paginada de registros
   */
  async getAll(
    limit: number,
    offset: number,
    userId: string
  ): Promise<MultiMileageRecord> {
    try {
      const result = await this.db.query(
        "SELECT get_all_mileage_records($1, $2, $3)",
        [userId, limit, offset]
      );

      const response = result.rows[0].get_all_mileage_records;

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data: response.data.map((record: MileageRecordBase) => ({
          id: record.id,
          equipment_id: record.equipment_id,
          record_date: new Date(record.record_date),
          kilometers: record.kilometers,
          created_at: new Date(record.created_at),
          updated_at: record.updated_at
            ? new Date(record.updated_at)
            : undefined,
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
   * Obtener registros de kilometraje por equipo
   * @param equipmentId - ID del equipo
   * @param userId - ID del usuario
   * @param limit - Límite de registros
   * @param offset - Offset para paginación
   * @returns Lista paginada de registros del equipo
   */
  async getByEquipment(
    equipmentId: string,
    userId: string,
    limit: number,
    offset: number
  ): Promise<MileageRecordsByEquipmentResponse> {
    try {
      const result = await this.db.query(
        "SELECT get_mileage_records_by_equipment($1, $2, $3, $4)",
        [equipmentId, userId, limit, offset]
      );

      const response = result.rows[0].get_mileage_records_by_equipment;
      console.log("MileageRecordsByEquipmentResponse:", response);
      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        equipment_id: response.equipment_id,
        data: response.data.map((record: MileageRecordBase) => ({
          id: record.id,
          equipment_id: record.equipment_id,
          record_date: new Date(record.record_date),
          kilometers: record.kilometers,
          created_at: new Date(record.created_at),
          updated_at: record.updated_at
            ? new Date(record.updated_at)
            : undefined,
        })),
      };
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "getByEquipment",
        { equipmentId, userId, limit, offset }
      );
    }
  }

  /**
   * Obtener registros de kilometraje por rango de fechas
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @param userId - ID del usuario
   * @param equipmentId - ID del equipo (opcional)
   * @param limit - Límite de registros
   * @param offset - Offset para paginación
   * @returns Lista de registros en el rango de fechas
   */
  async getByDateRange(
    startDate: Date,
    endDate: Date,
    userId: string,
    equipmentId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<MileageRecordsByDateRangeResponse> {
    try {
      // Validación en el cliente
      if (endDate < startDate) {
        throw new MileageRecordError(
          MileageRecordErrorCodes.INVALID_DATE_RANGE,
          "End date must be greater than or equal to start date"
        );
      }

      const result = await this.db.query(
        "SELECT get_mileage_records_by_date_range($1, $2, $3, $4, $5, $6)",
        [startDate, endDate, userId, equipmentId, limit, offset]
      );

      const response = result.rows[0].get_mileage_records_by_date_range;

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        start_date: new Date(response.start_date),
        end_date: new Date(response.end_date),
        equipment_id: response.equipment_id,
        data: response.data.map((record: MileageRecordWithEquipment) => ({
          id: record.id,
          equipment_id: record.equipment_id,
          record_date: new Date(record.record_date),
          kilometers: record.kilometers,
          created_at: new Date(record.created_at),
          updated_at: record.updated_at
            ? new Date(record.updated_at)
            : undefined,
          equipment: {
            id: record.equipment.id,
            type: record.equipment.type,
            license_plate: record.equipment.license_plate,
            code: record.equipment.code,
          },
          daily_distance: record.daily_distance,
        })),
      };
    } catch (err) {
      this.handleError(
        err as { message?: string; stack?: string },
        "getByDateRange",
        { startDate, endDate, userId, equipmentId, limit, offset }
      );
    }
  }

  /**
   * Actualizar un registro de kilometraje
   * @param mileageRecord - Datos actualizados del registro
   * @returns El ID del registro actualizado
   */
  async update(mileageRecord: MileageRecordUpdate): Promise<{ id: string }> {
    try {
      // Validaciones en el cliente
      if (
        mileageRecord.kilometers !== undefined &&
        mileageRecord.kilometers < 0
      ) {
        throw new MileageRecordError(
          MileageRecordErrorCodes.INVALID_KILOMETERS,
          "Kilometers must be greater than or equal to zero"
        );
      }

      console.log("Updating mileage record with data:", mileageRecord);

      const result = await this.db.query(
        "SELECT update_mileage_record($1, $2, $3, $4, $5)",
        [
          mileageRecord.id,
          mileageRecord.equipment_id || null,
          mileageRecord.record_date || null,
          mileageRecord.kilometers !== undefined
            ? mileageRecord.kilometers
            : null,
          mileageRecord.user_id,
        ]
      );

      const response = result.rows[0].update_mileage_record;
      return { id: response.id };
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "update", {
        mileageRecord,
      });
    }
  }

  /**
   * Eliminar un registro de kilometraje
   * @param id - ID del registro a eliminar
   * @param userId - ID del usuario
   * @returns El ID del registro eliminado
   */
  async delete(id: string, userId: string): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT delete_mileage_record($1, $2)",
        [id, userId]
      );

      const response = result.rows[0].delete_mileage_record;
      return { id: response.id };
    } catch (err) {
      this.handleError(err as { message?: string; stack?: string }, "delete", {
        id,
        userId,
      });
    }
  }

  /**
   * Verificar si existe un registro de kilometraje
   * @param id - ID del registro
   * @param userId - ID del usuario
   * @returns true si existe, false en caso contrario
   */
  async exists(id: string, userId: string): Promise<boolean> {
    try {
      const record = await this.getById(id, userId);
      return record !== null;
    } catch (error) {
      console.error("Error checking mileage record existence:", error);
      return false;
    }
  }

  /**
   * Verificar si existe un registro para una fecha y equipo específicos
   * @param equipmentId - ID del equipo
   * @param recordDate - Fecha del registro
   * @param userId - ID del usuario
   * @param excludeId - ID a excluir de la búsqueda (para actualizaciones)
   * @returns true si existe, false en caso contrario
   */
  async existsForDate(
    equipmentId: string,
    recordDate: Date,
    userId: string,
    excludeId?: string
  ): Promise<MileageRecordBase | undefined> {
    try {
      // Implementación usando getByEquipment y filtrar por fecha
      const records = await this.getByEquipment(equipmentId, userId, 0, 0);
      return records.data.find((record) => {
        return (
          record.record_date.toISOString().split("T")[0] ===
            dateToLocalISOString(recordDate).split("T")[0] &&
          (excludeId ? record.id !== excludeId : true)
        );
      });
    } catch (error) {
      console.error("Error checking mileage record existence for date:", error);
      return undefined;
    }
  }

  /**
   * Obtener el registro anterior a una fecha específica
   * @param equipmentId - ID del equipo
   * @param recordDate - Fecha de referencia
   * @param userId - ID del usuario
   * @param excludeId - ID a excluir de la búsqueda
   * @returns El registro anterior o null
   */
  async getPreviousRecord(
    equipmentId: string,
    recordDate: Date,
    userId: string,
    excludeId?: string
  ): Promise<MileageRecordBase | null> {
    try {
      const records = await this.getByEquipment(equipmentId, userId, 1000, 0);

      const filteredRecords = records.data
        .filter(
          (record) =>
            record.record_date < recordDate &&
            (excludeId ? record.id !== excludeId : true)
        )
        .sort((a, b) => b.record_date.getTime() - a.record_date.getTime());

      return filteredRecords[0] || null;
    } catch (error) {
      console.error("Error getting previous record:", error);
      return null;
    }
  }

  /**
   * Obtener el registro posterior a una fecha específica
   * @param equipmentId - ID del equipo
   * @param recordDate - Fecha de referencia
   * @param userId - ID del usuario
   * @param excludeId - ID a excluir de la búsqueda
   * @returns El registro posterior o null
   */
  async getNextRecord(
    equipmentId: string,
    recordDate: Date,
    userId: string,
    excludeId?: string
  ): Promise<MileageRecordBase | null> {
    try {
      const records = await this.getByEquipment(equipmentId, userId, 1000, 0);

      const filteredRecords = records.data
        .filter(
          (record) =>
            record.record_date > recordDate &&
            (excludeId ? record.id !== excludeId : true)
        )
        .sort((a, b) => a.record_date.getTime() - b.record_date.getTime());

      return filteredRecords[0] || null;
    } catch (error) {
      console.error("Error getting next record:", error);
      return null;
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
    console.error(`Error in MileageRecordRepository.${operation}:`, {
      error: error.message,
      stack: error.stack,
      params,
    });

    // Determinar el tipo de error basado en el mensaje
    if (error.message?.includes("not found")) {
      throw new MileageRecordError(
        MileageRecordErrorCodes.NOT_FOUND,
        error.message
      );
    }

    if (error.message?.includes("access denied")) {
      throw new MileageRecordError(
        MileageRecordErrorCodes.ACCESS_DENIED,
        error.message
      );
    }

    if (error.message?.includes("already exists")) {
      throw new MileageRecordError(
        MileageRecordErrorCodes.DUPLICATE_DATE,
        error.message
      );
    }

    if (error.message?.includes("Kilometers")) {
      throw new MileageRecordError(
        MileageRecordErrorCodes.INVALID_KILOMETERS,
        error.message
      );
    }

    if (error.message?.includes("date")) {
      throw new MileageRecordError(
        MileageRecordErrorCodes.INVALID_DATE_RANGE,
        error.message
      );
    }

    if (error.message?.includes("maintenance records")) {
      throw new MileageRecordError(
        MileageRecordErrorCodes.HAS_MAINTENANCE_RECORDS,
        error.message
      );
    }

    // Error genérico de base de datos
    throw new MileageRecordError(
      MileageRecordErrorCodes.DATABASE_ERROR,
      `Database operation failed: ${error.message}`,
      error
    );
  }
}

export const mileageRecordRepository = new MileageRecordRepository();
