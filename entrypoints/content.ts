import { createWorker } from 'tesseract.js';

export default defineContentScript({
  matches: ["<all_urls>"],
  world: "MAIN",
  main() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'extractTextFromImage') {
        extractTextFromImage(message.dataUrl).then(text => {
          sendResponse({ text });
        }).catch(error => {
          sendResponse({ error: error.message });
        });
        return true;
      }
    });
    // setTimeout(() => {
    //   console.log("Hello content.");
    //   const connectionList = window.document.querySelector(
    //     'div[componentkey="ConnectionsPage_ConnectionsList"]:has(div[data-component-type="LazyColumn"])'
    //   );
    //   console.log({ connectionListFound: !!connectionList });
    //   if (!connectionList) {
    //     return;
    //   }
    //   connectionList.setAttribute("style", "border: 1px solid blue !important");
    //   // const connections = connectionList.querySelectorAll(
    //   //   'div[data-view-name="connections-list"] > div'
    //   // );
    //   // const connection = Array.from(connections.entries()).at(0);
    //   // connection?.[1].setAttribute(
    //   //   "style",
    //   //   "border: 1px solid green !important"
    //   // );
    //   // console.log({ connectionsFound: connections.length, connection });
    //   loadMore(connectionList as HTMLElement).then(() => {
    //     const connections = connectionList.querySelectorAll(
    //       'div[data-view-name="connections-list"] > div'
    //     );
    //     const connection = Array.from(connections.entries()).at(0);
    //     connection?.[1].setAttribute(
    //       "style",
    //       "border: 1px solid green !important"
    //     );
    //     console.log({ connectionsFound: connections.length });
    //     const parsedConnections = [];
    //     for (const connection of connections) {
    //       const connectionElement = connection as HTMLElement;
    //       const parsedConnection: Record<string, string> = {};
    //       Object.entries(parseConfig).forEach(([key, value]) => {
    //         let selector: string;
    //         let attribute: keyof Element = 'textContent';
    //         if (typeof value === 'object' && 'attr' in value) {
    //           attribute = value.attr as keyof Element;
    //           selector = value.selector;
    //         } else {
    //           selector = value;
    //         }
    //         const element = connectionElement.querySelector(selector);
    //         if (element) {
    //           parsedConnection[key] = element[attribute] as string;
    //         }
    //       });
    //       parsedConnections.push(parsedConnection);
    //     }
    //     console.log({ parsedConnections });
    //   });
    // }, 2000);
  },
});
/**
 * example:
 * 
 */

const parseConfig: Record<string, string | { selector: string, attr: string }> = {
  name: 'a[data-view-name="connections-profile"]:not(:has(figure)) p:first-child a',
  profilePicUrl: { selector: 'figure[data-view-name="image"] img', attr: 'src' },
  profileUrl: { selector: 'a[data-view-name="connections-profile"]:has(figure)', attr: 'href' },
  shortBio: 'a[data-view-name="connections-profile"]:not(:has(figure)) div p:not(:has(a))'
}

async function loadMore(connectionList: HTMLElement) {
  let cnt = 0;
  let loadMoreButton = connectionList.querySelector(
    "div[componentkey='ConnectionsPage_ConnectionsList'] > div:last-child > button"
  );
  while (
    cnt < 1 &&
    !!loadMoreButton &&
    loadMoreButton instanceof HTMLButtonElement &&
    loadMoreButton.textContent?.trim() === "Load more"
  ) {
    console.log({
      loadMoreButtonFound: !!loadMoreButton,
      loadMoreButton: loadMoreButton,
      loadMoreButtonText: loadMoreButton?.textContent,
    });
    loadMoreButton.setAttribute("style", "border: 1px solid red !important");
    cnt++;
    loadMoreButton.click();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    loadMoreButton = connectionList.querySelector(
      "div[componentkey='ConnectionsPage_ConnectionsList'] > div:last-child > button"
    );
  }
  console.log("Loaded as much as i can", { cnt, loadMoreButton });
}

async function extractTextFromImage(dataUrl: string): Promise<string> {
  const worker = await createWorker('eng', 1, {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
  });

  try {
    const { data: { text } } = await worker.recognize(dataUrl);
    await worker.terminate();
    return text;
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}
