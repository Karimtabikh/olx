import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import type { Category } from "../types";

export function useCategories() {
  const { locale = "en" } = useRouter();

  return useQuery({
    queryKey: ["categories", locale],
    queryFn: async (): Promise<Category[]> => {
      const res = await fetch(`/api/categories?locale=${locale}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
