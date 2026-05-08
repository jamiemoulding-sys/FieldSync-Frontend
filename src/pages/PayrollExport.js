import { useEffect, useMemo, useState } from "react";
import { reportAPI, userAPI } from "../services/api";
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

  let y = 20;

  /* ===== HEADER ===== */
  doc.setFontSize(18);
  doc.text(company?.name || "Company Name", 20, y);

  doc.setFontSize(10);
  doc.text(company?.address || "", 20, y + 6);

  doc.setFontSize(16);
  doc.text("PAYSLIP", 150, y);

  y += 20;

  /* ===== EMPLOYEE + PAY INFO BOXES ===== */
  doc.rect(20, y, 80, 30);
  doc.rect(110, y, 80, 30);

  doc.setFontSize(10);
  doc.text("Employee", 22, y + 6);
  doc.text(emp.name, 22, y + 14);

  doc.text("Company", 22, y + 22);
  doc.text(company?.name || "", 22, y + 28);

  doc.text("Pay Date", 112, y + 6);
  doc.text(moment().format("DD/MM/YYYY"), 112, y + 14);

  doc.text("Period", 112, y + 22);
  doc.text(`${fromDate} → ${toDate}`, 112, y + 28);

  y += 45;

  /* ===== EARNINGS TABLE ===== */
  doc.setFontSize(12);
  doc.text("EARNINGS", 20, y);

  y += 6;

  doc.setFontSize(10);
  doc.text("Description", 20, y);
  doc.text("Amount", 150, y);

  y += 2;
  doc.line(20, y, 190, y);

  y += 8;

  doc.text("Standard Pay", 20, y);
  doc.text(money(emp.gross), 150, y);

  y += 10;

  doc.setFontSize(11);
  doc.text("TOTAL EARNINGS", 20, y);
  doc.text(money(emp.gross), 150, y);

  y += 20;

  /* ===== DEDUCTIONS TABLE ===== */
  doc.setFontSize(12);
  doc.text("DEDUCTIONS", 20, y);

  y += 6;

  doc.setFontSize(10);
  doc.text("Tax", 20, y);
  doc.text(`-${money(emp.tax)}`, 150, y);

  y += 6;
  doc.text("National Insurance", 20, y);
  doc.text(`-${money(emp.ni)}`, 150, y);

  y += 6;
  doc.text("Pension", 20, y);
  doc.text(`-${money(emp.pension)}`, 150, y);

  y += 12;

  doc.setFontSize(11);
  doc.text("TOTAL DEDUCTIONS", 20, y);
  doc.text(
    `-${money(emp.tax + emp.ni + emp.pension)}`,
    150,
    y
  );

  y += 20;

  /* ===== NET PAY BOX ===== */
  doc.setFillColor(230, 230, 230);
  doc.rect(20, y, 170, 15, "F");

  doc.setFontSize(14);
  doc.text("NET PAY", 25, y + 10);
  doc.text(money(emp.net), 140, y + 10);

  /* ===== SAVE / RETURN ===== */
  if (returnBlob) return doc.output("blob");

  doc.save(`payslip_${emp.name}.pdf`);
}

/* ================= MAIN ================= */

export default function PayrollExport() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
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
      reportAPI.getPayslips?.() || [],
    ]);

    setRows(timesheets || []);
    setUsers(staff || []);
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
    const userRows = filtered.filter(
      (r) => r.user_id === u.id
    );

    const calc = calculate(u, userRows);

    const company = u.company || {
      name: u.company_name || "Company",
      address: u.company_address || "",
    };

    return {
      ...u,
      ...calc,
      company,
    };
  });
}, [users, filtered]);

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