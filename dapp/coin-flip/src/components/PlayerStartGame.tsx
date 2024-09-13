import { useState } from "react";
import {
  Flex,
  Text,
  Section,
  Button,
  TextField,
  Card,
  Box,
  Skeleton,
  Popover,
  Strong,
  Grid,
} from "@radix-ui/themes";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { useFetchHouseData } from "../hooks/useFetchHouseData";
import { useFetchTicket } from "../hooks/useFetchTicket";
import { useFetchGames } from "../hooks/useFetchGames";
import { useFetchHistory } from "../hooks/useFetchHistory";
import { PlayerStartGuess } from "../components/PlayerStartGuess";
import { PlayerEndGame } from "../components/PlayerEndGame";
import { PROGRAM_ID, HOUSE_DATA_ID } from "../constants";
import { notify, sleep, shortenAddress } from "../utils";

// const FUNDS_SUBMITTED_STATE: u8 = 0;
// const GUESS_SUBMITTED_STATE: u8 = 1;
// const PLAYER_WON_STATE: u8 = 3;
// const HOUSE_WON_STATE: u8 = 4;
const parseGameStatus = (status: number) => {
  switch (status) {
    case 0:
      return "Bet Submitted";
    case 1:
      return "Guess Submitted";
    case 3:
      return "You Win";
    case 4:
      return "You Lose";
    default:
      return "Unknown";
  }
};

export const PlayerStartGame = () => {
  const { data: ticket } = useFetchTicket();
  const { data: houseData } = useFetchHouseData();
  const { data: games, isLoading, error, refetch } = useFetchGames();
  const { refetch: refetchHistory } = useFetchHistory();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [stake, setStake] = useState(0);

  const handleCreateGame = () => {
    const txb = new Transaction();

    if (houseData && ticket) {
      if (stake >= houseData.minStake && stake <= houseData.maxStake) {
        const [stakeCoin] = txb.splitCoins(txb.gas, [
          Number(MIST_PER_SUI) * stake,
        ]);

        txb.moveCall({
          target: `${PROGRAM_ID}::game::start_game`,
          arguments: [
            txb.object(HOUSE_DATA_ID),
            txb.object(ticket.id),
            stakeCoin,
          ],
        });

        signAndExecuteTransaction(
          {
            transaction: txb,
          },
          {
            onSuccess: async (result) => {
              notify(`Create game digest: ${result.digest}`, {
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
      } else {
        notify(
          `Stake must be between ${houseData.minStake} and ${houseData.maxStake}`,
          { type: "error" },
        );
      }
    }
  };

  return (
    <Section
      my="4"
      p="4"
      height="fit"
      style={{ border: "0.5px solid var(--gray-10)", borderRadius: "10px" }}
      asChild
    >
      <Flex direction="column" justify="start" align="start" gapY="4">
        {games && games.length > 0 ? (
          <>
            <Flex direction="row" justify="start" align="center" gapX="2">
              <Text>Stake</Text>
              <TextField.Root
                required
                placeholder="Stake (in SUI)"
                onChange={(e) => {
                  setStake(Number(e.target.value));
                }}
              />
              <Button onClick={handleCreateGame} disabled={isLoading}>
                Create Game
              </Button>
            </Flex>
            <Flex
              direction="row"
              wrap="wrap"
              justify="start"
              align="start"
              gap="4"
            >
              {games.map((game) => (
                <Card key={game.id}>
                  <Flex
                    direction="column"
                    justify="start"
                    align="start"
                    gap="2"
                    minHeight="220px"
                  >
                    <Box>
                      <Text>Game ID: </Text>
                      <Skeleton loading={isLoading}>
                        <Popover.Root>
                          <Popover.Trigger>
                            <Text color="blue">
                              {game.id ? shortenAddress(game.id) : ""}
                            </Text>
                          </Popover.Trigger>
                          <Popover.Content>
                            <Text>{game.id}</Text>
                          </Popover.Content>
                        </Popover.Root>
                      </Skeleton>
                    </Box>
                    <Box>
                      <Text>Game Owner: </Text>
                      <Skeleton loading={isLoading}>
                        <Popover.Root>
                          <Popover.Trigger>
                            <Text color="blue">
                              {game.player ? shortenAddress(game.player) : ""}
                            </Text>
                          </Popover.Trigger>
                          <Popover.Content>
                            <Text>{game.player}</Text>
                          </Popover.Content>
                        </Popover.Root>
                      </Skeleton>
                    </Box>
                    <Box>
                      <Text>Game Count: </Text>
                      <Skeleton loading={isLoading}>
                        <Text>
                          <Strong style={{ color: "var(--blue-10" }}>
                            #{game.guessEpoch}
                          </Strong>{" "}
                          Epoch
                        </Text>
                      </Skeleton>
                    </Box>
                    <Box>
                      <Text>Game Fee Amount: </Text>
                      <Skeleton loading={isLoading}>
                        <Text>
                          <Strong style={{ color: "var(--blue-10" }}>
                            {game.feeAmount} SUI
                          </Strong>{" "}
                          (If win)
                        </Text>
                      </Skeleton>
                    </Box>
                    <Box>
                      <Text>Game Reward: </Text>
                      <Skeleton loading={isLoading}>
                        <Text>
                          <Strong style={{ color: "var(--blue-10" }}>
                            {game.totalStake - game.feeAmount}
                          </Strong>{" "}
                          SUI
                        </Text>
                      </Skeleton>
                    </Box>
                    <Box>
                      <Text>Game Status: </Text>
                      <Skeleton loading={isLoading}>
                        <Text>
                          <Strong style={{ color: "var(--blue-10" }}>
                            {parseGameStatus(game.status)}
                          </Strong>{" "}
                        </Text>
                      </Skeleton>
                    </Box>
                    {game.guess !== undefined && (
                      <Box>
                        <Text>Your Guess: </Text>
                        <Skeleton loading={isLoading}>
                          <Text>
                            <Strong style={{ color: "var(--blue-10" }}>
                              {game.guess ? "HEAD" : "TAIL"}
                            </Strong>{" "}
                          </Text>
                        </Skeleton>
                      </Box>
                    )}
                  </Flex>
                  <Grid columns="2" gap="4" mt="2">
                    <PlayerStartGuess game={game} />
                    <PlayerEndGame game={game} />
                  </Grid>
                </Card>
              ))}
            </Flex>
          </>
        ) : (
          <>
            <Text>You Don't have any Game yet</Text>
            <Flex direction="row" justify="start" align="center" gapX="2">
              <Text>Stake</Text>
              <TextField.Root
                required
                placeholder="Stake (in SUI)"
                onChange={(e) => {
                  setStake(Number(e.target.value));
                }}
              />
            </Flex>
            <Button onClick={handleCreateGame} disabled={isLoading}>
              Create Game
            </Button>
          </>
        )}
        {error && <Text>Error: {error.message}</Text>}
      </Flex>
    </Section>
  );
};
