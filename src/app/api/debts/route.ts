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

function formatDebt(debt: {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  monthlyEMI: number;
  createdAt: Date;
}) {
  const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
  const progress = debt.totalAmount > 0
    ? Math.min(100, Math.round((debt.paidAmount / debt.totalAmount) * 100))
    : 0;

  return {
    ...debt,
    remaining,
    progress,
  };
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const debts = await prisma.debt.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(debts.map(formatDebt));
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, totalAmount, monthlyEMI, paidAmount } = await req.json();
  if (!name || !totalAmount) {
    return NextResponse.json({ error: "Name and total amount required" }, { status: 400 });
  }

  const debt = await prisma.debt.create({
    data: {
      name: String(name).trim(),
      totalAmount: Math.max(0, normalizeAmount(totalAmount)),
      monthlyEMI: Math.max(0, normalizeAmount(monthlyEMI)),
      paidAmount: Math.max(0, normalizeAmount(paidAmount)),
      userId,
    },
  });

  return NextResponse.json(formatDebt(debt));
}

export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, totalAmount, monthlyEMI, paidAmount } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const debt = await prisma.debt.findFirst({ where: { id, userId } });
  if (!debt) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (typeof name === "string") data.name = name.trim();
  if (totalAmount !== undefined) data.totalAmount = Math.max(0, normalizeAmount(totalAmount));
  if (monthlyEMI !== undefined) data.monthlyEMI = Math.max(0, normalizeAmount(monthlyEMI));
  if (paidAmount !== undefined) {
    const total = totalAmount !== undefined ? Math.max(0, normalizeAmount(totalAmount)) : debt.totalAmount;
    data.paidAmount = Math.min(total, Math.max(0, normalizeAmount(paidAmount)));
  }

  const updatedDebt = await prisma.debt.update({
    where: { id: debt.id },
    data,
  });

  return NextResponse.json(formatDebt(updatedDebt));
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.debt.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}

