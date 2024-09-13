import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useCurrentNetwork } from "./useCurrentNetwork";
import { useQuery } from "@tanstack/react-query";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { HOUSE_DATA_ID } from "../constants";

export const useFetchGames = () => {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { network } = useCurrentNetwork();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["Games", account?.address, network],
    queryFn: async () => {
      let cursor: string | null | undefined;
      const gameObjectIds: string[] = [];
      do {
        const { data, nextCursor } = await client.getDynamicFields({
          parentId: HOUSE_DATA_ID,
          limit: 10,
          cursor,
        });
        if (!data || !data.length) break;
        gameObjectIds.push(...data.map((item) => item.objectId));
        cursor = nextCursor;
      } while (cursor);

      const games = (
        await client.multiGetObjects({
          ids: gameObjectIds,
          options: {
            showContent: true,
          },
        })
      )
        .filter(
          (item) => !!item.data && item.data.content?.dataType === "moveObject",
        )
        .map((item) => {
          const fields = (item.data!.content as any).fields;
          const id = fields.id.id;
          const player = String(fields.player);
          const totalStake = Number(fields.total_stake) / Number(MIST_PER_SUI);
          const guessEpoch = Number(fields.guess_epoch);
          const guess = fields.guess ?? undefined;
          const vrfInput = fields.vrf_input;
          const feeAmount = ((totalStake / 2) * Number(fields.fee_bp)) / 10_000; // total_stake / 2 * fee_in_bp / 10_000
          const status = Number(fields.status);

          return {
            id,
            player,
            totalStake,
            guessEpoch,
            guess,
            vrfInput,
            feeAmount,
            status,
          };
        })
        .filter((item) => item.player === account!.address);

      return games;
    },
    gcTime: 24 * 60 * 60 * 1000,
    staleTime: Infinity,
    retry: false,
    enabled: !!account?.address,
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  };
};
