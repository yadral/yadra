import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Locale, NAV } from "./nav";
import {
  CLI_PACKAGE_JSON,
  KSL_EBNF_PATH,
  KSL_REFERENCE_DIR,
  KSL_SPEC_PATH,
  MANIFEST_PATH,
} from "./repo-paths";

const CONTENT_DIR = path.join(process.cwd(), "content");

export function getCliVersion(): string {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
      const match = raw.match(/^\s*version\s*[:=]\s*([^\s#]+)/im);
      if (match) return match[1].trim();
    }
    if (fs.existsSync(CLI_PACKAGE_JSON)) {
      const pkg = JSON.parse(fs.readFileSync(CLI_PACKAGE_JSON, "utf8")) as {
        version?: string;
      };
      if (pkg.version) return pkg.version;
    }
  } catch {
    // fallback
  }
  return "0.1.0";
}

export function getGrammarVersion(): string {
  try {
    if (fs.existsSync(KSL_EBNF_PATH)) {
      const raw = fs.readFileSync(KSL_EBNF_PATH, "utf8");
      const match = raw.match(/KSL\s+v(\d+\.\d+)/i);
      if (match) return match[1];
    }
  } catch {
    // fallback
  }
  return "1.0";
}

function architectureHref(locale: Locale): string {
  return locale === "en" ? "/docs/en/architecture/" : "/docs/architecture/";
}

function loadKslLanguageSpec(locale: Locale): string | null {
  if (!fs.existsSync(KSL_SPEC_PATH)) return null;
  let body = fs.readFileSync(KSL_SPEC_PATH, "utf8");
  body = body.replace(/^#[^\n]+\n+/, "");
  body = body.replace(
    /\]\(yadra-ksl-processing\.md\)/g,
    `](${architectureHref(locale)})`,
  );
  body = body.replace(
    /\]\(\.\.\/ksl\/examples\//g,
    "](https://github.com/yadral/yadral/blob/main/yadra/ksl/examples/",
  );
  body = body.replace(
    /\]\(\.\.\/examples\//g,
    "](https://github.com/yadral/yadral/blob/main/yadra/ksl/examples/",
  );
  return body;
}

function readKslEbnf(): string | null {
  if (!fs.existsSync(KSL_EBNF_PATH)) return null;
  return fs.readFileSync(KSL_EBNF_PATH, "utf8");
}

function kslReferencePathForSlug(slug: string): string | null {
  if (slug === "ksl/reference") {
    const readme = path.join(KSL_REFERENCE_DIR, "README.md");
    return fs.existsSync(readme) ? readme : null;
  }
  if (!slug.startsWith("ksl/reference/")) return null;
  const name = slug.slice("ksl/reference/".length);
  const filePath = path.join(KSL_REFERENCE_DIR, `${name}.md`);
  return fs.existsSync(filePath) ? filePath : null;
}

function rewriteKslReferenceMarkdown(body: string, locale: Locale): string {
  const docsRoot = locale === "en" ? "/docs/en" : "/docs";
  body = body.replace(
    /\]\(([a-z0-9-]+)\.md(#[-a-z0-9]+)?\)/gi,
    (_match, name: string, hash?: string) => {
      const refSlug =
        name.toLowerCase() === "readme" ? "ksl/reference" : `ksl/reference/${name}`;
      const base =
        refSlug === "ksl/reference"
          ? `${docsRoot}/ksl/reference/`
          : `${docsRoot}/${refSlug}/`;
      return `](${base}${hash ?? ""})`;
    },
  );
  body = body.replace(
    /\]\(\.\.\/ksl-language-spec\.md\)/g,
    `](${docsRoot}/ksl/language-spec/)`,
  );
  body = body.replace(
    /\]\(\.\.\/\.\.\/ksl\/grammar\/ksl\.ebnf\)/g,
    `](${docsRoot}/ksl/grammar/)`,
  );
  body = body.replace(
    /\]\(\.\.\/\.\.\/yadra-ksl-processing\.md\)/g,
    `](${architectureHref(locale)})`,
  );
  return body;
}

function titleFromMarkdownH1(raw: string): string | null {
  const match = raw.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function kslReferenceSlugsFromDisk(): string[] {
  if (!fs.existsSync(KSL_REFERENCE_DIR)) return [];
  const slugs: string[] = [];
  for (const name of fs.readdirSync(KSL_REFERENCE_DIR)) {
    if (!name.endsWith(".md") || name === "README.md") continue;
    slugs.push(`ksl/reference/${name.slice(0, -3)}`);
  }
  return slugs;
}

/** Nav slugs plus nested KSL reference pages (linked from project/module/spec, not in sidebar). */
export function getAllSlugs(): string[] {
  return [...new Set([...NAV.map((n) => n.slug), ...kslReferenceSlugsFromDisk()])];
}

export function getDocBySlug(
  slug: string,
  locale: Locale = "fr",
): {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  content: string;
  version: string;
  grammarVersion?: string;
} | null {
  const navItem = NAV.find((n) => n.slug === slug);
  const filePath = path.join(CONTENT_DIR, locale, `${slug}.md`);

  const kslRefPath = kslReferencePathForSlug(slug);
  if (kslRefPath) {
    let content = fs.readFileSync(kslRefPath, "utf8");
    content = content.replace(/^#[^\n]+\n+/, "");
    content = rewriteKslReferenceMarkdown(content, locale);
    const h1 = titleFromMarkdownH1(fs.readFileSync(kslRefPath, "utf8"));
    return {
      slug,
      locale,
      title: navItem?.title[locale] ?? h1 ?? slug,
      description:
        locale === "fr"
          ? "Référence KSL v1.0 — arguments et blocs (style Terraform Registry)."
          : "KSL v1.0 reference — arguments and blocks (Terraform Registry style).",
      content,
      version: getCliVersion(),
      grammarVersion: getGrammarVersion(),
    };
  }

  if (slug === "ksl/language-spec") {
    const content = loadKslLanguageSpec(locale);
    if (!content) return null;
    return {
      slug,
      locale,
      title: navItem?.title[locale] ?? "KSL specification",
      description:
        locale === "fr"
          ? "Spécification normative KSL v1.0 — contrat auteur (project, module, spec)."
          : "Normative KSL v1.0 specification — author contract (project, module, spec).",
      content,
      version: getCliVersion(),
      grammarVersion: getGrammarVersion(),
    };
  }

  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { content: fileContent, data } = matter(raw);
  let content = fileContent;

  if (slug === "ksl/grammar") {
    const ebnf = readKslEbnf();
    if (ebnf) {
      content = `${content.trim()}\n\n## \`${path.basename(KSL_EBNF_PATH)}\`\n\n\`\`\`ebnf\n${ebnf.trim()}\n\`\`\`\n`;
    }
  }

  const title =
    (typeof data.title === "string" && data.title) ||
    navItem?.title[locale] ||
    slug;
  const description =
    typeof data.description === "string" ? data.description : "";
  return {
    slug,
    locale,
    title,
    description,
    content,
    version: getCliVersion(),
    grammarVersion: slug.startsWith("ksl/") ? getGrammarVersion() : undefined,
  };
}

export function resolveRouteSegments(segments: string[]): {
  locale: Locale;
  slug: string;
} {
  if (segments[0] === "en") {
    const rest = segments.slice(1);
    return {
      locale: "en",
      slug: rest.length === 0 ? "overview" : rest.join("/"),
    };
  }
  if (segments[0] === "fr") {
    const rest = segments.slice(1);
    return {
      locale: "fr",
      slug: rest.length === 0 ? "overview" : rest.join("/"),
    };
  }
  return {
    locale: "fr",
    slug: segments.join("/"),
  };
}
