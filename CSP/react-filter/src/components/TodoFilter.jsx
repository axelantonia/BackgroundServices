// src/components/TodoFilter.jsx
export default function TodoFilter({ filterAktif, onFilterChange }) {
  const pilihanFilter = ["Semua", "Aktif", "Selesai"];

  return (
    <div className="filter-container">
      {pilihanFilter.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={filterAktif === filter ? "aktif" : ""}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}