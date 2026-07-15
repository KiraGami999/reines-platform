import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/** Client · Messages tab — renders the web portal messages page in a WebView. */
export default function ClientMessagesScreen() {
  return <PortalWebView route={WEB_ROUTES.client.messages} />;
}
