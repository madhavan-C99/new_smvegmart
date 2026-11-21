import GenericTable from "../common/GenericTable";
import { getOrderColumns } from "./orderColumns";

export default function ConfirmedOrders({
  orders = [],
  loading = false,
  selectedOrderId = null,
  onSelectOrder,
  onViewOrder,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) {
  const rowsToDisplay = orders;

  const columns = getOrderColumns({
    onViewOrder: (row) => {
      onViewOrder?.(row);
      onSelectOrder?.(row);
    },
  });

  return (
    <GenericTable
      columns={columns}
      rows={rowsToDisplay}
      loading={loading}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      emptyMessage="No items found"
      emptySubMessage="There are no confirmed & packing orders at this moment."
      minWidth={960}
      onRowClick={(row) => {
        onSelectOrder?.(row);
        onViewOrder?.(row);
      }}
      getRowStyle={(row) => {
        const cleanSelected = String(selectedOrderId || "").replace("#SM-", "").replace("#", "").trim();
        const cleanRowId = String(row.id || "").replace("#SM-", "").replace("#", "").trim();
        const cleanRowNum = String(row.order_id || "").replace("#SM-", "").replace("#", "").trim();
        const isSelected = Boolean(cleanSelected && (cleanSelected === cleanRowId || cleanSelected === cleanRowNum));
        return {
          backgroundColor: isSelected ? "rgba(255, 247, 237, 0.75)" : "#ffffff",
          borderLeft: isSelected ? "4px solid #835200" : "4px solid transparent",
          transition: "background-color 0.15s ease",
        };
      }}
    />
  );
}
