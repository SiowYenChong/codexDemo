const destinations = [
  {
    name: "Tokyo, Japan",
    lat: 35.6764,
    lon: 139.65,
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    summary:
      "Tokyo balances futuristic neighborhoods with serene shrines and incredible food culture.",
    facts: ["Best in spring for cherry blossoms", "Efficient transit with iconic skyline views", "Try local sushi counters and izakaya alleys"],
  },
  {
    name: "Cape Town, South Africa",
    lat: -33.9249,
    lon: 18.4241,
    image:
      "https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&w=1200&q=80",
    summary:
      "Framed by Table Mountain, Cape Town offers dramatic coasts, vineyards, and colorful neighborhoods.",
    facts: ["Take the cableway up Table Mountain", "Explore Cape Peninsula scenic drives", "Excellent local seafood and markets"],
  },
  {
    name: "Lima, Peru",
    lat: -12.0464,
    lon: -77.0428,
    image:
      "https://images.unsplash.com/photo-1600298882421-8f6b68db2f40?auto=format&fit=crop&w=1200&q=80",
    summary:
      "Lima combines Pacific cliffside vistas with one of the world’s most exciting culinary scenes.",
    facts: ["Historic center is a UNESCO site", "Popular for surf and coastal parks", "Known globally for ceviche and Nikkei cuisine"],
  },
  {
    name: "Reykjavík, Iceland",
    lat: 64.1466,
    lon: -21.9426,
    image:
      "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=1200&q=80",
    summary:
      "A cozy capital and launch point for waterfalls, glaciers, and northern lights adventures.",
    facts: ["Great base for Golden Circle trips", "Blue Lagoon and geothermal spas nearby", "Late summer has long daylight hours"],
  },
  {
    name: "Sydney, Australia",
    lat: -33.8688,
    lon: 151.2093,
    image:
      "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80",
    summary:
      "Sydney is famous for harbor views, beach culture, and a lively arts scene.",
    facts: ["Visit the Opera House and Circular Quay", "Bondi to Coogee coastal walk", "Vibrant neighborhoods for cafés and nightlife"],
  },
];

const canvas = document.getElementById("globeCanvas");
const ctx = canvas.getContext("2d");
const destinationTitle = document.getElementById("destinationTitle");
const destinationImage = document.getElementById("destinationImage");
const destinationSummary = document.getElementById("destinationSummary");
const destinationFacts = document.getElementById("destinationFacts");
const statusText = document.getElementById("statusText");
const navButtons = Array.from(document.querySelectorAll(".nav-btn"));
const views = Array.from(document.querySelectorAll(".view-panel"));
const assistantButton = document.getElementById("assistantButton");
const assistantDialog = document.getElementById("assistantDialog");

let selectedIndex = 0;
let yaw = 0.45;
let pitch = -0.2;
let spinVelocity = 0.0023;
let pitchVelocity = 0;
let isDragging = false;
let dragMoved = false;
let pointerStart = { x: 0, y: 0 };
let pinScreenPositions = [];
let activeView = "discoverView";

const globe = {
  cx: canvas.width / 2,
  cy: canvas.height / 2,
  radius: Math.min(canvas.width, canvas.height) * 0.34,
};

function switchView(viewId) {
  activeView = viewId;
  views.forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });
  navButtons.forEach((button) => {
    const isActive = button.dataset.view === viewId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

function toVector(latDeg, lonDeg) {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return {
    x: Math.cos(lat) * Math.cos(lon),
    y: Math.sin(lat),
    z: Math.cos(lat) * Math.sin(lon),
  };
}

function rotateVector(v) {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = v.x * cosY - v.z * sinY;
  const z1 = v.x * sinY + v.z * cosY;

  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  return {
    x: x1,
    y: v.y * cosP - z1 * sinP,
    z: v.y * sinP + z1 * cosP,
  };
}

function project(v) {
  return {
    x: globe.cx + v.x * globe.radius,
    y: globe.cy - v.y * globe.radius,
    depth: v.z,
  };
}

function drawGlobe() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createRadialGradient(
    globe.cx - globe.radius * 0.45,
    globe.cy - globe.radius * 0.48,
    globe.radius * 0.2,
    globe.cx,
    globe.cy,
    globe.radius
  );
  gradient.addColorStop(0, "#68b4ff");
  gradient.addColorStop(0.55, "#2e89e6");
  gradient.addColorStop(1, "#1a5ea7");

  ctx.beginPath();
  ctx.arc(globe.cx, globe.cy, globe.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(globe.cx, globe.cy, globe.radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
  for (let lat = -60; lat <= 60; lat += 30) {
    ctx.beginPath();
    for (let lon = -180; lon <= 180; lon += 4) {
      const p = project(rotateVector(toVector(lat, lon)));
      if (lon === -180) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  for (let lon = -150; lon <= 180; lon += 30) {
    ctx.beginPath();
    for (let lat = -85; lat <= 85; lat += 3) {
      const p = project(rotateVector(toVector(lat, lon)));
      if (lat === -85) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  ctx.restore();

  pinScreenPositions = destinations.map((dest, i) => {
    const rotated = rotateVector(toVector(dest.lat, dest.lon));
    const p = project(rotated);
    return { ...p, depth: rotated.z, index: i };
  });

  pinScreenPositions
    .slice()
    .sort((a, b) => a.depth - b.depth)
    .forEach((pin) => {
      if (pin.depth < -0.06) return;
      const active = pin.index === selectedIndex;
      ctx.beginPath();
      ctx.moveTo(pin.x, pin.y - 20);
      ctx.lineTo(pin.x, pin.y - 3);
      ctx.strokeStyle = "#102a43";
      ctx.lineWidth = active ? 3.8 : 2.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pin.x, pin.y - 20, active ? 7 : 5.5, 0, Math.PI * 2);
      ctx.fillStyle = active ? "#ff5f49" : "#142f48";
      ctx.fill();

      if (active) {
        ctx.beginPath();
        ctx.arc(pin.x, pin.y - 20, 12, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 95, 73, 0.35)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });

  ctx.beginPath();
  ctx.arc(globe.cx - globe.radius * 0.3, globe.cy - globe.radius * 0.38, globe.radius * 0.9, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fill();
}

function setDestination(index) {
  selectedIndex = (index + destinations.length) % destinations.length;
  const destination = destinations[selectedIndex];
  destinationTitle.textContent = destination.name;
  destinationImage.src = destination.image;
  destinationSummary.textContent = destination.summary;
  destinationFacts.innerHTML = "";
  destination.facts.forEach((fact) => {
    const li = document.createElement("li");
    li.textContent = fact;
    destinationFacts.appendChild(li);
  });
  statusText.textContent = `Selected: ${destination.name}`;
}

function animate() {
  if (activeView === "discoverView") {
    yaw += spinVelocity;
    pitch = Math.max(-0.8, Math.min(0.8, pitch + pitchVelocity));

    if (!isDragging) {
      spinVelocity *= 0.995;
      if (Math.abs(spinVelocity) < 0.0015) spinVelocity = 0.0015;
      pitchVelocity *= 0.9;
    }

    drawGlobe();
  }

  requestAnimationFrame(animate);
}

function onPointerDown(event) {
  isDragging = true;
  dragMoved = false;
  pointerStart = { x: event.offsetX, y: event.offsetY };
  canvas.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (!isDragging) return;
  const dx = event.offsetX - pointerStart.x;
  const dy = event.offsetY - pointerStart.y;
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
  yaw += dx * 0.0052;
  pitch = Math.max(-0.8, Math.min(0.8, pitch + dy * 0.0046));
  spinVelocity = dx * 0.00052;
  pitchVelocity = dy * 0.00042;
  pointerStart = { x: event.offsetX, y: event.offsetY };
}

function onPointerUp(event) {
  isDragging = false;
  canvas.releasePointerCapture(event.pointerId);
  if (dragMoved) return;

  const clickX = event.offsetX;
  const clickY = event.offsetY;
  let nearest = null;

  for (const pin of pinScreenPositions) {
    if (pin.depth < -0.06) continue;
    const px = pin.x;
    const py = pin.y - 20;
    const distance = Math.hypot(clickX - px, clickY - py);
    if (distance < 20 && (!nearest || distance < nearest.distance)) {
      nearest = { index: pin.index, distance };
    }
  }

  if (nearest) setDestination(nearest.index);
}

window.addEventListener("keydown", (event) => {
  if (activeView !== "discoverView") return;

  if (event.key === "ArrowRight") {
    setDestination(selectedIndex + 1);
  } else if (event.key === "ArrowLeft") {
    setDestination(selectedIndex - 1);
  } else {
    return;
  }

  const target = toVector(destinations[selectedIndex].lat, destinations[selectedIndex].lon);
  yaw = Math.atan2(target.z, target.x) * -1;
  spinVelocity = event.key === "ArrowRight" ? 0.012 : -0.012;
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchView(button.dataset.view);
  });
});

if (assistantButton && assistantDialog) {
  assistantButton.addEventListener("click", () => {
    assistantDialog.showModal();
  });
}

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", () => {
  isDragging = false;
});

setDestination(0);
drawGlobe();
animate();
