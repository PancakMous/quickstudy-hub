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
      { title: "QuickStudy — Learn faster with flashcards and quizzes" },
      { name: "description", content: "QuickStudy helps students learn faster with interactive flashcards and quizzes, starting with History." },
      { property: "og:title", content: "QuickStudy — Learn faster with flashcards and quizzes" },
      { property: "og:description", content: "QuickStudy helps students learn faster with interactive flashcards and quizzes, starting with History." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
        href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
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

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/flashcards", label: "Flashcards" },
  { to: "/quiz", label: "Quiz" },
  { to: "/progress", label: "Progress" },
] as const;

function AppNav() {
  return (
    <header className="sticky top-4 z-30 mx-auto max-w-6xl px-4">
      <nav className="flex items-center justify-between rounded-full border border-white/60 bg-white/55 px-4 py-2.5 shadow-lg shadow-brand/10 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2.5 pl-1">
          <span className="grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-brand to-accent text-white shadow-md shadow-brand/30 font-display">
            <span className="text-lg font-bold leading-none">Q</span>
          </span>
          <span className="text-lg font-bold tracking-tight text-ink font-display">QuickStudy</span>
        </Link>
        <div className="flex items-center gap-1 rounded-full p-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full px-3 sm:px-4 py-1.5 text-sm font-semibold transition"
              activeProps={{ className: "bg-white/80 text-brand shadow-sm" }}
              inactiveProps={{ className: "text-ink/55 hover:text-ink" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        {/* decorative pastel blobs */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -left-24 size-[420px] rounded-full bg-brand/25 blur-3xl" />
          <div className="absolute top-1/3 -right-32 size-[380px] rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 size-[340px] rounded-full bg-mint/40 blur-3xl" />
        </div>
        <AppNav />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </div>
    </QueryClientProvider>
  );
}
