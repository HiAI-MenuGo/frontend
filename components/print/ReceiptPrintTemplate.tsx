'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { splitNoteLines } from '../../lib/format-note';
import { useI18n } from '../../context/i18nContext';

export interface ReceiptPrintItem {
  name: string;
  quantity: number;
  unitPrice: number;
  note?: string;
  modifiers?: Array<{ optionName: string }>;
}

interface ReceiptPrintTemplateProps {
  restaurantName: string;
  address?: string;
  billCode: string;
  tableName?: string;
  cashierName?: string;
  items: ReceiptPrintItem[];
  subTotal: number;
  discount?: number;
  total: number;
  payMethod?: string;
  loyaltyPoints?: number;
  vietqrUrl?: string;
}

export function ReceiptPrintTemplate({
  restaurantName,
  address,
  billCode,
  tableName,
  cashierName,
  items,
  subTotal,
  discount = 0,
  total,
  payMethod,
  loyaltyPoints,
  vietqrUrl,
}: ReceiptPrintTemplateProps) {
  const { t } = useI18n();

  return (
    <div className="print-area bg-white text-black p-2 font-mono text-xs">
      <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-black">
        <h2 className="font-black text-base uppercase">{restaurantName}</h2>
        {address && <p>{address}</p>}
        <p>{t('receipt.billCode', 'Mã bill')}: {billCode}</p>
        {tableName && <p>{t('receipt.table', 'Bàn')}: {tableName}</p>}
        {cashierName && <p>{t('receipt.cashier', 'Thu ngân')}: {cashierName}</p>}
        <p>{new Date().toLocaleString('vi-VN')}</p>
      </div>
      <div className="py-2 space-y-1.5 border-b border-dashed border-black">
        {items.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between font-bold">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>{(item.unitPrice * item.quantity).toLocaleString('vi-VN')}</span>
            </div>
            {item.modifiers && item.modifiers.length > 0 && (
              <p className="pl-3">↳ {item.modifiers.map((m) => m.optionName).join(' • ')}</p>
            )}
            <div className="pl-3">
              {splitNoteLines(item.note).map((line, nIdx) => (
                <div key={nIdx}>- {line}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="py-2 space-y-0.5 border-b border-dashed border-black">
        <div className="flex justify-between">
          <span>{t('receipt.subTotal', 'Tạm tính')}:</span>
          <span>{subTotal.toLocaleString('vi-VN')}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span>{t('receipt.discount', 'Giảm giá')}:</span>
            <span>-{discount.toLocaleString('vi-VN')}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-sm">
          <span>{t('receipt.total', 'TỔNG')}:</span>
          <span>{total.toLocaleString('vi-VN')}đ</span>
        </div>
        {payMethod && (
          <div className="flex justify-between">
            <span>{t('receipt.paymentMethod', 'Thanh toán')}:</span>
            <span>{payMethod}</span>
          </div>
        )}
        {loyaltyPoints !== undefined && (
          <p>{t('receipt.loyaltyPoints', 'Điểm tích lũy')}: +{loyaltyPoints}</p>
        )}
      </div>
      <p className="text-center py-2">{t('receipt.thankYou', 'Cảm ơn quý khách & hẹn gặp lại!')}</p>
      {vietqrUrl && (
        <div className="flex justify-center py-1">
          <QRCodeSVG value={vietqrUrl} size={120} level="H" includeMargin />
        </div>
      )}
    </div>
  );
}

export default ReceiptPrintTemplate;
