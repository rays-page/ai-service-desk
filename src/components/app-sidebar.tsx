"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Gauge,
  Inbox,
  KanbanSquare,
  LogOut,
  Settings,
  Sparkles
} from "lucide-react";
import { signOutAction } from "@/app/actions";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppSidebar({ businessName, demoMode }: { businessName: string; demoMode: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-r border-line bg-ink text-white md:w-64">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-ink">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">AI Service Desk</p>
          <p className="truncate text-xs text-white/60">{businessName}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                active ? "bg-white text-ink" : "text-white/72 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        {demoMode ? <p className="px-3 py-2 text-xs text-white/55">Demo data active</p> : null}
        <form action={signOutAction}>
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/72 transition hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
