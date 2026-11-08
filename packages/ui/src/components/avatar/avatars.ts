export const TRAITS = ["skin", "hair", "hairColor", "beard", "eyes", "eyeColor", "mouth", "glasses", "headwear", "outfit", "outfitColor", "background", "gender", "marks"] as const;
export type Trait = (typeof TRAITS)[number];
export type Character = Record<Trait, number>;

export const COUNTS: Character = { skin: 8, hair: 24, hairColor: 10, beard: 6, eyes: 4, eyeColor: 6, mouth: 3, glasses: 5, headwear: 5, outfit: 18, outfitColor: 8, background: 8, gender: 2, marks: 6 };

export const SKINS = ["#FBE3D2", "#F3D0B5", "#E6B590", "#D29E74", "#B57B52", "#94603A", "#6F4529", "#4E2F1C"];
export const HAIRS = ["#1C1714", "#3B2618", "#6B4426", "#8C3B1F", "#C8642B", "#B48A4E", "#E3C27A", "#EFE3C4", "#9C9A96", "#E8E6E1"];
export const SCARVES = ["#2F3E5C", "#6B2E3E", "#3C6E5A", "#8A6A3A", "#4A4A52", "#B5546A", "#2E6F8E", "#7A5A9A", "#C9A27E", "#E8E2D8"];
export const EYES = ["#5A3520", "#1E1A18", "#7A5A2E", "#3F7A4A", "#3D6FA8", "#6F7B85"];
export const CLOTHES = ["#1F3A5F", "#3E6FB0", "#2F7D6D", "#4C7A34", "#8A2F3C", "#C8722A", "#5B4B8A", "#3A3F45"];
export const BACKGROUNDS = ["#DCEBFA", "#DDF2E6", "#FDF0D2", "#FBE1DE", "#ECE3F7", "#E2E8EE", "#D7F0F2", "#F6E3EE"];
export const SCARVED = [11, 21];
export const SHADE = "rgb(0 0 0 / 0.18)";

export const MAN = 0;
export const WOMAN = 1;
const GENDERED: Partial<Record<Trait, [number[], number[]]>> = {
  hair: [
    [2, 0, 1, 3, 4, 20, 22, 5, 6, 15, 16, 18, 8, 14, 21],
    [8, 7, 9, 12, 13, 17, 23, 19, 5, 6, 10, 14, 18, 11],
  ],
  beard: [[0, 1, 2, 3, 4, 5], [0]],
  outfit: [
    [0, 1, 2, 3, 15, 4, 13, 12, 16, 5, 6, 14, 7, 8, 9],
    [0, 1, 10, 11, 17, 4, 13, 12, 16, 5, 6, 14, 7, 8, 9],
  ],
};

export function optionsOf(trait: Trait, gender: number): number[] {
  return GENDERED[trait]?.[gender] ?? Array.from({ length: COUNTS[trait] }, (_, index) => index);
}

export function fitted(character: Character): Character {
  const fit = { ...character };
  for (const trait of TRAITS) {
    const options = optionsOf(trait, fit.gender);
    if (!options.includes(fit[trait])) fit[trait] = options[0];
  }
  return fit;
}

export const DEFAULT_CHARACTER: Character = { skin: 2, hair: 2, hairColor: 1, beard: 0, eyes: 0, eyeColor: 0, mouth: 0, glasses: 0, headwear: 0, outfit: 0, outfitColor: 0, background: 0, gender: 0, marks: 0 };

export function keyOf(character: Character): string {
  return TRAITS.map((trait) => character[trait].toString(36)).join("");
}

const OLD_SKINS = [0, 2, 3, 4, 5, 7];
const OLD_HAIRS = [1, 2, 5, 6, 1, 0];

export function characterOf(key: string): Character | null {
  const old = /^([fm])([1-6])([ab])$/.exec(key);
  if (old) {
    const skin = Number(old[2]) - 1;
    const feminine = old[1] === "f";
    return {
      ...DEFAULT_CHARACTER,
      skin: OLD_SKINS[skin],
      hair: feminine ? (old[3] === "a" ? 8 : 9) : 2,
      hairColor: OLD_HAIRS[(skin + (old[3] === "a" ? 0 : 3)) % 6],
      beard: !feminine && old[3] === "b" ? 4 : 0,
      eyes: 3,
      eyeColor: 1,
      background: 5,
      gender: feminine ? WOMAN : MAN,
    };
  }
  if (key.length === TRAITS.length - 2 || key.length === TRAITS.length - 1) key = key.padEnd(TRAITS.length, "0");
  if (key.length !== TRAITS.length) return null;
  const character = { ...DEFAULT_CHARACTER };
  for (const [index, trait] of TRAITS.entries()) {
    const value = parseInt(key[index], 36);
    if (!(value < COUNTS[trait])) return null;
    character[trait] = value;
  }
  return character;
}

export function randomCharacter(gender: number): Character {
  const character = { ...DEFAULT_CHARACTER, gender };
  for (const trait of TRAITS) {
    if (trait === "gender") continue;
    const options = optionsOf(trait, gender);
    character[trait] = options[Math.floor(Math.random() * options.length)];
  }
  if (Math.random() < 0.5) character.beard = 0;
  if (Math.random() < 0.5) character.glasses = 0;
  if (Math.random() < 0.7) character.headwear = 0;
  if (Math.random() < 0.5) character.marks = 0;
  return character;
}

export type Look = { kind: "character"; character: Character } | { kind: "image"; src: string } | { kind: "initials"; text: string };

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** An avatar string that is a picture: a path, a web address or a data or blob URL. */
export const isImageUrl = (avatar: string) => /^(\/|https?:|data:image\/|blob:)/.test(avatar);

/** `preset:<key>` draws a character, a picture (see `isImage`) shows it, anything else shows the name's initials. */
export function lookOf(avatar: string, name: string, isImage: (avatar: string) => boolean = isImageUrl): Look {
  if (avatar.startsWith("preset:")) {
    const character = characterOf(avatar.slice("preset:".length));
    if (character) return { kind: "character", character };
  }
  if (isImage(avatar)) return { kind: "image", src: avatar };
  return { kind: "initials", text: initialsOf(name) };
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("a character survives its key, and every trait has a digit", () => {
    const character = { ...DEFAULT_CHARACTER, hair: 23, outfit: 17, background: 7, gender: WOMAN };
    expect(keyOf(character)).toHaveLength(14);
    expect(characterOf(keyOf(character))).toEqual(character);
    expect(characterOf("00000000000z0")).toBeNull();
    expect(characterOf("220000000000")).toMatchObject({ hair: 2, gender: MAN, marks: 0 });
    expect(characterOf("2200000000001")).toMatchObject({ gender: WOMAN, marks: 0 });
    expect(characterOf("22000000000015")).toMatchObject({ gender: WOMAN, marks: 5 });
    expect(characterOf("22000000000016")).toBeNull();
    expect(characterOf("0000")).toBeNull();
  });

  test("a woman gets no beard or tie, and random characters stay within their gender", () => {
    const woman = fitted({ ...DEFAULT_CHARACTER, gender: WOMAN, hair: 16, beard: 4, outfit: 2 });
    expect(woman).toMatchObject({ hair: 8, beard: 0, outfit: 0 });
    expect(fitted(woman)).toEqual(woman);
    for (const gender of [MAN, WOMAN]) {
      for (let run = 0; run < 20; run++) {
        const character = randomCharacter(gender);
        expect(fitted(character)).toEqual(character);
        expect(characterOf(keyOf(character))).toEqual(character);
      }
    }
  });

  test("the old 24 characters still draw", () => {
    expect(characterOf("f1a")).toMatchObject({ skin: 0, hair: 8, gender: WOMAN });
    expect(characterOf("m6b")).toMatchObject({ skin: 7, hair: 2, beard: 4 });
  });

  test("an avatar is a character, a picture or initials", () => {
    expect(lookOf("preset:m3b", "Auke").kind).toBe("character");
    expect(lookOf("preset:2200000000000", "Auke").kind).toBe("character");
    expect(lookOf("preset:x9z", "Auke Test")).toEqual({ kind: "initials", text: "AT" });
    expect(lookOf("/files/4", "Auke")).toEqual({ kind: "image", src: "/files/4" });
    expect(lookOf("https://example.com/a.png", "Auke").kind).toBe("image");
    expect(lookOf("/files/4", "Auke", () => false)).toEqual({ kind: "initials", text: "A" });
    expect(lookOf("", "  ")).toEqual({ kind: "initials", text: "?" });
    expect(lookOf("", "arsalan")).toEqual({ kind: "initials", text: "A" });
  });
}
