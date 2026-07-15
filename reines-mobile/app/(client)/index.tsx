import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/**
 * Client · Dashboard tab.
 *
 * Renders the existing web portal dashboard inside an authenticated WebView so
 * the mobile experience matches the website exactly. Native login + bottom tab
 * bar are preserved; the web session is established via the JWT → web-session
 * bridge (see PortalWebView / useWebSession).
 */
export default function ClientDashboardScreen() {
  return <PortalWebView route={WEB_ROUTES.client.dashboard} />;
}
