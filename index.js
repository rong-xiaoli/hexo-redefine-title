'use strict';

/**
 * hexo-redefine-title
 * Dynamic page title for Hexo Theme Redefine.
 * Changes the browser tab title when the page loses/regains focus,
 * with configurable messages and timeout.
 *
 * Reference: theme-next/hexo-next-title
 */

// ── Default configuration ──────────────────────────────────────────────
const defaultConfig = {
  enable: false,
  timeout: 2000,
  hidden: {
    title: '(/-\\\\) 别走嘛…'
  },
  visible: {
    title: '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ 欢迎回来！'
  }
};

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Deep-merge sources into target (mutates target).
 * Arrays and scalars are overwritten; plain objects are merged recursively.
 */
function deepMerge(target, ...sources) {
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    for (const key of Object.keys(src)) {
      const tv = target[key];
      const sv = src[key];
      if (sv && typeof sv === 'object' && !Array.isArray(sv) &&
          tv && typeof tv === 'object' && !Array.isArray(tv)) {
        deepMerge(tv, sv);
      } else {
        target[key] = sv;
      }
    }
  }
  return target;
}

/**
 * Load effective config: defaults < _config.yml < _config.redefine.yml
 */
function loadConfig(hexo) {
  const rootCfg = hexo.config.title_change;
  const themeCfg = hexo.theme.config && hexo.theme.config.title_change;
  return deepMerge(deepMerge({}, defaultConfig), rootCfg, themeCfg);
}

/**
 * Build the injected <script> tag.
 * Uses JSON.stringify for safe embedding of user-provided strings.
 */
function buildScript(config) {
  const cfg = {
    hiddenTitle: config.hidden.title,
    visibleTitle: config.visible.title,
    timeout: Number(config.timeout) || 2000
  };

  // Escape '</' in JSON to prevent premature script-tag closing in HTML
  const safeJson = JSON.stringify(cfg).replace(/<\//g, '<\\/');

  return `<script id="redefine-title-script">
(function(){var cfg=${safeJson},orig=document.title,timer=null;
function up(){orig=document.title;}
function vc(){if(document.hidden){document.title=cfg.hiddenTitle;
if(timer){clearTimeout(timer);timer=null;}}else{document.title=cfg.visibleTitle;
timer=setTimeout(function(){document.title=orig;timer=null;},cfg.timeout);}}
document.addEventListener('visibilitychange',vc,false);
function hs(s){if(s&&s.hooks){s.hooks.on('page:view',up);}}
if(window.swup&&window.swup.hooks)hs(window.swup);
document.addEventListener('redefine:swup:ready',function(e){hs(e.detail&&e.detail.swup);});
window.addEventListener('load',up,{once:true});
})();</script>`;
}

// ── Register filter ────────────────────────────────────────────────────

hexo.extend.filter.register('after_render:html', function (str) {
  const config = loadConfig(this);
  if (!config.enable) return str;

  const script = buildScript(config);
  return str.replace('</head>', script + '\n</head>');
});
