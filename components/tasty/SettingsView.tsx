'use client';

import React, { useState } from 'react';
import {
  Store,
  Printer,
  QrCode,
  Sliders,
  DollarSign,
  Bell,
  Shield,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsView() {
  const [saved, setSaved] = useState(false);
  const [storeName, setStoreName] = useState('Tasty Station (HiAI-MenuGo)');
  const [address, setAddress] = useState('123 Vo Van Ngan, Thu Duc, Ho Chi Minh City');
  const [phone, setPhone] = useState('+84 901 234 567');
  const [taxRate, setTaxRate] = useState('8');
  const [currency, setCurrency] = useState('USD');
  const [enableSound, setEnableSound] = useState(true);
  const [autoPrintBill, setAutoPrintBill] = useState(true);
  const [bankAccount, setBankAccount] = useState('1028391829');
  const [bankName, setBankName] = useState('Vietcombank (VCB)');
  const [accountOwner, setAccountOwner] = useState('IBRAHIM KADRI');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure restaurant identity, billing rules, VietQR payment gateway, and printer hardware
          </p>
        </div>

        {saved && (
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile Card */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#00A389] flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Restaurant Information</h2>
              <p className="text-xs text-slate-400">Printed on receipt header and shown on customer QR menu</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Restaurant Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#00A389] focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#00A389] focus:bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Full Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#00A389] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Taxes & Bill Calculations */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF7A59] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Tax & Billing Calculations</h2>
              <p className="text-xs text-slate-400">Matches the Payment Summary layout from the POS design</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">VAT / Tax Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#00A389] focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency Mode</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#00A389] focus:bg-white"
              >
                <option value="USD">USD ($ - Dollars)</option>
                <option value="VND">VND (₫ - Vietnam Dong)</option>
              </select>
            </div>
          </div>
        </div>

        {/* VietQR Integration */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#A855F7] flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">VietQR Automated Payment Gateway</h2>
              <p className="text-xs text-slate-400">Used for generating dynamic QR codes when customers select &quot;Scan&quot;</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#00A389] focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#00A389] focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={accountOwner}
                onChange={(e) => setAccountOwner(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#00A389] focus:bg-white uppercase"
              />
            </div>
          </div>
        </div>

        {/* Hardware & Kitchen Settings */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Hardware & Kitchen Display</h2>
              <p className="text-xs text-slate-400">Receipt printer and notification sound toggles</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={enableSound}
                onChange={(e) => setEnableSound(e.target.checked)}
                className="w-4 h-4 text-[#00A389] rounded focus:ring-[#00A389]"
              />
              <div>
                <span className="font-semibold text-slate-800">Play Audio Bell on New Orders</span>
                <p className="text-slate-400 text-[11px]">
                  Rings kitchen chime when new dine-in tickets or waiter orders are submitted
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPrintBill}
                onChange={(e) => setAutoPrintBill(e.target.checked)}
                className="w-4 h-4 text-[#00A389] rounded focus:ring-[#00A389]"
              />
              <div>
                <span className="font-semibold text-slate-800">Default to 80mm ESC/POS Thermal Receipt</span>
                <p className="text-slate-400 text-[11px]">
                  Optimizes print output dimensions for standard EPSON / Xprinter rolls
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="submit"
            className="px-6 py-3 bg-[#00A389] hover:bg-[#008f77] text-white font-semibold text-xs rounded-xl shadow-sm transition-all duration-150 flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
