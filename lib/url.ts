import { NextRequest } from "next/server";

export function getBaseUrl(req: NextRequest) {
  const url = new URL(req.url);
  
  // Use environment variable if set
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")) {
    return process.env.NEXTAUTH_URL;
  }

  // Respect forwarded headers from proxy (Nginx, etc.)
  const host = req.headers.get("x-forwarded-host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || (url.protocol.startsWith("https") ? "https" : "http");
  
  return `${proto}://${host}`;
}
