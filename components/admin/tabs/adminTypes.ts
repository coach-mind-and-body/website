"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Cookie,
  CreditCard,
  Layers,
  Link2,
  Megaphone,
  Target,
  UserPlus,
  Users,
  Video,
} from "lucide-react";

export type AdminTab =
  | "overview"
  | "contacts"
  | "crm-automations"
  | "snackhack"
  | "fpu"
  | "fpugroup"
  | "programbuilder"
  | "engagement"
  | "blog"
  | "deposits"
  | "settings"
  | "pageeditor";

export const ADMIN_TAB_IDS: AdminTab[] = [
  "overview",
  "contacts",
  "crm-automations",
  "snackhack",
  "fpu",
  "fpugroup",
  "programbuilder",
  "engagement",
  "blog",
  "deposits",
  "settings",
  "pageeditor",
];

export const TABS: { id: AdminTab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "crm-automations", label: "CRM & AI", icon: Megaphone },
  { id: "snackhack", label: "Snack Hack Leads", icon: Cookie },
  { id: "fpu", label: "FPU Coaching", icon: Video },
  { id: "fpugroup", label: "FPU Sign-Ups", icon: UserPlus },
  { id: "programbuilder", label: "Program Builder", icon: Layers },
  { id: "engagement", label: "Habit Tracker", icon: Target },
  { id: "pageeditor", label: "Edit Financial Peace", icon: BookOpen },
  { id: "blog", label: "Blog", icon: BookOpen },
  { id: "deposits", label: "Payments", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Link2 },
];