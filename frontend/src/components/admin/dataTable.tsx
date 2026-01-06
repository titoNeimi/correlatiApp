/* eslint-disable @typescript-eslint/no-explicit-any */
import { EmptyState } from './baseComponents';

interface Column {
  key: string;
  label: string;
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
}

export default function DataTable({ columns, data }: DataTableProps) {
  return (
    <div className="overflow-x-auto overflow-y-visible relative">
      <table className="w-full min-w-[640px]">
        <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState 
                  title="No hay datos disponibles" 
                  description="No se encontraron registros para mostrar"
                />
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr 
                key={idx}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// components/admin/SegmentedTabs.tsx
interface Tab {
  id: string;
  label: string;
}

interface SegmentedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function SegmentedTabs({ tabs, activeTab, onChange }: SegmentedTabsProps) {
  return (
    <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${activeTab === tab.id
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
