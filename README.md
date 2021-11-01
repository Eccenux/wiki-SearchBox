Search and replace for MW code editor
====================================================

**Instrukcja obsługi (pl)**:
http://pl.wikipedia.org/wiki/Wikipedia:Narz%C4%99dzia/Wyszukiwanie_i_zamiana

License
---------
Licence: **[GNU General Public License v2](http://opensource.org/licenses/gpl-license.php)**.

**Main authors**: en.wiki: User:Zocky © 2006, Maciej Jaros (pl.wiki: User:Nux) © 2006-2021
**Main contributors** (pl.wiki): Beau, Wargo.
See more at: https://pl.wikipedia.org/w/index.php?title=MediaWiki:Gadget-searchbox.js&action=history

Forked script version:
http://en.wikipedia.org/w/index.php?title=User:Zocky/SearchBox.js&oldid=60000195

Dev version:
http://pl.wikipedia.org/w/index.php?title=Wikipedysta:Nux/SearchBox.dev.js&action=edit
User version:
http://pl.wikipedia.org/w/index.php?title=MediaWiki:Gadget-searchbox.js&action=edit
Github:
https://github.com/Eccenux/wiki-SearchBox

Dev notes
---------
ESLint is recommended for development. 

This fork requires extra libraries:
* My selection tools (sel_t) for operating on selected text and cursor positioning.
* And a toolbar helper for adding buttons.

Gadget definition:
```
searchbox [ResourceLoader | dependencies=ext.gadget.lib-toolbar, ext.gadget.lib-sel_t | type = general ] | searchbox.css | searchbox.js
```

See:
https://pl.wikipedia.org/wiki/MediaWiki:Gadgets-definition

I18n
---------
To translate this extension you would have to translate strings defined in `mw.messages`. Note that you must keep `$1`, `$2` etc. Will be replaced with dynamic values.

You would also have to replace `nuxsr.boxHtml` function. The input names need to be the same, but you could change layout a bit.
