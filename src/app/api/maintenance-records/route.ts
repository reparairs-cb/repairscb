import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/lib/auth";
import { maintenanceRecordService } from "@/backend/services/maintenance-record-service";
import { maintenanceSparePartService } from "@/backend/services/maintenance-spare-part-service";
import { MaintenanceRecordWithDetails } from "@/types/maintenance-record";
import { maintenanceActivityService } from "@/backend/services/maintenance-activity-service";
import { mileageRecordService } from "@/backend/services/mileage-record-service";
/**
 * GET /api/maintenance-records
 * Obtener registros de mantenimiento paginados
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

    const result = await maintenanceRecordService.getAllWithDetails(
      limit,
      offset,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en GET /api/maintenance-records:", error);
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
 * POST /api/maintenance-records
 * Crear nuevo registro de mantenimiento
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
        { success: false, message: "Datos incompletos" },
        { status: 400 }
      );
    }

    let mileageRecord = body.mileage_record;

    if (
      mileageRecord &&
      body.mileage &&
      body.mileage !== mileageRecord.kilometers
    ) {
      console.log(
        "Mileage provided but does not match existing mileage record, updating..."
      );
      console.log("Updating existing mileage record");
      mileageRecordService.update({
        id: body.mileage_record.id,
        user_id: session.user.id,
        kilometers: body.mileage,
      });
    } else if (body.mileage && !mileageRecord) {
      // Si se proporciona un kilometraje sin un registro de kilometraje existente, creamos uno nuevo
      mileageRecord = await mileageRecordService.create({
        equipment_id: body.equipment_id,
        record_date: body.start_datetime,
        kilometers: body.mileage,
        user_id: session.user.id,
      });

      if (!mileageRecord) {
        return NextResponse.json(
          {
            success: false,
            message: "Error al crear el registro de kilometraje",
          },
          { status: 500 }
        );
      }

      body.mileage_record_id = mileageRecord.id;
    }

    console.log("Creating new maintenance record with mileage:", mileageRecord);

    // Validar campos requeridos
    const requiredFields = [
      "equipment_id",
      "maintenance_type_id",
      "start_datetime",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `Campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }

    const result = await maintenanceRecordService.create({
      equipment_id: body.equipment_id,
      maintenance_type_id: body.maintenance_type_id,
      mileage_record_id: mileageRecord.id,
      start_datetime: body.start_datetime,
      end_datetime: body.end_datetime,
      observations: body.observations,
      user_id: session.user.id,
    });

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Error al crear el registro de mantenimiento",
        },
        { status: 500 }
      );
    }

    console.log("New maintenance record created:", result);

    const new_MaintenanceRecord: MaintenanceRecordWithDetails = {
      id: result.id,
      equipment_id: body.equipment_id,
      maintenance_type_id: body.maintenance_type_id,
      mileage_record_id: mileageRecord.id,
      start_datetime: body.start_datetime,
      end_datetime: body.end_datetime,
      observations: body.observations,
      created_at: result.created_at,
      updated_at: result.created_at,
      user_id: session.user.id,
      mileage_info: {
        id: mileageRecord.id,
        record_date: mileageRecord.record_date,
        kilometers: mileageRecord.kilometers,
      },
    };

    // crear maintenance_spare_parts si existen
    if (
      body.spare_parts &&
      Array.isArray(body.spare_parts) &&
      body.spare_parts.length > 0
    ) {
      const sparePartsResult = await maintenanceSparePartService.bulkUpdate({
        maintenance_record_id: result.id,
        spare_parts: body.spare_parts,
        user_id: session.user.id,
      });

      new_MaintenanceRecord.spare_parts =
        sparePartsResult.created_spare_parts.map((sp, index) => {
          return {
            id: sp.id,
            maintenance_record_id: sparePartsResult.maintenance_record_id,
            spare_part_id: body.spare_parts[index].spare_part_id,
            quantity: body.spare_parts[index].quantity,
            unit_price: body.spare_parts[index].price,
            created_at: sp.created_at,
            updated_at: sp.created_at,
            user_id: session.user.id,
            spare_part: body.spare_parts[index],
          };
        });
    }

    // crear maintenance_activities si existen
    if (
      body.activities &&
      Array.isArray(body.activities) &&
      body.activities.length > 0
    ) {
      const activitiesResult = await maintenanceActivityService.bulkUpdate({
        maintenance_record_id: result.id,
        activities: body.activities,
        user_id: session.user.id,
      });

      new_MaintenanceRecord.activities =
        activitiesResult.created_activities.map((act, index) => {
          return {
            id: act.id,
            maintenance_record_id: activitiesResult.maintenance_record_id,
            activity_id: body.activities[index].activity_id,
            completed: body.activities[index].completed,
            observations: body.activities[index].observations,
            created_at: act.created_at,
            updated_at: act.created_at,
            user_id: session.user.id,
            activity: body.activities[index],
          };
        });
    }

    console.log(
      "New maintenance record with details created:",
      new_MaintenanceRecord
    );

    return NextResponse.json({
      success: true,
      data: new_MaintenanceRecord,
    });
  } catch (error) {
    console.error("Error en POST /api/maintenance-records:", error);
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
 * PUT /api/maintenance-records/:id
 * Actualizar registro de mantenimiento
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

    const body = await request.json();
    const result = await maintenanceRecordService.update({
      id: body.id,
      equipment_id: body.equipment_id,
      start_datetime: body.start_datetime,
      end_datetime: body.end_datetime,
      maintenance_type_id: body.maintenance_type_id,
      observations: body.observations,
      mileage_record_id: body.mileage_record_id,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en PUT /api/maintenance-records:", error);
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
 * DELETE /api/maintenance-records/:id
 * Eliminar registro de mantenimiento
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
        { success: false, message: "ID de registro no proporcionado" },
        { status: 400 }
      );
    }

    const result = await maintenanceRecordService.delete(body.id);

    return NextResponse.json({
      success: true,
      message: "Registro de mantenimiento eliminado exitosamente",
      data: result,
    });
  } catch (error) {
    console.error("Error en DELETE /api/maintenance-records:", error);
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
