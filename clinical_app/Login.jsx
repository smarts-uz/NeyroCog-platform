// Pre-login auth surface — three modes share one shell:
//   "login"    → username + parol
//   "register" → ism + (email | telefon) + parol + tasdiq
//   "forgot"   → (email | telefon) → tiklash havolasi (demo: success xabar)
// Frontend-only: register/forgot simulate success; login calls onLogin.

const AuthField = ({ id, label, icon, type = "text", value, onChange, placeholder, autoComplete, rightSlot, paddingRight }) => (
  <div>
    <label className="label" htmlFor={id}>{label}</label>
    <div style={{ position: "relative" }}>
      <input id={id} className="input"
        style={{ paddingLeft: 38, paddingRight: paddingRight || 14 }}
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete} />
      <Icon name={icon} size={16} style={{
        position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)",
      }} />
      {rightSlot}
    </div>
  </div>
);

// Email / telefon segmented toggle (reused by register + forgot).
const ContactToggle = ({ mode, onChange }) => (
  <div style={{
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 4,
    background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12,
  }}>
    {[{ id: "email", label: "Email", icon: "mail" }, { id: "phone", label: "Telefon", icon: "phone" }].map(o => {
      const active = mode === o.id;
      return (
        <button key={o.id} type="button" onClick={() => onChange(o.id)} style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
          height: 38, borderRadius: 9, cursor: "pointer", border: 0,
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5,
          background: active ? "var(--surface)" : "transparent",
          color: active ? "var(--primary)" : "var(--ink-3)",
          boxShadow: active ? "var(--shadow-xs)" : "none",
          transition: "background 140ms var(--ease), color 140ms var(--ease)",
        }}>
          <Icon name={o.icon} size={15} /> {o.label}
        </button>
      );
    })}
  </div>
);

const Login = ({ onLogin }) => {
  const [mode, setMode] = React.useState("login"); // login | register | forgot

  // login
  const [username, setUsername] = React.useState("doktor");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);

  // register
  const [regName, setRegName] = React.useState("");
  const [contactMode, setContactMode] = React.useState("email"); // email | phone
  const [contact, setContact] = React.useState("");
  const [regPw, setRegPw] = React.useState("");
  const [regPw2, setRegPw2] = React.useState("");
  const [agree, setAgree] = React.useState(false);

  // forgot
  const [fpContactMode, setFpContactMode] = React.useState("email");
  const [fpContact, setFpContact] = React.useState("");
  const [sent, setSent] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const switchMode = (m) => { setMode(m); setError(""); setSent(false); };

  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validPhone = (v) => /^\+?[\d\s()-]{7,}$/.test(v);

  // ---- handlers ----
  const submitLogin = (e) => {
    e.preventDefault(); setError("");
    if (!username || !password) { setError("Foydalanuvchi nomi va parolni kiriting."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ name: username === "doktor" ? "Dr. A. Karimova" : username, role: "Mutaxassis" });
    }, 450);
  };

  const submitRegister = (e) => {
    e.preventDefault(); setError("");
    if (!regName.trim()) { setError("To'liq ismni kiriting."); return; }
    if (contactMode === "email" && !validEmail(contact)) { setError("Email manzili noto'g'ri."); return; }
    if (contactMode === "phone" && !validPhone(contact)) { setError("Telefon raqami noto'g'ri."); return; }
    if (regPw.length < 6) { setError("Parol kamida 6 belgidan iborat bo'lsin."); return; }
    if (regPw !== regPw2) { setError("Parollar mos kelmadi."); return; }
    if (!agree) { setError("Foydalanish shartlarini qabul qiling."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ name: regName.trim(), role: "Mutaxassis", contact, contactMode });
    }, 550);
  };

  const submitForgot = (e) => {
    e.preventDefault(); setError("");
    if (fpContactMode === "email" && !validEmail(fpContact)) { setError("Email manzili noto'g'ri."); return; }
    if (fpContactMode === "phone" && !validPhone(fpContact)) { setError("Telefon raqami noto'g'ri."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 600);
  };

  const errBox = error ? (
    <div style={{
      padding: "10px 12px", borderRadius: 10,
      background: "var(--err-bg)", color: "var(--err)",
      fontFamily: "var(--font-sans)", fontSize: 13,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <Icon name="alert-circle" size={14} /> {error}
    </div>
  ) : null;

  const pwToggle = (show, setShow) => (
    <button type="button" onClick={() => setShow(s => !s)} aria-label="Parolni ko'rsatish"
      style={{
        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
        background: "transparent", border: 0, cursor: "pointer",
        color: "var(--ink-3)", padding: 6, borderRadius: 6, display: "inline-flex",
      }}>
      <Icon name={show ? "eye-off" : "eye"} size={16} />
    </button>
  );

  const linkBtn = (label, onClick) => (
    <button type="button" onClick={onClick} style={{
      background: "transparent", border: 0, padding: 0, cursor: "pointer",
      fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--primary)", fontWeight: 600,
    }}>{label}</button>
  );

  // ---- card bodies ----
  const loginCard = (
    <form className="card" onSubmit={submitLogin} style={cardStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 style={titleStyle}>Kirish</h2>
        <p style={subStyle}>Hisobingizga kiring va ishni davom ettiring.</p>
      </div>

      <AuthField id="u" label="Foydalanuvchi nomi" icon="user" value={username}
        onChange={setUsername} placeholder="doktor" autoComplete="username" />

      <div>
        <label className="label" htmlFor="p">Parol</label>
        <div style={{ position: "relative" }}>
          <input id="p" className="input" style={{ paddingLeft: 38, paddingRight: 40 }}
            type={showPw ? "text" : "password"} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          <Icon name="lock" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)" }} />
          {pwToggle(showPw, setShowPw)}
        </div>
      </div>

      {errBox}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-2)", cursor: "pointer" }}>
          <input type="checkbox" defaultChecked style={{ accentColor: "var(--primary)" }} />
          Meni eslab qol
        </label>
        {linkBtn("Parolni unutdingizmi?", () => switchMode("forgot"))}
      </div>

      <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ justifyContent: "center" }}>
        {loading ? "Tekshirilmoqda…" : (<>Kirish <Icon name="arrow-right" size={16} /></>)}
      </button>

      <div style={dividerNote}>
        Hisobingiz yo'qmi? {linkBtn("Ro'yxatdan o'ting", () => switchMode("register"))}
      </div>
    </form>
  );

  const registerCard = (
    <form className="card" onSubmit={submitRegister} style={cardStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 style={titleStyle}>Ro'yxatdan o'tish</h2>
        <p style={subStyle}>Yangi hisob yarating — email yoki telefon orqali.</p>
      </div>

      <AuthField id="rn" label="To'liq ism (F.I.Sh.)" icon="user" value={regName}
        onChange={setRegName} placeholder="Dr. Familiya Ism" autoComplete="name" />

      <div>
        <label className="label">Bog'lanish usuli</label>
        <ContactToggle mode={contactMode} onChange={setContactMode} />
      </div>

      {contactMode === "email"
        ? <AuthField id="rc" label="Email" icon="mail" type="email" value={contact}
            onChange={setContact} placeholder="ism@klinika.uz" autoComplete="email" />
        : <AuthField id="rc" label="Telefon raqami" icon="phone" type="tel" value={contact}
            onChange={setContact} placeholder="+998 90 123 45 67" autoComplete="tel" />}

      <div>
        <label className="label" htmlFor="rp">Parol</label>
        <div style={{ position: "relative" }}>
          <input id="rp" className="input" style={{ paddingLeft: 38, paddingRight: 40 }}
            type={showPw ? "text" : "password"} value={regPw}
            onChange={e => setRegPw(e.target.value)} placeholder="Kamida 6 belgi" autoComplete="new-password" />
          <Icon name="lock" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)" }} />
          {pwToggle(showPw, setShowPw)}
        </div>
      </div>

      <AuthField id="rp2" label="Parolni tasdiqlang" icon="lock-keyhole" type={showPw ? "text" : "password"}
        value={regPw2} onChange={setRegPw2} placeholder="Parolni qayta kiriting" autoComplete="new-password" />

      <label style={{ display: "flex", alignItems: "flex-start", gap: 9, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-2)", cursor: "pointer", lineHeight: 1.45 }}>
        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ accentColor: "var(--primary)", marginTop: 2 }} />
        <span>Foydalanish shartlari va maxfiylik siyosatini qabul qilaman.</span>
      </label>

      {errBox}

      <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ justifyContent: "center" }}>
        {loading ? "Yaratilmoqda…" : (<>Hisob yaratish <Icon name="user-plus" size={16} /></>)}
      </button>

      <div style={dividerNote}>
        Hisobingiz bormi? {linkBtn("Kirish", () => switchMode("login"))}
      </div>
    </form>
  );

  const forgotCard = (
    <form className="card" onSubmit={submitForgot} style={cardStyle}>
      <button type="button" onClick={() => switchMode("login")} style={{
        alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6,
        background: "transparent", border: 0, padding: 0, cursor: "pointer",
        fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-3)", fontWeight: 500,
      }}>
        <Icon name="arrow-left" size={15} /> Kirishga qaytish
      </button>

      {sent ? (
        <>
          <div style={{
            width: 56, height: 56, borderRadius: 16, alignSelf: "center",
            background: "var(--ok-bg)", color: "var(--ok)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name="mail-check" size={28} /></div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ ...titleStyle, fontSize: 22 }}>Havola yuborildi</h2>
            <p style={{ ...subStyle, marginTop: 6 }}>
              Parolni tiklash bo'yicha ko'rsatma{" "}
              <b style={{ color: "var(--ink)" }}>{fpContact}</b>{" "}
              {fpContactMode === "email" ? "manziliga" : "raqamiga"} yuborildi.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-lg" style={{ justifyContent: "center" }}
            onClick={() => switchMode("login")}>
            Kirishga qaytish <Icon name="arrow-right" size={16} />
          </button>
          <div style={dividerNote}>
            Havola kelmadimi? {linkBtn("Qayta yuborish", () => setSent(false))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={titleStyle}>Parolni tiklash</h2>
            <p style={subStyle}>Email yoki telefon raqamingizni kiriting — tiklash havolasini yuboramiz.</p>
          </div>

          <div>
            <label className="label">Bog'lanish usuli</label>
            <ContactToggle mode={fpContactMode} onChange={setFpContactMode} />
          </div>

          {fpContactMode === "email"
            ? <AuthField id="fc" label="Email" icon="mail" type="email" value={fpContact}
                onChange={setFpContact} placeholder="ism@klinika.uz" autoComplete="email" />
            : <AuthField id="fc" label="Telefon raqami" icon="phone" type="tel" value={fpContact}
                onChange={setFpContact} placeholder="+998 90 123 45 67" autoComplete="tel" />}

          {errBox}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ justifyContent: "center" }}>
            {loading ? "Yuborilmoqda…" : (<>Tiklash havolasini yuborish <Icon name="send" size={16} /></>)}
          </button>
        </>
      )}
    </form>
  );

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      background:
        "radial-gradient(ellipse 1000px 600px at 50% -10%, rgba(15,118,110,0.10), transparent 60%)," +
        "radial-gradient(ellipse 800px 500px at 50% 110%, rgba(217,119,6,0.08), transparent 60%)," +
        "var(--bg)",
    }}>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "48px 24px",
      }}>
        {/* Brand mark above the card */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 28 }}>
          <a href="landing.html" title="Tanishtiruv sahifasi" style={{ display: "block" }}>
            <img src="assets/neyrocog-logo.png" alt="NeyroCog" style={{ height: 96, width: "auto", display: "block" }} />
          </a>
        </div>

        <div style={{ width: "100%", maxWidth: 440 }}>
          {mode === "login" && loginCard}
          {mode === "register" && registerCard}
          {mode === "forgot" && forgotCard}
        </div>

        {/* Available tests footnote */}
        <div style={{
          marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center",
          color: "var(--ink-3)", fontSize: 12, maxWidth: 460, fontFamily: "var(--font-sans)",
        }}>
          <span>TMT</span><span>·</span><span>Stroop</span><span>·</span>
          <span>Digit Span</span><span>·</span><span>LMWT</span><span>·</span>
          <span>Nevrologik baholash</span><span>·</span><span>Audio gnozis</span><span>·</span><span>EEG</span>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const cardStyle = {
  width: "100%", padding: 36,
  display: "flex", flexDirection: "column", gap: 18,
  boxShadow: "var(--shadow-md)",
};
const titleStyle = {
  fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 26,
  letterSpacing: "-0.015em", color: "var(--ink)", margin: 0,
};
const subStyle = {
  fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-3)", margin: 0,
};
const dividerNote = {
  marginTop: 4, paddingTop: 14, borderTop: "1px solid var(--divider)",
  fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-3)", textAlign: "center",
};

window.Login = Login;
