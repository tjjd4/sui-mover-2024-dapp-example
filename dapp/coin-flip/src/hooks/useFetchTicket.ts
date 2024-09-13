import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { useCurrentNetwork } from "./useCurrentNetwork";
import { PROGRAM_ID } from "../constants";

export const useFetchTicket = () => {
  const account = useCurrentAccount();
  const { network } = useCurrentNetwork();

  const { data, isLoading, isError, error, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address ?? "",
      limit: 1,
      filter: {
        MatchAll: [
          {
            StructType: `${PROGRAM_ID}::ticket::Ticket`,
          },
          {
            AddressOwner: account?.address ?? "",
          },
        ],
      },
      options: {
        showContent: true,
        showOwner: true,
        showType: true,
      },
    },
    { queryKey: ["Tickets", account?.address, network] },
  );

  if (!account) {
    return { data: undefined };
  } else {
    let ticket = undefined;
    if (data?.data[0]?.data) {
      const houseDataObject = data?.data[0].data;
      if (houseDataObject.content && "fields" in houseDataObject.content) {
        const id = String(houseDataObject.objectId);
        const fields = houseDataObject.content.fields as any;
        const player = String(fields.player);
        const count = Number(fields.count);
        ticket = {
          id,
          player,
          count,
        };
      }
    }

    return {
      data: ticket,
      isLoading,
      isError,
      error,
      refetch,
    };
  }
};
