import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { mileageRecordService } from "@/backend/services/mileage-record-service";
import { MileageRecordCreate } from "@/types/mileage-record";
import { MultiMileageRecord } from "@/types/mileage-record";
import { MileageRecordUpdate } from "@/types/mileage-record";

/**
 * GET /api/mileage-record
 * Obtener registros de kilometraje paginados
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

    const result: MultiMileageRecord = await mileageRecordService.getAll(
      limit,
      offset,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en GET /api/mileage-record:", error);
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

/**
 * POST /api/mileage-record
 * Crear nuevo registro de kilometraje
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

    const data: MileageRecordCreate = await request.json();

    if (!data.equipment_id) {
      return NextResponse.json(
        { success: false, message: "ID de equipo es requerido" },
        { status: 400 }
      );
    }
    if (!data.record_date) {
      return NextResponse.json(
        { success: false, message: "Fecha de registro es requerida" },
        { status: 400 }
      );
    }

    if (typeof data.kilometers !== "number" || data.kilometers < 0) {
      return NextResponse.json(
        { success: false, message: "Kilómetros debe ser un número positivo" },
        { status: 400 }
      );
    }

    data.user_id = session.user.id;
    const result = await mileageRecordService.create(data);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en POST /api/mileage-record:", error);
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

/**
 * PUT /api/mileage-record
 * Actualizar registro de kilometraje
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const data: MileageRecordUpdate = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { success: false, message: "ID de registro es requerido" },
        { status: 400 }
      );
    }

    if (!data.equipment_id) {
      return NextResponse.json(
        { success: false, message: "ID de equipo es requerido" },
        { status: 400 }
      );
    }

    if (!data.record_date) {
      return NextResponse.json(
        { success: false, message: "Fecha de registro es requerida" },
        { status: 400 }
      );
    }

    if (typeof data.kilometers !== "number" || data.kilometers < 0) {
      return NextResponse.json(
        { success: false, message: "Kilómetros debe ser un número positivo" },
        { status: 400 }
      );
    }

    data.user_id = session.user.id;

    const result = await mileageRecordService.update(data);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en PUT /api/mileage-record:", error);
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

/**
 * DELETE /api/mileage-record
 * Eliminar registro de kilometraje
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const data = await request.json();

    if (!data || !data.id) {
      return NextResponse.json(
        { success: false, message: "ID de registro no proporcionado" },
        { status: 400 }
      );
    }

    if (typeof data.id !== "string") {
      return NextResponse.json(
        { success: false, message: "ID de registro debe ser una cadena" },
        { status: 400 }
      );
    }

    const result = await mileageRecordService.delete(data.id, session.user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en DELETE /api/mileage-record:", error);
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
