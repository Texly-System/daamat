import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { stripChapterTitle } from "@/lib/chapterHtml";
import { getPackageCatalog, getPackageDoc, getPackageDocs } from "@/lib/content";
import { ogImageUrl, SITE } from "@/lib/site";

export async function generateStaticParams() {
  return getPackageDocs().map((doc) => ({ path: doc.sourcePath.split("/") }));
}

function getPackageForDoc(sourcePath: string) {
  for (const group of getPackageCatalog()) {
    for (const pkg of group.packages) {
      const match = pkg.docs.find((doc) => doc.sourcePath === sourcePath);
      if (match) {
        return { group: group.group, pkg: pkg.name, title: match.title, slug: match.slug };
      }
    }
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ path: string[] }>;
}): Promise<Metadata> {
  const { path } = await params;
  const doc = await getPackageDoc(path);
  if (!doc) return {};
  const url = `${SITE.url}/docs/${doc.slug}`;

  return {
    title: doc.title,
    description: doc.summary,
    alternates: { canonical: url },
    openGraph: {
      title: doc.title,
      description: doc.summary,
      url,
      siteName: `${SITE.name} docs`,
      type: "article",
      images: [
        {
          url: ogImageUrl(doc.title, doc.packageName),
          width: 1200,
          height: 630,
          alt: doc.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: doc.title,
      description: doc.summary,
      images: [ogImageUrl(doc.title, doc.packageName)],
    },
  };
}

export default async function PackageDocPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const sourcePath = path.join("/");
  const doc = await getPackageDoc(path);
  if (!doc) notFound();

  const matched = getPackageForDoc(sourcePath);
  const content = stripChapterTitle(doc.html);

  return (
    <div className="mx-auto max-w-4xl py-10">
      <header>
        <p className="eyebrow">{doc.packageGroup}</p>
        <p className="mt-2 text-sm text-faint">{doc.packageName}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">
          {doc.title}
        </h1>
        <p className="mt-3 text-lg text-muted">{doc.summary}</p>
      </header>

      <div className="mt-6 rounded-lg border border-line bg-surface p-5">
        <p className="text-sm text-muted">
          Source file: <span className="text-ink">{doc.sourcePath}</span>
        </p>
      </div>

      <article
        className="prose mt-8"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted HTML from our own markdown pipeline over repo-controlled content
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <div className="mt-8 border-t border-line pt-6">
        <Link
          href="/docs/package-reference"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          ← Back to package reference
        </Link>
        {matched && (
          <p className="mt-3 text-xs text-faint">
            Showing in {matched.group} · {matched.pkg}
          </p>
        )}
      </div>
    </div>
  );
}
