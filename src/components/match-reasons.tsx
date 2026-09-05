import type { MatchReason } from "@/lib/matching";

/** Zeigt an, warum ein Treffer passt oder hakt - macht das Ranking nachvollziehbar. */
export default function MatchReasons({ reasons }: { reasons: MatchReason[] }) {
  return (
    <ul className="mt-2 space-y-0.5 text-xs">
      {reasons.map((reason, index) => (
        <li
          key={index}
          className={
            reason.good
              ? "text-neutral-600 dark:text-neutral-300"
              : "text-amber-700 dark:text-amber-500"
          }
        >
          {reason.good ? "✓" : "!"} {reason.label}
        </li>
      ))}
    </ul>
  );
}
