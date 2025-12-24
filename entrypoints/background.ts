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
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.id) {
    throw new Error('No active tab found');
  }

  const dataUrl = await browser.tabs.captureVisibleTab({ format: "png" });
  
  const response = await browser.tabs.sendMessage(tab.id, {
    action: 'extractTextFromImage',
    dataUrl
  });

  if (response.error) {
    throw new Error(response.error);
  }

  const text = response.text;
  
  const session = await ai.languageModel.create();
  
  const result = await session.prompt(
    `Analyze this text extracted from a webpage screenshot and provide a summary of the data:\n\n${text}`
  );

  return result;
}
