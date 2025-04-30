document.addEventListener('DOMContentLoaded', () => {
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
  
    // Метеоры
    let meteors = [];


  
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

        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        let hoveredPlanet = null;
        const time = Date.now() * 0.002;

        solarSystem.forEach(planet => {
            const angle = time * planet.speed + solarSystem.indexOf(planet);
            const x3D = Math.cos(angle) * planet.distance;
            const y3D = Math.sin(angle) * planet.distance * Math.cos(planet.tilt);
            const z3D = Math.sin(angle) * planet.distance * Math.sin(planet.tilt);

            const rotated = rotateStar({ x: x3D, y: y3D, z: z3D }, rotationX, rotationY);
            const [x, y] = project(rotated);
            const dist = Math.hypot(canvasX - x, canvasY - y);

            if (dist < planet.size + 15) { 
                hoveredPlanet = { 
                    ...planet, 
                    x: e.clientX, 
                    y: e.clientY 
                };
            }
        });

        const infoBox = document.getElementById("planet-info");
        if (hoveredPlanet) {
            infoBox.style.left = `${hoveredPlanet.x + 15}px`;
            infoBox.style.top = `${hoveredPlanet.y + 15}px`;
            document.getElementById("planet-img").src = hoveredPlanet.img;
            document.getElementById("planet-name").textContent = hoveredPlanet.name;
            document.getElementById("planet-desc").textContent = hoveredPlanet.description;
            infoBox.style.display = "block";
        } else {
            infoBox.style.display = "none";
        }
    });

    const solarSystem = [
        { 
            name: "Mercury",
            distance: 0.05,
            size: 2,
            color: "#aaa",
            speed: 0.04,
            tilt: 7 * Math.PI / 180,
            img: "images/mercury.jpg",
            description: "Самая маленькая планета Солнечной системы, ближайшая к Солнцу. Имеет кратерированную поверхность и экстремальные перепады температур."
        },
        { 
            name: "Venus",
            distance: 0.08,
            size: 3,
            color: "#cc9",
            speed: 0.03,
            tilt: 3.4 * Math.PI / 180,
            img: "images/venus.jpg",
            description: "Самая горячая планета с плотной атмосферой из углекислого газа. Вулканический ландшафт покрыт плотными облаками серной кислоты."
        },
        { 
            name: "Earth",
            distance: 0.11,
            size: 3.5,
            color: "#3af",
            speed: 0.025,
            tilt: 0,
            img: "images/earth.jpg",
            description: "Единственная известная планета с жизнью. 71% поверхности покрыт водой. Имеет мощное магнитное поле и спутник - Луну."
        },
        { 
            name: "Mars",
            distance: 0.14,
            size: 3,
            color: "#f54",
            speed: 0.022,
            tilt: 1.85 * Math.PI / 180,
            img: "images/mars.jpg",
            description: "Красная планета с самой высокой горой в Солнечной системе (Олимп). Имеет два спутника неправильной формы - Фобос и Деймос."
        },
        { 
            name: "Jupiter",
            distance: 0.20,
            size: 5,
            color: "#fcd",
            speed: 0.015,
            tilt: 1.3 * Math.PI / 180,
            img: "images/jupiter.jpg",
            description: "Крупнейший газовый гигант. Обладает мощным радиационным поясом. Известен Большим Красным Пятном - гигантским штормом."
        },
        { 
            name: "Saturn",
            distance: 0.26,
            size: 4.5,
            color: "#fc9",
            speed: 0.012,
            tilt: 2.5 * Math.PI / 180,
            img: "images/saturn.jpg",
            description: "Известен своими кольцами из льда и камней. Имеет 83 подтвержденных спутника, включая Титан с плотной атмосферой."
        },
        { 
            name: "Uranus",
            distance: 0.31,
            size: 4,
            color: "#9cf",
            speed: 0.01,
            tilt: 0.8 * Math.PI / 180,
            img: "images/uranus.jpg",
            description: "Ледяной гигант с экстремальным наклоном оси (98°). Обладает слабой системой колец и 27 известными спутниками."
        },
        { 
            name: "Neptune",
            distance: 0.36,
            size: 4,
            color: "#69f",
            speed: 0.009,
            tilt: 1.8 * Math.PI / 180,
            img: "images/neptune.jpg",
            description: "Самый ветреный мир с скоростями ветра до 2100 км/ч. Обладает темным пятном - гигантским антициклоном."
        },
        { 
            name: "Sun",
            distance: 0,
            size: 10,
            color: "#FFA500",
            speed: 0,
            tilt: 0,
            img: "images/Sun.jpeg",
            description: "Звезда класса желтый карлик. Составляет 99.86% массы всей Солнечной системы. Температура ядра - 15 млн °C"
        }
    ];
  
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
  
            const boundingBox = {
                minX: Math.min(...proj.map(p => p.x)),
                maxX: Math.max(...proj.map(p => p.x)),
                minY: Math.min(...proj.map(p => p.y)),
                maxY: Math.max(...proj.map(p => p.y))
            };
  
            if (mouseX >= boundingBox.minX - 50 && mouseX <= boundingBox.maxX + 50 &&
                mouseY >= boundingBox.minY - 50 && mouseY <= boundingBox.maxY + 50) {
                return c;
            }
        }
        return null;
    }
  
    function spawnMeteor() {
        meteors.push({
            x: Math.random() * canvas.width,
            y: -50,
            speedX: Math.random() * 3 - 1.5,
            speedY: 4 + Math.random() * 2,
            length: 50 + Math.random() * 50,
            opacity: 0.7 + Math.random() * 0.3
        });
    }
  
    function updateMeteors() {
        meteors.forEach(m => {
            m.x += m.speedX;
            m.y += m.speedY;
        });
        meteors = meteors.filter(m => m.y < canvas.height + 100);
    }
  
    function drawMeteors() {
      meteors.forEach(m => {
          const gradient = ctx.createLinearGradient(
              m.x, m.y,
              m.x - m.speedX * m.length,
              m.y - m.speedY * m.length
          );
          gradient.addColorStop(0, `rgba(255,255,255,${m.opacity})`);
          gradient.addColorStop(0.3, `rgba(0,191,255,${m.opacity * 0.7})`);
          gradient.addColorStop(1, `rgba(0,0,0,0)`);
  
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - m.speedX * m.length, m.y - m.speedY * m.length);
          ctx.stroke();
  
          ctx.beginPath();
          ctx.arc(m.x, m.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${m.opacity})`;
          ctx.shadowColor = `rgba(255,255,255,0.8)`;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
      });
  }
    function drawSolarSystem(time) {
        const center = project({ x: 0, y: 0, z: 0});

        solarSystem.forEach((planet, index) => {
            const angle = time * planet.speed + index;

            const x3D = Math.cos(angle) * planet.distance;
            const y3D = Math.sin(angle) * planet.distance * Math.cos(planet.tilt);
            const z3D = Math.sin(angle) * planet.distance * Math.sin(planet.tilt);

            const rotated = rotateStar({ x: x3D, y: y3D, z: z3D }, rotationX, rotationY);
            const [x, y] = project(rotated);

            //Орбита
            ctx.beginPath();
            ctx.ellipse(center[0], center[1], planet.distance * canvas.width / 2, planet.distance * canvas.height / 2, 0, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,255,255,0)";
            ctx.lineWidth = 1;
            ctx.stroke();

            //Планета
            ctx.beginPath();
            ctx.arc(x, y, planet.size, 0, Math.PI * 2);
            ctx.fillStyle = planet.color;
            ctx.fill();

            //Подпись
            ctx.font = "12px Arial";
            ctx.fillStyle = "#fff";
            ctx.fillText(planet.name, x + planet.size + 2, y);

            ctx.beginPath();
            const steps = 100;
            for (let i = 0; i <= steps; i++){
                const theta = (i / steps) * Math.PI * 2;
                const px = Math.cos(theta) * planet.distance;
                const py = Math.sin(theta) * planet.distance * Math.cos(planet.tilt);
                const pz = Math.sin(theta) * planet.distance * Math.sin(planet.tilt);

                const orbitRotated = rotateStar({ x: px, y: py, z: pz}, rotationX, rotationY);
                const [ox, oy] = project(orbitRotated);

                if (i === 0) ctx.moveTo(ox, oy);
                else ctx.lineTo(ox, oy);
            }
            ctx.strokeStyle = "rgba(255,255,255,0.7)";
            ctx.lineWidth = 2.5;
            ctx.stroke();
        });          

            //Солнце
            ctx.beginPath();
            ctx.arc(center[0], center[1], 7, 0, Math.PI * 2);
            ctx.fillStyle =  "#FFD700";
            ctx.shadowColor = "#FFD700";
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
        
    }
  
    function draw() {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
  
        rotationX += (targetRotX - rotationX) * targetRotationSpeed;
        rotationY += (targetRotY - rotationY) * targetRotationSpeed;
  
        const time = Date.now() * 0.002;
  
        stars.forEach(star => {
            const r = rotateStar(star, rotationX, rotationY);
            const [x, y] = project(r);
  
            const pulse = 0.5 + 0.5 * Math.sin(time + star.brightness * 10);
  
            ctx.beginPath();
            ctx.arc(x, y, (3 + star.brightness * 5) * pulse, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(173, 216, 230, 0.5)`;
            ctx.fill();
  
            ctx.beginPath();
            ctx.arc(x, y, (1.5 + star.brightness * 2) * pulse, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(173, 216, 230, 1)`;
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
  
        updateMeteors();
        drawMeteors();
        drawSolarSystem(time);
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
                setInterval(spawnMeteor, 1000);
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
  
    startButton.addEventListener('click', () => {
        startScreen.style.display = 'none';
        canvas.style.display = 'block';
        loadConstellations();
    });
  });