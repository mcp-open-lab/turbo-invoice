import { FadeIn } from "@/components/motion/fade-in";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, Upload, Wallet } from "lucide-react";

const steps = [
  {
    title: "Import anything",
    description:
      "Receipts, bank statements, and CSVs—Zenny maps and normalizes it.",
    icon: Upload,
  },
  {
    title: "Zenny builds your books",
    description:
      "Auto-categorize transactions and learn rules from your approvals.",
    icon: Sparkles,
  },
  {
    title: "Budgets stay on track",
    description: "Track monthly budgets and see spend vs plan instantly.",
    icon: Wallet,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <FadeIn className="text-center space-y-3 mb-10">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            How the agent works
          </h2>
          <p className="text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Import → organize → stay on budget. Zenny does the busywork and gets
            smarter as you approve.
          </p>
        </FadeIn>

        <div className="grid gap-4 md:grid-cols-3 md:gap-6 items-stretch">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <FadeIn key={s.title} delayMs={idx * 120}>
                <Card className="h-full">
                  <CardContent className="p-6 space-y-4 h-full flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Step {idx + 1}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-semibold">{s.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {s.description}
                      </div>
                    </div>

                    <div className="mt-auto pt-2 text-sm text-muted-foreground">
                      {idx < steps.length - 1 ? (
                        <span className="inline-flex items-center gap-2">
                          Next <ArrowRight className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          Done{" "}
                          <span className="text-primary">budget-ready</span>
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
