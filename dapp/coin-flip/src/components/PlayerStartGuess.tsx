import { useState } from "react";
import { Flex, Button, Dialog, SegmentedControl } from "@radix-ui/themes";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useFetchTicket } from "../hooks/useFetchTicket";
import { useFetchGames } from "../hooks/useFetchGames";
import { useFetchHistory } from "../hooks/useFetchHistory";
import { PROGRAM_ID, HOUSE_DATA_ID } from "../constants";
import { notify, sleep } from "../utils";

type Game = {
  id: string;
  player: string;
  totalStake: number;
  guessEpoch: number;
  guess?: boolean;
  vrfInput: any;
  feeAmount: number;
  status: number;
};

export const PlayerStartGuess = ({ game }: { game: Game }) => {
  const { data: ticket } = useFetchTicket();
  const { refetch } = useFetchGames();
  const { refetch: refetchHistory } = useFetchHistory();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [guess, setGuess] = useState(true);

  const handeChangeGuess = (value: any) => {
    setGuess(value === "true");
  };

  const handleStartGuess = () => {
    const txb = new Transaction();

    if (ticket) {
      txb.moveCall({
        target: `${PROGRAM_ID}::game::start_guess`,
        arguments: [
          txb.object(HOUSE_DATA_ID),
          txb.object(ticket.id),
          txb.pure.id(game.id),
          txb.pure.bool(guess),
        ],
      });

      signAndExecuteTransaction(
        {
          transaction: txb,
        },
        {
          onSuccess: async (result) => {
            notify(`Guess game digest: ${result.digest}`, {
              type: "success",
            });
            await sleep(2000);
            refetch?.();
            refetchHistory?.();
          },
          onError: (err) => {
            notify(err.message, { type: "error" });
          },
        },
      );
    }
  };

  return (
    <Dialog.Root key={game.id}>
      <Dialog.Trigger>
        <Button disabled={game.status >= 1}>Start Guess</Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="450px">
        <Flex direction="column" gap="3">
          <Dialog.Title>Start Guess</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Chose your one Heads or Tails, default is Heads
          </Dialog.Description>
          <SegmentedControl.Root
            variant="classic"
            radius="small"
            defaultValue="true"
            onValueChange={handeChangeGuess}
          >
            <SegmentedControl.Item value="true">HEADs</SegmentedControl.Item>
            <SegmentedControl.Item value="false">TAILs</SegmentedControl.Item>
          </SegmentedControl.Root>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button onClick={handleStartGuess}>Submit</Button>
            </Dialog.Close>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
