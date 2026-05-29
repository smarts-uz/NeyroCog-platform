// Doctor profile edit modal — opened from the header user chip.
const DoctorProfileModal = ({ user, onClose, onSave }) => {
  const [form, setForm] = React.useState({
    name: user?.name || "",
    role: user?.role || "Mutaxassis",
    clinic: user?.clinic || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert("Ism kiritilishi shart"); return; }
    onSave({ ...user, ...form });
  };
  const initials = (form.name || "?").split(" ").map(s => s[0]).slice(0, 2).join("");

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} className="card ktt-anim-scale" style={{
        width: "min(460px, 100%)", maxHeight: "90vh", overflowY: "auto", padding: 24,
        display: "flex", flexDirection: "column", gap: 16, boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>Profilni tahrirlash</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 999, flexShrink: 0,
            background: "var(--primary)", color: "#FFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 20,
          }}>{initials}</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-3)" }}>
            Avatar ism harflaridan avtomatik yaratiladi.
          </div>
        </div>

        <div><label className="label">To'liq ism</label>
          <input className="input" required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Dr. A. Karimova" /></div>

        <div><label className="label">Lavozim</label>
          <select className="input" value={form.role} onChange={e => set("role", e.target.value)}>
            {["Mutaxassis", "Nevropatolog", "Pediatr", "Anesteziolog", "Tadqiqotchi", "Administrator"].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div><label className="label">Klinika / Muassasa</label>
          <input className="input" value={form.clinic} onChange={e => set("clinic", e.target.value)} placeholder="Pediatrik diagnostika markazi" /></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div><label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="doktor@klinika.uz" /></div>
          <div><label className="label">Telefon</label>
            <input className="input" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+998 90 123 45 67" /></div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--divider)", paddingTop: 14 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Bekor qilish</button>
          <button type="submit" className="btn btn-primary"><Icon name="check" size={16} /> Saqlash</button>
        </div>
      </form>
    </div>
  );
};

window.DoctorProfileModal = DoctorProfileModal;
