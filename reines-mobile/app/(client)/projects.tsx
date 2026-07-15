import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/** Client · Projects tab — renders the web portal projects page in a WebView. */
export default function ClientProjectsScreen() {
  return <PortalWebView route={WEB_ROUTES.client.projects} />;
}
