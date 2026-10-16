# Institute Operations Copilot

An enterprise admin platform for coaching institutes where staff ask questions in plain language and an AI answers safely from relational operational data with strict Role-Based Access Control (RBAC), multi-layer security guardrails, automated timetable constraint solving, and human-in-the-loop WhatsApp outbox approvals.

---

## 🚀 Hackathon Library Roster (Rule Compliance)

The following libraries were carefully selected and integrated for this solution:

| Library | Version | Role & Justification |
| :--- | :--- | :--- |
| **`@tanstack/react-table`** | `^8.21.2` | Headless, accessible data table engine for sorting, multi-attribute filtering, and pagination over 120 student rosters and batch allocations without heavy bundle overhead. |
| **`recharts`** | `^2.15.0` | Production SVG visualization library used for weekly attendance velocity line charts and batch-wise attendance benchmark bars. |
| **`lucide-react`** | `^0.546.0` | Consistent, lightweight SVG icon system for institutional navigation, security badges, and action triggers. |
| **`tailwindcss`** | `^4.3.3` | Modern utility-first styling with custom rounded-2xl cards, subtle border hierarchies, and indigo/slate color palettes. Plain components only (no shadcn). |
| **`motion`** | `^12.23.24` | Smooth transitions and state animations for modal overlays and expandable query inspectors. |
| **`typescript`** | `^7.0.2` | Strict static typing across domain models, API contracts, RBAC claims, and AST validator outputs. |

---

## 🛡️ Security Architecture & RBAC Tiers

### 1. Decoded JWT Clearance
- JWT tokens are validated and decoded using client/server JWT parsers (`/lib/jwt.ts`).
- Role is **exclusively** determined from decoded JWT claims (`payload.role`), never accepted from mutable client inputs or form headers.
- Automatic global interceptors for HTTP 401 (session termination) and HTTP 403 (Route Guard "Not allowed for your role" screen).

### 2. Four Operational Personas
1. **Owner (`owner`)**: Unrestricted visibility across all operations, financials, timetables, query audit trails, and the 10-vector Red-Team Attack Suite.
2. **Counselor (`counselor`)**: Students roster, batches, attendance check-ins, Copilot queries, and WhatsApp outbox approvals. Prohibited from raw financial ledgers.
3. **Trainer (`trainer`)**: Batches, attendance, timetable solver, and teaching-oriented Copilot queries. **STRICTLY PROHIBITED** from fees, EMIs, salary tables, and unmasked student contact numbers everywhere.
4. **Accounts (`accounts`)**: Financial overview, EMI installment ledgers, settlement, approvals queue, and compliance audit trail.

### 3. PII & Masked Phone Policy
No unmasked phone numbers appear anywhere on the client. All contacts are uniformly formatted as `98******21` with zero data leakage.

### 4. SafeQuery™ AST Guardrail
- Natural language questions are translated into PostgreSQL-compliant SELECT queries.
- Read-only execution mode (`TRANSACTION READ ONLY`).
- Disallowed keywords (`DROP`, `ALTER`, `DELETE`, `UPDATE`, `UNION`, `INTO`) are blocked at the AST validator.
- Schema role views strip unauthorized columns (e.g. `fee_paid`, `salary`, `bank_acc`) when requested by non-privileged roles.
- When an unauthorized role requests financial data, a friendly red refusal card displays the exact blocking layer (`Role View / Schema Guard`, `Input Guardrail`, or `SQL AST Validator`) and specific rationale.

---

## ⚡ Mock Data vs Real FastAPI Backend Switching

Switching between local mock execution and a live FastAPI server requires toggling **one variable**:

```env
# .env.example / .env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL="http://localhost:8000"
# Or Vite equivalent:
VITE_USE_MOCK=false
VITE_API_URL="http://localhost:8000"
```

Additionally, an interactive **Source: MOCK DATA / FASTAPI BACKEND** toggle is embedded directly in the top navigation bar, allowing instant switching and live URL configuration without restarting dev servers.

---

## 📋 Benchmark Scenarios Demonstrated

1. **Benchmark Java Copilot Query**:
   > *"Which students in the Java batch have missed three or more classes and have an EMI due this week?"*
   - Returns exactly 4 students (Aarav Sharma, Rohan Gupta, Sneha Patil, Vikram Malhotra).
   - Generates executable SQL with copy button and run time telemetry.
   - Provides a one-click **"Draft WhatsApp reminders"** button that stages tailored follow-ups in the Approvals Queue.

2. **Trainer Privilege Violation**:
   > Trainer asks: *"Show all pending fee collections and trainer salary disbursements for this month"*
   - Blocked at Schema Role View layer. Refusal card explains that the trainer role has zero access to financial records.
   - Partial questions (e.g. attendance + fee collection) return the attendance portion while clearly flagging the redacted financial columns.

3. **Timetable Constraint Re-planner**:
   - Marking Trainer Priya unavailable on Tuesday automatically replans 3 conflicting classes:
     - `Java Batch B Tue 10:00 moved to Wed 10:00 because Trainer Priya is unavailable Tuesday and Room 2 is free Wed 10:00.`
     - Highlights moved classes on the Mon–Sat grid.
     - Includes Before/After toggle and Change Log drawer with 0 conflicts achieved in <50ms.

4. **10-Vector Red-Team Attack Suite**:
   - Evaluates 10 malicious attack prompts (SQL injection, Prompt injection, PII scraping, salary snooping, AST bypass).
   - Demonstrates a **10/10 (100%) defense success rate** + 1 legitimate control test proving routine queries continue to pass unhindered.
