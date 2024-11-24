document.addEventListener("DOMContentLoaded", () => {
  const geoButton = document.getElementById("geoButton");
  const submitButton = document.getElementById("submitButton");
  const cityInput = document.getElementById("cityInput");
  const suggestionsDiv = document.getElementById("suggestions");
  const errorMessage = document.getElementById("error-message");

  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  const fetchSuggestions = debounce(async (query) => {
    if (query.length < 2) {
      suggestionsDiv.innerHTML = "";
      return;
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&addressdetails=1&limit=5`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      suggestionsDiv.innerHTML = "";
      data.forEach((location) => {
        const suggestion = document.createElement("div");
        suggestion.className = "suggestion";
        suggestion.textContent = location.display_name;
        suggestion.addEventListener("click", () => {
          cityInput.value = location.display_name;
          suggestionsDiv.innerHTML = "";
        });
        suggestionsDiv.appendChild(suggestion);
      });
    } catch (error) {
      console.error("자동완성 요청 오류:", error);
    }
  }, 300);

  cityInput.addEventListener("input", (e) => {
    fetchSuggestions(e.target.value);
  });

  submitButton.addEventListener("click", async () => {
    const cityName = cityInput.value.trim();
    if (!cityName) {
      errorMessage.textContent = "도시 이름을 입력해주세요.";
      return;
    }

    try {
      // 지오코딩 API를 사용해 도시의 위도와 경도를 가져옵니다.
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        cityName
      )}&format=json&addressdetails=1&limit=1`;
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();

      if (geoData.length === 0) {
        throw new Error("올바른 위치를 찾을 수 없습니다.");
      }

      const { lat, lon } = geoData[0];
      loadWeatherPage(cityName, lat, lon);
    } catch (error) {
      errorMessage.textContent = "위치를 찾을 수 없습니다. 다시 시도해주세요.";
    }
  });

  function loadWeatherPage(cityName, latitude, longitude) {
    document.getElementById("main-content").innerHTML = `
            <div id="today-weather">
                <h2>${cityName}의 오늘 날씨</h2>
                <!-- 여기에서 날씨 API를 통해 가져온 데이터를 시간별로 표시합니다. -->
                <div id="hourly-weather"></div>
            </div>
            <div id="weekly-weather">
                <h2>${cityName}의 일주일 날씨</h2>
                <!-- 여기에서 날씨 API를 통해 가져온 데이터를 요일별로 표시합니다. -->
                <div id="daily-weather"></div>
            </div>
        `;

    fetchWeatherData(latitude, longitude);
  }

  async function fetchWeatherData(latitude, longitude) {
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&current_weather=true`;
      const weatherResponse = await fetch(weatherUrl);
      const weatherData = await weatherResponse.json();

      // 날씨 데이터를 시간별 및 요일별로 업데이트합니다.
      const hourlyWeatherDiv = document.getElementById("hourly-weather");
      const dailyWeatherDiv = document.getElementById("daily-weather");

      // 시간별 날씨 정보 표시 (예시)
      weatherData.hourly.temperature_2m.slice(0, 8).forEach((temp, index) => {
        const hour = new Date().getHours() + index * 3;
        const hourlyElement = document.createElement("div");
        hourlyElement.textContent = `${hour % 24}시: ${temp}°C`;
        hourlyWeatherDiv.appendChild(hourlyElement);
      });

      // 일주일 날씨 정보 표시 (예시)
      weatherData.daily.temperature_2m_max.forEach((temp, index) => {
        const dailyElement = document.createElement("div");
        dailyElement.textContent = `요일 ${index + 1}: 최고 ${temp}°C / 최저 ${
          weatherData.daily.temperature_2m_min[index]
        }°C`;
        dailyWeatherDiv.appendChild(dailyElement);
      });
    } catch (error) {
      console.error("날씨 정보를 가져오는 중 오류 발생:", error);
    }
  }
});
