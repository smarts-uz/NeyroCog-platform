// Shared header used across patient screens

const ThemeToggle = () => {
  const [dark, setDark] = React.useState(() =>
    document.documentElement.getAttribute("data-theme") === "dark");
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("ktt_theme", next); } catch (e) {}
    setDark(!dark);
  };
  return (
    <button onClick={toggle} className="btn btn-ghost btn-sm"
      aria-label="Mavzuni almashtirish" title={dark ? "Yorug' rejim" : "Tungi rejim"}
      style={{ padding: 0, width: 38 }}>
      <Icon name={dark ? "sun" : "moon"} size={17} />
    </button>
  );
};

const AppHeader = ({ user, onLogout, onEditProfile, breadcrumbs, title, onBack }) => (
  <header style={{
    position: "sticky", top: 0, zIndex: 40,
    minHeight: "var(--header-h)",
    background: "var(--surface)",
    borderBottom: "1px solid var(--border)",
    padding: "0 clamp(16px, 4vw, 32px)",
    display: "flex", alignItems: "center", gap: 16,
  }}>
    {title && (
      <div className="ktt-page-title" style={{
        position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
        fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 20,
        letterSpacing: "-0.01em", color: "var(--ink)", whiteSpace: "nowrap",
        maxWidth: "40vw", overflow: "hidden", textOverflow: "ellipsis",
        pointerEvents: "none", textAlign: "center",
      }}>{title}</div>
    )}
    <a href="landing.html"
      title="Tanishtiruv sahifasi"
      style={{
        display: "flex", alignItems: "center", gap: 9, flexShrink: 0,
        background: "transparent", border: 0, padding: 0, cursor: "pointer",
        textDecoration: "none",
      }}>
      <Logo size={30} />
      <div className="ktt-brand" style={{
        fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 17,
        color: "var(--ink)", letterSpacing: "-0.02em", whiteSpace: "nowrap",
      }}>Neyro<span style={{ color: "var(--primary)" }}>Cog</span></div>
    </a>

    {onBack && (
      <button onClick={onBack} aria-label="Orqaga" className="ktt-back-btn"
        style={{
          flexShrink: 0, width: 34, height: 34, borderRadius: 999, marginLeft: 4,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--border)", background: "var(--surface)",
          color: "var(--ink-2)", cursor: "pointer", position: "relative",
          transition: "background 120ms var(--ease), color 120ms var(--ease), border-color 120ms var(--ease)",
        }}>
        <Icon name="arrow-left" size={16} />
        <span className="ktt-back-tip" style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0,
          padding: "5px 10px", borderRadius: "var(--r-sm)",
          background: "var(--ink)", color: "#FFF",
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12,
          whiteSpace: "nowrap", opacity: 0, transform: "translateY(-4px)",
          pointerEvents: "none", transition: "opacity 130ms var(--ease), transform 130ms var(--ease)",
          boxShadow: "var(--shadow-md)", zIndex: 50,
        }}>Orqaga</span>
      </button>
    )}

    {breadcrumbs && (
      <div style={{
        display: "flex", alignItems: "center", gap: 7, minWidth: 0,
        fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-3)",
        paddingLeft: 4,
        overflow: "hidden",
      }}>
        {breadcrumbs.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: "var(--ink-4)", flexShrink: 0 }}>/</span>}
            {b.onClick
              ? <button onClick={b.onClick} style={{
                  background: "transparent", border: 0, padding: 0, cursor: "pointer",
                  font: "inherit", color: "var(--ink-3)", whiteSpace: "nowrap", flexShrink: 0,
                }}>{b.label}</button>
              : <span style={{
                  color: "var(--ink)", fontWeight: 600, whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis",
                }}>{b.label}</span>}
          </React.Fragment>
        ))}
      </div>
    )}

    <div style={{ flex: 1 }} />

    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <a className="btn btn-ghost btn-sm" href="landing.html" title="Tanishtiruv sahifasi"
        style={{ textDecoration: "none" }}>
        <Icon name="globe" size={15} /> <span className="ktt-hide-mobile">Sayt</span>
      </a>
      <ThemeToggle />
      <button className="ktt-user ktt-tap" onClick={() => (onEditProfile ? onEditProfile() : (window.__kttEditProfile && window.__kttEditProfile()))}
        title="Profilni tahrirlash"
        style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "4px 12px 4px 4px", cursor: "pointer",
        border: "1px solid var(--border)", background: "var(--surface-2)",
        borderRadius: 999,
        borderRadius: 999,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 999,
          background: "var(--primary)", color: "#FFF",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5,
          flexShrink: 0,
        }}>{(user?.name || "?").split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap" }}>
          {user?.name || "Foydalanuvchi"}
        </div>
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onLogout} aria-label="Chiqish">
        <Icon name="log-out" size={15} /> <span className="ktt-hide-mobile">Chiqish</span>
      </button>
    </div>
  </header>
);

const Logo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="ncBrain" x1="3" y1="6" x2="29" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2B7FD4"/>
        <stop offset="0.5" stopColor="#1FA6B0"/>
        <stop offset="1" stopColor="#3AB87A"/>
      </linearGradient>
    </defs>
    {/* cloud-like brain silhouette (matches NeyroCog mark) */}
    <path d="M11 6.6c1.4-1.9 4.6-2 6.1-.2 1.6-.7 3.7.1 4.4 1.8 2.1-.3 4 1.4 4 3.5 1.6.5 2.6 2.2 2.2 3.9 1.2 1 1.4 2.9.3 4.1.5 1.7-.7 3.5-2.5 3.7-.5 1.8-2.6 2.7-4.3 1.9-1.2 1.5-3.6 1.5-4.8 0-1.6.8-3.7-.1-4.3-1.8-1.9.2-3.6-1.3-3.5-3.2-1.6-.5-2.5-2.2-2-3.8-1.1-1.1-1.1-2.9 0-4-.5-1.7.6-3.5 2.4-3.8.2-1.9 2.1-3.2 3.9-2.8z"
      fill="url(#ncBrain)"/>
    {/* white node network */}
    <g stroke="#FFF" strokeWidth="1.3" strokeLinecap="round" opacity="0.96">
      <line x1="12" y1="11.5" x2="17" y2="10"/>
      <line x1="17" y1="10" x2="20.5" y2="13.5"/>
      <line x1="12" y1="11.5" x2="14.5" y2="17"/>
      <line x1="14.5" y1="17" x2="20.5" y2="13.5"/>
      <line x1="14.5" y1="17" x2="18" y2="21"/>
    </g>
    <g fill="#FFF">
      <circle cx="12" cy="11.5" r="1.7"/>
      <circle cx="17" cy="10" r="1.7"/>
      <circle cx="20.5" cy="13.5" r="1.7"/>
      <circle cx="14.5" cy="17" r="1.7"/>
      <circle cx="18" cy="21" r="1.7"/>
    </g>
  </svg>
);

// Reusable empty-state block — illustration glyph + title + hint + optional action
const EmptyState = ({ icon = "inbox", title, hint, action }) => (
  <div className="ktt-anim-up" style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    textAlign: "center", padding: "48px 24px", gap: 12,
  }}>
    <div style={{
      width: 64, height: 64, borderRadius: 18,
      background: "var(--surface-2)", border: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--ink-4)",
    }}>
      <Icon name={icon} size={30} strokeWidth={1.6} />
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 380 }}>
      <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>{title}</div>
      {hint && <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-3)" }}>{hint}</div>}
    </div>
    {action}
  </div>
);

// Count-up animated number (for KPIs / stats)
const CountUp = ({ value, dur = 700, suffix = "", style }) => {
  const reduced = typeof window !== "undefined" && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const target = Number(value) || 0;
  const [n, setN] = React.useState(reduced ? target : 0);
  React.useEffect(() => {
    if (reduced) { setN(target); return; }
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else setN(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur, reduced]);
  const isInt = Number.isInteger(target);
  return <span className="num" style={style}>{isInt ? Math.round(n) : n.toFixed(1)}{suffix}</span>;
};

window.EmptyState = EmptyState;
window.CountUp = CountUp;

// Pediatric gender labels — stored value stays "Erkak"/"Ayol" (charts & logic),
// but the UI everywhere shows child-appropriate "O'g'il bola" / "Qiz bola".
const jinsLabel = (j) => j === "Ayol" ? "Qiz bola" : j === "Erkak" ? "O'g'il bola" : (j || "—");
window.jinsLabel = jinsLabel;

// Save & Exit controls for test/exercise headers.
// "Saqlash" → persist current progress and leave; "Chiqish" → leave without saving
// (with a small confirm to avoid accidental data loss).
const ExitSaveControls = ({ onSave, onAbort }) => {
  const [confirm, setConfirm] = React.useState(false);
  React.useEffect(() => {
    if (!confirm) return;
    const onKey = (e) => { if (e.key === "Escape") setConfirm(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
      <button className="btn btn-primary btn-sm" onClick={onSave} title="Natijani saqlab chiqish">
        <Icon name="save" size={15} /> Saqlash
      </button>
      <button className="btn btn-secondary btn-sm" onClick={() => setConfirm(true)} title="Saqlamasdan chiqish">
        <Icon name="x" size={15} /> Chiqish
      </button>
      {confirm && (
        <>
          <div onClick={() => setConfirm(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
          <div className="ktt-anim-scale" style={{
            position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 61,
            width: 290, padding: 16, background: "var(--surface)",
            border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-lg)",
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: "var(--warn-bg)", color: "#9A6700",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Icon name="alert-triangle" size={18} /></div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
                Joriy natija <b>saqlanmaydi</b>. Saqlamasdan chiqasizmi?
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirm(false)}>Bekor</button>
              <button className="btn btn-danger btn-sm" onClick={onAbort}>
                <Icon name="x" size={14} /> Chiqish
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
window.ExitSaveControls = ExitSaveControls;

const Icon = ({ name, size = 18, style, strokeWidth = 2 }) => {
  // Build the SVG from lucide.icons data as a React tree. Critical: we MUST NOT
  // call lucide.createIcons() anywhere, because that DOM-mutates <i> into <svg>
  // and React's reconciler then errors with "removeChild" / "node not a child".
  const pascal = String(name)
    .split("-")
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  const children = (window.lucide && window.lucide.icons && window.lucide.icons[pascal]) || [];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {children.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
};

window.AppHeader = AppHeader;
window.Logo = Logo;
window.Icon = Icon;

// ===== App footer — standard links + research disclaimer =====
const FOOTER_INFO = {
  guide: {
    title: "Yo'riqnoma",
    body: "Bemor qo'shing, KNBT batareyasidagi 7 ta diagnostik testni bosqichma-bosqich (PreOp / PostOp / PostTx) o'tkazing, so'ng reabilitatsiya mashqlarini tayinlang. Har bir natija avtomatik CogScore va Z-ball bilan baholanadi.",
  },
  method: {
    title: "Metodologiya",
    body: "Statistik modellar (LR, MLR, ROC/AUC, t-test, χ², ANOVA) tadqiqot rejasi va Excel ma'lumotlar to'plamlari asosida qurilgan. PNB tasnifi ISPOCD mezoni bo'yicha: 4 ta asosiy testdan ≥2 tasida Z ≤ −1.96.",
  },
  privacy: {
    title: "Maxfiylik siyosati",
    body: "Barcha ma'lumotlar faqat shu brauzerda (localStorage) saqlanadi — server yoki bulutga yuborilmaydi. Brauzer ma'lumotlarini tozalash bemor yozuvlarini o'chiradi.",
  },
  terms: {
    title: "Foydalanish shartlari",
    body: "Bu — ilmiy-tadqiqot prototipi. Natijalar yordamchi xususiyatga ega va klinik qaror qabul qilish uchun yagona asos bo'la olmaydi. Yakuniy tashxis shifokor zimmasida.",
  },
  contact: {
    title: "Loyiha rahbari",
    body: "Zakirova Durdona Abdujalolovna — loyiha rahbari. Texnik yordam, hamkorlik va takliflar uchun: dr.durdona.zakirova@gmail.com · +998 99 816 74 77.",
  },
};

const Footer = () => {
  const [info, setInfo] = React.useState(null);
  React.useEffect(() => {
    if (!info) return;
    const onKey = (e) => { if (e.key === "Escape") setInfo(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [info]);

  const sysLink = (label, fn) => (
    <button onClick={fn} className="ktt-foot-link" style={ktFootLinkStyle}>{label}</button>
  );
  const infoLink = (label, key) => (
    <button onClick={() => setInfo(FOOTER_INFO[key])} className="ktt-foot-link" style={ktFootLinkStyle}>{label}</button>
  );

  return (
    <footer className="ktt-footer" style={{
      borderTop: "1px solid var(--border)", marginTop: 40,
      padding: "28px clamp(16px, 4vw, 32px) 24px",
      background: "var(--surface-2)",
    }}>
      <div style={{
        maxWidth: "var(--content-max)", margin: "0 auto",
        display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 28,
      }} className="ktt-footer-grid">
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
            <Logo size={26} />
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 16, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Neyro<span style={{ color: "var(--primary)" }}>Cog</span>
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-3)", margin: "0 0 10px", maxWidth: 320 }}>
            Pediatrik perioperativ neyrokognitiv buzilishni (PNB) diagnostika, bashorat va reabilitatsiya tizimi.
          </p>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-4)" }}>© 2026 NeyroCog · v1.0</div>
        </div>

        {/* System */}
        <div style={ktFootColStyle}>
          <div style={ktFootHeadStyle}>Tizim</div>
          {sysLink("Bemorlar", () => window.__kttGoHome && window.__kttGoHome())}
          {sysLink("ROC tahlili", () => window.__kttOpenAnalytics && window.__kttOpenAnalytics("roc"))}
          {sysLink("Davolash effekti", () => window.__kttOpenAnalytics && window.__kttOpenAnalytics("treatment"))}
          {sysLink("Hisobotlar", () => window.__kttOpenAnalytics && window.__kttOpenAnalytics("reports"))}
        </div>

        {/* Docs */}
        <div style={ktFootColStyle}>
          <div style={ktFootHeadStyle}>Hujjatlar</div>
          {infoLink("Yo'riqnoma", "guide")}
          {infoLink("Metodologiya", "method")}
          {infoLink("Maxfiylik siyosati", "privacy")}
          {infoLink("Foydalanish shartlari", "terms")}
        </div>

        {/* Project leader */}
        <div style={ktFootColStyle}>
          <div style={ktFootHeadStyle}>Loyiha rahbari</div>
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--ink)", lineHeight: 1.4 }}>
            Zakirova Durdona<br />Abdujalolovna
          </div>
          <a href="mailto:dr.durdona.zakirova@gmail.com" className="ktt-foot-link"
            style={{ ...ktFootLinkStyle, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <Icon name="mail" size={13} /> dr.durdona.zakirova@gmail.com
          </a>
          <a href="tel:+998998167477" className="ktt-foot-link"
            style={{ ...ktFootLinkStyle, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <Icon name="phone" size={13} /> +998 99 816 74 77
          </a>
        </div>
      </div>

      {info && (
        <div onClick={() => setInfo(null)} style={{
          position: "fixed", inset: 0, zIndex: 220, background: "rgba(15,23,42,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} className="card ktt-anim-scale" style={{
            width: "min(460px, 100%)", padding: 24, display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "var(--ink)", letterSpacing: "-0.01em" }}>{info.title}</h3>
              <button onClick={() => setInfo(null)} aria-label="Yopish" className="ktt-back-btn" style={{
                width: 32, height: 32, borderRadius: 999, flexShrink: 0,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                border: "1px solid var(--border)", background: "var(--surface)", color: "var(--ink-2)", cursor: "pointer",
              }}><Icon name="x" size={16} /></button>
            </div>
            <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)" }}>{info.body}</p>
            <button className="btn btn-secondary" style={{ alignSelf: "flex-end", marginTop: 4 }} onClick={() => setInfo(null)}>Yopish</button>
          </div>
        </div>
      )}
    </footer>
  );
};
const ktFootColStyle = { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 9 };
const ktFootHeadStyle = { fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 2 };
const ktFootLinkStyle = { background: "transparent", border: 0, padding: 0, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-2)", textAlign: "left" };
window.Footer = Footer;
