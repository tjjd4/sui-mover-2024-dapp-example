# sui-mover-2024
Course about Sui development

## usage
### Installation
```bash
cd sui-mover-2024-dapp-example/program

pnpm i
```
### Set up Enviroment
Create `.env` file
```bash
touch .env
```
Content
```text
SECRETKE={publisher_wallet_private_key}
NETWORK={'testnet' | 'mainnet' | 'devnet'}
```
### Publish Contract
```bash
# publish contract
pnpm run publish

# create house object
pnpm run house-init
```
A `publish-result.{network}.json` will automatically be created if executed successfully
```javascript
{
  "packageId": "0x...",
  "upgradeCapId": "0x...",
  "publisherIds": [
    "0x..."
  ],
  "houseCapId": "0x...",
  "houseDataId": "0x...",
  "housePrivKey": {private_key_for_randomness}
}
```

## Run Frontend Server
### Installation
```bash
cd sui-mover-2024-dapp-example/dapp/coin-filp

pnpm i
```
### Set up Contract Constants
Edit File `sui-mover-2024-dapp-example/dapp/coin-filp/src/constants.ts`
```typescript
import { createInMemoryStore } from "./utils";

export const PROGRAM_ID = "`packageId` in publish-result.{network}.json";
export const HOUSE_CAP_ID = "`houseCapId` in publish-result.{network}.json";
export const HOUSE_DATA_ID = "`houseDataId` in publish-result.{network}.json";
export const HOUSE_PRIV_KEY = "`housePrivKey` in publish-result.{network}.json";

...
```

### Run server
```bash
pnpm run dev
```
