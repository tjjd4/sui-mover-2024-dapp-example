import { createInMemoryStore } from "./utils";

export const PROGRAM_ID =
  "0x0427fc99464b03e9bbd61d15ad00a4d43edeb75d810ac965ca6915cb999d20e3";
export const HOUSE_CAP_ID =
  "0xcc11da32460e2d92382ed3b9c7b836177af11de6db698c5c9ab412e70bec4fde";
export const HOUSE_DATA_ID =
  "0xf6508ad3c89f3b29e18b0fb37d01a0e6baf4924a2237d1cd23a5b8b644b7be90";
export const HOUSE_PRIV_KEY =
  "3d46c26504777e0baaa7877f64ff6a45b211e832a844febe69e66abbf33e078e";

export const DEFAULT_STORAGE =
  typeof window !== "undefined" && window.localStorage
    ? localStorage
    : createInMemoryStore();
export const DEFAULT_STORAGE_KEY = "coin-flip:app-store";
