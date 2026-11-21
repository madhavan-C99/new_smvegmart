import { createContext, useContext, useState, useCallback } from "react";
import CommonPopup from "../components/common/CommonPopup";

const CommonPopupContext = createContext(null);

export function CommonPopupProvider({ children }) {
  const [popupState, setPopupState] = useState({
    open: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "",
    cancelText: "Cancel",
    isConfirm: false,
    loading: false,
    onConfirmCallback: null,
    resolvePromise: null,
  });

  const closePopup = useCallback(() => {
    setPopupState((prev) => {
      if (prev.resolvePromise) {
        prev.resolvePromise(false);
      }
      return { ...prev, open: false, loading: false };
    });
  }, []);

  const showConfirm = useCallback(
    ({
      title = "Are you sure?",
      message = "Please confirm this action.",
      type = "danger",
      confirmText,
      cancelText = "Cancel",
      onConfirm,
    } = {}) => {
      return new Promise((resolve) => {
        setPopupState({
          open: true,
          title,
          message,
          type,
          confirmText,
          cancelText,
          isConfirm: true,
          loading: false,
          onConfirmCallback: onConfirm,
          resolvePromise: resolve,
        });
      });
    },
    []
  );

  const showAlert = useCallback(
    ({
      title = "Notice",
      message = "",
      type = "warning",
      confirmText = "Okay",
    } = {}) => {
      return new Promise((resolve) => {
        setPopupState({
          open: true,
          title,
          message,
          type,
          confirmText,
          cancelText: "",
          isConfirm: false,
          loading: false,
          onConfirmCallback: null,
          resolvePromise: resolve,
        });
      });
    },
    []
  );

  const handleConfirm = async () => {
    try {
      if (popupState.onConfirmCallback) {
        setPopupState((prev) => ({ ...prev, loading: true }));
        await popupState.onConfirmCallback();
      }
      if (popupState.resolvePromise) {
        popupState.resolvePromise(true);
      }
      setPopupState((prev) => ({ ...prev, open: false, loading: false }));
    } catch (err) {
      console.error("Popup confirmation action failed:", err);
      setPopupState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <CommonPopupContext.Provider value={{ showConfirm, showAlert, closePopup }}>
      {children}
      <CommonPopup
        open={popupState.open}
        onClose={closePopup}
        onConfirm={handleConfirm}
        title={popupState.title}
        message={popupState.message}
        type={popupState.type}
        confirmText={popupState.confirmText}
        cancelText={popupState.cancelText}
        isConfirm={popupState.isConfirm}
        loading={popupState.loading}
      />
    </CommonPopupContext.Provider>
  );
}

export function useCommonPopup() {
  const context = useContext(CommonPopupContext);
  if (!context) {
    throw new Error("useCommonPopup must be used within a CommonPopupProvider");
  }
  return context;
}
