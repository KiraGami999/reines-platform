import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/** Manager · Messages tab — renders the web portal messages page in a WebView. */
export default function ManagerMessagesScreen() {
  return <PortalWebView route={WEB_ROUTES.manager.messages} />;
}
