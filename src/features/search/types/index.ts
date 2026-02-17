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

export type CategoryListProps = {
  categories: Category[];
  selectedPath: Category[];
  onSelect: (path: Category[]) => void;
};

export type LocationListProps = {
  locations: Location[];
  selectedPath: Location[];
  onSelect: (path: Location[]) => void;
};
