const path = require('path');

const dynamicColorPath = path.resolve(__dirname, '..', 'Dynamic-Color', 'dynamic_color.js');
const c3Path = path.resolve(__dirname, '..', 'Dynamic-Color', 'lib', 'c3_data.json');

const { DynamicColor, loadC3Data, d3 } = require(dynamicColorPath);

const count = Math.max(1, parseInt(process.argv[2] || '8', 10));

loadC3Data(c3Path)
  .then(() => {
    const dc = new DynamicColor();
    const palette = dc.run([], [count], false);
    const hex = palette.map((color) => d3.rgb(color).formatHex());
    process.stdout.write(JSON.stringify(hex));
  })
  .catch((err) => {
    console.error('palette_generator error:', err);
    process.exit(1);
  });
