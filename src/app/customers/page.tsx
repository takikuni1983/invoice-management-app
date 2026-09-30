import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Plus, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import DeleteButton from '@/components/ui/DeleteButton';
import SortHeader from '@/components/ui/SortHeader';
import { parseSort } from '@/lib/sort';

const SORT_KEYS = ['companyName', 'contactName', 'email', 'phone', 'estimates', 'invoices', 'createdAt'] as const;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string; dir?: string }>;
}) {
  const { search = '', ...q } = await searchParams;
  const sort = parseSort(q.sort, q.dir, SORT_KEYS);
  const orderBy = {
    companyName: { companyName: sort.dir },
    contactName: { contactName: sort.dir },
    email: { email: sort.dir },
    phone: { phone: sort.dir },
    estimates: { estimates: { _count: sort.dir } },
    invoices: { invoices: { _count: sort.dir } },
    createdAt: { createdAt: sort.dir },
  }[sort.key ?? ''] ?? { createdAt: 'desc' as const };
  const header = (label: string, key: string, opts: { align?: 'left' | 'center'; firstDir?: 'asc' | 'desc' } = {}) => (
    <SortHeader label={label} sortKey={key} sort={sort} basePath="/customers" params={{ search }} {...opts} />
  );

  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { companyName: { contains: search } },
            { contactName: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : undefined,
    orderBy: [orderBy, { id: 'desc' }],
    include: { _count: { select: { estimates: true, invoices: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <form>
            {sort.key && <input type="hidden" name="sort" value={sort.key} />}
            {sort.key && <input type="hidden" name="dir" value={sort.dir} />}
            <input
              name="search"
              defaultValue={search}
              placeholder="会社名・担当者名で検索"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新規顧客登録
        </Link>
      </div>

      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {header('会社名', 'companyName')}
              {header('担当者名', 'contactName')}
              {header('メール', 'email')}
              {header('電話', 'phone')}
              {header('見積', 'estimates', { align: 'center', firstDir: 'desc' })}
              {header('請求', 'invoices', { align: 'center', firstDir: 'desc' })}
              {header('登録日', 'createdAt', { firstDir: 'desc' })}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  顧客が登録されていません
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline">
                      {c.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.contactName}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email ?? '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{c.phone ?? '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-gray-600">{c._count.estimates}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-gray-600">{c._count.invoices}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">{formatDate(c.createdAt.toISOString())}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/customers/${c.id}/edit`}
                        className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                      >
                        編集
                      </Link>
                      <DeleteButton id={c.id} type="customers" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* スマホ: カード表示 */}
      <div className="md:hidden space-y-2">
        {customers.length === 0 ? (
          <p className="bg-white rounded-lg border border-gray-200 text-center py-10 text-sm text-gray-400">顧客が登録されていません</p>
        ) : (
          customers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 active:bg-gray-50"
            >
              <p className="font-medium text-gray-900">{c.companyName}</p>
              <p className="text-sm text-gray-600">{c.contactName}</p>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{c.phone ?? c.email ?? ''}</span>
                <span>見積 {c._count.estimates} / 請求 {c._count.invoices}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
