import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { normalizeAmount } from "@/lib/utils";

type OnboardingCategory = {
  name: string;
  limit?: number;
};

type OnboardingGoal = {
  title: string;
  icon?: string | null;
  targetAmount?: number;
  savedAmount?: number;
  deadline?: string | null;
};

type OnboardingDebt = {
  name: string;
  totalAmount?: number;
  monthlyEMI?: number;
  paidAmount?: number;
};

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token)?.userId || null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const occupation = typeof body.occupation === "string" ? body.occupation : null;
    const bank = typeof body.bank === "string" ? body.bank : null;
    const income = normalizeAmount(body.income);
    const categories: OnboardingCategory[] = Array.isArray(body.categories) ? body.categories : [];
    const goals: OnboardingGoal[] = Array.isArray(body.goals) ? body.goals : [];
    const debts: OnboardingDebt[] = Array.isArray(body.debts) ? body.debts : [];

    const cleanCategories = categories
      .filter((category) => typeof category.name === "string" && category.name.trim())
      .map((category) => ({
        category: category.name.trim(),
        limit: Math.max(0, normalizeAmount(category.limit)),
      }));

    const cleanGoals = goals
      .filter((goal) => typeof goal.title === "string" && goal.title.trim())
      .map((goal) => ({
        title: goal.title.trim(),
        icon: goal.icon || null,
        targetAmount: Math.max(0, normalizeAmount(goal.targetAmount)) || null,
        savedAmount: Math.max(0, normalizeAmount(goal.savedAmount)),
        deadline: goal.deadline || null,
      }));

    const cleanDebts = debts
      .filter((debt) => typeof debt.name === "string" && debt.name.trim())
      .map((debt) => ({
        name: debt.name.trim(),
        totalAmount: Math.max(0, normalizeAmount(debt.totalAmount)),
        monthlyEMI: Math.max(0, normalizeAmount(debt.monthlyEMI)),
        paidAmount: Math.max(0, normalizeAmount(debt.paidAmount)),
      }))
      .filter((debt) => debt.totalAmount > 0);

    const totalBudget = cleanCategories.reduce((sum, category) => sum + category.limit, 0);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          occupation,
          bank,
          income,
          budget: totalBudget,
          onboarded: true,
        },
      });

      await Promise.all([
        tx.categoryBudget.deleteMany({ where: { userId } }),
        tx.goal.deleteMany({ where: { userId } }),
        tx.debt.deleteMany({ where: { userId } }),
      ]);

      if (cleanCategories.length > 0) {
        await tx.categoryBudget.createMany({
          data: cleanCategories.map((category) => ({
            category: category.category,
            limit: category.limit,
            userId,
          })),
        });
      }

      if (cleanGoals.length > 0) {
        await tx.goal.createMany({
          data: cleanGoals.map((goal) => ({
            title: goal.title,
            icon: goal.icon,
            targetAmount: goal.targetAmount,
            savedAmount: goal.savedAmount,
            deadline: goal.deadline,
            userId,
          })),
        });
      }

      if (cleanDebts.length > 0) {
        await tx.debt.createMany({
          data: cleanDebts.map((debt) => ({
            name: debt.name,
            totalAmount: debt.totalAmount,
            monthlyEMI: debt.monthlyEMI,
            paidAmount: debt.paidAmount,
            userId,
          })),
        });
      }
    });

    return NextResponse.json({
      success: true,
      profile: {
        occupation,
        bank,
        income,
        totalBudget,
      },
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

