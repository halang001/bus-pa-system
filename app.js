// 서울시 공식 노선 데이터(routes.json)를 불러오는 버전
let routeData = { seoul: [], incheon: [] };
let selectedRegion = "seoul";
let selectedRoute = "";
let selectedRouteData = null;
let watchId = null;

const $ = (id) => document.getElementById(id);
const regionNames = { seoul: "서울", incheon: "인천" };

async function loadRouteData() {
  $("regionLabel").textContent = "서울 노선 데이터를 불러오는 중...";
  try {
    const response = await fetch("./routes.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`routes.json 응답 오류: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.routes)) throw new Error("노선 데이터 형식이 올바르지 않습니다.");
    routeData.seoul = data.routes;
    renderRoutes($("routeSearch").value);
    $("regionLabel").textContent = `서울 노선 ${data.routeCount || data.routes.length}개`;
  } catch (error) {
    console.error(error);
    $("routeList").innerHTML = "";
    $("noRoutes").hidden = false;
    $("noRoutes").textContent = "노선 데이터를 불러오지 못했습니다. routes.json 파일이 사이트 최상위 폴더에 있는지 확인해 주세요.";
    $("regionLabel").textContent = "노선 데이터 오류";
  }
}

function renderRoutes(filter = "") {
  const routes = (routeData[selectedRegion] || []).filter(route =>
    route.number.toLowerCase().includes(filter.trim().toLowerCase())
  );
  $("routeList").innerHTML = "";
  $("noRoutes").hidden = routes.length > 0;
  $("noRoutes").textContent = selectedRegion === "incheon"
    ? "인천 노선 데이터는 서울 노선 추가 후 연결할 예정입니다."
    : "검색 결과가 없습니다.";

  routes.forEach(route => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "route-option" + (selectedRoute === route.routeId ? " selected" : "");
    button.dataset.routeId = route.routeId;
    const number = document.createElement("span");
    number.className = "route-number";
    number.textContent = route.number;
    const description = document.createElement("span");
    description.className = "route-description";
    description.textContent = `${route.description} · 정류장 ${route.stops.length}개`;
    const chevron = document.createElement("span");
    chevron.className = "chevron";
    chevron.textContent = "›";
    button.append(number, description, chevron);
    button.addEventListener("click", () => chooseRoute(route.routeId));
    $("routeList").appendChild(button);
  });
  $("regionLabel").textContent = selectedRegion === "seoul"
    ? `서울 노선 ${routeData.seoul.length}개`
    : "인천 노선 (추가 예정)";
}

function chooseRoute(routeId) {
  selectedRouteData = (routeData[selectedRegion] || []).find(route => route.routeId === routeId) || null;
  if (!selectedRouteData) return;
  selectedRoute = routeId;
  $("selectedRoute").textContent = `${regionNames[selectedRegion]} ${selectedRouteData.number}번`;
  renderRoutes($("routeSearch").value);
  console.log("선택 노선 정류장 데이터:", selectedRouteData.stops);
}

document.querySelectorAll(".region-button").forEach(button => {
  button.addEventListener("click", () => {
    selectedRegion = button.dataset.region;
    selectedRoute = "";
    selectedRouteData = null;
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
  if (!selectedRouteData) {
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
    enableHighAccuracy: true, maximumAge: 1000, timeout: 15000
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

loadRouteData();
