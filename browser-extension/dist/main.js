(()=>{const t=document.getElementById("track-location"),e=document.getElementById("submit-location"),n=document.getElementById("manual-location"),o=document.getElementById("current-location"),a=document.getElementById("weather-info"),i=document.getElementById("error-message");async function c(t,e){try{const o=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${t}&longitude=${e}&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);n=await o.json(),a.style.display="block",i.style.display="none",a.innerHTML=`\n    <h3>오늘의 시간별 기온</h3>\n    <p>${n.hourly.time.slice(0,24).map(((t,e)=>`${t}: ${n.hourly.temperature_2m[e]}°C`)).join("<br>")}</p>\n    <h3>일주일 예보</h3>\n    <p>${n.daily.time.map(((t,e)=>`${t}: 최고 ${n.daily.temperature_2m_max[e]}°C, 최저 ${n.daily.temperature_2m_min[e]}°C`)).join("<br>")}</p>\n  `}catch(t){l()}var n}function l(t="Wrong Location"){a.style.display="none",i.style.display="block",i.textContent=t}t.addEventListener("click",(()=>{navigator.geolocation?navigator.geolocation.getCurrentPosition((t=>{const{latitude:e,longitude:n}=t.coords;o.textContent=`현재 위치: 위도 ${e}, 경도 ${n}`,c(e,n)}),(()=>{l("위치 추적 실패")})):l("위치 추적이 지원되지 않는 브라우저입니다.")})),e.addEventListener("click",(async()=>{const t=n.value.trim();if(t)try{const e=await fetch(`https://geocode.maps.co/search?q=${encodeURIComponent(t)}`),n=await e.json();if(n&&n.length>0){const{lat:e,lon:a}=n[0];o.textContent=`입력된 위치: ${t}`,c(e,a)}else l("잘못된 위치입니다.")}catch(t){l("위치 정보를 가져오는 데 실패했습니다.")}else l("위치를 입력해 주세요.")}))})();