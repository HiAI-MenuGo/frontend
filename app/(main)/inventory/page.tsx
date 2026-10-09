import InventoryView from '@/components/inventory/InventoryView';

export const metadata = {
  title: 'Quản lý nguyên liệu | MenuGO',
  description: 'Quản lý tồn kho nguyên vật liệu và cảnh báo định mức',
};

export default function InventoryPage() {
  return <InventoryView />;
}
