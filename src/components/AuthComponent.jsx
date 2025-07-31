import {
  Anchor,
  Button,
  Checkbox,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import classes from "./AuthComponent.module.css";

export function AuthComponent() {
  const navigate = useNavigate();

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

  // Handles login request
  const handleSubmit = async (values) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/login",
        values
      );
      const { token } = response.data;

      localStorage.setItem("token", token);

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

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form}>
        <Title order={2} className={classes.title}>
          Welcome back to Mantine!
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
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
            mt="md"
            size="md"
            radius="md"
            {...form.getInputProps("password")}
          />

          <Checkbox label="Keep me logged in" mt="xl" size="md" />

          <Button type="submit" fullWidth mt="xl" size="md" radius="md">
            Login
          </Button>
        </form>

        <Text ta="center" mt="md">
          Don&apos;t have an account?{" "}
          <Anchor href="#" fw={500} onClick={(e) => e.preventDefault()}>
            Register
          </Anchor>
        </Text>
      </Paper>
    </div>
  );
}
