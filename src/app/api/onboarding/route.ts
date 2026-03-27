import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { occupation, bank, income, categories, goals, debts } = await req.json();

    // Calculate total budget from categories
    const totalBudget = categories
      ? categories.reduce((sum: number, c: { name: string; limit: number }) => sum + c.limit, 0)
      : 0;

    // Update user profile
    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        occupation: occupation || null,
        bank: bank || null,
        income: income || 0,
        budget: totalBudget,
        onboarded: true,
      },
    });

    // Delete existing data for re-onboarding
    await Promise.all([
      prisma.categoryBudget.deleteMany({ where: { userId: payload.userId } }),
      prisma.goal.deleteMany({ where: { userId: payload.userId } }),
      prisma.debt.deleteMany({ where: { userId: payload.userId } }),
    ]);

    // Create category budgets
    if (categories && categories.length > 0) {
      await prisma.categoryBudget.createMany({
        data: categories.map((c: { name: string; limit: number }) => ({
          category: c.name,
          limit: c.limit,
          userId: payload.userId,
        })),
      });
    }

    // Create goals with target amounts
    if (goals && goals.length > 0) {
      await prisma.goal.createMany({
        data: goals.map((g: { title: string; icon?: string; targetAmount?: number; deadline?: string }) => ({
          title: g.title,
          icon: g.icon || null,
          targetAmount: g.targetAmount || null,
          deadline: g.deadline || null,
          userId: payload.userId,
        })),
      });
    }

    // Create debts
    if (debts && debts.length > 0) {
      await prisma.debt.createMany({
        data: debts.map((d: { name: string; totalAmount: number; monthlyEMI: number }) => ({
          name: d.name,
          totalAmount: d.totalAmount,
          monthlyEMI: d.monthlyEMI || 0,
          userId: payload.userId,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
