const colorpicker = document.getElementById("colorcontainer");
const joe = colorjoe.rgb(colorpicker, "blue");
const colorInputElem = document.getElementById("colorinput");

colorInputElem.oninput = async (event) => {
  let color = event.target.value;
  joe.set(color);
  joe.update();
};

joe.on("change", async (color) => {
  colorInputElem.value = color.hex();
});
