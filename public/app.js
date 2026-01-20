function updateClock() {
    const clockElement = document.getElementById('clock');
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}`;
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthName = document.getElementById('month-name');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Set month name
    const monthOptions = { month: 'long', year: 'numeric' };
    monthName.textContent = now.toLocaleDateString('fi-FI', monthOptions);

    grid.innerHTML = '';

    // Day labels (Mon-Sun)
    const dayLabels = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];
    dayLabels.forEach(label => {
        const div = document.createElement('div');
        div.className = 'calendar-day-label';
        div.textContent = label;
        grid.appendChild(div);
    });

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Map to 0-6 (Mon-Sun)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells before first day
    for (let i = 0; i < adjustedFirstDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day empty';
        grid.appendChild(div);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';

        const dateKey = `${currentMonthKey}-${String(day).padStart(2, '0')}`;
        const holiday = window.calendarData?.holidays?.[dateKey];
        const nameday = window.calendarData?.namedays?.[dateKey];

        if (holiday) {
            div.classList.add('holiday');
        }

        if (day === today) {
            div.classList.add('today');
        }

        const content = document.createElement('div');
        content.className = 'calendar-day-content';

        const dayNum = document.createElement('span');
        dayNum.className = 'day-number';
        dayNum.textContent = day;
        content.appendChild(dayNum);

        if (holiday) {
            const holDiv = document.createElement('div');
            holDiv.className = 'holiday-text';
            holDiv.textContent = holiday.join(', ');
            content.appendChild(holDiv);
        }

        if (nameday) {
            const nameDiv = document.createElement('div');
            nameDiv.className = 'nameday-text';
            nameDiv.textContent = nameday.join(', ');
            content.appendChild(nameDiv);
        }

        div.appendChild(content);
        grid.appendChild(div);
    }
}

async function fetchCalendarInfo() {
    try {
        const basePath = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
        const response = await fetch(basePath + 'api/calendar-info');
        if (response.ok) {
            window.calendarData = await response.json();
            renderCalendar();
        }
    } catch (error) {
        console.error('Failed to fetch calendar info:', error);
    }
}

function getWeatherIcon(code) {
    if (!code) return '';
    const val = parseFloat(code);

    // SVG icons as strings (simplified clean outlines)
    const icons = {
        sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-icon sun"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-icon cloud"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.4-1.8-4.3-4.2-4.5C17.3 6.9 14.5 4 11 4c-3.1 0-5.7 2.2-6.3 5.1C2.6 10.1 1 12.1 1 14.5 1 17 3 19 5.5 19h12z"></path></svg>`,
        cloudRain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-icon rain"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.4-1.8-4.3-4.2-4.5C17.3 6.9 14.5 4 11 4c-3.1 0-5.7 2.2-6.3 5.1C2.6 10.1 1 12.1 1 14.5 1 17 3 19 5.5 19h12z"></path><path d="M8 22v-2"></path><path d="M12 22v-2"></path><path d="M16 22v-2"></path></svg>`,
        cloudSnow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-icon snow"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.4-1.8-4.3-4.2-4.5C17.3 6.9 14.5 4 11 4c-3.1 0-5.7 2.2-6.3 5.1C2.6 10.1 1 12.1 1 14.5 1 17 3 19 5.5 19h12z"></path><path d="M8 16h.01"></path><path d="M8 20h.01"></path><path d="M12 18h.01"></path><path d="M12 22h.01"></path><path d="M16 16h.01"></path><path d="M16 20h.01"></path></svg>`,
        cloudDrizzle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-icon drizzle"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.4-1.8-4.3-4.2-4.5C17.3 6.9 14.5 4 11 4c-3.1 0-5.7 2.2-6.3 5.1C2.6 10.1 1 12.1 1 14.5 1 17 3 19 5.5 19h12z"></path><path d="M8 19v2"></path><path d="M12 19v2"></path><path d="M16 19v2"></path></svg>`,
        cloudLightning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-icon thunder"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.4-1.8-4.3-4.2-4.5C17.3 6.9 14.5 4 11 4c-3.1 0-5.7 2.2-6.3 5.1C2.6 10.1 1 12.1 1 14.5 1 17 3 19 5.5 19h12z"></path><polyline points="13 11 9 17 15 17 11 23"></polyline></svg>`,
        cloudFog: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-icon fog"><path d="M4 14.89V16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.11a7 7 0 0 0-16 0z"></path><path d="M8 22h8"></path><path d="M10 24h4"></path></svg>`,
        partlyCloudy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-icon partly-cloudy"><path d="M12 2v2"></path><path d="M4.93 4.93l1.41 1.41"></path><path d="M2 12h2"></path><path d="M6.34 17.66l-1.41 1.41"></path><path d="M12 20v2"></path><path d="M17.66 17.66l1.41 1.41"></path><path d="M22 12h-2"></path><path d="M17.66 6.34l-1.41 1.41"></path><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"></path></svg>`
    };

    // WMO 4680 mapping
    if (val === 0) return '';
    if (val === 1) return icons.sun;
    if (val === 2) return icons.partlyCloudy;
    if (val <= 4) return icons.cloud;
    if (val === 5 || val === 6 || val === 7) return icons.cloudRain;
    if (val === 8) return icons.cloudLightning;
    if (val >= 11 && val <= 13) return icons.cloudRain;
    if (val === 14 || val === 15) return icons.cloudRain; // Sleet, maybe a sleet icon if wanted
    if (val === 16 || val === 17) return icons.cloudSnow;
    if (val >= 21 && val <= 23) return icons.cloudFog;

    // WMO 4680 ranges
    if (val >= 40 && val <= 49) return icons.cloudFog;
    if (val >= 50 && val <= 59) return icons.cloudDrizzle;
    if (val >= 60 && val <= 69) return icons.cloudRain;
    if (val >= 70 && val <= 79) return icons.cloudSnow;
    if (val >= 80 && val <= 99) return icons.cloudRain; // Showers/Storms range

    return icons.cloud; // Fallback
}

async function fetchWeather() {
    const container = document.getElementById('weather-container');
    const refreshBtn = document.getElementById('refresh-btn');
    const lastUpdated = document.getElementById('last-updated');

    refreshBtn.classList.add('loading');

    try {
        const basePath = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
        const response = await fetch(basePath + 'api/weather');
        if (!response.ok) throw new Error('Palvelinvirhe');

        const data = await response.json();
        const sensors = data.sensorValues;


        const findSensor = (name) => sensors.find(s => s.name === name);
        const findSensorById = (id) => sensors.find(s => s.id === id);

        const temp = findSensor('ILMA')?.value || '--';
        const roadTemp = findSensor('TIE_1')?.value || '--';
        const wind = findSensor('KESKITUULI')?.value || '--';
        const humidity = findSensor('ILMAN_KOSTEUS')?.value || '--';
        const conditionCode = findSensor('VALLITSEVA_SÄÄ')?.value;

        // Use IDs for these to avoid encoding issues
        const tempMin = findSensorById(213)?.value;
        const tempMax = findSensorById(214)?.value;
        const rainSum = findSensorById(215)?.value;

        const weatherIcon = getWeatherIcon(conditionCode);

        // Format rain sum (if available)
        const rainDisplay = rainSum !== undefined ? `${rainSum} mm` : '--';
        // Format min/max
        const minMaxDisplay = (tempMin !== undefined && tempMax !== undefined)
            ? `${tempMin}° / ${tempMax}°`
            : '--';

        container.innerHTML = `
            <div class="weather-main">
                <div class="weather-icon-large">
                    ${weatherIcon}
                </div>
                <div>
                    <div class="temperature">${temp}°C</div>
                    <div class="temp-min-max" title="Min/Max 24h">${minMaxDisplay}</div>
                </div>
            </div>
            <div class="weather-details">
                <div class="detail-item">
                    <span class="detail-label">Tien pinta</span>
                    <span class="detail-value">${roadTemp}°C</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Tuuli</span>
                    <span class="detail-value">${wind} m/s</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Kosteus</span>
                    <span class="detail-value">${humidity}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Sade 24h</span>
                    <span class="detail-value">${rainDisplay}</span>
                </div>
            </div>
        `;

        const now = new Date();
        lastUpdated.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    } catch (error) {
        console.error('Weather fetch error:', error);
        container.innerHTML = `
            <div class="error">
                <p>Virhe haettaessa tietoja</p>
            </div>
        `;
    } finally {
        refreshBtn.classList.remove('loading');
    }
}


// Initial calls
updateClock();
fetchCalendarInfo(); // This will call renderCalendar() when data arrives
fetchWeather();

// Intervals
setInterval(updateClock, 1000);
setInterval(fetchCalendarInfo, 24 * 60 * 60 * 1000); // Refresh daily
setInterval(fetchWeather, 10 * 60 * 1000); // 10 minutes

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Theme handling
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

initTheme();

// Ensure voices are loaded for better voice selection
window.speechSynthesis.onvoiceschanged = () => {
    // Just to trigger voice list population
};

document.getElementById('refresh-btn').addEventListener('click', fetchWeather);
document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
