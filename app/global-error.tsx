"use client";

import Link from "next/link";
import { useEffect } from "react";
import { logError } from "@/lib/observability/log";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("Global (root layout) error boundary triggered", error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Zenny - Error</title>
      </head>
      <body>
        <main
          style={{
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji",
            maxWidth: 720,
            margin: "0 auto",
            padding: "48px 16px",
            lineHeight: 1.5,
          }}
        >
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>
            Something went wrong
          </h1>
          <p style={{ color: "rgba(0,0,0,0.7)", marginBottom: 24 }}>
            We hit an unexpected problem loading the app shell. You can try
            again, or go back home.
          </p>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.2)",
                background: "white",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "black",
                color: "white",
                textDecoration: "none",
              }}
            >
              Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}


