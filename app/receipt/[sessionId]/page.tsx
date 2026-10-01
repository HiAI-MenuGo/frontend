import { Metadata } from 'next';
import ReceiptClient from './ReceiptClient';

interface ReceiptPageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: ReceiptPageProps): Promise<Metadata> {
  const { sessionId } = await params;
  return {
    title: `Hóa đơn điện tử #${sessionId} | HiAI-MenuGo`,
    description: `Chi tiết hóa đơn điện tử thanh toán mã #${sessionId} tại hệ thống F&B HiAI-MenuGo.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { sessionId } = await params;
  return <ReceiptClient sessionId={sessionId} />;
}
