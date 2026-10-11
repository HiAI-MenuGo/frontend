'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ tableId: string; tenantId?: string; branchId?: string }>;
}

export default function OrderStatusPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { tableId, tenantId, branchId } = resolvedParams;
  const router = useRouter();

  const basePath = tenantId && branchId
    ? `/${tenantId}/${branchId}/table/${tableId}`
    : `/table/${tableId}`;

  useEffect(() => {
    // Bỏ trang order-status, tự động chuyển về thực đơn của bàn
    router.replace(basePath);
  }, [router, basePath]);

  return null;
}
