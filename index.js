const puppeteer = require("puppeteer");
const fs = require("fs");
const process = require("process");
const readline = require('readline');

// urls
const urlAmazon = "https://www.amazon.com.br/";

async function run() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Digite o produto quer pesquisar: ', (termo) => {
        rl.question('Quantos resultados quer? ', (quanties) => {
            rl.question('Como deseja que seja o nome do arquivo? ', async (fileName) => {
                    rl.close();
                    let loop = parseFloat(quanties);
                    const data = {};
                    let cont = 1;

        
                    const browser = await puppeteer.launch({ headless: !false }); // se for true ele nao executa com o chromiun aberto
                    const page = await browser.newPage();
                    await page.goto(urlAmazon);
        
                    // entra no input
                    await page.waitForSelector("#twotabsearchtextbox");
                    // foca no input e escreve o que sera buscado
                    await page.type("#twotabsearchtextbox", termo);
                    // confirma a ação e clica no butao que tera a ação de submit
                    await Promise.all([page.waitForNavigation(), page.click("#nav-search-submit-button")]);
        
                    // devolve os valores encontrados na pagina atraves de seletores com valores reais 
                    const links = await page.$$eval("h2 > .a-link-normal", (e1) =>
                        e1.map((link) => link.href)
                    );
        
                    loop++;
                    for (const link of links) {
                        if (cont === loop) continue;
                        console.log(link);
                        await page.goto(link);
                        console.log(`Pagina ${cont}`);
        
                        const title = await page.evaluate(() => {
                            const e1 = document.querySelector("#productTitle");
                            if (!e1) return null;
                            else return e1.innerText;
                        });
        
                        if (title) {
                            await page.waitForSelector(".a-offscreen");
                            const price = await page.$eval(".a-offscreen",
                                (element) => element.innerText
                            );
        
                            const quantity = await page.evaluate(() => {
                                const e1 = document.querySelector('#quantity');
                                if (!e1) return null;
                                else return e1.children[e1.children.length - 1].innerText;
                            });
        
                            data[title] = { price, quantity: quantity, link };

                            fs.writeFile(`./db/${fileName}.json`, JSON.stringify(data), (error) => {
                                if (error) throw error;
                                else console.log("Sucesso!");
                            });
                        }
        
                        cont++;
                    };
                await browser.close();
            })
        });
    });
}

run()