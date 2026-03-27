import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { normalizeAmount } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token)?.userId || null;
}

function formatGoal(goal: {
  id: string;
  title: string;
  icon: string | null;
  targetAmount: number | null;
  savedAmount: number;
  deadline: string | null;
  completed: boolean;
}) {
  const targetAmount = goal.targetAmount ?? 0;
  const progress = targetAmount > 0
    ? Math.min(100, Math.round((goal.savedAmount / targetAmount) * 100))
    : 0;

  return {
    ...goal,
    targetAmount: goal.targetAmount,
    progress,
    remainingAmount: Math.max(0, targetAmount - goal.savedAmount),
  };
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(goals.map(formatGoal));
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, icon, targetAmount, savedAmount, deadline } = await req.json();
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: {
      title: title.trim(),
      icon: typeof icon === "string" ? icon : null,
      targetAmount: Math.max(0, normalizeAmount(targetAmount)) || null,
      savedAmount: Math.max(0, normalizeAmount(savedAmount)),
      deadline: typeof deadline === "string" && deadline ? deadline : null,
      userId,
    },
  });

  return NextResponse.json(formatGoal(goal));
}

export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, title, icon, targetAmount, savedAmount, deadline, completed } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof title === "string") data.title = title.trim();
  if (icon !== undefined) data.icon = typeof icon === "string" ? icon : null;
  if (targetAmount !== undefined) {
    const normalized = Math.max(0, normalizeAmount(targetAmount));
    data.targetAmount = normalized || null;
  }
  if (savedAmount !== undefined) data.savedAmount = Math.max(0, normalizeAmount(savedAmount));
  if (deadline !== undefined) data.deadline = typeof deadline === "string" && deadline ? deadline : null;
  if (completed !== undefined) data.completed = Boolean(completed);

  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const updatedGoal = await prisma.goal.update({
    where: { id: goal.id },
    data,
  });

  return NextResponse.json(formatGoal(updatedGoal));
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await prisma.goal.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}

