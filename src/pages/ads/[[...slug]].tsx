import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import Typography from "@/shared/components/ui/Typography";
import CategoryList from "@/features/search/components/CategoryList";
import LocationList from "@/features/search/components/LocationList";
import { useCategories } from "@/features/search/hooks/useCategories";
import { useLocations } from "@/features/search/hooks/useLocations";
import {
  fetchSubCategories,
  fetchSubLocations,
} from "@/features/search/services/searchService";
import type { Category, Location } from "@/features/search/types";

function buildPath(categoryPath: Category[], locationPath: Location[]): string {
  const parts = ["/ads"];
  for (const cat of categoryPath) {
    parts.push(cat.slug);
  }
  for (const loc of locationPath) {
    parts.push(loc.slug);
  }
  return parts.join("/");
}

export default function AdsPage() {
  const router = useRouter();

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const loading = categoriesLoading || locationsLoading;

  const [selectedCategoryPath, setSelectedCategoryPath] = useState<Category[]>(
    [],
  );
  const [selectedLocationPath, setSelectedLocationPath] = useState<Location[]>(
    [],
  );

  useEffect(() => {
    if (loading) return;

    const slugs = router.query.slug ?? [];
    if (slugs.length === 0) return;

    async function resolveFromUrl() {
      const catPath: Category[] = [];
      const locPath: Location[] = [];
      let currentCatLevel = categories;
      let currentLocLevel = locations;
      let doneWithCategories = false;

      for (const segment of slugs) {
        if (!doneWithCategories) {
          const cat = currentCatLevel.find((c) => c.slug === segment);
          if (cat) {
            catPath.push(cat);
            if (cat.level < 2) {
              const parentChain = catPath.map((c) => ({
                level: c.level,
                externalID: c.externalID,
              }));
              const children = await fetchSubCategories(
                parentChain,
                cat.level + 1,
              );
              currentCatLevel = children;
            } else {
              currentCatLevel = [];
            }
            continue;
          }
          doneWithCategories = true;
        }

        const loc = currentLocLevel.find((l) => l.slug === segment);
        if (loc) {
          locPath.push(loc);
          if (loc.level === 1) {
            const subs = await fetchSubLocations(loc.externalID);
            currentLocLevel = subs;
          } else {
            currentLocLevel = [];
          }
          continue;
        }
      }

      setSelectedCategoryPath(catPath);
      setSelectedLocationPath(locPath);
    }

    resolveFromUrl();
  }, [loading, categories, locations, router.query.slug]);

  const handleCategorySelect = useCallback(
    (path: Category[]) => {
      setSelectedCategoryPath(path);
      const url = buildPath(path, selectedLocationPath);
      router.push(url, undefined, { shallow: true });
    },
    [selectedLocationPath, router],
  );

  const handleLocationSelect = useCallback(
    (path: Location[]) => {
      setSelectedLocationPath(path);
      const url = buildPath(selectedCategoryPath, path);
      router.push(url, undefined, { shallow: true });
    },
    [selectedCategoryPath, router],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Typography variant="h2-regular">Loading...</Typography>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {(selectedCategoryPath.length > 0 || selectedLocationPath.length > 0) && (
        <div className="mb-6">
          {selectedCategoryPath.length > 0 ? (
            <>
              <span className="text-black mr-1">
                {selectedCategoryPath[selectedCategoryPath.length - 1].name}
              </span>
              <span className="text-black mr-1">in</span>
              <span className="text-black">
                {selectedLocationPath.length > 0
                  ? selectedLocationPath[selectedLocationPath.length - 1].name
                  : "Lebanon"}
              </span>
            </>
          ) : (
            <span className="text-black">
              {selectedLocationPath.length > 0
                ? `${selectedLocationPath[selectedLocationPath.length - 1].name} classfields`
                : "Lebanon classfields"}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <CategoryList
          categories={categories}
          selectedPath={selectedCategoryPath}
          onSelect={handleCategorySelect}
        />
        <LocationList
          locations={locations}
          selectedPath={selectedLocationPath}
          onSelect={handleLocationSelect}
        />
      </div>
    </div>
  );
}
