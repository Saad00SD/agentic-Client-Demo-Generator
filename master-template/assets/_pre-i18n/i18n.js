/* ============================================================
   XPENG Vector — English only
   ------------------------------------------------------------
   This build ships in English. The runtime in app.js is
   language-agnostic: it resolves a code to a dictionary in DICTS
   and a pattern list in PATTERNS, so adding a language here is a
   data addition and nothing in app.js changes.

   The Geely Uptime master carries German and Dutch, 664 phrases
   and 75 pattern rules each. Those dictionaries are keyed on
   Geely's own campaign names and aftersales vocabulary, so they
   are not portable to this build: a language here would be a
   fresh translation pass against this build's English, not a
   copy.

   Deliberately English-only, not unfinished. XPENG UK is a
   single-market programme through one distributor. A language
   switch would be a capability nobody in the audience needs, and
   showing one would invite a question the programme does not
   have to answer.
   ============================================================ */

const LANGS = [
  { code:'en', label:'English', flag:'\u{1F1EC}\u{1F1E7}', tag:'en-GB' }
];

const DICTS    = {};
const PATTERNS = {};
