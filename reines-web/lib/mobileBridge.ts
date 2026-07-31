"use client";

/**
 * Bridge to the Reines Project Mate mobile app's WebView shell.
 *
 * `react-native-webview` automatically injects `window.ReactNativeWebView`
 * into every page it renders, so its presence is a reliable signal that this
 * page is running inside the native app rather than a normal browser tab.
 */
export function isInsideMobileApp(): boolean {
  return typeof window !== "undefined" && "ReactNativeWebView" in window;
}

interface NativeWebView {
  postMessage: (message: string) => void;
}

/**
 * Posts a typed message to the native app shell (see PortalWebView's
 * `onMessage` handler). Returns false — and does nothing — when not running
 * inside the mobile app, so callers can fall back to normal web behaviour.
 */
export function postToNativeApp(message: { type: string; [key: string]: unknown }): boolean {
  if (!isInsideMobileApp()) return false;
  (window as unknown as { ReactNativeWebView: NativeWebView }).ReactNativeWebView.postMessage(
    JSON.stringify(message)
  );
  return true;
}
