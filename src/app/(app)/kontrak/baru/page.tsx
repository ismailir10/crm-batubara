import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { getApprovalForm, listApprovedFormsWithoutContract } from "@/server/repos/approvals";
import { ContractForm } from "./contract-form";

export const metadata = { title: "Kontrak Baru" };

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ safId?: string }>;
}) {
  const params = await searchParams;

  if (!params.safId) {
    const available = await listApprovedFormsWithoutContract();
    return (
      <>
        <PageHeader
          title="Kontrak Baru"
          description="Kontrak dibuat dari Sales Approval Form yang sudah disetujui."
          breadcrumbs={[{ label: "Kontrak", href: "/kontrak" }, { label: "Baru" }]}
        />
        <Card className="max-w-2xl">
          <CardHeader title="Pilih Form Persetujuan" />
          <CardBody className="space-y-3">
            {available.length === 0 ? (
              <Alert variant="info">
                Tidak ada Sales Approval Form yang disetujui dan belum memiliki kontrak. Kontrak
                hanya dapat dibuat setelah manajemen menyetujui pengajuan.
              </Alert>
            ) : (
              available.map((form) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-ink-25 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink-900">
                      {form.code} — {form.prospectName}
                    </p>
                    <p className="line-clamp-1 text-xs text-ink-500">{form.opportunityTitle}</p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/kontrak/baru?safId=${form.id}`}>Pilih</Link>
                  </Button>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </>
    );
  }

  const approval = await getApprovalForm(params.safId);
  if (!approval) notFound();

  if (approval.status !== "disetujui") {
    return (
      <>
        <PageHeader
          title="Kontrak Baru"
          breadcrumbs={[{ label: "Kontrak", href: "/kontrak" }, { label: "Baru" }]}
        />
        <Alert variant="warning" title="Form belum disetujui">
          Kontrak hanya dapat dibuat dari Sales Approval Form berstatus Disetujui. Form{" "}
          {approval.code} saat ini belum memenuhi syarat tersebut.
        </Alert>
      </>
    );
  }

  if (approval.contractId) {
    return (
      <>
        <PageHeader
          title="Kontrak Baru"
          breadcrumbs={[{ label: "Kontrak", href: "/kontrak" }, { label: "Baru" }]}
        />
        <Alert variant="info" title="Kontrak sudah dibuat">
          Form {approval.code} sudah memiliki kontrak.{" "}
          <Link
            href={`/kontrak/${approval.contractId}`}
            className="font-medium underline underline-offset-2"
          >
            Buka kontrak
          </Link>
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Kontrak Baru"
        description={`Dari ${approval.code} · ${approval.prospectName}`}
        breadcrumbs={[{ label: "Kontrak", href: "/kontrak" }, { label: "Baru" }]}
      />
      <Card className="max-w-5xl">
        <CardHeader
          title="Data Kontrak Payung"
          description="Tahap pengiriman diisi otomatis dari periode kontrak dan dapat disesuaikan."
        />
        <ContractForm approval={approval} />
      </Card>
    </>
  );
}
