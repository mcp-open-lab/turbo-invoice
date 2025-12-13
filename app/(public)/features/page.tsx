import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const nowCapabilities = [
  {
    title: "Capture Anything",
    bullets: [
      "Snap receipts or upload documents",
      "Import bank statements (CSV/PDF)",
      "Extract vendors, dates, totals, and line items",
    ],
  },
  {
    title: "Categorize Automatically",
    bullets: [
      "AI categorization + confidence scoring",
      "Smart Rules that learn your preferences",
      "A Review Queue to approve the edge cases fast",
    ],
  },
  {
    title: "Keep It Clean",
    bullets: [
      "Multi-business organization",
      "Merchant insights and bulk fixes",
      "Exports to CSV/Excel for your accountant",
    ],
  },
  {
    title: "Always Connected",
    bullets: [
      "Link accounts via Plaid",
      "Sync transactions into one workflow",
      "Stay up to date without manual downloads",
    ],
  },
];

const roadmap = [
  {
    title: "Zenny Advisor Mode",
    description:
      "Proactive budget coaching, weekly check-ins, and recommendations based on your real spend.",
  },
  {
    title: "Invoicing + Reconciliation",
    description:
      "Create invoices, track payments, and reconcile deposits automatically.",
  },
  {
    title: "Planning + Forecasting",
    description:
      "Cashflow projections, runway, and scenario planning you can act on.",
  },
  {
    title: "Tax Optimization Suggestions",
    description:
      "Guidance to stay ahead of tax season with exportable summaries and smart prompts.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="container px-4 md:px-6 mx-auto max-w-7xl py-12 md:py-20">
      <div className="flex items-center justify-between gap-4 mb-10">
        <div>
          <Badge variant="secondary" className="mb-3">
            The agent, the workflow, the results
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Meet Zenny, your personal bookkeeping agent
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Zenny isn&apos;t a pile of tools—it&apos;s a workflow that quietly
            handles the boring bookkeeping tasks so you can run your business.
            Capture, categorize, review, export. Repeat with almost no effort.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Back</Link>
        </Button>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold">What Zenny does today</h2>
          <Badge variant="success">Live</Badge>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {nowCapabilities.map((c) => (
            <Card key={c.title} variant="kpi">
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  {c.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold">Advisor upgrades rolling out</h2>
          <Badge variant="info">Roadmap</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl mb-6">
          We&apos;re building Zenny into a full personal bookkeeper + advisor.
          These upgrades will make Zenny proactive—spotting issues, suggesting
          improvements, and helping you plan ahead.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {roadmap.map((m) => (
            <Card key={m.title} className="border-dashed">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{m.title}</CardTitle>
                <Badge variant="info">Coming soon</Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {m.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-14 border-t pt-10">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Start earning your Zenny
            </h2>
            <p className="text-muted-foreground">
              Get a workflow that feels like an agent: it remembers what you
              like, gets better over time, and keeps you tax-ready.
            </p>
          </div>
          <div className="flex gap-3 md:justify-end">
            <Button asChild>
              <Link href="/">Start free</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}


