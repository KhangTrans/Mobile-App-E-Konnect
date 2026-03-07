import {
  AlertButton,
  AlertType,
  CustomAlert,
} from "@/components/ui/custom-alert";
import React, { createContext, ReactNode, useContext, useState } from "react";

interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
  autoClose?: boolean;
  autoCloseDuration?: number;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showSuccess: (title: string, message?: string, autoClose?: boolean) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string, autoClose?: boolean) => void;
  showConfirm: (
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
  ) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    title: "",
    type: "info",
  });

  const showAlert = (options: AlertOptions) => {
    setAlertOptions({
      type: "info",
      buttons: [{ text: "OK" }],
      ...options,
    });
    setVisible(true);
  };

  const showSuccess = (
    title: string,
    message?: string,
    autoClose: boolean = true,
  ) => {
    showAlert({
      type: "success",
      title,
      message,
      autoClose,
      autoCloseDuration: 2000,
      buttons: [{ text: "OK" }],
    });
  };

  const showError = (title: string, message?: string) => {
    showAlert({
      type: "error",
      title,
      message,
      buttons: [{ text: "Đóng" }],
    });
  };

  const showWarning = (title: string, message?: string) => {
    showAlert({
      type: "warning",
      title,
      message,
      buttons: [{ text: "OK" }],
    });
  };

  const showInfo = (
    title: string,
    message?: string,
    autoClose: boolean = true,
  ) => {
    showAlert({
      type: "info",
      title,
      message,
      autoClose,
      autoCloseDuration: 2000,
      buttons: [{ text: "OK" }],
    });
  };

  const showConfirm = (
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
  ) => {
    showAlert({
      type: "confirm",
      title,
      message,
      buttons: [
        {
          text: "Hủy",
          style: "cancel",
          onPress: onCancel,
        },
        {
          text: "Xác nhận",
          style: "default",
          onPress: onConfirm,
        },
      ],
    });
  };

  const hideAlert = () => {
    setVisible(false);
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        hideAlert,
      }}
    >
      {children}
      <CustomAlert
        visible={visible}
        type={alertOptions.type || "info"}
        title={alertOptions.title}
        message={alertOptions.message}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
        autoClose={alertOptions.autoClose}
        autoCloseDuration={alertOptions.autoCloseDuration}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
