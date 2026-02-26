"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  MessageSquare,
  BookOpen,
  UserCircle,
  Sun,
  Moon,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import MonichsLogo from "@/components/MonichsLogo";

interface SidebarProps {
  userRole: "ADMIN" | "MEMBER";
  userName: string;
}

const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/progetti", label: "Progetti", icon: FolderKanban },
  { href: "/team", label: "Team", icon: Users },
  { href: "/chat", label: "Chat AI", icon: MessageSquare },
  { href: "/guida", label: "Guida", icon: BookOpen },
  { href: "/profilo", label: "Profilo", icon: UserCircle },
];

const memberNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/progetti", label: "Progetti", icon: FolderKanban },
  { href: "/chat", label: "Chat AI", icon: MessageSquare },
  { href: "/guida", label: "Guida", icon: BookOpen },
  { href: "/profilo", label: "Profilo", icon: UserCircle },
];

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const navItems = userRole === "ADMIN" ? adminNavItems : memberNavItems;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:fixed lg:inset-y-0 bg-card border-r border-border z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <MonichsLogo size={32} className="text-gold shrink-0" />
          <div>
            <h1 className="text-base font-semibold text-text-primary leading-tight">
              Monichs
            </h1>
            <p className="text-xs text-text-muted">Gestionale Interno</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-gold/10 text-gold font-medium"
                    : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Dropbox link */}
          <a
            href="https://www.dropbox.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-card-hover hover:text-text-primary transition-colors"
          >
            <ExternalLink size={18} strokeWidth={1.5} />
            <span>Dropbox</span>
          </a>
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-3 border-t border-border space-y-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-card-hover hover:text-text-primary transition-colors w-full"
          >
            {theme === "dark" ? (
              <Sun size={18} strokeWidth={1.5} />
            ) : (
              <Moon size={18} strokeWidth={1.5} />
            )}
            <span>{theme === "dark" ? "Tema Chiaro" : "Tema Scuro"}</span>
          </button>

          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-gold font-medium text-xs shrink-0">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {userName}
              </p>
              <p className="text-xs text-text-muted">
                {userRole === "ADMIN" ? "Admin" : "Membro"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-text-muted hover:text-danger transition-colors"
              title="Esci"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-40 px-1 py-1.5 safe-area-pb">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] transition-colors",
                  isActive
                    ? "text-gold font-medium"
                    : "text-text-muted"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
