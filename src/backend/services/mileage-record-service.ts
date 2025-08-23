import {
  mileageRecordRepository,
  MileageRecordError,
} from "../repositories/mileage-record-repository";
import { MileageRecordErrorCodes } from "@/lib/errors";
import {
  MileageRecordBase,
  MileageRecordCreate,
  MileageRecordUpdate,
  MultiMileageRecord,
  MileageRecordsByDateRangeResponse,
} from "@/types/mileage-record";
import { equipmentRepository } from "../repositories/equipment-repository";

/**
 * Servicio para gestionar registros de kilometraje
 * Proporciona lógica de negocio y validaciones adicionales
 */
class MileageRecordService {
  private repository = mileageRecordRepository;
  private equipmentRepository = equipmentRepository;

  constructor() {}

  /**
   * Crear un nuevo registro de kilometraje
   * @param mileageRecord - Datos del registro de kilometraje a crear
   * @returns El registro de kilometraje creado
   */
  async create(
    mileageRecord: MileageRecordCreate
  ): Promise<{ id: string; created_at: Date } | null> {
    try {
      // Validaciones de negocio adicionales
      try {
        await this.validateBusinessRules(mileageRecord);
      } catch (error) {
        if (
          error instanceof MileageRecordError &&
          error.code === MileageRecordErrorCodes.DUPLICATE_DATE
        ) {
          // Si ya existe un registro para esa fecha, buscar el existente
          const existingRecord = await this.repository.existsForDate(
            mileageRecord.equipment_id,
            new Date(mileageRecord.record_date),
            mileageRecord.user_id
          );

          console.log(
            "Existing record found for duplicate date: ---------------",
            existingRecord
          );

          if (existingRecord) {
            await this.repository.update({
              id: existingRecord.id,
              kilometers: mileageRecord.kilometers,
              record_date: mileageRecord.record_date,
              user_id: mileageRecord.user_id,
            });

            return {
              id: existingRecord.id,
              created_at: existingRecord.created_at,
            };
          }
        }

        throw error; // Re-lanzar otros errores
      }

      // Validar que el equipo existe
      if (
        !(await this.equipmentRepository.getById(mileageRecord.equipment_id))
      ) {
        throw new MileageRecordError(
          MileageRecordErrorCodes.EQUIPMENT_NOT_FOUND,
          `Equipment with ID ${mileageRecord.equipment_id} not found`
        );
      }

      return await this.repository.create(mileageRecord);
    } catch (error) {
      console.error("Error al crear el registro de kilometraje:", error);
      throw error;
    }
  }

  /**
   * Obtener un registro de kilometraje por su ID
   * @param id - ID del registro de kilometraje a buscar
   * @param userId - ID del usuario
   * @returns El registro encontrado o null si no existe
   */
  async getById(id: string, userId: string): Promise<MileageRecordBase | null> {
    try {
      return await this.repository.getById(id, userId);
    } catch (error) {
      console.error(
        "Error al obtener el registro de kilometraje por ID:",
        error
      );
      throw error;
    }
  }

  /**
   * Obtener todos los registros de kilometraje de un usuario
   * @param limit - Límite de registros por página
   * @param offset - Offset para paginación
   * @param userId - ID del usuario
   * @returns Lista paginada de registros de kilometraje
   */
  async getAll(
    limit: number,
    offset: number,
    userId: string
  ): Promise<MultiMileageRecord> {
    try {
      return await this.repository.getAll(limit, offset, userId);
    } catch (error) {
      console.error(
        "Error al obtener todos los registros de kilometraje:",
        error
      );
      throw error;
    }
  }

  /**
   * Obtener registros de kilometraje por equipo
   * @param equipmentId - ID del equipo
   * @param userId - ID del usuario
   * @param limit - Límite de registros por página
   * @param offset - Offset para paginación
   * @returns Lista paginada de registros del equipo
   */
  async getByEquipment(
    equipmentId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    total: number;
    limit: number;
    offset: number;
    pages: number;
    equipment_id: string;
    data: MileageRecordBase[];
  }> {
    try {
      return await this.repository.getByEquipment(
        equipmentId,
        userId,
        limit,
        offset
      );
    } catch (error) {
      console.error(
        "Error al obtener registros de kilometraje por equipo:",
        error
      );
      throw error;
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
      // Validar rango de fechas
      if (endDate < startDate) {
        throw new MileageRecordError(
          MileageRecordErrorCodes.INVALID_DATE_RANGE,
          "End date must be greater than or equal to start date"
        );
      }

      return await this.repository.getByDateRange(
        startDate,
        endDate,
        userId,
        equipmentId,
        limit,
        offset
      );
    } catch (error) {
      console.error("Error al obtener registros por rango de fechas:", error);
      throw error;
    }
  }

  /**
   * Actualizar un registro de kilometraje
   * @param mileageRecord - Datos actualizados del registro
   * @returns El ID del registro actualizado
   */
  async update(
    mileageRecord: MileageRecordUpdate
  ): Promise<{ id: string } | null> {
    try {
      // Validar que el registro existe antes de actualizar
      const existingRecord = await this.repository.getById(
        mileageRecord.id,
        mileageRecord.user_id
      );
      if (!existingRecord) {
        throw new MileageRecordError(
          MileageRecordErrorCodes.NOT_FOUND,
          `Mileage record with ID ${mileageRecord.id} not found`
        );
      }

      // Validaciones de negocio para actualizaciones
      await this.validateUpdateBusinessRules(mileageRecord, existingRecord);

      return await this.repository.update(mileageRecord);
    } catch (error) {
      console.error("Error al actualizar el registro de kilometraje:", error);
      throw error;
    }
  }

  /**
   * Eliminar un registro de kilometraje
   * @param id - ID del registro a eliminar
   * @param userId - ID del usuario
   * @returns El ID del registro eliminado
   */
  async delete(id: string, userId: string): Promise<{ id: string } | null> {
    try {
      // Validar que el registro existe antes de eliminar
      const existingRecord = await this.repository.getById(id, userId);
      if (!existingRecord) {
        throw new MileageRecordError(
          MileageRecordErrorCodes.NOT_FOUND,
          `Mileage record with ID ${id} not found`
        );
      }

      return await this.repository.delete(id, userId);
    } catch (error) {
      console.error("Error al eliminar el registro de kilometraje:", error);
      throw error;
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
      return await this.repository.exists(id, userId);
    } catch (error) {
      console.error("Error al verificar existencia del registro:", error);
      throw error;
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
      return await this.repository.existsForDate(
        equipmentId,
        recordDate,
        userId,
        excludeId
      );
    } catch (error) {
      console.error(
        "Error al verificar existencia del registro para la fecha:",
        error
      );
      throw error;
    }
  }

  /**
   * Validaciones de reglas de negocio para creación
   * @param mileageRecord - Datos del registro a validar
   */
  private async validateBusinessRules(
    mileageRecord: MileageRecordCreate
  ): Promise<void> {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin del día actual

    // Validar que los kilómetros sean positivos
    if (mileageRecord.kilometers < 0) {
      throw new MileageRecordError(
        MileageRecordErrorCodes.INVALID_KILOMETERS,
        "Kilometers must be greater than or equal to zero"
      );
    }

    // Validar que no exista ya un registro para esa fecha y equipo
    const exists = await this.existsForDate(
      mileageRecord.equipment_id,
      mileageRecord.record_date,
      mileageRecord.user_id
    );

    if (exists) {
      throw new MileageRecordError(
        MileageRecordErrorCodes.DUPLICATE_DATE,
        "A mileage record already exists for this equipment and date"
      );
    }

    // Validar coherencia con registros anteriores
    /* await this.validateKilometerConsistency(
      mileageRecord.equipment_id,
      mileageRecord.record_date,
      mileageRecord.kilometers,
      mileageRecord.user_id
    ); */
  }

  /**
   * Validaciones de reglas de negocio para actualización
   * @param updateData - Datos de actualización
   * @param existingRecord - Registro existente
   */
  private async validateUpdateBusinessRules(
    updateData: MileageRecordUpdate,
    existingRecord: MileageRecordBase
  ): Promise<void> {
    // Si se está cambiando la fecha, validar que no sea futura
    if (updateData.record_date) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (updateData.record_date > today) {
        throw new MileageRecordError(
          MileageRecordErrorCodes.INVALID_DATE_RANGE,
          "Record date cannot be in the future"
        );
      }

      // Validar que no exista otro registro para la nueva fecha
      if (
        updateData.record_date.getTime() !==
        existingRecord.record_date.getTime()
      ) {
        const finalEquipmentId =
          updateData.equipment_id || existingRecord.equipment_id;
        const exists = await this.existsForDate(
          finalEquipmentId,
          updateData.record_date,
          updateData.user_id,
          updateData.id
        );

        if (exists) {
          throw new MileageRecordError(
            MileageRecordErrorCodes.DUPLICATE_DATE,
            "A mileage record already exists for this equipment and date"
          );
        }
      }
    }

    // Si se están cambiando los kilómetros, validar que sean positivos
    if (updateData.kilometers !== undefined && updateData.kilometers < 0) {
      throw new MileageRecordError(
        MileageRecordErrorCodes.INVALID_KILOMETERS,
        "Kilometers must be greater than or equal to zero"
      );
    }

    /* // Validar coherencia con otros registros si se cambian kilómetros o fecha
    if (updateData.kilometers !== undefined || updateData.record_date) {
      const finalEquipmentId =
        updateData.equipment_id || existingRecord.equipment_id;
      const finalDate = updateData.record_date || existingRecord.record_date;
      const finalKilometers =
        updateData.kilometers !== undefined
          ? updateData.kilometers
          : existingRecord.kilometers;

      await this.validateKilometerConsistency(
        finalEquipmentId,
        finalDate,
        finalKilometers,
        updateData.user_id,
        updateData.id
      );
    } */
  }

  /**
   * Validar consistencia de kilómetros con registros existentes
   * @param equipmentId - ID del equipo
   * @param recordDate - Fecha del registro
   * @param kilometers - Kilómetros del registro
   * @param userId - ID del usuario
   * @param excludeId - ID a excluir de la validación (para actualizaciones)
   */
  private async validateKilometerConsistency(
    equipmentId: string,
    recordDate: Date,
    kilometers: number,
    userId: string,
    excludeId?: string
  ): Promise<void> {
    // Obtener el último registro anterior
    const previousRecord = await this.repository.getPreviousRecord(
      equipmentId,
      recordDate,
      userId,
      excludeId
    );

    if (previousRecord && kilometers < previousRecord.kilometers) {
      throw new MileageRecordError(
        MileageRecordErrorCodes.INVALID_KILOMETERS,
        `Kilometers (${kilometers}) cannot be less than previous record (${
          previousRecord.kilometers
        }) on ${previousRecord.record_date.toISOString().split("T")[0]}`
      );
    }

    // Obtener el siguiente registro posterior
    const nextRecord = await this.repository.getNextRecord(
      equipmentId,
      recordDate,
      userId,
      excludeId
    );

    if (nextRecord && kilometers > nextRecord.kilometers) {
      throw new MileageRecordError(
        MileageRecordErrorCodes.INVALID_KILOMETERS,
        `Kilometers (${kilometers}) cannot be greater than next record (${
          nextRecord.kilometers
        }) on ${nextRecord.record_date.toISOString().split("T")[0]}`
      );
    }
  }
}

export const mileageRecordService = new MileageRecordService();
