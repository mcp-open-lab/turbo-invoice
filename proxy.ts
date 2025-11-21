import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
]);

const isUploadThingRoute = createRouteMatcher(["/api/uploadthing(.*)"]);
const isInngestRoute = createRouteMatcher(["/api/inngest(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // Bypass UploadThing routes so the request body isn't consumed
  if (isUploadThingRoute(request)) {
    return NextResponse.next();
  }

  // Bypass Inngest routes - they're called by Inngest infrastructure
  // These routes need to be publicly accessible for Inngest webhooks
  if (isInngestRoute(request)) {
    return NextResponse.next();
  }

  if (!isPublicRoute(request)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      return redirectToSignIn();
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

