import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page pivoted to a different URL.</h2>
        <p className="mt-2 text-sm text-muted-foreground">It's raising a Series A elsewhere now.</p>
        <a href="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-gradient-neon px-4 py-2 text-sm font-medium text-neon-foreground shadow-glow">Go home</a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Corporate Buzzword Generator — AI-Powered Synergy as a Service" },
      { name: "description", content: "Generate startup ideas, LinkedIn cringe, investor pitches, and corporate nonsense. Disrupting synergy through AI-powered innovation." },
      { property: "og:title", content: "Corporate Buzzword Generator — AI-Powered Synergy as a Service" },
      { property: "og:description", content: "Generate startup ideas, LinkedIn cringe, investor pitches, and corporate nonsense. Disrupting synergy through AI-powered innovation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Corporate Buzzword Generator — AI-Powered Synergy as a Service" },
      { name: "twitter:description", content: "Generate startup ideas, LinkedIn cringe, investor pitches, and corporate nonsense. Disrupting synergy through AI-powered innovation." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/67401da2-f508-427c-909a-023de0d89e16/id-preview-85358d80--b8117b85-ac14-4915-abb5-33495fe97f69.lovable.app-1777570677326.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/67401da2-f508-427c-909a-023de0d89e16/id-preview-85358d80--b8117b85-ac14-4915-abb5-33495fe97f69.lovable.app-1777570677326.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster position="top-center" />
    </>
  );
}
