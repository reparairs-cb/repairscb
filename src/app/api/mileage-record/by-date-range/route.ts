import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { mileageRecordService } from "@/backend/services/mileage-record-service";
import { MileageRecordsWithEquipmentResponse } from "@/types/mileage-record";

/**
 * POST /api/mileage-record/by-date-range
 * Obtener registros de kilometraje por rango de fechas
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

    const { start_date, end_date } = await request.json();

    if (!start_date || !end_date) {
      return NextResponse.json(
        { success: false, message: "Rango de fechas inválido" },
        { status: 400 }
      );
    }
    console.log("Rango de fechas:", start_date, end_date);

    const result: MileageRecordsWithEquipmentResponse =
      await mileageRecordService.getByDateRange(
        new Date(start_date),
        new Date(end_date),
        session.user.id
      );
      

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en POST /api/mileage-record/by-date-range:", error);
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
