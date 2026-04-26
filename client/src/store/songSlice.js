import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { songsAPI } from '../services/api';

export const fetchSongs = createAsyncThunk('songs/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await songsAPI.getAll();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

const songSlice = createSlice({
  name: 'songs',
  initialState: {
    items: [],
    currentSong: null,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentSong: (state, action) => {
      state.currentSong = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSongs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSongs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSongs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch songs';
      });
  },
});

export const { setCurrentSong } = songSlice.actions;
export default songSlice.reducer;
