import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { equipmentService } from "@/backend/services/equipment-service";
import { MultiEquipmentMaintenancePlan } from "@/types/equipment";
export const dynamic = 'force-dynamic';

/**
 * GET /api/equipments/maintenance-plans
 * Obtener planes de mantenimiento de equipos paginados
 * @param request - Request object
 * @returns - Paginación de planes de mantenimiento de equipos
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result: MultiEquipmentMaintenancePlan =
      await equipmentService.getMaintenancePlan(session.user.id, limit, offset);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en GET /api/equipments/maintenance-plans:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 400 }
    );
  }
}
