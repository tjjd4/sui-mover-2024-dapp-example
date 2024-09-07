import { useCurrentAccount, ConnectModal } from "@mysten/dapp-kit";
import { Button, type ButtonProps } from "@radix-ui/themes";
import { AccountDropdownMenu } from "./AccountDropdownMenu";
import type { ReactNode } from "react";

type ConnectButtonProps = {
  connectText?: ReactNode;
} & ButtonProps;

export const ConnectButton = ({
  connectText = "Connect Wallet",
  ...buttonProps
}: ConnectButtonProps) => {
  const currentAccount = useCurrentAccount();

  return currentAccount ? (
    <AccountDropdownMenu currentAccount={currentAccount} />
  ) : (
    <ConnectModal trigger={<Button {...buttonProps}>{connectText}</Button>} />
  );
};
