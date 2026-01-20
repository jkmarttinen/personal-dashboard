const fs = require('fs');
const path = require('path');
const ical = require('node-ical');

async function generate() {
    const calendarDir = path.join(__dirname, 'Kalenteritiedot');
    const files = fs.readdirSync(calendarDir).filter(f => f.endsWith('.ics'));

    // Load static name days
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
    // Generate for current year and next year to be safe
    const years = [now.getFullYear(), now.getFullYear() + 1];

    years.forEach(year => {
        for (const [datePart, names] of Object.entries(staticNamedays)) {
            const fullDate = `${year}-${datePart}`;
            calendarData.namedays[fullDate] = names;
        }
    });

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

                    if (file.toLowerCase().includes('pyhä') || file.toLowerCase().includes('vapaa')) {
                        if (!calendarData.holidays[date]) calendarData.holidays[date] = [];
                        if (!calendarData.holidays[date].includes(summary)) {
                            calendarData.holidays[date].push(summary);
                        }
                    } else if (file.toLowerCase().includes('nimipäivä')) {
                        if (!calendarData.namedays[date]) calendarData.namedays[date] = [];
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

    // Clean up
    for (const date in calendarData.namedays) {
        const names = calendarData.namedays[date];
        const flatNames = names.flatMap(n => n.split(/[,/]/).map(s => s.trim())).filter(n => n.length > 0);
        calendarData.namedays[date] = [...new Set(flatNames)];
    }

    const output = {
        calendarData
    };

    fs.writeFileSync('static_data.json', JSON.stringify(output, null, 2));
    console.log('Done writing static_data.json');
}

generate();
