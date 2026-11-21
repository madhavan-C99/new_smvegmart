import { useState } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import GreenSwitch from "../common/CustomSwitch";

export default function AddCategoryModal({
  open,
  onClose,
  onSave,
  editData = null,
  nextOrder = 1,
}) {
  const [name, setName] = useState(editData ? editData.name : "");
  const [description, setDescription] = useState(editData ? editData.description : "");
  const [displayOrder, setDisplayOrder] = useState(
    editData?.display_order !== undefined ? editData.display_order : nextOrder
  );
  const [visibility, setVisibility] = useState(editData ? editData.visibility : true);
  const [imagePreview, setImagePreview] = useState(editData ? editData.image : "");
  const [imageFile, setImageFile] = useState(null);

  const [prevKey, setPrevKey] = useState(open ? (editData?.id || "create") : null);
  const currentKey = open ? (editData?.id || "create") : null;
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    if (editData) {
      setName(editData.name || "");
      setDescription(editData.description || "");
      setDisplayOrder(editData.display_order !== undefined ? editData.display_order : 1);
      setVisibility(editData.visibility !== undefined ? editData.visibility : true);
      setImagePreview(editData.image || "");
      setImageFile(null);
    } else {
      setName("");
      setDescription("");
      setDisplayOrder(nextOrder);
      setVisibility(true);
      setImagePreview("");
      setImageFile(null);
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCategory = {
      id: editData ? editData.id : undefined,
      s_no: editData ? editData.s_no : undefined,
      name,
      description,
      display_order: Number(displayOrder) || nextOrder,
      visibility,
      status: visibility ? "Active" : "Inactive",
      image: imagePreview || null,
      imageFile: imageFile,
      skus_count: editData ? editData.skus_count : 0,
    };

    onSave(newCategory);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
              bgcolor: "#0c6b27",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EditNoteOutlinedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "18px", color: "#111827" }}>
              {editData ? "Edit Category" : "Add Category"}
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#6B7280", mt: 0.2 }}>
              Modify department metadata, visual thumbnail and store visibility.
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6B7280" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Form Content */}
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Thumbnail Dropzone */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 1 }}>
              Category Thumbnail Visual
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
                    <span style={{ color: "#0c6b27", fontWeight: 700 }}>Click to upload</span>{" "}
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

          {/* Category Name */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
              Category Name <span style={{ color: "#DC2626" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Hydroponics & Salads"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  fontSize: "14px",
                  bgcolor: "#FFFFFF",
                },
              }}
            />
          </Box>

          {/* Short Description */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
              Short Description
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Pesticide-free microgreens, hydroponic lettuce, and fresh culinary herbs harvested daily from regional controlled farms."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  fontSize: "13.5px",
                  bgcolor: "#FFFFFF",
                },
              }}
            />
          </Box>

          {/* Display Order Priority & Visibility */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, alignItems: "center" }}>
            {/* Priority */}
            <Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1F2937", mb: 0.8 }}>
                Display Order Priority
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    fontSize: "14px",
                  },
                }}
              />
            </Box>

            {/* Visibility Toggle */}
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
                  <Typography sx={{ fontSize: "12.5px", fontWeight: 700, color: visibility ? "#0c6b27" : "#6B7280" }}>
                    {visibility ? "Active" : "Inactive"}
                  </Typography>
                  <Typography sx={{ fontSize: "10.5px", color: "#6B7280" }}>
                    Visible in Storefront & App
                  </Typography>
                </Box>
                <GreenSwitch checked={visibility} onChange={(e) => setVisibility(e.target.checked)} />
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
              bgcolor: "#0c6b27",
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "13px",
              px: 3,
              py: 0.9,
              borderRadius: "8px",
              "&:hover": { bgcolor: "#0a5620" },
            }}
          >
            {editData ? "Update Category" : "Add Category"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
