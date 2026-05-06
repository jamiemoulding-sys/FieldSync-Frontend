import { useEffect, useMemo, useState } from "react";
import { reportAPI, userAPI } from "../services/api";

/* =========================================
UK CONFIG (2024/25 BASELINE)
========================================= */

const TAX = {
  personalAllowance: 12570,
  basicRate: 0.2,
  higherRate: 0.4,
  threshold: 50270,
};

const NI = {
  threshold: 12570,
  rate: 0.12,
};

const STUDENT = {
  plan1: { threshold: 22015, rate: 0.09 },
  plan2: { threshold: 27295, rate: 0.09 },
};

const PENSION = {
  rate: 0.05,
};

/* =========================================
HELPERS
========================================= */

function hours(start, end, breakSec = 0) {
  if (!start || !end) return 0;
  return (
    (new Date(end) - new Date(start)) / 3600000 -
    breakSec / 3600
  );
}

function parseTaxCode(code = "1257L") {
  const num = parseInt(code.replace(/\D/g, "")) || 1257;
  return num * 10;
}

/* =========================================
CALC ENGINE
========================================= */

function calculate(user, shifts) {
  let totalHours = 0;
  let gross = 0;

  shifts.forEach((s) => {
    const h = hours(
      s.clock_in_time,
      s.clock_out_time,
      s.total_break_seconds
    );

    totalHours += h;
    gross += h * Number(user.hourly_rate || 0);
  });

  const allowance = parseTaxCode(user.tax_code);
  const annual = gross * 12;

  const taxable = Math.max(annual - allowance, 0);

  let taxAnnual =
    taxable <= TAX.threshold
      ? taxable * TAX.basicRate
      : (TAX.threshold - allowance) * TAX.basicRate +
        (annual - TAX.threshold) * TAX.higherRate;

  const tax = taxAnnual / 12;

  const ni =
    annual > NI.threshold
      ? ((annual - NI.threshold) * NI.rate) / 12
      : 0;

  let student = 0;

  if (user.student_loan_plan === "1") {
    if (annual > STUDENT.plan1.threshold) {
      student =
        ((annual - STUDENT.plan1.threshold) *
          STUDENT.plan1.rate) /
        12;
    }
  }

  if (user.student_loan_plan === "2") {
    if (annual > STUDENT.plan2.threshold) {
      student =
        ((annual - STUDENT.plan2.threshold) *
          STUDENT.plan2.rate) /
        12;
    }
  }

  const pension = gross * PENSION.rate;

  const net = gross - tax - ni - student - pension;

  return {
    totalHours,
    gross,
    tax,
    ni,
    student,
    pension,
    net,
  };
}

/* =========================================
FPS GENERATOR (HMRC STYLE)
========================================= */

function buildFPS(user, calc) {
  return {
    employee: {
      name: user.name,
      ni_number: user.ni_number || "",
      tax_code: user.tax_code || "1257L",
    },
    pay: {
      gross: calc.gross,
      tax: calc.tax,
      ni: calc.ni,
      pension: calc.pension,
      student_loan: calc.student,
      net: calc.net,
    },
  };
}

/* =========================================
MAIN COMPONENT
========================================= */

export default function PayrollExport() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);

  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 7 * 86400000)
      .toISOString()
      .split("T")[0]
  );

  const [toDate, setToDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [timesheets, staff] = await Promise.all([
      reportAPI.getTimesheets(),
      userAPI.getAll(),
    ]);

    setRows(timesheets || []);
    setUsers(staff || []);
  }

  /* FILTER */
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = r.clock_in_time?.split("T")[0];
      return d >= fromDate && d <= toDate;
    });
  }, [rows, fromDate, toDate]);

  /* PAYROLL */
  const payroll = useMemo(() => {
    return users.map((u) => {
      const userRows = filtered.filter(
        (r) => r.user_id === u.id
      );

      const calc = calculate(u, userRows);
      const fps = buildFPS(u, calc);

      return {
        ...u,
        ...calc,
        fps,
      };
    });
  }, [users, filtered]);

  /* EXPORT CSV */
  function exportCSV() {
    const csv = [
      [
        "Employee",
        "Hours",
        "Gross",
        "Tax",
        "NI",
        "Student Loan",
        "Pension",
        "Net",
      ],
      ...payroll.map((r) => [
        r.name,
        r.totalHours.toFixed(2),
        r.gross.toFixed(2),
        r.tax.toFixed(2),
        r.ni.toFixed(2),
        r.student.toFixed(2),
        r.pension.toFixed(2),
        r.net.toFixed(2),
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv]);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "hmrc_payroll.csv";
    a.click();
  }

  /* EXPORT FPS JSON */
  function exportFPS() {
    const fpsPayload = payroll.map((p) => p.fps);

    const blob = new Blob(
      [JSON.stringify(fpsPayload, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "hmrc_fps.json";
    a.click();
  }

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">
        HMRC RTI Payroll (FPS Ready)
      </h1>

      <div className="grid grid-cols-3 gap-4">
        <input
          type="date"
          value={fromDate}
          onChange={(e) =>
            setFromDate(e.target.value)
          }
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) =>
            setToDate(e.target.value)
          }
        />

        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="bg-indigo-600 px-4 py-2 rounded"
          >
            CSV
          </button>

          <button
            onClick={exportFPS}
            className="bg-emerald-600 px-4 py-2 rounded"
          >
            FPS JSON
          </button>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th>Name</th>
            <th>Hours</th>
            <th>Gross</th>
            <th>Tax</th>
            <th>NI</th>
            <th>Student</th>
            <th>Pension</th>
            <th>Net</th>
          </tr>
        </thead>

        <tbody>
          {payroll.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.totalHours.toFixed(2)}</td>
              <td>£{r.gross.toFixed(2)}</td>
              <td>£{r.tax.toFixed(2)}</td>
              <td>£{r.ni.toFixed(2)}</td>
              <td>£{r.student.toFixed(2)}</td>
              <td>£{r.pension.toFixed(2)}</td>
              <td>£{r.net.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}