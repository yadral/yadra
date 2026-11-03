import Link from "next/link";
import {
  ARCHITECTURE_VERSION,
  docHref,
  DocProduct,
  Locale,
  navForProduct,
} from "@/lib/nav";

export function Sidebar({
  activeSlug,
  locale,
  version,
  grammarVersion,
  product,
}: {
  activeSlug: string;
  locale: Locale;
  version: string;
  grammarVersion?: string;
  product: DocProduct;
}) {
  const nav = navForProduct(product);
  const sections = [...new Set(nav.map((n) => n.section[locale]))];

  return (
    <aside className="sidebar" aria-label="Documentation navigation">
      <div className="sidebar-version-box">
        <div className="sidebar-version-row">
          <span className="sidebar-version-label">
            {product === "ksl"
              ? locale === "fr"
                ? "Grammaire KSL"
                : "KSL grammar"
              : locale === "fr"
                ? "Version CLI"
                : "CLI Version"}
          </span>
          <span className="version-pill">
            v{product === "ksl" ? (grammarVersion ?? "1.0") : version}
          </span>
        </div>
        <div className="sidebar-manifest-hint">
          <code>
            {product === "ksl" ? "ksl/grammar/ksl.ebnf" : "yadra/manifest.mf"}
          </code>
        </div>
      </div>

      {sections.map((sectionName) => {
        const items = nav.filter((n) => n.section[locale] === sectionName);
        const sectionActive = items.some((item) => item.slug === activeSlug);
        return (
          <details
            key={sectionName}
            className="sidebar-section sidebar-accordion"
            open={sectionActive}
          >
            <summary className="sidebar-heading">{sectionName}</summary>
            <ul className="sidebar-list">
              {items.map((item) => {
                const isActive = activeSlug === item.slug;
                return (
                  <li key={item.slug}>
                    <Link
                      href={docHref(item.slug, locale)}
                      className={
                        isActive ? "sidebar-link active" : "sidebar-link"
                      }
                    >
                      <span>{item.title[locale]}</span>
                      {item.badge && (
                        <span className={`nav-badge badge-${item.badge.toLowerCase()}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}

      {product === "yadra" ? (
        <details className="sidebar-section sidebar-arch-box sidebar-accordion">
          <summary className="sidebar-heading">
            {locale === "fr"
              ? `Schémas d'architecture (v${ARCHITECTURE_VERSION})`
              : `Architecture Diagrams (v${ARCHITECTURE_VERSION})`}
          </summary>
          <div className="arch-links">
            <a
              href={`/architecture/${ARCHITECTURE_VERSION}-ksl-yadra-integrated-architecture.html`}
              className="arch-card-link"
            >
              <span className="arch-card-title">
                {locale === "fr"
                  ? "Deux Timelines (T1 & T2)"
                  : "Two Timelines (T1 & T2)"}
              </span>
              <span className="arch-card-sub">
                {ARCHITECTURE_VERSION}-ksl-yadra-integrated-architecture.html ↗
              </span>
            </a>
            <a
              href={`/architecture/${ARCHITECTURE_VERSION}-yadra-core-ksl-families.html`}
              className="arch-card-link"
            >
              <span className="arch-card-title">
                {locale === "fr"
                  ? "Cœur Yadra & 4 Familles KSL"
                  : "Yadra Core & 4 KSL Families"}
              </span>
              <span className="arch-card-sub">
                {ARCHITECTURE_VERSION}-yadra-core-ksl-families.html ↗
              </span>
            </a>
          </div>
        </details>
      ) : (
        <details className="sidebar-section sidebar-arch-box sidebar-accordion">
          <summary className="sidebar-heading">
            {locale === "fr" ? "Outils Yadra" : "Yadra tooling"}
          </summary>
          <div className="arch-links">
            <Link href={docHref("validate", locale)} className="arch-card-link">
              <span className="arch-card-title">yadra validate</span>
              <span className="arch-card-sub">
                {locale === "fr"
                  ? "Contrôles L0–L3 sur les fichiers .ksl"
                  : "L0–L3 checks on .ksl files"}
              </span>
            </Link>
            <Link href={docHref("seal", locale)} className="arch-card-link">
              <span className="arch-card-title">yadra seal</span>
              <span className="arch-card-sub">
                {locale === "fr"
                  ? "Scellement T1 du contrat KSL"
                  : "T1 seal of the KSL contract"}
              </span>
            </Link>
            <Link href={docHref("plan", locale)} className="arch-card-link">
              <span className="arch-card-title">yadra plan</span>
              <span className="arch-card-sub">
                {locale === "fr"
                  ? "Plan de compilation T2 (dry-run)"
                  : "T2 compile plan (dry-run)"}
              </span>
            </Link>
          </div>
        </details>
      )}
    </aside>
  );
}
