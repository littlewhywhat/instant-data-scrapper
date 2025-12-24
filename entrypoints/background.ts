import { createWorker } from 'tesseract.js';

declare const ai: {
  languageModel: {
    create: () => Promise<{
      prompt: (text: string) => Promise<string>;
    }>;
  };
};

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extractData') {
      handleExtractData().then(result => {
        sendResponse({ result });
      }).catch(error => {
        sendResponse({ result: `Error: ${error.message}` });
      });
      return true;
    }
  });
});

async function handleExtractData() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.id) {
    throw new Error('No active tab found');
  }

  const dataUrl = await browser.tabs.captureVisibleTab({ format: "png" });
  
  const worker = await createWorker('eng', 1, {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
  });

  try {
    const { data: { text } } = await worker.recognize(dataUrl);
    await worker.terminate();
    
    const session = await ai.languageModel.create();
    
    const result = await session.prompt(
      `Analyze this text extracted from a webpage screenshot and provide a summary of the data:\n\n${text}`
    );

    return result;
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}
