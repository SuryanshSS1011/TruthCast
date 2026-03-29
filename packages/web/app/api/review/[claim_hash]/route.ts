import { NextRequest, NextResponse } from 'next/server';
import { getCachedVerdict } from '../../../../../../pipeline/db/init';

export async function GET(
  req: NextRequest,
  { params }: { params: { claim_hash: string } }
) {
  try {
    const verdict = getCachedVerdict(params.claim_hash);

    if (!verdict) {
      return NextResponse.json(
        { error: 'Verdict not found' },
        { status: 404 }
      );
    }

    const claimReview = {
      "@context": "https://schema.org",
      "@type": "ClaimReview",
      "url": `https://truthcast.tech/verdict/${params.claim_hash}`,
      "claimReviewed": verdict.claim_text,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": verdict.confidence,
        "bestRating": 100,
        "worstRating": 0,
        "alternateName": verdict.verdict
      },
      "author": {
        "@type": "Organization",
        "name": "TruthCast",
        "url": "https://truthcast.tech"
      },
      "datePublished": new Date(verdict.checked_at * 1000).toISOString(),
      "itemReviewed": {
        "@type": "Claim",
        "appearance": verdict.sources.map((s: any) => ({
          "@type": "Article",
          "url": s.url,
          "publisher": {
            "@type": "Organization",
            "name": s.domain
          }
        }))
      }
    };

    return NextResponse.json(claimReview, {
      headers: {
        'Content-Type': 'application/ld+json',
      },
    });
  } catch (error) {
    console.error('Error generating ClaimReview schema:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
