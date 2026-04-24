import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
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
      { title: "Your Life in 10 Years — AI Future Predictor" },
      { name: "description", content: "Answer 3 questions. Let AI write the cinematic story of your life a decade from now." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Your Life in 10 Years — AI Future Predictor" },
      { property: "og:description", content: "Answer 3 questions. Let AI write the cinematic story of your life a decade from now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "theme-color", content: "#1a0d2e" },
      { name: "twitter:title", content: "Your Life in 10 Years — AI Future Predictor" },
      { name: "twitter:description", content: "Answer 3 questions. Let AI write the cinematic story of your life a decade from now." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c5afca54-74e3-49d7-a3f1-f24be5927304/id-preview-128c4a5f--ba653af1-a6bb-4d8b-bf64-dd967ca3a1fd.lovable.app-1777048712534.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c5afca54-74e3-49d7-a3f1-f24be5927304/id-preview-128c4a5f--ba653af1-a6bb-4d8b-bf64-dd967ca3a1fd.lovable.app-1777048712534.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
      },
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
  return <Outlet />;
}
