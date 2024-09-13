
import path from "node:path";
import fs from "node:fs";
import toml from '@iarna/toml';
import type { Network, MoveToml } from "./types";

export const suiDependency = { git: "https://github.com/MystenLabs/sui.git", subdir: "crates/sui-framework/packages/sui-framework", rev: "devnet" };

export const writeJson = (value: any, outputPath: string) => {
  const jsonContent = JSON.stringify(value, null, 2);
  fs.writeFileSync(outputPath, jsonContent);
};

export const writeJsonForNetwork = (value: any, packagePath: string, network: Network) => {
  const outputPath = path.join(packagePath, `publish-result.${network}.json`);
  writeJson(value, outputPath);
};

export const readJson = (filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading or parsing JSON file:', error);
  }
};

export const readJsonForNetwork = (packagePath: string, network: Network) => {
  const filePath = path.join(packagePath, `publish-result.${network}.json`);
  return readJson(filePath);
};

export const readMoveToml = (tomlPath: string) => {
  if (!fs.existsSync(tomlPath)) {
    throw new Error(`Toml file not found in ${tomlPath}`);
  }
  const tomlContent = fs.readFileSync(tomlPath, 'utf8');
  const parsedToml = toml.parse(tomlContent);
  return parsedToml as MoveToml;
};

export const writeMoveToml = (parsedToml: MoveToml, outPath: string) => {
  let tomlContent = toml.stringify(parsedToml);
  fs.writeFileSync(outPath, tomlContent);
};

/**
 * Rewrite specific network into Sui dependency in the `Move.toml` file
 * @param packagePath the path to the package
 * @param packageId the package id
 * @param network 'devnet' | 'testnet' | 'mainnet' | 'localnet'
 */
export const writeToml = (packagePath: string, network: Network) => {
  const tomlPath = path.join(packagePath, "Move.toml");
  const moveToml = readMoveToml(tomlPath);
  const oldSuiDependency = moveToml.dependencies["Sui"];
  if (oldSuiDependency.rev !== `framework/${network}`) {
    console.info(`Rewrite Sui dependency in ${tomlPath} to ${network}`);
    suiDependency.rev = `framework/${network}`;
    moveToml.dependencies["Sui"] = suiDependency
    writeMoveToml(moveToml, tomlPath);
  } else if (oldSuiDependency.rev !== network) {
    console.info(`Rewrite Sui dependency in ${tomlPath} to ${network}`);
    suiDependency.rev = network;
    moveToml.dependencies["Sui"] = suiDependency
    writeMoveToml(moveToml, tomlPath);
  }
};

/**
 * Update package id in the `Move.${network}.toml` file
 * @param packagePath the path to the package
 * @param packageId the package id
 * @param network 'devnet' | 'testnet' | 'mainnet' | 'localnet'
 */
export const updateNetworkTom = (packagePath: string, packageId: string, network: Network) => {
  const networkTomlPath = path.join(packagePath, `Move.${network}.toml`);
  const networkToml = readMoveToml(networkTomlPath);
  networkToml.package["published-at"] = packageId;
  writeMoveToml(networkToml, networkTomlPath);
};

/**
 * Write package id into published-at and address field in the `Move.${network}.toml` file
 * @param packagePath the path to the package
 * @param packageId the package id
 * @param network 'devnet' | 'testnet' | 'mainnet' | 'localnet'
 */
export const writeTomlForNetwork = (packagePath: string, packageId: string, network: Network) => {
  const tomlPath = path.join(packagePath, "Move.toml");
  const moveToml = readMoveToml(tomlPath);
  moveToml.package["published-at"] = packageId;
  const addresses = moveToml.addresses;
  for (const key in addresses) {
    addresses[key] = packageId;
  }
  const newTomlPath = path.join(packagePath, `Move.${network}.toml`);
  writeMoveToml(moveToml, newTomlPath);
};

/**
 * Replace the `Move.toml` file with the `Move.${network}.toml` file
 * And make a backup of the `Move.toml` file as `Move.toml.backup`
 * @param packagePath the path to the package
 * @param network 'devnet' | 'testnet' | 'mainnet' | 'localnet'
 */
export const replaceMoveToml = (packagePath: string, network: Network) => {
  const tomlPath = path.join(packagePath, `Move.${network}.toml`);
  if (!fs.existsSync(tomlPath)) {
    throw new Error(`Move.${network}.toml not found in ${packagePath}`);
  }

  const backupMoveTomlPath = path.join(packagePath, "Move.toml.backup");
  fs.cpSync(path.join(packagePath, "Move.toml"), backupMoveTomlPath);

  fs.cpSync(tomlPath, path.join(packagePath, "Move.toml"));
};

/**
 * Restore the `Move.toml` file from the backup file `Move.toml.backup`
 * @param packagePath the path to the package
 */
export const restoreMoveToml = (packagePath: string) => {
  const backupMoveTomlPath = path.join(packagePath, "Move.toml.backup");
  if (!fs.existsSync(backupMoveTomlPath)) return;
  fs.cpSync(backupMoveTomlPath, path.join(packagePath, "Move.toml"));
  fs.rmSync(backupMoveTomlPath);
};

const colors = {
  reset: (s: string) => `\x1b[0m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[22m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[22m`,
  italic: (s: string) => `\x1b[3m${s}\x1b[23m`,
  underline: (s: string) => `\x1b[4m${s}\x1b[24m`,
  inverse: (s: string) => `\x1b[7m${s}\x1b[27m`,
  hidden: (s: string) => `\x1b[8m${s}\x1b[28m`,
  strikethrough: (s: string) => `\x1b[9m${s}\x1b[29m`,
  black: (s: string) => `\x1b[30m${s}\x1b[39m`,
  red: (s: string) => `\x1b[31m${s}\x1b[39m`,
  green: (s: string) => `\x1b[32m${s}\x1b[39m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[39m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[39m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[39m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[39m`,
  white: (s: string) => `\x1b[37m${s}\x1b[39m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[39m`,
  bgBlack: (s: string) => `\x1b[40m${s}\x1b[49m`,
  bgRed: (s: string) => `\x1b[41m${s}\x1b[49m`,
  bgGreen: (s: string) => `\x1b[42m${s}\x1b[49m`,
  bgYellow: (s: string) => `\x1b[43m${s}\x1b[49m`,
  bgBlue: (s: string) => `\x1b[44m${s}\x1b[49m`,
  bgMagenta: (s: string) => `\x1b[45m${s}\x1b[49m`,
  bgCyan: (s: string) => `\x1b[46m${s}\x1b[49m`,
  bgWhite: (s: string) => `\x1b[47m${s}\x1b[49m`,
};

export const color = (colorType: keyof typeof colors) => {
  if (colors[colorType]) {
    return colors[colorType];
  } else {
    return (text: string) => text;
  }
};