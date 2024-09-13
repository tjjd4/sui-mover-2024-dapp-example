import {
  Container,
  Heading,
  Flex,
  Box,
  Popover,
  Text,
  Separator,
  Skeleton,
} from "@radix-ui/themes";
import { toHEX } from "@mysten/sui/utils";
import { useFetchHouseData } from "../hooks/useFetchHouseData";
import { PROGRAM_ID, HOUSE_DATA_ID } from "../constants";
import { shortenAddress } from "../utils";

export const HouseInfo = () => {
  const { data: houseData, isLoading } = useFetchHouseData();

  return (
    <Container my="2">
      <Flex direction="column" gapY="4">
        <Heading size="4" mb="2">
          House Info
        </Heading>
        <Flex direction="column" gapY="2">
          <Box>
            <Text>Program ID: </Text>
            <Popover.Root>
              <Popover.Trigger>
                <Text color="blue">{shortenAddress(PROGRAM_ID)}</Text>
              </Popover.Trigger>
              <Popover.Content>
                <Text>{PROGRAM_ID}</Text>
              </Popover.Content>
            </Popover.Root>
          </Box>
          <Box>
            <Text>House Data ID: </Text>
            <Popover.Root>
              <Popover.Trigger>
                <Text color="blue">{shortenAddress(HOUSE_DATA_ID)}</Text>
              </Popover.Trigger>
              <Popover.Content>
                <Text>{HOUSE_DATA_ID}</Text>
              </Popover.Content>
            </Popover.Root>
          </Box>
        </Flex>
        <Separator color="gray" size="4" />
        <Heading size="4" mb="2">
          House Data
        </Heading>
        {isLoading || houseData ? (
          <Flex direction="column" gapY="2">
            <Box>
              <Text>Houser ID: </Text>
              <Skeleton loading={isLoading}>
                <Popover.Root>
                  <Popover.Trigger>
                    <Text color="blue">
                      {houseData?.houser
                        ? shortenAddress(houseData.houser)
                        : ""}
                    </Text>
                  </Popover.Trigger>
                  <Popover.Content>
                    <Text>{houseData?.houser}</Text>
                  </Popover.Content>
                </Popover.Root>
              </Skeleton>
            </Box>
            <Box>
              <Text>House Balance: </Text>
              <Skeleton loading={isLoading}>
                <Text>{houseData?.balance ?? 0}</Text>
              </Skeleton>
            </Box>
            <Box>
              <Text>House Fees: </Text>
              <Skeleton loading={isLoading}>
                <Text>{houseData?.fees ?? 0}</Text>
              </Skeleton>
            </Box>
            <Box>
              <Text>House Base Fee (%): </Text>
              <Skeleton loading={isLoading}>
                <Text>{(houseData?.baseFee ?? 0) * 100} %</Text>
              </Skeleton>
            </Box>
            <Box>
              <Text>Min Stake (Sui): </Text>
              <Skeleton loading={isLoading}>
                <Text>{houseData?.minStake ?? 0}</Text>
              </Skeleton>
            </Box>
            <Box>
              <Text>Max Stake (Sui): </Text>
              <Skeleton loading={isLoading}>
                <Text>{houseData?.maxStake ?? 0}</Text>
              </Skeleton>
            </Box>
            <Box>
              <Text>Public Key (For verify Randomness): </Text>
              <br />
              <Skeleton loading={isLoading}>
                <Popover.Root>
                  <Popover.Trigger>
                    <Text color="blue">
                      {houseData?.publicKey
                        ? shortenAddress(
                            toHEX(houseData.publicKey as Uint8Array),
                          )
                        : ""}
                    </Text>
                  </Popover.Trigger>
                  <Popover.Content>
                    <Text>
                      {toHEX((houseData?.publicKey ?? []) as Uint8Array)}
                    </Text>
                  </Popover.Content>
                </Popover.Root>
              </Skeleton>
            </Box>
          </Flex>
        ) : (
          <Text>No House Data</Text>
        )}
      </Flex>
    </Container>
  );
};
