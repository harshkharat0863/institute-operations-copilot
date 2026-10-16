import { TimetableChange, TimetableRunResponse, TimetableSession, Weekday } from '../../types';

export const INITIAL_SESSIONS: TimetableSession[] = [
  // Monday
  {
    id: 'sess_1',
    batch: 'Java Fullstack - Batch A',
    batch_id: 'b_java_a',
    trainer: 'Priya Sundaram',
    trainer_id: 'tr_1',
    room: 'Lab 1 - Alpha',
    weekday: 'Monday',
    start: '09:00',
    end: '11:00',
    mode: 'classroom',
    color_code: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  },
  {
    id: 'sess_2',
    batch: 'Python Data Eng - Batch A',
    batch_id: 'b_py_a',
    trainer: 'Rajesh Verma',
    trainer_id: 'tr_2',
    room: 'Studio 3 - Gamma',
    weekday: 'Monday',
    start: '11:30',
    end: '13:30',
    mode: 'classroom',
    color_code: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  },
  {
    id: 'sess_3',
    batch: 'Full Stack MERN - Batch A',
    batch_id: 'b_web_a',
    trainer: 'Neha Sengupta',
    trainer_id: 'tr_4',
    room: 'Lab 1 - Alpha',
    weekday: 'Monday',
    start: '14:00',
    end: '16:00',
    mode: 'classroom',
    color_code: 'bg-amber-50 border-amber-200 text-amber-900',
  },
  {
    id: 'sess_4',
    batch: 'Data Science & GenAI - Batch A',
    batch_id: 'b_ds_a',
    trainer: 'Dr. Amit Patel',
    trainer_id: 'tr_3',
    room: 'Hall 2 - Beta',
    weekday: 'Monday',
    start: '14:00',
    end: '16:30',
    mode: 'hybrid',
    color_code: 'bg-purple-50 border-purple-200 text-purple-900',
  },

  // Tuesday
  {
    id: 'sess_5',
    batch: 'Java Fullstack - Batch B',
    batch_id: 'b_java_b',
    trainer: 'Priya Sundaram',
    trainer_id: 'tr_1',
    room: 'Hall 2 - Beta',
    weekday: 'Tuesday',
    start: '10:00',
    end: '12:00',
    mode: 'hybrid',
    color_code: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  },
  {
    id: 'sess_6',
    batch: 'DevOps & Cloud - Batch A',
    batch_id: 'b_devops_a',
    trainer: 'Vikram Joshi',
    trainer_id: 'tr_5',
    room: 'Room 5 - Tech Lab',
    weekday: 'Tuesday',
    start: '09:30',
    end: '12:00',
    mode: 'classroom',
    color_code: 'bg-cyan-50 border-cyan-200 text-cyan-900',
  },
  {
    id: 'sess_7',
    batch: 'Python Data Eng - Batch B',
    batch_id: 'b_py_b',
    trainer: 'Rajesh Verma',
    trainer_id: 'tr_2',
    room: 'Online Live Stream (Room 3)',
    weekday: 'Tuesday',
    start: '14:00',
    end: '16:30',
    mode: 'online',
    color_code: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  },
  {
    id: 'sess_8',
    batch: 'Full Stack MERN - Batch B',
    batch_id: 'b_web_b',
    trainer: 'Neha Sengupta',
    trainer_id: 'tr_4',
    room: 'Seminar Hall 4 - Delta',
    weekday: 'Tuesday',
    start: '16:30',
    end: '18:30',
    mode: 'hybrid',
    color_code: 'bg-amber-50 border-amber-200 text-amber-900',
  },

  // Wednesday
  {
    id: 'sess_9',
    batch: 'Java Fullstack - Batch A',
    batch_id: 'b_java_a',
    trainer: 'Priya Sundaram',
    trainer_id: 'tr_1',
    room: 'Lab 1 - Alpha',
    weekday: 'Wednesday',
    start: '09:00',
    end: '11:00',
    mode: 'classroom',
    color_code: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  },
  {
    id: 'sess_10',
    batch: 'QA Automation - Batch A',
    batch_id: 'b_qa_a',
    trainer: 'Ananya Deshmukh',
    trainer_id: 'tr_6',
    room: 'Studio 3 - Gamma',
    weekday: 'Wednesday',
    start: '09:00',
    end: '10:30',
    mode: 'classroom',
    color_code: 'bg-rose-50 border-rose-200 text-rose-900',
  },
  {
    id: 'sess_11',
    batch: 'Python Data Eng - Batch A',
    batch_id: 'b_py_a',
    trainer: 'Rajesh Verma',
    trainer_id: 'tr_2',
    room: 'Studio 3 - Gamma',
    weekday: 'Wednesday',
    start: '11:30',
    end: '13:30',
    mode: 'classroom',
    color_code: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  },

  // Thursday
  {
    id: 'sess_12',
    batch: 'Java Fullstack - Batch B',
    batch_id: 'b_java_b',
    trainer: 'Priya Sundaram',
    trainer_id: 'tr_1',
    room: 'Hall 2 - Beta',
    weekday: 'Thursday',
    start: '10:00',
    end: '12:00',
    mode: 'hybrid',
    color_code: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  },
  {
    id: 'sess_13',
    batch: 'Python Data Eng - Batch B',
    batch_id: 'b_py_b',
    trainer: 'Rajesh Verma',
    trainer_id: 'tr_2',
    room: 'Online Live Stream (Room 3)',
    weekday: 'Thursday',
    start: '14:00',
    end: '16:30',
    mode: 'online',
    color_code: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  },

  // Friday
  {
    id: 'sess_14',
    batch: 'Java Fullstack - Batch A',
    batch_id: 'b_java_a',
    trainer: 'Priya Sundaram',
    trainer_id: 'tr_1',
    room: 'Lab 1 - Alpha',
    weekday: 'Friday',
    start: '09:00',
    end: '11:00',
    mode: 'classroom',
    color_code: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  },
  {
    id: 'sess_15',
    batch: 'Full Stack MERN - Batch A',
    batch_id: 'b_web_a',
    trainer: 'Neha Sengupta',
    trainer_id: 'tr_4',
    room: 'Lab 1 - Alpha',
    weekday: 'Friday',
    start: '14:00',
    end: '16:00',
    mode: 'classroom',
    color_code: 'bg-amber-50 border-amber-200 text-amber-900',
  },

  // Saturday
  {
    id: 'sess_16',
    batch: 'Data Science & GenAI - Batch B',
    batch_id: 'b_ds_b',
    trainer: 'Dr. Amit Patel',
    trainer_id: 'tr_3',
    room: 'Studio 3 - Gamma (Online)',
    weekday: 'Saturday',
    start: '10:00',
    end: '13:00',
    mode: 'online',
    color_code: 'bg-purple-50 border-purple-200 text-purple-900',
  },
  {
    id: 'sess_17',
    batch: 'QA Automation - Batch B',
    batch_id: 'b_qa_b',
    trainer: 'Ananya Deshmukh',
    trainer_id: 'tr_6',
    room: 'Room 5 - Tech Lab',
    weekday: 'Saturday',
    start: '14:00',
    end: '15:30',
    mode: 'online',
    color_code: 'bg-rose-50 border-rose-200 text-rose-900',
  },
];

let currentSessions: TimetableSession[] = JSON.parse(JSON.stringify(INITIAL_SESSIONS));
let lastChanges: TimetableChange[] = [];

export function getTimetable(): TimetableRunResponse {
  return {
    run_id: 'run_init_001',
    sessions: currentSessions,
    conflicts: 0,
    duration_ms: 38,
    changes: lastChanges,
    created_at: new Date().toISOString(),
  };
}

export function generateTimetableFresh(): TimetableRunResponse {
  currentSessions = JSON.parse(JSON.stringify(INITIAL_SESSIONS));
  lastChanges = [];
  return {
    run_id: `run_${Date.now()}`,
    sessions: currentSessions,
    conflicts: 0,
    duration_ms: 42,
    changes: [],
    created_at: new Date().toISOString(),
  };
}

export function replanTimetable(
  event: 'trainer_unavailable' | 'batch_added',
  details: {
    trainer?: string;
    trainer_id?: string;
    day?: Weekday;
    time_range?: string;
    batch_name?: string;
    course_name?: string;
    room?: string;
  }
): TimetableRunResponse {
  const newSessions: TimetableSession[] = JSON.parse(JSON.stringify(currentSessions));
  const changes: TimetableChange[] = [];

  if (event === 'trainer_unavailable') {
    const trainerName = details.trainer || 'Priya Sundaram';
    const day = details.day || 'Tuesday';

    // Mock moving 3 classes per spec:
    // 1. Move Priya's Tuesday Java Batch B
    const sess5 = newSessions.find(s => s.id === 'sess_5');
    if (sess5) {
      sess5.weekday = 'Wednesday';
      sess5.start = '10:00';
      sess5.end = '12:00';
      sess5.room = 'Hall 2 - Beta';
      changes.push({
        session: 'Java Fullstack - Batch B',
        session_id: 'sess_5',
        from_slot: `Tue 10:00 - 12:00 (Hall 2)`,
        to_slot: `Wed 10:00 - 12:00 (Hall 2)`,
        reason: `Java Batch B Tue 10:00 moved to Wed 10:00 because Trainer ${trainerName} is unavailable ${day} and Room 2 is free Wed 10:00.`,
      });
    }

    // 2. Adjust DevOps class to avoid room / timeslot overlap
    const sess6 = newSessions.find(s => s.id === 'sess_6');
    if (sess6) {
      sess6.weekday = 'Thursday';
      sess6.start = '09:30';
      sess6.end = '12:00';
      changes.push({
        session: 'DevOps & Cloud - Batch A',
        session_id: 'sess_6',
        from_slot: `Tue 09:30 - 12:00 (Room 5)`,
        to_slot: `Thu 09:30 - 12:00 (Room 5)`,
        reason: 'DevOps Batch A rescheduled to Thursday morning to optimize hardware server provisioning windows.',
      });
    }

    // 3. Shift WebDev Batch B
    const sess8 = newSessions.find(s => s.id === 'sess_8');
    if (sess8) {
      sess8.weekday = 'Thursday';
      sess8.start = '16:30';
      sess8.end = '18:30';
      changes.push({
        session: 'Full Stack MERN - Batch B',
        session_id: 'sess_8',
        from_slot: `Tue 16:30 - 18:30 (Seminar Hall 4)`,
        to_slot: `Thu 16:30 - 18:30 (Seminar Hall 4)`,
        reason: 'Full Stack MERN Batch B moved to Thursday evening to balance student commute and trainer buffer.',
      });
    }
  } else {
    // New batch added scenario
    const newId = `sess_new_${Date.now()}`;
    const newSession: TimetableSession = {
      id: newId,
      batch: details.batch_name || 'Cloud Architect FastTrack',
      batch_id: 'b_new_arch',
      trainer: details.trainer || 'Vikram Joshi',
      trainer_id: 'tr_5',
      room: details.room || 'Seminar Hall 4 - Delta',
      weekday: details.day || 'Friday',
      start: '16:30',
      end: '18:30',
      mode: 'hybrid',
      color_code: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    };
    newSessions.push(newSession);

    changes.push({
      session: newSession.batch,
      session_id: newId,
      from_slot: 'Unassigned',
      to_slot: `${newSession.weekday} ${newSession.start} - ${newSession.end} (${newSession.room})`,
      reason: `New batch '${newSession.batch}' scheduled with 0 room or instructor overlaps.`,
    });
  }

  currentSessions = newSessions;
  lastChanges = changes;

  return {
    run_id: `run_replan_${Date.now()}`,
    sessions: currentSessions,
    conflicts: 0,
    duration_ms: 54,
    changes,
    created_at: new Date().toISOString(),
  };
}
