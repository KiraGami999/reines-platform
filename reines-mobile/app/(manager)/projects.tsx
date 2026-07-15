import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/** Manager · Projects tab — renders the web portal projects page in a WebView. */
export default function ManagerProjectsScreen() {
  return <PortalWebView route={WEB_ROUTES.manager.projects} />;
}
