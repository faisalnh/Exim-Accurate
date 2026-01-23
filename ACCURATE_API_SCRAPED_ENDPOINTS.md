# Accurate API — Scraped Reference (Unverified / Possibly Incomplete)

Dokumen ini adalah hasil **scraping** dari halaman web dokumentasi API Accurate. Konten di bawah ini **mungkin tidak lengkap** atau ada parameter/endpoint yang berubah. Jika AI menemukan informasi yang tidak lengkap, Anda akan diminta membantu mengambil info yang benar dari sumber resmi.

> Sumber scraping: halaman dokumentasi API Accurate (web).  
> Status: referensi sementara (unverified).

---

## Area Developer / API Dasar

Area DeveloperAplikasiDaftar APIAccurate StoreMAD Labs by Millennia World School  
Faisal NH  
Dokumentasi API  
API Dasar  
https://account.accurate.id

1.0.0#5249

/api  
API Accurate  
https://xyz.accurate.id/accurate

1.0.1#3600

---

## /api/access-privilege

### /detail.do (HTTP Method: GET, Scope: access_privilege_view)
Melihat detil data Akses Grup berdasarkan id atau identifier tertentu

**Parameter Request**

| Nama Parameter | Tipe Data | Harus diisi | Penjelasan |
| --- | --- | --- | --- |
| id | Long | Ya | Identitas unik dari sebuah record data. Didapatkan dari field id yang ada di setiap record data. Cth: 1, 2, 3 (Angka non desimal) |
| X-Session-ID (HTTP Header Parameter) | String | Tidak | Hanya dibutuhkan jika menggunakan Metode Otorisasi OAuth. Kode Session yang didapatkan dari response saat memanggil API /api/open-db.do. Cth: Halo Semua 123 |

### /list.do (HTTP Method: GET, Scope: access_privilege_view)
Melihat daftar data Akses Grup, dengan filter yang sesuai

**Parameter Request**

| Nama Parameter | Tipe Data | Harus diisi | Penjelasan |
| --- | --- | --- | --- |
| X-Session-ID (HTTP Header Parameter) | String | Tidak | Hanya dibutuhkan jika menggunakan Metode Otorisasi OAuth. Kode Session yang didapatkan dari response saat memanggil API /api/open-db.do. Cth: Halo Semua 123 |
| filter.keywords | Kata kunci pencarian data |  |  |
| filter.keywords.op | StringFilterOperator | Tidak | Jenis Operator penyaringan data (Default: EQUAL). Nilai: BETWEEN, CONTAIN, EMPTY, EQUAL, GREATER_EQUAL_THAN, GREATER_THAN, LESS_EQUAL_THAN, LESS_THAN, NOT_BETWEEN, NOT_EMPTY, NOT_EQUAL |
| filter.keywords.val[n] | String | Tidak | Nilai yang akan digunakan untuk menyaring data. Jika nilai parameter yang dikirimkan hanya satu, boleh tidak menggunakan index pada nama parameter ([n]). Untuk Operator EQUAL, NOT_EQUAL, BETWEEN dan NOT_BETWEEN nilai parameter "val" bisa lebih dari 1 (gunakan index [n]). Untuk Operator EMPTY dan NOT_EMPTY nilai parameter "val" akan diabaikan. Cth: Halo Semua 123 |
| keywords | String | Tidak | Kata kunci pencarian data. **PERHATIAN:** parameter ini ditandai "telah usang" dan dapat dihapus. Cth: Halo Semua 123 |
| sp | Pengaturan subset data per halaman dan pengurutan data |  |  |
| sp.page | Integer | Tidak | Halaman data. Mulai dari angka 1. Cth: 1, 2, 3 (Angka non desimal) |
| sp.pageSize | Integer | Tidak | Jumlah data per halaman. Default: 20. Cth: 1, 2, 3 (Angka non desimal) |
| sp.sort | String | Tidak | Urutkan data berdasarkan nama field dan cara pengurutan (ascending/descending). Contoh: name\|asc;no\|desc. Cth: Halo Semua 123 |

---

## /api/auto-number

### /list.do (HTTP Method: GET, Scope: auto_number_view)
Melihat daftar data Penomoran, dengan filter yang sesuai

**Parameter Request**

| Nama Parameter | Tipe Data | Harus diisi | Penjelasan |
| --- | --- | --- | --- |
| X-Session-ID (HTTP Header Parameter) | String | Tidak | Hanya dibutuhkan jika menggunakan Metode Otorisasi OAuth. Kode Session yang didapatkan dari response saat memanggil API /api/open-db.do. Cth: Halo Semua 123 |
| filter.keywords | Kata kunci pencarian data |  |  |
| filter.keywords.op | StringFilterOperator | Tidak | Jenis Operator penyaringan data (Default: EQUAL). Nilai: BETWEEN, CONTAIN, EMPTY, EQUAL, GREATER_EQUAL_THAN, GREATER_THAN, LESS_EQUAL_THAN, LESS_THAN, NOT_BETWEEN, NOT_EMPTY, NOT_EQUAL |
| filter.keywords.val[n] | String | Tidak | Nilai yang akan digunakan untuk menyaring data. Jika nilai parameter yang dikirimkan hanya satu, boleh tidak menggunakan index pada nama parameter ([n]). Untuk Operator EQUAL, NOT_EQUAL, BETWEEN dan NOT_BETWEEN nilai parameter "val" bisa lebih dari 1 (gunakan index [n]). Untuk Operator EMPTY dan NOT_EMPTY nilai parameter "val" akan diabaikan. Cth: Halo Semua 123 |
| filter.lastUpdate | Filter data berdasarkan Waktu perubahan data |  | Cth: 25/07/2015 14:38:45 |
| filter.lastUpdate.op | BasicFilterOperator | Tidak | Jenis Operator penyaringan data (Default: EQUAL). Nilai: BETWEEN, EMPTY, EQUAL, GREATER_EQUAL_THAN, GREATER_THAN, LESS_EQUAL_THAN, LESS_THAN, NOT_BETWEEN, NOT_EMPTY, NOT_EQUAL |
| filter.lastUpdate.val[n] | Timestamp | Tidak | Nilai waktu untuk filter. Cth: 31/03/2016 18:30:43 |
| filter.transactionType | Filter data berdasarkan nilai Jenis Transaksi |  |  |
| filter.transactionType.op | BasicFilterOperator | Tidak | Jenis Operator penyaringan data (Default: EQUAL). Nilai: BETWEEN, EMPTY, EQUAL, GREATER_EQUAL_THAN, GREATER_THAN, LESS_EQUAL_THAN, LESS_THAN, NOT_BETWEEN, NOT_EMPTY, NOT_EQUAL |
| filter.transactionType.val[n] | TransactionType | Tidak | Nilai jenis transaksi. (Daftar nilai sangat panjang pada hasil scraping). |
| sp | Pengaturan subset data per halaman dan pengurutan data |  |  |
| sp.page | Integer | Tidak | Halaman data. Mulai dari angka 1. Cth: 1, 2, 3 (Angka non desimal) |
| sp.pageSize | Integer | Tidak | Jumlah data per halaman. Default: 20. Cth: 1, 2, 3 (Angka non desimal) |
| sp.sort | String | Tidak | Urutkan data berdasarkan nama field dan cara pengurutan (ascending/descending). Contoh: name\|asc;no\|desc. Cth: Halo Semua 123 |

---

## Catatan

- Konten pada file ini hanya cuplikan awal dari hasil scraping yang sangat panjang.
- Jika Anda ingin seluruh hasil scraping dimasukkan 100% ke repo, kirimkan file sumber (mis. export HTML / TXT) atau minta saya untuk menambahkan bagian tertentu per endpoint.
