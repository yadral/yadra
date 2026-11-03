import { DocLayout } from "@/components/DocLayout";
import { MarkdownBody } from "@/components/MarkdownBody";
import { getAllSlugs, getDocBySlug, resolveRouteSegments } from "@/lib/docs";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  const slugs = getAllSlugs();
  const params: { slug: string[] }[] = [];

  for (const s of slugs) {
    const parts = s.split("/");
    // Default FR route: /docs/<slug>
    params.push({ slug: parts });
    // Explicit FR route: /docs/fr/<slug>
    params.push({ slug: ["fr", ...parts] });
    // Explicit EN route: /docs/en/<slug>
    params.push({ slug: ["en", ...parts] });
  }

  return params;
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: segments } = await params;
  const { locale, slug } = resolveRouteSegments(segments);
  const doc = getDocBySlug(slug, locale);
  if (!doc) notFound();

  return (
    <DocLayout
      slug={doc.slug}
      locale={doc.locale}
      version={doc.version}
      grammarVersion={doc.grammarVersion}
      title={doc.title}
      description={doc.description}
    >
      <MarkdownBody content={doc.content} />
    </DocLayout>
  );
}
