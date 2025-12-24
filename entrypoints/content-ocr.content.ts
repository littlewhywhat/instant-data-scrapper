import { createWorker } from 'tesseract.js';

declare const LanguageModel: {
  create: (options?: {
    monitor?: (m: any) => void;
  }) => Promise<{
    prompt: (text: string) => Promise<string>;
  }>;
};

declare global {
  interface Window {
    trustedTypes?: any;
  }
}

export default defineContentScript({
  matches: ["<all_urls>"],
  world: 'MAIN',
  main() {
    console.log('OCR content script loaded (MAIN world)');
    console.log('AI available:', typeof LanguageModel !== 'undefined');
    
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
          
          let result = text;
          
          if (typeof LanguageModel !== 'undefined') {
            try {
              console.log('AI available, creating session...');
              const session = await LanguageModel.create({
                monitor(m) {
                  m.addEventListener('downloadprogress', (e: any) => {
                    console.log(`AI Model Downloaded ${e.loaded * 100}%`);
                  });
                },
              });
              console.log('AI session created, sending prompt...');
              result = await session.prompt(
                `Analyze this text extracted from a webpage screenshot and provide a summary of the data:\n\n${text}`
              );
              console.log('AI analysis complete');
            } catch (aiError) {
              console.error('AI processing failed:', aiError);
              result = `Extracted text from screenshot (AI failed):\n\n${text}`;
            }
          } else {
            console.log('AI not available, returning raw text');
            result = `Extracted text from screenshot:\n\n${text}`;
          }
          
          window.postMessage({
            type: 'EXTRACT_TEXT_FROM_IMAGE_RESPONSE',
            requestId: event.data.requestId,
            text: result
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
  
  const hasTrustedTypes = typeof window.trustedTypes !== 'undefined';
  console.log('Trusted Types detected:', hasTrustedTypes);
  
  try {
    const config = hasTrustedTypes ? {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
    } : {
      workerPath,
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath,
    };
    
    console.log('Using worker config:', { hasCDN: hasTrustedTypes });
    const worker = await createWorker('eng', 1, config);
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

