import { useEffect, useMemo, useState } from "react";
import { reportAPI, userAPI } from "../services/api";
import jsPDF from "jspdf";

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

/* ================= CALC ================= */

function calculate(user, shifts) {
  let gross = 0;

  shifts.forEach((s) => {
    const h = hours(
      s.clock_in_time,
      s.clock_out_time,
      s.total_break_seconds
    );
    gross += h * Number(user.hourly_rate || 0);
  });

  const tax = gross * 0.2;
  const ni = gross * 0.12;
  const pension = gross * 0.05;
  const net = gross - tax - ni - pension;

  return { gross, tax, ni, pension, net };
}

/* ================= PDF ================= */

function generatePayslip(emp, company) {
  const doc = new jsPDF();

  const color = company?.primary_color || [30, 64, 175];

  // HEADER BAR
  doc.setFillColor(...color);
  doc.rect(0, 0, 210, 30, "F");

  // COMPANY NAME
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(company?.name || "Company", 20, 18);

  // LOGO
  if (company?.logo) {
    const img = new Image();
    img.src = company.logo;
    doc.addImage(img, "PNG", 150, 5, 40, 20);
  }

  doc.setTextColor(0, 0, 0);

  // EMPLOYEE INFO
  doc.setFontSize(12);
  doc.text(`Employee: ${emp.name}`, 20, 50);
  doc.text(`Company: ${company?.name}`, 20, 60);

  // EARNINGS
  doc.setFontSize(13);
  doc.text("Earnings", 20, 80);

  doc.setFontSize(11);
  doc.text("Gross", 20, 90);
  doc.text(money(emp.gross), 150, 90);

  // DEDUCTIONS
  doc.setFontSize(13);
  doc.text("Deductions", 20, 110);

  doc.setFontSize(11);
  doc.text("Tax", 20, 120);
  doc.text(`-${money(emp.tax)}`, 150, 120);

  doc.text("NI", 20, 130);
  doc.text(`-${money(emp.ni)}`, 150, 130);

  doc.text("Pension", 20, 140);
  doc.text(`-${money(emp.pension)}`, 150, 140);

  // NET BOX
  doc.setFillColor(220, 252, 231);
  doc.rect(20, 155, 170, 20, "F");

  doc.setFontSize(14);
  doc.text("Net Pay", 25, 168);
  doc.text(money(emp.net), 140, 168);

  // FOOTER
  doc.setFontSize(8);
  doc.text(
    company?.address || "",
    20,
    190
  );

  doc.save(`payslip_${emp.name}.pdf`);
}

/* ================= MAIN ================= */

export default function PayrollExport() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);

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
    const [timesheets, staff, comps] = await Promise.all([
      reportAPI.getTimesheets(),
      userAPI.getAll(),
    ]);

    setRows(timesheets || []);
    setUsers(staff || []);
    setCompanies(comps || []);
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

      const company = companies.find(
        (c) => c.id === u.company_id
      );

      return {
        ...u,
        ...calc,
        company,
      };
    });
  }, [users, filtered, companies]);

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Multi-Company Payroll
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
      <div className="border rounded-xl overflow-auto">
        <table className="w-full text-sm">

          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Employee</th>
              <th>Company</th>
              <th>Gross</th>
              <th>Net</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {payroll.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.name}</td>
                <td>{r.company?.name}</td>
                <td>{money(r.gross)}</td>
                <td>{money(r.net)}</td>

                <td>
                  <button
                    onClick={() =>
                      generatePayslip(r, r.company)
                    }
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