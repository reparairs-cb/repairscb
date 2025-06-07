import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { maintenanceStageService } from "@/backend/services/maintenance-stage-service";
import { MaintenanceStageError } from "@/backend/repositories/maintenance-stage-repository";
import { MaintenanceStageErrorCodes } from "@/lib/errors";
import { z } from "zod";

// Schema para validar la request
const reorderRequestSchema = z.object({
  newOrder: z
    .array(z.string().uuid("Each ID must be a valid UUID"))
    .min(1, "At least one stage ID is required"),
});

type ReorderRequest = z.infer<typeof reorderRequestSchema>;

/**
 * PUT /api/maintenance-stages/reorder
 * Reordena las etapas de mantenimiento según el nuevo orden especificado
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parsear y validar el body de la request
    let body: ReorderRequest;
    try {
      const rawBody = await request.json();
      body = reorderRequestSchema.parse(rawBody);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: error instanceof z.ZodError ? error.errors : "Invalid JSON",
        },
        { status: 400 }
      );
    }

    const { newOrder } = body;

    // Validar que todas las etapas existen y pertenecen al usuario
    const stageValidations = await Promise.all(
      newOrder.map(async (stageId, index) => {
        const stage = await maintenanceStageService.getById(stageId, userId);
        return {
          index,
          stageId,
          stage,
          isValid: stage !== null,
        };
      })
    );

    const invalidStages = stageValidations.filter((v) => !v.isValid);

    if (invalidStages.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid stages found",
          details: `The following stages are invalid or don't belong to the maintenance type: ${invalidStages
            .map((v) => v.stageId)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Ejecutar el reordenamiento
    const reorderedCount = await maintenanceStageService.reorderStages(
      userId,
      newOrder
    );

    return NextResponse.json(
      {
        success: true,
        message: "Stages reordered successfully",
        data: {
          reordered_count: reorderedCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in reorder maintenance stages endpoint:", error);

    // Manejar errores específicos del servicio
    if (error instanceof MaintenanceStageError) {
      let statusCode = 500;

      switch (error.code) {
        case MaintenanceStageErrorCodes.NOT_FOUND:
          statusCode = 404;
          break;
        case MaintenanceStageErrorCodes.ACCESS_DENIED:
          statusCode = 403;
          break;
        case MaintenanceStageErrorCodes.INVALID_STAGE_INDEX:
        case MaintenanceStageErrorCodes.INVALID_VALUE:
        case MaintenanceStageErrorCodes.DUPLICATE_STAGE_INDEX:
          statusCode = 400;
          break;
        case MaintenanceStageErrorCodes.MAINTENANCE_TYPE_NOT_FOUND:
          statusCode = 404;
          break;
        default:
          statusCode = 500;
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: statusCode }
      );
    }

    // Error genérico
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
