import * as React from "react";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  Clock,
  FlaskConical,
  Layers,
  Lock,
  Microscope,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  Star,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "@/store/router";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { RenderLiveCheckModal } from "@/components/shared/RenderLiveCheckModal";
import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { equipmentApi } from "@/lib/api/equipmentApi";

// ---------------------------------------------------------------------------
// LabFlow · public landing page
// Colorful, interactive version with gradients and animations
// ---------------------------------------------------------------------------

type IconType = React.ComponentType<{ className?: string }>;

type Feature = {
  icon: IconType;
  title: string;
  description: string;
  gradient: string;
  bgGradient: string;
};

const FEATURES: Feature[] = [
  {
    icon: Microscope,
    title: "Equipment Catalog",
    description:
      "One searchable catalog of every shared instrument — with specs, location, and live availability at a glance.",
    gradient: "from-violet-500 to-purple-600",
    bgGradient: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    icon: Layers,
    title: "Conflict-Free Booking",
    description:
      "Double-booking is impossible. Auto-waitlist handles clashes and promotes the next researcher automatically.",
    gradient: "from-emerald-500 to-teal-600",
    bgGradient: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    icon: CalendarDays,
    title: "Shared Calendar",
    description:
      "A single calendar across every piece of equipment — see your lab's week at a glance and plan around it.",
    gradient: "from-amber-500 to-orange-600",
    bgGradient: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    description:
      "Six roles, from Researcher to System Admin — each with exactly the right level of access, enforced everywhere.",
    gradient: "from-pink-500 to-rose-600",
    bgGradient: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    icon: Check,
    title: "Approval Workflow",
    description:
      "Lab managers review each request with one click. Researchers are notified the instant a decision is made.",
    gradient: "from-blue-500 to-indigo-600",
    bgGradient: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Smart Analytics",
    description:
      "Clear charts reveal which equipment is over- or under-used — so procurement and budgets land right.",
    gradient: "from-cyan-500 to-sky-600",
    bgGradient: "bg-cyan-50 dark:bg-cyan-950/30",
  },
];

type RoleInfo = {
  name: string;
  icon: IconType;
  fullExperience: boolean;
  blurb: string;
  color: string;
  bgGradient: string;
};

const ROLES: RoleInfo[] = [
  {
    name: "Researcher",
    icon: FlaskConical,
    fullExperience: true,
    blurb: "Book equipment, track sessions, manage waitlists.",
    color: "from-violet-500 to-purple-600",
    bgGradient: "hover:bg-violet-50 dark:hover:bg-violet-950/30",
  },
  {
    name: "Lab Technician",
    icon: Microscope,
    fullExperience: false,
    blurb: "Browse the catalog and check availability.",
    color: "from-emerald-500 to-teal-600",
    bgGradient: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
  },
  {
    name: "Lab Manager",
    icon: ShieldCheck,
    fullExperience: true,
    blurb: "Approve bookings, manage equipment, view analytics.",
    color: "from-amber-500 to-orange-600",
    bgGradient: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
  },
  {
    name: "Department Head",
    icon: Users,
    fullExperience: false,
    blurb: "Oversee utilization across the department.",
    color: "from-blue-500 to-indigo-600",
    bgGradient: "hover:bg-blue-50 dark:hover:bg-blue-950/30",
  },
  {
    name: "Institution Admin",
    icon: Layers,
    fullExperience: false,
    blurb: "Provision accounts and departments at scale.",
    color: "from-pink-500 to-rose-600",
    bgGradient: "hover:bg-pink-50 dark:hover:bg-pink-950/30",
  },
  {
    name: "System Admin",
    icon: Lock,
    fullExperience: false,
    blurb: "Keep the platform healthy, secure, and up to date.",
    color: "from-slate-500 to-gray-600",
    bgGradient: "hover:bg-slate-50 dark:hover:bg-slate-950/30",
  },
];

const LIFECYCLE: string[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

const LIFECYCLE_COLORS = [
  "from-amber-400 to-yellow-500",
  "from-blue-400 to-cyan-500",
  "from-violet-400 to-purple-500",
  "from-emerald-400 to-green-500",
];

const CHART_BARS: number[] = [40, 62, 50, 80, 58, 95, 70];

export default function LandingPage() {
  const { navigate } = useRouter();
  const goSignIn = () => navigate("/login");
  const goRegister = () => navigate("/register");

  // Popup modal to check Render backend live connection
  const [showCheckModal, setShowCheckModal] = React.useState(true);

  const { data: equipment, refetch: refetchEquipment } = useAsync(
    () => equipmentApi.getAllEquipment().catch(() => []),
    [],
  );
  const equipmentCount = equipment?.length ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Backend Render live check popup */}
      <RenderLiveCheckModal
        open={showCheckModal}
        onClose={() => setShowCheckModal(false)}
        renderUrl="https://lab-resource-utilization-platform.onrender.com/"
        onLiveConfirmed={refetchEquipment}
      />

      {/* Animated gradient background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-400/20 to-purple-600/20 blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] right-[-15%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-cyan-400/15 to-blue-600/15 blur-[140px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-emerald-400/15 to-teal-600/15 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[20%] right-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-400/15 to-orange-600/15 blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <TopNav onSignIn={goSignIn} onRegister={goRegister} />

      <main>
        <Hero
          onGetStarted={goRegister}
          onSignIn={goSignIn}
          equipmentCount={equipmentCount}
        />
        <StatStrip equipmentCount={equipmentCount} />
        <Features />
        <Roles />
        <BookingLifecycle />
        <FinalCTA onGetStarted={goRegister} />
      </main>

      <Footer onSignIn={goSignIn} onRegister={goRegister} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top navigation — colorful, sticky, with logo + auth CTAs
// ---------------------------------------------------------------------------
function TopNav({
  onSignIn,
  onRegister,
}: {
  onSignIn: () => void;
  onRegister: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border/40 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div
            className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300"
            aria-hidden="true"
          >
            <FlaskConical className="size-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight gradient-text">LabFlow</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">
              Equipment Booking
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignIn}
            className="hidden sm:inline-flex rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
          >
            Sign in
          </Button>
          <Button
            size="sm"
            onClick={onRegister}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-md hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300"
          >
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Hero — colorful headline, CTAs, and animated preview
// ---------------------------------------------------------------------------
function Hero({
  onGetStarted,
  onSignIn,
  equipmentCount,
}: {
  onGetStarted: () => void;
  onSignIn: () => void;
  equipmentCount: number;
}) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
      <div className="flex flex-col items-center text-center relative z-10">
        {/* Animated badge */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 border border-violet-200 dark:border-violet-800 shadow-sm hover:shadow-md transition-shadow">
          <Sparkles className="size-4 text-violet-600 dark:text-violet-400" />
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Built for university research labs</span>
        </div>

        {/* Gradient headline */}
        <h1 className="mt-6 text-pretty text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl">
          <span className="gradient-text">Bring order</span>
          <br />
          <span className="text-foreground">to your shared</span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">lab equipment</span>
        </h1>

        <p className="mt-6 text-pretty text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          LabFlow is the calm, conflict-free booking system for university
          research labs — one calendar for every instrument, with role-based
          access and utilization analytics built in.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Button
            size="lg"
            onClick={onGetStarted}
            className="rounded-xl h-12 px-8 has-[>svg]:px-6 text-base font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:shadow-violet-500/25 transition-all duration-300 hover:scale-105"
          >
            Get started — it&apos;s free
            <ArrowRight className="size-4 ml-1" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onSignIn}
            className="rounded-xl h-12 px-8 has-[>svg]:px-6 text-base font-medium border-2 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 hover:text-white hover:border-transparent transition-all duration-300"
          >
            Sign in
          </Button>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5 text-emerald-500" />
          <span>No credit card · University-grade access control</span>
        </div>
      </div>

      {/* Animated chart preview */}
      <div className="mt-16 rounded-3xl overflow-hidden">
        <div className="rounded-2xl glass shadow-float border border-border/40 p-6 sm:p-8 bg-gradient-to-br from-card to-violet-50/50 dark:to-violet-950/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-full bg-red-400 animate-pulse" />
              <div className="size-3 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="size-3 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <div className="flex-1 text-center text-sm text-muted-foreground font-medium">
              📊 Equipment Utilization Overview
            </div>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-200 dark:border-violet-800 p-4 text-center">
              <div className="text-3xl font-bold gradient-text">{equipmentCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Equipment</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">7</div>
              <div className="text-xs text-muted-foreground mt-1">Booking States</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-800 p-4 text-center">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">6</div>
              <div className="text-xs text-muted-foreground mt-1">User Roles</div>
            </div>
          </div>
          
          {/* Animated bars */}
          <div className="flex items-end justify-center gap-3 h-32">
            {CHART_BARS.map((h, i) => (
              <div
                key={i}
                className="flex-1 max-w-[60px] rounded-t-lg transition-all duration-500 hover:scale-y-110 hover:brightness-110 cursor-pointer"
                style={{
                  height: `${h}%`,
                  background: `linear-gradient(to top, ${
                    i % 3 === 0 ? 'oklch(0.58 0.22 280), oklch(0.65 0.2 280)' :
                    i % 3 === 1 ? 'oklch(0.7 0.18 145), oklch(0.65 0.15 165)' :
                    'oklch(0.7 0.2 45), oklch(0.65 0.22 30)'
                  })`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          
          <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600" />
              Equipment A
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" />
              Equipment B
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600" />
              Equipment C
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stat strip — quick numbers
// ---------------------------------------------------------------------------
function StatStrip({ equipmentCount }: { equipmentCount: number }) {
  const stats = [
    { label: "Equipment Items", value: equipmentCount, color: "text-violet-600" },
    { label: "Active Bookings", value: "24/7", color: "text-emerald-600" },
    { label: "User Roles", value: "6", color: "text-amber-600" },
    { label: "Status States", value: "8", color: "text-pink-600" },
  ];

  return (
    <section className="border-y border-border/40 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className={cn("text-3xl font-bold", s.color)}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Features — colorful grid with gradient icons
// ---------------------------------------------------------------------------
function Features() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800 mb-4">
          <Zap className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Powerful Features</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Everything you need to manage <span className="gradient-text">lab equipment</span>
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          From booking to analytics, LabFlow provides all the tools your lab needs.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={cn(
              "group rounded-2xl border border-border/40 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-transparent",
              f.bgGradient
            )}
          >
            <div
              className={cn(
                "size-12 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300",
                f.gradient
              )}
              aria-hidden="true"
            >
              <f.icon className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">
              {f.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Roles — 6 colorful chips with gradient badges
// ---------------------------------------------------------------------------
function Roles() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-800 mb-4">
          <Star className="size-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">User Roles</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Built for <span className="gradient-text">every role</span> in the lab
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Six distinct roles, each with precisely calibrated permissions.
        </p>
      </div>

      <div className="rounded-3xl glass shadow-soft p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <div
              key={r.name}
              className={cn(
                "rounded-2xl border border-border/40 p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-transparent",
                r.bgGradient
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "size-11 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-md",
                    r.color
                  )}
                  aria-hidden="true"
                >
                  <r.icon className="size-5" />
                </div>
                {r.fullExperience ? (
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm">
                    Full access
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shadow-sm">
                    Browse only
                  </Badge>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">
                  {r.name}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {r.blurb}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Booking lifecycle — colorful horizontal flow
// ---------------------------------------------------------------------------
function BookingLifecycle() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="rounded-3xl glass shadow-soft p-6 sm:p-10 bg-gradient-to-br from-card to-slate-50/50 dark:to-slate-900/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 mb-4">
            <BarChart3 className="size-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Booking Lifecycle</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            A predictable, <span className="gradient-text">enforced workflow</span>
          </h2>
        </div>

        <div className="flex flex-col items-center gap-6">
          {/* Main flow with colored pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {LIFECYCLE.map((s, i) => (
              <React.Fragment key={s}>
                <div className={cn(
                  "rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg hover:scale-105 transition-transform",
                  "bg-gradient-to-r " + LIFECYCLE_COLORS[i]
                )}>
                  {s}
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <ArrowRight
                    className="size-5 text-muted-foreground animate-pulse"
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Waitlist branch */}
          <div className="flex items-center gap-3 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 px-5 py-2.5 border border-pink-200 dark:border-pink-800">
            <Clock className="size-4 text-pink-600 dark:text-pink-400" />
            <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
              WAITLIST
            </span>
            <span className="text-pink-400">·</span>
            <span className="text-xs text-pink-600 dark:text-pink-400">auto-promotes on cancellation</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Final CTA — colorful gradient band
// ---------------------------------------------------------------------------
function FinalCTA({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 shadow-2xl p-10 sm:p-14 text-center relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        
        <div className="relative z-10">
          <h2 className="text-balance text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Ready to bring order to your lab?
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            Get started in minutes. No credit card, no procurement nightmare —
            just calmer shared equipment for everyone in your department.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={onGetStarted}
              className="rounded-xl h-12 px-8 has-[>svg]:px-6 text-base font-semibold bg-white text-violet-700 hover:bg-white/90 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Get started
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer — minimal, with gradient logo
// ---------------------------------------------------------------------------
function Footer({
  onSignIn,
  onRegister,
}: {
  onSignIn: () => void;
  onRegister: () => void;
}) {
  return (
    <footer className="border-t border-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="size-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center"
            aria-hidden="true"
          >
            <FlaskConical className="size-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold gradient-text">LabFlow</span>
            <span className="mt-0.5 text-xs text-muted-foreground">
              Calmer shared labs.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignIn}
            className="rounded-xl"
          >
            Sign in
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegister}
            className="rounded-xl"
          >
            Register
          </Button>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            © 2026 LabFlow
          </span>
        </div>
      </div>
    </footer>
  );
}
