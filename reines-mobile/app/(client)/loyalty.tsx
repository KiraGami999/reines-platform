import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/** Client · Rewards tab — renders the web portal loyalty page in a WebView. */
export default function ClientLoyaltyScreen() {
  return <PortalWebView route={WEB_ROUTES.client.loyalty} />;
}
