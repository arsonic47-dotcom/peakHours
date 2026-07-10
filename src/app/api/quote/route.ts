import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let cachedQuote: { text: string; author: string } | null = null;
let lastFetch = 0;
const CACHE_TTL = 10_000;

export async function GET() {
  const now = Date.now();

  if (cachedQuote && now - lastFetch < CACHE_TTL) {
    return NextResponse.json(cachedQuote);
  }

  try {
    const res = await fetch("https://zenquotes.io/api/random", {
      headers: { "User-Agent": "PeakHours/1.0" },
    });

    if (!res.ok) {
      if (cachedQuote) return NextResponse.json(cachedQuote);
      return NextResponse.json({ fallback: true }, { status: 502 });
    }

    const data = await res.json();
    const q = data?.[0];

    if (q?.q && q?.a && q.a !== "ZenQuotes.io") {
      const quote = { text: q.q, author: q.a };
      cachedQuote = quote;
      lastFetch = Date.now();
      return NextResponse.json(quote);
    }

    if (cachedQuote) return NextResponse.json(cachedQuote);
    return NextResponse.json({ fallback: true }, { status: 429 });
  } catch {
    if (cachedQuote) return NextResponse.json(cachedQuote);
    return NextResponse.json({ fallback: true }, { status: 502 });
  }
}
