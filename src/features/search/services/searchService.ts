import type { Category, Location } from "../types";

function buildNdjsonBody(lines: object[]): string {
  return lines.map((line) => JSON.stringify(line)).join("\n") + "\n";
}

async function fetchElsaticSearch(body: string) {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const body = buildNdjsonBody([
    { index: "olx-lb-production-ads-en" },
    {
      size: 0,
      aggs: {
        categories: {
          terms: { field: "category.lvl0.externalID", size: 50 },
        },
      },
    },
    { index: "olx-lb-production-ads-en" },
    {
      size: 50,
      collapse: { field: "category.lvl0.externalID" },
      _source: ["category.lvl0"],
    },
  ]);

  const data = await fetchElsaticSearch(body);

  const buckets = data.responses?.[0]?.aggregations?.categories?.buckets ?? [];
  const countMap: Record<string, number> = {};
  for (const bucket of buckets) {
    countMap[bucket.key] = bucket.doc_count;
  }

  const hits = data.responses?.[1]?.hits?.hits ?? [];
  return hits.map(
    (hit: {
      _source: { "category.lvl0": Record<string, string | number> };
    }) => ({
      name: hit._source["category.lvl0"].name,
      slug: hit._source["category.lvl0"].slug,
      externalID: String(hit._source["category.lvl0"].externalID),
      level: 0,
      count: countMap[String(hit._source["category.lvl0"].externalID)] ?? 0,
    }),
  );
}

export async function fetchLocations(): Promise<Location[]> {
  const body = buildNdjsonBody([
    { index: "olx-lb-production-ads-en" },
    {
      size: 0,
      query: {
        bool: {
          filter: [{ term: { "location.lvl0.externalID": "0-1" } }],
        },
      },
      aggs: {
        locations_counts: {
          terms: { field: "location.lvl1.externalID", size: 20 },
        },
      },
    },
    { index: "olx-lb-production-locations-en" },
    {
      size: 20,
      query: { bool: { must: [{ term: { level: 1 } }] } },
      _source: ["externalID", "name"],
    },
  ]);

  const data = await fetchElsaticSearch(body);

  const countBuckets =
    data.responses?.[0]?.aggregations?.locations_counts?.buckets ?? [];
  const locationHits = data.responses?.[1]?.hits?.hits ?? [];

  const countMap: Record<string, number> = {};
  for (const bucket of countBuckets) {
    countMap[bucket.key] = bucket.doc_count;
  }

  return locationHits.map(
    (hit: { _source: { externalID: string; name: string } }) => ({
      name: hit._source.name,
      externalID: hit._source.externalID,
      slug: hit._source.name.toLowerCase().split(" ").join("-"),
      count: countMap[hit._source.externalID] ?? 0,
      level: 1,
    }),
  );
}
