import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";

interface AutoTradingChartsProps {
  isEnabled: boolean;
}

const AutoTradingCharts = ({ isEnabled }: AutoTradingChartsProps) => {
  const [priceData, setPriceData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTrades: 0,
    profitableTrades: 0,
    currentProfit: 0,
    avgWinRate: 87.5
  });

  // Generate initial data
  useEffect(() => {
    const generateInitialData = () => {
      const now = Date.now();
      const data = [];
      for (let i = 30; i >= 0; i--) {
        data.push({
          time: new Date(now - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: 92000 + Math.random() * 2000,
          volume: Math.random() * 100
        });
      }
      return data;
    };

    const generatePerformanceData = () => {
      const data = [];
      let balance = 24580;
      for (let i = 30; i >= 0; i--) {
        balance += (Math.random() - 0.4) * 500;
        data.push({
          time: new Date(Date.now() - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          balance: Math.round(balance),
          profit: Math.round(balance - 24580)
        });
      }
      return data;
    };

    setPriceData(generateInitialData());
    setPerformanceData(generatePerformanceData());
  }, []);

  // Update data in real-time when auto trading is enabled
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      setPriceData(prev => {
        const lastPrice = prev[prev.length - 1]?.price || 92000;
        const newPrice = lastPrice + (Math.random() - 0.5) * 200;
        const newData = [...prev.slice(1), {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: newPrice,
          volume: Math.random() * 100
        }];
        return newData;
      });

      setPerformanceData(prev => {
        const lastBalance = prev[prev.length - 1]?.balance || 24580;
        const change = (Math.random() - 0.35) * 300;
        const newBalance = lastBalance + change;
        const newData = [...prev.slice(1), {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          balance: Math.round(newBalance),
          profit: Math.round(newBalance - 24580)
        }];
        return newData;
      });

      // Update stats
      setStats(prev => ({
        totalTrades: prev.totalTrades + 1,
        profitableTrades: prev.profitableTrades + (Math.random() > 0.2 ? 1 : 0),
        currentProfit: prev.currentProfit + (Math.random() - 0.3) * 150,
        avgWinRate: ((prev.profitableTrades / (prev.totalTrades || 1)) * 100).toFixed(1) as any
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isEnabled]);

  if (!isEnabled) return null;

  const lastPerformance = performanceData[performanceData.length - 1];
  const profitChange = lastPerformance?.profit || 0;
  const isProfitable = profitChange >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalTrades}</div>
          <div className="text-xs text-muted-foreground">Trades Executed</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-xs text-muted-foreground">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-success">{stats.avgWinRate}%</div>
          <div className="text-xs text-muted-foreground">{stats.profitableTrades} Profitable</div>
        </Card>

        <Card className={`p-4 bg-gradient-to-br ${isProfitable ? 'from-success/10 to-success/5 border-success/20' : 'from-destructive/10 to-destructive/5 border-destructive/20'}`}>
          <div className="flex items-center justify-between mb-2">
            <DollarSign className={`w-5 h-5 ${isProfitable ? 'text-success' : 'text-destructive'}`} />
            <span className="text-xs text-muted-foreground">P&L</span>
          </div>
          <div className={`text-2xl font-bold ${isProfitable ? 'text-success' : 'text-destructive'}`}>
            {isProfitable ? '+' : ''}{profitChange.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">Session Profit</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-accent" />
            <span className="text-xs text-muted-foreground">Balance</span>
          </div>
          <div className="text-2xl font-bold">${lastPerformance?.balance.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Current Value</div>
        </Card>
      </div>

      {/* Price Chart */}
      <Card className="p-6 bg-card border-border">
        <div className="mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Live Market Price
          </h3>
          <p className="text-sm text-muted-foreground">Real-time price movements with AI trading signals</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={priceData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              domain={['dataMin - 500', 'dataMax + 500']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Performance Chart */}
      <Card className="p-6 bg-card border-border">
        <div className="mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            {isProfitable ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
            Portfolio Performance
          </h3>
          <p className="text-sm text-muted-foreground">Live balance and profit tracking</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
              name="Balance ($)"
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke={isProfitable ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
              strokeWidth={2}
              dot={false}
              name="Profit/Loss ($)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default AutoTradingCharts;
