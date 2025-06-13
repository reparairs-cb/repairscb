import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { equipmentService } from "@/backend/services/equipment-service";

/**
 * POST /api/equipments/has-records
 * Verifica si un equipo tiene registros
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const { equipment_id } = await request.json();

    if (!equipment_id) {
      return NextResponse.json(
        { success: false, message: "ID de equipo requerido" },
        { status: 400 }
      );
    }

    const hasRecords = await equipmentService.hasRecords(equipment_id);

    return NextResponse.json({
      success: true,
      data: hasRecords,
    });
  } catch (error) {
    console.error("Error en POST /api/equipments/has-records:", error);
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
