import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  properties: [],
  selectedProperty: null,
  wishlist: [],
  searchParams: {
    city: '',
    guestsCount: 1,
    category: '',
    minPrice: '',
    maxPrice: '',
  },
  loading: false,
  error: null,
};

const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    fetchStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchSuccess: (state, action) => {
      state.loading = false;
      state.properties = action.payload;
    },
    fetchMoreSuccess: (state, action) => {
      state.loading = false;
      // Append unique properties
      const existingIds = new Set(state.properties.map(p => p._id));
      const newProps = action.payload.filter(p => !existingIds.has(p._id));
      state.properties = [...state.properties, ...newProps];
    },
    fetchSingleSuccess: (state, action) => {
      state.loading = false;
      state.selectedProperty = action.payload;
    },
    fetchFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSearchParams: (state, action) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    resetSearchParams: (state) => {
      state.searchParams = initialState.searchParams;
    },
    setWishlist: (state, action) => {
      state.wishlist = action.payload;
    },
    toggleWishlistState: (state, action) => {
      const propertyId = action.payload;
      const index = state.wishlist.findIndex((p) => p._id === propertyId);
      if (index === -1) {
        // If we are looking at properties array, toggle there
        const prop = state.properties.find((p) => p._id === propertyId);
        if (prop) state.wishlist.push(prop);
      } else {
        state.wishlist.splice(index, 1);
      }
    },
  },
});

export const {
  fetchStart,
  fetchSuccess,
  fetchMoreSuccess,
  fetchSingleSuccess,
  fetchFailure,
  setSearchParams,
  resetSearchParams,
  setWishlist,
  toggleWishlistState,
} = propertySlice.actions;

export default propertySlice.reducer;
