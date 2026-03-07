import { IconSymbol } from "@/components/ui/icon-symbol";
import React, { useEffect } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export type AlertType = "success" | "error" | "warning" | "info" | "confirm";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface CustomAlertProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

const AlertIcon = ({ type }: { type: AlertType }) => {
  const iconConfig = {
    success: { name: "checkmark.circle.fill", color: "#34C759" },
    error: { name: "xmark.circle.fill", color: "#FF3B30" },
    warning: { name: "exclamationmark.triangle.fill", color: "#FF9500" },
    info: { name: "info.circle.fill", color: "#007AFF" },
    confirm: { name: "questionmark.circle.fill", color: "#007AFF" },
  };

  const config = iconConfig[type];

  return (
    <View style={styles.iconContainer}>
      <IconSymbol name={config.name as any} size={60} color={config.color} />
    </View>
  );
};

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type,
  title,
  message,
  buttons = [{ text: "OK", style: "default" }],
  onClose,
  autoClose = false,
  autoCloseDuration = 2000,
}) => {
  const overlayOpacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });

      // Auto close for success/info (not confirm/error)
      if (autoClose && (type === "success" || type === "info")) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDuration);
        return () => clearTimeout(timer);
      }
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
      translateY.value = withTiming(50, { duration: 200 });
    }
  }, [visible, autoClose, type, autoCloseDuration]);

  const handleClose = () => {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.8, { duration: 200 });
    translateY.value = withTiming(50, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    handleClose();
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const alertStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View style={[styles.overlayBackground, overlayStyle]} />
      </Pressable>

      <View style={styles.container} pointerEvents="box-none">
        <Animated.View style={[styles.alertBox, alertStyle]}>
          <AlertIcon type={type} />

          <Text style={styles.title}>{title}</Text>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const isSingle = buttons.length === 1;
              const isHalf = buttons.length === 2;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isSingle && styles.buttonSingle,
                    isHalf && styles.buttonHalf,
                    button.style === "cancel" && styles.buttonCancel,
                    button.style === "destructive" && styles.buttonDestructive,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === "cancel" && styles.buttonTextCancel,
                      button.style === "destructive" &&
                        styles.buttonTextDestructive,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  alertBox: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSingle: {
    flex: 1,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: "#E5E5EA",
  },
  buttonDestructive: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonTextCancel: {
    color: "#000",
  },
  buttonTextDestructive: {
    color: "#fff",
  },
});
