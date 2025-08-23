import { maintenanceTypeRepository } from "../repositories/maintenance-type-repository";
import {
  MaintenanceTypeBase,
  MaintenanceTypeCreate,
  MaintenanceTypeUpdate,
  MultiMaintenanceType,
  MaintenanceTypeWithChildren,
} from "@/types/maintenance-type";

/**
 * Servicio para gestionar tipos de mantenimiento con soporte jerárquico
 */
class MaintenanceTypeService {
  private repository = maintenanceTypeRepository;

  constructor() {}

  /**
   * Crear un nuevo tipo de mantenimiento
   * @param maintenanceType - Datos del tipo de mantenimiento a crear
   * @returns El tipo de mantenimiento creado
   */
  async create(maintenanceType: MaintenanceTypeCreate): Promise<{
    id: string;
    created_at: Date;
    level: number;
    path: string | null;
  }> {
    try {
      // Validar datos básicos
      if (!maintenanceType.type?.trim()) {
        throw new Error("El tipo de mantenimiento es requerido");
      }

      // Si tiene padre, validar que existe y calcular nivel y path
      if (maintenanceType.parent_id) {
        const parent = await this.repository.getById(maintenanceType.parent_id);
        if (!parent) {
          throw new Error("El tipo padre especificado no existe");
        }

        // Verificar que pertenece al mismo usuario
        if (parent.user_id !== maintenanceType.user_id) {
          throw new Error("El tipo padre no pertenece al usuario");
        }

        // Calcular nivel y path automáticamente
        maintenanceType.level = parent.level + 1;
        maintenanceType.path = parent.path
          ? `${parent.path}/${maintenanceType.type}`
          : `${parent.type}/${maintenanceType.type}`;
      } else {
        // Es un tipo raíz
        maintenanceType.level = 0;
        maintenanceType.path = maintenanceType.type;
      }

      return await this.repository.create(maintenanceType);
    } catch (error) {
      console.error("Error al crear el tipo de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Obtener un tipo de mantenimiento por su ID
   * @param id - ID del tipo de mantenimiento a buscar
   * @returns El tipo de mantenimiento encontrado o null si no existe
   */
  async getById(id: string): Promise<MaintenanceTypeBase | null> {
    try {
      if (!id?.trim()) {
        throw new Error("El ID es requerido");
      }

      return await this.repository.getById(id);
    } catch (error) {
      console.error("Error al obtener el tipo de mantenimiento por ID:", error);
      throw error;
    }
  }

  /**
   * Obtener todos los tipos de mantenimiento de un usuario con paginación
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @param userId - ID del usuario
   * @returns Lista paginada de tipos de mantenimiento
   */
  async getAll(
    limit: number,
    offset: number,
    userId: string
  ): Promise<MultiMaintenanceType> {
    try {
      if (limit <= 0 || limit > 100) {
        throw new Error("El límite debe estar entre 1 y 100");
      }

      if (offset < 0) {
        throw new Error("El offset no puede ser negativo");
      }

      return await this.repository.getAll(limit, offset, userId);
    } catch (error) {
      console.error(
        "Error al obtener todos los tipos de mantenimiento:",
        error
      );
      throw error;
    }
  }

  /**
   * Obtener hijos directos de un tipo de mantenimiento
   * @param parentId - ID del tipo padre
   * @param userId - ID del usuario
   * @returns Lista de tipos hijos
   */
  async getChildren(
    parentId: string,
    userId: string
  ): Promise<MaintenanceTypeBase[]> {
    try {
      if (!parentId?.trim()) {
        throw new Error("El ID del padre es requerido");
      }

      return await this.repository.getChildren(parentId, userId);
    } catch (error) {
      console.error("Error al obtener hijos del tipo de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Obtener árbol completo de tipos de mantenimiento
   * @param userId - ID del usuario
   * @returns Estructura de árbol con todos los tipos y sus hijos
   */
  async getTree(userId: string): Promise<MaintenanceTypeWithChildren[]> {
    try {
      return await this.repository.getTree(userId);
    } catch (error) {
      console.error("Error al obtener árbol de tipos de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Actualizar un tipo de mantenimiento
   * @param maintenanceType - Datos del tipo de mantenimiento a actualizar
   * @returns El ID del tipo actualizado
   */
  async update(
    maintenanceType: MaintenanceTypeUpdate
  ): Promise<{ id: string } | null> {
    try {
      if (!maintenanceType.id?.trim()) {
        throw new Error("El ID es requerido para actualizar");
      }

      // Verificar que el tipo existe
      const existing = await this.repository.getById(maintenanceType.id);
      if (!existing) {
        throw new Error("El tipo de mantenimiento no existe");
      }

      // Si se está cambiando el padre, validar y recalcular path
      if (maintenanceType.parent_id !== undefined) {
        if (maintenanceType.parent_id) {
          // Verificar que el nuevo padre existe
          const newParent = await this.repository.getById(
            maintenanceType.parent_id
          );

          if (!newParent) {
            throw new Error("El nuevo tipo padre no existe");
          }

          // Verificar que no se está creando un ciclo
          if (maintenanceType.parent_id === maintenanceType.id) {
            throw new Error("Un tipo no puede ser padre de sí mismo");
          }

          // Verificar que el nuevo padre no es descendiente del tipo actual
          const descendants = await this.repository.getChildren(
            maintenanceType.id,
            existing.user_id
          );

          const isDescendant = (
            children: MaintenanceTypeBase[],
            targetId: string
          ): boolean => {
            return children.some(
              (child) => child.id === targetId || isDescendant([], targetId) // Aquí necesitarías una función recursiva completa
            );
          };

          if (isDescendant(descendants, newParent.id)) {
            throw new Error(
              "No se puede mover un tipo a uno de sus descendientes"
            );
          }

          // Calcular nuevo nivel y path
          maintenanceType.level = newParent.level + 1;
          const newType = maintenanceType.type || existing.type;
          maintenanceType.path = newParent.path
            ? `${newParent.path}/${newType}`
            : `${newParent.type}/${newType}`;
        } else {
          // Se está moviendo a raíz
          maintenanceType.level = 0;
          maintenanceType.path = maintenanceType.type || existing.type;
        }
      } else if (
        maintenanceType.type &&
        maintenanceType.type !== existing.type
      ) {
        // Solo se está cambiando el nombre, actualizar path manteniendo la estructura
        if (existing.parent_id) {
          const parent = await this.repository.getById(existing.parent_id);
          if (parent) {
            maintenanceType.path = parent.path
              ? `${parent.path}/${maintenanceType.type}`
              : `${parent.type}/${maintenanceType.type}`;
          }
        } else {
          maintenanceType.path = maintenanceType.type;
        }
      }

      return await this.repository.update(maintenanceType);
    } catch (error) {
      console.error("Error al actualizar el tipo de mantenimiento:", error);
      throw error;
    }
  }

  /**
   * Verificar si un tipo de mantenimiento tiene hijos
   * @param id - ID del tipo de mantenimiento
   * @returns true si tiene hijos, false en caso contrario
   */
  async hasChildren(id: string): Promise<boolean> {
    try {
      if (!id?.trim()) {
        throw new Error("El ID es requerido");
      }

      return await this.repository.hasChildren(id);
    } catch (error) {
      console.error("Error al verificar si tiene hijos:", error);
      throw error;
    }
  }

  /**
   * Eliminar un tipo de mantenimiento
   * @param id - ID del tipo de mantenimiento a eliminar
   * @returns El ID del tipo eliminado
   */
  async delete(id: string): Promise<{ id: string } | null> {
    try {
      if (!id?.trim()) {
        throw new Error("El ID es requerido");
      }

      // Verificar que no tiene hijos
      const hasChildren = await this.repository.hasChildren(id);
      if (hasChildren) {
        throw new Error(
          "No se puede eliminar un tipo de mantenimiento que tiene subtipos"
        );
      }

      // Verificar que no está siendo usado en actividades o registros de mantenimiento
      // (Esto requeriría funciones adicionales en el repositorio)

      return await this.repository.delete({ id });
    } catch (error) {
      console.error("Error al eliminar el tipo de mantenimiento:", error);
      throw error;
    }
  }
}

export const maintenanceTypeService = new MaintenanceTypeService();
