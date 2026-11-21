import { useState, useEffect, useCallback } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import DeliveryBoyHeader from "../components/deliveryboy/DeliveryBoyHeader";
import DeliveryBoyFilters from "../components/deliveryboy/DeliveryBoyFilters";
import DeliveryBoyTable from "../components/deliveryboy/DeliveryBoyTable";
import AddDeliveryBoyModal from "../components/deliveryboy/AddDeliveryBoyModal";
import EditDeliveryBoyModal from "../components/deliveryboy/EditDeliveryBoyModal";
import DeliveryBoyDetailsModal from "../components/deliveryboy/DeliveryBoyDetailsModal";
import DeleteDeliveryBoyDialog from "../components/deliveryboy/DeleteDeliveryBoyDialog";
import deliveryBoyAPI from "../services/deliveryBoyAPI";

export default function DeliveryBoyManagement() {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("normal");
  const [orderBy, setOrderBy] = useState("asc");

  // Modals & Selected Rider
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBoy, setSelectedBoy] = useState(null);

  // Toast Feedback
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  // Fetch Delivery Boys from Backend API
  const loadDeliveryBoys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await deliveryBoyAPI.fetchAllDeliveryBoys({
        search: searchTerm,
        sort_by: sortBy,
        order_by: orderBy,
      });

      const data = res.data?.data;
      if (data && Array.isArray(data.delivery_boys)) {
        setDeliveryBoys(data.delivery_boys);
        setTotalCount(data.total_count || data.delivery_boys.length);
      } else {
        setDeliveryBoys([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Failed to load delivery boys from backend:", err);
      showToast("Could not load delivery boys. Please verify backend connection.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, orderBy]);

  useEffect(() => {
    loadDeliveryBoys();
  }, [loadDeliveryBoys]);

  // CREATE Delivery Boy
  const handleCreate = async (payload) => {
    try {
      setActionLoading(true);
      await deliveryBoyAPI.createDeliveryBoy(payload);
      showToast("Delivery boy registered successfully!");
      setAddModalOpen(false);
      loadDeliveryBoys();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.email?.[0] || err.response?.data?.mobile_number?.[0] || "Failed to create delivery boy.";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // UPDATE Delivery Boy
  const handleUpdate = async (payload) => {
    try {
      setActionLoading(true);
      await deliveryBoyAPI.updateDeliveryBoy(payload);
      showToast("Delivery boy updated successfully!");
      setEditModalOpen(false);
      setSelectedBoy(null);
      loadDeliveryBoys();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.mobile_number?.[0] || "Failed to update delivery boy.";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // DELETE Delivery Boy
  const handleDelete = async (boyId) => {
    try {
      setActionLoading(true);
      await deliveryBoyAPI.deleteDeliveryBoy(boyId);
      showToast("Delivery boy deleted successfully.");
      setDeleteDialogOpen(false);
      setSelectedBoy(null);
      loadDeliveryBoys();
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("Failed to delete delivery boy.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Details Modal
  const handleOpenDetails = async (boy) => {
    try {
      const res = await deliveryBoyAPI.fetchDeliveryBoyDetails(boy.id);
      if (res.data?.data) {
        setSelectedBoy(res.data.data);
      } else {
        setSelectedBoy(boy);
      }
    } catch (err) {
      setSelectedBoy(boy);
    }
    setDetailsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (boy) => {
    setSelectedBoy(boy);
    setEditModalOpen(true);
  };

  // Open Delete Dialog
  const handleOpenDelete = (boy) => {
    setSelectedBoy(boy);
    setDeleteDialogOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: "32px" }, maxWidth: 1440, mx: "auto" }}>
      {/* 1. Header with title, search input & Add Delivery Boy CTA matching Figma */}
      <DeliveryBoyHeader
        totalCount={totalCount}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setAddModalOpen(true)}
      />

      {/* 2. Delivery Boys Table matching Figma */}
      <DeliveryBoyTable
        deliveryBoys={deliveryBoys}
        loading={loading}
        onViewDetails={handleOpenDetails}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* 4. Add Delivery Boy Modal */}
      <AddDeliveryBoyModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreate}
        loading={actionLoading}
      />

      {/* 5. Edit Delivery Boy Modal */}
      <EditDeliveryBoyModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedBoy(null);
        }}
        boy={selectedBoy}
        onSubmit={handleUpdate}
        loading={actionLoading}
      />

      {/* 6. Delivery Boy Details Modal */}
      <DeliveryBoyDetailsModal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedBoy(null);
        }}
        boy={selectedBoy}
      />

      {/* 7. Delete Confirmation Dialog */}
      <DeleteDeliveryBoyDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedBoy(null);
        }}
        boy={selectedBoy}
        onConfirm={handleDelete}
        loading={actionLoading}
      />

      {/* Global Snackbar Toast Feedback */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: "100%", borderRadius: "10px", fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
