import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { TeamProvider } from "@/state/team";
import { MuteButton } from "@/components/MuteButton";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-csk-yellow">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Innings over</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That page is out. Head back to the dressing room.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Build Your Dream CSK XI — Pick Your Legends" },
      { name: "description", content: "Build your ultimate Chennai Super Kings playing XI. Drag, drop, get an AI rating and fan reactions. Whistle Podu!" },
      { name: "author", content: "CSK Dream XI" },
      { name: "theme-color", content: "#FDB913" },
      { property: "og:title", content: "Build Your Dream CSK XI — Pick Your Legends" },
      { property: "og:description", content: "Build your ultimate Chennai Super Kings playing XI. Drag, drop, get an AI rating and fan reactions. Whistle Podu!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Build Your Dream CSK XI — Pick Your Legends" },
      { name: "twitter:description", content: "Build your ultimate Chennai Super Kings playing XI. Drag, drop, get an AI rating and fan reactions. Whistle Podu!" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b51ddb41-281c-4b15-a88c-15aa11495de5/id-preview-65a1a5e7--8433c0f1-52a0-4a92-be53-26b51fa974a8.lovable.app-1777099018524.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b51ddb41-281c-4b15-a88c-15aa11495de5/id-preview-65a1a5e7--8433c0f1-52a0-4a92-be53-26b51fa974a8.lovable.app-1777099018524.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@400;500;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <TeamProvider>
      <MuteButton />
      <Outlet />
      <Toaster position="top-center" theme="dark" />
    </TeamProvider>
  );
}
