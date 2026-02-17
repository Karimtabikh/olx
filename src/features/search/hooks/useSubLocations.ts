import { useQuery } from "@tanstack/react-query";
import { fetchSubLocations } from "../services/searchService";

export function useSubLocations(parentExternalID: string | null) {
  return useQuery({
    queryKey: ["subLocations", parentExternalID],
    queryFn: () => fetchSubLocations(parentExternalID!),
    enabled: !!parentExternalID,
    staleTime: 5 * 60 * 1000,
  });
}
