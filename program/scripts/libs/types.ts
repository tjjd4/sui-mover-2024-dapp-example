import type { SuiTransactionBlockResponse } from '@mysten/sui/client';

export type DerivePathParams = {
  accountIndex?: number;
  isExternal?: boolean;
  addressIndex?: number;
};

export type WalletParams = {
  mnemonics?: string;
  secretKey?: string;
};

export type Network = 'testnet' | 'mainnet' | 'devnet';
export type ClientParams = {
  network?: Network;
} & WalletParams;

export type BuildPackageOptions = {
  // Also publish transitive dependencies that are not published yet
  withUnpublishedDependencies?: boolean;
  // Skip fetching the latest git dependencies
  skipFetchLatestGitDeps?: boolean;
};

export type BuildPackageResult = {
  modules: string[]; // base64 encoded compiled modules
  dependencies: string[]; // dependencies of the package ids
  digest: Uint8Array; // the package digest
};

export type PublishOptions = {
  // if true, the package will be published even if it's already published
  enforce?: boolean;
  // if true, it will write a `Move.${network}.toml` file for the package for the network
  writeMoveToml?: boolean;
  // if true, it will write a `publish-result.${networkType}.json` file with the parsed objectIds
  resultParser?: PublishPackageResultParser;
} & PublishPackageOptions;

export type PublishPackageOptions = {
  // The gas budget for the publish transaction
  gasBudget?: number;
} & BuildPackageOptions;

export type ParsedPublishResponse = {
  packageId: string;
  upgradeCapId:  string;
  publisherIds:  string[];
  created: { type: string; objectId: string, owner: string }[];
}

export type PublishPackageResult = {
  publishTransactionBlockResponse: SuiTransactionBlockResponse;
} & ParsedPublishResponse;

export type PublishPackageResultParser = (publishPackageResult: PublishPackageResult) => Record<string, any>;

export type PublishPackageBatchParams =  { packagePath: string, options?: PublishOptions }[];

export type UpgradePackageOptions = PublishPackageOptions;

export type ParsedUpgradeResponse = {
  packageId: string;
  upgradeCapId:  string;
};

export type UpgradePackageResult = {
  upgradeTransactionBlockResponse: SuiTransactionBlockResponse;
} & ParsedUpgradeResponse;

export type DependenciePaths = { packagePath: string }[];

export type MoveToml = {
  package: Record<string, any>;
  dependencies: Record<string, any>;
  addresses: Record<string, any>;
  ['devnet-addresses']?: Record<string, any>;
  ['testnet-addresses']?: Record<string, any>;
  ['mainnet-addresses']?: Record<string, any>;
};


