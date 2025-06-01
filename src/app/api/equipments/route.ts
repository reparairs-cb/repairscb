import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { equipmentService } from "@/backend/services/equipment-service";

/**
 * GET /api/equipments
 * Obtener equipos paginados
 */
export async function GET(request: NextRequest) {
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

    const result = await equipmentService.getAll(
      limit,
      offset,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en GET /api/equipments:", error);
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
 * POST /api/equipments
 * Crear nuevo equipo
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body) {
      return NextResponse.json(
        { success: false, message: "Datos no proporcionados" },
        { status: 400 }
      );
    }

    // Validar que el cuerpo tenga los campos necesarios
    if (!body.type) {
      return NextResponse.json(
        { success: false, message: "Tipo de equipo es requerido" },
        { status: 400 }
      );
    }

    if (!body.license_plate) {
      return NextResponse.json(
        { success: false, message: "Placa del equipo es requerida" },
        { status: 400 }
      );
    }

    if (!body.code) {
      return NextResponse.json(
        { success: false, message: "Código del equipo es requerido" },
        { status: 400 }
      );
    }

    const result = await equipmentService.create({
      type: body.type,
      license_plate: body.license_plate,
      code: body.code,
      user_id: session.user.id,
    });

    /* const { type, license_plate, code } = body;

    const result = await equipmentService.create({
      type,
      license_plate,
      code,
      user_id: session.user.id,
    }); */

    return NextResponse.json(
      {
        success: true,
        message: "Equipo creado exitosamente",
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/equipments:", error);
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, message: "ID de equipo no proporcionado" },
        { status: 400 }
      );
    }

    const result = await equipmentService.delete(body.id);

    return NextResponse.json({
      success: true,
      message: "Equipo eliminado exitosamente",
      data: result,
    });
  } catch (error) {
    console.error("Error en DELETE /api/equipments:", error);
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

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, message: "ID de equipo no proporcionado" },
        { status: 400 }
      );
    }

    const result = await equipmentService.update({
      id: body.id,
      type: body.type || null,
      license_plate: body.license_plate || null,
      code: body.code || null,
    });

    return NextResponse.json({
      success: true,
      message: "Equipo actualizado exitosamente",
      data: result,
    });
  } catch (error) {
    console.error("Error en PUT /api/equipments:", error);
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
