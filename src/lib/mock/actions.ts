import { ActionItem } from '../../types';

export const INITIAL_ACTIONS: ActionItem[] = [
  {
    id: 'act_101',
    type: 'whatsapp_reminder',
    student_name: 'Aarav Sharma',
    phone_masked: '98******21',
    message:
      'Hi Aarav, we noticed you missed 4 Java sessions recently. Also, your EMI installment of ₹6,500 is due on 18 Oct. Please connect with your mentor and clear the dues to continue lab access.',
    due_date: '2026-10-18',
    status: 'pending',
    requested_by: 'Anjali Sharma (Counselor)',
    requested_at: '2026-10-16T08:30:00Z',
  },
  {
    id: 'act_102',
    type: 'whatsapp_reminder',
    student_name: 'Rohan Gupta',
    phone_masked: '91******44',
    message:
      'Hi Rohan, you have missed 3 Java Fullstack classes this month. Your EMI installment of ₹7,000 is due on 19 Oct. Please let us know if you require attendance makeup support.',
    due_date: '2026-10-19',
    status: 'pending',
    requested_by: 'Anjali Sharma (Counselor)',
    requested_at: '2026-10-16T08:31:00Z',
  },
  {
    id: 'act_103',
    type: 'whatsapp_reminder',
    student_name: 'Sneha Patil',
    phone_masked: '97******83',
    message:
      'Urgent: Hi Sneha, your attendance in Java Batch B has dropped below 65% with 5 missed classes. Your EMI of ₹6,500 is due today (16 Oct). Please visit counselor desk.',
    due_date: '2026-10-16',
    status: 'pending',
    requested_by: 'Copilot AI (Generated Query)',
    requested_at: '2026-10-16T09:15:00Z',
  },
  {
    id: 'act_104',
    type: 'whatsapp_reminder',
    student_name: 'Vikram Malhotra',
    phone_masked: '99******19',
    message:
      'Hi Vikram, your Java batch attendance requires attention (3 missed classes). Upcoming EMI of ₹8,000 is due on 20 Oct. Please complete payment or contact accounts.',
    due_date: '2026-10-20',
    status: 'pending',
    requested_by: 'Copilot AI (Generated Query)',
    requested_at: '2026-10-16T09:16:00Z',
  },
  {
    id: 'act_105',
    type: 'fee_notice',
    student_name: 'Manish Choudhury',
    phone_masked: '98******33',
    message:
      'Important Notice: Your overdue fee installment of ₹27,500 for Data Science & GenAI is 18 days past due. Please settle immediately or contact Accounts to avoid LMS suspension.',
    due_date: '2026-09-28',
    status: 'pending',
    requested_by: 'Suresh Iyer (Accounts)',
    requested_at: '2026-10-15T14:20:00Z',
  },
];

let actionsStore: ActionItem[] = JSON.parse(JSON.stringify(INITIAL_ACTIONS));

export function getActions(statusFilter?: string): ActionItem[] {
  if (statusFilter && statusFilter !== 'all') {
    return actionsStore.filter(a => a.status === statusFilter);
  }
  return actionsStore;
}

export function approveAction(id: string, approverName: string): ActionItem | null {
  const item = actionsStore.find(a => a.id === id);
  if (!item) return null;
  item.status = 'sent';
  item.approved_by = approverName;
  item.approved_at = new Date().toISOString();
  item.outbox_reference = `MSG-WA-${Math.floor(100000 + Math.random() * 900000)}`;
  return item;
}

export function rejectAction(id: string, rejectorName: string): ActionItem | null {
  const item = actionsStore.find(a => a.id === id);
  if (!item) return null;
  item.status = 'rejected';
  item.approved_by = rejectorName;
  item.approved_at = new Date().toISOString();
  return item;
}

export function updateActionMessage(id: string, newMessage: string): ActionItem | null {
  const item = actionsStore.find(a => a.id === id);
  if (!item) return null;
  item.message = newMessage;
  return item;
}

export function bulkApproveActions(ids: string[], approverName: string): ActionItem[] {
  const updated: ActionItem[] = [];
  ids.forEach(id => {
    const res = approveAction(id, approverName);
    if (res) updated.push(res);
  });
  return updated;
}

export function addDraftActions(drafts: Array<{
  student_name: string;
  phone_masked: string;
  message: string;
  due_date: string;
}>, requesterName: string): ActionItem[] {
  const added: ActionItem[] = drafts.map((d, i) => ({
    id: `act_copilot_${Date.now()}_${i}`,
    type: 'whatsapp_reminder',
    student_name: d.student_name,
    phone_masked: d.phone_masked,
    message: d.message,
    due_date: d.due_date,
    status: 'pending',
    requested_by: `${requesterName} (via Copilot)`,
    requested_at: new Date().toISOString(),
  }));

  actionsStore = [...added, ...actionsStore];
  return added;
}
