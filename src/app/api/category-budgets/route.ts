import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token)?.userId || null;
}

// Get all category budgets
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const budgets = await prisma.categoryBudget.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(budgets);
}

// Set/update a category budget
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, limit } = await req.json();
  if (!category || !limit) {
    return NextResponse.json({ error: "Category and limit required" }, { status: 400 });
  }

  const budget = await prisma.categoryBudget.upsert({
    where: { userId_category: { userId, category } },
    update: { limit: parseFloat(limit) },
    create: { category, limit: parseFloat(limit), userId },
  });

  return NextResponse.json(budget);
}

// Delete a category budget
export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  if (!category) return NextResponse.json({ error: "Category required" }, { status: 400 });

  await prisma.categoryBudget.deleteMany({ where: { userId, category } });
  return NextResponse.json({ success: true });
}
