import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { equipmentService } from "@/backend/services/equipment-service";
import { MultiEquipmentWithRecords } from "@/types/equipment";
export const dynamic = "force-dynamic";
/**
 * GET /api/equipments/with-records
 * Obtener equipos con registros paginados
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
    const maintenanceLimit = parseInt(
      searchParams.get("maintenanceLimit") || "10"
    );
    const maintenanceOffset = parseInt(
      searchParams.get("maintenanceOffset") || "0"
    );
    const mileageLimit = parseInt(searchParams.get("mileageLimit") || "10");
    const mileageOffset = parseInt(searchParams.get("mileageOffset") || "0");

    const result: MultiEquipmentWithRecords =
      await equipmentService.getAllWithRecords(
        session.user.id,
        limit,
        offset,
        maintenanceLimit,
        maintenanceOffset,
        mileageLimit,
        mileageOffset
      );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en GET /api/equipments/with-records:", error);
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }
    if (!request.body) {
      return NextResponse.json(
        { success: false, message: "Datos de solicitud no válidos" },
        { status: 400 }
      );
    }
    const body = await request.json();

    const {
      limit,
      offset,
      maintenanceLimit,
      maintenanceOffset,
      mileageLimit,
      mileageOffset,
      byPriority,
      byStatus,
      sortBy,
    } = body;

    const result: MultiEquipmentWithRecords =
      await equipmentService.getAllWithRecordsByPriorityAndStatus(
        session.user.id,
        limit,
        offset,
        maintenanceLimit,
        maintenanceOffset,
        mileageLimit,
        mileageOffset,
        Array.isArray(byPriority) && byPriority.length > 0 ? byPriority : null,
        Array.isArray(byStatus) && byStatus.length > 0 ? byStatus : null,
        sortBy || null
      );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en POST /api/equipments/with-records:", error);
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
