import { useContext } from "react";
import { useStore } from "zustand";
import { AppContext } from "../AppProvider";
import type { AppState, AppStore } from "../appStore";

type UseAppStore = {
  (): AppStore;
  <T>(selector: (state: AppState) => T): T;
};
export const useAppStore: UseAppStore = <T>(
  selector?: (state: AppState) => T,
): T | AppStore => {
  const store = useContext(AppContext);

  if (!store) {
    throw new Error(
      "Could not find AppContext. Ensure that you have set up the AppProvider.",
    );
  }

  return selector ? useStore(store, selector) : store;
};
