import { clsx, type ClassValue } from "clsx";
import { formatDistanceToNowStrict, isBefore, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";
import type { LeadUrgency, Task } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortTime(value?: string | null) {
  if (!value) return "No activity";
  return `${formatDistanceToNowStrict(parseISO(value), { addSuffix: true })}`;
}

export function isOverdue(task: Task) {
  return task.status === "open" && isBefore(parseISO(task.due_at), new Date());
}

export function urgencyClasses(urgency: LeadUrgency) {
  const classes: Record<LeadUrgency, string> = {
    low: "bg-slate-100 text-slate-700",
    normal: "bg-sky/10 text-sky",
    high: "bg-amber/15 text-amber",
    emergency: "bg-rust/15 text-rust"
  };

  return classes[urgency];
}

export function sourceLabel(source: string) {
  if (source === "email_stub") return "Email";
  return source.toUpperCase();
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
