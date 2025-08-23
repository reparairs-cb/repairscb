import { pool } from "@/lib/supabase";
import { Pool } from "pg";
import {
  SparePartBase,
  SparePartCreate,
  SparePartUpdate,
  MultiSparePart,
  DeleteSparePart,
} from "@/types/spare-part";

class SparePartRepository {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * Crear nuevo repuesto
   */
  async create(sparePart: SparePartCreate): Promise<SparePartBase> {
    try {
      const result = await this.db.query(
        "SELECT create_spare_part($1, $2, $3, $4, $5, $6)",
        [
          sparePart.factory_code,
          sparePart.name,
          sparePart.description || null,
          sparePart.price,
          sparePart.image_url || null,
          sparePart.user_id,
        ]
      );

      const response = result.rows[0].create_spare_part;
      return {
        id: response.id,
        created_at: new Date(response.created_at),
        updated_at: new Date(response.updated_at),
        ...sparePart,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al insertar spare part:", err.stack);
      } else {
        console.error("Error al insertar spare part:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener repuesto por ID
   */
  async getById(id: string): Promise<SparePartBase | null> {
    try {
      const result = await this.db.query("SELECT get_spare_part_by_id($1)", [
        id,
      ]);

      const sparePartData = result.rows[0].get_spare_part_by_id;

      if (!sparePartData) {
        return null;
      }

      return {
        id: sparePartData.id,
        factory_code: sparePartData.factory_code,
        name: sparePartData.name,
        description: sparePartData.description,
        price: parseFloat(sparePartData.price),
        image_url: sparePartData.image_url,
        created_at: new Date(sparePartData.created_at),
        updated_at: sparePartData.updated_at
          ? new Date(sparePartData.updated_at)
          : undefined,
        user_id: sparePartData.user_id,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener spare part por ID:", err.stack);
      } else {
        console.error("Error al obtener spare part por ID:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener todos los repuestos con paginación
   */
  async getAll(
    limit: number = 10,
    offset: number = 0,
    userId: string
  ): Promise<MultiSparePart> {
    try {
      const result = await this.db.query(
        "SELECT get_all_spare_parts($1, $2, $3)",
        [userId, limit, offset]
      );

      const response = result.rows[0].get_all_spare_parts;

      const data: SparePartBase[] = response.data.map(
        (sparePart: SparePartBase) => ({
          id: sparePart.id,
          factory_code: sparePart.factory_code,
          name: sparePart.name,
          description: sparePart.description,
          price: sparePart.price,
          image_url: sparePart.image_url,
          created_at: new Date(sparePart.created_at),
          updated_at: sparePart.updated_at
            ? new Date(sparePart.updated_at)
            : undefined,
          user_id: sparePart.user_id,
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
        console.error("Error al obtener spare parts paginados:", err.stack);
      } else {
        console.error("Error al obtener spare parts paginados:", err);
      }
      throw err;
    }
  }

  /**
   * Actualizar repuesto
   */
  async update(sparePart: SparePartUpdate): Promise<{ id: string }> {
    try {
      const result = await this.db.query(
        "SELECT update_spare_part($1, $2, $3, $4, $5, $6)",
        [
          sparePart.id,
          sparePart.factory_code,
          sparePart.name,
          sparePart.description,
          sparePart.price,
          sparePart.image_url,
        ]
      );

      const response = result.rows[0].update_spare_part;
      return {
        id: response.id,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al actualizar spare part:", err.stack);
      } else {
        console.error("Error al actualizar spare part:", err);
      }
      throw err;
    }
  }

  /**
   * Eliminar repuesto
   */
  async delete(deleteSparePart: DeleteSparePart): Promise<{ id: string }> {
    try {
      const result = await this.db.query("SELECT delete_spare_part($1)", [
        deleteSparePart.id,
      ]);

      const response = result.rows[0].delete_spare_part;
      return {
        id: response.id,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al eliminar spare part:", err.stack);
      } else {
        console.error("Error al eliminar spare part:", err);
      }
      throw err;
    }
  }

  async isInUse(id: string): Promise<boolean> {
    try {
      const result = await this.db.query("SELECT is_spare_part_in_use($1)", [
        id,
      ]);
      return result.rows[0].is_spare_part_in_use.in_use;
    } catch (error) {
      console.error("Error al verificar si el repuesto está en uso:", error);
      throw error;
    }
  }

  /**
   * Verificar si existe código de fábrica
   */
  async factoryCodeExists(
    factoryCode: string,
    userId: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const result = await this.db.query(
        "SELECT spare_part_factory_code_exists($1, $2, $3)",
        [factoryCode, userId, excludeId || null]
      );

      return result.rows[0].spare_part_factory_code_exists;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al verificar código de fábrica:", err.stack);
      } else {
        console.error("Error al verificar código de fábrica:", err);
      }
      throw err;
    }
  }
}

export const sparePartRepository = new SparePartRepository();
