import { pool } from "@/lib/supabase";
import { Pool } from "pg";
import {
  EquipmentBase,
  EquipmentCreate,
  EquipmentUpdate,
  MultiEquipment,
  DeleteEquipment,
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
        "SELECT create_equipment($1, $2, $3, $4)",
        [
          equipment.type,
          equipment.license_plate,
          equipment.code,
          equipment.user_id,
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

  /**
   * Actualizar equipo
   */
  async update(equipment: EquipmentUpdate): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT update_equipment($1, $2, $3, $4)",
        [equipment.id, equipment.type, equipment.license_plate, equipment.code]
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
}

export const equipmentRepository = new EquipmentRepository();
