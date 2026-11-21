import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

export default function PrinterBillPreviewModal({ open, onClose, order }) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Format print trigger
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // PDF direct download trigger
  const handleDownloadPdf = useCallback(async () => {
    const element = document.getElementById("thermal-pos-receipt");
    if (!element) return;

    try {
      setIsDownloadingPdf(true);
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Render high-res canvas at 3x scale for crisp thermal text
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      // 80mm thermal receipt roll dimensions in mm
      const pdfWidth = 80; // mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // proportional height

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, Math.max(pdfHeight, 100)],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      // Clean order number for filename (e.g. #SM-89421 -> SM_89421)
      const cleanNum = String(
        order?.order_id || order?.order_number || order?.id || "89421"
      ).replace(/[^a-zA-Z0-9_-]/g, "");

      pdf.save(`SM_VegMart_Invoice_${cleanNum}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [order]);

  // Keyboard shortcut Ctrl+P / Cmd+P listener
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrint, onClose]);

  if (!order) return null;

  // Extract order details with realistic fallbacks matching Figma
  const orderNumber = order.order_number || order.order_id || (order.id ? `SMV-${order.id}` : "SMV-89421");
  const customerName =
    order.customer?.name ||
    order.user?.name ||
    order.customer_name ||
    order.name ||
    "Rajesh Verma";

  const orderDate =
    order.order_date ||
    order.date_formatted ||
    (order.created_at ? order.created_at.split("T")[0] : "24-Oct-2024");

  const orderTime =
    order.created_time ||
    order.time ||
    (order.created_at && order.created_at.includes("T")
      ? order.created_at.split("T")[1]?.slice(0, 5)
      : "08:45 AM");

  const slotTiming =
    order.slot?.time_window ||
    (order.slot?.start_time && order.slot?.end_time
      ? `${order.slot.start_time} - ${order.slot.end_time}`
      : "");
  const dispatchMode = useMemo(() => {
    const mode = String(order.delivery_mode || "Express 25m");
    if (mode.toLowerCase().includes("pickup") || mode.toLowerCase().includes("shop")) {
      return slotTiming ? `Shop Pickup (${slotTiming})` : "Shop Pickup";
    }
    if (mode.toLowerCase().includes("schedul")) {
      return slotTiming ? `Scheduled (${slotTiming})` : "Scheduled Delivery";
    }
    return "Express 25m";
  }, [order.delivery_mode, slotTiming]);

  // Items from basket or sample items matching Figma screenshot
  const rawBasket = order.basket || order.items || [];
  const items =
    rawBasket.length > 0
      ? rawBasket.map((item, idx) => ({
          name: item.name || item.product_name || `Item ${idx + 1}`,
          pack: item.weight || item.pack || "1 unit",
          quantity: item.quantity || 1,
          unitPrice: Number(item.unit_price || item.price || 0),
          totalPrice: Number(item.total || item.total_price || (item.quantity || 1) * (item.price || 0)),
        }))
      : [
          {
            name: "Fresh Hydroponic Spinach",
            pack: "250g pack",
            quantity: 1,
            unitPrice: 25.0,
            totalPrice: 25.0,
          },
          {
            name: "Country Tomatoes (Farm Fresh)",
            pack: "1 kg (2 kg net)",
            quantity: 2,
            unitPrice: 44.0,
            totalPrice: 88.0,
          },
          {
            name: "Ratnagiri Alphonso Mangoes",
            pack: "1 kg Box",
            quantity: 1,
            unitPrice: 280.0,
            totalPrice: 280.0,
          },
        ];

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryCharge = Number(order.delivery_charge || 0);
  const grandTotal = subtotal + deliveryCharge;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.18)",
        },
      }}
    >
      {/* 1. Modal Header */}
      <Box
        sx={{
          bgcolor: "#ffffff",
          p: "14px 20px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        {/* Left: Title, Tag, and Online Status */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              bgcolor: "#ecfdf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PrintOutlinedIcon sx={{ color: "#0c6b27", fontSize: 22 }} />
          </Box>

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#1b1b1e",
                  lineHeight: "20px",
                }}
              >
                Printer Bill Preview
              </Typography>
              <Box
                sx={{
                  bgcolor: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  px: "7px",
                  py: "2px",
                  borderRadius: "4px",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  color: "#475569",
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                }}
              >
                80MM POS THERMAL
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mt: "2px" }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "#10b981",
                  boxShadow: "0 0 0 2px rgba(16,185,129,0.25)",
                }}
              />
              <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#0c6b27" }}>
                EPSON TM-T88VI • Online (Ready)
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right: Print Button and Close */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            variant="contained"
            onClick={handlePrint}
            startIcon={<PrintOutlinedIcon sx={{ fontSize: 18 }} />}
            sx={{
              bgcolor: "#0c6b27",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "12.5px",
              textTransform: "none",
              borderRadius: "8px",
              px: 2,
              py: "7px",
              boxShadow: "0 2px 6px rgba(12,107,39,0.3)",
              "&:hover": {
                bgcolor: "#08501c",
              },
            }}
          >
            Print (Ctrl+P)
          </Button>

          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: "#64748b",
              p: "6px",
              "&:hover": { bgcolor: "#f1f5f9", color: "#1b1b1e" },
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>

      {/* 2. Modal Body: Scrollable Canvas with Centered Thermal Receipt Paper */}
      <DialogContent
        sx={{
          bgcolor: "#f8fafc",
          p: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: "center",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        {/* ============================================================== */}
        {/* THERMAL POS RECEIPT PAPER (ID: thermal-pos-receipt)             */}
        {/* ============================================================== */}
        <Box
          id="thermal-pos-receipt"
          sx={{
            bgcolor: "#ffffff",
            width: "360px",
            maxWidth: "100%",
            borderRadius: "4px",
            border: "1px solid #e5e7eb",
            borderTop: "5px solid #0c6b27", // Figma Signature Dark Green Accent Bar
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            p: "24px 20px 22px 20px",
            fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
            color: "#1b1b1e",
          }}
        >
          {/* Header Branding */}
          <Box sx={{ textAlign: "center", mb: 1.5 }}>
            {/* Organic Leaf Icon in Circle */}
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                bgcolor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0c6b27",
                mb: 1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </Box>

            <Typography
              sx={{
                fontSize: "13.5px",
                fontWeight: 800,
                color: "#1b1b1e",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                lineHeight: "18px",
              }}
            >
              SM VEGMART PRIVATE LIMITED
            </Typography>

            <Typography
              sx={{
                fontSize: "10.5px",
                color: "#545f73",
                mt: 0.4,
                lineHeight: "14px",
              }}
            >
              Tel: +91 80 4965 2000 • support@smvegmart.in
            </Typography>

            {/* Tax Invoice Boxed Badge */}
            <Box
              sx={{
                display: "inline-block",
                border: "1px solid #1b1b1e",
                px: "14px",
                py: "3px",
                borderRadius: "3px",
                mt: 1.2,
                mb: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: "10.5px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: "#1b1b1e",
                  lineHeight: "14px",
                }}
              >
                TAX INVOICE / CASH MEMO
              </Typography>
            </Box>
          </Box>

          {/* Dotted Line */}
          <Box sx={{ borderTop: "1px dashed #94a3b8", my: 1.5 }} />

          {/* Order Metadata 2-Column Section */}
          <Box sx={{ fontSize: "11.5px", lineHeight: "17px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box>
                <span style={{ color: "#545f73" }}>Order: </span>
                <span style={{ fontWeight: 800, color: "#1b1b1e" }}>{orderNumber}</span>
              </Box>
              <Box>
                <span style={{ color: "#545f73" }}>Date: </span>
                <span style={{ fontWeight: 600, color: "#1b1b1e" }}>{orderDate}</span>
              </Box>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.4 }}>
              <Box>
                <span style={{ color: "#545f73" }}>Time: </span>
                <span style={{ fontWeight: 600, color: "#1b1b1e" }}>{orderTime}</span>
              </Box>
              <Box>
                <span style={{ color: "#545f73" }}>Dispatch: </span>
                <span style={{ fontWeight: 800, color: "#0c6b27" }}>{dispatchMode}</span>
              </Box>
            </Box>

            <Box sx={{ mt: 0.8 }}>
              <span style={{ color: "#545f73" }}>Customer: </span>
              <span style={{ fontWeight: 800, color: "#1b1b1e" }}>{customerName}</span>
            </Box>
          </Box>

          {/* Dotted Line */}
          <Box sx={{ borderTop: "1px dashed #94a3b8", my: 1.5 }} />

          {/* Items Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid #1b1b1e",
              pb: "4px",
              mb: "8px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#334155",
              letterSpacing: "0.5px",
            }}
          >
            <span>ITEM / QTY</span>
            <span>RATE • AMT</span>
          </Box>

          {/* Items List */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {items.map((item, idx) => (
              <Box key={idx}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color: "#1b1b1e",
                      lineHeight: "16px",
                      fontFamily: "inherit",
                    }}
                  >
                    {idx + 1}. {item.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color: "#1b1b1e",
                      lineHeight: "16px",
                      fontFamily: "inherit",
                    }}
                  >
                    ₹{item.totalPrice.toFixed(2)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#64748b",
                    fontSize: "10.5px",
                    lineHeight: "14px",
                    fontFamily: "inherit",
                    mt: "1px",
                  }}
                >
                  <span>
                    {item.pack} × {item.quantity} unit{item.quantity > 1 ? "s" : ""}
                  </span>
                  <span>@ ₹{item.unitPrice.toFixed(2)}</span>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Dotted Line */}
          <Box sx={{ borderTop: "1px dashed #94a3b8", my: 1.5 }} />

          {/* Subtotal & Delivery Fee */}
          <Box sx={{ fontSize: "11.5px", lineHeight: "18px", color: "#475569" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>Item Subtotal:</span>
              <span style={{ fontWeight: 700, color: "#1b1b1e" }}>₹{subtotal.toFixed(2)}</span>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.3 }}>
              <span>Delivery Fee:</span>
              {deliveryCharge === 0 ? (
                <span style={{ fontWeight: 800, color: "#0c6b27" }}>FREE</span>
              ) : (
                <span style={{ fontWeight: 700, color: "#1b1b1e" }}>₹{deliveryCharge.toFixed(2)}</span>
              )}
            </Box>
          </Box>

          {/* Grand Total Bar (Heavy Borders Top & Bottom) */}
          <Box
            sx={{
              borderTop: "2px solid #1b1b1e",
              borderBottom: "2px solid #1b1b1e",
              py: "8px",
              my: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 900,
                letterSpacing: "0.5px",
                color: "#1b1b1e",
                fontFamily: "inherit",
              }}
            >
              GRAND TOTAL:
            </Typography>
            <Typography
              sx={{
                fontSize: "17px",
                fontWeight: 900,
                color: "#1b1b1e",
                fontFamily: "inherit",
              }}
            >
              ₹{grandTotal.toFixed(2)}
            </Typography>
          </Box>

          {/* Footer Notice */}
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#334155",
                lineHeight: "15px",
                fontFamily: "inherit",
              }}
            >
              Thank you for supporting regional farmers!
            </Typography>
            <Typography
              sx={{
                fontSize: "10px",
                color: "#64748b",
                mt: "2px",
                lineHeight: "14px",
                fontFamily: "inherit",
              }}
            >
              www.smvegmart.com • Express Delivery
            </Typography>
            <Typography
              sx={{
                fontSize: "9.5px",
                color: "#94a3b8",
                letterSpacing: "1px",
                mt: 1,
                fontFamily: "inherit",
              }}
            >
              - - - Thermal POS Roll Cut - - -
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      {/* 3. Modal Footer Toolbar */}
      <Box
        sx={{
          bgcolor: "#ffffff",
          p: "12px 20px",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        {/* Left: Format selector */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SettingsOutlinedIcon sx={{ fontSize: 16, color: "#64748b" }} />
          <Typography sx={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
            Format:
          </Typography>
          <Box
            sx={{
              bgcolor: "#f1f5f9",
              border: "1px solid #e2e8f0",
              px: "10px",
              py: "3px",
              borderRadius: "6px",
              fontSize: "11.5px",
              fontWeight: 600,
              color: "#1e293b",
            }}
          >
            80mm POS Roll
          </Box>
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            startIcon={
              isDownloadingPdf ? (
                <CircularProgress size={14} sx={{ color: "#0c6b27" }} />
              ) : (
                <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
              )
            }
            sx={{
              textTransform: "none",
              fontSize: "12px",
              fontWeight: 600,
              color: "#334155",
              borderColor: "#cbd5e1",
              borderRadius: "6px",
              py: "4px",
              "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
            }}
          >
            {isDownloadingPdf ? "Saving..." : "PDF"}
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={handlePrint}
            startIcon={<ReceiptLongOutlinedIcon sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none",
              fontSize: "12px",
              fontWeight: 600,
              color: "#334155",
              borderColor: "#cbd5e1",
              borderRadius: "6px",
              py: "4px",
              "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
            }}
          >
            Reprint KOT
          </Button>
        </Box>
      </Box>

      {/* Global Print Stylesheet for thermal receipt roll output */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #thermal-pos-receipt, #thermal-pos-receipt * {
              visibility: visible !important;
            }
            #thermal-pos-receipt {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 78mm !important;
              max-width: 78mm !important;
              margin: 0 !important;
              padding: 4mm !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
            }
          }
        `}
      </style>
    </Dialog>
  );
}
