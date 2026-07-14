import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import toast from 'react-hot-toast';
import { api } from '../lib/api.js';

export default function AttendanceRecords() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  
  const [records, setRecords] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  // Filters
  const [locationId, setLocationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    attendanceId: '',
    targetUserId: '',
    locationId: '',
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: ''
  });

  const formatDatetimeLocal = (dateString?: string | Date | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const openCorrectionForRecord = (record: any) => {
    setCorrectionForm({
      attendanceId: record.id,
      targetUserId: record.userId,
      locationId: record.locationId,
      requestedCheckIn: formatDatetimeLocal(record.checkIn),
      requestedCheckOut: formatDatetimeLocal(record.checkOut),
      reason: t('attendanceCorrections.adminOverrideReason') || (t('attendanceRecords.a668fa') || '管理員手動調整')
    });
    setShowCorrectionModal(true);
  };

  const submitCorrectionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const checkInTime = correctionForm.requestedCheckIn ? new Date(correctionForm.requestedCheckIn).toISOString() : null;
      const checkOutTime = correctionForm.requestedCheckOut ? new Date(correctionForm.requestedCheckOut).toISOString() : null;
      
      const payload = {
        attendanceId: correctionForm.attendanceId,
        targetUserId: correctionForm.targetUserId,
        locationId: correctionForm.locationId,
        requestedCheckIn: checkInTime,
        requestedCheckOut: checkOutTime,
        reason: correctionForm.reason
      };

      const res = await api.post('attendance/corrections', payload);
      
      if (res.success) {
        toast.success(t('attendanceCorrections.success') || (t('attendanceRecords.69be67') || '修改成功'));
        setShowCorrectionModal(false);
        fetchRecords();
      } else {
        toast.error(res.error || 'Failed');
      }
    } catch (err) {
      toast.error(t('attendance.systemError') || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const toggleIgnore = async (id: string, currentIsIgnored: boolean) => {
    if (!window.confirm(currentIsIgnored ? (t('attendanceRecords.b17b0e') || '確定要還原此紀錄嗎？') : (t('attendanceRecords.6b393a') || '確定要排除此紀錄嗎？(排除後將不計入薪資與損益)'))) {
      return;
    }
    setLoading(true);
    try {
      const res = await api.put(`attendance/records/${id}/ignore`, { isIgnored: !currentIsIgnored });
      if (res.success) {
        toast.success(currentIsIgnored ? (t('attendanceRecords.366d0b') || '紀錄已還原') : (t('attendanceRecords.e14a6f') || '紀錄已排除'));
        fetchRecords();
      } else {
        toast.error(res.error || 'Failed');
      }
    } catch (err) {
      toast.error((t('attendanceRecords.83d9c5') || '系統錯誤'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchRecords();
  }, []);

  async function fetchLocations() {
    try {
      const res = await api.get('locations');
      const data = res;
      if (data.success) {
        setLocations(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchRecords() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (locationId) query.append('locationId', locationId);
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);
      if (isOutOfRange) query.append('isOutOfRange', 'true');

      const res = await api.get(`attendance/records?${query.toString()}`);
      const data = res;
      if (data.success) {
        setRecords(data.data);
      } else {
        toast.error(t('attendanceRecords.failedToLoadRecords'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('nav.attendanceRecords')}</h2>

      <div className="bg-white p-6 rounded shadow mb-6">
        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('attendanceRecords.branchStore')}</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded border-gray-300 text-sm"
            >
              <option value="">{t('attendanceRecords.all')}</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('attendanceRecords.startDate')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded border-gray-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('attendanceRecords.endDate')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded border-gray-300 text-sm"
            />
          </div>
          <div className="flex items-center h-10">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isOutOfRange}
                onChange={(e) => setIsOutOfRange(e.target.checked)}
                className="mr-2 rounded text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              {t('attendanceRecords.showAbnormalDistanceOnly')}
            </label>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {t('attendanceRecords.filter')}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceRecords.date')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceRecords.employee')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceRecords.store')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceRecords.clockInTime')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceRecords.clockOutTime')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceRecords.status')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map(record => (
              <tr key={record.id} className={record.isIgnored ? "opacity-50 bg-gray-50" : ""}>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${record.isIgnored ? 'line-through' : ''}`}>
                  {new Date(record.checkIn).toLocaleDateString()}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${record.isIgnored ? 'line-through' : ''}`}>
                  {record.user?.name}
                  <span className="block text-xs text-gray-500">{record.user?.email}</span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${record.isIgnored ? 'line-through' : ''}`}>
                  {record.location?.name || record.user?.location?.name || '-'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${record.isIgnored ? 'line-through' : ''}`}>
                  {new Date(record.checkIn).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${record.isIgnored ? 'line-through' : ''}`}>
                  {record.checkOut ? new Date(record.checkOut).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex flex-col gap-1">
                    {record.isIgnored ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 w-max">
                        {t('attendanceRecords.ae2403') || (t('attendanceRecords.ae2403') || '已排除')}</span>
                    ) : !record.checkOut ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-max">
                        {t('attendanceRecords.missingCheckout') || (t('attendanceRecords.91185d') || '未下班')}
                      </span>
                    ) : record.isOutOfRange ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-max">
                        {t('attendanceRecords.abnormalDistance')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-max">
                        {t('attendanceRecords.normal')}
                      </span>
                    )}
                    
                    {record.correctionRequests?.find((cr: any) => cr.status === 'APPROVED' && cr.manager) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-max">
                        {t('attendanceRecords.4b075c') || (t('attendanceRecords.4b075c') || '由')}{record.correctionRequests.find((cr: any) => cr.status === 'APPROVED' && cr.manager).manager.name} {t('attendanceRecords.a5366c') || (t('attendanceRecords.a5366c') || '變更')}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button
                    onClick={() => toggleIgnore(record.id, !!record.isIgnored)}
                    className={`${record.isIgnored ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                  >
                    {record.isIgnored ? (t('attendanceRecords.6899eb') || '還原') : (t('attendanceRecords.93bdf5') || '排除')}
                  </button>
                  <button
                    onClick={() => openCorrectionForRecord(record)}
                    className="text-primary-600 hover:text-primary-900"
                    disabled={record.isIgnored}
                  >
                    {t('common.edit') || (t('attendanceRecords.aa3a61') || '編輯')}
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {t('attendanceRecords.noMatchingRecordsFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCorrectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">{t('attendanceCorrections.title') || (t('attendanceRecords.703d7f') || '考勤修改')}</h3>
              <button onClick={() => setShowCorrectionModal(false)} className="text-gray-400 hover:text-gray-500">
                &times;
              </button>
            </div>
            
            <form onSubmit={submitCorrectionRequest} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('attendanceCorrections.requestedCheckIn') || (t('attendanceRecords.c62e9e') || '正確上班時間')}</label>
                  <input
                    type="datetime-local"
                    required
                    value={correctionForm.requestedCheckIn}
                    onChange={(e) => setCorrectionForm({...correctionForm, requestedCheckIn: e.target.value})}
                    className="w-full rounded border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('attendanceCorrections.requestedCheckOut') || (t('attendanceRecords.7eda16') || '正確下班時間')}</label>
                  <input
                    type="datetime-local"
                    value={correctionForm.requestedCheckOut}
                    onChange={(e) => setCorrectionForm({...correctionForm, requestedCheckOut: e.target.value})}
                    className="w-full rounded border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('attendanceCorrections.reason') || (t('attendanceRecords.6d8462') || '修改原因')}</label>
                  <input
                    type="text"
                    required
                    value={correctionForm.reason}
                    onChange={(e) => setCorrectionForm({...correctionForm, reason: e.target.value})}
                    className="w-full rounded border-gray-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  {t('attendanceCorrections.cancel') || (t('attendanceRecords.625fb2') || '取消')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                >
                  {t('attendanceCorrections.submit') || (t('attendanceRecords.e9dabe') || '儲存')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
