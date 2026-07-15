import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { WebView, type WebViewNavigation } from "react-native-webview";

import { useWebSession } from "@/hooks/useWebSession";
import { buildBridgeUrl, isLoginUrl, toWebUrl } from "@/lib/webPortal";
import {
  isWebSessionEstablished,
  markWebSessionEstablished,
} from "@/lib/webSessionState";
import { COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";
import { Button } from "@/components/ui/Button";

const MAX_BRIDGE_ATTEMPTS = 2;

interface PortalWebViewProps {
  /** Web route to display, e.g. "/dashboard/projects". */
  route: string;
  /** Optional CSS injected into every page (e.g. to hide redundant chrome). */
  injectedCss?: string;
}

/**
 * PortalWebView
 *
 * Renders the existing web portal page inside an authenticated WebView.
 *
 * Session handling:
 *   1. First load runs a server-side /mobile-bridge handoff (JWT → NextAuth cookie).
 *   2. Later tabs reuse that cookie for the rest of the app run.
 *   3. If the web drops to /login, we re-bridge at most twice, then show an error
 *      instead of looping forever on "Opening your portal…".
 */
export function PortalWebView({ route, injectedCss }: PortalWebViewProps) {
  const insets             = useSafeAreaInsets();
  const { getBridgeToken } = useWebSession();
  const webRef             = useRef<WebView>(null);

  const [source,  setSource]  = useState<string | null>(() =>
    isWebSessionEstablished() ? toWebUrl(route) : null
  );
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const bridging      = useRef(false);
  const bridgeAttempts = useRef(0);

  const startBridge = useCallback(async () => {
    if (bridging.current) return;

    if (bridgeAttempts.current >= MAX_BRIDGE_ATTEMPTS) {
      setError(true);
      setLoading(false);
      return;
    }

    bridging.current = true;
    bridgeAttempts.current += 1;
    setError(false);
    setLoading(true);

    try {
      const bridgeToken = await getBridgeToken();
      setSource(buildBridgeUrl(bridgeToken, route));
    } catch {
      bridging.current = false;
      setError(true);
      setLoading(false);
    }
  }, [getBridgeToken, route]);

  const retry = useCallback(() => {
    bridging.current = false;
    bridgeAttempts.current = 0;
    setError(false);
    setLoading(true);
    void startBridge();
  }, [startBridge]);

  const handleShouldStart = useCallback(
    (req: WebViewNavigation): boolean => {
      // Never block the bridge page or auth callback.
      if (req.url.includes("/mobile-bridge") || req.url.includes("/api/auth/")) {
        return true;
      }
      if (isLoginUrl(req.url) && !bridging.current) {
        void startBridge();
        return false;
      }
      return true;
    },
    [startBridge]
  );

  const handleNavChange = useCallback(
    (nav: WebViewNavigation) => {
      setCanGoBack(nav.canGoBack);

      const onBridge =
        nav.url.includes("/mobile-bridge") || nav.url.includes("/api/auth/");

      if (onBridge) return;

      if (isLoginUrl(nav.url)) {
        // Bridge (or cookie) failed — allow another attempt, or surface error.
        bridging.current = false;
        void startBridge();
        return;
      }

      // Landed on a real portal page → session is good.
      bridging.current = false;
      bridgeAttempts.current = 0;
      markWebSessionEstablished();
    },
    [startBridge]
  );

  const handleError = useCallback(() => {
    setError(true);
    setLoading(false);
    bridging.current = false;
  }, []);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (canGoBack) {
          webRef.current?.goBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [canGoBack])
  );

  useEffect(() => {
    if (isWebSessionEstablished()) {
      setSource(toWebUrl(route));
    } else {
      bridgeAttempts.current = 0;
      void startBridge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errTitle}>Couldn&apos;t open the portal</Text>
          <Text style={styles.errBody}>
            Sign-in to the web portal failed. Check that the website is running
            on the same Wi‑Fi, then try again.
          </Text>
          <Button variant="primary" size="md" onPress={retry} style={styles.retryBtn}>
            Try again
          </Button>
        </View>
      ) : (
        <>
          {source && (
            <WebView
              ref={webRef}
              source={{ uri: source }}
              originWhitelist={["*"]}
              onShouldStartLoadWithRequest={handleShouldStart}
              onNavigationStateChange={handleNavChange}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={handleError}
              onHttpError={(e) => {
                // Ignore transient 3xx/auth noise; flag real failures.
                if (e.nativeEvent.statusCode >= 500) handleError();
              }}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              allowsInlineMediaPlayback
              allowsBackForwardNavigationGestures
              mediaCapturePermissionGrantType="grant"
              setSupportMultipleWindows={false}
              pullToRefreshEnabled
              startInLoadingState={false}
              injectedJavaScript={injectedCss ? cssInjector(injectedCss) : undefined}
              style={styles.web}
            />
          )}
          {loading && (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
        </>
      )}
    </View>
  );
}

function cssInjector(css: string): string {
  const safe = css.replace(/`/g, "\\`");
  return `(function () {
    try {
      var id = 'reines-native-css';
      if (!document.getElementById(id)) {
        var s = document.createElement('style');
        s.id = id;
        s.innerHTML = \`${safe}\`;
        document.head.appendChild(s);
      }
    } catch (e) {}
    true;
  })();`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  web:  { flex: 1, backgroundColor: COLORS.white },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  centered: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap:            8,
  },
  errTitle: { fontSize: 16, fontFamily: FONTS.semibold, color: COLORS.zinc800 },
  errBody:  { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.zinc500, textAlign: "center" },
  retryBtn: { marginTop: 12, minWidth: 140 },
});
