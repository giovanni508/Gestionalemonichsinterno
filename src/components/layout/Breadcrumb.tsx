"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  progetti: "Progetti",
  nuovo: "Nuovo Progetto",
  team: "Team",
  chat: "Chat AI",
  guida: "Guida",
  profilo: "Profilo",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
      <Link href="/dashboard" className="hover:text-gold transition-colors">
        Home
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        const label = pathLabels[segment] || segment;

        return (
          <span key={href} className="flex items-center gap-2">
            <span className="text-text-muted">/</span>
            {isLast ? (
              <span className="text-text-primary font-semibold">{label}</span>
            ) : (
              <Link href={href} className="hover:text-gold transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}

      {/* Help button */}
      <Link
        href="/guida"
        className="ml-auto w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-gold hover:border-gold transition-colors"
        title="Apri la guida"
      >
        ?
      </Link>
    </nav>
  );
}
