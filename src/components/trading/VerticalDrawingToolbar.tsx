import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  MousePointer2, 
  TrendingUp, 
  Minus, 
  Pencil,
  Ruler,
  MapPin,
  Trash2,
  Move,
  Square,
  ArrowUpCircle,
  ArrowDownCircle,
  GitBranch,
  Undo2
} from "lucide-react";

export type DrawingTool = 
  | "select" 
  | "trendline" 
  | "horizontal" 
  | "vertical" 
  | "fibonacci" 
  | "brush" 
  | "ruler" 
  | "marker" 
  | "move"
  | "rectangle"
  | "longPosition"
  | "shortPosition"
  | "ray"
  | "channel";

interface VerticalDrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onClear: () => void;
  onUndo?: () => void;
}

const tools: { id: DrawingTool; icon: any; label: string; rotate?: boolean; separator?: boolean }[] = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "trendline", icon: TrendingUp, label: "Trendline", separator: true },
  { id: "ray", icon: TrendingUp, label: "Ray" },
  { id: "horizontal", icon: Minus, label: "Horizontal Line" },
  { id: "vertical", icon: Move, label: "Vertical Line", rotate: true },
  { id: "channel", icon: GitBranch, label: "Parallel Channel", separator: true },
  { id: "fibonacci", icon: TrendingUp, label: "Fibonacci Retracement" },
  { id: "rectangle", icon: Square, label: "Rectangle", separator: true },
  { id: "longPosition", icon: ArrowUpCircle, label: "Long Position" },
  { id: "shortPosition", icon: ArrowDownCircle, label: "Short Position", separator: true },
  { id: "brush", icon: Pencil, label: "Free Draw" },
  { id: "ruler", icon: Ruler, label: "Measure" },
  { id: "marker", icon: MapPin, label: "Marker" },
];

export const VerticalDrawingToolbar = ({
  activeTool,
  onToolChange,
  onClear,
  onUndo,
}: VerticalDrawingToolbarProps) => {
  return (
    <div className="h-full flex flex-col items-center gap-1 py-4 bg-transparent">
      {tools.map((tool, index) => {
        const Icon = tool.icon;
        return (
          <div key={tool.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onToolChange(tool.id)}
                  className={`h-8 w-8 ${
                    activeTool === tool.id 
                      ? "bg-primary/20 text-primary border border-primary/30" 
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
            {tool.separator && <div className="my-1.5 w-6 h-px bg-border/30 mx-auto" />}
          </div>
        );
      })}
      
      <div className="flex-1" />
      
      {onUndo && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/10"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Undo</p>
          </TooltipContent>
        </Tooltip>
      )}
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Clear All</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
