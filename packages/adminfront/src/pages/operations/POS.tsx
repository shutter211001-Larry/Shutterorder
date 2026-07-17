import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../lib/api.js';
import { getDatabase } from '../../lib/db/database.js';
import { useAuth } from '../../context/AuthContext.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageContent } from '../../components/layout/PageContent';
import { Clock } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'staff.roles.superAdmin',
  MANAGER: 'staff.roles.manager',
  STAFF: 'staff.roles.staff',
};

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  isActive: boolean;
  trackStock?: boolean;
  stockQty?: number;
  showWhenSoldOut?: boolean;
  category: { id: string; name: string; trackSharedStock?: boolean; sharedStockQty?: number; showWhenSoldOut?: boolean };
  options: {
    id: string;
    name: string;
    values: { id: string; name: string; priceModifier: number }[];
  }[];
}

interface Location {
  id: string;
  name: string;
}

interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  options: {
    menuOptionValueId: string;
    name: string;
    value: string;
    priceModifier: number;
  }[];
}

export default function POS() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const defaultGuestName = user ? `${t(ROLE_LABELS[user.role] || user.role)} ${user.name}` : '';
  const canUseManualOverrides = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [orderType, setOrderType] = useState<'PICKUP' | 'DELIVERY' | 'FROZEN_DELIVERY' | 'DINE_IN'>('PICKUP');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [guestName, setGuestName] = useState(defaultGuestName);
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [carrierType, setCarrierType] = useState('0'); // 0: None, 1: Mobile (3F0002), 2: Citizen (CQ0001)
  const [carrierNum, setCarrierNum] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const [summary, setSummary] = useState<{
    subtotal: number;
    tax: number;
    deliveryFee: number;
    couponDiscount: number;
    total: number;
    freeDelivery: boolean;
    appliedPromo: { name: string; code?: string } | null;
    manualCouponError: string | null;
    estimatedWaitMins?: number | null;
    earliestSlot?: string | null;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 獲取店鋪列表
    api.get<{ data: Location[] }>('/locations').then((res) => {
      setLocations(res.data);
      if (res.data.length > 0) {
        setSelectedLocationId(res.data[0].id);
      }
    }).catch(err => setError(err.message)).finally(() => setLoading(false));

    // 從本地 RxDB 讀取菜單資料 (支援離線 0 延遲渲染)
    let sub: any;
    getDatabase().then((db: any) => {
      sub = db.menuItems.find().$.subscribe((items: any) => {
        // @ts-ignore
        setMenuItems(items.map(i => i.toJSON()).filter(i => i.isActive));
      });
    });

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      setSummary(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCalculating(true);
      try {
        const orderItems = cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          options: item.options.map((o) => ({
            menuOptionValueId: o.menuOptionValueId,
          })),
        }));

        const body: any = {
          items: orderItems,
          orderType: orderType,
          locationId: selectedLocationId || undefined,
          source: 'POS',
          carrierType: carrierType !== '0' ? (carrierType === '1' ? '3F0002' : 'CQ0001') : undefined,
          carrierNum: carrierType !== '0' ? carrierNum : undefined,
        };

        const res = await api.post<{ data: any }>('/orders/summary', body);
        if (res.data) {
          setSummary(res.data);
        }
      } catch (err) {
        console.error('Failed to calculate summary', err);
      } finally {
        setIsCalculating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cart, orderType, selectedLocationId]);

  useEffect(() => {
    let html5QrCode: Html5Qrcode;
    if (isScanning) {
      html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 100 } },
        (decodedText) => {
          // ECPay Mobile Carrier format starts with /
          setCarrierNum(decodedText.toUpperCase());
          setIsScanning(false);
        },
        () => {}
      ).catch(err => {
        console.error("Camera start failed", err);
      });
    }
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  const openItemModal = (item: MenuItem) => {
    if (item.options && item.options.length > 0) {
      setSelectedItem(item);
      setSelectedOptions({});
    } else {
      addToCart(item, [], 0);
    }
  };

  const handleOptionChange = (optionId: string, valueId: string, checked: boolean) => {
    setSelectedOptions(prev => {
      const current = prev[optionId] || [];
      if (checked) {
        return { ...prev, [optionId]: [...current, valueId] };
      } else {
        return { ...prev, [optionId]: current.filter(id => id !== valueId) };
      }
    });
  };

  const confirmAddToCart = () => {
    if (!selectedItem) return;
    
    let optionModifier = 0;
    const itemOptions: CartItem['options'] = [];
    
    selectedItem.options.forEach(opt => {
      const selected = selectedOptions[opt.id] || [];
      selected.forEach(valId => {
        const val = opt.values.find(v => v.id === valId);
        if (val) {
          optionModifier += val.priceModifier;
          itemOptions.push({
            menuOptionValueId: val.id,
            name: opt.name,
            value: val.name,
            priceModifier: val.priceModifier
          });
        }
      });
    });

    addToCart(selectedItem, itemOptions, optionModifier);
    setSelectedItem(null);
  };

  const addToCart = (item: MenuItem, options: CartItem['options'], optionModifier: number = 0) => {
    const unitPrice = item.price + optionModifier;
    const newItem: CartItem = {
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      unitPrice,
      subtotal: unitPrice,
      options,
    };
    setCart([...cart, newItem]);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = summary?.subtotal ?? cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = summary?.tax ?? 0;
  const deliveryFee = summary?.deliveryFee ?? 0;
  const autoCouponDiscount = summary?.couponDiscount ?? 0;
  const apiTotal = summary?.total ?? subtotal;
  const total = Math.max(0, apiTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError(t('orderCreate.emptyCart'));
      return;
    }
    if (carrierType !== '0' && !carrierNum) {
      setError('請輸入載具號碼');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const db = await getDatabase();
      const orderId = crypto.randomUUID();
      const newOrder = {
        id: orderId,
        locationId: selectedLocationId,
        status: 'PENDING', // 預設狀態
        totalAmount: total,
        createdAt: new Date().toISOString(),
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.unitPrice,
          notes: ''
        })),
        source: 'POS',
        carrierType: carrierType !== '0' ? (carrierType === '1' ? '3F0002' : 'CQ0001') : undefined,
        carrierNum: carrierType !== '0' ? carrierNum : undefined,
        _isSynced: false
      };

      await db.orders.insert(newOrder);
      // 原本是跳轉到線上訂單頁面，這邊直接跳轉或顯示成功
      navigate(`/orders/${orderId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">{t('orderCreate.loading')}</div>;

  const groupedItems = menuItems.reduce((acc, item) => {
    const catId = item.category?.id || 'uncategorized';
    const catName = item.category?.name || t('orderCreate.uncategorized') || (t('orderCreate.15bfc5') || '未分類');
    if (!acc[catId]) {
      acc[catId] = { 
        name: catName, 
        items: [],
        trackSharedStock: item.category?.trackSharedStock,
        sharedStockQty: item.category?.sharedStockQty,
        showWhenSoldOut: item.category?.showWhenSoldOut
      };
    }
    acc[catId].items.push(item);
    return acc;
  }, {} as Record<string, { name: string, items: MenuItem[], trackSharedStock?: boolean, sharedStockQty?: number, showWhenSoldOut?: boolean }>);

  return (
    <div className="pb-12">
      <PageHeader
        title={'櫃台收銀 POS'}
        backUrl="/"
        backText={'返回首頁'}
      />

      <PageContent>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Menu Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">{t('orderCreate.selectProduct')}</h2>
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([categoryId, group]) => {
                const isExpanded = expandedCategories[categoryId] !== false; // Default true (expanded)
                return (
                  <div key={categoryId} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => toggleCategory(categoryId)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
                    >
                      <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                        {group.name} {group.trackSharedStock && (group.sharedStockQty || 0) <= 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full whitespace-nowrap">{t('common.soldOut')}</span>}
                      </h3>
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.items.filter(item => {
                            const isItemSoldOut = item.trackStock && (item.stockQty || 0) <= 0;
                            const isCategorySoldOut = group.trackSharedStock && (group.sharedStockQty || 0) <= 0;
                            if (isItemSoldOut && !item.showWhenSoldOut) return false;
                            if (isCategorySoldOut && !group.showWhenSoldOut) return false;
                            return true;
                          }).map(item => {
                            const isItemSoldOut = item.trackStock && (item.stockQty || 0) <= 0;
                            const isCategorySoldOut = group.trackSharedStock && (group.sharedStockQty || 0) <= 0;
                            const isSoldOut = isItemSoldOut || isCategorySoldOut;

                            return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => !isSoldOut && openItemModal(item)}
                            disabled={isSoldOut}
                            className={`flex items-center gap-4 p-3 border border-gray-100 rounded-lg transition-colors text-left group bg-white shadow-sm ${isSoldOut ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:bg-gray-50'}`}
                          >
                            {isSoldOut && (
                              <div className="absolute inset-0 z-10 flex items-center justify-center">
                                <div className="bg-red-600 text-white font-bold px-2 py-0.5 rounded shadow-sm text-sm border border-white transform -rotate-12">
                                  {t('common.soldOut')}
                                </div>
                              </div>
                            )}
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover" />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-300">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{item.name}</div>
                              <div className="text-sm text-gray-500">${item.price.toFixed(2)}</div>
                            </div>
                            <div className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                          </button>
                        ); })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">{t('orderCreate.customerInfo')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('orderCreate.name')}</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none shadow-sm transition-all duration-200"
                  placeholder={t('orderCreate.customerName')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('orderCreate.phone')}</label>
                <input
                  type="text"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none shadow-sm transition-all duration-200"
                  placeholder={t('orderCreate.phoneNumber')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Summary & Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">{t('orderCreate.orderSettings')}</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('orderCreate.serviceBranch')}</label>
                <select
                  value={selectedLocationId}
                  onChange={e => setSelectedLocationId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none shadow-sm transition-all duration-200"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('orderCreate.pickupMethod')}</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setOrderType('DINE_IN')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${orderType === 'DINE_IN' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    內用
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('PICKUP')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${orderType === 'PICKUP' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    外帶
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h2 className="text-lg font-semibold mb-4">{t('orderCreate.shoppingCart')}</h2>
              {cart.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">{t('orderCreate.noProductSelected')}</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">x{item.quantity} - ${item.unitPrice.toFixed(2)}</div>
                      </div>
                      <div className="text-sm font-medium">${item.subtotal.toFixed(2)}</div>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('orderCreate.subtotal') || (t('orderCreate.879915') || '小計')}</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('orderCreate.tax') || (t('orderCreate.f418d3') || '稅金')}</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                )}
                {(orderType === 'DELIVERY' || orderType === 'FROZEN_DELIVERY') && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('orderCreate.deliveryFee') || (t('orderCreate.d6bea8') || '運費')}</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {autoCouponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('orderCreate.discount') || (t('orderCreate.53db5d') || '優惠折扣')} {summary?.appliedPromo?.name && `(${summary.appliedPromo.name})`}</span>
                    <span>-${autoCouponDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="space-y-3 pt-3 border-t border-gray-50">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">電子發票載具</label>
                    <select
                      value={carrierType}
                      onChange={e => setCarrierType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none shadow-sm transition-all duration-200 mb-2"
                    >
                      <option value="0">無 (列印紙本或會員預設)</option>
                      <option value="1">手機條碼 (3F0002)</option>
                      <option value="2">自然人憑證 (CQ0001)</option>
                    </select>
                    {carrierType !== '0' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={carrierNum}
                          onChange={e => setCarrierNum(e.target.value.toUpperCase())}
                          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none shadow-sm transition-all duration-200"
                          placeholder={carrierType === '1' ? '例如: /AB12345' : '輸入憑證號碼'}
                        />
                        {carrierType === '1' && (
                          <button
                            type="button"
                            onClick={() => setIsScanning(true)}
                            className="p-2.5 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors border border-primary-200"
                            title="開啟相機掃描"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {summary?.estimatedWaitMins != null && (
                  <div className="flex justify-between items-center text-sm font-medium pt-3 mt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-700">{t('orderCreate.estimatedWaitTime') || (t('orderCreate.38663c') || '預估製作時間')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-orange-600 font-bold">{summary.estimatedWaitMins} {t('orderCreate.minutes') || (t('orderCreate.ac055c') || '分鐘')}</span>
                      {summary.earliestSlot && (
                        <div className="text-xs text-gray-500 font-normal mt-0.5">
                          {t('orderCreate.expectedReadyTime') || (t('orderCreate.1f0aa1') || '預計取餐')}: {new Date(summary.earliestSlot).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold pt-3 mt-3 border-t border-gray-200">
                  <span>{t('orderCreate.total')}</span>
                  <span className="text-primary-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {summary?.estimatedWaitMins != null && summary.estimatedWaitMins > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm flex items-center justify-between">
                  <span className="font-medium">{t('orderCreate.89cffa') || (t('orderCreate.89cffa') || '預計取餐/等候時間')}</span>
                  <div className="text-right">
                    <div className="font-bold">{t('orderCreate.ebb4a1') || (t('orderCreate.ebb4a1') || '約')}{summary.estimatedWaitMins} {t('orderCreate.ac055c') || (t('orderCreate.ac055c') || '分鐘')}</div>
                    {summary.earliestSlot && (
                      <div className="text-xs opacity-75">
                        {new Date(summary.earliestSlot).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                disabled={submitting || cart.length === 0 || isCalculating}
                onClick={handleSubmit}
                className="w-full mt-6 bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-lg shadow-primary-200"
              >
                {submitting || isCalculating ? (t('orderCreate.submitting') || (t('orderCreate.ca0536') || '處理中...')) : t('orderCreate.createOrder')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">{selectedItem.name} - {t('orderCreate.optionsTitle') || (t('orderCreate.ae399d') || '餐點選項')}</h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-6">
              {selectedItem.options.map(opt => (
                <div key={opt.id}>
                  <h4 className="font-medium text-sm text-gray-900 mb-2">{opt.name}</h4>
                  <div className="space-y-2">
                    {opt.values.map(val => (
                      <label key={val.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                          checked={(selectedOptions[opt.id] || []).includes(val.id)}
                          onChange={e => handleOptionChange(opt.id, val.id, e.target.checked)}
                        />
                        <span className="flex-1 text-sm">{val.name}</span>
                        {val.priceModifier > 0 && <span className="text-sm text-gray-500">+${val.priceModifier.toFixed(2)}</span>}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('orderCreate.cancel') || (t('orderCreate.625fb2') || '取消')}
              </button>
              <button
                onClick={confirmAddToCart}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                {t('orderCreate.addCart') || (t('orderCreate.c81347') || '加入購物車')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-gray-50 flex items-center justify-between border-b">
              <h3 className="font-bold text-gray-900">掃描手機條碼</h3>
              <button onClick={() => setIsScanning(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div id="qr-reader" className="w-full bg-black min-h-[250px]"></div>
            <div className="p-4 bg-gray-50 text-sm text-gray-500 text-center">
              請將 iPad/平板的相機對準客人的手機條碼
            </div>
          </div>
        </div>
      )}
      </PageContent>
    </div>
  );
}
