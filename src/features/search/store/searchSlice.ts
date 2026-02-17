import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import type { Category, Location } from "../types";

type SearchState = {
  selectedCategoryPath: Category[];
  selectedLocationPath: Location[];
};

const initialState: SearchState = {
  selectedCategoryPath: [],
  selectedLocationPath: [],
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSelectedCategoryPath(state, action: PayloadAction<Category[]>) {
      state.selectedCategoryPath = action.payload;
    },
    setSelectedLocationPath(state, action: PayloadAction<Location[]>) {
      state.selectedLocationPath = action.payload;
    },
  },
});

export const { setSelectedCategoryPath, setSelectedLocationPath } =
  searchSlice.actions;

export const selectSelectedCategoryPath = (state: RootState) =>
  state.search.selectedCategoryPath;
export const selectSelectedLocationPath = (state: RootState) =>
  state.search.selectedLocationPath;

export default searchSlice.reducer;
