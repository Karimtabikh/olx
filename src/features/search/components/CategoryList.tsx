import { useCallback } from "react";
import Card from "@/shared/components/ui/Card";
import Typography from "@/shared/components/ui/Typography";
import { CollapsibleList } from "@/shared/components/ui/CollapsibleList";
import { cn } from "@/shared/utils/styling";
import { useSubCategories } from "../hooks/useSubCategories";
import type { Category, CategoryListProps } from "../types";

export default function CategoryList({
  categories,
  selectedPath,
  onSelect,
}: CategoryListProps) {
  const current = selectedPath[selectedPath.length - 1];
  const fullChain = selectedPath.map((c) => ({
    level: c.level,
    externalID: c.externalID,
  }));

  const { data: children = [], isLoading: childrenLoading } = useSubCategories(
    current?.level < 2 ? fullChain : [],
    current ? current.level + 1 : 1,
  );

  const parentOfcurrent = selectedPath[selectedPath.length - 2];
  const { data: siblings = [] } = useSubCategories(
    selectedPath.length >= 2 ? fullChain.slice(0, -1) : [],
    parentOfcurrent ? parentOfcurrent.level + 1 : 1,
  );

  // Display priority: children > siblings > root
  let displayItems: Category[];
  let displayParent: Category | undefined;

  if (selectedPath.length === 0) {
    displayItems = categories;
  } else if (childrenLoading || children.length > 0) {
    // current has children (or still loading them)
    displayItems = children;
    displayParent = current;
  } else if (siblings.length > 0) {
    // current is a leaf — show its siblings, with parent as header
    displayItems = siblings;
    displayParent = parentOfcurrent;
  } else {
    // Single selected category with no children, show root
    displayItems = categories;
  }

  const handleClick = useCallback(
    (cat: Category) => {
      const isSelected = selectedPath.some(
        (category) => category.externalID === cat.externalID,
      );

      if (isSelected) {
        onSelect(selectedPath.slice(0, cat.level));
      } else {
        onSelect([...selectedPath.slice(0, cat.level), cat]);
      }
    },
    [selectedPath, onSelect],
  );

  return (
    <Card variant="primary" className="border">
      <Typography variant="h2-bold" className="mb-3">
        Categories
      </Typography>

      {displayParent && (
        <button
          type="button"
          onClick={() => onSelect([])}
          className="flex items-center gap-1 mb-3 text-sm font-bold text-black hover:underline"
        >
          All Categories
        </button>
      )}

      {displayParent && (
        <div className="px-3 py-2 rounded-sm flex justify-between items-center">
          <Typography variant="body-text-bold" className="text-black">
            {displayParent.name}
          </Typography>
        </div>
      )}

      {childrenLoading ? (
        <Typography variant="body-text-regular" className="text-gray-400 px-3">
          Loading...
        </Typography>
      ) : (
        <CollapsibleList
          items={displayItems}
          initialCount={4}
          listClassName="flex flex-col gap-1"
          buttonClassName="text-black hover:underline"
          getKey={(cat) => cat.externalID}
          renderItem={(cat) => {
            const isSelected = selectedPath.some(
              (s) => s.externalID === cat.externalID,
            );
            return (
              <button
                type="button"
                onClick={() => handleClick(cat)}
                className="w-full px-3 py-2 flex justify-between items-center"
              >
                <Typography
                  variant="body-text-regular"
                  className={cn(isSelected && "text-black font-bold")}
                >
                  {cat.name}
                </Typography>
                <Typography
                  variant="body-text-regular"
                  className="text-gray-400"
                >
                  ({cat.count.toLocaleString()})
                </Typography>
              </button>
            );
          }}
        />
      )}
    </Card>
  );
}
