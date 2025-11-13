import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Activity, Target } from "lucide-react";

const stats = [
  {
    label: "Total Balance",
    value: "$24,580.50",
    change: "+12.5%",
    icon: DollarSign,
    trend: "up" as const,
  },
  {
    label: "Today's P&L",
    value: "+$1,245.00",
    change: "+5.3%",
    icon: TrendingUp,
    trend: "up" as const,
  },
  {
    label: "Active Trades",
    value: "8",
    change: "Running",
    icon: Activity,
    trend: "neutral" as const,
  },
  {
    label: "Win Rate",
    value: "87.5%",
    change: "+2.1%",
    icon: Target,
    trend: "up" as const,
  },
];

const PortfolioOverview = () => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card key={i} className="p-6 bg-card border-border hover:border-primary/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              {stat.trend !== "neutral" && (
                <span className={`text-sm font-medium ${stat.trend === "up" ? "text-success" : "text-destructive"}`}>
                  {stat.change}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default PortfolioOverview;
