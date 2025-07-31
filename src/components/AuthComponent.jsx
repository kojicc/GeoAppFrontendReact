import {
  Anchor,
  Button,
  Checkbox,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Container,
  Group,
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
  Box,
  Image,
  Stack,
} from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import { useState, useEffect } from "react";
import classes from "./AuthComponent.module.css";

export function AuthComponent() {
  const navigate = useNavigate();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Invalid email format",
      password: (value) =>
        value.length >= 6 ? null : "Password must be at least 6 characters",
    },
  });

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Decode token to get user info (simple JWT decode)
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
        setUserInfo({ email: payload.email || payload.sub || "User" });
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Error decoding token:", error);
        setUserInfo({ email: "User" });
        setIsLoggedIn(true);
      }
    }
  }, []);

  // Handles login request
  const handleSubmit = async (values) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/login",
        values
      );
      const { token } = response.data;

      localStorage.setItem("token", token);

      // Decode token to get user info
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
        setUserInfo({ email: payload.email || values.email });
      } catch (error) {
        console.error("Error decoding token:", error);
        setUserInfo({ email: values.email });
      }

      setIsLoggedIn(true);
      window.dispatchEvent(new Event("authChange"));

      showNotification({
        title: "Login Successful",
        message: "Redirecting...",
        color: "green",
      });

      navigate("/");
    } catch (error) {
      showNotification({
        title: "Login Failed",
        message: "Invalid email or password",
        color: "red",
      });
    }
  };

  // If user is logged in, show welcome screen
  if (isLoggedIn && userInfo) {
    return (
      <Container size="sm" style={{ paddingTop: "5rem" }}>
        <Paper shadow="md" p="xl" radius="md" withBorder>
          <Group position="apart" mb="xl">
            <Title order={2}>Welcome back to Geo App</Title>
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
          </Group>

          <Stack align="center" spacing="lg">
            <Image
              src="https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif"
              alt="Welcome"
              width={200}
              height={150}
              fit="contain"
            />
            <Text size="lg" align="center">
              Hello, {userInfo.email}! You're successfully logged in.
            </Text>
            <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Login form
  return (
    <Container size="sm" style={{ paddingTop: "3rem" }}>
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Group position="apart" mb="xl">
          <Title order={2} align="center">
            Welcome to Geo App
          </Title>
          <ActionIcon
            variant="outline"
            color={computedColorScheme === "dark" ? "yellow" : "blue"}
            onClick={() =>
              setColorScheme(computedColorScheme === "dark" ? "light" : "dark")
            }
            title="Toggle color scheme"
          >
            {computedColorScheme === "dark" ? (
              <IconSun size="1.1rem" />
            ) : (
              <IconMoon size="1.1rem" />
            )}
          </ActionIcon>
        </Group>

        <Box mb="lg" style={{ textAlign: "center" }}>
          <Image
            src="https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif"
            alt="Login Animation"
            width={250}
            height={200}
            fit="contain"
            mx="auto"
          />
        </Box>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack spacing="md">
            <TextInput
              label="Email address"
              placeholder="hello@gmail.com"
              size="md"
              radius="md"
              {...form.getInputProps("email")}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              size="md"
              radius="md"
              {...form.getInputProps("password")}
            />

            <Checkbox label="Keep me logged in" size="md" />

            <Button type="submit" fullWidth size="md" radius="md">
              Login
            </Button>
          </Stack>
        </form>

        <Text ta="center" mt="md">
          Don&apos;t have an account?{" "}
          <Anchor href="#" fw={500} onClick={(e) => e.preventDefault()}>
            Register
          </Anchor>
        </Text>

        <Text size="sm" align="center" mt="md" color="dimmed">
          Enter your credentials to access Geo App
        </Text>
      </Paper>
    </Container>
  );
}
