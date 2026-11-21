import { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  MenuItem,
  Checkbox,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import AddIcon from "@mui/icons-material/Add";
import GreenSwitch from "../common/CustomSwitch";

const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "bn", label: "bn" },
  { value: "ltr", label: "ltr" },
  { value: "ml", label: "ml" },
  { value: "pcs", label: "pcs" },
  { value: "pack", label: "pack" },
];

const parseUnitWeight = (val) => {
  if (!val || typeof val !== "string") {
    return { amount: "1", unit: "kg" };
  }
  const clean = val.trim();
  const match = clean.match(/^([\d.]+)\s*(.*)$/i);
  if (!match) {
    return { amount: clean, unit: "kg" };
  }
  const amount = match[1];
  let unit = match[2]?.toLowerCase()?.trim() || "kg";

  if (["kg", "kgs", "kilo", "kilogram", "kilograms"].includes(unit)) unit = "kg";
  else if (["g", "gm", "gms", "gram", "grams"].includes(unit)) unit = "g";
  else if (["bn", "bunch", "bunches", "bundle", "bundles"].includes(unit)) unit = "bn";
  else if (["ltr", "l", "lt", "liter", "litres", "litre"].includes(unit)) unit = "ltr";
  else if (["ml", "milliliter", "millilitre"].includes(unit)) unit = "ml";
  else if (["pc", "pcs", "piece", "pieces", "nos", "no"].includes(unit)) unit = "pcs";
  else if (["pack", "packet", "packets", "pkt", "pkts", "box"].includes(unit)) unit = "pack";
  else {
    const found = UNIT_OPTIONS.find((opt) => opt.value === unit);
    if (!found) unit = "kg";
  }

  return { amount, unit };
};

export default function AddProductModal({
  open,
  onClose,
  onSave,
  categories = [],
  subcategories = [],
  editData = null,
}) {
  const [name, setName] = useState("");
  const [tamilName, setTamilName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [price, setPrice] = useState("35");
  const [originalPrice, setOriginalPrice] = useState("35");
  const [weightAmount, setWeightAmount] = useState("1");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [stock, setStock] = useState("140");
  const [discount, setDiscount] = useState("0");
  const [visibility, setVisibility] = useState(true);
  const [dailyVegetables, setDailyVegetables] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [extraVariants, setExtraVariants] = useState([]);

  const [prevKey, setPrevKey] = useState(open ? (editData?.id || "create") : null);
  const currentKey = open ? (editData?.id || "create") : null;
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    if (open) {
      if (editData) {
        setName(editData.name || "");
        setTamilName(editData.tamil_name || "");
        setCategoryId(editData.category_id || (categories[0]?.id ? String(categories[0].id) : ""));
        setSubcategoryId(editData.subcategory_id || (subcategories[0]?.id ? String(subcategories[0].id) : ""));
        const basePrice = editData.variants?.[0]?.price
          ? String(editData.variants[0].price).replace("₹", "").trim()
          : "35";
        const baseMrp = editData.variants?.[0]?.mrp
          ? String(editData.variants[0].mrp).replace("₹", "").trim()
          : basePrice;
        const baseDisc = editData.variants?.[0]?.discount !== undefined
          ? String(editData.variants[0].discount)
          : "0";

        setPrice(basePrice);
        setOriginalPrice(baseMrp || basePrice);
        const parsedBase = parseUnitWeight(editData.variants?.[0]?.weight || "1 kg");
        setWeightAmount(parsedBase.amount);
        setWeightUnit(parsedBase.unit);
        setStock(
          editData.variants?.[0]?.stock_quantity !== undefined
            ? String(editData.variants[0].stock_quantity)
            : "140"
        );
        setDiscount(baseDisc);
        setVisibility(editData.visibility !== undefined ? Boolean(editData.visibility) : true);
        setDailyVegetables(Boolean(editData.daily_vegetables));
        setImagePreview(editData.image || "");
        setImageFile(null);
        if (editData.variants && editData.variants.length > 1) {
          setExtraVariants(
            editData.variants.slice(1).map((v, idx) => {
              const vPrice = v.price ? String(v.price).replace("₹", "").trim() : "50";
              const vMrp = v.mrp ? String(v.mrp).replace("₹", "").trim() : vPrice;
              const parsedV = parseUnitWeight(v.weight || "1.5 kg");
              return {
                id: v.id || `extra-${idx + 1}`,
                price: vPrice,
                originalPrice: vMrp || vPrice,
                weightAmount: parsedV.amount,
                weightUnit: parsedV.unit,
                stock: v.stock_quantity !== undefined ? String(v.stock_quantity) : "140",
                discount: v.discount !== undefined ? String(v.discount) : "0",
              };
            })
          );
        } else {
          setExtraVariants([]);
        }
      } else {
        setName("");
        setTamilName("");
        setCategoryId(categories[0]?.id ? String(categories[0].id) : "");
        setSubcategoryId(subcategories[0]?.id ? String(subcategories[0].id) : "");
        setPrice("35");
        setOriginalPrice("35");
        setWeightAmount("1");
        setWeightUnit("kg");
        setStock("140");
        setDiscount("0");
        setVisibility(true);
        setDailyVegetables(false);
        setImagePreview("");
        setImageFile(null);
        setExtraVariants([]);
      }
    }
  }

  // Discount calculation for primary variant
  const handleDiscountChange = (newDisc) => {
    setDiscount(newDisc);
    const base = parseFloat(originalPrice || price);
    const numDisc = parseFloat(newDisc);
    if (!isNaN(base) && !isNaN(numDisc) && numDisc > 0) {
      const reduced = base - (base * numDisc) / 100;
      setPrice(String(Number(reduced.toFixed(2))));
    } else if (!isNaN(base) && base > 0) {
      setPrice(String(base));
    }
  };

  const handlePriceChange = (newPrice) => {
    setPrice(newPrice);
    setOriginalPrice(newPrice);
  };

  const handlePriceBlur = () => {
    const base = parseFloat(originalPrice || price);
    const numDisc = parseFloat(discount);
    if (!isNaN(base) && !isNaN(numDisc) && numDisc > 0) {
      const reduced = base - (base * numDisc) / 100;
      setPrice(String(Number(reduced.toFixed(2))));
    }
  };

  const handlePriceFocus = () => {
    if (originalPrice && originalPrice !== price) {
      setPrice(originalPrice);
    }
  };

  // Discount calculation for extra variants
  const handleVariantDiscountChange = (index, discVal) => {
    setExtraVariants((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const base = parseFloat(item.originalPrice || item.price) || 0;
        const numDisc = parseFloat(discVal);
        let calculatedPrice = item.price;
        if (!isNaN(base) && !isNaN(numDisc) && numDisc > 0) {
          calculatedPrice = String(Number((base - (base * numDisc) / 100).toFixed(2)));
        } else if (!isNaN(base) && base > 0) {
          calculatedPrice = String(base);
        }
        return {
          ...item,
          discount: discVal,
          originalPrice: item.originalPrice || item.price,
          price: calculatedPrice,
        };
      })
    );
  };

  const handleVariantPriceChange = (index, val) => {
    setExtraVariants((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, price: val, originalPrice: val } : item))
    );
  };

  const handleVariantPriceBlur = (index) => {
    setExtraVariants((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const base = parseFloat(item.originalPrice || item.price) || 0;
        const numDisc = parseFloat(item.discount);
        let calculatedPrice = item.price;
        if (!isNaN(base) && !isNaN(numDisc) && numDisc > 0) {
          calculatedPrice = String(Number((base - (base * numDisc) / 100).toFixed(2)));
        }
        return {
          ...item,
          price: calculatedPrice,
        };
      })
    );
  };

  const handleVariantPriceFocus = (index) => {
    setExtraVariants((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          price: item.originalPrice || item.price,
        };
      })
    );
  };

  const filteredSubcategories = useMemo(() => {
    if (!categoryId) return subcategories;
    const filtered = subcategories.filter(
      (s) =>
        String(s.category_id) === String(categoryId) ||
        String(s.category) === String(categoryId)
    );
    return filtered.length > 0 ? filtered : subcategories;
  }, [subcategories, categoryId]);

  const handleAddVariant = () => {
    setExtraVariants((prev) => [
      ...prev,
      { id: Date.now(), price: "50", weightAmount: "1.5", weightUnit: "kg", stock: "140", discount: "0" },
    ]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const baseWeight = `${(weightAmount || "").trim()} ${weightUnit || "kg"}`.trim();

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("tamil_name", tamilName.trim());
    fd.append("description", "");
    if (categoryId) fd.append("category_id", categoryId);
    if (subcategoryId) fd.append("subcategory_id", subcategoryId);
    fd.append("unit_value", baseWeight);
    fd.append("selling_price", price);
    fd.append("mrp_price", originalPrice || price);
    fd.append("discount", discount || "0");
    fd.append("stock_quantity", stock);
    fd.append("is_active", visibility ? "true" : "false");
    fd.append("daily_vegetables", dailyVegetables ? "true" : "false");
    const allVariants = [
      {
        unit_value: baseWeight,
        selling_price: price,
        mrp_price: originalPrice || price,
        discount: discount || "0",
        stock_quantity: stock,
      },
      ...extraVariants.map((v) => {
        const vWeight = `${(v.weightAmount || "").trim()} ${v.weightUnit || "kg"}`.trim();
        return {
          unit_value: vWeight,
          selling_price: v.price,
          mrp_price: v.originalPrice || v.price,
          discount: v.discount || "0",
          stock_quantity: v.stock,
        };
      }),
    ];
    fd.append("variants", JSON.stringify(allVariants));

    if (imageFile) fd.append("product_img", imageFile);
    if (editData?.id) fd.append("id", editData.id);

    onSave(fd);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 1.5,
          boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ p: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1.8 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              bgcolor: "#0F6838",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingBagOutlinedIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "18px", color: "#111827" }}>
              {editData ? "Edit Product" : "Add New Product"}
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#6B7280", mt: 0.2 }}>
              Create a new catalog item with bilingual names, pricing, and inventory stock.
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6B7280" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Form Content */}
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.2 }}>
          {/* Thumbnail Dropzone */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 1 }}>
              Product Thumbnail Visual
            </Typography>
            <Box
              sx={{
                border: "1.5px dashed #D1D5DB",
                borderRadius: "12px",
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "#FFFFFF",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    bgcolor: "#F9FAFB",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <AddPhotoAlternateOutlinedIcon sx={{ color: "#9CA3AF", fontSize: 26 }} />
                  )}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "13px" }}>
                    <span style={{ color: "#0F6838", fontWeight: 700 }}>Click to upload</span>{" "}
                    <span style={{ color: "#4B5563" }}>or drag and drop</span>
                  </Typography>
                  <Typography sx={{ fontSize: "11px", color: "#9CA3AF", mt: 0.3 }}>
                    Aspect ratio 1:1 recommended • PNG, JPG or WebP up to 5MB
                  </Typography>
                </Box>
              </Box>
              <Button
                component="label"
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: "8px",
                  borderColor: "#D1D5DB",
                  color: "#1F2937",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "12px",
                  px: 2,
                  "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" },
                }}
              >
                Browse
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </Button>
            </Box>
          </Box>

          {/* Row 1: Names */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
                Product Name <span style={{ color: "#DC2626" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g., Farm Fresh Country Tomato"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13.5px" } }}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
                Product Name (Tamil)
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g., தக்காளி"
                value={tamilName}
                onChange={(e) => setTamilName(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13.5px" } }}
              />
            </Box>
          </Box>

          {/* Row 2: Categories */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
                Parent Category <span style={{ color: "#DC2626" }}>*</span>
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13.5px" } }}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id} sx={{ fontSize: "13.5px" }}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
                Subcategory Name <span style={{ color: "#DC2626" }}>*</span>
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13.5px" } }}
              >
                {filteredSubcategories.map((s) => (
                  <MenuItem key={s.id} value={s.id} sx={{ fontSize: "13.5px" }}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          {/* Row 3: Pricing & Inventory */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
                Price (₹) <span style={{ color: "#DC2626" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                onBlur={handlePriceBlur}
                onFocus={handlePriceFocus}
                required
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13.5px" } }}
              />
              {Boolean(discount && Number(discount) > 0 && originalPrice && Number(originalPrice) > Number(price)) && (
                <Typography sx={{ fontSize: "11px", color: "#15803d", fontWeight: 600, mt: 0.4 }}>
                  ₹{originalPrice} - {discount}% off
                </Typography>
              )}
            </Box>
            <Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
                Unit/ Weight <span style={{ color: "#DC2626" }}>*</span>
              </Typography>
              <Box sx={{ display: "flex", gap: 0.8 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="text"
                  placeholder="e.g., 1, 500"
                  value={weightAmount}
                  onChange={(e) => setWeightAmount(e.target.value)}
                  required
                  sx={{ flex: 1.2, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13.5px" } }}
                />
                <TextField
                  select
                  size="small"
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  sx={{
                    width: "95px",
                    "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13.5px" },
                  }}
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "13px" }}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
                Available stock <span style={{ color: "#DC2626" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13.5px" } }}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
                Discount
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                placeholder="0"
                value={discount}
                onChange={(e) => handleDiscountChange(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F6838" }}>
                        %
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13.5px" } }}
              />
            </Box>
          </Box>

          {/* Additional Variants if added */}
          {extraVariants.map((v, i) => (
            <Box
              key={v.id}
              sx={{
                p: 1.5,
                borderRadius: "10px",
                bgcolor: "#F9FAFB",
                border: "1px solid #E5E7EB",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1.4fr 1fr 1fr auto" },
                gap: 1.5,
                alignItems: "center",
              }}
            >
              <TextField
                size="small"
                label="Price (₹)"
                type="number"
                value={v.price}
                onChange={(e) => handleVariantPriceChange(i, e.target.value)}
                onBlur={() => handleVariantPriceBlur(i)}
                onFocus={() => handleVariantPriceFocus(i)}
                helperText={
                  v.discount && Number(v.discount) > 0 && v.originalPrice && Number(v.originalPrice) > Number(v.price)
                    ? `₹${v.originalPrice} - ${v.discount}%`
                    : ""
                }
              />
              <Box sx={{ display: "flex", gap: 0.8 }}>
                <TextField
                  size="small"
                  label="Weight"
                  placeholder="e.g., 1.5"
                  value={v.weightAmount || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExtraVariants((prev) =>
                      prev.map((item, idx) => (idx === i ? { ...item, weightAmount: val } : item))
                    );
                  }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  select
                  size="small"
                  label="Unit"
                  value={v.weightUnit || "kg"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExtraVariants((prev) =>
                      prev.map((item, idx) => (idx === i ? { ...item, weightUnit: val } : item))
                    );
                  }}
                  sx={{ width: "85px" }}
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "13px" }}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <TextField
                size="small"
                label="Stock"
                type="number"
                value={v.stock}
                onChange={(e) => {
                  const val = e.target.value;
                  setExtraVariants((prev) =>
                    prev.map((item, idx) => (idx === i ? { ...item, stock: val } : item))
                  );
                }}
              />
              <TextField
                size="small"
                label="Discount"
                type="number"
                value={v.discount !== undefined ? v.discount : "0"}
                onChange={(e) => handleVariantDiscountChange(i, e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#0F6838" }}>
                        %
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton
                size="small"
                onClick={() => setExtraVariants((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}

          {/* Add Variants Button */}
          <Box>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddVariant}
              sx={{
                color: "#0F6838",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "13px",
                p: 0,
                "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
              }}
            >
              + Add Variants
            </Button>
          </Box>

          {/* Controls: Visibility & Daily Vegetables */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
            {/* Visibility */}
            <Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
                Visibility
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.2,
                  px: 1.8,
                  borderRadius: "10px",
                  bgcolor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "12.5px", fontWeight: 700, color: visibility ? "#0F6838" : "#6B7280" }}>
                    {visibility ? "Active" : "Inactive"}
                  </Typography>
                  <Typography sx={{ fontSize: "10.5px", color: "#6B7280" }}>
                    Visible in Storefront & App
                  </Typography>
                </Box>
                <GreenSwitch checked={visibility} onChange={(e) => setVisibility(e.target.checked)} />
              </Box>
            </Box>

            {/* Daily Vegetables */}
            <Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
                Daily Vegetables
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.2,
                  px: 1.8,
                  borderRadius: "10px",
                  bgcolor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "12.5px", fontWeight: 700, color: dailyVegetables ? "#0F6838" : "#6B7280" }}>
                    {dailyVegetables ? "Yes, Essential" : "No"}
                  </Typography>
                  <Typography sx={{ fontSize: "10.5px", color: "#6B7280" }}>
                    Show in daily vegetables list
                  </Typography>
                </Box>
                <Checkbox
                  checked={dailyVegetables}
                  onChange={(e) => setDailyVegetables(e.target.checked)}
                  sx={{
                    color: "#9ca3af",
                    "&.Mui-checked": {
                      color: "#0c6b27",
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        {/* Footer */}
        <DialogActions sx={{ p: 2, pt: 1, gap: 1.5, justifyContent: "flex-end" }}>
          <Button
            onClick={onClose}
            sx={{
              textTransform: "none",
              color: "#374151",
              fontWeight: 600,
              fontSize: "13px",
              px: 2.5,
              borderRadius: "8px",
              "&:hover": { bgcolor: "#F3F4F6" },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              bgcolor: "#0F6838",
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "13px",
              px: 3,
              py: 0.9,
              borderRadius: "8px",
              "&:hover": { bgcolor: "#0B522C" },
            }}
          >
            {editData ? "Update Product" : "Add Product"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
