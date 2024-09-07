import React from "react";
import ReactDOM from "react-dom/client";
import { WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import App from "./App.tsx";
import { AppProvider } from "./AppProvider";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";
import "./main.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme
      appearance="dark"
      accentColor="blue"
      grayColor="gray"
      panelBackground="solid"
      scaling="100%"
      radius="full"
    >
      <QueryClientProvider client={queryClient}>
        <AppProvider network="devnet">
          <WalletProvider autoConnect>
            <App />
          </WalletProvider>
        </AppProvider>
      </QueryClientProvider>
    </Theme>
  </React.StrictMode>,
);
