
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Wallet } from './wallet';
import { ClientParams, Network } from './types';

export class Client {
  private _wallet: Wallet;
  private _suiClient: SuiClient;
  private _network: Network;

  constructor({ network, mnemonics, secretKey }: ClientParams) {
    this._network = network ?? 'mainnet';
    const fullnodeUrl = getFullnodeUrl(this._network);
    this._wallet = new Wallet({ mnemonics, secretKey });
    this._suiClient = new SuiClient({ url: fullnodeUrl });
  }

  get suiClient() {
    return this._suiClient;
  }

  get wallet() {
    return this._wallet;
  }

  get network() {
    return this._network;
  }
}