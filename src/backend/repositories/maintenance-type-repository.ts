import { Pool } from "pg";
import {
  MaintenanceTypeBase,
  MaintenanceTypeCreate,
  MaintenanceTypeUpdate,
  MultiMaintenanceType,
  DeleteMaintenanceType,
  MaintenanceTypeWithChildren,
} from "@/types/maintenance-type";
import { pool } from "@/lib/supabase";

class MaintenanceTypeRepository {
  private db: Pool;
  constructor() {
    this.db = pool;
  }

  /**
   * Crear nuevo tipo de mantenimiento
   */
  async create(
    maintenanceType: MaintenanceTypeCreate
  ): Promise<{
    id: string;
    created_at: Date;
    level: number;
    path: string | null;
  }> {
    try {
      const result = await pool.query(
        "SELECT mnt.create_maintenance_type($1, $2, $3, $4, $5)",
        [
          maintenanceType.type,
          maintenanceType.parent_id || null,
          maintenanceType.level,
          maintenanceType.path || null,
          maintenanceType.user_id,
        ]
      );

      const response = result.rows[0].create_maintenance_type;
      return {
        id: response.id,
        created_at: new Date(response.created_at),
        level: maintenanceType.level,
        path: maintenanceType.path || null,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al insertar maintenance type:", err.stack);
      } else {
        console.error("Error al insertar maintenance type:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener tipo de mantenimiento por ID
   */
  async getById(id: string): Promise<MaintenanceTypeBase | null> {
    try {
      const result = await pool.query("SELECT mnt.get_maintenance_type_by_id($1)", [
        id,
      ]);

      const maintenanceTypeData = result.rows[0].get_maintenance_type_by_id;

      if (!maintenanceTypeData) {
        return null;
      }

      return {
        id: maintenanceTypeData.id,
        type: maintenanceTypeData.type,
        parent_id: maintenanceTypeData.parent_id,
        level: maintenanceTypeData.level,
        path: maintenanceTypeData.path,
        created_at: new Date(maintenanceTypeData.created_at),
        user_id: maintenanceTypeData.user_id,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener maintenance type por ID:", err.stack);
      } else {
        console.error("Error al obtener maintenance type por ID:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener todos los tipos de mantenimiento con paginación
   */
  async getAll(
    limit: number = 10,
    offset: number = 0,
    userId: string
  ): Promise<MultiMaintenanceType> {
    try {
      const result = await pool.query(
        "SELECT mnt.get_all_maintenance_types($1, $2, $3)",
        [userId, limit, offset]
      );

      const response = result.rows[0].get_all_maintenance_types;

      const data: MaintenanceTypeBase[] = response.data.map(
        (maintenanceType: MaintenanceTypeBase) => ({
          id: maintenanceType.id,
          type: maintenanceType.type,
          parent_id: maintenanceType.parent_id,
          level: maintenanceType.level,
          path: maintenanceType.path,
          created_at: new Date(maintenanceType.created_at),
          user_id: maintenanceType.user_id,
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
          "Error al obtener maintenance types paginados:",
          err.stack
        );
      } else {
        console.error("Error al obtener maintenance types paginados:", err);
      }
      throw err;
    }
  }

  /**
   * Actualizar tipo de mantenimiento
   */
  async update(
    maintenance_type: MaintenanceTypeUpdate
  ): Promise<{ id: string }> {
    try {
      const result = await pool.query(
        "SELECT mnt.update_maintenance_type($1, $2, $3, $4, $5)",
        [
          maintenance_type.id,
          maintenance_type.type,
          maintenance_type.parent_id || null,
          maintenance_type.level,
          maintenance_type.path || null,
        ]
      );

      const response = result.rows[0].update_maintenance_type;
      return {
        id: response.id,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al actualizar maintenance type:", err.stack);
      } else {
        console.error("Error al actualizar maintenance type:", err);
      }
      throw err;
    }
  }

  /**
   * Eliminar tipo de mantenimiento
   */
  async delete(
    deleteMaintenanceType: DeleteMaintenanceType
  ): Promise<{ id: string }> {
    try {
      const result = await pool.query("SELECT mnt.delete_maintenance_type($1)", [
        deleteMaintenanceType.id,
      ]);

      const response = result.rows[0].delete_maintenance_type;
      return {
        id: response.id,
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al eliminar maintenance type:", err.stack);
      } else {
        console.error("Error al eliminar maintenance type:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener hijos de un tipo de mantenimiento
   */
  async getChildren(
    parent_id: string,
    user_id: string
  ): Promise<MaintenanceTypeBase[]> {
    try {
      const result = await pool.query(
        "SELECT mnt.get_maintenance_type_children($1, $2)",
        [parent_id, user_id]
      );

      const children = result.rows[0].get_maintenance_type_children;

      if (!children || children.length === 0) {
        return [];
      }

      return children.map((child: MaintenanceTypeBase) => ({
        id: child.id,
        type: child.type,
        parent_id: child.parent_id,
        level: child.level,
        path: child.path,
        created_at: new Date(child.created_at),
        user_id: child.user_id,
      }));
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al obtener hijos de maintenance type:", err.stack);
      } else {
        console.error("Error al obtener hijos de maintenance type:", err);
      }
      throw err;
    }
  }

  /**
   * Obtener árbol completo de tipos de mantenimiento
   */
  async getTree(user_id: string): Promise<MaintenanceTypeWithChildren[]> {
    try {
      const result = await pool.query("SELECT mnt.get_maintenance_types_tree($1)", [
        user_id,
      ]);

      const tree = result.rows[0].get_maintenance_types_tree;

      if (!tree || tree.length === 0) {
        return [];
      }

      return tree.map((node: MaintenanceTypeWithChildren) => ({
        id: node.id,
        type: node.type,
        parent_id: node.parent_id,
        level: node.level,
        path: node.path,
        created_at: new Date(node.created_at),
        user_id: node.user_id,
        children: node.children || [],
      }));
    } catch (err) {
      if (err instanceof Error) {
        console.error(
          "Error al obtener árbol de maintenance types:",
          err.stack
        );
      } else {
        console.error("Error al obtener árbol de maintenance types:", err);
      }
      throw err;
    }
  }

  async hasChildren(id: string): Promise<boolean> {
    try {
      const result = await pool.query(
        "SELECT mnt.maintenance_type_has_children($1)",
        [id]
      );

      return result.rows[0].maintenance_type_has_children;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error al verificar si tiene hijos:", err.stack);
      } else {
        console.error("Error al verificar si tiene hijos:", err);
      }
      throw err;
    }
  }
}

export const maintenanceTypeRepository = new MaintenanceTypeRepository();
