import io
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from django.http import HttpResponse
from django.utils import timezone


def build_styled_excel_response(filename: str, sheet_title: str, headers: list, rows: list) -> HttpResponse:
    """
    Builds a beautifully styled Microsoft Excel (.xlsx) response:
    - Primary VegMart green header with bold white text
    - Centered alignments for all table cells
    - Auto-fitted column widths ensuring full visibility for all text & Tamil characters
    - Clean border and subtle alternating row fills
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = sheet_title[:31]  # Sheet name max length in Excel

    # Append Header
    ws.append(headers)

    # Append Data Rows
    for r in rows:
        ws.append(r)

    # Header styling: VegMart Green, bold white text, centered
    header_fill = PatternFill(start_color="1B5E20", end_color="1B5E20", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # Borders
    thin_side = Side(style='thin', color='D1D5DB')
    border_style = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

    # Data row styling
    row_fill_even = PatternFill(start_color="F8FAF8", end_color="F8FAF8", fill_type="solid")
    row_fill_odd = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
    data_font = Font(name="Calibri", size=10, color="1F2937")

    # Header row height & style
    ws.row_dimensions[1].height = 28
    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = border_style

    # Data rows style
    for row_idx, row in enumerate(ws.iter_rows(min_row=2), start=2):
        ws.row_dimensions[row_idx].height = 22
        fill = row_fill_even if (row_idx % 2 == 0) else row_fill_odd
        for cell in row:
            cell.font = data_font
            cell.alignment = center_align
            cell.border = border_style
            cell.fill = fill

    # Auto-adjust column widths so every column is fully visible
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val = str(cell.value or '')
            visual_len = 0
            for ch in val:
                # Tamil & Unicode characters occupy 2 visual character slots
                visual_len += 2 if ord(ch) > 127 else 1
            if visual_len > max_len:
                max_len = visual_len
        # Ensure column width accommodates header + text + margin
        ws.column_dimensions[col_letter].width = max(max_len + 4, 14)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    if not filename.endswith('.xlsx'):
        filename = f"{filename}.xlsx"

    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def build_styled_dashboard_excel_response(period: str, data: dict, filename: str = None) -> HttpResponse:
    """
    Builds a beautifully styled Microsoft Excel (.xlsx) workbook for the VegMart Dashboard:
    - Corporate VegMart Dark Green banners (#1B5E20)
    - Sub-headers in mint (#E8F5E9) with bold text
    - Color-coded Section Headers and sub-tables
    - Status pills with background highlights (waiting in blue, ready in amber, delivered in green)
    - Auto-fitted columns for clear readability and Tamil font support
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"Dashboard_{str(period or 'report').upper()[:10]}"

    # Color definitions matching VegMart Corporate Design
    color_brand_dark = "1B5E20"    # Primary VegMart Dark Green
    color_sec_dark = "2E7D32"      # Medium Dark Green for Section Banners
    color_tbl_head = "388E3C"      # Table Headers Green
    color_mint = "E8F5E9"          # Soft Mint Background
    color_border = "D1D5DB"        # Light Slate Border
    color_even = "F8FAF8"          # Alternating Row Even
    color_white = "FFFFFF"         # White

    # Styles
    title_fill = PatternFill(start_color=color_brand_dark, end_color=color_brand_dark, fill_type="solid")
    title_font = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
    
    sub_fill = PatternFill(start_color=color_mint, end_color=color_mint, fill_type="solid")
    sub_font = Font(name="Calibri", size=10, bold=True, color="1B5E20")

    sec_fill = PatternFill(start_color=color_sec_dark, end_color=color_sec_dark, fill_type="solid")
    sec_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")

    tbl_head_fill = PatternFill(start_color=color_tbl_head, end_color=color_tbl_head, fill_type="solid")
    tbl_head_font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")

    row_fill_even = PatternFill(start_color=color_even, end_color=color_even, fill_type="solid")
    row_fill_odd = PatternFill(start_color=color_white, end_color=color_white, fill_type="solid")

    data_font = Font(name="Calibri", size=10, color="1F2937")
    data_font_bold = Font(name="Calibri", size=10, bold=True, color="1F2937")

    center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left_align = Alignment(horizontal="left", vertical="center", wrap_text=True)
    right_align = Alignment(horizontal="right", vertical="center")

    thin_side = Side(style='thin', color=color_border)
    border_style = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

    # Status fills and fonts
    status_styles = {
        "waiting": {
            "fill": PatternFill(start_color="EFF6FF", end_color="EFF6FF", fill_type="solid"),
            "font": Font(name="Calibri", size=10, bold=True, color="1D4ED8"),
        },
        "ready for dispatch": {
            "fill": PatternFill(start_color="FFFBEB", end_color="FFFBEB", fill_type="solid"),
            "font": Font(name="Calibri", size=10, bold=True, color="B45309"),
        },
        "dispatch": {
            "fill": PatternFill(start_color="FFFBEB", end_color="FFFBEB", fill_type="solid"),
            "font": Font(name="Calibri", size=10, bold=True, color="B45309"),
        },
        "delivered": {
            "fill": PatternFill(start_color="ECFDF5", end_color="ECFDF5", fill_type="solid"),
            "font": Font(name="Calibri", size=10, bold=True, color="0C6B27"),
        },
        "out for delivery": {
            "fill": PatternFill(start_color="ECFDF5", end_color="ECFDF5", fill_type="solid"),
            "font": Font(name="Calibri", size=10, bold=True, color="0C6B27"),
        },
    }

    timestamp_ist = timezone.localtime(timezone.now()).strftime("%d %b %Y, %I:%M %p")

    current_row = 1

    # -------------------------------------------------------------
    # 1. Main Title Banner
    # -------------------------------------------------------------
    ws.row_dimensions[current_row].height = 32
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=7)
    for col_idx in range(1, 8):
        c = ws.cell(row=current_row, column=col_idx)
        c.fill = title_fill
        c.font = title_font
        c.alignment = center_align
    ws.cell(row=current_row, column=1).value = "=== VEGMART ADMIN DASHBOARD REPORT ==="

    current_row += 1
    ws.row_dimensions[current_row].height = 22
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=7)
    for col_idx in range(1, 8):
        c = ws.cell(row=current_row, column=col_idx)
        c.fill = sub_fill
        c.font = sub_font
        c.alignment = center_align
    ws.cell(row=current_row, column=1).value = f"Period: {str(period).upper()}   |   Generated At: {timestamp_ist}"

    current_row += 2  # Spacer

    # -------------------------------------------------------------
    # 2. Key Performance Indicators Section
    # -------------------------------------------------------------
    ws.row_dimensions[current_row].height = 25
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=7)
    for col_idx in range(1, 8):
        c = ws.cell(row=current_row, column=col_idx)
        c.fill = sec_fill
        c.font = sec_font
        c.alignment = left_align
    ws.cell(row=current_row, column=1).value = "  --- KEY PERFORMANCE INDICATORS ---"

    current_row += 1
    kpi_headers = ["Metric", "Value", "Growth / Delta"]
    ws.row_dimensions[current_row].height = 22
    for col_idx, h in enumerate(kpi_headers, start=1):
        c = ws.cell(row=current_row, column=col_idx, value=h)
        c.fill = tbl_head_fill
        c.font = tbl_head_font
        c.alignment = center_align
        c.border = border_style

    metrics = data.get("metrics") or {}
    kpi_rows = [
        ["Total Products", metrics.get("total_products", 99), metrics.get("products_delta", "+0")],
        ["Total Revenue (INR)", f"Rs.{metrics.get('total_revenue', 0)}", metrics.get("revenue_delta", "0.0%")],
        ["Total Orders", metrics.get("total_orders", 0), metrics.get("orders_delta", "0.0%")],
        ["New Orders (Dispatch Needed)", metrics.get("new_orders", 0), "Live Active Orders"],
    ]
    for r_idx, r in enumerate(kpi_rows):
        current_row += 1
        ws.row_dimensions[current_row].height = 20
        fill = row_fill_even if (r_idx % 2 == 0) else row_fill_odd
        for col_idx, val in enumerate(r, start=1):
            c = ws.cell(row=current_row, column=col_idx, value=val)
            c.fill = fill
            c.font = data_font_bold if col_idx == 2 else data_font
            c.alignment = center_align if col_idx != 1 else left_align
            c.border = border_style

    current_row += 2  # Spacer

    # -------------------------------------------------------------
    # 3. Revenue Distribution Section
    # -------------------------------------------------------------
    ws.row_dimensions[current_row].height = 25
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=5)
    for col_idx in range(1, 6):
        c = ws.cell(row=current_row, column=col_idx)
        c.fill = sec_fill
        c.font = sec_font
        c.alignment = left_align
    ws.cell(row=current_row, column=1).value = "  --- REVENUE DISTRIBUTION (LAKHS) ---"

    current_row += 1
    rev_headers = ["Month", "Vegetables & Greens", "Exotics & Hydroponics", "Fruits & Staples", "Total"]
    ws.row_dimensions[current_row].height = 22
    for col_idx, h in enumerate(rev_headers, start=1):
        c = ws.cell(row=current_row, column=col_idx, value=h)
        c.fill = tbl_head_fill
        c.font = tbl_head_font
        c.alignment = center_align
        c.border = border_style

    revenue_list = data.get("revenue_distribution") or []
    for r_idx, m in enumerate(revenue_list):
        current_row += 1
        ws.row_dimensions[current_row].height = 20
        veg = m.get("vegetables", 0)
        exo = m.get("exotics", 0)
        fru = m.get("fruits", 0)
        tot = m.get("total", (veg + exo + fru))
        month_name = str(m.get("month") or "-")
        is_highlight = "★" in month_name or tot > 500

        fill = PatternFill(start_color="FFF8E1", end_color="FFF8E1", fill_type="solid") if is_highlight else (row_fill_even if (r_idx % 2 == 0) else row_fill_odd)
        
        row_vals = [month_name, veg, exo, fru, tot]
        for col_idx, val in enumerate(row_vals, start=1):
            c = ws.cell(row=current_row, column=col_idx, value=val)
            c.fill = fill
            c.font = data_font_bold if is_highlight or col_idx == 5 else data_font
            c.alignment = center_align if col_idx == 1 else right_align
            c.border = border_style

    current_row += 2  # Spacer

    # -------------------------------------------------------------
    # 4. Top-Selling Products Section
    # -------------------------------------------------------------
    ws.row_dimensions[current_row].height = 25
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=3)
    for col_idx in range(1, 4):
        c = ws.cell(row=current_row, column=col_idx)
        c.fill = sec_fill
        c.font = sec_font
        c.alignment = left_align
    ws.cell(row=current_row, column=1).value = "  --- TOP SELLING PRODUCTS ---"

    current_row += 1
    prod_headers = ["Product Name", "Subtitle / Qty", "Revenue (INR)"]
    ws.row_dimensions[current_row].height = 22
    for col_idx, h in enumerate(prod_headers, start=1):
        c = ws.cell(row=current_row, column=col_idx, value=h)
        c.fill = tbl_head_fill
        c.font = tbl_head_font
        c.alignment = center_align
        c.border = border_style

    top_products = data.get("top_selling_products") or []
    for r_idx, p in enumerate(top_products):
        current_row += 1
        ws.row_dimensions[current_row].height = 20
        fill = row_fill_even if (r_idx % 2 == 0) else row_fill_odd
        p_name = p.get("name") or "-"
        p_sub = p.get("subtitle") or (f"{p.get('sales')} sold" if p.get('sales') else "-")
        p_rev = p.get("revenue", 0)

        row_vals = [p_name, p_sub, f"Rs.{p_rev}"]
        for col_idx, val in enumerate(row_vals, start=1):
            c = ws.cell(row=current_row, column=col_idx, value=val)
            c.fill = fill
            c.font = data_font_bold if col_idx == 3 else data_font
            c.alignment = left_align if col_idx != 3 else right_align
            c.border = border_style

    current_row += 2  # Spacer

    # -------------------------------------------------------------
    # 5. Active Dispatch Queue Section
    # -------------------------------------------------------------
    ws.row_dimensions[current_row].height = 25
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=7)
    for col_idx in range(1, 8):
        c = ws.cell(row=current_row, column=col_idx)
        c.fill = sec_fill
        c.font = sec_font
        c.alignment = left_align
    ws.cell(row=current_row, column=1).value = "  --- ACTIVE DISPATCH QUEUE ---"

    current_row += 1
    queue_headers = ["Order ID", "Customer Name", "Hub Zone", "Phone", "Delivery Mode", "Amount (INR)", "Status"]
    ws.row_dimensions[current_row].height = 22
    for col_idx, h in enumerate(queue_headers, start=1):
        c = ws.cell(row=current_row, column=col_idx, value=h)
        c.fill = tbl_head_fill
        c.font = tbl_head_font
        c.alignment = center_align
        c.border = border_style

    dispatch_queue = data.get("active_dispatch_queue") or []
    for r_idx, o in enumerate(dispatch_queue):
        current_row += 1
        ws.row_dimensions[current_row].height = 22
        fill = row_fill_even if (r_idx % 2 == 0) else row_fill_odd

        oid = o.get("order_number") or o.get("order_id") or f"SMV-{o.get('id', '')}"
        cust = o.get("customer_name") or (o.get("customer", {}).get("name") if isinstance(o.get("customer"), dict) else "Customer")
        hub = o.get("customer_hub_zone") or o.get("full_address") or "-"
        phone = o.get("phone") or (o.get("customer", {}).get("phone") if isinstance(o.get("customer"), dict) else "-")
        mode = o.get("delivery_mode") or o.get("delivery_badge") or "Express 25-Min"
        amt = f"Rs.{float(o.get('amount') or 0.0):.2f}"
        raw_status = str(o.get("status") or "waiting").strip().lower()

        row_vals = [oid, cust, hub, phone, mode, amt, o.get("status") or "waiting"]
        for col_idx, val in enumerate(row_vals, start=1):
            c = ws.cell(row=current_row, column=col_idx, value=val)
            c.border = border_style
            if col_idx == 7:
                # Colorize the status pill
                matched_style = None
                for k, v in status_styles.items():
                    if k in raw_status:
                        matched_style = v
                        break
                if matched_style:
                    c.fill = matched_style["fill"]
                    c.font = matched_style["font"]
                else:
                    c.fill = fill
                    c.font = data_font_bold
                c.alignment = center_align
            else:
                c.fill = fill
                c.font = data_font_bold if col_idx in [1, 6] else data_font
                c.alignment = center_align if col_idx in [1, 4, 5] else (right_align if col_idx == 6 else left_align)

    # Auto-adjust column widths across all columns A to G
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val = str(cell.value or '')
            visual_len = 0
            for ch in val:
                visual_len += 2 if ord(ch) > 127 else 1
            if visual_len > max_len:
                max_len = visual_len
        ws.column_dimensions[col_letter].width = max(max_len + 4, 15)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    clean_filename = filename or f"vegmart_dashboard_report_{period}.xlsx"
    if not clean_filename.endswith('.xlsx'):
        clean_filename = f"{clean_filename}.xlsx"

    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="{clean_filename}"'
    return response
