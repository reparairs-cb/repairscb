import { maintenanceTypeService } from "@/backend/services/maintenance-type-service";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";

/**
 * GET /api/maintenance-type
 * Obtener tipos de mantenimiento paginados
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const result = await maintenanceTypeService.getTree(session.user.id);

    /* const result = await maintenanceTypeService.getTree(
      "284ff736-9313-4618-8d3d-6d9dfc48cc81"
    ); */

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en GET /api/maintenance-type:", error);
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
 * POST /api/maintenance-type
 * Crear nuevo tipo de mantenimiento
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

    const data = await request.json();
    const result = await maintenanceTypeService.create({
      ...data,
      user_id: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en POST /api/maintenance-type:", error);
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
 * PUT /api/maintenance-type
 * Actualizar tipo de mantenimiento
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const result = await maintenanceTypeService.update(data);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en PUT /api/maintenance-type:", error);
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
 * DELETE /api/maintenance-type
 * Eliminar tipo de mantenimiento
 */
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
        {
          success: false,
          message: "ID de tipo de mantenimiento no proporcionado",
        },
        { status: 400 }
      );
    }

    const result = await maintenanceTypeService.delete(body.id);

    return NextResponse.json({
      success: true,
      message: "Tipo de mantenimiento eliminado exitosamente",
      data: result,
    });
  } catch (error) {
    console.error("Error en DELETE /api/maintenance-type:", error);
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
