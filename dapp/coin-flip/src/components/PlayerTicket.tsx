import {
  Flex,
  Box,
  Popover,
  Text,
  Skeleton,
  Section,
  Button,
} from "@radix-ui/themes";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useFetchTicket } from "../hooks/useFetchTicket";
import { PROGRAM_ID } from "../constants";
import { shortenAddress, sleep, notify } from "../utils";

export const PlayerTicket = () => {
  const { data: ticket, isLoading, error, refetch } = useFetchTicket();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const handleMintTicket = () => {
    const txb = new Transaction();
    txb.moveCall({
      target: `${PROGRAM_ID}::ticket::mint`,
    });

    signAndExecuteTransaction(
      {
        transaction: txb,
      },
      {
        onSuccess: async (result) => {
          notify(`Ticket minted digest: ${result.digest}`, { type: "success" });
          await sleep(2000);
          refetch?.();
        },
        onError: (err) => {
          notify(err.message, { type: "error" });
        },
      },
    );
  };

  const handleBurnTicket = () => {
    if (ticket) {
      const txb = new Transaction();
      txb.moveCall({
        target: `${PROGRAM_ID}::ticket::burn`,
        arguments: [txb.object(ticket?.id)],
      });

      signAndExecuteTransaction(
        {
          transaction: txb,
        },
        {
          onSuccess: async (result) => {
            notify(`Ticket burned digest: ${result.digest}`, {
              type: "success",
            });
            await sleep(2000);
            refetch?.();
          },
          onError: (err) => {
            notify(err.message, { type: "error" });
          },
        },
      );
    }
  };

  const handleRefetchTicket = () => {
    refetch?.();
  };

  return (
    <Section
      my="4"
      p="4"
      height="fit"
      style={{ border: "0.5px solid var(--gray-10)", borderRadius: "10px" }}
      asChild
    >
      <Flex direction="column" justify="start" align="start" gap="2">
        {ticket ? (
          <>
            <Flex direction="column" justify="start" align="start" gap="2">
              <Box>
                <Text>Ticket ID: </Text>
                <Skeleton loading={isLoading}>
                  <Popover.Root>
                    <Popover.Trigger>
                      <Text color="blue">
                        {ticket.id ? shortenAddress(ticket.id) : ""}
                      </Text>
                    </Popover.Trigger>
                    <Popover.Content>
                      <Text>{ticket.id}</Text>
                    </Popover.Content>
                  </Popover.Root>
                </Skeleton>
              </Box>
              <Box>
                <Text>Ticket Owner: </Text>
                <Skeleton loading={isLoading}>
                  <Popover.Root>
                    <Popover.Trigger>
                      <Text color="blue">
                        {ticket.player ? shortenAddress(ticket.player) : ""}
                      </Text>
                    </Popover.Trigger>
                    <Popover.Content>
                      <Text>{ticket.player}</Text>
                    </Popover.Content>
                  </Popover.Root>
                </Skeleton>
              </Box>
              <Box>
                <Text>Ticket Count: </Text>
                <Skeleton loading={isLoading}>
                  <Text>{ticket.count}</Text>
                </Skeleton>
              </Box>
            </Flex>
            <Flex direction="row" justify="start" align="center" gapX="2">
              <Button onClick={handleRefetchTicket} disabled={isLoading}>
                Refetch Ticket
              </Button>
              <Button onClick={handleBurnTicket} disabled={isLoading}>
                Burn Ticket
              </Button>
            </Flex>
          </>
        ) : (
          <>
            <Text>You Don't have any ticket yet</Text>
            <Button onClick={handleMintTicket} disabled={isLoading}>
              Mint Ticket
            </Button>
          </>
        )}
        {error && <Text>Error: {error.message}</Text>}
      </Flex>
    </Section>
  );
};
