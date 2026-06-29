import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getCandidates, getJobs, screenAllCandidates, skillMatch } from '../utils/api';
import { ProgressBar, Loading, MetricCard, Icon, toast } from '../components/ui';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const SKILLS_COLUMNS = ['figma', 'design systems', 'user research', 'prototyping', 'accessibility'];
const HEAT_COLORS = {
  5: { bg: 'rgba(16,185,129,0.25)', color: '#34D399' },
  4: { bg: 'rgba(16,185,129,0.12)', color: '#6EE7B7' },
  3: { bg: 'rgba(37,99,235,0.15)', color: '#93C5FD' },
  2: { bg: 'rgba(245,158,11,0.12)', color: '#FCD34D' },
  1: { bg: 'rgba(239,68,68,0.1)', color: '#FCA5A5' },
};

function getSkillScore(candidate, skill) {
  if (!candidate.skills) return 0;
  return candidate.skills.includes(skill) ? (candidate.ai_score >= 80 ? 5 : candidate.ai_score >= 65 ? 4 : candidate.ai_score >= 50 ? 3 : 2) : 1;
}

export default function AIScreeningPage() {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [streamDone, setStreamDone] = useState(false);
  const streamRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, jr] = await Promise.all([getCandidates(), getJobs()]);
      setCandidates(cr.data); setJobs(jr.data);
      if (jr.data.length && !selectedJob) setSelectedJob(String(jr.data[0].id));
    } catch { toast('Failed to load data', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBatchScreen = async () => {
    if (!selectedJob) { toast('Select a job first', 'error'); return; }
    setBatchLoading(true);
    try {
      const res = await screenAllCandidates(selectedJob);
      toast(`Screened ${res.data.screened} candidates`);
      load();
    } catch { toast('Batch screening failed', 'error'); }
    setBatchLoading(false);
  };

  const startStream = async () => {
    const jobCandidates = candidates.filter(c => selectedJob ? String(c.job_id) === selectedJob : true);
    const candidate = jobCandidates.find(c => c.resume_text || c.id);
    if (!candidate || !selectedJob) { toast('Need candidate with resume and a selected job', 'error'); return; }

    setStreamText(''); setStreamDone(false);
    if (streamRef.current) streamRef.current.close();

    const url = `http://localhost:8000/api/ai/stream/${candidate.id}?job_id=${selectedJob}`;
    streamRef.current = new EventSource(url);
    streamRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.done) { setStreamDone(true); streamRef.current.close(); return; }
      if (data.char) setStreamText(t => t + (data.char === '\\n' ? '\n' : data.char));
    };
    streamRef.current.onerror = () => { streamRef.current?.close(); };
  };

  const screened = candidates.filter(c => c.ai_score != null);
  const avgScore = screened.length ? screened.reduce((a, c) => a + c.ai_score, 0) / screened.length : 0;
  const topCandidates = [...candidates].filter(c => c.ai_score).sort((a, b) => b.ai_score - a.ai_score).slice(0, 5);

  const chartData = topCandidates.map(c => ({ name: c.name.split(' ')[0], score: Math.round(c.ai_score) }));

  const jobObj = jobs.find(j => String(j.id) === selectedJob);
  const jdSkills = jobObj ? [
    ...jobObj.required_skills.map(s => ({ s, m: candidates.filter(c => c.skills?.includes(s)).length / Math.max(candidates.length, 1) * 100, req: true })),
    ...jobObj.nice_to_have.map(s => ({ s, m: candidates.filter(c => c.skills?.includes(s)).length / Math.max(candidates.length, 1) * 100, req: false })),
  ] : [];

  return (
    <div className="content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>AI Screening Engine</h1>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>NLP-powered resume analysis & skill matching</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-input" style={{ width: 220 }} value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
            <option value="">All jobs</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <button className="btn btn-mint" onClick={handleBatchScreen} disabled={batchLoading || !selectedJob}>
            <Icon.sparkles />{batchLoading ? 'Screening…' : 'Screen All'}
          </button>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          <div className="three-col">
            <MetricCard label="NLP Model" value="Rule-based NER" delta="+ skill taxonomy" />
            <MetricCard label="Skills detected" value={candidates.reduce((a, c) => a + (c.skills?.length || 0), 0)} delta={`Across ${candidates.length} resumes`} />
            <MetricCard label="Avg match score" value={`${Math.round(avgScore)}%`} color={avgScore >= 70 ? '#34D399' : '#FCD34D'} delta={`${screened.length} screened`} />
          </div>

          <div className="two-col">
            {/* Skill Heatmap */}
            <div className="card">
              <div className="card-header"><div className="card-title">Skill match heatmap — top candidates</div></div>
              <div className="card-body" style={{ overflowX: 'auto' }}>
                <table className="heatmap-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Candidate</th>
                      {SKILLS_COLUMNS.map(s => <th key={s} style={{ textAlign: 'center', fontSize: 11, maxWidth: 70 }}>{s}</th>)}
                      <th style={{ textAlign: 'center' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCandidates.map(c => (
                      <tr key={c.id}>
                        <td style={{ color: 'var(--text)', fontWeight: 500, fontSize: 13, padding: '7px 10px', whiteSpace: 'nowrap' }}>
                          {c.name.split(' ')[0]} {c.name.split(' ')[1]?.[0]}.
                        </td>
                        {SKILLS_COLUMNS.map(skill => {
                          const score = getSkillScore(c, skill);
                          const { bg, color } = HEAT_COLORS[score] || HEAT_COLORS[1];
                          return (
                            <td key={skill} style={{ textAlign: 'center' }}>
                              <div className="heat-cell" style={{ background: bg, color }}>{score}/5</div>
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)', color: c.ai_score >= 80 ? '#34D399' : c.ai_score >= 65 ? '#60A5FA' : '#FCD34D' }}>
                          {Math.round(c.ai_score || 0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Score chart */}
            <div className="card">
              <div className="card-header"><div className="card-title">Candidate score distribution</div></div>
              <div className="card-body" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1C2A3E', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.score >= 80 ? '#10B981' : entry.score >= 65 ? '#2563EB' : '#F59E0B'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="two-col">
            {/* Live streaming */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Live AI analysis</div>
                <button className="btn btn-mint btn-sm" onClick={startStream}><Icon.sparkles />Run demo</button>
              </div>
              <div className="card-body">
                <div className="ai-panel" style={{ minHeight: 160 }}>
                  <div className="ai-panel-header"><Icon.sparkles />Parsing resume…</div>
                  <div className="ai-streaming" style={{ whiteSpace: 'pre-wrap' }}>
                    {streamText || '> Waiting to start analysis…'}
                    {!streamDone && streamText && <span className="cursor" />}
                    {streamDone && <span style={{ color: '#34D399' }}> ✓ Done</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* JD skill match */}
            <div className="card">
              <div className="card-header"><div className="card-title">JD skill coverage across applicants</div></div>
              <div className="card-body">
                {jdSkills.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select a job to see skill coverage.</div>
                ) : jdSkills.map(({ s, m, req }) => (
                  <ProgressBar key={s} label={`${s}${req ? ' *' : ''}`} value={Math.round(m)} />
                ))}
                {jdSkills.length > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>* Required skill</div>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}