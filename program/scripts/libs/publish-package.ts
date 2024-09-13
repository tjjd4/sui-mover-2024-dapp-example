import { Transaction } from "@mysten/sui/transactions";
import { buildPackage } from './build-package'
import { color } from "./utils";
import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import type { Client } from "./client";
import type { PublishPackageOptions, ParsedPublishResponse, PublishPackageResult } from './types';

const defaultPublishOptions: PublishPackageOptions = {
  withUnpublishedDependencies: false,
  skipFetchLatestGitDeps: true,
  gasBudget: 10 ** 9,
};

/**
 * Publishes a package and returns the package id and publish txn response
 * @param suiBinPath, the path to the sui client binary
 * @param packagePath, the path to the package to be built
 * @param client the client to use for publishing
 * @returns {PublishPackageResult} the compiled modules and dependencies
 */
export const publishPackage = async (
  suiBinPath: string,
  packagePath: string,
  client: Client,
  options: PublishPackageOptions = defaultPublishOptions,
): Promise<PublishPackageResult> => {
  const suiClient = client.suiClient;
  const wallet = client.wallet;
  const gasBudget = options.gasBudget || defaultPublishOptions.gasBudget as number;

  const { modules, dependencies } = buildPackage(suiBinPath, packagePath, options);

  const publishTransaction = new Transaction();
  publishTransaction.setGasBudget(gasBudget);

  const upgradeCap = publishTransaction.publish({
    modules,
    dependencies,
  });

  publishTransaction.transferObjects([upgradeCap], publishTransaction.pure.address(wallet.address));
  publishTransaction.setSender(wallet.address);

  console.info(`Start Publishing Package at ${packagePath}`);
  const publishTransactionBlockResponse = await suiClient.signAndExecuteTransaction({
    transaction: publishTransaction,
    signer: wallet.keypair,
    options: { showEffects: true, showObjectChanges: true },
  });

  if (publishTransactionBlockResponse.effects?.status.status === 'success') {
    const { packageId, upgradeCapId, publisherIds, created } = paseTranactionBlockResponse(publishTransactionBlockResponse);
    console.info('Successfully Published Package\n');
    console.info(color('bold')('============== Created Objects =============='));
    created.forEach(({ type, objectId, owner }) => {
      console.info('type: ', color('green')(type));
      console.info('owner: ', color('green')(owner));
      console.info('objectId: ', color('green')(objectId), '\n');
    })
    console.info(color('bold')('============== Package Infomation =============='));
    console.info('PackageId: ', color('green')(packageId))
    console.info('UpgradeCapId: ', color('green')(upgradeCapId), '\n')

    return { packageId, upgradeCapId, publisherIds, created, publishTransactionBlockResponse };
  } else {
    console.error('Publish Package Failed!');
    throw new Error(publishTransactionBlockResponse.effects?.status.error);
  }
}

/**
 * Create transaction bytes for publishing a package
 * @param suiBinPath, the path to the sui client binary
 * @param packagePath, the path to the package to be built
 * @param client the client to use for publishing
 * @returns transaction bytes in base64 and transction block
 */
export const createPublishPackageTransaction = async (
  suiBinPath: string,
  packagePath: string,
  client: Client,
  options: PublishPackageOptions = defaultPublishOptions,
): Promise<{ transaction: Transaction, base64TransactionBytes: string }> => {
  const suiClient = client.suiClient;
  const wallet = client.wallet;
  const gasBudget = options.gasBudget || defaultPublishOptions.gasBudget as number;

  const { modules, dependencies } = buildPackage(suiBinPath, packagePath, options);

  const publishTransaction = new Transaction();
  publishTransaction.setGasBudget(gasBudget);

  const upgradeCap = publishTransaction.publish({
    modules,
    dependencies,
  });

  publishTransaction.transferObjects([upgradeCap], publishTransaction.pure.address(wallet.address));
  publishTransaction.setSender(wallet.address);

  const transactionBytes = await publishTransaction.build({ client: suiClient });
  const base64TransactionBytes = Buffer.from(transactionBytes).toString('base64');

  return { transaction: publishTransaction, base64TransactionBytes };
};

const paseTranactionBlockResponse = (response: SuiTransactionBlockResponse) => {
  const parsedResponse: ParsedPublishResponse = {
    packageId: '',
    upgradeCapId: '',
    publisherIds: [],
    created: [],
  };
  if (response.objectChanges) {
    for (const change of response.objectChanges) {
      if (change.type === 'created' && change.objectType.endsWith('package::UpgradeCap')) {
        parsedResponse.upgradeCapId = change.objectId;
      } else if (change.type === 'created' && change.objectType.endsWith('package::Publisher')) {
        parsedResponse.publisherIds.push(change.objectId);
      } else if (change.type === 'published') {
        parsedResponse.packageId = change.packageId;
      } else if (change.type === 'created') {
        let owner = '';
        if (typeof change.owner === 'object' && 'AddressOwner' in change.owner) {
          owner = change.owner.AddressOwner === change.sender ? `${change.sender} (your address)` : `change.owner.AddressOwner (address)`;
        } else if (typeof change.owner === 'object' && 'ObjectOwner' in change.owner) {
          owner = `change.owner.ObjectOwner (object)`;
        } else if (typeof change.owner === 'object' && 'Shared' in change.owner) {
          owner = 'Shared';
        } else if (change.owner === 'Immutable') {
          owner = 'Immutable';
        }
        parsedResponse.created.push({ type: change.objectType, objectId: change.objectId, owner });
      }
    }
  }
  return parsedResponse;
};