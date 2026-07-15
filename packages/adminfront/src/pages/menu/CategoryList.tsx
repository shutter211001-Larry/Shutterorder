import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useGetCategoriesQuery } from '../../store/apiSlice.js';
import { confirm } from '../../lib/confirm';
import { toast } from "react-hot-toast";
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader.js';
import { PageContent } from '../../components/layout/PageContent.js';
import { TableContainer, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/Table.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  children: { id: string; name: string }[];
  _count: { menuItems: number };
  trackSharedStock?: boolean;
  sharedStockQty?: number;
  sharedStockThreshold?: number;
}

export default function CategoryList() {
  const { t } = useTranslation();

  const { data: response, isLoading: loading, error, refetch } = useGetCategoriesQuery();
  const categories = response || [];

  const topLevel = categories.filter((c: Category) => !c.parentId);

  const handleDelete = async (id: string, name: string) => {
    if (!await confirm(`確定要刪除分類 "${name}" 嗎？`)) return;
    try {
      await api.delete(`/menu/categories/${id}`);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <PageHeader 
        title={t('categoryList.categoryManagement')}
        action={
          <Link to="/menu/categories/new">
            <Button icon={<Plus size={16} />}>
              {t('categoryList.addCategory')}
            </Button>
          </Link>
        }
      />

      {loading && <p className="text-gray-500">{t('categoryList.loadingCategories')}</p>}
      {error && <p className="text-red-600">{t('categoryList.error')} {(error as any)?.message || JSON.stringify(error)}</p>}

      {!loading && !error && topLevel.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">{t('categoryList.noCategories')}</p>
          <Link to="/menu/categories/new" className="text-primary-600 hover:text-primary-700 font-medium">
            {t('categoryList.createFirstCategory')}
          </Link>
        </div>
      )}

      {!loading && topLevel.length > 0 && (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('categoryList.name')}</TableHead>
                <TableHead>{t('categoryList.productCount')}</TableHead>
                <TableHead>{t('categoryList.sharedStock')}</TableHead>
                <TableHead>{t('categoryList.subcategories')}</TableHead>
                <TableHead>{t('categoryList.status')}</TableHead>
                <TableHead>{t('categoryList.sortOrder')}</TableHead>
                <TableHead className="text-right">{t('categoryList.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topLevel.map((cat: any) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900">{cat.name}</div>
                    <div className="text-xs text-gray-400">{cat.slug}</div>
                  </TableCell>
                  <TableCell>
                    {cat._count.menuItems}
                  </TableCell>
                  <TableCell>
                    {cat.trackSharedStock ? (
                      (cat.sharedStockQty || 0) === 0 ? (
                        <Badge variant="danger" className="gap-1 font-extrabold shadow-sm">
                          {t('categoryList.soldOut')}
                        </Badge>
                      ) : (cat.sharedStockQty || 0) <= (cat.sharedStockThreshold || 5) ? (
                        <Badge variant="warning" pulse className="gap-1 font-bold shadow-sm">
                          {t('categoryList.restockWarning')}{cat.sharedStockQty})
                        </Badge>
                      ) : (
                        <Badge variant="info" className="gap-1 font-bold shadow-sm">
                          {t('categoryList.stockRemaining')} {cat.sharedStockQty}
                        </Badge>
                      )
                    ) : (
                      <span className="text-gray-400 font-normal text-xs">{t('categoryList.independentStock')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {cat.children.length > 0
                      ? cat.children.map((c: any) => c.name).join(', ')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cat.isActive ? 'success' : 'danger'}>
                      {cat.isActive ? t('categoryList.active') : t('categoryList.disabled')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cat.sortOrder}
                  </TableCell>
                  <TableCell className="text-right space-x-3">
                    <Link to={`/menu/categories/${cat.id}`} className="text-primary-600 hover:text-primary-900 font-medium inline-flex items-center gap-1" aria-label={`編輯分類 ${cat.name}`}>
                      <Edit2 size={16} />
                      {t('categoryList.edit')}
                    </Link>
                    <button onClick={() => handleDelete(cat.id, cat.name)} className="text-red-600 hover:text-red-900 font-medium inline-flex items-center gap-1" aria-label={`刪除分類 ${cat.name}`}>
                      <Trash2 size={16} />
                      {t('categoryList.delete')}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Special "All" (全部) row sorted at the bottom */}
              <TableRow className="bg-gray-50/50 hover:bg-gray-50">
                <TableCell>
                  <div className="text-sm font-semibold text-gray-900">{t('categoryList.allCategories')}</div>
                  <div className="text-xs text-gray-400">all</div>
                </TableCell>
                <TableCell>
                  {categories.reduce((sum: number, c: any) => sum + (c._count?.menuItems || 0), 0)}
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <Badge variant="success">{t('categoryList.enabled')}</Badge>
                </TableCell>
                <TableCell className="text-gray-400 italic">
                  {t('categoryList.pinToBottom')}
                </TableCell>
                <TableCell className="text-right text-gray-400 italic">
                  {t('categoryList.systemDefault')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
