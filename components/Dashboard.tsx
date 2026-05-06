"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, CartesianGrid,
} from "recharts";
import { TrendingUp, CreditCard, Tag, Users, ChevronDown, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import type { Transaction, MonthlyData } from "@/lib/sheets";

interface Props {
  transaksi: Transaction[];
  monthlyData: MonthlyData[];
  pembayaranData: Record<string, Transaction[]>;
  error: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
};

const COLORS = ["#a78bfa", "#f472b6", "#38bdf8", "#34d399", "#fb923c", "#e879f9"];
const GLOWS  = ["rgba(167,139,250,0.18)", "rgba(244,114,182,0.15)", "rgba(56,189,248,0.15)", "rgba(52,211,153,0.15)", "rgba(251,146,60,0.15)", "rgba(232,121,249,0.15)"];

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 20,
  position: "relative",
  overflow: "hidden",
};

const shineTop: React.CSSProperties = {
  content: '""',
  position: "absolute",
  top: 0, left: 0, right: 0,
  height: 1,
  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22) 40%, rgba(255,255,255,0.22) 60%, transparent)",
  pointerEvents: "none",
  zIndex: 2,
};

export default function Dashboard({ transaksi, monthlyData, pembayaranData, error }: Props) {
  const [openPembayaran, setOpenPembayaran] = useState<Record<string, boolean>>({});
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const filtered = useMemo(() => {
    if (selectedMonth === "all") return transaksi;
    return transaksi.filter((t) => {
      const [y, m] = t.date.split("-");
      return `${y}-${m}` === selectedMonth;
    });
  }, [transaksi, selectedMonth]);

  const totalPenjualan = filtered.reduce((s, t) => s + t.totalPenjualan, 0);
  const totalDiskon    = filtered.reduce((s, t) => s + t.diskon, 0);
  const totalTransaksi = filtered.length;
  const uniqueCustomers = new Set(filtered.map((t) => t.customer)).size;

  const filteredPembayaran = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filtered.forEach((t) => {
      const k = t.pembayaran || "Lainnya";
      if (!map[k]) map[k] = [];
      map[k].push(t);
    });
    return map;
  }, [filtered]);

  const monthKeys = Array.from(new Set(transaksi.map((t) => t.date.slice(0, 7)))).sort();
  const togglePembayaran = (key: string) =>
    setOpenPembayaran((prev) => ({ ...prev, [key]: !prev[key] }));

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload?.length) {
      return (
        <div style={{ ...glass, padding: "10px 14px", minWidth: 140 }}>
          <div style={shineTop} />
          <p style={{ color: "rgba(200,200,255,0.45)", fontSize: 11, marginBottom: 4, margin: "0 0 4px" }}>{label}</p>
          <p style={{ color: "#a78bfa", fontFamily: "Funnel Display, sans-serif", fontWeight: 600, fontSize: 15, margin: 0 }}>
            {fmt(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const stats = [
    { icon: <TrendingUp size={16} />, label: "Total Penjualan",   value: fmt(totalPenjualan),                   color: "#a78bfa", glow: "rgba(167,139,250,0.2)" },
    { icon: <Tag size={16} />,        label: "Total Diskon",       value: fmt(totalDiskon),                      color: "#f472b6", glow: "rgba(244,114,182,0.18)" },
    { icon: <CreditCard size={16} />, label: "Jumlah Transaksi",   value: totalTransaksi.toLocaleString("id-ID"), color: "#38bdf8", glow: "rgba(56,189,248,0.18)" },
    { icon: <Users size={16} />,      label: "Pelanggan Unik",     value: uniqueCustomers.toLocaleString("id-ID"),color: "#34d399", glow: "rgba(52,211,153,0.18)" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: 0 }}>

      {/* Ambient glow blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -120, left: -80,  width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", left: "50%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,114,182,0.10) 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <header style={{
        ...glass,
        borderRadius: 0,
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        padding: "18px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(32px) saturate(200%)",
        WebkitBackdropFilter: "blur(32px) saturate(200%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, background: "#a78bfa", borderRadius: "50%", boxShadow: "0 0 8px rgba(167,139,250,0.8)" }} />
          <h1 style={{ fontSize: 17, fontWeight: 600, margin: 0, letterSpacing: "-0.01em", fontFamily: "Funnel Display, sans-serif" }}>
            Dashboard Penjualan
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              ...glass,
              borderRadius: 12,
              padding: "7px 14px",
              fontSize: 12,
              fontFamily: "Funnel Sans, sans-serif",
              fontWeight: 500,
              color: "var(--text)",
              outline: "none",
              cursor: "pointer",
              appearance: "none" as const,
            }}
          >
            <option value="all" style={{ background: "#12121f" }}>Semua Bulan</option>
            {monthKeys.map((mk) => {
              const [y, m] = mk.split("-");
              const label = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString("id-ID", { month: "long", year: "numeric" });
              return <option key={mk} value={mk} style={{ background: "#12121f" }}>{label}</option>;
            })}
          </select>
          <div style={{ ...glass, borderRadius: 12, display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", fontSize: 11, color: "rgba(200,200,255,0.5)" }}>
            <RefreshCw size={11} />
            <span style={{ whiteSpace: "nowrap" }}>Auto-refresh 5 menit</span>
          </div>
        </div>
      </header>

      <main style={{ padding: "28px 32px", maxWidth: 1300, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Error */}
        {error && (
          <div style={{ ...glass, borderColor: "rgba(248,113,113,0.3)", padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={shineTop} />
            <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, color: "#f87171", fontSize: 13, fontWeight: 600, fontFamily: "Funnel Display, sans-serif" }}>Gagal memuat data</p>
              <p style={{ margin: "4px 0 0", color: "rgba(200,200,255,0.5)", fontSize: 12, lineHeight: 1.5 }}>
                {error} — Pastikan Google Sheets sudah dipublikasikan ke web.
              </p>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="fade-up fade-up-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ ...glass, padding: "20px 22px" }}>
              <div style={shineTop} />
              {/* Glow blob inside card */}
              <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${s.glow} 0%, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ color: s.color, opacity: 0.85 }}>{s.icon}</div>
                <span style={{ fontSize: 11, color: "rgba(200,200,255,0.45)", textTransform: "uppercase" as const, letterSpacing: "0.07em", fontWeight: 500 }}>
                  {s.label}
                </span>
              </div>
              <div style={{
                fontSize: 22,
                fontWeight: 600,
                fontFamily: "Funnel Display, sans-serif",
                color: s.color,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                wordBreak: "break-word" as const,
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="fade-up fade-up-3" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 24 }}>
          {/* Area chart */}
          <div style={{ ...glass, padding: "22px 24px" }}>
            <div style={shineTop} />
            <h2 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 20px", fontFamily: "Funnel Display, sans-serif", color: "rgba(240,240,255,0.9)", letterSpacing: "0.01em" }}>
              Total Penjualan per Bulan
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(200,200,255,0.4)", fontFamily: "Funnel Sans" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "rgba(200,200,255,0.4)", fontFamily: "Funnel Sans" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="totalPenjualan" stroke="#a78bfa" strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{ r: 4, fill: "#a78bfa" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart */}
          <div style={{ ...glass, padding: "22px 24px" }}>
            <div style={shineTop} />
            <h2 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 20px", fontFamily: "Funnel Display, sans-serif", color: "rgba(240,240,255,0.9)", letterSpacing: "0.01em" }}>
              Penjualan per Metode
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={Object.entries(filteredPembayaran).map(([k, v], i) => ({
                  name: k.length > 8 ? k.slice(0, 8) + "…" : k,
                  fullName: k,
                  total: v.reduce((s, t) => s + t.totalPenjualan, 0),
                  fill: COLORS[i % COLORS.length],
                }))}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "rgba(200,200,255,0.4)", fontFamily: "Funnel Sans" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "rgba(200,200,255,0.4)", fontFamily: "Funnel Sans" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accordion */}
        <div className="fade-up fade-up-4" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 14px", fontFamily: "Funnel Display, sans-serif", color: "rgba(240,240,255,0.9)", letterSpacing: "0.01em" }}>
            Detail per Metode Pembayaran
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(filteredPembayaran).map(([metode, txs], idx) => {
              const isOpen = openPembayaran[metode];
              const total  = txs.reduce((s, t) => s + t.totalPenjualan, 0);
              const color  = COLORS[idx % COLORS.length];
              const glow   = GLOWS[idx % GLOWS.length];
              return (
                <div key={metode} style={{ ...glass }}>
                  <div style={shineTop} />
                  <button
                    onClick={() => togglePembayaran(metode)}
                    style={{
                      width: "100%", background: "none", border: "none",
                      padding: "15px 20px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      cursor: "pointer", color: "var(--text)",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${glow}`, flexShrink: 0 }} />
                      <span style={{ fontFamily: "Funnel Display, sans-serif", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{metode}</span>
                      <span style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "rgba(200,200,255,0.45)", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {txs.length} transaksi
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <span style={{ color, fontFamily: "Funnel Display, sans-serif", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" }}>{fmt(total)}</span>
                      {isOpen
                        ? <ChevronDown size={15} color="rgba(200,200,255,0.35)" />
                        : <ChevronRight size={15} color="rgba(200,200,255,0.35)" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                              {["Tanggal", "Pelanggan", "Total Penjualan", "Diskon"].map((h) => (
                                <th key={h} style={{
                                  padding: "10px 16px", textAlign: "left",
                                  color: "rgba(200,200,255,0.35)", fontWeight: 500,
                                  fontSize: 10, textTransform: "uppercase" as const,
                                  letterSpacing: "0.07em", fontFamily: "Funnel Sans",
                                  whiteSpace: "nowrap",
                                }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {txs.map((t, i) => (
                              <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                <td style={{ padding: "10px 16px", color: "rgba(200,200,255,0.45)", whiteSpace: "nowrap", fontFamily: "Funnel Sans" }}>{t.date}</td>
                                <td style={{ padding: "10px 16px", color: "rgba(240,240,255,0.85)", fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.customer}</td>
                                <td style={{ padding: "10px 16px", color, fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(t.totalPenjualan)}</td>
                                <td style={{ padding: "10px 16px", color: "#f472b6", whiteSpace: "nowrap" }}>
                                  {t.diskon > 0 ? fmt(t.diskon) : <span style={{ color: "rgba(200,200,255,0.25)" }}>—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                              <td colSpan={2} style={{ padding: "10px 16px", color: "rgba(200,200,255,0.35)", fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase" as const }}>
                                Subtotal
                              </td>
                              <td style={{ padding: "10px 16px", color, fontWeight: 600, fontFamily: "Funnel Display, sans-serif", whiteSpace: "nowrap" }}>
                                {fmt(txs.reduce((s, t) => s + t.totalPenjualan, 0))}
                              </td>
                              <td style={{ padding: "10px 16px", color: "#f472b6", fontWeight: 600, fontFamily: "Funnel Display, sans-serif", whiteSpace: "nowrap" }}>
                                {fmt(txs.reduce((s, t) => s + t.diskon, 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", color: "rgba(200,200,255,0.25)", fontSize: 11, paddingBottom: 32, letterSpacing: "0.04em" }}>
          Data dari Google Sheets · Sheet: TRANSAKSI · Auto-refresh setiap 5 menit
        </div>
      </main>
    </div>
  );
}
