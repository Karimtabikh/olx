import type { NextApiRequest, NextApiResponse } from "next";
import { fetchLocations } from "@/features/search/services/searchService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const locale = (req.query.locale as string) || "en";
  const data = await fetchLocations(locale);
  res.status(200).json(data);
}
