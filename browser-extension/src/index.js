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

  // 위치 추적 버튼 클릭 시 사용자의 현재 위치를 가져옵니다.
  geoButton.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          try {
            // 위도와 경도를 기반으로 Nominatim API를 사용하여 도시 이름을 가져옵니다.
            const reverseGeoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
            const response = await fetch(reverseGeoUrl);
            const data = await response.json();
            if (data && data.address) {
              const cityName =
                data.address.city ||
                data.address.town ||
                data.address.village ||
                "위치 알 수 없음";
              cityInput.value = cityName;
              errorMessage.textContent = "";
            } else {
              errorMessage.textContent = "위치 정보를 찾을 수 없습니다.";
            }
          } catch (error) {
            console.error("역지오코딩 요청 오류:", error);
            errorMessage.textContent = "위치 정보를 불러오는데 실패했습니다.";
          }
        },
        (error) => {
          errorMessage.textContent = "위치 정보를 허용해주세요.";
          console.error("위치 추적 오류:", error);
        }
      );
    } else {
      errorMessage.textContent = "지오로케이션을 지원하지 않는 브라우저입니다.";
    }
  });

  // 도시 자동완성
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

  // 도시 이름 제출 시
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

  // 날씨 정보를 로드하는 함수
  function loadWeatherPage(cityName, latitude, longitude) {
    document.getElementById("main-content").innerHTML = `
            <div id="today-weather">
                <h2>${cityName}의 오늘 날씨</h2>
                <div id="hourly-weather"></div>
            </div>
            <div id="weekly-weather">
                <h2>${cityName}의 일주일 날씨</h2>
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

      // 시간별 날씨 정보 표시
      const hourlyWeatherDiv = document.getElementById("hourly-weather");
      weatherData.hourly.temperature_2m.slice(0, 8).forEach((temp, index) => {
        const hour = new Date().getHours() + index * 3;
        const hourlyElement = document.createElement("div");
        hourlyElement.textContent = `${hour % 24}시: ${temp}°C`;
        hourlyWeatherDiv.appendChild(hourlyElement);
      });

      // 일주일 날씨 정보 표시
      const dailyWeatherDiv = document.getElementById("daily-weather");
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
