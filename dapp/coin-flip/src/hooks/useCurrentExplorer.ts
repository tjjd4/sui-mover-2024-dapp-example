import { useAppStore } from "./useAppStore";
import type { ExplorerType } from "../appStore";

export const useCurrentExplorer = (): {
  explorer: ExplorerType;
  explorerUrl: string;
} => {
  const explorer = useAppStore((state) => state.explorer);
  const explorerUrl = useAppStore((state) => state.explorerUrl);
  return {
    explorer,
    explorerUrl,
  };
};
