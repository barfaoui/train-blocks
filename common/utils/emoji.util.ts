const EMOJI_START = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator})/u;

type GraphemeSegmenter = { segment: (value: string) => Iterable<{ segment: string }> };

// Older browsers lack Intl.Segmenter; they fall back to the first code point, which
// splits joined emoji but never breaks the page.
const segmenter = (
  Intl as unknown as {
    Segmenter?: new (locale?: string, options?: { granularity: 'grapheme' }) => GraphemeSegmenter;
  }
).Segmenter;
const graphemes = segmenter ? new segmenter(undefined, { granularity: 'grapheme' }) : null;

function firstCharacter(value: string): string | undefined {
  if (graphemes) {
    return graphemes.segment(value)[Symbol.iterator]().next().value?.segment;
  }
  return [...value][0];
}

// The first emoji of a string, whole (skin tone, joined sequence or flag), or null when the
// string doesn't start with one. Anything after that emoji is dropped.
export function firstEmoji(value: string): string | null {
  const first = firstCharacter(value.trim());
  return first && EMOJI_START.test(first) ? first : null;
}
