const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = [];
let constellations = [];
let hoveredConstellation = null;
let isMouseDown = false; // Флаг состояния кнопки мыши

const FOV = 300;
let rotationX = 0;
let rotationY = 0;
let targetRotX = 0;
let targetRotY = 0;
let targetRotationSpeed = 0.05;

const starSize = 1.5;

// Обработчики событий мыши
canvas.addEventListener("mousedown", () => {
  isMouseDown = true;
});

canvas.addEventListener("mouseup", () => {
  isMouseDown = false;
});

canvas.addEventListener("mouseleave", () => {
  isMouseDown = false;
});

canvas.addEventListener("mousemove", (e) => {
  const mouseX = e.clientX;
  const mouseY = e.clientY;
  hoveredConstellation = getHoveredConstellation(mouseX, mouseY);

  if (!isMouseDown) return;

  const dx = e.movementX;
  const dy = e.movementY;
  targetRotY += dx * 0.005;
  targetRotX += dy * 0.005;
});

// Обработчики событий касания
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  isMouseDown = true;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (!isMouseDown) return;
  
  const touch = e.touches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  
  targetRotY += dx * 0.005;
  targetRotX += dy * 0.005;

  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

canvas.addEventListener("touchend", () => {
  isMouseDown = false;
});

function generateStars(count) {
  stars = [];
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.sin(phi) * Math.sin(theta);
    const z = Math.cos(phi);

    stars.push({
      x, y, z,
      brightness: Math.random(),
      name: `Star ${i + 1}`,
      color: getStarColor()  // Убираем случайные цвета и ставим холодный
    });
  }
}

function getStarColor() {
  // Холодные цвета для звёзд (светло-голубые, белые)
  return '173, 216, 230';  // Цвета "lightblue" для холодных звёзд
}

function rotateStar(star, rx, ry) {
  let x = star.x * Math.cos(ry) - star.z * Math.sin(ry);
  let z = star.x * Math.sin(ry) + star.z * Math.cos(ry);
  let y = star.y;

  let y2 = y * Math.cos(rx) - z * Math.sin(rx);
  z = y * Math.sin(rx) + z * Math.cos(rx);
  y = y2;

  return { x, y, z };
}

function project(star) {
  const scale = FOV / (FOV + star.z);
  const x = star.x * scale * canvas.width / 2 + canvas.width / 2;
  const y = star.y * scale * canvas.height / 2 + canvas.height / 2;
  return [x, y];
}

function getHoveredConstellation(mouseX, mouseY) {
  const projectedStars = stars.map((star) => {
    const r = rotateStar(star, rotationX, rotationY);
    const [x, y] = project(r);
    return { ...r, x, y };
  });

  for (const constellation of constellations) {
    const projected = constellation.stars.map(s => {
      const r = rotateStar(s, rotationX, rotationY);
      const [x, y] = project(r);
      return { ...r, x, y };
    });

    for (const [i1, i2] of constellation.lines) {
      const s1 = projected[i1];
      const s2 = projected[i2];
      const distance1 = Math.sqrt(Math.pow(mouseX - s1.x, 2) + Math.pow(mouseY - s1.y, 2));
      const distance2 = Math.sqrt(Math.pow(mouseX - s2.x, 2) + Math.pow(mouseY - s2.y, 2));

      if (distance1 < starSize * 4 || distance2 < starSize * 4) {
        return constellation; 
      }
    }
  }

  return null;
}

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  rotationX += (targetRotX - rotationX) * targetRotationSpeed;
  rotationY += (targetRotY - rotationY) * targetRotationSpeed;

  // Отображение звезд с холодным цветом
  stars.forEach((star) => {
    const r = rotateStar(star, rotationX, rotationY);
    const [x, y] = project(r);
    const size = 1.5 + star.brightness * 2;
    const alpha = 0.7 + 0.3 * Math.sin(Date.now() * 0.002 + star.brightness * 10);

    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(${star.color}, ${alpha})`;
    ctx.fill();
  });

  // Отображение линий созвездий
  constellations.forEach((constellation) => {
    const projected = constellation.stars.map(s => {
      const r = rotateStar(s, rotationX, rotationY);
      const [x, y] = project(r);
      return { ...r, x, y };
    });

    constellation.lines.forEach(([i1, i2]) => {
      const s1 = projected[i1];
      const s2 = projected[i2];
      if (!s1 || !s2 || s1.z < -1 || s2.z < -1) return;

      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.strokeStyle = "rgba(0,200,255,0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    if (constellation === hoveredConstellation) {
      const centerX = projected.reduce((sum, star) => sum + star.x, 0) / projected.length;
      const centerY = projected.reduce((sum, star) => sum + star.y, 0) / projected.length;

      ctx.font = "20px Arial";
      ctx.fillStyle = "red";
      ctx.fillText(constellation.name, centerX + 10, centerY + 10);

      ctx.font = "16px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(constellation.info, centerX + 10, centerY + 30);
    }
  });

  requestAnimationFrame(draw);
}

// Загрузка созвездий
function loadConstellations() {
  fetch("constellations.json")
    .then((res) => res.json())
    .then((data) => {
      constellations = data.map(c => {
        const stars = c.stars.map(s => raDecToXYZ(s.ra, s.dec));
        return {
          name: c.name,
          stars,
          lines: c.lines,
          info: c.info || "Нет информации"
        };
      });

      generateStars(300);  // Перегенерируем звезды
      draw();
    })
    .catch((error) => {
      console.error("Ошибка загрузки созвездий:", error);
    });
}

// Преобразование координат прямого восхождения и склонения в xyz
function raDecToXYZ(ra, dec) {
  const raRad = ra / 24 * 2 * Math.PI;
  const decRad = dec * Math.PI / 180;
  const x = Math.cos(decRad) * Math.cos(raRad);
  const y = Math.cos(decRad) * Math.sin(raRad);
  const z = Math.sin(decRad);
  return { x, y, z };
}

loadConstellations();