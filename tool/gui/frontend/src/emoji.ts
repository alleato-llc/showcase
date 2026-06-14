// A curated palette for the emoji picker — common project/tech glyphs grouped
// loosely. Not exhaustive; the field also accepts free text/paste.
export const emojiGroups: { label: string; emojis: string[] }[] = [
  {
    label: "Tools & apps",
    emojis: ["🧮", "🧰", "🛠️", "⚙️", "🔧", "🔨", "🪛", "📦", "🗜️", "🧪", "🔬", "📐", "📏", "🧭", "🗂️", "📋", "📊", "📈", "🧯"],
  },
  {
    label: "Code & data",
    emojis: ["💻", "🖥️", "⌨️", "🖱️", "🐚", "🌐", "🔗", "🧩", "🗃️", "🗄️", "💾", "💿", "📀", "🔌", "🧱", "🔣", "🔢", "🆔", "📡"],
  },
  {
    label: "Media & art",
    emojis: ["🎨", "🖌️", "🖍️", "🎬", "🎞️", "📷", "📸", "🎥", "🎵", "🎶", "🎚️", "🎛️", "🎙️", "🔊", "🖼️", "✏️", "📝", "📖", "📚"],
  },
  {
    label: "Nature & misc",
    emojis: ["🌳", "🌲", "🌿", "🍃", "🌱", "🔥", "✨", "⭐", "🌟", "⚡", "❄️", "🪆", "🥒", "🧵", "🧶", "🎲", "🎯", "🚀", "🛰️"],
  },
  {
    label: "Symbols",
    emojis: ["✅", "❌", "❓", "❗", "💡", "🔒", "🔓", "🔑", "🏷️", "🚩", "📍", "♻️", "⚖️", "🧠", "👁️", "🫧", "💬", "📨", "🔔"],
  },
];

export const allEmojis = emojiGroups.flatMap((g) => g.emojis);
