"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
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

const COLORS = ["#e8ff47", "#ff6b35", "#47ffb2", "#a78bfa", "#fb7185", "#38bdf8"];

export default function Dashboard({ transaksi, monthlyData, pembayaranData, error }: Props) {
  const [openPembayaran, setOpenPembayaran] = useState<Record<string, boolean>>({});
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const metodePembayaran = Object.keys(pembayaranData);

  const filtered = useMemo(() => {
    if (selectedMonth === "all") return transaksi;
    return transaksi.filter((t) => {
      const [y, m] = t.date.split("-");
      return `${y}-${m}` === selectedMonth;
    });
  }, [transaksi, selectedMonth]);

  const totalPenjualan = filtered.reduce((s, t) => s + t.totalPenjualan, 0);
  const totalDiskon = filtered.reduce((s, t) => s + t.diskon, 0);
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

  const monthKeys = Array.from(
    new Set(transaksi.map((t) => t.date.slice(0, 7)))
  ).sort();

  const togglePembayaran = (key: string) =>
    setOpenPembayaran((prev) => ({ ...prev, [key]: !prev[key] }));

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>{label}</p>
          <p style={{ color: "var(--accent)", fontFamily: "Syne", fontWeight: 700, fontSize: 14 }}>
            {fmt(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "0" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "rgba(10,10,15,0.9)",
        backdropFilter: "blur(12px)",
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, background: "var(--accent)", borderRadius: "50%" }} />
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Dashboard Penjualan
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontFamily: "DM Mono, monospace",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">Semua Bulan</option>
            {monthKeys.map((mk) => {
              const [y, m] = mk.split("-");
              const label = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString("id-ID", { month: "long", year: "numeric" });
              return <option key={mk} value={mk}>{label}</option>;
            })}
          </select>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "var(--muted)"
          }}>
            <RefreshCw size={11} />
            <span>Auto-refresh 5 menit</span>
          </div>
        </div>
      </header>

      <main style={{ padding: "32px", maxWidth: 1280, margin: "0 auto" }}>
        {/* Error banner */}
        {error && (
          <div style={{
            background: "#1a0808", border: "1px solid var(--red)", borderRadius: 12,
            padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10
          }}>
            <AlertCircle size={16} color="var(--red)" />
            <div>
              <p style={{ margin: 0, color: "var(--red)", fontSize: 13, fontWeight: 600 }}>Gagal memuat data</p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{error} — Pastikan Google Sheets sudah dipublikasikan ke web.</p>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="fade-up fade-up-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { icon: <TrendingUp size={18} />, label: "Total Penjualan", value: fmt(totalPenjualan), color: "var(--accent)" },
            { icon: <Tag size={18} />, label: "Total Diskon", value: fmt(totalDiskon), color: "var(--accent2)" },
            { icon: <CreditCard size={18} />, label: "Jumlah Transaksi", value: totalTransaksi.toLocaleString("id-ID"), color: "var(--green)" },
            { icon: <Users size={18} />, label: "Pelanggan Unik", value: uniqueCustomers.toLocaleString("id-ID"), color: "#a78bfa" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "20px 22px",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 90, height: 90, background: s.color, opacity: 0.06, borderRadius: "50%" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: s.color }}>
                {s.icon}
                <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "Syne", color: s.color, letterSpacing: "-0.02em" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="fade-up fade-up-3" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 28 }}>
          {/* Monthly Area Chart */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 24px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.01em" }}>
              Total Penjualan per Bulan
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e8ff47" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e8ff47" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b6b80", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#6b6b80", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="totalPenjualan" stroke="#e8ff47" strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{ r: 4, fill: "#e8ff47" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart per metode */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 24px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.01em" }}>
              Penjualan per Metode
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={Object.entries(filteredPembayaran).map(([k, v], i) => ({
                  name: k,
                  total: v.reduce((s, t) => s + t.totalPenjualan, 0),
                  color: COLORS[i % COLORS.length],
                }))}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6b6b80", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#6b6b80", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#e8ff47" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pembayaran Accordion */}
        <div className="fade-up fade-up-4" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px", letterSpacing: "-0.01em" }}>
            Detail per Metode Pembayaran
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(filteredPembayaran).map(([metode, txs], idx) => {
              const isOpen = openPembayaran[metode];
              const total = txs.reduce((s, t) => s + t.totalPenjualan, 0);
              const color = COLORS[idx % COLORS.length];
              return (
                <div key={metode} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                  <button
                    onClick={() => togglePembayaran(metode)}
                    style={{
                      width: "100%", background: "none", border: "none", padding: "16px 20px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      cursor: "pointer", color: "var(--text)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                      <span style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14 }}>{metode}</span>
                      <span style={{
                        background: "var(--surface2)", border: "1px solid var(--border)",
                        borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "var(--muted)"
                      }}>
                        {txs.length} transaksi
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ color, fontFamily: "Syne", fontWeight: 700, fontSize: 15 }}>{fmt(total)}</span>
                      {isOpen ? <ChevronDown size={16} color="var(--muted)" /> : <ChevronRight size={16} color="var(--muted)" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: "var(--surface2)" }}>
                              {["Tanggal", "Pelanggan", "Total Penjualan", "Diskon"].map((h) => (
                                <th key={h} style={{
                                  padding: "10px 16px", textAlign: "left",
                                  color: "var(--muted)", fontWeight: 500,
                                  fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em",
                                  fontFamily: "DM Mono", whiteSpace: "nowrap"
                                }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {txs.map((t, i) => (
                              <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                                <td style={{ padding: "10px 16px", color: "var(--muted)", whiteSpace: "nowrap" }}>{t.date}</td>
                                <td style={{ padding: "10px 16px", color: "var(--text)", fontWeight: 500 }}>{t.customer}</td>
                                <td style={{ padding: "10px 16px", color, fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(t.totalPenjualan)}</td>
                                <td style={{ padding: "10px 16px", color: "var(--accent2)", whiteSpace: "nowrap" }}>
                                  {t.diskon > 0 ? fmt(t.diskon) : <span style={{ color: "var(--muted)" }}>—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: "1px solid var(--border)", background: "var(--surface2)" }}>
                              <td colSpan={2} style={{ padding: "10px 16px", color: "var(--muted)", fontSize: 11 }}>
                                SUBTOTAL
                              </td>
                              <td style={{ padding: "10px 16px", color, fontWeight: 700, fontFamily: "Syne" }}>
                                {fmt(txs.reduce((s, t) => s + t.totalPenjualan, 0))}
                              </td>
                              <td style={{ padding: "10px 16px", color: "var(--accent2)", fontWeight: 700, fontFamily: "Syne" }}>
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
        <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 11, paddingBottom: 32 }}>
          Data diambil dari Google Sheets · Sheet: TRANSAKSI · Auto-refresh setiap 5 menit
        </div>
      </main>
    </div>
  );
}
