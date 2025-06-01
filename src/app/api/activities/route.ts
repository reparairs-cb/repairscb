import { activityService } from "@/backend/services/activity-service";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { ActivityBase } from "@/types/activity";

/**
 * GET /api/activities
 * Obtener actividades paginadas
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

    const result = await activityService.getAll(limit, offset, session.user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en GET /api/activities:", error);
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
 * POST /api/activities
 * Crear nueva actividad
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

    const body: ActivityBase = await request.json();

    const { name, description, maintenance_type_id } = body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Nombre de actividad inválido" },
        { status: 400 }
      );
    }
    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { success: false, message: "Descripción de actividad inválida" },
        { status: 400 }
      );
    }
    if (
      !maintenance_type_id ||
      typeof maintenance_type_id !== "string" ||
      maintenance_type_id.trim() === ""
    ) {
      return NextResponse.json(
        { success: false, message: "ID de tipo de mantenimiento inválido" },
        { status: 400 }
      );
    }

    const result = await activityService.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      maintenance_type_id: maintenance_type_id.trim(),
      user_id: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en POST /api/activities:", error);
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
 * PUT /api/activities
 * Actualizar actividad
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

    const body: ActivityBase = await request.json();

    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, message: "ID de actividad no proporcionado" },
        { status: 400 }
      );
    }

    const result = await activityService.update(body, session.user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en PUT /api/activities:", error);
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
 * DELETE /api/activities
 * Eliminar actividad
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

    const body: { id: string } = await request.json();

    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, message: "ID de actividad no proporcionado" },
        { status: 400 }
      );
    }

    const result = await activityService.delete(body.id, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Actividad eliminada exitosamente",
      data: result,
    });
  } catch (error) {
    console.error("Error en DELETE /api/activities:", error);
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
