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
  clearWebSessionEstablished,
  isWebSessionEstablished,
  markWebSessionEstablished,
  withSharedBridgeToken,
} from "@/lib/webSessionState";
import { COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";
import { Button } from "@/components/ui/Button";

const MAX_BRIDGE_ATTEMPTS = 3;

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
 *   3. If the web drops to /login, we re-bridge a few times, then show an error.
 *   4. Tabs that failed early auto-recover on focus once another tab succeeded.
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

  const loadDirect = useCallback((path: string) => {
    bridging.current = false;
    setError(false);
    setLoading(true);
    // Cache-bust so a stuck tab actually reloads after recovery.
    const base = toWebUrl(path);
    const sep  = base.includes("?") ? "&" : "?";
    setSource(`${base}${sep}_t=${Date.now()}`);
  }, []);

  const startBridge = useCallback(async () => {
    if (bridging.current) return;

    // Cookie already good (another tab opened successfully) — skip re-bridge.
    if (isWebSessionEstablished()) {
      loadDirect(route);
      return;
    }

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
      const bridgeToken = await withSharedBridgeToken(getBridgeToken);
      setSource(buildBridgeUrl(bridgeToken, route));
    } catch {
      bridging.current = false;
      setError(true);
      setLoading(false);
    }
  }, [getBridgeToken, loadDirect, route]);

  const retry = useCallback(() => {
    bridging.current = false;
    bridgeAttempts.current = 0;
    if (isWebSessionEstablished()) {
      loadDirect(route);
    } else {
      void startBridge();
    }
  }, [loadDirect, route, startBridge]);

  const handleShouldStart = useCallback(
    (req: WebViewNavigation): boolean => {
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
        bridging.current = false;
        const hadSession = isWebSessionEstablished();
        clearWebSessionEstablished();
        // Only reset attempts if a working cookie was lost mid-session.
        // If we never established, keep counting toward MAX_BRIDGE_ATTEMPTS.
        if (hadSession) bridgeAttempts.current = 0;
        void startBridge();
        return;
      }

      bridging.current = false;
      bridgeAttempts.current = 0;
      markWebSessionEstablished();
      setError(false);
    },
    [startBridge]
  );

  // Soften hard failures: a one-off WebView error (heavy SSR page, flaky Wi‑Fi)
  // should not leave the tab permanently dead if we already have a session.
  const handleError = useCallback(() => {
    bridging.current = false;
    if (isWebSessionEstablished()) {
      // Keep the WebView mounted; let the user pull-to-refresh / tap Retry.
      setLoading(false);
      return;
    }
    setError(true);
    setLoading(false);
  }, []);

  // When the user returns to a tab that failed early, recover if another tab
  // already established the web session (very common for Dashboard = first tab).
  useFocusEffect(
    useCallback(() => {
      if (error && isWebSessionEstablished()) {
        loadDirect(route);
      }

      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (canGoBack) {
          webRef.current?.goBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [canGoBack, error, loadDirect, route])
  );

  useEffect(() => {
    if (isWebSessionEstablished()) {
      loadDirect(route);
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
            Check that the website is running on the same Wi‑Fi, then try again.
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
