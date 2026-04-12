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

  const [selectedDate, setSelectedDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [selectedEmployee, setSelectedEmployee] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadData();
  }, [
    selectedDate,
    selectedEmployee,
  ]);

  const loadData = async () => {
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
            rowDate ===
            selectedDate;

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

      setTimeSheetData(rows);

      setEmployees(
        Array.isArray(users)
          ? users
          : []
      );
    } catch (err) {
      console.error(err);
      setError(
        "Failed to load timesheet"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return "N/A";

    return new Date(
      t
    ).toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatDate = (t) => {
    if (!t) return "N/A";

    return new Date(
      t
    ).toLocaleDateString(
      "en-GB"
    );
  };

  const calculateHours = (
    start,
    end,
    breakSeconds = 0
  ) => {
    if (!start || !end)
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

  const exportCSV = () => {
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
          r.users?.name ||
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
    a.download = `timesheet-${selectedDate}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="center-screen">
        Loading timesheet...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="heading-1">
            📊 Timesheet
          </h1>

          <p className="subtle-text">
            Track work hours
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={
              exportCSV
            }
            className="btn-primary"
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

      <div className="card flex gap-4 flex-wrap">
        <input
          type="date"
          value={
            selectedDate
          }
          onChange={(
            e
          ) =>
            setSelectedDate(
              e.target.value
            )
          }
          className="input-field"
        />

        <select
          value={
            selectedEmployee
          }
          onChange={(
            e
          ) =>
            setSelectedEmployee(
              e.target.value
            )
          }
          className="input-field"
        >
          <option value="">
            All Employees
          </option>

          {employees.map(
            (e) => (
              <option
                key={e.id}
                value={e.id}
              >
                {e.name}
              </option>
            )
          )}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 text-sm">
              <th>
                Employee
              </th>
              <th>Date</th>
              <th>
                Clock In
              </th>
              <th>
                Clock Out
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
                r,
                i
              ) => (
                <tr
                  key={
                    i
                  }
                  className="border-t border-white/10"
                >
                  <td>
                    {r.users
                      ?.name ||
                      "Unknown"}
                  </td>

                  <td>
                    {formatDate(
                      r.clock_in_time
                    )}
                  </td>

                  <td>
                    {formatTime(
                      r.clock_in_time
                    )}
                  </td>

                  <td>
                    {formatTime(
                      r.clock_out_time
                    )}
                  </td>

                  <td>
                    {Math.floor(
                      (r.total_break_seconds ||
                        0) /
                        60
                    )}{" "}
                    mins
                  </td>

                  <td>
                    {calculateHours(
                      r.clock_in_time,
                      r.clock_out_time,
                      r.total_break_seconds
                    )}
                    h
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        {timeSheetData.length ===
          0 && (
          <div className="text-center text-gray-400 mt-4">
            No data for
            selected date
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeSheet;