import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

const trades = [
  {
    asset: "BTC/USD",
    type: "buy",
    entry: 42850,
    exit: 43250,
    pnl: 400,
    time: "2 hours ago",
    strategy: "Smart Money",
  },
  {
    asset: "ETH/USD",
    type: "sell",
    entry: 2290,
    exit: 2280,
    pnl: 10,
    time: "3 hours ago",
    strategy: "Breakout",
  },
  {
    asset: "Gold",
    type: "buy",
    entry: 2040,
    exit: 2045,
    pnl: 5,
    time: "5 hours ago",
    strategy: "Trendline",
  },
  {
    asset: "NIFTY",
    type: "buy",
    entry: 21800,
    exit: 21850,
    pnl: 50,
    time: "6 hours ago",
    strategy: "Fractal",
  },
];

const TradeHistory = () => {
  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-xl font-bold mb-4">Recent Trades</h2>
      <div className="space-y-3">
        {trades.map((trade, i) => {
          const isProfit = trade.pnl > 0;
          return (
            <div
              key={i}
              className="p-4 rounded-lg bg-background border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{trade.asset}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        trade.type === "buy"
                          ? "bg-success/20 text-success"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {trade.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Strategy: {trade.strategy}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${isProfit ? "text-success" : "text-destructive"}`}>
                    {isProfit ? "+" : ""}${trade.pnl}
                  </div>
                  <div className="text-xs text-muted-foreground">{isProfit ? "+0.93%" : "-0.44%"}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex gap-4">
                  <span>Entry: ${trade.entry}</span>
                  <span>Exit: ${trade.exit}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{trade.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default TradeHistory;
