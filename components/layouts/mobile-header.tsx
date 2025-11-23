"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Receipt, Home, Upload, FileText, Settings, BarChart3, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", icon: Home, label: "Timeline" },
  { href: "/app/import", icon: Upload, label: "Import" },
  { href: "/app/invoices", icon: FileText, label: "Invoices" },
  { href: "/app/budgets", icon: Building2, label: "Budgets" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
];

export function MobileHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Hamburger Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Turbo Invoice
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 mt-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== "/app" && pathname?.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo/Brand */}
        <Link href="/app" className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          <span className="font-bold text-sm">Turbo Invoice</span>
        </Link>

        {/* User Button */}
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}

