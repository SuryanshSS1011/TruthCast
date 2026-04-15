import { notFound } from "next/navigation";
import Link from "next/link";
import { getCachedVerdict } from "@truthcast/pipeline/db/init";
import type { Metadata } from "next";
import { VerdictPageClient } from "./VerdictPageClient";

interface VerdictPageProps {
  params: { claim_hash: string };
}

export async function generateMetadata({
  params,
}: VerdictPageProps): Promise<Metadata> {
  const verdict = await getCachedVerdict(params.claim_hash);

  if (!verdict) {
    return {
      title: "Verdict Not Found - TruthCast",
    };
  }

  const firstSentence = verdict.reasoning.split(".")[0] + ".";

  // Generate ClaimReview JSON-LD
  const claimReviewSchema = {
    "@context": "https://schema.org",
    "@type": "ClaimReview",
    url: `https://truthcast.tech/verdict/${params.claim_hash}`,
    claimReviewed: verdict.claim_text,
    reviewRating: {
      "@type": "Rating",
      ratingValue: verdict.confidence,
      bestRating: 100,
      worstRating: 0,
      alternateName: verdict.verdict,
    },
    author: {
      "@type": "Organization",
      name: "TruthCast",
      url: "https://truthcast.tech",
    },
    datePublished: new Date(verdict.checked_at * 1000).toISOString(),
    itemReviewed: {
      "@type": "Claim",
      appearance: verdict.sources.map((s) => ({
        "@type": "Article",
        url: s.url,
        publisher: {
          "@type": "Organization",
          name: s.domain,
        },
      })),
    },
  };

  return {
    title: `${verdict.verdict.replace(/_/g, " ")} - ${verdict.claim_text.substring(0, 60)}... - TruthCast`,
    description: firstSentence,
    openGraph: {
      title: `${verdict.verdict.replace(/_/g, " ")}: ${verdict.claim_text}`,
      description: firstSentence,
      type: "article",
      url: `https://truthcast.tech/verdict/${params.claim_hash}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${verdict.verdict.replace(/_/g, " ")}: ${verdict.claim_text}`,
      description: firstSentence,
    },
    other: {
      "script:ld+json": JSON.stringify(claimReviewSchema),
    },
  };
}

export default async function VerdictPage({ params }: VerdictPageProps) {
  const verdict = await getCachedVerdict(params.claim_hash);

  if (!verdict) {
    notFound();
  }

  // Convert to plain object for client component (serialize dates, etc.)
  const serializedVerdict = JSON.parse(JSON.stringify(verdict));

  return <VerdictPageClient verdict={serializedVerdict} />;
}
