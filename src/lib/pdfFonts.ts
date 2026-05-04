import { jsPDF } from "jspdf";

/**
 * Loads a Vietnamese-compatible font into jsPDF
 * Using Be Vietnam Pro which is specifically designed for Vietnamese
 */
export async function addVietnameseFont(doc: any) {
  try {
    // Be Vietnam Pro Regular from Google Fonts
    const fontUrl = 'https://fonts.gstatic.com/s/bevietnampro/v11/qZ49m_6iW72rIBZcl_CynGo_V_6SAnuS.ttf';
    const response = await fetch(fontUrl);
    
    if (!response.ok) throw new Error('Font fetch failed');
    
    const buffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);

    const fontName = 'BeVietnamPro';
    const fileName = `${fontName}.ttf`;
    
    doc.addFileToVFS(fileName, base64);
    doc.addFont(fileName, fontName, 'normal');
    
    return fontName;
  } catch (error) {
    console.error('Failed to load Vietnamese font:', error);
    return null;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
