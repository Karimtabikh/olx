export type Category = {
  name: string;
  slug: string;
  externalID: string;
  level: number;
  count: number;
};

export type Location = {
  name: string;
  externalID: string;
  slug: string;
  count: number;
  level: number;
};

export type LocationHierarchyEntry = {
  level: number;
  externalID: string;
  name: string;
  name_l1: string;
  slug: string;
};

export type LocationHit = {
  _source: {
    externalID: string;
    name: string;
    slug: string;
    level: number;
    hierarchy: LocationHierarchyEntry[];
  };
};
