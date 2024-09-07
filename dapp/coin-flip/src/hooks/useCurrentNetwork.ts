import { useAppStore } from "./useAppStore";
import type { NetworkType, NodeType } from "../appStore";

export const useCurrentNetwork = (): {
  network: NetworkType;
  node: NodeType;
  rpcNodeUrl: string;
} => {
  const network = useAppStore((state) => state.network);
  const node = useAppStore((state) => state.node);
  const rpcNodeUrl = useAppStore((state) => state.rpcNodeUrl);
  return {
    network,
    node,
    rpcNodeUrl,
  };
};
