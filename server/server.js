require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

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
    res.send("Currency database server is running");
});

// API endpoint to fetch all currency data
app.get("/api/currencies", (req, res) => {
    res.json(currencyData);
});

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });

module.exports = app;
