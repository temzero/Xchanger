// API_URL = 'http://localhost:4000/api/currencies'
API_URL = 'https://xchanger-server.vercel.app/api/currencies'


let callIndex = -1
const states = [];

function useState(initialValue) {
    callIndex++

    const currentIndex = Number(callIndex)
    
    if (states[currentIndex] === undefined) {
        states[currentIndex] = initialValue;
    }
    
    const setState = function (newValue) {
        if (typeof newValue === 'function') {
            states[currentIndex] = newValue(states[currentIndex]);
        } else {
            states[currentIndex] = newValue;
        }
        renderComponent();
    };

    return [() => states[currentIndex], setState];
}


let [currencyData, setCurrencyData] = useState([]);
let [selectedCurrencies, setSelectedCurrencies] = useState({});

function fetchCurrencyData() {
    return fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            setCurrencyData(data);
            setSelectedCurrencies({
                currency1: data[1],
                currency2: data[0]
            });
            renderComponent();
        })
        .catch(error => console.error("Error fetching currency data:", error));
}

fetchCurrencyData();
// Update prices every 60 minutes
setInterval(fetchCurrencyData, 3600888);

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
const reverseBtn = document.querySelector(".reverse-btn");

setTimeout(() => {
    // console.log('states', states)
    // console.log('currencyData', currencyData())
    handleCurrencyDropdown(dropdownCurrency1, dropdown1)
    handleCurrencyDropdown(dropdownCurrency2, dropdown2)
    dropdownBtnClick(dropdownBtn1, dropdown1, dropdown2);
    dropdownBtnClick(dropdownBtn2, dropdown2, dropdown1);
}, 100);

// Re-render function (updates UI based on state)
function renderComponent() {
    // reset callIndex
    callIndex = -1
    const currencies = selectedCurrencies()

    displayCurrency(currencies);
    updateRateDisplay(currencies);
    recalculateExchange(currencies);
    synchronizeInputs(input1, input2, currencies.currency1, currencies.currency2);
    synchronizeInputs(input2, input1, currencies.currency2, currencies.currency1);
    
    alwaysPositive(input1);
    alwaysPositive(input2);
}

function handleCurrencyDropdown(dropdownCurrency, dropdown) {
    if (!currencyData() || currencyData().length < 2) {
        // console.warn("Currency data is empty or missing.");
        return;
    }

    dropdownCurrency.innerHTML = currencyData().map((currency, index) => {
        return `<li id="${index}"> 
            <img src="${currency.icon}" class="currency-icon"> ${currency.code}
        </li>`;
    }).join('');

    dropdownCurrency.addEventListener('click', e => {
        e.stopPropagation();
        const target = e.target.closest('li');
        const selectedIndex = target.id;

        setSelectedCurrencies(prev => ({
            currency1: dropdownCurrency.id === 'dropdown-currency-1' ? currencyData()[selectedIndex] : prev.currency1,
            currency2: dropdownCurrency.id === 'dropdown-currency-2' ? currencyData()[selectedIndex] : prev.currency2
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

function recalculateExchange(selectedCurrencies) {
    const { currency1, currency2 } = selectedCurrencies;

    if (!currency1 || !currency2 || !currency1.icon || !currency2.icon) {
        // console.warn("Currency data is empty or missing.");
        return; 
    }

    if (input1.value !== '') {
        input2.value = (parseFloat(input1.value) * currency1.price / currency2.price);
    } else {
        input2.value = '';
    }

    if (input2.value === '') {
        input1.value = '';
    }
}

// Function to update rate display
function updateRateDisplay(selectedCurrencies) {
    const { currency1, currency2 } = selectedCurrencies;

    if (!currency1 || !currency2 || !currency1.icon || !currency2.icon) {
        // console.warn("Currency data is empty or missing.");
        return; 
    }
    
    rateDisplay.innerHTML = `
        1 
        ${currency1.name} = ${(currency1.price / currency2.price).toLocaleString('en-US', { maximumFractionDigits: 6 })}
        ${currency2.name}
    `;
    
    input1.focus();
    
    // Set aria-placeholder for both input fields
    input1.setAttribute('placeholder', '1');
    input2.setAttribute('placeholder', (currency1.price / currency2.price).toLocaleString('en-US', { maximumFractionDigits: 6 }));
}

// Function to display selected currencies
function displayCurrency(selectedCurrencies) {
    const { currency1, currency2 } = selectedCurrencies;

    if (!currency1 || !currency2 || !currency1.icon || !currency2.icon) {
        // console.warn("Currency data is empty or missing.");
        return; 
    }

    currencyDisplay1.innerHTML = `<img src="${currency1.icon}" class="currency-icon"> ${currency1.code}`;
    currencyDisplay2.innerHTML = `<img src="${currency2.icon}" class="currency-icon"> ${currency2.code}`;
}

// Ensure inputs are always non-negative while typing
function alwaysPositive(input) {
    input.addEventListener('input', () => {
        if (input.value < 0) {
            input.value = 0;
        }
    });
}

function synchronizeInputs(typingInput, targetInput, typingCurrency, targetCurrency) {
    typingInput.addEventListener('input', () => {
        let value = parseFloat(typingInput.value);

        if (document.activeElement !== typingInput) {
            return; // Only update when user is actively typing
        }

        if (typingInput.value === '' || value < 0) {
            targetInput.value = '';
            return;
        }

        if (!isNaN(value)) {
            const rate = typingCurrency.price / targetCurrency.price;
            targetInput.value = (value * rate).toFixed(2);
        }

        if (value === 0) {
            targetInput.value = 0;
        }
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
