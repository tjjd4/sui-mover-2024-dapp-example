import {
  useRef,
  createContext,
  useEffect,
  type ReactNode,
  type PropsWithChildren,
} from "react";
import { SuiClientProvider, createNetworkConfig } from "@mysten/dapp-kit";
import { DEFAULT_STORAGE, DEFAULT_STORAGE_KEY } from "./constants";
import {
  createAppStore,
  RPC_NODES,
  EXPLORERS,
  Network,
  type AppStore,
  type NetworkType,
} from "./appStore";
import { useCurrentNetwork } from "./hooks/useCurrentNetwork";
import type { StateStorage } from "zustand/middleware";

export const AppContext = createContext<AppStore | null>(null);

export type AppProviderProps = {
  network?: NetworkType;
  storage?: StateStorage;
  storageKey?: string;
  children: ReactNode;
};

export const AppProvider = ({
  network,
  storage = DEFAULT_STORAGE,
  storageKey = DEFAULT_STORAGE_KEY,
  children,
}: AppProviderProps) => {
  const storeRef = useRef(
    createAppStore({
      network,
      storage,
      storageKey,
    }),
  );

  useEffect(() => {
    const unsubscribNetwork = storeRef.current.subscribe(
      (state) => ({
        network: state.network,
        node: state.node,
        customNode: state.customNode,
        explorer: state.explorer,
      }),
      (newState, preState) => {
        let rpcNodeUrl =
          preState.node !== "custom"
            ? RPC_NODES[preState.network][preState.node]
            : preState.customNode;
        let explorerUrl = EXPLORERS[preState.network][preState.explorer];

        if (
          newState.network !== preState.network ||
          newState.node !== preState.node
        ) {
          rpcNodeUrl = RPC_NODES[newState.network][newState.node];
        }
        if (
          newState.network !== preState.network ||
          newState.explorer !== preState.explorer
        ) {
          explorerUrl = EXPLORERS[newState.network][newState.explorer];
        }
        if (newState.customNode !== preState.customNode) {
          rpcNodeUrl = newState.customNode;
        }

        storeRef.current.setState({
          rpcNodeUrl,
          explorerUrl,
        });
      },
    );

    return () => unsubscribNetwork();
  }, []);

  return (
    <AppContext.Provider value={storeRef.current}>
      <AppManager>{children}</AppManager>
    </AppContext.Provider>
  );
};

const AppManager = ({ children }: PropsWithChildren) => {
  const {
    network: currentNetwork,
    node: currentNode,
    rpcNodeUrl,
  } = useCurrentNetwork();

  const { networkConfig } = createNetworkConfig({
    [Network.mainnet]: {
      url:
        currentNode === "custom"
          ? rpcNodeUrl
          : RPC_NODES["mainnet"][currentNode],
    },
    [Network.testnet]: {
      url:
        currentNode === "custom"
          ? rpcNodeUrl
          : RPC_NODES["testnet"][currentNode],
    },
    [Network.devnet]: {
      url:
        currentNode === "custom"
          ? rpcNodeUrl
          : RPC_NODES["devnet"][currentNode],
    },
  });

  return (
    <SuiClientProvider
      networks={networkConfig}
      defaultNetwork={currentNetwork as any}
      network={currentNetwork as any}
    >
      {children}
    </SuiClientProvider>
  );
};
