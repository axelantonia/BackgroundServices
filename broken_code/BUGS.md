# GudangKita - Bug Report

Dokumentasi bug yang ditemukan, penyebabnya, dan perbaikan yang dilakukan.

---

## CSS Bugs

### Bug #1: Gaya visual rusak menimpa desain asli
**Lokasi:** `style.css` baris 6-17 (akhir file)

**Gejala:**
- Background merah muda (`#ffe6e6`)
- Font Comic Sans MS
- Warna teks merah terang (`#e00000`)
- Topbar kuning dengan border dashed pink
- Container lebar 1400px tanpa max-width
- Judul ukuran 52px dengan text-shadow
- Stat cards hitam dengan border hijau dotted, dirotasi -2deg
- Panel dengan border ridge pink
- Table header cyan dengan teks merah
- Button dengan border outset, box-shadow hitam tebal, cursor crosshair
- Input search/select dengan border pink tebal

**Penyebab:**
Kode CSS "bug visual sengaja ditanam untuk latihan debugging" ditempatkan di akhir file, menimpa semua gaya sebelumnya karena spesifisitas yang sama dan urutan kaskade CSS.

**Perbaikan:**
Menghapus seluruh blok CSS bug (baris 5-17) dan menambahkan media query tambahan untuk breakpoint 480px agar lebih responsif di layar sangat kecil.

---

### Bug #2: Responsivitas tidak optimal di layar sangat kecil (< 480px)
**Lokasi:** `style.css` - media query hanya ada untuk 700px

**Gejala:**
- Toolbar tidak menumpuk dengan baik di mobile
- Dialog form terlalu lebar
- Padding container terlalu besar
- Tabel sulit di-scroll horizontal

**Penyebab:**
Hanya satu breakpoint media query (700px) yang tidak cukup untuk menangani berbagai ukuran layar mobile modern.

**Perbaikan:**
Menambahkan media query `@media(max-width:480px)` dengan:
- Toolbar berubah jadi kolom (flex-direction: column)
- Search dan select lebar penuh (100%)
- Padding container dikurangi
- Table-wrap margin negatif untuk full-width scroll
- Form row jadi kolom
- Dialog padding disesuaikan

---

## JavaScript Bugs

### Bug #3: Statistik "Total barang" dan "Total unit" tertukar
**Lokasi:** `app.js` baris 30-31 (fungsi `renderStats`)

**Gejala:**
- "Total barang" menampilkan total stok (sum of stock)
- "Total unit" menampilkan jumlah item (items.length)
- Label HTML: "Jenis barang terdaftar" (harusnya count item) dan "Unit di semua kategori" (harusnya sum stock)

**Penyebab:**
Logika perhitungan tertukar:
```js
// SALAH
document.querySelector('#total-items').textContent = items.reduce((sum, item) => sum + item.stock, 0);
document.querySelector('#total-units').textContent = items.length;
```

**Perbaikan:**
Menukar logika perhitungan:
```js
// BENAR
document.querySelector('#total-items').textContent = items.length;
document.querySelector('#total-units').textContent = items.reduce((sum, item) => sum + item.stock, 0);
```

---

### Bug #4: Perhitungan "Nilai inventaris" salah
**Lokasi:** `app.js` baris 33 (fungsi `renderStats`)

**Gejala:**
Nilai inventaris tidak sesuai dengan total nilai stok di tabel.

**Penyebab:**
Menggunakan penjumlahan (`+`) alih-alih perkalian (`*`) untuk menghitung nilai per item:
```js
// SALAH
items.reduce((sum, item) => sum + item.stock + item.price, 0)
```
Harusnya: `stock * price` untuk setiap item, lalu dijumlahkan.

**Perbaikan:**
```js
// BENAR
items.reduce((sum, item) => sum + item.stock * item.price, 0)
```

---

### Bug #5: Typo `valeu` pada event listener search
**Lokasi:** `app.js` baris 75

**Gejala:**
Error `Uncaught TypeError: Cannot read properties of undefined (reading 'toLowerCase')` saat mengetik di kolom pencarian.

**Penyebab:**
Typo `event.target.valeu` seharusnya `event.target.value`.

**Perbaikan:**
```js
searchTerm = event.target.value.toLowerCase();
```

---

### Bug #6: Typo `showModall()` pada dialog
**Lokasi:** `app.js` baris 86

**Gejala:**
Error `Uncaught TypeError: dialog.showModall is not a function` saat klik tombol "Tambah barang".

**Penyebab:**
Typo nama method: `showModall()` (dua 'l') seharusnya `showModal()`.

**Perbaikan:**
```js
dialog.showModal();
```

---

### Bug #7: Hapus barang menghapus item yang salah (off-by-one)
**Lokasi:** `app.js` baris 112

**Gejala:**
Klik hapus pada barang tertentu menghapus barang berikutnya, atau error jika item terakhir.

**Penyebab:**
```js
// SALAH
items.splice(index + 1, 1);
```
`index` sudah benar dari `findIndex`, tapi `splice` menggunakan `index + 1` sehingga menghapus item setelahnya.

**Perbaikan:**
```js
// BENAR
items.splice(index, 1);
```

---

### Bug #8: Filter kategori case-sensitive
**Lokasi:** `app.js` baris 80

**Gejala:**
Filter kategori tidak berfungsi karena nilai select option adalah "Elektronik", "Alat tulis", dll (capitalized), tapi filter mengubah ke lowercase.

**Penyebab:**
```js
selectedCategory = event.target.value.toLowerCase();
```
Sedangkan `item.category` di data adalah "Elektronik" (capitalized). Perbandingan `item.category === selectedCategory` akan selalu false.

**Perbaikan:**
Menghapus `.toLowerCase()` agar perbandingan case-sensitive sesuai data:
```js
selectedCategory = event.target.value;
```

---

### Bug #9: Ekspor CSV tidak lengkap dan tanpa escaping
**Lokasi:** `app.js` baris 118-125

**Gejala:**
- Kolom "Nilai Stok" tidak diekspor
- Nama barang dengan koma/quote merusak format CSV
- Tidak ada charset UTF-8 untuk karakter Indonesia

**Penyebab:**
CSV hanya 4 kolom, tanpa escaping proper, dan tipe MIME tidak include charset.

**Perbaikan:**
- Menambah kolom "Nilai Stok" (stock * price)
- Escaping double quote dengan `""` (standar RFC 4180)
- Menggunakan `text/csv;charset=utf-8;`

---

## Ringkasan Perbaikan

| # | File | Baris | Jenis | Status |
|---|------|-------|-------|--------|
| 1 | style.css | 5-17 | Visual/CSS | ✅ Fixed |
| 2 | style.css | - | Responsif | ✅ Enhanced |
| 3 | app.js | 30-31 | Logic/JS | ✅ Fixed |
| 4 | app.js | 33 | Logic/JS | ✅ Fixed |
| 5 | app.js | 75 | Typo/JS | ✅ Fixed |
| 6 | app.js | 86 | Typo/JS | ✅ Fixed |
| 7 | app.js | 112 | Logic/JS | ✅ Fixed |
| 8 | app.js | 80 | Logic/JS | ✅ Fixed |
| 9 | app.js | 118-125 | Feature/JS | ✅ Fixed |

---

## Verifikasi

Setelah perbaikan:
1. Buka `index.html` di browser
2. Buka Developer Tools → Console (harus tidak ada error)
3. Test fitur:
   - ✅ Pencarian berfungsi tanpa error
   - ✅ Filter kategori berfungsi
   - ✅ Sorting berfungsi
   - ✅ Tambah barang (dialog buka, simpan, tutup)
   - ✅ Hapus barang (item yang benar terhapus)
   - ✅ Reset data demo
   - ✅ Ekspor CSV (5 kolom, UTF-8)
   - ✅ Statistik cocok dengan tabel
   - ✅ Responsif di mobile (resize browser / DevTools device toolbar)