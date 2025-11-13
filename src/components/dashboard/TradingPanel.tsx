import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TradingPanel = () => {
  const [amount, setAmount] = useState("");
  const [leverage, setLeverage] = useState("1");
  const { toast } = useToast();

  const handleTrade = (type: "buy" | "sell") => {
    toast({
      title: "AI Trade Initiated",
      description: `${type.toUpperCase()} order placed using Smart Money Concepts`,
    });
  };

  return (
    <Card className="p-6 bg-card border-border sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">AI Trading Bot</h2>
      </div>

      <div className="space-y-4 mb-6">
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <div className="text-sm text-muted-foreground mb-1">Bot Status</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="font-semibold text-success">Active & Trading</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
            <div className="text-lg font-bold text-success">87.5%</div>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="text-xs text-muted-foreground mb-1">Today's P&L</div>
            <div className="text-lg font-bold text-success">+$1,245</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="auto" className="mb-4">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="auto">Auto Mode</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>
        <TabsContent value="auto" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Trading Amount</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Leverage</Label>
            <Input
              type="number"
              placeholder="1x - 100x"
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          <Button className="w-full bg-gradient-primary hover:opacity-90 border-0">
            Enable Auto Trading
          </Button>
        </TabsContent>
        <TabsContent value="manual" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleTrade("buy")}
              className="bg-success hover:bg-success/90 text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              BUY
            </Button>
            <Button
              onClick={() => handleTrade("sell")}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              SELL
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-4 border-t border-border">
        <h3 className="font-semibold mb-3 text-sm">Active Strategies</h3>
        <div className="space-y-2">
          {[
            { name: "Smart Money Concept", active: true },
            { name: "Breakout Detection", active: true },
            { name: "Fractal Structure", active: true },
            { name: "Trendline Analysis", active: false },
          ].map((strategy, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{strategy.name}</span>
              <div
                className={`w-2 h-2 rounded-full ${strategy.active ? "bg-success" : "bg-muted-foreground"}`}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default TradingPanel;
