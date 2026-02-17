import { useQuery } from "@tanstack/react-query";
import { fetchSubCategories } from "../services/searchService";

export function useSubCategories(
  parentChain: { level: number; externalID: string }[],
  childLevel: number,
) {
  return useQuery({
    queryKey: [
      "subCategories",
      ...parentChain.map((p) => p.externalID),
      childLevel,
    ],
    queryFn: () => fetchSubCategories(parentChain, childLevel),
    enabled: parentChain.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
