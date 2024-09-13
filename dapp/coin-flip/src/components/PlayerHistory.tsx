import { useEffect, useState } from "react";
import { Table } from "@radix-ui/themes";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { PROGRAM_ID } from "../constants";
import { useFetchHistory } from "../hooks/useFetchHistory";
import { notify } from "../utils";

type GameEvent = {
  game_id: string;
  status: number;
  sender: string;
};

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

export const PlayerHistory = () => {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const { data } = useFetchHistory();
  const [history, setHistory] = useState<GameEvent[]>([]);

  useEffect(() => {
    // Subscribe to End game event
    const unsub = suiClient.subscribeEvent({
      filter: {
        And: [
          {
            MoveEventModule: {
              module: "game",
              package: PROGRAM_ID,
            },
          },
          {
            Sender: account?.address ?? "",
          },
        ],
      },
      onMessage(event) {
        const gameEvent = {
          ...(event.parsedJson as GameEvent),
          sender: event.sender,
        };
        setHistory((prevHistory) => [...(prevHistory || []), gameEvent]);
        notify(`End Game Event: ${gameEvent.game_id}`, { type: "info" });
      },
    });

    return () => {
      (async () => (await unsub)())();
    };
  }, [suiClient]);

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Game ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {(history.length > 0 ? history : (data ?? [])).map((gameEvent) => (
          <Table.Row key={gameEvent.game_id}>
            <Table.RowHeaderCell>{gameEvent.game_id}</Table.RowHeaderCell>
            <Table.Cell>{parseGameStatus(gameEvent.status)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};
