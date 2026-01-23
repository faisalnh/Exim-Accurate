# Integrasi API Accurate Online dengan API Token
**Version:** 1.0.3  
**Date:** 30 September 2025

## Pendahuluan

Dokumen ini menjelaskan cara integrasi sistem eksternal dengan Accurate Online menggunakan metode otorisasi **API Token**.

*   **API Token:** Token yang digunakan oleh Aplikasi Pihak Ketiga (Developer) untuk melakukan request API ke Database (Data Usaha) milik Pengguna Accurate Online (User).
*   **Otorisasi:** API Token merepresentasikan otorisasi yang diberikan User. Hak akses terbatas sesuai hak akses User di Data Usaha tersebut.
*   **Batasan:** 
    *   Satu User hanya dapat membuat satu API Token per Aplikasi Developer untuk satu Data Usaha.
    *   **Rate Limit:** 8 request per detik.
    *   **Concurrency Limit:** 8 proses API paralel.
*   **Masa Berlaku:** Tidak ada waktu expire selama User memiliki hak akses. User dapat mencabut (revoke) token kapan saja.

## Alur Integrasi (Otorisasi)

1.  **Pendaftaran Aplikasi:** Developer mendaftarkan aplikasi di Area Developer Accurate Online.
2.  **Install Aplikasi:** User menginstall aplikasi Developer ke Data Usaha mereka menggunakan **App Key**.
3.  **Buat API Token:** User membuat API Token untuk aplikasi yang telah diinstall.
4.  **Request API:** Developer menggunakan API Token, App Key, dan Signature Secret untuk melakukan request.

---

## 1. Pendaftaran Aplikasi (Developer)

1.  Login ke [Area Developer Accurate Online](https://account.accurate.id/developer).
2.  Buat Aplikasi Baru.
3.  Dapatkan **App Key** dan **Signature Secret** setelah mengaktifkan API Token pada aplikasi tersebut.
    *   **App Key:** Digunakan User untuk install aplikasi.
    *   **Signature Secret:** Digunakan Developer untuk signing request (X-Api-Signature).

## 2. Install Aplikasi & Buat Token (User)

1.  User login ke [https://account.accurate.id](https://account.accurate.id) dan masuk ke Data Usaha.
2.  Buka **Pengaturan** -> **Accurate Store** -> **Aplikasi Saya**.
3.  Klik **Install Aplikasi** dan masukkan **App Key** dari Developer.
    *   *Syarat:* User harus memiliki hak akses **Administrator**.
4.  Setelah terinstall, buka **Pengaturan** -> **Accurate Store** -> **API Token**.
5.  Pilih Aplikasi, lalu klik **Buat API Token**.
    *   *Syarat:* User minimal memiliki hak akses **Operator**.
6.  User menyetujui syarat dan ketentuan.
7.  **API Token** ditampilkan. User harus menyalin dan memberikannya kepada Developer secara aman.

---

## 3. Struktur Request API

Setiap request ke API Accurate Online memerlukan HTTP Headers khusus.

### Headers Wajib

| Header | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `Authorization` | Bearer Token | Nilai API Token dari User. Contoh: `Bearer <API_TOKEN>` |
| `X-Api-Timestamp` | String | Waktu request. Toleransi selisih waktu server maks 600 detik. |
| `X-Api-Signature` | String | Signature keamanan menggunakan HMAC-SHA256. |
| `X-Language-Profile`| String | (Opsional) Bahasa pesan error: `ID` (Indonesian), `US` (English), `CN` (Chinese). |

### Format X-Api-Timestamp
Format yang didukung:
*   `dd/mm/yyyy hh:nn:ss` (e.g., `25/12/2023 13:42:39`)
*   ISO 8601 (e.g., `2023-11-02T09:32:43Z`)
*   Unix Timestamp (Second atau Millisecond)

### Cara Membuat X-Api-Signature

Signature dibuat dengan mengenkripsi `X-Api-Timestamp` menggunakan algoritma **HMAC-SHA256** dengan key **Signature Secret**.

**Langkah-langkah:**
1.  **Plain Text:** Gunakan nilai `X-Api-Timestamp` (persis sama dengan header).
2.  **Secret Key:** Gunakan `Signature Secret` aplikasi.
3.  **Hash:** Lakukan HMAC-SHA256.
4.  **Encode:** Hasil hash (byte) di-encode ke **Base64** atau **Hex**.

**Contoh:**
*   Timestamp: `02/11/2023 09:01:01`
*   Secret: `31d49b3dc632614495ff8071e5be44a1`
*   Result (Base64): `8NxvylwwMcjGyzVXK0qbwNvFFuzHpwE9tECllVwLkbo=`

---

## 4. Endpoints & Host Dinamis

### Mendapatkan Host API (`/api-token.do`)

Request pertama yang disarankan adalah ke `/api-token.do` untuk mendapatkan informasi sesi dan **host** database yang benar.

**Request:**
*   **URL:** `https://account.accurate.id/api/api-token.do`
*   **Method:** `POST`
*   **Headers:** Authorization, X-Api-Timestamp, X-Api-Signature

**Response (JSON):**
```json
{
  "s": true,
  "d": {
    "data usaha": {
      "host": "https://zeus.accurate.id",  <-- PENTING: Gunakan ini untuk request selanjutnya
      "id": 96400,
      "alias": "PT AOL User",
      ...
    },
    "user": { ... },
    "tokenType": "api"
  }
}
```

### Request Transaksi (Contoh: Sales Invoice)

Gunakan `host` yang didapatkan dari langkah sebelumnya (misal: `https://zeus.accurate.id`).

**Request:**
*   **URL:** `https://zeus.accurate.id/accurate/api/sales-invoice/list.do`
*   **Method:** `GET` / `POST`
*   **Headers:** Lengkap (Auth, Timestamp, Signature)
*   **Params/Body:** Sesuai dokumentasi endpoint spesifik.

### Penanganan Perubahan Host (Redirect 308)
Jika host database berubah, API akan mengembalikan response code **308 (Permanent Redirect)**.
*   Client harus mengaktifkan **Automatically Follow Redirects**.
*   Pastikan method (POST/GET) dan Header Authorization tetap terbawa saat redirect.
*   Update konfigurasi host lokal dengan nilai host baru dari response header/body.
*   Disarankan mengecek `/api-token.do` secara berkala (misal: 30 hari sekali).

---

## 5. Daftar Kesalahan (Error Codes)

| Pesan Error | Penyebab & Solusi |
| :--- | :--- |
| `Unauthorized` | API Token belum dikirim. Kirim header `Authorization: Bearer ...`. |
| `Invalid_token` | Token salah. Periksa kembali nilai API Token. |
| `Invalid or Revoked API Token` | Token sudah tidak valid atau dicabut User. Minta User generate token baru. |
| `Header X-Api-Signature is required` | Header signature hilang. |
| `Header X-Api-Signature invalid` | Perhitungan signature salah. Cek algo HMAC-SHA256 dan Secret Key. |
| `Header X-Api-Timestamp is required` | Header timestamp hilang. |
| `Header X-Api-Timestamp invalid` | Format timestamp salah. Gunakan `dd/mm/yyyy hh:nn:ss`. |
| `Header X-Api Timestamp difference more than 600 seconds...` | Selisih waktu client dan server > 600 detik. Sinkronkan jam client. |

## 6. Referensi Tambahan

*   **Daftar Endpoint API:** [https://account.accurate.id/developer/api-docs.do](https://account.accurate.id/developer/api-docs.do)
*   **JSON Schema:** [https://account.accurate.id/open-api/json.do](https://account.accurate.id/open-api/json.do)
*   **Contoh Source Code:** [https://github.com/aol-integration](https://github.com/aol-integration)

---

## Lampiran A — Hasil Scraping Endpoint (Referensi, Mungkin Tidak Lengkap)

Catatan: bagian ini adalah hasil **scraping** dari halaman web dokumentasi API Accurate. Beberapa informasi bisa **tidak lengkap / tidak sinkron** dengan dokumentasi resmi. Jika ada bagian yang terlihat kurang lengkap, AI akan menandai dan meminta bantuan Anda untuk mengambil informasi yang benar dari sumber resmi.

File referensi: `ACCURATE_API_SCRAPED_ENDPOINTS.md`

Link: [ACCURATE_API_SCRAPED_ENDPOINTS.md](ACCURATE_API_SCRAPED_ENDPOINTS.md)
