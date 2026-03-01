import type { Category, Location, LocationHit } from "../types";

const ES_URL =
  "https://search.mena.sector.run/_msearch?filter_path=took%2C*.took%2C*.timed_out%2C*.suggest.*.options.text%2C*.suggest.*.options._source.*%2C*.hits.total.*%2C*.hits.hits._source.*%2C*.hits.hits._score%2C*.hits.hits.highlight.*%2C*.error%2C*.aggregations.*.buckets.key%2C*.aggregations.*.buckets.doc_count%2C*.aggregations.*.buckets.complex_value.hits.hits._source%2C*.aggregations.*.filtered_agg.facet.buckets.key%2C*.aggregations.*.filtered_agg.facet.buckets.doc_count%2C*.aggregations.*.filtered_agg.facet.buckets.complex_value.hits.hits._source";
const ES_USERNAME = "olx-lb-production-search";
const ES_PASSWORD = ">s+O3=s9@I4DF0Ia%ug?7QPuy2{Dj[Fr";

function adsIndex() {
  return "olx-lb-production-ads-en";
}

function locationsIndex() {
  return "olx-lb-production-locations-en";
}

function pickName(
  src: Record<string, string | number>,
  locale: string,
): string {
  if (locale === "ar" && src.name_l1) return src.name_l1 as string;
  return src.name as string;
}

function buildNdjsonBody(lines: object[]): string {
  return lines.map((line) => JSON.stringify(line)).join("\n") + "\n";
}

const credentials = Buffer.from(`${ES_USERNAME}:${ES_PASSWORD}`).toString(
  "base64",
);

async function fetchElasticSearch(body: string) {
  const res = await fetch(ES_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-ndjson",
    },
    body,
  });
  return res.json();
}

export async function fetchCategories(locale = "en"): Promise<Category[]> {
  const index = adsIndex();

  const body = buildNdjsonBody([
    { index },
    {
      size: 0,
      aggs: {
        categories: {
          terms: { field: "category.lvl0.externalID", size: 50 },
        },
      },
    },
    { index },
    {
      size: 50,
      collapse: { field: "category.lvl0.externalID" },
      _source: ["category.lvl0"],
    },
  ]);

  const data = await fetchElasticSearch(body);

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
      name: pickName(hit._source["category.lvl0"], locale),
      slug: hit._source["category.lvl0"].slug,
      externalID: String(hit._source["category.lvl0"].externalID),
      level: 0,
      count: countMap[String(hit._source["category.lvl0"].externalID)] ?? 0,
    }),
  );
}

export async function fetchLocations(locale = "en"): Promise<Location[]> {
  const body = buildNdjsonBody([
    { index: adsIndex() },
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
    { index: locationsIndex() },
    {
      size: 20,
      query: { bool: { must: [{ term: { level: 1 } }] } },
      _source: ["externalID", "name", "name_l1", "slug"],
    },
  ]);

  const data = await fetchElasticSearch(body);

  const countBuckets =
    data.responses?.[0]?.aggregations?.locations_counts?.buckets ?? [];
  const locationHits = data.responses?.[1]?.hits?.hits ?? [];

  const countMap: Record<string, number> = {};
  for (const bucket of countBuckets) {
    countMap[bucket.key] = bucket.doc_count;
  }

  return locationHits.map(
    (hit: {
      _source: {
        externalID: string;
        name: string;
        name_l1?: string;
        slug: string;
      };
    }) => ({
      name:
        locale === "ar" && hit._source.name_l1
          ? hit._source.name_l1
          : hit._source.name,
      externalID: hit._source.externalID,
      slug: hit._source.slug,
      count: countMap[hit._source.externalID] ?? 0,
      level: 1,
    }),
  );
}

export async function fetchSubCategories(
  parentChain: { level: number; externalID: string }[],
  childLevel: number,
  locale = "en",
): Promise<Category[]> {
  const index = adsIndex();
  const childField = `category.lvl${childLevel}`;

  const parentFilters = parentChain.map((p) => ({
    term: { [`category.lvl${p.level}.externalID`]: p.externalID },
  }));

  const body = buildNdjsonBody([
    { index },
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
    { index },
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

  const data = await fetchElasticSearch(body);

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
        name: pickName(src, locale),
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
  locale = "en",
): Promise<Location[]> {
  const body = buildNdjsonBody([
    { index: adsIndex() },
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
    { index: locationsIndex() },
    {
      size: 500,
      query: {
        bool: {
          must: [{ term: { level: 2 } }],
        },
      },
      _source: ["externalID", "name", "name_l1", "slug"],
    },
  ]);

  const data = await fetchElasticSearch(body);

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
    .map(
      (hit: {
        _source: {
          externalID: string;
          name: string;
          name_l1?: string;
          slug: string;
        };
      }) => ({
        name:
          locale === "ar" && hit._source.name_l1
            ? hit._source.name_l1
            : hit._source.name,
        externalID: hit._source.externalID,
        slug: hit._source.slug,
        count: countMap[hit._source.externalID] ?? 0,
        level: 2,
      }),
    );
}

export async function findLocationBySlug(
  slug: string,
  locale = "en",
): Promise<Location[] | null> {
  const body = buildNdjsonBody([
    { index: locationsIndex() },
    {
      size: 1,
      query: { bool: { must: [{ term: { slug } }] } },
      _source: ["externalID", "name", "name_l1", "slug", "level", "hierarchy"],
    },
  ]);

  const data = await fetchElasticSearch(body);
  const hits: LocationHit[] = data.responses?.[0]?.hits?.hits ?? [];

  if (hits.length === 0) return null;

  const loc = hits[0]._source;
  const hierarchy = loc.hierarchy ?? [];

  const locationPath: Location[] = [];

  for (const entry of hierarchy) {
    if (entry.level === 0) continue;
    locationPath.push({
      name: locale === "ar" && entry.name_l1 ? entry.name_l1 : entry.name,
      externalID: entry.externalID,
      slug: entry.slug,
      count: 0,
      level: entry.level,
    });
  }

  return locationPath;
}
