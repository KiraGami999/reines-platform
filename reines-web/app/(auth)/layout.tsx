/**
 * Auth pages (login / register / forgot-password / verify-email).
 *
 * `data-portal` opts these pages into the dark-mode remap in globals.css, so in
 * dark mode the white/zinc chrome follows the navy-black theme while the brand
 * navy panel and blue accents stay intact. `bg-background` covers any gaps.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-portal className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
