/**
 * Dashboard.jsx — Painel Admin Black Vision
 * Completo com: Overview, Hero, Serviços, Planos, Links, Seções, Transações, API Status
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore.js";
import useContentStore from "../store/contentStore.js";
import { getStats } from "../services/tracking.js";
import { fetchTransactions, cancelSubscription, healthCheck } from "../services/transactions.js";
import { useToast } from "../components/ui/Toast.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

/* ── Card Modal (serviços) ── */
function CardModal({ card, onClose, onSave }) {
  const [form, setForm] = useState(
    card || { icon: "", tag: "", title: "", desc: "", features: "", active: true }
  );
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    const features = typeof form.features === "string"
      ? form.features.split("\n").map(f => f.trim()).filter(Boolean)
      : form.features;
    onSave({ ...form, features, icon: form.icon || "📦", tag: form.tag || "Serviço" });
  };

  return (
    <div className="db-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="db-modal">
        <div className="db-modal-header">
          <div className="db-modal-title">{card ? "Editar Card" : "Novo Card de Serviço"}</div>
          <button className="db-modal-close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="db-modal-body">
          <div className="db-row2">
            <div className="db-field">
              <label>Ícone (emoji)</label>
              <input value={form.icon} onChange={e => set("icon", e.target.value)} placeholder="Ex: 💻" maxLength={4} />
            </div>
            <div className="db-field">
              <label>Tag / Categoria</label>
              <input value={form.tag} onChange={e => set("tag", e.target.value)} placeholder="Ex: Sistemas Web" />
            </div>
          </div>
          <div className="db-field">
            <label>Título do Card *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ex: Sistemas Web de Alta Performance" />
          </div>
          <div className="db-field">
            <label>Descrição</label>
            <textarea value={form.desc} onChange={e => set("desc", e.target.value)} placeholder="Descrição do serviço..." />
          </div>
          <div className="db-field">
            <label>Features (uma por linha)</label>
            <textarea
              value={typeof form.features === "string" ? form.features : form.features.join("\n")}
              onChange={e => set("features", e.target.value)}
              placeholder={"Feature 1\nFeature 2\nFeature 3"}
              style={{ minHeight: "80px" }}
            />
            <span className="db-field-hint">Uma feature por linha — aparecerão com ✓</span>
          </div>
        </div>
        <div className="db-modal-footer">
          <button className="db-btn db-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="db-btn db-btn-primary" onClick={handleSave} disabled={!form.title.trim()}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            Salvar Card
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Plan Modal ── */
function PlanModal({ plan, onClose, onSave }) {
  const [form, setForm] = useState(plan || {
    tier: "", name: "", price: "", priceSub: "por projeto",
    tagline: "", badge: "", highlighted: false, ctaLabel: "Quero começar",
    audience: "", features: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim() || !form.price.trim()) return;
    const features = typeof form.features === "string"
      ? form.features.split("\n").map(f => f.trim()).filter(Boolean)
      : form.features;
    onSave({ ...form, features, badge: form.badge || null });
  };

  return (
    <div className="db-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="db-modal">
        <div className="db-modal-header">
          <div className="db-modal-title">{plan?.tier ? `Editar Plano ${plan.name}` : "Novo Plano"}</div>
          <button className="db-modal-close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="db-modal-body">
          <div className="db-row2">
            <div className="db-field">
              <label>Nome do Plano *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ex: Advanced" />
            </div>
            <div className="db-field">
              <label>Tier (ID único)</label>
              <input value={form.tier} onChange={e => set("tier", e.target.value)} placeholder="basic|advanced|pro" disabled={!!plan?.tier} />
            </div>
          </div>
          <div className="db-row2">
            <div className="db-field">
              <label>Preço *</label>
              <input value={form.price} onChange={e => set("price", e.target.value)} placeholder="R$ 1.500 – R$ 3.000" />
            </div>
            <div className="db-field">
              <label>Sub-preço</label>
              <input value={form.priceSub} onChange={e => set("priceSub", e.target.value)} placeholder="por projeto" />
            </div>
          </div>
          <div className="db-field">
            <label>Tagline</label>
            <input value={form.tagline} onChange={e => set("tagline", e.target.value)} placeholder="Plano mais escolhido..." />
          </div>
          <div className="db-row2">
            <div className="db-field">
              <label>Badge (opcional)</label>
              <input value={form.badge || ""} onChange={e => set("badge", e.target.value)} placeholder="MAIS ESCOLHIDO" />
            </div>
            <div className="db-field">
              <label>Texto do CTA</label>
              <input value={form.ctaLabel} onChange={e => set("ctaLabel", e.target.value)} placeholder="Quero crescer" />
            </div>
          </div>
          <div className="db-field">
            <label>Público-alvo</label>
            <input value={form.audience} onChange={e => set("audience", e.target.value)} placeholder="Empresas locais..." />
          </div>
          <div className="db-field">
            <label>Features (uma por linha)</label>
            <textarea
              value={typeof form.features === "string" ? form.features : (form.features || []).join("\n")}
              onChange={e => set("features", e.target.value)}
              placeholder={"Feature 1\nFeature 2\nFeature 3"}
              style={{ minHeight: "100px" }}
            />
          </div>
          <div className="db-field">
            <label style={{ display: "flex", alignItems: "center", gap: ".5rem", cursor: "pointer" }}>
              <input type="checkbox" checked={form.highlighted} onChange={e => set("highlighted", e.target.checked)} />
              Plano em destaque (highlighted)
            </label>
          </div>
        </div>
        <div className="db-modal-footer">
          <button className="db-btn db-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="db-btn db-btn-primary" onClick={handleSave} disabled={!form.name.trim() || !form.price.trim()}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            Salvar Plano
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Status Badge ── */
const STATUS_COLORS = {
  pending:  { bg: "rgba(234,179,8,.1)",   border: "rgba(234,179,8,.25)",   color: "#eab308",   label: "Pendente"  },
  approved: { bg: "rgba(34,197,94,.1)",   border: "rgba(34,197,94,.25)",   color: "#22c55e",   label: "Aprovado"  },
  rejected: { bg: "rgba(239,68,68,.1)",   border: "rgba(239,68,68,.25)",   color: "#ef4444",   label: "Rejeitado" },
  error:    { bg: "rgba(239,68,68,.08)",  border: "rgba(239,68,68,.2)",    color: "#f87171",   label: "Erro"      },
  cancelled:{ bg: "rgba(156,163,175,.1)", border: "rgba(156,163,175,.25)", color: "#9ca3af",   label: "Cancelado" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.error;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: ".3rem",
      padding: ".2rem .625rem", borderRadius: 100,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize: ".7rem", fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

/* ── Format currency ── */
function fmtCurrency(amount, currency = "BRL") {
  if (!amount) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(amount / 100);
}

/* ── Format date ── */
function fmtDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const navigate = useNavigate();
  const { push }  = useToast();
  const { logout, user } = useAuthStore();
  const { content, loading: contentLoading, fetchContent, updateContent } = useContentStore();

  const [page, setPage]           = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats]         = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [health, setHealth]       = useState(null);

  /* modal states */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  /* local editable state (sync'd from content) */
  const [heroTitle, setHeroTitle]     = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroBadge, setHeroBadge]     = useState("");
  const [waNumber, setWaNumber]       = useState("");
  const [waMsg, setWaMsg]             = useState("");
  const [instagram, setInstagram]     = useState("");
  const [cards, setCards]             = useState([]);
  const [plans, setPlans]             = useState([]);
  const [sections, setSections]       = useState({});

  /* sync from content store */
  useEffect(() => {
    if (content) {
      setHeroTitle(content.heroTitle || "");
      setHeroSubtitle(content.heroSubtitle || "");
      setHeroBadge(content.heroBadge || "");
      setWaNumber(content.waNumber || "");
      setWaMsg(content.waMsg || "");
      setInstagram(content.instagram || "");
      setCards(content.cards || []);
      setPlans(content.plans || []);
      setSections(content.sections || {});
    }
  }, [content]);

  /* load stats */
  useEffect(() => {
    setStatsLoading(true);
    getStats()
      .then(d => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  /* load transactions when tab active */
  useEffect(() => {
    if (page === "transactions") {
      setTxLoading(true);
      fetchTransactions()
        .then(d => setTransactions(Array.isArray(d) ? d : []))
        .catch(() => setTransactions([]))
        .finally(() => setTxLoading(false));
    }
    if (page === "overview") {
      healthCheck()
        .then(d => setHealth(d))
        .catch(() => setHealth(null));
    }
  }, [page]);

  const doLogout = () => { logout(); navigate("/admin"); };

  /* ── save handlers ── */
  const saveSection = useCallback(async (patch, label) => {
    const result = await updateContent(patch);
    if (result.success) push(`${label} salvo com sucesso!`, "success");
    else push(result.error || "Erro ao salvar", "error");
  }, [updateContent, push]);

  const saveHero = () => saveSection({ heroTitle, heroSubtitle, heroBadge }, "Hero");
  const saveLinks = () => saveSection({ waNumber, waMsg, instagram }, "Links");

  const saveSections = async () => {
    const result = await updateContent({ sections });
    if (result.success) push("Seções salvas!", "success");
    else push(result.error || "Erro ao salvar seções", "error");
  };

  const saveCards = async () => {
    const result = await updateContent({ cards });
    if (result.success) push("Cards salvos com sucesso!", "success");
    else push(result.error || "Erro ao salvar cards", "error");
  };

  const savePlans = async () => {
    const result = await updateContent({ plans });
    if (result.success) push("Planos salvos com sucesso!", "success");
    else push(result.error || "Erro ao salvar planos", "error");
  };

  const saveAll = async () => {
    const result = await updateContent({ heroTitle, heroSubtitle, heroBadge, waNumber, waMsg, instagram, cards, plans, sections });
    if (result.success) push("Todas as alterações foram salvas!", "success");
    else push(result.error || "Erro ao salvar", "error");
  };

  /* ── card ops ── */
  const handleSaveCard = (cardData) => {
    if (editingCard !== null) {
      setCards(prev => prev.map((c, i) => i === editingCard ? { ...c, ...cardData } : c));
      push("Card atualizado!", "success");
    } else {
      setCards(prev => [...prev, { ...cardData, active: true }]);
      push("Card adicionado!", "success");
    }
    setModalOpen(false); setEditingCard(null);
  };
  const toggleCard  = (i) => setCards(prev => prev.map((c, idx) => idx === i ? { ...c, active: !c.active } : c));
  const deleteCard  = (i) => {
    if (window.confirm(`Excluir "${cards[i].title}"?`)) {
      setCards(prev => prev.filter((_, idx) => idx !== i));
      push("Card removido!", "info");
    }
  };

  /* ── plan ops ── */
  const handleSavePlan = (planData) => {
    if (editingPlan !== null) {
      setPlans(prev => prev.map((p, i) => i === editingPlan ? { ...p, ...planData } : p));
      push("Plano atualizado!", "success");
    } else {
      setPlans(prev => [...prev, planData]);
      push("Plano adicionado!", "success");
    }
    setPlanModalOpen(false); setEditingPlan(null);
  };
  const deletePlan = (i) => {
    if (window.confirm(`Excluir plano "${plans[i]?.name}"?`)) {
      setPlans(prev => prev.filter((_, idx) => idx !== i));
      push("Plano removido!", "info");
    }
  };

  const waLink = `https://wa.me/${waNumber.replace(/\D/g,"")}?text=${encodeURIComponent(waMsg)}`;

  const SECTION_LABELS = {
    hero: "Hero / Banner", solutions: "Serviços / Cards", process: "Como Funciona",
    pricing: "Planos / Preços", testimonials: "Resultados / Depoimentos", contact: "Contato / CTA Final",
  };

  const navItems = [
    { id: "overview",     label: "Visão Geral",      icon: GridIcon },
    { id: "hero",         label: "Hero / Banner",    icon: HomeIcon },
    { id: "services",     label: "Serviços / Cards", icon: LayersIcon, badge: cards.filter(c => c.active).length },
    { id: "plans",        label: "Planos / Preços",  icon: DollarIcon },
    { id: "links",        label: "Links & WhatsApp", icon: LinkIcon },
    { id: "sections",     label: "Seções Ativas",    icon: ListIcon },
    { id: "transactions", label: "Transações",       icon: CreditCardIcon },
  ];

  return (
    <>
      <style>{dashboardCSS}</style>

      {sidebarOpen && <div className="db-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="db-layout">
        {/* ── SIDEBAR ── */}
        <aside className={`db-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="db-sidebar-logo">
            <div className="db-logo-mark">BV</div>
            <div>
              <div className="db-logo-text">Black Vision</div>
              <div className="db-logo-badge">Admin Panel</div>
            </div>
          </div>

          <div className="db-nav-section">Principal</div>
          <button className={`db-nav-item ${page === "overview" ? "active" : ""}`}
            onClick={() => { setPage("overview"); setSidebarOpen(false); }}>
            <GridIcon className="db-nav-icon" /> Visão Geral
          </button>

          <div className="db-nav-section">Gerenciar Site</div>
          {navItems.slice(1).map(n => (
            <button key={n.id} className={`db-nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => { setPage(n.id); setSidebarOpen(false); }}>
              <n.icon className="db-nav-icon" />
              {n.label}
              {n.badge !== undefined && <span className="db-nav-badge">{n.badge}</span>}
            </button>
          ))}

          <div className="db-sidebar-footer">
            <div className="db-user-card">
              <div className="db-user-avatar">AD</div>
              <div>
                <div className="db-user-name">Admin</div>
                <div className="db-user-role">{user?.email || "blackvision.com"}</div>
              </div>
              <button className="db-logout-btn" onClick={doLogout} title="Sair">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="db-main">
          <header className="db-topbar">
            <button className="db-topbar-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Menu">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="db-topbar-title">
              {navItems.find(n => n.id === page)?.label || "Visão Geral"}
            </span>
            <div className="db-topbar-actions">
              <div className="db-status-pill">
                <div className="db-status-dot" />
                Site online
              </div>
              <button className="db-btn-save-global" onClick={saveAll} disabled={contentLoading}>
                {contentLoading
                  ? <Spinner size={14} color="#080808" />
                  : <SaveIcon />
                }
                Salvar Tudo
              </button>
            </div>
          </header>

          <div className="db-content">

            {/* ─── OVERVIEW ─── */}
            {page === "overview" && (
              <div className="db-page">
                <PageHeader label="Dashboard" title="Visão Geral" sub="Métricas, estado atual e saúde da API" />

                {/* Stats */}
                <div className="db-stats-grid">
                  {statsLoading ? (
                    Array.from({length: 7}).map((_, i) => (
                      <div key={i} className="db-stat-card db-stat-skeleton" />
                    ))
                  ) : stats ? [
                    { icon: "👁️", label: "Acessos",         val: stats.pageViews },
                    { icon: "🃏", label: "Cliques Cards",    val: stats.cardClicks },
                    { icon: "💬", label: "WhatsApp",         val: stats.whatsappClicks },
                    { icon: "🛒", label: "Checkout Iniciado",val: stats.checkoutStarts },
                    { icon: "✅", label: "Checkout OK",      val: stats.checkoutSuccesses },
                    { icon: "👀", label: "Views de Planos",  val: stats.planViews },
                    { icon: "🖱️", label: "Cliques em Planos",val: stats.planClicks },
                  ].map(s => (
                    <div key={s.label} className="db-stat-card">
                      <div className="db-stat-icon">{s.icon}</div>
                      <div className="db-stat-value">{s.val ?? "—"}</div>
                      <div className="db-stat-label">{s.label}</div>
                    </div>
                  )) : (
                    <div className="db-stat-card" style={{gridColumn:"1/-1",textAlign:"center",padding:"2rem"}}>
                      <p style={{color:"var(--text-muted)",fontSize:".85rem"}}>Não foi possível carregar as métricas</p>
                    </div>
                  )}
                </div>

                {/* Plan breakdown */}
                {stats && (
                  <SectionCard title="📊 Cliques por Plano">
                    <div className="db-stats-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
                      {["basic","advanced","pro"].map(tier => (
                        <div key={tier} className="db-stat-card">
                          <div className="db-stat-icon">{tier === "basic" ? "🟢" : tier === "advanced" ? "🟡" : "🔵"}</div>
                          <div className="db-stat-value">{stats[`planClicks_${tier}`] ?? 0}</div>
                          <div className="db-stat-label">Cliques {tier.charAt(0).toUpperCase()+tier.slice(1)}</div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* API Health */}
                <SectionCard title="🌐 Status da API">
                  {health ? (
                    <div className="db-guide-item">
                      <span className="db-guide-icon">✅</span>
                      <div>
                        <div className="db-guide-title">Backend Online</div>
                        <div className="db-guide-desc">
                          Gateway: <strong style={{color:"var(--gold-3)"}}>{health.gateway || "—"}</strong> &nbsp;·&nbsp;
                          Env: <strong style={{color:"var(--gold-3)"}}>{health.env || "—"}</strong> &nbsp;·&nbsp;
                          Latência: <strong style={{color:"var(--gold-3)"}}>{health.ts ? `${Date.now() - health.ts}ms` : "—"}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="db-guide-item">
                      <span className="db-guide-icon">⚠️</span>
                      <div>
                        <div className="db-guide-title">Não foi possível conectar ao backend</div>
                        <div className="db-guide-desc">Verifique se o servidor está rodando e se VITE_API_URL está correto.</div>
                      </div>
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

            {/* ─── HERO ─── */}
            {page === "hero" && (
              <div className="db-page">
                <PageHeader label="Gerenciar Site" title="Hero / Banner" sub="Edite os textos da seção principal" />
                <SectionCard title="✏️ Textos do Hero">
                  <div className="db-field">
                    <label>Título Principal</label>
                    <input value={heroTitle} onChange={e => setHeroTitle(e.target.value)} placeholder="Título do Hero" />
                  </div>
                  <div className="db-field">
                    <label>Subtítulo / Descrição</label>
                    <textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} placeholder="Descrição..." />
                  </div>
                  <div className="db-field">
                    <label>Texto da Badge</label>
                    <input value={heroBadge} onChange={e => setHeroBadge(e.target.value)} placeholder="Ex: Sistemas · Automação" />
                  </div>
                </SectionCard>
                <div className="db-action-row">
                  <button className="db-btn db-btn-primary" onClick={saveHero} disabled={contentLoading}>
                    {contentLoading ? <Spinner size={14} color="#080808"/> : <SaveIcon />} Salvar Hero
                  </button>
                </div>
              </div>
            )}

            {/* ─── SERVICES ─── */}
            {page === "services" && (
              <div className="db-page">
                <PageHeader label="Gerenciar Site" title="Serviços / Cards" sub="Adicione, edite ou remova os cards de serviços" />
                <SectionCard title="🃏 Cards de Serviços" action={
                  <button className="db-btn db-btn-primary" onClick={() => { setEditingCard(null); setModalOpen(true); }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Novo Card
                  </button>
                }>
                  {cards.length === 0
                    ? <EmptyState icon="🃏" title='Nenhum card. Clique em "Novo Card" para adicionar.' />
                    : cards.map((c, i) => (
                      <div key={i} className="db-card-item">
                        <div className="db-card-emoji">{c.icon}</div>
                        <div className="db-card-body">
                          <div className="db-card-meta">
                            <span className="db-tag-pill">{c.tag}</span>
                            <span className={`db-active-badge ${c.active ? "active" : "inactive"}`}>{c.active ? "● Ativo" : "○ Inativo"}</span>
                          </div>
                          <div className="db-card-title">{c.title}</div>
                          <div className="db-card-desc">{c.desc}</div>
                          <div className="db-card-features">{(c.features || []).map(f => <span key={f} className="db-feature-pill">✓ {f}</span>)}</div>
                        </div>
                        <div className="db-card-actions">
                          <button className={`db-btn-icon ${c.active ? "" : "success"}`} onClick={() => toggleCard(i)} title={c.active ? "Desativar" : "Ativar"}>
                            {c.active
                              ? <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                              : <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            }
                          </button>
                          <button className="db-btn-icon" onClick={() => { setEditingCard(i); setModalOpen(true); }} title="Editar">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="db-btn-icon danger" onClick={() => deleteCard(i)} title="Excluir">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  }
                </SectionCard>
                <div className="db-action-row">
                  <button className="db-btn db-btn-primary" onClick={saveCards} disabled={contentLoading}>
                    {contentLoading ? <Spinner size={14} color="#080808"/> : <SaveIcon />} Salvar Cards
                  </button>
                </div>
              </div>
            )}

            {/* ─── PLANS ─── */}
            {page === "plans" && (
              <div className="db-page">
                <PageHeader label="Gerenciar Site" title="Planos / Preços" sub="Configure os planos exibidos na seção de preços" />
                <SectionCard title="💰 Planos de Preço" action={
                  <button className="db-btn db-btn-primary" onClick={() => { setEditingPlan(null); setPlanModalOpen(true); }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Novo Plano
                  </button>
                }>
                  {plans.length === 0
                    ? <EmptyState icon="💰" title="Nenhum plano cadastrado." />
                    : plans.map((p, i) => (
                      <div key={i} className="db-card-item">
                        <div className="db-card-emoji">{p.highlighted ? "⭐" : "📦"}</div>
                        <div className="db-card-body">
                          <div className="db-card-meta">
                            <span className="db-tag-pill">{p.tier || "—"}</span>
                            {p.badge && <span className="db-tag-pill" style={{background:"rgba(201,168,76,.15)"}}>{p.badge}</span>}
                            {p.highlighted && <span className="db-active-badge active">● Destaque</span>}
                          </div>
                          <div className="db-card-title">{p.name} — {p.price}</div>
                          <div className="db-card-desc">{p.tagline}</div>
                          <div className="db-card-features">{(p.features || []).map(f => <span key={f} className="db-feature-pill">✓ {f}</span>)}</div>
                        </div>
                        <div className="db-card-actions">
                          <button className="db-btn-icon" onClick={() => { setEditingPlan(i); setPlanModalOpen(true); }} title="Editar">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="db-btn-icon danger" onClick={() => deletePlan(i)} title="Excluir">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  }
                </SectionCard>
                <div className="db-action-row">
                  <button className="db-btn db-btn-primary" onClick={savePlans} disabled={contentLoading}>
                    {contentLoading ? <Spinner size={14} color="#080808"/> : <SaveIcon />} Salvar Planos
                  </button>
                </div>
              </div>
            )}

            {/* ─── SECTIONS ─── */}
            {page === "sections" && (
              <div className="db-page">
                <PageHeader label="Gerenciar Site" title="Seções Ativas" sub="Ative ou desative seções do site" />
                <SectionCard title="📑 Controle de Seções">
                  {Object.entries(sections).map(([id, active]) => (
                    <div key={id} className="db-section-item">
                      <span className="db-section-icon">📄</span>
                      <div className="db-section-info">
                        <div className="db-section-name">{SECTION_LABELS[id] || id}</div>
                      </div>
                      <label className="db-toggle">
                        <input type="checkbox" checked={!!active} onChange={e => setSections(prev => ({ ...prev, [id]: e.target.checked }))} />
                        <div className="db-toggle-track" />
                      </label>
                    </div>
                  ))}
                </SectionCard>
                <div className="db-action-row">
                  <button className="db-btn db-btn-primary" onClick={saveSections} disabled={contentLoading}>
                    {contentLoading ? <Spinner size={14} color="#080808"/> : <SaveIcon />} Salvar Seções
                  </button>
                </div>
              </div>
            )}

            {/* ─── LINKS ─── */}
            {page === "links" && (
              <div className="db-page">
                <PageHeader label="Gerenciar Site" title="Links & WhatsApp" sub="Atualize links de contato e redes sociais" />
                <SectionCard title="💬 WhatsApp">
                  <div className="db-row2">
                    <div className="db-field">
                      <label>Número (somente dígitos)</label>
                      <input value={waNumber} onChange={e => setWaNumber(e.target.value.replace(/\D/g,""))} placeholder="557381068594" />
                      <span className="db-field-hint">DDI + DDD + número, ex: 557381068594</span>
                    </div>
                    <div className="db-field">
                      <label>Mensagem padrão</label>
                      <input value={waMsg} onChange={e => setWaMsg(e.target.value)} placeholder="Olá! Quero saber mais..." />
                    </div>
                  </div>
                  <div className="db-link-preview">
                    <div className="db-link-preview-label">Link gerado</div>
                    <div className="db-link-preview-url">{waLink}</div>
                  </div>
                </SectionCard>
                <SectionCard title="🔗 Redes Sociais">
                  <div className="db-field">
                    <label>Instagram</label>
                    <input value={instagram} onChange={e => setInstagram(e.target.value)} type="url" placeholder="https://instagram.com/..." />
                  </div>
                </SectionCard>
                <div className="db-action-row">
                  <button className="db-btn db-btn-primary" onClick={saveLinks} disabled={contentLoading}>
                    {contentLoading ? <Spinner size={14} color="#080808"/> : <SaveIcon />} Salvar Links
                  </button>
                </div>
              </div>
            )}

            {/* ─── TRANSACTIONS ─── */}
            {page === "transactions" && (
              <div className="db-page">
                <PageHeader label="Financeiro" title="Transações" sub="Histórico de pagamentos registrados" />
                {txLoading ? (
                  <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
                    <Spinner size={32} />
                  </div>
                ) : transactions.length === 0 ? (
                  <EmptyState
                    icon="💳"
                    title="Nenhuma transação encontrada"
                    description="As transações aparecerão aqui assim que os primeiros checkouts forem iniciados."
                  />
                ) : (
                  <SectionCard title={`💳 ${transactions.length} transações`}>
                    <div className="db-tx-table">
                      <div className="db-tx-header">
                        <span>Data</span>
                        <span>Cliente</span>
                        <span>Plano</span>
                        <span>Valor</span>
                        <span>Gateway</span>
                        <span>Status</span>
                      </div>
                      {transactions.map((tx, i) => (
                        <div key={tx.id || i} className="db-tx-row">
                          <span className="db-tx-date">{fmtDate(tx.createdAt)}</span>
                          <span className="db-tx-email" title={tx.customerEmail}>{tx.customerEmail || "—"}</span>
                          <span className="db-tx-tier">
                            <span className="db-tag-pill">{tx.tier || "—"}</span>
                          </span>
                          <span className="db-tx-amount">{fmtCurrency(tx.amount, tx.currency)}</span>
                          <span className="db-tx-gateway">{tx.gateway || "—"}</span>
                          <span><StatusBadge status={tx.status} /></span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modals */}
      {modalOpen && (
        <CardModal
          card={editingCard !== null ? { ...cards[editingCard], features: cards[editingCard].features.join("\n") } : null}
          onClose={() => { setModalOpen(false); setEditingCard(null); }}
          onSave={handleSaveCard}
        />
      )}
      {planModalOpen && (
        <PlanModal
          plan={editingPlan !== null ? { ...plans[editingPlan], features: (plans[editingPlan].features || []).join("\n") } : null}
          onClose={() => { setPlanModalOpen(false); setEditingPlan(null); }}
          onSave={handleSavePlan}
        />
      )}
    </>
  );
}

/* ── Helper sub-components ── */
function PageHeader({ label, title, sub }) {
  return (
    <div className="db-page-header">
      <div className="db-page-label">{label}</div>
      <h1 className="db-page-title">{title}</h1>
      {sub && <p className="db-page-sub">{sub}</p>}
    </div>
  );
}

function SectionCard({ title, children, action }) {
  return (
    <div className="db-section-card">
      <div className="db-section-card-header">
        <div className="db-section-card-title">{title}</div>
        {action}
      </div>
      <div className="db-section-card-body">{children}</div>
    </div>
  );
}

/* ── Icons ── */
const GridIcon       = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const HomeIcon       = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const LayersIcon     = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
const DollarIcon     = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const ListIcon       = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const LinkIcon       = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const CreditCardIcon = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const SaveIcon       = ()            => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;

/* ── CSS ── */
const dashboardCSS = `
  .db-layout { display:flex; min-height:100svh; }

  .db-sidebar {
    width:260px; background:var(--bg-2); border-right:1px solid var(--border);
    display:flex; flex-direction:column;
    position:fixed; inset-block:0; left:0; z-index:200;
    transition:transform var(--transition);
    overflow-y:auto; overflow-x:hidden;
  }
  .db-sidebar::-webkit-scrollbar{width:4px}
  .db-sidebar::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
  .db-sidebar-overlay{position:fixed;inset:0;z-index:190;background:rgba(0,0,0,.6)}
  @media(max-width:767px){
    .db-sidebar{transform:translateX(-100%)}
    .db-sidebar.open{transform:translateX(0);box-shadow:0 0 60px rgba(0,0,0,.8)}
  }

  .db-sidebar-logo{padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:.75rem;flex-shrink:0}
  .db-logo-mark{width:36px;height:36px;border-radius:10px;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;font-family:var(--font-title);font-size:1rem;font-weight:800;color:#080808;flex-shrink:0}
  .db-logo-text{font-family:var(--font-title);font-size:1rem;font-weight:800;letter-spacing:-.04em;background:linear-gradient(90deg,#8a6d28 0%,#e2c97e 50%,#8a6d28 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:al-shimmer 4s linear infinite}
  .db-logo-badge{font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);font-family:var(--font-body)}
  .db-nav-section{padding:1rem 1rem .5rem;font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);font-family:var(--font-body);font-weight:600}
  .db-nav-item{display:flex;align-items:center;gap:.75rem;padding:.65rem 1.25rem;margin:.15rem .75rem;border-radius:var(--radius);font-family:var(--font-body);font-size:.875rem;font-weight:400;color:var(--text-muted);cursor:pointer;border:none;background:none;transition:background var(--transition),color var(--transition);text-align:left;width:calc(100% - 1.5rem)}
  .db-nav-item:hover{background:rgba(255,255,255,.04);color:var(--text)}
  .db-nav-item.active{background:rgba(201,168,76,.1);color:var(--gold-3);border:1px solid rgba(201,168,76,.15)}
  .db-nav-icon{flex-shrink:0;opacity:.7}
  .db-nav-item.active .db-nav-icon{opacity:1}
  .db-nav-badge{margin-left:auto;background:var(--accent-gradient);color:#080808;font-size:.62rem;font-weight:700;padding:.15rem .45rem;border-radius:100px}
  .db-sidebar-footer{margin-top:auto;padding:1.25rem;border-top:1px solid var(--border);flex-shrink:0}
  .db-user-card{display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--radius)}
  .db-user-avatar{width:36px;height:36px;border-radius:50%;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;color:#080808;flex-shrink:0}
  .db-user-name{font-size:.85rem;font-weight:500;line-height:1.2}
  .db-user-role{font-size:.72rem;color:var(--text-muted);font-weight:300;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px}
  .db-logout-btn{margin-left:auto;background:none;border:none;color:var(--text-muted);cursor:pointer;padding:.25rem;border-radius:6px;transition:color var(--transition),background var(--transition);display:flex;align-items:center}
  .db-logout-btn:hover{color:#ef4444;background:rgba(239,68,68,.08)}

  .db-main{margin-left:260px;flex:1;display:flex;flex-direction:column;min-height:100svh}
  @media(max-width:767px){.db-main{margin-left:0}}

  .db-topbar{height:64px;background:rgba(8,8,8,.92);backdrop-filter:blur(16px) saturate(160%);-webkit-backdrop-filter:blur(16px) saturate(160%);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 1.5rem;gap:1rem;position:sticky;top:0;z-index:100}
  .db-topbar-toggle{display:none;background:none;border:none;color:var(--text-muted);cursor:pointer;padding:.4rem;border-radius:8px;transition:background var(--transition)}
  .db-topbar-toggle:hover{background:rgba(255,255,255,.06)}
  @media(max-width:767px){.db-topbar-toggle{display:flex}}
  .db-topbar-title{font-family:var(--font-title);font-size:1.1rem;font-weight:800;letter-spacing:-.04em;flex:1}
  .db-topbar-actions{display:flex;align-items:center;gap:.75rem}
  .db-status-pill{display:flex;align-items:center;gap:.5rem;padding:.35rem .875rem;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:100px;font-size:.75rem;font-weight:500;color:#22c55e;font-family:var(--font-body)}
  .db-status-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;animation:al-glow-pulse 2s ease-in-out infinite}
  @media(max-width:480px){.db-status-pill{display:none}}
  .db-btn-save-global{display:flex;align-items:center;gap:.5rem;padding:.55rem 1.25rem;background:var(--accent-gradient);border:none;border-radius:var(--radius);font-family:var(--font-body);font-size:.82rem;font-weight:600;color:#080808;cursor:pointer;box-shadow:0 2px 12px rgba(201,168,76,.25);transition:transform var(--transition),box-shadow var(--transition)}
  .db-btn-save-global:hover:not(:disabled){transform:translateY(-1px);box-shadow:var(--accent-glow)}
  .db-btn-save-global:disabled{opacity:.7;cursor:not-allowed}

  .db-content{flex:1;padding:1.75rem;max-width:1100px;width:100%}
  @media(min-width:768px){.db-content{padding:2rem 2.5rem}}

  .db-page{animation:al-card-in .3s ease}
  .db-page-header{margin-bottom:2rem}
  .db-page-label{font-size:.7rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--gold-2);font-family:var(--font-body);margin-bottom:.4rem;display:flex;align-items:center;gap:.5rem}
  .db-page-label::before{content:'';width:1.5rem;height:1px;background:var(--gold-2)}
  .db-page-title{font-family:var(--font-title);font-size:clamp(1.5rem,3vw,2.25rem);font-weight:800;letter-spacing:-.04em;line-height:1}
  .db-page-sub{font-size:.875rem;color:var(--text-muted);margin-top:.5rem;font-weight:300}

  .db-stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-bottom:1.5rem}
  @media(min-width:640px){.db-stats-grid{grid-template-columns:repeat(4,1fr)}}
  @media(min-width:1024px){.db-stats-grid{grid-template-columns:repeat(7,1fr)}}
  .db-stat-card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem 1.5rem;transition:border-color var(--transition),transform var(--transition)}
  .db-stat-card:hover{border-color:var(--border-hover);transform:translateY(-2px)}
  .db-stat-skeleton{min-height:100px;animation:_sk_wave 1.5s ease-in-out infinite;background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);background-size:200% auto}
  .db-stat-icon{font-size:1.3rem;margin-bottom:.75rem}
  .db-stat-value{font-family:var(--font-title);font-size:1.8rem;font-weight:800;letter-spacing:-.04em;background:var(--accent-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .db-stat-label{font-size:.72rem;color:var(--text-muted);margin-top:.3rem}

  .db-section-card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:1.5rem}
  .db-section-card-header{padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:1rem}
  .db-section-card-title{font-family:var(--font-title);font-size:1rem;font-weight:800;letter-spacing:-.03em}
  .db-section-card-body{padding:1.5rem;display:flex;flex-direction:column;gap:1rem}

  .db-field{display:flex;flex-direction:column;gap:.4rem}
  .db-field label{font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);font-family:var(--font-body)}
  .db-field input,.db-field textarea,.db-field select{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--radius);padding:.75rem 1rem;font-family:var(--font-body);font-size:.875rem;font-weight:400;color:var(--text);width:100%;transition:border-color var(--transition),box-shadow var(--transition),background var(--transition);outline:none;-webkit-appearance:none}
  .db-field input:focus,.db-field textarea:focus{border-color:rgba(201,168,76,.5);background:rgba(201,168,76,.04);box-shadow:0 0 0 3px rgba(201,168,76,.08)}
  .db-field input::placeholder,.db-field textarea::placeholder{color:rgba(168,162,158,.4)}
  .db-field textarea{resize:vertical;min-height:90px}
  .db-field-hint{font-size:.72rem;color:var(--text-muted);font-weight:300}
  .db-row2{display:grid;gap:1rem}
  @media(min-width:640px){.db-row2{grid-template-columns:1fr 1fr}}

  .db-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border:none;cursor:pointer;border-radius:var(--radius);font-family:var(--font-body);font-weight:500;transition:transform var(--transition),box-shadow var(--transition),background var(--transition)}
  .db-btn-primary{background:var(--accent-gradient);color:#080808;padding:.65rem 1.25rem;font-size:.85rem;font-weight:600;box-shadow:0 2px 12px rgba(201,168,76,.2)}
  .db-btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:var(--accent-glow)}
  .db-btn-primary:active:not(:disabled){transform:scale(.97)}
  .db-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
  .db-btn-ghost{background:rgba(255,255,255,.04);color:var(--text-muted);border:1px solid var(--border);padding:.65rem 1.25rem;font-size:.85rem}
  .db-btn-ghost:hover{background:rgba(255,255,255,.07);color:var(--text);border-color:var(--border-hover)}
  .db-action-row{display:flex;justify-content:flex-end;gap:.75rem;margin-top:.5rem}

  .db-card-item{background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem;display:flex;align-items:flex-start;gap:1rem;transition:border-color var(--transition)}
  .db-card-item:hover{border-color:var(--border-hover)}
  .db-card-emoji{width:48px;height:48px;border-radius:12px;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0}
  .db-card-body{flex:1;display:flex;flex-direction:column;gap:.5rem;min-width:0}
  .db-card-meta{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
  .db-tag-pill{display:inline-flex;align-items:center;padding:.2rem .625rem;background:rgba(201,168,76,.08);border:1px solid var(--border);border-radius:100px;font-size:.68rem;font-weight:600;color:var(--gold-2);letter-spacing:.06em;text-transform:uppercase}
  .db-active-badge{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .625rem;border-radius:100px;font-size:.68rem;font-weight:500}
  .db-active-badge.active{background:rgba(34,197,94,.1);color:#22c55e}
  .db-active-badge.inactive{background:rgba(239,68,68,.08);color:#f87171}
  .db-card-title{font-weight:500;font-size:.9rem;color:var(--text)}
  .db-card-desc{font-size:.78rem;color:var(--text-muted);font-weight:300;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .db-card-features{display:flex;flex-wrap:wrap;gap:.35rem}
  .db-feature-pill{font-size:.68rem;color:var(--gold-2);background:rgba(201,168,76,.08);border:1px solid var(--border);border-radius:100px;padding:.15rem .5rem}
  .db-card-actions{display:flex;gap:.5rem;flex-shrink:0;align-self:flex-start}
  .db-btn-icon{width:32px;height:32px;border-radius:8px;background:none;border:1px solid var(--border);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background var(--transition),color var(--transition),border-color var(--transition)}
  .db-btn-icon:hover{background:rgba(255,255,255,.06);color:var(--text);border-color:var(--border-hover)}
  .db-btn-icon.danger:hover{background:rgba(239,68,68,.08);color:#f87171;border-color:rgba(239,68,68,.2)}
  .db-btn-icon.success:hover{background:rgba(34,197,94,.08);color:#22c55e;border-color:rgba(34,197,94,.2)}

  .db-section-item{display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius);transition:border-color var(--transition)}
  .db-section-item:hover{border-color:var(--border-hover)}
  .db-section-icon{font-size:1.1rem;flex-shrink:0}
  .db-section-info{flex:1}
  .db-section-name{font-size:.9rem;font-weight:500}
  .db-section-desc{font-size:.75rem;color:var(--text-muted);margin-top:.15rem;font-weight:300}
  .db-toggle{position:relative;display:inline-block;width:40px;height:22px;flex-shrink:0}
  .db-toggle input{opacity:0;width:0;height:0}
  .db-toggle-track{position:absolute;inset:0;cursor:pointer;background:rgba(255,255,255,.1);border-radius:100px;border:1px solid var(--border);transition:background var(--transition)}
  .db-toggle-track::after{content:'';position:absolute;left:3px;top:50%;transform:translateY(-50%);width:16px;height:16px;border-radius:50%;background:var(--text-muted);transition:transform var(--transition),background var(--transition)}
  .db-toggle input:checked + .db-toggle-track{background:rgba(201,168,76,.2);border-color:rgba(201,168,76,.4)}
  .db-toggle input:checked + .db-toggle-track::after{transform:translateX(18px) translateY(-50%);background:var(--gold-2)}

  .db-link-preview{padding:.875rem 1.25rem;background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius)}
  .db-link-preview-label{font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:.4rem}
  .db-link-preview-url{font-size:.8rem;color:var(--gold-3);font-family:monospace;word-break:break-all}

  .db-guide-item{display:flex;gap:.875rem;align-items:flex-start;padding:.875rem;background:var(--bg-3);border-radius:var(--radius);border:1px solid var(--border)}
  .db-guide-icon{font-size:1.2rem;flex-shrink:0}
  .db-guide-title{font-weight:500;font-size:.88rem;margin-bottom:.25rem}
  .db-guide-desc{font-size:.78rem;color:var(--text-muted);font-weight:300;line-height:1.5}

  /* transactions table */
  .db-tx-table{display:flex;flex-direction:column;gap:.5rem;overflow-x:auto}
  .db-tx-header{display:grid;grid-template-columns:140px 1fr 90px 100px 100px 100px;gap:1rem;padding:.5rem 1rem;font-size:.68rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);border-bottom:1px solid var(--border)}
  .db-tx-row{display:grid;grid-template-columns:140px 1fr 90px 100px 100px 100px;gap:1rem;padding:.75rem 1rem;background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius);font-size:.8rem;align-items:center;transition:border-color var(--transition)}
  .db-tx-row:hover{border-color:var(--border-hover)}
  .db-tx-date{color:var(--text-muted);font-size:.75rem}
  .db-tx-email{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .db-tx-amount{font-weight:600;font-family:var(--font-title)}
  .db-tx-gateway{color:var(--text-muted);text-transform:capitalize}
  @media(max-width:767px){
    .db-tx-header,.db-tx-row{grid-template-columns:1fr 1fr;gap:.5rem}
    .db-tx-header span:nth-child(n+3),.db-tx-row span:nth-child(n+3){display:none}
    .db-tx-row{padding:.625rem .875rem}
  }

  /* modal */
  .db-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:500;display:flex;align-items:center;justify-content:center;padding:1rem;animation:db-fade-in .2s ease}
  @keyframes db-fade-in{from{opacity:0}to{opacity:1}}
  .db-modal{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);width:100%;max-width:560px;max-height:90svh;overflow-y:auto;animation:al-card-in .3s cubic-bezier(.34,1.56,.64,1)}
  .db-modal-header{padding:1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
  .db-modal-title{font-family:var(--font-title);font-size:1.1rem;font-weight:800;letter-spacing:-.03em}
  .db-modal-close{background:none;border:none;color:var(--text-muted);cursor:pointer;padding:.25rem;border-radius:6px;transition:color var(--transition),background var(--transition);display:flex;align-items:center}
  .db-modal-close:hover{color:var(--text);background:rgba(255,255,255,.06)}
  .db-modal-body{padding:1.5rem;display:flex;flex-direction:column;gap:1rem}
  .db-modal-footer{padding:1.25rem 1.5rem;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:.75rem}
`;
