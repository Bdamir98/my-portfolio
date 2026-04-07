import { create } from 'zustand';

type CursorMode = 'default' | 'view' | 'play' | 'hidden';

interface CursorState {
  mode: CursorMode;
  text: string | undefined;
  setMode: (mode: CursorMode, text?: string) => void;
}

export const useCursorStore = create<CursorState>((set) => ({
  mode: 'default',
  text: undefined,
  setMode: (mode, text = undefined) => set({ mode, text }),
}));
