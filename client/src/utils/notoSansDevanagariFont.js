// Loads the Noto Sans Devanagari TTF files (put them at
// client/src/assets/fonts/) and converts them to the base64 format jsPDF
// needs, at runtime in the browser.
//
// Why this instead of a hardcoded base64 string: the font file is ~200KB,
// which becomes a single ~280,000-character line of base64 text if baked
// into a .js file. That's exactly the kind of thing that gets silently
// truncated by copy/paste, Notepad, or an editor's line-length limit -
// which is what happened last time. Shipping the real .ttf binary and
// converting it in the browser avoids that entirely.
//
// The `?url` suffix tells Vite to give us the built asset's URL instead
// of trying to parse the file as JS - this works for any file type, not
// just Vite's built-in list of asset extensions.
import regularFontUrl from "../assets/fonts/NotoSansDevanagari-Regular.ttf?url";
import boldFontUrl from "../assets/fonts/NotoSansDevanagari-Bold.ttf?url";

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  // Convert in chunks - passing the whole (very large) byte array to
  // String.fromCharCode at once can hit the JS engine's argument-count
  // limit and throw "Maximum call stack size exceeded".
  const chunkSize = 0x8000; // 32KB
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

// Cached after the first PDF export so repeat exports don't re-fetch.
let cachedFonts = null;

export async function loadDevanagariFonts() {
  if (cachedFonts) return cachedFonts;

  const [regularBuffer, boldBuffer] = await Promise.all([
    fetch(regularFontUrl).then((res) => res.arrayBuffer()),
    fetch(boldFontUrl).then((res) => res.arrayBuffer()),
  ]);

  cachedFonts = {
    regular: arrayBufferToBase64(regularBuffer),
    bold: arrayBufferToBase64(boldBuffer),
  };
  return cachedFonts;
}
