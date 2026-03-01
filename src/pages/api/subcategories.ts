import type { NextApiRequest, NextApiResponse } from "next";
import { fetchSubCategories } from "@/features/search/services/searchService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const locale = (req.query.locale as string) || "en";
  const parentChain = JSON.parse((req.query.parentChain as string) || "[]");
  const childLevel = Number(req.query.childLevel);
  const data = await fetchSubCategories(parentChain, childLevel, locale);
  res.status(200).json(data);
}
