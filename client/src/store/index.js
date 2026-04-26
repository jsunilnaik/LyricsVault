import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import songReducer from './songSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    songs: songReducer,
  },
});
