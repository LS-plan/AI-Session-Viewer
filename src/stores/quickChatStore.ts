import { create } from "zustand";
import type { QuickChatMessage, ModelInfo } from "../types/chat";
import { api } from "../services/api";

interface QuickChatState {
  model: string;
  messages: QuickChatMessage[];
  isStreaming: boolean;
  error: string | null;

  // Model list
  modelList: ModelInfo[];
  modelListLoading: boolean;

  // Actions
  sendMessage: (prompt: string) => Promise<void>;
  clearMessages: () => void;
  setModel: (m: string) => void;
  fetchModelList: () => Promise<void>;
  cancelStream: () => void;
}

let cancelFn: (() => void) | null = null;

export const useQuickChatStore = create<QuickChatState>((set, get) => ({
  model: "",
  messages: [],
  isStreaming: false,
  error: null,
  modelList: [],
  modelListLoading: false,

  sendMessage: async (prompt: string) => {
    const { model, messages } = get();
    if (!model) {
      set({ error: "请先选择模型" });
      return;
    }

    const userMsg: QuickChatMessage = { role: "user", content: prompt };
    const newMessages = [...messages, userMsg];
    // Add placeholder for assistant
    const assistantMsg: QuickChatMessage = { role: "assistant", content: "" };

    set({
      messages: [...newMessages, assistantMsg],
      isStreaming: true,
      error: null,
    });

    try {
      const cleanup = await api.startQuickChat(
        "claude",
        newMessages,
        model,
        // onChunk
        (chunk: string) => {
          set((state) => {
            const msgs = [...state.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.role === "assistant") {
              msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
            }
            return { messages: msgs };
          });
        },
        // onError
        (err: string) => {
          set({ error: err, isStreaming: false });
        },
        // onDone
        () => {
          set({ isStreaming: false });
          cancelFn = null;
        },
      );
      cancelFn = cleanup;
    } catch (e) {
      set({
        isStreaming: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  clearMessages: () => {
    if (cancelFn) {
      cancelFn();
      cancelFn = null;
    }
    set({ messages: [], isStreaming: false, error: null });
  },

  setModel: (m) => set({ model: m }),

  fetchModelList: async () => {
    set({ modelListLoading: true });
    try {
      const models = await api.listModels("claude", "", "");
      set({ modelList: models, modelListLoading: false });
    } catch {
      set({ modelListLoading: false });
    }
  },

  cancelStream: () => {
    if (cancelFn) {
      cancelFn();
      cancelFn = null;
    }
    set({ isStreaming: false });
  },
}));
