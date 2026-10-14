export default function TodoItem({ tugas, onToggle, onHapus }) {
  return (
    <li className="todo-item">
      <span
        onClick={() => onToggle(tugas.id)}
        style={{
          textDecoration: tugas.selesai ? "line-through" : "none",
          cursor: "pointer",
        }}
      >
        {tugas.teks}
      </span>

      <button onClick={() => onHapus(tugas.id)}>Hapus</button>
    </li>
  );
}