import { Button } from "@/components/ui/button";

interface TimeframeSelectorProps {
  selected: string;
  onSelect: (timeframe: string) => void;
}

const timeframes = [
  { label: "1s", value: "1s" },
  { label: "30s", value: "30s" },
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "1Y", value: "1y" },
];

const TimeframeSelector = ({ selected, onSelect }: TimeframeSelectorProps) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {timeframes.map((tf) => (
        <Button
          key={tf.value}
          variant={selected === tf.value ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(tf.value)}
          className={
            selected === tf.value
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border-border hover:bg-card"
          }
        >
          {tf.label}
        </Button>
      ))}
    </div>
  );
};

export default TimeframeSelector;
