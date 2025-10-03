// Winkhaus Ventilation Calculator - JavaScript Functionality
let timerInterval = null;
let pozostalyCzas = 0;
let isPaused = false;
let timerStarted = false;

// Security: Input validation function
function validateInput(width, length, height, windowWidth, windowHeight, season) {
    // Check for valid numbers
    const values = [width, length, height, windowWidth, windowHeight];
    for (let value of values) {
        if (isNaN(value) || !isFinite(value) || value <= 0 || value > 1000) {
            return false;
        }
    }
    
    // Check season value
    const validSeasons = ['fall', 'spring'];
    if (!validSeasons.includes(season)) {
        return false;
    }
    
    // Logical validation
    if (windowWidth >= width || windowHeight >= height) {
        return false;
    }
    
    return true;
}

// Security: Sanitize output to prevent XSS
function sanitizeOutput(value) {
    if (typeof value === 'number') {
        if (isFinite(value)) {
            const minutes = Math.floor(value);
            const seconds = Math.round((value - minutes) * 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return '0:00';
    }
    return String(value).replace(/[<>]/g, '');
}

// Zmienne globalne do przechowywania stanu dla aktualizacji tłumaczeń
let currentDisplayState = 'initial'; // 'initial', 'error', 'results', 'completed'
let currentResults = null;

// Security: Rate limiting
let lastCalculationTime = 0;
const CALCULATION_COOLDOWN = 500; // 500ms between calculations

function obliczCzasWietrzenia() {
    // Rate limiting check
    const now = Date.now();
    if (now - lastCalculationTime < CALCULATION_COOLDOWN) {
        return;
    }
    lastCalculationTime = now;

    try {
        const poraRoku = document.getElementById("season").value;
        const szerokosc = parseFloat(document.getElementById("width").value);
        const dlugosc = parseFloat(document.getElementById("length").value);
        const wysokosc = parseFloat(document.getElementById("height").value);
        const szerokoscOkna = parseFloat(document.getElementById("windowWidth").value);
        const wysokoscOkna = parseFloat(document.getElementById("windowHeight").value);

        const resultsContent = document.getElementById("resultsContent");
        
        // Zatrzymaj poprzedni timer jeśli istnieje
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        // Enhanced security validation
        if (!validateInput(szerokosc, dlugosc, wysokosc, szerokoscOkna, wysokoscOkna, poraRoku)) {
            currentDisplayState = 'error';
            currentResults = null;
            resultsContent.innerHTML = `
                <div class="results-title">${t('error')}</div>
                <p>${t('errorMessage')}</p>
            `;
            return;
        }

        // Obliczenia
        const kubatura = szerokosc * dlugosc * wysokosc;
        const obwodOkna = 2 * (szerokoscOkna + wysokoscOkna);
        const przeplywPowietrza = (poraRoku === "fall") ? 16 * obwodOkna : 10.5 * obwodOkna;
        const czasWietrzeniaMinuty = (60 * kubatura) / przeplywPowietrza;
        const czasWietrzeniaCaly = Math.ceil(czasWietrzeniaMinuty);

        // Ustawienie czasu w sekundach
        pozostalyCzas = czasWietrzeniaCaly * 60;
        isPaused = false;
        timerStarted = false;

        // Wyświetlenie wyników
        aktualizujWyswietlanie(kubatura, obwodOkna, czasWietrzeniaCaly);
        
        // Nie uruchamiamy automatycznie timera - użytkownik musi kliknąć START
        // startTimer(kubatura, obwodOkna, czasWietrzeniaCaly);
        
    } catch (error) {
        document.getElementById("resultsContent").innerHTML = `
            <div class="results-title">${t('error')}</div>
            <p>${t('calculationError')} ${error.message}</p>
        `;
    }
}

function startTimer(kubatura, obwodOkna, czasCalkowity) {
    timerInterval = setInterval(function() {
        if (!isPaused) {
            pozostalyCzas--;
            
            if (pozostalyCzas <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                pokazZakonczenie(kubatura, obwodOkna, czasCalkowity);
            } else {
                aktualizujWyswietlanie(kubatura, obwodOkna, czasCalkowity);
            }
        }
    }, 1000);
}

function aktualizujWyswietlanie(kubatura, obwodOkna, czasCalkowity) {
    currentDisplayState = 'results';
    currentResults = { kubatura, obwodOkna, czasCalkowity, pozostalyCzas };
    
    const minuty = Math.floor(pozostalyCzas / 60);
    const sekundy = pozostalyCzas % 60;
    const czasFormatowany = `${minuty}:${sekundy.toString().padStart(2, '0')}`;
    
    const resultsContent = document.getElementById("resultsContent");
    resultsContent.innerHTML = `
        <h2 class="results-title">${t('calculationResults')}</h2>
        <div class="timer-display">${czasFormatowany}</div>
        
        <div class="result-item">
            <div class="result-label">${t('ventilationTime')}</div>
            <div class="result-value">${sanitizeOutput(czasCalkowity)} ${t('minutes')}</div>
        </div>
        
        <div class="result-item">
            <div class="result-label">${t('roomVolume')}</div>
            <div class="result-value">${sanitizeOutput(kubatura)} m³</div>
        </div>
        
        <div class="result-item">
            <div class="result-label">${t('windowPerimeter')}</div>
            <div class="result-value">${sanitizeOutput(obwodOkna)} m</div>
        </div>

        <div class="timer-controls">
            <button class="timer-btn play-pause" onclick="toggleTimer()">
                ${!timerStarted ? '▶ ' + t('start') : (isPaused ? '▶ ' + t('resume') : '⏸ ' + t('pause'))}
            </button>
            <button class="timer-btn reset" onclick="resetTimer()">⏹ ${t('reset')}</button>
        </div>
    `;
}

function pokazZakonczenie(kubatura, obwodOkna, czasCalkowity) {
    currentDisplayState = 'completed';
    currentResults = { kubatura, obwodOkna, czasCalkowity };
    
    const resultsContent = document.getElementById("resultsContent");
    resultsContent.innerHTML = `
        <div class="completion-message">
            🎉 ${t('ventilationComplete')} 🎉
        </div>
        
        <div class="result-item">
            <div class="result-label">${t('calculatedTime')}</div>
            <div class="result-value">${sanitizeOutput(czasCalkowity)} ${t('minutes')}</div>
        </div>
        
        <div class="result-item">
            <div class="result-label">${t('roomVolume')}</div>
            <div class="result-value">${sanitizeOutput(kubatura)} m³</div>
        </div>
        
        <div class="result-item">
            <div class="result-label">${t('windowPerimeter')}</div>
            <div class="result-value">${sanitizeOutput(obwodOkna)} m</div>
        </div>

        <button class="timer-btn" onclick="obliczCzasWietrzenia()">${t('newCalculation')}</button>
    `;
}

function toggleTimer() {
    if (!timerStarted && currentResults) {
        // Pierwszy start - rozpocznij timer z danymi z currentResults
        timerStarted = true;
        isPaused = false;
        startTimer(currentResults.kubatura, currentResults.obwodOkna, currentResults.czasCalkowity);
    } else {
        // Timer już był uruchomiony - przełącz pauzę
        isPaused = !isPaused;
    }
    
    const button = document.querySelector('.timer-btn.play-pause');
    if (button) {
        button.innerHTML = !timerStarted ? '▶ ' + t('start') : (isPaused ? '▶ ' + t('resume') : '⏸ ' + t('pause'));
    }
}

function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    timerStarted = false;
    isPaused = false;
    currentDisplayState = 'initial';
    currentResults = null;
    
    const resultsContent = document.getElementById("resultsContent");
    resultsContent.innerHTML = `
        <div class="no-results">
            <h2 class="results-title">${t('calculationResults')}</h2>
            <p>${t('enterDataMessage')}</p>
        </div>
    `;
}

// Obiekt z tłumaczeniami
const translations = {
    pl: {
        title: "Kalkulator czasu&nbsp;wietrzenia",
        subtitle: "<strong>Sprawdź,</strong> jak szybko wywietrzysz pomieszczenie, które posiada <br>okno z funkcją wietrzenia na <strong>6-tkę!</strong>",
        description: "Korzystając z kalkulatora, obliczysz czas potrzebny <br>do całkowitej wymiany <strong>powietrza w pomieszczeniu.</strong>",
        instructions: "<strong>Podaj wymiary</strong> pomieszczenia oraz wymiary okna z funkcją wietrzenia na 6-tkę. <br><strong>Wskaż porę roku,</strong> ponieważ ma ona wpływ na czas wietrzenia.",
        calculate: "Oblicz czas wietrzenia",
        roomDimensions: "Wymiary pomieszczenia",
        windowDimensions: "Wymiary okna",
        ventilationTime: "Czas wietrzenia",
        season: "Pora roku",
        autumn: "Jesień/Zima",
        spring: "Wiosna/Lato",
        roomVolume: "Kubatura pomieszczenia",
        windowPerimeter: "Obwód okna",
        calculationResults: "Wyniki obliczeń",
        calculatedTime: "Obliczony czas",
        calculationDescription: "Korzystając z kalkulatora, obliczysz czas potrzebny do całkowitej wymiany powietrza w pomieszczeniu, wyposażonym w 1 okno z funkcją wietrzenia na 6-tkę.",
        check: "Sprawdź!",
        language: "Język:",
        enterDataMessage: "Wprowadź dane i kliknij \"Oblicz\", aby zobaczyć wyniki",
        newCalculation: "Nowe obliczenie",
        pause: "Pauza",
        start: "Start",
        resume: "Wznów",
        error: "Błąd",
        errorMessage: "Wprowadź poprawne, dodatnie wartości dla wszystkich pól.",
        calculationError: "Wystąpił błąd podczas obliczeń:",
        minutes: "minut",
        ventilationComplete: "WIETRZENIE ZAKOŃCZONE!",
        reset: "Reset",
        widthPlaceholder: "Szerokość [m]",
        lengthPlaceholder: "Długość [m]",
        heightPlaceholder: "Wysokość [m]",
        windowWidthPlaceholder: "Szerokość [m]",
        windowHeightPlaceholder: "Wysokość [m]"
    },
    cz: {
        title: "Kalkulačka doby&nbsp;větrání",
        subtitle: "<strong>Zkuste,</strong> jak rychle vyvětráte místnost, která má <br>okno s funkcí <strong>6mm odvětrání!</strong>",
        description: "Pomocí kalkulačky vypočítáte čas potřebný <br>k úplné výměně <strong>vzduchu v místnosti.</strong>",
        instructions: "<strong>Uveďte rozměry</strong> místnosti a rozměry okna s funkcí větrání 6mm odsazení. <br><strong>Uveďte roční období,</strong> protože to ovlivňuje dobu větrání.",
        calculate: "Vypočítat",
        roomDimensions: "Rozměry místnosti",
        windowDimensions: "Rozměry okna", 
        ventilationTime: "Doba větrání",
        season: "Sezóna",
        autumn: "Podzim/Zima",
        spring: "Jaro/Léto",
        roomVolume: "Objem místnosti",
        windowPerimeter: "Obvod okna",
        calculationResults: "Odpočet času větrání",
        calculatedTime: "Vypočítaný čas",
        calculationDescription: "Pomocí kalkulačky si můžete vypočítat čas potřebný pro úplnou výměnu vzduchu v místnosti vybavené 1 oknem s funkcí větrání 6mm odsazení.",
        check: "Zkontroluj!",
        language: "Jazyk:",
        enterDataMessage: "Zadejte údaje a klikněte na \"Vypočítat\", abyste viděli výsledky",
        newCalculation: "Nový výpočet",
        pause: "Pauza",
        start: "Start",
        resume: "Pokračovat",
        error: "Chyba",
        errorMessage: "Zadejte správné, kladné hodnoty pro všechna pole.",
        calculationError: "Během výpočtů došlo k chybě:",
        minutes: "minut",
        ventilationComplete: "VĚTRÁNÍ DOKONČENO!",
        reset: "Reset",
        widthPlaceholder: "Šířka [m]",
        lengthPlaceholder: "Délka [m]",
        heightPlaceholder: "Výška [m]",
        windowWidthPlaceholder: "Šířka [m]",
        windowHeightPlaceholder: "Výška [m]"
    },
    ru: {
        title: "Калькулятор времени&nbsp;проветривания",
        subtitle: "<strong>Оцените,</strong> как быстро проветривается помещение, в котором есть <br>окно с функцией <strong>параллельного проветривания!</strong>",
        description: "С помощью калькулятора вы сможете рассчитать время, необходимое <br>для полной циркуляции <strong>воздуха в помещении.</strong>",
        instructions: "<strong>Укажите размеры</strong> помещения и размеры окна с функцией параллельного проветривания. <br><strong>Укажите время года,</strong> поскольку оно влияет на время проветривания.",
        calculate: "Рассчитать",
        roomDimensions: "Размеры помещения",
        windowDimensions: "Размеры окна",
        ventilationTime: "Время проветривания",
        season: "Время года",
        autumn: "Осень/зима",
        spring: "Весна/лето",
        roomVolume: "Кубатура помещения",
        windowPerimeter: "Периметр окна",
        calculationResults: "Вычет времени проветривания",
        calculatedTime: "Расчетное время",
        calculationDescription: "С помощью калькулятора вы можете рассчитать время, необходимое для полной циркуляции воздуха в помещении, оборудованном 1 окном с функцией параллельного проветривания.",
        check: "Проверьте!",
        language: "Язык:",
        enterDataMessage: "Введите данные и нажмите \"Рассчитать\", чтобы увидеть результаты",
        newCalculation: "Новый расчет",
        pause: "Пауза",
        start: "Старт",
        resume: "Продолжить",
        error: "Ошибка",
        errorMessage: "Введите правильные, положительные значения для всех полей.",
        calculationError: "Произошла ошибка при расчетах:",
        minutes: "минут",
        ventilationComplete: "ПРОВЕТРИВАНИЕ ЗАВЕРШЕНО!",
        reset: "Сброс",
        widthPlaceholder: "Ширина [м]",
        lengthPlaceholder: "Длина [м]",
        heightPlaceholder: "Высота [м]",
        windowWidthPlaceholder: "Ширина [м]",
        windowHeightPlaceholder: "Высота [м]"
    },
    ua: {
        title: "Калькулятор часу&nbsp;провітрювання",
        subtitle: "<strong>Дізнайся,</strong> за скільки часу можна ефективно провітрити приміщення з <br>вікном, що має функцію провітрювання!",
        description: "Скориставшись калькулятором, ви зможете розрахувати час, необхідний <br>для повного обміну <strong>повітря в приміщенні.</strong>",
        instructions: "<strong>Вкажіть розміри</strong> приміщення та розміри вікна, що має функцію провітрювання. <br><strong>Оберіть також пору року — адже вона впливає на тривалість провітрювання.</strong>",
        calculate: "Розрахувати",
        roomDimensions: "Розміри приміщення",
        windowDimensions: "Розміри вікна",
        ventilationTime: "Час провітрювання",
        season: "Пора року",
        autumn: "Осінь/зима",
        spring: "Весна/літо",
        roomVolume: "Об'єм приміщення (м3)",
        windowPerimeter: "Периметр вікна",
        calculationResults: "Зворотний відлік часу провітрювання",
        calculatedTime: "Розрахований час",
        calculationDescription: "За допомогою калькулятора розрахуйте час, необхідний для повного обміну повітря в кімнаті, обладнаній 1 вікном з функцією провітрювання.",
        check: "Розрахувати",
        language: "Мова:",
        enterDataMessage: "Введіть дані та натисніть \"Розрахувати\", щоб побачити результати",
        newCalculation: "Новий розрахунок",
        pause: "Пауза",
        start: "Старт",
        resume: "Продовжити",
        error: "Помилка",
        errorMessage: "Введіть правильні, додатні значення для всіх полів.",
        calculationError: "Виникла помилка під час обчислень:",
        minutes: "хвилин",
        ventilationComplete: "ПРОВІТРЮВАННЯ ЗАВЕРШЕНО!",
        reset: "Скинути",
        widthPlaceholder: "Ширина [м]",
        lengthPlaceholder: "Довжина [м]",
        heightPlaceholder: "Висота [м]",
        windowWidthPlaceholder: "Ширина [м]",
        windowHeightPlaceholder: "Висота [м]"
    }
};

// Funkcja zmiany języka
function changeLanguage(lang) {
    currentLanguage = lang;
    
    // Obsługa zwykłych elementów z data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'BUTTON') {
                element.textContent = translations[lang][key];
            } else if (element.tagName === 'OPTION') {
                element.textContent = translations[lang][key];
            } else {
                // Używamy innerHTML dla tagów HTML (np. <strong>)
                element.innerHTML = translations[lang][key];
            }
        }
    });
    
    // Obsługa placeholderów z data-i18n-placeholder
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Aktualizacja dynamicznie generowanej zawartości
    updateDynamicContent();
}

// Funkcja pomocnicza do pobierania tłumaczeń
let currentLanguage = 'pl';
function t(key) {
    return translations[currentLanguage] && translations[currentLanguage][key] ? translations[currentLanguage][key] : key;
}

// Funkcja do aktualizacji dynamicznie generowanej zawartości
function updateDynamicContent() {
    if (!currentResults && currentDisplayState === 'initial') {
        // Stan początkowy
        const resultsContent = document.getElementById("resultsContent");
        resultsContent.innerHTML = `
            <div class="no-results">
                <h2 class="results-title">${t('calculationResults')}</h2>
                <p>${t('enterDataMessage')}</p>
            </div>
        `;
    } else if (currentDisplayState === 'error') {
        // Komunikat błędu
        const resultsContent = document.getElementById("resultsContent");
        resultsContent.innerHTML = `
            <div class="results-title">${t('error')}</div>
            <p>${t('errorMessage')}</p>
        `;
    } else if (currentDisplayState === 'results' && currentResults) {
        // Wyniki z timerem - wywołaj funkcję aktualizacji
        aktualizujWyswietlanie(currentResults.kubatura, currentResults.obwodOkna, currentResults.czasCalkowity);
    } else if (currentDisplayState === 'completed' && currentResults) {
        // Komunikat zakończenia
        pokazZakonczenie(currentResults.kubatura, currentResults.obwodOkna, currentResults.czasCalkowity);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    currentLanguage = 'pl';
    currentDisplayState = 'initial';
    currentResults = null;
    changeLanguage('pl');

    // Dodanie obsługi Enter w formularzu
    const calculatorForm = document.getElementById('calculatorForm');
    if (calculatorForm) {
        calculatorForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                obliczCzasWietrzenia();
            }
        });
    }

    // Obsługa zmiany języka
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', function(e) {
            changeLanguage(e.target.value);
        });
    }
});