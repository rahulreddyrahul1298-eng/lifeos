import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getTodayString } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { habitId } = await req.json();
  if (!habitId) return NextResponse.json({ error: "habitId required" }, { status: 400 });

  const today = getTodayString();

  // Check if already completed today
  const existing = await prisma.habitCompletion.findUnique({
    where: { habitId_date: { habitId, date: today } },
  });

  if (existing) {
    // Uncomplete
    await prisma.habitCompletion.delete({ where: { id: existing.id } });
    await prisma.habit.update({
      where: { id: habitId },
      data: { streak: { decrement: 1 } },
    });
    return NextResponse.json({ completed: false });
  } else {
    // Complete
    await prisma.habitCompletion.create({
      data: { habitId, date: today },
    });
    await prisma.habit.update({
      where: { id: habitId },
      data: { streak: { increment: 1 } },
    });
    return NextResponse.json({ completed: true });
  }
}
