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

export async function fetchSubCategories(
  parentChain: { level: number; externalID: string }[],
  childLevel: number,
): Promise<Category[]> {
  const childField = `category.lvl${childLevel}`;

  const parentFilters = parentChain.map((p) => ({
    term: { [`category.lvl${p.level}.externalID`]: p.externalID },
  }));

  const body = buildNdjsonBody([
    { index: "olx-lb-production-ads-en" },
    {
      size: 0,
      query: {
        bool: {
          filter: [
            ...parentFilters,
            { exists: { field: `${childField}.externalID` } },
          ],
        },
      },
      aggs: {
        sub_categories: {
          terms: { field: `${childField}.externalID`, size: 200 },
        },
      },
    },
    { index: "olx-lb-production-ads-en" },
    {
      size: 200,
      query: {
        bool: {
          filter: [
            ...parentFilters,
            { exists: { field: `${childField}.externalID` } },
          ],
        },
      },
      collapse: { field: `${childField}.externalID` },
      _source: [childField],
    },
  ]);

  const data = await fetchElsaticSearch(body);

  const buckets =
    data.responses?.[0]?.aggregations?.sub_categories?.buckets ?? [];
  const countMap: Record<string, number> = {};
  for (const bucket of buckets) {
    countMap[bucket.key] = bucket.doc_count;
  }

  const hits = data.responses?.[1]?.hits?.hits ?? [];
  if (hits.length === 0) return [];

  return hits.map(
    (hit: { _source: Record<string, Record<string, string | number>> }) => {
      const src = hit._source[childField];
      return {
        name: src.name as string,
        slug: src.slug as string,
        externalID: String(src.externalID),
        level: childLevel,
        count: countMap[String(src.externalID)] ?? 0,
      };
    },
  );
}

export async function fetchSubLocations(
  parentExternalID: string,
): Promise<Location[]> {
  const body = buildNdjsonBody([
    { index: "olx-lb-production-ads-en" },
    {
      size: 0,
      query: {
        bool: {
          filter: [{ term: { "location.lvl1.externalID": parentExternalID } }],
        },
      },
      aggs: {
        sub_locations: {
          terms: { field: "location.lvl2.externalID", size: 50 },
        },
      },
    },
    { index: "olx-lb-production-locations-en" },
    {
      size: 500,
      query: {
        bool: {
          must: [{ term: { level: 2 } }],
        },
      },
      _source: ["externalID", "name"],
    },
  ]);

  const data = await fetchElsaticSearch(body);

  const buckets =
    data.responses?.[0]?.aggregations?.sub_locations?.buckets ?? [];
  const countMap: Record<string, number> = {};
  for (const b of buckets) {
    countMap[b.key] = b.doc_count;
  }

  if (buckets.length === 0) return [];

  const nameHits = data.responses?.[1]?.hits?.hits ?? [];

  return nameHits
    .filter(
      (hit: { _source: { externalID: string } }) =>
        countMap[hit._source.externalID] > 0,
    )
    .map((hit: { _source: { externalID: string; name: string } }) => ({
      name: hit._source.name,
      externalID: hit._source.externalID,
      slug: hit._source.name.toLowerCase().split(" ").join("-"),
      count: countMap[hit._source.externalID] ?? 0,
      level: 2,
    }));
}
