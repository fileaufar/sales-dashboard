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
  const jsonText = text.replace(/^[^(]+\(/, "").replace(/\);?\s*$/, "");
  const json = JSON.parse(jsonText);

  const rows = json.table.rows as Array<{ c: Array<{ v: unknown } | null> }>;
  const cols = json.table.cols as Array<{ label: string }>;

  const findCol = (keywords: string[]): number =>
    cols.findIndex((c) =>
      keywords.some((kw) => c.label?.toLowerCase().trim().includes(kw.toLowerCase()))
    );

  const dateIdx       = findCol(["date", "tanggal", "tgl"]);
  const customerIdx   = findCol(["customer", "pelanggan", "nama"]);
  const totalIdx      = findCol(["jumlah uang", "total", "amount", "harga", "pendapatan", "revenue"]);
  const diskonIdx     = findCol(["diskon", "discount"]);
  const pembayaranIdx = findCol(["pembayaran", "payment", "metode"]);

  return rows
    .filter((row) => row.c && row.c[dateIdx]?.v)
    .map((row) => {
      const cell = (i: number) => (i >= 0 ? row.c[i] : null);

      // Parse date — handles both Google Sheets Date() and DD/MM/YYYY string
      let dateStr = "";
      const rawDate = cell(dateIdx)?.v;
      if (typeof rawDate === "string" && rawDate.startsWith("Date(")) {
        const parts = rawDate.replace("Date(", "").replace(")", "").split(",");
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) + 1;
        const d = parseInt(parts[2]);
        dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      } else if (typeof rawDate === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate.trim())) {
        // DD/MM/YYYY
        const [dd, mm, yyyy] = rawDate.trim().split("/");
        dateStr = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
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
  monthKey: string;
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

    const existing = map.get(key) ?? { month: label, monthKey: key, totalPenjualan: 0, totalDiskon: 0, transaksi: 0 };
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

export interface DailyData {
  day: string;
  dateKey: string;
  totalPenjualan: number;
  totalDiskon: number;
  transaksi: number;
}

export function groupByDay(data: Transaction[], monthKey: string): DailyData[] {
  const map = new Map<string, DailyData>();

  data
    .filter((t) => t.date.startsWith(monthKey))
    .forEach((t) => {
      const existing = map.get(t.date) ?? {
        day: new Date(t.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        dateKey: t.date,
        totalPenjualan: 0,
        totalDiskon: 0,
        transaksi: 0,
      };
      existing.totalPenjualan += t.totalPenjualan;
      existing.totalDiskon += t.diskon;
      existing.transaksi += 1;
      map.set(t.date, existing);
    });

  return Array.from(map.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

/* ═══════════════════════════════════════
   BARANG KELUAR
   Kolom: month, date, ID, SKU, nama barang, harga, jumlah, ID_TRANSAKSI
═══════════════════════════════════════ */

export interface BarangKeluar {
  date:        string;
  month:       string;   // "YYYY-MM"
  id:          string;
  sku:         string;
  namaBarang:  string;
  harga:       number;
  jumlah:      number;
  idTransaksi: string;
}

const SHEET_BARANG = "BARANG KELUAR";

export async function fetchBarangKeluar(): Promise<BarangKeluar[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_BARANG)}`;
  const res  = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error("Gagal mengambil data BARANG KELUAR");

  const text     = await res.text();
  const jsonText = text.replace(/^[^(]+\(/, "").replace(/\);?\s*$/, "");
  const json     = JSON.parse(jsonText);

  const rows = json.table.rows as Array<{ c: Array<{ v: unknown } | null> }>;
  const cols = json.table.cols as Array<{ label: string }>;

  const findCol = (kws: string[]) =>
    cols.findIndex((c) => kws.some((kw) => c.label?.toLowerCase().trim().includes(kw.toLowerCase())));

  const monthIdx  = findCol(["month"]);
  const dateIdx   = findCol(["date", "tanggal", "tgl"]);
  const idIdx     = findCol(["id"]);
  const skuIdx    = findCol(["sku"]);
  const namaIdx   = findCol(["nama barang", "nama", "item", "barang", "produk"]);
  const hargaIdx  = findCol(["harga", "price"]);
  const jumlahIdx = findCol(["jumlah", "qty", "quantity"]);
  const idTrxIdx  = findCol(["id_transaksi", "transaksi"]);

  const parseDate = (raw: unknown): string => {
    if (!raw) return "";
    const s = String(raw);
    if (s.startsWith("Date(")) {
      const p = s.replace("Date(", "").replace(")", "").split(",");
      const y = parseInt(p[0]), m = parseInt(p[1]) + 1, d = parseInt(p[2]);
      return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s.trim())) {
      const [dd, mm, yyyy] = s.trim().split("/");
      return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
    }
    return s;
  };

  return rows
    .filter((row) => row.c && (row.c[namaIdx]?.v || row.c[skuIdx]?.v))
    .map((row) => {
      const cell = (i: number) => (i >= 0 ? row.c[i] : null);
      const dateStr = parseDate(cell(dateIdx)?.v);
      const mk = dateStr.slice(0, 7); // "YYYY-MM"
      return {
        date:        dateStr,
        month:       mk,
        id:          String(cell(idIdx)?.v ?? ""),
        sku:         String(cell(skuIdx)?.v ?? ""),
        namaBarang:  String(cell(namaIdx)?.v ?? ""),
        harga:       Number(cell(hargaIdx)?.v ?? 0),
        jumlah:      Number(cell(jumlahIdx)?.v ?? 0),
        idTransaksi: String(cell(idTrxIdx)?.v ?? ""),
      };
    });
}

/* Top N item berdasarkan total jumlah terjual */
export interface TopItem {
  namaBarang: string;
  sku:        string;
  totalJumlah: number;
  totalHarga:  number;
  perBulan:    { monthKey: string; month: string; jumlah: number; harga: number }[];
}

export function getTopItems(data: BarangKeluar[], n = 10): TopItem[] {
  const map = new Map<string, TopItem>();

  data.forEach((b) => {
    const key = b.namaBarang || b.sku || b.id;
    if (!key) return;
    const ex = map.get(key) ?? { namaBarang: b.namaBarang, sku: b.sku, totalJumlah: 0, totalHarga: 0, perBulan: [] };
    ex.totalJumlah += b.jumlah;
    ex.totalHarga  += b.harga * b.jumlah;

    const bulan = ex.perBulan.find((p) => p.monthKey === b.month);
    if (bulan) {
      bulan.jumlah += b.jumlah;
      bulan.harga  += b.harga * b.jumlah;
    } else if (b.month) {
      const [y, m] = b.month.split("-");
      const label  = new Date(parseInt(y), parseInt(m) - 1, 1)
        .toLocaleString("id-ID", { month: "short", year: "numeric" });
      ex.perBulan.push({ monthKey: b.month, month: label, jumlah: b.jumlah, harga: b.harga * b.jumlah });
    }
    map.set(key, ex);
  });

  return Array.from(map.values())
    .sort((a, b) => b.totalJumlah - a.totalJumlah)
    .slice(0, n)
    .map((item) => ({
      ...item,
      perBulan: item.perBulan.sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    }));
}
