require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));


const API_URL_CRYPTO = process.env.API_URL_CRYPTO;
const API_URL_FOREX = process.env.API_URL_FOREX;
const API_URL_GOLD = process.env.API_URL_GOLD;
const API_URL_SILVER = process.env.API_URL_SILVER;

const cryptoCurrencies = [
    ['USD Coin', 'USDC', 1],
    ['Bitcoin', 'BTC'],
    ['Ethereum', 'ETH'],
    ['Cardano', 'ADA'],
    ['Dogecoin', 'DOGE'],
    ['Solana', 'SOL'],
    ['Ripple', 'XRP'],
    ['Polkadot', 'DOT'],
    ['Litecoin', 'LTC'],
    ['Chainlink', 'LINK'],
    ['Worldcoin', 'WLD'],
    ['BinanceCoin', 'BNB'],
    ['Monero', 'XMR'],
    ['Shiba-Inu', 'SHIB'],
    ['Uniswap', 'UNI'],
    ['Tezos', 'XTZ'],
    ['Cosmos', 'ATOM'],
    ['VeChain', 'VET'],
    ['Stellar', 'XLM'],
    ['Tron', 'TRX'],
    ['Filecoin', 'FIL'],
    ['EOS', 'EOS'],
    ['Near', 'NEAR'],
    ['Aptos', 'APT'],
    ['The-Graph', 'GRT'],
    ['Maker', 'MKR'],
    ['Fantom', 'FTM'],
    ['Arbitrum', 'ARB'],
    ['Internet-Computer', 'ICP'],
];

const fiatCurrencies = [
    ['Australian Dollar', 'AUD'],
    ['Brazilian Real', 'BRL'],
    ['British Pound', 'GBP'],
    ['Canadian Dollar', 'CAD'],
    ['Chinese Yuan', 'CNY'],
    ['Euro', 'EUR'],
    ['Indian Rupee', 'INR'],
    ['Indonesian Rupiah', 'IDR'],
    ['Japanese Yen', 'JPY'],
    ['Mexican Peso', 'MXN'],
    ['New Zealand Dollar', 'NZD'],
    ['Russian Ruble', 'RUB'],
    ['Saudi Riyal', 'SAR'],
    ['Singapore Dollar', 'SGD'],
    ['South African Rand', 'ZAR'],
    ['South Korean Won', 'KRW'],
    ['Swiss Franc', 'CHF'],
    ['Vietnam Dong', 'VND']
];

const commodities = [
    ['ounce Silver', 'SILVER'],
    ['ounce Gold', 'GOLD']
];

const createCurrencyData = (currencies) =>
    currencies.map(([name, code, price]) => ({
        name,
        code,
        icon: `tokens/${code}.svg`,
        ...(price !== undefined && { price })
    }));

const currencyData = [
    ...createCurrencyData(cryptoCurrencies),
    ...createCurrencyData(fiatCurrencies),
    ...createCurrencyData(commodities)
];


function fetchCryptoPrices() {
    return fetch(API_URL_CRYPTO)
        .then(response => response.json())
        .then(data => {
            currencyData.forEach(currency => {
                const lowerCaseName = currency.name.toLowerCase();
                if (data[lowerCaseName]?.usd) {
                    currency.price = data[lowerCaseName].usd;
                }
            });
            console.log("Crypto prices updated.");
        })
        .catch(error => console.error("Error fetching crypto prices:", error));
}

function fetchForexRates() {
    return fetch(API_URL_FOREX)
        .then(response => response.json())
        .then(data => {
            if (data.rates) {
                currencyData.forEach(currency => {
                    if (data.rates[currency.code]) {
                        currency.price = 1 / data.rates[currency.code];
                    }
                });
            }
            console.log("Forex prices updated.");
        })
        .catch(error => console.error("Error fetching forex prices:", error));
}

function fetchMetalPrices() {
    const metalURLs = [API_URL_SILVER, API_URL_GOLD];

    return Promise.allSettled(metalURLs.map(metalURL =>
        fetch(metalURL)
            .then(response => response.json())
            .then(data => {
                currencyData.forEach(currency => {
                    if (data.name.toLowerCase() === currency.code.toLowerCase()) {
                        currency.price = data.price;
                    }
                });
                console.log(`${data.name} price updated.`);
            })
            .catch(error => console.error(`Error fetching metals price:`, error))
        ));
}


async function updatePrices() {
    await Promise.allSettled([
        fetchCryptoPrices(),
        fetchForexRates(),
        fetchMetalPrices()
    ]);
}

// Update prices every 60 minutes
setInterval(updatePrices, 3600888);

// Initial Fetch
updatePrices();

app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Currency Database</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');

                body {
                    background-color: black;
                    color: #63E6BE;
                    text-align: center;
                    padding: 24px;
                    font-family: "Montserrat", serif;
                    font-weight: 400;
                }
                h1 {
                    font-size: 44px;
                    font-family: "Montserrat", serif;
                    font-weight: 400;
                }
                a {
                    font-size: 20px;
                    color: grey;
                    text-decoration: none;
                }
                a:hover {
                    color: white;
                }
            </style>
        </head>
        <body>
            <h1>Currency Database Server</h1>
            <p><a href="/api/currencies">Get now!</a></p>
        </body>
        </html>
    `);
});

// API endpoint to fetch all currency data
app.get("/api/currencies", (req, res) => {
    res.json(currencyData);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
