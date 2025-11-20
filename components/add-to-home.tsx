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
      setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    };
    checkStandalone();
    window.addEventListener("resize", checkStandalone);

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("resize", checkStandalone);
    };
  }, []);

  if (isStandalone || (!deferredPrompt && platform !== "ios")) {
    return null;
  }

  const handleClick = async () => {
    if (platform === "android" && deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "dismissed") {
        setDeferredPrompt(null);
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
