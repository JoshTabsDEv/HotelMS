import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { ROOM_STATUSES } from "@/constants/rooms";
import { getPool } from "@/lib/db";

type RoomRow = RowDataPacket & {
  id: number;
  name: string;
  room_type: string;
  nightly_rate: number | string;
  status: string;
  notes: string | null;
};

function mapRoom(row: RoomRow) {
  return {
    id: row.id,
    name: row.name,
    roomType: row.room_type,
    nightlyRate: Number(row.nightly_rate),
    status: row.status,
    notes: row.notes,
  };
}

function validatePayload(payload: any) {
  const errors: string[] = [];
  const name = payload?.name?.trim?.();
  const roomType = payload?.roomType?.trim?.();
  const nightlyRate = Number(payload?.nightlyRate);
  const status = payload?.status ?? "available";
  const rawNotes = payload?.notes ?? null;
  const notes =
    typeof rawNotes === "string" && rawNotes.trim().length
      ? rawNotes.trim()
      : null;

  if (!name) {
    errors.push("Room name is required.");
  }
  if (!roomType) {
    errors.push("Room type is required.");
  }
  if (Number.isNaN(nightlyRate) || nightlyRate <= 0) {
    errors.push("Nightly rate must be a positive number.");
  }
  if (!ROOM_STATUSES.includes(status)) {
    errors.push("Status is invalid.");
  }

  return {
    errors,
    data: {
      name,
      roomType,
      nightlyRate,
      status,
      notes,
    },
  };
}

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query<RoomRow[]>(
      "SELECT id, name, room_type, nightly_rate, status, notes FROM rooms ORDER BY id DESC"
    );
    return NextResponse.json(rows.map(mapRoom));
  } catch (error) {
    console.error("Failed to load rooms", error);
    return NextResponse.json(
      { message: "Unable to load rooms." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { errors, data } = validatePayload(payload);

    if (errors.length) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO rooms (name, room_type, nightly_rate, status, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.roomType, data.nightlyRate, data.status, data.notes]
    );

    const [rows] = await pool.query<RoomRow[]>(
      "SELECT id, name, room_type, nightly_rate, status, notes FROM rooms WHERE id = ? LIMIT 1",
      [result.insertId]
    );

    const room = rows[0];
    if (!room) {
      return NextResponse.json(
        { message: "Unable to load created room." },
        { status: 500 }
      );
    }

    return NextResponse.json(mapRoom(room), { status: 201 });
  } catch (error) {
    console.error("Failed to create room", error);
    return NextResponse.json(
      { message: "Unable to create room." },
      { status: 500 }
    );
  }
}

