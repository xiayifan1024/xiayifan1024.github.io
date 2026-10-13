// 使用浏览器默认锚点跳转，不加载主题的平滑滚动和动画脚本。
if (navigator.clipboard && window.isSecureContext) {
  document.querySelectorAll(".page__content pre").forEach((pre) => {
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
    pre.before(button);
  });
}
