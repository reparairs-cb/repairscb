import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { mileageRecordService } from "@/backend/services/mileage-record-service";
/**
 * POST /api/maintenance-records/by-equipment
 * Obtener registros de mantenimiento por equipo
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

    const { equipment_id, limit, offset } = await request.json();

    if (!equipment_id) {
      return NextResponse.json(
        { success: false, message: "ID de equipo requerido" },
        { status: 400 }
      );
    }

    const result = await mileageRecordService.getByEquipment(
      equipment_id,
      session.user.id,
      limit || null,
      offset || null
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en POST /api/mileage-records/by-equipment:", error);
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
