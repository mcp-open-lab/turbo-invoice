"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function PublicHeaderActions() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/app">Dashboard</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/sign-in">Log in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/sign-up">Get Started</Link>
      </Button>
    </>
  );
}


