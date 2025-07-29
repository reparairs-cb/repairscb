import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { maintenanceStageService } from "@/backend/services/maintenance-stage-service";
import {
  MaintenanceStageBase,
  MaintenanceStageCreate,
  MaintenanceStageUpdate,
  MultiMaintenanceStage,
} from "@/types/maintenance-stage";
/**
 * GET /api/maintenance-stage
 * Obtener etapas de mantenimiento paginadas
 * @param request - Request object
 * @returns - Paginación de etapas de mantenimiento
 * */
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

    const result: MultiMaintenanceStage = await maintenanceStageService.getAll(
      session.user.id,
      undefined,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en GET /api/maintenance-stage:", error);
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
 * POST /api/maintenance-stage
 * Crear nueva etapa de mantenimiento
 * @param request - Request object
 * @returns - Resultado de la creación de la etapa
 * */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const data: MaintenanceStageCreate & { stages: MaintenanceStageBase[] } =
      await request.json();

    if (
      !data.maintenance_type_id ||
      data.stage_index === undefined ||
      data.kilometers === undefined ||
      data.days === undefined ||
      !data.maintenance_plan_id ||
      !data.stages ||
      !Array.isArray(data.stages)
    ) {
      return NextResponse.json(
        { success: false, message: "Datos incompletos" },
        { status: 400 }
      );
    }

    data.user_id = session.user.id;
    const result = await maintenanceStageService.create(data);

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Error al crear la etapa" },
        { status: 500 }
      );
    }

    const stgs = data.stages.map((stage) => ({
      ...stage,
    }));

    stgs.push({
      id: result.id,
      maintenance_type_id: data.maintenance_type_id,
      maintenance_plan_id: data.maintenance_plan_id,
      stage_index: data.stage_index,
      kilometers: data.kilometers,
      days: data.days,
      created_at: new Date(),
      user_id: session.user.id,
    });

    const sortedStages = stgs.sort((a, b) =>
      a.kilometers - b.kilometers === 0
        ? a.days - b.days
        : a.kilometers - b.kilometers
    );

    let reorderNeeded = false;
    for (let i = 0; i < sortedStages.length - 1; i++) {
      if (data.stages[i].stage_index !== sortedStages[i].stage_index) {
        reorderNeeded = true;
        break;
      }
    }

    if (reorderNeeded) {
      const sortedIds = sortedStages.map((stage) => stage.id);
      await maintenanceStageService.reorderStages(session.user.id, sortedIds);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        stage_index: sortedStages.find((s) => s.id === result.id)?.stage_index,
        sorted_stages: sortedStages,
      },
    });
  } catch (error) {
    console.error("Error en POST /api/maintenance-stage:", error);
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
 * PUT /api/maintenance-stage
 * Actualizar etapa de mantenimiento
 * @param request - Request object
 * @returns - Resultado de la actualización de la etapa
 * */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const data: MaintenanceStageUpdate & { stages: MaintenanceStageBase[] } =
      await request.json();
    console.log("Datos recibidos en PUT:", data);
    if (
      !data.maintenance_type_id ||
      data.stage_index === undefined ||
      data.kilometers === undefined ||
      data.days === undefined ||
      !data.stages ||
      !Array.isArray(data.stages)
    ) {
      return NextResponse.json(
        { success: false, message: "Datos incompletos" },
        { status: 400 }
      );
    }

    const result = await maintenanceStageService.update(data, session.user.id);

    const stgs = data.stages.map((stage) => ({
      ...stage,
    }));

    const sortedStages = stgs.sort((a, b) =>
      a.kilometers - b.kilometers === 0
        ? a.days - b.days
        : a.kilometers - b.kilometers
    );

    let reorderNeeded = false;
    for (let i = 0; i < sortedStages.length - 1; i++) {
      if (data.stages[i].stage_index !== sortedStages[i].stage_index) {
        reorderNeeded = true;
        break;
      }
    }

    if (reorderNeeded) {
      const sortedIds = sortedStages.map((stage) => stage.id);
      await maintenanceStageService.reorderStages(session.user.id, sortedIds);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        stage_index: sortedStages.find((s) => s.id === data.id)?.stage_index,
        sorted_stages: sortedStages,
      },
    });
  } catch (error) {
    console.error("Error en PUT /api/maintenance-stage:", error);
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
 * DELETE /api/maintenance-stage
 * Eliminar etapa de mantenimiento
 * @param request - Request object
 * @returns - Resultado de la eliminación de la etapa
 * */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const data: { id: string } = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { success: false, message: "ID de etapa no proporcionado" },
        { status: 400 }
      );
    }

    const result = await maintenanceStageService.delete(
      data.id,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en DELETE /api/maintenance-stage:", error);
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
