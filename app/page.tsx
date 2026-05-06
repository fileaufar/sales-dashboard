import { fetchTransaksi, groupByMonth, groupByPembayaran } from "@/lib/sheets";
import Dashboard from "@/components/Dashboard";

export const revalidate = 300;

export default async function Home() {
  let data: Awaited<ReturnType<typeof fetchTransaksi>> = [];
  let error = "";

  try {
    data = await fetchTransaksi();
  } catch (e) {
    error = e instanceof Error ? e.message : "Gagal memuat data";
  }

  const monthlyData = groupByMonth(data);
  const pembayaranData = groupByPembayaran(data);

  return (
    <Dashboard
      transaksi={data}
      monthlyData={monthlyData}
      pembayaranData={pembayaranData}
      error={error}
    />
  );
}
