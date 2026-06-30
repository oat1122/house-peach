import { requireRole } from '@/lib/auth-guard';
import { WorkForm } from '@/components/admin/works/WorkForm';
import { listCategoryOptions } from '@/lib/services/category';
import { listWorkTagOptions } from '@/lib/services/work';

export const dynamic = 'force-dynamic';

export default async function NewWorkPage() {
  await requireRole();
  const [tagOptions, categoryOptions] = await Promise.all([
    listWorkTagOptions(),
    listCategoryOptions('work'),
  ]);
  return (
    <WorkForm
      mode="new"
      tagOptions={tagOptions}
      categoryOptions={categoryOptions}
    />
  );
}
