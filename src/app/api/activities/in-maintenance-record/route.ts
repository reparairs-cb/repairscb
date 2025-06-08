import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { activityService } from "@/backend/services/activity-service";

/**
 * GET /api/activities/in-maintenance-record
 * Obtener actividades en un registro de mantenimiento específico
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

    const body = await request.json();
    const activityId = body["activityId"];

    if (!activityId) {
      return NextResponse.json(
        {
          success: false,
          message: "ID de registro de mantenimiento es requerido",
        },
        { status: 400 }
      );
    }

    const result = await activityService.existsInMaintenanceRecord(
      activityId,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en GET /api/activities/in-maintenance-record:", error);
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
