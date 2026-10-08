export const DEMO_DATE = "2026-10-08";
export const DEMO_ALLOCATION = 100000;
export const DEMO_USD_PER_CREDIT = 0.001;
export const categories = [
  "Texte",
  "Vidéo",
  "Audio",
  "Image",
  "Connaissance",
  "Autre",
] as const;
export type Category = (typeof categories)[number];
export const users = [
  "Camille Martin",
  "Alex Thomas",
  "Sarah Dubois",
  "Louis Bernard",
  "Emma Petit",
  "Hugo Robert",
  "Léa Moreau",
  "Noah Laurent",
];
export const collaborators = [
  "Alma",
  "Studio créatif",
  "Analyste financier",
  "Assistant rédaction",
  "Expert juridique",
  "Support client",
];
export const profiles = [
  "Marketing",
  "Finance",
  "Opérations",
  "Équipe produit",
];
export const modelDefinitions = [
  { name: "GPT-4.1", category: "Texte" },
  { name: "Claude Sonnet 4", category: "Texte" },
  { name: "Veo 3", category: "Vidéo" },
  { name: "Whisper", category: "Audio" },
  { name: "GPT Image", category: "Image" },
  { name: "Recherche documentaire", category: "Connaissance" },
  { name: "Outils & automatisations", category: "Autre" },
] as const;
export interface UsageEvent {
  id: string;
  date: string;
  user: string;
  collaborator: string;
  profile: string;
  model: string;
  category: Category;
  credits: number;
  costUsd: number;
  chatId: string;
  scheduledTasks: number;
}
export interface Filters {
  days: 7 | 30;
  user: string;
  collaborator: string;
  profile: string;
}
export const defaultFilters: Filters = {
  days: 30,
  user: "all",
  collaborator: "all",
  profile: "all",
};
export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
// Seeded local generator: never represents connected account or provider data.
function createEvents(): UsageEvent[] {
  let seed = 8247;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const result: UsageEvent[] = [];
  for (let day = 59; day >= 0; day--) {
    const count = 11 + Math.floor(random() * 15) + (day < 30 ? 5 : 0);
    for (let i = 0; i < count; i++) {
      const model =
        modelDefinitions[Math.floor(random() * modelDefinitions.length)];
      const user = users[Math.floor(random() * users.length)];
      const credits = Math.round(
        5 + random() * (model.category === "Vidéo" ? 210 : 85),
      );
      const costUsd = credits * DEMO_USD_PER_CREDIT;
      result.push({
        id: `evt-${day}-${i}`,
        date: shiftDate(DEMO_DATE, -day),
        user,
        collaborator:
          collaborators[Math.floor(random() * collaborators.length)],
        profile: profiles[Math.floor(random() * profiles.length)],
        model: model.name,
        category: model.category,
        credits,
        costUsd,
        chatId: `${day}-${user}-${Math.floor(i / 4)}`,
        scheduledTasks: random() > 0.8 ? 1 : 0,
      });
    }
  }
  return result;
}
export const events = createEvents();
export function filterEvents(
  source: UsageEvent[],
  filters: Filters,
  previous = false,
) {
  const end = shiftDate(DEMO_DATE, previous ? -filters.days : 0);
  const start = shiftDate(end, -(filters.days - 1));
  return source.filter(
    (e) =>
      e.date >= start &&
      e.date <= end &&
      (filters.user === "all" || e.user === filters.user) &&
      (filters.collaborator === "all" ||
        e.collaborator === filters.collaborator) &&
      (filters.profile === "all" || e.profile === filters.profile),
  );
}
export function summarize(source: UsageEvent[]) {
  return {
    users: new Set(source.map((e) => e.user)).size,
    collaborators: new Set(source.map((e) => e.collaborator)).size,
    credits: source.reduce((n, e) => n + e.credits, 0),
    costUsd: source.reduce((n, e) => n + e.costUsd, 0),
    chats: new Set(source.map((e) => e.chatId)).size,
    scheduledTasks: source.reduce((n, e) => n + e.scheduledTasks, 0),
    calls: source.length,
  };
}
export interface Ranking {
  name: string;
  calls: number;
  credits: number;
  users: number;
}
export function rank(
  source: UsageEvent[],
  field: "collaborator" | "model" | "profile",
  by: "calls" | "credits" = "credits",
): Ranking[] {
  const groups = new Map<string, UsageEvent[]>();
  for (const e of source) {
    const name = e[field];
    groups.set(name, [...(groups.get(name) || []), e]);
  }
  return Array.from(groups, ([name, group]) => ({
    name,
    calls: group.length,
    credits: summarize(group).credits,
    users: summarize(group).users,
  })).sort((a, b) => b[by] - a[by] || a.name.localeCompare(b.name));
}
export function daily(source: UsageEvent[], days: number, previous = false) {
  const end = shiftDate(DEMO_DATE, previous ? -days : 0);
  return Array.from({ length: days }, (_, i) => {
    const date = shiftDate(end, i - days + 1);
    const group = source.filter((e) => e.date === date);
    return {
      date,
      ...summarize(group),
      categories: categories.map((category) =>
        group
          .filter((e) => e.category === category)
          .reduce((n, e) => n + e.credits, 0),
      ),
    };
  });
}
export function searchEvents(source: UsageEvent[], query: string) {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const q = normalize(query.trim());
  return source.filter((e) =>
    normalize(
      [e.date, e.user, e.collaborator, e.profile, e.model, e.category].join(
        " ",
      ),
    ).includes(q),
  );
}
export function toCsv(source: UsageEvent[]) {
  const cell = (value: string | number) => {
    const text = String(value);
    const safe = /^[=+@-]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const rows = source.map((e) =>
    [
      e.id,
      e.date,
      e.user,
      e.collaborator,
      e.profile,
      e.model,
      e.category,
      e.credits,
      e.costUsd.toFixed(4),
      e.chatId,
      e.scheduledTasks,
    ]
      .map(cell)
      .join(";"),
  );
  return (
    "\uFEFF" +
    [
      "ID;Date;Utilisateur;Collaborateur IA;Profil;Modèle;Catégorie;Crédits;Coût USD;Conversation;Tâches planifiées",
      ...rows,
    ].join("\r\n")
  );
}
