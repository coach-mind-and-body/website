"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CreditCard,
  FolderOpen,
  LayoutList,
  Link2,
  Megaphone,
  Target,
  Users,
} from "lucide-react";
import { ADMIN_SECTION_IDS, ADMIN_SECTION_LABELS, type AdminSectionId } from "@/lib/adminNav";

export type { AdminSectionId };

const ICONS: Record<AdminSectionId, LucideIcon> = {
  overview: BarChart3,
  programs: LayoutList,
  people: Users,
  library: FolderOpen,
  marketing: Megaphone,
  engagement: Target,
  deposits: CreditCard,
  settings: Link2,
};

export const TABS: { id: AdminSectionId; label: string; icon: LucideIcon }[] = ADMIN_SECTION_IDS.map((id) => ({
  id,
  label: ADMIN_SECTION_LABELS[id],
  icon: ICONS[id],
}));
