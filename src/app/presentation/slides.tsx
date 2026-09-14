import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  Lock,
  Mail,
  Network,
  Search,
  Server,
  Users,
} from "lucide-react";
import type * as React from "react";
import {
  Bullet,
  Callout,
  Figure,
  Panel,
  ProductSlide,
  ProductSlideWide,
  RightjetMark,
  ScreenCaption,
  Screenshot,
  SlideTitle,
  StatusChip,
  StatusRow,
  VendorCredit,
} from "./slide-parts";

/**
 * Slide content for the management presentation (specification §18).
 *
 * Two rules govern this deck:
 *
 *  1. Every figure quoted here is read from the seeded demo database, not
 *     invented. Where a number is an estimate derived from the MoM, the slide
 *     says so.
 *  2. Every slide distinguishes what works today from what is proposed.
 *     Claiming a mocked integration works would be the fastest way to lose
 *     this client.
 *
 * Screenshots come from `npm run deck:capture`, which drives the real running
 * application.
 */

export { StatusChip };

export interface Slide {
  id: string;
  title: string;
  render: () => React.ReactNode;
}

export const SLIDES: Slide[] = [
  // 1 — Cover
  {
    id: "cover",
    title: "Sampul",
    render: () => (
      <div className="flex h-full flex-col justify-between bg-deep-900 px-20 py-16 text-white">
        <div className="flex items-center gap-3">
          <RightjetMark size={26} onDark />
          <span className="text-[13px] font-semibold tracking-[0.18em] text-ink-300 uppercase">
            Rightjet
          </span>
        </div>

        <div>
          <p className="mb-5 text-[11px] font-semibold tracking-[0.22em] text-brand-300 uppercase">
            Usulan Sistem · Bisnis Batubara
          </p>
          <h1 className="max-w-4xl text-[54px] leading-[1.06] font-semibold tracking-tight text-white">
            CRM Terintegrasi dengan Intelijen Harga Batubara
          </h1>
          <div className="mt-7 h-px w-24 bg-brand-400" />
          <p className="mt-7 max-w-2xl text-xl leading-relaxed text-ink-300">
            Satu sistem untuk prospek, persetujuan penjualan, kontrak, pengiriman, dan analisa
            harga indeks — dirancang untuk dijalankan di lingkungan internal perusahaan.
          </p>
        </div>

        <p className="text-[13px] tracking-[0.04em] text-ink-400">
          Prototipe demonstrasi · seluruh data bersifat sintetis
        </p>
      </div>
    ),
  },

  // 2 — Current challenge
  {
    id: "tantangan",
    title: "Tantangan Bisnis Saat Ini",
    render: () => (
      <div className="flex h-full flex-col justify-center px-20">
        <SlideTitle
          eyebrow="Kondisi saat ini"
          title="Informasi komersial tersebar, keputusan melambat"
        />
        <div className="grid grid-cols-2 gap-x-14 gap-y-8">
          <Bullet icon={Users} title="Kapasitas pengembangan terbatas" tone="danger">
            CRM internal berbasis PHP berjalan, namun penambahan fitur baru memerlukan waktu
            lama karena jumlah developer internal terbatas.
          </Bullet>
          <Bullet icon={Mail} title="Harga indeks datang melalui email" tone="danger">
            Data indeks dari empat server dikirim setiap hari ke inbox, tanpa penyimpanan
            riwayat yang terpusat.
          </Bullet>
          <Bullet icon={Search} title="Analisa historis dikerjakan manual" tone="danger">
            Membandingkan harga hari ini dengan tiga tahun lalu berarti menelusuri email satu
            per satu.
          </Bullet>
          <Bullet icon={Gauge} title="Visibilitas manajemen terbatas" tone="danger">
            Tidak ada satu layar yang menyatukan penjualan, persetujuan, kontrak, dan
            pengiriman.
          </Bullet>
        </div>
      </div>
    ),
  },

  // 3 — The cost of the current process, quantified
  {
    id: "biaya",
    title: "Biaya dari Proses Hari Ini",
    render: () => (
      <div className="flex h-full flex-col justify-center px-20">
        <SlideTitle eyebrow="Skala masalah" title="Riwayat harga yang tersimpan hanya di inbox" />

        <div className="grid grid-cols-4 gap-8">
          <Figure value="4" label="Server indeks: 2 Singapura, 2 Tiongkok" />
          <Figure value="± 1.000" label="Email indeks per tahun (4 sumber × hari kerja)" />
          <Figure value="± 3.000" label="Email yang ditelusuri untuk analisa 3 tahun" />
          <Figure value="0" label="Riwayat harga yang tersimpan di dalam sistem" tone="down" />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-10">
          <Bullet icon={Clock} title="Waktu analisa tidak dapat diprediksi" tone="danger">
            Pertanyaan sederhana — &ldquo;berapa harga ini tiga tahun lalu?&rdquo; — memerlukan
            penelusuran manual yang lamanya bergantung pada seberapa rapi inbox tersusun.
          </Bullet>
          <Bullet icon={AlertTriangle} title="Risiko pada keputusan harga" tone="danger">
            Tanpa acuan historis yang cepat diakses, keputusan harga jual bersandar pada
            ingatan dan angka terakhir yang kebetulan diingat.
          </Bullet>
        </div>

        <p className="mt-9 border-t border-ink-200 pt-3 text-[13px] text-ink-400">
          Angka email merupakan estimasi aritmetika dari kondisi yang disampaikan pada
          pertemuan (4 sumber, pengiriman harian), bukan hasil pengukuran.
        </p>
      </div>
    ),
  },

  // 4 — Market scan
  {
    id: "keterbatasan",
    title: "Keterbatasan Pilihan yang Ada",
    render: () => (
      <div className="flex h-full flex-col justify-center px-20">
        <SlideTitle eyebrow="Evaluasi pasar" title="Produk yang sudah dipertimbangkan" />
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="w-[30%] border-b-2 border-ink-900 pb-2.5 text-[11px] font-semibold tracking-[0.1em] text-ink-500 uppercase">
                Produk
              </th>
              <th className="border-b-2 border-ink-900 pb-2.5 text-[11px] font-semibold tracking-[0.1em] text-ink-500 uppercase">
                Catatan evaluasi
              </th>
            </tr>
          </thead>
          <tbody className="text-[17px]">
            {[
              ["Salesforce", "Fitur lengkap, namun biaya dinilai terlalu tinggi."],
              [
                "EspoCRM",
                "Open source, namun belum memiliki dukungan di Indonesia dan fitur standar dinilai terbatas.",
              ],
              [
                "CRM internal (PHP)",
                "Sesuai proses bisnis, namun pengembangan fitur baru berjalan lambat.",
              ],
            ].map(([product, note]) => (
              <tr key={product} className="border-b border-ink-200">
                <td className="py-4 pr-6 font-semibold text-ink-900">{product}</td>
                <td className="py-4 text-ink-600">{note}</td>
              </tr>
            ))}
            <tr className="border-b-2 border-brand-500">
              <td className="py-4 pr-6 font-semibold text-brand-700">Solusi lokal</td>
              <td className="py-4 text-ink-800">
                Disesuaikan dengan proses yang sudah berjalan, didukung tim lokal, dan dapat
                dijalankan di server internal.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },

  // 5 — Proposed system
  {
    id: "solusi",
    title: "Solusi: CRM Terintegrasi",
    render: () => (
      <div className="flex h-full flex-col justify-center px-20">
        <SlideTitle eyebrow="Usulan" title="Satu sistem, satu alur, delapan modul" />
        <div className="grid grid-cols-4 gap-x-10 gap-y-7">
          {[
            ["01", "Dashboard Eksekutif", "Ringkasan lintas modul"],
            ["02", "Prospek & Buyer", "Data pembeli dan kontak"],
            ["03", "Opportunity", "Potensi transaksi & status"],
            ["04", "Catatan Meeting", "Notulensi dan tindak lanjut"],
            ["05", "Persetujuan Penjualan", "Sales Approval Form"],
            ["06", "Kontrak", "Kontrak payung & tahapan"],
            ["07", "Delivery Order", "Rencana vs realisasi"],
            ["08", "Intelijen Harga", "Riwayat & perbandingan indeks"],
          ].map(([number, label, detail]) => (
            <div key={label} className="border-t border-ink-200 pt-3">
              <p className="tnum mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-brand-600">
                {number}
              </p>
              <p className="text-[16px] font-semibold text-ink-900">{label}</p>
              <p className="mt-1 text-[13px] text-ink-500">{detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <StatusRow>
            <StatusChip kind="working" />
            <span className="text-[15px] text-ink-600">
              Seluruh modul di atas dapat dicoba langsung pada demo hari ini.
            </span>
          </StatusRow>
        </div>
      </div>
    ),
  },

  // 6 — End-to-end flow
  {
    id: "alur",
    title: "Alur Komersial End-to-End",
    render: () => (
      <div className="flex h-full flex-col justify-center px-20">
        <SlideTitle eyebrow="Proses bisnis" title="Mengikuti alur yang sudah berjalan hari ini" />

        <div className="grid grid-cols-5">
          {[
            ["01", "Prospek", "Buyer & catatan meeting"],
            ["02", "Opportunity", "On Progress · Pending · Close · Drop"],
            ["03", "Sales Approval", "Persetujuan manajemen"],
            ["04", "Kontrak", "Draft → Satu pihak → Penuh"],
            ["05", "Delivery Order", "Rencana vs realisasi tonase"],
          ].map(([number, label, detail], index) => (
            <div
              key={label}
              className={
                index === 0
                  ? "border-t-2 border-brand-500 pt-4 pr-5"
                  : "border-t-2 border-ink-300 pt-4 pr-5 pl-5"
              }
            >
              <p className="tnum mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-brand-600">
                {number}
              </p>
              <p className="text-[17px] font-semibold text-ink-900">{label}</p>
              <p className="mt-1 text-[13px] leading-snug text-ink-500">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-11 grid grid-cols-3 gap-8">
          <Bullet icon={Lock} title="Persetujuan benar-benar mengunci">
            Hanya peran Manajemen yang dapat menyetujui, dan aturan itu ditegakkan di basis
            data — bukan sekadar tombol yang disembunyikan.
          </Bullet>
          <Bullet icon={Network} title="Setiap dokumen saling terhubung">
            Dari Delivery Order dapat ditelusuri kembali ke kontrak, form persetujuan,
            opportunity, hingga prospek asalnya.
          </Bullet>
          <Bullet icon={Gauge} title="Kuota pengiriman terjaga">
            Sistem menolak Delivery Order yang melebihi sisa kuota tahap pengiriman.
          </Bullet>
        </div>
      </div>
    ),
  },

  // 7 — Product: opportunity and status history
  {
    id: "produk-opportunity",
    title: "Produk: Opportunity & Riwayat Status",
    render: () => (
      <ProductSlide
        eyebrow="Di dalam produk"
        title="Setiap perubahan status tercatat beserta alasannya"
        src="/deck/opportunity.png"
        alt="Halaman opportunity"
        caption="Opportunity"
        imageWidth={2400}
        imageHeight={1200}
        footer={<StatusChip kind="working" />}
      >
        <Callout index={1} title="Ringkasan komersial">
          Volume, harga indikatif, nilai estimasi dan spesifikasi batubara dalam satu blok.
        </Callout>
        <Callout index={2} title="Status dengan alasan wajib">
          On Progress, Pending, Close, Drop. Perubahan status tidak dapat disimpan tanpa
          alasan.
        </Callout>
        <Callout index={3} title="Riwayat permanen">
          Siapa mengubah, kapan, dan mengapa — tersimpan sebagai jejak yang tidak dapat
          dihapus dari tampilan.
        </Callout>
      </ProductSlide>
    ),
  },

  // 8 — Product: the approval form with the frozen index price
  {
    id: "produk-persetujuan",
    title: "Produk: Persetujuan & Harga Terkunci",
    render: () => (
      <ProductSlideWide
        eyebrow="Pembeda utama dalam alur kerja"
        title="Manajemen menilai harga terhadap acuan pasar hari pengajuan"
        src="/deck/persetujuan-referensi.png"
        alt="Blok referensi harga pada Sales Approval Form"
        caption="Sales Approval Form · Referensi Harga Pasar"
        imageWidth={1526}
        imageHeight={378}
        footer={<StatusChip kind="working" />}
      >
        <Callout index={1} title="Terkunci saat pengajuan">
          Nilai indeks hari itu ikut tersimpan pada form dan tidak berubah meskipun harga
          pasar bergerak setelahnya.
        </Callout>
        <Callout index={2} title="Sumber dan tanggal tercatat">
          Indeks mana, harga berapa, observasi tanggal berapa — tertulis pada dokumen
          persetujuan itu sendiri.
        </Callout>
        <Callout index={3} title="Selisih dihitung sistem">
          Posisi harga usulan terhadap acuan ditampilkan langsung, sehingga keputusan tidak
          perlu menebak.
        </Callout>
      </ProductSlideWide>
    ),
  },

  // 9 — Product: contract and delivery realisation
  {
    id: "produk-kontrak",
    title: "Produk: Kontrak & Realisasi Pengiriman",
    render: () => (
      <ProductSlide
        eyebrow="Di dalam produk"
        title="Rencana versus realisasi tonase, per tahap pengiriman"
        src="/deck/kontrak-realisasi.png"
        alt="Realisasi pengiriman pada halaman kontrak"
        caption="Kontrak · Realisasi Pengiriman"
        imageWidth={1526}
        imageHeight={852}
        footer={<StatusChip kind="working" />}
      >
        <Callout index={1} title="Kontrak payung dengan tahapan">
          Jumlah tahap, tonase, dan periode pengiriman sesuai ketentuan kontrak.
        </Callout>
        <Callout index={2} title="Tiga angka yang dibedakan">
          Rencana, dialokasikan ke DO, dan benar-benar terkirim. Kargo yang masih di
          perjalanan tidak dihitung sebagai terkirim.
        </Callout>
        <Callout index={3} title="Sisa kuota terlihat">
          Sistem menolak Delivery Order yang melebihi sisa kuota tahap, lengkap dengan
          angkanya.
        </Callout>
      </ProductSlide>
    ),
  },

  // 10 — The differentiator, before and after
  {
    id: "harga",
    title: "Intelijen Harga Batubara",
    render: () => (
      <div className="flex h-full flex-col justify-center px-20">
        <SlideTitle
          eyebrow="Pembeda utama"
          title="Dari pencarian email menjadi analisa dalam hitungan detik"
        />
        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-8">
            <Panel title="Proses hari ini" icon={AlertTriangle} tone="danger">
              <ul className="space-y-2 text-[16px] text-ink-600">
                <li>Data indeks masuk melalui email setiap hari</li>
                <li>Riwayat tersimpan di inbox, bukan di sistem</li>
                <li>Perbandingan antar tahun ditelusuri manual</li>
              </ul>
            </Panel>
            <Panel title="Dengan sistem ini" icon={CheckCircle2} tone="success">
              <ul className="space-y-2 text-[16px] text-ink-600">
                <li>Harga hari ini dan 7 hari sebelumnya dalam satu layar</li>
                <li>Riwayat multi-tahun tersimpan dan dapat difilter</li>
                <li>Perbandingan dua periode atau antar tahun secara instan</li>
                <li>Setiap angka dapat ditelusuri sumber dan waktu pengambilannya</li>
              </ul>
            </Panel>
          </div>

          <div className="space-y-8">
            <div>
              <p className="mb-3 text-[11px] font-semibold tracking-[0.1em] text-ink-500 uppercase">
                Empat sumber indeks, sesuai kondisi existing
              </p>
              <table className="w-full border-collapse text-left text-[15px]">
                <tbody>
                  {[
                    ["ICI-3", "Singapura", "GAR 4200"],
                    ["ICI-4", "Singapura", "GAR 3400"],
                    ["CCI-5500", "Tiongkok", "NAR 5500"],
                    ["QHD-5500", "Tiongkok", "NAR 5500"],
                  ].map(([code, region, spec]) => (
                    <tr key={code} className="border-b border-ink-200">
                      <td className="py-2 font-semibold text-ink-900">{code}</td>
                      <td className="py-2 text-ink-600">{region}</td>
                      <td className="py-2 text-right text-ink-500">{spec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Panel title="Harga indeks dikunci pada form persetujuan" icon={Lock} tone="neutral">
              <p className="text-[15px] leading-snug text-ink-600">
                Saat Sales Approval Form diajukan, harga indeks hari itu ikut tersimpan pada
                form. Manajemen menilai usulan harga terhadap acuan pasar pada hari pengajuan.
              </p>
            </Panel>

            <StatusRow>
              <StatusChip kind="working" />
              <StatusChip kind="mock" />
            </StatusRow>
          </div>
        </div>
      </div>
    ),
  },

  // 11 — Product: primary daily view
  {
    id: "produk-harga-harian",
    title: "Produk: Harga Hari Ini & 7 Hari",
    render: () => (
      <ProductSlideWide
        eyebrow="Di dalam produk"
        title="Tampilan utama harian untuk keempat sumber indeks"
        src="/deck/harga-7hari.png"
        alt="Matriks harga hari ini dan tujuh hari sebelumnya"
        caption="Intelijen Harga Batubara · Ringkasan"
        imageWidth={2304}
        imageHeight={666}
        footer={
          <StatusRow>
            <StatusChip kind="working" />
            <StatusChip kind="mock" />
          </StatusRow>
        }
      >
        <Callout index={1} title="Empat sumber, delapan hari">
          Hari ini dan tujuh hari sebelumnya dalam satu matriks, tanpa membuka email.
        </Callout>
        <Callout index={2} title="Hari tanpa data tetap kosong">
          Akhir pekan dan hari libur ditampilkan sebagai tanda hubung. Sistem tidak pernah
          mengarang angka untuk mengisi celah.
        </Callout>
        <Callout index={3} title="Setiap angka dapat diklik">
          Membuka rincian sumber, penyedia, satuan, dan waktu pengambilan data.
        </Callout>
      </ProductSlideWide>
    ),
  },

  // 12 — Product: multi-year comparison, with real figures
  {
    id: "produk-harga-tahun",
    title: "Produk: Perbandingan Antar Tahun",
    render: () => (
      <div className="flex h-full flex-col justify-center px-16">
        <SlideTitle
          eyebrow="Pertanyaan dari pertemuan"
          title="&ldquo;Berapa harga sekarang dibanding beberapa tahun lalu?&rdquo;"
          compact
        />

        <div className="grid grid-cols-[minmax(0,300px)_minmax(0,1fr)] items-start gap-10">
          <div>
            <p className="mb-4 text-[15px] leading-snug text-ink-600">
              Jendela kalender yang sama (15 Agu – 14 Sep), dibandingkan antar tahun untuk
              ICI-3.
            </p>
            <table className="w-full border-collapse text-left">
              <tbody>
                <YearRow year="2026" value="53,01" note="tahun berjalan" />
                <YearRow year="2023" value="64,93" delta="−18,4%" tone="down" />
                <YearRow year="2022" value="97,51" delta="−45,6%" tone="down" />
                <YearRow year="2020" value="31,18" delta="+70,0%" tone="up" />
              </tbody>
            </table>
            <p className="mt-3 text-[12px] leading-snug text-ink-400">
              Rata-rata USD/MT. Selisih dihitung terhadap tahun berjalan. Data sintetis.
            </p>
          </div>

          <div>
            <Screenshot
              src="/deck/harga-tahun.png"
              alt="Tabel perbandingan antar tahun"
              width={2304}
              height={1184}
            />
            <ScreenCaption>Intelijen Harga Batubara · Perbandingan Tahun</ScreenCaption>
          </div>
        </div>

        <p className="mt-6 border-t border-ink-200 pt-3 text-[15px] text-ink-600">
          Analisa yang sebelumnya berarti menelusuri ribuan email kini menjadi satu layar.
        </p>
      </div>
    ),
  },

  // 13 — Product: executive dashboard
  {
    id: "produk-dashboard",
    title: "Produk: Dashboard Eksekutif",
    render: () => (
      <div className="flex h-full flex-col justify-center px-16">
        <SlideTitle
          eyebrow="Visibilitas manajemen"
          title="Satu layar untuk seluruh proses komersial"
          compact
        />

        <div className="grid grid-cols-4 gap-8">
          <Figure value="USD 42,71 jt" label="Nilai pipeline · 8 opportunity aktif" />
          <Figure value="2" label="Menunggu persetujuan manajemen" />
          <Figure value="480.000 MT" label="Tonase dikontrak" />
          <Figure value="21,8%" label="Realisasi pengiriman · 104.710 MT" />
        </div>

        <div className="mt-6">
          <Screenshot
            src="/deck/dashboard.png"
            alt="Dashboard eksekutif"
            width={2400}
            height={1120}
            className="mx-auto max-w-[840px]"
          />
          <ScreenCaption>Dashboard Eksekutif</ScreenCaption>
        </div>

        <p className="mt-5 border-t border-ink-200 pt-3 text-[14px] text-ink-500">
          Setiap angka dapat diklik menuju data yang mendasarinya — tidak ada angka yang
          berhenti sebagai hiasan. Seluruh nilai berasal dari data sintetis.
        </p>
      </div>
    ),
  },

  // 14 — Integration boundaries, honest
  {
    id: "integrasi",
    title: "Integrasi dengan Lingkungan Existing",
    render: () => (
      <div className="flex h-full flex-col justify-center px-20">
        <SlideTitle eyebrow="Batas sistem" title="Apa yang sudah berjalan, apa yang masih usulan" />
        <div className="grid grid-cols-2 gap-14">
          <div>
            <StatusChip kind="working" className="mb-5" />
            <ul className="space-y-3.5 text-[17px] text-ink-700">
              {[
                "Alur prospek sampai delivery order, termasuk persetujuan",
                "Riwayat harga multi-tahun, filter, dan perbandingan periode",
                "Peran pengguna dan penegakan kewenangan persetujuan",
                "Dashboard eksekutif lintas modul",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <StatusChip kind="proposed" className="mb-5" />
            <ul className="space-y-3.5 text-[17px] text-ink-700">
              {[
                "Koneksi ke API indeks harga sebenarnya — memerlukan dokumentasi dan kredensial",
                "Integrasi SAP — perlu kesepakatan objek dan arah pertukaran data",
                "Migrasi data dari MariaDB CRM existing",
                "Keputusan mengganti atau mendampingi CRM PHP yang berjalan",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Clock className="mt-1 size-4 shrink-0 text-ink-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-ink-200 pt-3 text-[15px] text-ink-500">
          Pada demo ini, seluruh koneksi eksternal diwakili oleh adapter mock dengan data
          sintetis. Kami tidak menampilkan integrasi yang belum benar-benar dibangun.
        </p>
      </div>
    ),
  },

  // 15 — How a real provider gets added
  {
    id: "adapter",
    title: "Jalur Menuju Data Harga Sebenarnya",
    render: () => (
      <ProductSlideWide
        eyebrow="Batas integrasi"
        title="Satu titik sambung, bukan perombakan sistem"
        src="/deck/harga-sumber.png"
        alt="Tabel sumber data dengan penanda mock adapter"
        caption="Intelijen Harga Batubara · Sumber & Ingestion"
        imageWidth={2304}
        imageHeight={808}
        footer={<StatusChip kind="mock" />}
      >
        <Callout index={1} title="Sumber tercatat sebagai mock">
          Sistem menyatakan sendiri bahwa keempat sumber masih menggunakan adapter mock. Tidak
          ada klaim koneksi yang belum ada.
        </Callout>
        <Callout index={2} title="Riwayat pengambilan data">
          Setiap pengambilan tercatat: adapter, waktu, jumlah baris, dan hasilnya.
        </Callout>
        <Callout index={3} title="Menambah penyedia asli">
          Cukup satu kelas baru yang mengikuti antarmuka yang sudah ada. Bagian lain dari
          aplikasi tidak berubah.
        </Callout>
      </ProductSlideWide>
    ),
  },

  // 16 — Security and the on-premise path
  {
    id: "keamanan",
    title: "Keamanan Data & Jalur On-Premise",
    render: () => (
      <div className="flex h-full flex-col justify-center px-20">
        <SlideTitle
          eyebrow="Kedaulatan data"
          title="Data produksi tetap berada di lingkungan internal"
        />
        <div className="grid grid-cols-2 gap-14">
          <div>
            <p className="text-[15px] font-semibold text-ink-900">Demonstrasi hari ini</p>
            <p className="mb-5 text-[13px] text-ink-500">Sementara, untuk keperluan peragaan</p>
            <ul className="space-y-3 text-[17px] text-ink-600">
              {[
                "Hosting publik sementara",
                "Basis data demo terpisah",
                "100% data sintetis",
                "Adapter integrasi mock",
              ].map((item) => (
                <li key={item} className="border-b border-ink-200 pb-2.5">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[15px] font-semibold text-ink-900">Usulan produksi</p>
            <p className="mb-5 text-[13px] text-ink-500">Di dalam lingkungan perusahaan</p>
            <ul className="space-y-3 text-[17px] text-ink-700">
              {(
                [
                  [Server, "Aplikasi dan basis data pada server internal"],
                  [Network, "Jaringan privat, tanpa akses masuk dari internet"],
                  [Users, "Autentikasi internal perusahaan dan jejak audit"],
                  [Database, "Backup terjadwal dan pemantauan"],
                ] as [React.ComponentType<{ className?: string }>, string][]
              ).map(([Icon, label]) => (
                <li key={label} className="flex gap-3 border-b border-ink-200 pb-2.5">
                  <Icon className="mt-1 size-4 shrink-0 text-brand-600" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-9 border-l-2 border-warning pl-5">
          <p className="text-[15px] leading-snug text-ink-700">
            <strong className="text-ink-900">Catatan jujur:</strong> pengambilan data indeks
            dari server Singapura dan Tiongkok bersifat <em>satu arah keluar</em> — sistem
            menarik data, tidak ada akses masuk, dan tidak ada data perusahaan yang dikirim
            keluar. Arsitektur sudah disiapkan untuk on-premise, namun kesiapan produksi masih
            memerlukan pekerjaan lanjutan yang tercantum pada tahap implementasi.
          </p>
        </div>
      </div>
    ),
  },

  // 17 — Implementation phases
  {
    id: "tahapan",
    title: "Tahapan Implementasi",
    render: () => (
      <div className="flex h-full flex-col justify-center px-20">
        <SlideTitle eyebrow="Rencana kerja" title="Bertahap, dengan hasil nyata di setiap tahap" />
        <div className="grid grid-cols-4 gap-10">
          {[
            {
              phase: "01",
              title: "Penyelarasan",
              items: [
                "Verifikasi form persetujuan aktual",
                "Dokumentasi API indeks harga",
                "Pemetaan data CRM existing",
              ],
            },
            {
              phase: "02",
              title: "Harga & Dashboard",
              items: [
                "Adapter indeks harga sebenarnya",
                "Migrasi riwayat harga",
                "Dashboard untuk manajemen",
              ],
            },
            {
              phase: "03",
              title: "Alur Komersial",
              items: [
                "Modul penjualan sampai DO",
                "Migrasi data dari MariaDB",
                "Pelatihan pengguna",
              ],
            },
            {
              phase: "04",
              title: "Produksi Internal",
              items: [
                "Deploy pada server internal",
                "Autentikasi perusahaan & audit",
                "Backup, pemantauan, integrasi SAP",
              ],
            },
          ].map((phase, index) => (
            <div
              key={phase.phase}
              className={
                index === 0
                  ? "border-t-2 border-brand-500 pt-4"
                  : "border-t-2 border-ink-300 pt-4"
              }
            >
              <p className="tnum mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-brand-600">
                {phase.phase}
              </p>
              <p className="mb-3 text-[18px] font-semibold text-ink-900">{phase.title}</p>
              <ul className="space-y-2 text-[15px] leading-snug text-ink-600">
                {phase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 border-t border-ink-200 pt-3 text-[15px] text-ink-500">
          Tahap 1 hanya memerlukan akses dokumentasi dan konfirmasi proses — belum memerlukan
          perubahan pada sistem yang sedang berjalan.
        </p>
      </div>
    ),
  },

  // 18 — Demo transition / next steps
  {
    id: "demo",
    title: "Demo & Langkah Berikutnya",
    render: () => (
      <div className="flex h-full flex-col justify-between bg-deep-900 px-20 py-16 text-white">
        <div>
          <p className="mb-5 text-[11px] font-semibold tracking-[0.22em] text-brand-300 uppercase">
            Langkah berikutnya
          </p>
          <h2 className="max-w-3xl text-[44px] leading-tight font-semibold text-white">
            Mari kita coba langsung sistemnya
          </h2>
          <div className="mt-6 h-px w-24 bg-brand-400" />
        </div>

        <div className="grid grid-cols-3 gap-12">
          {[
            {
              number: "01",
              title: "Demo langsung",
              detail:
                "Menelusuri satu alur penuh: prospek, opportunity, persetujuan, kontrak, delivery order, dan analisa harga.",
            },
            {
              number: "02",
              title: "Yang kami perlukan",
              detail:
                "Dokumentasi API indeks harga, contoh Sales Approval Form yang berlaku, dan struktur data CRM existing.",
            },
            {
              number: "03",
              title: "Hasil Tahap 1",
              detail:
                "Spesifikasi yang sudah disesuaikan dengan proses aktual, beserta rencana kerja dan biaya yang jelas.",
            },
          ].map((step) => (
            <div key={step.number} className="border-t border-white/20 pt-4">
              <p className="tnum mb-2 text-[11px] font-semibold tracking-[0.1em] text-brand-300">
                {step.number}
              </p>
              <p className="mb-2 text-[19px] font-semibold text-white">{step.title}</p>
              <p className="text-[15px] leading-relaxed text-ink-300">{step.detail}</p>
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between gap-8">
          <VendorCredit onDark />
          <p className="text-[13px] text-ink-400">
            Seluruh data pada demo bersifat sintetis dan tidak mewakili data komersial
            perusahaan.
          </p>
        </div>
      </div>
    ),
  },
];

// --- local helpers ----------------------------------------------------------

function YearRow({
  year,
  value,
  delta,
  note,
  tone,
}: {
  year: string;
  value: string;
  delta?: string;
  note?: string;
  tone?: "up" | "down";
}) {
  return (
    <tr className="border-b border-ink-200">
      <td className="py-2.5 text-[15px] font-semibold text-ink-900">{year}</td>
      <td className="tnum py-2.5 text-right text-[19px] font-semibold text-ink-900">{value}</td>
      <td
        className={
          tone === "up"
            ? "tnum py-2.5 text-right text-[14px] font-semibold text-success-ink"
            : tone === "down"
              ? "tnum py-2.5 text-right text-[14px] font-semibold text-danger-ink"
              : "py-2.5 text-right text-[12px] text-ink-400"
        }
      >
        {delta ?? note}
      </td>
    </tr>
  );
}
