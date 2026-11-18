const sampleRoutes = {
  seoul: [
    { number: "143", description: "서울 간선버스 · 예시" },
    { number: "150", description: "서울 간선버스 · 예시" },
    { number: "160", description: "서울 간선버스 · 예시" }
  ],
  incheon: [
    { number: "12", description: "인천 간선버스 · 예시" },
    { number: "24", description: "인천 간선버스 · 예시" },
    { number: "46", description: "인천 간선버스 · 예시" }
  ]
};

let selectedRegion = "seoul";
let selectedRoute = "";
let watchId = null;

const $ = (id) => document.getElementById(id);
const regionNames = { seoul: "서울", incheon: "인천" };

function renderRoutes(filter = "") {
  const routes = sampleRoutes[selectedRegion].filter(route =>
    route.number.toLowerCase().includes(filter.trim().toLowerCase())
  );
  $("routeList").innerHTML = "";
  $("noRoutes").hidden = routes.length > 0;
  routes.forEach(route => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "route-option" + (selectedRoute === route.number ? " selected" : "");
    button.dataset.route = route.number;
    button.innerHTML = `<span class="route-number"></span><span class="route-description"></span><span class="chevron">›</span>`;
    button.querySelector(".route-number").textContent = route.number;
    button.querySelector(".route-description").textContent = route.description;
    button.addEventListener("click", () => chooseRoute(route.number));
    $("routeList").appendChild(button);
  });
  $("regionLabel").textContent = `${regionNames[selectedRegion]} 노선 예시`;
}

function chooseRoute(number) {
  selectedRoute = number;
  $("selectedRoute").textContent = `${regionNames[selectedRegion]} ${number}번`;
  renderRoutes($("routeSearch").value);
}

document.querySelectorAll(".region-button").forEach(button => {
  button.addEventListener("click", () => {
    selectedRegion = button.dataset.region;
    selectedRoute = "";
    document.querySelectorAll(".region-button").forEach(item =>
      item.classList.toggle("active", item === button)
    );
    $("selectedRegionBadge").textContent = regionNames[selectedRegion];
    $("selectedRoute").textContent = "노선을 선택해 주세요";
    $("routeSearch").value = "";
    renderRoutes();
  });
});

$("searchButton").addEventListener("click", () => renderRoutes($("routeSearch").value));
$("routeSearch").addEventListener("keydown", event => {
  if (event.key === "Enter") renderRoutes($("routeSearch").value);
});
$("routeSearch").addEventListener("input", event => renderRoutes(event.target.value));

function updateGps(position) {
  const { latitude, longitude, accuracy } = position.coords;
  $("latitude").textContent = latitude.toFixed(6);
  $("longitude").textContent = longitude.toFixed(6);
  $("accuracy").textContent = `약 ${Math.round(accuracy)}m`;
  $("gpsText").textContent = "GPS 위치 수신 중";
  $("gpsStatus").innerHTML = '<span class="status-dot" style="background:#42cf91"></span> GPS 연결됨';
}

function gpsError(error) {
  const messages = {
    1: "위치 권한이 거부되었습니다.",
    2: "현재 위치를 확인할 수 없습니다.",
    3: "GPS 응답 시간이 초과되었습니다."
  };
  $("gpsText").textContent = messages[error.code] || "GPS 오류가 발생했습니다.";
  $("gpsStatus").innerHTML = '<span class="status-dot" style="background:#f06b6b"></span> GPS 오류';
}

$("gpsStart").addEventListener("click", () => {
  if (!selectedRoute) {
    alert("먼저 지역과 노선을 선택해 주세요.");
    return;
  }
  if (!("geolocation" in navigator)) {
    $("gpsText").textContent = "이 브라우저는 GPS 위치 기능을 지원하지 않습니다.";
    return;
  }
  if (!window.isSecureContext) {
    $("gpsText").textContent = "GPS 사용에는 HTTPS 접속이 필요합니다.";
    return;
  }
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  $("gpsText").textContent = "GPS 연결을 요청했습니다.";
  watchId = navigator.geolocation.watchPosition(updateGps, gpsError, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 15000
  });
  $("gpsStart").disabled = true;
  $("gpsStop").disabled = false;
});

$("gpsStop").addEventListener("click", () => {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  $("gpsStart").disabled = false;
  $("gpsStop").disabled = true;
  $("gpsText").textContent = "GPS 연결이 중지되었습니다.";
  $("gpsStatus").innerHTML = '<span class="status-dot"></span> GPS 대기 중';
});

$("testSound").addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    alert("이 브라우저에서는 음성 합성을 지원하지 않습니다.");
    return;
  }
  const utterance = new SpeechSynthesisUtterance(
    selectedRegion === "seoul"
      ? "안내방송 테스트입니다. 서울 버스 안내방송 시스템입니다."
      : "안내방송 테스트입니다. 인천 버스 안내방송 시스템입니다."
  );
  utterance.lang = "ko-KR";
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
});

renderRoutes();
