import React from 'react';
import type { Metadata } from 'next';
import CustomersView from '@/components/customers/CustomersView';

export const metadata: Metadata = {
  title: 'Yêu Cầu & Đánh Giá Khách Hàng | HiAI-MenuGo',
  description: 'Quản lý yêu cầu gọi phục vụ, gọi thanh toán và phản hồi rating từ thực khách quét QR.',
};

export default function RequestsPage() {
  return <CustomersView initialTab="calls" />;
}
