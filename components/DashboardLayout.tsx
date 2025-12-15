"use client";

import { AppShell, Burger, Group, NavLink, Text, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  IconDashboard,
  IconFileExport,
  IconFileImport,
  IconKey,
  IconUser,
  IconLogout,
  IconAdjustments,
} from "@tabler/icons-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Text size="xl" fw={700}>
              Exima
            </Text>
          </Group>
          <Group>
            <Text size="sm">{session?.user?.email}</Text>
            <Button
              variant="subtle"
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={handleSignOut}
            >
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          label="Dashboard"
          leftSection={<IconDashboard size={20} />}
          active={pathname === "/dashboard"}
          onClick={() => router.push("/dashboard")}
        />

        <NavLink
          label="Inventory Adjustment"
          leftSection={<IconAdjustments size={20} />}
          childrenOffset={28}
          active={
            pathname.startsWith("/dashboard/export/inventory-adjustment") ||
            pathname.startsWith("/dashboard/import/inventory-adjustment")
          }
        >
          <NavLink
            label="Export (Get data)"
            leftSection={<IconFileExport size={16} />}
            active={pathname === "/dashboard/export/inventory-adjustment"}
            onClick={() =>
              router.push("/dashboard/export/inventory-adjustment")
            }
          />

          <NavLink
            label="Import (Input data)"
            leftSection={<IconFileImport size={16} />}
            active={pathname === "/dashboard/import/inventory-adjustment"}
            onClick={() =>
              router.push("/dashboard/import/inventory-adjustment")
            }
          />
        </NavLink>

        <NavLink
          label="Accurate Credentials"
          leftSection={<IconKey size={20} />}
          active={pathname === "/dashboard/credentials"}
          onClick={() => router.push("/dashboard/credentials")}
        />

        <NavLink
          label="Profile"
          leftSection={<IconUser size={20} />}
          active={pathname === "/dashboard/profile"}
          onClick={() => router.push("/dashboard/profile")}
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
