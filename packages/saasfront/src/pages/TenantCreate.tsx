import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { toast } from 'react-hot-toast';
import { Building2, Save, ArrowLeft } from 'lucide-react';

export default function TenantCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    adminEmail: '',
    adminName: '',
    adminPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.adminEmail || !formData.adminPassword) {
      return toast.error('Please fill in all required fields');
    }

    setLoading(true);
    try {
      await api.post('/platform-admin/tenants', formData);
      toast.success('Tenant created successfully');
      navigate('/tenants');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-6 h-6 text-indigo-500" />
              Create New Tenant
            </h1>
            <p className="text-gray-400 text-sm mt-1">Provision a new restaurant instance and assign a super admin.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl p-8 space-y-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Tenant Details</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Restaurant Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g. Yummy Steak"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Custom Domain (Optional)</label>
              <input
                type="text"
                value={formData.domain}
                onChange={e => setFormData({ ...formData, domain: e.target.value.toLowerCase() })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g. yummy-steak.com"
              />
              <p className="text-xs text-gray-500 mt-2">Leave blank to use internal IDs.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Initial Admin Account</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                required
                value={formData.adminEmail}
                onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="admin@yummy-steak.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Admin Name</label>
              <input
                type="text"
                value={formData.adminName}
                onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Temporary Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                required
                value={formData.adminPassword}
                onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Required for first login"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Provision Tenant
          </button>
        </div>
      </form>
    </div>
  );
}
