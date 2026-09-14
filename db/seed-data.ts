/**
 * Synthetic demo data definitions.
 *
 * Every company, person, contract and price below is invented. Nothing here comes
 * from the discovery meeting or from any real commercial record (AGENTS.md §9).
 */

export const DEMO_SELLER = "PT Demo Batubara Nusantara";

export interface SeedUser {
  key: string;
  email: string;
  fullName: string;
  jobTitle: string;
  role: "marketing" | "sales_manager" | "management";
}

export const USERS: SeedUser[] = [
  {
    key: "dewi",
    email: "dewi.anggraini@demo-batubara.co.id",
    fullName: "Dewi Anggraini",
    jobTitle: "Marketing Executive",
    role: "marketing",
  },
  {
    key: "rizky",
    email: "rizky.pratama@demo-batubara.co.id",
    fullName: "Rizky Pratama",
    jobTitle: "Marketing Executive",
    role: "marketing",
  },
  {
    key: "maya",
    email: "maya.kusuma@demo-batubara.co.id",
    fullName: "Maya Kusuma",
    jobTitle: "Marketing Officer",
    role: "marketing",
  },
  {
    key: "bagus",
    email: "bagus.setiawan@demo-batubara.co.id",
    fullName: "Bagus Setiawan",
    jobTitle: "Sales Manager",
    role: "sales_manager",
  },
  {
    key: "hendra",
    email: "hendra.wijaya@demo-batubara.co.id",
    fullName: "Hendra Wijaya",
    jobTitle: "Direktur Komersial",
    role: "management",
  },
  {
    key: "laksmi",
    email: "laksmi.hartono@demo-batubara.co.id",
    fullName: "Laksmi Hartono",
    jobTitle: "Direktur Utama",
    role: "management",
  },
];

export interface SeedProspect {
  key: string;
  companyName: string;
  country: string;
  city: string;
  contactPerson: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  source: string;
  status: "baru" | "terkualifikasi" | "tidak_memenuhi_syarat" | "tidak_aktif";
  ownerKey: string;
  notes: string;
}

export const PROSPECTS: SeedProspect[] = [
  {
    key: "fujian",
    companyName: "Fujian Xinyuan Power Trading Co., Ltd",
    country: "Tiongkok",
    city: "Fuzhou",
    contactPerson: "Chen Wei Lin",
    contactRole: "Procurement Manager",
    contactEmail: "chen.wl@fujian-xinyuan.example.cn",
    contactPhone: "+86 591 5500 1200",
    source: "Referral mitra trading",
    status: "terkualifikasi",
    ownerKey: "dewi",
    notes: "Pembeli reguler GAR 4200. Volume tahunan sekitar 600.000 MT. Sensitif terhadap ICI-3.",
  },
  {
    key: "hantai",
    companyName: "Guangdong Hantai Energy Co., Ltd",
    country: "Tiongkok",
    city: "Guangzhou",
    contactPerson: "Liu Jian Hong",
    contactRole: "Head of Fuel Sourcing",
    contactEmail: "liu.jh@gd-hantai.example.cn",
    contactPhone: "+86 20 8833 4410",
    source: "Pameran Coaltrans Asia",
    status: "terkualifikasi",
    ownerKey: "rizky",
    notes: "Fokus pada pasokan jangka panjang untuk PLTU captive. Memerlukan kontrak payung.",
  },
  {
    key: "daiphong",
    companyName: "Dai Phong Energy JSC",
    country: "Vietnam",
    city: "Hai Phong",
    contactPerson: "Nguyen Van Tuan",
    contactRole: "Commercial Director",
    contactEmail: "tuan.nv@daiphong.example.vn",
    contactPhone: "+84 225 3810 220",
    source: "Inbound website",
    status: "terkualifikasi",
    ownerKey: "dewi",
    notes: "Permintaan GAR 3400 untuk blending. Pembayaran LC at sight.",
  },
  {
    key: "bharat",
    companyName: "Bharat Surya Power Ltd",
    country: "India",
    city: "Mumbai",
    contactPerson: "Arjun Mehta",
    contactRole: "VP Fuel Procurement",
    contactEmail: "arjun.mehta@bharatsurya.example.in",
    contactPhone: "+91 22 6100 8800",
    source: "Referral bank",
    status: "baru",
    ownerKey: "maya",
    notes: "Baru kontak awal. Perlu verifikasi kapasitas pembayaran dan track record.",
  },
  {
    key: "luzon",
    companyName: "Luzon Prime Power Corporation",
    country: "Filipina",
    city: "Manila",
    contactPerson: "Ramon Villanueva",
    contactRole: "Fuel Supply Manager",
    contactEmail: "r.villanueva@luzonprime.example.ph",
    contactPhone: "+63 2 8812 4455",
    source: "Kunjungan langsung",
    status: "terkualifikasi",
    ownerKey: "rizky",
    notes: "Kontrak tahunan berjalan dengan supplier lain, potensi masuk tahun depan.",
  },
  {
    key: "sejong",
    companyName: "Korea Sejong Power Co., Ltd",
    country: "Korea Selatan",
    city: "Busan",
    contactPerson: "Park Min Jun",
    contactRole: "Senior Buyer",
    contactEmail: "mj.park@sejongpower.example.kr",
    contactPhone: "+82 51 720 3300",
    source: "Pameran Coaltrans Asia",
    status: "baru",
    ownerKey: "maya",
    notes: "Spesifikasi ketat: sulphur maksimal 0,6%. Perlu konfirmasi dari tim produksi.",
  },
  {
    key: "katulistiwa",
    companyName: "PT Semen Katulistiwa",
    country: "Indonesia",
    city: "Pontianak",
    contactPerson: "Slamet Riyadi",
    contactRole: "Procurement Head",
    contactEmail: "slamet.r@semenkatulistiwa.example.id",
    contactPhone: "+62 561 733 900",
    source: "Referral internal",
    status: "terkualifikasi",
    ownerKey: "dewi",
    notes: "Kebutuhan domestik untuk kiln. Volume kecil tapi rutin bulanan.",
  },
  {
    key: "nusajaya",
    companyName: "PT Pembangkit Listrik Nusa Jaya",
    country: "Indonesia",
    city: "Surabaya",
    contactPerson: "Andi Kurniawan",
    contactRole: "Manajer Bahan Bakar",
    contactEmail: "andi.k@plnusajaya.example.id",
    contactPhone: "+62 31 5020 700",
    source: "Tender terbuka",
    status: "terkualifikasi",
    ownerKey: "rizky",
    notes: "Wajib memenuhi ketentuan DMO. Kontrak payung 12 bulan.",
  },
  {
    key: "yuhan",
    companyName: "Taiwan Yuhan Energy Corporation",
    country: "Taiwan",
    city: "Kaohsiung",
    contactPerson: "Lee Chia Hao",
    contactRole: "Purchasing Manager",
    contactEmail: "ch.lee@yuhanenergy.example.tw",
    contactPhone: "+886 7 335 2200",
    source: "Inbound email",
    status: "tidak_memenuhi_syarat",
    ownerKey: "maya",
    notes: "Meminta spesifikasi NAR 6000 yang tidak tersedia dari tambang kami.",
  },
  {
    key: "sentosa",
    companyName: "Sentosa Power Sdn Bhd",
    country: "Malaysia",
    city: "Kuala Lumpur",
    contactPerson: "Ahmad Faizal",
    contactRole: "Fuel Trading Lead",
    contactEmail: "faizal@sentosapower.example.my",
    contactPhone: "+60 3 2166 8800",
    source: "Referral mitra trading",
    status: "tidak_aktif",
    ownerKey: "dewi",
    notes: "Menunda rencana pembelian karena perubahan bauran energi.",
  },
];

export interface SeedOpportunity {
  key: string;
  prospectKey: string;
  title: string;
  gar: number;
  tm: number;
  ash: number;
  sulphur: number;
  volume: number;
  price: number;
  deliveryTerm: string;
  /** days from today; negative = past */
  expectedCloseInDays: number;
  status: "on_progress" | "pending" | "close" | "drop";
  ownerKey: string;
  createdDaysAgo: number;
  history: { to: "on_progress" | "pending" | "close" | "drop"; reason: string; daysAgo: number }[];
}

export const OPPORTUNITIES: SeedOpportunity[] = [
  {
    key: "fujian-q4",
    prospectKey: "fujian",
    title: "Pasokan GAR 4200 — Fujian Xinyuan, kontrak payung 300.000 MT",
    gar: 4200,
    tm: 32.5,
    ash: 5.2,
    sulphur: 0.45,
    volume: 300000,
    price: 54.5,
    deliveryTerm: "FOB Vessel",
    expectedCloseInDays: -40,
    status: "close",
    ownerKey: "dewi",
    createdDaysAgo: 150,
    history: [
      { to: "pending", reason: "Menunggu konfirmasi spesifikasi dari tim tambang.", daysAgo: 120 },
      { to: "on_progress", reason: "Spesifikasi dikonfirmasi, negosiasi harga dilanjutkan.", daysAgo: 95 },
      { to: "close", reason: "Harga dan term disepakati, dilanjutkan ke kontrak payung.", daysAgo: 40 },
    ],
  },
  {
    key: "nusajaya-dmo",
    prospectKey: "nusajaya",
    title: "Kontrak DMO PLTU Nusa Jaya — 180.000 MT",
    gar: 4200,
    tm: 33,
    ash: 5.8,
    sulphur: 0.5,
    volume: 180000,
    price: 49.75,
    deliveryTerm: "FOB Barge",
    expectedCloseInDays: -25,
    status: "close",
    ownerKey: "rizky",
    createdDaysAgo: 120,
    history: [
      { to: "close", reason: "Menang tender, lanjut ke penandatanganan kontrak payung.", daysAgo: 25 },
    ],
  },
  {
    key: "hantai-longterm",
    prospectKey: "hantai",
    title: "Guangdong Hantai — pasokan tahunan 240.000 MT",
    gar: 4200,
    tm: 32,
    ash: 5,
    sulphur: 0.42,
    volume: 240000,
    price: 56.0,
    deliveryTerm: "FOB Vessel",
    expectedCloseInDays: 20,
    status: "on_progress",
    ownerKey: "rizky",
    createdDaysAgo: 60,
    history: [
      { to: "on_progress", reason: "Proposal harga dikirim, menunggu tanggapan buyer.", daysAgo: 30 },
    ],
  },
  {
    key: "daiphong-blend",
    prospectKey: "daiphong",
    title: "Dai Phong Energy — GAR 3400 untuk blending, 120.000 MT",
    gar: 3400,
    tm: 38,
    ash: 6.5,
    sulphur: 0.3,
    volume: 120000,
    price: 41.5,
    deliveryTerm: "CIF Hai Phong",
    expectedCloseInDays: 15,
    status: "on_progress",
    ownerKey: "dewi",
    createdDaysAgo: 45,
    history: [],
  },
  {
    key: "katulistiwa-kiln",
    prospectKey: "katulistiwa",
    title: "PT Semen Katulistiwa — pasokan kiln 36.000 MT",
    gar: 4200,
    tm: 32,
    ash: 5.5,
    sulphur: 0.48,
    volume: 36000,
    price: 52.0,
    deliveryTerm: "FOB Barge",
    expectedCloseInDays: 30,
    status: "on_progress",
    ownerKey: "dewi",
    createdDaysAgo: 35,
    history: [],
  },
  {
    key: "luzon-annual",
    prospectKey: "luzon",
    title: "Luzon Prime Power — pasokan tahunan 150.000 MT",
    gar: 4200,
    tm: 33,
    ash: 5.4,
    sulphur: 0.46,
    volume: 150000,
    price: 57.25,
    deliveryTerm: "CIF Manila",
    expectedCloseInDays: 75,
    status: "pending",
    ownerKey: "rizky",
    createdDaysAgo: 70,
    history: [
      {
        to: "pending",
        reason: "Buyer masih terikat kontrak berjalan sampai kuartal depan.",
        daysAgo: 20,
      },
    ],
  },
  {
    key: "bharat-trial",
    prospectKey: "bharat",
    title: "Bharat Surya Power — trial cargo 55.000 MT",
    gar: 4200,
    tm: 33.5,
    ash: 5.9,
    sulphur: 0.52,
    volume: 55000,
    price: 53.0,
    deliveryTerm: "CIF Mundra",
    expectedCloseInDays: 50,
    status: "on_progress",
    ownerKey: "maya",
    createdDaysAgo: 20,
    history: [],
  },
  {
    key: "sejong-spec",
    prospectKey: "sejong",
    title: "Korea Sejong Power — permintaan spesifikasi rendah sulphur",
    gar: 4600,
    tm: 30,
    ash: 4.8,
    sulphur: 0.6,
    volume: 90000,
    price: 61.0,
    deliveryTerm: "CIF Busan",
    expectedCloseInDays: 60,
    status: "pending",
    ownerKey: "maya",
    createdDaysAgo: 25,
    history: [
      { to: "pending", reason: "Menunggu hasil uji laboratorium batch terbaru.", daysAgo: 10 },
    ],
  },
  {
    key: "yuhan-nar6000",
    prospectKey: "yuhan",
    title: "Taiwan Yuhan Energy — permintaan NAR 6000",
    gar: 6000,
    tm: 22,
    ash: 4.2,
    sulphur: 0.55,
    volume: 80000,
    price: 92.0,
    deliveryTerm: "CIF Kaohsiung",
    expectedCloseInDays: -10,
    status: "drop",
    ownerKey: "maya",
    createdDaysAgo: 80,
    history: [
      {
        to: "drop",
        reason: "Spesifikasi NAR 6000 tidak tersedia dari tambang kami. Tidak dilanjutkan.",
        daysAgo: 10,
      },
    ],
  },
  {
    key: "sentosa-spot",
    prospectKey: "sentosa",
    title: "Sentosa Power — spot cargo 45.000 MT",
    gar: 3400,
    tm: 38,
    ash: 6.8,
    sulphur: 0.35,
    volume: 45000,
    price: 40.0,
    deliveryTerm: "FOB Vessel",
    expectedCloseInDays: -30,
    status: "drop",
    ownerKey: "dewi",
    createdDaysAgo: 100,
    history: [
      { to: "pending", reason: "Buyer menunda keputusan pembelian.", daysAgo: 60 },
      { to: "drop", reason: "Buyer membatalkan rencana pembelian untuk tahun ini.", daysAgo: 30 },
    ],
  },
  {
    key: "fujian-spot",
    prospectKey: "fujian",
    title: "Fujian Xinyuan — tambahan spot cargo 60.000 MT",
    gar: 4200,
    tm: 32.5,
    ash: 5.2,
    sulphur: 0.44,
    volume: 60000,
    price: 55.5,
    deliveryTerm: "FOB Vessel",
    expectedCloseInDays: 25,
    status: "on_progress",
    ownerKey: "dewi",
    createdDaysAgo: 15,
    history: [],
  },
  {
    key: "hantai-trial",
    prospectKey: "hantai",
    title: "Guangdong Hantai — trial cargo GAR 3400",
    gar: 3400,
    tm: 37.5,
    ash: 6.2,
    sulphur: 0.33,
    volume: 50000,
    price: 42.0,
    deliveryTerm: "FOB Vessel",
    expectedCloseInDays: 40,
    status: "on_progress",
    ownerKey: "rizky",
    createdDaysAgo: 12,
    history: [],
  },
];

export interface SeedMeetingNote {
  prospectKey: string;
  opportunityKey?: string;
  daysAgo: number;
  location: string;
  attendees: string;
  summary: string;
  nextAction: string;
  nextActionInDays: number | null;
  authorKey: string;
}

export const MEETING_NOTES: SeedMeetingNote[] = [
  {
    prospectKey: "fujian",
    opportunityKey: "fujian-q4",
    daysAgo: 140,
    location: "Video call",
    attendees: "Chen Wei Lin (Fujian Xinyuan), Dewi Anggraini, Bagus Setiawan",
    summary:
      "Buyer menyampaikan kebutuhan pasokan GAR 4200 sekitar 300.000 MT untuk periode 12 bulan. " +
      "Referensi harga yang digunakan buyer adalah ICI-3 dengan penyesuaian kualitas. " +
      "Buyer meminta skema kontrak payung dengan pengiriman bertahap per kuartal.",
    nextAction: "Kirim indikasi harga berdasarkan ICI-3 rata-rata 30 hari terakhir.",
    nextActionInDays: -133,
    authorKey: "dewi",
  },
  {
    prospectKey: "fujian",
    opportunityKey: "fujian-q4",
    daysAgo: 96,
    location: "Kantor Jakarta",
    attendees: "Chen Wei Lin (Fujian Xinyuan), Dewi Anggraini, Hendra Wijaya",
    summary:
      "Pembahasan spesifikasi teknis selesai. Tim tambang mengonfirmasi ketersediaan GAR 4200 " +
      "dengan TM 32,5% dan sulphur 0,45%. Negosiasi harga berlanjut pada kisaran USD 54–56 per MT.",
    nextAction: "Siapkan Sales Approval Form untuk persetujuan manajemen.",
    nextActionInDays: -90,
    authorKey: "dewi",
  },
  {
    prospectKey: "nusajaya",
    opportunityKey: "nusajaya-dmo",
    daysAgo: 110,
    location: "Kantor Surabaya",
    attendees: "Andi Kurniawan (Nusa Jaya), Rizky Pratama",
    summary:
      "Penjelasan tender pasokan batubara DMO untuk PLTU. Volume 180.000 MT selama 12 bulan, " +
      "dengan pengiriman bulanan. Harga mengikuti ketentuan harga jual DMO.",
    nextAction: "Siapkan dokumen tender dan jadwal pengiriman.",
    nextActionInDays: -100,
    authorKey: "rizky",
  },
  {
    prospectKey: "hantai",
    opportunityKey: "hantai-longterm",
    daysAgo: 55,
    location: "Coaltrans Asia, Bali",
    attendees: "Liu Jian Hong (Guangdong Hantai), Rizky Pratama, Bagus Setiawan",
    summary:
      "Buyer mencari pasokan tahunan 240.000 MT untuk PLTU captive. Saat ini memakai dua pemasok " +
      "dan ingin menambah satu pemasok cadangan. Sangat memperhatikan konsistensi kualitas.",
    nextAction: "Kirim proposal harga dan profil kualitas enam bulan terakhir.",
    nextActionInDays: -40,
    authorKey: "rizky",
  },
  {
    prospectKey: "hantai",
    opportunityKey: "hantai-longterm",
    daysAgo: 28,
    location: "Video call",
    attendees: "Liu Jian Hong (Guangdong Hantai), Rizky Pratama",
    summary:
      "Buyer memberi tanggapan awal atas proposal. Harga dianggap sedikit di atas pasar " +
      "dibandingkan CCI-5500 yang mereka pantau. Meminta penyesuaian sekitar USD 1,5 per MT.",
    nextAction: "Bandingkan harga usulan dengan tren CCI-5500 tiga bulan terakhir sebelum revisi.",
    nextActionInDays: 3,
    authorKey: "rizky",
  },
  {
    prospectKey: "daiphong",
    opportunityKey: "daiphong-blend",
    daysAgo: 42,
    location: "Video call",
    attendees: "Nguyen Van Tuan (Dai Phong), Dewi Anggraini",
    summary:
      "Kebutuhan GAR 3400 sebesar 120.000 MT untuk blending. Pembayaran LC at sight. " +
      "Buyer meminta jadwal pengiriman empat tahap.",
    nextAction: "Konfirmasi ketersediaan kapal dan jadwal laycan.",
    nextActionInDays: 5,
    authorKey: "dewi",
  },
  {
    prospectKey: "katulistiwa",
    opportunityKey: "katulistiwa-kiln",
    daysAgo: 33,
    location: "Kantor Pontianak",
    attendees: "Slamet Riyadi (Semen Katulistiwa), Dewi Anggraini",
    summary:
      "Kebutuhan rutin 3.000 MT per bulan untuk kiln. Buyer menginginkan kontrak 12 bulan " +
      "dengan harga tetap agar mudah dianggarkan.",
    nextAction: "Hitung harga tetap 12 bulan dengan mempertimbangkan tren ICI-3.",
    nextActionInDays: 2,
    authorKey: "dewi",
  },
  {
    prospectKey: "luzon",
    opportunityKey: "luzon-annual",
    daysAgo: 22,
    location: "Video call",
    attendees: "Ramon Villanueva (Luzon Prime), Rizky Pratama",
    summary:
      "Buyer masih terikat kontrak berjalan sampai kuartal depan. Terbuka untuk pembicaraan " +
      "pasokan tahun berikutnya dan meminta tetap dikirimi pembaruan harga bulanan.",
    nextAction: "Kirim pembaruan harga bulanan dan jadwalkan pertemuan kuartal depan.",
    nextActionInDays: 8,
    authorKey: "rizky",
  },
  {
    prospectKey: "bharat",
    opportunityKey: "bharat-trial",
    daysAgo: 18,
    location: "Video call",
    attendees: "Arjun Mehta (Bharat Surya), Maya Kusuma",
    summary:
      "Kontak awal. Buyer tertarik melakukan trial cargo 55.000 MT sebelum membahas kontrak " +
      "jangka panjang. Meminta referensi pembeli lain di kawasan.",
    nextAction: "Verifikasi kelayakan kredit buyer melalui bank koresponden.",
    nextActionInDays: 4,
    authorKey: "maya",
  },
  {
    prospectKey: "sejong",
    opportunityKey: "sejong-spec",
    daysAgo: 12,
    location: "Video call",
    attendees: "Park Min Jun (Korea Sejong), Maya Kusuma, Bagus Setiawan",
    summary:
      "Buyer memerlukan sulphur maksimal 0,6% dan konsistensi kualitas tinggi. " +
      "Hasil uji laboratorium batch terbaru diperlukan sebelum pembicaraan harga.",
    nextAction: "Minta hasil uji laboratorium batch terbaru dari tim produksi.",
    nextActionInDays: 6,
    authorKey: "maya",
  },
  {
    prospectKey: "yuhan",
    opportunityKey: "yuhan-nar6000",
    daysAgo: 15,
    location: "Email",
    attendees: "Lee Chia Hao (Taiwan Yuhan), Maya Kusuma",
    summary:
      "Buyer hanya menerima NAR 6000 yang tidak tersedia dari tambang kami. " +
      "Disepakati untuk tidak melanjutkan pembicaraan pada spesifikasi tersebut.",
    nextAction: "Tandai opportunity sebagai Drop dan simpan kontak untuk spesifikasi lain.",
    nextActionInDays: null,
    authorKey: "maya",
  },
  {
    prospectKey: "fujian",
    opportunityKey: "fujian-spot",
    daysAgo: 9,
    location: "Video call",
    attendees: "Chen Wei Lin (Fujian Xinyuan), Dewi Anggraini",
    summary:
      "Buyer meminta tambahan spot cargo 60.000 MT di luar kontrak payung yang berjalan, " +
      "untuk pengiriman kuartal ini. Harga mengikuti indeks berjalan.",
    nextAction: "Cek sisa kuota produksi dan siapkan Sales Approval Form.",
    nextActionInDays: 1,
    authorKey: "dewi",
  },
  {
    prospectKey: "hantai",
    opportunityKey: "hantai-trial",
    daysAgo: 6,
    location: "Video call",
    attendees: "Liu Jian Hong (Guangdong Hantai), Rizky Pratama",
    summary:
      "Selain kontrak tahunan, buyer ingin mencoba GAR 3400 sebanyak 50.000 MT untuk blending " +
      "di PLTU kedua mereka.",
    nextAction: "Siapkan indikasi harga GAR 3400 berdasarkan ICI-4.",
    nextActionInDays: 2,
    authorKey: "rizky",
  },
  {
    prospectKey: "nusajaya",
    daysAgo: 4,
    location: "Kantor Surabaya",
    attendees: "Andi Kurniawan (Nusa Jaya), Rizky Pratama, Bagus Setiawan",
    summary:
      "Evaluasi pengiriman tahap pertama. Realisasi tonase sesuai rencana, tidak ada keluhan " +
      "kualitas. Buyer membuka kemungkinan penambahan volume pada tahap ketiga.",
    nextAction: "Bahas kemungkinan penambahan volume pada tahap ketiga.",
    nextActionInDays: 14,
    authorKey: "rizky",
  },
];
