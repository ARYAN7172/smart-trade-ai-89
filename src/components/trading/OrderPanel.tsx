import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const OrderPanel = () => {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("51,650");

  const orders = [
    { type: "Sell", price: "51,641", quantity: "0.5" },
    { type: "Buy", price: "51,639", quantity: "1.0" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Order Entry */}
      <div className="p-4 space-y-3 border-b border-border">
        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "market" | "limit")}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/30">
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="limit">Limit</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Qty</span>
            <select 
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-muted/30 border border-border rounded px-2 py-1 text-sm"
            >
              <option>1</option>
              <option>5</option>
              <option>10</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price</span>
            <span className="font-medium">{price}</span>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="flex-1 p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Order History</h3>
        <div className="space-y-2">
          {orders.map((order, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className={order.type === "Buy" ? "text-success" : "text-destructive"}>
                {order.type}
              </span>
              <span className="text-foreground">{order.price}</span>
              <span className="text-muted-foreground">{order.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
