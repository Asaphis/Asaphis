"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isPublicNavActive,
  publicNavItems,
} from "@/lib/public-navigation";
import { usePathname } from "next/navigation";

export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("nav-locked", mobileNavOpen);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("nav-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileNavOpen]);

  return (
    <div className="app-root">
      <a className="skip-link" href="#app-main">
        Skip to main content
      </a>
      <header className="public-header">
        <div className="site-shell header-inner">
          <Link className="brand-lockup" href="/" aria-label="AsaPhis home">
            <span className="brand-mark">A</span>
            <span>
              <strong>AsaPhis ORG</strong>
              <small>Knowledge · community · future</small>
            </span>
          </Link>
          <nav className="public-links" aria-label="Public navigation">
            {publicNavItems.map((item) => {
              const active = isPublicNavActive(pathname, item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={active ? "is-active" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="header-actions">
            <Button
              asChild
              type="button"
              variant="ghost"
              className="ap-control ap-control-quiet"
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button
              asChild
              type="button"
              className="ap-control ap-control-primary"
            >
              <Link href="/join">
                Join the Journey <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="public-mobile-menu ap-icon-button"
              aria-label="Open public navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={19} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <div
          className="public-mobile-nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Public navigation"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="public-mobile-nav-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <div>
                <p className="eyebrow">Public navigation</p>
                <h2>Where next?</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ap-icon-button"
                aria-label="Close public navigation"
                onClick={() => setMobileNavOpen(false)}
              >
                <X size={19} aria-hidden="true" />
              </Button>
            </div>
            <nav
              className="public-mobile-links"
              aria-label="Mobile public navigation"
            >
              {publicNavItems.map((item) => {
                const active = isPublicNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={active ? "is-active" : undefined}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    {item.label}
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                );
              })}
            </nav>
            <div className="public-mobile-actions">
              <Button
                asChild
                type="button"
                variant="outline"
                className="ap-control ap-control-outline"
              >
                <Link href="/login" onClick={() => setMobileNavOpen(false)}>
                  Member login
                </Link>
              </Button>
              <Button
                asChild
                type="button"
                className="ap-control ap-control-primary"
              >
                <Link href="/join" onClick={() => setMobileNavOpen(false)}>
                  Join the Journey <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <main id="app-main" className="app-main">
        {children}
      </main>

      <footer className="site-footer">
        <div className="site-shell footer-inner">
          <span>© 2026 AsaPhis ORG</span>
          <nav className="footer-links" aria-label="Footer navigation">
            {publicNavItems.slice(1).map((item) => (
              <Link key={item.key} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <span>
            <BookOpen size={13} aria-hidden="true" /> Education before noise
          </span>
        </div>
      </footer>
    </div>
  );
}
