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
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export function getDayName(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
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
  for (const e of expenses) {
    map[e.category] = (map[e.category] || 0) + e.amount;
    grandTotal += e.amount;
  }
  return Object.entries(map)
    .map(([category, total]) => ({
      category,
      total,
      percent: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// Auto-categorize expenses based on keywords
export function autoCategorize(title: string): string {
  const lower = title.toLowerCase();
  const rules: [string[], string][] = [
    [["swiggy", "zomato", "dominos", "pizza", "burger", "restaurant", "cafe", "food", "biryani", "chai", "tea", "coffee", "starbucks", "mcdonald", "kfc", "subway"], "Food & Dining"],
    [["uber", "ola", "rapido", "metro", "bus", "train", "petrol", "diesel", "fuel", "parking", "toll", "irctc", "redbus"], "Transport"],
    [["amazon", "flipkart", "myntra", "ajio", "meesho", "snapdeal", "shopping", "mall"], "Shopping"],
    [["grocery", "groceries", "bigbasket", "blinkit", "zepto", "instamart", "dmart", "reliance", "vegetables", "fruits"], "Groceries"],
    [["electricity", "wifi", "internet", "broadband", "phone", "mobile", "recharge", "airtel", "jio", "vi", "gas", "water", "bill", "maintenance"], "Bills & Utilities"],
    [["netflix", "prime", "hotstar", "spotify", "movie", "theatre", "gaming", "subscription", "youtube"], "Entertainment"],
    [["doctor", "hospital", "medicine", "pharmacy", "medical", "health", "gym", "fitness", "lab", "test", "apollo", "practo"], "Health & Medical"],
    [["course", "udemy", "coursera", "book", "books", "tuition", "class", "coaching", "school", "college", "fees", "exam"], "Education"],
    [["clothes", "clothing", "shirt", "jeans", "shoes", "fashion", "accessories"], "Clothing"],
    [["rent", "emi", "loan", "mortgage", "housing"], "Rent / EMI"],
  ];

  for (const [keywords, category] of rules) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return "Other";
}

// Category config with colors and icons
export const CATEGORIES = [
  { name: "Food & Dining", icon: "🍔", color: "#FF6B6B", bgColor: "#FFF0F0" },
  { name: "Transport", icon: "🚗", color: "#4ECDC4", bgColor: "#F0FFFE" },
  { name: "Groceries", icon: "🛒", color: "#45B7D1", bgColor: "#F0F9FF" },
  { name: "Shopping", icon: "🛍️", color: "#FF9F43", bgColor: "#FFF8F0" },
  { name: "Bills & Utilities", icon: "📄", color: "#6C5CE7", bgColor: "#F5F3FF" },
  { name: "Entertainment", icon: "🎬", color: "#E84393", bgColor: "#FFF0F8" },
  { name: "Health & Medical", icon: "💊", color: "#00B894", bgColor: "#F0FFF8" },
  { name: "Education", icon: "📚", color: "#0984E3", bgColor: "#F0F5FF" },
  { name: "Clothing", icon: "👕", color: "#A29BFE", bgColor: "#F5F3FF" },
  { name: "Rent / EMI", icon: "🏠", color: "#FDCB6E", bgColor: "#FFFBF0" },
  { name: "Savings", icon: "💰", color: "#2ECC71", bgColor: "#F0FFF5" },
  { name: "Other", icon: "📦", color: "#636E72", bgColor: "#F5F6F7" },
] as const;

export const GOAL_PRESETS = [
  { title: "Travel / Study Abroad", icon: "✈️", color: "#4ECDC4" },
  { title: "Buy House / Rent Deposit", icon: "🏠", color: "#FF9F43" },
  { title: "Buy Vehicle", icon: "🚗", color: "#6C5CE7" },
  { title: "Wedding", icon: "💍", color: "#E84393" },
  { title: "Education Fund", icon: "🎓", color: "#0984E3" },
  { title: "Emergency Fund", icon: "🏥", color: "#00B894" },
  { title: "General Savings", icon: "💰", color: "#2ECC71" },
] as const;

export const BANKS = [
  "SBI", "HDFC", "ICICI", "Axis", "Kotak", "PNB", "Bank of Baroda",
  "Canara Bank", "Union Bank", "IndusInd", "Yes Bank", "IDFC First",
  "Paytm Payments Bank", "Fi", "Jupiter", "Other"
] as const;

export const OCCUPATIONS = [
  { value: "student", label: "Student", icon: "🎓", desc: "School or college" },
  { value: "fulltime", label: "Full-time Employee", icon: "💼", desc: "Salaried job" },
  { value: "parttime", label: "Part-time Worker", icon: "⏰", desc: "Hourly or part-time" },
  { value: "freelancer", label: "Freelancer", icon: "💻", desc: "Self-employed" },
  { value: "business", label: "Business Owner", icon: "🏢", desc: "Own a business" },
  { value: "retired", label: "Retired", icon: "🌅", desc: "Pension or savings" },
] as const;

// Smart budget defaults based on income and occupation
export function getSmartDefaults(income: number, occupation: string): Record<string, number> {
  const isStudent = occupation === "student";
  const pct = (p: number) => Math.round((income * p) / 100 / 100) * 100; // Round to nearest 100

  if (isStudent) {
    return {
      "Food & Dining": pct(30),
      "Transport": pct(10),
      "Entertainment": pct(10),
      "Education": pct(15),
      "Shopping": pct(10),
      "Other": pct(10),
    };
  }

  return {
    "Food & Dining": pct(15),
    "Transport": pct(10),
    "Groceries": pct(10),
    "Shopping": pct(8),
    "Bills & Utilities": pct(12),
    "Entertainment": pct(5),
    "Health & Medical": pct(5),
    "Rent / EMI": pct(20),
    "Other": pct(5),
  };
}

export function getCategoryIcon(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.icon || "📦";
}

export function getCategoryColor(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.color || "#636E72";
}

export function getCategoryBgColor(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.bgColor || "#F5F6F7";
}
