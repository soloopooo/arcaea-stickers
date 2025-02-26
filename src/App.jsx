import SSFangTangTi from "./fonts/ShangShouFangTangTi.woff2";
import "./App.css";
import Canvas from "./components/Canvas";
import { useState, useEffect } from "react";
import characters from "./characters.json";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import Snackbar from '@mui/material/Snackbar';
import Picker from "./components/Picker";
import Info from "./components/Info";
import getConfiguration from "./utils/config";
import log from "./utils/log";
import { preloadFont } from "./utils/preload";

const { ClipboardItem } = window;

function App() {
  const [config, setConfig] = useState(null);

  // using this to trigger the useEffect because lazy to think of a better way
  const [rand, setRand] = useState(0);
  useEffect(() => {
    try {
      const data = async () => {
        const res = await getConfiguration();
        setConfig(res);
      };
      data();
    } catch (error) {
      console.log(error);
    }
  }, [rand]);

  useEffect(() => {
    /** @type {AbortController | undefined} */
    let controller;
    try {
      controller = new AbortController();
      preloadFont("SSFangTangTi", SSFangTangTi, controller.signal);
    } catch (error) {
      console.error(error);
    } finally {
      return () => {
        controller?.abort();
      }
    }
  }, []);

  const [infoOpen, setInfoOpen] = useState(false);
  const handleClickOpen = () => {
    setInfoOpen(true);
  };
  const handleClose = () => {
    setInfoOpen(false);
  };

  const [openCopySnackbar, setOpenCopySnackbar] = useState(false);
  const handleSnackClose = (e, r) => {
    setOpenCopySnackbar(false);
  };

  const [character, setCharacter] = useState(5);
  const [text, setText] = useState(characters[character].defaultText.text);
  const [position, setPosition] = useState({
    x: characters[character].defaultText.x,
    y: characters[character].defaultText.y,
  });
  const [fontSize, setFontSize] = useState(characters[character].defaultText.s);
  const [spaceSize, setSpaceSize] = useState(50);
  const [rotate, setRotate] = useState(characters[character].defaultText.r);
  const [curve, setCurve] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const img = new Image();

  useEffect(() => {
    setText(characters[character].defaultText.text);
    setPosition({
      x: characters[character].defaultText.x,
      y: characters[character].defaultText.y,
    });
    setRotate(characters[character].defaultText.r);
    setFontSize(characters[character].defaultText.s);
    setLoaded(false);
  }, [character]);

  img.src = "/img/" + characters[character].img;

  img.onload = () => {
    setLoaded(true);
  };

  let angle = (Math.PI * text.length) / 7; // eslint-disable-line no-unused-vars

  const draw = (ctx) => {
    ctx.canvas.width = 296;
    ctx.canvas.height = 256;

    if (loaded && document.fonts.check("12px YurukaStd")) {
      var hRatio = ctx.canvas.width / img.width;
      var vRatio = ctx.canvas.height / img.height;
      var ratio = Math.min(hRatio, vRatio);
      var centerShift_x = (ctx.canvas.width - img.width * ratio) / 2;
      var centerShift_y = (ctx.canvas.height - img.height * ratio) / 2;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShift_x,
        centerShift_y,
        img.width * ratio,
        img.height * ratio
      );
      ctx.font = `${fontSize}px YurukaStd, SSFangTangTi`;
      ctx.miterLimit = 2.5;
      ctx.save();

      
      ctx.translate(position.x, position.y);
      ctx.rotate(rotate / 10);
      ctx.textAlign = "center";
      ctx.fillStyle = characters[character].fillColor;
      var lines = text.split("\n");
      if (curve) {
        ctx.save();
        for (let line of lines) {
          let lineAngle = (Math.PI * line.length) / 7;
          for (let pass = 0; pass < 2; pass++) {
            ctx.save();
            for (let i = 0; i < line.length; i++) {
              ctx.rotate(lineAngle / line.length / 2.2);
              ctx.save();
              ctx.translate(0, -1 * fontSize * 3.5);
              if (pass === 0) {
                ctx.strokeStyle = "white";
                ctx.lineWidth = 15;
                ctx.strokeText(line[i], 0, 0);
              } else {
                ctx.strokeStyle = characters[character].strokeColor;
                ctx.lineWidth = 5;
                ctx.strokeText(line[i], 0, 0);
                ctx.fillText(line[i], 0, 0);
              }
              ctx.restore();
            }
            ctx.restore();
          }
          ctx.translate(0, ((spaceSize - 50) / 50 + 1) * fontSize);
        }
        ctx.restore();
      } else {
        for (let pass = 0; pass < 2; pass++) {
          for (var i = 0, k = 0; i < lines.length; i++) {
            if (pass === 0) {
              ctx.strokeStyle = "white";
              ctx.lineWidth = 15;
              ctx.strokeText(lines[i], 0, k);
            } else {
              ctx.strokeStyle = characters[character].strokeColor;
              ctx.lineWidth = 5;
              ctx.strokeText(lines[i], 0, k);
              ctx.fillText(lines[i], 0, k);
            }
            k += ((spaceSize - 50) / 50 + 1) * fontSize;
          }
        }

        ctx.restore();
      }
    }
  };

  const download = async () => {
    const canvas = document.getElementsByTagName("canvas")[0];
    const link = document.createElement("a");
    link.download = `${characters[character].name}_arcst.yurisaki.top.png`;
    link.href = canvas.toDataURL();
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await log(characters[character].id, characters[character].name, "download");
    setRand(rand + 1);
  };

  function b64toBlob(b64Data, contentType = null, sliceSize = null) {
    contentType = contentType || "image/png";
    sliceSize = sliceSize || 512;
    let byteCharacters = atob(b64Data);
    let byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      let slice = byteCharacters.slice(offset, offset + sliceSize);
      let byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      var byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  const copy = async () => {
    const canvas = document.getElementsByTagName("canvas")[0];
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": b64toBlob(canvas.toDataURL().split(",")[1]),
      }),
    ]);
    setOpenCopySnackbar(true);
    await log(characters[character].id, characters[character].name, "copy");
    setRand(rand + 1);
  };

  return (
    <div className="App">
      <Info open={infoOpen} handleClose={handleClose} config={config} />
      <div className="counter">
        Total Stickers you made: {config?.total || "Not available"}
      </div>
      <div className="container">
        <div className="vertical">
          <div className="canvas">
            <Canvas draw={draw} />
          </div>
          <Slider
            value={curve ? 256 - position.y + fontSize * 3 : 256 - position.y}
            onChange={(e, v) =>
              setPosition({
                ...position,
                y: curve ? 256 + fontSize * 3 - v : 256 - v,
              })
            }
            min={0}
            max={256}
            step={1}
            orientation="vertical"
            track={false}
            color="secondary"
          />
        </div>
        <div className="horizontal">
          <Slider
            className="slider-horizontal"
            value={position.x}
            onChange={(e, v) => setPosition({ ...position, x: v })}
            min={0}
            max={296}
            step={1}
            track={false}
            color="secondary"
          />
          <div className="settings">
            <div>
              <label>Rotate: </label>
              <Slider
                value={rotate}
                onChange={(e, v) => setRotate(v)}
                min={-10}
                max={10}
                step={0.2}
                track={false}
                color="secondary"
              />
            </div>
            <div>
              <label>
                <nobr>Font size: </nobr>
              </label>
              <Slider
                value={fontSize}
                onChange={(e, v) => setFontSize(v)}
                min={10}
                max={100}
                step={1}
                track={false}
                color="secondary"
              />
            </div>
            <div>
              <label>
                <nobr>Spacing: </nobr>
              </label>
              <Slider
                value={spaceSize}
                onChange={(e, v) => setSpaceSize(v)}
                min={0}
                max={100}
                step={1}
                track={false}
                color="secondary"
              />
            </div>
            <div>
              <label>Curve (Beta): </label>
              <Switch
                checked={curve}
                onChange={(e) => setCurve(e.target.checked)}
                color="secondary"
              />
            </div>
          </div>
          <div className="text">
            <TextField
              label="Text"
              size="small"
              color="secondary"
              value={text}
              multiline={true}
              fullWidth
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="picker">
            <Picker setCharacter={setCharacter} />
          </div>
          <div className="buttons">
            <Button color="secondary" onClick={copy}>
              copy
            </Button>
            <Button color="secondary" onClick={download}>
              download
            </Button>
          </div>
        </div>
        <div className="footer">
          <Button color="secondary" onClick={handleClickOpen}>
            About
          </Button>
        </div>
      </div>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={openCopySnackbar}
        onClose={handleSnackClose}
        message="Copied image to clipboard."
        key="copy"
        autoHideDuration={1500}
      />
    </div>
  );
}

export default App;
