import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.REACT_APP_API_KEY; // Render의 환경변수를 사용하도록 수정
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function dataURItoFile(dataURI, fileName) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([ab], fileName, { type: mimeString });
}

export async function generateMinhwaPainting(imageBase64) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const imageFile = dataURItoFile(imageBase64, "satellite-image.png");
  const prompt = `Transform this building's image into a traditional Korean Minhwa painting. Use bold outlines and vibrant, flat colors. Add a tiny signature that says "Gemini"`;

  const result = await model.generateContent([prompt, imageFile]);
  const response = result.response;
  const imagePart = response.candidates[0].content.parts.find(part => part.inlineData);
  return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
}
