import { create } from 'zustand';
import axios from 'axios';
import { quizApi } from '../api';
import type { Quiz } from '../types/quiz.types';

interface QuizStore {
  items: Quiz[];
  loading: boolean;
  error: string;
  limit: number;
  offset: number;
  hasMore: boolean;
  setLimit: (limit: number) => void;
  setOffset: (offset: number) => void;
  fetchQuizzes: (signal?: AbortSignal) => Promise<void>;
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  items: [],
  loading: false,
  error: '',
  limit: 12,
  offset: 0,
  hasMore: false,

  setLimit: (limit) => set({ limit, offset: 0 }),
  setOffset: (offset) => set({ offset }),

  fetchQuizzes: async (signal) => {
    const { limit, offset } = get();
    set({ loading: true, error: '' });
    try {
      const data = await quizApi.getAll({ limit, offset }, signal);
      set({ items: data, hasMore: data.length === limit, loading: false });
    } catch (err) {
      if (!axios.isCancel(err)) {
        set({ error: 'Failed to load quizzes.', loading: false });
      } else {
        set({ loading: false });
      }
    }
  },
}));
