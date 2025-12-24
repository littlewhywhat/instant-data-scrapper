import { createWorker } from 'tesseract.js';

export default defineContentScript({
  matches: ["<all_urls>"],
  world: 'MAIN',
  main() {
    console.log('OCR content script loaded (MAIN world)');
    
    window.addEventListener('message', async (event) => {
      if (event.source !== window) return;
      
      if (event.data.type === 'EXTRACT_TEXT_FROM_IMAGE') {
        console.log('OCR script received request, image size:', event.data.dataUrl?.length);
        
        try {
          const text = await extractTextFromImage(
            event.data.dataUrl,
            event.data.workerPath,
            event.data.corePath
          );
          window.postMessage({
            type: 'EXTRACT_TEXT_FROM_IMAGE_RESPONSE',
            requestId: event.data.requestId,
            text
          }, '*');
        } catch (error) {
          window.postMessage({
            type: 'EXTRACT_TEXT_FROM_IMAGE_RESPONSE',
            requestId: event.data.requestId,
            error: error instanceof Error ? error.message : String(error)
          }, '*');
        }
      }
    });
  },
});

async function extractTextFromImage(
  dataUrl: string,
  workerPath: string,
  corePath: string
): Promise<string> {
  console.log('Creating Tesseract worker...');
  
  try {
    const worker = await createWorker('eng', 1, {
      workerPath,
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath,
    });
    console.log('Tesseract worker created');
    
    console.log('Starting OCR recognition...');
    const { data: { text } } = await worker.recognize(dataUrl);
    console.log('OCR recognition complete, text length:', text.length);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('Error during OCR:', error);
    throw error;
  }
}

