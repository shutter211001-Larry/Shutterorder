import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';
import RequisitionFormModal from './RequisitionFormModal.js';

interface Ingredient {
  id: string;
  name: string;
  sku: string;
  unit: string;
}

interface LocationInventory {
  id: string;
  ingredientId: string;
  currentStock: number;
  safetyStock: number;
  ingredient: Ingredient;
}

interface RequisitionItem {
  id: string;
  ingredientId: string;
  quantity: number;
  fulfilledQty: number;
  ingredient: Ingredient;
}

interface Requisition {
  id: string;
  status: string;
  expectedDate: string | null;
  createdAt: string;
  items: RequisitionItem[];
}

interface Props {
  locationId: string;
}

export default function LocationInventoryPanel({ locationId }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'stock' | 'requisitions'>('stock');
  
  const [inventory, setInventory] = useState<LocationInventory[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Edit mode for stock
  const [editingStock, setEditingStock] = useState(false);
  const [stockUpdates, setStockUpdates] = useState<Record<string, { currentStock?: number, safetyStock?: number }>>({});
  const [savingStock, setSavingStock] = useState(false);

  useEffect(() => {
    if (locationId) {
      loadData();
    }
  }, [locationId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stock') {
        const data = await api.get<LocationInventory[]>(`/../shutter-erp/api/requisition/inventory?locationId=${locationId}`);
        setInventory(data);
        setStockUpdates({});
      } else {
        const data = await api.get<Requisition[]>(`/../shutter-erp/api/requisition?locationId=${locationId}`);
        setRequisitions(data);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = (ingredientId: string, field: 'currentStock' | 'safetyStock', value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    setStockUpdates(prev => ({
      ...prev,
      [ingredientId]: {
        ...prev[ingredientId],
        [field]: numValue
      }
    }));
  };

  const saveStockUpdates = async () => {
    setSavingStock(true);
    try {
      const items = Object.entries(stockUpdates).map(([ingredientId, updates]) => ({
        ingredientId,
        ...updates
      }));

      if (items.length > 0) {
        await api.put('/../shutter-erp/api/requisition/inventory', {
          locationId,
          items
        });
        await loadData();
      }
      setEditingStock(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save inventory updates');
    } finally {
      setSavingStock(false);
    }
  };

  const receiveRequisition = async (reqId: string) => {
    if (!window.confirm((t('locationInventoryPanel.d45413') || '確認收貨？系統將會把已出貨的數量加入到門市庫存中。'))) return;
    
    try {
      await api.post(`/../shutter-erp/api/requisition/${reqId}/receive`, {});
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to receive requisition');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'RECEIVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return (t('locationInventoryPanel.55352b') || '待審核 (Pending)');
      case 'APPROVED': return (t('locationInventoryPanel.7348b2') || '已核准 (Approved)');
      case 'SHIPPED': return (t('locationInventoryPanel.90d166') || '已出貨 (Shipped)');
      case 'RECEIVED': return (t('locationInventoryPanel.467df5') || '已收貨 (Received)');
      case 'REJECTED': return (t('locationInventoryPanel.f92d9e') || '已拒絕 (Rejected)');
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('stock')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'stock'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {t('locationInventoryPanel.e2d2bd') || (t('locationInventoryPanel.e2d2bd') || '庫存與盤點 (Stock & Audit)')}</button>
        <button
          onClick={() => setActiveTab('requisitions')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'requisitions'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {t('locationInventoryPanel.7ee66b') || (t('locationInventoryPanel.7ee66b') || '叫貨記錄 (Requisitions)')}</button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : activeTab === 'stock' ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{t('locationInventoryPanel.864ef5') || (t('locationInventoryPanel.864ef5') || '門市原物料庫存')}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{t('locationInventoryPanel.06a2f0') || (t('locationInventoryPanel.06a2f0') || '如需進貨，請建立叫貨單向中央廚房申請。')}</p>
            </div>
            <div className="flex gap-2">
              {editingStock ? (
                <>
                  <button
                    onClick={() => setEditingStock(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium bg-white hover:bg-gray-50"
                  >
                    {t('locationInventoryPanel.625fb2') || (t('locationInventoryPanel.625fb2') || '取消')}</button>
                  <button
                    onClick={saveStockUpdates}
                    disabled={savingStock}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    {savingStock ? (t('locationInventoryPanel.4dafaa') || '儲存中...') : (t('locationInventoryPanel.31a645') || '儲存盤點結果')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditingStock(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium bg-white hover:bg-gray-50"
                  >
                    {t('locationInventoryPanel.948765') || (t('locationInventoryPanel.948765') || '手動盤點/修改安全水位')}</button>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm"
                  >
                    {t('locationInventoryPanel.37ba6b') || (t('locationInventoryPanel.37ba6b') || '+ 新增叫貨')}</button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('locationInventoryPanel.8aeff9') || (t('locationInventoryPanel.8aeff9') || '品項 (Ingredient)')}</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('locationInventoryPanel.ba550d') || (t('locationInventoryPanel.ba550d') || '目前庫存 (Current)')}</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('locationInventoryPanel.5079eb') || (t('locationInventoryPanel.5079eb') || '安全水位 (Safety)')}</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('locationInventoryPanel.bd91f6') || (t('locationInventoryPanel.bd91f6') || '狀態')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      {t('locationInventoryPanel.516a16') || (t('locationInventoryPanel.516a16') || '目前沒有任何庫存記錄。請建立叫貨單或手動進行盤點。')}</td>
                  </tr>
                ) : (
                  inventory.map((inv) => {
                    const currentVal = stockUpdates[inv.ingredientId]?.currentStock ?? inv.currentStock;
                    const safetyVal = stockUpdates[inv.ingredientId]?.safetyStock ?? inv.safetyStock;
                    const isLow = currentVal <= safetyVal;

                    return (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{inv.ingredient.name}</div>
                          <div className="text-xs text-gray-500">SKU: {inv.ingredient.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {editingStock ? (
                            <div className="flex justify-end items-center gap-2">
                              <input
                                type="number"
                                step="0.1"
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                                value={stockUpdates[inv.ingredientId]?.currentStock ?? inv.currentStock}
                                onChange={(e) => handleStockUpdate(inv.ingredientId, 'currentStock', e.target.value)}
                              />
                              <span className="text-gray-500 w-8 text-left">{inv.ingredient.unit}</span>
                            </div>
                          ) : (
                            <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                              {inv.currentStock} <span className="text-gray-500 font-normal">{inv.ingredient.unit}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {editingStock ? (
                            <div className="flex justify-end items-center gap-2">
                              <input
                                type="number"
                                step="0.1"
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                                value={stockUpdates[inv.ingredientId]?.safetyStock ?? inv.safetyStock}
                                onChange={(e) => handleStockUpdate(inv.ingredientId, 'safetyStock', e.target.value)}
                              />
                              <span className="text-gray-500 w-8 text-left">{inv.ingredient.unit}</span>
                            </div>
                          ) : (
                            <span className="text-gray-900">
                              {inv.safetyStock} <span className="text-gray-500">{inv.ingredient.unit}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isLow ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {t('locationInventoryPanel.824ea5') || (t('locationInventoryPanel.824ea5') || '庫存不足')}</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {t('locationInventoryPanel.db22d9') || (t('locationInventoryPanel.db22d9') || '庫存充足')}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{t('locationInventoryPanel.67ef45') || (t('locationInventoryPanel.67ef45') || '叫貨記錄')}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{t('locationInventoryPanel.d96c3c') || (t('locationInventoryPanel.d96c3c') || '查看向中央廚房發出的所有叫貨申請狀態。')}</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm"
            >
              {t('locationInventoryPanel.37ba6b') || (t('locationInventoryPanel.37ba6b') || '+ 新增叫貨')}</button>
          </div>

          <div className="space-y-4">
            {requisitions.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500">{t('locationInventoryPanel.8216bd') || (t('locationInventoryPanel.8216bd') || '目前沒有任何叫貨記錄。')}</p>
              </div>
            ) : (
              requisitions.map((req) => (
                <div key={req.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">{t('locationInventoryPanel.d50c40') || (t('locationInventoryPanel.d50c40') || '單號:')}{req.id.slice(-8).toUpperCase()}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(req.status)}`}>
                          {getStatusLabel(req.status)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t('locationInventoryPanel.a689b2') || (t('locationInventoryPanel.a689b2') || '建立時間:')}{new Date(req.createdAt).toLocaleString()}
                        {req.expectedDate && ` | 期望到貨: ${new Date(req.expectedDate).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div>
                      {req.status === 'SHIPPED' && (
                        <button
                          onClick={() => receiveRequisition(req.id)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                          {t('locationInventoryPanel.ceb569') || (t('locationInventoryPanel.ceb569') || '確認收貨 (將品項加入庫存)')}</button>
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">{t('locationInventoryPanel.fb5518') || (t('locationInventoryPanel.fb5518') || '叫貨明細')}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {req.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.ingredient.name}</div>
                            <div className="text-xs text-gray-500">SKU: {item.ingredient.sku}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {item.quantity} <span className="text-xs text-gray-500 font-normal">{item.ingredient.unit}</span>
                            </div>
                            {req.status === 'SHIPPED' || req.status === 'RECEIVED' ? (
                              <div className="text-xs text-indigo-600 font-medium mt-0.5">
                                {t('locationInventoryPanel.096ea7') || (t('locationInventoryPanel.096ea7') || '實際出貨:')}{item.fulfilledQty}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showModal && (
        <RequisitionFormModal
          locationId={locationId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
