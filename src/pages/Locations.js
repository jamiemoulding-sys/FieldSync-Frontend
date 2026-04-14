/* =========================================================
src/pages/Locations.js
FULL FILE
- Manual pin movement supported (save exact point)
- Better UX text
- Geofence warning note added
========================================================= */

import {
  useState,
  useEffect,
} from "react";

import {
  locationAPI,
} from "../services/api";

import LocationPicker from "../components/LocationPicker";

export default function Locations() {
  const [locations, setLocations] =
    useState([]);

  const [showModal, setShowModal] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [position, setPosition] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState({
      name: "",
      address: "",
      radius: 100,
    });

  const load =
    async () => {
      try {
        const data =
          await locationAPI.getLocations();

        setLocations(data || []);
      } catch (err) {
        console.error(err);
      }
    };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setEditing(null);

    setPosition(null);

    setForm({
      name: "",
      address: "",
      radius: 100,
    });
  };

  const openCreate = () => {
    reset();
    setShowModal(true);
  };

  const edit = (row) => {
    setEditing(row);

    setForm({
      name: row.name,
      address:
        row.address || "",
      radius:
        row.radius || 100,
    });

    setPosition({
      lat: Number(
        row.latitude
      ),
      lng: Number(
        row.longitude
      ),
    });

    setShowModal(true);
  };

  const save =
    async (e) => {
      e.preventDefault();

      if (!position) {
        return alert(
          "Please choose exact map location"
        );
      }

      try {
        setSaving(true);

        const payload = {
          ...form,
          radius: Number(
            form.radius
          ),
          latitude:
            position.lat,
          longitude:
            position.lng,
        };

        if (editing) {
          await locationAPI.update(
            editing.id,
            payload
          );
        } else {
          await locationAPI.create(
            payload
          );
        }

        setShowModal(false);
        reset();
        load();

      } catch (err) {
        console.error(err);

        alert(
          "Failed to save location"
        );
      } finally {
        setSaving(false);
      }
    };

  const remove =
    async (id) => {
      if (
        !window.confirm(
          "Delete this location?"
        )
      ) {
        return;
      }

      await locationAPI.delete(
        id
      );

      load();
    };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Locations
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Set exact geofence pins and radius for clock in.
          </p>
        </div>

        <button
          onClick={
            openCreate
          }
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl"
        >
          Add Location
        </button>
      </div>

      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">
        If staff can still clock in outside the area, your clock-in page needs geofence enforcement logic updating next.
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {locations.map(
          (loc) => (
            <div
              key={loc.id}
              className="border border-white/10 rounded-2xl p-5 bg-[#020617]"
            >
              <h2 className="font-semibold text-lg">
                {loc.name}
              </h2>

              <p className="text-sm text-gray-400 mt-2">
                {
                  loc.address
                }
              </p>

              <p className="text-sm mt-3">
                Radius:{" "}
                {
                  loc.radius
                }
                m
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Lat:{" "}
                {
                  Number(
                    loc.latitude
                  ).toFixed(6)
                }
                {" | "}
                Lng:{" "}
                {
                  Number(
                    loc.longitude
                  ).toFixed(6)
                }
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() =>
                    edit(
                      loc
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    remove(
                      loc.id
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-red-500/20 text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">

          <div className="bg-[#020617] border border-white/10 rounded-2xl w-full max-w-2xl p-6 space-y-4">

            <h2 className="text-xl font-semibold">
              {editing
                ? "Edit Location"
                : "Create Location"}
            </h2>

            <form
              onSubmit={save}
              className="space-y-4"
            >

              <input
                value={
                  form.name
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    name:
                      e.target
                        .value,
                  })
                }
                placeholder="Location name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                required
              />

              <input
                value={
                  form.address
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    address:
                      e.target
                        .value,
                  })
                }
                placeholder="Address or postcode"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              />

              <div className="text-sm text-gray-400">
                Search postcode, then drag / click map pin to exact building entrance.
              </div>

              <LocationPicker
                position={
                  position
                }
                setPosition={
                  setPosition
                }
                radius={
                  Number(
                    form.radius
                  )
                }
                onSelectAddress={(
                  addr
                ) =>
                  setForm({
                    ...form,
                    address:
                      addr,
                    name:
                      form.name ||
                      addr.split(
                        ","
                      )[0],
                  })
                }
              />

              {position && (
                <div className="text-xs text-indigo-300">
                  Exact Pin:{" "}
                  {
                    position.lat
                  }
                  {", "}
                  {
                    position.lng
                  }
                </div>
              )}

              <input
                type="number"
                min="10"
                value={
                  form.radius
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    radius:
                      e.target
                        .value,
                  })
                }
                placeholder="Radius metres"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              />

              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                  className="py-3 rounded-xl bg-white/5"
                >
                  Cancel
                </button>

                <button
                  disabled={
                    saving
                  }
                  className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : "Save"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}