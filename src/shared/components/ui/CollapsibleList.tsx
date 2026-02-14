import { useState } from "react";
import Typography from "./Typography";
import { cn } from "@/shared/utils/styling";

type CollapsibleListProps = {
  items: string[];
  initialCount?: number;
  className?: string;
  listClassName?: string;
  buttonClassName?: string;
};

export function CollapsibleList({
  items,
  initialCount = 4,
  className,
  listClassName,
  buttonClassName,
}: CollapsibleListProps) {
  const [expanded, setExpanded] = useState(false);

  const canToggle = items.length > initialCount;
  const visibleItems = expanded ? items : items.slice(0, initialCount);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <ul className={listClassName}>
        {visibleItems.map((item, index) => (
          <li key={`${item}-${index}`}>
            <Typography variant="body-text-regular">{item}</Typography>
          </li>
        ))}
      </ul>

      {canToggle && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={cn("mt-2 text-sm font-medium", buttonClassName)}
        >
          {expanded ? "View less" : "View more"}
        </button>
      )}
    </div>
  );
}
