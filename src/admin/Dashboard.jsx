import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth";
import { getStats } from "../services/tracking";
import { getContent, saveContent } from "../store/contentStore";

/* ── default data ── */
const DEFAULT_CARDS = [
  {
    icon: "💻", tag: "Sistemas Web", active: true,
    title: "Sistemas Web de Alta Performance",
    desc: "Landing pages, e-commerces e sistemas web construídos para converter. Lighthouse 95+, SEO técnico e UX que gera vendas.",
    features: ["Carregamento < 2s", "SEO Técnico Avançado", "Conversão Otimizada", "Dashboard Admin"],
  },
  {
    icon: "⚙️", tag: "Automação", active: true,
    title: "Automação de Processos Operacionais",
    desc: "Elimine tarefas repetitivas, integre sistemas e crie fluxos automáticos que economizam tempo e reduzem erros.",
    features: ["Make / n8n / Zapier", "Integração de ERPs", "WhatsApp Automático", "Relatórios em Tempo Real"],
  },
  {
    icon: "🤖", tag: "IA Aplicada", active: true,
    title: "Soluções com Inteligência Artificial",
    desc: "Chatbots inteligentes, análise preditiva e automação cognitiva. IA que realmente trabalha pelo seu negócio.",
    features: ["Chatbot com IA", "Análise de Dados", "Geração de Conteúdo", "Personalização em Escala"],
  },
];

const DEFAULT_SECTIONS = [
  { id: "hero",         name: "Hero / Banner",      desc: "Seção principal com título e imagem",    icon: "🏠", active: true },
  { id: "solutions",    name: "Serviços",            desc: "Cards de serviços oferecidos",           icon: "🃏", active: true },
  { id: "process",      name: "Como Funciona",       desc: "Etapas do processo de trabalho",         icon: "🔄", active: true },
  { id: "pricing",      name: "Planos / Preços",     desc: "Tabela de preços e planos",              icon: "💰", active: true },
  { id: "testimonials", name: "Resultados",          desc: "Depoimentos de clientes",                icon: "⭐", active: true },
  { id: "contact",      name: "Contato / CTA Final", desc: "Seção de contato e botão de ação final", icon: "📩", active: true },
];

/* ── Toast ── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return { toasts, push };
}

/* ── Modal ── */
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

/* ── Main Dashboard ── */
export default function Dashboard() {
  const navigate  = useNavigate();
  const { toasts, push } = useToast();

  const [page, setPage]           = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats]         = useState(null);

  /* hero content */
  const savedContent = getContent();
  const [heroTitle, setHeroTitle]     = useState(savedContent.heroTitle || "Transforme seu negócio com tecnologia que gera resultado.");
  const [heroSubtitle, setHeroSubtitle] = useState(savedContent.heroSubtitle || "Construímos sistemas web de alta performance, automatizamos processos operacionais e implementamos IA para empresas que querem crescer de forma consistente e mensurável.");
  const [heroBadge, setHeroBadge]     = useState(savedContent.heroBadge || "Sistemas · Automação · Inteligência Artificial");

  /* cards */
  const [cards, setCards]     = useState(() => JSON.parse(localStorage.getItem("bv_cards") || "null") || DEFAULT_CARDS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null); // null=new, number=index

  /* sections */
  const [sections, setSections] = useState(() => JSON.parse(localStorage.getItem("bv_sections") || "null") || DEFAULT_SECTIONS);

  /* links */
  const [waNumber, setWaNumber] = useState(savedContent.waNumber || "557381068594");
  const [waMsg, setWaMsg]       = useState(savedContent.waMsg    || "Olá! Quero saber mais sobre os serviços da Black Vision.");
  const [instagram, setInstagram] = useState(savedContent.instagram || "https://www.instagram.com/blackvision.br/");

  /* load stats */
  useEffect(() => {
    getStats()
      .then(d => setStats(d || { pageViews: 0, cardClicks: 0, whatsappClicks: 0 }))
      .catch(() => setStats({ pageViews: 0, cardClicks: 0, whatsappClicks: 0 }));
  }, []);

  /* persist cards */
  useEffect(() => { localStorage.setItem("bv_cards", JSON.stringify(cards)); }, [cards]);
  useEffect(() => { localStorage.setItem("bv_sections", JSON.stringify(sections)); }, [sections]);

  const doLogout = () => { logout(); navigate("/admin"); };

  const navItems = [
    { id: "overview",  label: "Visão Geral",    icon: GridIcon },
    { id: "hero",      label: "Hero / Banner",  icon: HomeIcon },
    { id: "services",  label: "Serviços / Cards", icon: LayersIcon, badge: cards.filter(c => c.active).length },
    { id: "cta",       label: "CTA / Botões",   icon: ZapIcon },
    { id: "sections",  label: "Seções Ativas",  icon: ListIcon },
    { id: "links",     label: "Links & WhatsApp", icon: LinkIcon },
  ];

  const pageTitles = {
    overview: "Visão Geral", hero: "Hero / Banner", services: "Serviços / Cards",
    cta: "CTA / Botões", sections: "Seções Ativas", links: "Links & WhatsApp",
  };

  /* ── save handlers ── */
  const saveHero = () => {
    saveContent({ ...getContent(), heroTitle, heroSubtitle, heroBadge });
    push("Hero salvo com sucesso!");
  };
  const saveCTA  = () => push("CTA salvo com sucesso!");
  const saveSections = () => push("Seções salvas com sucesso!");
  const saveLinks = () => {
    saveContent({ ...getContent(), waNumber, waMsg, instagram });
    push("Links salvos com sucesso!");
  };
  const saveAll = () => {
    saveContent({ ...getContent(), heroTitle, heroSubtitle, heroBadge, waNumber, waMsg, instagram });
    localStorage.setItem("bv_cards", JSON.stringify(cards));
    localStorage.setItem("bv_sections", JSON.stringify(sections));
    push("Todas as alterações foram salvas!");
  };

  /* ── card ops ── */
  const openNewCard  = () => { setEditingCard(null); setModalOpen(true); };
  const openEditCard = (i) => { setEditingCard(i); setModalOpen(true); };
  const closeModal   = () => { setModalOpen(false); setEditingCard(null); };

  const handleSaveCard = (cardData) => {
    if (editingCard !== null) {
      setCards(prev => prev.map((c, i) => i === editingCard ? { ...c, ...cardData } : c));
      push("Card atualizado com sucesso!");
    } else {
      setCards(prev => [...prev, { ...cardData, active: true }]);
      push("Card adicionado com sucesso!");
    }
    closeModal();
  };

  const toggleCard  = (i) => { setCards(prev => prev.map((c, idx) => idx === i ? { ...c, active: !c.active } : c)); };
  const deleteCard  = (i) => { if (window.confirm(`Excluir "${cards[i].title}"?`)) { setCards(prev => prev.filter((_, idx) => idx !== i)); push("Card removido!"); } };
  const toggleSection = (i, val) => setSections(prev => prev.map((s, idx) => idx === i ? { ...s, active: val } : s));

  const waLink = `https://wa.me/${waNumber.replace(/\D/g,"")}?text=${encodeURIComponent(waMsg)}`;

  return (
    <>
      <style>{dashboardCSS}</style>

      {/* Sidebar overlay (mobile) */}
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
          {navItems.slice(0,1).map(n => (
            <button key={n.id} className={`db-nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => { setPage(n.id); setSidebarOpen(false); }}>
              <n.icon className="db-nav-icon" />
              {n.label}
            </button>
          ))}

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
                <div className="db-user-role">blackvision.com</div>
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
          {/* Topbar */}
          <header className="db-topbar">
            <button className="db-topbar-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Menu">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="db-topbar-title">{pageTitles[page]}</span>
            <div className="db-topbar-actions">
              <div className="db-status-pill">
                <div className="db-status-dot" />
                Site online
              </div>
              <button className="db-btn-save-global" onClick={saveAll}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                Salvar Tudo
              </button>
            </div>
          </header>

          {/* Content */}
          <div className="db-content">

            {/* ─── OVERVIEW ─── */}
            {page === "overview" && (
              <div className="db-page">
                <PageHeader label="Dashboard" title="Visão Geral" sub="Métricas e estado atual do site" />

                <div className="db-stats-grid">
                  {[
                    { icon: "👁️", label: "Acessos",         val: stats ? stats.pageViews    : "—" },
                    { icon: "🃏", label: "Cliques nos Cards", val: stats ? stats.cardClicks   : "—" },
                    { icon: "💬", label: "WhatsApp Cliques", val: stats ? stats.whatsappClicks: "—" },
                    { icon: "📝", label: "Cards Ativos",     val: cards.filter(c => c.active).length },
                  ].map(s => (
                    <div key={s.label} className="db-stat-card">
                      <div className="db-stat-icon">{s.icon}</div>
                      <div className="db-stat-value">{s.val}</div>
                      <div className="db-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>

                <SectionCard title="Guia Rápido">
                  {[
                    { icon:"🏠", title:"Hero / Banner",      desc:"Edite título, subtítulo e imagem da seção principal" },
                    { icon:"🃏", title:"Serviços / Cards",    desc:"Adicione, edite ou remova os cards de serviços" },
                    { icon:"🔗", title:"Links & WhatsApp",    desc:"Atualize o número, mensagem e redes sociais" },
                  ].map(g => (
                    <div key={g.title} className="db-guide-item">
                      <span className="db-guide-icon">{g.icon}</span>
                      <div><div className="db-guide-title">{g.title}</div><div className="db-guide-desc">{g.desc}</div></div>
                    </div>
                  ))}
                </SectionCard>
              </div>
            )}

            {/* ─── HERO ─── */}
            {page === "hero" && (
              <div className="db-page">
                <PageHeader label="Gerenciar Site" title="Hero / Banner" sub="Edite o conteúdo da seção principal" />

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
                  <button className="db-btn db-btn-primary" onClick={saveHero}>
                    <SaveIcon /> Salvar Hero
                  </button>
                </div>
              </div>
            )}

            {/* ─── SERVICES ─── */}
            {page === "services" && (
              <div className="db-page">
                <PageHeader label="Gerenciar Site" title="Serviços / Cards" sub="Adicione, edite ou remova os cards de serviços" />

                <SectionCard title="🃏 Cards de Serviços" action={
                  <button className="db-btn db-btn-primary" onClick={openNewCard}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Novo Card
                  </button>
                }>
                  {cards.length === 0 ? (
                    <div className="db-empty">Nenhum card. Clique em "Novo Card" para adicionar.</div>
                  ) : cards.map((c, i) => (
                    <div key={i} className="db-card-item">
                      <div className="db-card-emoji">{c.icon}</div>
                      <div className="db-card-body">
                        <div className="db-card-meta">
                          <span className="db-tag-pill">{c.tag}</span>
                          <span className={`db-active-badge ${c.active ? "active" : "inactive"}`}>
                            {c.active ? "● Ativo" : "○ Inativo"}
                          </span>
                        </div>
                        <div className="db-card-title">{c.title}</div>
                        <div className="db-card-desc">{c.desc}</div>
                        <div className="db-card-features">
                          {c.features.map(f => <span key={f} className="db-feature-pill">✓ {f}</span>)}
                        </div>
                      </div>
                      <div className="db-card-actions">
                        <button className={`db-btn-icon ${c.active ? "" : "success"}`} onClick={() => toggleCard(i)} title={c.active ? "Desativar" : "Ativar"}>
                          {c.active
                            ? <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            : <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          }
                        </button>
                        <button className="db-btn-icon" onClick={() => openEditCard(i)} title="Editar">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="db-btn-icon danger" onClick={() => deleteCard(i)} title="Excluir">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </SectionCard>
              </div>
            )}

            {/* ─── CTA ─── */}
            {page === "cta" && (
              <div className="db-page">
                <PageHeader label="Gerenciar Site" title="CTA / Botões" sub="Configure os textos e links dos botões de ação" />

                <SectionCard title="🎯 Botão Principal (Hero)">
                  <div className="db-row2">
                    <div className="db-field"><label>Texto do Botão</label><input defaultValue="Quero Crescer com IA" /></div>
                    <div className="db-field"><label>Link</label><input type="url" defaultValue={`https://wa.me/${waNumber}`} /></div>
                  </div>
                </SectionCard>

                <SectionCard title="📱 Seção CTA Final">
                  <div className="db-field"><label>Título</label><input defaultValue="Pronto para transformar seu negócio?" /></div>
                  <div className="db-field"><label>Subtítulo</label><textarea defaultValue="Agende uma reunião estratégica gratuita de 30 minutos e descubra como nossa tecnologia pode acelerar seus resultados." /></div>
                  <div className="db-row2">
                    <div className="db-field"><label>Texto do Botão CTA</label><input defaultValue="Agendar Diagnóstico Gratuito" /></div>
                    <div className="db-field"><label>Link do Botão CTA</label><input type="url" defaultValue={`https://wa.me/${waNumber}`} /></div>
                  </div>
                </SectionCard>

                <div className="db-action-row">
                  <button className="db-btn db-btn-primary" onClick={saveCTA}><SaveIcon /> Salvar CTA</button>
                </div>
              </div>
            )}

            {/* ─── SECTIONS ─── */}
            {page === "sections" && (
              <div className="db-page">
                <PageHeader label="Gerenciar Site" title="Seções Ativas" sub="Ative ou desative seções do site" />

                <SectionCard title="📑 Controle de Seções">
                  {sections.map((s, i) => (
                    <div key={s.id} className="db-section-item">
                      <span className="db-section-icon">{s.icon}</span>
                      <div className="db-section-info">
                        <div className="db-section-name">{s.name}</div>
                        <div className="db-section-desc">{s.desc}</div>
                      </div>
                      <label className="db-toggle">
                        <input type="checkbox" checked={s.active} onChange={e => toggleSection(i, e.target.checked)} />
                        <div className="db-toggle-track" />
                      </label>
                    </div>
                  ))}
                </SectionCard>

                <div className="db-action-row">
                  <button className="db-btn db-btn-primary" onClick={saveSections}><SaveIcon /> Salvar Seções</button>
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
                  <div className="db-field">
                    <label>LinkedIn (opcional)</label>
                    <input type="url" placeholder="https://linkedin.com/..." />
                  </div>
                </SectionCard>

                <div className="db-action-row">
                  <button className="db-btn db-btn-primary" onClick={saveLinks}><SaveIcon /> Salvar Links</button>
                </div>
              </div>
            )}

          </div>{/* /content */}
        </div>{/* /main */}
      </div>{/* /layout */}

      {/* Modal */}
      {modalOpen && (
        <CardModal
          card={editingCard !== null ? { ...cards[editingCard], features: cards[editingCard].features.join("\n") } : null}
          onClose={closeModal}
          onSave={handleSaveCard}
        />
      )}

      {/* Toasts */}
      <div className="db-toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`db-toast ${t.type}`}>
            <span className={`db-toast-icon ${t.type}`}>
              {t.type === "success"
                ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              }
            </span>
            {t.msg}
          </div>
        ))}
      </div>
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
const GridIcon    = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const HomeIcon    = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const LayersIcon  = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
const ZapIcon     = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const ListIcon    = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const LinkIcon    = ({className}) => <svg className={className} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const SaveIcon    = ()            => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;

/* ── CSS ── */
const dashboardCSS = `
  .db-layout { display:flex; min-height:100svh; }

  /* sidebar */
  .db-sidebar {
    width:260px; background:var(--bg-2); border-right:1px solid var(--border);
    display:flex; flex-direction:column;
    position:fixed; inset-block:0; left:0; z-index:200;
    transition:transform var(--transition);
    overflow-y:auto; overflow-x:hidden;
  }
  .db-sidebar::-webkit-scrollbar{width:4px}
  .db-sidebar::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
  .db-sidebar-overlay{position:fixed;inset:0;z-index:190;background:rgba(0,0,0,.6);display:none}
  @media(max-width:767px){
    .db-sidebar{transform:translateX(-100%)}
    .db-sidebar.open{transform:translateX(0);box-shadow:0 0 60px rgba(0,0,0,.8)}
    .db-sidebar-overlay{display:block}
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
  .db-user-role{font-size:.72rem;color:var(--text-muted);font-weight:300}
  .db-logout-btn{margin-left:auto;background:none;border:none;color:var(--text-muted);cursor:pointer;padding:.25rem;border-radius:6px;transition:color var(--transition),background var(--transition);display:flex;align-items:center}
  .db-logout-btn:hover{color:#ef4444;background:rgba(239,68,68,.08)}

  /* main */
  .db-main{margin-left:260px;flex:1;display:flex;flex-direction:column;min-height:100svh}
  @media(max-width:767px){.db-main{margin-left:0}}

  /* topbar */
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
  .db-btn-save-global:hover{transform:translateY(-1px);box-shadow:var(--accent-glow)}

  /* content */
  .db-content{flex:1;padding:1.75rem;max-width:1100px;width:100%}
  @media(min-width:768px){.db-content{padding:2rem 2.5rem}}

  /* page */
  .db-page{animation:al-card-in .3s ease}
  .db-page-header{margin-bottom:2rem}
  .db-page-label{font-size:.7rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--gold-2);font-family:var(--font-body);margin-bottom:.4rem;display:flex;align-items:center;gap:.5rem}
  .db-page-label::before{content:'';width:1.5rem;height:1px;background:var(--gold-2)}
  .db-page-title{font-family:var(--font-title);font-size:clamp(1.5rem,3vw,2.25rem);font-weight:800;letter-spacing:-.04em;line-height:1}
  .db-page-sub{font-size:.875rem;color:var(--text-muted);margin-top:.5rem;font-weight:300}

  /* stats */
  .db-stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-bottom:1.5rem}
  @media(min-width:640px){.db-stats-grid{grid-template-columns:repeat(4,1fr)}}
  .db-stat-card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem 1.5rem;transition:border-color var(--transition),transform var(--transition)}
  .db-stat-card:hover{border-color:var(--border-hover);transform:translateY(-2px)}
  .db-stat-icon{font-size:1.3rem;margin-bottom:.75rem}
  .db-stat-value{font-family:var(--font-title);font-size:1.8rem;font-weight:800;letter-spacing:-.04em;background:var(--accent-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .db-stat-label{font-size:.75rem;color:var(--text-muted);margin-top:.3rem}

  /* section card */
  .db-section-card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:1.5rem}
  .db-section-card-header{padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:1rem}
  .db-section-card-title{font-family:var(--font-title);font-size:1rem;font-weight:800;letter-spacing:-.03em}
  .db-section-card-body{padding:1.5rem;display:flex;flex-direction:column;gap:1rem}

  /* form */
  .db-field{display:flex;flex-direction:column;gap:.4rem}
  .db-field label{font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);font-family:var(--font-body)}
  .db-field input,.db-field textarea,.db-field select{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--radius);padding:.75rem 1rem;font-family:var(--font-body);font-size:.875rem;font-weight:400;color:var(--text);width:100%;transition:border-color var(--transition),box-shadow var(--transition),background var(--transition);outline:none;-webkit-appearance:none}
  .db-field input:focus,.db-field textarea:focus{border-color:rgba(201,168,76,.5);background:rgba(201,168,76,.04);box-shadow:0 0 0 3px rgba(201,168,76,.08)}
  .db-field input::placeholder,.db-field textarea::placeholder{color:rgba(168,162,158,.4)}
  .db-field textarea{resize:vertical;min-height:90px}
  .db-field-hint{font-size:.72rem;color:var(--text-muted);font-weight:300}
  .db-row2{display:grid;gap:1rem}
  @media(min-width:640px){.db-row2{grid-template-columns:1fr 1fr}}

  /* buttons */
  .db-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border:none;cursor:pointer;border-radius:var(--radius);font-family:var(--font-body);font-weight:500;transition:transform var(--transition),box-shadow var(--transition),background var(--transition)}
  .db-btn-primary{background:var(--accent-gradient);color:#080808;padding:.65rem 1.25rem;font-size:.85rem;font-weight:600;box-shadow:0 2px 12px rgba(201,168,76,.2)}
  .db-btn-primary:hover{transform:translateY(-1px);box-shadow:var(--accent-glow)}
  .db-btn-primary:active{transform:scale(.97)}
  .db-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
  .db-btn-ghost{background:rgba(255,255,255,.04);color:var(--text-muted);border:1px solid var(--border);padding:.65rem 1.25rem;font-size:.85rem}
  .db-btn-ghost:hover{background:rgba(255,255,255,.07);color:var(--text);border-color:var(--border-hover)}
  .db-action-row{display:flex;justify-content:flex-end;gap:.75rem;margin-top:.5rem}

  /* card items */
  .db-card-item{background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem;display:flex;align-items:flex-start;gap:1rem;transition:border-color var(--transition)}
  .db-card-item:hover{border-color:var(--border-hover)}
  .db-card-emoji{width:48px;height:48px;border-radius:12px;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0}
  .db-card-body{flex:1;display:flex;flex-direction:column;gap:.5rem}
  .db-card-meta{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
  .db-tag-pill{display:inline-flex;align-items:center;padding:.2rem .625rem;background:rgba(201,168,76,.08);border:1px solid var(--border);border-radius:100px;font-size:.68rem;font-weight:600;color:var(--gold-2);letter-spacing:.06em;text-transform:uppercase}
  .db-active-badge{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .625rem;border-radius:100px;font-size:.68rem;font-weight:500}
  .db-active-badge.active{background:rgba(34,197,94,.1);color:#22c55e}
  .db-active-badge.inactive{background:rgba(239,68,68,.08);color:#f87171}
  .db-card-title{font-weight:500;font-size:.9rem;color:var(--text)}
  .db-card-desc{font-size:.78rem;color:var(--text-muted);font-weight:300;line-height:1.5}
  .db-card-features{display:flex;flex-wrap:wrap;gap:.35rem}
  .db-feature-pill{font-size:.68rem;color:var(--gold-2);background:rgba(201,168,76,.08);border:1px solid var(--border);border-radius:100px;padding:.15rem .5rem}
  .db-card-actions{display:flex;gap:.5rem;flex-shrink:0;align-self:flex-start}
  .db-btn-icon{width:32px;height:32px;border-radius:8px;background:none;border:1px solid var(--border);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background var(--transition),color var(--transition),border-color var(--transition)}
  .db-btn-icon:hover{background:rgba(255,255,255,.06);color:var(--text);border-color:var(--border-hover)}
  .db-btn-icon.danger:hover{background:rgba(239,68,68,.08);color:#f87171;border-color:rgba(239,68,68,.2)}
  .db-btn-icon.success:hover{background:rgba(34,197,94,.08);color:#22c55e;border-color:rgba(34,197,94,.2)}
  .db-empty{text-align:center;padding:2.5rem;color:var(--text-muted);font-size:.875rem}

  /* sections toggle */
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

  /* link preview */
  .db-link-preview{padding:.875rem 1.25rem;background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius)}
  .db-link-preview-label{font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:.4rem}
  .db-link-preview-url{font-size:.8rem;color:var(--gold-3);font-family:monospace;word-break:break-all}

  /* guide */
  .db-guide-item{display:flex;gap:.875rem;align-items:flex-start;padding:.875rem;background:var(--bg-3);border-radius:var(--radius);border:1px solid var(--border)}
  .db-guide-icon{font-size:1.2rem;flex-shrink:0}
  .db-guide-title{font-weight:500;font-size:.88rem;margin-bottom:.25rem}
  .db-guide-desc{font-size:.78rem;color:var(--text-muted);font-weight:300}

  /* modal */
  .db-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:500;display:flex;align-items:center;justify-content:center;padding:1rem;animation:db-fade-in .2s ease}
  @keyframes db-fade-in{from{opacity:0}to{opacity:1}}
  .db-modal{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);width:100%;max-width:560px;max-height:90svh;overflow-y:auto;animation:al-card-in .3s cubic-bezier(.34,1.56,.64,1)}
  .db-modal-header{padding:1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
  .db-modal-title{font-family:var(--font-title);font-size:1.1rem;font-weight:800;letter-spacing:-.03em}
  .db-modal-close{background:none;border:none;color:var(--text-muted);cursor:pointer;padding:.25rem;border-radius:6px;transition:color var(--transition),background var(--transition);display:flex}
  .db-modal-close:hover{color:var(--text);background:rgba(255,255,255,.06)}
  .db-modal-body{padding:1.5rem;display:flex;flex-direction:column;gap:1rem}
  .db-modal-footer{padding:1.25rem 1.5rem;border-top:1px solid var(--border);display:flex;gap:.75rem;justify-content:flex-end}

  /* toast */
  .db-toast-container{position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:.75rem;pointer-events:none}
  .db-toast{display:flex;align-items:center;gap:.75rem;padding:.875rem 1.25rem;background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 8px 32px rgba(0,0,0,.6);font-size:.85rem;font-family:var(--font-body);font-weight:500;min-width:260px;animation:al-card-in .3s ease}
  .db-toast.success{border-color:rgba(34,197,94,.25)}
  .db-toast.error{border-color:rgba(239,68,68,.25)}
  .db-toast-icon{flex-shrink:0}
  .db-toast-icon.success{color:#22c55e}
  .db-toast-icon.error{color:#f87171}
`;
