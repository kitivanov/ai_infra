import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import { AuthPage } from './pages/AuthPage';
import { AgentsPage } from './pages/AgentsPage';
import { AgentDetailPage } from './pages/AgentDetailPage';
import { AgentFormPage } from './pages/AgentFormPage';
import { ResourceDetailPage } from './pages/resources/ResourceDetailPage';
import { ResourceFormPage } from './pages/resources/ResourceFormPage';
import { ResourcesPage } from './pages/resources/ResourcesPage';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/agents" replace />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route element={<PrivateRoute />}>
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/new" element={<AgentFormPage mode="create" />} />
          <Route path="/agents/:id" element={<AgentDetailPage />} />
          <Route path="/agents/:id/edit" element={<AgentFormPage mode="edit" />} />
          <Route path="/resources/:kind" element={<ResourcesPage />} />
          <Route path="/resources/:kind/new" element={<ResourceFormPage mode="create" />} />
          <Route path="/resources/:kind/:id" element={<ResourceDetailPage />} />
          <Route path="/resources/:kind/:id/edit" element={<ResourceFormPage mode="edit" />} />
        </Route>
        <Route path="*" element={<Navigate to="/agents" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
