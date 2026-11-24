import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
  ArrowUpDown,
  Edit2,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Trash2,
  Download,
  RefreshCw,
  ExternalLink,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDate, formatINR, maskPhone } from '../../lib/utils';
import { Batch, Student } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Drawer } from '../common/Drawer';
import { Skeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';

export const StudentsView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Selected student for Side Drawer
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Add / Edit Modal state
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

  // Delete Confirmation Dialog state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const isTrainer = role === 'trainer';
  const isAccounts = role === 'accounts';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stdData, batchData] = await Promise.all([
        api.getStudents(),
        api.getBatches(),
      ]);
      setStudents(stdData || []);
      setBatches(batchData || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load students';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter students
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
            className="flex items-center gap-1 font-medium text-text-muted hover:text-text cursor-pointer"
          >
            <span>Student Name</span>
            <ArrowUpDown className="w-3 h-3 text-text-subtle" />
          </button>
        ),
        cell: info => (
          <div
            onClick={() => setSelectedStudent(info.row.original)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-[4px] bg-accent-subtle text-accent font-medium flex items-center justify-center text-xs shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
              {info.getValue().charAt(0)}
            </div>
            <div>
              <div className="font-medium text-text group-hover:text-accent transition-colors">
                {info.getValue()}
              </div>
              <div className="text-[10px] text-text-subtle font-mono">{info.row.original.id}</div>
            </div>
          </div>
        ),
      }),

      columnHelper.accessor('batch_name', {
        header: 'Batch & Track',
        cell: info => (
          <div>
            <div className="text-xs font-medium text-text">{info.getValue()}</div>
            <div className="text-[11px] text-text-muted">{info.row.original.course_name}</div>
          </div>
        ),
      }),

      columnHelper.accessor('phone_masked', {
        header: 'Contact',
        cell: info => (
          <div className="space-y-0.5">
            <div className="font-mono text-xs text-text-muted flex items-center gap-1">
              <Phone className="w-3 h-3 text-text-subtle" />
              {maskPhone(info.getValue())}
            </div>
            <div className="text-[11px] text-text-subtle flex items-center gap-1 truncate max-w-[130px]">
              <Mail className="w-3 h-3 text-text-subtle shrink-0" />
              {info.row.original.email}
            </div>
          </div>
        ),
      }),

      columnHelper.accessor('attendance_rate', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-medium text-text-muted hover:text-text cursor-pointer"
          >
            <span>Attendance</span>
            <ArrowUpDown className="w-3 h-3 text-text-subtle" />
          </button>
        ),
        cell: info => {
          const val = info.getValue();
          const variant: BadgeVariant =
            val >= 85 ? 'success' : val >= 75 ? 'warning' : 'danger';
          return (
            <div className="flex items-center gap-2">
              <div className="w-12 bg-surface-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${
                    val >= 85 ? 'bg-status-green' : val >= 75 ? 'bg-status-amber' : 'bg-status-red'
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
              className={`font-mono text-xs ${
                val >= 3 ? 'text-status-red font-medium' : 'text-text-muted'
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
            graduated: 'neutral',
          };
          return (
            <Badge variant={variants[val] || 'neutral'} size="sm" dot>
              {val.replace('_', ' ').toUpperCase()}
            </Badge>
          );
        },
      }),
    ];

    // Fees column (restricted from trainer)
    if (!isTrainer) {
      cols.push(
        columnHelper.accessor('fee_pending', {
          header: ({ column }) => (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1 font-medium text-text-muted hover:text-text cursor-pointer"
            >
              <span>Fee Due</span>
              <ArrowUpDown className="w-3 h-3 text-text-subtle" />
            </button>
          ),
          cell: info => {
            const val = info.getValue();
            return (
              <span
                className={`font-medium text-xs tabular-nums ${
                  val > 0 ? 'text-status-amber' : 'text-text-subtle'
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
    cols.push(
      columnHelper.display({
        id: 'actions',
        header: 'Action',
        cell: info => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedStudent(info.row.original)}
              className="p-1.5 rounded-[4px] text-text-muted hover:text-text hover:bg-surface-subtle transition-colors cursor-pointer"
              title="View details"
              aria-label="View details"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
            {!isAccounts && !isTrainer && (
              <>
                <button
                  onClick={() => handleOpenEdit(info.row.original)}
                  className="p-1.5 rounded-[4px] text-text-muted hover:text-accent hover:bg-surface-subtle transition-colors cursor-pointer"
                  title="Edit student"
                  aria-label="Edit student"
                >
                  <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setStudentToDelete(info.row.original)}
                  className="p-1.5 rounded-[4px] text-text-subtle hover:text-status-red hover:bg-status-red-bg transition-colors cursor-pointer"
                  title="Delete student"
                  aria-label="Delete student"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>
        ),
      }) as any
    );

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
        pageSize: 25,
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      showToast(msg, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteStudent(studentToDelete.id);
      showToast(`Student ${studentToDelete.name} deleted`, 'success');
      setStudentToDelete(null);
      if (selectedStudent?.id === studentToDelete.id) {
        setSelectedStudent(null);
      }
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete student';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
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
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredData.length} student records`, 'success');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        description="Active student directory, attendance records, and payment status."
        badge={<Badge variant="neutral" dot>{filteredData.length} Enrolled</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              icon={<Download className="w-3.5 h-3.5" strokeWidth={1.5} />}
            >
              Export CSV
            </Button>
            {!isAccounts && !isTrainer && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAdd}
                icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
              >
                Enroll student
              </Button>
            )}
          </div>
        }
      />

      {/* Error State with Retry Button */}
      {error && (
        <div className="p-4 rounded-[6px] border border-status-red/30 bg-status-red-bg text-status-red flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>{error}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className="w-3 h-3" strokeWidth={1.5} />}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-surface p-3 sm:p-3.5 rounded-[8px] border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search student, batch, email..."
            className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:border-accent"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-initial px-2.5 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:border-accent font-medium cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On leave</option>
            <option value="dropped">Dropped</option>
          </select>

          <select
            value={batchFilter}
            onChange={e => setBatchFilter(e.target.value)}
            className="flex-1 md:flex-initial px-2.5 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:border-accent font-medium max-w-[200px] truncate cursor-pointer"
          >
            <option value="all">All batches ({batches.length})</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface rounded-[8px] border border-border overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton variant="text" className="h-10" />
            <Skeleton variant="text" className="h-10" />
            <Skeleton variant="text" className="h-10" />
            <Skeleton variant="text" className="h-10" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No students found"
              description="No enrolled students match your selected search or filter criteria."
              action={
                !isAccounts && !isTrainer ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenAdd}
                    icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
                  >
                    Enroll student
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            {/* 1. MOBILE VIEW (< 640px): Stacked Cards with tap to open details */}
            <div className="sm:hidden divide-y divide-border">
              {table.getRowModel().rows.map(row => {
                const s = row.original;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className="p-3.5 space-y-2 text-xs cursor-pointer hover:bg-surface-subtle/50 active:bg-surface-subtle transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-text text-sm">{s.name}</div>
                        <div className="text-[11px] text-text-muted mt-0.5">{s.batch_name}</div>
                      </div>
                      <Badge
                        variant={
                          s.status === 'active'
                            ? 'success'
                            : s.status === 'on_leave'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        dot
                      >
                        {s.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                      <div>
                        <span className="text-[10px] text-text-subtle uppercase">Attendance: </span>
                        <span
                          className={`font-semibold tabular-nums ${
                            s.attendance_rate >= 85
                              ? 'text-status-green'
                              : s.attendance_rate >= 75
                              ? 'text-status-amber'
                              : 'text-status-red'
                          }`}
                        >
                          {s.attendance_rate}%
                        </span>
                      </div>
                      {!isTrainer && (
                        <div>
                          <span className="text-[10px] text-text-subtle uppercase">Due: </span>
                          <span className="font-semibold text-text tabular-nums">
                            {s.fee_pending > 0 ? formatINR(s.fee_pending) : 'Cleared'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. TABLET & DESKTOP (>= 640px): Horizontal scroll with sticky first column */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs tabular-nums">
                <thead className="bg-surface-subtle/80 border-b border-border text-text-muted uppercase tracking-wider text-[11px]">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header, idx) => (
                        <th
                          key={header.id}
                          className={`py-2.5 px-3.5 font-medium ${
                            idx === 0
                              ? 'sticky left-0 bg-surface-subtle z-10 border-r border-border'
                              : ''
                          }`}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-border">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-surface-subtle/50 transition-colors text-text">
                      {row.getVisibleCells().map((cell, idx) => (
                        <td
                          key={cell.id}
                          className={`py-2.5 px-3.5 ${
                            idx === 0
                              ? 'sticky left-0 bg-surface z-10 border-r border-border'
                              : ''
                          }`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination bar (25 rows per page) */}
        {!loading && filteredData.length > 0 && (
          <div className="p-3 border-t border-border bg-surface-subtle/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
            <div>
              Showing{' '}
              <span className="font-semibold text-text tabular-nums">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-text tabular-nums">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  filteredData.length
                )}
              </span>{' '}
              of <span className="font-semibold text-text tabular-nums">{filteredData.length}</span> students
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-2.5 py-1 rounded-[4px] border border-border bg-surface text-text disabled:opacity-40 hover:bg-surface-subtle font-medium cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-mono text-[11px] text-text-subtle">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-2.5 py-1 rounded-[4px] border border-border bg-surface text-text disabled:opacity-40 hover:bg-surface-subtle font-medium cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Drawer with Full Student Details */}
      <Drawer
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.name}
        description={selectedStudent?.batch_name}
        footer={
          selectedStudent && !isAccounts && !isTrainer ? (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setStudentToDelete(selectedStudent)}
                icon={<Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
              >
                Delete student
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const s = selectedStudent;
                  setSelectedStudent(null);
                  handleOpenEdit(s);
                }}
                icon={<Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
              >
                Edit student
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs">
            {/* Status & ID */}
            <div className="p-3 bg-surface-subtle rounded-[6px] border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-subtle uppercase">Student ID</span>
                <div className="font-mono font-medium text-text">{selectedStudent.id}</div>
              </div>
              <Badge
                variant={
                  selectedStudent.status === 'active'
                    ? 'success'
                    : selectedStudent.status === 'on_leave'
                    ? 'warning'
                    : 'danger'
                }
                size="sm"
                dot
              >
                {selectedStudent.status.toUpperCase()}
              </Badge>
            </div>

            {/* Contact Details */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-text uppercase tracking-wider">
                Contact information
              </h4>
              <div className="p-3 bg-surface-subtle rounded-[6px] border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-text-subtle" />
                    Phone (Masked)
                  </span>
                  <span className="font-mono text-text">{maskPhone(selectedStudent.phone_masked)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-text-subtle" />
                    Email
                  </span>
                  <span className="text-text">{selectedStudent.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-text-subtle" />
                    Enrolled on
                  </span>
                  <span className="text-text tabular-nums">{formatDate(selectedStudent.enrollment_date)}</span>
                </div>
              </div>
            </div>

            {/* Attendance Metrics */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-text uppercase tracking-wider">
                Attendance summary
              </h4>
              <div className="p-3 bg-surface-subtle rounded-[6px] border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">30-day attendance rate</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      selectedStudent.attendance_rate >= 85
                        ? 'text-status-green'
                        : selectedStudent.attendance_rate >= 75
                        ? 'text-status-amber'
                        : 'text-status-red'
                    }`}
                  >
                    {selectedStudent.attendance_rate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Missed classes (last 30d)</span>
                  <span className="font-mono text-text">{selectedStudent.missed_classes_last_30d} classes</span>
                </div>
              </div>
            </div>

            {/* Financial Details (Restricted from Trainer) */}
            {!isTrainer && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-text uppercase tracking-wider">
                  Fee installment summary
                </h4>
                <div className="p-3 bg-surface-subtle rounded-[6px] border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Total course fee</span>
                    <span className="font-medium text-text tabular-nums">
                      {formatINR(selectedStudent.total_fee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Realized payments</span>
                    <span className="font-medium text-status-green tabular-nums">
                      {formatINR(selectedStudent.fee_paid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="font-medium text-text">Pending balance</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        selectedStudent.fee_pending > 0 ? 'text-status-amber' : 'text-status-green'
                      }`}
                    >
                      {selectedStudent.fee_pending > 0
                        ? formatINR(selectedStudent.fee_pending)
                        : 'Fully settled'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Confirmation Dialog for Delete */}
      <Modal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        title="Delete student"
        description="Are you sure you want to permanently delete this student record? This cannot be undone."
      >
        <div className="space-y-4 pt-1">
          <div className="p-3 bg-status-red-bg border border-status-red/30 rounded-[6px] text-xs text-status-red">
            Deleting <span className="font-semibold">{studentToDelete?.name}</span> ({studentToDelete?.id}) will remove all associated enrollment and attendance records.
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStudentToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete student
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? `Edit student: ${editingStudent.name}` : 'Enroll new student'}
        description="Fill in candidate details. Phone numbers are automatically masked for privacy."
      >
        <form onSubmit={handleSaveStudent} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-text mb-1">Full name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              placeholder="e.g. Priyanshu Dave"
            />
          </div>

          <div>
            <label className="block font-medium text-text mb-1">Email address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              placeholder="e.g. priyanshu@example.in"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-text mb-1">Cohort batch</label>
              <select
                value={formData.batch_id}
                onChange={e => setFormData({ ...formData, batch_id: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-text mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as Student['status'] })}
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              >
                <option value="active">Active</option>
                <option value="on_leave">On leave</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>
          </div>

          {!isTrainer && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-text mb-1">Total course fee (Rs)</label>
                <input
                  type="number"
                  value={formData.total_fee}
                  onChange={e => setFormData({ ...formData, total_fee: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
                />
              </div>

              <div>
                <label className="block font-medium text-text mb-1">Fee paid to date (Rs)</label>
                <input
                  type="number"
                  value={formData.fee_paid}
                  onChange={e => setFormData({ ...formData, fee_paid: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
            >
              {editingStudent ? 'Save changes' : 'Enroll student'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
