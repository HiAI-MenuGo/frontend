import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ tableId: string }>;
}

export default async function TableMenuPage({ params }: PageProps) {
  const { tableId } = await params;
  redirect(`/default-tenant/default-branch/table/${tableId}`);
}
