"use client";

import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Container,
  Center,
  Stack,
  Alert,
} from "@mantine/core";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { IconAlertCircle } from "@tabler/icons-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={100}>
      <Center>
        <Stack w="100%">
          <Title ta="center">Exima Login</Title>
          <Paper withBorder shadow="md" p={30} radius="md">
            <form onSubmit={handleSubmit}>
              <Stack>
                {error && (
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    title="Error"
                    color="red"
                  >
                    {error}
                  </Alert>
                )}

                <TextInput
                  label="Email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                />

                <Button type="submit" fullWidth loading={loading}>
                  Sign in
                </Button>
              </Stack>
            </form>
          </Paper>
        </Stack>
      </Center>
    </Container>
  );
}
