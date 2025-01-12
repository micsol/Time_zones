const timeInputs = {
    'la-time': 'America/Los_Angeles',
    'ny-time': 'America/New_York',
    'london-time': 'Europe/London',
    'paris-time': 'Europe/Paris',
    'moscow-time': 'Europe/Moscow',
    'dubai-time': 'Asia/Dubai',
    'tokyo-time': 'Asia/Tokyo',
    'sydney-time': 'Australia/Sydney'
};

function drawClock(canvasId, hours, minutes) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const radius = canvas.height / 2;
    
    // Очищаем канвас
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Сбрасываем трансформацию
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Перемещаем в центр
    ctx.translate(radius, radius);
    
    // Масштабируем для удобства рисования
    const scale = radius * 0.9;
    ctx.scale(scale, scale);

    // Рисуем циферблат
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.05;
    ctx.stroke();

    // Рисуем деления часов
    for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.rotate(angle);
        ctx.moveTo(0.85, 0);
        ctx.lineTo(1, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.03;
        ctx.stroke();
        ctx.rotate(-angle);
    }

    // Рисуем стрелки
    // Часовая стрелка
    // Преобразуем 24-часовой формат в 12-часовой
    const hour12 = hours % 12;
    // Вычисляем угол для часовой стрелки (учитывая минуты)
    // -Math.PI/2 чтобы начинать отсчет от 12 часов
    const hourAngle = (hour12 + minutes/60) * (Math.PI/6) - Math.PI/2;
    drawHand(ctx, hourAngle, 0.5, 0.07, '#ffffff');

    // Минутная стрелка
    // Вычисляем угол для минутной стрелки
    // -Math.PI/2 чтобы начинать отсчет от 12 часов
    const minuteAngle = (minutes * Math.PI/30) - Math.PI/2;
    drawHand(ctx, minuteAngle, 0.8, 0.05, '#ffffff');

    // Центральная точка
    ctx.beginPath();
    ctx.arc(0, 0, 0.07, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
}

function drawHand(ctx, angle, length, width, color) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    // Больше не используем rotate, вместо этого используем тригонометрию
    ctx.moveTo(0, 0);
    ctx.lineTo(
        Math.cos(angle) * length,
        Math.sin(angle) * length
    );
    ctx.stroke();
}

async function getAccurateTime() {
    try {
        const response = await fetch('https://worldtimeapi.org/api/timezone/Europe/Moscow');
        const data = await response.json();
        return new Date(data.datetime);
    } catch (error) {
        console.error('Ошибка при синхронизации времени:', error);
        return new Date();
    }
}

async function syncAllClocks() {
    try {
        const accurateTime = await getAccurateTime();
        const moscowHours = accurateTime.getHours();
        const moscowMinutes = accurateTime.getMinutes();
        const seconds = accurateTime.getSeconds();

        // Устанавливаем время для всех зон относительно московского времени
        const moscowDate = new Date();
        moscowDate.setHours(moscowHours);
        moscowDate.setMinutes(moscowMinutes);
        moscowDate.setSeconds(0);

        // Обновляем все часовые пояса
        for (const [inputId, timezone] of Object.entries(timeInputs)) {
            const localTime = moscowDate.toLocaleString('en-US', { timeZone: timezone });
            const localDate = new Date(localTime);
            
            const localHours = localDate.getHours();
            const localMinutes = localDate.getMinutes();
            
            // Обновляем цифровое время
            document.getElementById(inputId).value = 
                `${String(localHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')}`;
            
            // Обновляем аналоговые часы
            drawClock(inputId.replace('time', 'clock'), localHours, localMinutes);
        }

        // Следующая синхронизация
        const nextSync = (60 - seconds) * 1000;
        setTimeout(syncAllClocks, nextSync);
    } catch (error) {
        console.error('Ошибка синхронизации:', error);
        setTimeout(syncAllClocks, 60000);
    }
}

function updateAllTimes(sourceId) {
    const sourceInput = document.getElementById(sourceId);
    const [hours, minutes] = sourceInput.value.split(':').map(Number);
    const sourceDate = new Date();
    sourceDate.setHours(hours);
    sourceDate.setMinutes(minutes);
    sourceDate.setSeconds(0);

    const sourceTimezone = timeInputs[sourceId];
    const sourceTime = sourceDate.toLocaleString('en-US', { timeZone: sourceTimezone });
    const sourceTimeObj = new Date(sourceTime);

    for (const [inputId, timezone] of Object.entries(timeInputs)) {
        const targetTime = sourceTimeObj.toLocaleString('en-US', { timeZone: timezone });
        const targetDate = new Date(targetTime);
        
        const targetHours = targetDate.getHours();
        const targetMinutes = targetDate.getMinutes();
        
        document.getElementById(inputId).value = 
            `${String(targetHours).padStart(2, '0')}:${String(targetMinutes).padStart(2, '0')}`;
        
        drawClock(inputId.replace('time', 'clock'), targetHours, targetMinutes);
    }
}

async function initializeCurrentTime() {
    await syncAllClocks();
    
    for (const inputId of Object.keys(timeInputs)) {
        document.getElementById(inputId).addEventListener('change', (e) => {
            updateAllTimes(e.target.id);
        });
    }
}

window.onload = initializeCurrentTime; 