type JsonLd = Record<string, unknown>;

export function JsonLdScript({ data }: { data: JsonLd }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be a string in the HTML source for crawlers
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function softwareApplicationJsonLd({
  siteUrl,
  name,
  description,
}: {
  siteUrl: string;
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    url: siteUrl,
    description,
    applicationCategory: "AccountingSoftware",
    operatingSystem: "Web",
  } satisfies JsonLd;
}

export function faqPageJsonLd({
  questions,
}: {
  questions: Array<{ question: string; answer: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  } satisfies JsonLd;
}


