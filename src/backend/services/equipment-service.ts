import { equipmentRepository } from "../repositories/equipment-repository";
import {
  EquipmentBase,
  EquipmentCreate,
  EquipmentUpdate,
  MultiEquipmentMaintenancePlan,
  MultiEquipmentWithRecords,
} from "@/types/equipment";

/**
 * Servicio para crear un nuevo equipo
 * @param equipment - Datos del equipo a crear
 * @returns El equipo creado
 */

class EquipmentService {
  private repository = equipmentRepository;
  constructor() {}

  /**
   * Crear un nuevo equipo
   * @param equipment - Datos del equipo a crear
   * @returns El equipo creado
   */
  async create(
    equipment: EquipmentCreate
  ): Promise<{ id: string; created_at: Date } | null> {
    try {
      return await this.repository.create(equipment);
    } catch (error) {
      console.error("Error al crear el equipo:", error);
      throw error;
    }
  }

  /**
   * Obtener un equipo por su ID
   * @param id - ID del equipo a buscar
   * @returns El equipo encontrado o null si no existe
   */
  async getById(id: string): Promise<EquipmentBase | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Error al obtener el equipo por ID:", error);
      throw error;
    }
  }

  /**
   * Obtener todos los equipos de un usuario
   * @param userId - ID del usuario
   * @returns Lista de equipos del usuario
   */
  async getAll(
    limit: number,
    offset: number,
    userId: string
  ): Promise<{ total: number; data: EquipmentBase[] }> {
    try {
      return await this.repository.getAll(limit, offset, userId);
    } catch (error) {
      console.error("Error al obtener todos los equipos:", error);
      throw error;
    }
  }

  /**
   * Actualizar un equipo por su ID
   * @param id - ID del equipo a actualizar
   * @param equipment - Nuevos datos del equipo
   * @returns El equipo actualizado
   */
  async update(equipment: EquipmentUpdate): Promise<{ id: string } | null> {
    try {
      return await this.repository.update(equipment);
    } catch (error) {
      console.error("Error al actualizar el equipo:", error);
      throw error;
    }
  }

  /**
   * Eliminar un equipo por su ID
   * @param id - ID del equipo a eliminar
   * @returns El ID del equipo eliminado
   */
  async delete(id: string): Promise<{ id: string } | null> {
    try {
      return await this.repository.delete({ id });
    } catch (error) {
      console.error("Error al eliminar el equipo:", error);
      throw error;
    }
  }

  async getAllWithRecords(
    userId: string,
    limit: number,
    offset: number,
    mileageLimit?: number,
    mileageOffset?: number
  ): Promise<MultiEquipmentWithRecords> {
    try {
      return await this.repository.getAllWithRecords(
        userId,
        limit,
        offset,
        mileageLimit,
        mileageOffset
      );
    } catch (error) {
      console.error("Error al obtener todos los equipos con registros:", error);
      throw error;
    }
  }

  async getMaintenancePlan(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<MultiEquipmentMaintenancePlan> {
    try {
      return await this.repository.getMaintenancePlan(userId, limit, offset);
    } catch (error) {
      console.error("Error al obtener el plan de mantenimiento:", error);
      throw error;
    }
  }
}

export const equipmentService = new EquipmentService();
