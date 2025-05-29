document.addEventListener("DOMContentLoaded", function () {
  // --- Existing Element Selections ---
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
  // --- New Element Selection ---
  let dressImageElement = document.querySelector("#dress-image"); // Add this line

  // --- API Keys and AI Setup (Keep as is, but ensure GOOGLE_API_KEY is correctly passed) ---
  const API_KEY = import.meta.env.VITE_API_KEY;
  // Ensure GOOGLE_API_KEY is fetched correctly from your environment
  const GOOGLE_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  let ai; // Declare ai variable

  // Initialize GoogleGenAI only if the key exists
  if (GOOGLE_API_KEY) {
    try {
      // Assuming GoogleGenAI is available globally or imported correctly
      ai = new GoogleGenerativeAI(GOOGLE_API_KEY);
    } catch (error) {
      console.error("Error initializing GoogleGenAI:", error);
      // Handle the error, maybe disable AI features
    }
  } else {
    console.warn("GOOGLE_API_KEY not found. AI features will be disabled.");
  }

  async function fetchWeather(city) {
    if (!API_KEY) {
      alert("OpenWeatherMap API Key is missing! Check your .env file.");
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    try {
      spinnerElement.classList.remove("hidden");
      dressImageElement.src = "images/default-dress.png"; // Reset dress image while loading
      dressImageElement.alt = "Loading suggested attire...";

      const response = await fetch(url);
      if (!response.ok) {
        console.error(
          "API Request Failed:",
          response.status,
          await response.text()
        ); // Log response body for more details
        alert(
          "City not found or API error! Please check the city name and try again."
        );
        spinnerElement.classList.add("hidden"); // Hide spinner on error
        return; // Stop execution if city not found
      }

      const data = await response.json();

      // --- Update Weather Info (Existing) ---
      degreesElement.innerText = `${Math.round(data.main.temp)}°C`; // Round temperature
      weatherUpdateElement.innerText = data.weather[0].description;
      feelsLikeElement.innerText = `${Math.round(data.main.feels_like)}°C`; // Round feels like
      humidityElement.innerText = `${data.main.humidity}%`;
      windSpeedElement.innerText = `${data.wind.speed} m/s`;

      // --- Update Background Video and Dress Image ---
      const weatherCondition = data.weather[0].main.toLowerCase();
      updateBackgroundVideo(weatherCondition);
      updateDressImage(weatherCondition, data.main.temp); // Pass weather condition and temp

      // --- Call AI function (if initialized) ---
      if (ai) {
        await fetchWeatherDressSuggestion(weatherCondition, data.main.temp);
      } else {
        // Optionally display a message if AI is not available
        console.log(
          "AI suggestion feature disabled (API key missing or initialization failed)."
        );
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
      alert("An error occurred while fetching weather data. Please try again.");
      dressImageElement.src = "images/default-dress.png"; // Reset dress image on error
      dressImageElement.alt = "Error loading suggestion";
    } finally {
      spinnerElement.classList.add("hidden");
    }
  }

  // --- AI Dress Suggestion Function ---
  async function fetchWeatherDressSuggestion(condition, temperature) {
    if (!ai) return; // Don't run if AI is not initialized

    // Refine the prompt for better suggestions
    const prompt = `Based on the weather condition '${condition}' and a temperature of ${temperature}°C, briefly suggest what type of clothing someone might wear. Focus on practicality for the weather. Example: 'Wear a warm coat, scarf, and hat.' or 'A light jacket or sweater would be suitable.'`;

    try {
      // Use the correct model name ('gemini-pro' or the specific one you have access to)
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use getGenerativeModel
      const result = await model.generateContent(prompt);
      const response = await result.response; // Await the response promise
      const text = await response.text(); // Await the text promise

      console.log("AI Suggestion:", text);
      // You could display this text somewhere on the page if desired
      // Example:
      // let aiSuggestionElement = document.querySelector("#ai-suggestion"); // Add an element with this ID to your HTML
      // if (aiSuggestionElement) aiSuggestionElement.innerText = text;
    } catch (error) {
      console.error("Error getting AI dress suggestion:", error);
      // Handle errors gracefully, maybe display a default message
    }
  }

  function updateBackgroundVideo(weatherCondition) {
    let newVideoSrc = "./.mp4"; // Ensure paths are correct

    // Use includes for broader matching
    if (
      weatherCondition.includes("rain") ||
      weatherCondition.includes("drizzle")
    )
      newVideoSrc = "./rain.mp4";
    else if (weatherCondition.includes("cloud")) newVideoSrc = "./cloudy.mp4";
    else if (weatherCondition.includes("clear")) newVideoSrc = "./clearSky.mp4";
    else if (
      weatherCondition.includes("mist") ||
      weatherCondition.includes("haze") ||
      weatherCondition.includes("fog")
    )
      newVideoSrc = "./Hazy.mp4"; // Group hazy conditions
    else if (weatherCondition.includes("snow")) newVideoSrc = "./snow.mp4";
    // Add sunny explicitly if 'clear' isn't always sunny
    else if (weatherCondition.includes("sun")) newVideoSrc = "./sunny.mp4";
    // Add more conditions like thunderstorm, etc. if you have videos for them

    // Check if the source needs changing before loading
    const currentVideoBase = videoSource.src.substring(
      videoSource.src.lastIndexOf("/") + 1
    );
    const newVideoBase = newVideoSrc.substring(
      newVideoSrc.lastIndexOf("/") + 1
    );

    if (currentVideoBase !== newVideoBase) {
      videoSource.src = newVideoSrc;
      videoElement.load(); // Load the new video
      videoElement
        .play()
        .catch((error) => console.log("Autoplay prevented:", error)); // Attempt to play
    }
  }

  // --- New Function to Update Dress Image ---
  function updateDressImage(weatherCondition, temperature) {
    let newImageSrc = "images/default-dress.jpg"; // Default image path
    let altText = "Suggested attire for current weather";

    // Refine logic based on condition AND potentially temperature
    if (
      weatherCondition.includes("rain") ||
      weatherCondition.includes("drizzle")
    ) {
      newImageSrc = "images/rainy-dress.jpg";
      altText = "Suggested attire for rain: Raincoat, umbrella";
    } else if (weatherCondition.includes("snow")) {
      newImageSrc = "images/snowy-dress.png";
      altText = "Suggested attire for snow: Heavy coat, hat, gloves";
    } else if (
      weatherCondition.includes("clear") ||
      weatherCondition.includes("sun")
    ) {
      // Consider temperature for clear/sunny days
      if (temperature > 25) {
        // Hot
        newImageSrc = "images/sunny-dress.jpeg"; // Assume sunny-dress is for warm weather
        altText = "Suggested attire for hot sunny weather: T-shirt, shorts";
      } else if (temperature > 15) {
        // Mild / Warm
        newImageSrc = "images/clear-dress.jpg"; // Assume clear-dress is for milder weather
        altText =
          "Suggested attire for mild clear weather: Light layers, t-shirt";
      } else {
        // Cool / Cold
        newImageSrc = "images/cloudy-dress.jpg"; // Use cloudy or another image for cool clear
        altText = "Suggested attire for cool clear weather: Sweater or jacket";
      }
    } else if (weatherCondition.includes("cloud")) {
      // Consider temperature for cloudy days
      if (temperature > 20) {
        // Warm cloudy
        newImageSrc = "images/clear-dress.jpg"; // Maybe light clothing is still okay
        altText =
          "Suggested attire for warm cloudy weather: T-shirt, light layers";
      } else if (temperature > 10) {
        // Mild/Cool cloudy
        newImageSrc = "images/cloudy-dress.jpg";
        altText =
          "Suggested attire for cool cloudy weather: Sweater or light jacket";
      } else {
        // Cold cloudy
        newImageSrc = "images/snowy-dress.jpg"; // Use a warmer image like snowy or a dedicated 'cold' image
        altText =
          "Suggested attire for cold cloudy weather: Warm jacket or coat";
      }
    } else if (
      weatherCondition.includes("mist") ||
      weatherCondition.includes("haze") ||
      weatherCondition.includes("fog")
    ) {
      newImageSrc = "images/hazy-dress.avif"; // Use hazy or cloudy image
      altText =
        "Suggested attire for hazy/misty weather: Light jacket or layers";
    }
    // Add more conditions like 'thunderstorm', 'squall', etc. if needed

    dressImageElement.src = newImageSrc;
    dressImageElement.alt = altText; // Update alt text for accessibility
  }

  // --- City Suggestions (Existing - Keep as is) ---
  async function fetchCitySuggestions(query) {
    if (!API_KEY) return; // Don't fetch if key is missing
    if (query.length < 3) {
      suggestionsList.innerHTML = "";
      suggestionsList.classList.add("hidden"); // Use hidden instead of show
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/find?q=${query}&type=like&sort=population&cnt=5&appid=${API_KEY}&units=metric`; // Limit results, sort by population

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error("City Suggestion API Request Failed:", response.status);
        suggestionsList.classList.add("hidden");
        return;
      }
      const data = await response.json();
      displaySuggestions(data.list || []); // Handle cases where list might be missing
    } catch (error) {
      console.error("Error fetching city suggestions:", error);
      suggestionsList.classList.add("hidden");
    }
  }

  function displaySuggestions(cities) {
    suggestionsList.innerHTML = "";
    if (!cities || !cities.length) {
      // Check if cities is null or empty
      suggestionsList.classList.add("hidden");
      return;
    }

    cities.forEach((city) => {
      // Defensive check for necessary properties
      if (city && city.name && city.sys && city.sys.country) {
        const li = document.createElement("li");
        li.textContent = `${city.name}, ${city.sys.country}`;
        li.classList.add(
          "p-2",
          "cursor-pointer",
          "hover:bg-gray-200",
          "text-sm"
        ); // Style suggestion items
        li.addEventListener("click", () => {
          locationElement.value = city.name; // Set input value to just the city name
          suggestionsList.innerHTML = "";
          suggestionsList.classList.add("hidden");
          fetchWeather(city.name); // Fetch weather for the selected city
        });
        suggestionsList.appendChild(li);
      }
    });

    if (suggestionsList.children.length > 0) {
      suggestionsList.classList.remove("hidden"); // Show suggestions only if items were added
    } else {
      suggestionsList.classList.add("hidden");
    }
  }

  
  locationElement.addEventListener("input", (e) => {
    
    clearTimeout(locationElement.suggestionTimeout);
    locationElement.suggestionTimeout = setTimeout(() => {
      fetchCitySuggestions(e.target.value);
    }, 300); // Wait 300ms after user stops typing
  });

  // Hide suggestions when clicking outside
  document.addEventListener("click", (e) => {
    // Check if the click target is the input or within the suggestions list
    if (!suggestionsList.contains(e.target) && e.target !== locationElement) {
      suggestionsList.classList.add("hidden");
    }
  });

  // Allow pressing Enter in the input field to trigger search
  locationElement.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const city = locationElement.value.trim();
      if (city) {
        suggestionsList.classList.add("hidden"); // Hide suggestions
        fetchWeather(city);
      } else {
        alert("Please enter a city name!");
      }
    }
  });

  searchElement.addEventListener("click", () => {
    const city = locationElement.value.trim();
    if (city) {
      suggestionsList.classList.add("hidden"); // Hide suggestions
      fetchWeather(city);
    } else {
      alert("Please enter a city name!");
    }
  });
});
