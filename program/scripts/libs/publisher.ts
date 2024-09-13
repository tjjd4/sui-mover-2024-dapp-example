import { fromB64 } from "@mysten/sui/utils";
import path from "node:path";
import fs from "node:fs";
import { buildPackage } from './build-package';
import { publishPackage, createPublishPackageTransaction } from './publish-package';
import { upgradePackage, createUpgradePackageTransaction, paseTranactionBlockResponse } from './upgrade-package';
import { Client } from './client';
import {
  restoreMoveToml,
  replaceMoveToml,
  writeToml,
  writeTomlForNetwork,
  updateNetworkTom,
  readJsonForNetwork,
  writeJsonForNetwork,
  color
} from './utils';
import {
  BuildPackageOptions,
  PublishOptions,
  PublishPackageOptions,
  UpgradePackageOptions,
  PublishPackageBatchParams,
  DependenciePaths,
} from './types';

export class Publisher {
  private _suiBinPath: string;
  private _client: Client;

  constructor(suiBinPath: string, client: Client) {
    this._suiBinPath = suiBinPath;
    this._client = client;
  }

  public build(packagePath: string, options?: BuildPackageOptions) {
    return buildPackage(this._suiBinPath, packagePath, options);
  }

  public async publish(packagePath: string, options?: PublishOptions) {
    const enforce = options?.enforce || false;
    const writeMoveToml = options?.writeMoveToml || true;
    const resultParser = options?.resultParser || (() => ({}));

    const moveTomlPath = path.join(packagePath, `Move.${this._client.network}.toml`);
    const shouldPublish = !fs.existsSync(moveTomlPath) || enforce;

    if (shouldPublish) {
      writeToml(packagePath, this._client.network);
      const publishPackageResult = await publishPackage(this._suiBinPath, packagePath, this._client, options);

      if (writeMoveToml) {
        writeTomlForNetwork(packagePath, publishPackageResult.packageId, this._client.network);
      }

      if (resultParser) {
        const defaultPublishResult = {
          packageId: publishPackageResult.packageId,
          upgradeCapId: publishPackageResult.upgradeCapId,
          publisherIds: publishPackageResult.publisherIds
        };
        const parsedPublishResult = resultParser(publishPackageResult);
        const newPublishResult = { ...defaultPublishResult, ...parsedPublishResult };
        writeJsonForNetwork(newPublishResult, packagePath, this._client.network);
      }

      return publishPackageResult;
    } else {
      console.error(`Package ${color('gray')(packagePath)} has published!`);
      throw new Error(`Package ${color('gray')(packagePath)} has published!`);
    }
  }

  public async publishBatch(params: PublishPackageBatchParams) {
    try {
      for (const param of params) {
        await this.publish(param.packagePath, param.options);
        replaceMoveToml(param.packagePath, this._client.network);
      }
    } finally {
      params.forEach((param) => {
        restoreMoveToml(param.packagePath);
      });
    }
  }

  public async createPublishTransaction(packagePath: string, options?: PublishPackageOptions) {
    return createPublishPackageTransaction(this._suiBinPath, packagePath, this._client, options);
  }

  public async upgrade(
    packagePath: string,
    packageId: string,
    upgradeCapId: string,
    dependenciePaths?: DependenciePaths,
    options?: UpgradePackageOptions
  ) {
    if (dependenciePaths) {
      try {
        if (dependenciePaths) {
          await Promise.all(dependenciePaths.map(dependeniePath =>
            replaceMoveToml(dependeniePath.packagePath, this._client.network)
          ));
        }

        const transactionResult = await createUpgradePackageTransaction(
          this._suiBinPath, packagePath,
          packageId, upgradeCapId,
          this._client, options
        );
        const transactionBytes: Uint8Array = fromB64(transactionResult.base64TransactionBytes);
        const upgradeTransactionBlockResponse = await this._client.suiClient.signAndExecuteTransaction({
          transaction: transactionBytes,
          signer: this._client.wallet.keypair,
          options: { showEffects: true, showObjectChanges: true },
        });

        if (upgradeTransactionBlockResponse.effects?.status.status === 'success') {
          const { packageId, upgradeCapId } = paseTranactionBlockResponse(upgradeTransactionBlockResponse);
          console.info('Successfully Upgraded Package\n');
          console.info(color('bold')('============== Package Infomation =============='));
          console.log('PackageId: ', color('green')(packageId))
          console.log('UpgradeCapId: ', color('green')(upgradeCapId), '\n')

          updateNetworkTom(packagePath, packageId, this._client.network);
          const oldPublishResult = readJsonForNetwork(packagePath, this._client.network);
          const newPublishResult = { ...oldPublishResult, packageId };
          writeJsonForNetwork(newPublishResult, packagePath, this._client.network);
          return { packageId, upgradeCapId, upgradeTransactionBlockResponse };
        } else {
          console.error('Upgrade Package Failed!');
          throw new Error(upgradeTransactionBlockResponse.effects?.status.error);
        }
      } finally {
        if (dependenciePaths) {
          await Promise.all(dependenciePaths.map(dependeniePath =>
            restoreMoveToml(dependeniePath.packagePath)
          ));
        }
      }
    } else {
      const upgradePackageResult = await upgradePackage(this._suiBinPath, packagePath, packageId, upgradeCapId, this._client, options);
      updateNetworkTom(packagePath, upgradePackageResult.packageId, this._client.network);
      const oldPublishResult = readJsonForNetwork(packagePath, this._client.network);
      const newPublishResult = { ...oldPublishResult, packageId: upgradePackageResult.packageId };
      writeJsonForNetwork(newPublishResult, packagePath, this._client.network);
      return upgradePackageResult;
    }
  }

  public async createUpgradeTransaction(
    packagePath: string,
    packageId: string,
    upgradeCapId: string,
    options?: UpgradePackageOptions
  ) {
    return createUpgradePackageTransaction(this._suiBinPath, packagePath, packageId, upgradeCapId, this._client, options);
  }
};