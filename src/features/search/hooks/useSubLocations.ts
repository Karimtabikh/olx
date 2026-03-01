import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/router";
import type { Location } from "../types";

export function useSubLocations(parentExternalID: string | null) {
  const { locale = "en" } = useRouter();

  return useQuery({
    queryKey: ["subLocations", locale, parentExternalID],
    queryFn: async (): Promise<Location[]> => {
      const params = new URLSearchParams({
        locale,
        parentExternalID: parentExternalID!,
      });
      const res = await fetch(`/api/sublocations?${params}`);
      return res.json();
    },
    enabled: !!parentExternalID,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
