import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MousePointer, Minus, TrendingUp, Type, Trash2, CircleDot } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export type DrawingTool = "select" | "trendline" | "horizontal" | "fibonacci" | "text" | "circle";

interface DrawingToolsProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onClear: () => void;
  lineColor: string;
  onLineColorChange: (color: string) => void;
  lineWidth: number;
  onLineWidthChange: (width: number) => void;
}

const tools = [
  { id: "select", icon: MousePointer, label: "Select" },
  { id: "trendline", icon: TrendingUp, label: "Trendline" },
  { id: "horizontal", icon: Minus, label: "Horizontal Line" },
  { id: "fibonacci", icon: CircleDot, label: "Fibonacci" },
  { id: "text", icon: Type, label: "Text" },
];

export const DrawingTools = ({
  activeTool,
  onToolChange,
  onClear,
  lineColor,
  onLineColorChange,
  lineWidth,
  onLineWidthChange,
}: DrawingToolsProps) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg">
      {/* Drawing Tools */}
      <div className="flex items-center gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange(tool.id as DrawingTool)}
              className="h-9 w-9 p-0"
              title={tool.label}
            >
              <Icon className="w-4 h-4" />
            </Button>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Style Settings */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <div
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: lineColor }}
            />
            Style
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-4">
            <div>
              <Label htmlFor="line-color">Line Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="line-color"
                  type="color"
                  value={lineColor}
                  onChange={(e) => onLineColorChange(e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={lineColor}
                  onChange={(e) => onLineColorChange(e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="line-width">Line Width: {lineWidth}px</Label>
              <Input
                id="line-width"
                type="range"
                min="1"
                max="5"
                value={lineWidth}
                onChange={(e) => onLineWidthChange(parseInt(e.target.value))}
                className="mt-2"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-8" />

      {/* Clear All */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        className="gap-2 text-destructive hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
        Clear All
      </Button>
    </div>
  );
};
