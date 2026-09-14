import { PageHeader } from "@/components/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { listOpportunityOptionsForApproval } from "@/server/repos/opportunities";
import { latestPerSource, listPriceSources } from "@/server/repos/prices";
import { ApprovalForm, type ReferenceOption } from "./approval-form";

export const metadata = { title: "Sales Approval Form Baru" };

export default async function NewApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunityId?: string }>;
}) {
  const [params, opportunities, sources, latest] = await Promise.all([
    searchParams,
    listOpportunityOptionsForApproval(),
    listPriceSources(),
    latestPerSource(),
  ]);

  const references: ReferenceOption[] = sources.map((source) => {
    const observation = latest.find((o) => o.sourceCode === source.code);
    return {
      code: source.code,
      name: source.name,
      specLabel: source.specLabel,
      latestPrice: observation?.price ?? null,
      latestDate: observation?.observationDate ?? null,
    };
  });

  return (
    <>
      <PageHeader
        title="Sales Approval Form Baru"
        description="Ajukan persetujuan penjualan kepada manajemen sebelum masuk ke tahap kontrak."
        breadcrumbs={[
          { label: "Persetujuan Penjualan", href: "/persetujuan" },
          { label: "Baru" },
        ]}
      />
      <Card className="max-w-4xl">
        <CardHeader
          title="Data Pengajuan"
          description="Kolom bertanda * wajib diisi. Referensi harga indeks dikunci saat form diajukan."
        />
        <ApprovalForm
          opportunities={opportunities}
          references={references}
          defaultOpportunityId={params.opportunityId}
        />
      </Card>
    </>
  );
}
