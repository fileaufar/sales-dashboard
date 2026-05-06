export interface Transaction {
  date: string;
  customer: string;
  totalPenjualan: number;
  diskon: number;
  pembayaran: string;
}

const SHEET_ID = "1cjKQ4UH3DhBE9zoGfk-nZAuGrQCAEIivEPL_ijap2pY";
const SHEET_NAME = "TRANSAKSI";

export async function fetchTransaksi(): Promise<Transaction[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error("Gagal mengambil data dari Google Sheets");

  const text = await res.text();
  // Google returns JS-like response, strip the wrapper
  const jsonText = text.replace(/^[^(]+\(/, "").replace(/\);?\s*$/, "");
  const json = JSON.parse(jsonText);

  const rows = json.table.rows as Array<{ c: Array<{ v: unknown } | null> }>;
  const cols = json.table.cols as Array<{ label: string }>;

  // Find column indices by label (case-insensitive, trimmed)
  const findCol = (keywords: string[]): number =>
    cols.findIndex((c) =>
      keywords.some((kw) =>
        c.label?.toLowerCase().trim().includes(kw.toLowerCase())
      )
    );

  const dateIdx = findCol(["date", "tanggal", "tgl"]);
  const customerIdx = findCol(["customer", "pelanggan", "nama"]);
  const totalIdx = findCol(["jumlah uang", "total", "amount", "harga", "pendapatan", "revenue"]);
  const diskonIdx = findCol(["diskon", "discount"]);
  const pembayaranIdx = findCol(["pembayaran", "payment", "metode"]);

  return rows
    .filter((row) => row.c && row.c[dateIdx]?.v)
    .map((row) => {
      const cell = (i: number) => (i >= 0 ? row.c[i] : null);

      // Parse date - Google Sheets dates come as "Date(year,month,day)"
      let dateStr = "";
      const rawDate = cell(dateIdx)?.v;
      if (typeof rawDate === "string" && rawDate.startsWith("Date(")) {
        const parts = rawDate.replace("Date(", "").replace(")", "").split(",");
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) + 1;
        const d = parseInt(parts[2]);
        dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      } else if (rawDate) {
        dateStr = String(rawDate);
      }

      return {
        date: dateStr,
        customer: String(cell(customerIdx)?.v ?? ""),
        totalPenjualan: Number(cell(totalIdx)?.v ?? 0),
        diskon: Number(cell(diskonIdx)?.v ?? 0),
        pembayaran: String(cell(pembayaranIdx)?.v ?? "Lainnya"),
      };
    });
}

export interface MonthlyData {
  month: string;
  totalPenjualan: number;
  totalDiskon: number;
  transaksi: number;
}

export function groupByMonth(data: Transaction[]): MonthlyData[] {
  const map = new Map<string, MonthlyData>();

  data.forEach((t) => {
    if (!t.date) return;
    const [year, month] = t.date.split("-");
    const key = `${year}-${month}`;
    const label = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString("id-ID", {
      month: "short",
      year: "numeric",
    });

    const existing = map.get(key) ?? { month: label, totalPenjualan: 0, totalDiskon: 0, transaksi: 0 };
    existing.totalPenjualan += t.totalPenjualan;
    existing.totalDiskon += t.diskon;
    existing.transaksi += 1;
    map.set(key, existing);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

export function groupByPembayaran(data: Transaction[]): Record<string, Transaction[]> {
  return data.reduce((acc, t) => {
    const key = t.pembayaran || "Lainnya";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);
}
