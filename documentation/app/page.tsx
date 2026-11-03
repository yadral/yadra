import { DocLayout } from "@/components/DocLayout";
import { MarkdownBody } from "@/components/MarkdownBody";
import { getCliVersion, getDocBySlug } from "@/lib/docs";

export default function HomePage() {
  const doc = getDocBySlug("overview", "fr");
  const version = getCliVersion();
  if (!doc) {
    return (
      <DocLayout
        slug="overview"
        locale="fr"
        version={version}
        title="Yadra"
      >
        <p>Documentation indisponible.</p>
      </DocLayout>
    );
  }
  return (
    <DocLayout
      slug="overview"
      locale="fr"
      version={doc.version}
      title={doc.title}
      description={doc.description}
    >
      <MarkdownBody content={doc.content} />
    </DocLayout>
  );
}
