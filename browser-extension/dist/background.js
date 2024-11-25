chrome.runtime.onInstalled.addListener(() => {
  console.log("Weather Forecast Extension installed!");
});

// 현재 위치 요청 처리
chrome.action.onClicked.addListener(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(
        `위도: ${position.coords.latitude}, 경도: ${position.coords.longitude}`
      );
    });
  } else {
    console.error("지오로케이션을 사용할 수 없습니다.");
  }
});
