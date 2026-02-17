import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import Typography from "@/shared/components/ui/Typography";
import CategoryList from "@/features/search/components/CategoryList";
import LocationList from "@/features/search/components/LocationList";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useCategories } from "@/features/search/hooks/useCategories";
import { useLocations } from "@/features/search/hooks/useLocations";
import {
  selectSelectedCategoryPath,
  selectSelectedLocationPath,
  setSelectedCategoryPath,
  setSelectedLocationPath,
} from "@/features/search/store/searchSlice";
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
  const dispatch = useAppDispatch();

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const loading = categoriesLoading || locationsLoading;

  const selectedCategoryPath = useAppSelector(selectSelectedCategoryPath);
  const selectedLocationPath = useAppSelector(selectSelectedLocationPath);

  const syncingFromUrl = useRef(false);
  const lastUrlPath = useRef(router.asPath);

  // Sync FROM URL TO state (on initial load and back/forward navigation)
  useEffect(() => {
    if (!router.isReady || loading) return;

    const slugParam = router.query.slug;
    const slugs = Array.isArray(slugParam)
      ? slugParam
      : slugParam
        ? [slugParam]
        : [];

    const handleUrlChange = async () => {
      syncingFromUrl.current = true;
      lastUrlPath.current = router.asPath;

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
            const parentChain = catPath.map((c) => ({
              level: c.level,
              externalID: c.externalID,
            }));
            currentCatLevel = await fetchSubCategories(
              parentChain,
              cat.level + 1,
            );
            continue;
          }
          doneWithCategories = true;
        }

        const loc = currentLocLevel.find((l) => l.slug === segment);
        if (loc) {
          locPath.push(loc);
          if (loc.level === 1) {
            currentLocLevel = await fetchSubLocations(loc.externalID);
          } else {
            currentLocLevel = [];
          }
        }
      }

      dispatch(setSelectedCategoryPath(catPath));
      dispatch(setSelectedLocationPath(locPath));
    };

    // Only parse if URL changed
    if (router.asPath !== lastUrlPath.current) {
      handleUrlChange();
    }
  }, [
    router.isReady,
    loading,
    router.query.slug,
    categories,
    locations,
    dispatch,
    router.asPath,
  ]);

  // Sync FROM state TO URL (when user clicks categories/locations)
  useEffect(() => {
    if (!router.isReady || loading || syncingFromUrl.current) {
      syncingFromUrl.current = false;
      return;
    }

    const newPath = buildPath(selectedCategoryPath, selectedLocationPath);

    if (newPath !== router.asPath) {
      lastUrlPath.current = newPath;
      router.push(newPath, undefined, { shallow: true });
    }
  }, [
    selectedCategoryPath,
    selectedLocationPath,
    router.isReady,
    loading,
    router,
  ]);

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
        <CategoryList />
        <LocationList />
      </div>
    </div>
  );
}
