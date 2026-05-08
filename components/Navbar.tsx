"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, RefreshCw, ExternalLink } from "lucide-react";

const glass: React.CSSProperties = {
  background: "rgba(255,248,235,0.05)",
  backdropFilter: "blur(32px) saturate(200%)",
  WebkitBackdropFilter: "blur(32px) saturate(200%)",
  border: "1px solid rgba(255,248,235,0.10)",
};

export default function Navbar() {
  const path = usePathname();

  const navLinks = [
    { href: "/",       label: "Penjualan",      icon: <LayoutDashboard size={15} />, external: false },
    { href: "/items",  label: "Barang Terjual",  icon: <Package size={15} />,        external: false },
    { href: "https://www.appsheet.com/start/9fbc59ec-1a10-4b19-b1de-8c0a0a77766e?platform=desktop#appName=Kasir-522846710&vss=H4sIAAAAAAAAA6WOOw7CMBBE7zK1T-AWUSAEDRENpljitWQlsaPYASLLd8fhWwPlzuq9mYSz5csuUt1AHtLnWvMEiaRQTT0rSIWFd3HwrYJQ2FL3CKuBXKAmWIWMfBQvQeQAmb7k5Z_9Alazi9ZYHmbZjBbJEyzvGSvBG0IW6MZIp5bvmwuUc8mMr8fAel_G_DIirNzy2pPTG6-L01AbON8AYQXGd2oBAAA=&view=Transaksi", label: "Buka Kasir", icon: <ExternalLink size={15} />, external: true },
  ];

  return (
    <header style={{
      ...glass,
      borderRadius: 0,
      borderTop: "none", borderLeft: "none", borderRight: "none",
      padding: "12px 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      {/* Logo + Judul */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Image src="/favicon.png" alt="Logo" width={34} height={34}
          style={{ borderRadius: 8, objectFit: "cover" }} />
        <span style={{
          fontSize: 15, fontWeight: 600, fontFamily: "Funnel Display, sans-serif",
          color: "#f5eed8", letterSpacing: "-0.01em",
        }}>
          Dashboard Penjualan Ananda Collection
        </span>
      </div>

      {/* Nav tabs + badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {navLinks.map((link) => {
          const active = path === link.href;
          return (
            <Link key={link.href} href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 16px", borderRadius: 12, fontSize: 13,
              fontFamily: "Funnel Sans, sans-serif", fontWeight: 500,
              textDecoration: "none",
              background: active ? "rgba(212,160,23,0.18)" : "rgba(255,248,235,0.05)",
              border: `1px solid ${active ? "rgba(212,160,23,0.45)" : "rgba(255,248,235,0.10)"}`,
              color: active ? "#d4a017" : "rgba(245,238,216,0.60)",
              transition: "all 0.15s",
            }}>
              <span style={{ color: active ? "#d4a017" : "rgba(245,238,216,0.45)" }}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}

        {/* Auto-refresh badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 12, fontSize: 11,
          background: "rgba(212,160,23,0.12)",
          border: "1px solid rgba(212,160,23,0.30)",
          color: "#1a1400",
          backgroundColor: "#d4a017",
          fontFamily: "Funnel Sans, sans-serif",
        }}>
          <RefreshCw size={11} color="#1a1400" />
          <span style={{ whiteSpace: "nowrap", fontWeight: 600 }}>Auto-refresh 5 menit</span>
        </div>
      </div>
    </header>
  );
}
