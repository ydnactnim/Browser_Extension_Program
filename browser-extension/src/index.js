document.addEventListener("DOMContentLoaded", () => {
  const geoButton = document.getElementById("geoButton");
  const submitButton = document.getElementById("submitButton");
  let cityInput = document.getElementById("cityInput");
  const suggestionsDiv = document.getElementById("suggestions");
  const errorMessage = document.getElementById("error-message");
  let changeLocationButton;

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
      suggestionsDiv.style.width = `${cityInput.offsetWidth}px`; // 입력창의 너비에 맞춤
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
      addChangeLocationButton();
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
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true`;
      const weatherResponse = await fetch(weatherUrl);
      const weatherData = await weatherResponse.json();

      const weatherIcons = {
        0: "images/clear.svg", // 맑음
        1: "images/mostly_clear.svg", // 대체로 맑음
        2: "images/partly_cloudy.svg", // 부분적으로 흐림
        3: "images/cloudy.svg", // 흐림
        45: "images/fog.svg", // 안개
        48: "images/sleet.svg", // 진눈깨비
        51: "images/ligth_drizzle.svg", // 약한 이슬비
        53: "images/medium_drizzle.svg", // 중간 이슬비
        55: "images/heavy_drizzle.svg", // 강한 이슬비
        61: "images/light_rain.svg", // 약한 비
        63: "images/medium_rain.svg", // 중간 비
        65: "images/heavy_rain.svg", // 강한 비
        80: "images/shower.svg", // 소나기
        81: "images/heavy_shower.svg", // 강한 소나기
        95: "images/thunderstorm.svg", // 천둥번개
        // 필요한 추가 아이콘
      };

      const weatherDescriptions = {
        0: "맑음",
        1: "대체로 맑음",
        2: "부분적으로 흐림",
        3: "흐림",
        45: "안개",
        48: "진눈깨비",
        51: "약한 이슬비",
        53: "중간 이슬비",
        55: "강한 이슬비",
        61: "약한 비",
        63: "중간 비",
        65: "강한 비",
        80: "소나기",
        81: "강한 소나기",
        95: "천둥번개",
        // 더 많은 날씨 코드를 추가 가능
      };

      // 시간별 날씨 정보 표시
      const hourlyWeatherDiv = document.getElementById("hourly-weather");
      weatherData.hourly.weathercode.slice(0, 8).forEach((code, index) => {
        const hour = new Date().getHours() + index * 3;
        const weatherDescription =
          weatherDescriptions[code] || "날씨 정보 없음";
        const weatherIcon = weatherIcons[code] || "images/default.svg";

        const hourlyElement = document.createElement("div");

        // 아이콘을 추가합니다.
        const iconElement = document.createElement("img");
        iconElement.src = weatherIcon;
        iconElement.alt = weatherDescription;
        iconElement.className = "weather-icon"; // 스타일을 지정하기 위한 클래스

        hourlyElement.appendChild(iconElement);
        hourlyElement.innerHTML += `<strong>${
          hour % 24
        }시</strong><br>${weatherDescription}`;

        hourlyWeatherDiv.appendChild(hourlyElement);
      });

      // 일주일 날씨 정보 표시
      const daysOfWeek = [
        "일요일",
        "월요일",
        "화요일",
        "수요일",
        "목요일",
        "금요일",
        "토요일",
      ];
      let currentDayIndex = new Date().getDay();
      const dailyWeatherDiv = document.getElementById("daily-weather");

      weatherData.daily.weathercode.forEach((code, index) => {
        const dayOfWeek = daysOfWeek[(currentDayIndex + index) % 7];
        const weatherDescription =
          weatherDescriptions[code] || "날씨 정보 없음";
        const weatherIcon = weatherIcons[code] || "images/default.svg";

        const dailyElement = document.createElement("div");

        // 아이콘을 추가합니다.
        const iconElement = document.createElement("img");
        iconElement.src = weatherIcon;
        iconElement.alt = weatherDescription;
        iconElement.className = "weather-icon";

        dailyElement.appendChild(iconElement);
        dailyElement.innerHTML += `<strong>${dayOfWeek}</strong><br>${weatherDescription}`;

        dailyWeatherDiv.appendChild(dailyElement);
      });
    } catch (error) {
      console.error("날씨 정보를 가져오는 중 오류 발생:", error);
    }
  }

  // 위치 변경하기 버튼을 추가하고 이벤트 리스너를 설정하는 함수
  function addChangeLocationButton() {
    document.getElementById("footer").innerHTML = `
      <button id="changeLocationButton">위치 변경하기</button>
    `;
    changeLocationButton = document.getElementById("changeLocationButton");
    changeLocationButton.addEventListener("click", () => {
      document.getElementById("main-content").innerHTML = `
        <div id="search-section">
          <button id="geoButton">현재 위치 사용</button>
          <input
            type="text"
            id="cityInput"
            placeholder="도시를 검색하세요..."
            autocomplete="off"
          />
          <div id="suggestions"></div>
          <button id="submitButton">날씨 확인</button>
        </div>
      `;
      errorMessage.textContent = "";
      // 새로 생성된 요소들에 대해 이벤트 리스너를 재설정합니다.
      resetEventListeners();
      // 위치 변경 버튼 제거
      document.getElementById("footer").innerHTML =
        '<p id="error-message"></p>';
    });
  }

  // 새로 생성된 요소들에 대해 이벤트 리스너를 재설정하는 함수
  function resetEventListeners() {
    const newGeoButton = document.getElementById("geoButton");
    const newSubmitButton = document.getElementById("submitButton");
    cityInput = document.getElementById("cityInput");
    const newSuggestionsDiv = document.getElementById("suggestions");

    newGeoButton.addEventListener("click", () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            try {
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
        errorMessage.textContent =
          "지오로케이션을 지원하지 않는 브라우저입니다.";
      }
    });

    newSubmitButton.addEventListener("click", async () => {
      const cityName = cityInput.value.trim();
      if (!cityName) {
        errorMessage.textContent = "도시 이름을 입력해주세요.";
        return;
      }

      try {
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
        addChangeLocationButton();
      } catch (error) {
        errorMessage.textContent =
          "위치를 찾을 수 없습니다. 다시 시도해주세요.";
      }
    });

    cityInput.addEventListener("input", (e) => {
      fetchSuggestions(e.target.value);
    });
  }
});
