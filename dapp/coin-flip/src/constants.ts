import { createInMemoryStore } from "./utils";

export const DEFAULT_STORAGE =
  typeof window !== "undefined" && window.localStorage
    ? localStorage
    : createInMemoryStore();
export const DEFAULT_STORAGE_KEY = "coin-flip:app-store";
