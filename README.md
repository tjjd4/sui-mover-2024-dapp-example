# sui-mover-2024
Course about Sui development

Accounts:
- **Player**: Represents the user participating in the game.
- **House**: Represents the project owner and has control over the house operations.

Objects:
- **Ticket**: Serves as the entry pass to the game and records the elements of random number generation.
- **Game**: Represents the game entity, recording user play data.
- **House**: Represents the casino entity, recording game rules and house data.

Actions:
- **Create and Initialize House**: Before constructing the DApp, create and initialize the house data.
- **Top-up Balance from House**: Deposit when the house's principal for betting against users is insufficient.
- **Withdraw Balance from House**: Withdraw the betting principal when closing the house.
- **Claim Fees from House**: Claim the game fees at any time.
- **Mint Ticket**: Players need to obtain a ticket to proceed to the next steps.
- **Create Game**: Start a guessing game after obtaining the ticket and placing a bet.
- **Guess Game**: Start guessing heads or tails after creating the game.
- **End Game**: The house ends the game and announces the result. If the player wins, take the bet minus the fee; if the house wins, take all the bets.

## Project structure

- `dapp/coin-flip` folder: Front-end code for the DApp in this demo.
- `program` folder: Sui Move code for the contract in this demo.
- `document` folder: All the resources used in the readme are concentrated here.

### Dapp structure
Built on the base of a DApp created using `pnpm create @mysten/dapp --template react-client-dapp`.

- `src/components` folder contains all the components. Components related to game are prefixed with "House" and "Player."
- `src/hooks` folder contains hooks provided by the app provider, as well as hooks for fetching contract data.
- `constants.ts` file for defining constants. Fill in these constants after executing the program script.
- `utils.ts` contains some commonly used utility functions.
- `App.tsx` is the main layout of the DApp.
- `main.tsx` is the entry point for the DApp website.

## usage
### Installation
1. Install dependencies
```bash
cd sui-mover-2024-dapp-example/program

pnpm i
```
2. Install SUI CLI: See the official documentation: [Install SUI](https://docs.sui.io/guides/developer/getting-started/sui-install)
### Set up Enviroment
Create `.env` file
```bash
cp .env.sample .env
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
