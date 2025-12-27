
export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extractData') {
      handleExtractData().then(result => {
        sendResponse({ result });
      }).catch(error => {
        console.log({ error });
        sendResponse({ result: `Error: ${error.message}` });
      });
      return true;
    }
  });
});

async function handleExtractData() {
  console.log('Starting data extraction...');
  
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  console.log('Active tab:', { id: tab.id, url: tab.url });
  
  if (!tab.id) {
    throw new Error('No active tab found');
  }

  console.log('Capturing screenshot...');
  const dataUrl = await browser.tabs.captureVisibleTab({ format: "png" });
  console.log('Screenshot captured, size:', { length: dataUrl.length, dataUrl });
  
  console.log('Sending message to content script for OCR...');
  let response;
  try {
    response = await browser.tabs.sendMessage(tab.id, {
      action: 'extractTextFromImage',
      dataUrl
    });
    console.log('Content script response received:', { hasError: !!response.error, textLength: response.text?.length });
  } catch (error) {
    console.error('Failed to communicate with content script:', error);
    throw new Error('Content script not available. Please refresh the page and try again.');
  }

  if (response.error) {
    throw new Error(response.error);
  }

  const text = response.text;
  console.log('Extracted text:', text.substring(0, 200) + '...');
  
  if (typeof LanguageModel !== 'undefined') {
    try {
      console.log('Creating AI session...');
      const session = await LanguageModel.create({
        monitor(m) {
          m.addEventListener('downloadprogress', (e: any) => {
            console.log(`AI Model Downloaded ${e.loaded * 100}%`);
          });
        },
      });
      
      console.log('Sending prompt to AI...');
      const result = await session.prompt(
        `Analyze this text extracted from a webpage screenshot and provide a summary of the data:\n\n${text}`
      );
      
      console.log('AI result received:', result.substring(0, 200) + '...');
      return result;
    } catch (error) {
      console.error('AI processing failed:', error);
      return `Extracted text from screenshot (AI failed):\n\n${text}`;
    }
  } else {
    console.log('LanguageModel not available, returning raw text');
    return `Extracted text from screenshot:\n\n${text}`;
  }
}
