const api = typeof browser !== "undefined" ? browser : chrome;

function t(key) {
  return api.i18n.getMessage(key) || key;
}

function applyI18n() {
  document.documentElement.lang = api.i18n.getUILanguage
    ? api.i18n.getUILanguage()
    : "en";
  const rtl = ["ar", "fa", "he", "ur"];
  const lang = (document.documentElement.lang || "en").split("-")[0];
  document.documentElement.dir = rtl.includes(lang) ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
}

function scanPage() {
  const FONT_EXT = /\.(woff2?|ttf|otf|eot)(\?|#|$)/i;

  const used = new Map();
  const nodes = document.body
    ? document.body.querySelectorAll("*")
    : [];
  let count = 0;
  for (const el of nodes) {
    if (count++ > 4000) break;
    const fam = getComputedStyle(el).fontFamily;
    if (!fam) continue;
    const first = fam.split(",")[0].replace(/["']/g, "").trim();
    if (!first || used.has(first.toLowerCase())) continue;
    used.set(first.toLowerCase(), first);
  }

  const files = new Map();
  const addUrl = (url, family) => {
    try {
      const abs = new URL(url, location.href).href;
      if (FONT_EXT.test(abs) && !files.has(abs)) files.set(abs, family || "");
    } catch (e) { }
  };

  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch (e) {
      continue;
    }
    if (!rules) continue;
    for (const rule of rules) {
      if (rule.type === CSSRule.FONT_FACE_RULE) {
        const family = (rule.style.getPropertyValue("font-family") || "")
          .replace(/["']/g, "")
          .trim();
        const src = rule.style.getPropertyValue("src") || "";
        const re = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
        let m;
        while ((m = re.exec(src))) addUrl(m[1], family);
      }
    }
  }

  try {
    for (const e of performance.getEntriesByType("resource")) {
      if (FONT_EXT.test(e.name)) addUrl(e.name, "");
    }
  } catch (e) { }

  const fileList = [...files.entries()].map(([url, family]) => {
    let name = url.split("/").pop().split("?")[0].split("#")[0];
    try {
      name = decodeURIComponent(name);
    } catch (e) { }
    return { url, family, name };
  });

  return {
    families: [...used.values()].sort((a, b) => a.localeCompare(b)),
    files: fileList,
  };
}

const content = document.getElementById("content");

function makeSection(titleKey, items, renderItem) {
  const tpl = document.getElementById("tpl-section");
  const node = tpl.content.cloneNode(true);
  node.querySelector(".section-title").textContent = t(titleKey);
  const list = node.querySelector(".list");
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = t(titleKey === "usedFonts" ? "noFonts" : "noFiles");
    list.appendChild(li);
  } else {
    items.forEach((it) => list.appendChild(renderItem(it)));
  }
  return node;
}

function familyItem(family) {
  const li = document.createElement("li");
  li.className = "item";
  const info = document.createElement("div");
  info.className = "info";
  const name = document.createElement("div");
  name.className = "name sample";
  name.textContent = family;
  name.style.fontFamily = `"${family}", sans-serif`;
  info.appendChild(name);
  li.appendChild(info);

  const btn = document.createElement("button");
  btn.className = "btn";
  btn.textContent = t("copy");
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(family);
      btn.textContent = t("copied");
      btn.classList.add("done");
      setTimeout(() => {
        btn.textContent = t("copy");
        btn.classList.remove("done");
      }, 1200);
    } catch (e) { }
  });
  li.appendChild(btn);
  return li;
}

function fileItem(file) {
  const li = document.createElement("li");
  li.className = "item";
  const info = document.createElement("div");
  info.className = "info";
  const name = document.createElement("div");
  name.className = "name";
  name.textContent = file.name;
  name.title = file.url;
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = file.family || file.url.replace(/^https?:\/\//, "");
  info.appendChild(name);
  info.appendChild(meta);
  li.appendChild(info);

  const btn = document.createElement("button");
  btn.className = "btn";
  btn.textContent = t("download");
  btn.addEventListener("click", () => {
    api.downloads.download({ url: file.url, filename: file.name });
  });
  li.appendChild(btn);
  return li;
}

function render(result) {
  content.innerHTML = "";
  content.appendChild(makeSection("usedFonts", result.families, familyItem));
  content.appendChild(makeSection("downloadable", result.files, fileItem));
}

function showStatus(key) {
  content.innerHTML = `<p class="status">${t(key)}</p>`;
}

async function run() {
  showStatus("scanning");
  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/^https?:/.test(tab.url || "")) {
      showStatus("unsupported");
      return;
    }
    const results = await api.scripting.executeScript({
      target: { tabId: tab.id },
      func: scanPage,
    });
    render(results[0].result);
  } catch (e) {
    showStatus("error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyI18n();
  const versionEl = document.getElementById("version");
  if (versionEl) {
    versionEl.textContent = `v${api.runtime.getManifest().version}`;
  }
  document.getElementById("rescan").addEventListener("click", run);
  run();
});
