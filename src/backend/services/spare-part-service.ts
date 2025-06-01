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
      if (limit <= 0 || limit > 100) {
        throw new Error("El límite debe estar entre 1 y 100");
      }

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
   * Buscar repuestos por nombre
   * @param searchTerm - Término de búsqueda
   * @param userId - ID del usuario
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de repuestos que coinciden con la búsqueda
   */
  async searchByName(
    searchTerm: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MultiSparePart & { search_term: string }> {
    try {
      if (!searchTerm?.trim()) {
        throw new Error("El término de búsqueda es requerido");
      }

      if (limit <= 0 || limit > 100) {
        throw new Error("El límite debe estar entre 1 y 100");
      }

      return await this.repository.getByName(searchTerm, userId, limit, offset);
    } catch (error) {
      console.error("Error en SparePartService.searchByName:", error);
      throw error;
    }
  }

  /**
   * Buscar repuestos por rango de precios
   * @param minPrice - Precio mínimo
   * @param maxPrice - Precio máximo
   * @param userId - ID del usuario
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Lista de repuestos en el rango de precios
   */
  async getByPriceRange(
    minPrice: number,
    maxPrice: number,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MultiSparePart & { min_price: number; max_price: number }> {
    try {
      if (minPrice < 0 || maxPrice < 0) {
        throw new Error("Los precios no pueden ser negativos");
      }

      if (minPrice > maxPrice) {
        throw new Error("El precio mínimo no puede ser mayor al precio máximo");
      }

      if (limit <= 0 || limit > 100) {
        throw new Error("El límite debe estar entre 1 y 100");
      }

      return await this.repository.getByPriceRange(
        minPrice,
        maxPrice,
        userId,
        limit,
        offset
      );
    } catch (error) {
      console.error("Error en SparePartService.getByPriceRange:", error);
      throw error;
    }
  }

  /**
   * Obtener repuestos más utilizados
   * @param userId - ID del usuario
   * @param limit - Número de repuestos a retornar
   * @returns Lista de repuestos más utilizados
   */
  async getMostUsed(
    userId: string,
    limit: number = 10
  ): Promise<SparePartBase[]> {
    try {
      if (limit <= 0 || limit > 50) {
        throw new Error("El límite debe estar entre 1 y 50");
      }

      return await this.repository.getMostUsed(userId, limit);
    } catch (error) {
      console.error("Error en SparePartService.getMostUsed:", error);
      throw error;
    }
  }

  /**
   * Buscar repuesto por código de fábrica
   * @param factoryCode - Código de fábrica
   * @param userId - ID del usuario
   * @returns El repuesto encontrado o null
   */
  async getByFactoryCode(
    factoryCode: string,
    userId: string
  ): Promise<SparePartBase | null> {
    try {
      if (!factoryCode?.trim()) {
        throw new Error("El código de fábrica es requerido");
      }

      return await this.repository.getByFactoryCode(factoryCode, userId);
    } catch (error) {
      console.error("Error en SparePartService.getByFactoryCode:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de repuestos
   * @param userId - ID del usuario
   * @returns Estadísticas detalladas de los repuestos
   */
  /* async getStats(userId: string): Promise<any> {
    try {
      return await this.repository.getStats(userId);
    } catch (error) {
      console.error("Error en SparePartService.getStats:", error);
      throw error;
    }
  } */

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

      // Aquí podrías agregar validaciones adicionales:
      // - Verificar que no esté siendo usado en mantenimientos activos
      // - Verificar que no esté en órdenes de compra pendientes

      return await this.repository.delete({ id });
    } catch (error) {
      console.error("Error en SparePartService.delete:", error);
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
