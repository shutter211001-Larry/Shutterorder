import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/layout/PageHeader';
import { PageContent } from '../components/layout/PageContent';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from "react-hot-toast";

interface JobRole {
  id: string;
  name: string;
}

interface Requirement {
  jobRoleId: string;
  startTime: string;
  endTime: string;
  count: number;
}

interface WeeklyRequirement extends Requirement {
  dayOfWeek: number;
}

export function ShiftRequirementsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'weekly' | 'calendar'>('weekly');
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [weeklyReqs, setWeeklyReqs] = useState<WeeklyRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateReqs, setDateReqs] = useState<Requirement[]>([]);
  const [isOverride, setIsOverride] = useState(false); // Does this date have an override?

  const [searchParams] = useSearchParams();
  const urlLocationId = searchParams.get('locationId');
  const locationId = urlLocationId || user?.locationId;
  
  const daysOfWeek = [(t('shiftRequirementsPage.1171f5') || '週日'), (t('shiftRequirementsPage.9a9640') || '週一'), (t('shiftRequirementsPage.a89f2f') || '週二'), (t('shiftRequirementsPage.a16fda') || '週三'), (t('shiftRequirementsPage.e316f3') || '週四'), (t('shiftRequirementsPage.c1e2b7') || '週五'), (t('shiftRequirementsPage.fc8b19') || '週六')];

  useEffect(() => {
    if (locationId) {
      fetchJobRoles();
      fetchWeeklyRequirements();
    }
  }, [locationId]);

  const fetchJobRoles = async () => {
    try {
      const res = await api.get<{ data: JobRole[] }>('/job-roles');
      setJobRoles(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWeeklyRequirements = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: WeeklyRequirement[] }>(`/roster/weekly-requirements?locationId=${locationId}`);
      setWeeklyReqs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveWeeklyRequirements = async () => {
    try {
      setSaving(true);
      await api.post('/roster/weekly-requirements', {
        locationId,
        requirements: weeklyReqs
      });
      toast.error((t('shiftRequirementsPage.0e1471') || '每週範本已儲存'));
    } catch (err) {
      console.error(err);
      toast.error((t('shiftRequirementsPage.24510f') || '儲存失敗'));
    } finally {
      setSaving(false);
    }
  };

  const addWeeklyReq = (dayOfWeek: number) => {
    if (jobRoles.length === 0) return toast.error((t('shiftRequirementsPage.c95f52') || '請先設定職位'));
    setWeeklyReqs([...weeklyReqs, { dayOfWeek, jobRoleId: jobRoles[0].id, startTime: '09:00', endTime: '18:00', count: 1 }]);
  };

  const updateWeeklyReq = (index: number, field: keyof WeeklyRequirement, value: any) => {
    const newReqs = [...weeklyReqs];
    newReqs[index] = { ...newReqs[index], [field]: value };
    setWeeklyReqs(newReqs);
  };

  const removeWeeklyReq = (index: number) => {
    setWeeklyReqs(weeklyReqs.filter((_, i) => i !== index));
  };

  // ==========================================
  // Calendar Logic
  // ==========================================
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateClick = async (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 12);
    const dateStr = d.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    
    // Fetch requirements for this specific date
    try {
      setLoading(true);
      const res = await api.get<{ data: any[] }>(`/roster/requirements?locationId=${locationId}&startDate=${dateStr}&endDate=${dateStr}`);
      const data = res.data || [];
      // Data might be from template or override
      if (data.length > 0 && data[0].isFromTemplate) {
        setIsOverride(false);
        setDateReqs(data);
      } else if (data.length > 0 && !data[0].isFromTemplate) {
        setIsOverride(true);
        setDateReqs(data);
      } else {
        setIsOverride(false);
        setDateReqs([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addDateReq = () => {
    if (jobRoles.length === 0) return toast.error((t('shiftRequirementsPage.c95f52') || '請先設定職位'));
    setDateReqs([...dateReqs, { jobRoleId: jobRoles[0].id, startTime: '09:00', endTime: '18:00', count: 1 }]);
  };

  const updateDateReq = (index: number, field: keyof Requirement, value: any) => {
    const newReqs = [...dateReqs];
    newReqs[index] = { ...newReqs[index], [field]: value };
    setDateReqs(newReqs);
  };

  const removeDateReq = (index: number) => {
    setDateReqs(dateReqs.filter((_, i) => i !== index));
  };

  const saveDateRequirements = async () => {
    try {
      setSaving(true);
      await api.post('/roster/requirements', {
        locationId,
        date: selectedDate,
        requirements: dateReqs
      });
      setIsOverride(true);
      toast.error(`${selectedDate} 需求已儲存 (已覆蓋範本)`);
    } catch (err) {
      console.error(err);
      toast.error((t('shiftRequirementsPage.24510f') || '儲存失敗'));
    } finally {
      setSaving(false);
    }
  };

  const resetDateToTemplate = async () => {
    try {
      setSaving(true);
      // Empty requirements means delete overrides
      await api.post('/roster/requirements', {
        locationId,
        date: selectedDate,
        requirements: []
      });
      setIsOverride(false);
      // Refetch
      handleDateClick(parseInt(selectedDate.split('-')[2]));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const blanks = Array.from({ length: firstDay }).map((_, i) => <div key={`blank-${i}`} className="p-2 border border-gray-100 bg-gray-50/30 min-h-[80px]" />);
    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const d = i + 1;
      const dateStr = new Date(year, month, d, 12).toISOString().split('T')[0];
      const isSelected = selectedDate === dateStr;
      
      return (
        <div 
          key={d} 
          onClick={() => handleDateClick(d)}
          className={`p-2 border border-gray-100 min-h-[80px] cursor-pointer transition-colors
            ${isSelected ? 'bg-primary-50 border-primary-300 ring-1 ring-primary-300' : 'hover:bg-gray-50 bg-white'}`}
        >
          <div className="flex justify-between items-start">
            <span className={`font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>{d}</span>
          </div>
          {/* We don't fetch all month data instantly here to save API calls in this simple implementation, 
              but in a real scenario we'd batch fetch to show badges on days with overrides. */}
        </div>
      );
    });

    return (
      <div className="w-full lg:w-2/3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{year}{t('shiftRequirementsPage.465260') || (t('shiftRequirementsPage.465260') || '年')}{month + 1}{t('shiftRequirementsPage.e42b99') || (t('shiftRequirementsPage.e42b99') || '月')}</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              &lt;
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              &gt;
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0 border-l border-t border-gray-100 rounded-lg overflow-hidden shadow-sm">
          {[(t('shiftRequirementsPage.3edddd') || '日'), (t('shiftRequirementsPage.7941da') || '一'), (t('shiftRequirementsPage.2d8be2') || '二'), (t('shiftRequirementsPage.e662ff') || '三'), (t('shiftRequirementsPage.21716c') || '四'), (t('shiftRequirementsPage.1fcc29') || '五'), (t('shiftRequirementsPage.61b453') || '六')].map(d => (
            <div key={d} className="bg-gray-50 p-2 text-center text-xs font-bold text-gray-500 border-r border-b border-gray-100">
              {d}
            </div>
          ))}
          {blanks}
          {days.map((day, i) => (
             <React.Fragment key={i}>{day}</React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderDatePanel = () => {
    if (!selectedDate) {
      return (
        <div className="w-full lg:w-1/3 bg-gray-50 border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <CalendarIcon className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">{t('shiftRequirementsPage.ad9915') || (t('shiftRequirementsPage.ad9915') || '請在左側月曆點擊一個日期')}</p>
        </div>
      );
    }

    return (
      <div className="w-full lg:w-1/3 bg-white border border-gray-200 shadow-sm rounded-xl p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{selectedDate}</h3>
            <p className={`text-sm mt-1 font-medium ${isOverride ? 'text-amber-600' : 'text-gray-500'}`}>
              {isOverride ? (t('shiftRequirementsPage.7d319e') || '⚠️ 已自訂單日覆蓋') : (t('shiftRequirementsPage.adeeed') || '✅ 目前套用每週範本')}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {dateReqs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">{t('shiftRequirementsPage.523f85') || (t('shiftRequirementsPage.523f85') || '無人力需求')}</div>
          ) : (
            dateReqs.map((req, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
                <button 
                  onClick={() => removeDateReq(i)}
                  className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-3 pr-8">
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">{t('shiftRequirementsPage.c2b1a1') || (t('shiftRequirementsPage.c2b1a1') || '職位')}</label>
                    <select
                      value={req.jobRoleId}
                      onChange={(e) => updateDateReq(i, 'jobRoleId', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      {jobRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">{t('shiftRequirementsPage.883b81') || (t('shiftRequirementsPage.883b81') || '時間')}</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={req.startTime}
                        onChange={(e) => updateDateReq(i, 'startTime', e.target.value)}
                        className="w-full px-1 py-1.5 bg-white border border-gray-200 rounded text-xs focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-gray-400 text-xs">-</span>
                      <input
                        type="time"
                        value={req.endTime}
                        onChange={(e) => updateDateReq(i, 'endTime', e.target.value)}
                        className="w-full px-1 py-1.5 bg-white border border-gray-200 rounded text-xs focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">{t('shiftRequirementsPage.c05a84') || (t('shiftRequirementsPage.c05a84') || '需要人數')}</label>
                    <input
                      type="number"
                      min="1"
                      value={req.count}
                      onChange={(e) => updateDateReq(i, 'count', parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-center bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            ))
          )}

          <button
            onClick={addDateReq}
            className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 rounded-xl transition-all text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            {t('shiftRequirementsPage.0ce5b9') || (t('shiftRequirementsPage.0ce5b9') || '新增需求')}</button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
          <button
            onClick={saveDateRequirements}
            disabled={saving}
            className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            {t('shiftRequirementsPage.01e2d1') || (t('shiftRequirementsPage.01e2d1') || '儲存覆蓋設定')}</button>
          {isOverride && (
            <button
              onClick={resetDateToTemplate}
              disabled={saving}
              className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              {t('shiftRequirementsPage.13ebe9') || (t('shiftRequirementsPage.13ebe9') || '清除覆蓋 (還原範本)')}</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-12">
      <div className="mb-6">
        <Link to="/attendance/roster" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          {t('shiftRequirementsPage.c4bc4f') || (t('shiftRequirementsPage.c4bc4f') || '返回排班管理')}</Link>
      </div>
      
      <PageHeader 
        title={t('shiftRequirementsPage.8739e4') || '門市人力需求設定'} 
        subtitle={t('shiftRequirementsPage.4b9249') || '設定每週標準人力範本，或針對特定節日進行增派調整。'}
      />
      
      <div className="mb-6 flex gap-2">
        <button 
          onClick={() => setActiveTab('weekly')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${activeTab === 'weekly' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          {t('shiftRequirementsPage.ff426d') || (t('shiftRequirementsPage.ff426d') || '預設排班範本')}</button>
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${activeTab === 'calendar' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          {t('shiftRequirementsPage.196dcd') || (t('shiftRequirementsPage.196dcd') || '特殊日期調整 (月曆)')}</button>
      </div>

      <PageContent>
        {activeTab === 'weekly' && (
          <div className="space-y-8">
            {loading ? (
              <div className="text-center py-10 text-gray-500">{t('shiftRequirementsPage.d39337') || (t('shiftRequirementsPage.d39337') || '載入中...')}</div>
            ) : (
              daysOfWeek.map((dayName, dayIndex) => {
                const reqsForDay = weeklyReqs.filter(r => r.dayOfWeek === dayIndex);
                return (
                  <div key={dayIndex} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">{dayName}</h3>
                      <button 
                        onClick={() => addWeeklyReq(dayIndex)}
                        className="text-xs font-bold text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-primary-100"
                      >
                        {t('shiftRequirementsPage.d81de1') || (t('shiftRequirementsPage.d81de1') || '+ 新增時段')}</button>
                    </div>
                    <div className="p-4">
                      {reqsForDay.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-2 italic">{t('shiftRequirementsPage.4628fb') || (t('shiftRequirementsPage.4628fb') || '無需求 (當天休店或不排班)')}</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {weeklyReqs.map((req, index) => {
                            if (req.dayOfWeek !== dayIndex) return null;
                            return (
                              <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                                <button 
                                  onClick={() => removeWeeklyReq(index)}
                                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                
                                <div className="space-y-3 pr-6">
                                  <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{t('shiftRequirementsPage.c2b1a1') || (t('shiftRequirementsPage.c2b1a1') || '職位')}</label>
                                    <select
                                      value={req.jobRoleId}
                                      onChange={(e) => updateWeeklyReq(index, 'jobRoleId', e.target.value)}
                                      className="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                    >
                                      {jobRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{t('shiftRequirementsPage.2cfccb') || (t('shiftRequirementsPage.2cfccb') || '時段')}</label>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="time"
                                          value={req.startTime}
                                          onChange={(e) => updateWeeklyReq(index, 'startTime', e.target.value)}
                                          className="w-full px-1 py-1 text-xs bg-white border border-gray-200 rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                        <span className="text-gray-400 text-xs">-</span>
                                        <input
                                          type="time"
                                          value={req.endTime}
                                          onChange={(e) => updateWeeklyReq(index, 'endTime', e.target.value)}
                                          className="w-full px-1 py-1 text-xs bg-white border border-gray-200 rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                      </div>
                                    </div>
                                    <div className="w-28">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{t('shiftRequirementsPage.6a134b') || (t('shiftRequirementsPage.6a134b') || '人數')}</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={req.count}
                                        onChange={(e) => updateWeeklyReq(index, 'count', parseInt(e.target.value))}
                                        className="w-full px-2 py-1 text-sm text-center bg-white border border-gray-200 rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            
            <div className="flex justify-end pt-4">
              <button 
                onClick={saveWeeklyRequirements}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-sm hover:bg-primary-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {t('shiftRequirementsPage.c12296') || (t('shiftRequirementsPage.c12296') || '儲存預設範本')}</button>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {renderCalendar()}
            {renderDatePanel()}
          </div>
        )}
      </PageContent>
    </div>
  );
}
