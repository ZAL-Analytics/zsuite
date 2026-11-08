export type Rgb = { r: number; g: number; b: number };
export type Hsv = { h: number; s: number; v: number };
export type Format = "hex" | "rgb" | "cmyk" | "hsv" | "hsl";
export type Channels = Exclude<Format, "hex">;

export const formats: Format[] = ["hex", "rgb", "cmyk", "hsv", "hsl"];

export const channelNames: Record<Channels, string[]> = {
  rgb: ["R", "G", "B"],
  cmyk: ["C", "M", "Y", "K"],
  hsv: ["H", "S", "V"],
  hsl: ["H", "S", "L"],
};

export function channelMax(format: Channels, index: number): number {
  if (format === "rgb") return 255;
  return index === 0 && format !== "cmyk" ? 360 : 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseHex(text: string): Rgb | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text.trim());
  if (match === null) return null;
  const digits = match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join("") : match[1];
  const number = parseInt(digits, 16);
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
}

export function toHex({ r, g, b }: Rgb): string {
  return "#" + [r, g, b].map((part) => Math.round(clamp(part, 0, 255)).toString(16).padStart(2, "0")).join("");
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const part = (n: number) => {
    const k = (n + h / 60) % 6;
    return (v / 100) * (1 - (s / 100) * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
  };
  return { r: part(5), g: part(3), b: part(1) };
}

export function rgbToHsv({ r, g, b }: Rgb, hue = 0): Hsv {
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let h = hue;
  if (delta > 0) {
    if (max === r) h = ((g - b) / delta + 6) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
  }
  return { h, s: max === 0 ? 0 : (delta / max) * 100, v: (max / 255) * 100 };
}

export function hsvToHsl({ h, s, v }: Hsv): Hsv {
  const value = v / 100;
  const lightness = value * (1 - s / 200);
  const saturation = lightness === 0 || lightness === 1 ? 0 : (value - lightness) / Math.min(lightness, 1 - lightness);
  return { h, s: saturation * 100, v: lightness * 100 };
}

export function hslToHsv({ h, s, v: l }: Hsv): Hsv {
  const lightness = l / 100;
  const value = lightness + (s / 100) * Math.min(lightness, 1 - lightness);
  return { h, s: value === 0 ? 0 : 2 * (1 - lightness / value) * 100, v: value * 100 };
}

export function rgbToCmyk({ r, g, b }: Rgb): number[] {
  const k = 1 - Math.max(r, g, b) / 255;
  if (k === 1) return [0, 0, 0, 100];
  return [r, g, b].map((part) => ((1 - part / 255 - k) / (1 - k)) * 100).concat(k * 100);
}

export function cmykToRgb([c, m, y, k]: number[]): Rgb {
  const part = (n: number) => 255 * (1 - n / 100) * (1 - k / 100);
  return { r: part(c), g: part(m), b: part(y) };
}

export function channels(format: Channels, hsv: Hsv): number[] {
  const rgb = hsvToRgb(hsv);
  const exact = {
    rgb: () => [rgb.r, rgb.g, rgb.b],
    cmyk: () => rgbToCmyk(rgb),
    hsv: () => [hsv.h, hsv.s, hsv.v],
    hsl: () => Object.values(hsvToHsl(hsv)),
  }[format]();
  return exact.map((value) => Math.round(value));
}

export function fromChannels(format: Channels, values: number[], previous: Hsv): Hsv {
  const [a, b, c, d] = values.map((value, index) => clamp(value, 0, channelMax(format, index)));
  if (format === "hsv") return { h: a % 360, s: b, v: c };
  if (format === "hsl") return hslToHsv({ h: a % 360, s: b, v: c });
  const rgb = format === "rgb" ? { r: a, g: b, b: c } : cmykToRgb([a, b, c, d]);
  return rgbToHsv(rgb, previous.h);
}

export function describe(format: Format, hsv: Hsv): string {
  if (format === "hex") return toHex(hsvToRgb(hsv));
  const plain = (index: number) => format === "rgb" || (format !== "cmyk" && index === 0);
  const parts = channels(format, hsv).map((value, index) => (plain(index) ? `${value}` : `${value}%`));
  return `${format}(${parts.join(", ")})`;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("hex parses short and long forms and rejects the rest", () => {
    expect(parseHex("#f80")).toEqual({ r: 255, g: 136, b: 0 });
    expect(parseHex(" 916F6F ")).toEqual({ r: 145, g: 111, b: 111 });
    expect(parseHex("#12345")).toBeNull();
    expect(parseHex("red")).toBeNull();
    expect(toHex({ r: 300, g: -4, b: 15.6 })).toBe("#ff0010");
  });

  test("hsv and rgb round-trip", () => {
    for (const hex of ["#916f6f", "#000000", "#ffffff", "#00ff80", "#123abc"]) {
      const rgb = parseHex(hex);
      expect(rgb).not.toBeNull();
      if (rgb !== null) expect(toHex(hsvToRgb(rgbToHsv(rgb)))).toBe(hex);
    }
    expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, v: 100 });
    expect(rgbToHsv({ r: 128, g: 128, b: 128 }, 200).h).toBe(200);
  });

  test("each format shows the colour and reads it back", () => {
    const hsv = rgbToHsv({ r: 255, g: 128, b: 0 });
    expect(channels("rgb", hsv)).toEqual([255, 128, 0]);
    expect(channels("cmyk", hsv)).toEqual([0, 50, 100, 0]);
    expect(channels("hsv", hsv)).toEqual([30, 100, 100]);
    expect(channels("hsl", hsv)).toEqual([30, 100, 50]);
    for (const format of ["rgb", "cmyk", "hsv", "hsl"] as const) {
      expect(toHex(hsvToRgb(fromChannels(format, channels(format, hsv), hsv)))).toBe("#ff8000");
    }
    expect(describe("rgb", hsv)).toBe("rgb(255, 128, 0)");
    expect(describe("hsl", hsv)).toBe("hsl(30, 100%, 50%)");
  });

  test("out of range values are clamped and grey keeps its hue", () => {
    expect(toHex(hsvToRgb(fromChannels("rgb", [999, -5, 0], { h: 0, s: 0, v: 0 })))).toBe("#ff0000");
    expect(fromChannels("cmyk", [0, 0, 0, 50], { h: 120, s: 50, v: 50 }).h).toBe(120);
    expect(hslToHsv({ h: 0, s: 0, v: 0 })).toEqual({ h: 0, s: 0, v: 0 });
  });
}
