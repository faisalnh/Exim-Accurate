import { ReactNode } from "react";
import { MantineProvider } from "@mantine/core";

export const metadata = {
    title: "Self Checkout Kiosk",
    description: "Self-service inventory checkout station",
};

export default function KioskLayout({ children }: { children: ReactNode }) {
    return (
        <MantineProvider forceColorScheme="dark">
            <div
                data-mantine-color-scheme="dark"
                style={{
                    minHeight: "100vh",
                    width: "100vw",
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                    display: "flex",
                    flexDirection: "column",
                    color: "white",
                }}
            >
                {children}
            </div>
        </MantineProvider>
    );
}


