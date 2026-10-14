const STORAGE_KEY = 'gudangkita-items';

const demoItems = [
  { id: 1, name: 'Keyboard Wireless K380', category: 'Elektronik', stock: 14, price: 385000, icon: '⌨' },
  { id: 2, name: 'Kertas A4 80gsm', category: 'Alat tulis', stock: 4, price: 52000, icon: '▤' },
  { id: 3, name: 'Kursi Kerja Ergo', category: 'Furnitur', stock: 7, price: 1250000, icon: '▣' },
  { id: 4, name: 'Mouse Bluetooth M350', category: 'Elektronik', stock: 3, price: 245000, icon: '◉' },
  { id: 5, name: 'Pulpen Gel Hitam (12 pcs)', category: 'Alat tulis', stock: 28, price: 36000, icon: '✎' },
  { id: 6, name: 'Lampu Meja LED', category: 'Elektronik', stock: 9, price: 179000, icon: '♧' },
  { id: 7, name: 'Rak Dokumen 3 Susun', category: 'Lainnya', stock: 2, price: 89000, icon: '▥' }
];

let items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || demoItems;
let searchTerm = '';
let selectedCategory = 'all';

const body = document.querySelector('#inventory-body');
const searchInput = document.querySelector('#search-input');
const categoryFilter = document.querySelector('#category-filter');
const sortSelect = document.querySelector('#sort-select');
const dialog = document.querySelector('#item-dialog');
const form = document.querySelector('#item-form');
const toast = document.querySelector('#toast');

function rupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function renderStats() {
  document.querySelector('#total-items').textContent = items.length;
  document.querySelector('#total-units').textContent = items.reduce((sum, item) => sum + item.stock, 0);
  document.querySelector('#low-stock').textContent = items.filter(item => item.stock < 5).length;
  document.querySelector('#total-value').textContent = rupiah(items.reduce((sum, item) => sum + item.stock * item.price, 0));
}

function renderItems() {
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm) || item.category.toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  filteredItems.sort((a, b) => {
    if (sortSelect.value === 'stock') return a.stock - b.stock;
    if (sortSelect.value === 'price') return a.price - b.price;
    return a.name.localeCompare(b.name);
  });

  body.innerHTML = filteredItems.map(item => `
    <tr>
      <td><div class="product"><span class="product-icon">${item.icon}</span><div><strong>${item.name}</strong><small>ID-${String(item.id).padStart(3, '0')}</small></div></div></td>
      <td><span class="category">${item.category}</span></td>
      <td><span class="stock ${item.stock < 5 ? 'low' : ''}">${item.stock} unit</span></td>
      <td class="money">${rupiah(item.price)}</td>
      <td class="money">${rupiah(item.stock * item.price)}</td>
      <td><button class="row-action" data-delete="${item.id}" aria-label="Hapus ${item.name}">×</button></td>
    </tr>`).join('');

  document.querySelector('#empty-state').hidden = filteredItems.length > 0;
  document.querySelector('#table-count').textContent = `Menampilkan ${filteredItems.length} dari ${items.length} barang`;
  renderStats();
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

searchInput.addEventListener('input', event => {
  searchTerm = event.target.value.toLowerCase();
  renderItems();
});

categoryFilter.addEventListener('change', event => {
  selectedCategory = event.target.value;
  renderItems();
});

sortSelect.addEventListener('change', renderItems);

document.querySelector('#add-item-button').addEventListener('click', () => dialog.showModal());
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());

form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  items.push({
    id: Date.now(),
    name: data.get('name'),
    category: data.get('category'),
    stock: Number(data.get('stock')),
    price: Number(data.get('price')),
    icon: '▦'
  });
  saveItems();
  renderItems();
  form.reset();
  dialog.close();
  showToast('Barang berhasil ditambahkan');
});

body.addEventListener('click', event => {
  const id = event.target.dataset.delete;
  if (!id) return;
  const index = items.findIndex(item => item.id === Number(id));
  items.splice(index, 1);
  saveItems();
  renderItems();
  showToast('Barang berhasil dihapus');
});

document.querySelector('#export-button').addEventListener('click', () => {
  const headers = ['Nama', 'Kategori', 'Stok', 'Harga', 'Nilai Stok'];
  const rows = items.map(item => [
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.category.replace(/"/g, '""')}"`,
    item.stock,
    item.price,
    item.stock * item.price
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  link.download = 'inventaris.csv';
  link.click();
  showToast('File CSV berhasil diekspor');
});

document.querySelector('#reset-button').addEventListener('click', () => {
  items = demoItems;
  saveItems();
  renderItems();
  showToast('Data demo berhasil direset');
});

renderItems();
