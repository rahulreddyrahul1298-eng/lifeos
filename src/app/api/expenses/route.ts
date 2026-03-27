import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getMonthString, getTodayString, autoCategorize } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token)?.userId || null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const categoryFilter = searchParams.get("category");
  const month = monthParam || getMonthString();

  const where: Record<string, unknown> = {
    userId,
    date: { startsWith: month },
  };
  if (categoryFilter && categoryFilter !== "All") {
    where.category = categoryFilter;
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  return NextResponse.json({ expenses, total });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, amount, category, date } = await req.json();
  if (!title || !amount) {
    return NextResponse.json({ error: "Title and amount required" }, { status: 400 });
  }

  // Auto-categorize if no category provided
  const finalCategory = category || autoCategorize(title);

  const expense = await prisma.expense.create({
    data: {
      title,
      amount: parseFloat(amount),
      category: finalCategory,
      date: date || getTodayString(),
      userId,
    },
  });

  // Check if budget exceeded for this category
  const categoryBudget = await prisma.categoryBudget.findUnique({
    where: { userId_category: { userId, category: finalCategory } },
  });

  let alert = null;
  if (categoryBudget) {
    const monthExpenses = await prisma.expense.findMany({
      where: {
        userId,
        category: finalCategory,
        date: { startsWith: getMonthString() },
      },
    });
    const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const pct = (totalSpent / categoryBudget.limit) * 100;

    if (pct >= 100) {
      const overBy = totalSpent - categoryBudget.limit;
      alert = { type: "exceeded", category: finalCategory, overBy };
    } else if (pct >= 90) {
      alert = { type: "warning", category: finalCategory, pct: Math.round(pct) };
    }
  }

  return NextResponse.json({ expense, alert, suggestedCategory: finalCategory });
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
