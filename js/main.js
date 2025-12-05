const API_KEY = 'd807b912-b567-45ed-88f3-d8628438bdd3';

const citySelect = document.getElementById('city');
const updateBtn = document.getElementById('update');
const hoursCheck = document.getElementById('hours');
const extraCheck = document.getElementById('extra');
const limitInput = document.getElementById('limit');
const weatherCard = document.getElementById('weather');
const placeEl = document.getElementById('place');
const timeEl = document.getElementById('time');
const tempVal = document.getElementById('temp-val');
const condEl = document.getElementById('cond');
const iconEl = document.getElementById('icon');
const feelsEl = document.getElementById('feels');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const errorEl = document.getElementById('error');

const condIcons = {
  'clear': '☀️',
  'partly-cloudy': '⛅',
  'cloudy': '☁️',
  'overcast': '🌥️',
  'drizzle': '🌦️',
  'light-rain': '🌧️',
  'rain': '🌧️',
  'moderate-rain': '🌧️',
  'heavy-rain': '⛈️',
  'sleet': '🌨️',
  'snow': '❄️',
  'light-snow': '🌨️',
  'hail': '🌨️',
  'thunderstorm': '🌩️',
  'unknown': '🌫️'
};

const precTypeText = {
  0: 'нет',
  1: 'дождь',
  2: 'дождь и снег',
  3: 'снег',
  4: 'град'
};

function showError(msg){
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
}

function clearError(){
  errorEl.textContent = '';
  errorEl.classList.add('hidden');
}

async function fetchWeather(lat, lon) {
  const limit = parseInt(limitInput?.value || '3', 10) || 3;
  const hours = hoursCheck?.checked ? 1 : 0;
  const extra = extraCheck?.checked ? 1 : 0;
  const url = `https://api.weather.yandex.ru/v2/forecast?lat=${lat}&lon=${lon}&lang=ru_RU&limit=${limit}&hours=${hours}&extra=${extra}`;

  const headers = {
    'X-Yandex-API-Key': API_KEY
  };

  try{
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      throw new Error(`Ошибка API: ${resp.status} ${resp.statusText}`);
    }
    const data = await resp.json();
    return data;
  }catch(e){
    throw e;
  }
}

function updateUI(data, coords){
  const locText = coords.name || `${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}`;
  placeEl.textContent = locText;
  timeEl.textContent = data.now_dt ? new Date(data.now_dt).toLocaleString('ru-RU') : '';

  const fact = data.fact || {};
  tempVal.textContent = (fact.temp === undefined) ? '—°C' : `${fact.temp}°C`;
  condEl.textContent = fact.condition || '—';
  iconEl.textContent = condIcons[fact.condition] || condIcons['unknown'];
  feelsEl.textContent = (fact.feels_like === undefined) ? '—°C' : `${fact.feels_like}°C`;
  humidityEl.textContent = (fact.humidity === undefined) ? '—%' : `${fact.humidity}%`;
  windEl.textContent = (fact.wind_speed === undefined) ? '— м/с' : `${fact.wind_speed} м/с`;

  weatherCard.classList.remove('hidden');

  const metaGeo = document.getElementById('meta-geo');
  const metaInfo = document.getElementById('meta-info');
  const geo = data.geo_object || {};
  const locality = (geo.locality && geo.locality.name) ? geo.locality.name : '';
  const province = (geo.province && geo.province.name) ? geo.province.name : '';
  const country = (geo.country && geo.country.name) ? geo.country.name : '';
  metaGeo.innerHTML = `<strong>${locality || coords.name}</strong> ${province? '<span> • '+province+'</span>':''} ${country? '<span> • '+country+'</span>':''}`;
  metaInfo.innerHTML = '';
  if (data.info){
    metaInfo.innerHTML += data.info.url ? `<div>Источник: <a href="${data.info.url}" target="_blank">Яндекс.Погода</a></div>` : '';
    if (data.info.tzinfo) metaInfo.innerHTML += `<div>Time zone: ${data.info.tzinfo.name || data.info.tz}</div>`;
  }

  const forecastsWrap = document.getElementById('forecasts');
  const forecastsList = document.getElementById('forecasts-list');
  forecastsList.innerHTML = '';
  const forecasts = data.forecasts || [];
  if (forecasts.length){
    forecastsWrap.classList.remove('hidden');
    forecasts.forEach(day => {
      const el = document.createElement('div');
      el.className = 'forecast-day';
      const date = day.date || '';
      const dayName = new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'long' });
      const tempMin = day.parts?.day?.temp_min ?? day.temp_min ?? day.parts?.day?.temp;
      const tempMax = day.parts?.day?.temp_max ?? day.temp_max ?? day.parts?.day?.temp;
      const sunrise = day.sunrise || '';
      const sunset = day.sunset || '';

      el.innerHTML = `
        <div class="left">
          <div class="date">${date} <small style="color:var(--muted);">${dayName}</small></div>
          <div class="summary" style="color:var(--muted); font-size:13px;">⏱ ${sunrise} • 🌇 ${sunset}</div>
        </div>
        <div class="right">
          <div style="font-weight:700; font-size:16px;">${tempMin !== undefined ? tempMin+'° / ' : ''}${tempMax !== undefined ? tempMax+'°' : ''}</div>
          <div style="margin-top:6px; color:var(--muted); font-size:13px">${condIcons[day.parts?.day?.condition || day.parts?.night?.condition || day.condition] || '—'}</div>
        </div>
      `;

      const partsWrap = document.createElement('div');
      partsWrap.className = 'part-grid';
      const parts = day.parts || {};
      for (const [partName, partData] of Object.entries(parts)){
        const p = document.createElement('div');
        p.className = 'part';
        const cond = partData.condition || partData.icon || '';
        p.innerHTML = `<div style="font-weight:700;">${partName}</div><div>${partData.temp !== undefined ? partData.temp+'°':''}</div><div style="color:var(--muted); font-size:12px;">${partData.condition || ''} ${partData.prec_mm ? ' • '+partData.prec_mm+'мм':''}</div>`;
        partsWrap.appendChild(p);
      }

      el.appendChild(partsWrap);
      el.addEventListener('click', (ev) => {
        if (ev.target && ev.target.tagName === 'A') return;
        el.classList.toggle('expanded');
      });
      forecastsList.appendChild(el);
    });
  } else {
    forecastsWrap.classList.add('hidden');
  }

  const hoursPanel = document.getElementById('hours-panel');
  const hoursList = document.getElementById('hours-list');
  hoursList.innerHTML = '';
  const allHours = data.hours || (forecasts[0] && forecasts[0].hours) || [];
  if (allHours && allHours.length && hoursCheck.checked){
    hoursPanel.classList.remove('hidden');
    const grid = document.createElement('div');
    grid.className = 'hours-grid';
    allHours.forEach(h => {
      const it = document.createElement('div');
      it.className = 'hour-item';
      it.innerHTML = `<div style="font-weight:700">${new Date((h.hour_ts||h.hour_ts*1000) || (h.hour_ts*1000)).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</div><div style="font-size:18px">${condIcons[h.condition]||'❓'}</div><div style="font-weight:700">${h.temp}°C</div><div style="color:var(--muted); font-size:12px">${precTypeText[h.prec_type] ? precTypeText[h.prec_type] : ''} ${h.prec_mm? h.prec_mm+'мм':''}</div>`;
      grid.appendChild(it);
    });
    hoursList.appendChild(grid);
  } else {
    hoursPanel.classList.add('hidden');
  }
}

updateBtn.addEventListener('click', async () => {
  clearError();

  const val = citySelect.value;
  const parts = val.split(',');
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lon)) {
    showError('Неверные координаты выбранного города.');
    return;
  }

  updateBtn.disabled = true;
  const prevText = updateBtn.textContent;
  updateBtn.textContent = 'Загрузка…';
  tempVal.textContent = 'Загрузка...';
  condEl.textContent = '';
  iconEl.textContent = '⏳';

  try{
    const data = await fetchWeather(lat, lon);
    const cityName = citySelect.options[citySelect.selectedIndex].text;
    updateUI(data, { lat, lon, name: cityName });
  }catch(e){
    tempVal.textContent = '—°C';
    iconEl.textContent = '⚠️';
    showError(e.message || String(e));
  } finally {
    updateBtn.disabled = false;
    updateBtn.textContent = prevText;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  updateBtn.click();
});