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
    <div className="flex flex-col gap-1 p-2 bg-card/95 backdrop-blur-sm border-r border-border h-full">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool.id ? "default" : "ghost"}
                size="icon"
                onClick={() => onToolChange(tool.id as DrawingTool)}
                className={`h-10 w-10 ${tool.rotate ? 'rotate-90' : ''}`}
              >
                <Icon className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
      
      <div className="my-2 h-px bg-border" />
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Clear All Drawings</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};