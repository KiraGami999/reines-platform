import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/**
 * Manager · Dashboard tab.
 *
 * Renders the existing web portal dashboard inside an authenticated WebView so
 * managers get the exact same tools as the website. Native login + bottom tab
 * bar are preserved; the web session is established via the JWT → web-session
 * bridge (see PortalWebView / useWebSession).
 */
export default function ManagerDashboardScreen() {
  return <PortalWebView route={WEB_ROUTES.manager.dashboard} />;
}
