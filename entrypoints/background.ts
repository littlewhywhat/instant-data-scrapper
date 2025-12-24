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
  console.log('Screenshot captured, size:', dataUrl.length);
  
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

  const result = response.text;
  console.log('Result received:', result.substring(0, 200) + '...');
  
  return result;
}
