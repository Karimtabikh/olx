import type { NextApiRequest, NextApiResponse } from "next";
import { fetchSubLocations } from "@/features/search/services/searchService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const locale = (req.query.locale as string) || "en";
  const parentExternalID = req.query.parentExternalID as string;
  const data = await fetchSubLocations(parentExternalID, locale);
  res.status(200).json(data);
}
