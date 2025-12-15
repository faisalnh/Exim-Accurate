"use client";

import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MantineProvider defaultColorScheme="light">
        <Notifications position="top-right" />
        <ModalsProvider>{children}</ModalsProvider>
      </MantineProvider>
    </SessionProvider>
  );
}
