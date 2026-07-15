import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/** Admin · Payments tab — renders the web admin payments page in a WebView. */
export default function AdminPaymentsScreen() {
  return <PortalWebView route={WEB_ROUTES.admin.payments} />;
}
