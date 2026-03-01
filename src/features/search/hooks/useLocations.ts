import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import type { Location } from "../types";

export function useLocations() {
  const { locale = "en" } = useRouter();

  return useQuery({
    queryKey: ["locations", locale],
    queryFn: async (): Promise<Location[]> => {
      const res = await fetch(`/api/locations?locale=${locale}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
