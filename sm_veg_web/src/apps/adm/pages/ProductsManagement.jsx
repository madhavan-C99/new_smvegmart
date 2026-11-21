import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Box, Alert, Button } from "@mui/material";
import { useLocation } from "react-router-dom";
import ProductHeader from "../components/productmanagement/ProductHeader";
import ProductFilter from "../components/productmanagement/ProductFilter";
import ProductTable from "../components/productmanagement/ProductTable";
import AddProductModal from "../components/productmanagement/AddProductModal";
import productsAPI from "../services/productAPI";
import categoryAPI from "../services/categoryAPI";
import subcategoryAPI from "../services/subcategoryAPI";
import { getMediaUrl } from "../services/apiClient";
import { useCommonPopup } from "../context/CommonPopupContext";
import { useReminders } from "../context/ReminderContext";

export default function ProductsManagement() {
  const { showConfirm, showAlert } = useCommonPopup();
  const { markReminderDone, clearWorkingTarget } = useReminders();
  const [state, setState] = useState({
    products: [],
    categories: [],
    subcategories: [],
    loading: false,
    errorMessage: null,
    searchTerm: "",
    selectedCategory: "All",
    selectedSubcategory: "All",
    modalOpen: false,
    editingProduct: null,
  });

  const {
    products,
    categories,
    subcategories,
    loading,
    errorMessage,
    searchTerm,
    selectedCategory,
    selectedSubcategory,
    modalOpen,
    editingProduct,
  } = state;

  const location = useLocation();
  const handledLocationKeyRef = useRef(null);
  const wsRef = useRef(null);

  // Helper to format raw product list received from WebSocket or fallback
  const formatProductsData = (rawList) => {
    return (rawList || []).map((prod, index) => ({
      ...prod,
      s_no: prod.s_no || index + 1,
      image: getMediaUrl(prod.image || prod.product_img),
      category_name: prod.category_name || "Uncategorized",
      subcategory_name: prod.subcategory_name || prod.subcategory || "General",
      daily_vegetables: Boolean(prod.daily_vegetables),
      status: prod.status || (prod.is_active ? "Active" : "Inactive"),
      visibility: prod.visibility !== undefined ? prod.visibility : prod.is_active,
      variants: prod.variants || [],
    }));
  };

  // Helper to get WebSocket URL
  const getWsUrl = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // When running Vite dev server (port 5173), talk directly to Daphne backend at 127.0.0.1:8000
    const host =
      window.location.port && window.location.port !== "8000"
        ? "127.0.0.1:8000"
        : window.location.host;
    return `${protocol}//${host}/ws/fetch_all_product/`;
  };

  // Connect to the WebSocket: ws/fetch_all_product/
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "init_all" }));
      return;
    }

    const wsUrl = getWsUrl();
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("🟢 [WebSocket] Connected to /ws/fetch_all_product/");
      socket.send(JSON.stringify({ action: "init_all" }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const payload = data.payload || data.data || [];
        const formatted = formatProductsData(payload);

        setState((prev) => ({
          ...prev,
          products: formatted,
          loading: false,
          errorMessage: null,
        }));
      } catch (err) {
        console.error("❌ [WebSocket] Error parsing product payload:", err);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    socket.onerror = (err) => {
      console.error("⚠️ [WebSocket] Connection error:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        errorMessage:
          "Could not connect to WebSocket at ws://127.0.0.1:8000/ws/fetch_all_product/. Please ensure Django Daphne is running.",
      }));
    };

    socket.onclose = (e) => {
      if (e.code !== 1000) {
        console.log(`⚪ [WebSocket] Closed (code: ${e.code}, reason: ${e.reason || "none"})`);
      }
    };
  }, []);

  // Request fresh products through WebSocket
  const requestProducts = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "init_all" }));
    } else {
      connectWebSocket();
    }
  }, [connectWebSocket]);

  const loadFilterCategories = async () => {
    try {
      const res = await categoryAPI.fetchAllcategory();
      if (res.data?.data?.categories) {
        setState((prev) => ({ ...prev, categories: res.data.data.categories }));
      }
    } catch {
      setState((prev) => ({ ...prev, categories: [] }));
    }
  };

  const loadSubcategories = async () => {
    try {
      const res = await subcategoryAPI.fetchAllSubcategories();
      if (res.data?.data?.subcategories) {
        setState((prev) => ({ ...prev, subcategories: res.data.data.subcategories }));
      }
    } catch {
      setState((prev) => ({ ...prev, subcategories: [] }));
    }
  };

  useEffect(() => {
    connectWebSocket();
    loadFilterCategories();
    loadSubcategories();

    return () => {
      const socket = wsRef.current;
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1000, "Unmount");
        } else if (socket.readyState === WebSocket.CONNECTING) {
          socket.onopen = () => socket.close(1000, "Unmount");
        }
      }
    };
  }, [connectWebSocket]);

  // If navigated from Out-of-Stock Reminder, filter and automatically open Edit Modal for that product
  useEffect(() => {
    if ((location.state?.editProductId || location.state?.searchTerm) && products.length > 0) {
      const locationKey = `${location.key}_${location.state?.timestamp || location.state?.editProductId || ""}`;
      if (handledLocationKeyRef.current !== locationKey) {
        handledLocationKeyRef.current = locationKey;

        const targetId = location.state.editProductId;
        const rawSearch = (location.state.searchTerm || "").trim();
        const searchLower = rawSearch.toLowerCase();

        let targetProd = null;

        // 1. Try matching by targetId first if available
        if (targetId) {
          const byId = products.find(
            (p) => String(p.id) === String(targetId) || Number(p.id) === Number(targetId)
          );
          if (byId) {
            const byIdName = (byId.name || "").toLowerCase();
            // Verify ID's product name matches the search name (if search provided)
            // This prevents an mismatched ID (e.g. ID 1 Onion) from overriding a Tomato reminder
            if (!searchLower || byIdName.includes(searchLower) || searchLower.includes(byIdName)) {
              targetProd = byId;
            }
          }
        }

        // 2. If targetProd not found or ID's product name was completely mismatched:
        if (!targetProd && searchLower) {
          // A. Exact name match (case-insensitive)
          targetProd = products.find(
            (p) => (p.name || "").toLowerCase() === searchLower
          );

          // B. Partial substring match
          if (!targetProd) {
            targetProd = products.find((p) => {
              const pName = (p.name || "").toLowerCase();
              return pName && (searchLower.includes(pName) || pName.includes(searchLower));
            });
          }

          // C. Word-level / stem match (e.g. "Fresh Farm Tomatoes" -> matches "Tomato")
          if (!targetProd) {
            const tokens = searchLower.split(/\s+/).filter((w) => w.length >= 3);
            for (const token of tokens) {
              const root = token.replace(/es$/, "").replace(/s$/, "");
              if (root.length >= 3) {
                targetProd = products.find((p) => {
                  const pName = (p.name || "").toLowerCase();
                  return pName.includes(root);
                });
                if (targetProd) break;
              }
            }
          }
        }

        // 3. Fallback: if search couldn't find anything but byId exists, use byId
        if (!targetProd && targetId) {
          targetProd = products.find(
            (p) => String(p.id) === String(targetId) || Number(p.id) === Number(targetId)
          );
        }

        if (targetProd) {
          setState((prev) => ({
            ...prev,
            searchTerm: targetProd.name || "",
            editingProduct: targetProd,
            modalOpen: true,
          }));
        } else if (rawSearch) {
          setState((prev) => ({
            ...prev,
            searchTerm: rawSearch,
          }));
        }
      }
    }
  }, [location.state, location.key, products]);

  // Filter products by search & dropdowns
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchSearch =
        !searchTerm.trim() ||
        prod.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.tamil_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.subcategory_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat =
        selectedCategory === "All" || prod.category_name === selectedCategory;

      const matchSub =
        selectedSubcategory === "All" ||
        prod.subcategory_name === selectedSubcategory;

      return matchSearch && matchCat && matchSub;
    });
  }, [products, searchTerm, selectedCategory, selectedSubcategory]);

  const handleCategoryChange = (catName) => {
    setState((prev) => ({
      ...prev,
      selectedCategory: catName,
      selectedSubcategory: "All",
    }));
  };

  const handleResetFilters = () => {
    setState((prev) => ({
      ...prev,
      selectedCategory: "All",
      selectedSubcategory: "All",
      searchTerm: "",
    }));
  };

  const handleToggleDailyVegetables = async (id, currentVal) => {
    const newVal = !currentVal;
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, daily_vegetables: newVal } : p)),
    }));
    try {
      await productsAPI.toggleDailyVegetables(id, newVal);
      requestProducts();
    } catch (err) {
      console.error("Failed to toggle daily vegetables:", err);
      requestProducts();
    }
  };

  const handleDelete = (id) => {
    const targetProduct = state.products.find((p) => p.id === id);
    const prodName = targetProduct?.name ? ` "${targetProduct.name}"` : "";

    showConfirm({
      title: "Delete Product?",
      message: `Are you sure you want to delete this product${prodName}? This item will be permanently removed from customer view.`,
      confirmText: "Delete Product",
      type: "danger",
      onConfirm: async () => {
        try {
          await productsAPI.deleteProductApi(id);
          requestProducts();
        } catch (err) {
          console.error("Failed to delete product in backend:", err);
          setState((prev) => ({
            ...prev,
            products: prev.products.filter((p) => p.id !== id),
          }));
        }
      },
    });
  };

  const handleSaveProduct = async (formData) => {
    try {
      if (editingProduct) {
        await productsAPI.updateProduct(formData);
        if (editingProduct?.id) {
          markReminderDone(`stock_${editingProduct.id}`);
          markReminderDone(editingProduct.id);
        }
      } else {
        await productsAPI.addProductApi(formData);
      }
      requestProducts();
    } catch (err) {
      console.error("Failed to save product in backend:", err);
      requestProducts();
    }
    clearWorkingTarget?.();
    setState((prev) => ({ ...prev, editingProduct: null }));
  };

  const handleExportCSV = async (pageProducts) => {
    try {
      // Export ONLY the items present on the current screen
      const itemsToExport = Array.isArray(pageProducts) && pageProducts.length > 0 ? pageProducts : state.products.slice(0, 10);
      const res = await productsAPI.exportCSV({ products: itemsToExport });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vegmart_products_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export product Excel from backend:", err);
      showAlert({
        title: "Export Failed",
        message: "Failed to export products. Please ensure Django is running.",
        type: "error",
      });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: "32px" }, maxWidth: 1440, mx: "auto" }}>
      {/* Error Alert when Backend / WebSocket is Offline */}
      {errorMessage && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: "10px", fontSize: "13px" }}
          action={
            <Button color="inherit" size="small" onClick={connectWebSocket}>
              Retry
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      )}

      {/* 1. Header with Title & Search */}
      <ProductHeader
        searchTerm={searchTerm}
        onSearchChange={(term) => setState((prev) => ({ ...prev, searchTerm: term }))}
        onAddClick={() => {
          setState((prev) => ({ ...prev, editingProduct: null, modalOpen: true }));
        }}
      />

      {/* 2. Filter Bar */}
      <ProductFilter
        categories={categories}
        subcategories={subcategories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        selectedSubcategory={selectedSubcategory}
        onSubcategoryChange={(subName) =>
          setState((prev) => ({ ...prev, selectedSubcategory: subName }))
        }
        onResetFilters={handleResetFilters}
      />

      {/* 3. Product Table */}
      <ProductTable
        products={filteredProducts}
        totalProducts={products.length}
        loading={loading}
        onToggleDailyVegetables={handleToggleDailyVegetables}
        onEdit={(prod) => {
          setState((prev) => ({ ...prev, editingProduct: prod, modalOpen: true }));
        }}
        onDelete={handleDelete}
        onExportCSV={handleExportCSV}
      />

      {/* 4. Add / Edit Product Modal */}
      <AddProductModal
        open={modalOpen}
        onClose={() => {
          setState((prev) => ({ ...prev, modalOpen: false, editingProduct: null }));
          clearWorkingTarget?.();
        }}
        onSave={handleSaveProduct}
        categories={categories}
        subcategories={subcategories}
        editData={editingProduct}
      />
    </Box>
  );
}
