import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import type { GetServerSideProps } from "next";
import Typography from "@/shared/components/ui/Typography";
import CategoryList from "@/features/search/components/CategoryList";
import LocationList from "@/features/search/components/LocationList";
import { useAppSelector } from "@/store/hooks";
import { useCategories } from "@/features/search/hooks/useCategories";
import { useLocations } from "@/features/search/hooks/useLocations";
import {
  selectSelectedCategoryPath,
  selectSelectedLocationPath,
  setSelectedCategoryPath,
  setSelectedLocationPath,
} from "@/features/search/store/searchSlice";
import {
  fetchCategories,
  fetchLocations,
  fetchSubCategories,
  findLocationBySlug,
} from "@/features/search/services/searchService";
import type { Category, Location } from "@/features/search/types";
import { wrapper } from "@/store";

function buildPath(categoryPath: Category[], locationPath: Location[]): string {
  const catSlugs = categoryPath.map((cat) => cat.slug);
  const locSlug =
    locationPath.length > 0 ? [locationPath[locationPath.length - 1].slug] : [];

  const segments = [...catSlugs, ...locSlug];

  if (segments.length === 0) {
    return "/";
  }

  return "/" + segments.join("/");
}

export const getServerSideProps: GetServerSideProps =
  wrapper.getServerSideProps((store) => async (context) => {
    const locale = context.locale ?? "en";
    const slugParam = context.params?.slug;
    const slugs = Array.isArray(slugParam)
      ? slugParam
      : slugParam
        ? [slugParam]
        : [];

    if (slugs.length === 0) {
      return { props: {} };
    }

    const [categories, locations] = await Promise.all([
      fetchCategories(locale),
      fetchLocations(locale),
    ]);

    const catPath: Category[] = [];
    const locPath: Location[] = [];
    let currentCatLevel = categories;
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
            locale,
          );
          continue;
        }
        doneWithCategories = true;
      }

      // Check level-1 locations first
      const loc1 = locations.find((l) => l.slug === segment);
      if (loc1) {
        locPath.push(loc1);
        continue;
      }

      // Resolve location by slug using the index hierarchy
      const locationPath = await findLocationBySlug(segment, locale);
      if (locationPath && locationPath.length > 0) {
        locPath.push(...locationPath);
      }
    }

    if (catPath.length > 0) {
      store.dispatch(setSelectedCategoryPath(catPath));
    }
    if (locPath.length > 0) {
      store.dispatch(setSelectedLocationPath(locPath));
    }

    return { props: {} };
  });

export default function AdsPage() {
  const router = useRouter();

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const loading = categoriesLoading || locationsLoading;

  const selectedCategoryPath = useAppSelector(selectSelectedCategoryPath);
  const selectedLocationPath = useAppSelector(selectSelectedLocationPath);

  const lastBuiltPath = useRef(router.asPath);

  // Sync FROM state TO URL (when user clicks categories/locations)
  useEffect(() => {
    if (!router.isReady || loading) return;

    const newPath = buildPath(selectedCategoryPath, selectedLocationPath);

    if (newPath !== router.asPath) {
      lastBuiltPath.current = newPath;
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

  const switchLocale = () => {
    const nextLocale = router.locale === "ar" ? "en" : "ar";
    router.push(router.asPath, undefined, { locale: nextLocale });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={switchLocale}
          className="text-black cursor-pointer"
        >
          {router.locale === "ar" ? "English" : "العربية"}
        </button>
      </div>

      {(selectedCategoryPath.length > 0 || selectedLocationPath.length > 0) && (
        <div className="mb-6">
          {selectedCategoryPath.length > 0 ? (
            <>
              <span className="text-black mr-1">
                {selectedCategoryPath[selectedCategoryPath.length - 1].name}
              </span>
              <span className="text-black mr-1">
                {router.locale === "ar" ? "في" : "in"}
              </span>
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
