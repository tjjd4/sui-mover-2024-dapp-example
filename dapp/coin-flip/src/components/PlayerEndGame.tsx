import { Button } from "@radix-ui/themes";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { bls12_381 as bls } from "@noble/curves/bls12-381";
import * as curveUtils from "@noble/curves/abstract/utils";
import { useFetchGames } from "../hooks/useFetchGames";
import { useFetchHouseData } from "../hooks/useFetchHouseData";
import { useFetchHistory } from "../hooks/useFetchHistory";
import { PROGRAM_ID, HOUSE_DATA_ID, HOUSE_PRIV_KEY } from "../constants";
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

export const PlayerEndGame = ({ game }: { game: Game }) => {
  const { refetch } = useFetchGames();
  const { refetch: refetchHouse } = useFetchHouseData();
  const { refetch: refetchHistory } = useFetchHistory();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const handleEndGame = () => {
    const txb = new Transaction();

    const houseSignedInput = bls.sign(
      new Uint8Array(game.vrfInput),
      curveUtils.hexToBytes(HOUSE_PRIV_KEY),
    );

    txb.moveCall({
      target: `${PROGRAM_ID}::game::end_game`,
      arguments: [
        txb.object(HOUSE_DATA_ID),
        txb.pure.id(game.id),
        txb.pure(bcs.vector(bcs.U8).serialize(houseSignedInput)),
      ],
    });

    signAndExecuteTransaction(
      {
        transaction: txb,
      },
      {
        onSuccess: async (result) => {
          notify(`End Game digest: ${result.digest}`, {
            type: "success",
          });
          await sleep(2000);
          refetch?.();
          refetchHouse?.();
          refetchHistory?.();
        },
        onError: (err) => {
          notify(err.message, { type: "error" });
        },
      },
    );
  };

  return (
    <Button
      disabled={game.status == 3 || game.status == 4}
      onClick={handleEndGame}
    >
      End game manually
    </Button>
  );
};
