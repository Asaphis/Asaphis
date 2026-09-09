"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  FileCheck2,
  Globe2,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessagesSquare,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminAuth, type AdminArea } from "@/lib/admin-auth";
import { adminRoleLabels, type AdminRole } from "@/lib/admin-types";
import { cn } from "@/lib/utils";

const navItems: { key: AdminArea; label: string; href: string; icon: typeof Users }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "members", label: "Members", href: "/members", icon: Users },
  { key: "identity", label: "Identity & Verification", href: "/identity", icon: FileCheck2 },
  { key: "content", label: "Content", href: "/content", icon: BookOpen },
  { key: "moderation", label: "Moderation", href: "/moderation", icon: MessagesSquare },
  { key: "community", label: "Community", href: "/community", icon: HeartHandshake },
  { key: "payments", label: "Payments", href: "/payments", icon: Wallet },
  { key: "regions", label: "Regions & Countries", href: "/regions", icon: Globe2 },
  { key: "notifications", label: "Notifications", href: "/notifications", icon: Bell },
  { key: "security", label: "Security", href: "/security", icon: ShieldCheck },
  { key: "support", label: "Support", href: "/support", icon: LifeBuoy },
  { key: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings },
];

function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function AdminShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = usePathname() ?? "/dashboard";
  const router = useRouter();
  const { admin, isLoading, isAuthenticated, logout, switchRole, can } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    document.body.classList.toggle("nav-locked", mobileOpen);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("nav-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  if (isLoading || !admin) {
    return (
      <div className="admin-root">
        <main className="admin-loading">Checking your admin session…</main>
      </div>
    );
  }

  const visible = navItems.filter((item) => can(item.key));
  const activeKey = [...visible].reverse().find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.key;
  const quickNav = (["dashboard", "members", "moderation", "security"] as AdminArea[])
    .map((key) => visible.find((item) => item.key === key))
    .filter((item): item is (typeof navItems)[number] => Boolean(item));

  const sidebar = (
    <div className="admin-sidebar-inner">
      <Link href="/dashboard" className="admin-brand" onClick={() => setMobileOpen(false)}>
        <span className="brand-mark">A</span>
        <span>
          <strong>AsaPhis</strong>
          <small>Admin control center</small>
        </span>
      </Link>
      <nav className="admin-nav" aria-label="Admin navigation">
        {visible.map(({ key, label, href, icon: Icon }) => {
          const active = activeKey === key;
          return (
            <Link key={key} href={href} onClick={() => setMobileOpen(false)} className={cn("admin-nav-link", active && "is-active")} aria-current={active ? "page" : undefined}>
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="admin-sidebar-footer">
        <div className="admin-me">
          <Avatar>
            <AvatarFallback>{initialsOf(admin.name)}</AvatarFallback>
          </Avatar>
          <div>
            <strong>{admin.name}</strong>
            <span>{adminRoleLabels[admin.role]}</span>
          </div>
        </div>
        <div className="admin-role-switch">
          <span>Acting role</span>
          <Select value={admin.role} onValueChange={(v) => switchRole(v as AdminRole)}>
            <SelectTrigger className="role-select" aria-label="Switch acting role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(adminRoleLabels) as AdminRole[]).map((role) => (
                <SelectItem key={role} value={role}>
                  {adminRoleLabels[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="ghost" className="admin-logout" onClick={() => { logout(); router.push("/login"); }}>
          <LogOut size={14} aria-hidden="true" /> Log out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="admin-root">
      <a className="skip-link" href="#admin-main">Skip to main content</a>
      <aside className="admin-sidebar" aria-label="Admin sidebar">{sidebar}</aside>
      <div className="admin-content">
        <header className="admin-header">
          <button type="button" className="admin-menu-button" aria-label="Open admin navigation" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="admin-title">
            <p className="eyebrow">AsaPhis admin</p>
            <h1>{title}</h1>
            {subtitle ? <p className="admin-subtitle">{subtitle}</p> : null}
          </div>
          <div className="admin-header-meta">
            <span className="admin-role-badge">{adminRoleLabels[admin.role]}</span>
            <Avatar className="admin-avatar">
              <AvatarFallback>{initialsOf(admin.name)}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main id="admin-main" className="admin-main">{children}</main>
        <nav className="admin-bottom-nav" aria-label="Quick admin navigation">
          {quickNav.map(({ key, label, href, icon: Icon }) => (
            <Link key={key} href={href} className={activeKey === key ? "is-active" : ""} aria-current={activeKey === key ? "page" : undefined}>
              <Icon size={18} aria-hidden="true" />
              <span>{label.split(" ")[0]}</span>
            </Link>
          ))}
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open full admin navigation" aria-expanded={mobileOpen}>
            <MoreHorizontal size={18} aria-hidden="true" />
            <span>More</span>
          </button>
        </nav>
      </div>
      {mobileOpen ? (
        <div className="admin-mobile-overlay" role="dialog" aria-modal="true" aria-label="Admin navigation" onClick={() => setMobileOpen(false)}>
          <div className="admin-mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-mobile-head">
              <strong>Navigation</strong>
              <Button type="button" variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
                <X size={19} />
              </Button>
            </div>
            {sidebar}
          </div>
        </div>
      ) : null}
    </div>
  );
}
