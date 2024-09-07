import { useMutation } from "@tanstack/react-query";
import { useAppStore } from "./useAppStore";
import { useCurrentExplorer } from "./useCurrentExplorer";
import type {
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import type { ExplorerType } from "../appStore";

type SwitchExplorerArgs = {
  explorer: ExplorerType;
};

type SwitchExplorerResult = void;

type UseSwitchExplorerError = Error;

type UseSwitchExplorerMutationOptions = Omit<
  UseMutationOptions<
    SwitchExplorerResult,
    UseSwitchExplorerError,
    SwitchExplorerArgs,
    unknown
  >,
  "mutationFn"
>;

export const useSwitchExplorer = ({
  mutationKey = [],
  ...mutationOptions
}: UseSwitchExplorerMutationOptions = {}): UseMutationResult<
  SwitchExplorerResult,
  UseSwitchExplorerError,
  SwitchExplorerArgs
> => {
  const { explorer: currentExplorer } = useCurrentExplorer();
  const setExplorer = useAppStore((state) => state.setExplorer);

  return useMutation({
    mutationKey: ["switch-explorer", ...mutationKey],
    mutationFn: async ({ explorer }) => {
      if (currentExplorer !== explorer) setExplorer(explorer);
    },
    ...mutationOptions,
  });
};
