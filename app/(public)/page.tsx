import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import {
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  History,
  ListTodo,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";
import {
  faqPageJsonLd,
  JsonLdScript,
  softwareApplicationJsonLd,
} from "@/components/seo/json-ld";

const siteUrl = "https://zennybooks.com";

export const metadata: Metadata = {
  title: "Zenny - AI Bookkeeping on Autopilot",
  description:
    "Zenny is an AI personal bookkeeper for freelancers and small businesses: receipt capture, smart categorization, review queue, and tax-ready exports.",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "Zenny - Bookkeeping on Autopilot",
    description:
      "Automate receipts, categorization, and review workflows. Stay tax-ready with clean exports.",
    url: siteUrl,
    type: "website",
  },
};

const faq = [
  {
    question: "What is Zenny?",
    answer:
      "Zenny is an AI-powered personal bookkeeper that captures receipts, categorizes transactions, and helps you export tax-ready data in minutes.",
  },
  {
    question: "Do I need to connect my bank account?",
    answer:
      "No. You can upload receipts and statements. If you connect via Plaid, Zenny can sync transactions automatically for an ongoing workflow.",
  },
  {
    question: "How accurate is the AI categorization?",
    answer:
      "Zenny combines AI with smart rules and a review queue. You can approve low-confidence items quickly and teach rules so accuracy improves over time.",
  },
  {
    question: "Can I export for my accountant?",
    answer:
      "Yes. Export clean, categorized data to CSV/Excel for bookkeeping, tax prep, or importing into other tools.",
  },
  {
    question: "Is this replacing an accountant?",
    answer:
      "No. Zenny is designed to automate the day-to-day workflow and make it easy to share clean data with your accountant or tax pro.",
  },
];

export default function MarketingPage() {
  return (
    <main className="flex-1">
      <JsonLdScript
        data={softwareApplicationJsonLd({
          siteUrl,
          name: "Zenny",
          description:
            "AI-powered bookkeeping for freelancers and small businesses: receipt capture, smart categorization, and tax-ready exports.",
        })}
      />
      <JsonLdScript data={faqPageJsonLd({ questions: faq })} />

      {/* Incentive Banner */}
      <section className="w-full border-b bg-muted/40">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl py-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-center text-center text-sm">
            <span className="font-medium">
              First 10,000 users to sign up get Pro free.
            </span>
            <span className="text-muted-foreground">
              Early-adopter perk while we build the full AI advisor.
            </span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden w-full py-12 md:py-24 lg:py-32 xl:py-48 px-4 md:px-6">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[hsl(var(--primary)/0.18)] blur-3xl" />
          <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-[hsl(var(--info)/0.14)] blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/60" />
        </div>
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="space-y-4 max-w-3xl">
              <Badge
                variant="secondary"
                className="px-3 py-1 text-sm rounded-full mb-4"
              >
                <Sparkles className="w-3 h-3 mr-1 inline text-primary" />
                New: Review Queue + Smart Rules
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Level up your bookkeeping with{" "}
                <span className="text-primary">Zenny</span>.
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl lg:text-2xl">
                Stop manually categorizing transactions.{" "}
                <span className="text-primary font-medium">Zenny</span> captures
                receipts, categorizes spending with smart rules, and keeps you
                tax-ready—so you can focus on what matters.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 min-w-[200px]">
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button size="lg" className="h-12 px-8 text-base">
                    Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/app">
                  <Button size="lg" className="h-12 px-8 text-base">
                    Go to App <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base"
                >
                  See How It Works
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border px-3 py-1">
                No credit card required
              </span>
              <span className="rounded-full border px-3 py-1">
                CSV/Excel export
              </span>
              <span className="rounded-full border px-3 py-1">
                Bank linking via Plaid
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="w-full py-12 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              A workflow that earns its keep
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Built for speed today, and a full AI advisor tomorrow.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-none shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-primary/10 w-fit rounded-xl">
                  <ListTodo className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Review Queue</h3>
                <p className="text-muted-foreground">
                  A dedicated workflow to quickly approve or fix low-confidence
                  transactions. Bulk edit and clear your backlog in seconds.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-primary/10 w-fit rounded-xl">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Smart Rules</h3>
                <p className="text-muted-foreground">
                  Teach the AI once, and it remembers forever. Create rules
                  based on merchant history to automate future categorizations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-primary/10 w-fit rounded-xl">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Merchant Insights</h3>
                <p className="text-muted-foreground">
                  Drill down into any merchant. See your total spend, visit
                  history, and apply bulk changes to past transactions
                  instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-primary/10 w-fit rounded-xl">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Instant Capture</h3>
                <p className="text-muted-foreground">
                  Snap a receipt or upload a bank statement. Our AI extracts
                  vendors, dates, and totals with near-perfect accuracy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-primary/10 w-fit rounded-xl">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Business Context</h3>
                <p className="text-muted-foreground">
                  Seamlessly toggle between Personal and Business modes. Keep
                  your finances separate without multiple accounts.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-primary/10 w-fit rounded-xl">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Tax Ready</h3>
                <p className="text-muted-foreground">
                  Export clean, categorized data to CSV or Excel. Your
                  accountant will love you (or be slightly less annoyed).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="w-full py-12 md:py-24 border-t">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-3">
              <Badge variant="info" className="w-fit">
                Coming soon
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Your full AI bookkeeper & advisor
              </h2>
              <p className="text-muted-foreground md:text-lg max-w-xl">
                Zenny is evolving into a proactive assistant that helps you
                budget, plan, and make smarter decisions—without the spreadsheet
                grind.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "Budget coaching", desc: "Targets, alerts, and weekly nudges." },
                { title: "Invoice tracking", desc: "Create invoices and reconcile payments." },
                { title: "Planning & forecasting", desc: "Cashflow projections and runway." },
                { title: "Tax optimization", desc: "Suggestions to stay ahead of tax time." },
              ].map((c) => (
                <Card key={c.title} className="border-dashed">
                  <CardContent className="p-5 space-y-1">
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-sm text-muted-foreground">{c.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full py-12 md:py-24 bg-muted/50 border-t">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Questions, answered
            </h2>
            <p className="text-muted-foreground">
              A few common questions before you start earning your Zenny.
            </p>
          </div>
          <div className="grid gap-4">
            {faq.map((q) => (
              <Card key={q.question}>
                <CardContent className="p-6">
                  <div className="font-semibold">{q.question}</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {q.answer}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 border-t">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Ready to regain your sanity?
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
                Join thousands of freelancers and small business owners who
                trust Zenny.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-w-[200px]">
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button size="lg" className="w-full">
                    Get Started Now
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/app">
                  <Button size="lg" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </SignedIn>
              <p className="text-xs text-muted-foreground">
                No credit card required for trial.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Built for fast receipt capture, clean exports, and confident
              reviews.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


