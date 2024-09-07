import { GearIcon, CheckIcon } from "@radix-ui/react-icons";
import { Button, Text, DropdownMenu, Flex } from "@radix-ui/themes";
import { useCurrentNetwork } from "../hooks/useCurrentNetwork";
import { useSwitchNetwork } from "../hooks/useSwitchNetwork";
import { useCurrentExplorer } from "../hooks/useCurrentExplorer";
import { useSwitchExplorer } from "../hooks/useSwitchExplorer";
import {
  RPC_NODES,
  type NetworkType,
  type ExplorerType,
  EXPLORERS,
} from "../appStore";

export const SettingDropdownMenu = () => {
  const { network: currentNetwork } = useCurrentNetwork();
  const { explorer: currentExplorer } = useCurrentExplorer();

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger>
        <Button>
          <GearIcon />
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Select Network</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            {Object.keys(RPC_NODES).map((network) => (
              <SettingNetworkDropdownMenuItem
                key={network}
                network={network as NetworkType}
                active={network === currentNetwork}
              />
            ))}
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
        <DropdownMenu.Separator />
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Select Explorer</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            {Object.keys(EXPLORERS[currentNetwork]).map((explorer) => (
              <SettingExplorerDropdownMenuItem
                key={explorer}
                explorer={explorer as ExplorerType}
                active={explorer === currentExplorer}
              />
            ))}
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export const SettingNetworkDropdownMenuItem = ({
  network,
  active,
}: {
  network: NetworkType;
  active?: boolean;
}) => {
  const { mutate: switchNetwork } = useSwitchNetwork();

  return (
    <DropdownMenu.Item onSelect={() => switchNetwork({ network })}>
      <Flex align="baseline" gap="2">
        <Text size="2">
          {network.substring(0, 1).toUpperCase() + network.substring(1)}
        </Text>
      </Flex>
      {active ? <CheckIcon /> : null}
    </DropdownMenu.Item>
  );
};

export const SettingExplorerDropdownMenuItem = ({
  explorer,
  active,
}: {
  explorer: ExplorerType;
  active?: boolean;
}) => {
  const { mutate: switchExplorer } = useSwitchExplorer();

  return (
    <DropdownMenu.Item onSelect={() => switchExplorer({ explorer })}>
      <Flex align="baseline" gap="2">
        <Text size="2">
          {explorer.substring(0, 1).toUpperCase() + explorer.substring(1)}
        </Text>
      </Flex>
      {active ? <CheckIcon /> : null}
    </DropdownMenu.Item>
  );
};
