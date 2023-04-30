const container = document.getElementById("pixelcontainer");
const sizeElem = document.getElementById("sizeinput");
const colorElem = document.getElementById("colorinput");

let size = sizeElem.value;
let draw = false;
let drawMouseButton;
let drawStartPixel;
let drawCurrPixel;
let SelectedCurrPixel;
let historyUndo = [];
let historyRedo = [];
let historyCurrState;

container.addEventListener("mousemove", async (event) => {
  updateCurSelPixel(event.target);
  if (!draw) return;
  if (event.target.matches(".pixel")) {
    if (drawStartPixel) {
      drawCurrPixel = { x: event.target.getAttribute("x"), y: event.target.getAttribute("y") };
    }
    if (drawMouseButton === 0) {
      pixelSetColor({ x: event.target.getAttribute("x"), y: event.target.getAttribute("y") });
    } else if (drawMouseButton === 2) {
      event.target.style.backgroundColor = "";
    }
  }
});

container.addEventListener("mousedown", async (event) => {
  if (!event.target.matches(".pixel")) {
    return;
  }
  draw = true;
  drawStartPixel = { x: event.target.getAttribute("x"), y: event.target.getAttribute("y") };
  drawCurrPixel = drawStartPixel;
  drawMouseButton = event.button;
  if (drawMouseButton === 0) {
    pixelSetColor(drawCurrPixel);
  } else if (drawMouseButton === 2) {
    event.target.style.backgroundColor = "";
  }
  updateCurSelPixel(event.target);
});

container.addEventListener("mouseup", async () => {
  draw = false;
  drawStartPixel = null;
  drawCurrPixel = null;
  saveState();
});

sizeElem.addEventListener("keyup", async () => {
  if (sizeElem.value > +sizeElem.getAttribute("max")) {
    sizeElem.value = sizeElem.getAttribute("max");
  }
  if (sizeElem.value < +sizeElem.getAttribute("min")) {
    sizeElem.value = sizeElem.getAttribute("min");
  }
  const value = parseInt(sizeElem.value);
  size = value % 2 === 0 ? value : value + 1;
  clearContainer();
});

sizeElem.addEventListener("blur", async () => {
  if (sizeElem.value > +sizeElem.getAttribute("max")) {
    sizeElem.value = sizeElem.getAttribute("max");
  }
  if (sizeElem.value < +sizeElem.getAttribute("min")) {
    sizeElem.value = sizeElem.getAttribute("min");
  }
  const value = parseInt(sizeElem.value);
  sizeElem.value = value % 2 === 0 ? value : value + 1;
});

document.addEventListener("keydown", async (event) => {
  if (event.key == "z" && event.ctrlKey) {
    undoContainer();
  } else if (event.key == "y" && event.ctrlKey) {
    redoContainer();
  } else if (event.key == "c" && event.ctrlKey) {
    copy();
  }
});

//* ---------------------------------- Code Begin ---------------------------------- *//
populate(size);

async function populate(size) {
  container.style.setProperty("--size", size);
  for (let y = 0; y < size / 2; y++) {
    for (let x = 0; x < size * 2; x++) {
      const div = document.createElement("div");
      div.classList.add("pixel");
      div.setAttribute("x", x);
      div.setAttribute("y", y);
      container.appendChild(div);
    }
  }
}

async function clearContainer() {
  container.innerHTML = "";
  historyCurrState = null;
  historyUndo = [];
  historyRedo = [];
  populate(size);
}

async function pixelSetColor(pixel) {
  // console.log(`(${pixel.x}, ${pixel.y})`);
  container.querySelector(`[x="${pixel.x}"][y="${pixel.y}"]`).style.backgroundColor = colorElem.value;

  if (drawStartPixel.x < drawCurrPixel.x) {
    for (let i = Number(drawStartPixel.x) + 1; i < drawCurrPixel.x; i++) {
      container.querySelector(`[x="${i}"][y="${drawStartPixel.y}"]`).style.backgroundColor = colorElem.value;
    }
  } else if (drawStartPixel.x > drawCurrPixel.x) {
    for (let i = Number(drawStartPixel.x) - 1; i > drawCurrPixel.x; i--) {
      container.querySelector(`[x="${i}"][y="${drawStartPixel.y}"]`).style.backgroundColor = colorElem.value;
    }
  }
  if (drawStartPixel.y < drawCurrPixel.y) {
    for (let i = Number(drawStartPixel.y) + 1; i < drawCurrPixel.y; i++) {
      container.querySelector(`[x="${drawStartPixel.x}"][y="${i}"]`).style.backgroundColor = colorElem.value;
    }
  } else if (drawStartPixel.y > drawCurrPixel.y) {
    for (let i = Number(drawStartPixel.y) - 1; i > drawCurrPixel.y; i--) {
      container.querySelector(`[x="${drawStartPixel.x}"][y="${i}"]`).style.backgroundColor = colorElem.value;
    }
  }
  drawStartPixel = drawCurrPixel;
}

async function updateCurSelPixel(elem) {
  return;
  if (SelectedCurrPixel) SelectedCurrPixel.style.border = "none";
  if (elem.matches(".pixel")) {
    if (isColorLight(elem.style.backgroundColor)) {
      elem.style.border = "1px solid rgba(0, 0, 0, 0.8)";
    } else {
      elem.style.border = "1px solid rgba(255, 255, 255, 0.8)";
    }
  }
  SelectedCurrPixel = elem;
}

function isColorLight(color) {
  var r, g, b, hsp;
  if (color.match(/^rgb/)) {
    color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
    r = color[1];
    g = color[2];
    b = color[3];
  } else {
    color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&"));
    r = color >> 16;
    g = (color >> 8) & 255;
    b = color & 255;
  }
  hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  return hsp > 127.5;
}

function rgbToHex(rgbString) {
  if (!rgbString || rgbString == "transparent") {
    return "transparent";
  }
  const [r, g, b] = rgbString
    .slice(4, -1)
    .split(",")
    .map((n) => parseInt(n.trim()));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function imageToString(size, pixels) {
  let output = "";
  let lastColor;
  for (let y = 0; y < size / 2; y++) {
    for (let x = 0; x < size * 2; x++) {
      let pixel = pixels.find((p) => p.x == x && p.y == y);
      if (!pixel) {
        continue;
      }
      if (lastColor == pixel.color) {
        let lastIndex = output.lastIndexOf("[/color]");
        output = output.slice(0, lastIndex) + output.slice(lastIndex + 8);
        output += "█[/color]";
      } else {
        output += `[color=${pixel.color}]█[/color]`;
        lastColor = pixel.color;
      }
    }
    output += "\n";
  }
  return output;
}

async function copy() {
  let pixels = [];
  container.querySelectorAll(".pixel").forEach((pixel) => {
    pixels.push({ x: pixel.getAttribute("x"), y: pixel.getAttribute("y"), color: rgbToHex(pixel.style.backgroundColor) });
  });
  let imgText = imageToString(size, pixels);
  navigator.clipboard.writeText(imgText);
}

async function saveState() {
  historyCurrState = container.innerHTML;
  historyUndo.push(historyCurrState);
  historyRedo = [];
}

function undoContainer() {
  if (historyUndo.length > 1) {
    historyRedo.push(historyUndo[historyUndo.length - 1]);
    historyUndo.pop();
    historyCurrState = historyUndo[historyUndo.length - 1];
    container.innerHTML = historyCurrState;
  } else if (historyUndo.length == 1) {
    historyRedo.push(historyUndo[historyUndo.length - 1]);
    historyUndo.pop();
    historyCurrState = "";
    container.innerHTML = historyCurrState;
    populate(size);
  }
}

function redoContainer() {
  if (historyRedo.length != 0) {
    historyUndo.push(historyRedo[historyRedo.length - 1]);
    historyCurrState = historyRedo[historyRedo.length - 1];
    historyRedo.pop();
    container.innerHTML = historyCurrState;
  }
}
