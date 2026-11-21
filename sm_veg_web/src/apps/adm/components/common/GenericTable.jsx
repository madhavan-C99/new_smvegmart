import React from "react";
import {
  Paper,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  Box,
  Collapse,
  Checkbox,
  Skeleton,
  IconButton,
  Popover,
  FormControlLabel,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

const GenericTable = ({
  columns = [],
  rows = [],
  loading = false,
  emptyMessage = "No items found",
  emptySubMessage = "",
  minWidth = 900,
  maxHeight = "min(580px, calc(100vh - 300px))",
  sx = {},
  getRowStyle,
  onRowClick,
  getRowId = (row, index) => (row && row.id !== undefined && row.id !== null ? row.id : index),
  expandedRowId = null,
  renderExpandedRow,
  selectable = false,
  onSelectionChange,
  enableColumnSettings = false,
  serverSide = false,
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  pagination = true,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  headerBgColor = "#f4f4f0",
}) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [selected, setSelected] = React.useState([]);
  const [settingsAnchorEl, setSettingsAnchorEl] = React.useState(null);
  const [hiddenFields, setHiddenFields] = React.useState([]);

  const rowRefs = React.useRef({});
  const containerRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  const isServer = Boolean(serverSide);
  const isControlled = controlledPage !== undefined;
  const activeRowsPerPage =
    controlledRowsPerPage !== undefined ? controlledRowsPerPage : rowsPerPage;
  const totalRowsCount =
    isServer && totalCount !== undefined ? totalCount : rows.length;
  const maxPage = Math.max(
    0,
    Math.ceil(totalRowsCount / (activeRowsPerPage || 1)) - 1
  );

  const rawPage = isControlled ? controlledPage : page;
  const paginationPage = Math.min(Math.max(0, rawPage), maxPage);

  if (!isControlled && page > maxPage) {
    setPage(0);
  }

  const displayRows = !pagination
    ? rows
    : isServer
    ? rows
    : rows.slice(
        paginationPage * activeRowsPerPage,
        paginationPage * activeRowsPerPage + activeRowsPerPage
      );

  const handleChangePage = (event, newPage) => {
    if (onPageChange) {
      onPageChange(event, newPage);
    }
    if (!isControlled) {
      setPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRpp = parseInt(event.target.value, 10);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(event);
    }
    if (controlledRowsPerPage === undefined) {
      setRowsPerPage(newRpp);
      if (!isControlled) {
        setPage(0);
      }
    }
  };

  const allSelected = rows.length > 0 && selected.length === rows.length;

  const toggleAll = () => {
    const next = allSelected
      ? []
      : rows.map((row, index) => getRowId(row, index));
    setSelected(next);
    onSelectionChange?.(next);
  };

  const toggleOne = (rowId) => {
    const next = selected.includes(rowId)
      ? selected.filter((id) => id !== rowId)
      : [...selected, rowId];
    setSelected(next);
    onSelectionChange?.(next);
  };

  // COLUMN VISIBILITY LOGIC
  const toggleableColumns = columns.filter((c) => c.hideable !== false);
  const visibleColumns = columns.filter((c) => !hiddenFields.includes(c.field));

  const handleSettingsOpen = (event) =>
    setSettingsAnchorEl(event.currentTarget);
  const handleSettingsClose = () => setSettingsAnchorEl(null);
  const settingsOpen = Boolean(settingsAnchorEl);

  const toggleFieldVisibility = (field) => {
    setHiddenFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const totalColSpan =
    visibleColumns.length +
    (selectable ? 1 : 0) +
    (enableColumnSettings ? 1 : 0);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const CHECKBOX_W = 42;
  const stickyLeftMap = {};
  let stickyAcc = selectable ? CHECKBOX_W : 0;
  visibleColumns.forEach((c) => {
    if (c.sticky) {
      stickyLeftMap[c.field] = stickyAcc;
      stickyAcc += c.stickyWidth || 70;
    }
  });

  const getStickyStyle = (column, isHeader, row) =>
    column.sticky
      ? {
          position: "sticky",
          left: stickyLeftMap[column.field],
          top: isHeader ? 0 : undefined,
          zIndex: isHeader ? 4 : 1,
          width: column.stickyWidth || 70,
          minWidth: column.stickyWidth || 70,
          backgroundColor: isHeader
            ? headerBgColor
            : (row && getRowStyle?.(row)?.backgroundColor) || "#fff",
        }
      : isHeader
      ? {
          position: "sticky",
          top: 0,
          zIndex: 2,
          backgroundColor: headerBgColor,
        }
      : {};

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        border: "1px solid #eae7eb",
        borderRadius: "12px",
        background: "#fff",
        boxShadow: "0px 1px 2px rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: "column",
        ...sx,
      }}
    >
      <TableContainer
        ref={containerRef}
        sx={{
          width: "100%",
          maxHeight: maxHeight,
          overflowX: "auto",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f4f4f0",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#c5c5c0",
            borderRadius: "4px",
            border: "2px solid #f4f4f0",
            "&:hover": {
              backgroundColor: "#9e9e99",
            },
          },
          scrollbarWidth: "thin",
          scrollbarColor: "#c5c5c0 #f4f4f0",
        }}
      >
        <MuiTable
          stickyHeader
          sx={{
            minWidth,
            width: "100%",
            borderCollapse: "collapse",
            "& th": {
              borderRadius: 0,
              whiteSpace: "nowrap",
              borderBottom: "none",
            },
            "& td": {
              borderRadius: 0,
            },
          }}
        >
          {/* TABLE HEAD */}
          <TableHead sx={{ backgroundColor: headerBgColor, height: "42px" }}>
            <TableRow sx={{ backgroundColor: headerBgColor, height: "42px" }}>
              {selectable && (
                <TableCell
                  padding="checkbox"
                  sx={{
                    backgroundColor: headerBgColor,
                    borderBottom: "1px solid #e7e5e0",
                    height: "42px",
                    opacity: 1,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={selected.length > 0 && !allSelected}
                    onChange={toggleAll}
                  />
                </TableCell>
              )}
              {visibleColumns.map((column, index) => (
                <TableCell
                  key={column.field || index}
                  align={column.align || "left"}
                  sx={{
                    backgroundColor: headerBgColor,
                    color: "#40493e",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: "11px",
                    lineHeight: "14px",
                    letterSpacing: "0.55px",
                    textTransform: "uppercase",
                    textAlign: column.align || "left",
                    height: "42px",
                    py: "10px",
                    px: 2,
                    opacity: 1,
                    minWidth: column.minWidth || "auto",
                    borderBottom: "1px solid #e7e5e0",
                    borderRight: "none",
                    ...getStickyStyle(column, true),
                  }}
                >
                  {column.headerName}
                </TableCell>
              ))}

              {/* COLUMN SETTINGS GEAR ICON */}
              {enableColumnSettings && (
                <TableCell
                  align="center"
                  sx={{
                    backgroundColor: headerBgColor,
                    borderBottom: "none",
                    width: 48,
                    position: "sticky",
                    right: 0,
                  }}
                >
                  <IconButton size="small" onClick={handleSettingsOpen}>
                    <SettingsIcon fontSize="small" sx={{ color: "#555" }} />
                  </IconButton>

                  <Popover
                    open={settingsOpen}
                    anchorEl={settingsAnchorEl}
                    onClose={handleSettingsClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                  >
                    <Box sx={{ p: 1.5, minWidth: 200 }}>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#333",
                          mb: 0.5,
                          px: 0.5,
                        }}
                      >
                        Show / Hide Columns
                      </Typography>
                      {toggleableColumns.map((column) => (
                        <FormControlLabel
                          key={column.field}
                          sx={{ display: "flex", ml: 0, mr: 0 }}
                          control={
                            <Checkbox
                              size="small"
                              checked={!hiddenFields.includes(column.field)}
                              onChange={() =>
                                toggleFieldVisibility(column.field)
                              }
                            />
                          }
                          label={
                            <Typography
                              sx={{ fontSize: "13px", color: "#444" }}
                            >
                              {column.headerName}
                            </Typography>
                          }
                        />
                      ))}
                    </Box>
                  </Popover>
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          {/* TABLE BODY */}
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, rIdx) => (
                <TableRow key={`skeleton-row-${rIdx}`}>
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Skeleton variant="rectangular" width={20} height={20} />
                    </TableCell>
                  )}
                  {visibleColumns.map((_, cIdx) => (
                    <TableCell
                      key={`skeleton-col-${cIdx}`}
                      align="center"
                      sx={{ py: 2 }}
                    >
                      <Skeleton
                        variant="text"
                        width="80%"
                        height={24}
                        sx={{ mx: "auto" }}
                      />
                    </TableCell>
                  ))}
                  {enableColumnSettings && <TableCell />}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={totalColSpan}
                  align="center"
                  sx={{
                    py: 7,
                    height: "260px",
                    borderBottom: "none",
                  }}
                >
                  <Box
                    sx={{
                      position: "sticky",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "max-content",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      mx: "auto",
                    }}
                  >
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        bgcolor: "#f1f5f9",
                        color: "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1.5,
                      }}
                    >
                      <Inventory2OutlinedIcon sx={{ fontSize: 26 }} />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "16px",
                        color: "#1e293b",
                        fontWeight: 700,
                        letterSpacing: "-0.2px",
                      }}
                    >
                      {emptyMessage}
                    </Typography>
                    {emptySubMessage ? (
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: "#64748b",
                          mt: 0.5,
                          maxWidth: "360px",
                        }}
                      >
                        {emptySubMessage}
                      </Typography>
                    ) : (
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: "#64748b",
                          mt: 0.5,
                        }}
                      >
                        No records to display at this moment.
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, rowIndex) => {
                const rowId = getRowId(row, rowIndex);
                const isExpanded =
                  renderExpandedRow &&
                  expandedRowId !== null &&
                  expandedRowId !== undefined &&
                  rowId === expandedRowId;

                const globalIndex = pagination
                  ? paginationPage * activeRowsPerPage + rowIndex
                  : rowIndex;

                return (
                  <React.Fragment key={rowId ?? rowIndex}>
                    <TableRow
                      ref={(el) => {
                        rowRefs.current[rowId] = el;
                      }}
                      onClick={() => onRowClick && onRowClick(row)}
                      sx={{
                        height: "77px",
                        cursor: onRowClick ? "pointer" : "default",
                        borderBottom: "1px solid #f1f3f5",
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": {
                          backgroundColor: "#F9FAFB",
                        },
                        ...(getRowStyle ? getRowStyle(row) : {}),
                      }}
                    >
                      {selectable && (
                        <TableCell
                          padding="checkbox"
                          sx={{
                            height: "77px",
                            opacity: 1,
                            borderBottom: isExpanded
                              ? "none"
                              : "1px solid #f1f3f5",
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={selected.includes(rowId)}
                            onChange={(event) => {
                              event.stopPropagation();
                              toggleOne(rowId);
                            }}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </TableCell>
                      )}
                      {visibleColumns.map((column, colIndex) => (
                        <TableCell
                          key={column.field || colIndex}
                          align={column.align || "left"}
                          sx={{
                            color: "#1b1b1e",
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 500,
                            fontSize: "13px",
                            lineHeight: "16px",
                            letterSpacing: "0px",
                            py: 1.5,
                            px: 2,
                            opacity: 1,
                            whiteSpace: "nowrap",
                            minWidth: column.minWidth || "auto",
                            textAlign: column.align || "left",
                            borderBottom: isExpanded
                              ? "none"
                              : "1px solid #f1f3f5",
                            ...getStickyStyle(column, false, row),
                          }}
                        >
                          {column.renderCell
                            ? column.renderCell(row, rowIndex, globalIndex)
                            : row[column.field]}
                        </TableCell>
                      ))}
                      {enableColumnSettings && (
                        <TableCell
                          sx={{
                            borderBottom: isExpanded
                              ? "none"
                              : "1px solid #D0CCCC",
                          }}
                        />
                      )}
                    </TableRow>

                    {renderExpandedRow && (
                      <TableRow>
                        <TableCell
                          colSpan={totalColSpan}
                          sx={{ p: 0, background: "#F7F7F7", border: "none" }}
                        >
                          <Collapse
                            in={isExpanded}
                            timeout="auto"
                            unmountOnExit
                            sx={{ background: "#F7F7F7", overflow: "visible" }}
                          >
                            <Box
                              sx={{
                                position: "sticky",
                                left: 0,
                                width: containerWidth || "100%",
                                maxWidth: "100%",
                                boxSizing: "border-box",
                                overflow: "hidden",
                                whiteSpace: "normal",
                                "& .MuiGrid-container": {
                                  flexWrap: { xs: "wrap", md: "nowrap" },
                                },
                                "& .MuiGrid-item": {
                                  minWidth: "0 !important",
                                  maxWidth: "none",
                                  flex: { xs: "1 1 100%", md: "1 1 0" },
                                  width: { xs: "100%", md: "auto" },
                                },
                              }}
                            >
                              {renderExpandedRow(row)}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>

      {pagination && (
        <TablePagination
          component="div"
          count={totalRowsCount}
          page={paginationPage}
          onPageChange={handleChangePage}
          rowsPerPage={activeRowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Items per page"
          rowsPerPageOptions={rowsPerPageOptions}
          showFirstButton
          showLastButton
          SelectProps={{
            MenuProps: {
              PaperProps: {
                sx: {
                  maxHeight: "300px",
                  overflowY: "auto",
                  borderRadius: "8px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  "&::-webkit-scrollbar": { width: "5px" },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#CBD5E1",
                    borderRadius: "4px",
                  },
                },
              },
            },
          }}
          sx={{
            flexShrink: 0,
            borderTop: "1px solid #E5E5E5",
            "& .MuiTablePagination-toolbar": { minHeight: "58px", px: 2 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              { fontSize: "14.5px", color: "#4B5563", fontWeight: 500 },
            "& .MuiSelect-select": { fontSize: "14.5px", fontWeight: 500 },
          }}
        />
      )}
    </Paper>
  );
};

export default GenericTable;
