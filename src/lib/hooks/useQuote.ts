"use client";

import { useState, useEffect } from "react";

export interface Quote {
  text: string;
  author: string;
}

const FALLBACKS: Quote[] = [
  { text: "One more hour. One step closer to the summit.", author: "PeakHours" },
  { text: "You've already come so far.", author: "PeakHours" },
  { text: "Small steps lead to great heights.", author: "PeakHours" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "PeakHours" },
  { text: "Every session counts. Every hour matters.", author: "PeakHours" },
  { text: "You are building something extraordinary.", author: "PeakHours" },
  { text: "Progress, not perfection.", author: "PeakHours" },
  { text: "You didn't come this far to only come this far.", author: "PeakHours" },
  { text: "Your future self is thanking you right now.", author: "PeakHours" },
];

const DEFAULT_QUOTE: Quote = { text: "One more hour. One step closer to the summit.", author: "PeakHours" };

function randomFallback(): Quote {
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

export function useQuote(): { quote: Quote; loading: boolean } {
  const [quote, setQuote] = useState<Quote>(DEFAULT_QUOTE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const pick = randomFallback();
    setQuote(pick);
    setLoading(false);

    fetch("/api/quote")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.text && data?.author) {
          setQuote({ text: data.text, author: data.author });
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  return { quote, loading };
}
