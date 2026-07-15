import { PortalWebView } from "@/components/web/PortalWebView";
import { WEB_ROUTES } from "@/lib/webPortal";

/**
 * Manager · Gallery tab — renders the web portal gallery page in a WebView.
 *
 * Photo/document uploads use the web page's own uploader inside the WebView
 * (native camera/gallery access is granted via PortalWebView's media
 * permission settings), keeping upload behaviour identical to the website.
 */
export default function ManagerGalleryScreen() {
  return <PortalWebView route={WEB_ROUTES.manager.gallery} />;
}
