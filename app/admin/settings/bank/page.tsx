'use client';

import React, { useState } from 'react';
import { CreditCard, Save, ShieldCheck, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminBankSettingsPage() {
  const [bankCode, setBankCode] = useState('MB');
  const [accountNo, setAccountNo] = useState('0901234567');
  const [accountName, setAccountName] = useState('CONG TY CO PHAN HIAI MENUGO');
  const [isSaved, setIsSaved] = useState(false);

  const previewQrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=100000&addInfo=PREVIEW%20CHECK&accountName=${encodeURIComponent(
    accountName
  )}`;

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
          CẤU HÌNH TÀI KHOẢN NGÂN HÀNG THỤ HƯỞNG (VIETQR)
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Thiết lập tài khoản nhận tiền chuyển khoản tự động qua mã VietQR chuẩn Napas 247
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Input Form */}
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-extrabold text-sm text-zinc-200 flex items-center gap-2 pb-3 border-b border-zinc-800">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <span>Thông Tin Tài Khoản Doanh Nghiệp</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-zinc-300">Ngân hàng thụ hưởng</label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-semibold focus:outline-none"
              >
                <option value="MB">MBBank — Ngân hàng Quân Đội</option>
                <option value="VCB">Vietcombank — Ngân hàng Ngoại Thương</option>
                <option value="ACB">ACB — Ngân hàng Á Châu</option>
                <option value="TCB">Techcombank — Ngân hàng Kỹ Thương</option>
                <option value="TPB">TPBank — Ngân hàng Tiên Phong</option>
                <option value="BIDV">BIDV — Đầu tư và Phát triển</option>
                <option value="CTG">VietinBank — Công Thương Việt Nam</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-zinc-300">Số tài khoản</label>
              <input
                type="text"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-300">Tên chủ tài khoản (Viết hoa không dấu)</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 uppercase font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              Tài khoản này sẽ được dùng để tạo mã VietQR động chứa số tiền chính xác trên màn hình gọi món tại bàn và POS thu ngân.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? '✓ Đã Lưu' : 'Lưu Cấu Hình Ngân Hàng'}</span>
            </button>
          </div>
        </div>

        {/* Right: VietQR Live Preview Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col items-center justify-between text-center space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Xem Trước Mã VietQR
            </span>
            <p className="text-xs text-zinc-400">Kiểm tra quét thử bằng app ngân hàng</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl shadow-inner border border-zinc-200">
            <QRCodeSVG value={previewQrUrl} size={150} level="H" includeMargin />
          </div>

          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-zinc-200">{accountName}</p>
            <p className="font-mono text-amber-400 font-bold">{accountNo} ({bankCode})</p>
          </div>
        </div>
      </div>
    </div>
  );
}
