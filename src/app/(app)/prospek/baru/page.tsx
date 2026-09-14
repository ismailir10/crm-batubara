import { PageHeader } from "@/components/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { ProspectForm } from "../prospect-form";

export const metadata = { title: "Prospek Baru" };

export default function NewProspectPage() {
  return (
    <>
      <PageHeader
        title="Prospek Baru"
        description="Catat calon pembeli batubara beserta kontak dan sumber prospeknya."
        breadcrumbs={[{ label: "Prospek", href: "/prospek" }, { label: "Baru" }]}
      />
      <Card className="max-w-4xl">
        <CardHeader title="Data Prospek" description="Kolom bertanda * wajib diisi." />
        <ProspectForm />
      </Card>
    </>
  );
}
