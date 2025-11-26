"use client";

import {
  type ChangeEventHandler,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { ROOM_STATUSES, type RoomStatus } from "@/constants/rooms";

type Room = {
  id: number;
  name: string;
  roomType: string;
  nightlyRate: number;
  status: RoomStatus;
  notes: string | null;
};

const emptyForm = {
  name: "",
  roomType: "",
  nightlyRate: "",
  status: "available" as RoomStatus,
  notes: "",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState(() => ({ ...emptyForm }));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const stats = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter((room) => room.status === "occupied").length;
    const available = rooms.filter((room) => room.status === "available").length;
    return {
      total,
      occupied,
      available,
      occupancyRate: total ? Math.round((occupied / total) * 100) : 0,
    };
  }, [rooms]);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rooms");
      if (!response.ok) {
        throw new Error("Failed to load rooms.");
      }
      const data: Room[] = await response.json();
      setRooms(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: form.name,
        roomType: form.roomType,
        nightlyRate: Number(form.nightlyRate),
        status: form.status,
        notes: form.notes,
      };

      const url = editingId ? `/api/rooms/${editingId}` : "/api/rooms";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.errors?.join(" ") ?? data?.message ?? "Unable to save room.";
        throw new Error(message);
      }

      await fetchRooms();
      setSuccess(editingId ? "Room updated successfully." : "Room created!");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save room.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingId(room.id);
    setForm({
      name: room.name,
      roomType: room.roomType,
      nightlyRate: String(room.nightlyRate),
      status: room.status,
      notes: room.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (room: Room) => {
    const confirmation = confirm(
      `Delete ${room.name}? This cannot be undone.`
    );
    if (!confirmation) return;

    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? "Unable to delete room.");
      }
      await fetchRooms();
      setSuccess("Room deleted.");
      if (editingId === room.id) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete room.");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12 text-white shadow-lg">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
                Hotel Management
              </p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
                Rooms dashboard
              </h1>
              <p className="mt-4 max-w-2xl text-slate-200">
                Track inventory, pricing, and occupancy in one lightweight CRUD
                interface built with Next.js and MySQL.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-sm text-slate-300">{session.user.email}</p>
                <p className="text-xs text-slate-400">
                  {isAdmin ? "Admin" : "View Only"}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Sign Out
              </button>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total rooms" value={stats.total} />
            <StatCard label="Available" value={stats.available} />
            <StatCard label="Occupied" value={stats.occupied} />
            <StatCard label="Occupancy" value={`${stats.occupancyRate}%`} />
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="mx-auto mt-[-4rem] w-full max-w-5xl px-4">
          <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {editingId ? "Update room" : "Add a new room"}
              </p>
              <p className="text-sm text-slate-500">
                Fill in the details below to {editingId ? "update" : "create"} a
                room record.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Room name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Deluxe Suite 301"
                required
              />
              <Input
                label="Room type"
                value={form.roomType}
                onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                placeholder="Suite, King, Double..."
                required
              />
              <Input
                label="Nightly rate"
                type="number"
                min="0"
                step="0.01"
                value={form.nightlyRate}
                onChange={(e) => setForm({ ...form, nightlyRate: e.target.value })}
                placeholder="200"
                required
              />
              <Select
                label="Status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as RoomStatus })
                }
                options={ROOM_STATUSES}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Notes
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional description or housekeeping notes..."
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                {success}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Room"
                    : "Create Room"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
      )}

      <section className="mx-auto mt-10 w-full max-w-5xl px-4">
        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">All rooms</h2>
              <p className="text-sm text-slate-500">
                {loading ? "Loading rooms..." : `${rooms.length} rooms found`}
                {!isAdmin && " (View Only Mode)"}
              </p>
            </div>
            <button
              onClick={fetchRooms}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="px-4 py-3 font-medium">Room</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Nightly rate</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 && !loading ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-slate-500"
                      colSpan={5}
                    >
                      No rooms yet. Create your first one above.
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr
                      key={room.id}
                      className="border-t border-slate-100 text-slate-800"
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium">{room.name}</p>
                        {room.notes && (
                          <p className="text-xs text-slate-500">{room.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">{room.roomType}</td>
                      <td className="px-4 py-4">{currency.format(room.nightlyRate)}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                          {room.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {isAdmin ? (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleEdit(room)}
                              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(room)}
                              className="text-sm font-semibold text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

type InputProps = {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  step?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

function Input({
  label,
  type = "text",
  value,
  placeholder,
  required,
  min,
  step,
  onChange,
}: InputProps) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        step={step}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

type SelectProps = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: ChangeEventHandler<HTMLSelectElement>;
};

function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <select
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 text-white shadow-lg backdrop-blur">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
