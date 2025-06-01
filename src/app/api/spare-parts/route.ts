import { sparePartService } from "@/backend/services/spare-part-service";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";

/**
 * GET /api/spare-parts
 * Obtener repuestos paginados
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

    const result = await sparePartService.getAll(
      limit,
      offset,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en GET /api/spare-parts:", error);
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
 * POST /api/spare-parts
 * Crear nuevo repuesto
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

    // Validaciones de negocio
    if (!data.factory_code?.trim()) {
      return NextResponse.json(
        { success: false, message: "El código de fábrica es requerido" },
        { status: 400 }
      );
    }

    if (!data.name?.trim()) {
      return NextResponse.json(
        { success: false, message: "El nombre del repuesto es requerido" },
        { status: 400 }
      );
    }

    if (data.price === undefined || data.price === null) {
      return NextResponse.json(
        { success: false, message: "El precio es requerido" },
        { status: 400 }
      );
    }

    if (data.price < 0) {
      return NextResponse.json(
        { success: false, message: "El precio no puede ser negativo" },
        { status: 400 }
      );
    }

    /* const result = await sparePartService.create({
      ...data,
      user_id: session.user.id,
    }); */
    const result = await sparePartService.create({
      ...data,
      user_id: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en POST /api/spare-parts:", error);
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
 * DELETE /api/spare-parts
 * Eliminar un repuesto por ID
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
        { success: false, message: "ID de repuesto no proporcionado" },
        { status: 400 }
      );
    }

    const result = await sparePartService.delete(body.id, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Repuesto eliminado exitosamente",
      data: result,
    });
  } catch (error) {
    console.error("Error en DELETE /api/spare-parts:", error);
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
 * PUT /api/spare-parts
 * Actualizar un repuesto por ID
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
    const result = await sparePartService.update(
      {
        ...data,
      },
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en PUT /api/spare-parts:", error);
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
