import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  MousePointer2, 
  TrendingUp, 
  Minus, 
  Pencil,
  Ruler,
  ZoomIn,
  MapPin,
  Trash2,
  Move
} from "lucide-react";

export type DrawingTool = "select" | "trendline" | "horizontal" | "vertical" | "fibonacci" | "brush" | "ruler" | "marker" | "move";

interface VerticalDrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onClear: () => void;
}

const tools = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "trendline", icon: TrendingUp, label: "Trendline" },
  { id: "horizontal", icon: Minus, label: "Horizontal Line" },
  { id: "vertical", icon: Move, label: "Vertical Line", rotate: true },
  { id: "fibonacci", icon: TrendingUp, label: "Fibonacci Retracement" },
  { id: "brush", icon: Pencil, label: "Brush" },
  { id: "ruler", icon: Ruler, label: "Measure" },
  { id: "zoom", icon: ZoomIn, label: "Zoom" },
  { id: "marker", icon: MapPin, label: "Marker" },
];

export const VerticalDrawingToolbar = ({
  activeTool,
  onToolChange,
  onClear,
}: VerticalDrawingToolbarProps) => {
  return (
    <div className="h-full flex flex-col items-center gap-2 py-4 bg-transparent">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onToolChange(tool.id as DrawingTool)}
                className={`h-9 w-9 ${
                  activeTool === tool.id 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                } ${tool.rotate ? 'rotate-90' : ''}`}
              >
                <Icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
      
      <div className="my-2 h-px bg-border/30" />
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-9 w-9 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Clear All Drawings</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};