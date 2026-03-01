import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/router";
import type { Category } from "../types";

export function useSubCategories(
  parentChain: { level: number; externalID: string }[],
  childLevel: number,
) {
  const { locale = "en" } = useRouter();

  return useQuery({
    queryKey: [
      "subCategories",
      locale,
      ...parentChain.map((p) => p.externalID),
      childLevel,
    ],
    queryFn: async (): Promise<Category[]> => {
      const params = new URLSearchParams({
        locale,
        parentChain: JSON.stringify(parentChain),
        childLevel: String(childLevel),
      });
      const res = await fetch(`/api/subcategories?${params}`);
      return res.json();
    },
    enabled: parentChain.length > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export type UseSubCategoriesReturn = ReturnType<typeof useSubCategories>;
