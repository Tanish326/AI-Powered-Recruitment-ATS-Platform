import React, { useState, useEffect, useCallback } from 'react';
 import { getJobs, createJob, updateJob, deleteJob } from '../utils/api'; 
 import { Modal, Loading, EmptyState, MetricCard, Icon, toast } from '../components/ui';
  const EMPTY_JOB = { title: '', department: '', location: '', description: '', required_skills: '', nice_to_have: '', min_experience: 0, max_experience: 10, status: 'active' };


function JobModal({ open, onClose, initial, onDone }) {
  const [form, setForm] = useState(EMPTY_JOB);
  const [loading, setLoading] = useState(false);

  // safer edit check
  const isEdit = !!initial?.id;

  // optional: static job fields (you can later replace with API)
  const departments = [
    "Engineering",
    "Design",
    "Product",
    "Marketing",
    "HR",
    "Sales",
    "Operations"
  ];

  useEffect(() => {
    if (initial) {
      setForm({
        ...initial,
        required_skills: Array.isArray(initial.required_skills)
          ? initial.required_skills.join(', ')
          : '',
        nice_to_have: Array.isArray(initial.nice_to_have)
          ? initial.nice_to_have.join(', ')
          : ''
      });
    } else {
      setForm(EMPTY_JOB);
    }
  }, [initial, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title) {
      toast('Job title required', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        required_skills: form.required_skills
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean),

        nice_to_have: form.nice_to_have
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean),

        min_experience: parseInt(form.min_experience),
        max_experience: parseInt(form.max_experience),
      };

      if (isEdit) await updateJob(initial.id, payload);
      else await createJob(payload);

      toast(isEdit ? 'Job updated' : 'Job created');
      onDone();
      onClose();
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to save job', 'error');
    }
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Job' : 'Create Job Posting'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </button>
        </>
      }
    >

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Job title *</label>
          <input
            className="form-input"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Senior Product Designer"
          />
        </div>

        {/* ✅ FIXED: Department dropdown */}
        <div className="form-group">
          <label className="form-label">Department</label>
          <select
            className="form-input"
            value={form.department}
            onChange={e => set('department', e.target.value)}
          >
            <option value="">Select Department</option>
            {departments.map(dep => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Location</label>
        <input
          className="form-input"
          value={form.location}
          onChange={e => set('location', e.target.value)}
          placeholder="Bangalore / Remote"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Job description</label>
        <textarea
          className="form-input"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          style={{ minHeight: 80 }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Required skills (comma-separated)</label>
        <input
          className="form-input"
          value={form.required_skills}
          onChange={e => set('required_skills', e.target.value)}
          placeholder="figma, react, node"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Nice to have</label>
        <input
          className="form-input"
          value={form.nice_to_have}
          onChange={e => set('nice_to_have', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Min experience</label>
          <input
            type="number"
            className="form-input"
            value={form.min_experience}
            onChange={e => set('min_experience', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Max experience</label>
          <input
            type="number"
            className="form-input"
            value={form.max_experience}
            onChange={e => set('max_experience', e.target.value)}
          />
        </div>
      </div>

    </Modal>
  );
}
export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getJobs(); setJobs(r.data); }
    catch { toast('Failed to load jobs', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Close this job posting?')) return;
    try { await deleteJob(id); toast('Job closed'); load(); }
    catch { toast('Failed', 'error'); }
  };

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (job) => { setEditing(job); setModalOpen(true); };

  return (
    <div className="content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>Job Postings</h1>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{jobs.length} active positions</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Icon.plus />Create Job</button>
      </div>

      {loading ? <Loading /> : jobs.length === 0 ? (
        <EmptyState icon={Icon.briefcase} title="No job postings" description="Create your first job posting to start receiving applications."
          action={<button className="btn btn-primary" style={{ margin: '12px auto 0', display: 'flex' }} onClick={openCreate}><Icon.plus />Create Job</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jobs.map(job => (
            <div key={job.id} className="card">
              <div className="card-body" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
                      {job.department && <span>{job.department}</span>}
                      {job.location && <span> · {job.location}</span>}
                      <span> · {job.min_experience}–{job.max_experience} yrs exp</span>
                    </div>
                    {job.description && <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.5 }}>{job.description.slice(0, 200)}{job.description.length > 200 ? '…' : ''}</div>}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      {job.required_skills?.length > 0 && (
                        <div className="cand-tags">
                          {job.required_skills.map(s => <span key={s} className="tag skill">{s}</span>)}
                          {job.nice_to_have?.map(s => <span key={s} className="tag">{s}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(job)}><Icon.edit />Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(job.id)}><Icon.trash /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <JobModal open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} onDone={load} />
    </div>
  );
}



