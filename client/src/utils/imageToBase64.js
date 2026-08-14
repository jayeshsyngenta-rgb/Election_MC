// Converts an imported image (its bundled URL) into a base64 data URL,
// which jsPDF's doc.addImage() requires. Runs entirely in the browser
// at export time - no need to hardcode image bytes anywhere.
export function getImageBase64(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}
