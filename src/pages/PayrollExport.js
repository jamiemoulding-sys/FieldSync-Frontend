import { useEffect, useMemo, useState } from "react";
import { reportAPI, userAPI, companyAPI } from "../services/api";
import jsPDF from "jspdf";

/* ================= HELPERS ================= */

function hours(start, end, breakSec = 0) {
  if (!start || !end) return 0;
  return (new Date(end) - new Date(start)) / 3600000 - breakSec / 3600;
}

function money(v) {
  return `£${Number(v || 0).toFixed(2)}`;
}

/* ================= CALC ================= */

function calculate(user, shifts) {
  let gross = 0;

  shifts.forEach((s) => {
    const h = hours(s.clock_in_time, s.clock_out_time, s.total_break_seconds);
    gross += h * Number(user.hourly_rate || 0);
  });

  const tax = gross * 0.2;
  const ni = gross * 0.12;
  const pension = gross * 0.05;
  const net = gross - tax - ni - pension;

  return { gross, tax, ni, pension, net };
}

/* ================= PDF ================= */

function generatePayslip(emp, company, fromDate, toDate, returnBlob = false) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(company?.name || "Company", 20, 20);
  doc.text("PAYSLIP", 150, 20);

  doc.setFontSize(10);
  doc.text(company?.address || "", 20, 28);

  doc.text(`Employee: ${emp.name}`, 20, 45);
  doc.text(`Period: ${fromDate} → ${toDate}`, 20, 52);

  let y = 70;

  doc.setFontSize(12);
  doc.text("EARNINGS", 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.text("Gross", 20, y);
  doc.text(money(emp.gross), 150, y);

  y += 15;
  doc.text("DEDUCTIONS", 20, y);

  y += 8;
  doc.text("Tax", 20, y);
  doc.text(`-${money(emp.tax)}`, 150, y);

  y += 6;
  doc.text("NI", 20, y);
  doc.text(`-${money(emp.ni)}`, 150, y);

  y += 6;
  doc.text("Pension", 20, y);
  doc.text(`-${money(emp.pension)}`, 150, y);

  y += 12;
  doc.setFontSize(12);
  doc.text("NET PAY", 20, y);
  doc.text(money(emp.net), 150, y);

  if (returnBlob) {
    return doc.output("blob");
  }

  doc.save(`payslip_${emp.name}.pdf`);
}

/* ================= MAIN ================= */

export default function PayrollExport() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stored, setStored] = useState([]);

  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]
  );

  const [toDate, setToDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [timesheets, staff, comps, storedDocs] = await Promise.all([
      reportAPI.getTimesheets(),
      userAPI.getAll(),
      companyAPI.getAll(),
      reportAPI.getPayslips?.() || [],
    ]);

    setRows(timesheets || []);
    setUsers(staff || []);
    setCompanies(comps || []);
    setStored(storedDocs || []);
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = r.clock_in_time?.split("T")[0];
      return d >= fromDate && d <= toDate;
    });
  }, [rows, fromDate, toDate]);

  const payroll = useMemo(() => {
    return users.map((u) => {
      const userRows = filtered.filter((r) => r.user_id === u.id);
      const calc = calculate(u, userRows);

      const company = companies.find((c) => c.id === u.company_id);

      return { ...u, ...calc, company };
    });
  }, [users, filtered, companies]);

  /* ================= ACTIONS ================= */

  async function handleDownload(emp) {
    generatePayslip(emp, emp.company, fromDate, toDate);
  }

  async function handleSave(emp) {
    const blob = generatePayslip(emp, emp.company, fromDate, toDate, true);

    const formData = new FormData();
    formData.append("file", blob, `payslip_${emp.name}.pdf`);
    formData.append("user_id", emp.id);

    await reportAPI.savePayslip(formData);

    alert("Payslip saved");
    load();
  }

  async function handleSend(emp) {
    await reportAPI.sendPayslip({
      user_id: emp.id,
      from: fromDate,
      to: toDate,
    });

    alert("Payslip sent");
  }

  async function handleResend(doc) {
    await reportAPI.resendPayslip(doc.id);
    alert("Resent");
  }

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Payroll Dashboard
      </h1>

      {/* FILTER */}
      <div className="flex gap-4">
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      </div>

      {/* CURRENT PAYROLL */}
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

                <td className="flex gap-2">
                  <button onClick={() => handleDownload(r)} className="bg-indigo-600 px-2 py-1 rounded">
                    Download
                  </button>

                  <button onClick={() => handleSave(r)} className="bg-blue-600 px-2 py-1 rounded">
                    Save
                  </button>

                  <button onClick={() => handleSend(r)} className="bg-green-600 px-2 py-1 rounded">
                    Send
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* STORED PAYSLIPS */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          Stored Payslips
        </h2>

        <div className="border rounded-xl overflow-auto">
          <table className="w-full text-sm">

            <thead className="bg-white/5">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {stored.map((doc) => (
                <tr key={doc.id} className="border-t">
                  <td className="p-3">{doc.user_name}</td>
                  <td>{doc.created_at}</td>

                  <td className="flex gap-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-indigo-600 px-2 py-1 rounded"
                    >
                      View
                    </a>

                    <button
                      onClick={() => handleResend(doc)}
                      className="bg-green-600 px-2 py-1 rounded"
                    >
                      Resend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}