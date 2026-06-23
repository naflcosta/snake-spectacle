import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Snake Arena" },
      { name: "description", content: "Multiplayer-ready Snake game with leaderboards and live spectating." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Snake Arena" },
      { property: "og:description", content: "Play Snake, climb the leaderboard, watch other players live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
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

function Nav() {
  const { user, logout } = useAuth();
  return (
    <header className="border-b border-border bg-card/40 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-block h-5 w-5 rounded-sm bg-primary" />
          Snake Arena
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/play" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent" activeProps={{ className: "px-3 py-1.5 text-sm rounded-md bg-accent" }}>
            Play
          </Link>
          <Link to="/leaderboard" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent" activeProps={{ className: "px-3 py-1.5 text-sm rounded-md bg-accent" }}>
            Leaderboard
          </Link>
          <Link to="/spectate" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent" activeProps={{ className: "px-3 py-1.5 text-sm rounded-md bg-accent" }}>
            Spectate
          </Link>
          {user ? (
            <div className="ml-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">@{user.username}</span>
              <Button size="sm" variant="outline" onClick={() => void logout()}>
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/auth" className="ml-2">
              <Button size="sm">Log in</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Nav />
          <Outlet />
          <Toaster richColors position="top-right" />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
