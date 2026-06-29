import React, { useState, useEffect, useCallback } from 'react';
import { getCandidates, getJobs, moveCandidate, screenCandidate, deleteCandidate, uploadResume } from '../utils/api';
import { ScoreRing, StatusChip, Avatar, Modal, Loading, EmptyState, MetricCard, ProgressBar, Icon, toast } from '../components/ui';
import { useDropzone } from 'react-dropzone';

const STAGES = ['all', 'applied', 'screening', 'interview', 'offer', 'rejected', 'hired'];
const STAGE_LABELS = { all: 'All', applied: 'Applied', screening: 'Screening', interview: 'Interview', offer: 'Offer', rejected: 'Rejected', hired: 'Hired' };

function AIPanel({ candidate }) {
  if (!candidate) return null;
  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <Icon.sparkles />
        AI Screening — {candidate.name}
      </div>
      {candidate.ai_summary ? (
        <div className="ai-text" style={{ marginBottom: 12 }}>
          {candidate.ai_summary.split('. ').map((s, i) => (
            <span key={i}>{s}{i < candidate.ai_summary.split('. ').length - 1 ? '. ' : ''}</span>
          ))}
        </div>
      ) : (
        <div className="ai-text">No AI screening data yet. Select a job and run screening.</div>
      )}
      {candidate.ai_strengths?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>STRENGTHS</div>
          <div className="cand-tags">
            {candidate.ai_strengths.map(s => <span key={s} className="tag skill">{s}</span>)}
          </div>
        </div>
      )}
      {candidate.ai_gaps?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>GAPS</div>
          <div className="cand-tags">
            {candidate.ai_gaps.map(g => <span key={g} className="tag gap">{g}</span>)}
          </div>
        </div>
      )}
      {candidate.ai_recommendation && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, fontSize: 12 }}>
          <span style={{ color: 'var(--text-muted)' }}>Recommendation: </span>
          <strong style={{ color: candidate.ai_score >= 75 ? '#34D399' : candidate.ai_score >= 55 ? '#FCD34D' : '#FCA5A5' }}>
            {candidate.ai_recommendation}
          </strong>
        </div>
      )}
    </div>
  );
}

function UploadModal({ open, onClose, jobs, onDone }) {
  const [form, setForm] = useState({ name: '', email: '', job_id: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(accepted => setFile(accepted[0]), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/plain': ['.txt'], 'application/pdf': ['.pdf'] }, maxFiles: 1 });

  const submit = async () => {
    if (!form.name || !form.email) { toast('Name and email required', 'error'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      if (form.job_id) fd.append('job_id', form.job_id);
      if (file) fd.append('resume', file);
      else fd.append('resume', new Blob([`${form.name} resume placeholder`], { type: 'text/plain' }), 'resume.txt');
      await uploadResume(fd);
      toast('Candidate added successfully');
      onDone(); onClose();
      setForm({ name: '', email: '', job_id: '' }); setFile(null);
    } catch (e) {
      toast(e.response?.data?.detail || 'Upload failed', 'error');
    }
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Candidate"
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? 'Adding…' : 'Add Candidate'}</button></>}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Full name *</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Priya Krishnaswamy" />
        </div>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="priya@example.com" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Job posting</label>
        <select className="form-input" value={form.job_id} onChange={e => setForm(f => ({ ...f, job_id: e.target.value }))}>
          <option value="">Select job…</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Resume (PDF or TXT)</label>
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          <Icon.upload />
          <div className="dropzone-text">{file ? file.name : 'Drop resume here or click to browse'}</div>
          {!file && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF or plain text</div>}
        </div>
      </div>
    </Modal>
  );
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [screening, setScreening] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, jr] = await Promise.all([getCandidates(), getJobs()]);
      setCandidates(cr.data); setJobs(jr.data);
      if (cr.data.length && !selected) setSelected(cr.data[0]);
    } catch { toast('Failed to load candidates', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = candidates.filter(c => {
    if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.current_role?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) || c.skills?.some(s => s.includes(q));
    }
    return true;
  });

  const handleMove = async (id, stage) => {
    try {
      await moveCandidate(id, stage);
      setCandidates(cs => cs.map(c => c.id === id ? { ...c, stage } : c));
      if (selected?.id === id) setSelected(s => ({ ...s, stage }));
      toast(`Moved to ${stage}`);
    } catch { toast('Failed to move candidate', 'error'); }
  };

  const handleScreen = async () => {
    if (!selected || !selected.job_id) { toast('Candidate must be assigned to a job first', 'error'); return; }
    setScreening(true);
    try {
      const res = await screenCandidate(selected.id, selected.job_id);
      const updated = { ...selected, ...res.data };
      setSelected(updated);
      setCandidates(cs => cs.map(c => c.id === selected.id ? { ...c, ...res.data } : c));
      toast('AI screening complete');
    } catch { toast('Screening failed', 'error'); }
    setScreening(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this candidate?')) return;
    try {
      await deleteCandidate(id);
      setCandidates(cs => cs.filter(c => c.id !== id));
      if (selected?.id === id) setSelected(null);
      toast('Candidate removed');
    } catch { toast('Delete failed', 'error'); }
  };

  const metrics = {
    total: candidates.length,
    screened: candidates.filter(c => c.ai_score != null).length,
    avgScore: candidates.filter(c => c.ai_score).length
      ? Math.round(candidates.filter(c => c.ai_score).reduce((a, c) => a + c.ai_score, 0) / candidates.filter(c => c.ai_score).length)
      : 0,
    interview: candidates.filter(c => c.stage === 'interview' || c.stage === 'offer').length,
  };

  return (
    <div className="content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>Candidates</h1>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{candidates.length} total applicants</div>
        </div>
        <button className="btn btn-primary" onClick={() => setUploadOpen(true)}><Icon.plus />Add Candidate</button>
      </div>

      <div className="metrics-grid">
        <MetricCard label="Total applicants" value={metrics.total} delta="↑ 18% this week" deltaUp />
        <MetricCard label="AI-screened" value={metrics.screened} delta={`${metrics.total ? Math.round(metrics.screened / metrics.total * 100) : 0}% coverage`} />
        <MetricCard label="Avg match score" value={`${metrics.avgScore}%`} color={metrics.avgScore >= 70 ? '#34D399' : '#FCD34D'} delta="Across open roles" />
        <MetricCard label="In interview+" value={metrics.interview} delta="Active pipeline" />
      </div>

      <div className="filter-row">
        <div className="search-bar" style={{ flex: 1 }}>
          <Icon.search />
          <input placeholder="Search by name, skill, or location…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {STAGES.map(s => (
          <button key={s} className={`filter-chip ${stageFilter === s ? 'on' : ''}`} onClick={() => setStageFilter(s)}>
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
          <div className="candidate-list">
            {filtered.length === 0 ? (
              <EmptyState icon={Icon.users} title="No candidates found" description="Try adjusting your filters or adding new candidates." />
            ) : filtered.map(c => (
              <div key={c.id} className={`candidate-row ${selected?.id === c.id ? 'selected' : ''}`} onClick={() => setSelected(c)}>
                <Avatar name={c.name} />
                <div className="cand-info">
                  <div className="cand-name">{c.name}</div>
                  <div className="cand-sub">{c.current_role}{c.current_company ? ` · ${c.current_company}` : ''}{c.location ? ` · ${c.location}` : ''}{c.years_experience ? ` · ${c.years_experience}y exp` : ''}</div>
                  {c.skills?.length > 0 && (
                    <div className="cand-tags">{c.skills.slice(0, 4).map(s => <span key={s} className="tag skill">{s}</span>)}</div>
                  )}
                </div>
                {c.ai_score != null && <ScoreRing score={c.ai_score} />}
                <StatusChip stage={c.stage} />
                <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); handleDelete(c.id); }}><Icon.trash /></button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'sticky', top: 0 }}>
            {selected && (
              <>
                <div className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <Avatar name={selected.name} size={44} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{selected.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{selected.current_role}</div>
                      </div>
                      {selected.ai_score != null && <ScoreRing score={selected.ai_score} size={48} style={{ marginLeft: 'auto' }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                      <StatusChip stage={selected.stage} />
                      {selected.years_experience > 0 && <span className="tag">{selected.years_experience}y exp</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'].map(s => (
                        <button key={s} className={`btn btn-sm ${selected.stage === s ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleMove(selected.id, s)} style={{ textTransform: 'capitalize', fontSize: 11 }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="btn btn-mint" onClick={handleScreen} disabled={screening || !selected.job_id}>
                  <Icon.sparkles />{screening ? 'Screening…' : 'Run AI Screening'}
                </button>
                {!selected.job_id && <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>Assign to a job to enable AI screening</div>}
                <AIPanel candidate={selected} />
              </>
            )}
          </div>
        </div>
      )}

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} jobs={jobs} onDone={load} />
    </div>
  );
}