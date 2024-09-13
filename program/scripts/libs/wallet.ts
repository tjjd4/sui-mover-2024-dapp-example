import {
  SUI_PRIVATE_KEY_PREFIX,
  decodeSuiPrivateKey,
} from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHEX, fromB64 } from '@mysten/sui/utils';
import type { DerivePathParams, WalletParams } from './types';

const getDerivePath = (
  derivePathParams: DerivePathParams = {}
) => {
  const {
    accountIndex = 0,
    isExternal = false,
    addressIndex = 0,
  } = derivePathParams;
  return `m/44'/784'/${accountIndex}'/${isExternal ? 1 : 0}'/${addressIndex}'`;
};

export const isHex = (str: string) => /^0x[0-9a-fA-F]+$|^[0-9a-fA-F]+$/.test(str);
export const isBase64 = (str: string) => /^[a-zA-Z0-9+/]+={0,2}$/g.test(str);
const hexOrBase64ToUint8Array = (str: string): Uint8Array => {
  if (isHex(str)) {
    return fromHEX(str);
  } else if (isBase64(str)) {
    return fromB64(str);
  } else {
    throw new Error('The string is not a valid hex or base64 string.');
  }
};

const PRIVATE_KEY_SIZE = 32;
const LEGACY_PRIVATE_KEY_SIZE = 64;
const normalizePrivateKey = (key: Uint8Array): Uint8Array => {
  if (key.length === LEGACY_PRIVATE_KEY_SIZE) {
    // This is a legacy secret key, we need to strip the public key bytes and only read the first 32 bytes
    key = key.slice(0, PRIVATE_KEY_SIZE);
  } else if (key.length === PRIVATE_KEY_SIZE + 1 && key[0] === 0) {
    // sui.keystore key is a Base64 string with scheme flag 0x00 at the beginning
    return key.slice(1);
  } else if (key.length === PRIVATE_KEY_SIZE) {
    return key;
  }
  throw new Error('Invalid secret key.');
};


export class Wallet {
  private mnemonics: string;
  private secretKey: string;
  public keypair: Ed25519Keypair;
  public address: string;

  constructor({ mnemonics, secretKey }: WalletParams) {
    this.mnemonics = mnemonics || '';
    this.secretKey = secretKey || '';
    if (!this.mnemonics && !this.secretKey) {
      throw new Error('Mnemonics or secretKey is required.');
    }

    this.keypair = this.secretKey
      ? this.getKeypairFromSecretKey(this.secretKey)
      : this.getKeypairFromMnemonics(this.mnemonics);
    this.address = this.keypair.getPublicKey().toSuiAddress();
  }

    getKeypairFromSecretKey(secretKey: string) {
      if (secretKey.startsWith(SUI_PRIVATE_KEY_PREFIX)) {
        const { secretKey: uint8ArraySecretKey } = decodeSuiPrivateKey(secretKey);
        return Ed25519Keypair.fromSecretKey(
          normalizePrivateKey(uint8ArraySecretKey)
        );
      }
  
      return Ed25519Keypair.fromSecretKey(
        normalizePrivateKey(hexOrBase64ToUint8Array(secretKey))
      );
    }

    getKeypairFromMnemonics(mnemonics: string, derivePathParams?: DerivePathParams) {
      const derivePath = getDerivePath(derivePathParams);
      return Ed25519Keypair.deriveKeypair(mnemonics, derivePath);
    }
}