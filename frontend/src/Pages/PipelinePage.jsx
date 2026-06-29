import React, { useState, useEffect, useCallback } from 'react';
import { getPipelineBoard, getPipelineStats, moveCandidate, getJobs } from '../utils/api';
import { ScoreRing, Loading, MetricCard, Icon, toast } from '../components/ui';

const COLS = [
  { key: 'applied', label: 'Applied', color: '#64748B' },
  { key: 'screening', label: 'AI Screening', color: '#F59E0B' },
  { key: 'interview', label: 'Interview', color: '#10B981' },
  { key: 'offer', label: 'Offer', color: '#8B5CF6' },
  { key: 'hired', label: 'Hired', color: '#34D399' },
  { key: 'rejected', label: 'Rejected', color: '#EF4444' },
];

function PipelineCard({ candidate, onMove }) {
  const scoreColor = candidate.ai_score >= 80 ? '#10B981' : candidate.ai_score >= 65 ? '#2563EB' : '#F59E0B';
  return (
    <div className="pipeline-card">
      <div className="pc-name">{candidate.name}</div>
      <div className="pc-sub">{candidate.current_role} · {candidate.years_experience || 0}y</div>
      {candidate.skills?.length > 0 && (
        <div className="cand-tags" style={{ marginTop: 6 }}>
          {candidate.skills.slice(0, 3).map(s => <span key={s} className="tag skill" style={{ fontSize: 10 }}>{s}</span>)}
        </div>
      )}
      {candidate.ai_score != null && (
        <div className="pc-bar">
          <div className="bar-track"><div className="bar-fill" style={{ width: `${candidate.ai_score}%`, background: scoreColor }} /></div>
          <span className="bar-num" style={{ color: scoreColor }}>{Math.round(candidate.ai_score)}%</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
        {COLS.filter(c => c.key !== candidate.stage).slice(0, 3).map(c => (
          <button key={c.key} className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '3px 7px' }}
            onClick={() => onMove(candidate.id, c.key)}>→ {c.label}</button>
        ))}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [board, setBoard] = useState({});
  const [stats, setStats] = useState({});
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = jobId ? jobId : undefined;
      const [br, sr, jr] = await Promise.all([getPipelineBoard(params), getPipelineStats(params), getJobs()]);
      setBoard(br.data); setStats(sr.data); setJobs(jr.data);
    } catch { toast('Failed to load pipeline', 'error'); }
    setLoading(false);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const handleMove = async (id, stage) => {
    try {
      await moveCandidate(id, stage);
      toast(`Moved to ${stage}`);
      load();
    } catch { toast('Move failed', 'error'); }
  };

  return (
    <div className="content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>Hiring Pipeline</h1>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Drag candidates through stages</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-input" style={{ width: 220 }} value={jobId} onChange={e => setJobId(e.target.value)}>
            <option value="">All jobs</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <button className="btn btn-ghost" onClick={load}><Icon.refresh /></button>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard label="Applied" value={stats.applied || 0} />
        <MetricCard label="Screening" value={stats.screening || 0} />
        <MetricCard label="Interview" value={stats.interview || 0} />
        <MetricCard label="Offer / Hired" value={(stats.offer || 0) + (stats.hired || 0)} color="#34D399" delta={`Avg score: ${stats.avg_score || 0}%`} />
      </div>

      {loading ? <Loading /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, flex: 1 }}>
          {COLS.map(col => {
            const cards = board[col.key] || [];
            return (
              <div key={col.key} className="pipeline-col">
                <div className="col-header">
                  <div className="col-title" style={{ color: col.color }}>{col.label}</div>
                  <div className="col-count">{cards.length}</div>
                </div>
                {cards.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: 'var(--text-muted)' }}>Empty</div>
                ) : cards.map(c => (
                  <PipelineCard key={c.id} candidate={c} onMove={handleMove} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}