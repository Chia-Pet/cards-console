document.addEventListener('DOMContentLoaded', function() {
    // --- Element Selections ---
    const consoleElement = document.getElementById('console');
    const mainContent = document.getElementById('main-content');
    const themeToggleBtn = document.getElementById('darkModeToggle');

    // --- Defensive Check ---
    if (!consoleElement || !mainContent || !themeToggleBtn) {
        console.error('Essential elements missing. Halting script.');
        if (mainContent) mainContent.classList.remove('hidden');
        return;
    }

    // --- Typing Animation ---
    (function handleTypingAnimation() {
        const messages = [
            'Welcome to Manni.dev',
            'Initializing Chia Mainframe...',
            'Access granted.'
        ];
        let animationSkipped = false;

        const sleep = function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        };

        const skipAnimation = function() {
            if (animationSkipped) return;
            animationSkipped = true;
            consoleElement.innerHTML = messages.join('<br>') + '<br>';
            showMainContent();
        };

        window.addEventListener('click', skipAnimation);
        window.addEventListener('keydown', skipAnimation);

        async function runAnimation() {
            try {
                for (let message of messages) {
                    if (animationSkipped) return;

                    for (let char of message) {
                        if (animationSkipped) return;
                        consoleElement.innerHTML += char;

                        if (message === 'Initializing Chia Mainframe...' && char === '.') {
                            await sleep(2000);
                        } else {
                            await sleep(40);
                        }
                    }
                    consoleElement.innerHTML += '<br>';
                    await sleep(1000);
                }
                showMainContent();
            } catch (error) {
                console.error('Typing animation failed:', error);
                showMainContent();
            }
        }

        function showMainContent() {
            window.removeEventListener('click', skipAnimation);
            window.removeEventListener('keydown', skipAnimation);

            setTimeout(function() {
                consoleElement.classList.add('hidden');
                mainContent.classList.remove('hidden');
                if (!localStorage.getItem('color-theme')) {
                    document.documentElement.classList.add('dark');
                }
                loadCards(); // Load cards after the main content is visible
            }, 500);
        }

        runAnimation();
    })();

    // --- Card Generation ---
    function createCard(card) {
        const template = document.getElementById('card-template');
        const cardElement = template.content.cloneNode(true).firstElementChild;

        cardElement.href = card.url;
        cardElement.querySelector('h3').textContent = card.title;
        cardElement.querySelector('p').textContent = card.description;

        return cardElement;
    }

    async function loadCards() {
        try {
            const response = await fetch('cards.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const cards = await response.json();
            const cardGrid = document.getElementById('card-grid');
            if (cardGrid) {
                // Clear existing cards before adding new ones
                cardGrid.innerHTML = '';
                cards.forEach(card => {
                    const cardElement = createCard(card);
                    cardGrid.appendChild(cardElement);
                });
            }
        } catch (error) {
            console.error('Failed to load cards:', error);
        }
    }

    // --- Dark Mode Toggle ---
    const themeToggleIcon = themeToggleBtn.querySelector('i');

    function applyTheme(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            themeToggleIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            themeToggleIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('color-theme', 'light');
        }
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('color-theme');
    const isInitialDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    applyTheme(isInitialDark);

    themeToggleBtn.addEventListener('click', function() {
        const isCurrentlyDark = document.documentElement.classList.contains('dark');
        applyTheme(!isCurrentlyDark);
    });
});
