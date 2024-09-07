import { Container, Flex, Heading } from "@radix-ui/themes";
import { BlendingModeIcon } from "@radix-ui/react-icons";
import { SettingDropdownMenu } from "./components/SettingDropdownMenu";
import { ConnectButton } from "./components/ConnectButton";
import { WalletStatus } from "./WalletStatus";

const App = () => {
  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="4"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
          backgroundColor: "#252e3ef2",
        }}
      >
        <Flex align="center" justify="center" gapX="2">
          <BlendingModeIcon width="36" height="36" color="var(--accent-10)" />
          <Heading>Coin flip Game</Heading>
        </Flex>

        <Flex height="8" gapX="2">
          <SettingDropdownMenu />
          <ConnectButton />
        </Flex>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          <WalletStatus />
        </Container>
      </Container>
    </>
  );
};

export default App;
