const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = [];
let constellations = [];
let hoveredConstellation = null;
let hoveredStar = null;
let isMouseDown = false;

const FOV = 300;
let rotationX = 0;
let rotationY = 0;
let targetRotX = 0;
let targetRotY = 0;
let targetRotationSpeed = 0.05;
const starSize = 1.5;

canvas.addEventListener("mousedown", () => isMouseDown = true);
canvas.addEventListener("mouseup", () => isMouseDown = false);
canvas.addEventListener("mouseleave", () => isMouseDown = false);

canvas.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    hoveredConstellation = getHoveredConstellation(mouseX, mouseY);
    hoveredStar = hoveredConstellation ? null : getHoveredStar(mouseX, mouseY);
    
    if (isMouseDown) {
        targetRotY += e.movementX * 0.005;
        targetRotX += e.movementY * 0.005;
    }
});

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

canvas.addEventListener("touchend", () => isMouseDown = false);

function generateStars(count) {
    stars = [];
    const classes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        stars.push({
            x: Math.sin(phi) * Math.cos(theta),
            y: Math.sin(phi) * Math.sin(theta),
            z: Math.cos(phi),
            brightness: Math.random(),
            name: `HIP-${Math.floor(10000 + Math.random() * 90000)}`,
            color: '173, 216, 230',
            spectral: classes[Math.floor(Math.random() * classes.length)]
        });
    }
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
    return [
        star.x * scale * canvas.width / 2 + canvas.width / 2,
        star.y * scale * canvas.height / 2 + canvas.height / 2
    ];
}

function getHoveredStar(mouseX, mouseY) {
    let closest = null;
    let minDist = Infinity;
    stars.forEach(star => {
        const r = rotateStar(star, rotationX, rotationY);
        const [x, y] = project(r);
        const dist = Math.hypot(mouseX - x, mouseY - y);
        if (dist < starSize * 4 && dist < minDist) {
            minDist = dist;
            closest = star;
        }
    });
    return closest;
}

function getHoveredConstellation(mouseX, mouseY) {
  for (const c of constellations) {
      const proj = c.stars.map(s => {
          const r = rotateStar(s, rotationX, rotationY);
          const [x, y] = project(r);
          return { x, y };
      });

      // Calculate the bounding box around the constellation's stars
      const boundingBox = {
          minX: Math.min(...proj.map(p => p.x)),
          maxX: Math.max(...proj.map(p => p.x)),
          minY: Math.min(...proj.map(p => p.y)),
          maxY: Math.max(...proj.map(p => p.y))
      };

      // Check if the mouse is within the bounding box
      if (mouseX >= boundingBox.minX - 50 && mouseX <= boundingBox.maxX + 50 &&
          mouseY >= boundingBox.minY - 50 && mouseY <= boundingBox.maxY + 50) {
          return c;
      }
  }
  return null;
}

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  rotationX += (targetRotX - rotationX) * targetRotationSpeed;
  rotationY += (targetRotY - rotationY) * targetRotationSpeed;

  const time = Date.now() * 0.002; // Time variable for pulsation

  stars.forEach(star => {
      const r = rotateStar(star, rotationX, rotationY);
      const [x, y] = project(r);

      // Calculate pulsing effect
      const pulse = 0.5 + 0.5 * Math.sin(time + star.brightness * 10); // Pulsate between 0 and 1

      // Glow effect
      ctx.beginPath();
      ctx.arc(x, y, (3 + star.brightness * 5) * pulse, 0, Math.PI * 2); // Larger circle for glow
      ctx.fillStyle = `rgba(173, 216, 230, 0.5)`; // Light blue glow
      ctx.fill();

      // Bright star
      ctx.beginPath();
      ctx.arc(x, y, (1.5 + star.brightness * 2) * pulse, 0, Math.PI * 2); // Smaller circle for star
      ctx.fillStyle = `rgba(173, 216, 230, 1)`; // Bright star color
      ctx.fill();
  });

  constellations.forEach(c => {
      const proj = c.stars.map(s => {
          const r = rotateStar(s, rotationX, rotationY);
          const [x, y] = project(r);
          return { x, y, z: r.z };
      });
      c.lines.forEach(([i1, i2]) => {
          const s1 = proj[i1];
          const s2 = proj[i2];
          if (s1.z < -1 || s2.z < -1) return;
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.strokeStyle = "rgba(0,200,255,0.9)";
          ctx.lineWidth = 2;
          ctx.stroke();
      });

      // Show constellation info if hovered
      if (c === hoveredConstellation) {
          const cx = proj.reduce((a, b) => a + b.x, 0) / proj.length;
          const cy = proj.reduce((a, b) => a + b.y, 0) / proj.length;
          ctx.fillStyle = "red";
          ctx.font = "20px Arial";
          ctx.fillText(c.name, cx + 10, cy + 10);
          ctx.font = "16px Arial";
          ctx.fillStyle = "white";
          ctx.fillText(c.info, cx + 10, cy + 30);
      }
  });

  if (hoveredStar && !hoveredConstellation) {
      const r = rotateStar(hoveredStar, rotationX, rotationY);
      const [x, y] = project(r);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 30, y - 50);
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(x + 35, y - 55, 150, 70);
      ctx.fillStyle = "white";
      ctx.font = "14px Arial";
      ctx.fillText(hoveredStar.name, x + 45, y - 35);
      ctx.fillText(`Spectral: ${hoveredStar.spectral}`, x + 45, y - 15);
      ctx.fillText(`Brightness: ${hoveredStar.brightness.toFixed(2)}`, x + 45, y + 5);
  }

  requestAnimationFrame(draw);
}

function loadConstellations() {
    fetch("constellations.json")
        .then(res => res.json())
        .then(data => {
            constellations = data.map(c => ({
                name: c.name,
                stars: c.stars.map(s => raDecToXYZ(s.ra, s.dec)),
                lines: c.lines,
                info: c.info || "No information"
            }));
            generateStars(300);
            draw();
        })
        .catch(console.error);
}

function raDecToXYZ(ra, dec) {
    const raRad = ra / 24 * 2 * Math.PI;
    const decRad = dec * Math.PI / 180;
    return {
        x: Math.cos(decRad) * Math.cos(raRad),
        y: Math.cos(decRad) * Math.sin(raRad),
        z: Math.sin(decRad)
    };
}


const startButton = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const canvasElement = document.getElementById("sky");

startButton.addEventListener('click', () => {
  startScreen.style.display = 'none';
  canvasElement.style.display = 'block';

  loadConstellations();
  draw();
});
