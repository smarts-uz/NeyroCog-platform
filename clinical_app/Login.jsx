const Login = ({ onLogin }) => {
  const [username, setUsername] = React.useState("doktor");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) { setError("Foydalanuvchi nomi va parolni kiriting."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ name: username === "doktor" ? "Dr. A. Karimova" : username, role: "Mutaxassis" });
    }, 450);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "48px 24px",
      background:
        "radial-gradient(ellipse 1000px 600px at 50% -10%, rgba(15,118,110,0.10), transparent 60%)," +
        "radial-gradient(ellipse 800px 500px at 50% 110%, rgba(217,119,6,0.08), transparent 60%)," +
        "var(--bg)",
    }}>
      {/* Brand mark above the card */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: 28,
      }}>
        <Logo size={36} />
        <div style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18,
          color: "var(--ink)", letterSpacing: "-0.01em",
        }}>Kognitiv Test Tizimi</div>
      </div>

      {/* Centered login card */}
      <div style={{ width: "100%", maxWidth: 440 }}>
        <form className="card" onSubmit={submit} style={{
          width: "100%", padding: 36,
          display: "flex", flexDirection: "column", gap: 18,
          boxShadow: "var(--shadow-md)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={{
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 26,
              letterSpacing: "-0.015em", color: "var(--ink)", margin: 0,
            }}>Kirish</h2>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-3)", margin: 0,
            }}>Hisobingizga kiring va ishni davom ettiring.</p>
          </div>

          <div>
            <label className="label" htmlFor="u">Foydalanuvchi nomi</label>
            <div style={{ position: "relative" }}>
              <input id="u" className="input"
                style={{ paddingLeft: 38 }}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="doktor"
                autoComplete="username" />
              <Icon name="user" size={16} style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: "var(--ink-4)",
              }} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="p">Parol</label>
            <div style={{ position: "relative" }}>
              <input id="p" className="input"
                style={{ paddingLeft: 38, paddingRight: 40 }}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password" />
              <Icon name="lock" size={16} style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: "var(--ink-4)",
              }} />
              <button type="button" onClick={() => setShowPw(s => !s)}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: 0, cursor: "pointer",
                  color: "var(--ink-3)", padding: 6, borderRadius: 6,
                  display: "inline-flex",
                }}
                aria-label="Parolni ko'rsatish">
                <Icon name={showPw ? "eye-off" : "eye"} size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: "10px 12px", borderRadius: 10,
              background: "var(--err-bg)", color: "#991B1B",
              fontFamily: "var(--font-sans)", fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Icon name="alert-circle" size={14} /> {error}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-2)", cursor: "pointer",
            }}>
              <input type="checkbox" defaultChecked style={{ accentColor: "var(--primary)" }} />
              Meni eslab qol
            </label>
            <a href="#" style={{
              fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--primary)",
              textDecoration: "none", fontWeight: 500,
            }}>Parolni unutdingizmi?</a>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
            style={{ justifyContent: "center" }}>
            {loading ? "Tekshirilmoqda…" : (<>Kirish <Icon name="arrow-right" size={16} /></>)}
          </button>

          <div style={{
            marginTop: 4, paddingTop: 14,
            borderTop: "1px solid var(--divider)",
            fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)",
            textAlign: "center",
          }}>
            Demo: foydalanuvchi <b style={{ color: "var(--ink) " }}>doktor</b> · har qanday parol
          </div>
        </form>
      </div>

      {/* Available tests footnote */}
      <div style={{
        marginTop: 24, display: "flex", gap: 16,
        color: "var(--ink-3)", fontSize: 12,
        fontFamily: "var(--font-sans)",
      }}>
        <span>TMT</span>
        <span>·</span>
        <span>Stroop</span>
        <span>·</span>
        <span>Digit Span</span>
        <span>·</span>
        <span>Rey AVLT</span>
      </div>
    </div>
  );
};

window.Login = Login;
