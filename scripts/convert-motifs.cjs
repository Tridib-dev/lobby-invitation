const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "art-src";
const OUT = "public/patterns/motifs";
fs.mkdirSync(OUT, { recursive : true });

( async () => {
    for ( const file of fs.readdirSync(SRC)) {
        if (!/\.(svg|png|jpe?g|webp)$/i.test(file)) continue;
        const name = path.parse(file).name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        console.log("converting", file); // to understand if its even duhhning .... iykyk
        const input = path.join(SRC, file);
        const base = () => sharp(input , { density: 72, limitInputPixels: false }).resize({ width: 1024, height: 1024, fit: "inside" }).flatten({background : "#000000"}).greyscale() ;
        const { channels } = await base().stats();
        const light = channels[0].mean > 127 ;
        let img = base().normalize();

        if (light) img = img.negate({ alpha: false });
        const info = await img.webp({quality : 90}).toFile(path.join(OUT,name + ".webp"));
        console.log(name+".webp",info.width + "x" + info.height, light ? "(inverted)" : "" );
    }
})().catch((e) => console.log("FAILED", e.message));