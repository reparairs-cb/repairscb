import { pool } from "@/lib/supabase";
import { Pool } from "pg";
import {
  EquipmentBase,
  EquipmentCreate,
  EquipmentUpdate,
  MultiEquipment,
  DeleteEquipment,
  EquipmentWithPaginatedRecords,
  MultiEquipmentWithRecords,
  MultiEquipmentMaintenancePlan,
  EquipmentMaintenancePlan,
  EqWithPendingInProgressMRs,
  MultiEqWithPendingInProgressMRs,
} from "@/types/equipment";

class EquipmentRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * Crear nuevo equipo
   */
  async create(
    equipment: EquipmentCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      const verify_license_plate = await this.getByLicensePlate(
        equipment.license_plate,
        equipment.user_id
      );

      if (verify_license_plate) {
        throw new Error("license_plate_already_exists");
      }

      const verify_code = await this.getByCode(
        equipment.code,
        equipment.user_id
      );

      if (verify_code) {
        throw new Error("code_already_exists");
      }

      const result = await this.db.query(
        "SELECT create_equipment($1, $2, $3, $4, $5)",
        [
          equipment.type,
          equipment.license_plate,
          equipment.code,
          equipment.user_id,
          equipment.maintenance_plan_id,
        ]
      );

      const response = result.rows[0].create_equipment;
      return {
        id: response.id,
        created_at: new Date(response.created_at),
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al insertar equipment:", err.stack);
      } else {
        console.error("Error al insertar equipment:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener equipo por ID
   */
  async getById(id: string): Promise<EquipmentBase | null> {
    try {
      const result = await this.db.query("SELECT get_equipment_by_id($1)", [
        id,
      ]);

      const equipmentData = result.rows[0].get_equipment_by_id;

      if (!equipmentData) {
        return null;
      }

      return {
        id: equipmentData.id,
        type: equipmentData.type,
        license_plate: equipmentData.license_plate,
        code: equipmentData.code,
        created_at: new Date(equipmentData.created_at),
        updated_at: equipmentData.updated_at
          ? new Date(equipmentData.updated_at)
          : undefined,
        user_id: equipmentData.user_id,
        maintenance_plan: equipmentData.maintenance_plan
          ? {
              id: equipmentData.maintenance_plan.id,
              name: equipmentData.maintenance_plan.name,
              description: equipmentData.maintenance_plan.description,
            }
          : undefined,
        maintenance_plan_id: equipmentData.maintenance_plan_id,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener equipment por ID:", err.stack);
      } else {
        console.error("Error al obtener equipment por ID:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener todos los equipos con paginación
   */
  async getAll(
    limit: number = 10,
    offset: number = 0,
    user_id: string
  ): Promise<MultiEquipment> {
    try {
      const result = await this.db.query(
        "SELECT get_all_equipments($1, $2, $3)",
        [user_id, limit, offset]
      );

      const response = result.rows[0].get_all_equipments;

      const data: EquipmentBase[] = response.data.map(
        (equipment: EquipmentBase) => ({
          id: equipment.id,
          type: equipment.type,
          license_plate: equipment.license_plate,
          code: equipment.code,
          created_at: new Date(equipment.created_at),
          updated_at: equipment.updated_at
            ? new Date(equipment.updated_at)
            : undefined,
          user_id: equipment.user_id,
          maintenance_plan_id: equipment.maintenance_plan_id,
          maintenance_plan: equipment.maintenance_plan
            ? {
                id: equipment.maintenance_plan.id,
                name: equipment.maintenance_plan.name,
                description: equipment.maintenance_plan.description,
              }
            : undefined,
        })
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener equipments paginados:", err.stack);
      } else {
        console.error("Error al obtener equipments paginados:", err);
      }
      throw err;
    }
  }

  async getAllWithPendingMRs(
    user_id: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<MultiEqWithPendingInProgressMRs> {
    try {
      const result = await this.db.query(
        "SELECT get_all_equipment_with_pending_maintenance($1, $2, $3)",
        [user_id, limit, offset]
      );

      const response =
        result.rows[0].get_all_equipment_with_pending_maintenance;

      const data: EqWithPendingInProgressMRs[] = response.data.map(
        (equipment: EqWithPendingInProgressMRs) => ({
          id: equipment.id,
          type: equipment.type,
          license_plate: equipment.license_plate,
          code: equipment.code,
          created_at: new Date(equipment.created_at),
          updated_at: equipment.updated_at
            ? new Date(equipment.updated_at)
            : undefined,
          user_id: equipment.user_id,
          maintenance_plan_id: equipment.maintenance_plan_id,
          maintenance_plan: equipment.maintenance_plan
            ? {
                id: equipment.maintenance_plan.id,
                name: equipment.maintenance_plan.name,
                description: equipment.maintenance_plan.description,
              }
            : undefined,
          maintenance_records: equipment.maintenance_records
            ? equipment.maintenance_records.map((record) => ({
                id: record.id,
                start_datetime: new Date(record.start_datetime),
                end_datetime: record.end_datetime
                  ? new Date(record.end_datetime)
                  : undefined,
                observations: record.observations,
                maintenance_type: record.maintenance_type
                  ? {
                      id: record.maintenance_type.id,
                      type: record.maintenance_type.type,
                      path: record.maintenance_type.path,
                    }
                  : undefined,
              }))
            : [],
        })
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error(
          "Error al obtener equipments con MRs pendientes:",
          err.stack
        );
      } else {
        console.error("Error al obtener equipments con MRs pendientes:", err);
      }
      throw err;
    }
  }

  /**
   * Actualizar equipo
   */
  async update(equipment: EquipmentUpdate): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT update_equipment($1, $2, $3, $4, $5)",
        [
          equipment.id,
          equipment.type,
          equipment.license_plate,
          equipment.code,
          equipment.maintenance_plan_id,
        ]
      );

      const response = result.rows[0].update_equipment;
      return {
        id: response.id,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al actualizar equipment:", err.stack);
      } else {
        console.error("Error al actualizar equipment:", err);
      }
      throw err;
    }
  }

  /**
   * Eliminar equipo
   */
  async delete(deleteEquipment: DeleteEquipment): Promise<{ id: string }> {
    try {
      const result = await this.db.query("SELECT delete_equipment($1)", [
        deleteEquipment.id,
      ]);

      const response = result.rows[0].delete_equipment;
      return {
        id: response.id,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al eliminar equipment:", err.stack);
      } else {
        console.error("Error al eliminar equipment:", err);
      }
      throw err;
    }
  }

  /**
   * Buscar equipos por tipo
   */
  async getByType(type: string, user_id: string): Promise<EquipmentBase[]> {
    try {
      const result = await this.db.query(
        "SELECT get_equipments_by_type($1, $2)",
        [type, user_id]
      );

      const equipments = result.rows[0].get_equipments_by_type;

      if (!equipments || equipments.length === 0) {
        return [];
      }

      return equipments.map((equipment: EquipmentBase) => ({
        id: equipment.id,
        type: equipment.type,
        license_plate: equipment.license_plate,
        code: equipment.code,
        created_at: new Date(equipment.created_at),
        updated_at: equipment.updated_at
          ? new Date(equipment.updated_at)
          : undefined,
        user_id: equipment.user_id,
        maintenance_plan_id: equipment.maintenance_plan_id,
        maintenance_plan: equipment.maintenance_plan
          ? {
              id: equipment.maintenance_plan.id,
              name: equipment.maintenance_plan.name,
              description: equipment.maintenance_plan.description,
            }
          : undefined,
      }));
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener equipment por tipo:", err.stack);
      } else {
        console.error("Error al obtener equipment por tipo:", err);
      }
      throw err;
    }
  }

  /**
   * Buscar equipo por código
   */
  async getByCode(
    code: string,
    user_id: string
  ): Promise<EquipmentBase | null> {
    try {
      const result = await this.db.query(
        "SELECT get_equipment_by_code($1, $2)",
        [code, user_id]
      );

      const equipmentData = result.rows[0].get_equipment_by_code;

      if (!equipmentData) {
        return null;
      }

      return {
        id: equipmentData.id,
        type: equipmentData.type,
        license_plate: equipmentData.license_plate,
        code: equipmentData.code,
        created_at: new Date(equipmentData.created_at),
        updated_at: equipmentData.updated_at
          ? new Date(equipmentData.updated_at)
          : undefined,
        user_id: equipmentData.user_id,
        maintenance_plan_id: equipmentData.maintenance_plan_id,
        maintenance_plan: equipmentData.maintenance_plan
          ? {
              id: equipmentData.maintenance_plan.id,
              name: equipmentData.maintenance_plan.name,
              description: equipmentData.maintenance_plan.description,
            }
          : undefined,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener equipment por código:", err.stack);
      } else {
        console.error("Error al obtener equipment por código:", err);
      }
      throw err;
    }
  }

  /**
   * Buscar equipo por placa
   */
  async getByLicensePlate(
    license_plate: string,
    user_id: string
  ): Promise<EquipmentBase | null> {
    try {
      const result = await this.db.query(
        "SELECT get_equipment_by_license_plate($1, $2)",
        [license_plate, user_id]
      );

      const equipmentData = result.rows[0].get_equipment_by_license_plate;

      if (!equipmentData) {
        return null;
      }

      return {
        id: equipmentData.id,
        type: equipmentData.type,
        license_plate: equipmentData.license_plate,
        code: equipmentData.code,
        created_at: new Date(equipmentData.created_at),
        updated_at: equipmentData.updated_at
          ? new Date(equipmentData.updated_at)
          : undefined,
        user_id: equipmentData.user_id,
        maintenance_plan_id: equipmentData.maintenance_plan_id,
        maintenance_plan: equipmentData.maintenance_plan
          ? {
              id: equipmentData.maintenance_plan.id,
              name: equipmentData.maintenance_plan.name,
              description: equipmentData.maintenance_plan.description,
            }
          : undefined,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener equipment por placa:", err.stack);
      } else {
        console.error("Error al obtener equipment por placa:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener equipos con registros de mantenimiento y kilometraje
   */
  async getAllWithRecords(
    user_id: string,
    limit: number = 10,
    offset: number = 0,
    mileage_limit: number = 30,
    mileage_offset: number = 0
  ): Promise<MultiEquipmentWithRecords> {
    try {
      const result = await this.db.query(
        "SELECT get_all_equipment_with_record($1, $2, $3, $4, $5)",
        [user_id, limit, offset, mileage_limit, mileage_offset]
      );

      const response = result.rows[0].get_all_equipment_with_record;

      const data: EquipmentWithPaginatedRecords[] = response.data.map(
        (equipment: EquipmentWithPaginatedRecords) => ({
          id: equipment.id,
          type: equipment.type,
          license_plate: equipment.license_plate,
          code: equipment.code,
          created_at: new Date(equipment.created_at),
          updated_at: equipment.updated_at
            ? new Date(equipment.updated_at)
            : undefined,
          user_id: equipment.user_id,
          mileage_records: equipment.mileage_records
            ? {
                total: equipment.mileage_records.total,
                limit: equipment.mileage_records.limit,
                offset: equipment.mileage_records.offset,
                pages: equipment.mileage_records.pages,
                data: equipment.mileage_records.data.map((record) => ({
                  id: record.id,
                  equipment_id: record.equipment_id,
                  kilometers: record.kilometers,
                  record_date: new Date(record.record_date),
                  created_at: new Date(record.created_at),
                  updated_at: record.updated_at
                    ? new Date(record.updated_at)
                    : undefined,
                })),
              }
            : undefined,
        })
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener equipments con registros:", err.stack);
      } else {
        console.error("Error al obtener equipments con registros:", err);
      }
      throw err;
    }
  }

  async hasRecords(equipment_id: string): Promise<boolean> {
    try {
      const result = await this.db.query("SELECT equipment_has_records($1)", [
        equipment_id,
      ]);

      return result.rows[0].has_records;
    } catch (err) {
      if (err instanceof Error) {
        console.error(
          "Error al verificar si el equipo tiene registros:",
          err.stack
        );
      } else {
        console.error("Error al verificar si el equipo tiene registros:", err);
      }
      throw err;
    }
  }

  async getMaintenancePlan(
    user_id: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<MultiEquipmentMaintenancePlan> {
    try {
      const result = await this.db.query(
        "SELECT get_all_maintenance_plan($1, $2, $3)",
        [user_id, limit, offset]
      );

      const response = result.rows[0].get_all_maintenance_plan;

      const data: EquipmentMaintenancePlan[] = response.data.map(
        (eqplan: EquipmentMaintenancePlan) => ({
          equipment: {
            id: eqplan.equipment.id,
            type: eqplan.equipment.type,
            license_plate: eqplan.equipment.license_plate,
            code: eqplan.equipment.code,
            avg_mileage: eqplan.equipment.avg_mileage,
            last_mileage_value: eqplan.equipment.last_mileage_value
              ? eqplan.equipment.last_mileage_value
              : undefined,
            last_mileage_record_date: eqplan.equipment.last_mileage_record_date
              ? new Date(eqplan.equipment.last_mileage_record_date)
              : undefined,
            maintenance_plan_name: eqplan.equipment.maintenance_plan_name,
          },
          last_maintenance_type: eqplan.last_maintenance_type
            ? {
                id: eqplan.last_maintenance_type.id,
                type: eqplan.last_maintenance_type.type,
                path: eqplan.last_maintenance_type.path,
              }
            : undefined,
          next_maintenance_type: eqplan.next_maintenance_type
            ? {
                id: eqplan.next_maintenance_type.id,
                type: eqplan.next_maintenance_type.type,
                path: eqplan.next_maintenance_type.path,
              }
            : undefined,
          remaining_days: eqplan.remaining_days
            ? Number(eqplan.remaining_days)
            : undefined,
          remaining_mileage: eqplan.remaining_mileage
            ? Number(eqplan.remaining_mileage)
            : undefined,
        })
      );

      return {
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        pages: response.pages,
        data,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error(
          "Error al obtener el plan de mantenimiento del equipo:",
          err.stack
        );
      } else {
        console.error(
          "Error al obtener el plan de mantenimiento del equipo:",
          err
        );
      }
      throw err;
    }
  }
}

export const equipmentRepository = new EquipmentRepository();
