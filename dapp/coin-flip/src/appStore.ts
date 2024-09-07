import { getFullnodeUrl } from "@mysten/sui/client";
import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";

export enum Network {
  mainnet = "mainnet",
  testnet = "testnet",
  devnet = "devnet",
}

export enum Node {
  custom = "custom",
  sui = "sui",
}

export enum Explorer {
  suivision = "suivision",
  suiscan = "suiscan",
}

type RpcNodes = {
  [Network.mainnet]: {
    [N in Node]: string;
  };
  [Network.testnet]: {
    [N in Node]: string;
  };
  [Network.devnet]: {
    [N in Node]: string;
  };
};

type Explorers = {
  [Network.mainnet]: {
    [K in ExplorerType]: string;
  };
  [Network.testnet]: {
    [K in ExplorerType]: string;
  };
  [Network.devnet]: {
    [K in ExplorerType]: string;
  };
};

export const RPC_NODES: RpcNodes = {
  mainnet: {
    [Node.sui]: getFullnodeUrl("mainnet"),
    [Node.custom]: "",
  },
  testnet: {
    [Node.sui]: getFullnodeUrl("testnet"),
    [Node.custom]: "",
  },
  devnet: {
    [Node.sui]: getFullnodeUrl("devnet"),
    [Node.custom]: "",
  },
};

export const EXPLORERS: Explorers = {
  mainnet: {
    [Explorer.suivision]: "https://suivision.xyz",
    [Explorer.suiscan]: "https://suiscan.xyz",
  },
  testnet: {
    [Explorer.suivision]: "https://testnet.suivision.xyz",
    [Explorer.suiscan]: "https://suiscan.xyz/testnet",
  },
  devnet: {
    [Explorer.suivision]: "https://testnet.suivision.xyz",
    [Explorer.suiscan]: "https://suiscan.xyz/testnet",
  },
};

export const networks = Object.keys(Network) as Array<NetworkType>;
export const nodes = Object.keys(Node) as Array<NodeType>;
export const explorers = Object.keys(Explorer) as Array<ExplorerType>;

export const defaultNetwork = Network.devnet;
export const defaultNode = Node.sui;
export const defaultExplorer = Explorer.suivision;

export type NetworkType = keyof typeof Network;
export type NodeType = keyof typeof Node;
export type ExplorerType = keyof typeof Explorer;

export type AppActions = {
  setNetwork: (network: NetworkType) => void;
  setNode: (node: NodeType) => void;
  setCustomNode: (fullnode: string) => void;
  setExplorer: (explorer: ExplorerType) => void;
};

export type AppStore = ReturnType<typeof createAppStore>;

export type AppState = {
  network: NetworkType;
  node: NodeType;
  customNode: string;
  explorer: ExplorerType;
  rpcNodeUrl: string;
  explorerUrl: string;
} & AppActions;

type AppConfiguration = {
  network?: NetworkType;
  storage: StateStorage;
  storageKey: string;
};

export const createAppStore = ({
  network = defaultNetwork,
  storage,
  storageKey,
}: AppConfiguration) => {
  return createStore<AppState>()(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          network,
          node: defaultNode,
          customNode: "",
          explorer: defaultExplorer,
          rpcNodeUrl: RPC_NODES[network][defaultNode],
          explorerUrl: EXPLORERS[network][defaultExplorer],
          setNetwork: (network: NetworkType) => {
            set(() => {
              return { network };
            });
          },
          setNode: (node: NodeType) => {
            const network = get().network;
            const rpcNodes = RPC_NODES[network];

            set(() => {
              return { node: rpcNodes[node] ? node : "custom" };
            });
          },
          setCustomNode: (customNode: string) => {
            set(() => {
              return { customNode };
            });
          },
          setExplorer: (explorer: ExplorerType) => {
            set(() => {
              return { explorer };
            });
          },
        }),
        {
          name: storageKey,
          storage: createJSONStorage(() => storage),
          partialize: ({ network, customNode }) => ({
            network,
            customNode,
          }),
        },
      ),
    ),
  );
};
