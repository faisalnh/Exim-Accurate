"use client";

import { Notifications, createNotificationsStore } from "@mantine/notifications";

export const kioskNotificationsStore = createNotificationsStore();

export function KioskNotifications() {
  return <Notifications store={kioskNotificationsStore} position="top-center" />;
}
