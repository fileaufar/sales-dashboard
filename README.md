# 📊 Dashboard Penjualan

Dashboard penjualan real-time yang terhubung ke Google Sheets, dibangun dengan Next.js 14 + Recharts.

## ✨ Fitur

- **Stat Cards** — Total Penjualan, Diskon, Transaksi, Pelanggan Unik
- **Chart per Bulan** — Area chart total penjualan bulanan
- **Chart per Metode** — Bar chart breakdown per metode pembayaran
- **Accordion Pembayaran** — Dropdown detail transaksi per metode pembayaran
- **Filter Bulan** — Saring data per bulan
- **Auto-refresh** — Data diperbarui otomatis setiap 5 menit

## 🚀 Setup

### 1. Publish Google Sheets ke Web (WAJIB)

1. Buka spreadsheet → **File** → **Share** → **Publish to web**
2. Pilih sheet **TRANSAKSI**
3. Pilih format **Web page**
4. Klik **Publish**

> ⚠️ Tanpa langkah ini, dashboard tidak bisa membaca data.

### 2. Jalankan Lokal

```bash
npm install
npm run dev
```

### 3. Deploy ke Vercel

Hubungkan repo ini di vercel.com → Add New Project → pilih repo ini → Deploy.

## 🔧 Konfigurasi

Edit `lib/sheets.ts`:
- `SHEET_ID` — ID dari URL spreadsheet kamu
- `SHEET_NAME` — Nama sheet yang dipakai

## 🛠 Tech Stack

Next.js 14 · TypeScript · Tailwind CSS · Recharts · Google Sheets (gviz API)
