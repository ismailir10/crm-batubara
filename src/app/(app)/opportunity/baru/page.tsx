import { PageHeader } from "@/components/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { listProspectOptions } from "@/server/repos/prospects";
import { OpportunityForm } from "./opportunity-form";

export const metadata = { title: "Opportunity Baru" };

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{ prospectId?: string }>;
}) {
  const [params, prospects] = await Promise.all([searchParams, listProspectOptions()]);

  return (
    <>
      <PageHeader
        title="Opportunity Baru"
        description="Catat potensi transaksi beserta volume, harga indikatif, dan spesifikasi batubara."
        breadcrumbs={[{ label: "Opportunity", href: "/opportunity" }, { label: "Baru" }]}
      />
      <Card className="max-w-4xl">
        <CardHeader title="Data Opportunity" description="Kolom bertanda * wajib diisi." />
        <OpportunityForm prospects={prospects} defaultProspectId={params.prospectId} />
      </Card>
    </>
  );
}
