require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3100;

app.use(cors());

// Secret path for access
const secretPath = process.env.SECRET_PATH || '/dashboard';

// Serve static files
// Disable caching for all routes
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

app.use(secretPath, express.static(path.join(__dirname, 'public')));

// Root redirect or 404
app.get('/', (req, res) => {
    res.status(404).send('Not Found');
});

// API Proxy for Weather
app.get(`${secretPath}/api/weather`, async (req, res) => {
    try {
        const response = await axios.get('https://tie.digitraffic.fi/api/weather/v1/stations/1087/data', {
            headers: { 'Accept-Encoding': 'gzip' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching weather:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

const ical = require('node-ical');
const fs = require('fs');

// TTS Proxy for better compatibility
app.get(`${secretPath}/api/speak`, async (req, res) => {
    const text = req.query.text || 'Esko on kova jätkä';
    try {
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=fi&client=tw-ob`;
        const response = await axios({
            method: 'get',
            url: ttsUrl,
            responseType: 'stream',
            headers: {
                'Referer': 'http://translate.google.com/',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        res.setHeader('Content-Type', 'audio/mpeg');
        response.data.pipe(res);
    } catch (error) {
        console.error('Error in TTS proxy:', error);
        res.status(500).send('TTS failed');
    }
});

// Calendar API
app.get(`${secretPath}/api/calendar-info`, async (req, res) => {
    try {
        const calendarDir = path.join(__dirname, 'Kalenteritiedot');
        const files = fs.readdirSync(calendarDir).filter(f => f.endsWith('.ics'));

        // Load static name days for full-year coverage
        let staticNamedays = {};
        try {
            const staticNamedaysPath = path.join(calendarDir, 'finnish_namedays.json');
            if (fs.existsSync(staticNamedaysPath)) {
                staticNamedays = JSON.parse(fs.readFileSync(staticNamedaysPath, 'utf8'));
            }
        } catch (e) {
            console.error('Error loading static namedays:', e);
        }

        const calendarData = {
            holidays: {},
            namedays: {}
        };

        // Initialize namedays from static source
        const now = new Date();
        const currentYear = now.getFullYear();

        for (const [datePart, names] of Object.entries(staticNamedays)) {
            const fullDate = `${currentYear}-${datePart}`;
            calendarData.namedays[fullDate] = names;
        }

        for (const file of files) {
            const filePath = path.join(calendarDir, file);
            const events = ical.sync.parseFile(filePath);

            for (const k in events) {
                if (events.hasOwnProperty(k)) {
                    const ev = events[k];
                    if (ev.type === 'VEVENT') {
                        const date = ev.start.toISOString().split('T')[0];
                        let summary = ev.summary;
                        if (summary && typeof summary === 'object' && summary.val) {
                            summary = summary.val;
                        }

                        // We still parse holidays from ICS as they vary by year (e.g. Easter)
                        if (file.toLowerCase().includes('pyhä') || file.toLowerCase().includes('vapaa')) {
                            if (!calendarData.holidays[date]) calendarData.holidays[date] = [];
                            if (!calendarData.holidays[date].includes(summary)) {
                                calendarData.holidays[date].push(summary);
                            }
                        } else if (file.toLowerCase().includes('nimipäivä')) {
                            // Merge with existing data
                            if (!calendarData.namedays[date]) calendarData.namedays[date] = [];

                            // Split and clean names
                            const newNames = summary.split(/[,/]/).map(n => n.trim()).filter(n => n.length > 0);
                            for (const name of newNames) {
                                if (!calendarData.namedays[date].includes(name)) {
                                    calendarData.namedays[date].push(name);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Clean up and format namedays from the static JSON as well
        for (const date in calendarData.namedays) {
            const names = calendarData.namedays[date];
            // Split any remaining combined strings and unique again
            const flatNames = names.flatMap(n => n.split(/[,/]/).map(s => s.trim())).filter(n => n.length > 0);
            calendarData.namedays[date] = [...new Set(flatNames)];
        }

        res.json(calendarData);
    } catch (error) {
        console.error('Error fetching calendar info:', error);
        res.status(500).json({ error: 'Failed to fetch calendar info' });
    }
});

app.listen(port, () => {
    console.log(`Personal Dashboard running on port ${port}`);
    console.log(`Access at: http://localhost:${port}${secretPath}`);
});
