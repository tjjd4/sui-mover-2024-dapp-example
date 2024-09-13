import { Transaction, UpgradePolicy } from "@mysten/sui/transactions";
import { buildPackage } from './build-package'
import { color } from './utils';
import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import type { Client } from "./client";
import type { UpgradePackageOptions, ParsedUpgradeResponse, UpgradePackageResult } from './types';

const defaultUpgradeOptions: UpgradePackageOptions = {
  withUnpublishedDependencies: true,
  skipFetchLatestGitDeps: false,
  gasBudget: 10 ** 9,
};

/**
 * Upgrade a package and returns upgrade txn response
 * @param suiBinPath, the path to the sui client binary
 * @param packagePath, the path to the package to be built
 * @param packageId, the package id of the package to be upgraded
 * @param upgradeCapId, the upgrade cap id
 * @param client the client to use for upgradeing
 * @returns {UpgradePackageResult} the compiled modules and dependencies
 */
export const upgradePackage = async (
  suiBinPath: string,
  packagePath: string,
  packageId: string,
  upgradeCapId: string,
  client: Client,
  options: UpgradePackageOptions = defaultUpgradeOptions,
): Promise<UpgradePackageResult> => {
  const suiClient = client.suiClient;
  const wallet = client.wallet;
  const gasBudget = options.gasBudget || defaultUpgradeOptions.gasBudget as number;

  const { modules, dependencies, digest } = buildPackage(suiBinPath, packagePath, options);

  const upgradeTransaction = new Transaction();
  upgradeTransaction.setGasBudget(gasBudget);

  const ticket = upgradeTransaction.moveCall({
    target: `0x2::package::authorize_upgrade`,
    arguments: [
      upgradeTransaction.object(upgradeCapId),
      upgradeTransaction.pure.u8(UpgradePolicy.COMPATIBLE),
      upgradeTransaction.pure.vector('u8', digest),
    ]
  });

  const upgradeReceipt = upgradeTransaction.upgrade({
    modules,
    dependencies,
    package: packageId,
    ticket,
  });

  upgradeTransaction.moveCall({
    target: `0x2::package::commit_upgrade`,
    arguments: [
      upgradeTransaction.object(upgradeCapId),
      upgradeReceipt,
    ]
  });

  console.info(`Start Upgrading Package at ${packagePath}`);
  const upgradeTransactionBlockResponse = await suiClient.signAndExecuteTransaction({
    transaction: upgradeTransaction,
    signer: wallet.keypair,
    options: { showEffects: true, showObjectChanges: true },
  });


  if (upgradeTransactionBlockResponse.effects?.status.status === 'success') {
    const { packageId, upgradeCapId } = paseTranactionBlockResponse(upgradeTransactionBlockResponse);
    console.info('Successfully Upgraded Package\n');
    console.info(color('bold')('============== Package Infomation =============='));
    console.log('PackageId: ', color('green')(packageId));
    console.log('UpgradeCapId: ', color('green')(upgradeCapId), '\n');
    return { packageId, upgradeCapId, upgradeTransactionBlockResponse };
  } else {
    console.error('Upgrade Package Failed!');
    throw new Error(upgradeTransactionBlockResponse.effects?.status.error);
  }
};

/**
 * Create transaction bytes for upgrading a package
 * @param suiBinPath, the path to the sui client binary
 * @param packagePath, the path to the package to be built
 * @param packageId, the package id of the package to be upgraded
 * @param upgradeCapId, the upgrade cap id
 * @param client the client to use for upgrading
 * @param options the options for upgrading the package
 * @returns transaction bytes in base64 and transction block
 */
export const createUpgradePackageTransaction = async (
  suiBinPath: string,
  packagePath: string,
  packageId: string,
  upgradeCapId: string,
  client: Client,
  options: UpgradePackageOptions = defaultUpgradeOptions,
) => {
  const suiClient = client.suiClient;
  const wallet = client.wallet;
  const gasBudget = options.gasBudget || defaultUpgradeOptions.gasBudget as number;

  const { modules, dependencies, digest } = buildPackage(suiBinPath, packagePath, options);

  const upgradeTransaction = new Transaction();
  upgradeTransaction.setGasBudget(gasBudget);

  const ticket = upgradeTransaction.moveCall({
    target: `0x2::package::authorize_upgrade`,
    arguments: [
      upgradeTransaction.object(upgradeCapId),
      upgradeTransaction.pure.u8(UpgradePolicy.COMPATIBLE),
      upgradeTransaction.pure.vector('u8', digest),
    ]
  });

  const upgradeReceipt = upgradeTransaction.upgrade({
    modules,
    dependencies,
    package: packageId,
    ticket,
  });

  upgradeTransaction.moveCall({
    target: `0x2::package::commit_upgrade`,
    arguments: [
      upgradeTransaction.object(upgradeCapId),
      upgradeReceipt,
    ]
  });

  upgradeTransaction.setSender(wallet.address);

  const transactionBytes = await upgradeTransaction.build({ client: suiClient });
  const base64TransactionBytes = Buffer.from(transactionBytes).toString('base64');

  return { transaction: upgradeTransaction, base64TransactionBytes };
};

export const paseTranactionBlockResponse = (response: SuiTransactionBlockResponse) => {
  const parsedResponse: ParsedUpgradeResponse = {
    packageId: '',
    upgradeCapId: '',
  };
  if (response.objectChanges) {
    for (const change of response.objectChanges) {
      if (change.type === 'published') {
        parsedResponse.packageId = change.packageId;
      } else if (change.objectType.endsWith('package::UpgradeCap')) {
        parsedResponse.upgradeCapId = change.objectId;
      }
    }
  }
  return parsedResponse;
};