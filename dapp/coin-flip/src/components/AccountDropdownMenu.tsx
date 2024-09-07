import { formatAddress } from "@mysten/sui/utils";
import {
  useAccounts,
  useResolveSuiNSName,
  useDisconnectWallet,
  useSwitchAccount,
} from "@mysten/dapp-kit";
import { CheckIcon } from "@radix-ui/react-icons";
import { Button, Text, DropdownMenu, Flex } from "@radix-ui/themes";
import { shortenAddress } from "../utils";
import type { WalletAccount } from "@mysten/wallet-standard";

type AccountDropdownMenuProps = {
  currentAccount: WalletAccount;
};

export const AccountDropdownMenu = ({
  currentAccount,
}: AccountDropdownMenuProps) => {
  const { mutate: disconnectWallet } = useDisconnectWallet();

  const { data: domain } = useResolveSuiNSName(
    currentAccount.label ? null : currentAccount.address,
  );
  const accounts = useAccounts();

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger>
        <Button>
          {currentAccount.label ??
            domain ??
            formatAddress(currentAccount.address)}
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {accounts.map((account) => (
          <AccountDropdownMenuItem
            key={account.address}
            account={account}
            active={currentAccount.address === account.address}
          />
        ))}
        <DropdownMenu.Separator />
        <DropdownMenu.Item onSelect={() => disconnectWallet()}>
          Disconnect
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export const AccountDropdownMenuItem = ({
  account,
  active,
}: {
  account: WalletAccount;
  active?: boolean;
}) => {
  const { mutate: switchAccount } = useSwitchAccount();
  const { data: domain } = useResolveSuiNSName(
    account.label ? null : account.address,
  );

  return (
    <DropdownMenu.Item onSelect={() => switchAccount({ account })}>
      <Flex align="baseline" gap="2">
        <Text size="2">
          {account.label ?? domain ?? formatAddress(account.address)}
        </Text>
        <Text as="p" size="1" style={{ color: "var(--blue-6)" }}>
          {shortenAddress(formatAddress(account.address))}
        </Text>
      </Flex>
      {active ? <CheckIcon /> : null}
    </DropdownMenu.Item>
  );
};
