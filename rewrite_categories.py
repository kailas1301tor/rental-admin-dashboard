import re

path = r"c:\projects\rental frontend\rental-admin-dashboard\src\pages\super-admin\CategoriesPage.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add usePaginatedApiSWR import
content = content.replace(
    "import { useApiSWR } from '@/api/swr-helpers';",
    "import { useApiSWR, usePaginatedApiSWR } from '@/api/swr-helpers';"
)

# Replace hook logic
hook_logic = """
  const { toast } = useToast();
  
  const [catPage, setCatPage] = useState(1);
  const [subPage, setSubPage] = useState(1);

  const { data: allCategories, mutate: mutateAll } = useApiSWR<Category[]>(`${ENDPOINTS.categories}?fetch_all=true`);
  const { data: products } = useApiSWR<Product[]>(ENDPOINTS.products);
  const { filters, setFilters, reset } = useListFilters();
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<LevelFilter>('subcategory');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');

  const catQuery = new URLSearchParams({ page: catPage.toString() });
  const subQuery = new URLSearchParams({ page: subPage.toString() });
  if (query) { catQuery.set('search', query); subQuery.set('search', query); }
  if (statusFilter !== 'all') { catQuery.set('status', statusFilter); subQuery.set('status', statusFilter); }

  const { data: catResponse, error: catError, isLoading: catLoading, mutate: mutateCat } = usePaginatedApiSWR<{ data: Category[]; total_count: number; total_pages: number }>(`${ENDPOINTS.categories}?${catQuery.toString()}`);
  const { data: subResponse, error: subError, isLoading: subLoading, mutate: mutateSub } = usePaginatedApiSWR<{ data: Category[]; total_count: number; total_pages: number }>(`${ENDPOINTS.subcategories}?${subQuery.toString()}`);

  const rows = allCategories ?? [];
"""

old_hook_logic_regex = r"  const { toast } = useToast\(\);.*?(?=  const roots = useMemo)"
content = re.sub(old_hook_logic_regex, hook_logic.strip() + "\n\n", content, flags=re.DOTALL)

# Update filteredRoots and filteredSubs usages, we no longer need the client-side filters
content = re.sub(r"  const filteredRoots = useMemo.*?\]\);\n\n", "", content, flags=re.DOTALL)
content = re.sub(r"  const filteredSubs = useMemo.*?\]\);\n\n", "", content, flags=re.DOTALL)

# Replace mutate usages inside onSave, toggleFreeze, onDelete
content = content.replace("await mutate();", "await mutateCat(); await mutateSub(); await mutateAll();")
content = content.replace("mutate()", "mutateCat(); mutateSub(); mutateAll();")

# Replace filteredRoots.length === 0 with (catResponse?.data ?? []).length === 0
content = content.replace("filteredRoots.length === 0 ?", "(catResponse?.data ?? []).length === 0 ?")
content = content.replace("filteredRoots.map((root)", "(catResponse?.data ?? []).map((root)")

# Replace filteredSubs.length === 0 with (subResponse?.data ?? []).length === 0
content = content.replace("filteredSubs.length === 0 ?", "(subResponse?.data ?? []).length === 0 ?")
content = content.replace("filteredSubs.map((sub)", "(subResponse?.data ?? []).map((sub)")

# Replace if (isLoading && !data) return <ListPageSkeleton kpiCount={3} />;
content = content.replace("if (isLoading && !data)", "if ((catLoading && !catResponse) || (subLoading && !subResponse) || (!allCategories))")
content = content.replace("if (error)", "if (catError || subError)")
content = content.replace("message={error.message}", "message={(catError || subError)?.message || 'Error'}")

# Add paginations just before the Modal declarations
paginations_code = """
      {activeTab === 'categories' && catResponse && catResponse.total_pages > 1 && (
        <Pagination page={catPage} totalPages={catResponse.total_pages} onChange={setCatPage} />
      )}
      {activeTab === 'subcategories' && subResponse && subResponse.total_pages > 1 && (
        <Pagination page={subPage} totalPages={subResponse.total_pages} onChange={setSubPage} />
      )}

      <Modal
"""
content = content.replace("      <Modal\n        open={open}", paginations_code.lstrip() + "        open={open}")

# Append Pagination component at the bottom
pagination_comp = """
function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
      <p className="text-text-secondary">
        Page <span className="font-medium text-text-primary">{page}</span> of{' '}
        <span className="font-medium text-text-primary">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
"""

if "function Pagination" not in content:
    content += pagination_comp

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
