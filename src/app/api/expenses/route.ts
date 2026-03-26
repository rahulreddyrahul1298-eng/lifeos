import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getMonthString, getTodayString } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token)?.userId || null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = getMonthString();
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: { startsWith: month },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  return NextResponse.json({ expenses, total });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, amount, category } = await req.json();
  if (!title || !amount) {
    return NextResponse.json({ error: "Title and amount required" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      title,
      amount: parseFloat(amount),
      category: category || "Other",
      date: getTodayString(),
      userId,
    },
  });

  return NextResponse.json(expense);
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.expense.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
