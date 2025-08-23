import { sparePartRepository } from "../repositories/spare-part-repository";
import {
  MultiSparePart,
  SparePartBase,
  SparePartCreate,
  SparePartUpdate,
} from "@/types/spare-part";

class SparePartService {
  private repository = sparePartRepository;

  constructor() {}
  /**
   * Crear un nuevo repuesto
   * @param sparePart - Datos del repuesto a crear
   * @returns El repuesto creado
   */
  async create(
    sparePart: SparePartCreate
  ): Promise<{ id: string; created_at: Date }> {
    try {
      // Verificar que el código de fábrica no exista
      const existingByCode = await this.repository.factoryCodeExists(
        sparePart.factory_code,
        sparePart.user_id
      );
      if (existingByCode) {
        throw new Error("Ya existe un repuesto con ese código de fábrica");
      }

      // Validar URL de imagen si se proporciona
      if (sparePart.image_url && !this.isValidUrl(sparePart.image_url)) {
        throw new Error("La URL de la imagen no es válida");
      }

      const sparePartData: SparePartCreate = {
        ...sparePart,
      };

      return await this.repository.create(sparePartData);
    } catch (error) {
      console.error("Error en SparePartService.create:", error);
      throw error;
    }
  }

  /**
   * Obtener un repuesto por su ID
   * @param id - ID del repuesto a buscar
   * @returns El repuesto encontrado o null si no existe
   */
  async getById(id: string, userId: string): Promise<SparePartBase | null> {
    try {
      if (!id?.trim()) {
        throw new Error("El ID del repuesto es requerido");
      }

      const sparePart = await this.repository.getById(id);

      // Verificar que el repuesto pertenezca al usuario
      if (sparePart && sparePart.user_id !== userId) {
        return null; // No tiene acceso a este repuesto
      }

      return sparePart;
    } catch (error) {
      console.error("Error en SparePartService.getById:", error);
      throw error;
    }
  }

  /**
   * Obtener todos los repuestos de un usuario con paginación
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @param userId - ID del usuario
   * @returns Lista paginada de repuestos
   */
  async getAll(
    limit: number,
    offset: number,
    userId: string
  ): Promise<MultiSparePart> {
    try {
      if (offset < 0) {
        throw new Error("El offset no puede ser negativo");
      }

      return await this.repository.getAll(limit, offset, userId);
    } catch (error) {
      console.error("Error en SparePartService.getAll:", error);
      throw error;
    }
  }

  /**
   * Actualizar un repuesto por su ID
   * @param sparePart - Nuevos datos del repuesto
   * @param userId - ID del usuario
   * @returns El ID del repuesto actualizado
   */
  async update(
    sparePart: SparePartUpdate,
    userId: string
  ): Promise<{ id: string } | null> {
    try {
      if (!sparePart.id?.trim()) {
        throw new Error("El ID es requerido para actualizar");
      }

      // Verificar que el repuesto existe y pertenece al usuario
      const existing = await this.getById(sparePart.id, userId);
      if (!existing) {
        throw new Error(
          "Repuesto no encontrado o no tiene permisos para modificarlo"
        );
      }

      // Validar precio si se está actualizando
      if (sparePart.price !== undefined && sparePart.price < 0) {
        throw new Error("El precio no puede ser negativo");
      }

      // Si se está actualizando el código de fábrica, verificar que no exista
      if (
        sparePart.factory_code &&
        sparePart.factory_code !== existing.factory_code
      ) {
        const existingByCode = await this.repository.factoryCodeExists(
          sparePart.factory_code,
          userId,
          sparePart.id
        );
        if (existingByCode) {
          throw new Error("Ya existe otro repuesto con ese código de fábrica");
        }
      }

      // Validar URL de imagen si se proporciona
      if (sparePart.image_url && !this.isValidUrl(sparePart.image_url)) {
        throw new Error("La URL de la imagen no es válida");
      }

      return await this.repository.update(sparePart);
    } catch (error) {
      console.error("Error en SparePartService.update:", error);
      throw error;
    }
  }

  /**
   * Eliminar un repuesto por su ID
   * @param id - ID del repuesto a eliminar
   * @param userId - ID del usuario
   * @returns El ID del repuesto eliminado
   */
  async delete(id: string, userId: string): Promise<{ id: string } | null> {
    try {
      if (!id?.trim()) {
        throw new Error("El ID es requerido");
      }

      // Verificar que el repuesto existe y pertenece al usuario
      const existing = await this.getById(id, userId);
      if (!existing) {
        throw new Error(
          "Repuesto no encontrado o no tiene permisos para eliminarlo"
        );
      }

      // - Verificar que no esté siendo usado en mantenimientos activos
      const inUse = await this.isInUse(id);
      if (inUse) {
        throw new Error(
          "El repuesto no puede ser eliminado porque está en uso"
        );
      }

      // - Verificar que no esté en órdenes de compra pendientes

      return await this.repository.delete({ id });
    } catch (error) {
      console.error("Error en SparePartService.delete:", error);
      throw error;
    }
  }

  /**
   * Validar si un repuesto está en uso
   * @param id - ID del repuesto
   * @returns true si está en uso, false en caso contrario
   */
  async isInUse(id: string): Promise<boolean> {
    try {
      return await this.repository.isInUse(id);
    } catch (error) {
      console.error("Error en SparePartService.isInUse:", error);
      throw error;
    }
  }

  /**
   * Validar si una URL es válida
   * @param url - URL a validar
   * @returns true si es válida, false en caso contrario
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const sparePartService = new SparePartService();
