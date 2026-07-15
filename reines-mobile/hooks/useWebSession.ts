import { useCallback } from "react";
import api from "@/lib/api";

interface BridgeResponse {
  bridgeToken: string;
}

/**
 * useWebSession
 *
 * Exchanges the current mobile JWT for a short-lived bridge token used to open
 * the web portal (inside a WebView) as an authenticated session — without the
 * user logging in again.
 *
 * The returned `getBridgeToken` is called by PortalWebView whenever the WebView
 * lands on /login (i.e. there's no valid web session cookie yet, or it expired).
 * api.post automatically attaches the bearer token and handles 401 refresh.
 */
export function useWebSession() {
  const getBridgeToken = useCallback(async (): Promise<string> => {
    const { data } = await api.post<BridgeResponse>("/api/mobile/web-bridge");
    return data.bridgeToken;
  }, []);

  return { getBridgeToken };
}
