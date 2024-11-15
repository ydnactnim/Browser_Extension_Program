chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action === "fetchWeatherData") {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${msg.latitude}&longitude=${msg.longitude}&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      const data = await response.json();
      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({ success: false, error: "Failed to fetch weather data." });
    }
  }
  return true; // async response
});
