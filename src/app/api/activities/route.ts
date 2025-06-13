import { activityService } from "@/backend/services/activity-service";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { ActivityCreate, ActivityUpdate } from "@/types/activity";

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

    if (offset < 0) {
      return NextResponse.json(
        { success: false, message: "El offset no puede ser negativo" },
        { status: 400 }
      );
    }

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
      { status: 500 }
    );
  }
}

/**
 * POST /api/activities
 * Crear nueva actividad con múltiples tipos de mantenimiento
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
    const { name, description, maintenance_type_ids } = body;

    // Validación del nombre
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Nombre de actividad inválido" },
        { status: 400 }
      );
    }

    // Validación de tipos de mantenimiento
    if (
      !maintenance_type_ids ||
      !Array.isArray(maintenance_type_ids) ||
      maintenance_type_ids.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Al menos un tipo de mantenimiento es requerido",
        },
        { status: 400 }
      );
    }

    // Validar que todos los IDs sean strings válidos
    const invalidTypeIds = maintenance_type_ids.filter(
      (id: unknown) => !id || typeof id !== "string" || id.trim() === ""
    );
    if (invalidTypeIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Todos los IDs de tipos de mantenimiento deben ser válidos",
        },
        { status: 400 }
      );
    }

    // Validar que no haya duplicados
    const uniqueTypeIds = Array.from(
      new Set(maintenance_type_ids.map((id: string) => id.trim()))
    );
    if (uniqueTypeIds.length !== maintenance_type_ids.length) {
      return NextResponse.json(
        {
          success: false,
          message: "No se permiten tipos de mantenimiento duplicados",
        },
        { status: 400 }
      );
    }

    // Validar límite razonable de tipos
    if (maintenance_type_ids.length > 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Máximo 10 tipos de mantenimiento permitidos",
        },
        { status: 400 }
      );
    }

    const activityData: ActivityCreate = {
      name: name.trim(),
      description: description ? description.trim() : undefined,
      maintenance_type_ids: uniqueTypeIds,
      user_id: session.user.id,
    };

    const result = await activityService.create(activityData);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Actividad creada exitosamente",
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

    const body = await request.json();
    const { id, name, description, maintenance_type_ids } = body;

    // Validación del ID
    if (!id || typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "ID de actividad no proporcionado o inválido",
        },
        { status: 400 }
      );
    }

    // Validaciones opcionales
    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim() === "")
    ) {
      return NextResponse.json(
        { success: false, message: "Nombre de actividad inválido" },
        { status: 400 }
      );
    }

    if (description !== undefined && typeof description !== "string") {
      return NextResponse.json(
        { success: false, message: "Descripción inválida" },
        { status: 400 }
      );
    }

    // Validaciones de tipos de mantenimiento si se proporcionan
    if (maintenance_type_ids !== undefined) {
      if (
        !Array.isArray(maintenance_type_ids) ||
        maintenance_type_ids.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Al menos un tipo de mantenimiento debe permanecer",
          },
          { status: 400 }
        );
      }

      // Validar que todos los IDs sean strings válidos
      const invalidTypeIds = maintenance_type_ids.filter(
        (typeId: unknown) =>
          !typeId || typeof typeId !== "string" || typeId.trim() === ""
      );
      if (invalidTypeIds.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Todos los IDs de tipos de mantenimiento deben ser válidos",
          },
          { status: 400 }
        );
      }

      // Validar que no haya duplicados
      const uniqueTypeIds = Array.from(
        new Set(maintenance_type_ids.map((typeId: string) => typeId.trim()))
      );
      if (uniqueTypeIds.length !== maintenance_type_ids.length) {
        return NextResponse.json(
          {
            success: false,
            message: "No se permiten tipos de mantenimiento duplicados",
          },
          { status: 400 }
        );
      }

      // Validar límite razonable de tipos
      if (maintenance_type_ids.length > 10) {
        return NextResponse.json(
          {
            success: false,
            message: "Máximo 10 tipos de mantenimiento permitidos",
          },
          { status: 400 }
        );
      }
    }

    const updateData: ActivityUpdate = {
      id: id.trim(),
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(maintenance_type_ids !== undefined && {
        maintenance_type_ids: Array.from(
          new Set(maintenance_type_ids.map((typeId: string) => typeId.trim()))
        ),
      }),
    };

    const result = await activityService.update(updateData, session.user.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Actividad actualizada exitosamente",
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

    if (
      !body ||
      !body.id ||
      typeof body.id !== "string" ||
      body.id.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ID de actividad no proporcionado o inválido",
        },
        { status: 400 }
      );
    }

    const result = await activityService.delete(
      body.id.trim(),
      session.user.id
    );

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
