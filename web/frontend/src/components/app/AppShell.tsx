"use client";

import type { ReactNode } from "react";
import { Bell, BookOpen, Home, MessageCircle, Plus, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AppTab = "home" | "discover" | "communities" | "messages" | "learn" | "notifications" | "profile";

const LEFT_NAV: { key: AppTab; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "discover", label: "Discover", icon: Search },
  { key: "communities", label: "Communities", icon: Users },
  { key: "messages", label: "Messages", icon: MessageCircle },
  { key: "learn", label: "Learn", icon: BookOpen },
];

// One social shell: desktop 3-column, mobile bottom bar.
// Right rail content is injected per screen (suggested people, communities, official).
export function AppShell({
  tab,
  onTab,
  onCreate,
  onSearch,
  search,
  unreadMessages,
  unreadNotifications,
  initials,
  rightRail,
  children,
}: {
  tab: AppTab;
  onTab: (t: AppTab) => void;
  onCreate: () => void;
  onSearch: (q: string) => void;
  search: string;
  unreadMessages: number;
  unreadNotifications: number;
  initials: string;
  rightRail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="social-app">
      <header className="social-topbar">
        <strong className="social-brand">AsaPhis</strong>
        <div className="social-search">
          <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search AsaPhis" aria-label="Search AsaPhis" />
        </div>
        <div className="social-top-actions">
          <Button size="sm" variant="ghost" aria-label="Notifications" onClick={() => onTab("notifications")}>
            <Bell size={18} />{unreadNotifications > 0 ? <span className="social-dot">{unreadNotifications}</span> : null}
          </Button>
          <Button size="sm" variant="ghost" aria-label="Messages" onClick={() => onTab("messages")}>
            <MessageCircle size={18} />{unreadMessages > 0 ? <span className="social-dot">{unreadMessages}</span> : null}
          </Button>
          <Button size="sm" variant="ghost" aria-label="Profile" onClick={() => onTab("profile")}>
            <Avatar><AvatarFallback>{initials}</AvatarFallback></Avatar>
          </Button>
        </div>
      </header>

      <div className="social-body">
        <nav className="social-rail" aria-label="Primary">
          {LEFT_NAV.map((item) => (
            <Button key={item.key} variant={tab === item.key ? "default" : "ghost"} className="social-rail-item" onClick={() => onTab(item.key)}>
              <item.icon size={18} /> {item.label}
            </Button>
          ))}
          <Button className="social-create" onClick={onCreate}><Plus size={18} /> Create</Button>
          <Button variant="ghost" className="social-rail-item" onClick={() => onTab("profile")}>Profile</Button>
        </nav>

        <main className="social-main">{children}</main>

        <aside className="social-right" aria-label="Suggestions">{rightRail}</aside>
      </div>

      <nav className="social-bottom" aria-label="Mobile">
        <Button variant="ghost" onClick={() => onTab("home")} aria-label="Home"><Home size={20} /></Button>
        <Button variant="ghost" onClick={() => onTab("discover")} aria-label="Discover"><Search size={20} /></Button>
        <Button className="social-create-fab" onClick={onCreate} aria-label="Create"><Plus size={22} /></Button>
        <Button variant="ghost" onClick={() => onTab("communities")} aria-label="Communities"><Users size={20} /></Button>
        <Button variant="ghost" onClick={() => onTab("profile")} aria-label="Me">
          <Avatar><AvatarFallback>{initials}</AvatarFallback></Avatar>
        </Button>
      </nav>
    </div>
  );
}
