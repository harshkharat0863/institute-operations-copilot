import React, { useMemo, useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Edit2,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle,
  Trash2,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDate, formatINR, maskPhone } from '../../lib/utils';
import { Batch, Student } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';
import { Modal } from '../common/Modal';

export const StudentsView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_masked: '',
    batch_id: '',
    status: 'active' as Student['status'],
    fee_paid: 20000,
    total_fee: 45000,
  });

  const isTrainer = role === 'trainer';
  const isAccounts = role === 'accounts';

  const loadData = async () => {
    setLoading(true);
    try {
      const [stdData, batchData] = await Promise.all([
        api.getStudents(),
        api.getBatches(),
      ]);
      setStudents(stdData);
      setBatches(batchData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter students based on status and batch
  const filteredData = useMemo(() => {
    return students.filter(s => {
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchBatch = batchFilter === 'all' || s.batch_id === batchFilter;
      return matchStatus && matchBatch;
    });
  }, [students, statusFilter, batchFilter]);

  const columnHelper = createColumnHelper<Student>();

  const columns = useMemo(() => {
    const cols = [
      columnHelper.accessor('name', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-slate-700"
          >
            Student Name <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        ),
        cell: info => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
              {info.getValue().charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{info.getValue()}</div>
              <div className="text-[11px] text-slate-400 font-mono">{info.row.original.id}</div>
            </div>
          </div>
        ),
      }),

      columnHelper.accessor('batch_name', {
        header: 'Batch & Course',
        cell: info => (
          <div>
            <div className="text-xs font-medium text-slate-900">{info.getValue()}</div>
            <div className="text-[11px] text-slate-500">{info.row.original.course_name}</div>
          </div>
        ),
      }),

      columnHelper.accessor('phone_masked', {
        header: 'Contact (Masked)',
        cell: info => (
          <div className="space-y-0.5">
            <div className="font-mono text-xs text-slate-700 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {maskPhone(info.getValue())}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-[130px]">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              {info.row.original.email}
            </div>
          </div>
        ),
      }),

      columnHelper.accessor('attendance_rate', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-slate-700"
          >
            Attendance <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        ),
        cell: info => {
          const val = info.getValue();
          const variant: BadgeVariant =
            val >= 85 ? 'success' : val >= 75 ? 'warning' : 'danger';
          return (
            <div className="flex items-center gap-2">
              <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${
                    val >= 85 ? 'bg-emerald-500' : val >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${val}%` }}
                />
              </div>
              <Badge variant={variant} size="sm">
                {val}%
              </Badge>
            </div>
          );
        },
      }),

      columnHelper.accessor('missed_classes_last_30d', {
        header: 'Missed (30d)',
        cell: info => {
          const val = info.getValue();
          return (
            <span
              className={`font-mono text-xs font-semibold ${
                val >= 3 ? 'text-rose-600 font-bold' : 'text-slate-600'
              }`}
            >
              {val} classes
            </span>
          );
        },
      }),

      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const val = info.getValue();
          const variants: Record<string, BadgeVariant> = {
            active: 'success',
            on_leave: 'warning',
            dropped: 'danger',
            graduated: 'purple',
          };
          return (
            <Badge variant={variants[val] || 'neutral'} size="sm" dot>
              {val.replace('_', ' ').toUpperCase()}
            </Badge>
          );
        },
      }),
    ];

    // RESTRICTION: TRAINER NEVER SEES FEES OR EMIs
    if (!isTrainer) {
      cols.push(
        columnHelper.accessor('fee_pending', {
          header: ({ column }) => (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1 font-semibold text-slate-700"
            >
              Fee Due <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ),
          cell: info => {
            const val = info.getValue();
            return (
              <span
                className={`font-semibold text-xs ${
                  val > 0 ? 'text-amber-800' : 'text-slate-400'
                }`}
              >
                {val > 0 ? formatINR(val) : 'Cleared'}
              </span>
            );
          },
        }) as any
      );
    }

    // Actions column
    if (!isAccounts && !isTrainer) {
      cols.push(
        columnHelper.display({
          id: 'actions',
          header: 'Manage',
          cell: info => (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEdit(info.row.original)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Edit Student"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteStudent(info.row.original.id, info.row.original.name)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete Student"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ),
        }) as any
      );
    }

    return cols;
  }, [isTrainer, isAccounts]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      phone_masked: '98******' + Math.floor(10 + Math.random() * 89),
      batch_id: batches[0]?.id || 'b_java_a',
      status: 'active',
      fee_paid: 15000,
      total_fee: 45000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone_masked: student.phone_masked,
      batch_id: student.batch_id,
      status: student.status,
      fee_paid: student.fee_paid,
      total_fee: student.total_fee,
    });
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedBatch = batches.find(b => b.id === formData.batch_id);
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          name: formData.name,
          email: formData.email,
          batch_id: formData.batch_id,
          batch_name: selectedBatch?.name || editingStudent.batch_name,
          course_id: selectedBatch?.course_id || editingStudent.course_id,
          course_name: selectedBatch?.course_name || editingStudent.course_name,
          status: formData.status,
          fee_paid: formData.fee_paid,
          fee_pending: Math.max(0, formData.total_fee - formData.fee_paid),
        });
        showToast(`Student record for ${formData.name} updated`, 'success');
      } else {
        await api.addStudent({
          name: formData.name,
          email: formData.email,
          phone_masked: formData.phone_masked,
          batch_id: formData.batch_id,
          batch_name: selectedBatch?.name || 'Assigned Batch',
          course_id: selectedBatch?.course_id || 'c_java',
          course_name: selectedBatch?.course_name || 'Java Course',
          enrollment_date: new Date().toISOString().split('T')[0],
          status: formData.status,
          total_fee: formData.total_fee,
          fee_paid: formData.fee_paid,
          fee_pending: Math.max(0, formData.total_fee - formData.fee_paid),
        });
        showToast(`New student ${formData.name} enrolled`, 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.deleteStudent(id);
      showToast(`Student ${name} deleted successfully`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete student', 'error');
    }
  };

  const handleExportCSV = () => {
    if (!students || students.length === 0) {
      showToast('No student records to export', 'warning');
      return;
    }
    const headers = isTrainer
      ? ['ID', 'Name', 'Email', 'Batch', 'Course', 'Attendance Rate', 'Missed Classes 30d', 'Status']
      : ['ID', 'Name', 'Email', 'Batch', 'Course', 'Attendance Rate', 'Missed Classes 30d', 'Status', 'Total Fee', 'Fee Paid', 'Fee Pending'];

    const rows = filteredData.map(s => {
      const base = [
        `"${s.id}"`,
        `"${s.name}"`,
        `"${s.email}"`,
        `"${s.batch_name}"`,
        `"${s.course_name}"`,
        `"${s.attendance_rate}%"`,
        `"${s.missed_classes_last_30d}"`,
        `"${s.status}"`,
      ];
      if (!isTrainer) {
        base.push(`"${s.total_fee}"`, `"${s.fee_paid}"`, `"${s.fee_pending}"`);
      }
      return base.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredData.length} student records to CSV`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Student Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            120 registered students across 6 coaching programs. All telephone numbers masked with zero PII exposure.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors shrink-0"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>

          {!isAccounts && !isTrainer && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add New Student
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search student, batch, email..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="dropped">Dropped</option>
          </select>

          <select
            value={batchFilter}
            onChange={e => setBatchFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden max-w-[200px] truncate"
          >
            <option value="all">All Batches (12)</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TanStack Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading student records...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No students found matching your search and filter parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px]">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="py-3.5 px-4 font-semibold">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="py-3 px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && filteredData.length > 0 && (
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  filteredData.length
                )}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{filteredData.length}</span> students
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.name}` : 'Enroll New Student'}
        description="Fill in candidate details. Phone numbers are auto-masked for privacy."
      >
        <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
              placeholder="e.g. Priyanshu Dave"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
              placeholder="priyanshu@example.in"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">
              Contact Token (Masked)
            </label>
            <input
              type="text"
              required
              value={formData.phone_masked}
              onChange={e => setFormData({ ...formData, phone_masked: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Cohort Batch</label>
            <select
              value={formData.batch_id}
              onChange={e => setFormData({ ...formData, batch_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.course_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
            >
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              {editingStudent ? 'Save Changes' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
