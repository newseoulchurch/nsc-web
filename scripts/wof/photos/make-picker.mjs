// scripts/wof/photos/make-picker.mjs — run: node scripts/wof/photos/make-picker.mjs
// Builds .wof-photos/picker.html (local only, never published): one row per event slug, thumbnails,
// Claude's suggestion pre-selected from .wof-photos/suggest.json { slug: filename }.
// "Save picks.json" downloads the choices; move the file into .wof-photos/.
import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = resolve(".wof-photos");
const read = (f, d) => (existsSync(join(ROOT, f)) ? JSON.parse(readFileSync(join(ROOT, f), "utf8")) : d);
const suggest = read("suggest.json", {});
const sources = read("sources.json", {}); // { slug: "drive" | "nas" | "mixed" }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const slugs = readdirSync(ROOT)
  .filter((d) => /^[a-z0-9-]+$/.test(d) && statSync(join(ROOT, d)).isDirectory())
  .sort();

const rows = slugs.map((slug) => {
  const dir = join(ROOT, slug);
  const thumbs = join(dir, "_thumbs");
  mkdirSync(thumbs, { recursive: true });
  const files = readdirSync(dir).filter((f) => /\.(jpe?g|png|heic|webp)$/i.test(f)).sort();
  const cells = files.map((f) => {
    const t = join(thumbs, f.replace(/\.\w+$/, ".jpg"));
    if (!existsSync(t)) execFileSync("sips", ["-s", "format", "jpeg", "-Z", "320", join(dir, f), "--out", t], { stdio: "ignore" });
    const checked = suggest[slug] === f ? "checked" : "";
    const nas = f.startsWith("nas-") ? '<b class="nas">NAS</b>' : "";
    return `<label>${nas}<input type="radio" name="${esc(slug)}" value="${esc(join(dir, f))}" ${checked}><img loading="lazy" src="${esc(t)}" title="${esc(f)}"></label>`;
  }).join("");
  const src = sources[slug] ? ` · ${esc(sources[slug])}` : "";
  return `<section><h2>${esc(slug)} <small>${files.length} photos${src}</small> <button type="button" onclick="clearRow('${esc(slug)}')">no photo</button></h2><div class="row">${cells || "<em>no photos</em>"}</div></section>`;
}).join("\n");

writeFileSync(join(ROOT, "picker.html"), `<!doctype html><meta charset="utf-8"><title>Wall of Faith — photo picker</title>
<style>
body{font:14px system-ui;margin:16px;max-width:1400px}h2{font-size:15px;margin:28px 0 8px}small{color:#777;font-weight:400}
.row{display:flex;flex-wrap:wrap;gap:6px}label{position:relative}input{position:absolute;opacity:0}
img{width:160px;height:160px;object-fit:cover;border:4px solid transparent;border-radius:6px;cursor:pointer}
input:checked+img{border-color:#e07b00}.nas{position:absolute;top:6px;left:6px;background:#b00;color:#fff;font-size:11px;padding:1px 5px;border-radius:3px;z-index:1}
#save{position:sticky;top:8px;padding:8px 14px;font-weight:600;z-index:2}h2 button{font-size:11px;margin-left:8px}
</style>
<p>Orange = cover photo. <b class="nas" style="position:static">NAS</b> photos come from the NAS archive; picking one is your OK to put it on the public site.</p>
<button id="save" onclick="save()">Save picks.json</button>
${rows}
<script>
function clearRow(n){document.querySelectorAll('input[name="'+n+'"]').forEach(i=>i.checked=false)}
async function save(){const p={};document.querySelectorAll('input:checked').forEach(i=>p[i.name]=i.value);
const text=JSON.stringify(p,null,2);
// Chrome/Edge: pick the save location (choose .wof-photos so nothing has to be moved out of Downloads).
if(window.showSaveFilePicker){try{const h=await showSaveFilePicker({suggestedName:'picks.json',types:[{description:'JSON',accept:{'application/json':['.json']}}]});
const w=await h.createWritable();await w.write(text);await w.close();alert('Saved '+Object.keys(p).length+' picks');return}catch(e){if(e.name==='AbortError')return}}
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));
a.download='picks.json';a.click()}
</script>`);
console.log(`picker: ${join(ROOT, "picker.html")} (${slugs.length} events)`);
