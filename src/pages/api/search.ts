import type { NextApiRequest, NextApiResponse } from "next";

const ES_URL =
  "https://search.mena.sector.run/_msearch?filter_path=took%2C*.took%2C*.timed_out%2C*.suggest.*.options.text%2C*.suggest.*.options._source.*%2C*.hits.total.*%2C*.hits.hits._source.*%2C*.hits.hits._score%2C*.hits.hits.highlight.*%2C*.error%2C*.aggregations.*.buckets.key%2C*.aggregations.*.buckets.doc_count%2C*.aggregations.*.buckets.complex_value.hits.hits._source%2C*.aggregations.*.filtered_agg.facet.buckets.key%2C*.aggregations.*.filtered_agg.facet.buckets.doc_count%2C*.aggregations.*.filtered_agg.facet.buckets.complex_value.hits.hits._source";

const ES_USERNAME = "olx-lb-production-search";
const ES_PASSWORD = ">s+O3=s9@I4DF0Ia%ug?7QPuy2{Dj[Fr";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { body } = req.body;

  const credentials = Buffer.from(`${ES_USERNAME}:${ES_PASSWORD}`).toString(
    "base64",
  );

  const response = await fetch(ES_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-ndjson",
    },
    body,
  });

  const data = await response.json();
  res.status(200).json(data);
}
