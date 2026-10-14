import { useState } from "react";
import TodoFilter from "./TodoFilter";
import TodoItem from "./TodoItem";

export default function TodoApp() {
  // 1. Data awal minimal 4 tugas
  const [daftarTugas, setDaftarTugas] = useState([
    { id: 1, teks: "Belajar Fondasi React", selesai: true },
    { id: 2, teks: "Mengerjakan Tugas 4", selesai: false },
    { id: 3, teks: "Membaca Slide Pertemuan 4", selesai: false },
    { id: 4, teks: "Istirahat Sejenak", selesai: false },
  ]);

  const [filterAktif, setFilterAktif] = useState("Semua");

  const tanganiToggle = (id) => {
    setDaftarTugas((prev) =>
      prev.map((tugas) =>
        tugas.id === id ? { ...tugas, selesai: !tugas.selesai } : tugas
      )
    );
  };

  const tanganiHapus = (id) => {
    setDaftarTugas((prev) => prev.filter((tugas) => tugas.id !== id));
  };

  const tugasTerfilter = daftarTugas.filter((tugas) => {
    if (filterAktif === "Aktif") return !tugas.selesai;
    if (filterAktif === "Selesai") return tugas.selesai;
    return true; // "Semua"
  });

  const jumlahSelesai = daftarTugas.filter((t) => t.selesai).length;
  const totalTugas = daftarTugas.length;

  return (
    <div className="todo-box">
      <h2>To-Do List</h2>

   
      <p className="ringkasan">
        <b>{jumlahSelesai}</b> dari <b>{totalTugas}</b> tugas selesai
      </p>

      <TodoFilter
        filterAktif={filterAktif}
        onFilterChange={setFilterAktif}
      />

      {tugasTerfilter.length > 0 ? (
        <ul className="todo-list">
          {tugasTerfilter.map((tugas) => (
            <TodoItem
              key={tugas.id}
              tugas={tugas}
              onToggle={tanganiToggle}
              onHapus={tanganiHapus}
            />
          ))}
        </ul>
      ) : (
        <p className="pesan-kosong">
          Tidak ada tugas untuk filter "{filterAktif}".
        </p>
      )}
    </div>
  );
}