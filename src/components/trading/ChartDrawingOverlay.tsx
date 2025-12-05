import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Canvas as FabricCanvas, Line, Rect, Triangle, Circle, Group, FabricText, FabricObject } from "fabric";

export type ChartDrawingTool = 
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

interface ChartDrawingOverlayProps {
  activeTool: ChartDrawingTool;
  width: number;
  height: number;
  onToolComplete?: () => void;
}

export interface ChartDrawingOverlayRef {
  clearAll: () => void;
  undo: () => void;
}

export const ChartDrawingOverlay = forwardRef<ChartDrawingOverlayRef, ChartDrawingOverlayProps>(
  ({ activeTool, width, height, onToolComplete }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<FabricCanvas | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const tempObjectRef = useRef<FabricObject | null>(null);
    const historyRef = useRef<string[]>([]);

    useImperativeHandle(ref, () => ({
      clearAll: () => {
        if (fabricRef.current) {
          fabricRef.current.clear();
          fabricRef.current.backgroundColor = "transparent";
          fabricRef.current.renderAll();
          historyRef.current = [];
        }
      },
      undo: () => {
        if (fabricRef.current && historyRef.current.length > 0) {
          historyRef.current.pop();
          const lastState = historyRef.current[historyRef.current.length - 1];
          if (lastState) {
            fabricRef.current.loadFromJSON(JSON.parse(lastState)).then(() => {
              fabricRef.current?.renderAll();
            });
          } else {
            fabricRef.current.clear();
            fabricRef.current.backgroundColor = "transparent";
            fabricRef.current.renderAll();
          }
        }
      },
    }));

    // Initialize Fabric canvas
    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = new FabricCanvas(canvasRef.current, {
        width,
        height,
        backgroundColor: "transparent",
        selection: activeTool === "select",
      });

      // Initialize brush only if it exists
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = "#2962ff";
        canvas.freeDrawingBrush.width = 2;
      }

      fabricRef.current = canvas;

      return () => {
        canvas.dispose();
        fabricRef.current = null;
      };
    }, []);

    // Update canvas size
    useEffect(() => {
      if (fabricRef.current) {
        fabricRef.current.setDimensions({ width, height });
        fabricRef.current.renderAll();
      }
    }, [width, height]);

    // Update tool mode
    useEffect(() => {
      if (!fabricRef.current) return;

      fabricRef.current.isDrawingMode = activeTool === "brush";
      fabricRef.current.selection = activeTool === "select";

      if (activeTool === "brush" && fabricRef.current.freeDrawingBrush) {
        fabricRef.current.freeDrawingBrush.color = "#2962ff";
        fabricRef.current.freeDrawingBrush.width = 2;
      }

      // Update cursor
      fabricRef.current.defaultCursor = activeTool === "select" ? "default" : "crosshair";
      fabricRef.current.hoverCursor = activeTool === "select" ? "move" : "crosshair";
    }, [activeTool]);

    const saveState = useCallback(() => {
      if (fabricRef.current) {
        const json = JSON.stringify(fabricRef.current.toJSON());
        historyRef.current.push(json);
      }
    }, []);

    // Create Fibonacci retracement
    const createFibonacci = useCallback((x1: number, y1: number, x2: number, y2: number) => {
      const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      const colors = ['#ff5252', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#e91e63'];
      const objects: FabricObject[] = [];

      levels.forEach((level, i) => {
        const y = y1 + (y2 - y1) * level;
        
        const line = new Line([0, y, width, y], {
          stroke: colors[i],
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
        });
        
        const text = new FabricText(`${(level * 100).toFixed(1)}%`, {
          left: 5,
          top: y - 12,
          fontSize: 10,
          fill: colors[i],
          selectable: false,
        });
        
        objects.push(line, text);
      });

      const group = new Group(objects, {
        selectable: true,
        hasControls: true,
      });

      return group;
    }, [width]);

    // Create Long Position (green arrow up with entry/TP/SL)
    const createLongPosition = useCallback((x: number, y: number) => {
      const entryPrice = y;
      const tpPrice = y - 60;
      const slPrice = y + 40;

      const objects: FabricObject[] = [
        // Entry line
        new Line([x - 80, entryPrice, x + 80, entryPrice], {
          stroke: '#2196f3',
          strokeWidth: 2,
          selectable: false,
        }),
        // Take Profit line
        new Line([x - 80, tpPrice, x + 80, tpPrice], {
          stroke: '#26a69a',
          strokeWidth: 2,
          selectable: false,
        }),
        // Stop Loss line
        new Line([x - 80, slPrice, x + 80, slPrice], {
          stroke: '#ef5350',
          strokeWidth: 2,
          selectable: false,
        }),
        // Profit zone
        new Rect({
          left: x - 80,
          top: tpPrice,
          width: 160,
          height: entryPrice - tpPrice,
          fill: 'rgba(38, 166, 154, 0.2)',
          selectable: false,
        }),
        // Loss zone
        new Rect({
          left: x - 80,
          top: entryPrice,
          width: 160,
          height: slPrice - entryPrice,
          fill: 'rgba(239, 83, 80, 0.2)',
          selectable: false,
        }),
        // Arrow up
        new Triangle({
          left: x - 8,
          top: entryPrice - 30,
          width: 16,
          height: 20,
          fill: '#26a69a',
          selectable: false,
        }),
        // Labels
        new FabricText('TP', { left: x + 85, top: tpPrice - 8, fontSize: 11, fill: '#26a69a', selectable: false }),
        new FabricText('Entry', { left: x + 85, top: entryPrice - 8, fontSize: 11, fill: '#2196f3', selectable: false }),
        new FabricText('SL', { left: x + 85, top: slPrice - 8, fontSize: 11, fill: '#ef5350', selectable: false }),
      ];

      return new Group(objects, { selectable: true, hasControls: true });
    }, []);

    // Create Short Position (red arrow down with entry/TP/SL)
    const createShortPosition = useCallback((x: number, y: number) => {
      const entryPrice = y;
      const slPrice = y - 40;
      const tpPrice = y + 60;

      const objects: FabricObject[] = [
        // Entry line
        new Line([x - 80, entryPrice, x + 80, entryPrice], {
          stroke: '#2196f3',
          strokeWidth: 2,
          selectable: false,
        }),
        // Stop Loss line
        new Line([x - 80, slPrice, x + 80, slPrice], {
          stroke: '#ef5350',
          strokeWidth: 2,
          selectable: false,
        }),
        // Take Profit line
        new Line([x - 80, tpPrice, x + 80, tpPrice], {
          stroke: '#26a69a',
          strokeWidth: 2,
          selectable: false,
        }),
        // Loss zone
        new Rect({
          left: x - 80,
          top: slPrice,
          width: 160,
          height: entryPrice - slPrice,
          fill: 'rgba(239, 83, 80, 0.2)',
          selectable: false,
        }),
        // Profit zone
        new Rect({
          left: x - 80,
          top: entryPrice,
          width: 160,
          height: tpPrice - entryPrice,
          fill: 'rgba(38, 166, 154, 0.2)',
          selectable: false,
        }),
        // Arrow down
        new Triangle({
          left: x - 8,
          top: entryPrice + 10,
          width: 16,
          height: 20,
          fill: '#ef5350',
          angle: 180,
          selectable: false,
        }),
        // Labels
        new FabricText('SL', { left: x + 85, top: slPrice - 8, fontSize: 11, fill: '#ef5350', selectable: false }),
        new FabricText('Entry', { left: x + 85, top: entryPrice - 8, fontSize: 11, fill: '#2196f3', selectable: false }),
        new FabricText('TP', { left: x + 85, top: tpPrice - 8, fontSize: 11, fill: '#26a69a', selectable: false }),
      ];

      return new Group(objects, { selectable: true, hasControls: true });
    }, []);

    // Mouse event handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (!fabricRef.current || activeTool === "select" || activeTool === "brush" || activeTool === "move" || activeTool === "ruler") return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Single-click tools
      if (activeTool === "marker") {
        const marker = new Circle({
          left: x - 8,
          top: y - 8,
          radius: 8,
          fill: '#2962ff',
          stroke: '#ffffff',
          strokeWidth: 2,
        });
        fabricRef.current.add(marker);
        saveState();
        onToolComplete?.();
        return;
      }

      if (activeTool === "longPosition") {
        const position = createLongPosition(x, y);
        fabricRef.current.add(position);
        saveState();
        onToolComplete?.();
        return;
      }

      if (activeTool === "shortPosition") {
        const position = createShortPosition(x, y);
        fabricRef.current.add(position);
        saveState();
        onToolComplete?.();
        return;
      }

      if (activeTool === "horizontal") {
        const line = new Line([0, y, width, y], {
          stroke: '#2962ff',
          strokeWidth: 2,
        });
        fabricRef.current.add(line);
        saveState();
        onToolComplete?.();
        return;
      }

      if (activeTool === "vertical") {
        const line = new Line([x, 0, x, height], {
          stroke: '#2962ff',
          strokeWidth: 2,
        });
        fabricRef.current.add(line);
        saveState();
        onToolComplete?.();
        return;
      }

      // Drag-based tools
      setIsDrawing(true);
      setStartPoint({ x, y });

      if (activeTool === "trendline" || activeTool === "ray") {
        const line = new Line([x, y, x, y], {
          stroke: '#2962ff',
          strokeWidth: 2,
        });
        fabricRef.current.add(line);
        tempObjectRef.current = line;
      } else if (activeTool === "rectangle") {
        const rectObj = new Rect({
          left: x,
          top: y,
          width: 0,
          height: 0,
          fill: 'rgba(41, 98, 255, 0.1)',
          stroke: '#2962ff',
          strokeWidth: 2,
        });
        fabricRef.current.add(rectObj);
        tempObjectRef.current = rectObj;
      } else if (activeTool === "channel") {
        // Channel starts with first line
        const line = new Line([x, y, x, y], {
          stroke: '#2962ff',
          strokeWidth: 2,
        });
        fabricRef.current.add(line);
        tempObjectRef.current = line;
      }
    }, [activeTool, width, height, createLongPosition, createShortPosition, saveState, onToolComplete]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (!isDrawing || !startPoint || !fabricRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (activeTool === "trendline" || activeTool === "ray" || activeTool === "channel") {
        if (tempObjectRef.current && tempObjectRef.current instanceof Line) {
          tempObjectRef.current.set({ x2: x, y2: y });
          fabricRef.current.renderAll();
        }
      } else if (activeTool === "rectangle") {
        if (tempObjectRef.current && tempObjectRef.current instanceof Rect) {
          const newWidth = Math.abs(x - startPoint.x);
          const newHeight = Math.abs(y - startPoint.y);
          const left = Math.min(x, startPoint.x);
          const top = Math.min(y, startPoint.y);
          tempObjectRef.current.set({ left, top, width: newWidth, height: newHeight });
          fabricRef.current.renderAll();
        }
      } else if (activeTool === "fibonacci") {
        // Remove previous temp fibonacci
        if (tempObjectRef.current) {
          fabricRef.current.remove(tempObjectRef.current);
        }
        const fib = createFibonacci(startPoint.x, startPoint.y, x, y);
        fabricRef.current.add(fib);
        tempObjectRef.current = fib;
        fabricRef.current.renderAll();
      }
    }, [isDrawing, startPoint, activeTool, createFibonacci]);

    const handleMouseUp = useCallback(() => {
      if (!isDrawing) return;

      setIsDrawing(false);
      setStartPoint(null);
      tempObjectRef.current = null;
      saveState();
      onToolComplete?.();
    }, [isDrawing, saveState, onToolComplete]);

    const showOverlay = activeTool !== "select" && activeTool !== "move" && activeTool !== "ruler";

    return (
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 z-10"
        style={{
          pointerEvents: showOverlay ? "auto" : "none",
          cursor: showOverlay ? "crosshair" : "default",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    );
  }
);

ChartDrawingOverlay.displayName = "ChartDrawingOverlay";
