import { useEffect, useMemo, useState } from "react";
import { reportAPI, userAPI } from "../services/api";
import jsPDF from "jspdf";

/* ================= CONFIG ================= */

const COMPANY = {
  name: "FIELDSYNC LTD",
  address: "London, UK",
  logo: "/logo.png",
};

/* ================= HELPERS ================= */

function hours(start, end, breakSec = 0) {
  if (!start || !end) return 0;
  return (
    (new Date(end) - new Date(start)) / 3600000 -
    breakSec / 3600
  );
}

function money(v) {
  return `£${Number(v || 0).toFixed(2)}`;
}

function validateTaxCode(code) {
  return /^[0-9]{3,4}[A-Z]$/.test(code)
    ? code
    : "1257L";
}

function getNIRate(cat) {
  switch (cat) {
    case "A":
      return 0.12;
    case "B":
      return 0.0585;
    case "C":
      return 0;
    default:
      return 0.12;
  }
}

/* ================= CALC ================= */

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

  const taxCode = validateTaxCode(user.tax_code);
  const annual = gross * 12;

  const tax =
    annual <= 50270
      ? (annual * 0.2) / 12
      : (annual * 0.4) / 12;

  const niRate = getNIRate(user.ni_category);

  const ni =
    annual > 12570
      ? ((annual - 12570) * niRate) / 12
      : 0;

  const pension = gross * 0.05;
  const net = gross - tax - ni - pension;

  return {
    totalHours,
    gross,
    tax,
    ni,
    pension,
    net,
    taxCode,
  };
}

/* ================= PDF ================= */

function generatePayslip(emp) {
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString();

  // HEADER
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(COMPANY.name, 20, 18);
  doc.setFontSize(10);
  doc.text(today, 160, 18);

  // LOGO
  if (COMPANY.logo) {
    const img = new Image();
    img.src = COMPANY.logo;
    try {
      doc.addImage(img, "PNG", 150, 5, 40, 20);
    } catch {}
  }

  doc.setTextColor(0, 0, 0);

  // EMPLOYEE
  doc.setFontSize(12);
  doc.text(`Employee: ${emp.name}`, 20, 50);
  doc.text(`Tax Code: ${emp.taxCode}`, 20, 58);

  // EARNINGS
  doc.setFontSize(13);
  doc.text("Earnings", 20, 75);

  doc.setFontSize(11);
  doc.text("Gross Pay", 20, 85);
  doc.text(money(emp.gross), 150, 85);

  // DEDUCTIONS
  doc.setFontSize(13);
  doc.text("Deductions", 20, 105);

  doc.setFontSize(11);
  doc.text("Tax", 20, 115);
  doc.text(`-${money(emp.tax)}`, 150, 115);

  doc.text("National Insurance", 20, 125);
  doc.text(`-${money(emp.ni)}`, 150, 125);

  doc.text("Pension", 20, 135);
  doc.text(`-${money(emp.pension)}`, 150, 135);

  // NET
  doc.setFillColor(220, 252, 231);
  doc.rect(20, 150, 170, 20, "F");

  doc.setFontSize(14);
  doc.text("Net Pay", 25, 163);
  doc.text(money(emp.net), 140, 163);

  // FOOTER
  doc.setFontSize(8);
  doc.text(
    "This is a computer generated payslip.",
    20,
    190
  );

  doc.save(`payslip_${emp.name}.pdf`);
}

/* ================= MAIN ================= */

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

      return {
        ...u,
        ...calculate(u, userRows),
      };
    });
  }, [users, filtered]);

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Payroll System
      </h1>

      {/* FILTERS */}
      <div className="flex gap-4">
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
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-white/10 overflow-auto">
        <table className="w-full text-sm">

          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Employee</th>
              <th>Gross</th>
              <th>Tax</th>
              <th>NI</th>
              <th>Net</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {payroll.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="p-3">{r.name}</td>
                <td>{money(r.gross)}</td>
                <td>{money(r.tax)}</td>
                <td>{money(r.ni)}</td>
                <td className="font-semibold">
                  {money(r.net)}
                </td>

                <td>
                  <button
                    onClick={() => generatePayslip(r)}
                    className="bg-indigo-600 px-3 py-1 rounded"
                  >
                    Payslip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}