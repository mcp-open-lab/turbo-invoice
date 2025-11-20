"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
  }
}

export function AddToHomeScreenButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isAndroid = /android/i.test(window.navigator.userAgent);
    setPlatform(isIos ? "ios" : isAndroid ? "android" : null);

    const checkStandalone = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    };
    checkStandalone();
    window.addEventListener("resize", checkStandalone);

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also listen for appinstalled event to hide button after installation
    const installedHandler = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      window.removeEventListener("resize", checkStandalone);
    };
  }, []);

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  // On Android, only show if we have the prompt available
  // On iOS, always show (manual instructions)
  if (platform === "android" && !deferredPrompt) {
    return null;
  }

  const handleClick = async () => {
    if (platform === "android" && deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setDeferredPrompt(null);
          setIsStandalone(true);
        } else {
          // User dismissed, keep the prompt available for later
        }
      } catch (error) {
        console.error("Error showing install prompt:", error);
      }
    } else if (platform === "ios") {
      setShowDialog(true);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={handleClick}
        className="w-full md:w-auto"
      >
        Add to Home Screen
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install on iPhone or iPad</DialogTitle>
          </DialogHeader>
          <ol className="list-decimal list-inside text-sm space-y-2">
            <li>Tap the Share icon in Safari (square with an upward arrow).</li>
            <li>Scroll down and choose “Add to Home Screen”.</li>
            <li>Confirm the name and tap “Add”.</li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
