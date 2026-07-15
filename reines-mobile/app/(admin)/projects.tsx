import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/** Admin · Projects tab — renders the web admin projects page in a WebView. */
export default function AdminProjectsScreen() {
  return <PortalWebView route={WEB_ROUTES.admin.projects} />;
}
