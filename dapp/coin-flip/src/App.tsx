import {
  Container,
  Flex,
  Heading,
  Tabs,
  Box,
  Text,
  Strong,
} from "@radix-ui/themes";
import { BlendingModeIcon } from "@radix-ui/react-icons";
import { ToastContainer } from "react-toastify";
import { SettingDropdownMenu } from "./components/SettingDropdownMenu";
import { ConnectButton } from "./components/ConnectButton";
import { HouseInfo } from "./components/HouseInfo";
import { PlayerHistory } from "./components/PlayerHistory";
import { PlayerTicket } from "./components/PlayerTicket";
import { PlayerStartGame } from "./components/PlayerStartGame";
import { useFetchTicket } from "./hooks/useFetchTicket";
import { useFetchAccountBalance } from "./hooks/useFetchAccountBalance";

const App = () => {
  const { data: ticket } = useFetchTicket();
  const { data: balance } = useFetchAccountBalance();

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

        <Flex height="8" gapX="2" align="center">
          <Text size="2" style={{ color: "var(--accent-10)" }}>
            <Strong>{balance}</Strong> SUI
          </Text>
          <SettingDropdownMenu />
          <ConnectButton />
        </Flex>
      </Flex>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        pauseOnHover
      />
      <Container px="3" p="6">
        <Flex width="100%" gapX="4">
          <Flex
            flexGrow="1"
            p="4"
            style={{ backgroundColor: "#252E3E", borderRadius: "10px" }}
          >
            <Tabs.Root defaultValue="games" style={{ width: "100%" }}>
              <Tabs.List>
                <Tabs.Trigger value="games">Games</Tabs.Trigger>
                <Tabs.Trigger value="history">History</Tabs.Trigger>
              </Tabs.List>

              <Box pt="3" width="100&%">
                <Tabs.Content value="games">
                  <Flex
                    justify="center"
                    align="center"
                    p="2"
                    width="180px"
                    style={{
                      backgroundColor: "var(--gray-1)",
                      borderRadius: "10px",
                    }}
                  >
                    <Text size="2">First Step</Text>
                  </Flex>
                  <PlayerTicket />
                  {ticket && (
                    <>
                      <Flex
                        justify="center"
                        align="center"
                        p="2"
                        width="180px"
                        style={{
                          backgroundColor: "var(--gray-1)",
                          borderRadius: "10px",
                        }}
                      >
                        <Text size="2">Second Step</Text>
                      </Flex>
                      <PlayerStartGame />
                    </>
                  )}
                </Tabs.Content>
                <Tabs.Content value="history">
                  <PlayerHistory />
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </Flex>
          <Flex
            width="300px"
            p="4"
            flexShrink="0"
            style={{ backgroundColor: "#252E3E", borderRadius: "10px" }}
          >
            <HouseInfo />
          </Flex>
        </Flex>
      </Container>
    </>
  );
};

export default App;
