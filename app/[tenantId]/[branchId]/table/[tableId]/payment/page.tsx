import React from 'react';
import TablePaymentPage from '@/app/table/[tableId]/payment/page';
import { SocketProvider } from '@/context/SocketContext';

interface PageProps {
  params: Promise<{ tableId: string; tenantId?: string; branchId?: string }>;
}

export default async function TablePaymentPageWrapper({ params }: PageProps) {
  const { tableId } = await params;
  return (
    <SocketProvider config={{ tableId }}>
      <TablePaymentPage params={params} />
    </SocketProvider>
  );
}
