import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  autoCategorize,
  getMonthString,
  getTodayString,
  normalizeAmount,
  summarizeBudgets,
} from "@/lib/utils";

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
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return NextResponse.json({ expenses, total, count: expenses.length });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, amount, category, date } = await req.json();
  if (!title || amount === undefined) {
    return NextResponse.json({ error: "Title and amount required" }, { status: 400 });
  }

  const normalizedAmount = Math.max(0, normalizeAmount(amount));
  if (normalizedAmount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
  }

  const finalCategory = typeof category === "string" && category ? category : autoCategorize(title);
  const expenseDate = typeof date === "string" && date ? date : getTodayString();

  const expense = await prisma.expense.create({
    data: {
      title: String(title).trim(),
      amount: normalizedAmount,
      category: finalCategory,
      date: expenseDate,
      userId,
    },
  });

  const monthKey = expenseDate.slice(0, 7);
  const [categoryBudgets, monthExpenses] = await Promise.all([
    prisma.categoryBudget.findMany({ where: { userId } }),
    prisma.expense.findMany({
      where: {
        userId,
        date: { startsWith: monthKey },
      },
      select: { category: true, amount: true },
    }),
  ]);

  const summaries = summarizeBudgets(categoryBudgets, monthExpenses);
  const impactedBudget = summaries.find((summary) => summary.category === finalCategory);

  let alert = null;
  if (impactedBudget) {
    if (impactedBudget.exceeded) {
      alert = {
        type: "exceeded",
        category: finalCategory,
        overBy: Math.round(impactedBudget.overBy),
        transferredFromOther: Math.round(impactedBudget.transferredFromOther),
      };
    } else if (impactedBudget.percent >= 90 && impactedBudget.effectiveLimit > 0) {
      alert = {
        type: "warning",
        category: finalCategory,
        pct: impactedBudget.percent,
        transferredFromOther: Math.round(impactedBudget.transferredFromOther),
      };
    }
  }

  return NextResponse.json({
    expense,
    alert,
    suggestedCategory: finalCategory,
  });
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

