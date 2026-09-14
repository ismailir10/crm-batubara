/**
 * Deterministic synthetic seed.
 *
 * Re-running on the same day reproduces byte-identical data: every price is a
 * pure function of (source code, date), anchored at a fixed start date, so the
 * series never depends on when the seed happens to run (AGENTS.md §9).
 *
 *   npm run db:seed
 */
import { Client } from "pg";
import { loadEnv } from "../scripts/load-env";
import { hashPassword } from "../src/lib/password";
import {
  MEETING_NOTES,
  OPPORTUNITIES,
  PROSPECTS,
  USERS,
  DEMO_SELLER,
} from "./seed-data";
import {
  PRICE_ANCHOR_DATE,
  SYNTHETIC_SOURCES,
  generateSeries,
} from "../src/server/price/synthetic";

loadEnv();

const ADMIN_URL = process.env.ADMIN_DATABASE_URL;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo1234";

if (!ADMIN_URL) {
  console.error("ADMIN_DATABASE_URL must be set.");
  process.exit(1);
}

// --- date helpers -----------------------------------------------------------

const TODAY = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function shiftDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
function daysAgo(n: number): string {
  return iso(shiftDays(TODAY, -n));
}
function daysAhead(n: number): string {
  return iso(shiftDays(TODAY, n));
}
function timestampDaysAgo(n: number, hour = 9): string {
  const d = shiftDays(TODAY, -n);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

// --- commercial records -----------------------------------------------------

interface SeedSaf {
  key: string;
  opportunityKey: string;
  volume: number;
  price: number;
  paymentTerm: string;
  deliveryTerm: string;
  periodStartInDays: number;
  periodEndInDays: number;
  justification: string;
  refSourceCode: string;
  refObservationDaysAgo: number;
  status: "draft" | "menunggu_persetujuan" | "disetujui" | "ditolak";
  createdByKey: string;
  submittedDaysAgo?: number;
  decidedByKey?: string;
  decidedDaysAgo?: number;
  decisionNote?: string;
}

const SAFS: SeedSaf[] = [
  {
    key: "saf-fujian",
    opportunityKey: "fujian-q4",
    volume: 300000,
    price: 54.5,
    paymentTerm: "LC at sight, 100% saat penyerahan dokumen",
    deliveryTerm: "FOB Vessel",
    periodStartInDays: -30,
    periodEndInDays: 335,
    justification:
      "Buyer merupakan pembeli reguler dengan riwayat pembayaran baik. Harga usulan USD 54,50 per MT " +
      "berada di atas rata-rata ICI-3 30 hari terakhir dan memberikan margin yang memadai. " +
      "Kontrak payung 12 bulan memberikan kepastian serapan produksi.",
    refSourceCode: "ICI-3",
    refObservationDaysAgo: 46,
    status: "disetujui",
    createdByKey: "dewi",
    submittedDaysAgo: 45,
    decidedByKey: "hendra",
    decidedDaysAgo: 42,
    decisionNote:
      "Disetujui. Harga dan term pembayaran sesuai kebijakan. Pastikan jadwal pengiriman " +
      "empat tahap dicantumkan dalam kontrak payung.",
  },
  {
    key: "saf-nusajaya",
    opportunityKey: "nusajaya-dmo",
    volume: 180000,
    price: 49.75,
    paymentTerm: "Transfer 30 hari setelah dokumen lengkap",
    deliveryTerm: "FOB Barge",
    periodStartInDays: -20,
    periodEndInDays: 345,
    justification:
      "Pemenuhan kewajiban DMO sekaligus menjaga hubungan dengan pembangkit domestik. " +
      "Harga mengikuti ketentuan harga jual DMO yang berlaku.",
    refSourceCode: "ICI-3",
    refObservationDaysAgo: 31,
    status: "disetujui",
    createdByKey: "rizky",
    submittedDaysAgo: 30,
    decidedByKey: "laksmi",
    decidedDaysAgo: 28,
    decisionNote: "Disetujui. Kewajiban DMO diprioritaskan. Jadwal pengiriman bulanan agar dijaga.",
  },
  {
    key: "saf-fujian-spot",
    opportunityKey: "fujian-spot",
    volume: 60000,
    price: 55.5,
    paymentTerm: "LC at sight",
    deliveryTerm: "FOB Vessel",
    periodStartInDays: -5,
    periodEndInDays: 85,
    justification:
      "Tambahan spot cargo di luar kontrak payung berjalan. Harga usulan di atas indeks berjalan " +
      "karena pengiriman dalam waktu dekat dan kuota produksi terbatas.",
    refSourceCode: "ICI-3",
    refObservationDaysAgo: 9,
    status: "disetujui",
    createdByKey: "dewi",
    submittedDaysAgo: 8,
    decidedByKey: "hendra",
    decidedDaysAgo: 7,
    decisionNote: "Disetujui dengan catatan pengiriman tidak boleh mengganggu kontrak payung berjalan.",
  },
  {
    key: "saf-hantai",
    opportunityKey: "hantai-longterm",
    volume: 240000,
    price: 56.0,
    paymentTerm: "LC at sight, 100% saat penyerahan dokumen",
    deliveryTerm: "FOB Vessel",
    periodStartInDays: 30,
    periodEndInDays: 395,
    justification:
      "Buyer baru dengan potensi volume tahunan besar. Harga usulan USD 56,00 per MT mempertimbangkan " +
      "biaya masuk pasar dan posisi terhadap CCI-5500. Direkomendasikan sebagai pemasok cadangan " +
      "yang dapat berkembang menjadi pemasok utama.",
    refSourceCode: "CCI-5500",
    refObservationDaysAgo: 3,
    status: "menunggu_persetujuan",
    createdByKey: "rizky",
    submittedDaysAgo: 2,
  },
  {
    key: "saf-daiphong",
    opportunityKey: "daiphong-blend",
    volume: 120000,
    price: 41.5,
    paymentTerm: "LC at sight",
    deliveryTerm: "CIF Hai Phong",
    periodStartInDays: 20,
    periodEndInDays: 200,
    justification:
      "Permintaan GAR 3400 untuk blending. Harga usulan sejalan dengan ICI-4 terkini " +
      "dan membuka pasar Vietnam yang sebelumnya belum digarap.",
    refSourceCode: "ICI-4",
    refObservationDaysAgo: 2,
    status: "menunggu_persetujuan",
    createdByKey: "dewi",
    submittedDaysAgo: 1,
  },
  {
    key: "saf-sejong",
    opportunityKey: "sejong-spec",
    volume: 90000,
    price: 61.0,
    paymentTerm: "LC at sight",
    deliveryTerm: "CIF Busan",
    periodStartInDays: 45,
    periodEndInDays: 225,
    justification:
      "Permintaan spesifikasi sulphur maksimal 0,6% dengan harga premium. " +
      "Memerlukan pemilihan batch khusus dari tambang.",
    refSourceCode: "ICI-3",
    refObservationDaysAgo: 11,
    status: "ditolak",
    createdByKey: "maya",
    submittedDaysAgo: 10,
    decidedByKey: "hendra",
    decidedDaysAgo: 9,
    decisionNote:
      "Ditolak untuk saat ini. Konsistensi sulphur di bawah 0,6% belum dapat dijamin untuk volume " +
      "90.000 MT. Ajukan kembali setelah hasil uji laboratorium batch terbaru tersedia.",
  },
  {
    key: "saf-katulistiwa",
    opportunityKey: "katulistiwa-kiln",
    volume: 36000,
    price: 52.0,
    paymentTerm: "Transfer 14 hari setelah pengiriman",
    deliveryTerm: "FOB Barge",
    periodStartInDays: 30,
    periodEndInDays: 395,
    justification:
      "Kontrak domestik 12 bulan dengan harga tetap. Volume kecil namun rutin dan menjaga " +
      "utilisasi barge pada rute Kalimantan Barat.",
    refSourceCode: "ICI-3",
    refObservationDaysAgo: 1,
    status: "draft",
    createdByKey: "dewi",
  },
];

interface SeedContract {
  key: string;
  safKey: string;
  title: string;
  totalVolume: number;
  price: number;
  priceBasis: string;
  periodStartInDays: number;
  periodEndInDays: number;
  status: "ditandatangani_satu_pihak" | "ditandatangani_penuh";
  signedBySellerDaysAgo: number | null;
  signedByBuyerDaysAgo: number | null;
  stages: { stageNo: number; volume: number; startInDays: number; endInDays: number; notes: string }[];
}

const CONTRACTS: SeedContract[] = [
  {
    key: "ctr-fujian",
    safKey: "saf-fujian",
    title: `Kontrak Payung Pasokan Batubara GAR 4200 — ${DEMO_SELLER} & Fujian Xinyuan Power Trading`,
    totalVolume: 300000,
    price: 54.5,
    priceBasis: "Harga tetap (fixed) USD/MT, FOB Vessel",
    periodStartInDays: -30,
    periodEndInDays: 335,
    status: "ditandatangani_penuh",
    signedBySellerDaysAgo: 38,
    signedByBuyerDaysAgo: 35,
    stages: [
      { stageNo: 1, volume: 75000, startInDays: -30, endInDays: 60, notes: "Tahap 1 — kuartal berjalan" },
      { stageNo: 2, volume: 75000, startInDays: 61, endInDays: 151, notes: "Tahap 2" },
      { stageNo: 3, volume: 75000, startInDays: 152, endInDays: 242, notes: "Tahap 3" },
      { stageNo: 4, volume: 75000, startInDays: 243, endInDays: 335, notes: "Tahap 4" },
    ],
  },
  {
    key: "ctr-nusajaya",
    safKey: "saf-nusajaya",
    title: `Kontrak Payung Pasokan DMO — ${DEMO_SELLER} & PT Pembangkit Listrik Nusa Jaya`,
    totalVolume: 180000,
    price: 49.75,
    priceBasis: "Harga tetap (fixed) sesuai ketentuan DMO, FOB Barge",
    periodStartInDays: -20,
    periodEndInDays: 345,
    status: "ditandatangani_penuh",
    signedBySellerDaysAgo: 26,
    signedByBuyerDaysAgo: 24,
    stages: [
      { stageNo: 1, volume: 60000, startInDays: -20, endInDays: 100, notes: "Tahap 1 — empat bulan pertama" },
      { stageNo: 2, volume: 60000, startInDays: 101, endInDays: 221, notes: "Tahap 2" },
      { stageNo: 3, volume: 60000, startInDays: 222, endInDays: 345, notes: "Tahap 3" },
    ],
  },
  {
    key: "ctr-fujian-spot",
    safKey: "saf-fujian-spot",
    title: `Kontrak Spot GAR 4200 — ${DEMO_SELLER} & Fujian Xinyuan Power Trading`,
    totalVolume: 60000,
    price: 55.5,
    priceBasis: "Harga tetap (fixed) USD/MT, FOB Vessel",
    periodStartInDays: -5,
    periodEndInDays: 85,
    status: "ditandatangani_satu_pihak",
    signedBySellerDaysAgo: 5,
    signedByBuyerDaysAgo: null,
    stages: [
      { stageNo: 1, volume: 30000, startInDays: -5, endInDays: 40, notes: "Tahap 1" },
      { stageNo: 2, volume: 30000, startInDays: 41, endInDays: 85, notes: "Tahap 2" },
    ],
  },
];

interface SeedDo {
  contractKey: string;
  stageNo: number;
  planned: number;
  actual: number | null;
  status: "draft" | "terjadwal" | "dalam_pengiriman" | "selesai";
  laycanStartInDays: number;
  laycanEndInDays: number;
  loadingPoint: string;
  destination: string;
  vessel: string;
  createdByKey: string;
}

const DELIVERY_ORDERS: SeedDo[] = [
  // Fujian stage 1 — fully shipped
  { contractKey: "ctr-fujian", stageNo: 1, planned: 25000, actual: 24850, status: "selesai", laycanStartInDays: -26, laycanEndInDays: -22, loadingPoint: "Muara Berau Anchorage", destination: "Fuzhou", vessel: "MV Bintang Samudra", createdByKey: "bagus" },
  { contractKey: "ctr-fujian", stageNo: 1, planned: 25000, actual: 25120, status: "selesai", laycanStartInDays: -14, laycanEndInDays: -10, loadingPoint: "Muara Berau Anchorage", destination: "Fuzhou", vessel: "MV Cakrawala Jaya", createdByKey: "bagus" },
  { contractKey: "ctr-fujian", stageNo: 1, planned: 25000, actual: 24980, status: "selesai", laycanStartInDays: -6, laycanEndInDays: -2, loadingPoint: "Muara Berau Anchorage", destination: "Fuzhou", vessel: "MV Nusantara Permai", createdByKey: "bagus" },
  // Fujian stage 2 — in progress
  { contractKey: "ctr-fujian", stageNo: 2, planned: 25000, actual: null, status: "dalam_pengiriman", laycanStartInDays: 4, laycanEndInDays: 8, loadingPoint: "Muara Berau Anchorage", destination: "Fuzhou", vessel: "MV Bintang Samudra", createdByKey: "bagus" },
  { contractKey: "ctr-fujian", stageNo: 2, planned: 25000, actual: null, status: "terjadwal", laycanStartInDays: 22, laycanEndInDays: 26, loadingPoint: "Muara Berau Anchorage", destination: "Fuzhou", vessel: "TBN", createdByKey: "bagus" },
  // Nusa Jaya stage 1
  { contractKey: "ctr-nusajaya", stageNo: 1, planned: 30000, actual: 29760, status: "selesai", laycanStartInDays: -16, laycanEndInDays: -12, loadingPoint: "Taboneo Anchorage", destination: "Surabaya", vessel: "TB Harapan 21 / BG Nusa 3001", createdByKey: "bagus" },
  { contractKey: "ctr-nusajaya", stageNo: 1, planned: 30000, actual: null, status: "dalam_pengiriman", laycanStartInDays: -2, laycanEndInDays: 3, loadingPoint: "Taboneo Anchorage", destination: "Surabaya", vessel: "TB Harapan 22 / BG Nusa 3002", createdByKey: "bagus" },
  // Nusa Jaya stage 2 — planned
  { contractKey: "ctr-nusajaya", stageNo: 2, planned: 30000, actual: null, status: "terjadwal", laycanStartInDays: 105, laycanEndInDays: 110, loadingPoint: "Taboneo Anchorage", destination: "Surabaya", vessel: "TBN", createdByKey: "bagus" },
  { contractKey: "ctr-nusajaya", stageNo: 2, planned: 30000, actual: null, status: "draft", laycanStartInDays: 140, laycanEndInDays: 145, loadingPoint: "Taboneo Anchorage", destination: "Surabaya", vessel: "TBN", createdByKey: "bagus" },
];

// --- seeding ----------------------------------------------------------------

const TABLES_IN_DELETE_ORDER = [
  "delivery_orders",
  "contract_delivery_stages",
  "contracts",
  "sales_approval_forms",
  "meeting_notes",
  "opportunity_status_history",
  "opportunities",
  "prospects",
  "coal_price_observations",
  "price_ingestion_runs",
  "coal_price_sources",
  "users",
];

const SEQUENCES = [
  "prospect_code_seq",
  "opportunity_code_seq",
  "saf_code_seq",
  "contract_code_seq",
  "do_code_seq",
];

async function main() {
  const client = new Client({ connectionString: ADMIN_URL });
  await client.connect();
  await client.query("begin");

  try {
    for (const table of TABLES_IN_DELETE_ORDER) {
      await client.query(`delete from ${table}`);
    }
    for (const sequence of SEQUENCES) {
      await client.query(`alter sequence ${sequence} restart with 1`);
    }

    // Users
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    const userIds = new Map<string, string>();
    for (const user of USERS) {
      const { rows } = await client.query<{ id: string }>(
        `insert into users (email, full_name, job_title, role, password_hash)
         values ($1,$2,$3,$4,$5) returning id`,
        [user.email, user.fullName, user.jobTitle, user.role, passwordHash]
      );
      userIds.set(user.key, rows[0].id);
    }
    console.log(`users: ${USERS.length}`);

    // Price sources, ingestion runs, observations
    let totalObservations = 0;
    for (const source of SYNTHETIC_SOURCES) {
      const { rows } = await client.query<{ id: string }>(
        `insert into coal_price_sources (code, name, provider, region, spec_label, sort_order)
         values ($1,$2,$3,$4,$5,$6) returning id`,
        [source.code, source.name, source.provider, source.region, source.specLabel, source.sortOrder]
      );
      const sourceId = rows[0].id;
      const series = generateSeries(source, TODAY);

      // Two runs per source: a historical backfill and the most recent daily fetch.
      const backfill = await client.query<{ id: string }>(
        `insert into price_ingestion_runs
           (source_id, adapter_name, started_at, finished_at, status, rows_ingested, message)
         values ($1,'MockCoalPriceProvider',$2,$3,'berhasil',$4,$5) returning id`,
        [
          sourceId,
          timestampDaysAgo(8, 2),
          timestampDaysAgo(8, 3),
          series.length - Math.min(series.length, 6),
          "Backfill historis dari penyedia mock (data sintetis).",
        ]
      );
      const daily = await client.query<{ id: string }>(
        `insert into price_ingestion_runs
           (source_id, adapter_name, started_at, finished_at, status, rows_ingested, message)
         values ($1,'MockCoalPriceProvider',$2,$3,'berhasil',$4,$5) returning id`,
        [
          sourceId,
          timestampDaysAgo(0, 6),
          timestampDaysAgo(0, 6),
          Math.min(series.length, 6),
          "Pengambilan harian dari penyedia mock (data sintetis).",
        ]
      );

      const recentCutoff = daysAgo(7);
      const rows5: unknown[][] = series.map((point) => {
        // Data lands the morning after the observation date, mirroring the daily email.
        const fetchedAt = `${iso(shiftDays(new Date(`${point.date}T00:00:00Z`), 1))}T06:30:00Z`;
        return [
          sourceId,
          point.date,
          point.price,
          fetchedAt,
          point.date >= recentCutoff ? daily.rows[0].id : backfill.rows[0].id,
        ];
      });

      // Chunked: a five-year series exceeds the bind-parameter limit in one statement.
      const CHUNK = 500;
      for (let start = 0; start < rows5.length; start += CHUNK) {
        const chunk = rows5.slice(start, start + CHUNK);
        const placeholders = chunk
          .map((_, index) => {
            const base = index * 5;
            return `($${base + 1},$${base + 2},$${base + 3},'USD/tonne','USD',$${base + 4},$${base + 5})`;
          })
          .join(",");
        await client.query(
          `insert into coal_price_observations
             (source_id, observation_date, price, unit, currency, fetched_at, ingestion_run_id)
           values ${placeholders}`,
          chunk.flat()
        );
      }
      totalObservations += series.length;
      console.log(`price source ${source.code}: ${series.length} observations`);
    }

    // Prospects
    const prospectIds = new Map<string, string>();
    for (const prospect of PROSPECTS) {
      const { rows } = await client.query<{ id: string }>(
        `insert into prospects
           (company_name, country, city, contact_person, contact_role, contact_email,
            contact_phone, source, status, owner_id, notes)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
        [
          prospect.companyName,
          prospect.country,
          prospect.city,
          prospect.contactPerson,
          prospect.contactRole,
          prospect.contactEmail,
          prospect.contactPhone,
          prospect.source,
          prospect.status,
          userIds.get(prospect.ownerKey),
          prospect.notes,
        ]
      );
      prospectIds.set(prospect.key, rows[0].id);
    }
    console.log(`prospects: ${PROSPECTS.length}`);

    // Opportunities and their status history
    const opportunityIds = new Map<string, string>();
    for (const opportunity of OPPORTUNITIES) {
      const { rows } = await client.query<{ id: string }>(
        `insert into opportunities
           (prospect_id, title, coal_gar_kcal, coal_tm_pct, coal_ash_pct, coal_sulphur_pct,
            estimated_volume_tonnes, estimated_price_usd_per_tonne, delivery_term,
            expected_close_date, status, owner_id, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,
        [
          prospectIds.get(opportunity.prospectKey),
          opportunity.title,
          opportunity.gar,
          opportunity.tm,
          opportunity.ash,
          opportunity.sulphur,
          opportunity.volume,
          opportunity.price,
          opportunity.deliveryTerm,
          opportunity.expectedCloseInDays >= 0
            ? daysAhead(opportunity.expectedCloseInDays)
            : daysAgo(-opportunity.expectedCloseInDays),
          opportunity.status,
          userIds.get(opportunity.ownerKey),
          timestampDaysAgo(opportunity.createdDaysAgo),
        ]
      );
      const opportunityId = rows[0].id;
      opportunityIds.set(opportunity.key, opportunityId);

      await client.query(
        `insert into opportunity_status_history
           (opportunity_id, from_status, to_status, reason, changed_by, changed_at)
         values ($1,null,'on_progress',$2,$3,$4)`,
        [
          opportunityId,
          "Opportunity dibuat dari hasil pertemuan dengan prospek.",
          userIds.get(opportunity.ownerKey),
          timestampDaysAgo(opportunity.createdDaysAgo),
        ]
      );

      let previous: string = "on_progress";
      for (const entry of opportunity.history) {
        await client.query(
          `insert into opportunity_status_history
             (opportunity_id, from_status, to_status, reason, changed_by, changed_at)
           values ($1,$2,$3,$4,$5,$6)`,
          [
            opportunityId,
            previous,
            entry.to,
            entry.reason,
            userIds.get(opportunity.ownerKey),
            timestampDaysAgo(entry.daysAgo),
          ]
        );
        previous = entry.to;
      }
    }
    console.log(`opportunities: ${OPPORTUNITIES.length}`);

    // Meeting notes
    for (const note of MEETING_NOTES) {
      await client.query(
        `insert into meeting_notes
           (prospect_id, opportunity_id, meeting_date, location, attendees, summary,
            next_action, next_action_date, created_by, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          prospectIds.get(note.prospectKey),
          note.opportunityKey ? opportunityIds.get(note.opportunityKey) : null,
          daysAgo(note.daysAgo),
          note.location,
          note.attendees,
          note.summary,
          note.nextAction,
          note.nextActionInDays === null
            ? null
            : note.nextActionInDays >= 0
              ? daysAhead(note.nextActionInDays)
              : daysAgo(-note.nextActionInDays),
          userIds.get(note.authorKey),
          timestampDaysAgo(note.daysAgo, 16),
        ]
      );
    }
    console.log(`meeting notes: ${MEETING_NOTES.length}`);

    // Sales Approval Forms, with the market reference frozen at submission time.
    const safIds = new Map<string, string>();
    for (const saf of SAFS) {
      const reference = await client.query<{
        code: string;
        name: string;
        price: number;
        observation_date: string;
      }>(
        `select s.code, s.name, o.price, o.observation_date
         from coal_price_observations o
         join coal_price_sources s on s.id = o.source_id
         where s.code = $1 and o.observation_date <= $2
         order by o.observation_date desc limit 1`,
        [saf.refSourceCode, daysAgo(saf.refObservationDaysAgo)]
      );
      const ref = reference.rows[0] ?? null;

      const { rows } = await client.query<{ id: string }>(
        `insert into sales_approval_forms
           (opportunity_id, proposed_volume_tonnes, proposed_price_usd_per_tonne, payment_term,
            delivery_term, contract_period_start, contract_period_end, justification,
            ref_source_code, ref_source_name, ref_price_usd_per_tonne, ref_observation_date,
            status, submitted_by, submitted_at, decided_by, decided_at, decision_note,
            created_by, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
         returning id`,
        [
          opportunityIds.get(saf.opportunityKey),
          saf.volume,
          saf.price,
          saf.paymentTerm,
          saf.deliveryTerm,
          saf.periodStartInDays >= 0 ? daysAhead(saf.periodStartInDays) : daysAgo(-saf.periodStartInDays),
          saf.periodEndInDays >= 0 ? daysAhead(saf.periodEndInDays) : daysAgo(-saf.periodEndInDays),
          saf.justification,
          ref?.code ?? null,
          ref?.name ?? null,
          ref?.price ?? null,
          ref?.observation_date ?? null,
          saf.status,
          saf.submittedDaysAgo === undefined ? null : userIds.get(saf.createdByKey),
          saf.submittedDaysAgo === undefined ? null : timestampDaysAgo(saf.submittedDaysAgo, 11),
          saf.decidedByKey ? userIds.get(saf.decidedByKey) : null,
          saf.decidedDaysAgo === undefined ? null : timestampDaysAgo(saf.decidedDaysAgo, 14),
          saf.decisionNote ?? null,
          userIds.get(saf.createdByKey),
          timestampDaysAgo((saf.submittedDaysAgo ?? 0) + 1, 10),
        ]
      );
      safIds.set(saf.key, rows[0].id);
    }
    console.log(`sales approval forms: ${SAFS.length}`);

    // Contracts and delivery stages
    const contractIds = new Map<string, string>();
    const stageIds = new Map<string, string>();
    for (const contract of CONTRACTS) {
      const saf = SAFS.find((s) => s.key === contract.safKey)!;
      const opportunity = OPPORTUNITIES.find((o) => o.key === saf.opportunityKey)!;

      const { rows } = await client.query<{ id: string }>(
        `insert into contracts
           (opportunity_id, sales_approval_form_id, prospect_id, title, total_volume_tonnes,
            price_usd_per_tonne, price_basis, period_start, period_end, status,
            signed_by_seller_at, signed_by_buyer_at, created_by, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning id`,
        [
          opportunityIds.get(saf.opportunityKey),
          safIds.get(contract.safKey),
          prospectIds.get(opportunity.prospectKey),
          contract.title,
          contract.totalVolume,
          contract.price,
          contract.priceBasis,
          contract.periodStartInDays >= 0
            ? daysAhead(contract.periodStartInDays)
            : daysAgo(-contract.periodStartInDays),
          daysAhead(contract.periodEndInDays),
          contract.status,
          contract.signedBySellerDaysAgo === null ? null : daysAgo(contract.signedBySellerDaysAgo),
          contract.signedByBuyerDaysAgo === null ? null : daysAgo(contract.signedByBuyerDaysAgo),
          userIds.get("bagus"),
          timestampDaysAgo((contract.signedBySellerDaysAgo ?? 5) + 2, 10),
        ]
      );
      const contractId = rows[0].id;
      contractIds.set(contract.key, contractId);

      for (const stage of contract.stages) {
        const stageRow = await client.query<{ id: string }>(
          `insert into contract_delivery_stages
             (contract_id, stage_no, planned_volume_tonnes, period_start, period_end, notes)
           values ($1,$2,$3,$4,$5,$6) returning id`,
          [
            contractId,
            stage.stageNo,
            stage.volume,
            stage.startInDays >= 0 ? daysAhead(stage.startInDays) : daysAgo(-stage.startInDays),
            daysAhead(stage.endInDays),
            stage.notes,
          ]
        );
        stageIds.set(`${contract.key}:${stage.stageNo}`, stageRow.rows[0].id);
      }
    }
    console.log(`contracts: ${CONTRACTS.length}`);

    // Delivery orders
    for (const order of DELIVERY_ORDERS) {
      await client.query(
        `insert into delivery_orders
           (contract_id, stage_id, planned_volume_tonnes, actual_volume_tonnes, laycan_start,
            laycan_end, loading_point, destination, vessel_name, status, created_by, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          contractIds.get(order.contractKey),
          stageIds.get(`${order.contractKey}:${order.stageNo}`),
          order.planned,
          order.actual,
          order.laycanStartInDays >= 0
            ? daysAhead(order.laycanStartInDays)
            : daysAgo(-order.laycanStartInDays),
          order.laycanEndInDays >= 0
            ? daysAhead(order.laycanEndInDays)
            : daysAgo(-order.laycanEndInDays),
          order.loadingPoint,
          order.destination,
          order.vessel,
          order.status,
          userIds.get(order.createdByKey),
          timestampDaysAgo(Math.max(order.laycanStartInDays < 0 ? -order.laycanStartInDays + 10 : 1, 1), 9),
        ]
      );
    }
    console.log(`delivery orders: ${DELIVERY_ORDERS.length}`);

    await client.query("commit");
    console.log(
      `\nseed complete — ${totalObservations} price observations from ${PRICE_ANCHOR_DATE} ` +
        `to ${iso(TODAY)}, all data synthetic`
    );
    console.log(`demo accounts use password: ${DEMO_PASSWORD}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
