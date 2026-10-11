import React from 'react';
import OrderStatusPage from '@/app/table/[tableId]/order-status/page';
import { SocketProvider } from '@/context/SocketContext';

interface PageProps {
  params: Promise<{ tableId: string; tenantId?: string; branchId?: string }>;
}

export default async function OrderStatusPageWrapper({ params }: PageProps) {
  const { tableId } = await params;
  return (
    <SocketProvider config={{ tableId }}>
      <OrderStatusPage params={params} />
    </SocketProvider>
  );
}
