import { useCallback } from "react";
import Card from "@/shared/components/ui/Card";
import Typography from "@/shared/components/ui/Typography";
import { cn } from "@/shared/utils/styling";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useLocations } from "../hooks/useLocations";
import { useSubLocations } from "../hooks/useSubLocations";
import {
  selectSelectedLocationPath,
  setSelectedLocationPath,
} from "../store/searchSlice";
import type { Location } from "../types";

export default function LocationList() {
  const dispatch = useAppDispatch();
  const { data: locations = [] } = useLocations();
  const selectedPath = useAppSelector(selectSelectedLocationPath);

  const selectedParent = selectedPath.find((l) => l.level === 1);

  const { data: subLocations = [], isLoading } = useSubLocations(
    selectedParent?.externalID ?? null,
  );

  const hasChildren = selectedParent && subLocations.length > 0;
  const displayItems = hasChildren ? subLocations : locations;

  const handleClick = useCallback(
    (loc: Location) => {
      const isSelected = selectedPath.some(
        (location) => location.externalID === loc.externalID,
      );

      if (isSelected) {
        dispatch(
          setSelectedLocationPath(
            loc.level === 1 ? [] : selectedPath.slice(0, 1),
          ),
        );
      } else {
        dispatch(
          setSelectedLocationPath(
            loc.level === 1 ? [loc] : [selectedPath[0], loc],
          ),
        );
      }
    },
    [dispatch, selectedPath],
  );

  return (
    <Card variant="primary" className="border">
      <Typography variant="h2-bold" className="mb-3">
        Locations
      </Typography>

      {hasChildren && (
        <button
          type="button"
          onClick={() => dispatch(setSelectedLocationPath([]))}
          className="text-black font-bold mb-3"
        >
          Lebanon
        </button>
      )}

      {hasChildren && selectedParent && (
        <Typography variant="body-text-bold" className="mb-3">
          {selectedParent.name}
        </Typography>
      )}

      <div
        className={cn(
          "max-h-64 overflow-y-auto transition-opacity",
          isLoading && "opacity-60",
        )}
      >
        <ul className="flex flex-col gap-1">
          {displayItems.map((loc) => {
            const isSelected = selectedPath.some(
              (location) => location.externalID === loc.externalID,
            );
            return (
              <li key={loc.externalID}>
                <button
                  type="button"
                  onClick={() => handleClick(loc)}
                  className="w-full px-3 py-2 flex justify-between items-center"
                >
                  <Typography
                    variant="body-text-regular"
                    className={cn(isSelected && "text-black font-bold")}
                  >
                    {loc.name}
                  </Typography>
                  <Typography
                    variant="body-text-regular"
                    className="text-gray-400"
                  >
                    ({loc.count})
                  </Typography>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
