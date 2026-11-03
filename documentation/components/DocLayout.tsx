import Link from "next/link";
import {
  ARCHITECTURE_VERSION,
  defaultSlugForProduct,
  docHref,
  DocProduct,
  Locale,
  navForProduct,
  productFromSlug,
} from "@/lib/nav";
import { Sidebar } from "./Sidebar";

export function DocLayout({
  slug,
  locale,
  version,
  grammarVersion,
  title,
  description,
  children,
}: {
  slug: string;
  locale: Locale;
  version: string;
  grammarVersion?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const product: DocProduct = productFromSlug(slug);
  const productNav = navForProduct(product);
  const currentIndex = productNav.findIndex((n) => n.slug === slug);
  const prevItem = currentIndex > 0 ? productNav[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < productNav.length - 1
      ? productNav[currentIndex + 1]
      : null;
  const currentNav = productNav[currentIndex];

  return (
    <div className="layout">
      <header className="site-header">
        <div className="header-inner">
          <div className="header-left">
            <Link
              href={docHref(defaultSlugForProduct(product), locale)}
              className="brand"
            >
              <span className="brand-dot" aria-hidden="true" />
              <span className="brand-name">
                {product === "ksl" ? "KSL" : "Yadra"}
              </span>
            </Link>
            <span className="header-tag">
              {locale === "fr" ? "Documentation Officielle" : "Official Documentation"}
            </span>
            <span
              className="header-version"
              title={
                product === "ksl" ? "ksl/grammar/ksl.ebnf" : "yadra/manifest.mf"
              }
            >
              v{product === "ksl" ? (grammarVersion ?? "1.0") : version}
            </span>
          </div>

          <div className="header-right">
            <div
              className="product-switcher"
              role="group"
              aria-label={locale === "fr" ? "Espace documentation" : "Documentation space"}
            >
              <Link
                href={docHref("overview", locale)}
                className={product === "yadra" ? "product-btn active" : "product-btn"}
              >
                Yadra
              </Link>
              <Link
                href={docHref("ksl/overview", locale)}
                className={product === "ksl" ? "product-btn active" : "product-btn"}
              >
                KSL
              </Link>
            </div>
            <a
              href={`/architecture/${ARCHITECTURE_VERSION}-ksl-yadra-integrated-architecture.html`}
              className="header-arch-link"
            >
              {locale === "fr" ? "Architecture T1/T2 ↗" : "T1/T2 Architecture ↗"}
            </a>
            <a
              href={`/architecture/${ARCHITECTURE_VERSION}-yadra-core-ksl-families.html`}
              className="header-arch-link"
            >
              {locale === "fr" ? "Familles KSL ↗" : "KSL Families ↗"}
            </a>
            <div className="lang-switcher" role="group" aria-label="Language">
              <Link
                href={docHref(slug, "fr")}
                className={locale === "fr" ? "lang-btn active" : "lang-btn"}
              >
                FR
              </Link>
              <Link
                href={docHref(slug, "en")}
                className={locale === "en" ? "lang-btn active" : "lang-btn"}
              >
                EN
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="layout-body">
        <Sidebar
          activeSlug={slug}
          locale={locale}
          version={version}
          grammarVersion={grammarVersion}
          product={product}
        />

        <main className="doc-main">
          <div className="doc-header">
            <div className="doc-eyebrow">
              <span>
                {currentNav?.section[locale] ??
                  (product === "ksl" ? "KSL" : "Yadra")}
              </span>
              <span className="eyebrow-sep">·</span>
              <span>
                {locale === "fr"
                  ? `Disponible depuis v${currentNav?.since ?? version}`
                  : `Available since v${currentNav?.since ?? version}`}
              </span>
            </div>
            <h1 className="doc-title">{title}</h1>
            {description && <p className="doc-lead">{description}</p>}
          </div>

          <article className="doc-content">{children}</article>

          <nav className="doc-pager" aria-label="Page navigation">
            {prevItem ? (
              <Link href={docHref(prevItem.slug, locale)} className="pager-card">
                <span className="pager-label">
                  {locale === "fr" ? "← Précédent" : "← Previous"}
                </span>
                <span className="pager-title">{prevItem.title[locale]}</span>
              </Link>
            ) : (
              <div />
            )}
            {nextItem ? (
              <Link
                href={docHref(nextItem.slug, locale)}
                className="pager-card pager-next"
              >
                <span className="pager-label">
                  {locale === "fr" ? "Suivant →" : "Next →"}
                </span>
                <span className="pager-title">{nextItem.title[locale]}</span>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </main>
      </div>
    </div>
  );
}
