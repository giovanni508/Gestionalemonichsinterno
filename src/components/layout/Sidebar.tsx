"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole: "ADMIN" | "MEMBER";
  userName: string;
}

const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/progetti", label: "Progetti", icon: "📁" },
  { href: "/team", label: "Team", icon: "👥" },
  { href: "/chat", label: "Chat AI", icon: "💬" },
  { href: "/guida", label: "Guida", icon: "📖" },
  { href: "/profilo", label: "Profilo", icon: "👤" },
];

const memberNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/progetti", label: "Progetti", icon: "📁" },
  { href: "/chat", label: "Chat AI", icon: "💬" },
  { href: "/guida", label: "Guida", icon: "📖" },
  { href: "/profilo", label: "Profilo", icon: "👤" },
];

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const navItems = userRole === "ADMIN" ? adminNavItems : memberNavItems;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-black font-semibold text-lg">
            M
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary">
              Monichs
            </h1>
            <p className="text-sm text-text-secondary">Gestionale</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors",
                  isActive
                    ? "bg-gold/10 text-gold font-semibold"
                    : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
                )}
              >
                <span className="text-xl" role="img" aria-label={item.label}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold font-semibold text-sm">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {userName}
              </p>
              <p className="text-xs text-text-secondary">
                {userRole === "ADMIN" ? "Amministratore" : "Membro"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-40 px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors",
                  isActive
                    ? "text-gold font-semibold"
                    : "text-text-secondary"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
