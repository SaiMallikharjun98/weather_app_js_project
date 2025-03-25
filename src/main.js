document.addEventListener("DOMContentLoaded", function () {
  let locationElement = document.querySelector("#location");
  let searchElement = document.querySelector("#search-icon");
  let suggestionsList = document.querySelector("#suggestions");
  let degreesElement = document.querySelector("#degrees");
  let weatherUpdateElement = document.querySelector("#weather-update");
  let feelsLikeElement = document.querySelector("#feels-like");
  let humidityElement = document.querySelector("#humidity");
  let windSpeedElement = document.querySelector("#wind-speed");
  let videoElement = document.querySelector("#weather-video");
  let videoSource = document.querySelector("#video-source");
  let spinnerElement = document.querySelector("#spinner");

  const API_KEY = import.meta.env.VITE_API_KEY;

  async function fetchWeather(city) {
    if (!API_KEY) {
      alert("API Key is missing! Check your .env file.");
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    try {
      spinnerElement.classList.remove("hidden");

      const response = await fetch(url);
      if (!response.ok) {
        console.error("API Request Failed:", response.status);
        alert("City not found or API error! Please try again.");
        return;
      }

      const data = await response.json();

      degreesElement.innerText = `${data.main.temp}°C`;
      weatherUpdateElement.innerText = data.weather[0].description;
      feelsLikeElement.innerText = `${data.main.feels_like}°C`;
      humidityElement.innerText = `${data.main.humidity}%`;
      windSpeedElement.innerText = `${data.wind.speed} m/s`;

      updateBackgroundVideo(data.weather[0].main.toLowerCase());
    } catch (error) {
      console.error("Error fetching weather:", error);
      alert("City not found! Please try again.");
    } finally {
      spinnerElement.classList.add("hidden");
    }
  }

  function updateBackgroundVideo(weatherCondition) {
    let newVideoSrc = "./default.mp4";

    if (weatherCondition.includes("rain")) newVideoSrc = "./rain.mp4";
    else if (weatherCondition.includes("cloud")) newVideoSrc = "./cloudy.mp4";
    else if (weatherCondition.includes("clear")) newVideoSrc = "./clearSky.mp4";
    else if (weatherCondition.includes("haze")) newVideoSrc = "./Hazy.mp4";
    else if (weatherCondition.includes("snow")) newVideoSrc = "./snow.mp4";
    else if (weatherCondition.includes("sunny")) newVideoSrc = "./sunny.mp4";

    if (!videoSource.src.endsWith(newVideoSrc)) {
      videoSource.src = newVideoSrc;
      videoElement.load();
    }
  }

  async function fetchCitySuggestions(query) {
    if (query.length < 3) {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.add("show");
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/find?q=${query}&appid=${API_KEY}&units=metric`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      displaySuggestions(data.list);
    } catch (error) {
      console.error("Error fetching city suggestions:", error);
    }
  }

  function displaySuggestions(cities) {
    suggestionsList.innerHTML = "";
    if (!cities.length) {
      suggestionsList.classList.add("hidden");
      return;
    }

    cities.forEach((city) => {
      const li = document.createElement("li");
      li.textContent = `${city.name}, ${city.sys.country}`;
      li.classList.add("p-2", "cursor-pointer", "hover:bg-gray-200");
      li.addEventListener("click", () => {
        locationElement.value = city.name;
        suggestionsList.innerHTML = "";
        suggestionsList.classList.add("hidden");
        fetchWeather(city.name);
      });
      suggestionsList.appendChild(li);
    });

    suggestionsList.classList.remove("hidden");
  }

  locationElement.addEventListener("input", (e) => {
    fetchCitySuggestions(e.target.value);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#suggestions") && e.target !== locationElement) {
      suggestionsList.classList.add("hidden");
    }
  });

  searchElement.addEventListener("click", () => {
    const city = locationElement.value.trim();
    if (city) {
      fetchWeather(city);
    } else {
      alert("Please enter a city name!");
    }
  });
});
