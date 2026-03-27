export type BudgetCategory = {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
};

export type GoalPreset = {
  title: string;
  icon: string;
  color: string;
};

export type BudgetSummary = {
  category: string;
  spent: number;
  limit: number;
  effectiveLimit: number;
  percent: number;
  exceeded: boolean;
  remaining: number;
  overBy: number;
  transferredFromOther: number;
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getMonthString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export function getDayName(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

export function getDailyBudgetRemaining(budget: number, spent: number): number {
  const daysLeft = getDaysRemainingInMonth();
  if (daysLeft <= 0) return 0;
  return Math.max(0, (budget - spent) / daysLeft);
}

export function groupByCategory(
  expenses: { category: string; amount: number }[]
): { category: string; total: number; percent: number }[] {
  const map: Record<string, number> = {};
  let grandTotal = 0;

  for (const expense of expenses) {
    map[expense.category] = (map[expense.category] || 0) + expense.amount;
    grandTotal += expense.amount;
  }

  return Object.entries(map)
    .map(([category, total]) => ({
      category,
      total,
      percent: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

const CATEGORY_RULES: Array<{ keywords: string[]; category: string }> = [
  {
    keywords: [
      "swiggy",
      "zomato",
      "dominos",
      "pizza",
      "burger",
      "restaurant",
      "cafe",
      "food",
      "biryani",
      "chai",
      "tea",
      "coffee",
      "starbucks",
      "mcdonald",
      "kfc",
      "subway",
    ],
    category: "Food & Dining",
  },
  {
    keywords: [
      "uber",
      "ola",
      "rapido",
      "metro",
      "bus",
      "train",
      "petrol",
      "diesel",
      "fuel",
      "parking",
      "toll",
      "irctc",
      "redbus",
    ],
    category: "Transport",
  },
  {
    keywords: [
      "amazon",
      "flipkart",
      "myntra",
      "ajio",
      "meesho",
      "snapdeal",
      "shopping",
      "mall",
    ],
    category: "Shopping",
  },
  {
    keywords: [
      "grocery",
      "groceries",
      "bigbasket",
      "blinkit",
      "zepto",
      "instamart",
      "dmart",
      "reliance fresh",
      "vegetables",
      "fruits",
    ],
    category: "Groceries",
  },
  {
    keywords: [
      "electricity",
      "wifi",
      "internet",
      "broadband",
      "phone",
      "mobile",
      "recharge",
      "airtel",
      "jio",
      "vi",
      "gas",
      "water",
      "bill",
      "maintenance",
    ],
    category: "Bills & Utilities",
  },
  {
    keywords: [
      "netflix",
      "prime",
      "hotstar",
      "spotify",
      "movie",
      "theatre",
      "gaming",
      "subscription",
      "youtube",
      "bookmyshow",
    ],
    category: "Entertainment",
  },
  {
    keywords: [
      "doctor",
      "hospital",
      "medicine",
      "pharmacy",
      "medical",
      "health",
      "gym",
      "fitness",
      "lab",
      "test",
      "apollo",
      "practo",
    ],
    category: "Health & Medical",
  },
  {
    keywords: [
      "course",
      "udemy",
      "coursera",
      "book",
      "books",
      "tuition",
      "class",
      "coaching",
      "school",
      "college",
      "fees",
      "exam",
    ],
    category: "Education",
  },
  {
    keywords: [
      "clothes",
      "clothing",
      "shirt",
      "jeans",
      "shoes",
      "fashion",
      "accessories",
    ],
    category: "Clothing",
  },
  {
    keywords: ["rent", "emi", "loan", "mortgage", "housing"],
    category: "Rent / EMI",
  },
];

export function autoCategorize(title: string): string {
  const lower = title.trim().toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return rule.category;
    }
  }
  return "Other";
}

export const CATEGORIES: readonly BudgetCategory[] = [
  { name: "Food & Dining", icon: "??", color: "#FF6B6B", bgColor: "#FFF0F0" },
  { name: "Transport", icon: "??", color: "#4ECDC4", bgColor: "#F0FFFE" },
  { name: "Groceries", icon: "??", color: "#45B7D1", bgColor: "#F0F9FF" },
  { name: "Shopping", icon: "???", color: "#FF9F43", bgColor: "#FFF8F0" },
  { name: "Bills & Utilities", icon: "??", color: "#6C5CE7", bgColor: "#F5F3FF" },
  { name: "Entertainment", icon: "??", color: "#E84393", bgColor: "#FFF0F8" },
  { name: "Health & Medical", icon: "??", color: "#00B894", bgColor: "#F0FFF8" },
  { name: "Education", icon: "??", color: "#0984E3", bgColor: "#F0F5FF" },
  { name: "Clothing", icon: "??", color: "#A29BFE", bgColor: "#F5F3FF" },
  { name: "Rent / EMI", icon: "??", color: "#FDCB6E", bgColor: "#FFFBF0" },
  { name: "Savings", icon: "??", color: "#2ECC71", bgColor: "#F0FFF5" },
  { name: "Other", icon: "??", color: "#636E72", bgColor: "#F5F6F7" },
] as const;

export const GOAL_PRESETS: readonly GoalPreset[] = [
  { title: "Travel", icon: "??", color: "#4ECDC4" },
  { title: "House", icon: "??", color: "#FF9F43" },
  { title: "Vehicle", icon: "??", color: "#6C5CE7" },
  { title: "Wedding", icon: "??", color: "#E84393" },
  { title: "Education", icon: "??", color: "#0984E3" },
  { title: "Emergency", icon: "??", color: "#00B894" },
] as const;

export const BANKS = [
  "SBI",
  "HDFC",
  "ICICI",
  "Axis",
  "Kotak",
  "PNB",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank",
  "IndusInd",
  "Yes Bank",
  "IDFC First",
  "Paytm Payments Bank",
  "Fi",
  "Jupiter",
  "Other",
] as const;

export const OCCUPATIONS = [
  { value: "student", label: "Student", icon: "??", desc: "School or college" },
  { value: "fulltime", label: "Full-time", icon: "??", desc: "Salaried job" },
  { value: "parttime", label: "Part-time", icon: "?", desc: "Shift or hourly work" },
  { value: "freelancer", label: "Freelancer", icon: "??", desc: "Independent work" },
  { value: "business", label: "Business", icon: "??", desc: "Owner or founder" },
  { value: "retired", label: "Retired", icon: "??", desc: "Pension or savings" },
] as const;

export function getSmartDefaults(
  income: number,
  occupation: string
): Record<string, number> {
  const pct = (value: number) => Math.max(0, Math.round((income * value) / 100 / 100) * 100);

  if (occupation === "student") {
    return {
      "Food & Dining": pct(20),
      Transport: pct(10),
      Groceries: pct(8),
      Entertainment: pct(8),
      Education: pct(18),
      Shopping: pct(8),
      "Rent / EMI": pct(10),
      Other: pct(8),
      Savings: pct(10),
    };
  }

  if (occupation === "freelancer" || occupation === "parttime") {
    return {
      "Food & Dining": pct(14),
      Transport: pct(8),
      Groceries: pct(12),
      Shopping: pct(6),
      "Bills & Utilities": pct(10),
      Entertainment: pct(4),
      "Health & Medical": pct(5),
      "Rent / EMI": pct(18),
      Savings: pct(12),
      Other: pct(6),
    };
  }

  return {
    "Food & Dining": pct(12),
    Transport: pct(8),
    Groceries: pct(12),
    Shopping: pct(6),
    "Bills & Utilities": pct(12),
    Entertainment: pct(5),
    "Health & Medical": pct(5),
    Education: pct(5),
    Clothing: pct(4),
    "Rent / EMI": pct(20),
    Savings: pct(10),
    Other: pct(5),
  };
}

export function getCategoryIcon(name: string): string {
  return CATEGORIES.find((category) => category.name === name)?.icon || "??";
}

export function getCategoryColor(name: string): string {
  return CATEGORIES.find((category) => category.name === name)?.color || "#636E72";
}

export function getCategoryBgColor(name: string): string {
  return CATEGORIES.find((category) => category.name === name)?.bgColor || "#F5F6F7";
}

export function normalizeAmount(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function summarizeBudgets(
  budgets: Array<{ category: string; limit: number }>,
  expenses: Array<{ category: string; amount: number }>
): BudgetSummary[] {
  const limitMap = new Map(budgets.map((budget) => [budget.category, budget.limit]));
  const categories = new Set<string>([
    ...Array.from(limitMap.keys()),
    ...expenses.map((expense) => expense.category),
  ]);
  const spentByCategory = new Map<string, number>();

  for (const expense of expenses) {
    spentByCategory.set(
      expense.category,
      (spentByCategory.get(expense.category) || 0) + expense.amount
    );
  }

  const base: BudgetSummary[] = Array.from(categories).map((category) => {
    const limit = limitMap.get(category) || 0;
    const spent = spentByCategory.get(category) || 0;
    const overBy = Math.max(0, spent - limit);

    return {
      category,
      spent,
      limit,
      effectiveLimit: limit,
      percent: limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0,
      exceeded: overBy > 0,
      remaining: Math.max(0, limit - spent),
      overBy,
      transferredFromOther: 0,
    };
  });

  const otherEntry = base.find((entry) => entry.category === "Other");
  let otherAvailable = otherEntry ? Math.max(0, otherEntry.limit - otherEntry.spent) : 0;

  for (const entry of base) {
    if (entry.category === "Other" || entry.overBy <= 0 || otherAvailable <= 0) continue;

    const transfer = Math.min(entry.overBy, otherAvailable);
    entry.transferredFromOther = transfer;
    entry.effectiveLimit = entry.limit + transfer;
    entry.overBy = Math.max(0, entry.spent - entry.effectiveLimit);
    entry.exceeded = entry.overBy > 0;
    entry.remaining = Math.max(0, entry.effectiveLimit - entry.spent);
    entry.percent =
      entry.effectiveLimit > 0
        ? Math.min(100, Math.round((entry.spent / entry.effectiveLimit) * 100))
        : 0;
    otherAvailable -= transfer;
  }

  if (otherEntry) {
    const transferred = base.reduce(
      (sum, entry) => sum + entry.transferredFromOther,
      0
    );
    otherEntry.effectiveLimit = Math.max(0, otherEntry.limit - transferred);
    otherEntry.remaining = Math.max(0, otherEntry.effectiveLimit - otherEntry.spent);
    otherEntry.overBy = Math.max(0, otherEntry.spent - otherEntry.effectiveLimit);
    otherEntry.exceeded = otherEntry.overBy > 0;
    otherEntry.percent =
      otherEntry.effectiveLimit > 0
        ? Math.min(100, Math.round((otherEntry.spent / otherEntry.effectiveLimit) * 100))
        : 0;
  }

  return base
    .filter((entry) => entry.spent > 0 || entry.limit > 0)
    .sort((a, b) => b.spent + b.limit - (a.spent + a.limit));
}

