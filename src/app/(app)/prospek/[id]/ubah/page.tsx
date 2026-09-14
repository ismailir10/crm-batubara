import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { getProspect } from "@/server/repos/prospects";
import { ProspectForm } from "../../prospect-form";

export const metadata = { title: "Ubah Prospek" };

export default async function EditProspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prospect = await getProspect(id);
  if (!prospect) notFound();

  return (
    <>
      <PageHeader
        title={`Ubah ${prospect.companyName}`}
        breadcrumbs={[
          { label: "Prospek", href: "/prospek" },
          { label: prospect.code, href: `/prospek/${prospect.id}` },
          { label: "Ubah" },
        ]}
      />
      <Card className="max-w-4xl">
        <CardHeader title="Data Prospek" description="Kolom bertanda * wajib diisi." />
        <ProspectForm prospect={prospect} />
      </Card>
    </>
  );
}
