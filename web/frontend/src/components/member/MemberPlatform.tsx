"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Globe2,
  Heart,
  Home,
  LifeBuoy,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Play,
  Search,
  Send,
  ShieldCheck,
  UserCircle,
  Video,
  X,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { StateStrip } from "@/components/shared/StateStrip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { AsaPhisApi } from "@/lib/api/contracts";
import type {
  MemberPanel,
  MemberProfile,
  NotificationCategory,
  SupportCategory,
  UpdateEntry,
} from "@/lib/types";
import { formatDate, formatContribution, memberPanelLabels } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const navGroups: {
  label: string;
  items: { key: MemberPanel; icon: typeof Home }[];
}[] = [
  {
    label: "Workspace",
    items: [
      { key: "home", icon: Home },
      { key: "education", icon: BookOpen },
      { key: "videos", icon: Video },
      { key: "documents", icon: FileText },
      { key: "updates", icon: MoreHorizontal },
      { key: "community", icon: MessageCircle },
    ],
  },
  {
    label: "Account",
    items: [
      { key: "contribute", icon: Heart },
      { key: "notifications", icon: Bell },
      { key: "profile", icon: UserCircle },
      { key: "security", icon: ShieldCheck },
      { key: "travel", icon: Globe2 },
      { key: "support", icon: LifeBuoy },
    ],
  },
];

export function MemberPlatform({
  api,
  onPublic,
  onLogout,
}: {
  api: AsaPhisApi;
  onPublic: () => void;
  onLogout: () => void;
}) {
  const [panel, setPanel] = useState<MemberPanel>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileQuery = useQuery({
    queryKey: ["member-profile"],
    queryFn: api.getMemberProfile,
  });
  // Real authenticated member only — never demo data. Null while loading.
  const profile = profileQuery.data ?? null;
  const publishedQuery = useQuery({
    queryKey: ["published-content"],
    queryFn: api.getPublishedLandingContent,
  });
  const resourcesQuery = useQuery({
    queryKey: ["education", "All", ""],
    queryFn: () => api.getEducation({}),
  });
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "All"],
    queryFn: () => api.getNotifications(),
  });
  const unreadCount = (notificationsQuery.data ?? []).filter((n) => !n.read).length;
  const updatesQuery = useQuery({
    queryKey: ["member-updates"],
    queryFn: api.listUpdates,
  });

  const navigate = (nextPanel: MemberPanel) => {
    setPanel(nextPanel);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    document.body.classList.toggle("nav-locked", mobileMenuOpen);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("nav-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="member-view">
      <div className="member-shell">
        <aside className="member-sidebar">
          <div className="member-brand">
            <span className="brand-mark">A</span>
            <span>
              <strong>AsaPhis</strong>
              <small>Member platform</small>
            </span>
          </div>
          <div className="member-sidebar-scroll">
            {navGroups.map((group) => (
              <div className="nav-group" key={group.label}>
                <p>{group.label}</p>
                {group.items.map(({ key, icon: Icon }) => (
                  <button
                    type="button"
                    key={key}
                    className={panel === key ? "is-active" : ""}
                    onClick={() => navigate(key)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{memberPanelLabels[key]}</span>
                    {key === "notifications" && unreadCount > 0 ? (
                      <span className="nav-count">{unreadCount}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="member-sidebar-footer">
            <div className="sidebar-member">
              <Avatar>
                <AvatarFallback>{profile?.initials ?? "…"}</AvatarFallback>
              </Avatar>
              <div>
                <strong>{profile?.name ?? "Loading…"}</strong>
                <span>{profile?.memberId ?? "…"}</span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="sidebar-exit"
              onClick={onPublic}
            >
              <Globe2 size={14} aria-hidden="true" /> Public site
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="sidebar-exit sidebar-logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={14} aria-hidden="true" />
              {loggingOut ? "Logging out…" : "Log out"}
            </Button>
          </div>
        </aside>
        <div className="member-content">
          <header className="member-header">
            <div className="mobile-member-brand">
              <button
                type="button"
                className="mobile-menu-button"
                aria-label="Open member navigation"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu size={21} />
              </button>
              <span className="brand-mark">A</span>
              <span>
                <strong>AsaPhis</strong>
                <small>Member platform</small>
              </span>
            </div>
            <div className="member-header-copy">
              <p className="eyebrow">Member platform</p>
              <h1>{memberPanelLabels[panel]}</h1>
            </div>
            <div className="member-header-actions">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="ap-icon-button"
                onClick={() => navigate("notifications")}
                aria-label="Open notifications"
              >
                <Bell size={17} aria-hidden="true" />
                <span className="notification-dot" />
              </Button>
              <button
                type="button"
                className="header-avatar-button"
                onClick={() => navigate("profile")}
                aria-label="Open profile"
              >
                <Avatar className="header-avatar">
                  <AvatarFallback>{profile?.initials ?? "…"}</AvatarFallback>
                </Avatar>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ap-icon-button header-logout"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={17} aria-hidden="true" />
              </Button>
            </div>
          </header>
          <main className="member-main" aria-live="polite">
            {profileQuery.isError ? (
              <StateStrip
                state="error"
                message="We could not load your member record. Your session may have expired — please log in again."
                onRetry={() => profileQuery.refetch()}
              />
            ) : (
              <MemberPanel
                panel={panel}
                api={api}
                profile={profile}
                published={publishedQuery.data ?? null}
                resourceCount={(resourcesQuery.data ?? []).length}
                updates={updatesQuery.data ?? []}
                updatesState={
                  updatesQuery.isLoading
                    ? ("loading" as const)
                    : updatesQuery.isError
                      ? ("error" as const)
                      : (updatesQuery.data ?? []).length === 0
                        ? ("empty" as const)
                        : ("success" as const)
                }
                onUpdatesRetry={() => updatesQuery.refetch()}
                navigate={navigate}
              />
            )}
          </main>
          <nav
            className="mobile-bottom-nav"
            aria-label="Member mobile navigation"
          >
            <button
              type="button"
              className={panel === "home" ? "is-active" : ""}
              onClick={() => navigate("home")}
            >
              <Home size={17} aria-hidden="true" />
              <span>Home</span>
            </button>
            <button
              type="button"
              className={panel === "education" ? "is-active" : ""}
              onClick={() => navigate("education")}
            >
              <BookOpen size={17} aria-hidden="true" />
              <span>Education</span>
            </button>
            <button
              type="button"
              className={panel === "community" ? "is-active" : ""}
              onClick={() => navigate("community")}
            >
              <MessageCircle size={17} aria-hidden="true" />
              <span>Community</span>
            </button>
            <button
              type="button"
              className={panel === "notifications" ? "is-active" : ""}
              onClick={() => navigate("notifications")}
            >
              <Bell size={17} aria-hidden="true" />
              <span>Alerts</span>
            </button>
            <button type="button" onClick={() => setMobileMenuOpen(true)}>
              <MoreHorizontal size={17} aria-hidden="true" />
              <span>More</span>
            </button>
          </nav>
        </div>
      </div>
      {mobileMenuOpen ? (
        <div
          className="mobile-nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Member navigation"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="mobile-nav-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <div>
                <p className="eyebrow">Member navigation</p>
                <h2>Where next?</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ap-icon-button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
              >
                <X size={19} />
              </Button>
            </div>
            {navGroups.map((group) => (
              <div className="mobile-nav-group" key={group.label}>
                <p>{group.label}</p>
                {group.items.map(({ key, icon: Icon }) => (
                  <button
                    type="button"
                    className={panel === key ? "is-active" : ""}
                    key={key}
                    onClick={() => navigate(key)}
                  >
                    <Icon size={17} aria-hidden="true" />
                    {memberPanelLabels[key]}
                    <ChevronRight
                      className="ml-auto"
                      size={15}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            ))}
            <div className="mobile-nav-footer">
              <Button
                type="button"
                variant="outline"
                className="ap-control ap-control-outline full-button"
                onClick={onPublic}
              >
                <Globe2 size={15} aria-hidden="true" /> Public site
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="ap-control full-button"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut size={15} aria-hidden="true" />
                {loggingOut ? "Logging out…" : "Log out"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MemberPanel({
  panel,
  api,
  profile,
  published,
  resourceCount,
  updates,
  updatesState,
  onUpdatesRetry,
  navigate,
}: {
  panel: MemberPanel;
  api: AsaPhisApi;
  profile: MemberProfile | null;
  published: import("@/lib/types").PublicContent | null;
  resourceCount: number;
  updates: UpdateEntry[];
  updatesState: "loading" | "error" | "empty" | "success";
  onUpdatesRetry: () => void;
  navigate: (panel: MemberPanel) => void;
}) {
  switch (panel) {
    case "home":
      return (
        <HomePanel
          profile={profile}
          featured={published?.featuredMessage ?? null}
          resourceCount={resourceCount}
          latestUpdate={updates[0] ?? null}
          navigate={navigate}
        />
      );
    case "education":
      return <EducationPanel api={api} />;
    case "videos":
      return <VideosPanel api={api} />;
    case "documents":
      return <DocumentsPanel api={api} />;
    case "updates":
      return <UpdatesPanel updates={updates} state={updatesState} onRetry={onUpdatesRetry} />;
    case "community":
      return <CommunityPanel api={api} profile={profile} />;
    case "contribute":
      return <ContributePanel api={api} />;
    case "notifications":
      return <NotificationsPanel api={api} />;
    case "profile":
      return <ProfilePanel profile={profile} navigate={navigate} />;
    case "security":
      return <SecurityPanel api={api} profile={profile} navigate={navigate} />;
    case "travel":
      return <TravelPanel api={api} />;
    case "support":
      return <SupportPanel api={api} />;
  }
}

function PanelHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function HomePanel({
  profile,
  featured,
  resourceCount,
  latestUpdate,
  navigate,
}: {
  profile: MemberProfile | null;
  featured: import("@/lib/types").FeaturedMessage | null;
  resourceCount: number;
  latestUpdate: UpdateEntry | null;
  navigate: (panel: MemberPanel) => void;
}) {
  const firstName = (profile?.name ?? "").trim().split(" ")[0] || "there";
  return (
    <div>
      <PanelHeader
        eyebrow="Your workspace"
        title={`Good morning, ${firstName}.`}
        description="A focused place for learning, updates, careful participation, and account support."
        action={<StatusBadge status={profile ? (profile.accountStatus === "active" ? "Active" : "Limited") : "Loading"} />}
      />
      <div className="home-grid">
        {featured ? (
          <Card className="home-feature">
            <div className="home-feature-media">
              <img
                src={featured.posterUrl}
                alt={featured.posterAlt}
              />
              <span className="media-play">
                <Play size={17} fill="currentColor" aria-hidden="true" />
              </span>
            </div>
            <div className="home-feature-copy">
              <p className="eyebrow">Featured message</p>
              <h3>{featured.title}</h3>
              <p>{featured.description}</p>
              <Button
                type="button"
                variant="link"
                className="ap-link-button"
                onClick={() => navigate("videos")}
              >
                Watch message <ArrowRight size={14} aria-hidden="true" />
              </Button>
            </div>
          </Card>
        ) : null}
        <Card className="welcome-card">
          <p className="eyebrow">Member since</p>
          <strong>{profile ? formatDate(profile.joinedAt) : "…"}</strong>
          <p>Member ID · {profile?.memberId || "…"}</p>
          <Separator />
          <div className="verification-summary">
            <span>
              <Check size={14} aria-hidden="true" />{" "}
              {profile ? (profile.identityVerified ? "Identity verified" : "Identity pending") : "…"}
            </span>
            <span>
              <Check size={14} aria-hidden="true" />{" "}
              {profile ? (profile.phoneVerified ? "Phone verified" : "Phone pending") : "…"}
            </span>
          </div>
        </Card>
        {latestUpdate ? (
          <Card className="latest-update">
            <div className="card-header-row">
              <div>
                <p className="eyebrow">Latest update</p>
                <h3>{latestUpdate.title}</h3>
              </div>
              <StatusBadge status="Published" />
            </div>
            <p>{latestUpdate.body}</p>
            <Button
              type="button"
              variant="link"
              className="ap-link-button"
              onClick={() => navigate("updates")}
            >
              Read the Journal <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </Card>
        ) : null}
        <div className="quick-links">
          <QuickLink
            icon={BookOpen}
            title="Education"
            body={
              resourceCount > 0
                ? `Browse ${resourceCount} member resources.`
                : "Education resources will appear here."
            }
            onClick={() => navigate("education")}
          />
          <QuickLink
            icon={MessageCircle}
            title="Community"
            body="Read moderated conversations."
            onClick={() => navigate("community")}
          />
          <QuickLink
            icon={Bell}
            title="Notifications"
            body="Review your latest updates."
            onClick={() => navigate("notifications")}
          />
          <QuickLink
            icon={Heart}
            title="Contribute"
            body="Review contribution status."
            onClick={() => navigate("contribute")}
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  icon: Icon,
  title,
  body,
  onClick,
}: {
  icon: typeof BookOpen;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="quick-link" onClick={onClick}>
      <span className="quick-icon">
        <Icon size={17} aria-hidden="true" />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{body}</small>
      </span>
      <ArrowRight size={14} aria-hidden="true" />
    </button>
  );
}

function EducationPanel({ api }: { api: AsaPhisApi }) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["education", category, search],
    queryFn: () => api.getEducation({ category, search }),
  });
  const resources = query.data ?? [];
  const shownResources = resources;
  const collectionState = query.isLoading
    ? ("loading" as const)
    : query.isError
      ? ("error" as const)
      : shownResources.length === 0
        ? ("empty" as const)
        : ("success" as const);
  return (
    <div>
      <PanelHeader
        eyebrow="Learning library"
        title="Education"
        description="Search and filter your authorized learning materials."
        action={<StatusBadge status="Verified" />}
      />
      <div className="toolbar">
        <div className="search-field">
          <Search size={16} aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search resources"
            aria-label="Search education resources"
          />
        </div>
        <div
          className="filter-row"
          role="group"
          aria-label="Education categories"
        >
          {[
            "All",
            "History",
            "Culture",
            "Development",
            "Technology",
            "Community knowledge",
          ].map((item) => (
            <button
              type="button"
              className={category === item ? "is-active" : ""}
              key={item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <StateStrip
        state={collectionState}
        message={
          collectionState === "success"
            ? `${shownResources.length} resources available.`
            : collectionState === "loading"
              ? "Requesting the education collection…"
              : collectionState === "empty"
                ? "No resources match this authorization scope."
                : "The collection is unavailable. Retry when ready."
        }
        onRetry={() => query.refetch()}
      />
      <div className="resource-grid">
        {shownResources.map((resource) => (
          <Card className="resource-card" key={resource.id}>
            <div className="resource-image">
              {resource.imageUrl ? (
                <img
                  src={resource.imageUrl}
                  alt={resource.imageAlt}
                  loading="lazy"
                />
              ) : (
                <div className="resource-placeholder">
                  <BookOpen size={22} aria-hidden="true" />
                </div>
              )}
              <span>{resource.kind}</span>
            </div>
            <div className="resource-copy">
              <span className="card-label">{resource.category}</span>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <div className="resource-meta">
                <span>{formatDate(resource.publishedAt)}</span>
                {resource.durationMinutes ? (
                  <span>{resource.durationMinutes} min watch</span>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VideosPanel({ api }: { api: AsaPhisApi }) {
  const videosQuery = useQuery({
    queryKey: ["videos"],
    queryFn: api.getVideos,
  });
  const videos = videosQuery.data ?? [];
  const featured = videos[0] ?? null;
  const videosState = videosQuery.isLoading
    ? ("loading" as const)
    : videosQuery.isError
      ? ("error" as const)
      : videos.length === 0
        ? ("empty" as const)
        : ("success" as const);
  return (
    <div>
      <PanelHeader
        eyebrow="Media library"
        title="Videos"
        description="Watch the featured message, browse the latest videos, and keep a lightweight history when the feature is enabled."
        action={
          <Button type="button" className="ap-control ap-control-dark">
            <Play size={14} aria-hidden="true" /> Continue watching
          </Button>
        }
      />
      <StateStrip
        state={videosState}
        message={
          videosState === "success"
            ? "Featured and latest videos are available."
            : videosState === "loading"
              ? "Requesting the video collection…"
              : videosState === "empty"
                ? "No videos are available for this filter."
                : "The video service is unavailable."
        }
        onRetry={() => videosQuery.refetch()}
      />
      {featured ? (
        <Card className="video-feature-card">
          <div className="video-feature-image">
            {featured.imageUrl ? (
              <img
                src={featured.imageUrl}
                alt={featured.imageAlt}
              />
            ) : null}
            <span className="media-play">
              <Play size={19} fill="currentColor" aria-hidden="true" />
            </span>
          </div>
          <div className="video-feature-copy">
            <p className="eyebrow">Featured video</p>
            <h3>{featured.title}</h3>
            <p>{featured.description}</p>
            <div className="resource-meta">
              <span>{formatDate(featured.publishedAt)}</span>
              {featured.durationMinutes ? (
                <span>{featured.durationMinutes} min watch</span>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}
      <div className="section-subhead">
        <div>
          <p className="eyebrow">Latest videos</p>
          <h3>Useful conversations, not noise.</h3>
        </div>
        <StatusBadge status="Ready" />
      </div>
      <div className="resource-grid video-grid">
        {videos.map((resource) => (
          <Card className="resource-card" key={resource.id}>
            <div className="resource-image">
              {resource.imageUrl ? (
                <img
                  src={resource.imageUrl}
                  alt={resource.imageAlt}
                  loading="lazy"
                />
              ) : null}
              <span>
                {resource.durationMinutes
                  ? `${resource.durationMinutes} min`
                  : "Video"}
              </span>
            </div>
            <div className="resource-copy">
              <span className="card-label">{resource.category}</span>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <Button type="button" variant="link" className="ap-link-button">
                Watch video <ArrowRight size={14} aria-hidden="true" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DocumentsPanel({ api }: { api: AsaPhisApi }) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const docsQuery = useQuery({
    queryKey: ["member-documents"],
    queryFn: api.getDocuments,
  });
  const documents = docsQuery.data ?? [];
  return (
    <div>
      <PanelHeader
        eyebrow="Authorized library"
        title="Documents"
        description="Downloads use a short-lived file link. Private storage URLs are never exposed here."
        action={<StatusBadge status="Verified" />}
      />
      {docsQuery.isLoading ? (
        <StateStrip state="loading" message="Requesting your documents…" />
      ) : docsQuery.isError ? (
        <StateStrip
          state="error"
          message="Your documents could not be loaded. Please try again."
          onRetry={() => docsQuery.refetch()}
        />
      ) : documents.length === 0 ? (
        <StateStrip
          state="empty"
          message="No authorized documents returned for this member."
        />
      ) : (
        <div className="table-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>File type</TableHead>
                <TableHead className="text-right">Access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div className="table-title">
                      <FileText size={16} aria-hidden="true" />
                      <div>
                        <strong>{document.title}</strong>
                        <span>{document.description}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{document.category}</TableCell>
                  <TableCell>{formatDate(document.publishedAt)}</TableCell>
                  <TableCell>{document.fileType}</TableCell>
                  <TableCell className="text-right">
                    {document.authorization === "allowed" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ap-control ap-control-outline"
                        onClick={async () => {
                          setError("");
                          try {
                            const result = await api.requestDocumentDownload(
                              document.id,
                            );
                            setFeedback(
                              `Authorized: ${document.title}. Access link expires ${new Date(result.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
                            );
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Download is not available right now.");
                          }
                        }}
                      >
                        <ArrowDownToLine size={14} aria-hidden="true" />{" "}
                        Download
                      </Button>
                    ) : (
                      <StatusBadge status="Restricted" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {feedback ? <StateStrip state="success" message={feedback} /> : null}
      {error ? <StateStrip state="error" message={error} /> : null}
    </div>
  );
}

function UpdatesPanel({
  updates,
  state,
  onRetry,
}: {
  updates: UpdateEntry[];
  state: "loading" | "error" | "empty" | "success";
  onRetry: () => void;
}) {
  return (
    <div>
      <PanelHeader
        eyebrow="AsaPhis Journal"
        title="Updates"
        description="Chronological history stays available according to its visibility policy. New entries do not make older entries disappear."
        action={<StatusBadge status="Published" />}
      />
      {state === "loading" ? (
        <StateStrip state="loading" message="Requesting published updates…" />
      ) : state === "error" ? (
        <StateStrip
          state="error"
          message="Updates could not be loaded. Please try again."
          onRetry={onRetry}
        />
      ) : state === "empty" ? (
        <StateStrip state="empty" message="No updates published yet. Check back soon." />
      ) : (
        <div className="journal-list">
          {updates.map((update, index) => (
            <article className="journal-entry" key={update.id}>
              <div className="journal-marker">
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div>
                <p className="eyebrow">{formatDate(update.date)}</p>
                <h3>{update.title}</h3>
                <p>{update.body}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityPanel({ api, profile }: { api: AsaPhisApi; profile: MemberProfile | null }) {
  const [submissionTitle, setSubmissionTitle] = useState("");
  const [submissionBody, setSubmissionBody] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submissionsQuery = useQuery({
    queryKey: ["member-submissions"],
    queryFn: api.listSubmissions,
  });
  const submissions = submissionsQuery.data ?? [];
  const selected = submissions.find((s) => s.id === activeId) ?? submissions[0] ?? null;
  const submissionStatus = selected?.status ?? "Draft";
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback("");
    setError("");
    if (!submissionTitle.trim() || !submissionBody.trim()) {
      setError("Give your contribution a title and body before submitting.");
      return;
    }
    setBusy(true);
    try {
      const result = await api.submitCommunityContribution({
        title: submissionTitle.trim(),
        body: submissionBody.trim(),
      });
      setActiveId(result.id);
      setSubmissionTitle("");
      setSubmissionBody("");
      setFeedback(`Submitted for review · status ${result.status}.`);
      await submissionsQuery.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your contribution could not be submitted.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <PanelHeader
        eyebrow="Moderated community"
        title="Community"
        description="Read admin posts, contribute carefully, and keep the review status visible. Version 1 does not include unrestricted member-to-member chat."
        action={<StatusBadge status="Moderated" />}
      />
      <div className="community-layout">
        <div className="community-thread">
          <Card className="thread-card">
            <div className="thread-author">
              <Avatar>
                <AvatarFallback>{profile?.initials ?? "…"}</AvatarFallback>
              </Avatar>
              <div>
                <strong>{profile?.name ?? "Loading…"}</strong>
                <span>My submissions · newest first</span>
              </div>
            </div>
            {submissionsQuery.isLoading ? (
              <StateStrip state="loading" message="Requesting your submissions…" />
            ) : submissionsQuery.isError ? (
              <StateStrip
                state="error"
                message="Your submissions could not be loaded."
                onRetry={() => submissionsQuery.refetch()}
              />
            ) : submissions.length === 0 ? (
              <StateStrip
                state="empty"
                message="No submissions yet. Use the form to send your first contribution for review."
              />
            ) : (
              <div className="submission-list">
                {submissions.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={selected?.id === item.id ? "is-current" : ""}
                    onClick={() => setActiveId(item.id)}
                  >
                    <span>
                      <strong>{item.title}</strong>
                      <small>{formatDate(item.updatedAt)}</small>
                    </span>
                    <StatusBadge status={item.status} />
                  </button>
                ))}
              </div>
            )}
          </Card>
          {feedback ? <StateStrip state="success" message={feedback} /> : null}
          {error ? <StateStrip state="error" message={error} /> : null}
        </div>
        <Card className="submission-card">
          <div className="card-header-row">
            <div>
              <p className="eyebrow">My contribution</p>
              <h3>Keep the status visible.</h3>
            </div>
            <StatusBadge status={submissionStatus} />
          </div>
          <div className="submission-rail">
            {[
              "Draft",
              "Under Review",
              "Approved",
              "Scheduled",
              "Published",
            ].map((status) => (
              <span
                key={status}
                className={
                  status === submissionStatus ||
                  (submissionStatus === "Changes Requested" &&
                    status === "Draft")
                    ? "is-current"
                    : ""
                }
              >
                {status}
              </span>
            ))}
          </div>
          {submissionStatus === "Changes Requested" ? (
            <Alert className="moderation-alert">
              <AlertTriangle size={16} aria-hidden="true" />
              <AlertTitle>Changes requested</AlertTitle>
              <AlertDescription>
                {selected?.adminMessage ?? "A moderator left feedback on this submission."}
              </AlertDescription>
            </Alert>
          ) : null}
          <form className="submission-form" onSubmit={submit}>
            <div className="form-field">
              <Label htmlFor="submission-title">Title</Label>
              <Input
                id="submission-title"
                value={submissionTitle}
                onChange={(event) => setSubmissionTitle(event.target.value)}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="submission-body">Your contribution</Label>
              <Textarea
                id="submission-body"
                value={submissionBody}
                onChange={(event) => setSubmissionBody(event.target.value)}
                rows={4}
              />
            </div>
            <div className="submission-actions">
              <Button
                type="submit"
                className="ap-control ap-control-primary"
                disabled={busy}
              >
                {busy ? "Submitting…" : "Submit for review"}{" "}
                <ArrowRight size={15} aria-hidden="true" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function ContributePanel({ api }: { api: AsaPhisApi }) {
  const [method, setMethod] = useState("Card");
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const configQuery = useQuery({
    queryKey: ["payment-config"],
    queryFn: api.getPaymentConfig,
  });
  const config = (configQuery.data ?? [])[0] ?? null;
  const contribute = async () => {
    if (!config) return;
    setError("");
    setBusy(true);
    try {
      const created = await api.createContribution({
        amount: config.amount,
        currency: config.currency,
        method: method as never,
      });
      setResult({ id: created.id, status: created.status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your contribution could not be started.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <PanelHeader
        eyebrow="Contribution history"
        title="Contribute"
        description="Contribution methods are selected by region. Membership becomes active after confirmation."
        action={<StatusBadge status={result?.status ?? "Pending"} />}
      />
      <div className="contribute-grid">
        <Card className="contribution-status-card">
          <p className="eyebrow">Current membership contribution</p>
          {configQuery.isLoading ? (
            <StateStrip state="loading" message="Requesting contribution details…" />
          ) : configQuery.isError || !config ? (
            <StateStrip
              state="error"
              message="Contribution details are unavailable right now."
              onRetry={() => configQuery.refetch()}
            />
          ) : (
            <>
              <strong>{formatContribution(config.amount, config.currency)}</strong>
              <p>
                {config.methods.length > 0 ? `Methods: ${config.methods.join(" · ")}` : "Contact support for payment methods."}
              </p>
              <div className="form-field">
                <Label htmlFor="contribute-method">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="contribute-method" className="full-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(config.methods.length > 0 ? config.methods : ["Card"]).map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                className="ap-control ap-control-primary"
                disabled={busy}
                onClick={contribute}
              >
                {busy ? "Starting…" : "Start contribution"}
              </Button>
            </>
          )}
          {result ? (
            <StateStrip state="success" message={`Contribution ${result.id} · status ${result.status}.`} />
          ) : null}
          {error ? <StateStrip state="error" message={error} /> : null}
        </Card>
        <Card className="contribution-why-card">
          <p className="eyebrow">Why it matters</p>
          <h3>Contributions keep the foundation dependable.</h3>
          <p>
            They help maintain public education, thoughtful moderation, and
            secure member operations without turning the experience into a
            marketplace.
          </p>
          <Button
            type="button"
            variant="outline"
            className="ap-control ap-control-outline"
          >
            View contribution policy <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </Card>
      </div>
    </div>
  );
}

function NotificationsPanel({ api }: { api: AsaPhisApi }) {
  const [category, setCategory] = useState<NotificationCategory | "All">("All");
  const query = useQuery({
    queryKey: ["notifications", category],
    queryFn: () =>
      api.getNotifications(category === "All" ? undefined : category),
  });
  const notifications = query.data ?? [];
  const unread = notifications.filter((n) => !n.read).length;
  const categories: (NotificationCategory | "All")[] = [
    "All",
    "Updates",
    "Education",
    "Community",
    "Moderation",
    "Security",
    "Travel",
    "Account",
    "Support",
  ];
  return (
    <div>
      <PanelHeader
        eyebrow="Your account history"
        title="Notification center"
        description="Keep updates, education, moderation, security, travel, account, and support history in one place."
        action={
          <Badge className="rounded-full bg-[#d47b35] text-[#232d23]">
            {query.isLoading ? "…" : `${unread} unread`}
          </Badge>
        }
      />
      <div
        className="filter-row notification-filters"
        role="group"
        aria-label="Notification categories"
      >
        {categories.map((item) => (
          <button
            type="button"
            className={category === item ? "is-active" : ""}
            key={item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {query.isLoading ? (
        <StateStrip state="loading" message="Requesting your notifications…" />
      ) : query.isError ? (
        <StateStrip
          state="error"
          message="Notifications could not be loaded. Please try again."
          onRetry={() => query.refetch()}
        />
      ) : notifications.length === 0 ? (
        <StateStrip state="empty" message="You are all caught up. New account activity will appear here." />
      ) : null}
      <div className="notification-list">
        {notifications.map((notification) => (
          <article
            className={
              notification.read
                ? "notification-row is-read"
                : "notification-row"
            }
            key={notification.id}
          >
            <span className="notification-bullet" />
            <div>
              <strong>{notification.title}</strong>
              <p>{notification.body}</p>
            </div>
            <time>{formatDate(notification.createdAt)}</time>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProfilePanel({
  profile,
  navigate,
}: {
  profile: MemberProfile | null;
  navigate: (panel: MemberPanel) => void;
}) {
  return (
    <div>
      <PanelHeader
        eyebrow="Member record"
        title="Profile"
        description="Manage personal details and jump to the account controls that protect them."
        action={
          <StatusBadge
            status={!profile ? "Loading" : profile.accountStatus === "active" ? "Active" : "Limited"}
          />
        }
      />
      <div className="profile-grid">
        <Card className="profile-card">
          <Avatar className="profile-avatar">
            <AvatarFallback>{profile?.initials ?? "…"}</AvatarFallback>
          </Avatar>
          <div>
            <h3>{profile?.name ?? "Loading…"}</h3>
            <p>Member ID · {profile?.memberId || "…"}</p>
            <p>
              {profile ? `${profile.country} · Joined ${formatDate(profile.joinedAt)}` : "…"}
            </p>
          </div>
        </Card>
        <Card className="detail-card">
          <DetailRow
            label="Identity verification"
            value={profile ? (profile.identityVerified ? "Verified" : "Pending") : "…"}
            status
          />
          <DetailRow
            label="Phone number"
            value={profile ? (profile.phoneVerified ? "Verified" : "Pending") : "…"}
            status
          />
          <DetailRow
            label="Account status"
            value={profile ? (profile.accountStatus === "active" ? "Active" : "Limited") : "…"}
            status
          />
          <DetailRow label="Current location" value={profile?.country ?? "…"} />
        </Card>
        <div className="profile-actions">
          <QuickLink
            icon={ShieldCheck}
            title="Security"
            body="Devices, sessions, MFA, and recent activity."
            onClick={() => navigate("security")}
          />
          <QuickLink
            icon={Globe2}
            title="Travel access"
            body="Request temporary access outside your normal region."
            onClick={() => navigate("travel")}
          />
          <QuickLink
            icon={LifeBuoy}
            title="Support"
            body="Ask about account, verification, travel, or payment."
            onClick={() => navigate("support")}
          />
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: boolean;
}) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      {status ? <StatusBadge status={value} /> : <strong>{value}</strong>}
    </div>
  );
}

function SecurityPanel({
  api,
  profile,
  navigate,
}: {
  api: AsaPhisApi;
  profile: MemberProfile | null;
  navigate: (panel: MemberPanel) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const devicesQuery = useQuery({
    queryKey: ["member-devices"],
    queryFn: api.listDevices,
  });
  const sessionsQuery = useQuery({
    queryKey: ["member-sessions"],
    queryFn: api.listSessions,
  });
  const devices = devicesQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];
  const act = async (id: string, kind: "device" | "session") => {
    setError("");
    setBusyId(id);
    try {
      if (kind === "device") {
        await api.revokeDevice(id);
        await devicesQuery.refetch();
      } else {
        await api.terminateSession(id);
        await sessionsQuery.refetch();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "This action could not be completed.");
    } finally {
      setBusyId(null);
    }
  };
  return (
    <div>
      <PanelHeader
        eyebrow="Protect the account"
        title="Security center"
        description="See what is verified, which devices are trusted, and what changed recently."
        action={<StatusBadge status="Healthy" />}
      />
      <div className="settings-grid">
        <Card className="settings-card">
          <p className="eyebrow">Verification</p>
          <DetailRow
            label="Identity"
            value={profile ? (profile.identityVerified ? "Verified" : "Pending") : "…"}
            status
          />
          <DetailRow
            label="Phone"
            value={profile ? (profile.phoneVerified ? "Verified" : "Pending") : "…"}
            status
          />
          <DetailRow
            label="Recognized devices"
            value={devicesQuery.isLoading ? "…" : String(devices.length)}
          />
          <p className="quiet-note">
            Only devices that signed in with your credentials are listed here.
          </p>
        </Card>
        <Card className="settings-card">
          <p className="eyebrow">Trusted devices</p>
          {devicesQuery.isLoading ? (
            <StateStrip state="loading" message="Requesting your devices…" />
          ) : devicesQuery.isError ? (
            <StateStrip
              state="error"
              message="Devices could not be loaded."
              onRetry={() => devicesQuery.refetch()}
            />
          ) : devices.length === 0 ? (
            <StateStrip state="empty" message="No devices recorded for this account yet." />
          ) : (
            devices.map((device) => (
              <div className="session-row" key={device.id}>
                <div>
                  <strong>{device.label}</strong>
                  <span>{device.detail}</span>
                </div>
                {device.trusted ? (
                  <StatusBadge status="Trusted" />
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ap-control ap-control-outline"
                    disabled={busyId === device.id}
                    onClick={() => act(device.id, "device")}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))
          )}
        </Card>
        <Card className="settings-card">
          <p className="eyebrow">Active sessions</p>
          {sessionsQuery.isLoading ? (
            <StateStrip state="loading" message="Requesting your sessions…" />
          ) : sessionsQuery.isError ? (
            <StateStrip
              state="error"
              message="Sessions could not be loaded."
              onRetry={() => sessionsQuery.refetch()}
            />
          ) : sessions.length === 0 ? (
            <StateStrip state="empty" message="No other active sessions besides this one." />
          ) : (
            sessions.map((session) => (
              <div className="session-row" key={session.id}>
                <div>
                  <strong>{session.label}</strong>
                  <span>{session.detail}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ap-control ap-control-outline"
                  disabled={busyId === session.id}
                  onClick={() => act(session.id, "session")}
                >
                  Terminate
                </Button>
              </div>
            ))
          )}
        </Card>
      </div>
      {error ? <StateStrip state="error" message={error} /> : null}
      <Button
        type="button"
        className="ap-control ap-control-dark"
        onClick={() => navigate("support")}
      >
        Request support <ArrowRight size={14} aria-hidden="true" />
      </Button>
    </div>
  );
}

function TravelPanel({ api }: { api: AsaPhisApi }) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [destination, setDestination] = useState("United Kingdom");
  const historyQuery = useQuery({
    queryKey: ["member-travel"],
    queryFn: api.listTravelRequests,
  });
  const history = historyQuery.data ?? [];
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");
    setError("");
    const form = new FormData(event.currentTarget);
    const startDate = String(form.get("startDate") ?? "");
    const endDate = String(form.get("endDate") ?? "");
    const reason = String(form.get("reason") ?? "").trim();
    const additionalInformation = String(form.get("additionalInformation") ?? "").trim();
    if (!startDate || !endDate || !reason) {
      setError("Choose travel dates and give a reason before submitting.");
      return;
    }
    setBusy(true);
    try {
      const result = await api.createTravelRequest({
        destination,
        startDate,
        endDate,
        reason,
        additionalInformation: additionalInformation || undefined,
      });
      setFeedback(`${result.id} submitted · status ${result.status}.`);
      await historyQuery.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your travel request could not be submitted.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <PanelHeader
        eyebrow="Temporary access"
        title="Travel access"
        description="Request a time-bound review when you are outside the normal permitted region."
        action={<StatusBadge status="Pending" />}
      />
      <Alert className="travel-alert">
        <Globe2 size={18} aria-hidden="true" />
        <AlertTitle>
          You&apos;re currently accessing AsaPhis from a different region.
        </AlertTitle>
        <AlertDescription>
          We keep access clear and temporary. If approved, the expiration date
          remains visible.
        </AlertDescription>
      </Alert>
      <div className="travel-grid">
        <Card className="travel-form-card">
          <p className="eyebrow">Request Travel Access</p>
          <form onSubmit={submit}>
            <div className="form-field">
              <Label htmlFor="destination">Destination</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger id="destination" className="full-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["United Kingdom", "Ghana", "Kenya", "United States"].map(
                    (item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="form-grid form-grid-two">
              <div className="form-field">
                <Label htmlFor="start-date">Start date</Label>
                <Input id="start-date" name="startDate" type="date" required />
              </div>
              <div className="form-field">
                <Label htmlFor="end-date">End date</Label>
                <Input id="end-date" name="endDate" type="date" required />
              </div>
            </div>
            <div className="form-field">
              <Label htmlFor="travel-reason">Reason</Label>
              <Textarea
                id="travel-reason"
                name="reason"
                rows={3}
                placeholder="Why do you need temporary access?"
                required
              />
            </div>
            <div className="form-field">
              <Label htmlFor="travel-info">Additional information</Label>
              <Textarea
                id="travel-info"
                name="additionalInformation"
                rows={3}
                placeholder="Optional context"
              />
            </div>
            <Button
              type="submit"
              className="ap-control ap-control-primary"
              disabled={busy}
            >
              {busy ? "Submitting…" : "Submit request"}{" "}
              <ArrowRight size={15} aria-hidden="true" />
            </Button>
          </form>
          {feedback ? <StateStrip state="success" message={feedback} /> : null}
          {error ? <StateStrip state="error" message={error} /> : null}
        </Card>
        <Card className="request-history">
          <p className="eyebrow">Request history</p>
          {historyQuery.isLoading ? (
            <StateStrip state="loading" message="Requesting your travel history…" />
          ) : historyQuery.isError ? (
            <StateStrip
              state="error"
              message="Travel history could not be loaded."
              onRetry={() => historyQuery.refetch()}
            />
          ) : history.length === 0 ? (
            <StateStrip state="empty" message="No travel requests yet. Approved access always shows an expiration date." />
          ) : (
            history.map((request) => (
              <div className="detail-row" key={request.id}>
                <span>
                  {request.destination} · {request.startDate}
                  {request.expiresAt ? ` · expires ${formatDate(request.expiresAt)}` : ""}
                </span>
                <StatusBadge status={request.status} />
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

function SupportPanel({ api }: { api: AsaPhisApi }) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ticketsQuery = useQuery({
    queryKey: ["member-support"],
    queryFn: api.listSupportRequests,
  });
  const tickets = ticketsQuery.data ?? [];
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");
    setError("");
    const form = new FormData(event.currentTarget);
    const subject = String(form.get("subject") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    if (!subject || !message) {
      setError("Give your request a subject and message before sending.");
      return;
    }
    setBusy(true);
    try {
      const result = await api.createSupportRequest({
        category: String(form.get("category")) as SupportCategory,
        subject,
        message,
      });
      setFeedback(`${result.id} created · response timeline is now active.`);
      event.currentTarget.reset();
      await ticketsQuery.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your support request could not be created.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <PanelHeader
        eyebrow="Member care"
        title="Support center"
        description="Ask a direct question and follow the response timeline. Categories keep requests easy to route."
        action={
          <Badge variant="outline" className="rounded-full">
            Response target · 2 days
          </Badge>
        }
      />
      <div className="support-grid">
        <Card className="faq-card">
          <p className="eyebrow">Frequently asked</p>
          <Accordion type="single" collapsible defaultValue="privacy">
            <AccordionItem value="privacy">
              <AccordionTrigger>
                How is identity information used?
              </AccordionTrigger>
              <AccordionContent>
                It is used for the configured verification decision. Production
                storage and retention are controlled by backend policy and
                provider agreements.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="changes">
              <AccordionTrigger>
                Why is my submission in Changes Requested?
              </AccordionTrigger>
              <AccordionContent>
                A moderator needs more context or a source. Open Community to
                add the requested information before resubmitting.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="travel">
              <AccordionTrigger>
                What happens when travel access expires?
              </AccordionTrigger>
              <AccordionContent>
                Temporary permissions end at the displayed time. Request a new
                review if your travel continues.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
        <Card className="support-form-card">
          <p className="eyebrow">Create a request</p>
          <form onSubmit={submit}>
            <div className="form-field">
              <Label htmlFor="support-category">Category</Label>
              <Select defaultValue="Account" name="category">
                <SelectTrigger id="support-category" className="full-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Account",
                    "Verification",
                    "Travel",
                    "Security",
                    "Payment",
                    "Community",
                    "Other",
                  ].map((item) => (
                    <SelectItem value={item} key={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-field">
              <Label htmlFor="support-subject">Subject</Label>
              <Input
                id="support-subject"
                name="subject"
                placeholder="Brief summary of the issue"
              />
            </div>
            <div className="form-field">
              <Label htmlFor="support-message">Message</Label>
              <Textarea
                id="support-message"
                name="message"
                rows={5}
                placeholder="Tell us what happened and what you need."
              />
            </div>
            <Button
              type="submit"
              className="ap-control ap-control-primary"
              disabled={busy}
            >
              {busy ? "Sending…" : "Create support request"}{" "}
              <Send size={15} aria-hidden="true" />
            </Button>
          </form>
          {feedback ? <StateStrip state="success" message={feedback} /> : null}
          {error ? <StateStrip state="error" message={error} /> : null}
          <p className="eyebrow response-label">Your requests</p>
          {ticketsQuery.isLoading ? (
            <StateStrip state="loading" message="Requesting your support history…" />
          ) : ticketsQuery.isError ? (
            <StateStrip
              state="error"
              message="Support history could not be loaded."
              onRetry={() => ticketsQuery.refetch()}
            />
          ) : tickets.length === 0 ? (
            <StateStrip state="empty" message="No support requests yet. New requests and replies will appear here." />
          ) : (
            <div className="ticket-history">
              {tickets.map((ticket) => (
                <div className="detail-row" key={ticket.id}>
                  <span>
                    <strong>{ticket.subject}</strong>
                    <small>
                      {ticket.category} · {formatDate(ticket.createdAt)} · {ticket.responses.length} replies
                    </small>
                  </span>
                  <StatusBadge
                    status={
                      ticket.status === "resolved"
                        ? "Resolved"
                        : ticket.status === "pending"
                          ? "Pending"
                          : "Open"
                    }
                  />
                </div>
              ))}
            </div>
          )}
          <p className="eyebrow response-label">Response timeline</p>
          <div className="response-timeline">
            <div>
              <span />
              <div>
                <strong>Request opened · Today</strong>
                <p>Support has the context you submitted.</p>
              </div>
            </div>
            <div>
              <span />
              <div>
                <strong>Next response · Within 2 days</strong>
                <p>A member care person will reply here.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
