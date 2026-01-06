const API_KEY = "b213e5c992a74562a07162625260501";
const MAX_HISTORY = 5;
const REFRESH_INTERVAL = 30 * 60 * 1000;

let lastQuery = null;

document.addEventListener("DOMContentLoaded", () => {
  loadHistory();
  showLoadingState();
  autoDetectWeather();
  startAutoRefresh();
});

/* 🔄 Show loading instead of empty search */
function showLoadingState() {
  document.getElementById("error").innerText = "Detecting your location…";
}

/* 📍 Auto-detect location ON OPEN */
function autoDetectWeather() {
    if (!navigator.geolocation) {
      loadLastCityFallback();
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        lastQuery = `${lat},${lon}`;
        getWeather(lastQuery, false);
      },
      () => {
        loadLastCityFallback(); // 👈 graceful fallback
      }
    );
  }
  

  function loadLastCityFallback() {
    const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  
    if (history.length > 0) {
      lastQuery = history[0];
      getWeather(lastQuery, false);
    } else {
      document.getElementById("error").innerText =
        "Search a city to see the weather";
    }
  }
  

/* 🔁 Auto refresh every 30 minutes */
function startAutoRefresh() {
  setInterval(() => {
    if (lastQuery) {
      getWeather(lastQuery, false);
    }
  }, REFRESH_INTERVAL);
}

/* 🌦 Fetch weather */
async function getWeather(query = null, saveToHistory = true) {
  const input = document.getElementById("cityInput");
  const city = query || input.value.trim();
  const box = document.getElementById("weatherBox");
  const forecastBox = document.getElementById("forecast");
  const error = document.getElementById("error");

  if (!city) return;

  lastQuery = city;

  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=7&aqi=no&alerts=no`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) throw new Error();

    if (saveToHistory) {
      saveHistory(data.location.name);
    }

    /* Update UI */
    document.getElementById("city").innerText =
      `${data.location.name}, ${data.location.country}`;
    document.getElementById("temp").innerText = `${data.current.temp_c}°C`;
    document.getElementById("condition").innerText = data.current.condition.text;
    document.getElementById("humidity").innerText = data.current.humidity;
    document.getElementById("wind").innerText = data.current.wind_kph;
    document.getElementById("feels").innerText = data.current.feelslike_c;
    document.getElementById("icon").src =
      "https:" + data.current.condition.icon;

    applyBackground(data);
    showSun(data);

    /* Forecast */
    forecastBox.innerHTML = "";
    data.forecast.forecastday.forEach(day => {
      forecastBox.innerHTML += `
        <div class="day">
          <p>${day.date}</p>
          <img src="https:${day.day.condition.icon}">
          <p>${day.day.avgtemp_c}°C</p>
        </div>
      `;
    });

    box.style.display = "block";
    error.innerText = "";
    input.value = "";

  } catch {
    error.innerText = "Unable to fetch weather";
    box.style.display = "none";
    forecastBox.innerHTML = "";
  }
}

/* 🌙 Background */
function applyBackground(data) {
  document.body.className = "";
  const text = data.current.condition.text.toLowerCase();
  if (text.includes("rain")) document.body.classList.add("rain");
  else if (text.includes("cloud")) document.body.classList.add("cloudy");
  else if (data.current.is_day) document.body.classList.add("clear-day");
  else document.body.classList.add("clear-night");
}

/* ☀️ Sun animation */
function showSun(data) {
  let sun = document.querySelector(".sun");
  if (!sun) {
    sun = document.createElement("div");
    sun.className = "sun";
    document.querySelector(".app").prepend(sun);
  }
  sun.style.display = data.current.is_day ? "block" : "none";
}

/* 🕒 History */
function saveHistory(city) {
  let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  history = history.filter(c => c.toLowerCase() !== city.toLowerCase());
  history.unshift(city);
  history = history.slice(0, MAX_HISTORY);
  localStorage.setItem("weatherHistory", JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];

  history.forEach(city => {
    const li = document.createElement("li");
    li.innerText = city;
    li.onclick = () => getWeather(city);
    list.appendChild(li);
  });
}