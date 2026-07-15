import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/** Admin · Clients tab — renders the web admin clients page in a WebView. */
export default function AdminClientsScreen() {
  return <PortalWebView route={WEB_ROUTES.admin.clients} />;
}
