import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/** Client · Payments tab — renders the web portal payments page in a WebView. */
export default function ClientPaymentsScreen() {
  return <PortalWebView route={WEB_ROUTES.client.payments} />;
}
