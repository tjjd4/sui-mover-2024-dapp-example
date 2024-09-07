import { useMutation } from "@tanstack/react-query";
import { useAppStore } from "./useAppStore";
import { useCurrentNetwork } from "./useCurrentNetwork";
import type {
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import type { NetworkType } from "../appStore";

type SwitchNetworkArgs = {
  network: NetworkType;
};

type SwitchNetworkResult = void;

type UseSwitchNetworkError = Error;

type UseSwitchNetworkMutationOptions = Omit<
  UseMutationOptions<
    SwitchNetworkResult,
    UseSwitchNetworkError,
    SwitchNetworkArgs,
    unknown
  >,
  "mutationFn"
>;

export const useSwitchNetwork = ({
  mutationKey = [],
  ...mutationOptions
}: UseSwitchNetworkMutationOptions = {}): UseMutationResult<
  SwitchNetworkResult,
  UseSwitchNetworkError,
  SwitchNetworkArgs
> => {
  const { network: currentNetwork } = useCurrentNetwork();
  const setNetwork = useAppStore((state) => state.setNetwork);

  return useMutation({
    mutationKey: ["switch-network", ...mutationKey],
    mutationFn: async ({ network }) => {
      if (currentNetwork !== network) setNetwork(network);
    },
    ...mutationOptions,
  });
};
