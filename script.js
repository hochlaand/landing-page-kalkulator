// Globalna zmienna dla timera
let countdownInterval = null;

// Funkcja przewijania do sekcji
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const navbarHeight = 80; // wysokość navbara
        const elementPosition = element.offsetTop - navbarHeight;
        
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
        
        // Dodaj krótkie podświetlenie sekcji
        element.style.boxShadow = '0 0 20px rgba(123, 164, 219, 0.5)';
        setTimeout(() => {
            element.style.boxShadow = '';
        }, 2000);
    }
}

// Funkcja zmiany trybu nawigacji
function updateNavbarMode() {
    const navbar = document.getElementById('mainNavbar');
    const scrollY = window.scrollY;
    
    // Pobierz wszystkie sekcje
    const sections = [
        { id: 'Okno', element: document.getElementById('Okno') },
        { id: 'Kalkulator', element: document.getElementById('Kalkulator') },
        { id: 'Funkcje', element: document.getElementById('Funkcje') },
        { id: 'Zalety', element: document.getElementById('Zalety') }
    ];
    
    // Menu zawsze pozostaje w trybie ciemnym
    navbar.classList.remove('light-mode');
    
    // Aktualizuj aktywny link
    updateActiveNavLink(sections, scrollY);
}

// Funkcja aktualizacji aktywnego linku
function updateActiveNavLink(sections, scrollY) {
    const navbarHeight = 80;
    let currentSection = '';
    
    // Sprawdź czy użytkownik jest w obszarze content-sections (funkcje)
    const contentSections = document.querySelector('.content-sections');
    if (contentSections) {
        const contentSectionTop = contentSections.offsetTop - navbarHeight - 50;
        const contentSectionBottom = contentSectionTop + contentSections.offsetHeight;
        
        if (scrollY >= contentSectionTop && scrollY < contentSectionBottom) {
            currentSection = 'Funkcje';
        }
    }
    
    // Jeśli nie jesteśmy w content-sections, sprawdź inne sekcje
    if (!currentSection) {
        sections.forEach(section => {
            if (section.element && section.id !== 'Funkcje') { // Pomijamy Funkcje, bo już sprawdziliśmy content-sections
                const sectionTop = section.element.offsetTop - navbarHeight - 50;
                const sectionBottom = sectionTop + section.element.offsetHeight;
                
                if (scrollY >= sectionTop && scrollY < sectionBottom) {
                    currentSection = section.id;
                }
            }
        });
    }
    
    // Usuń klasę active ze wszystkich linków
    document.querySelectorAll('.navbar a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Dodaj klasę active do odpowiedniego linku
    if (currentSection) {
        const activeLink = document.querySelector(`a[href="#${currentSection}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

// Event listener dla scroll
window.addEventListener('scroll', updateNavbarMode);

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    updateNavbarMode();
});

function obliczCzasWietrzenia() {
    const poraRoku = document.getElementById("season").value;
    const szerokosc = parseFloat(document.getElementById("width").value);
    const dlugosc = parseFloat(document.getElementById("length").value);
    const wysokosc = parseFloat(document.getElementById("height").value);
    const szerokoscOkna = parseFloat(document.getElementById("windowWidth").value);
    const wysokoscOkna = parseFloat(document.getElementById("windowHeight").value);

    if (isNaN(szerokosc) || isNaN(dlugosc) || isNaN(wysokosc) || isNaN(szerokoscOkna) || isNaN(wysokoscOkna)) {
      document.getElementById("results").innerHTML = "Wprowadź poprawne wartości dla wszystkich pól.";
      return;
    }

    const kubatura = szerokosc * dlugosc * wysokosc;
    const obwodOkna = 2 * (szerokoscOkna + wysokoscOkna);
    const przeplywPowietrza = (poraRoku === "fall") ? 16 * obwodOkna : 10.5 * obwodOkna;
    const czasWietrzeniaMinuty = (60 * kubatura) / przeplywPowietrza;
    const czasWietrzeniaCaly = Math.ceil(czasWietrzeniaMinuty);

    // Zatrzymaj poprzedni timer jeśli istnieje
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    const wynikElement = document.getElementById("results");
    wynikElement.innerHTML = `
        <div class="calculation-results">
            <h4>Wyniki obliczeń:</h4>
            <p><strong>Czas wietrzenia:</strong> ${czasWietrzeniaCaly} minut</p>
            <p><strong>Kubatura pomieszczenia:</strong> ${kubatura.toFixed(2)} m<sup>3</sup></p>
            <p><strong>Obwód okna:</strong> ${obwodOkna.toFixed(2)} m</p>
            
            <div class="timer-section">
                <h5>Odliczanie czasu wietrzenia:</h5>
                <div class="timer-container">
                    <div class="timer-display" id="timerDisplay">
                        <span class="minutes">${czasWietrzeniaCaly}</span>:<span class="seconds">00</span>
                    </div>
                    <div class="timer-animation">
                        <div class="wind-animation">
                            <div class="wind-line wind-line-1"></div>
                            <div class="wind-line wind-line-2"></div>
                            <div class="wind-line wind-line-3"></div>
                            <div class="wind-line wind-line-4"></div>
                        </div>
                        <div class="window-animation">
                            <div class="window-frame">
                                <div class="window-glass"></div>
                                <div class="window-handle"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="timer-progress">
                    <div class="progress-bar" id="progressBar"></div>
                </div>
                <p class="timer-status" id="timerStatus">Kliknij "Start Timer" aby rozpocząć odliczanie</p>
                <button type="button" class="btn btn-primary timer-btn" id="startTimerBtn" onclick="event.preventDefault(); startCountdown(${czasWietrzeniaCaly})">Start Timer</button>
            </div>
        </div>
    `;
    
    // Pokaż kolumnę z wynikami
    document.getElementById("resultsColumn").classList.remove("d-none");
}

function startCountdown(totalMinutes) {
    // Zatrzymaj poprzedni timer
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    let totalSeconds = totalMinutes * 60; // Konwertuj minuty na sekundy
    const originalTotalSeconds = totalSeconds;
    
    const timerDisplay = document.getElementById("timerDisplay");
    const timerStatus = document.getElementById("timerStatus");
    const progressBar = document.getElementById("progressBar");
    const startBtn = document.getElementById("startTimerBtn");
    
    // Zmień przycisk na "Zatrzymaj"
    startBtn.innerHTML = "Zatrzymaj Timer";
    startBtn.onclick = function(event) { 
        event.preventDefault(); 
        stopCountdown(); 
    };
    
    timerStatus.innerHTML = "Timer uruchomiony - wietrz pomieszczenie!";
    timerStatus.style.color = "#007bff";
    
    // Dodaj klasę timer-running dla animacji
    document.querySelector('.timer-section').classList.add('timer-running');

    countdownInterval = setInterval(function() {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        // Aktualizuj wyświetlanie
        timerDisplay.querySelector('.minutes').textContent = minutes;
        timerDisplay.querySelector('.seconds').textContent = seconds.toString().padStart(2, '0');
        
        // Aktualizuj pasek postępu
        const progress = ((originalTotalSeconds - totalSeconds) / originalTotalSeconds) * 100;
        progressBar.style.width = progress + '%';
        
        // Zmień kolory w zależności od pozostałego czasu
        if (totalSeconds <= 60) {
            timerDisplay.style.color = "#dc3545"; // Czerwony
            timerStatus.innerHTML = "Ostatnia minuta wietrzenia!";
            timerStatus.style.color = "#dc3545";
            document.querySelector('.timer-section').classList.remove('timer-warning');
            document.querySelector('.timer-section').classList.add('timer-critical');
        } else if (totalSeconds <= 300) {
            timerDisplay.style.color = "#ffc107"; // Żółty
            timerStatus.innerHTML = "Zostało mniej niż 5 minut!";
            timerStatus.style.color = "#ffc107";
            document.querySelector('.timer-section').classList.add('timer-warning');
        }
        
        totalSeconds--;
        
        // Gdy timer dojdzie do zera
        if (totalSeconds < 0) {
            clearInterval(countdownInterval);
            timerDisplay.querySelector('.minutes').textContent = "0";
            timerDisplay.querySelector('.seconds').textContent = "00";
            timerDisplay.style.color = "#28a745";
            progressBar.style.width = "100%";
            progressBar.style.backgroundColor = "#28a745";
            
            timerStatus.innerHTML = "✅ Wietrzenie zakończone! Możesz zamknąć okno.";
            timerStatus.style.color = "#28a745";
            timerStatus.classList.add("completion-message");
            
            // Aktualizuj klasy animacji
            const timerSection = document.querySelector('.timer-section');
            timerSection.classList.remove('timer-running');
            timerSection.classList.remove('timer-warning');
            timerSection.classList.remove('timer-critical');
            timerSection.classList.add('timer-completed');
            
            // Przywróć przycisk start
            startBtn.innerHTML = "Start Timer";
            startBtn.onclick = function(event) { 
                event.preventDefault(); 
                startCountdown(totalMinutes); 
            };
            
            // Efekt dźwiękowy (opcjonalny)
            playCompletionSound();
        }
    }, 1000);
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        
        const timerStatus = document.getElementById("timerStatus");
        const startBtn = document.getElementById("startTimerBtn");
        
        // Usuń klasy animacji stanu
        const timerSection = document.querySelector('.timer-section');
        timerSection.classList.remove('timer-running');
        timerSection.classList.remove('timer-warning');
        timerSection.classList.remove('timer-critical');
        timerSection.classList.remove('timer-completed');
        
        timerStatus.innerHTML = "Timer zatrzymany. Kliknij 'Start Timer' aby wznowić.";
        timerStatus.style.color = "#6c757d";
        
        startBtn.innerHTML = "Start Timer";
        // Pobierz aktualną wartość minut z wyświetlacza
        const currentMinutes = parseInt(document.getElementById("timerDisplay").querySelector('.minutes').textContent);
        const currentSeconds = parseInt(document.getElementById("timerDisplay").querySelector('.seconds').textContent);
        const remainingMinutes = currentMinutes + (currentSeconds > 0 ? 1 : 0);
        
        startBtn.onclick = function(event) { 
            event.preventDefault(); 
            startCountdown(remainingMinutes); 
        };
    }
}

function playCompletionSound() {
    // Prosta implementacja dźwięku zakończenia
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBzGH0fPFdSEIMHfH89yFOQUXb7jqZpEUAVum3+2AQAoATarq6YBBC');
        audio.play().catch(e => console.log('Nie można odtworzyć dźwięku:', e));
    } catch (e) {
        console.log('Dźwięk niedostępny');
    }
}

// Funkcja przewijania do sekcji funkcji
function scrollToSection(sectionId) {
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        // Płynne przewijanie do sekcji z małym odstępem od góry
        const offsetTop = targetSection.offsetTop - 100; // 100px odstępu od góry
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
        
        // Opcjonalne: krótka animacja podświetlenia sekcji
        targetSection.style.transition = 'box-shadow 0.3s ease-in-out';
        targetSection.style.boxShadow = '0 0 20px rgba(123, 164, 219, 0.3)';
        
        // Usuń podświetlenie po 2 sekundach
        setTimeout(() => {
            targetSection.style.boxShadow = 'none';
        }, 2000);
    }
}  