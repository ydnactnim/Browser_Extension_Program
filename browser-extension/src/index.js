// HTML 요소 가져오기
const trackLocationBtn = document.getElementById("track-location");
const submitLocationBtn = document.getElementById("submit-location");
const manualLocationInput = document.getElementById("manual-location");
const currentLocationDisplay = document.getElementById("current-location");
const weatherInfoDisplay = document.getElementById("weather-info");
const errorMessage = document.getElementById("error-message");

// API로부터 날씨 정보를 가져오는 함수
async function getWeatherData(lat, lon) {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    const data = await response.json();
    displayWeatherData(data);
  } catch (error) {
    displayError();
  }
}

// 위치 추적 기능
trackLocationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        currentLocationDisplay.textContent = `현재 위치: 위도 ${latitude}, 경도 ${longitude}`;
        getWeatherData(latitude, longitude);
      },
      () => {
        displayError("위치 추적 실패");
      }
    );
  } else {
    displayError("위치 추적이 지원되지 않는 브라우저입니다.");
  }
});

// 사용자가 입력한 위치로 날씨 데이터를 가져오기
submitLocationBtn.addEventListener("click", async () => {
  const location = manualLocationInput.value.trim();
  if (!location) {
    displayError("위치를 입력해 주세요.");
    return;
  }

  // Google Geocoding API나 다른 위치 정보를 가져오는 API를 통해 좌표를 얻을 수 있음
  try {
    const response = await fetch(
      `https://geocode.maps.co/search?q=${encodeURIComponent(location)}`
    );
    const geocodeData = await response.json();
    if (geocodeData && geocodeData.length > 0) {
      const { lat, lon } = geocodeData[0];
      currentLocationDisplay.textContent = `입력된 위치: ${location}`;
      getWeatherData(lat, lon);
    } else {
      displayError("잘못된 위치입니다.");
    }
  } catch (error) {
    displayError("위치 정보를 가져오는 데 실패했습니다.");
  }
});

// 날씨 데이터를 화면에 표시하는 함수
function displayWeatherData(data) {
  weatherInfoDisplay.style.display = "block";
  errorMessage.style.display = "none";
  weatherInfoDisplay.innerHTML = `
    <h3>오늘의 시간별 기온</h3>
    <p>${data.hourly.time
      .slice(0, 24)
      .map((time, index) => `${time}: ${data.hourly.temperature_2m[index]}°C`)
      .join("<br>")}</p>
    <h3>일주일 예보</h3>
    <p>${data.daily.time
      .map(
        (day, index) =>
          `${day}: 최고 ${data.daily.temperature_2m_max[index]}°C, 최저 ${data.daily.temperature_2m_min[index]}°C`
      )
      .join("<br>")}</p>
  `;
}

// 오류 메시지를 표시하는 함수
function displayError(message = "Wrong Location") {
  weatherInfoDisplay.style.display = "none";
  errorMessage.style.display = "block";
  errorMessage.textContent = message;
}
