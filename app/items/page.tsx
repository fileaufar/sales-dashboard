import { fetchBarangKeluar, getTopItems } from "@/lib/sheets";
import ItemsDashboard from "@/components/ItemsDashboard";

export const revalidate = 300;

export default async function ItemsPage() {
  let barang: Awaited<ReturnType<typeof fetchBarangKeluar>> = [];
  let error = "";

  try {
    barang = await fetchBarangKeluar();
  } catch (e) {
    error = e instanceof Error ? e.message : "Gagal memuat data";
  }

  const top10  = getTopItems(barang, 10);
  const top20  = getTopItems(barang, 20);

  return <ItemsDashboard top10={top10} top20={top20} error={error} />;
}
