import { translateReason, type MatchReason } from "@/lib/matching";
import type { Dictionary } from "@/lib/i18n/types";

/** Zeigt an, warum ein Treffer passt oder hakt - macht das Ranking nachvollziehbar. */
export default function MatchReasons({
  reasons,
  dict,
}: {
  reasons: MatchReason[];
  dict: Dictionary;
}) {
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
          {reason.good ? "✓" : "!"} {translateReason(reason, dict)}
        </li>
      ))}
    </ul>
  );
}
