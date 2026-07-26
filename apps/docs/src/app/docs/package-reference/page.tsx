import type { Metadata } from "next";
import Link from "next/link";
import { getPackageCatalog } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Package reference",
  description:
    "Indexed package documentation for every package and group, rendered from repo markdown.",
  alternates: { canonical: `${SITE.url}/docs/package-reference` },
  openGraph: {
    title: "Package reference",
    description:
      "Indexed package documentation for every package and group, rendered from repo markdown.",
    url: `${SITE.url}/docs/package-reference`,
    siteName: `${SITE.name} docs`,
    type: "website",
  },
};

export default function PackageReferencePage() {
  const groups = getPackageCatalog();

  return (
    <div className="mx-auto max-w-4xl py-12">
      <header>
        <p className="eyebrow">Package docs</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">
          Package reference
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Every package's in-repo documentation is indexed here first, then
          linked directly into the same docs site so you can read it without
          leaving the Damat app.
        </p>
      </header>

      <section className="mt-10 space-y-8">
        {groups.map((group) => (
          <div key={group.group}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand">
              {group.group}
            </h2>
            <div className="mt-4 space-y-4 rounded-xl border border-line bg-surface p-5">
              {group.packages.map((pkg) => (
                <article
                  key={`${group.group}-${pkg.name}`}
                  className="space-y-3"
                >
                  <p className="font-medium text-ink">{pkg.name}</p>
                  <p className="text-sm text-muted">{pkg.description}</p>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-faint">
                    {pkg.docs.map((doc) => (
                      <li key={doc.sourcePath}>
                        <Link
                          href={`/docs/${doc.slug}`}
                          className="text-brand underline-offset-4 transition hover:text-ink hover:underline"
                        >
                          {doc.title}
                        </Link>
                        <p className="text-xs text-muted">{doc.summary}</p>
                      </li>
                    ))}
                  </ul>
                  {pkg.docs.length === 0 && (
                    <p className="text-xs text-muted">
                      No indexed package docs were found for this package.
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-xl border border-line bg-subtle/70 p-5">
        <p className="font-medium text-ink">Need a quick path?</p>
        <p className="mt-2 text-sm text-muted">
          Jump to package details with search, open the guide chapter on any
          package, or use the top nav link to return here.
        </p>
        <p className="mt-2 text-sm text-muted">
          Tip: relative links from package docs are preserved and rendered
          directly in this app when possible.
        </p>
      </section>
    </div>
  );
}
