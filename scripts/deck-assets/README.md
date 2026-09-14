# CRM Batubara — Deck Presentasi

Usulan CRM terintegrasi dengan Intelijen Harga Batubara, untuk prospek bisnis
batubara (konteks H. Isam / Johnlin Group).

**Disiapkan oleh Rightjet · September 2026 · 18 slide · Bahasa Indonesia**

---

## Cara membuka

**Buka `index.html`** — klik dua kali. Tidak perlu Node, tidak perlu server,
tidak perlu koneksi internet. Berjalan di Chrome, Safari, Edge, dan Firefox.

Untuk versi cetak atau kirim email, gunakan `crm-batubara-deck.pdf` (18 halaman,
landscape).

## Kontrol saat presentasi

| Tombol | Fungsi |
|---|---|
| `→` `↓` `Space` `PageDown` | Slide berikutnya |
| `←` `↑` `PageUp` | Slide sebelumnya |
| `Home` / `End` | Slide pertama / terakhir |
| `F` | Layar penuh |

Titik navigasi di bawah dapat diklik untuk melompat ke slide tertentu. Tombol
**Cetak / PDF** mencetak satu slide per halaman.

Slide tertentu dapat dibagikan langsung lewat anchor, misalnya `index.html#8`
untuk slide 8.

## Alur presentasi

| # | Slide | Inti |
|---|---|---|
| 1 | Sampul | — |
| 2 | Tantangan bisnis saat ini | Informasi tersebar, keputusan melambat |
| 3 | Biaya dari proses hari ini | Riwayat harga hanya tersimpan di inbox |
| 4 | Keterbatasan pilihan yang ada | Salesforce, EspoCRM, CRM internal |
| 5 | Solusi: CRM terintegrasi | Delapan modul |
| 6 | Alur komersial end-to-end | Prospek → Opportunity → Approval → Kontrak → DO |
| 7 | Produk: Opportunity & riwayat status | Tangkapan layar |
| 8 | **Produk: Persetujuan & harga terkunci** | **Pembeda utama** |
| 9 | Produk: Kontrak & realisasi pengiriman | Rencana vs realisasi |
| 10 | Intelijen Harga Batubara | Sebelum / sesudah |
| 11 | Produk: Harga hari ini & 7 hari | Tampilan utama harian |
| 12 | Produk: Perbandingan antar tahun | Menjawab pertanyaan dari pertemuan |
| 13 | Produk: Dashboard eksekutif | Visibilitas manajemen |
| 14 | Integrasi dengan lingkungan existing | Batas sistem yang jujur |
| 15 | Jalur menuju data harga sebenarnya | Satu titik sambung |
| 16 | Keamanan data & jalur on-premise | Data tetap internal |
| 17 | Tahapan implementasi | Empat tahap |
| 18 | Demo & langkah berikutnya | Transisi ke demo langsung |

Slide 8 adalah inti penawaran: harga indeks pada hari pengajuan ikut terkunci
pada Sales Approval Form, sehingga manajemen menilai harga terhadap acuan pasar
hari itu.

## Penting sebelum presentasi

- **Seluruh data pada deck bersifat sintetis.** Tidak ada nama pembeli, kontrak,
  atau harga yang nyata. Angka harga dihasilkan oleh adapter mock.
- **Tangkapan layar adalah aplikasi yang benar-benar berjalan**, bukan mockup.
- Setiap slide membedakan apa yang **berfungsi di demo** dari apa yang masih
  **usulan**. Jangan menghapus penanda tersebut.
- Angka jumlah email pada slide 3 adalah **estimasi aritmetika** (4 sumber ×
  hari kerja), bukan hasil pengukuran — sudah tertulis di slide.
- Koneksi ke API indeks harga, SAP, MariaDB, dan CRM PHP existing **belum
  dibangun**. Slide 14 dan 15 menyatakannya secara eksplisit.

## Isi folder

```
index.html                 Deck standalone
assets/deck.css            Stylesheet
assets/deck/*.png          Tangkapan layar produk
assets/brand/*.png         Logo Rightjet
crm-batubara-deck.pdf      Versi cetak, 18 halaman landscape
```

## Memperbarui deck

Deck ini dihasilkan dari kode sumber prototipe CRM, bukan diedit langsung.
Di repositori prototipe:

```bash
npm run deck:capture   # ambil ulang tangkapan layar dari aplikasi berjalan
npm run deck:export    # hasilkan folder ini beserta PDF
```

Jangan mengedit `index.html` secara manual — perubahan akan hilang pada ekspor
berikutnya.
