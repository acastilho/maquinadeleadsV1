import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Edit3,
  ExternalLink,
  Eye,
  Filter,
  MessageCircle,
  PhoneOff,
  Search,
  Send,
  Trash2,
  UsersRound,
  X
} from 'lucide-react';
import api from '../api/client';

const STATUS_META = {
  pendente: { label: 'Pendente', className: 'pending', icon: Clock3 },
  enviado: { label: 'Enviado', className: 'sent', icon: Send },
  erro: { label: 'Erro', className: 'error', icon: AlertTriangle },
  sem_telefone: { label: 'Sem telefone', className: 'no-phone', icon: PhoneOff }
};

export default function LeadsManager({ nicheId }) {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [fontesStats, setFontesStats] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [fonteFilter, setFonteFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fontes, setFontes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailLead, setDetailLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [deleteLead, setDeleteLead] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        api.get(`/niches/${nicheId}/leads`, {
          params: {
            status: statusFilter || undefined,
            fonte: fonteFilter || undefined,
            search: search || undefined,
            page,
            pageSize
          }
        }),
        api.get(`/niches/${nicheId}/leads/stats`)
      ]);

      setLeads(leadsRes.data.leads || []);
      setTotal(leadsRes.data.total || 0);
      setTotalPages(leadsRes.data.totalPages || 1);
      setFontes(leadsRes.data.fontes || []);
      setStats(statsRes.data.stats || []);
      setTimeline(statsRes.data.timeline || []);
      setFontesStats(statsRes.data.fontes || []);
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    } finally {
      setLoading(false);
    }
  }, [nicheId, statusFilter, fonteFilter, search, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const statusTotals = useMemo(() => {
    const values = Object.fromEntries(stats.map((item) => [item.status, Number(item.total) || 0]));
    return {
      pendente: values.pendente || 0,
      enviado: values.enviado || 0,
      erro: values.erro || 0,
      sem_telefone: values.sem_telefone || 0
    };
  }, [stats]);

  const donutStops = useMemo(() => {
    const safeTotal = Math.max(1, Object.values(statusTotals).reduce((sum, value) => sum + value, 0));
    const pending = (statusTotals.pendente / safeTotal) * 100;
    const sent = pending + (statusTotals.enviado / safeTotal) * 100;
    const error = sent + (statusTotals.erro / safeTotal) * 100;
    return { '--donut-a': `${pending}%`, '--donut-b': `${sent}%`, '--donut-c': `${error}%` };
  }, [statusTotals]);

  const recentTimeline = useMemo(() => timeline.slice(0, 14).reverse(), [timeline]);
  const maxTimeline = Math.max(1, ...recentTimeline.map((item) => Number(item.total) || 0));
  const maxSource = Math.max(1, ...fontesStats.map((item) => Number(item.total) || 0));
  const grandTotal = Object.values(statusTotals).reduce((sum, value) => sum + value, 0) || total;
  const sentRate = grandTotal > 0 ? Math.round((statusTotals.enviado / grandTotal) * 100) : 0;

  function resetFilters() {
    setStatusFilter('');
    setFonteFilter('');
    setSearch('');
    setPage(1);
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    setSelectedIds(selectedIds.length === leads.length ? [] : leads.map((lead) => lead.id));
  }

  async function handleBulkUpdate(status) {
    if (selectedIds.length === 0) return;
    await api.post(`/niches/${nicheId}/leads/bulk`, { ids: selectedIds, status });
    setSelectedIds([]);
    load();
  }

  async function handleDelete(id) {
    await api.delete(`/niches/${nicheId}/leads/${id}`);
    setDeleteLead(null);
    load();
  }

  async function handleSaveEdit() {
    if (!editLead) return;
    await api.put(`/niches/${nicheId}/leads/${editLead.id}`, {
      nome_perfil: editLead.nome_perfil,
      whatsapp: editLead.whatsapp,
      status: editLead.status,
      observacao: editLead.observacao
    });
    setEditLead(null);
    load();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '-';
    const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
    if (hours < 1) return 'Agora';
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  }

  function shortSource(source) {
    if (!source) return 'Origem não informada';
    return source.length > 28 ? `${source.slice(0, 28)}…` : source;
  }

  const metricCards = [
    { status: '', label: 'Total de leads', value: grandTotal, hint: 'Base completa', className: 'total', icon: UsersRound },
    { status: 'pendente', label: 'Aguardando contato', value: statusTotals.pendente, hint: 'Próximas ações', className: 'pending', icon: Clock3 },
    { status: 'enviado', label: 'Mensagens enviadas', value: statusTotals.enviado, hint: `${sentRate}% da base`, className: 'sent', icon: MessageCircle },
    { status: 'sem_telefone', label: 'Sem telefone', value: statusTotals.sem_telefone, hint: 'Revisar cadastro', className: 'no-phone', icon: PhoneOff }
  ];

  return (
    <section className="leads-workspace">
      <div className="leads-section-heading">
        <div>
          <span className="eyebrow">Inteligência comercial</span>
          <h2>Visão geral dos leads</h2>
          <p>Acompanhe a qualidade da base e priorize os contatos mais importantes.</p>
        </div>
        <div className="leads-live-badge"><span /> Dados atualizados</div>
      </div>

      <div className="lead-metrics-grid">
        {metricCards.map(({ status, label, value, hint, className, icon: Icon }) => (
          <button
            type="button"
            key={label}
            className={`lead-metric-card ${className} ${statusFilter === status ? 'active' : ''}`}
            onClick={() => {
              if (!status) resetFilters();
              else {
                setStatusFilter(statusFilter === status ? '' : status);
                setPage(1);
              }
            }}
          >
            <span className="lead-metric-icon"><Icon size={19} /></span>
            <span className="lead-metric-copy">
              <small>{label}</small>
              <strong>{value}</strong>
              <em>{hint}</em>
            </span>
          </button>
        ))}
      </div>

      <div className="lead-charts-grid">
        <article className="lead-chart-card timeline-card">
          <div className="lead-chart-title">
            <div><BarChart3 size={17} /><span><strong>Novos leads</strong><small>Últimos 14 registros diários</small></span></div>
            <span className="chart-period">14 dias</span>
          </div>
          <div className="lead-bar-chart" aria-label="Gráfico de leads dos últimos dias">
            {recentTimeline.length > 0 ? recentTimeline.map((item) => (
              <div className="lead-bar-column" key={item.data} title={`${item.total} leads em ${item.data}`}>
                <span className="bar-value">{item.total}</span>
                <span className="lead-bar" style={{ height: `${Math.max(10, ((Number(item.total) || 0) / maxTimeline) * 100)}%` }} />
                <small>{new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</small>
              </div>
            )) : <div className="chart-empty">O histórico aparecerá conforme novos leads forem capturados.</div>}
          </div>
        </article>

        <article className="lead-chart-card status-chart-card">
          <div className="lead-chart-title">
            <div><Database size={17} /><span><strong>Distribuição da base</strong><small>Leads por status</small></span></div>
          </div>
          <div className="status-donut-wrap">
            <div className="status-donut" style={donutStops}>
              <div><strong>{grandTotal}</strong><small>leads</small></div>
            </div>
            <div className="lead-status-legend">
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <button type="button" key={key} onClick={() => setStatusFilter(key)}>
                  <span className={`legend-swatch ${meta.className}`} />
                  <span>{meta.label}</span>
                  <strong>{statusTotals[key]}</strong>
                </button>
              ))}
            </div>
          </div>
        </article>

        <article className="lead-chart-card sources-chart-card">
          <div className="lead-chart-title">
            <div><ExternalLink size={17} /><span><strong>Principais fontes</strong><small>Origem dos contatos</small></span></div>
          </div>
          <div className="source-bars">
            {fontesStats.length > 0 ? fontesStats.slice(0, 5).map((item, index) => (
              <button type="button" key={`${item.fonte}-${index}`} onClick={() => { setFonteFilter(item.fonte); setPage(1); }}>
                <span className="source-bar-label"><span>{shortSource(item.fonte)}</span><strong>{item.total}</strong></span>
                <span className="source-track"><span style={{ width: `${Math.max(6, ((Number(item.total) || 0) / maxSource) * 100)}%` }} /></span>
              </button>
            )) : <div className="chart-empty">As fontes aparecerão quando houver dados disponíveis.</div>}
          </div>
        </article>
      </div>

      <article className="leads-data-card">
        <div className="leads-data-heading">
          <div>
            <span className="eyebrow">Base de contatos</span>
            <h3>Todos os leads <span>{total}</span></h3>
          </div>
          {(statusFilter || fonteFilter || search) && (
            <button type="button" className="clear-filters-button" onClick={resetFilters}><X size={14} /> Limpar filtros</button>
          )}
        </div>

        <div className="lead-filters">
          <label className="lead-search-field">
            <Search size={16} />
            <input
              aria-label="Buscar leads"
              placeholder="Buscar por nome, WhatsApp ou termo…"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            />
          </label>
          <label className="filter-select-wrap"><Filter size={15} />
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="enviado">Enviado</option>
              <option value="erro">Erro</option>
              <option value="sem_telefone">Sem telefone</option>
            </select>
          </label>
          <select className="source-filter" value={fonteFilter} onChange={(event) => { setFonteFilter(event.target.value); setPage(1); }}>
            <option value="">Todas as fontes</option>
            {fontes.map((fonte) => <option key={fonte} value={fonte}>{shortSource(fonte)}</option>)}
          </select>
          <select className="page-size-filter" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
            <option value={10}>10 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="bulk-actions-bar">
            <span><CheckCircle2 size={16} /><strong>{selectedIds.length}</strong> selecionado(s)</span>
            <div>
              <button type="button" className="bulk-button pending" onClick={() => handleBulkUpdate('pendente')}><Clock3 size={14} /> Pendente</button>
              <button type="button" className="bulk-button sent" onClick={() => handleBulkUpdate('enviado')}><Send size={14} /> Enviado</button>
              <button type="button" className="bulk-button error" onClick={() => handleBulkUpdate('erro')}><AlertTriangle size={14} /> Marcar erro</button>
            </div>
            <button type="button" className="bulk-clear" onClick={() => setSelectedIds([])}><X size={14} /> Limpar seleção</button>
          </div>
        )}

        <div className="leads-table-wrap">
          <table className="modern-leads-table">
            <thead>
              <tr>
                <th className="checkbox-column"><input aria-label="Selecionar todos" type="checkbox" checked={selectedIds.length === leads.length && leads.length > 0} onChange={toggleSelectAll} /></th>
                <th>Lead</th>
                <th>WhatsApp</th>
                <th>Status</th>
                <th>Busca</th>
                <th>Origem</th>
                <th>Capturado em</th>
                <th className="actions-column">Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const status = STATUS_META[lead.status] || { label: lead.status, className: 'neutral', icon: Clock3 };
                const StatusIcon = status.icon;
                return (
                  <tr key={lead.id} className={selectedIds.includes(lead.id) ? 'selected' : ''}>
                    <td><input aria-label={`Selecionar ${lead.nome_perfil || 'lead'}`} type="checkbox" checked={selectedIds.includes(lead.id)} onChange={() => toggleSelect(lead.id)} /></td>
                    <td><div className="lead-identity"><span>{(lead.nome_perfil || '?').charAt(0).toUpperCase()}</span><div><strong>{lead.nome_perfil || 'Lead sem nome'}</strong><small>ID {String(lead.id).slice(0, 8)}</small></div></div></td>
                    <td>{lead.whatsapp ? <a className="whatsapp-link" href={`https://wa.me/${lead.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> {lead.whatsapp}</a> : <span className="muted-cell">Não informado</span>}</td>
                    <td><span className={`lead-status-pill ${status.className}`}><StatusIcon size={12} /> {status.label}</span></td>
                    <td><span className="query-cell" title={lead.original_query}>{lead.original_query || '—'}</span></td>
                    <td>{lead.fonte_url ? <a className="source-link" href={lead.fonte_url} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Abrir</a> : <span className="muted-cell">—</span>}</td>
                    <td><div className="date-cell"><CalendarDays size={13} /><span>{formatDate(lead.created_at)}<small>{timeAgo(lead.created_at)}</small></span></div></td>
                    <td>
                      <div className="lead-row-actions">
                        <button type="button" className="lead-action view" title="Visualizar lead" onClick={() => setDetailLead(lead)}><Eye size={14} /><span>Ver</span></button>
                        <button type="button" className="lead-action edit" title="Editar lead" onClick={() => setEditLead({ ...lead })}><Edit3 size={14} /><span>Editar</span></button>
                        <button type="button" className="lead-action delete" title="Excluir lead" onClick={() => setDeleteLead(lead)}><Trash2 size={14} /><span>Excluir</span></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {leads.length === 0 && !loading && <div className="lead-empty-state"><Search size={24} /><strong>Nenhum lead encontrado</strong><span>Tente remover os filtros ou usar outro termo de busca.</span></div>}
        {loading && <div className="lead-loading"><span /> Atualizando base de leads…</div>}

        <div className="leads-pagination">
          <span>Mostrando <strong>{leads.length}</strong> de <strong>{total}</strong> leads</span>
          <div>
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}><ChevronLeft size={15} /> Anterior</button>
            <span>Página <strong>{page}</strong> de {totalPages}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>Próxima <ChevronRight size={15} /></button>
          </div>
        </div>
      </article>

      {detailLead && (
        <Modal onClose={() => setDetailLead(null)} title="Detalhes do lead" icon={<Eye size={18} />}>
          <div className="lead-detail-grid">
            <DetailRow label="Nome" value={detailLead.nome_perfil} />
            <DetailRow label="WhatsApp" value={detailLead.whatsapp} />
            <DetailRow label="Link WhatsApp" value={detailLead.link_whatsapp} isLink />
            <DetailRow label="Status" value={detailLead.status} />
            <DetailRow label="Query de busca" value={detailLead.original_query} wide />
            <DetailRow label="Snippet" value={detailLead.snippet} wide />
            <DetailRow label="Fonte" value={detailLead.fonte_url} isLink wide />
            <DetailRow label="Criado em" value={formatDate(detailLead.created_at)} />
            <DetailRow label="Última atualização" value={formatDate(detailLead.updated_at)} />
            {detailLead.observacao && <DetailRow label="Observação" value={detailLead.observacao} wide />}
          </div>
        </Modal>
      )}

      {editLead && (
        <Modal onClose={() => setEditLead(null)} title="Editar lead" icon={<Edit3 size={18} />}>
          <div className="lead-edit-form">
            <label>Nome do perfil<input value={editLead.nome_perfil || ''} onChange={(event) => setEditLead({ ...editLead, nome_perfil: event.target.value })} /></label>
            <label>WhatsApp<input value={editLead.whatsapp || ''} onChange={(event) => setEditLead({ ...editLead, whatsapp: event.target.value })} /></label>
            <label>Status<select value={editLead.status || 'pendente'} onChange={(event) => setEditLead({ ...editLead, status: event.target.value })}><option value="pendente">Pendente</option><option value="enviado">Enviado</option><option value="erro">Erro</option><option value="sem_telefone">Sem telefone</option></select></label>
            <label>Observação<textarea value={editLead.observacao || ''} onChange={(event) => setEditLead({ ...editLead, observacao: event.target.value })} rows={3} /></label>
            <div className="modal-actions"><button type="button" className="modal-primary" onClick={handleSaveEdit}><CheckCircle2 size={15} /> Salvar alterações</button><button type="button" className="modal-secondary" onClick={() => setEditLead(null)}>Cancelar</button></div>
          </div>
        </Modal>
      )}

      {deleteLead && (
        <Modal onClose={() => setDeleteLead(null)} title="Excluir lead" icon={<Trash2 size={18} />} danger>
          <p className="delete-confirmation">Tem certeza que deseja excluir <strong>{deleteLead.nome_perfil || 'este lead'}</strong>? Esta ação não pode ser desfeita.</p>
          <div className="modal-actions"><button type="button" className="modal-danger" onClick={() => handleDelete(deleteLead.id)}><Trash2 size={15} /> Sim, excluir</button><button type="button" className="modal-secondary" onClick={() => setDeleteLead(null)}>Cancelar</button></div>
        </Modal>
      )}
    </section>
  );
}

function DetailRow({ label, value, isLink, wide }) {
  if (!value) return null;
  return (
    <div className={`lead-detail-row ${wide ? 'wide' : ''}`}>
      <span>{label}</span>
      {isLink ? <a href={value} target="_blank" rel="noreferrer">{value} <ExternalLink size={12} /></a> : <strong>{value}</strong>}
    </div>
  );
}

function Modal({ children, onClose, title, icon, danger = false }) {
  return (
    <div className="lead-modal-backdrop" onClick={onClose}>
      <div className={`lead-modal ${danger ? 'danger' : ''}`} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="lead-modal-header"><div className="lead-modal-title-icon">{icon}</div><h3>{title}</h3><button type="button" aria-label="Fechar" onClick={onClose}><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}
