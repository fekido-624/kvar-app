# Deploy Atas TrueNAS SCALE

Panduan ini ikut architecture semasa projek:

- Next.js
- Prisma
- SQLite
- Docker

Ini ialah laluan paling mudah sebab anda tak perlu tukar database atau refactor app.

## 1. Apa yang akan kita deploy

Container app ini perlukan 3 storage kekal:

- `data` untuk fail SQLite
- `templates` untuk template resit yang diupload dari UI
- `public-templates` untuk template Data Parcel dalam `public/templates`

Dalam repo ini, fail deploy yang digunakan ialah:

- `Dockerfile`
- `docker-compose.yml`

## 2. Sebelum mula

Pastikan TrueNAS SCALE anda ada:

- Apps atau Docker support
- satu folder/dataset untuk projek ini
- akses terminal shell atau Files
- domain atau IP dalaman untuk akses app

## 3. Upload projek ke TrueNAS

Cara paling mudah:

1. Simpan project ini ke GitHub.
2. Di TrueNAS, clone repo itu ke satu folder, contoh:

```bash
/mnt/tank/apps/kvar
```

Kalau tak guna GitHub, anda juga boleh upload folder project secara manual.

## 4. Sediakan folder storage

Dalam folder project, cipta folder berikut:

```text
docker-data/
docker-data/data/
docker-data/templates/
docker-data/public-templates/
```

Fungsi setiap folder:

- `docker-data/data` simpan `dev.db`
- `docker-data/templates` simpan `resit-template.xlsx`
- `docker-data/public-templates` simpan `data-parcel-template.xlsx`

## 5. Copy template sedia ada

Jika anda sudah ada template Data Parcel dalam projek local, copy fail itu ke:

```text
docker-data/public-templates/data-parcel-template.xlsx
```

Kalau ada template resit custom, letak juga di:

```text
docker-data/templates/resit-template.xlsx
```

## 6. Tukar secret production

Buka `docker-compose.yml` dan tukar nilai ini:

- `AUTH_SECRET`
- `GEMINI_API_KEY` jika anda guna fungsi AI

Contoh secret yang baik:

```text
AUTH_SECRET=3bb8d9c7f8c04d10a6f2d9d1c0f4e1238b91f5b2e1c84776
```

## 7. Build dan naikkan app

Dalam terminal pada folder project, jalankan:

```bash
docker compose build
docker compose up -d
```

Apa yang akan berlaku:

- image app dibina
- Prisma client dijana
- Next app dibuild
- container start
- migration dijalankan automatik

## 8. Semak app berjalan

Lepas siap, buka:

```text
http://IP-TRUENAS:3000
```

Jika tak jalan, semak log:

```bash
docker compose logs -f
```

## 9. Bila anda buat perubahan kod

Setiap kali anda ubah kod dan mahu update production:

```bash
docker compose build
docker compose up -d
```

Kalau ubah schema Prisma juga, pastikan migration sudah ada dalam repo, kemudian deploy semula. Container akan jalankan:

```bash
npx prisma migrate deploy
```

## 10. Backup yang patut dibuat

Untuk app ini, minimum backup ialah:

- `docker-data/data`
- `docker-data/templates`
- `docker-data/public-templates`

Kalau anda guna snapshot dataset TrueNAS, tiga folder ini paling penting.

## 11. Struktur fail penting bila nak ubah app kemudian

- `src/app/(authenticated)/receipts/page.tsx`: UI Resit
- `src/app/api/receipts/route.ts`: simpan, list, delete all, reset
- `src/app/api/receipts/export/route.ts`: eksport resit
- `src/app/api/receipts/template/upload/route.ts`: upload template resit
- `src/app/api/data-parcel/export/route.ts`: eksport Data Parcel
- `src/lib/db.ts`: sambungan Prisma ke SQLite
- `prisma/schema.prisma`: struktur database

## 12. Susunan paling mudah untuk anda ikut

1. Upload repo ke TrueNAS.
2. Cipta folder `docker-data`.
3. Copy template Excel ke folder yang betul.
4. Tukar `AUTH_SECRET` dalam `docker-compose.yml`.
5. Jalankan `docker compose build`.
6. Jalankan `docker compose up -d`.
7. Buka app pada port `3000`.
8. Bila ubah kod, build dan up semula.

## 13. Nota penting

- Setup ini sengaja kekalkan SQLite sebab itu paling dekat dengan architecture semasa.
- Bila sistem makin besar, baru pertimbangkan PostgreSQL.
- Jika anda nak akses dari internet, letak reverse proxy di depan container ini dan aktifkan SSL.