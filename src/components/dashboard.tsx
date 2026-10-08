"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MessageSquare,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  categories,
  collaborators,
  daily,
  defaultFilters,
  DEMO_ALLOCATION,
  DEMO_DATE,
  events,
  filterEvents,
  profiles,
  rank,
  searchEvents,
  shiftDate,
  summarize,
  toCsv,
  users,
  type Filters,
  type Ranking,
} from "@/lib/usage";

const number = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
const dollars = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(
    n,
  );
const shortDate = (date: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
const colors = [
  "#4b85ef",
  "#8675df",
  "#56b9b1",
  "#efa66b",
  "#bcc7e4",
  "#d9dde5",
];
const tabs = ["Dashboard", "Détail d’utilisation", "Gérer les quotas"] as const;

function Panel({
  title,
  subtitle,
  children,
  aside,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="filter">
      <span>{label}</span>
      <div className="select-wrap">
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} aria-hidden="true" />
      </div>
    </label>
  );
}
function Trend({
  current,
  previous,
  days,
  metric,
}: {
  current: ReturnType<typeof daily>;
  previous?: ReturnType<typeof daily>;
  days: number;
  metric: "credits" | "users";
}) {
  const max = Math.max(
    1,
    ...current.map((d) => d[metric]),
    ...(previous?.map((d) => d[metric]) || []),
  );
  const width = 600,
    height = 174,
    left = 40,
    top = 13,
    innerW = 548,
    innerH = 133;
  const point = (v: number, i: number) =>
    `${left + (i * innerW) / Math.max(1, days - 1)},${top + innerH - (v / max) * innerH}`;
  const path = current
    .map((d, i) => `${i ? "L" : "M"}${point(d[metric], i)}`)
    .join(" ");
  const id = `fill-${metric}`;
  return (
    <>
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${metric === "credits" ? "Crédits consommés" : "Utilisateurs actifs"} par jour : ${current.map((d) => `${shortDate(d.date)} : ${number(d[metric])}`).join(" ; ")}${previous ? `. Période précédente : ${previous.map((d) => `${shortDate(d.date)} : ${number(d[metric])}`).join(" ; ")}` : ""}`}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4b85ef" stopOpacity=".15" />
            <stop offset="100%" stopColor="#4b85ef" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1={left}
              x2={588}
              y1={top + (innerH * i) / 3}
              y2={top + (innerH * i) / 3}
              stroke="#edf0f4"
              strokeDasharray="3 4"
            />
            <text x={left - 8} y={top + (innerH * i) / 3 + 4} textAnchor="end">
              {number(max * (1 - i / 3))}
            </text>
          </g>
        ))}
        <path d={`${path} L588,146 L40,146 Z`} fill={`url(#${id})`} />
        {previous && (
          <path
            d={previous
              .map((d, i) => `${i ? "L" : "M"}${point(d[metric], i)}`)
              .join(" ")}
            fill="none"
            stroke="#c6ccd7"
            strokeWidth="2"
            strokeDasharray="5 5"
          />
        )}
        <path
          d={path}
          fill="none"
          stroke="#4b85ef"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {[
          0,
          Math.floor((days - 1) / 3),
          Math.floor(((days - 1) * 2) / 3),
          days - 1,
        ].map((i) => (
          <text
            key={i}
            x={left + (i * innerW) / (days - 1)}
            y="170"
            textAnchor={i === 0 ? "start" : i === days - 1 ? "end" : "middle"}
          >
            {shortDate(current[i].date)}
          </text>
        ))}
      </svg>
    </>
  );
}
function RankingList({
  items,
  metric = "credits",
  unit = "crédits",
  profilesMode = false,
}: {
  items: Ranking[];
  metric?: "credits" | "calls" | "users";
  unit?: string;
  profilesMode?: boolean;
}) {
  const max = Math.max(1, ...items.map((item) => item[metric]));
  return (
    <ol className="ranking">
      {items.slice(0, 5).map((item, i) => (
        <li key={item.name}>
          <span className="rank-number">{String(i + 1).padStart(2, "0")}</span>
          <span className={`avatar avatar-${i % 5}`}>
            {profilesMode ? <Users size={14} /> : item.name.slice(0, 1)}
          </span>
          <div className="rank-main">
            <div className="rank-line">
              <span>{item.name}</span>
              <strong>
                {number(item[metric])} <small>{unit}</small>
              </strong>
            </div>
            <div className="rank-track">
              <span
                style={{
                  width: `${(item[metric] / max) * 100}%`,
                  background: profilesMode ? "#99b6ef" : colors[i],
                }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
function Empty({ onReset }: { onReset: () => void }) {
  return (
    <div className="empty">
      <Search size={30} />
      <h2>Aucune utilisation sur cette sélection</h2>
      <p>Essayez une autre période ou réinitialisez vos filtres.</p>
      <button className="button primary" onClick={onReset}>
        Réinitialiser les filtres
      </button>
    </div>
  );
}

export default function Dashboard() {
  const menuRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState("all");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!sidebarOpen) return;
    const trigger = menuRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () =>
      Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>("button, a[href]") ||
          [],
      ).filter((el) => el.getClientRects().length > 0);
    controls()[0]?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setSidebarOpen(false);
      }
      if (e.key === "Tab") {
        const focusable = controls(),
          first = focusable[0],
          last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [sidebarOpen]);
  const filtered = useMemo(() => filterEvents(events, filters), [filters]);
  const previous = useMemo(
    () => filterEvents(events, filters, true),
    [filters],
  );
  const stats = summarize(filtered),
    previousStats = summarize(previous);
  const currentDaily = daily(filtered, filters.days),
    previousDaily = daily(previous, filters.days, true);
  const modelEvents = filtered.filter(
    (e) => category === "all" || e.category === category,
  );
  const rows = useMemo(
    () =>
      searchEvents(filtered, query)
        .slice()
        .sort(
          (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
        ),
    [filtered, query],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / 15));
  const visiblePage = Math.min(page, pageCount - 1);
  const totals = categories.map((name) => ({
    name,
    credits: filtered
      .filter((e) => e.category === name)
      .reduce((n, e) => n + e.credits, 0),
  }));
  const setFilter = (key: keyof Filters, value: string | number) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
    setNotice("");
  };
  const reset = () => {
    setFilters(defaultFilters);
    setQuery("");
    setCategory("all");
    setPage(0);
  };
  function exportCsv() {
    const exported = tab === "Détail d’utilisation" ? rows : filtered;
    const url = URL.createObjectURL(
      new Blob([toCsv(exported)], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `unitalk-demo-${DEMO_DATE}-${filters.days}j.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice(`${number(exported.length)} lignes de démonstration exportées.`);
  }
  const kpis = [
    {
      label: "Utilisateurs actifs",
      value: stats.users,
      before: previousStats.users,
      icon: Users,
    },
    {
      label: "Collaborateurs IA actifs",
      value: stats.collaborators,
      before: previousStats.collaborators,
      icon: Bot,
    },
    {
      label: "Crédits consommés",
      value: stats.credits,
      before: previousStats.credits,
      icon: Coins,
    },
    {
      label: "Valeur en dollars",
      value: stats.costUsd,
      before: previousStats.costUsd,
      icon: Wallet,
      currency: true,
    },
    {
      label: "Chats actifs",
      value: stats.chats,
      before: previousStats.chats,
      icon: MessageSquare,
    },
    {
      label: "Tâches planifiées",
      value: stats.scheduledTasks,
      before: previousStats.scheduledTasks,
      icon: CalendarDays,
    },
  ];
  return (
    <div className={`app ${collapsed ? "is-collapsed" : ""}`}>
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Fermer le menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        className={`sidebar ${sidebarOpen ? "is-open" : ""}`}
        aria-label="Navigation principale"
      >
        <Link className="brand" href="/" aria-label="Unitalk accueil">
          <span className="brand-symbol">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">
            unitalk<span className="brand-dot">.</span>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          aria-label="Fermer le menu"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </button>
        <div className="workspace">
          <span className="workspace-avatar">A</span>
          <div>
            <strong>Acme Studio</strong>
            <span>Espace de démonstration</span>
          </div>
          <ChevronDown size={14} />
        </div>
        <span className="nav-caption">ESPACE DE TRAVAIL</span>
        <nav>
          {[
            { icon: LayoutDashboard, text: "Vue d’ensemble" },
            { icon: MessageSquare, text: "Conversations" },
            { icon: Bot, text: "Collaborateurs IA" },
            { icon: FileText, text: "Connaissances" },
            { icon: Users, text: "Mon équipe" },
          ].map(({ icon: Icon, text }) => (
            <button
              key={text}
              aria-label={text}
              className="nav-item"
              onClick={() => {
                setNotice(
                  `« ${text} » n’est pas disponible dans cette démonstration.`,
                );
                setSidebarOpen(false);
              }}
              title={collapsed ? text : undefined}
            >
              <Icon size={18} />
              <span>{text}</span>
            </button>
          ))}
          <span className="nav-caption management">ADMINISTRATION</span>
          <button
            className="nav-item active"
            aria-label="Consommation"
            aria-current="page"
            onClick={() => {
              setTab("Dashboard");
              setSidebarOpen(false);
            }}
            title="Consommation"
          >
            <Activity size={18} />
            <span>Consommation</span>
            <span className="active-dot" />
          </button>
          <button
            className="nav-item"
            aria-label="Licence et quotas"
            onClick={() => {
              setTab("Gérer les quotas");
              setSidebarOpen(false);
            }}
            title="Licence et quotas"
          >
            <CreditCard size={18} />
            <span>Licence et quotas</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">
              <Sparkles size={19} />
            </span>
            <strong>Un peu d’aide ?</strong>
            <p>Explorez les fonctionnalités de cette démonstration.</p>
            <button
              onClick={() =>
                setNotice(
                  "Utilisez les filtres pour explorer les données, les onglets pour voir le détail et le bouton Exporter pour télécharger un CSV. Aucun compte n’est connecté.",
                )
              }
            >
              Découvrir le dashboard <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className="nav-item"
            aria-label="Aide et support"
            onClick={() =>
              setNotice(
                "Assistance non connectée. Cette interface est une démonstration locale.",
              )
            }
            title="Aide et support"
          >
            <LifeBuoy size={18} />
            <span>Aide et support</span>
          </button>
          <div className="account">
            <span className="user-avatar">CM</span>
            <div>
              <strong>Camille Martin</strong>
              <span>Administrateur · Démo</span>
            </div>
            <button
              className="collapse-button icon-button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={
                collapsed ? "Développer la navigation" : "Réduire la navigation"
              }
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <ChevronRight size={17} />
              ) : (
                <ChevronLeft size={17} />
              )}
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell" inert={sidebarOpen}>
        <header className="topbar">
          <div>
            <button
              ref={menuRef}
              className="mobile-menu icon-button"
              aria-label="Ouvrir le menu"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb">
              Espace de travail <ChevronRight size={13} />
              <strong>Consommation</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="demo-pill">
              <span /> Mode démo
            </span>
            <span className="header-avatar">CM</span>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">ANALYTIQUE</span>
              <h1>Consommation des crédits</h1>
              <p>Une vue claire de l’activité de vos collaborateurs IA.</p>
            </div>
            <button className="button primary export" onClick={exportCsv}>
              <ArrowDownToLine size={16} /> Exporter CSV
            </button>
          </div>
          <div className="demo-banner">
            <ShieldCheck size={16} />
            <span>
              Données de démonstration — aucune connexion aux données Unitalk
            </span>
            <span className="demo-reference">Référence : 8 octobre 2026</span>
          </div>
          <div
            className="tabs"
            role="tablist"
            aria-label="Vues de consommation"
          >
            {tabs.map((t, i) => (
              <button
                key={t}
                id={`tab-${i}`}
                role="tab"
                aria-selected={tab === t}
                aria-controls={`panel-${i}`}
                tabIndex={tab === t ? 0 : -1}
                onClick={() => setTab(t)}
                onKeyDown={(e) => {
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const index =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? 2
                          : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                    setTab(tabs[index]);
                    document.getElementById(`tab-${index}`)?.focus();
                  }
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="filters-row">
            <Select
              label="Période"
              value={String(filters.days)}
              options={[
                { value: "30", label: "30 derniers jours" },
                { value: "7", label: "7 derniers jours" },
              ]}
              onChange={(v) => setFilter("days", Number(v))}
            />
            <Select
              label="Utilisateur"
              value={filters.user}
              options={[
                { value: "all", label: "Tous les utilisateurs" },
                ...users.map((v) => ({ value: v, label: v })),
              ]}
              onChange={(v) => setFilter("user", v)}
            />
            <Select
              label="Collaborateur IA"
              value={filters.collaborator}
              options={[
                { value: "all", label: "Tous les collaborateurs" },
                ...collaborators.map((v) => ({ value: v, label: v })),
              ]}
              onChange={(v) => setFilter("collaborator", v)}
            />
            <Select
              label="Profil"
              value={filters.profile}
              options={[
                { value: "all", label: "Tous les profils" },
                ...profiles.map((v) => ({ value: v, label: v })),
              ]}
              onChange={(v) => setFilter("profile", v)}
            />
            <button
              className="reset-button"
              onClick={reset}
              title="Réinitialiser tous les filtres"
            >
              <Settings2 size={15} />
              Réinitialiser
            </button>
          </div>
          <div role="status" className={notice ? "notice" : "sr-only"}>
            {notice}
          </div>
          <div
            className="view"
            role="tabpanel"
            id={`panel-${tabs.indexOf(tab)}`}
            aria-labelledby={`tab-${tabs.indexOf(tab)}`}
          >
            {tab === "Dashboard" && (
              <>
                <div className="section-intro">
                  <div>
                    <h2>Vue d’ensemble</h2>
                    <p>
                      {shortDate(shiftDate(DEMO_DATE, 1 - filters.days))} —{" "}
                      {shortDate(DEMO_DATE)} 2026{" "}
                      <span>· Comparaison à la période précédente</span>
                    </p>
                  </div>
                  <div className="balance">
                    <span className="balance-icon">
                      <Wallet size={18} />
                    </span>
                    <div>
                      <span>
                        Solde Licence <span className="tiny-demo">DÉMO</span>
                      </span>
                      <strong>
                        {number(Math.max(0, DEMO_ALLOCATION - stats.credits))}
                        <small> / {number(DEMO_ALLOCATION)} crédits</small>
                      </strong>
                    </div>
                  </div>
                </div>
                <p className="balance-note">
                  Solde illustratif : allocation de démonstration moins la
                  consommation filtrée. Conversion de démonstration : 1 crédit =
                  0,001 $.
                </p>
                <div className="kpi-grid">
                  {kpis.map(
                    ({ label, value, before, icon: Icon, currency }) => {
                      const delta = before
                        ? ((value - before) / before) * 100
                        : 0;
                      return (
                        <article className="kpi" key={label}>
                          <div className="kpi-top">
                            <span>{label}</span>
                            <Icon size={17} />
                          </div>
                          <strong>
                            {currency ? dollars(value) : number(value)}
                          </strong>
                          <div className="kpi-bottom">
                            <span
                              className={`delta ${delta < 0 ? "negative" : ""}`}
                            >
                              {before
                                ? `${delta >= 0 ? "+" : ""}${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(delta)} %`
                                : "—"}
                            </span>
                            <span>vs période précédente</span>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
                {!filtered.length ? (
                  <Empty onReset={reset} />
                ) : (
                  <>
                    <div className="two-columns charts-grid">
                      <Panel
                        title="Évolution de la consommation"
                        subtitle="Crédits consommés par jour"
                        aside={
                          <span className="chart-badge">
                            {number(stats.credits)} crédits
                          </span>
                        }
                      >
                        <Trend
                          current={currentDaily}
                          previous={previousDaily}
                          days={filters.days}
                          metric="credits"
                        />
                        <div className="chart-legend">
                          <span>
                            <i style={{ background: colors[0] }} />
                            Période actuelle
                          </span>
                          <span>
                            <i style={{ background: "#c6ccd7" }} />
                            Période précédente
                          </span>
                        </div>
                      </Panel>
                      <Panel
                        title="Utilisateurs actifs au quotidien"
                        subtitle="Utilisateurs uniques par jour"
                        aside={
                          <span className="chart-badge">
                            {number(stats.users)} utilisateurs
                          </span>
                        }
                      >
                        <Trend
                          current={currentDaily}
                          days={filters.days}
                          metric="users"
                        />
                        <div className="chart-legend">
                          <span>
                            <i style={{ background: colors[0] }} />
                            Utilisateurs actifs
                          </span>
                        </div>
                      </Panel>
                    </div>
                    <div className="two-columns">
                      <Panel
                        title="Collaborateurs les plus actifs"
                        subtitle="Classés par nombre d’appels"
                      >
                        <RankingList
                          items={rank(filtered, "collaborator", "calls")}
                          metric="calls"
                          unit="appels"
                        />
                      </Panel>
                      <Panel
                        title="Collaborateurs les plus consommateurs"
                        subtitle="Classés par crédits consommés"
                      >
                        <RankingList items={rank(filtered, "collaborator")} />
                      </Panel>
                    </div>
                    <div className="category-grid">
                      <Panel
                        title="Répartition par catégorie"
                        subtitle="Une lecture de vos usages"
                      >
                        <div className="donut-layout">
                          <div className="donut">
                            <svg
                              viewBox="0 0 160 160"
                              role="img"
                              aria-label={`Répartition des crédits : ${totals.map((t) => `${t.name} ${number(t.credits)}`).join(", ")}`}
                            >
                              <circle
                                cx="80"
                                cy="80"
                                r="61"
                                fill="none"
                                stroke="#edf0f4"
                                strokeWidth="19"
                              />
                              {totals.map((t, i) => {
                                const fraction =
                                  t.credits / Math.max(1, stats.credits);
                                const offset =
                                  (totals
                                    .slice(0, i)
                                    .reduce((n, item) => n + item.credits, 0) /
                                    Math.max(1, stats.credits)) *
                                  383.27;
                                return (
                                  <circle
                                    key={t.name}
                                    cx="80"
                                    cy="80"
                                    r="61"
                                    fill="none"
                                    stroke={colors[i]}
                                    strokeWidth="19"
                                    strokeDasharray={`${Math.max(0, fraction * 383.27 - 2)} 383.27`}
                                    strokeDashoffset={-offset}
                                    transform="rotate(-90 80 80)"
                                  />
                                );
                              })}
                            </svg>
                            <div className="donut-center">
                              <strong>{number(stats.credits)}</strong>
                              <span>crédits</span>
                            </div>
                          </div>
                          <ul className="category-legend">
                            {totals.map((t, i) => (
                              <li key={t.name}>
                                <span>
                                  <i style={{ background: colors[i] }} />
                                  {t.name}
                                </span>
                                <strong>
                                  {new Intl.NumberFormat("fr-FR", {
                                    maximumFractionDigits: 1,
                                  }).format(
                                    (t.credits / stats.credits) * 100,
                                  )}{" "}
                                  %
                                </strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Panel>
                      <Panel
                        title="Consommation par type d’usage"
                        subtitle="Crédits quotidiens, toutes catégories confondues"
                      >
                        <div
                          className="stacked-chart"
                          role="img"
                          aria-label={currentDaily
                            .map(
                              (d) =>
                                `${shortDate(d.date)} : ${categories.map((c, i) => `${c} ${d.categories[i]}`).join(", ")}`,
                            )
                            .join(" ; ")}
                        >
                          <div className="stacked-bars">
                            {currentDaily.map((d) => (
                              <div
                                className="bar-column"
                                key={d.date}
                                title={`${shortDate(d.date)} · ${number(d.credits)} crédits`}
                                style={{
                                  height: `${(d.credits / Math.max(...currentDaily.map((v) => v.credits), 1)) * 100}%`,
                                }}
                              >
                                {d.categories.map((v, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      height: `${(v / Math.max(1, d.credits)) * 100}%`,
                                      background: colors[i],
                                    }}
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                          <div className="bar-labels">
                            <span>{shortDate(currentDaily[0].date)}</span>
                            <span>
                              {shortDate(
                                currentDaily[Math.floor(filters.days / 2)].date,
                              )}
                            </span>
                            <span>{shortDate(DEMO_DATE)}</span>
                          </div>
                        </div>
                        <div className="chart-legend wrap">
                          {categories.map((c, i) => (
                            <span key={c}>
                              <i style={{ background: colors[i] }} />
                              {c}
                            </span>
                          ))}
                        </div>
                      </Panel>
                    </div>
                    <div className="section-title">
                      <div>
                        <h2>Utilisation des modèles</h2>
                        <p>
                          Identifiez les modèles qui accompagnent votre équipe.
                        </p>
                      </div>
                      <span className="section-icon">
                        <Bot size={20} />
                      </span>
                    </div>
                    <div
                      className="summary-grid"
                      aria-label="Synthèse des modèles"
                    >
                      <article>
                        <span>Modèles utilisés</span>
                        <strong>{rank(modelEvents, "model").length}</strong>
                      </article>
                      <article>
                        <span>Nombre d’appels</span>
                        <strong>{number(modelEvents.length)}</strong>
                      </article>
                      <article>
                        <span>Crédits consommés</span>
                        <strong>
                          {number(summarize(modelEvents).credits)}
                        </strong>
                      </article>
                    </div>
                    <div
                      className="category-tabs"
                      aria-label="Filtrer les modèles par catégorie"
                    >
                      <button
                        className={category === "all" ? "selected" : ""}
                        aria-pressed={category === "all"}
                        onClick={() => setCategory("all")}
                      >
                        Tous les modèles
                      </button>
                      {categories.map((c) => (
                        <button
                          key={c}
                          aria-pressed={category === c}
                          className={category === c ? "selected" : ""}
                          onClick={() => setCategory(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    {modelEvents.length ? (
                      <div className="two-columns">
                        <Panel
                          title="Modèles les plus sollicités"
                          subtitle={`${number(modelEvents.length)} appels sur la sélection`}
                        >
                          <RankingList
                            items={rank(modelEvents, "model", "calls")}
                            metric="calls"
                            unit="appels"
                          />
                        </Panel>
                        <Panel
                          title="Crédits par modèle"
                          subtitle={`${number(summarize(modelEvents).credits)} crédits sur la sélection`}
                        >
                          <RankingList items={rank(modelEvents, "model")} />
                        </Panel>
                      </div>
                    ) : (
                      <div className="inline-empty">
                        Aucun appel pour cette catégorie.{" "}
                        <button onClick={() => setCategory("all")}>
                          Voir tous les modèles
                        </button>
                      </div>
                    )}
                    <div className="section-title">
                      <div>
                        <h2>Activité des profils</h2>
                        <p>
                          Comprenez comment les crédits sont répartis dans votre
                          organisation.
                        </p>
                      </div>
                      <span className="section-icon">
                        <Users size={20} />
                      </span>
                    </div>
                    <div
                      className="summary-grid"
                      aria-label="Synthèse des profils"
                    >
                      <article>
                        <span>Profils utilisés</span>
                        <strong>{rank(filtered, "profile").length}</strong>
                      </article>
                      <article>
                        <span>Profil le plus actif</span>
                        <strong className="summary-name">
                          {rank(filtered, "profile", "calls")[0]?.name || "—"}
                        </strong>
                        <small>
                          {number(
                            rank(filtered, "profile", "calls")[0]?.calls || 0,
                          )}{" "}
                          appels
                        </small>
                      </article>
                      <article>
                        <span>Premier consommateur</span>
                        <strong className="summary-name">
                          {rank(filtered, "profile")[0]?.name || "—"}
                        </strong>
                        <small>
                          {number(rank(filtered, "profile")[0]?.credits || 0)}{" "}
                          crédits
                        </small>
                      </article>
                    </div>
                    <div className="two-columns">
                      <Panel
                        title="Profils les plus actifs"
                        subtitle="Classés par nombre d’appels"
                      >
                        <RankingList
                          items={rank(filtered, "profile", "calls")}
                          metric="calls"
                          unit="appels"
                          profilesMode
                        />
                      </Panel>
                      <Panel
                        title="Crédits par profil"
                        subtitle="Consommation totale par profil"
                      >
                        <RankingList
                          items={rank(filtered, "profile")}
                          profilesMode
                        />
                      </Panel>
                    </div>
                  </>
                )}
              </>
            )}
            {tab === "Détail d’utilisation" && (
              <Panel
                title="Détail d’utilisation"
                subtitle="Un événement par appel · Données de démonstration"
                className="details-panel"
                aside={
                  <span className="chart-badge">
                    {number(rows.length)} événements
                  </span>
                }
              >
                <div className="table-toolbar">
                  <label className="search-field">
                    <Search size={17} />
                    <span className="sr-only">
                      Rechercher dans les événements
                    </span>
                    <input
                      type="search"
                      value={query}
                      placeholder="Rechercher un utilisateur, un modèle, un profil…"
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(0);
                      }}
                    />
                  </label>
                  <span>Le CSV inclut cette recherche.</span>
                </div>
                {!rows.length ? (
                  <Empty onReset={reset} />
                ) : (
                  <>
                    <div
                      className="table-scroll"
                      tabIndex={0}
                      role="region"
                      aria-label="Événements d’utilisation, tableau défilant"
                    >
                      <table>
                        <caption className="sr-only">
                          Appels de démonstration filtrés
                        </caption>
                        <thead>
                          <tr>
                            {[
                              "Date",
                              "Utilisateur",
                              "Collaborateur IA",
                              "Profil",
                              "Modèle",
                              "Crédits",
                              "Valeur USD",
                              "Tâches",
                            ].map((h) => (
                              <th scope="col" key={h}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows
                            .slice(visiblePage * 15, (visiblePage + 1) * 15)
                            .map((e) => (
                              <tr key={e.id}>
                                <td>{shortDate(e.date)}</td>
                                <td>{e.user}</td>
                                <td>{e.collaborator}</td>
                                <td>
                                  <span className="profile-badge">
                                    {e.profile}
                                  </span>
                                </td>
                                <td>{e.model}</td>
                                <td className="numeric">{number(e.credits)}</td>
                                <td className="numeric">
                                  {dollars(e.costUsd)}
                                </td>
                                <td className="numeric">{e.scheduledTasks}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="pagination">
                      <span>
                        {visiblePage * 15 + 1}–
                        {Math.min((visiblePage + 1) * 15, rows.length)} sur{" "}
                        {number(rows.length)} événements
                      </span>
                      <div>
                        <button
                          className="icon-button"
                          disabled={visiblePage === 0}
                          aria-label="Page précédente"
                          onClick={() => setPage(visiblePage - 1)}
                        >
                          <ChevronLeft size={17} />
                        </button>
                        <span>
                          Page {visiblePage + 1} / {pageCount}
                        </span>
                        <button
                          className="icon-button"
                          disabled={visiblePage === pageCount - 1}
                          aria-label="Page suivante"
                          onClick={() => setPage(visiblePage + 1)}
                        >
                          <ChevronRight size={17} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </Panel>
            )}
            {tab === "Gérer les quotas" && (
              <Panel
                title="Gérer les quotas"
                subtitle="Gardez la maîtrise de votre consommation"
              >
                <div className="quota-state">
                  <span className="quota-icon">
                    <ShieldCheck size={30} />
                  </span>
                  <span className="demo-pill">
                    Fonctionnalité non connectée
                  </span>
                  <h2>Vos quotas, en toute transparence.</h2>
                  <p>
                    Cette démonstration ne dispose d’aucun accès à votre licence
                    Unitalk. Les quotas réels ne peuvent être ni consultés, ni
                    modifiés ici.
                  </p>
                  <div className="quota-facts">
                    <span>
                      <Check size={16} /> Aucun changement sur votre compte
                    </span>
                    <span>
                      <Check size={16} /> Aucun enregistrement de quota
                    </span>
                    <span>
                      <Check size={16} /> Données exclusivement synthétiques
                    </span>
                  </div>
                  <button
                    className="button primary"
                    onClick={() => setTab("Dashboard")}
                  >
                    Revenir au dashboard <ArrowUpRight size={15} />
                  </button>
                </div>
              </Panel>
            )}
          </div>
          <footer>
            <span>
              <span className="footer-dot" />
              Démonstration locale · Aucune donnée réelle
            </span>
            <span>
              Conçu pour une utilisation plus éclairée <HelpCircle size={13} />
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
