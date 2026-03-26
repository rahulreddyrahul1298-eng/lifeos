import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getTodayString } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token)?.userId || null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = getTodayString();
  const habits = await prisma.habit.findMany({
    where: { userId },
    include: {
      completions: {
        where: { date: today },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const formatted = habits.map((h) => ({
    id: h.id,
    name: h.name,
    streak: h.streak,
    completedToday: h.completions.length > 0,
  }));

  return NextResponse.json(formatted);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  // Check free tier limit
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.isPremium) {
    const count = await prisma.habit.count({ where: { userId } });
    if (count >= 3) {
      return NextResponse.json(
        { error: "Free plan limited to 3 habits. Upgrade to Premium!" },
        { status: 403 }
      );
    }
  }

  const habit = await prisma.habit.create({
    data: { name, userId },
  });

  return NextResponse.json(habit);
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.habit.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
