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

const AppHeader = ({ user, onLogout, breadcrumbs }) => (
  <header style={{
    position: "sticky", top: 0, zIndex: 40,
    minHeight: "var(--header-h)",
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "saturate(180%) blur(12px)",
    WebkitBackdropFilter: "saturate(180%) blur(12px)",
    borderBottom: "1px solid var(--border)",
    padding: "0 clamp(16px, 4vw, 32px)",
    display: "flex", alignItems: "center", gap: 16,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
      <Logo size={30} />
      <div className="ktt-brand" style={{
        fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15.5,
        color: "var(--ink)", letterSpacing: "-0.02em", whiteSpace: "nowrap",
      }}>Kognitiv Test Tizimi</div>
    </div>

    {breadcrumbs && (
      <div style={{
        display: "flex", alignItems: "center", gap: 7, minWidth: 0,
        fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-3)",
        paddingLeft: 8, borderLeft: "1px solid var(--divider)",
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
      <ThemeToggle />
      <div className="ktt-user" style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "4px 12px 4px 4px",
        borderRadius: 999, background: "var(--surface-2)",
        border: "1px solid var(--border)",
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
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onLogout} aria-label="Chiqish">
        <Icon name="log-out" size={15} /> <span className="ktt-hide-mobile">Chiqish</span>
      </button>
    </div>
  </header>
);

const Logo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="kttLogoG" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#14857A"/>
        <stop offset="1" stopColor="#0F766E"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#kttLogoG)"/>
    {/* brain hemisphere */}
    <path d="M19 9.2c-1.6-1.1-3.9-0.8-5.1 0.7-0.4-0.2-0.9-0.3-1.4-0.3-1.9 0-3.4 1.5-3.4 3.4 0 0.3 0 .5.1.8-0.9.6-1.4 1.6-1.4 2.7 0 1.2.7 2.3 1.7 2.8 0 .1 0 .2 0 .3 0 1.7 1.4 3 3 3 .8 0 1.5-.3 2-.8"
      stroke="#FFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
    <path d="M19 9.2c1.6.4 2.8 1.9 2.8 3.6v6c0 1.9-1.5 3.4-3.4 3.4" stroke="#FFF" strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.95"/>
    {/* pulse / spark node */}
    <circle cx="22" cy="13.5" r="1.7" fill="#FDE68A"/>
  </svg>
);

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
