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
    title: `Thực Đơn Bàn ${normalizedTable} — Gọi Món | HiAI-MenuGo`,
    description: `Thực đơn gọi món trực tiếp tại bàn ${normalizedTable}. Xem thực đơn đa dạng, tùy biến topping và gửi đơn vào bếp.`,
    openGraph: {
      title: `Thực Đơn Bàn ${normalizedTable} — Gọi Món`,
      description: `Thực đơn gọi món trực tiếp tại bàn ${normalizedTable}.`,
    },
  };
}

export default async function TenantBranchTableMenuCatalogPage({ params }: PageProps) {
  const { tenantId, branchId, tableId } = await params;
  return <TableMenuClient tableId={tableId} tenantId={tenantId} branchId={branchId} initialView="menu" />;
}
