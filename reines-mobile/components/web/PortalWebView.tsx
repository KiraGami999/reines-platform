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
import {
  WebView,
  type WebViewNavigation,
  type WebViewErrorEvent,
  type WebViewHttpErrorEvent,
} from "react-native-webview";

import { useWebSession } from "@/hooks/useWebSession";
import { useAuth } from "@/hooks/useAuth";
import {
  buildBridgeUrl,
  isLoginUrl,
  isSignOutUrl,
  rewritePortalUrl,
  toWebUrl,
} from "@/lib/webPortal";
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
  /**
   * When false, skip safe-area top padding (use when a native header already
   * owns the status-bar inset — e.g. Settings with Sign out).
   */
  padTop?: boolean;
}

/**
 * PortalWebView
 *
 * Renders the existing web portal page inside an authenticated WebView.
 *
 * Session handling:
 *   1. First load runs a server-side /mobile-bridge handoff (JWT → NextAuth cookie).
 *   2. Later tabs reuse that cookie for the rest of the app run.
 *   3. If the web drops to /login (cookie lost), we re-bridge a few times.
 *   4. If the user signs out on the web, we run native signOut (no re-bridge).
 *   5. Tabs that failed early auto-recover on focus once another tab succeeded.
 */
export function PortalWebView({ route, injectedCss, padTop = true }: PortalWebViewProps) {
  const insets             = useSafeAreaInsets();
  const { getBridgeToken } = useWebSession();
  const { signOut }        = useAuth();
  const webRef             = useRef<WebView>(null);

  const [source,  setSource]  = useState<string | null>(() =>
    isWebSessionEstablished() ? toWebUrl(route) : null
  );
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const bridging      = useRef(false);
  const bridgeAttempts = useRef(0);
  /** User clicked Sign out in the web portal — do not auto re-bridge. */
  const signingOut     = useRef(false);

  const loadDirect = useCallback((path: string) => {
    bridging.current = false;
    setError(false);
    setLoading(true);
    // Cache-bust so a stuck tab actually reloads after recovery.
    const base = toWebUrl(path);
    const sep  = base.includes("?") ? "&" : "?";
    const url  = `${base}${sep}_t=${Date.now()}`;
    console.log(`[PortalWebView:${route}] loadDirect ->`, url);
    setSource(url);
  }, [route]);

  const startBridge = useCallback(async () => {
    if (bridging.current || signingOut.current) return;

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
      const url = buildBridgeUrl(bridgeToken, route);
      console.log(`[PortalWebView:${route}] startBridge -> ${url.replace(/token=[^&]+/, "token=***")}`);
      setSource(url);
    } catch (e) {
      console.log(`[PortalWebView:${route}] startBridge FAILED`, String(e));
      bridging.current = false;
      setError(true);
      setLoading(false);
    }
  }, [getBridgeToken, loadDirect, route]);

  const retry = useCallback(() => {
    if (signingOut.current) return;
    bridging.current = false;
    bridgeAttempts.current = 0;
    if (isWebSessionEstablished()) {
      loadDirect(route);
    } else {
      void startBridge();
    }
  }, [loadDirect, route, startBridge]);

  const handleNativeSignOut = useCallback(() => {
    if (signingOut.current) return;
    signingOut.current = true;
    bridging.current = false;
    clearWebSessionEstablished();
    console.log(`[PortalWebView:${route}] web Sign out → native signOut`);
    void signOut();
  }, [route, signOut]);

  const handleShouldStart = useCallback(
    (req: WebViewNavigation): boolean => {
      const url = rewritePortalUrl(req.url);

      // Intentional web logout — clear the native JWT instead of re-bridging.
      if (isSignOutUrl(url)) {
        handleNativeSignOut();
        return false;
      }

      if (url !== req.url) {
        // Auth.js bounced to localhost — load the LAN URL instead.
        setSource(url);
        return false;
      }

      if (url.includes("/mobile-bridge") || url.includes("/api/auth/")) {
        return true;
      }
      if (isLoginUrl(url) && !bridging.current && !signingOut.current) {
        void startBridge();
        return false;
      }
      return true;
    },
    [handleNativeSignOut, startBridge]
  );

  const handleNavChange = useCallback(
    (nav: WebViewNavigation) => {
      setCanGoBack(nav.canGoBack);
      const url = rewritePortalUrl(nav.url);
      console.log(`[PortalWebView:${route}] nav ->`, url, "loading:", nav.loading);

      if (isSignOutUrl(url)) {
        handleNativeSignOut();
        return;
      }

      if (url !== nav.url) {
        setSource(url);
        return;
      }

      const onBridge =
        url.includes("/mobile-bridge") || url.includes("/api/auth/");

      if (onBridge) return;

      if (isLoginUrl(url)) {
        if (signingOut.current) return;
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
    [handleNativeSignOut, route, startBridge]
  );

  // Soften hard failures: a one-off WebView error (heavy SSR page, flaky Wi‑Fi)
  // should not leave the tab permanently dead if we already have a session.
  const handleError = useCallback(
    (e: WebViewErrorEvent) => {
      const { url, code, description } = e.nativeEvent;
      console.log(
        `[PortalWebView:${route}] onError code=${code} desc=${description} url=${url}`
      );
      bridging.current = false;
      if (isWebSessionEstablished()) {
        // Keep the WebView mounted; let the user pull-to-refresh / tap Retry.
        setLoading(false);
        return;
      }
      setError(true);
      setLoading(false);
    },
    [route]
  );

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

  // Safety net: never let the loading overlay hang forever (e.g. a sub-resource
  // that never completes). If we're still "loading" after 10s, hide the spinner
  // so the user can interact with whatever already rendered.
  useEffect(() => {
    if (!loading) return;
    const id = setTimeout(() => setLoading(false), 10000);
    return () => clearTimeout(id);
  }, [loading, source]);

  return (
    <View style={[styles.root, padTop && { paddingTop: insets.top }]}>
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
              onLoadStart={(e) => {
                console.log(`[PortalWebView:${route}] loadStart`, e.nativeEvent.url);
                setLoading(true);
              }}
              onLoadEnd={(e) => {
                console.log(`[PortalWebView:${route}] loadEnd`, e.nativeEvent.url);
                setLoading(false);
              }}
              // Hide the overlay once the document is essentially ready. onLoadEnd
              // waits for EVERY sub-resource (e.g. /api/media images) to finish,
              // which can stall forever on image-heavy pages like the gallery and
              // leave the spinner up indefinitely.
              onLoadProgress={({ nativeEvent }) => {
                if (nativeEvent.progress >= 0.7) setLoading(false);
              }}
              onError={handleError}
              onHttpError={(e: WebViewHttpErrorEvent) => {
                console.log(
                  `[PortalWebView:${route}] httpError status=${e.nativeEvent.statusCode} url=${e.nativeEvent.url}`
                );
                if (e.nativeEvent.statusCode >= 500) handleError(e as unknown as WebViewErrorEvent);
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
