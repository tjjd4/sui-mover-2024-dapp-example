# sui-mover-2024
Course about Sui development

## usage
### Publish Contract
```bash
cd sui-mover-2024-dapp-example/program

pnpm i
```
Create `.env` file
```bash
touch .env
```
Content
```text
SECRETKE={publisher_wallet_private_key}
NETWORK={'testnet' | 'mainnet' | 'devnet'}
```
### Run
```bash
# publish contract
pnpm run publish

# create house object
pnpm run house-init
```

## Run Frontend Server
```bash
cd sui-mover-2024-dapp-example/dapp/coin-filp

pnpm i
```
### Run server
```bash
pnpm run dev
```
