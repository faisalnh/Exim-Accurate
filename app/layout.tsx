import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { ColorSchemeScript } from "@mantine/core";

export const metadata = {
  title: "Exima - Export/Import Manager for Accurate",
  description: "Manage inventory adjustments for Accurate Online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
