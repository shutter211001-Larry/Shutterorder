import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout.js';
import Dashboard from './pages/Dashboard.js';
import LocationList from './pages/LocationList.js';
import LocationForm from './pages/LocationForm.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/locations" element={<LocationList />} />
          <Route path="/locations/new" element={<LocationForm />} />
          <Route path="/locations/:id" element={<LocationForm />} />
        </Routes>
      </AdminLayout>
    </BrowserRouter>
  </React.StrictMode>,
);
