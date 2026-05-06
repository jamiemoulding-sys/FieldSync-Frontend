import { useEffect, useMemo, useState } from "react";
import { reportAPI, userAPI } from "../services/api";

/* =========================================
CONFIG
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

function money(v) {
  return `£${Number(v || 0).toFixed(2)}`;
}

/* =========================================
CALC
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

  if (user.student_loan_plan === "1" && annual > STUDENT.plan1.threshold) {
    student =
      ((annual - STUDENT.plan1.threshold) *
        STUDENT.plan1.rate) /
      12;
  }

  if (user.student_loan_plan === "2" && annual > STUDENT.plan2.threshold) {
    student =
      ((annual - STUDENT.plan2.threshold) *
        STUDENT.plan2.rate) /
      12;
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
MAIN
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

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = r.clock_in_time?.split("T")[0];
      return d >= fromDate && d <= toDate;
    });
  }, [rows, fromDate, toDate]);

  const payroll = useMemo(() => {
    return users.map((u) => {
      const userRows = filtered.filter(
        (r) => r.user_id === u.id
      );

      const calc = calculate(u, userRows);

      return {
        ...u,
        ...calc,
      };
    });
  }, [users, filtered]);

  const totals = useMemo(() => {
    return payroll.reduce(
      (acc, r) => {
        acc.gross += r.gross;
        acc.net += r.net;
        acc.tax += r.tax;
        return acc;
      },
      { gross: 0, net: 0, tax: 0 }
    );
  }, [payroll]);

  function exportCSV() {
    const csv = [
      ["Employee", "Hours", "Gross", "Tax", "NI", "Net"],
      ...payroll.map((r) => [
        r.name,
        r.totalHours.toFixed(2),
        r.gross.toFixed(2),
        r.tax.toFixed(2),
        r.ni.toFixed(2),
        r.net.toFixed(2),
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv]);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "payroll.csv";
    a.click();
  }

  return (
    <div className="space-y-6 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Payroll Dashboard
        </h1>

        <button
          onClick={exportCSV}
          className="bg-indigo-600 px-4 py-2 rounded-xl"
        >
          Export CSV
        </button>
      </div>

      {/* FILTERS */}
      <div className="grid md:grid-cols-3 gap-4">
        <input
          type="date"
          value={fromDate}
          onChange={(e) =>
            setFromDate(e.target.value)
          }
          className="bg-[#020617] p-3 rounded-xl"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) =>
            setToDate(e.target.value)
          }
          className="bg-[#020617] p-3 rounded-xl"
        />
      </div>

      {/* KPI */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Gross" value={money(totals.gross)} />
        <Card title="Tax" value={money(totals.tax)} />
        <Card title="Net Pay" value={money(totals.net)} />
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-white/10 overflow-auto">
        <table className="w-full text-sm">

          <thead className="bg-white/5 text-gray-400 sticky top-0">
            <tr>
              <th className="p-4 text-left">Employee</th>
              <th className="p-4">Hours</th>
              <th className="p-4">Gross</th>
              <th className="p-4">Tax</th>
              <th className="p-4">NI</th>
              <th className="p-4">Pension</th>
              <th className="p-4">Net</th>
            </tr>
          </thead>

          <tbody>
            {payroll.map((r) => (
              <tr
                key={r.id}
                className="border-t border-white/5"
              >
                <td className="p-4">{r.name}</td>
                <td className="p-4 text-center">
                  {r.totalHours.toFixed(2)}
                </td>
                <td className="p-4 text-green-400">
                  {money(r.gross)}
                </td>
                <td className="p-4 text-red-400">
                  {money(r.tax)}
                </td>
                <td className="p-4">{money(r.ni)}</td>
                <td className="p-4">
                  {money(r.pension)}
                </td>
                <td className="p-4 font-semibold">
                  {money(r.net)}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}

/* CARD */
function Card({ title, value }) {
  return (
    <div className="bg-[#020617] border border-white/10 rounded-2xl p-5">
      <p className="text-xs text-gray-400">{title}</p>
      <h2 className="text-2xl font-semibold mt-2">
        {value}
      </h2>
    </div>
  );
}