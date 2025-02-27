// API_URL = 'http://localhost:4000/api/currencies'
API_URL = 'https://xchanger-server.vercel.app/api/currencies'

let callIndex = -1
const states = [];

function useState(initialValue, renderFunction) {
    callIndex++;

    const currentIndex = Number(callIndex);

    states[currentIndex] ??= initialValue;

    const setState = function (newValue) {
        typeof newValue === 'function' ? states[currentIndex] = newValue(states[currentIndex]) : states[currentIndex] = newValue
        renderFunction?.();
    };

    return [() => states[currentIndex], setState];
}

let [currencyData, setCurrencyData] = useState([], renderCurrencyData);
let [selectedCurrencies, setSelectedCurrencies] = useState({}, renderSelectedCurrencies);

function fetchCurrencyData() {
    return fetch(API_URL)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length < 2) throw new Error("Invalid data format");

            setCurrencyData(data);
            setSelectedCurrencies({
                currency1: data[1],
                currency2: data[0]
            });
        })
        .catch(error => console.error("Error fetching currency data:", error));
}

fetchCurrencyData();

// UI elements
const input1 = document.getElementById('input-1');
const input2 = document.getElementById('input-2');
const rateDisplay = document.getElementById('rate-display');
const currencyDisplay1 = document.getElementById('currency-1');
const currencyDisplay2 = document.getElementById('currency-2');
const dropdown1 = document.getElementById('dropdown-currency-1');
const dropdownBtn1 = document.getElementById('currency-btn-1');
const dropdownCurrency1 = document.getElementById('dropdown-currency-1');
const dropdown2 = document.getElementById('dropdown-currency-2');
const dropdownBtn2 = document.getElementById('currency-btn-2');
const dropdownCurrency2 = document.getElementById('dropdown-currency-2');
const convertBtn = document.getElementById('convert-btn');
const reverseBtn = document.getElementById('reverse-btn');

dropdownBtnClick(dropdownBtn1, dropdown1, dropdown2);
dropdownBtnClick(dropdownBtn2, dropdown2, dropdown1);

function renderCurrencyData() {
    callIndex = -1
    const allCurrencies = currencyData()
    if (allCurrencies.length === 0) {
        console.warn("Currency data is empty");
        return;
    }

    handleCurrencyDropdown(allCurrencies, dropdownCurrency1, dropdown1);
    handleCurrencyDropdown(allCurrencies, dropdownCurrency2, dropdown2);
}

function renderSelectedCurrencies() {
    callIndex = -1
    const currencies = selectedCurrencies()
    if (currencies.length === 0) {
        console.warn("Currency is not selected");
        return;
    }

    displayCurrency(currencies);
    updateRateDisplay(currencies);
    swapCurrencies(currencies);
    synchronizeInputs(input1, input2, currencies.currency1, currencies.currency2);
    synchronizeInputs(input2, input1, currencies.currency2, currencies.currency1);
}

function handleCurrencyDropdown(currencyData ,dropdownCurrency, dropdown) {
    if (!currencyData || currencyData.length < 2) return;

    dropdownCurrency.innerHTML = currencyData.map((currency, index) => {
        return `<li id="${index}"> 
            <img src="${currency.icon}" class="currency-icon"> ${currency.code}
        </li>`;
    }).join('');

    dropdownCurrency.addEventListener('click', e => {
        e.stopPropagation();
        const target = e.target.closest('li');
        const selectedIndex = target.id;

        setSelectedCurrencies(prev => ({
            currency1: dropdownCurrency.id === 'dropdown-currency-1' ? currencyData[selectedIndex] : prev.currency1,
            currency2: dropdownCurrency.id === 'dropdown-currency-2' ? currencyData[selectedIndex] : prev.currency2
        }));

        dropdown.style.display = 'none';
    });
}

function dropdownBtnClick(dropdownBtn, dropdown, otherDropdown = null) {
    dropdownBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (otherDropdown) {
            otherDropdown.style.display = 'none';
        }
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    })
}

function swapCurrencies({ currency1, currency2 }) {
    if (!currency1?.icon || !currency2?.icon) return;

    const value = parseFloat(input1.value);
    input2.value = isNaN(value) ? '' : (value * currency1.price / currency2.price);
    if (!input2.value) input1.value = '';
}

// Function to update rate display
function updateRateDisplay(selectedCurrencies) {
    const { currency1, currency2 } = selectedCurrencies;

    if (!currency1?.icon || !currency2?.icon) return;
    
    rateDisplay.innerHTML = `
        1 
        ${currency1.name} = ${(currency1.price / currency2.price).toLocaleString('en-US', { maximumFractionDigits: 6 })}
        ${currency2.name}
    `;
    
    input1.focus();
    input1.setAttribute('placeholder', '1');
    input2.setAttribute('placeholder', (currency1.price / currency2.price).toLocaleString('en-US', { maximumFractionDigits: 6 }));
}

// Function to display selected currencies
function displayCurrency(selectedCurrencies) {
    const { currency1, currency2 } = selectedCurrencies;

    if (!currency1?.icon || !currency2?.icon) return;

    currencyDisplay1.innerHTML = `<img src="${currency1.icon}" class="currency-icon"> ${currency1.code}`;
    currencyDisplay2.innerHTML = `<img src="${currency2.icon}" class="currency-icon"> ${currency2.code}`;
}

function synchronizeInputs(typingInput, targetInput, typingCurrency, targetCurrency) {
    typingInput.addEventListener('input', () => {
        let typingValue = parseFloat(typingInput.value);

        if (document.activeElement !== typingInput) return;

        // Ensure input is a valid number and not negative
        if (isNaN(typingValue) || typingValue < 0) {
            typingInput.value = '';
            targetInput.value = '';
            return;
        }

        const rate = typingCurrency.price / targetCurrency.price;
        targetInput.value = (typingValue * rate);
    });
}

// key input event
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'Tab':
            e.preventDefault();
            if (document.activeElement === input1) {
                input2.focus();
            } else {
                input1.focus();
            }
            break;
        case ' ':
            e.preventDefault();
            document.getElementById('reverse-btn').click();
            break;
    }
});

document.addEventListener('click', e => {
    dropdown1.style.display = 'none'
    dropdown2.style.display = 'none'
})

reverseBtn.addEventListener('click', function () {
    this.classList.toggle('rotate');

    setSelectedCurrencies(prev => ({
        currency1: prev.currency2,
        currency2: prev.currency1
    }));

    input1.focus();
});