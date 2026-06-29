import axios from 'axios';



const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});



// Candidates
export const getCandidates = (params = {}) => api.get('/candidates/', { params });
export const getCandidate = (id) => api.get(`/candidates/${id}`);
export const createCandidate = (data) => api.post('/candidates/', data);
export const updateCandidate = (id, data) => api.patch(`/candidates/${id}`, data);
export const deleteCandidate = (id) => api.delete(`/candidates/${id}`);
export const uploadResume = (formData) => api.post('/candidates/upload-resume', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Jobs
export const getJobs = () => api.get('/jobs/');
export const getJob = (id) => api.get(`/jobs/${id}`);
export const createJob = (data) => api.post('/jobs/', data);
export const updateJob = (id, data) => api.put(`/jobs/${id}`, data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);

// Pipeline
export const getPipelineStats = (jobId) => api.get('/pipeline/stats', { params: { job_id: jobId } });
export const getPipelineBoard = (jobId) => api.get('/pipeline/board', { params: { job_id: jobId } });
export const moveCandidate = (id, stage) => api.patch(`/pipeline/${id}/move`, null, { params: { stage } });

// Interviews
export const getInterviews = (params = {}) => api.get('/interviews/', { params });
export const createInterview = (data) => api.post('/interviews/', data);
export const updateInterview = (id, data) => api.patch(`/interviews/${id}`, data);
export const deleteInterview = (id) => api.delete(`/interviews/${id}`);
export const getSuggestedSlots = (candidateId) => api.get('/interviews/slots/suggest', { params: { candidate_id: candidateId } });

// AI
export const screenCandidate = (candidateId, jobId) => api.post(`/ai/screen/${candidateId}`, null, { params: { job_id: jobId } });
export const screenAllCandidates = (jobId) => api.post(`/ai/screen-all/${jobId}`);
export const skillMatch = (data) => api.post('/ai/skill-match', data);

export default api;