import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';

interface Ingredient {
  id: string;
  name: string;
  sku: string;
  unit: string;
}

interface Props {
  locationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequisitionFormModal({ locationId, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ ingredientId: string; quantity: string }[]>([
    { ingredientId: '', quantity: '' }
  ]);
  const [expectedDate, setExpectedDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const data = await api.get<Ingredient[]>('/../shutter-erp/api/requisition/ingredients');
      setIngredients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load ingredients');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const validItems = items
        .filter(i => i.ingredientId && Number(i.quantity) > 0)
        .map(i => ({
          ingredientId: i.ingredientId,
          quantity: Number(i.quantity)
        }));

      if (validItems.length === 0) {
        throw new Error('Please add at least one valid item.');
      }

      await api.post('/../shutter-erp/api/requisition', {
        locationId,
        items: validItems,
        expectedDate: expectedDate || null
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create requisition');
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { ingredientId: '', quantity: '' }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('requisition.create') || (t('requisitionFormModal.120f9d') || '新增叫貨單')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form id="requisition-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('requisition.expectedDate') || (t('requisitionFormModal.d53f3e') || '期望到貨日期 (選填)')}
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">{t('requisitionFormModal.06d8b9') || (t('requisitionFormModal.06d8b9') || '中央廚房會參考此日期安排出貨')}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-900">{t('requisition.items') || (t('requisitionFormModal.f87294') || '叫貨品項清單')}</h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 rounded-md hover:bg-primary-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('requisition.addItem') || (t('requisitionFormModal.d2afb0') || '新增品項')}
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start group">
                    <div className="flex-1">
                      <select
                        value={item.ingredientId}
                        onChange={(e) => updateItem(index, 'ingredientId', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white"
                        required
                      >
                        <option value="">{t('requisition.selectIngredient') || (t('requisitionFormModal.94a4e9') || '選擇原物料...')}</option>
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        placeholder={t('requisition.quantity') || (t('requisitionFormModal.954bba') || '數量')}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                        required
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title={t('requisitionFormModal.e23410') || '移除品項'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            disabled={loading}
          >
            {t('common.cancel') || (t('requisitionFormModal.625fb2') || '取消')}
          </button>
          <button
            type="submit"
            form="requisition-form"
            disabled={loading}
            className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? t('common.saving') || (t('requisitionFormModal.ba34bf') || '送出中...') : t('common.submit') || (t('requisitionFormModal.47b1c6') || '送出叫貨單')}
          </button>
        </div>
      </div>
    </div>
  );
}
