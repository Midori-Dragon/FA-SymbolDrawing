const cursorContainer = document.getElementById("pixelcontainer");
const cursor = document.getElementById("cursor");

const moveCursor = (e) => {
  const mouseY = e.clientY;
  const mouseX = e.clientX;

  cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
};

cursorContainer.addEventListener("mousemove", moveCursor);

cursorContainer.addEventListener("mouseenter", async () => {
  cursor.style.display = "inline";
});
cursorContainer.addEventListener("mouseleave", async () => {
  cursor.style.display = "none";
});

cursorContainer.addEventListener("contextmenu", async (event) => {
  event.preventDefault();
});

cursorContainer.addEventListener("dragstart", async (event) => {
  event.preventDefault();
});
