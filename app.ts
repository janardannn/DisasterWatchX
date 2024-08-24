import dotenv from "dotenv";
dotenv.config();

import puppeteer, { Browser, ElementHandle, Page } from "puppeteer";

const autoScroll = async (page: Page, prev: number): Promise<number> => {
    await new Promise((resolve) => setTimeout(resolve, 1550));
    await page.evaluate((value) => {
        window.scrollTo(value, value+5000);
    }, prev);

    return prev + 5000;
};


const scrapeLive = async (page: Page, topic: string, scrollCount: number): Promise<void> => {
    // if topic has spaces in it
    if (topic.includes(" ")) {
        topic = topic.split(" ").join("%20");
    }
    console.log(topic);
    // https://x.com/search?q=heaavy%20rainfall&src=typed_query

    await page.goto(`https://x.com/search?q=${topic}&src=typed_query`);

    await new Promise((resolve) => setTimeout(resolve, 3750));

    let currHeight = 0;

    let tweets: string[] = [];

    for (let i = 0; i < scrollCount; i++) {
        currHeight += await autoScroll(page, currHeight);

        await page.waitForSelector('div[data-testid="tweetText"]');
        const tweetContents = await page.evaluate(() => {
            // divs with data-testid="tweetText"
            const tweetDivs: HTMLDivElement[] = Array.from(document.querySelectorAll('div[data-testid="tweetText"]'));
            return tweetDivs.map((div) => div.innerText);
        });
        
        for (let tweet of tweetContents) {
            if (!tweets.includes(tweet)) {
                tweets.push(tweet);
                console.log(tweet);
            }
        }
    }

    console.log("\n\n\n\n\nScraped " + tweets.length + " tweets without paying a dime to Twitter!");
    // console.log(tweets);

}


const authenticate = async (page: Page, username: string, password: string): Promise<void> => {
    await page.goto("https://x.com/i/flow/login");

    await page.waitForSelector('input[name="text"]');
    await page.type('input[name="text"]', username);
    
    await page.evaluate(() => {
        const spans = Array.from(document.getElementsByTagName("span"));
        const nextSpan = spans.find(element => element.innerText.trim() === "Next");
        nextSpan?.click(); 
    });

    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', password);

    await page.evaluate(() => {
        const spans = Array.from(document.getElementsByTagName("span"));
        const logInSpan = spans.find(element => element.innerText.trim() === "Log in");
        logInSpan?.click(); 
    });
}

const ScrapeX = async () => {

    const username = process.env.X_USERNAME as string;
    const password = process.env.X_PASSWORD as string;

    const browser: any = await puppeteer.launch({
        headless: false
    });

    const page = await browser.newPage();
    
    const width = 1366;
    const height = 768;

    await page.setViewport({ width, height });

    await page.goto("https://x.com");

    await authenticate(page, username, password);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    await scrapeLive(page, "heavy rainfall", 5);
    //   await browser.close();
};

ScrapeX();