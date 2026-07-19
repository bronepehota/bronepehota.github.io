import type { JsonLdThing } from '@/lib/seo';

/**
 * Renders a JSON-LD `<script>` for structured data (rich results / entity recognition).
 * Server component — emits raw JSON into the static HTML so crawlers see it.
 */
export default function JsonLd({ data }: { data: JsonLdThing | JsonLdThing[] }) {
  const graph = Array.isArray(data) ? data : [data];
  const payload = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
  return (
    <script
      type="application/ld+json"
      // Controlled, build-time-generated schema data — safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
