import { createInMemoryStore } from "./utils";

export const PROGRAM_ID =
  "0x887f2167e17a8cdf96804f1823faea58bd6ecc2dee6539a38a529e8b29bc54eb";
export const HOUSE_CAP_ID =
  "0x34055342eaa3d7882c4b800bbd3b1f9bc2bf5db5dc0e18ad0d4e399ef4cc37f9";
export const HOUSE_DATA_ID =
  "0xc72f87d8fd84ee2d08a52fadf08c675513550408aa77ddfd61bf5b70889330e1";
export const HOUSE_PRIV_KEY =
  "14e035ebbc9db46aac38ca3abba601f5c9bed21fdfd9deeac510879707a8559e";

export const DEFAULT_STORAGE =
  typeof window !== "undefined" && window.localStorage
    ? localStorage
    : createInMemoryStore();
export const DEFAULT_STORAGE_KEY = "coin-flip:app-store";
