'use client';
import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface HelpfulVoteProps {
  articleId: string; initialYes: number; initialNo: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:10311';

export function HelpfulVote({ articleId, initialYes, initialNo }: HelpfulVoteProps) {
  const [voted, setVoted]   = useState<boolean | null>(null);
  const [yes, setYes]       = useState(initialYes);
  const [no, setNo]         = useState(initialNo);

  const vote = async (helpful: boolean) => {
    if (voted !== null) return;
    try {
      await fetch(`${API_URL}/help/articles/${articleId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      });
      if (helpful) setYes((n) => n + 1);
      else setNo((n) => n + 1);
      setVoted(helpful);
    } catch { /* silent fail */ }
  };

  if (voted !== null) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
        {voted ? '👍 Thanks for the feedback!' : '👎 We\'ll work on improving this.'}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => vote(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
      >
        <ThumbsUp className="size-4" /> Yes {yes > 0 && <span className="text-muted-foreground text-xs">({yes})</span>}
      </button>
      <button
        onClick={() => vote(false)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive transition-all"
      >
        <ThumbsDown className="size-4" /> No {no > 0 && <span className="text-muted-foreground text-xs">({no})</span>}
      </button>
    </div>
  );
}
