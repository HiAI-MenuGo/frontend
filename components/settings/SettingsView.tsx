'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Store,
  QrCode,
  DollarSign,
  Printer,
  Save,
  CheckCircle2,
  Building2,
  ChevronRight,
  X,
  CreditCard,
  Receipt,
  Info,
  AlertCircle,
  Smartphone,
  Layers,
  Check,
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  MapPin,
  Phone,
  UploadCloud,
  Loader2,
  Cloud,
  ImageIcon,
  Pencil,
} from 'lucide-react';
import { fetchPublicBranding, updateBranding } from '@/lib/api/branding.api';
import { fetchBranches, createBranch, updateBranch, exportBranchData, deleteBranch } from '@/lib/api/branches.api';
import { uploadImageFile } from '@/lib/api/upload.api';
import type { BrandingDTO } from '@/lib/api/types';
import type { Branch } from '@/lib/api/branches.api';
import { useAuthStore } from '@/stores/auth.store';
import { useHeaderStore } from '@/stores/header.store';
import { useBranchStore } from '@/stores/branch.store';

export default function SettingsView() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'PLATFORM_ADMIN';
  const [data, setData] = useState<BrandingDTO | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [restaurantName, setRestaurantName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [bankCode, setBankCode] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [footerText, setFooterText] = useState('');
  const [taxRate, setTaxRate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app-vat-rate') || '8';
    }
    return '8';
  });
  const [billPrintMode, setBillPrintMode] = useState<'THERMAL' | 'ONLINE' | 'BOTH'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('menugo_bill_mode') as 'THERMAL' | 'ONLINE' | 'BOTH') || 'BOTH';
    }
    return 'BOTH';
  });
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [createBranchError, setCreateBranchError] = useState<string | null>(null);

  // Safety confirmation states for deleting a branch
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState('');
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [downloadTime, setDownloadTime] = useState<string | null>(null);
  const [isDeletingBranch, setIsDeletingBranch] = useState(false);
  const [deleteBranchError, setDeleteBranchError] = useState<string | null>(null);
  const [branchSuccessMessage, setBranchSuccessMessage] = useState<string | null>(null);


  useEffect(() => {
    fetchPublicBranding()
      .then((b) => {
        setData(b);
        if (b) {
          setRestaurantName(b.tenant?.name ?? '');
          setLogoUrl(b.logoUrl ?? '');
          setBankCode(b.bankCode ?? '');
          setBankAccountNo(b.bankAccountNo ?? '');
          setBankAccountName(b.bankAccountName ?? '');
          setFooterText(b.footerText ?? '');
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Không tải branding'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchBranches()
      .then(setBranches)
      .catch(() => {});
  }, [isAdmin]);

  const startAddBranch = () => {
    setEditingBranch(null);
    setNewBranchName('');
    setNewBranchCode('');
    setNewBranchAddress('');
    setNewBranchPhone('');
    setCreateBranchError(null);
    setIsAddingBranch(true);
  };

  const startEditBranch = (b: Branch, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBranch(b);
    setNewBranchName(b.name || '');
    setNewBranchCode(b.code || '');
    setNewBranchAddress(b.address || '');
    setNewBranchPhone(b.phone || '');
    setCreateBranchError(null);
    setIsAddingBranch(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) {
      setCreateBranchError('Vui lòng nhập tên chi nhánh');
      return;
    }
    setCreatingBranch(true);
    setCreateBranchError(null);
    try {
      if (editingBranch) {
        const updated = await updateBranch(editingBranch.id, {
          name: newBranchName.trim(),
          code: newBranchCode.trim() || undefined,
          address: newBranchAddress.trim() || undefined,
          phone: newBranchPhone.trim() || undefined,
        });
        const updatedList = await fetchBranches();
        setBranches(updatedList);
        useBranchStore.getState().fetchBranches();
        setIsAddingBranch(false);
        setEditingBranch(null);
        setBranchSuccessMessage(`Đã cập nhật chi nhánh "${updated.name}" thành công!`);
        setTimeout(() => setBranchSuccessMessage(null), 3500);
      } else {
        const created = await createBranch({
          name: newBranchName.trim(),
          code: newBranchCode.trim() || undefined,
          address: newBranchAddress.trim() || undefined,
          phone: newBranchPhone.trim() || undefined,
        });
        const updatedList = await fetchBranches();
        setBranches(updatedList);
        useBranchStore.getState().fetchBranches();
        setIsAddingBranch(false);
        setBranchSuccessMessage(`Đã thêm chi nhánh "${created.name}" thành công!`);
        setTimeout(() => setBranchSuccessMessage(null), 3500);
      }
      setNewBranchName('');
      setNewBranchCode('');
      setNewBranchAddress('');
      setNewBranchPhone('');
    } catch (err: unknown) {
      setCreateBranchError(err instanceof Error ? err.message : 'Không thể lưu thông tin chi nhánh');
    } finally {
      setCreatingBranch(false);
    }
  };

  const handleDownloadBackup = async () => {
    if (!branchToDelete) return;
    setIsDownloadingBackup(true);
    setDeleteBranchError(null);
    try {
      const exportData = await exportBranchData(branchToDelete.id);
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${branchToDelete.code || 'branch'}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setHasDownloadedBackup(true);
      setDownloadTime(new Date().toLocaleTimeString('vi-VN'));
    } catch (err: unknown) {
      setDeleteBranchError(err instanceof Error ? err.message : 'Không thể tải xuống dữ liệu chi nhánh');
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!branchToDelete) return;
    if (confirmDeleteName.trim().toLowerCase() !== branchToDelete.name.trim().toLowerCase()) {
      setDeleteBranchError('Tên chi nhánh xác nhận không khớp. Vui lòng nhập chính xác tên chi nhánh.');
      return;
    }
    if (!hasDownloadedBackup) {
      setDeleteBranchError('Vui lòng tải xuống bản sao lưu toàn bộ dữ liệu chi nhánh trước khi xoá.');
      return;
    }
    setIsDeletingBranch(true);
    setDeleteBranchError(null);
    try {
      await deleteBranch(branchToDelete.id, confirmDeleteName.trim());
      if (useBranchStore.getState().selectedBranchId === branchToDelete.id) {
        useBranchStore.getState().setBranchId('ALL');
      }
      const updatedList = await fetchBranches();
      setBranches(updatedList);
      useBranchStore.getState().fetchBranches();
      setBranchSuccessMessage(`Đã xoá chi nhánh "${branchToDelete.name}" thành công!`);
      setTimeout(() => setBranchSuccessMessage(null), 3500);
      setBranchToDelete(null);
      setConfirmDeleteName('');
      setHasDownloadedBackup(false);
      setDownloadTime(null);
    } catch (err: unknown) {
      setDeleteBranchError(err instanceof Error ? err.message : 'Không thể xoá chi nhánh');
    } finally {
      setIsDeletingBranch(false);
    }
  };

  const openDeleteModal = (b: Branch, e: React.MouseEvent) => {
    e.stopPropagation();
    if (branches.length <= 1) {
      alert('Không thể xoá chi nhánh duy nhất còn lại của nhà hàng. Hệ thống cần ít nhất một chi nhánh hoạt động.');
      return;
    }
    setBranchToDelete(b);
    setConfirmDeleteName('');
    setHasDownloadedBackup(false);
    setDownloadTime(null);
    setDeleteBranchError(null);
  };


  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP, SVG)');
      return;
    }
    setUploadingLogo(true);
    try {
      const res = await uploadImageFile(file, 'hiai-menugo/branding');
      setLogoUrl(res.url);
    } catch (err: any) {
      alert('Tải logo lên thất bại: ' + (err.message || ''));
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSave = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateBranding({
        restaurantName: restaurantName.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        bankCode,
        bankAccountNo,
        bankAccountName,
        footerText,
      });
      setData(updated);
      if (updated.tenant?.name) {
        setRestaurantName(updated.tenant.name);
      }
      try {
        localStorage.setItem('app-vat-rate', taxRate);
        localStorage.setItem('menugo_bill_mode', billPrintMode);
      } catch {
        // ignore
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [restaurantName, logoUrl, bankCode, bankAccountNo, bankAccountName, footerText, taxRate, billPrintMode]);

  const setCustomAction = useHeaderStore((s) => s.setCustomAction);

  useEffect(() => {
    setCustomAction(
      <div className="flex items-center gap-2.5">
        {saved && (
          <div className="px-3 py-1.5 bg-[#E6F7F4] border border-[#00A389]/30 text-[#00A389] text-[12px] font-bold rounded-2xl flex items-center gap-1.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00A389]" />
            <span>Đã lưu thành công!</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="h-10 px-4 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center gap-2 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98] disabled:opacity-50 shrink-0"
        >
          <Save size={16} />
          <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
        </button>
      </div>
    );
    return () => setCustomAction(null);
  }, [setCustomAction, saving, saved, handleSave]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-[#00A389] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] font-semibold">Đang tải cấu hình hệ thống...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 space-y-6 max-w-6xl mx-auto w-full">

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[13px] text-amber-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Lưu ý tải dữ liệu: </span>
            <span>{error} — Bạn vẫn có thể chỉnh sửa các trường bên dưới và bấm lưu cấu hình bình thường.</span>
          </div>
        </div>
      )}

      {/* Grid 2 Cột Chức Năng */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CỘT 1: Nhà hàng & In ấn & Thuế */}
        <div className="space-y-6">
          {/* Card 1: Thông tin Nhà hàng & In bill */}
          <div className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#E2E8F0] shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9]">
              <div className="w-10 h-10 rounded-2xl bg-[#E6F7F4] text-[#00A389] flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-black text-[#0F172A]">Thông tin quán & In hoá đơn</h2>
                <p className="text-[12px] text-[#64748B]">Thông tin hiển thị trên hoá đơn thanh toán</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="restaurant-name" className="text-[12.5px] font-bold text-[#475569] block mb-1.5">
                  Tên nhà hàng / Chi nhánh
                </label>
                <div className="relative">
                  <Receipt size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00A389]" />
                  <input
                    id="restaurant-name"
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Nhập tên nhà hàng / quán ăn..."
                    className="w-full h-11 pl-10 pr-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13.5px] font-bold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#00A389] focus:outline-hidden transition-all"
                  />
                </div>
                <p className="text-[11.5px] text-[#94A3B8] mt-1">
                  Tên quán hiển thị ở tiêu đề hoá đơn in, thực đơn online và toàn hệ thống.
                </p>
              </div>

              {/* Logo quán */}
              <div>
                <label className="text-[12.5px] font-bold text-[#475569] block mb-1.5">
                  Logo Quán / Thương Hiệu
                </label>
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={logoUrl} alt="Logo quán" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[#94A3B8]" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="h-9 px-3.5 rounded-xl bg-[#E6F7F4] hover:bg-[#cbf0ea] text-[#00A389] text-[12px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Đang tải lên...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={14} />
                            <span>Tải logo lên (Cloudinary)</span>
                          </>
                        )}
                      </button>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="h-9 px-3 text-[12px] font-bold text-rose-500 hover:text-rose-600 transition-colors"
                        >
                          Xoá
                        </button>
                      )}
                    </div>
                    {logoUrl && logoUrl.includes('cloudinary') && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#00A389]">
                        <Cloud size={12} />
                        <span>Đã lưu trữ trên Cloudinary</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[11.5px] text-[#94A3B8] mt-1.5">
                  Logo hiển thị trên Web QR Menu của khách, trung tâm mã QR bàn và đầu phiếu in nhiệt.
                </p>
              </div>

              <div>
                <label htmlFor="footer-text" className="text-[12.5px] font-bold text-[#475569] block mb-1.5">
                  Lời chào chân hoá đơn (Footer in bill)
                </label>
                <textarea
                  id="footer-text"
                  rows={2}
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#00A389] focus:outline-hidden transition-all resize-none"
                  placeholder="VD: Cảm ơn quý khách và hẹn gặp lại! Hotline: 0909 xxx xxx"
                />
                <p className="text-[11.5px] text-[#94A3B8] mt-1">
                  Đoạn văn bản này sẽ được in ở cuối mỗi tờ hoá đơn nhiệt 80mm gửi cho khách.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Thuế & Tiền tệ */}
          <div className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#E2E8F0] shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9]">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF7A59] flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-black text-[#0F172A]">Thuế & Tiền tệ</h2>
                <p className="text-[12px] text-[#64748B]">Tỷ lệ thuế suất áp dụng cho tổng giá trị đơn</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="tax-rate" className="text-[12.5px] font-bold text-[#475569] block mb-1.5">
                  Thuế giá trị gia tăng (VAT %)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-44">
                    <input
                      id="tax-rate"
                      type="number"
                      min={0}
                      max={100}
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full h-11 pl-4 pr-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[14px] font-bold text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#94A3B8]">
                      %
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['0', '5', '8', '10'].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setTaxRate(rate)}
                        className={`h-9 px-3 rounded-xl text-[12px] font-bold border transition-all ${
                          taxRate === rate
                            ? 'bg-orange-50 border-[#FF7A59] text-[#FF7A59]'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-slate-300'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex items-center gap-2.5 text-[12px] text-[#64748B]">
                <Info size={16} className="text-[#00A389] shrink-0" />
                <span>Đơn vị tiền tệ hiển thị cố định: <strong>Việt Nam Đồng (VND - ₫)</strong>.</span>
              </div>
            </div>
          </div>

          {/* Card 3: Cấu hình Phương thức In & Xuất Bill */}
          <div className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#E2E8F0] shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#F1F5F9]">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-black text-[#0F172A]">Phương thức in & Xuất bill</h2>
                <p className="text-[12px] text-[#64748B]">Tùy chọn in bill nhiệt tại quầy hoặc cấp bill online cho khách tải về</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: In bill nhiệt */}
              <div
                onClick={() => setBillPrintMode('THERMAL')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  billPrintMode === 'THERMAL'
                    ? 'border-[#00A389] bg-[#F0FDF4] shadow-2xs ring-1 ring-[#00A389]/20'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                  billPrintMode === 'THERMAL'
                    ? 'border-[#00A389] bg-[#00A389] text-white'
                    : 'border-[#CBD5E1] bg-white'
                }`}>
                  {billPrintMode === 'THERMAL' && <Check size={12} strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Printer size={15} className="text-[#00A389]" />
                    <span className="font-extrabold text-[13.5px] text-[#0F172A]">In bill nhiệt tại quầy (K80)</span>
                  </div>
                  <p className="text-[12px] text-[#64748B] mt-0.5 leading-relaxed">
                    Kích hoạt lệnh in hoá đơn giấy qua máy in bill nhiệt khổ 80mm khi thu ngân xác nhận thanh toán.
                  </p>
                </div>
              </div>

              {/* Option 2: Hoá đơn online (Khách quét QR tải về) */}
              <div
                onClick={() => setBillPrintMode('ONLINE')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  billPrintMode === 'ONLINE'
                    ? 'border-[#00A389] bg-[#F0FDF4] shadow-2xs ring-1 ring-[#00A389]/20'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                  billPrintMode === 'ONLINE'
                    ? 'border-[#00A389] bg-[#00A389] text-white'
                    : 'border-[#CBD5E1] bg-white'
                }`}>
                  {billPrintMode === 'ONLINE' && <Check size={12} strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Smartphone size={15} className="text-[#00A389]" />
                    <span className="font-extrabold text-[13.5px] text-[#0F172A]">Hoá đơn Online (Khách quét QR tải về)</span>
                  </div>
                  <p className="text-[12px] text-[#64748B] mt-0.5 leading-relaxed">
                    Khi thanh toán thành công, màn hình quét QR trên điện thoại của khách sẽ tự động hiển thị bill điện tử để xem và tải về máy.
                  </p>
                </div>
              </div>

              {/* Option 3: Cả hai (In nhiệt & Online) */}
              <div
                onClick={() => setBillPrintMode('BOTH')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  billPrintMode === 'BOTH'
                    ? 'border-[#00A389] bg-[#F0FDF4] shadow-2xs ring-1 ring-[#00A389]/30'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                  billPrintMode === 'BOTH'
                    ? 'border-[#00A389] bg-[#00A389] text-white'
                    : 'border-[#CBD5E1] bg-white'
                }`}>
                  {billPrintMode === 'BOTH' && <Check size={12} strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Layers size={15} className="text-[#00A389]" />
                    <span className="font-extrabold text-[13.5px] text-[#0F172A]">Cả hai hình thức (In nhiệt & Online)</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#00A389]/10 text-[#00A389]">Khuyên dùng</span>
                  </div>
                  <p className="text-[12px] text-[#64748B] mt-0.5 leading-relaxed">
                    Vừa kích hoạt lệnh in bill nhiệt khổ K80 tại quầy, vừa cấp hoá đơn điện tử trực tiếp trên màn hình quét QR cho khách xem và tải về.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT 2: Chi nhánh & VietQR */}
        <div className="space-y-6">
          {/* Card 4: Quản lý Chi nhánh (ADMIN) */}
          {isAdmin && (
            <div className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#E2E8F0] shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-black text-[#0F172A]">Quản lý chi nhánh</h2>
                    <p className="text-[12px] text-[#64748B]">Thêm mới, sửa địa chỉ hoặc xoá chi nhánh</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    startAddBranch();
                    setShowBranchPicker(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-extrabold text-[12px] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Thêm chi nhánh</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddingBranch(false);
                  setEditingBranch(null);
                  setShowBranchPicker(true);
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Building2 size={19} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-black text-[#0F172A] truncate">
                      Danh sách {branches.length} chi nhánh trong hệ thống
                    </div>
                    <div className="text-[11.5px] text-[#64748B] truncate mt-0.5">
                      Bấm để mở danh sách thêm, sửa hoặc xoá chi nhánh
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#00A389] group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span>Mở danh sách</span>
                  <ChevronRight size={16} />
                </div>
              </button>
            </div>
          )}

          {/* Card 5: Cấu hình Tài khoản VietQR */}
          <div className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#E2E8F0] shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9]">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-black text-[#0F172A]">Thanh toán VietQR</h2>
                <p className="text-[12px] text-[#64748B]">Cấu hình tài khoản nhận tiền chuyển khoản tự động</p>
              </div>
            </div>

            {/* Thẻ mô phỏng VietQR Card sang trọng */}
            <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#0B1329] rounded-[22px] p-5 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <QrCode size={18} className="text-[#00A389]" />
                  <span className="text-[11.5px] font-black tracking-wider uppercase text-slate-300">
                    VietQR • Napas 247
                  </span>
                </div>
                <span className="text-[10.5px] bg-white/10 px-2 py-0.5 rounded-full font-mono text-emerald-400 font-bold">
                  {bankCode ? `BIN: ${bankCode}` : 'Mã BIN'}
                </span>
              </div>

              <div className="font-mono text-[17px] tracking-widest font-black text-slate-100 my-2 relative z-10">
                {bankAccountNo ? bankAccountNo.replace(/(\d{4})(?=\d)/g, '$1 ') : '•••• •••• •••• ••••'}
              </div>

              <div className="flex justify-between items-end mt-3 pt-2.5 border-t border-white/10 relative z-10">
                <div className="min-w-0 pr-2">
                  <p className="text-[9.5px] uppercase tracking-wider text-slate-400 font-bold">Chủ tài khoản</p>
                  <p className="text-[13px] font-black uppercase text-white truncate">
                    {bankAccountName || 'TÊN CHỦ TÀI KHOẢN'}
                  </p>
                </div>
                <span className="text-[11px] font-black text-[#00A389] shrink-0">MenuGO POS</span>
              </div>
            </div>

            {/* Các trường nhập liệu VietQR */}
            <div className="space-y-4 pt-1">
              <div>
                <label htmlFor="bank-code" className="text-[12.5px] font-bold text-[#475569] block mb-1.5">
                  Mã ngân hàng (Bank BIN code)
                </label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    id="bank-code"
                    type="text"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    placeholder="970436 (Vietcombank), 970415 (VietinBank)..."
                    className="w-full h-11 pl-10 pr-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#00A389] focus:outline-hidden transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bank-acc-no" className="text-[12.5px] font-bold text-[#475569] block mb-1.5">
                  Số tài khoản nhận tiền
                </label>
                <input
                  id="bank-acc-no"
                  type="text"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  placeholder="Nhập số tài khoản ngân hàng..."
                  className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] font-bold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#00A389] focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label htmlFor="bank-acc-name" className="text-[12.5px] font-bold text-[#475569] block mb-1.5">
                  Tên chủ tài khoản (Viết hoa không dấu)
                </label>
                <input
                  id="bank-acc-name"
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  placeholder="NGUYEN VAN A"
                  className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] font-bold text-[#0F172A] placeholder-[#94A3B8] uppercase focus:bg-white focus:border-[#00A389] focus:outline-hidden transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Modal Quản Lý Chi Nhánh (Thêm, Sửa, Chọn, Xoá) */}
      {showBranchPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full sm:max-w-3xl lg:max-w-4xl p-6 sm:p-7 relative shadow-2xl border border-[#E2E8F0] max-h-[92vh] flex flex-col">
            <button
              onClick={() => {
                setShowBranchPicker(false);
                setIsAddingBranch(false);
                setEditingBranch(null);
              }}
              className="absolute top-5 right-5 w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Đóng"
            >
              <X size={19} />
            </button>

            <div className="pr-10 mb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-black text-[19px] text-[#0F172A] tracking-tight">Quản lý chi nhánh</h3>
                  <p className="text-[12.5px] text-[#64748B]">
                    Cập nhật địa chỉ, số điện thoại hoặc thêm/sửa/xoá chi nhánh trong hệ thống.
                  </p>
                </div>
              </div>
            </div>

            {branchSuccessMessage && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] font-bold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                <span>{branchSuccessMessage}</span>
              </div>
            )}

            {/* Top Toolbar: Nút Thêm chi nhánh */}
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
              <span className="text-[12px] font-black text-slate-500 uppercase tracking-wider">
                Danh sách ({branches.length} chi nhánh)
              </span>
              <button
                type="button"
                onClick={() => {
                  if (isAddingBranch) {
                    setIsAddingBranch(false);
                    setEditingBranch(null);
                  } else {
                    startAddBranch();
                  }
                }}
                className={`px-3.5 py-2 rounded-xl font-bold text-[12.5px] flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAddingBranch
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-[#E6F7F4] text-[#00A389] hover:bg-[#d0f2ec]'
                }`}
              >
                {isAddingBranch ? (
                  <>
                    <X size={15} />
                    <span>Đóng biểu mẫu</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Thêm chi nhánh mới</span>
                  </>
                )}
              </button>
            </div>

            {/* Form Thêm / Chỉnh Sửa Chi Nhánh (Form to, rộng rãi, chuẩn Enterprise) */}
            {isAddingBranch && (
              <form onSubmit={handleSaveBranch} className="mb-4 p-5 sm:p-6 bg-[#F8FAFC] rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="text-[14px] font-black text-[#0F172A] flex items-center gap-2">
                    {editingBranch ? (
                      <>
                        <Pencil size={16} className="text-[#00A389]" />
                        <span>Chỉnh sửa thông tin chi nhánh: <span className="text-[#00A389]">{editingBranch.name}</span></span>
                      </>
                    ) : (
                      <>
                        <Building2 size={16} className="text-[#00A389]" />
                        <span>Tạo chi nhánh mới vào hệ thống</span>
                      </>
                    )}
                  </span>
                  <span className="text-[11.5px] text-slate-500 font-medium hidden sm:inline">
                    * Địa chỉ chi nhánh sẽ tự động đồng bộ sang Menu QR của khách hàng
                  </span>
                </div>

                {createBranchError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-[12.5px] font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{createBranchError}</span>
                  </div>
                )}

                {/* Nhóm 1: Tên & Mã */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-bold text-slate-700 block mb-1.5">
                      Tên chi nhánh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="VD: Chi nhánh Quận 1, Chi nhánh Thủ Đức..."
                      required
                      className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:border-[#00A389] focus:outline-hidden transition"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-bold text-slate-700 block mb-1.5">
                      Mã chi nhánh (Viết hoa, viết liền)
                    </label>
                    <input
                      type="text"
                      value={newBranchCode}
                      onChange={(e) => setNewBranchCode(e.target.value.toUpperCase())}
                      placeholder="VD: CN-Q1, TS-01..."
                      className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 uppercase font-mono focus:border-[#00A389] focus:outline-hidden transition"
                    />
                  </div>
                </div>

                {/* Nhóm 2: Địa chỉ chi nhánh (Trọng tâm đồng bộ Menu QR) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#00A389]" />
                      <span>Địa chỉ chi nhánh (Hiển thị trực tiếp trên Menu QR khách & Bill in)</span>
                    </label>
                    <span className="text-[11px] text-[#00A389] font-bold">Đồng bộ tự động</span>
                  </div>
                  <input
                    type="text"
                    value={newBranchAddress}
                    onChange={(e) => setNewBranchAddress(e.target.value)}
                    placeholder="VD: 123 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP. HCM"
                    className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:border-[#00A389] focus:outline-hidden transition"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Khách hàng khi quét mã QR tại bàn của chi nhánh này sẽ nhìn thấy địa chỉ trên ở đầu thực đơn và biên lai thanh toán.
                  </p>
                </div>

                {/* Nhóm 3: Số điện thoại hotline & Giờ phục vụ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-500" />
                      <span>Số điện thoại hotline chi nhánh</span>
                    </label>
                    <input
                      type="text"
                      value={newBranchPhone}
                      onChange={(e) => setNewBranchPhone(e.target.value)}
                      placeholder="VD: 028 3896 7890 hoặc 0909 123 456"
                      className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:border-[#00A389] focus:outline-hidden transition"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-bold text-slate-700 block mb-1.5">
                      Ghi chú hoạt động / Giờ mở cửa
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 07:00 - 22:30 hàng ngày"
                      className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:border-[#00A389] focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingBranch(false);
                      setEditingBranch(null);
                    }}
                    className="h-9 px-4 rounded-xl text-[12.5px] font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Huỷ bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={creatingBranch || !newBranchName.trim()}
                    className="h-9 px-5 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[12.5px] flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {creatingBranch ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : editingBranch ? (
                      <>
                        <Save size={15} />
                        <span>Lưu thay đổi chi nhánh</span>
                      </>
                    ) : (
                      <>
                        <Plus size={15} />
                        <span>Xác nhận tạo chi nhánh</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Danh sách Chi Nhánh thuần quản lý (Thêm, Sửa, Xoá) */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {branches.length === 0 ? (
                <div className="p-8 text-center bg-[#F8FAFC] rounded-2xl border border-dashed border-slate-300 space-y-2">
                  <Building2 size={32} className="mx-auto text-slate-400" />
                  <p className="text-[13.5px] font-bold text-[#0F172A]">Chưa có chi nhánh nào trong hệ thống</p>
                  <p className="text-[12px] text-slate-500">Bấm &quot;Thêm chi nhánh mới&quot; phía trên để tạo chi nhánh đầu tiên.</p>
                </div>
              ) : (
                branches.map((b) => (
                  <div
                    key={b.id}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#E2E8F0] bg-white hover:border-slate-300 transition-all text-left"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Building2 size={19} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-black text-[#0F172A] truncate">{b.name}</span>
                          {b.code && (
                            <span className="text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                              {b.code}
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-[#64748B] truncate mt-1 flex items-center gap-3.5">
                          {b.address ? (
                            <span className="flex items-center gap-1.5 truncate">
                              <MapPin size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{b.address}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa cập nhật địa chỉ</span>
                          )}
                          {b.phone && (
                            <span className="flex items-center gap-1.5 shrink-0">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{b.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {/* Nút Sửa chi nhánh */}
                      <button
                        type="button"
                        onClick={(e) => startEditBranch(b, e)}
                        title="Chỉnh sửa thông tin chi nhánh này"
                        className="h-9 px-3 rounded-xl text-slate-700 hover:text-[#00A389] hover:bg-[#E6F7F4] border border-slate-200 hover:border-[#00A389] flex items-center gap-1.5 font-bold text-[12px] transition-all cursor-pointer"
                      >
                        <Pencil size={14} />
                        <span>Sửa</span>
                      </button>

                      {/* Nút Xoá chi nhánh */}
                      <button
                        type="button"
                        onClick={(e) => openDeleteModal(b, e)}
                        title="Xoá chi nhánh này"
                        className="h-9 px-3 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 flex items-center gap-1.5 font-bold text-[12px] transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                        <span>Xoá</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xoá Chi Nhánh & Yêu Cầu Sao Lưu Dữ Liệu */}
      {branchToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 relative shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setBranchToDelete(null);
                setConfirmDeleteName('');
                setHasDownloadedBackup(false);
                setDeleteBranchError(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            {/* Header Warning */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-black text-[17px] text-[#0F172A] tracking-tight">
                  Xác nhận xoá chi nhánh
                </h3>
                <p className="text-[12.5px] font-semibold text-rose-600 mt-0.5">
                  Chi nhánh: <span className="font-extrabold underline">{branchToDelete.name}</span> ({branchToDelete.code})
                </p>
              </div>
            </div>

            {/* Cảnh báo phá huỷ */}
            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl text-[12px] text-rose-800 leading-relaxed">
              <span className="font-black">Cảnh báo nghiêm trọng: </span>
              Hành động này mang tính phá huỷ và <strong>KHÔNG THỂ HOÀN TÁC</strong>. Toàn bộ dữ liệu bàn, khu vực, lịch sử đơn hàng và kho nguyên liệu của chi nhánh này sẽ bị xoá vĩnh viễn khỏi cơ sở dữ liệu.
            </div>

            {deleteBranchError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[12.5px] font-bold rounded-2xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{deleteBranchError}</span>
              </div>
            )}

            {/* BƯỚC 1: Yêu cầu tải xuống toàn bộ dữ liệu */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-black text-[#0F172A] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black flex items-center justify-center">1</span>
                  <span>Tải xuống toàn bộ dữ liệu chi nhánh (.json) *</span>
                </span>
                {hasDownloadedBackup && (
                  <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>Đã tải xuống</span>
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-[#64748B] leading-relaxed">
                Để tránh mất mát dữ liệu quan trọng, bạn được yêu cầu tải xuống file sao lưu toàn bộ dữ liệu chi nhánh trước khi xoá.
              </p>

              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isDownloadingBackup}
                className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-[12.5px] flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  hasDownloadedBackup
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50 shadow-2xs'
                }`}
              >
                {isDownloadingBackup ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Đang đóng gói và tải xuống dữ liệu...</span>
                  </>
                ) : hasDownloadedBackup ? (
                  <>
                    <Download size={14} className="text-emerald-600" />
                    <span>Tải lại dữ liệu (.json) — Đã sao lưu lúc {downloadTime}</span>
                  </>
                ) : (
                  <>
                    <Download size={14} className="text-blue-600" />
                    <span>Tải xuống toàn bộ dữ liệu chi nhánh (.json)</span>
                  </>
                )}
              </button>
            </div>

            {/* BƯỚC 2: Nhập tên chi nhánh để xác nhận */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black flex items-center justify-center">2</span>
                <span className="text-[12.5px] font-black text-[#0F172A]">
                  Bắt buộc nhập chính xác tên chi nhánh *
                </span>
              </div>
              <p className="text-[11.5px] text-[#64748B]">
                Vui lòng gõ chính xác{' '}
                <span className="font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 select-all">
                  {branchToDelete.name}
                </span>{' '}
                để xác nhận xoá:
              </p>

              <input
                type="text"
                value={confirmDeleteName}
                onChange={(e) => setConfirmDeleteName(e.target.value)}
                placeholder={`Nhập chính xác "${branchToDelete.name}"`}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-[13px] font-bold text-[#0F172A] placeholder-slate-400 focus:border-rose-500 focus:outline-hidden"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setBranchToDelete(null);
                  setConfirmDeleteName('');
                  setHasDownloadedBackup(false);
                  setDeleteBranchError(null);
                }}
                className="h-10 px-4 rounded-xl text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Huỷ bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={
                  !hasDownloadedBackup ||
                  confirmDeleteName.trim().toLowerCase() !== branchToDelete.name.trim().toLowerCase() ||
                  isDeletingBranch
                }
                className={`h-10 px-5 rounded-xl font-extrabold text-[12.5px] flex items-center gap-2 transition-all ${
                  hasDownloadedBackup &&
                  confirmDeleteName.trim().toLowerCase() === branchToDelete.name.trim().toLowerCase()
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 active:scale-[0.98] cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                {isDeletingBranch ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xoá dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>
                      {!hasDownloadedBackup
                        ? '1. Cần tải dữ liệu trước'
                        : confirmDeleteName.trim().toLowerCase() !== branchToDelete.name.trim().toLowerCase()
                        ? '2. Nhập đúng tên chi nhánh'
                        : 'Xác nhận xoá vĩnh viễn'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
