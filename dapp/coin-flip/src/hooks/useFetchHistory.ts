import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { useCurrentNetwork } from "./useCurrentNetwork";
import { PROGRAM_ID } from "../constants";
import type { EventId } from "@mysten/sui/client";

type GameEvent = {
  game_id: string;
  status: number;
  sender: string;
};

export const useFetchHistory = () => {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { network } = useCurrentNetwork();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["History", account?.address, network],
    queryFn: async () => {
      let cursor: EventId | null | undefined;
      const gameEvent: GameEvent[] = [];
      do {
        const { data, nextCursor } = await client.queryEvents({
          query: {
            MoveEventModule: {
              module: "game",
              package: PROGRAM_ID,
            },
          },
          limit: 100,
          cursor,
        });
        console.log(data);
        if (!data || !data.length) break;
        gameEvent.push(
          ...data.map((item) => ({
            ...(item.parsedJson as GameEvent),
            sender: item.sender,
          })),
        );
        cursor = nextCursor;
      } while (cursor);

      return gameEvent.filter((item) => item.sender === account?.address);
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
