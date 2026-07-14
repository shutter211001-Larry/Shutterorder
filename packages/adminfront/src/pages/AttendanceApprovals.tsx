import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AttendanceCorrections from './AttendanceCorrections';
import LeaveApprovals from './LeaveApprovals';
import { PageHeader } from '../components/layout/PageHeader';
import { PageContent } from '../components/layout/PageContent';
import { CheckSquare } from 'lucide-react';

export default function AttendanceApprovals() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'corrections' | 'leaves'>('corrections');

  const ActionTabs = (
    <div className="flex bg-gray-100/80 p-1 rounded-xl">
      <button
        onClick={() => setActiveTab('corrections')}
        className={`
          px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200
          ${activeTab === 'corrections' 
            ? 'bg-white text-primary-600 shadow-sm' 
            : 'text-gray-500 hover:text-gray-900'}
        `}
      >
        {t('attendanceCorrections.title') || (t('attendanceApprovals.7883a4') || '補打卡審核')}
      </button>
      <button
        onClick={() => setActiveTab('leaves')}
        className={`
          px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200
          ${activeTab === 'leaves' 
            ? 'bg-white text-primary-600 shadow-sm' 
            : 'text-gray-500 hover:text-gray-900'}
        `}
      >
        {t('attendance.leaveApprovalTitle') || (t('attendanceApprovals.044471') || '請假審核')}
      </button>
    </div>
  );

  return (
    <div className="p-6">
      <PageHeader 
        title={t('attendanceApprovals.66644a') || '簽核中心'} 
        subtitle={t('attendanceApprovals.2ae424') || '集中管理所有員工的出勤異常與請假申請'}
        action={ActionTabs}
      />

      <PageContent noPadding>
        {activeTab === 'corrections' ? (
          <AttendanceCorrections />
        ) : (
          <LeaveApprovals />
        )}
      </PageContent>
    </div>
  );
}
