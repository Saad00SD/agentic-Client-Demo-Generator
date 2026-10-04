/* ============================================================
   Master Demo Template — Dynamic Localization Engine
   ============================================================ */
(function() {
  window.I18N = {
    getLang: function() {
      try {
        return localStorage.getItem('xpeng-vector-lang') || (window.CLIENT_CONFIG && window.CLIENT_CONFIG.defaultLanguage) || 'en';
      } catch(e) {
        return 'en';
      }
    },
    setLang: function(code) {
      try { localStorage.setItem('xpeng-vector-lang', code); } catch(e){}
      if (typeof applyLang === 'function') applyLang();
    }
  };
})();
