import {
  Container,
  Text,
  Title,
  TextInput,
  Button,
  Paper,
  Group,
  Stack,
  Divider,
  Flex,
  Checkbox,
  Tooltip,
  Loader,
  Alert,
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
  Grid,
  GridCol,
} from "@mantine/core";
import {
  IconSearch,
  IconX,
  IconLogout,
  IconAlertCircle,
  IconSun,
  IconMoon,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { showNotification } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import {
  useSearchHistory,
  saveSearchToHistory,
  deleteSearchHistory,
  fetchGeolocation,
  fetchUserIp,
} from "../hooks/useApi";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

function HomePage() {
  const navigate = useNavigate();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const [ipInfo, setIpInfo] = useState(null);
  const [inputIp, setInputIp] = useState("");
  const [userIp, setUserIp] = useState(null);
  const [selectedHistoryItems, setSelectedHistoryItems] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Use SWR for search history
  const {
    searchHistory,
    isLoading: historyLoading,
    isError,
    refresh,
  } = useSearchHistory();

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("authChange"));
    showNotification({
      title: "Logged Out",
      message: "You have been logged out successfully",
      color: "blue",
    });
    navigate("/login");
  };

  // Handle authentication errors
  const handleAuthError = (error) => {
    if (error.response?.status === 401 || error.message === "No auth token") {
      showNotification({
        title: "Session Expired",
        message: "Please log in again",
        color: "red",
      });
      handleLogout();
    }
  };

  // Fetch geolocation data
  const fetchGeo = async (ip, isOwn = false) => {
    try {
      setIsSearching(true);
      const data = await fetchGeolocation(ip);
      setIpInfo(data);

      // Save to backend if not the user's own IP and has valid data
      if (!isOwn && data) {
        const searchData = {
          ipAddress: data.ip,
          city: data.city || null,
          region: data.region || null,
          country: data.country || null,
          location: data.loc || null,
          timezone: data.timezone || null,
          org: data.org || null,
        };

        try {
          await saveSearchToHistory(searchData);
          refresh(); // Refresh SWR cache
        } catch (saveError) {
          handleAuthError(saveError);
        }
      }
    } catch (err) {
      console.error("Geolocation fetch error:", err);
      showNotification({
        title: "Error",
        message: "Invalid IP address or service unavailable",
        color: "red",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch user's public IP
  const fetchOwnIp = async () => {
    try {
      const ip = await fetchUserIp();
      setUserIp(ip);
      fetchGeo(ip, true);
    } catch (err) {
      showNotification({ message: "Failed to get your IP", color: "red" });
    }
  };

  const handleSearch = () => {
    if (!inputIp || !/^\d{1,3}(\.\d{1,3}){3}$/.test(inputIp)) {
      return showNotification({ message: "Enter a valid IP", color: "red" });
    }
    fetchGeo(inputIp);
  };

  const handleClear = () => {
    fetchGeo(userIp, true);
    setInputIp("");
  };

  // Handle checkbox selection
  const handleHistorySelect = (ipAddress, checked) => {
    if (checked) {
      setSelectedHistoryItems((prev) => [...prev, ipAddress]);
    } else {
      setSelectedHistoryItems((prev) =>
        prev.filter((item) => item !== ipAddress)
      );
    }
  };

  // Handle select all/deselect all
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIpAddresses = searchHistory.map((item) => item.ipAddress);
      setSelectedHistoryItems(allIpAddresses);
    } else {
      setSelectedHistoryItems([]);
    }
  };

  // Delete selected history items
  const handleDeleteSelected = () => {
    setShowDeleteModal(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteSearchHistory(selectedHistoryItems);
      setSelectedHistoryItems([]);
      refresh(); // Refresh SWR cache

      showNotification({
        title: "History Deleted",
        message: `${selectedHistoryItems.length} items removed from history`,
        color: "green",
      });

      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete history:", error);
      handleAuthError(error);
      showNotification({
        title: "Error",
        message: "Failed to delete history items",
        color: "red",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle SWR errors
  useEffect(() => {
    if (isError) {
      handleAuthError(isError);
    }
  }, [isError]);

  useEffect(() => {
    fetchOwnIp();
  }, []);

  // Get user email from JWT token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );
        const payload = JSON.parse(jsonPayload);
        setUserEmail(payload.email || payload.sub || "User");
      } catch (error) {
        console.error("Error decoding token:", error);
        setUserEmail("User");
      }
    }
  }, []);

  return (
    <Container size="xl" py="xl">
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Flex justify="space-between" align="center" mb="md">
          <Stack spacing={0}>
            <Title order={2}>Welcome back to Geo App</Title>
            {userEmail && (
              <Text size="sm" color="dimmed">
                Hello, {userEmail}!
              </Text>
            )}
          </Stack>
          <Group spacing="xs">
            <ActionIcon
              variant="outline"
              color={computedColorScheme === "dark" ? "yellow" : "blue"}
              onClick={() =>
                setColorScheme(
                  computedColorScheme === "dark" ? "light" : "dark"
                )
              }
              title="Toggle color scheme"
            >
              {computedColorScheme === "dark" ? (
                <IconSun size="1.1rem" />
              ) : (
                <IconMoon size="1.1rem" />
              )}
            </ActionIcon>
            <Button
              variant="filled"
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Group>
        </Flex>

        {/* Search Input Section */}
        <Group mb="lg">
          <TextInput
            placeholder="Enter IP (e.g., 8.8.8.8)"
            value={inputIp}
            onChange={(e) => setInputIp(e.currentTarget.value)}
            leftSection={<IconSearch size={18} />}
            style={{ flex: 1 }}
            disabled={isSearching}
          />
          <Button
            onClick={handleSearch}
            loading={isSearching}
            disabled={isSearching}
          >
            Search
          </Button>
          <Tooltip label="Clear to your own IP">
            <Button
              variant="light"
              color="red"
              onClick={handleClear}
              disabled={isSearching}
            >
              <IconX size={18} />
            </Button>
          </Tooltip>
        </Group>

        {/* Main Content Grid - Responsive Layout */}
        <Grid gutter="lg">
          {/* Geolocation Info Section */}
          <GridCol span={{ base: 12, md: 7 }}>
            {ipInfo && (
              <Paper shadow="md" p="md" radius="md" withBorder>
                <Title order={4} mb="md">
                  Geolocation Information
                </Title>
                <Stack gap="xs">
                  <Text>
                    <strong>IP:</strong> {ipInfo.ip}
                  </Text>
                  <Text>
                    <strong>City:</strong> {ipInfo.city}
                  </Text>
                  <Text>
                    <strong>Region:</strong> {ipInfo.region}
                  </Text>
                  <Text>
                    <strong>Country:</strong> {ipInfo.country}
                  </Text>
                  <Text>
                    <strong>Location:</strong> {ipInfo.loc}
                  </Text>
                  <Text>
                    <strong>Timezone:</strong> {ipInfo.timezone}
                  </Text>
                  <Text>
                    <strong>Org:</strong> {ipInfo.org}
                  </Text>
                </Stack>

                {/* Map Component */}
                {ipInfo.loc && (
                  <div style={{ marginTop: "20px" }}>
                    <Title order={5} mb="sm">
                      Location on Map
                    </Title>
                    <div
                      style={{
                        height: "300px",
                        width: "100%",
                        borderRadius: "8px",
                        overflow: "hidden",
                      }}
                    >
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                          parseFloat(ipInfo.loc.split(",")[1]) - 0.01
                        },${parseFloat(ipInfo.loc.split(",")[0]) - 0.01},${
                          parseFloat(ipInfo.loc.split(",")[1]) + 0.01
                        },${
                          parseFloat(ipInfo.loc.split(",")[0]) + 0.01
                        }&layer=mapnik&marker=${ipInfo.loc}`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        title={`Location of ${ipInfo.ip}`}
                      ></iframe>
                    </div>
                    <Text size="sm" c="dimmed" mt="xs">
                      📍 {ipInfo.city}, {ipInfo.region}, {ipInfo.country} •{" "}
                      {ipInfo.loc}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Click map to open in OpenStreetMap
                    </Text>
                  </div>
                )}
              </Paper>
            )}
          </GridCol>

          {/* Search History Section */}
          <GridCol span={{ base: 12, md: 5 }}>
            <Paper shadow="md" p="md" radius="md" withBorder h="fit-content">
              <Flex justify="space-between" align="center" mb="md">
                <Title order={4}>Search History</Title>
                {searchHistory.length > 0 && (
                  <Group>
                    <Checkbox
                      label="Select All"
                      checked={
                        selectedHistoryItems.length === searchHistory.length
                      }
                      indeterminate={
                        selectedHistoryItems.length > 0 &&
                        selectedHistoryItems.length < searchHistory.length
                      }
                      onChange={(event) =>
                        handleSelectAll(event.currentTarget.checked)
                      }
                    />
                    {selectedHistoryItems.length > 0 && (
                      <Button
                        size="sm"
                        color="red"
                        variant="light"
                        onClick={handleDeleteSelected}
                      >
                        Delete ({selectedHistoryItems.length})
                      </Button>
                    )}
                  </Group>
                )}
              </Flex>

              {isError && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Failed to load search history"
                  color="red"
                  mb="md"
                >
                  Please check your connection and try refreshing the page.
                </Alert>
              )}

              {historyLoading ? (
                <Flex justify="center" mt="md">
                  <Loader size="sm" />
                  <Text size="sm" ml="xs" c="dimmed">
                    Loading search history...
                  </Text>
                </Flex>
              ) : searchHistory.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                  No search history yet. Start by searching for an IP address!
                </Text>
              ) : (
                <Stack
                  mt="sm"
                  gap="xs"
                  style={{ maxHeight: "400px", overflowY: "auto" }}
                >
                  {searchHistory.map((item) => (
                    <Flex key={item.id} align="center" gap="md">
                      <Checkbox
                        checked={selectedHistoryItems.includes(item.ipAddress)}
                        onChange={(event) =>
                          handleHistorySelect(
                            item.ipAddress,
                            event.currentTarget.checked
                          )
                        }
                      />
                      <Button
                        variant="subtle"
                        onClick={() => fetchGeo(item.ipAddress)}
                        style={{ flex: 1 }}
                        justify="flex-start"
                        disabled={isSearching}
                      >
                        <div style={{ textAlign: "left" }}>
                          <div>{item.ipAddress}</div>
                          {item.city && (
                            <Text size="xs" c="dimmed">
                              {item.city}, {item.region}, {item.country}
                            </Text>
                          )}
                        </div>
                      </Button>
                    </Flex>
                  ))}
                </Stack>
              )}
            </Paper>
          </GridCol>
        </Grid>

        <ConfirmDeleteModal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          selectedCount={selectedHistoryItems.length}
          isDeleting={isDeleting}
        />
      </Paper>
    </Container>
  );
}

export default HomePage;
