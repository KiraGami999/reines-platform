import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MessageCircle,
  FolderOpen,
  Image as ImageIcon,
  CreditCard,
  Bell,
} from "lucide-react-native";
import { COLORS } from "@/constants";
import type { PushNotificationData } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BannerItem {
  id:    string;
  data:  PushNotificationData;
}

// ---------------------------------------------------------------------------
// Banner icon resolver
// ---------------------------------------------------------------------------

function BannerIcon({ type }: { type: PushNotificationData["type"] }) {
  const props = { size: 18, color: COLORS.white };
  switch (type) {
    case "message": return <MessageCircle {...props} />;
    case "project": return <FolderOpen   {...props} />;
    case "gallery": return <ImageIcon    {...props} />;
    case "payment": return <CreditCard   {...props} />;
    default:        return <Bell         {...props} />;
  }
}

// ---------------------------------------------------------------------------
// Single banner
// ---------------------------------------------------------------------------

const BANNER_DURATION = 4000;

interface SingleBannerProps {
  item:      BannerItem;
  onPress:   (item: BannerItem) => void;
  onDismiss: (id: string) => void;
}

function SingleBanner({ item, onPress, onDismiss }: SingleBannerProps) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets     = useSafeAreaInsets();

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue:  0,
        useNativeDriver: true,
        damping:  14,
        stiffness: 140,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    timer.current = setTimeout(() => dismiss(), BANNER_DURATION);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  const dismiss = () => {
    if (timer.current) clearTimeout(timer.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(item.id));
  };

  const handlePress = () => {
    dismiss();
    onPress(item);
  };

  const accentColor = {
    message: "#8fb9e8",
    project: COLORS.primary,
    gallery: "#7c3aed",
    payment: COLORS.green,
  }[item.data.type] ?? COLORS.primary;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform:       [{ translateY }],
          opacity,
          top:             insets.top + (Platform.OS === "android" ? 8 : 0) + 8,
          borderLeftColor: accentColor,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.bannerInner}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Icon pill */}
        <View style={[styles.iconWrap, { backgroundColor: accentColor }]}>
          <BannerIcon type={item.data.type} />
        </View>

        {/* Text */}
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>{item.data.title}</Text>
          <Text style={styles.body}  numberOfLines={2}>{item.data.body}</Text>
        </View>

        {/* Dismiss × */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={dismiss}
          hitSlop={8}
        >
          <Text style={styles.closeX}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Banner queue manager
// Exported so NotificationsProvider can push new items into it.
// ---------------------------------------------------------------------------

let _enqueue: ((item: BannerItem) => void) | null = null;

export function showInAppBanner(data: PushNotificationData) {
  _enqueue?.({
    id:   `${Date.now()}-${Math.random()}`,
    data,
  });
}

// ---------------------------------------------------------------------------
// InAppBannerHost — mount this once near the root of the app
// ---------------------------------------------------------------------------

export function InAppBannerHost() {
  const [queue, setQueue] = useState<BannerItem[]>([]);

  useEffect(() => {
    _enqueue = (item) => setQueue((q) => [...q, item]);
    return () => { _enqueue = null; };
  }, []);

  const dismiss = (id: string) => {
    setQueue((q) => q.filter((i) => i.id !== id));
  };

  // We only show the top-most banner to avoid clutter
  const current = queue[0];
  if (!current) return null;

  return (
    <SingleBanner
      key={current.id}
      item={current}
      onPress={() => {}}     // Navigation handled by the response listener
      onDismiss={dismiss}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  banner: {
    position:        "absolute",
    left:            12,
    right:           12,
    zIndex:          9999,
    borderRadius:    14,
    borderLeftWidth: 4,
    backgroundColor: COLORS.white,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.18,
    shadowRadius:    12,
    elevation:       12,
  },
  bannerInner: {
    flexDirection: "row",
    alignItems:    "center",
    padding:       12,
    gap:           10,
  },
  iconWrap: {
    width:          38,
    height:         38,
    borderRadius:   19,
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  },
  textWrap: {
    flex: 1,
    gap:  2,
  },
  title: {
    fontSize:   13,
    fontWeight: "700",
    color:      COLORS.zinc900,
  },
  body: {
    fontSize:   12,
    color:      COLORS.zinc500,
    lineHeight: 16,
  },
  closeBtn: {
    width:          24,
    height:         24,
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  },
  closeX: {
    fontSize:   20,
    color:      COLORS.zinc400,
    lineHeight: 22,
  },
});
