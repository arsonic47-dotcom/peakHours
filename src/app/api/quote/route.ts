import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("https://zenquotes.io/api/random", {
      headers: { "User-Agent": "PeakHours/1.0" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ fallback: true }, { status: 502 });
    }

    const data = await res.json();
    const q = data?.[0];

    if (q?.q && q?.a && q.a !== "ZenQuotes.io") {
      return NextResponse.json({ text: q.q, author: q.a });
    }

    return NextResponse.json({ fallback: true }, { status: 429 });
  } catch {
    return NextResponse.json({ fallback: true }, { status: 502 });
  }
}
