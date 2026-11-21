/**
 * Frontend Dashboard Export Utility
 * Handles exporting all live frontend dashboard data (including charts, KPI metrics,
 * top-selling products leaderboard, and the active dispatch queue table) directly
 * from the browser into a high-resolution PDF or beautifully styled corporate Excel spreadsheet.
 */

import dashboardAPI from "../services/dashboardAPI";

export async function exportDashboardToPdf({ period = "yearly", dashboardData = {}, activeOrders = [] }) {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const analyticsEl = document.getElementById("dashboard-analytics-section");
  const dispatchEl = document.getElementById("dashboard-dispatch-section");
  const fallbackEl = document.getElementById("dashboard-content");

  const periodLabelMap = {
    yearly: "Yearly (2024 - 2025)",
    monthly: "Monthly (November 2026)",
    today: "Today (Live)",
    yesterday: "Yesterday",
    this_week: "This Week",
    this_month: "This Month",
    last_month: "Last Month",
    this_year: "This Year",
  };
  const periodText = periodLabelMap[period] || String(period || "").toUpperCase();
  const timestampIST = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4", // 297mm x 210mm
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 12;
  const usableWidth = pageWidth - margin * 2; // 273mm

  // Helper to draw clean header on any PDF page
  const drawPageHeader = (pageTitle, subtext, pageNum, totalPages) => {
    // Top brand accent line
    pdf.setFillColor(12, 107, 39); // #0c6b27
    pdf.rect(0, 0, pageWidth, 4, "F");

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42); // #0f172a
    pdf.text("SM VEG MART", margin, 12);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139); // #64748b
    pdf.text("•  " + pageTitle, margin + 35, 12);

    // Right-side Period & Date info
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Period: ${periodText}   |   Generated: ${timestampIST}`, pageWidth - margin, 12, { align: "right" });

    // Header divider rule
    pdf.setDrawColor(226, 232, 240); // #e2e8f0
    pdf.setLineWidth(0.3);
    pdf.line(margin, 16, pageWidth - margin, 16);

    // Subtitle / section label
    if (subtext) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(12, 107, 39);
      pdf.text(subtext, margin, 21);
    }

    // Page footer
    pdf.setDrawColor(241, 245, 249);
    pdf.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      "SM Veg Mart Live ERP System  •  Confidential & Proprietary",
      margin,
      pageHeight - 4
    );
    pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 4, { align: "right" });
  };

  // 1. CAPTURE PAGE 1: Analytics Section (KPIs + Chart + Top Selling Products)
  const target1 = analyticsEl || fallbackEl || document.body;
  const canvas1 = await html2canvas(target1, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: 1400,
  });

  // Calculate scaling for Page 1
  let imgW1 = usableWidth;
  let imgH1 = (canvas1.height * imgW1) / canvas1.width;
  const maxContentH1 = pageHeight - 24 - 14;
  if (imgH1 > maxContentH1) {
    imgH1 = maxContentH1;
    imgW1 = (canvas1.width * imgH1) / canvas1.height;
  }
  const posX1 = margin + (usableWidth - imgW1) / 2;

  const totalPages = dispatchEl ? 2 : 1;
  drawPageHeader("EXECUTIVE DASHBOARD & VISUAL ANALYTICS", "OVERVIEW: FINANCIAL KPIS & REVENUE DISTRIBUTION", 1, totalPages);
  pdf.addImage(canvas1.toDataURL("image/png"), "PNG", posX1, 24, imgW1, imgH1);

  // 2. CAPTURE PAGE 2: Active Dispatch Queue Table
  if (dispatchEl) {
    pdf.addPage("a4", "landscape");

    const canvas2 = await html2canvas(dispatchEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 1400,
    });

    let imgW2 = usableWidth;
    let imgH2 = (canvas2.height * imgW2) / canvas2.width;
    const maxContentH2 = pageHeight - 24 - 14;
    if (imgH2 > maxContentH2) {
      imgH2 = maxContentH2;
      imgW2 = (canvas2.width * imgH2) / canvas2.height;
    }
    const posX2 = margin + (usableWidth - imgW2) / 2;

    drawPageHeader("ORDER FULFILLMENT & DISPATCH QUEUE", `ACTIVE DISPATCH MONITOR (${activeOrders.length} ORDERS DISPLAYED)`, 2, totalPages);
    pdf.addImage(canvas2.toDataURL("image/png"), "PNG", posX2, 24, imgW2, imgH2);
  }

  // Trigger download
  const dateFileStr = new Date().toISOString().slice(0, 10);
  pdf.save(`SM_VegMart_Dashboard_Report_${period}_${dateFileStr}.pdf`);
}

/**
 * Export live frontend data to a beautifully styled Excel (.xlsx) spreadsheet
 * matching the exact corporate VegMart green theme, bold headers, borders, and coloring.
 */
export async function exportDashboardToCsv({ period = "yearly", dashboardData = {}, activeOrders = [] }) {
  // First attempt: Call backend openpyxl Excel endpoint with live frontend payload
  try {
    const payload = {
      period,
      dashboardData,
      activeOrders,
    };
    const res = await dashboardAPI.exportReportPost(payload);
    if (res?.data) {
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `vegmart_dashboard_report_${period}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return;
    }
  } catch (err) {
    console.warn("Backend Excel export fallback to styled client-side spreadsheet:", err);
  }

  // Client-side fallback: Build rich styled HTML-based Excel spreadsheet with full colors
  const metrics = dashboardData.metrics || {};
  const revenueDist = dashboardData.revenue_distribution || [];
  const topProducts = dashboardData.top_selling_products || [];
  const timestampIST = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Dashboard Report</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; font-family: Calibri, sans-serif; }
        .title-banner { background-color: #1B5E20; color: #FFFFFF; font-size: 14pt; font-weight: bold; text-align: center; height: 36px; }
        .sub-banner { background-color: #E8F5E9; color: #1B5E20; font-size: 10pt; font-weight: bold; text-align: center; height: 24px; border-bottom: 1px solid #C8E6C9; }
        .section-header { background-color: #2E7D32; color: #FFFFFF; font-size: 11pt; font-weight: bold; text-align: left; padding: 6px 12px; height: 28px; }
        .table-header { background-color: #388E3C; color: #FFFFFF; font-size: 10pt; font-weight: bold; text-align: center; border: 1px solid #D1D5DB; padding: 6px 8px; }
        .cell-even { background-color: #F8FAF8; font-size: 10pt; color: #1F2937; border: 1px solid #D1D5DB; padding: 5px 8px; }
        .cell-odd { background-color: #FFFFFF; font-size: 10pt; color: #1F2937; border: 1px solid #D1D5DB; padding: 5px 8px; }
        .cell-bold { font-weight: bold; }
        .cell-center { text-align: center; }
        .cell-right { text-align: right; }
        .cell-highlight { background-color: #FFF8E1; font-weight: bold; border: 1px solid #FFE082; }
        .badge-waiting { background-color: #EFF6FF; color: #1D4ED8; font-weight: bold; text-align: center; border: 1px solid #BFDBFE; border-radius: 4px; padding: 2px 6px; }
        .badge-dispatch { background-color: #FFFBEB; color: #B45309; font-weight: bold; text-align: center; border: 1px solid #FDE68A; border-radius: 4px; padding: 2px 6px; }
        .badge-delivered { background-color: #ECFDF5; color: #0C6B27; font-weight: bold; text-align: center; border: 1px solid #A7F3D0; border-radius: 4px; padding: 2px 6px; }
        .spacer { height: 14px; }
      </style>
    </head>
    <body>
      <table>
        <!-- 1. Header Banner -->
        <tr>
          <td colspan="7" class="title-banner">=== VEGMART ADMIN DASHBOARD REPORT ===</td>
        </tr>
        <tr>
          <td colspan="7" class="sub-banner">Period: ${String(period).toUpperCase()} &nbsp;&nbsp;|&nbsp;&nbsp; Generated At: ${timestampIST}</td>
        </tr>
        <tr class="spacer"><td colspan="7"></td></tr>

        <!-- 2. KPIs -->
        <tr>
          <td colspan="7" class="section-header">&nbsp;&nbsp;--- KEY PERFORMANCE INDICATORS ---</td>
        </tr>
        <tr>
          <th class="table-header" style="width: 200px;">Metric</th>
          <th class="table-header" style="width: 150px;">Value</th>
          <th class="table-header" style="width: 150px;">Growth / Delta</th>
          <th colspan="4" class="table-header">Operational Note</th>
        </tr>
        <tr>
          <td class="cell-even cell-bold">Total Products</td>
          <td class="cell-even cell-center cell-bold">${metrics.total_products !== undefined ? metrics.total_products : 99}</td>
          <td class="cell-even cell-center" style="color: #16A34A; font-weight: bold;">${metrics.products_delta || "+0"}</td>
          <td colspan="4" class="cell-even">Active catalog items</td>
        </tr>
        <tr>
          <td class="cell-odd cell-bold">Total Revenue (INR)</td>
          <td class="cell-odd cell-center cell-bold">Rs.${metrics.total_revenue !== undefined ? metrics.total_revenue : 0}</td>
          <td class="cell-odd cell-center" style="color: #16A34A; font-weight: bold;">${metrics.revenue_delta || "0.0%"}</td>
          <td colspan="4" class="cell-odd">Gross sales revenue</td>
        </tr>
        <tr>
          <td class="cell-even cell-bold">Total Orders</td>
          <td class="cell-even cell-center cell-bold">${metrics.total_orders !== undefined ? metrics.total_orders : 0}</td>
          <td class="cell-even cell-center" style="color: #16A34A; font-weight: bold;">${metrics.orders_delta || "0.0%"}</td>
          <td colspan="4" class="cell-even">Completed orders</td>
        </tr>
        <tr>
          <td class="cell-odd cell-bold">New Orders (Dispatch Needed)</td>
          <td class="cell-odd cell-center cell-bold">${metrics.new_orders !== undefined ? metrics.new_orders : activeOrders.length}</td>
          <td class="cell-odd cell-center" style="color: #2563EB; font-weight: bold;">Active</td>
          <td colspan="4" class="cell-odd">Orders currently awaiting fulfillment in queue</td>
        </tr>
        <tr class="spacer"><td colspan="7"></td></tr>

        <!-- 3. Revenue Distribution -->
        <tr>
          <td colspan="5" class="section-header">&nbsp;&nbsp;--- REVENUE DISTRIBUTION (LAKHS) ---</td>
        </tr>
        <tr>
          <th class="table-header">Month</th>
          <th class="table-header">Vegetables &amp; Greens</th>
          <th class="table-header">Exotics &amp; Hydroponics</th>
          <th class="table-header">Fruits &amp; Staples</th>
          <th class="table-header">Total (INR)</th>
        </tr>
  `;

  revenueDist.forEach((m, idx) => {
    const veg = Number(m.vegetables || 0);
    const exo = Number(m.exotics || 0);
    const fru = Number(m.fruits || 0);
    const tot = m.total !== undefined ? Number(m.total) : veg + exo + fru;
    const mName = String(m.month || m.period || "-");
    const isHighlight = mName.includes("★") || tot > 500;
    const rowClass = isHighlight ? "cell-highlight" : idx % 2 === 0 ? "cell-even" : "cell-odd";

    html += `
      <tr>
        <td class="${rowClass} cell-center cell-bold">${mName}</td>
        <td class="${rowClass} cell-right">Rs.${veg}</td>
        <td class="${rowClass} cell-right">Rs.${exo}</td>
        <td class="${rowClass} cell-right">Rs.${fru}</td>
        <td class="${rowClass} cell-right cell-bold">Rs.${tot}</td>
      </tr>
    `;
  });

  html += `
        <tr class="spacer"><td colspan="7"></td></tr>

        <!-- 4. Top Selling Products -->
        <tr>
          <td colspan="3" class="section-header">&nbsp;&nbsp;--- TOP SELLING PRODUCTS ---</td>
        </tr>
        <tr>
          <th class="table-header" style="width: 250px;">Product Name</th>
          <th class="table-header" style="width: 200px;">Subtitle / Qty</th>
          <th class="table-header" style="width: 150px;">Revenue (INR)</th>
        </tr>
  `;

  topProducts.forEach((p, idx) => {
    const rowClass = idx % 2 === 0 ? "cell-even" : "cell-odd";
    const sub = p.subtitle || (p.sales ? `${p.sales} sold` : p.category || "-");
    const rev = p.revenue !== undefined ? p.revenue : p.total_revenue || 0;
    html += `
      <tr>
        <td class="${rowClass} cell-bold">${p.name || p.title || "-"}</td>
        <td class="${rowClass}">${sub}</td>
        <td class="${rowClass} cell-right cell-bold">Rs.${rev}</td>
      </tr>
    `;
  });

  html += `
        <tr class="spacer"><td colspan="7"></td></tr>

        <!-- 5. Active Dispatch Queue -->
        <tr>
          <td colspan="7" class="section-header">&nbsp;&nbsp;--- ACTIVE DISPATCH QUEUE ---</td>
        </tr>
        <tr>
          <th class="table-header">Order ID</th>
          <th class="table-header">Customer Name</th>
          <th class="table-header">Hub Zone</th>
          <th class="table-header">Phone</th>
          <th class="table-header">Delivery Mode</th>
          <th class="table-header">Amount (INR)</th>
          <th class="table-header">Status</th>
        </tr>
  `;

  activeOrders.forEach((o, idx) => {
    const rowClass = idx % 2 === 0 ? "cell-even" : "cell-odd";
    const cust = o.customer || {};
    const orderId = o.order_number || o.order_id || (o.id ? `SMV-${o.id}` : "-");
    const custName = o.customer_name || cust.name || "Customer";
    const hubZone = o.customer_hub_zone || o.full_address || cust.address || "Local Zone";
    const phone = o.phone || cust.phone || "-";
    const mode = o.delivery_mode || o.delivery_badge || "Express 25-Min";
    const amt = o.amount !== undefined ? o.amount : o.total_amount ? Number(o.total_amount) : 0;
    const rawStatus = String(o.status || "waiting").toLowerCase();

    let badgeClass = "badge-waiting";
    if (rawStatus.includes("dispatch") || rawStatus.includes("ready")) {
      badgeClass = "badge-dispatch";
    } else if (rawStatus.includes("delivered") || rawStatus.includes("done")) {
      badgeClass = "badge-delivered";
    }

    html += `
      <tr>
        <td class="${rowClass} cell-center cell-bold">${orderId}</td>
        <td class="${rowClass}">${custName}</td>
        <td class="${rowClass}">${hubZone}</td>
        <td class="${rowClass} cell-center">${phone}</td>
        <td class="${rowClass} cell-center">${mode}</td>
        <td class="${rowClass} cell-right cell-bold">Rs.${Number(amt).toFixed(2)}</td>
        <td class="${rowClass} cell-center"><span class="${badgeClass}">&nbsp;${o.status || "waiting"}&nbsp;</span></td>
      </tr>
    `;
  });

  html += `
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF" + html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `vegmart_dashboard_report_${period}.xls`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
