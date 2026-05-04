import React, { useState, useEffect } from 'react';
import { Save, Info, Landmark } from 'lucide-react';
import { settingsService, BankSettings } from '@/src/services/settingsService';

export default function BankSettingsForm() {
  const [settings, setSettings] = useState<BankSettings>({
    name: '',
    accountNumber: '',
    accountName: '',
    shortName: 'mbbank'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getBankSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      await settingsService.saveBankSettings(settings);
      setMessage({ text: 'Đã lưu cấu hình ngân hàng thành công!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: 'Lỗi khi lưu cấu hình. Vui lòng thử lại.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Landmark size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Cấu hình Ngân hàng</h3>
            <p className="text-xs text-slate-400 font-medium">Thông tin hiển thị cho phụ huynh khi thanh toán</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {message.text && (
          <div className={`p-3 rounded-xl text-xs font-bold ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Tên Ngân hàng</label>
            <input
              type="text"
              required
              placeholder="VD: MB BANK, Vietcombank..."
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Mã định danh (Short Name)</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="VD: mbbank, vcb, icb..."
                value={settings.shortName}
                onChange={(e) => setSettings({ ...settings, shortName: e.target.value.toLowerCase().trim() })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-semibold pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" title="Mã theo tiêu chuẩn VietQR (như vcb, mbbank, bidv, tcb...)">
                <Info size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Số tài khoản</label>
            <input
              type="text"
              required
              placeholder="Nhập số tài khoản thật"
              value={settings.accountNumber}
              onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value.trim() })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-mono font-bold text-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Tên chủ tài khoản</label>
            <input
              type="text"
              required
              placeholder="Tên in trên thẻ (không dấu)"
              value={settings.accountName}
              onChange={(e) => setSettings({ ...settings, accountName: e.target.value.toUpperCase() })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-bold uppercase"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 ${
              isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
            }`}
          >
            <Save size={18} />
            {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </form>
    </div>
  );
}
