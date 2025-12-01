import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface ChartSettingsType {
  colors: {
    bullish: string;
    bearish: string;
    volumeBullish: string;
    volumeBearish: string;
    gridLines: string;
    ma20: string;
    ma50: string;
    background: string;
  };
  candlestickStyle: "regular" | "hollow" | "heikin-ashi";
  gridOpacity: number;
  theme: "dark" | "darker" | "darkest";
}

const defaultSettings: ChartSettingsType = {
  colors: {
    bullish: "#26a69a",
    bearish: "#ef5350",
    volumeBullish: "#26a69a66",
    volumeBearish: "#ef535066",
    gridLines: "#2a2e39",
    ma20: "#2962ff",
    ma50: "#ff6d00",
    background: "#131722",
  },
  candlestickStyle: "regular",
  gridOpacity: 0.15,
  theme: "dark",
};

const themeBackgrounds = {
  dark: "#131722",
  darker: "#0d111c",
  darkest: "#050810",
};

interface ChartSettingsProps {
  settings: ChartSettingsType;
  onSettingsChange: (settings: ChartSettingsType) => void;
}

export const ChartSettings = ({ settings, onSettingsChange }: ChartSettingsProps) => {
  const [localSettings, setLocalSettings] = useState<ChartSettingsType>(settings);
  const [presets, setPresets] = useState<{ name: string; settings: ChartSettingsType }[]>([]);
  const [presetName, setPresetName] = useState("");
  const [open, setOpen] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chartPresets");
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  }, []);

  // Save presets to localStorage
  const savePresetsToStorage = (newPresets: { name: string; settings: ChartSettingsType }[]) => {
    localStorage.setItem("chartPresets", JSON.stringify(newPresets));
    setPresets(newPresets);
  };

  const handleColorChange = (key: keyof ChartSettingsType["colors"], value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const handleApply = () => {
    onSettingsChange(localSettings);
    localStorage.setItem("chartSettings", JSON.stringify(localSettings));
    toast.success("Chart settings applied");
    setOpen(false);
  };

  const handleReset = () => {
    setLocalSettings(defaultSettings);
    toast.info("Settings reset to default");
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    const newPresets = [...presets, { name: presetName, settings: localSettings }];
    savePresetsToStorage(newPresets);
    toast.success(`Preset "${presetName}" saved`);
    setPresetName("");
  };

  const handleLoadPreset = (preset: { name: string; settings: ChartSettingsType }) => {
    setLocalSettings(preset.settings);
    toast.success(`Preset "${preset.name}" loaded`);
  };

  const handleDeletePreset = (name: string) => {
    const newPresets = presets.filter((p) => p.name !== name);
    savePresetsToStorage(newPresets);
    toast.success(`Preset "${name}" deleted`);
  };

  const handleThemeChange = (theme: "dark" | "darker" | "darkest") => {
    setLocalSettings((prev) => ({
      ...prev,
      theme,
      colors: { ...prev.colors, background: themeBackgrounds[theme] },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
          <Settings className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chart Settings</DialogTitle>
          <DialogDescription>Customize your chart appearance and save presets</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="colors" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bullish">Bullish Candle</Label>
                <div className="flex gap-2">
                  <Input
                    id="bullish"
                    type="color"
                    value={localSettings.colors.bullish}
                    onChange={(e) => handleColorChange("bullish", e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={localSettings.colors.bullish}
                    onChange={(e) => handleColorChange("bullish", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bearish">Bearish Candle</Label>
                <div className="flex gap-2">
                  <Input
                    id="bearish"
                    type="color"
                    value={localSettings.colors.bearish}
                    onChange={(e) => handleColorChange("bearish", e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={localSettings.colors.bearish}
                    onChange={(e) => handleColorChange("bearish", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="volumeBullish">Volume Bullish</Label>
                <div className="flex gap-2">
                  <Input
                    id="volumeBullish"
                    type="color"
                    value={localSettings.colors.volumeBullish}
                    onChange={(e) => handleColorChange("volumeBullish", e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={localSettings.colors.volumeBullish}
                    onChange={(e) => handleColorChange("volumeBullish", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="volumeBearish">Volume Bearish</Label>
                <div className="flex gap-2">
                  <Input
                    id="volumeBearish"
                    type="color"
                    value={localSettings.colors.volumeBearish}
                    onChange={(e) => handleColorChange("volumeBearish", e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={localSettings.colors.volumeBearish}
                    onChange={(e) => handleColorChange("volumeBearish", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ma20">MA20 Line</Label>
                <div className="flex gap-2">
                  <Input
                    id="ma20"
                    type="color"
                    value={localSettings.colors.ma20}
                    onChange={(e) => handleColorChange("ma20", e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={localSettings.colors.ma20}
                    onChange={(e) => handleColorChange("ma20", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ma50">MA50 Line</Label>
                <div className="flex gap-2">
                  <Input
                    id="ma50"
                    type="color"
                    value={localSettings.colors.ma50}
                    onChange={(e) => handleColorChange("ma50", e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={localSettings.colors.ma50}
                    onChange={(e) => handleColorChange("ma50", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gridLines">Grid Lines</Label>
                <div className="flex gap-2">
                  <Input
                    id="gridLines"
                    type="color"
                    value={localSettings.colors.gridLines}
                    onChange={(e) => handleColorChange("gridLines", e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={localSettings.colors.gridLines}
                    onChange={(e) => handleColorChange("gridLines", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Candlestick Style</Label>
              <Select
                value={localSettings.candlestickStyle}
                onValueChange={(value: "regular" | "hollow" | "heikin-ashi") =>
                  setLocalSettings((prev) => ({ ...prev, candlestickStyle: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular (Filled)</SelectItem>
                  <SelectItem value="hollow">Hollow Candles</SelectItem>
                  <SelectItem value="heikin-ashi">Heikin-Ashi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grid Line Opacity: {(localSettings.gridOpacity * 100).toFixed(0)}%</Label>
              <Slider
                value={[localSettings.gridOpacity * 100]}
                onValueChange={([value]) =>
                  setLocalSettings((prev) => ({ ...prev, gridOpacity: value / 100 }))
                }
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Background Theme</Label>
              <div className="grid grid-cols-3 gap-4">
                {(["dark", "darker", "darkest"] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`h-24 rounded-lg border-2 transition-all ${
                      localSettings.theme === theme
                        ? "border-primary shadow-lg"
                        : "border-border hover:border-primary/50"
                    }`}
                    style={{ backgroundColor: themeBackgrounds[theme] }}
                  >
                    <span className="text-xs font-semibold capitalize text-foreground">
                      {theme}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background">Custom Background</Label>
              <div className="flex gap-2">
                <Input
                  id="background"
                  type="color"
                  value={localSettings.colors.background}
                  onChange={(e) => handleColorChange("background", e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localSettings.colors.background}
                  onChange={(e) => handleColorChange("background", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="presets" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Save Current Settings as Preset</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
                <Button onClick={handleSavePreset} size="sm">
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Saved Presets</Label>
              {presets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No presets saved yet</p>
              ) : (
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <div
                      key={preset.name}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <span className="text-sm font-medium">{preset.name}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLoadPreset(preset)}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePreset(preset.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <Button onClick={handleApply}>Apply Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to load settings from localStorage
export const useChartSettings = () => {
  const [settings, setSettings] = useState<ChartSettingsType>(() => {
    const saved = localStorage.getItem("chartSettings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  return { settings, setSettings };
};
