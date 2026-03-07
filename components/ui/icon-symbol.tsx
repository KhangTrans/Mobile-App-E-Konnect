// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",

  // Auth & User
  "person.fill": "person",
  "person.circle.fill": "account-circle",
  "person.crop.circle": "account-circle",
  "person.badge.plus": "person-add",
  envelope: "email",
  "envelope.fill": "email",
  at: "alternate-email",
  "lock.fill": "lock",
  lock: "lock-outline",
  "lock.open": "lock-open",
  "lock.open.fill": "lock-open",
  "key.fill": "vpn-key",
  key: "vpn-key",
  "eye.fill": "visibility",
  eye: "visibility",
  "eye.slash.fill": "visibility-off",
  "eye.slash": "visibility-off",
  "shield.fill": "security",
  "checkmark.seal.fill": "verified",
  textformat: "text-fields",
  number: "numbers",

  // Shopping & Orders
  "cart.fill": "shopping-cart",
  "bag.fill": "shopping-bag",
  "box.fill": "inventory",
  "shippingbox.fill": "local-shipping",
  "clipboard.fill": "assignment",

  // Actions
  "heart.fill": "favorite",
  heart: "favorite-border",
  "star.fill": "star",
  star: "star-border",
  "bell.fill": "notifications",
  bell: "notifications-none",

  // Location & Navigation
  "location.fill": "location-on",
  location: "location-on",
  "map.fill": "map",
  house: "home",

  // Payment & Finance
  "creditcard.fill": "credit-card",
  "wallet.pass.fill": "account-balance-wallet",
  "banknote.fill": "payments",

  // Settings & Tools
  "gearshape.fill": "settings",
  gearshape: "settings",

  // Communication
  "message.fill": "message",
  "phone.fill": "phone",
  "questionmark.circle.fill": "help",

  // UI Elements
  "checkmark.circle.fill": "check-circle",
  "checkmark.circle": "check-circle-outline",
  checkmark: "check",
  "xmark.circle.fill": "cancel",
  "xmark.circle": "cancel",
  xmark: "close",
  "exclamationmark.triangle.fill": "warning",
  "exclamationmark.triangle": "warning",
  "info.circle.fill": "info",
  "info.circle": "info",
  pencil: "edit",
  "pencil.circle.fill": "edit",
  "trash.fill": "delete",
  trash: "delete-outline",
  "plus.circle.fill": "add-circle",
  "plus.circle": "add-circle-outline",
  plus: "add",
  "minus.circle.fill": "remove-circle",
  "minus.circle": "remove-circle-outline",
  minus: "remove",

  // Documents & Content
  "doc.fill": "description",
  doc: "description",
  "photo.fill": "image",
  photo: "image",
  "camera.fill": "camera-alt",
  camera: "camera-alt",
  "folder.fill": "folder",
  folder: "folder-open",

  // Other
  globe: "language",
  "calendar.fill": "event",
  calendar: "event",
  "clock.fill": "schedule",
  clock: "schedule",
  "tag.fill": "local-offer",
  tag: "local-offer",
  "gift.fill": "card-giftcard",
  gift: "card-giftcard",
} as const;

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
