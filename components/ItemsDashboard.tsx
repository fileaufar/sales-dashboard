"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
  AreaChart, Area,
} from "recharts";
import { AlertCircle, ChevronDown, ChevronRight, ArrowLeft, Package } from "lucide-react";
import type { TopItem } from "@/lib/sheets";

interface Props {
  top10:  TopItem[];
  top20:  TopItem[];
  error:  string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
};

const COLORS = ["#d4a017","#3ab8c8","#f0c040","#b8bcc4","#e05a3a","#8ac8b8","#a78bfa","#f472b6","#34d399","#fb923c",
                "#60a5fa","#fbbf24","#a3e635","#e879f9","#38bdf8","#4ade80","#f87171","#c084fc","#67e8f9","#fdba74"];

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
  position: "absolute", top: 0, left: 0, right: 0, height: 1,
  background: "linear-gradient(90deg, transparent, rgba(255,248,235,0.18) 40%, rgba(255,248,235,0.18) 60%, transparent)",
  pointerEvents: "none", zIndex: 2,
};

function ChartTooltip({ active, payload, label, isQty }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string; isQty?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...glass, padding: "10px 14px", minWidth: 140, pointerEvents: "none" }}>
      <div style={shine} />
      <p style={{ color: "rgba(245,238,216,0.45)", fontSize: 11, margin: "0 0 4px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
      <p style={{ color: "#d4a017", fontFamily: "Funnel Display, sans-serif", fontWeight: 600, fontSize: 15, margin: 0 }}>
        {isQty ? `${payload[0].value} pcs` : fmt(payload[0].value)}
      </p>
    </div>
  );
}

export default function ItemsDashboard({ top10, top20, error }: Props) {
  const [showTop, setShowTop]       = useState<10 | 20>(10);
  const [selectedItem, setSelectedItem] = useState<TopItem | null>(null);
  const [openRows, setOpenRows]     = useState<Record<string, boolean>>({});

  const items = showTop === 10 ? top10 : top20;

  const toggleRow = (key: string) =>
    setOpenRows((p) => ({ ...p, [key]: !p[key] }));

  const handleSelectItem = (item: TopItem) => {
    setSelectedItem(item);
    setTimeout(() => {
      document.getElementById("item-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleBack = () => setSelectedItem(null);

  /* Rank badge colors */
  const rankColor = (i: number) => {
    if (i === 0) return "#d4a017";
    if (i === 1) return "#b8bcc4";
    if (i === 2) return "#e05a3a";
    return "rgba(245,238,216,0.25)";
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -100, right: -80, width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -80, left: -60, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(58,184,200,0.10) 0%, transparent 70%)" }} />
      </div>

      <main style={{ padding: "24px 32px 40px", maxWidth: 1300, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Error */}
        {error && (
          <div style={{ ...glass, borderColor: "rgba(224,90,58,0.35)", padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={shine} />
            <AlertCircle size={16} color="#e05a3a" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, color: "#e05a3a", fontSize: 13, fontWeight: 600, fontFamily: "Funnel Display, sans-serif" }}>Gagal memuat data</p>
              <p style={{ margin: "4px 0 0", color: "rgba(245,238,216,0.45)", fontSize: 12 }}>{error}</p>
            </div>
          </div>
        )}

        {/* ── Stat ringkasan ── */}
        <div className="fade-up fade-up-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Item Berbeda", value: top20.length, color: "#3ab8c8", suffix: " item" },
            { label: "Item Terlaris",      value: top10[0]?.namaBarang ?? "—", color: "#d4a017", isTeks: true },
            { label: "Terjual Terbanyak",  value: top10[0]?.totalJumlah ?? 0, color: "#f0c040", suffix: " pcs" },
          ].map((s, i) => (
            <div key={i} style={{ ...glass, padding: "20px 22px" }}>
              <div style={shine} />
              <p style={{ fontSize: 11, color: "rgba(245,238,216,0.40)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 500, margin: "0 0 12px" }}>{s.label}</p>
              <p style={{
                fontSize: s.isTeks ? 15 : 22, fontWeight: 600, fontFamily: "Funnel Display, sans-serif",
                color: s.color, margin: 0, lineHeight: 1.2,
                wordBreak: "break-word", overflow: "hidden",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              }}>
                {s.isTeks ? String(s.value) : `${Number(s.value).toLocaleString("id-ID")}${s.suffix}`}
              </p>
            </div>
          ))}
        </div>

        {/* ── Toggle + Bar Chart ── */}
        <div className="fade-up fade-up-2" style={{ ...glass, padding: "22px 24px", marginBottom: 24 }}>
          <div style={shine} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, fontFamily: "Funnel Display, sans-serif", color: "#f5eed8" }}>
              Barang Terjual Terbanyak
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              {([10, 20] as const).map((n) => (
                <button key={n} onClick={() => setShowTop(n)} style={{
                  padding: "6px 18px", borderRadius: 10, fontSize: 12, cursor: "pointer",
                  fontFamily: "Funnel Sans, sans-serif", fontWeight: 600,
                  background: showTop === n ? "#d4a017" : "rgba(255,248,235,0.06)",
                  border: `1px solid ${showTop === n ? "#d4a017" : "rgba(255,248,235,0.12)"}`,
                  color: showTop === n ? "#1a1400" : "rgba(245,238,216,0.60)",
                  transition: "all 0.15s",
                }}>
                  Top {n}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={items.map((item, i) => ({
                name: item.namaBarang.length > 12 ? item.namaBarang.slice(0, 12) + "…" : item.namaBarang,
                fullName: item.namaBarang,
                jumlah: item.totalJumlah,
                idx: i,
              }))}
              margin={{ top: 4, right: 4, left: 0, bottom: 40 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(d: any) => {
                const idx = d?.activePayload?.[0]?.payload?.idx;
                if (typeof idx === "number") handleSelectItem(items[idx]);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,248,235,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "rgba(245,238,216,0.38)", fontFamily: "Funnel Sans" }}
                axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(245,238,216,0.38)", fontFamily: "Funnel Sans" }}
                axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<ChartTooltip isQty />} cursor={{ fill: "rgba(255,248,235,0.04)" }} />
              <Bar dataKey="jumlah" radius={[6, 6, 0, 0]} cursor="pointer">
                {items.map((item, i) => (
                  <Cell
                    key={i}
                    fill={selectedItem?.namaBarang === item.namaBarang ? "#d4a017" : COLORS[i % COLORS.length]}
                    opacity={selectedItem && selectedItem.namaBarang !== item.namaBarang ? 0.3 : 1}
                    onClick={() => handleSelectItem(item)}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(245,238,216,0.25)", margin: "8px 0 0" }}>
            Klik bar untuk melihat detail per bulan
          </p>
        </div>

        {/* ── Tabel Top Items ── */}
        <div className="fade-up fade-up-3" style={{ ...glass, marginBottom: 24 }}>
          <div style={shine} />
          <div style={{ padding: "18px 22px 10px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, fontFamily: "Funnel Display, sans-serif", color: "#f5eed8" }}>
              Tabel Top {showTop} Barang
            </h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "rgba(255,248,235,0.03)" }}>
                  {["#", "Nama Barang", "SKU", "Total Terjual", "Total Pendapatan", "Detail"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "rgba(245,238,216,0.30)", fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const key    = item.namaBarang;
                  const isOpen = openRows[key];
                  const isSelected = selectedItem?.namaBarang === item.namaBarang;
                  return (
                    <>
                      <tr
                        key={key}
                        style={{
                          borderTop: "1px solid rgba(255,248,235,0.06)",
                          background: isSelected ? "rgba(212,160,23,0.08)" : "transparent",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onClick={() => handleSelectItem(item)}
                      >
                        <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: rankColor(i), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: i < 3 ? "#0d0d0d" : "rgba(245,238,216,0.5)" }}>
                            {i + 1}
                          </div>
                        </td>
                        <td style={{ padding: "11px 16px", color: isSelected ? "#d4a017" : "rgba(245,238,216,0.85)", fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Package size={13} color={COLORS[i % COLORS.length]} />
                            {item.namaBarang}
                          </div>
                        </td>
                        <td style={{ padding: "11px 16px", color: "rgba(245,238,216,0.40)", whiteSpace: "nowrap" }}>{item.sku || "—"}</td>
                        <td style={{ padding: "11px 16px", color: COLORS[i % COLORS.length], fontWeight: 700, whiteSpace: "nowrap" }}>
                          {item.totalJumlah.toLocaleString("id-ID")} pcs
                        </td>
                        <td style={{ padding: "11px 16px", color: "#d4a017", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(item.totalHarga)}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleRow(key); }}
                            style={{ background: "rgba(255,248,235,0.07)", border: "1px solid rgba(255,248,235,0.12)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: "rgba(245,238,216,0.50)", display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}
                          >
                            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            Per bulan
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={key + "-detail"} style={{ borderTop: "1px solid rgba(255,248,235,0.04)" }}>
                          <td colSpan={6} style={{ padding: "0 16px 14px 52px" }}>
                            <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
                              <thead>
                                <tr>
                                  {["Bulan", "Terjual", "Pendapatan"].map((h) => (
                                    <th key={h} style={{ padding: "6px 12px", textAlign: "left", color: "rgba(245,238,216,0.25)", fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {item.perBulan.map((pb) => (
                                  <tr key={pb.monthKey} style={{ borderTop: "1px solid rgba(255,248,235,0.04)" }}>
                                    <td style={{ padding: "6px 12px", color: "rgba(245,238,216,0.50)" }}>{pb.month}</td>
                                    <td style={{ padding: "6px 12px", color: COLORS[i % COLORS.length], fontWeight: 600 }}>{pb.jumlah.toLocaleString("id-ID")} pcs</td>
                                    <td style={{ padding: "6px 12px", color: "#d4a017" }}>{fmt(pb.harga)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Drill-down item yang dipilih ── */}
        {selectedItem && (
          <div id="item-detail" className="fade-up fade-up-1" style={{ ...glass, padding: "22px 24px", marginBottom: 28 }}>
            <div style={shine} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button
                onClick={handleBack}
                style={{ ...glass, borderRadius: 10, padding: "6px 13px", cursor: "pointer", color: "rgba(245,238,216,0.70)", display: "flex", alignItems: "center", gap: 6, fontSize: 12, border: "1px solid rgba(255,248,235,0.12)", background: "rgba(255,248,235,0.07)" }}
              >
                <ArrowLeft size={13} /> Kembali
              </button>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, fontFamily: "Funnel Display, sans-serif", color: "#d4a017" }}>
                  {selectedItem.namaBarang}
                </h2>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(245,238,216,0.30)" }}>
                  Total terjual: {selectedItem.totalJumlah.toLocaleString("id-ID")} pcs · {fmt(selectedItem.totalHarga)}
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={selectedItem.perBulan} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="itemGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#d4a017" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,248,235,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(245,238,216,0.38)", fontFamily: "Funnel Sans" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(245,238,216,0.38)", fontFamily: "Funnel Sans" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip isQty />} />
                <Area type="monotone" dataKey="jumlah" stroke="#d4a017" strokeWidth={2} fill="url(#itemGrad)" dot={{ fill: "#d4a017", r: 3 }} activeDot={{ r: 5, fill: "#d4a017" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ textAlign: "center", color: "rgba(245,238,216,0.20)", fontSize: 11, paddingBottom: 8, letterSpacing: "0.04em" }}>
          Data dari Google Sheets · Sheet: BARANG KELUAR · Auto-refresh setiap 5 menit
        </div>
      </main>
    </div>
  );
}
