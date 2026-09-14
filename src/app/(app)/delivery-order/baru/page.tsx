import { PageHeader } from "@/components/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { listActiveContractOptions } from "@/server/repos/contracts";
import { DeliveryOrderForm } from "./delivery-order-form";

export const metadata = { title: "Delivery Order Baru" };

export default async function NewDeliveryOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ contractId?: string }>;
}) {
  const [params, contracts] = await Promise.all([searchParams, listActiveContractOptions()]);

  return (
    <>
      <PageHeader
        title="Delivery Order Baru"
        description="Terbitkan instruksi pengiriman terhadap salah satu tahap pada kontrak payung."
        breadcrumbs={[{ label: "Delivery Order", href: "/delivery-order" }, { label: "Baru" }]}
      />
      <Card className="max-w-4xl">
        <CardHeader
          title="Data Delivery Order"
          description="Volume tidak boleh melebihi sisa kuota tahap pengiriman yang dipilih."
        />
        <DeliveryOrderForm contracts={contracts} defaultContractId={params.contractId} />
      </Card>
    </>
  );
}
