const controlCanvas = document.getElementById("controlCanvas");
const controlCtx = controlCanvas.getContext("2d");

let currentSceneIndex = 0;
const scenes = ["scene1", "scene2","scene3","scene4","scene5","scene6","scene7"]; // Add more scene names (without .js) as needed
let lastScene = null;
let lastSceneModule = null;  

const sceneDescriptions = [
  `In deze oefening onderzoeken we de vorm van de dag-nachtgrens op een wereldkaart.<br> 
  <br> 
  Bekijk alvast eens hoe de positie van de zon de dag-nachtgrens beïnvloedt, zowel op de wereldbol als op de wereldkaart.<br>
  <br>
  Op de wereldkaart kan je met de muis de positie van de zon aan de hemel verslepen.<br>
  In de 3D-view rechts kan je met de muis de kijkrichting veranderen en zoomen met de scroll-button. `,          
  `Via een parametrisatie kan je de "wereldkaartcoördinaten" (breedtegraad $ \\varphi $ en lengtegraad $\\theta$) <br>
  omzetten naar "reële coördinaten" $(x,y,z)$:<br> 
  <br>$\\left [ \\begin{array}{c} x \\\\ y \\\\ z\\end{array}\\right ] = \\
  \\textcolor{yellow}{\\left [ \\begin{array}{c} 0 \\\\ 0 \\\\ R\\sin(\\varphi) \\end{array}\\right ]} + \\ 
  \\textcolor{orange}{R\\cos(\\varphi)\\left [ \\begin{array}{c} \\cos(\\theta) \\\\ \\sin(\\theta) \\\\ 0 \\end{array}\\right ]}$ 
  $\\: \\:\\:$ ... of ... $ \\: \\:\\: \\: \\left \\{ \\begin{array}{l} x=R\\cos(\\varphi)\\cos(\\theta) \\\\y=R\\cos(\\varphi)\\sin(\\theta) \\\\z=R\\sin(\\varphi) \\end{array}\\right .$ 
  $\\:\\:\\:\\:\\:$,$\\:\\:\\:\\:\\:$$\\begin{array}{l} -\\pi \\leq \\theta \\leq \\pi \\\\ -\\frac{\\pi}{2} \\leq \\varphi \\leq \\frac{\\pi}{2} \\end{array}$ <br>
  <br> Merk de gelijkenis op met sferische coördinaten (wat verschilt er en waarom?).` ,
  `Als de zonnestand coördinaten $(\\theta_Z,\\varphi_Z)$ heeft op de wereldkaart, toon dan aan dat de vergelijking van de dag-nachtgrens wordt gegeven door:<br>
  <br>$\\varphi = \\arctan(k \\cos(\\theta - \\theta_Z))\\:\\:\\:\\:$ met $k = \\frac{-1}{\\tan(\\varphi_Z)}\\:\\:\\:\\:$ voor $\\varphi_Z \\neq 0$ <br>
  <br> Tip: De positievector van de zonnestand op de wereldbol vormt een normaalvector voor een interessant vlak ... <br>
  <br>(het bijzonder geval $\\varphi_Z = 0 $ bespreken we later)`,
  `We trachten nu grafisch inzicht te krijgen in de vorm van deze curve door de functie <br>
  <br> $\\varphi = \\arctan(k \\cos(\\theta - \\theta_Z))\\:\\:\\:\\:$ met $k = \\frac{-1}{\\tan(\\varphi_Z)}\\:\\:\\:\\:$ voor $\\varphi_Z \\neq 0$ <br>
  <br> te interpreteren als een samenstelling van de functies:<br>
  <br> $ \\theta \\mapsto \\textcolor{lightgreen}{t = k \\cos(\\theta - \\theta_Z)} \\:\\:\\: $ en $\\:\\:\\: \\textcolor{lightgreen}{t} \\mapsto \\textcolor{red}{\\varphi = \\arctan(t)} \\:\\:\\: $
  `,
  `De functie $ \\theta \\mapsto \\textcolor{lightgreen}{t = k \\cos(\\theta - \\theta_Z)} $ kan je zien als een cosinus-functie die horizontaal verschoven is <br>
  over een afstand $\\theta_Z$ en verticaal geschaald met een factor $k = \\frac{-1}{\\tan(\\varphi_Z)}$.<br>
  <br> Merk op dat als $\\varphi_Z > 0$ dan is $k<0$ en treedt er naast een schaling ook een spiegeling op.<br>
  <br>Bovendien kan je inzien dat als $\\varphi_Z \\to 0$, dat de amplitude $k$ van de cosinusfunctie naar $\\infty$ gaat. `,
  `De 'groene' functie $ \\textcolor{lightgreen}{t = k \\cos(\\theta - \\theta_Z)} $ wordt vervolgens als invoer gebruikt voor een boogtangens-functie: $\\textcolor{red}{\\varphi = \\arctan(t)}$.<br>
  Deze boogtangens-functie perst als het ware zijn invoerbereik $\\:]-\\infty,+\\infty[\\:$ samen tot een uitvoer die ligt tussen $-\\frac{\\pi}{2}$ en  $\\frac{\\pi}{2}$.<br>
  De sterke toppen en dalen van de groene invoerfunctie worden zo dus afgeplat tot de rode functie die de uiteindelijke dag-nachtgrens oplevert. <br>
  <br>
  In onderstaande animatie wordt dit 'afplattingsproces' grafisch weergegeven. `,
  `In het bijzonder geval $\\varphi_Z = 0$, staat de zon pal boven de evenaar en is de dag-nachtgrens op de wereldbol een cirkel die door de Noord- en Zuidpool loopt.<br>
   Op de wereldkaart vinden we dan als oplossing (ga dit zelf na):<br>
   <br> $\\textcolor{lightgreen}{\\theta = \\theta_Z -\\frac{\\pi}{2} \\:\\:(+ n 2\\pi)}\\:\\:\\:\\:$ of $\\:\\:\\:\\:\\textcolor{red}{\\theta = \\theta_Z + \\frac{\\pi}{2} \\:\\:(+ n 2\\pi)}\\:\\:\\:\\:$ 
   of $\\:\\:\\:\\:\\textcolor{orange}{\\varphi = \\frac{\\pi}{2}}\\:\\:\\:\\:$ of $\\:\\:\\:\\:\\textcolor{lightblue}{\\varphi = -\\frac{\\pi}{2}}$<br>
   <br>De eerste twee oplossingen zijn verticale rechten op de wereldkaart (zgn. meridianen).
   De twee horizontale rechten bij $\\varphi = \\frac{\\pi}{2}$ en $\\varphi = -\\frac{\\pi}{2}$ zijn <br> een gevolg van het feit dat alle punten op deze rechten worden afgebeeld op 
   respectievelijk de Noord- en de Zuidpool.<br> Voor alle punten van de wereldbol bestaat er maw een één-op-één verband met de parameterruimte, behalve voor de twee polen.`
];

// of $\\left \\{ \\begin{array}{l} x= \\\\y= \\\\z= \\end{array}\\right \\.$
// // Grab the div for scene text from the DOM (make sure it exists in your HTML)
const sceneTextDiv = document.getElementById("sceneText");

function updateSceneText(index) {
  if (sceneDescriptions[index]) {
    sceneTextDiv.innerHTML = sceneDescriptions[index];
  } else {
    sceneTextDiv.textContent = "";
  }

  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetClear();
    MathJax.typesetPromise([sceneTextDiv]).catch((err) => console.error(err.message));
  }
}

// Resize control canvas to match container
function resizeControlCanvas() {
  const container = document.getElementById("controlPanel");
  controlCanvas.width = container.clientWidth;
  controlCanvas.height = container.clientHeight;
  drawControlPanel();
}

// Draw UI with buttons 
function drawControlPanel() {
  controlCtx.clearRect(0, 0, controlCanvas.width, controlCanvas.height);

  const w = controlCanvas.width;
  const h = controlCanvas.height;
  const btnW = 100;
  const btnH = 40;

  controlCtx.font = "16px sans-serif";
  controlCtx.textAlign = "center";
  controlCtx.textBaseline = "middle";

  // "Previous" button — only show if not first scene
  if (currentSceneIndex > 0) {
    controlCtx.fillStyle = "gray";
    controlCtx.fillRect(20, h / 2 - btnH / 2, btnW, btnH);
    controlCtx.fillStyle = "white";
    controlCtx.fillText("Previous", 20 + btnW / 2, h / 2);
  }

  // "Next" button — only show if not last scene
  if (currentSceneIndex < scenes.length - 1) {
    controlCtx.fillStyle = "gray";
    controlCtx.fillRect(w - btnW - 20, h / 2 - btnH / 2, btnW, btnH);
    controlCtx.fillStyle = "white";
    controlCtx.fillText("Next", w - btnW / 2 - 20, h / 2);
  }
}

// Handle click events on control panel
controlCanvas.addEventListener("click", (e) => {
  const rect = controlCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const w = controlCanvas.width;
  const h = controlCanvas.height;
  const btnW = 100;
  const btnH = 40;

  // Previous button
  if (x >= 20 && x <= 20 + btnW && y >= h / 2 - btnH / 2 && y <= h / 2 + btnH / 2) {
    changeScene(currentSceneIndex - 1);
  }

  // Next button
  if (x >= w - btnW - 20 && x <= w - 20 && y >= h / 2 - btnH / 2 && y <= h / 2 + btnH / 2) {
    changeScene(currentSceneIndex + 1);
  }
});

// Scene change logic
function changeScene(index) {
  currentSceneIndex = (index + scenes.length) % scenes.length;
  drawControlPanel();
  updateSceneText(currentSceneIndex);  
  loadScene(`${scenes[currentSceneIndex]}.js`);
}

// Dynamically import and initialize scene
async function loadScene(scenePath) {
  if (scenePath === lastScene) return; // Avoid reloading same scene

  // CLEAN UP PREVIOUS SCENE
  if (lastSceneModule && typeof lastSceneModule.cleanup === 'function') {
    lastSceneModule.cleanup();
  }

  try {
    const module = await import(`./scenes/${scenePath}`);
    const scene = module.default;

    if (scene && typeof scene.init === 'function') {
      scene.init();
    } else {
      console.warn("Scene does not export an 'init()' function:", scenePath);
    }

    lastScene = scenePath;
    lastSceneModule = scene;

  } catch (err) {
    console.error("Failed to load scene:", scenePath, err);
  }
}

async function init() {
  resizeControlCanvas();
  new ResizeObserver(resizeControlCanvas).observe(controlCanvas);
  await loadScene(`${scenes[currentSceneIndex]}.js`);
  updateSceneText(currentSceneIndex);  // Pass the index here to show text at startup
}

init();
