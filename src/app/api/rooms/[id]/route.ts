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
  const updates: Record<string, unknown> = {};
  const errors: string[] = [];

  if ("name" in payload) {
    const value = payload.name?.trim?.();
    if (!value) errors.push("Room name cannot be empty.");
    else updates.name = value;
  }

  if ("roomType" in payload) {
    const value = payload.roomType?.trim?.();
    if (!value) errors.push("Room type cannot be empty.");
    else updates.room_type = value;
  }

  if ("nightlyRate" in payload) {
    const value = Number(payload.nightlyRate);
    if (Number.isNaN(value) || value <= 0) {
      errors.push("Nightly rate must be a positive number.");
    } else {
      updates.nightly_rate = value;
    }
  }

  if ("status" in payload) {
    if (!ROOM_STATUSES.includes(payload.status)) {
      errors.push("Status is invalid.");
    } else {
      updates.status = payload.status;
    }
  }

  if ("notes" in payload) {
    const raw = payload.notes;
    updates.notes =
      typeof raw === "string" && raw.trim().length ? raw.trim() : null;
  }

  return { errors, updates };
}

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const roomId = Number(params.id);
  if (!roomId) {
    return NextResponse.json({ message: "Invalid room id." }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const { errors, updates } = validatePayload(payload);

    if (errors.length) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json(
        { message: "No valid fields to update." },
        { status: 400 }
      );
    }

    const pool = getPool();
    const setColumns = Object.keys(updates)
      .map((column) => `${column} = ?`)
      .join(", ");
    const values = Object.values(updates);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE rooms SET ${setColumns} WHERE id = ?`,
      [...values, roomId]
    );

    if (!result.affectedRows) {
      return NextResponse.json({ message: "Room not found." }, { status: 404 });
    }

    const [rows] = await pool.query<RoomRow[]>(
      "SELECT id, name, room_type, nightly_rate, status, notes FROM rooms WHERE id = ? LIMIT 1",
      [roomId]
    );

    const room = rows[0];
    if (!room) {
      return NextResponse.json({ message: "Room not found." }, { status: 404 });
    }

    return NextResponse.json(mapRoom(room));
  } catch (error) {
    console.error("Failed to update room", error);
    return NextResponse.json(
      { message: "Unable to update room." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const roomId = Number(params.id);
  if (!roomId) {
    return NextResponse.json({ message: "Invalid room id." }, { status: 400 });
  }

  try {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM rooms WHERE id = ?",
      [roomId]
    );

    if (!result.affectedRows) {
      return NextResponse.json({ message: "Room not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Room removed." });
  } catch (error) {
    console.error("Failed to delete room", error);
    return NextResponse.json(
      { message: "Unable to delete room." },
      { status: 500 }
    );
  }
}

