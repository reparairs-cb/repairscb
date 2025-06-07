import React, { useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { EquipmentWithPaginatedRecords } from "@/types/equipment";
import { MileageRecordBase } from "@/types/mileage-record";
import { formatDate } from "@/lib/utils";

interface MileageRecordsDetailViewProps {
  mileageRecords: EquipmentWithPaginatedRecords["mileage_records"];
  handlePageChange: (page: number) => Promise<void>;
  loading?: boolean;
}

const MileageRecordsDetailView: React.FC<MileageRecordsDetailViewProps> = ({
  mileageRecords,
  handlePageChange,
  loading,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const columns: TableColumn<MileageRecordBase>[] = [
    {
      name: "Fecha de Registro",
      selector: (row) => formatDate(row.record_date) || "N/A",
      sortable: true,
    },
    {
      name: "Kilómetros",
      selector: (row) => row.kilometers,
      sortable: true,
      format: (row) => row.kilometers.toLocaleString("es-PE"),
    },
  ];

  // Función para obtener los datos de la página actual
  const getCurrentPageData = (
    page: number,
    rowsPerPage: number,
    mrs: MileageRecordBase[]
  ) => {
    if (!mrs) return [];
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentRecords = mrs.slice(startIndex, endIndex);
    return currentRecords;
  };

  if (!mileageRecords) {
    return (
      <div className="p-4">
        <div className="text-center">
          {loading
            ? "Cargando registros de kilometraje..."
            : "Sin datos de kilometraje"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={columns}
          data={getCurrentPageData(
            currentPage,
            mileageRecords.limit,
            mileageRecords.data
          )}
          pagination
          paginationServer
          paginationTotalRows={mileageRecords.total}
          paginationDefaultPage={1}
          paginationRowsPerPageOptions={[10]}
          paginationPerPage={mileageRecords.limit}
          onChangePage={(page) => {
            setCurrentPage(page);
            handlePageChange(page);
          }}
          progressPending={loading}
          progressComponent={
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Cargando...</span>
            </div>
          }
          noDataComponent={
            <div className="p-4 text-center text-gray-500">
              No hay registros de kilometraje disponibles
            </div>
          }
          className="react-dataTable"
          customStyles={{
            header: {
              style: {
                minHeight: "56px",
              },
            },
            headRow: {
              style: {
                borderTopStyle: "solid",
                borderTopWidth: "1px",
                borderTopColor: "#e5e7eb",
              },
            },
            headCells: {
              style: {
                "&:not(:last-of-type)": {
                  borderRightStyle: "solid",
                  borderRightWidth: "1px",
                  borderRightColor: "#e5e7eb",
                },
                fontWeight: "600",
                backgroundColor: "#f9fafb",
              },
            },
            cells: {
              style: {
                "&:not(:last-of-type)": {
                  borderRightStyle: "solid",
                  borderRightWidth: "1px",
                  borderRightColor: "#e5e7eb",
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default MileageRecordsDetailView;
