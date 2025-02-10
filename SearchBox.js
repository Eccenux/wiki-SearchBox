/**
	SearchBox – wikitext search and replacement with RegExp support.
	v{version}

	Instrukcja obsługi (pl):
	https://pl.wikipedia.org/wiki/Wikipedia:Narz%C4%99dzia/Wyszukiwanie_i_zamiana

	Authors:
	[[:en:User:Zocky]], Maciej Jaros [[:pl:User:Nux]]
	Forked version by Zocky (2006-06-22):
	https://en.wikipedia.org/w/index.php?title=User:Zocky/SearchBox.js&oldid=60000195

	Dev version:  [[:pl:User:Nux/SearchBox.dev.js]]
	User version: [[:pl:MediaWiki:Gadget-searchbox.js]]

	Repo, bugz, pull requests:
	https://github.com/Eccenux/wiki-SearchBox
*/
/* eslint-disable array-bracket-newline */
/* eslint-disable no-useless-escape */
/* global mw, jQuery */
/* global sel_t, toolbarGadget */

/* Translatable strings */
mw.messages.set({
	'nuxsr-occurences-replaced': 'Zmieniono $1 wystąpień [$2] na [$3].',
	'nuxsr-search-from-the-beginning': 'Wyszukiwanie od początku',
	'nuxsr-search-title': 'Wyszukiwanie i zamiana (wer. $1)',
	'nuxsr-search-alt': 'Szuk.',
	'nuxsr-case-title': 'Zmiana wielkości liter',
	'nuxsr-case-alt': 'Wlk. lit.',
});

/**
 * Search and replace for MW code editor.
 */
function Nuxsr() {
	/** @type {String} App version */
	this.version = '{version}';
}
var nuxsr = new Nuxsr();
window.nuxsr = nuxsr;


/**
 * Render HTML for the form.
 * @returns search box code.
 */
nuxsr.boxHtml = function() {
	return '<form name="nuxsr_form"><div id="srBox" style="line-height: 1.5em;">'
		+'<div>'
			+'<span style="float:left;padding-top:0px;">'
				+'<span class="label">znajdź:</span><br />'
				+'<input size="25" type="text" name="nuxsr_search" id="nuxsr_search" title="[alt+shift+F]" accesskey="F" onkeypress="event.which == 13 && nuxsr.next()"; value="" />'
			+'</span>'
			+'<span style="float:left;padding-top:0px;">'
				+'<span class="label">zamień na:</span><br />'
				+'<input size="25" type="text" name="nuxsr_replace" id="nuxsr_replace" accesskey="G" onkeypress="event.which == 13 && nuxsr.next()"; value="" />'
			+'</span>'
			+'<span>'
				+'<label><input type="checkbox" name="nuxsr_case" onclick="nuxsr.t.focus()" />uwzględnij wielkość liter</label>'
				+'<label><input type="checkbox" name="nuxsr_regexp" onclick="nuxsr.t.focus()" />użyj RegEx</label>'
				+'<br />'
				+'<button type="button" onclick="nuxsr.back()" title="szukaj wstecz [alt+shift+2]" accesskey="2">&lt;</button>&nbsp;'
				+'<button type="button" onclick="nuxsr.next()" title="szukaj dalej [alt+shift+3]" accesskey="3">szukaj&nbsp;&nbsp;&gt;</button> &nbsp; '
				+'<button type="button" onclick="nuxsr.replace();nuxsr.back()" title="zamień znalezione i szukaj poprzedniego [alt+shift+4]" accesskey="4">&lt;</button>&nbsp;'
				+'<button type="button" onclick="nuxsr.replace()" title="zamień znalezione">zamień</button>&nbsp;'
				+'<button type="button" onclick="nuxsr.replace();nuxsr.next()" title="zamień znalezione i szukaj następnego [alt+shift+5]" accesskey="5">&gt;</button> &nbsp; '
				+'<button type="button" onclick="nuxsr.replaceAll()" title="zamień wszystkie wystąpienia, które zostaną znalezione [alt+shift+7]" accesskey="7">zamień&nbsp;wszystkie</button> &nbsp; '
			+'</span>'
		+'</div>'
		+'<div style="clear:both;padding-top:3px;">'
			+'<span>'
				+'<button type="button" onclick="nuxsr.mem.remind()" title="Przypomnij (wstaw w pola) zapisane sekwencje.">MR</button>'
			+'</span>'
			+' &nbsp; '
			+'<span>'
				+'<button type="button" onclick="nuxsr.gotoLine()" title="Skok do wiersza o podanym numerze." >Do wiersza:</button>'
				+' <input type="text" name="nuxsr_goto_line" style="width:55px" />'
			+'</span>'
		+'</div>'
		+'<div style="clear:both"></div>'
	+'</div></form>'
};

//
// Variables set on page load
//
/** @type {Element} A textarea to search in (probably wpTextbox1). */
nuxsr.t = null;
/** @type {Element} Gadget's main form (document.nuxsr_form). */
nuxsr.form = null;
/** @type {Element} document.nuxsr_form.nuxsr.search */
nuxsr.s = null;
/** @type {Element} document.nuxsr_form.nuxsr.replace */
nuxsr.r = null;
/** @type {Element} The form container. */
nuxsr.srbox = null;
/** @type {Element} SR messages textarea. */
nuxsr.messages = null;
/** @type {Element} SR main button. */
nuxsr.searchButton = null;


/* =====================================================
	Common replace/search functions
   ===================================================== */
nuxsr.getSearchString = function ()
{
	var str = nuxsr.s.value;
	if (!nuxsr.form.nuxsr_regexp.checked)
	{
		str = str.replace(/([\[\]\{\}\|\.\*\?\(\)\$\^\\])/g,'\\$1');
	}
	return str;
};

nuxsr.getReplaceString = function ()
{
	var str = nuxsr.r.value;
	if (!nuxsr.form.nuxsr_regexp.checked)
	{
		// not needed
		//str=str.replace(/([\$\\])/g,'\\$1');
	}
	else
	{
		//str=str.replace(/\\n/g,"\n").replace(/\\t/g,"\t").replace(/&backslash;/g,"\\").replace(/&dollar;/g,"\$")
		str = str.replace(/'/g,"\\'");
		eval ("str='"+str+"'");
	}
	return str;
};

/**
 * Local storage key.
 */
nuxsr.storageKey = 'userjs.nuxsr';
/**
 * Save inputs to LS.
 */
nuxsr.saveInputs = function () {
	var data = {
		s:this.form.nuxsr_search.value,
		r:this.form.nuxsr_replace.value,
		case:this.form.nuxsr_case.checked,
		regexp:this.form.nuxsr_regexp.checked,
	};
	localStorage.setItem(this.storageKey, JSON.stringify(data));
}
/**
 * Restore inputs from LS.
 */
nuxsr.restoreInputs = function () {
	var raw = localStorage.getItem(this.storageKey);
	if (raw == null) {
		return false;
	}
	try {
		var data = JSON.parse(raw);
	} catch (error) {
		console.error('[nuxsr]', 'restoreInputs; error parsing object:', raw);
	}
	if (typeof data !== 'object') {
		return;
	}
	
	this.form.nuxsr_search.value = data.s;
	this.form.nuxsr_replace.value = data.r;
	this.form.nuxsr_case.checked = data.case;
	this.form.nuxsr_regexp.checked = data.regexp;

	return true;
}

/* =====================================================
	Search functions
   ===================================================== */
nuxsr.back = function ()
{
	if (nuxsr.s.value==='')
	{
		nuxsr.t.focus();
		return;
	}

	var searchString = nuxsr.getSearchString();
	var selBB = sel_t.getSelBound(nuxsr.t);

	// set up greedy search to get the last match of the searchString
	searchString="^([\\s\\S]*)("+searchString+")";
	var re=new RegExp(searchString, (nuxsr.form.nuxsr_case.checked ? "" : "i"));
	var res = re.exec (nuxsr.t.value.substring(0,selBB.start));
	if (!res)
	{
		res = re.exec (nuxsr.t.value);
	}

	// set up selection
	if (res)
	{
		sel_t.setSelRange (nuxsr.t, res[1].length, res[1].length+res[2].length);
	}
	else
	{
		selBB.start = selBB.end;
		sel_t.setSelBound (nuxsr.t, selBB, false);
	}

	// move to selection
	nuxsr.sync();
};

nuxsr.next = function (norev)
{
	if (nuxsr.s.value==='')
	{
		nuxsr.t.focus();
		return;
	}

	var searchString = nuxsr.getSearchString();
	var selBB = sel_t.getSelBound(nuxsr.t);

	// set up for search forward and execute
	var re=new RegExp(searchString, (nuxsr.form.nuxsr_case.checked ? "g" : "gi"));
	re.lastIndex=selBB.end;
	var res = re.exec (nuxsr.t.value);
	if (!res && !norev)
	{
		nuxsr.msg(mw.msg('nuxsr-search-from-the-beginning'));
		re.lastIndex=0;
		res = re.exec (nuxsr.t.value);
	}

	// set up selection
	if (res)
	{
		sel_t.setSelRange (nuxsr.t, res.index, res.index+res[0].length);
	}
	else
	{
		selBB.start = selBB.end;
		sel_t.setSelBound (nuxsr.t, selBB, false);
	}

	// move to selection
	nuxsr.sync();
};

/* =====================================================
	Replace functions
   ===================================================== */
nuxsr.replace = function ()
{
	//
	// get string
	var str = sel_t.getSelStr(nuxsr.t, true);

	//
	// get attributes
	var searchString = nuxsr.getSearchString();
	var replaceString = nuxsr.getReplaceString();
	var selBB = sel_t.getSelBound(nuxsr.t);

	var re=new RegExp(searchString, (nuxsr.form.nuxsr_case.checked ? "g" : "gi"));

	//
	// replace
	var matchesArr = re.exec(str);
	// only full match counts
	if (matchesArr && matchesArr[0].length==str.length)
	{
		// run
		str = str.replace(re, replaceString);

		// save selection
		var sel_tmp = {
			start : selBB.start,
			strlen_post : str.length
		};

		// replace in selection
		sel_t.qsetSelStr(nuxsr.t, str, true);

		// set new selection range
		sel_t.setSelRange (nuxsr.t, sel_tmp.start, sel_tmp.start + sel_tmp.strlen_post);
	}

	//
	// focus
	nuxsr.t.focus();
};

nuxsr.replaceAll = function ()
{
	//
	// get string
	var str = sel_t.getSelStr(nuxsr.t, true);

	//
	// get attributes
	var searchString = nuxsr.getSearchString();
	var replaceString = nuxsr.getReplaceString();

	var re=new RegExp(searchString, (nuxsr.form.nuxsr_case.checked ? "g" : "gi"));

	//
	// check for ocurrences
	var matchesArr = str.match(re);

	//
	// run
	str = str.replace(re, replaceString);

	//
	// output
	sel_t.qsetSelStr(nuxsr.t, str, true);
	// focus
	nuxsr.t.focus();

	//
	// show num of ocurrences
	if (matchesArr)
	{
		nuxsr.msg(mw.msg('nuxsr-occurences-replaced', matchesArr.length, nuxsr.s.value, nuxsr.r.value));
	}

	return;
};

/* =====================================================
	Toggle case functions
   ===================================================== */
nuxsr.toggleCase = function ()
{
	var selBB = sel_t.getSelBound(nuxsr.t);
	if (selBB.end>selBB.start)
	{
		var str = sel_t.getSelStr(nuxsr.t);
		if (str==str.toUpperCase())
		{
			str = str.toLowerCase();
		}
		else if (str==str.toLowerCase() && selBB.end-selBB.start>1)
		{
			str = str.substring(0,1).toUpperCase()+str.substring(1).toLowerCase();
		}
		else
		{
			str = str.toUpperCase();
		}

		// set selection with new value
		sel_t.setSelStr(nuxsr.t, str, false);
	}
	nuxsr.sync();
};

/* =====================================================
	Move focus back to the textarea
	(previously moved selection to view)
   ===================================================== */
nuxsr.sync = function ()
{
	nuxsr.t.focus();
};

/* =====================================================
	Box show/hide
   ===================================================== */
nuxsr.showHide = function() {

	var create = false;	// first time?
	if ( !this.form ) {
		create = true;
		//
		// inserting search box
		var srbox = document.createElement( 'div' );
		srbox.innerHTML = nuxsr.boxHtml();
		srbox.firstChild.style.display = 'none';

		var topEditor = document.querySelector('.wikiEditor-ui-top');
		if (topEditor instanceof Element) {
			topEditor.appendChild(srbox);
		} else {
			jQuery(this.t).before(srbox);
		}
		this.srbox = srbox;
		this.form = document.nuxsr_form;
		this.s = document.nuxsr_form.nuxsr_search;
		this.r = document.nuxsr_form.nuxsr_replace;

		// init data (re)store
		nuxsr.restoreInputs();
		jQuery('input', srbox).on('change', function(){
			nuxsr.saveInputs();
		});
	}

	//
	// inserting message box
	if ( !this.messages ) {
		var el = document.createElement( 'textarea' );
		el.cols = nuxsr.t.cols;
		el.style.cssText = nuxsr.t.style.cssText;
		el.rows = 5;
		//el.id = 'messages';
		el.style.display = 'none';
		el.style.width = '100%';
		el.style.boxSizing = 'border-box'
		el.style.borderTop = '1px solid silver';
		el.readOnly = true;
		nuxsr.messages = el;
		jQuery('.wikiEditor-ui').after(nuxsr.messages);
	}

	// setup show/hide and fix access key
	var hidding = false;
	if ( nuxsr.form.style.display == 'none' ) {
		if (nuxsr.messages.value.length) {
			nuxsr.messages.style.display = 'block';
		}
		nuxsr.form.style.display = 'block';
		nuxsr.searchButton.accessKey = "none";
		nuxsr.s.focus();

	} else {
		hidding = true;
		nuxsr.messages.style.display = 'none';
		nuxsr.form.style.display = 'none';
		nuxsr.searchButton.accessKey = "F";
	}

	// usage: mw.hook('userjs.SearchBox.showHide').add(function (sr, hidding) {});
	mw.hook('userjs.SearchBox.showHide').fire(nuxsr, hidding);
	// each time when shown
	if (!hidding) {
		mw.hook('userjs.SearchBox.show').fire(nuxsr);
	}
	// first time shown (form created)
	if (create) {
		mw.hook('userjs.SearchBox.create').fire(nuxsr);
	}
}

/* =====================================================
	Go to a line given in the form field
   ===================================================== */
nuxsr.gotoLine = function ()
{
	if (nuxsr.form.nuxsr_goto_line.value=='')
	{
		nuxsr.t.focus();
		return;
	}

	var lineno = parseInt(nuxsr.form.nuxsr_goto_line.value);

	// search for the line
	var index = (lineno==1) ? 0 : nuxsr.indexOfNthMatch (nuxsr.t.value, '\n', lineno-1);

	// set up selection
	if (index>=0)
	{
		if (index>0)	// move after new line character
		{
			index++;
		}
		sel_t.setSelRange (nuxsr.t, index, index)
	}
	
	// move to selection
	nuxsr.sync();
}
// little helper fun
nuxsr.indexOfNthMatch = function (haystack, needle, n)
{
	var index = -1;
	for (var i=1; i<=n && ((index=haystack.indexOf(needle, index+1)) != -1); i++)
	{
		if (i == n)
		{
			return index;
		}
	}
	return -1;
}

/* =====================================================
	Memory module
   ===================================================== */
nuxsr.mem = {
	s : [
		' - ',
		// nie powinno łapać: class="wikitable sortable"
		// nie powinno łapać: |align="center"|abc "def"
		// powinno łapać: "a"
		'([^=])"([^|"\\]})> \\n\\t.,?;][^"]*?[^=| \\n\\t]|[^"|{}\\[\\]]{1,3})"([^>|])',
	],
	r : [
		' – ',
		'$1„$2”$3',
	]
};
nuxsr.mem.index = -1;
nuxsr.mem.remind = function()
{
	nuxsr.mem.index++;
	nuxsr.mem.index%=nuxsr.mem.s.length;
	nuxsr.s.value = nuxsr.mem.s[nuxsr.mem.index];
	nuxsr.r.value = nuxsr.mem.r[nuxsr.mem.index];
}
nuxsr.mass_rep_htmlspecialchars = {
	s : ['&',		'>',		'<'],
	r : ['&amp;',	'&gt;',		'&lt;']
};

nuxsr.mass_rep = function (obj)
{
	//
	// always as regExp
	//
	var prev_ser_RE = nuxsr.form.nuxsr_regexp.checked;
	nuxsr.form.nuxsr_regexp.checked = true;

	/*
	//
	// always from the beginning
	//
	var selBB = {start:0, end:0};
	sel_t.setSelBound(nuxsr.t, selBB, false);
	*/
	//
	// Set up selection vars
	//
	var selBB = sel_t.getSelBound(nuxsr.t);
	var field_len = nuxsr.t.value.length;
	var field_len_diff = 0;

	//
	// replace
	//
	for (var i=0; i<obj.s.length; i++)
	{
		nuxsr.s.value = obj.s[i];
		nuxsr.r.value = obj.r[i];
		nuxsr.replaceAll();

		// recalculate end of the user's selection
		if (selBB.start!=selBB.end)
		{
			field_len_diff = nuxsr.t.value.length - field_len; // change after replacing stuff
			selBB.end += field_len_diff;
			field_len = nuxsr.t.value.length;
		}

		sel_t.setSelBound(nuxsr.t, selBB, false);
	}

	//
	// previous settings
	//
	nuxsr.form.nuxsr_regexp.checked = prev_ser_RE;
}

//
// Messages
//
nuxsr.msg = function(str) {
	var el = nuxsr.messages;
	el.style.display = 'block';
	el.value = str + '\n' + el.value;
}

/* =====================================================
	Init buttons
   ===================================================== */
nuxsr.addButtons = function(toolbarGadget) {
	var me = this;

	if (!this._buttonsAlreadyDone && toolbarGadget) {
		this._buttonsAlreadyDone = true;

		toolbarGadget.addButton( {
			title: mw.msg('nuxsr-search-title', me.version),
			alt: mw.msg('nuxsr-search-alt'),
			id: 'srSearchIcon',
			oldIcon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Button_find.png',
			newIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Crystal_Clear_action_viewmag.png/21px-Crystal_Clear_action_viewmag.png',
			onclick: function() {
				me.showHide();
			},
			oncreate: function(button) {
				me.searchButton = button;
				me.searchButton.accessKey = "F";
			},
		} );
		toolbarGadget.addButton( {
			title: mw.msg('nuxsr-case-title'),
			alt: mw.msg('nuxsr-case-alt'),
			id: 'srCaseIcon',
			oldIcon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Button_case.png',
			newIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Wynn.svg/23px-Wynn.svg.png',
			onclick: function() {
				me.toggleCase();
			},
		} );
	}
	if (!toolbarGadget) {
		console.error('[nuxsr]', 'toolbarGadget is not defined');
	}

	// load dep if not ready yet
	if (typeof sel_t == 'undefined') {
		console.log('[nuxsr]', 'sel_t not defined, will attempt to load the library from local gadgets');
		mw.loader.using("ext.gadget.lib-sel_t", function() {
			me.addButtons(toolbarGadget)
		}, function() {
			console.log('[nuxsr]', 'sel_t not defined, will attempt to load from pl.wiki');
			mw.loader.load("https://pl.wikipedia.org/w/index.php?action=raw&ctype=text/javascript&title=MediaWiki:Gadget-sel_t.js");
		});
	}
}
nuxsr.init = function() {
	var me = this;

	// buttons / toolbar
	mw.loader.using( "ext.gadget.lib-toolbar", function() {
		me.addButtons(toolbarGadget)
	}, function() {
		console.log('[nuxsr]', 'failed to load local ext.gadget.lib-toolbar, will attempt to load from pl.wiki', arguments);
		// fallback for wikis without gadget.lib-toolbar
		mw.loader.load("https://pl.wikipedia.org/w/index.php?action=raw&ctype=text/javascript&title=MediaWiki:Gadget-lib-toolbar.js");
		mw.hook('toolbarGadget.ready').add(function() {
			me.addButtons(toolbarGadget);
		});
	} );

	jQuery( document ).ready( function() {
		// main textarea
		if (typeof document.editform !== 'undefined') {
			me.t = document.editform.wpTextbox1;
		}
	} );

	// usage: mw.hook('userjs.SearchBox.init').add(function (sr) {});
	mw.hook('userjs.SearchBox.init').fire(this);
}

/* =====================================================
	Run init on edit
   ===================================================== */
if ( mw.config.get( 'wgAction' ) == 'edit' || mw.config.get( 'wgAction' ) == 'submit' ) {
	nuxsr.init();
}