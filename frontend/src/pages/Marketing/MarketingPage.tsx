import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Calendar,
  Check,
  ChevronUp,
  Dumbbell,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useSeo } from "@/lib/seo";
import "./marketing.css";

const SITE_URL = "https://www.arqlift.com/";
const DESCRIPTION =
  "ArqLift keeps your workouts focused and your progress measurable. Capture sets, session notes, and long-term trends with a workflow that feels fast inside the gym.";

const trustBadges = ["Free to start", "Set up in minutes", "Built for lifters"];

const checklist = [
  "Clean, distraction-free workout logging",
  "Detailed exercise history",
  "Personal records tracking",
  "Volume and performance charts",
  "Notes and tags for every workout",
];

const progressChartData = [
  { date: "Jul 5", weight: 85 },
  { date: "Jul 11", weight: 95 },
  { date: "Jul 14", weight: 95 },
];

// Hand-plotted to a 260x100 chart area — decorative only (matches the real
// Progress page's line chart look without pulling recharts into the public
// marketing bundle, ~387KB gzipped, that ProgressPage itself uses).
const progressChartPoints = [
  { x: 10, y: 42 },
  { x: 135, y: 15 },
  { x: 260, y: 15 },
];

function HexMark({ className = "size-9" }: { className?: string }) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/35 ${className}`}
    >
      <Dumbbell className="size-1/2" />
    </div>
  );
}

export function MarketingPage() {
  useSeo({
    title: "ArqLift — Track every rep, set, and PR.",
    description: DESCRIPTION,
    canonical: SITE_URL,
    og: {
      url: SITE_URL,
      // TODO: swap for a real 1200x630 brand image once one exists —
      // apple-touch-icon.png (180x180) is a placeholder.
      image: `${SITE_URL}apple-touch-icon.png`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "ArqLift",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web, iOS, Android",
      description: DESCRIPTION,
      url: SITE_URL,
    },
  });

  const highlights = useMemo(
    () => [
      {
        title: "Log Workouts",
        text: "Record every set, rep and weight. Keep your training organized and easy to review",
        icon: Pencil,
      },
      {
        title: "Track Progress",
        text: "Visualize your performance with charts and history that show your strength over time.",
        icon: BarChart3,
      },
      {
        title: "Stay Consistent",
        text: "See your workout streaks and build habits that keep you moving forward",
        icon: Calendar,
      },
    ],
    [],
  );

  return (
    <div className="mk-page min-h-dvh overflow-x-clip text-foreground">
      <header className="sticky top-0 z-40 border-b border-line-subtle bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
          <Link to="/" className="group inline-flex items-center gap-3">
            <HexMark />
            <span className="mk-wordmark hidden font-display text-base tracking-[0.04em] text-white/90 transition group-hover:text-white sm:inline sm:text-lg">
              ARQLIFT
            </span>
          </Link>

          <nav className="hidden lg:flex">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Features
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              to="/login"
              className="inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold text-muted-foreground transition hover:text-foreground sm:h-10 sm:px-4 sm:text-sm"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-brand-glow transition hover:bg-primary-hover sm:h-10 sm:px-4 sm:text-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-20">
          <div className="space-y-6">
            <div className="mk-reveal inline-flex max-w-full items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="break-words">
                Performance Tracking For Lifters
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="mk-reveal mk-delay-1 font-display text-4xl leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Track every set.
                <br />
                See your <span className="text-primary">progress</span>.
              </h1>
              <p className="mk-reveal mk-delay-2 max-w-xl text-body-lg text-muted-foreground">
                ARQLIFT helps you log workouts, track performance over time, and
                stay consistent. Simple, fast and built for lifters who take
                their training seriously.
              </p>
            </div>

            <div className="mk-reveal mk-delay-3 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link
                to="/register"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-brand-glow transition hover:bg-primary-hover sm:w-auto"
              >
                Start Tracking Free
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 text-sm font-semibold text-foreground transition hover:bg-white/10 sm:w-auto"
              >
                See Features
              </a>
            </div>

            <div className="mk-reveal mk-delay-3 flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
              {trustBadges.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Check className="size-3.5 text-primary" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="mk-reveal mk-delay-2">
            <div className="mk-shimmer relative mx-auto max-w-75 overflow-hidden rounded-[2.5rem] border border-white/12 bg-[linear-gradient(170deg,rgba(17,32,52,0.9)_0%,rgba(11,22,38,0.8)_100%)] p-3 shadow-elevated">
              <div className="rounded-4xl border border-white/10 bg-background/80 p-3">
                <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-white/80">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-3 rounded-sm bg-white/60" />
                    <span className="h-2 w-3 rounded-sm bg-white/60" />
                    <span className="h-2.5 w-4 rounded-sm bg-white/70" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-white">
                  <ArrowLeft className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold">Lower Body A</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-[10px] font-semibold tabular-nums text-white">
                      00:23
                    </span>
                    <RefreshCw className="size-3" />
                    <MoreHorizontal className="size-3" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-primary/40 py-1.5 text-[10px] font-semibold text-primary">
                  <Plus className="size-3" />
                  Add Exercise
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between p-2">
                    <span className="text-[11px] font-semibold text-white">
                      Barbell Squat
                    </span>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Trash2 className="size-3 text-danger/70" />
                      <ChevronUp className="size-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-[1rem_1fr_1fr_1rem_0.75rem] items-center gap-1 border-t border-white/10 px-2 py-1 text-[6px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Set</span>
                    <span className="text-center">Weight</span>
                    <span className="text-center">Reps</span>
                    <span className="text-center">Done</span>
                    <span />
                  </div>

                  <div className="space-y-1 px-2 pb-2">
                    {[
                      { label: "W", weight: 45, warmup: true },
                      { label: "W", weight: 65, warmup: true },
                      { label: "1", weight: 95, warmup: false },
                      { label: "2", weight: 95, warmup: false },
                      { label: "3", weight: 95, warmup: false },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className={`grid grid-cols-[1rem_1fr_1fr_1rem_0.75rem] items-center gap-1 rounded-md border px-1.5 py-1 ${
                          row.warmup
                            ? "border-warmup/25 bg-warmup/5"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        {row.warmup ? (
                          <span className="inline-flex size-3.5 items-center justify-center rounded-full border border-warmup/40 bg-warmup/15 text-[6px] font-bold text-warmup">
                            {row.label}
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold text-muted-foreground">
                            {row.label}
                          </span>
                        )}
                        <span
                          className={`justify-self-center rounded-full border px-1.5 py-0.5 text-[8px] font-semibold tabular-nums text-white ${
                            row.warmup
                              ? "border-warmup/30 bg-warmup/10"
                              : "border-primary/30 bg-primary/10"
                          }`}
                        >
                          {row.weight}
                        </span>
                        <span
                          className={`justify-self-center rounded-full border px-1.5 py-0.5 text-[8px] font-semibold tabular-nums text-white ${
                            row.warmup
                              ? "border-warmup/30 bg-warmup/10"
                              : "border-primary/30 bg-primary/10"
                          }`}
                        >
                          8
                        </span>
                        <span className="mx-auto inline-flex size-2.5 items-center justify-center rounded-full border border-muted-foreground/30" />
                        <Trash2 className="mx-auto size-2.5 text-danger/50" />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1 px-2 pb-2">
                    <span className="flex flex-1 items-center justify-center gap-1 rounded-md border border-dashed border-white/15 py-1 text-[8px] font-semibold text-muted-foreground">
                      <Plus className="size-2.5" />
                      Add Set
                    </span>
                    <span className="flex items-center justify-center rounded-md border border-warmup/40 bg-warmup/10 px-1.5 py-1 text-[8px] font-semibold text-warmup">
                      + Warm-up
                    </span>
                  </div>
                </div>

                <div className="relative mt-2 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between p-2">
                    <span className="text-[11px] font-semibold text-white">
                      Romanian Deadlift
                    </span>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Trash2 className="size-3 text-danger/70" />
                      <ChevronUp className="size-3" />
                    </div>
                  </div>
                  <div className="h-5 bg-linear-to-b from-transparent to-background/90" />
                </div>

                <div className="mt-3 flex items-center justify-center rounded-lg bg-primary py-2 text-[11px] font-semibold text-primary-foreground shadow-brand-glow">
                  Finish Workout
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-8 sm:px-6 lg:px-10 lg:pb-12"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className={`mk-reveal rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-card backdrop-blur ${
                    index === 0
                      ? "mk-delay-1"
                      : index === 1
                        ? "mk-delay-2"
                        : "mk-delay-3"
                  }`}
                >
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                    <Icon className="size-5" />
                  </div>
                  <h2 className="mt-4 text-title font-semibold text-white">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-body text-muted-foreground">
                    {item.text}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-10 lg:pb-24">
          <div className="mk-reveal grid gap-8 rounded-2xl border border-white/10 bg-white/3 p-6 shadow-card backdrop-blur sm:rounded-3xl sm:p-10 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-5">
              <h2 className="font-display text-2xl tracking-tight text-white sm:text-3xl">
                Everything you need,
                <br />
                nothing you don't.
              </h2>
              <ul className="space-y-3">
                {checklist.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/12 bg-[linear-gradient(170deg,rgba(17,32,52,0.9)_0%,rgba(11,22,38,0.8)_100%)] p-4 sm:rounded-3xl sm:p-6">
              <div className="flex items-center gap-2">
                <ArrowLeft className="size-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold text-white">
                    Barbell Squat
                  </p>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Legs
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-white/12 bg-white/5 p-3 text-center">
                  <span className="mx-auto inline-flex size-6 items-center justify-center rounded-full border border-accent/60 bg-accent/10 text-accent">
                    <Award className="size-3.5" />
                  </span>
                  <p className="mt-1.5 text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
                    All-Time Max Weight
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">
                    95 lbs
                  </p>
                </div>
                <div className="rounded-xl border border-white/12 bg-white/5 p-3 text-center">
                  <Activity className="mx-auto size-4 text-primary" />
                  <p className="mt-1.5 text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
                    All-Time Max Reps
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">
                    8 reps
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="size-3.5 text-primary" />
                  Max Weight Over Time
                </p>
                <div className="mt-2 flex gap-1.5">
                  <div className="flex h-24 shrink-0 flex-col justify-between text-[8px] text-muted-foreground/70">
                    <span>100</span>
                    <span>75</span>
                    <span>50</span>
                    <span>25</span>
                    <span>0</span>
                  </div>
                  <svg
                    viewBox="0 0 270 100"
                    preserveAspectRatio="none"
                    className="h-24 flex-1"
                  >
                    {[0, 25, 50, 75, 100].map((tick) => (
                      <line
                        key={tick}
                        x1={0}
                        x2={270}
                        y1={100 - tick}
                        y2={100 - tick}
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray="3 3"
                      />
                    ))}
                    <polyline
                      points={progressChartPoints
                        .map((p) => `${p.x},${p.y}`)
                        .join(" ")}
                      fill="none"
                      stroke="rgb(6 199 200)"
                      strokeWidth="2.5"
                    />
                    {progressChartPoints.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="rgb(6 199 200)"
                        stroke="white"
                        strokeWidth="1"
                      />
                    ))}
                  </svg>
                </div>
                <div className="mt-1 flex pl-7 text-[8px] text-muted-foreground/70">
                  <div className="flex flex-1 justify-between">
                    {progressChartData.map((point) => (
                      <span key={point.date}>{point.date}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Workout History Log
                </p>
                <div className="mt-1.5 space-y-1">
                  {progressChartData
                    .slice()
                    .reverse()
                    .map((point) => (
                      <div
                        key={point.date}
                        className="flex items-center justify-between border-b border-white/5 py-1 text-[10px] font-semibold text-white last:border-0"
                      >
                        <span className="text-muted-foreground">
                          {point.date}
                        </span>
                        <span>Best: {point.weight}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-10 lg:pb-24">
          <div className="mk-reveal flex flex-col items-start gap-6 rounded-2xl border border-primary/20 bg-[linear-gradient(120deg,rgba(6,199,200,0.12)_0%,rgba(18,32,50,0.6)_58%,rgba(6,199,200,0.08)_100%)] px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:px-10 sm:py-10">
            <div className="flex items-center gap-4">
              <HexMark className="hidden size-12 sm:inline-flex" />
              <div>
                <h3 className="font-display text-2xl tracking-tight text-white sm:text-3xl">
                  Ready to get started?
                </h3>
                <p className="mt-2 max-w-xl text-body text-muted-foreground">
                  Create your free account and start tracking your first
                  workout in under two minutes.
                </p>
              </div>
            </div>

            <div className="flex w-full sm:w-auto">
              <Link
                to="/register"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-brand-glow transition hover:bg-primary-hover sm:w-auto"
              >
                Start Free Today
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line-subtle">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-10">
          <span>&copy; {new Date().getFullYear()} ARQLIFT</span>
          <Link
            to="/contact"
            className="font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default MarketingPage;
