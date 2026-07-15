import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  expectedText: string;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  expectedText,
  confirmText,
  cancelText,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatch = inputValue === expectedText;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{message}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('deleteConfirmModal.typeToConfirm') || '請輸入下列文字以確認操作：'}
              <span className="block mt-1 font-mono text-red-600 bg-red-50 px-2 py-1 rounded select-all border border-red-100">
                {expectedText}
              </span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-shadow"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={expectedText}
              autoFocus
            />
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-300"
          >
            {cancelText || t('confirmGlobal.625fb2') || '取消'}
          </button>
          <button 
            onClick={() => {
              if (isMatch) {
                onConfirm();
                onClose();
              }
            }}
            disabled={!isMatch}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
              isMatch 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-red-300 cursor-not-allowed'
            }`}
          >
            {confirmText || t('confirmGlobal.30749e') || '確認刪除'}
          </button>
        </div>
      </div>
    </div>
  );
}
