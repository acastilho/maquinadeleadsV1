import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  Bot,
  ChevronRight,
  CircleDot,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  UsersRound,
  Zap,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [niches, setNiches] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const res = await api.get('/niches');
      setNiches(res.data.niches || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/niches', { name, description });
      setName('');
      setDescription('');
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(e, id, nicheName) {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o nicho "${nicheName}"? Isso também apagará todos os leads e agentes vinculados.`,
    );

    if (!confirmed) return;
    try {
      await api.delete(`/niches/${id}`);
      load();
    } catch (err) {
      console.error('Erro ao excluir nicho:', err);
      alert('Erro ao excluir o nicho. Verifique o console.');
    }
  }

  const metrics = useMemo(() => {
    const total = niches.length;
    const active = niches.filter((niche) => niche.active).length;
    const configuring = total - active;
    const coverage = total ? Math.round((active / total) * 100) : 0;
    return { total, active, configuring, coverage };
  }, [niches]);

  const filteredNiches = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return niches;
    return niches.filter((niche) =>
      `${niche.name} ${niche.description || ''}`.toLocaleLowerCase('pt-BR').includes(term),
    );
  }, [niches, search]);

  const firstName = user?.name?.split(' ')[0] || 'estrategista';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="brand-mark"><Sparkles size={19} /></span>
          <div>
            <strong>Máquina</strong>
            <span>de Leads</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="Navegação principal">
          <span className="side-label">Workspace</span>
          <a className="side-item active" href="#visao-geral">
            <LayoutDashboard size={18} /> Visão geral
          </a>
          <a className="side-item" href="#nichos">
            <Target size={18} /> Nichos
            <span className="nav-count">{metrics.total}</span>
          </a>
          <a className="side-item" href="#operacao">
            <Bot size={18} /> Operação
          </a>
        </nav>

        <div className="sidebar-insight">
          <span className="insight-icon"><Zap size={16} /></span>
          <strong>Motor de prospecção</strong>
          <p>{metrics.active} {metrics.active === 1 ? 'operação ativa' : 'operações ativas'} agora.</p>
          <a href="#novo-nicho">Nova operação <ArrowUpRight size={14} /></a>
        </div>

        <div className="sidebar-user">
          <span className="avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
          <div>
            <strong>{user?.name || 'Usuário'}</strong>
            <span>Administrador</span>
          </div>
          <button className="icon-button" onClick={logout} title="Sair" aria-label="Sair da conta">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="dashboard-page" id="visao-geral">
        <header className="dashboard-header">
          <div className="mobile-brand">
            <span className="brand-mark"><Sparkles size={17} /></span>
            <strong>Máquina de Leads</strong>
          </div>
          <div>
            <span className="eyebrow">Painel de crescimento</span>
            <h1>Olá, {firstName}. <span>Vamos acelerar?</span></h1>
            <p>Acompanhe suas frentes de prospecção e abra novas oportunidades.</p>
          </div>
          <a className="primary-button" href="#novo-nicho">
            <Plus size={18} /> Novo nicho
          </a>
        </header>

        <section className="metric-grid" aria-label="Resumo da operação">
          <article className="metric-card metric-blue">
            <div className="metric-topline">
              <span className="metric-icon"><Target size={19} /></span>
              <span className="metric-trend"><ArrowUpRight size={13} /> base</span>
            </div>
            <strong>{metrics.total}</strong>
            <span>Nichos mapeados</span>
          </article>
          <article className="metric-card metric-violet">
            <div className="metric-topline">
              <span className="metric-icon"><Activity size={19} /></span>
              <span className="live-dot">ao vivo</span>
            </div>
            <strong>{metrics.active}</strong>
            <span>Operações ativas</span>
          </article>
          <article className="metric-card metric-cyan">
            <div className="metric-topline">
              <span className="metric-icon"><UsersRound size={19} /></span>
              <span className="metric-trend">pipeline</span>
            </div>
            <strong>{metrics.configuring}</strong>
            <span>Em configuração</span>
          </article>
          <article className="metric-card metric-green">
            <div className="metric-topline">
              <span className="metric-icon"><Zap size={19} /></span>
              <span className="metric-trend">cobertura</span>
            </div>
            <strong>{metrics.coverage}%</strong>
            <span>Estrutura operacional</span>
          </article>
        </section>

        <section className="dashboard-grid" id="operacao">
          <article className="analytics-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Saúde da operação</span>
                <h2>Status dos nichos</h2>
              </div>
              <span className="period-chip">agora</span>
            </div>

            <div className="analytics-body">
              <div
                className="donut-chart"
                style={{ '--coverage': `${metrics.coverage * 3.6}deg` }}
                role="img"
                aria-label={`${metrics.coverage}% dos nichos estão ativos`}
              >
                <div><strong>{metrics.coverage}%</strong><span>ativos</span></div>
              </div>
              <div className="chart-legend">
                <div>
                  <span><i className="legend-dot active" /> Operações ativas</span>
                  <strong>{metrics.active}</strong>
                </div>
                <div>
                  <span><i className="legend-dot pending" /> Em configuração</span>
                  <strong>{metrics.configuring}</strong>
                </div>
                <div className="status-track" aria-hidden="true">
                  <span style={{ width: `${metrics.coverage}%` }} />
                </div>
                <p>Ative agentes e credenciais em cada nicho para ampliar sua cobertura.</p>
              </div>
            </div>
          </article>

          <article className="create-panel" id="novo-nicho">
            <div className="panel-heading compact">
              <div>
                <span className="eyebrow">Expanda sua busca</span>
                <h2>Novo nicho de mercado</h2>
              </div>
              <span className="metric-icon"><Plus size={18} /></span>
            </div>
            <form className="create-form" onSubmit={handleCreate}>
              <label>
                Nome do nicho
                <input
                  placeholder="Ex: Odontologia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label>
                Descrição <span>opcional</span>
                <textarea
                  placeholder="Qual público você quer encontrar?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </label>
              <button type="submit" className="primary-button full" disabled={creating}>
                {creating ? 'Criando operação...' : <><Plus size={17} /> Criar novo nicho</>}
              </button>
            </form>
          </article>
        </section>

        <section className="niches-section" id="nichos">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Sua estrutura</span>
              <h2>Nichos de mercado</h2>
            </div>
            <label className="search-field">
              <Search size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar nicho"
                aria-label="Buscar nicho"
              />
            </label>
          </div>

          {loading ? (
            <div className="loading-state"><span /> Preparando seu painel...</div>
          ) : filteredNiches.length === 0 ? (
            <div className="empty-state">
              <span><Target size={24} /></span>
              <h3>{search ? 'Nenhum nicho encontrado' : 'Sua próxima oportunidade começa aqui'}</h3>
              <p>{search ? 'Tente buscar por outro nome.' : 'Crie o primeiro nicho e configure sua operação de prospecção.'}</p>
              {!search && <a className="secondary-button" href="#novo-nicho"><Plus size={16} /> Criar primeiro nicho</a>}
            </div>
          ) : (
            <div className="niche-grid">
              {filteredNiches.map((niche, index) => (
                <Link to={`/nichos/${niche.id}`} key={niche.id} className="niche-card-modern">
                  <div className={`niche-orb orb-${(index % 4) + 1}`}>
                    <CircleDot size={19} />
                  </div>
                  <div className="niche-copy">
                    <div className="niche-title-row">
                      <h3>{niche.name}</h3>
                      <span className={`status-badge ${niche.active ? 'active' : 'inactive'}`}>
                        {niche.active ? 'Ativo' : 'Em configuração'}
                      </span>
                    </div>
                    <p>{niche.description || 'Operação pronta para receber palavras-chave, agentes e leads.'}</p>
                    <span className="open-niche">Abrir operação <ChevronRight size={15} /></span>
                  </div>
                  <button
                    className="delete-icon"
                    onClick={(e) => handleDelete(e, niche.id, niche.name)}
                    title={`Excluir ${niche.name}`}
                    aria-label={`Excluir nicho ${niche.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
