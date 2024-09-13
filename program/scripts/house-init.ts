import dotenv from "dotenv";
import path from "node:path";
import { Transaction } from "@mysten/sui/dist/cjs/transactions";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { bcs } from "@mysten/sui/bcs";
import curveUtils from "@noble/curves/abstract/utils";
import { Client } from './libs/client';
import { readJsonForNetwork, color } from './libs/utils';

dotenv.config();

(async () => {
  const client = new Client({
    network: 'devnet',
    secretKey: process.env.SECRETKE,
  });

  console.info('Active-address: ', color('green')(client.wallet.address));
  console.info('Active-env: ', color('green')(client.network));

  // === Initialize House Data ===
  const packagePath = path.join(__dirname, '../coin_flip');
  const resultPath = readJsonForNetwork(packagePath, client.network);
  const packageId = resultPath.packageId;
  const houseCapId = resultPath.houseCapId;
  const houseStakeSui = 5;

  const txb = new Transaction();
  const [houseStakeCoin] = txb.splitCoins(txb.gas, [
    MIST_PER_SUI * BigInt(houseStakeSui),
  ]);

  txb.moveCall({
    target: `${packageId}::house_data::initialize_house_data`,
    arguments: [
      txb.object(packageId),
      houseStakeCoin,
      // This argument is not an on-chain object, hence, we must serialize it using `bcs`
      // https://sdk.mystenlabs.com/typescript/transaction-building/basics#pure-values
      txb.pure(
        bcs
          .vector(bcs.U8)
          .serialize(curveUtils.hexToBytes(getHousePubHex())),
      ),
    ],
  });

  
//   console.info('Initiralize Result:', publishResult);
})();