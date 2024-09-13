import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { useCurrentNetwork } from "./useCurrentNetwork";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { HOUSE_DATA_ID } from "../constants";

export const useFetchHouseData = () => {
  const account = useCurrentAccount();
  const { network } = useCurrentNetwork();

  const { data, isLoading, isError, error, refetch } = useSuiClientQuery(
    "getObject",
    {
      id: HOUSE_DATA_ID,
      options: {
        showContent: true,
      },
    },
    {
      queryKey: ["HouseData", account?.address, network],
      enabled: !!account,
    },
  );

  let houseData = undefined;

  if (data?.data) {
    const houseDataObject = data.data;
    if (houseDataObject.content && "fields" in houseDataObject.content) {
      const fields = houseDataObject.content.fields as any;
      const balance = Number(fields.balance) / Number(MIST_PER_SUI);
      const fees = Number(fields.fees) / Number(MIST_PER_SUI);
      const baseFee = Number(fields.base_fee_in_bp) / 10_000;
      const houser = String(fields.houser);
      const minStake = Number(fields.min_stake) / Number(MIST_PER_SUI);
      const maxStake = Number(fields.max_stake) / Number(MIST_PER_SUI);
      const publicKey = fields.public_key;
      houseData = {
        balance,
        fees,
        baseFee,
        houser,
        minStake,
        maxStake,
        publicKey,
      };
    }
  }

  return {
    data: houseData,
    isLoading,
    isError,
    error,
    refetch,
  };
};
