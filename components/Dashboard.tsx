"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Cell,
  AreaChart, Area,
} from "recharts";
import {
  TrendingUp, CreditCard, Tag,
  ChevronDown, ChevronRight, AlertCircle, RefreshCw, ArrowLeft,
} from "lucide-react";
import type { Transaction, MonthlyData } from "@/lib/sheets";
import { groupByDay } from "@/lib/sheets";

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
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
};

/* Palet dari logo */
const COLORS = ["#3ab8c8", "#d4a017", "#f0c040", "#b8bcc4", "#e05a3a", "#8ac8b8"];
const GLOWS  = [
  "rgba(58,184,200,0.20)",
  "rgba(212,160,23,0.18)",
  "rgba(240,192,64,0.18)",
  "rgba(184,188,196,0.15)",
  "rgba(224,90,58,0.18)",
  "rgba(138,200,184,0.15)",
];

const glass: React.CSSProperties = {
  background: "rgba(255,248,235,0.05)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid rgba(255,248,235,0.10)",
  borderRadius: 20,
  position: "relative",
  overflow: "hidden",
};

const shine: React.CSSProperties = {
  position: "absolute",
  top: 0, left: 0, right: 0, height: 1,
  background: "linear-gradient(90deg, transparent, rgba(255,248,235,0.18) 40%, rgba(255,248,235,0.18) 60%, transparent)",
  pointerEvents: "none",
  zIndex: 2,
};

/* ── Tooltip kustom ── */
function ChartTooltip({
  active, payload, label, isDrill,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  isDrill?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...glass, padding: "10px 14px", minWidth: 155, pointerEvents: "none" }}>
      <div style={shine} />
      <p style={{ color: "rgba(245,238,216,0.45)", fontSize: 11, margin: "0 0 4px" }}>{label}</p>
      <p style={{ color: "#3ab8c8", fontFamily: "Funnel Display, sans-serif", fontWeight: 600, fontSize: 15, margin: 0 }}>
        {fmt(payload[0].value)}
      </p>
      {!isDrill && (
        <p style={{ color: "rgba(245,238,216,0.30)", fontSize: 10, margin: "4px 0 0" }}>
          Klik untuk lihat per hari →
        </p>
      )}
    </div>
  );
}

export default function Dashboard({ transaksi, monthlyData, pembayaranData, error }: Props) {
  const [openPembayaran, setOpenPembayaran] = useState<Record<string, boolean>>({});
  const [selectedMonth, setSelectedMonth]   = useState<string>("all");
  const [drillMonth, setDrillMonth]         = useState<string | null>(null);

  /* ── Filter utama ── */
  const filtered = useMemo(() => {
    if (selectedMonth === "all") return transaksi;
    return transaksi.filter((t) => t.date.slice(0, 7) === selectedMonth);
  }, [transaksi, selectedMonth]);

  const totalPenjualan = filtered.reduce((s, t) => s + t.totalPenjualan, 0);
  const totalDiskon    = filtered.reduce((s, t) => s + t.diskon, 0);
  const totalTransaksi = filtered.length;

  /* ── Accordion: filter ke drillMonth kalau ada ── */
  const filteredPembayaran = useMemo(() => {
    const base = drillMonth
      ? transaksi.filter((t) => t.date.slice(0, 7) === drillMonth)
      : filtered;
    const map: Record<string, Transaction[]> = {};
    base.forEach((t) => {
      const k = t.pembayaran || "Lainnya";
      if (!map[k]) map[k] = [];
      map[k].push(t);
    });
    return map;
  }, [transaksi, filtered, drillMonth]);

  /* ── Drill-down harian ── */
  const dailyData = useMemo(
    () => (drillMonth ? groupByDay(transaksi, drillMonth) : []),
    [transaksi, drillMonth],
  );

  const drillLabel = useMemo(() => {
    if (!drillMonth) return "";
    const [y, m] = drillMonth.split("-");
    return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString("id-ID", {
      month: "long", year: "numeric",
    });
  }, [drillMonth]);

  const monthKeys = Array.from(new Set(transaksi.map((t) => t.date.slice(0, 7)))).sort();

  const togglePembayaran = (key: string) =>
    setOpenPembayaran((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ── Handler klik bar bulanan ── */
  const handleMonthClick = (mk: string) => {
    setDrillMonth(mk);
    setOpenPembayaran({});
    setTimeout(() => {
      document.getElementById("detail-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleBack = () => { setDrillMonth(null); setOpenPembayaran({}); };

  /* ── Stats ── */
  const stats = [
    { icon: <TrendingUp size={16} />, label: "Total Penjualan",  value: fmt(totalPenjualan), color: "#3ab8c8", glow: "rgba(58,184,200,0.20)" },
    { icon: <Tag size={16} />,        label: "Total Diskon",     value: fmt(totalDiskon),    color: "#d4a017", glow: "rgba(212,160,23,0.18)" },
    { icon: <CreditCard size={16} />, label: "Jumlah Transaksi", value: totalTransaksi.toLocaleString("id-ID"), color: "#f0c040", glow: "rgba(240,192,64,0.18)" },
  ];

  /* ── Styles daur ulang ── */
  const selectStyle: React.CSSProperties = {
    ...glass, borderRadius: 12, padding: "7px 14px",
    fontSize: 12, fontFamily: "Funnel Sans, sans-serif", fontWeight: 500,
    color: "rgba(245,238,216,0.85)", outline: "none", cursor: "pointer",
    appearance: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -100, left: -80,  width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(58,184,200,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -80, right: -60, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,160,23,0.10) 0%, transparent 70%)" }} />
      </div>

      {/* ── Header ── */}
      <header style={{
        ...glass, borderRadius: 0,
        borderTop: "none", borderLeft: "none", borderRight: "none",
        padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(32px) saturate(200%)",
        WebkitBackdropFilter: "blur(32px) saturate(200%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/favicon.png" alt="Logo" width={36} height={36} style={{ borderRadius: 8, objectFit: "cover" }} />
          <h1 style={{ fontSize: 15, fontWeight: 600, margin: 0, letterSpacing: "-0.01em", fontFamily: "Funnel Display, sans-serif", color: "var(--cream)" }}>
            Dashboard Penjualan Ananda Collection
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <select
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(e.target.value); setDrillMonth(null); }}
            style={selectStyle}
          >
            <option value="all" style={{ background: "#111" }}>Semua Bulan</option>
            {monthKeys.map((mk) => {
              const [y, m] = mk.split("-");
              const label = new Date(parseInt(y), parseInt(m) - 1, 1)
                .toLocaleString("id-ID", { month: "long", year: "numeric" });
              return <option key={mk} value={mk} style={{ background: "#111" }}>{label}</option>;
            })}
          </select>
          <div style={{ ...glass, borderRadius: 12, display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", fontSize: 11, color: "rgba(245,238,216,0.85)" }}>
            <RefreshCw size={11} />
            <span style={{ whiteSpace: "nowrap" }}>Auto-refresh 5 menit</span>
          </div>
        </div>
      </header>

      <main style={{ padding: "28px 32px", maxWidth: 1300, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Error */}
        {error && (
          <div style={{ ...glass, borderColor: "rgba(224,90,58,0.35)", padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={shine} />
            <AlertCircle size={16} color="#e05a3a" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, color: "#e05a3a", fontSize: 13, fontWeight: 600, fontFamily: "Funnel Display, sans-serif" }}>Gagal memuat data</p>
              <p style={{ margin: "4px 0 0", color: "rgba(245,238,216,0.45)", fontSize: 12, lineHeight: 1.5 }}>
                {error} — Pastikan Google Sheets sudah dipublikasikan ke web.
              </p>
            </div>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="fade-up fade-up-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ ...glass, padding: "20px 22px" }}>
              <div style={shine} />
              <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${s.glow} 0%, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ color: s.color, opacity: 0.85 }}>{s.icon}</div>
                <span style={{ fontSize: 11, color: "rgba(245,238,216,0.40)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 500 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "Funnel Display, sans-serif", color: s.color, letterSpacing: "-0.02em", lineHeight: 1.2, wordBreak: "break-word" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts ── */}
        <div className="fade-up fade-up-3" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 24 }}>

          {/* Bar chart bulanan — KLIKABLE */}
          <div style={{ ...glass, padding: "22px 24px" }}>
            <div style={shine} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, margin: 0, fontFamily: "Funnel Display, sans-serif", color: "var(--cream)" }}>
                Total Penjualan per Bulan
              </h2>
              <span style={{ fontSize: 11, color: "rgba(245,238,216,0.30)" }}>Klik bar → lihat per hari</span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(245,238,216,0.30)", margin: "0 0 14px" }}>
              {drillMonth ? `Dipilih: ${drillLabel}` : "Semua bulan"}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,248,235,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(245,238,216,0.38)", fontFamily: "Funnel Sans" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "rgba(245,238,216,0.38)", fontFamily: "Funnel Sans" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,248,235,0.04)" }} />
                <Bar dataKey="totalPenjualan" radius={[6, 6, 0, 0]} cursor="pointer">
                  {monthlyData.map((entry) => (
                    <Cell
                      key={entry.monthKey}
                      fill={drillMonth === entry.monthKey ? "#d4a017" : "#3ab8c8"}
                      opacity={drillMonth && drillMonth !== entry.monthKey ? 0.3 : 1}
                      onClick={() => handleMonthClick(entry.monthKey)}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart per metode */}
          <div style={{ ...glass, padding: "22px 24px" }}>
            <div style={shine} />
            <h2 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 20px", fontFamily: "Funnel Display, sans-serif", color: "var(--cream)" }}>
              Penjualan per Metode
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={Object.entries(filteredPembayaran).map(([k, v], i) => ({
                  name: k.length > 9 ? k.slice(0, 9) + "…" : k,
                  total: v.reduce((s, t) => s + t.totalPenjualan, 0),
                  colorIdx: i,
                }))}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,248,235,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "rgba(245,238,216,0.38)", fontFamily: "Funnel Sans" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "rgba(245,238,216,0.38)", fontFamily: "Funnel Sans" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTooltip isDrill />} cursor={{ fill: "rgba(255,248,235,0.04)" }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {Object.keys(filteredPembayaran).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Drill-down harian ── */}
        {drillMonth && (
          <div className="fade-up fade-up-1" style={{ marginBottom: 24 }}>
            <div style={{ ...glass, padding: "22px 24px" }}>
              <div style={shine} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <button
                  onClick={handleBack}
                  style={{ ...glass, borderRadius: 10, padding: "6px 13px", cursor: "pointer", color: "rgba(245,238,216,0.70)", display: "flex", alignItems: "center", gap: 6, fontSize: 12, border: "1px solid rgba(255,248,235,0.12)", background: "rgba(255,248,235,0.07)" }}
                >
                  <ArrowLeft size={13} /> Kembali
                </button>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, fontFamily: "Funnel Display, sans-serif", color: "#d4a017" }}>
                    {drillLabel}
                  </h2>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(245,238,216,0.30)" }}>Penjualan per hari</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#d4a017" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,248,235,0.06)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "rgba(245,238,216,0.38)", fontFamily: "Funnel Sans" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "rgba(245,238,216,0.38)", fontFamily: "Funnel Sans" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<ChartTooltip isDrill />} />
                  <Area type="monotone" dataKey="totalPenjualan" stroke="#d4a017" strokeWidth={2} fill="url(#dailyGrad)" dot={{ fill: "#d4a017", r: 3 }} activeDot={{ r: 5, fill: "#d4a017" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Accordion ── */}
        <div id="detail-section" className="fade-up fade-up-4" style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, margin: 0, fontFamily: "Funnel Display, sans-serif", color: "var(--cream)" }}>
              Detail per Metode Pembayaran
            </h2>
            {drillMonth && (
              <span style={{ background: "rgba(212,160,23,0.15)", border: "1px solid rgba(212,160,23,0.30)", borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "#d4a017" }}>
                {drillLabel}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(filteredPembayaran).map(([metode, txs], idx) => {
              const isOpen = openPembayaran[metode];
              const total  = txs.reduce((s, t) => s + t.totalPenjualan, 0);
              const color  = COLORS[idx % COLORS.length];
              const glow   = GLOWS[idx % GLOWS.length];
              return (
                <div key={metode} style={{ ...glass }}>
                  <div style={shine} />
                  <button
                    onClick={() => togglePembayaran(metode)}
                    style={{ width: "100%", background: "none", border: "none", padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", color: "var(--text)", gap: 12 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${glow}`, flexShrink: 0 }} />
                      <span style={{ fontFamily: "Funnel Display, sans-serif", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{metode}</span>
                      <span style={{ background: "rgba(255,248,235,0.07)", border: "1px solid rgba(255,248,235,0.10)", borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "rgba(245,238,216,0.45)", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {txs.length} transaksi
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <span style={{ color, fontFamily: "Funnel Display, sans-serif", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" }}>{fmt(total)}</span>
                      {isOpen
                        ? <ChevronDown size={15} color="rgba(245,238,216,0.30)" />
                        : <ChevronRight size={15} color="rgba(245,238,216,0.30)" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: "1px solid rgba(255,248,235,0.08)" }}>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: "rgba(255,248,235,0.03)" }}>
                              {["Tanggal", "Pelanggan", "Total Penjualan", "Diskon"].map((h) => (
                                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "rgba(245,238,216,0.30)", fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "Funnel Sans", whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {txs.map((t, i) => (
                              <tr key={i} style={{ borderTop: "1px solid rgba(255,248,235,0.05)" }}>
                                <td style={{ padding: "10px 16px", color: "rgba(245,238,216,0.45)", whiteSpace: "nowrap" }}>{t.date}</td>
                                <td style={{ padding: "10px 16px", color: "rgba(245,238,216,0.85)", fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.customer}</td>
                                <td style={{ padding: "10px 16px", color, fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(t.totalPenjualan)}</td>
                                <td style={{ padding: "10px 16px", color: "#d4a017", whiteSpace: "nowrap" }}>
                                  {t.diskon > 0 ? fmt(t.diskon) : <span style={{ color: "rgba(245,238,216,0.20)" }}>—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: "1px solid rgba(255,248,235,0.08)", background: "rgba(255,248,235,0.03)" }}>
                              <td colSpan={2} style={{ padding: "10px 16px", color: "rgba(245,238,216,0.30)", fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase" }}>Subtotal</td>
                              <td style={{ padding: "10px 16px", color, fontWeight: 600, fontFamily: "Funnel Display, sans-serif", whiteSpace: "nowrap" }}>{fmt(txs.reduce((s, t) => s + t.totalPenjualan, 0))}</td>
                              <td style={{ padding: "10px 16px", color: "#d4a017", fontWeight: 600, fontFamily: "Funnel Display, sans-serif", whiteSpace: "nowrap" }}>{fmt(txs.reduce((s, t) => s + t.diskon, 0))}</td>
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

        <div style={{ textAlign: "center", color: "rgba(245,238,216,0.20)", fontSize: 11, paddingBottom: 32, letterSpacing: "0.04em" }}>
          Data dari Google Sheets · Sheet: TRANSAKSI · Auto-refresh setiap 5 menit
        </div>
      </main>
    </div>
  );
}
