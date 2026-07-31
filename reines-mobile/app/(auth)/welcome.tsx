import { useEffect, useRef } from "react";
import { StyleSheet, Text, PanResponder } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronRight } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";

import { COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";
import { ReinesLogo } from "@/components/brand/ReinesLogo";

/** How long the intro animation plays before the user is allowed to continue. */
const MIN_DISPLAY_MS = 5000;

/**
 * First screen a signed-out user sees on every cold start (see app/index.tsx).
 * Plays for MIN_DISPLAY_MS, then a tap anywhere (or a swipe) continues to login.
 */
export default function WelcomeScreen() {
  const router = useRouter();

  const copyOpacity = useSharedValue(0);
  const copyTranslateY = useSharedValue(12);
  const hintOpacity = useSharedValue(0);
  const sceneOpacity = useSharedValue(1);
  const sceneTranslateX = useSharedValue(0);
  const isLeaving = useRef(false);
  const canContinue = useRef(false);

  useEffect(() => {
    copyOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    copyTranslateY.value = withDelay(200, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
    // Hint fades in right as the screen becomes interactive, so it doesn't
    // invite taps before MIN_DISPLAY_MS has elapsed.
    hintOpacity.value = withDelay(
      MIN_DISPLAY_MS,
      withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.3, { duration: 900 })), -1, true),
    );

    const timer = setTimeout(() => {
      canContinue.current = true;
    }, MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToLogin() {
    router.replace("/(auth)/login");
  }

  function continueToLogin() {
    if (!canContinue.current || isLeaving.current) return;
    isLeaving.current = true;
    sceneOpacity.value = withTiming(0, { duration: 260 });
    sceneTranslateX.value = withTiming(-32, { duration: 260, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(goToLogin)();
    });
  }

  // Claim the responder on touch-start so both a plain tap and a drag/swipe
  // land here — either gesture advances to login, so we don't need to
  // distinguish between them.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: () => continueToLogin(),
      onPanResponderTerminate: () => continueToLogin(),
    }),
  ).current;

  const copyStyle = useAnimatedStyle(() => ({
    opacity: copyOpacity.value,
    transform: [{ translateY: copyTranslateY.value }],
  }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: hintOpacity.value }));
  const sceneStyle = useAnimatedStyle(() => ({
    opacity: sceneOpacity.value,
    transform: [{ translateX: sceneTranslateX.value }],
  }));

  return (
    <Animated.View style={[styles.root, sceneStyle]} {...panResponder.panHandlers}>
      {/* Navy background needs light icons — overrides the app-wide dark default. */}
      <StatusBar style="light" />
      <Animated.View style={[styles.copy, copyStyle]}>
        <ReinesLogo mode="wordmark" mark="project-mate" variant="on-dark" height={34} />
        <Text style={styles.subtitle}>Track every milestone of your project, in real time.</Text>
      </Animated.View>

      <Animated.View style={[styles.hint, hintStyle]}>
        <Text style={styles.hintText}>Tap or swipe to continue</Text>
        <ChevronRight color={COLORS.accent} size={16} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: COLORS.primary,
    alignItems:      "center",
    justifyContent:  "center",
    paddingHorizontal: 32,
  },
  copy: { alignItems: "center", gap: 14 },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize:   14,
    color:      "rgba(255,255,255,0.7)",
    textAlign:  "center",
    marginTop:  4,
    maxWidth:   260,
  },
  hint: {
    position:      "absolute",
    bottom:        56,
    flexDirection: "row",
    alignItems:    "center",
    gap:           6,
  },
  hintText: {
    fontFamily:    FONTS.medium,
    fontSize:      12,
    color:         COLORS.accent,
    letterSpacing: 0.5,
  },
});
