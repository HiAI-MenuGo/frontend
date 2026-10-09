import React from 'react';
import type { Metadata } from 'next';
import TableMenuClient from '@/app/table/[tableId]/TableMenuClient';

interface PageProps {
  params: Promise<{ tenantId: string; branchId: string; tableId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tableId } = await params;
  const normalizedTable = tableId.toUpperCase();

  return {
    title: `Bàn ${normalizedTable} — Thực Đơn & Gọi Món | HiAI-MenuGo`,
    description: `Quét QR gọi món trực tiếp tại bàn ${normalizedTable}. Xem thực đơn, tùy biến topping, theo dõi tiến trình chế biến và thanh toán VietQR tiện lợi.`,
    openGraph: {
      title: `Bàn ${normalizedTable} — Thực Đơn & Gọi Món`,
      description: `Đặt món trực tiếp tại bàn ${normalizedTable} với thực đơn đa dạng và thanh toán VietQR realtime.`,
    },
  };
}

export default async function TenantBranchTableMenuPage({ params }: PageProps) {
  const { tenantId, branchId, tableId } = await params;
  return <TableMenuClient tableId={tableId} tenantId={tenantId} branchId={branchId} initialView="home" />;
}
