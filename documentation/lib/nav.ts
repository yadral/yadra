export type Locale = "fr" | "en";
export type DocProduct = "yadra" | "ksl";

export type NavItem = {
  slug: string;
  product: DocProduct;
  title: { fr: string; en: string };
  section: { fr: string; en: string };
  badge?: string;
  since?: string;
};

export function productFromSlug(slug: string): DocProduct {
  return slug.startsWith("ksl/") ? "ksl" : "yadra";
}

export function navForProduct(product: DocProduct): NavItem[] {
  return NAV.filter((n) => n.product === product);
}

export function defaultSlugForProduct(product: DocProduct): string {
  return product === "ksl" ? "ksl/overview" : "overview";
}

export const AVAILABLE_VERSIONS = [
  "0.1.0",
  "0.1.1",
  "0.1.2",
  "0.1.3",
  "0.1.4",
  "0.1.5",
  "0.1.6",
  "0.1.7",
  "0.1.8",
  "0.1.9",
] as const;

/** Diagrammes HTML embarqués (indépendants du bump CLI). */
export const ARCHITECTURE_VERSION = "0.1.0";

export const NAV: NavItem[] = [
  {
    slug: "overview",
    product: "yadra",
    title: { fr: "Vue d'ensemble", en: "Overview" },
    section: { fr: "Introduction", en: "Getting Started" },
    since: "0.1.0",
  },
  {
    slug: "architecture",
    product: "yadra",
    title: { fr: "Architecture & Timelines", en: "Architecture & Timelines" },
    section: { fr: "Introduction", en: "Getting Started" },
    badge: "HTML",
    since: "0.1.0",
  },
  {
    slug: "package-process",
    product: "yadra",
    title: { fr: "Package process", en: "Package process" },
    section: { fr: "Introduction", en: "Getting Started" },
    badge: "npm",
    since: "0.1.0",
  },
  {
    slug: "version",
    product: "yadra",
    title: { fr: "yadra version", en: "yadra version" },
    section: { fr: "CLI — Transversal", en: "CLI — Cross-cutting" },
    badge: "CLI",
    since: "0.1.0",
  },
  {
    slug: "help",
    product: "yadra",
    title: { fr: "yadra help", en: "yadra help" },
    section: { fr: "CLI — Transversal", en: "CLI — Cross-cutting" },
    badge: "CLI",
    since: "0.1.0",
  },
  {
    slug: "configure",
    product: "yadra",
    title: { fr: "yadra configure", en: "yadra configure" },
    section: { fr: "CLI — Transversal", en: "CLI — Cross-cutting" },
    badge: "CLI",
    since: "0.1.0",
  },
  {
    slug: "project",
    product: "yadra",
    title: { fr: "yadra project", en: "yadra project" },
    section: { fr: "CLI — Transversal", en: "CLI — Cross-cutting" },
    badge: "CLI",
    since: "0.1.1",
  },
  {
    slug: "formalize",
    product: "yadra",
    title: { fr: "yadra formalize", en: "yadra formalize" },
    section: { fr: "Timeline 1 (T1)", en: "Timeline 1 (T1)" },
    badge: "T1",
    since: "0.1.0",
  },
  {
    slug: "validate",
    product: "yadra",
    title: { fr: "yadra validate", en: "yadra validate" },
    section: { fr: "Timeline 1 (T1)", en: "Timeline 1 (T1)" },
    badge: "T1",
    since: "0.1.0",
  },
  {
    slug: "seal",
    product: "yadra",
    title: { fr: "yadra seal", en: "yadra seal" },
    section: { fr: "Timeline 1 (T1)", en: "Timeline 1 (T1)" },
    badge: "T1",
    since: "0.1.0",
  },
  {
    slug: "plan",
    product: "yadra",
    title: { fr: "yadra plan", en: "yadra plan" },
    section: { fr: "Timeline 2 (T2)", en: "Timeline 2 (T2)" },
    badge: "T2",
    since: "0.1.2",
  },
  {
    slug: "strategies",
    product: "yadra",
    title: { fr: "yadra strategies", en: "yadra strategies" },
    section: { fr: "Timeline 2 (T2)", en: "Timeline 2 (T2)" },
    badge: "T2",
    since: "0.1.3",
  },
  {
    slug: "execute",
    product: "yadra",
    title: { fr: "yadra execute", en: "yadra execute" },
    section: { fr: "Timeline 2 (T2)", en: "Timeline 2 (T2)" },
    badge: "T2",
    since: "0.1.5",
  },
  {
    slug: "files/projects-json",
    product: "yadra",
    title: { fr: "projects.json", en: "projects.json" },
    section: { fr: "Fichiers de configuration", en: "Configuration Files" },
    badge: "JSON",
    since: "0.1.1",
  },
  {
    slug: "files/configure-credentials",
    product: "yadra",
    title: { fr: "configure & credentials", en: "configure & credentials" },
    section: { fr: "Fichiers de configuration", en: "Configuration Files" },
    badge: "INI",
    since: "0.1.0",
  },
  {
    slug: "ksl/overview",
    product: "ksl",
    title: { fr: "Vue d'ensemble KSL", en: "KSL Overview" },
    section: { fr: "Langage KSL", en: "KSL Language" },
    badge: "KSL",
    since: "1.0",
  },
  {
    slug: "ksl/language-spec",
    product: "ksl",
    title: { fr: "Spécification normative", en: "Normative specification" },
    section: { fr: "Langage KSL", en: "KSL Language" },
    badge: "spec",
    since: "1.0",
  },
  {
    slug: "ksl/grammar",
    product: "ksl",
    title: { fr: "Grammaire EBNF", en: "EBNF grammar" },
    section: { fr: "Langage KSL", en: "KSL Language" },
    badge: "ebnf",
    since: "1.0",
  },
  {
    slug: "ksl/reference",
    product: "ksl",
    title: { fr: "Index Reference", en: "Reference index" },
    section: { fr: "Référence KSL", en: "KSL Reference" },
    badge: "ref",
    since: "1.0",
  },
  {
    slug: "ksl/reference/project",
    product: "ksl",
    title: { fr: "project", en: "project" },
    section: { fr: "Référence KSL", en: "KSL Reference" },
    badge: "ref",
    since: "1.0",
  },
  {
    slug: "ksl/reference/module",
    product: "ksl",
    title: { fr: "module", en: "module" },
    section: { fr: "Référence KSL", en: "KSL Reference" },
    badge: "ref",
    since: "1.0",
  },
  {
    slug: "ksl/reference/spec",
    product: "ksl",
    title: { fr: "spec", en: "spec" },
    section: { fr: "Référence KSL", en: "KSL Reference" },
    badge: "ref",
    since: "1.0",
  },
];

export function docHref(slug: string, locale: Locale): string {
  if (locale === "en") {
    return slug === "overview" ? "/docs/en/overview/" : `/docs/en/${slug}/`;
  }
  return slug === "overview" ? "/" : `/docs/${slug}/`;
}
