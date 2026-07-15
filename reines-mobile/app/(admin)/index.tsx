import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/**
 * Admin · Dashboard tab.
 *
 * Renders the existing web admin dashboard inside an authenticated WebView so
 * admins get the full website toolset on mobile. The web session is established
 * via the JWT → web-session bridge (see PortalWebView / useWebSession).
 */
export default function AdminDashboardScreen() {
  return <PortalWebView route={WEB_ROUTES.admin.dashboard} />;
}
