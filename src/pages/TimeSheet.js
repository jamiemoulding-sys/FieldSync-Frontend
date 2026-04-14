/* =========================================================
src/pages/TimeSheet.js
FULL COPY / PASTE FILE

FIXES INCLUDED:
- Uses reportAPI.getTimesheets()
- Safe loading
- Better error handling
- Export CSV
- Table + Calendar views
- No broken functions
========================================================= */

import React, {
  useState,
  useEffect,
} from "react";

import {
  reportAPI,
  userAPI,
} from "../services/api";

import HomeButton from "../components/HomeButton";

function TimeSheet() {
  const [timeSheetData, setTimeSheetData] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [view, setView] =
    useState("table");

  const [fromDate, setFromDate] =
    useState(
      new Date(
        new Date().setDate(
          new Date().getDate() - 7
        )
      )
        .toISOString()
        .split("T")[0]
    );

  const [toDate, setToDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [
    selectedEmployee,
    setSelectedEmployee,
  ] = useState("");

  useEffect(() => {
    loadData();
  }, [
    fromDate,
    toDate,
    selectedEmployee,
  ]);

  const loadData =
    async () => {
      try {
        setLoading(true);
        setError("");

        const [
          shifts,
          users,
        ] = await Promise.all([
          reportAPI.getTimesheets(),
          userAPI.getAll(),
        ]);

        let rows =
          Array.isArray(shifts)
            ? shifts
            : [];

        rows = rows.filter(
          (row) => {
            if (
              !row.clock_in_time
            )
              return false;

            const rowDate =
              new Date(
                row.clock_in_time
              )
                .toISOString()
                .split("T")[0];

            const dateMatch =
              rowDate >=
                fromDate &&
              rowDate <=
                toDate;

            const employeeMatch =
              selectedEmployee
                ? row.user_id ===
                  selectedEmployee
                : true;

            return (
              dateMatch &&
              employeeMatch
            );
          }
        );

        setTimeSheetData(
          rows
        );

        setEmployees(
          Array.isArray(
            users
          )
            ? users
            : []
        );

      } catch (err) {
        console.error(err);

        setError(
          "Failed to load timesheets"
        );
      } finally {
        setLoading(false);
      }
    };

  const formatTime = (
    value
  ) => {
    if (!value)
      return "-";

    return new Date(
      value
    ).toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute:
          "2-digit",
      }
    );
  };

  const formatDate = (
    value
  ) => {
    if (!value)
      return "-";

    return new Date(
      value
    ).toLocaleDateString(
      "en-GB"
    );
  };

  const calculateHours = (
    start,
    end,
    breakSeconds = 0
  ) => {
    if (
      !start ||
      !end
    )
      return "0.00";

    const total =
      (new Date(end) -
        new Date(start)) /
        3600000 -
      breakSeconds /
        3600;

    return Math.max(
      total,
      0
    ).toFixed(2);
  };

  const exportCSV =
    () => {
      const rows = [
        [
          "Employee",
          "Date",
          "Clock In",
          "Clock Out",
          "Break",
          "Hours",
        ],

        ...timeSheetData.map(
          (r) => [
            r.users
              ?.name ||
              "Unknown",

            formatDate(
              r.clock_in_time
            ),

            formatTime(
              r.clock_in_time
            ),

            formatTime(
              r.clock_out_time
            ),

            `${Math.floor(
              (r.total_break_seconds ||
                0) / 60
            )} mins`,

            calculateHours(
              r.clock_in_time,
              r.clock_out_time,
              r.total_break_seconds
            ),
          ]
        ),
      ];

      const blob =
        new Blob(
          [
            rows
              .map((r) =>
                r.join(",")
              )
              .join("\n"),
          ],
          {
            type: "text/csv",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          "a"
        );

      a.href = url;

      a.download = `timesheet-${fromDate}-to-${toDate}.csv`;

      a.click();
    };

  const grouped =
    timeSheetData.reduce(
      (
        acc,
        item
      ) => {
        const day =
          new Date(
            item.clock_in_time
          ).getDate();

        if (!acc[day])
          acc[day] =
            [];

        acc[day].push(
          item
        );

        return acc;
      },
      {}
    );

  if (loading) {
    return (
      <div className="center-screen">
        Loading timesheets...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-4">

        <div>
          <h1 className="heading-1">
            📊 Timesheet
          </h1>

          <p className="subtle-text">
            Staff hours & exports
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={
              exportCSV
            }
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl"
          >
            Export CSV
          </button>

          <HomeButton />
        </div>

      </div>

      {error && (
        <div className="badge-error">
          {error}
        </div>
      )}

      {/* FILTERS */}
      <div className="card grid md:grid-cols-5 gap-4">

        <input
          type="date"
          value={
            fromDate
          }
          onChange={(
            e
          ) =>
            setFromDate(
              e.target
                .value
            )
          }
          className="bg-[#0f172a] text-white border border-white/10 px-4 py-3 rounded-xl"
        />

        <input
          type="date"
          value={
            toDate
          }
          onChange={(
            e
          ) =>
            setToDate(
              e.target
                .value
            )
          }
          className="bg-[#0f172a] text-white border border-white/10 px-4 py-3 rounded-xl"
        />

        <select
          value={
            selectedEmployee
          }
          onChange={(
            e
          ) =>
            setSelectedEmployee(
              e.target
                .value
            )
          }
          className="bg-[#0f172a] text-white border border-white/10 px-4 py-3 rounded-xl"
        >
          <option value="">
            All Employees
          </option>

          {employees.map(
            (emp) => (
              <option
                key={
                  emp.id
                }
                value={
                  emp.id
                }
              >
                {emp.name}
              </option>
            )
          )}
        </select>

        <button
          onClick={() =>
            setView(
              "table"
            )
          }
          className={`px-4 py-3 rounded-xl ${
            view ===
            "table"
              ? "bg-indigo-600 text-white"
              : "bg-[#0f172a] text-gray-300"
          }`}
        >
          Table
        </button>

        <button
          onClick={() =>
            setView(
              "calendar"
            )
          }
          className={`px-4 py-3 rounded-xl ${
            view ===
            "calendar"
              ? "bg-indigo-600 text-white"
              : "bg-[#0f172a] text-gray-300"
          }`}
        >
          Calendar
        </button>

      </div>

      {/* TABLE */}
      {view ===
        "table" && (
        <div className="card overflow-x-auto">

          <table className="w-full text-left">

            <thead>
              <tr className="text-gray-400 text-sm">
                <th>
                  Employee
                </th>
                <th>
                  Date
                </th>
                <th>
                  In
                </th>
                <th>
                  Out
                </th>
                <th>
                  Break
                </th>
                <th>
                  Hours
                </th>
              </tr>
            </thead>

            <tbody>

              {timeSheetData.map(
                (
                  row,
                  i
                ) => (
                  <tr
                    key={i}
                    className="border-t border-white/10"
                  >
                    <td>
                      {row
                        .users
                        ?.name ||
                        "Unknown"}
                    </td>

                    <td>
                      {formatDate(
                        row.clock_in_time
                      )}
                    </td>

                    <td>
                      {formatTime(
                        row.clock_in_time
                      )}
                    </td>

                    <td>
                      {formatTime(
                        row.clock_out_time
                      )}
                    </td>

                    <td>
                      {Math.floor(
                        (row.total_break_seconds ||
                          0) /
                          60
                      )} mins
                    </td>

                    <td>
                      {calculateHours(
                        row.clock_in_time,
                        row.clock_out_time,
                        row.total_break_seconds
                      )}h
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>
      )}

      {/* CALENDAR */}
      {view ===
        "calendar" && (
        <div className="grid grid-cols-7 gap-3">

          {Array.from(
            {
              length: 31,
            },
            (
              _,
              i
            ) =>
              i + 1
          ).map(
            (
              day
            ) => (
              <div
                key={
                  day
                }
                className="bg-[#0f172a] border border-white/10 rounded-xl p-3 min-h-[120px]"
              >
                <div className="text-sm font-semibold mb-2">
                  {day}
                </div>

                {grouped[
                  day
                ]?.map(
                  (
                    row,
                    idx
                  ) => (
                    <div
                      key={
                        idx
                      }
                      className="text-xs bg-indigo-500/20 text-indigo-300 rounded px-2 py-1 mb-1"
                    >
                      {row
                        .users
                        ?.name ||
                        "Unknown"}{" "}
                      (
                      {calculateHours(
                        row.clock_in_time,
                        row.clock_out_time,
                        row.total_break_seconds
                      )}
                      h)
                    </div>
                  )
                )}

              </div>
            )
          )}

        </div>
      )}

      {timeSheetData.length ===
        0 && (
        <div className="text-center text-gray-400">
          No records found
        </div>
      )}

    </div>
  );
}

export default TimeSheet;