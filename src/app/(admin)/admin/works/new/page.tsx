import { requireRole } from '@/lib/auth-guard';
import { WorkForm } from '@/components/admin/works/WorkForm';
import { listWorkTagOptions } from '@/lib/services/work';

export const dynamic = 'force-dynamic';

export default async function NewWorkPage() {
  await requireRole();
  const tagOptions = await listWorkTagOptions();
  return <WorkForm mode="new" tagOptions={tagOptions} />;
}
