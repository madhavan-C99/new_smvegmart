import { useState, useEffect, useCallback } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import CustomerHeader from "../components/customer/CustomerHeader";
import CustomerTable from "../components/customer/CustomerTable";
import customerAPI from "../services/customerAPI";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Toast feedback
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  // Load customers from API
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customerAPI.fetchAllCustomers({
        search: searchTerm,
      });
      const data = res.data?.data;
      if (data && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
      showToast("Could not load customer accounts. Please verify backend connection.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Handle Toggle Customer Status (Active / Inactive)
  const handleToggleStatus = async (cust) => {
    try {
      await customerAPI.toggleStatus(cust.id);
      showToast(`Customer status marked as ${!cust.is_active ? "Active" : "Inactive"}`);
      loadCustomers();
    } catch (err) {
      console.error("Failed to toggle customer status:", err);
      showToast("Failed to update customer status.", "error");
    }
  };

  // Handle Export CSV
  const handleExport = async (pageCustomers) => {
    try {
      setExporting(true);
      const itemsToExport = Array.isArray(pageCustomers) && pageCustomers.length > 0 ? pageCustomers : customers.slice(0, 10);
      const res = await customerAPI.exportCSV({ customers: itemsToExport });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SM_VegMart_Customers_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Customer list exported successfully!");
    } catch (err) {
      console.error("Export failed:", err);
      showToast("Failed to export customers.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: "32px" }, maxWidth: 1440, mx: "auto" }}>
      {/* 1. Header with title, subtitle, Search bar and Export CTA matching Figma */}
      <CustomerHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onExport={handleExport}
        exporting={exporting}
      />

      {/* 2. Customer Table matching Figma design */}
      <CustomerTable
        customers={customers}
        loading={loading}
        onToggleStatus={handleToggleStatus}
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
