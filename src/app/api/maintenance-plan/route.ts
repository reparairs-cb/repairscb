import { maintenancePlanService } from "@/backend/services/maintenance-plan-service";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import {
  MaintenancePlanCreate,
  MaintenancePlanUpdate,
} from "@/types/maintenance-plan";

/**
 * GET /api/maintenance-plan
 * Obtener planes de mantenimiento con sus etapas
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
    const includeEmptyPlans = searchParams.get("include_empty") !== "false";

    if (offset < 0) {
      return NextResponse.json(
        { success: false, message: "El offset no puede ser negativo" },
        { status: 400 }
      );
    }

    const result = await maintenancePlanService.getAllWithStages(
      limit,
      offset,
      session.user.id,
      includeEmptyPlans
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en GET /api/maintenance-plan:", error);
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
 * POST /api/maintenance-plan
 * Crear nuevo plan de mantenimiento
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
    const { name, description } = body;

    // Validación del nombre
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Nombre del plan es requerido" },
        { status: 400 }
      );
    }

    if (name.trim().length < 3) {
      return NextResponse.json(
        {
          success: false,
          message: "El nombre del plan debe tener al menos 3 caracteres",
        },
        { status: 400 }
      );
    }

    if (name.trim().length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: "El nombre del plan no puede exceder 200 caracteres",
        },
        { status: 400 }
      );
    }

    // Validación de descripción
    if (description !== undefined) {
      if (typeof description !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "La descripción debe ser un texto válido",
          },
          { status: 400 }
        );
      }

      if (description.length > 1000) {
        return NextResponse.json(
          {
            success: false,
            message: "La descripción no puede exceder 1000 caracteres",
          },
          { status: 400 }
        );
      }
    }

    const planData: MaintenancePlanCreate = {
      name: name.trim(),
      description: description ? description.trim() : undefined,
      user_id: session.user.id,
    };

    const result = await maintenancePlanService.create(planData);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Plan de mantenimiento creado exitosamente",
    });
  } catch (error) {
    console.error("Error en POST /api/maintenance-plan:", error);
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
 * PUT /api/maintenance-plan
 * Actualizar plan de mantenimiento
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
    const { id, name, description } = body;

    // Validación del ID
    if (!id || typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        { success: false, message: "ID del plan no proporcionado o inválido" },
        { status: 400 }
      );
    }

    // Validaciones opcionales del nombre
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json(
          { success: false, message: "Nombre del plan inválido" },
          { status: 400 }
        );
      }

      if (name.trim().length < 3) {
        return NextResponse.json(
          {
            success: false,
            message: "El nombre del plan debe tener al menos 3 caracteres",
          },
          { status: 400 }
        );
      }

      if (name.trim().length > 200) {
        return NextResponse.json(
          {
            success: false,
            message: "El nombre del plan no puede exceder 200 caracteres",
          },
          { status: 400 }
        );
      }
    }

    // Validación de descripción
    if (description !== undefined) {
      if (typeof description !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "La descripción debe ser un texto válido",
          },
          { status: 400 }
        );
      }

      if (description.length > 1000) {
        return NextResponse.json(
          {
            success: false,
            message: "La descripción no puede exceder 1000 caracteres",
          },
          { status: 400 }
        );
      }
    }

    const updateData: MaintenancePlanUpdate = {
      id: id.trim(),
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
    };

    const result = await maintenancePlanService.update(
      updateData,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: "Plan de mantenimiento actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error en PUT /api/maintenance-plan:", error);
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
 * DELETE /api/maintenance-plan
 * Eliminar plan de mantenimiento
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

    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        { success: false, message: "ID del plan no proporcionado o inválido" },
        { status: 400 }
      );
    }

    // Verificar si se puede eliminar antes del intento
    const canDeleteCheck = await maintenancePlanService.canDelete(
      id.trim(),
      session.user.id
    );

    if (!canDeleteCheck.can_delete) {
      return NextResponse.json(
        {
          success: false,
          message: `No se puede eliminar el plan: ${canDeleteCheck.blocking_reason}`,
          details: {
            stage_count: canDeleteCheck.stage_count,
            blocking_reason: canDeleteCheck.blocking_reason,
          },
        },
        { status: 409 } // Conflict
      );
    }

    const result = await maintenancePlanService.delete(
      id.trim(),
      session.user.id
    );

    return NextResponse.json({
      success: true,
      message: "Plan de mantenimiento eliminado exitosamente",
      data: result,
    });
  } catch (error) {
    console.error("Error en DELETE /api/maintenance-plan:", error);
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
