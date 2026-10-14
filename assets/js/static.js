// 使用浏览器默认锚点跳转，不加载主题的平滑滚动和动画脚本。
const codeLanguageNames = {
  python: "Python", py: "Python", bash: "Bash", sh: "Shell", shell: "Shell",
  console: "Console", javascript: "JavaScript", js: "JavaScript",
  typescript: "TypeScript", ts: "TypeScript", cpp: "C++", c: "C",
  yaml: "YAML", yml: "YAML", json: "JSON", html: "HTML", css: "CSS",
  ruby: "Ruby", sql: "SQL", markdown: "Markdown", md: "Markdown",
  text: "Text", plaintext: "Text"
};
document.querySelectorAll(".page__content pre").forEach((pre) => {
  const languageElement = pre.closest('[class*="language-"]');
  const languageClass = languageElement && [...languageElement.classList]
    .find((name) => name.startsWith("language-"));
  const language = languageClass ? languageClass.slice(9) : "text";
  const toolbar = document.createElement("div");
  toolbar.className = "code-block-header";
  const label = document.createElement("span");
  label.className = "code-language";
  label.textContent = codeLanguageNames[language] || language;
  toolbar.append(label);
  pre.before(toolbar);

  if (!navigator.clipboard || !window.isSecureContext) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "code-copy";
  button.textContent = "复制代码";
  button.addEventListener("click", async () => {
    const code = pre.querySelector("td.code, td.rouge-code, code");
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.innerText);
      button.textContent = "已复制";
    } catch {
      button.textContent = "复制失败，请手动选择";
    }
  });
  toolbar.append(button);
});

// 双击个人照片切换彩蛋；刷新页面后恢复默认照片。
document.querySelectorAll(".resume-photo[data-easter-egg-src]").forEach((photo) => {
  const originalSrc = photo.getAttribute("src");
  const easterEggSrc = photo.dataset.easterEggSrc;
  const preload = new Image();
  let ready = false;
  let showingEasterEgg = false;

  preload.addEventListener("load", () => { ready = true; });
  preload.src = easterEggSrc;
  photo.draggable = false;
  photo.addEventListener("dblclick", (event) => {
    event.preventDefault();
    if (!ready) return;
    showingEasterEgg = !showingEasterEgg;
    photo.src = showingEasterEgg ? easterEggSrc : originalSrc;
  });
});
