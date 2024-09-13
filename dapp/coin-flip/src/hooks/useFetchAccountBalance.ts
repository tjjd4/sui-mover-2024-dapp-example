import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { useCurrentNetwork } from "./useCurrentNetwork";
import { SUI_TYPE_ARG, MIST_PER_SUI } from "@mysten/sui/utils";

export const useFetchAccountBalance = () => {
  const account = useCurrentAccount();
  const { network } = useCurrentNetwork();

  const { data, isLoading, isError, error, refetch } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address || "",
      coinType: SUI_TYPE_ARG,
    },
    {
      queryKey: ["AccountBalance", account?.address, network],
    },
  );
  const balance = Number(
    Number(data?.totalBalance ?? 0) / Number(MIST_PER_SUI),
  ).toFixed(3);

  return {
    data: balance,
    isLoading,
    isError,
    error,
    refetch,
  };
};
