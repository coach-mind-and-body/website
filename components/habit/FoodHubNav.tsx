"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ShoppingCart } from "lucide-react";

const ITEMS = [
  { href: "/habit-tracker/recipes", label: "Recipes", icon: BookOpen, match: (p: string) => p.startsWith("/habit-tracker/recipes") },
  { href: "/habit-tracker/meal-plan", label: "This week", icon: CalendarDays, match: (p: string) => p.startsWith("/habit-tracker/meal-plan") },
  { href: "/habit-tracker/shop", label: "Shop", icon: ShoppingCart, match: (p: string) => p.startsWith("/habit-tracker/shop") },
];

export default function FoodHubNav() {
  const pathname = usePathname() || "";
  return (
    <div className="flex gap-1 p-1 rounded-full bg-white border mb-4" style={{ borderColor: "#f0e8e4" }}>
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-bold transition-all ${
              active ? "text-white shadow-sm" : "text-[#6b7a6b]"
            }`}
            style={{ background: active ? "#2d3b2d" : "transparent" }}
          >
            <Icon size={14} strokeWidth={active ? 2.4 : 2} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
