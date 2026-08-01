"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Compass,
  PenTool,
  Users,
  Workflow,
  CreditCard,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Lock,
  Library,
  Heart,
  LayoutTemplate,
  HelpCircle,
  Bell,
  Coins,
  Moon,
  Sun,
  BrainIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import Image from "next/image";
import { useBilling } from "@/hooks/use-billing";
import get from "lodash/get";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  proOnly?: boolean;
};

type NavGroup = {
  items: NavItem[];
};

const primaryNav: NavItem[] = [
  { name: "Write your ideas", href: "/write-ideas", icon: PenTool },
  { name: "chat bot ", href: "/chat-bot", icon: BrainIcon },
  // { name: "Discover", href: "/discover", icon: Compass, proOnly: true },
  // { name: "Create", href: "/create", icon: PenTool, proOnly: true },
  // {
  //   name: "Collaborations",
  //   href: "/collaborations",
  //   icon: Users,
  //   proOnly: true,
  // },
  // { name: "Workflow", href: "/workflow", icon: Workflow, proOnly: true },
];

const libraryNav: NavItem[] = [
  // { name: "Library", href: "/library", icon: Library },
  // { name: "Favorites", href: "/favorites", icon: Heart },
  // { name: "Templates", href: "/templates", icon: LayoutTemplate },
];

const utilityNav: NavItem[] = [
  { name: "Billing", href: "/billing", icon: CreditCard },
  // { name: "Settings", href: "/settings", icon: Settings },
  // { name: "Help & Support", href: "/help", icon: HelpCircle },
];

const navGroups: NavGroup[] = [
  { items: primaryNav },
  // { items: libraryNav },
  { items: utilityNav },
];

const allNavItems = [...primaryNav, ...libraryNav, ...utilityNav];

const IconGradientDef = () => (
  <svg width="0" height="0" className="absolute" aria-hidden="true">
    <defs>
      <linearGradient
        id="active-icon-gradient"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
      >
        <stop stopColor="#818cf8" offset="0%" />
        <stop stopColor="#c084fc" offset="100%" />
      </linearGradient>
    </defs>
  </svg>
);

function GoProCard({ showText }: { showText: boolean }) {
  if (!showText) {
    return (
      <Link
        href="/billing"
        className="mx-1 flex h-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 transition-transform hover:scale-105"
        title="Go Pro"
      >
        <Sparkles className="h-4 w-4" />
      </Link>
    );
  }

  const perks = [
    "Unlimited generations",
    "Advanced AI models",
    "Idea & content templates",
    "Export & history",
  ];

  return (
    <div className="mx-1 rounded-xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/60 to-slate-950/60 p-3.5">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-purple-300" />
        <span className="text-xs font-semibold text-slate-100">
          Go Pro. Unlock more.
        </span>
      </div>
      <ul className="mb-3 space-y-1">
        {perks.map((perk) => (
          <li
            key={perk}
            className="flex items-center gap-1.5 text-[11px] text-slate-400"
          >
            <span className="text-emerald-400">✓</span>
            {perk}
          </li>
        ))}
      </ul>
      <Button
        size="sm"
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-semibold text-white hover:from-indigo-400 hover:to-purple-400"
      >
        <Link href="/billing">Upgrade to Pro →</Link>
      </Button>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const pathname = usePathname();
  const { profile } = useProfile();
  const { subscription } = useBilling();

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  const currentPlan = subscription?.plan_name?.toLowerCase() || "free";
  const isProUser = currentPlan !== "free";
  const credits = get(profile, "credits", 0) as number;
  const planLabel = get(subscription, "plan_name", "E-com plan") as string;
  const displayName = profile?.full_name || "Foydalanuvchi";

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const showText = isMobile || sidebarOpen;

    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800/60 px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {showText && (
              <div className="flex animate-in fade-in items-center gap-2 duration-200">
                <span className="truncate text-sm font-bold tracking-tight text-white">
                  NicheFX
                </span>
              </div>
            )}
          </div>
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Menyuni yopish"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-1">
              {groupIndex > 0 && (
                <div className="mx-1 mb-2 border-t border-slate-800/60" />
              )}
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const isDisabled = Boolean(item.proOnly) && !isProUser;

                return (
                  <Link
                    key={item.href}
                    href={isDisabled ? "#" : item.href}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault();
                        return;
                      }
                      if (isMobile) setMobileOpen(false);
                    }}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-indigo-600/10 text-indigo-400"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
                      isDisabled &&
                        "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-slate-400",
                    )}
                    title={!showText ? item.name : undefined}
                  >
                    {isActive && (
                      <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gradient-to-b from-indigo-400 to-purple-400" />
                    )}
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-transform duration-200",
                        isActive ? "scale-110" : "group-hover:scale-110",
                        isDisabled && "group-hover:scale-100",
                      )}
                      style={{
                        stroke: isActive
                          ? "url(#active-icon-gradient)"
                          : "currentColor",
                      }}
                    />
                    {showText && (
                      <div className="flex flex-1 items-center justify-between truncate">
                        <span
                          className={cn(
                            "truncate transition-colors",
                            isActive &&
                              "bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent",
                          )}
                        >
                          {item.name}
                        </span>
                        {isDisabled && (
                          <span className="ml-2 flex shrink-0 items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-purple-400">
                            <Lock className="h-3 w-3" />
                            Pro
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-3 border-t border-slate-800/60 p-3">

          <button
            onClick={() => setIsDark((d) => !d)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-slate-800/60 hover:text-slate-200"
            title={!showText ? "Dark mode" : undefined}
          >
            {isDark ? (
              <Moon className="h-4 w-4 shrink-0" />
            ) : (
              <Sun className="h-4 w-4 shrink-0" />
            )}
            {showText && <span className="truncate">Dark mode</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b] font-sans text-slate-100 selection:bg-indigo-500/30">
      <IconGradientDef />

      <aside
        className={cn(
          "relative z-20 hidden h-full shrink-0 flex-col overflow-hidden border-r border-slate-800/60 bg-[#0a0a0c] transition-all duration-300 ease-in-out md:flex",
          sidebarOpen ? "w-64" : "w-20",
        )}
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 animate-in bg-black/60 fade-in backdrop-blur-sm duration-200 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col overflow-hidden border-r border-slate-800/60 bg-[#0a0a0c] shadow-2xl transition-transform duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent isMobile />
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-slate-800/60 bg-[#09090b]/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:flex"
            aria-label="Sidebarni ochish/yopish"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                !sidebarOpen && "rotate-180",
              )}
            />
          </button>

          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Menyuni ochish"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Idea Lab</span>
              <span>/</span>
              <span className="truncate text-slate-300">
                {allNavItems.find((i) => pathname.startsWith(i.href))?.name ||
                  "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs font-semibold text-amber-300 sm:flex">
              <Coins className="h-3.5 w-3.5" />
              {credits.toLocaleString("en-US")}
            </div>

            <Button
              size="sm"
              className="hidden bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-semibold text-white hover:from-indigo-400 hover:to-purple-400 sm:flex"
            >
              <Link href="/billing">Upgrade</Link>
            </Button>

            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Bildirishnomalar"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-800/60">
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900">
                      {profile?.avatar_url ? (
                        <Image
                          fill
                          src={profile.avatar_url}
                          alt={displayName}
                          sizes="56px"
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-200">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden flex-col items-start leading-tight sm:flex">
                    <span className="text-xs font-semibold text-slate-200">
                      {displayName.toUpperCase()}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">
                      {planLabel} plan
                    </span>
                  </div>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 sm:block" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 border-slate-800 bg-[#0d0d10] text-slate-200"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-slate-400">
                    {displayName}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer">
                    <Link className="p-0" href="/profile">
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer">
                    <Link href="/billing">Billing</Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="mx-auto flex h-full w-full max-w-screen-2xl flex-col overflow-y-auto p-4 duration-500 animate-in fade-in slide-in-from-bottom-4 md:p-6 lg:p-8 custom-scrollbar">
            {children}
          </div>
        </main>

        <footer className="shrink-0 border-t border-slate-800/60 bg-[#0a0a0c] px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 text-xs font-medium text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} NicheFX. All rights reserved.</p>

            <div className="flex items-center gap-6">
              <Link href="#" className="transition-colors hover:text-slate-300">
                Help
              </Link>

              <Link href="#" className="transition-colors hover:text-slate-300">
                Privacy
              </Link>

              <Link href="#" className="transition-colors hover:text-slate-300">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
