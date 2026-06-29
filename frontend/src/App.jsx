import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import CandidatesPage from './pages/CandidatesPage';
import PipelinePage from './pages/PipelinePage';
import SchedulePage from './pages/SchedulePage';
import AIScreeningPage from './pages/AIScreeningPage';
import JobsPage from './pages/JobsPage';
import { ToastContainer } from './components/ui';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <div className="main">
          <Routes>
            <Route path="/" element={<CandidatesPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/ai-screening" element={<AIScreeningPage />} />
            <Route path="/jobs" element={<JobsPage />} />
          </Routes>
        </div>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}