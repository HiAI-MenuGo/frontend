import OrderHistoryView from '@/components/history/OrderHistoryView';

export const metadata = {
  title: 'Lịch sử đơn hàng | MenuGO',
  description: 'Tra cứu lịch sử đơn hàng, hoá đơn thanh toán và in lại bill',
};

export default function HistoryPage() {
  return <OrderHistoryView />;
}
