/*
Instrukcja obsługi:
http://pl.wikipedia.org/wiki/Wikipedia:Narz%C4%99dzia/Wyszukiwanie_i_zamiana

Autorzy:
[[:en:User:Zocky]], Maciej Jaros [[:pl:User:Nux]]
Wykorzystana wersja skryptu Zocky:
http://en.wikipedia.org/w/index.php?title=User:Zocky/SearchBox.js&oldid=60000195

Dev version:
http://pl.wikipedia.org/w/index.php?title=Wikipedysta:Nux/SearchBox.dev.js&action=edit
User version:
http://pl.wikipedia.org/w/index.php?title=MediaWiki:Gadget-searchbox.js&action=edit
Github:
https://github.com/Eccenux/wiki-SearchBox
*/
/* eslint-disable array-bracket-newline */
/* eslint-disable no-useless-escape */
/* global mw, jQuery */
/* global sel_t, toolbarGadget */
/* global nuxsr */

/* Translatable strings */
mw.messages.set( {
	'sbg-occurences-replaced': 'Zmieniono $1 wystąpień [$2] na [$3].',
	'sbg-search-from-the-beginning': 'Wyszukiwanie od początku'
} );

/**
 * Search box for Mediawiki code editor.
 */
window.nuxsr = {
	/** Version of the gadget */
	version: '2.4.1dev'
};



//
// search box code
nuxsr.boxHTML =
	'<form name="nuxsr_form"><div id="srBox" style="line-height: 1.5em;">'
		+'<div>'
			+'<span style="float:left;padding-top:0px;">'
				+'<span class="label">znajdź:</span><br />'
				+'<input size="25" type="text" name="nuxsr_search" id="nuxsr_search" accesskey="F" tabindex="8" onkeypress="event.which == 13 && nuxsr.next()"; value="" />'
			+'</span>'
			+'<span style="float:left;padding-top:0px;">'
				+'<span class="label">zamień na:</span><br />'
				+'<input size="25" type="text" name="nuxsr_replace" id="nuxsr_replace" accesskey="G" tabindex="9" onkeypress="event.which == 13 && nuxsr.next()"; value="" />'
			+'</span>'
			+'<span>'
				+'<label><input type="checkbox" name="nuxsr_case" onclick="nuxsr.t.focus()" tabindex="10" />uwzględnij wielkość liter</label>'
				+'<label><input type="checkbox" name="nuxsr_regexp" onclick="nuxsr.t.focus()" tabindex="11" />użyj RegEx</label>'
				+'<br />'
				+'<a href="javascript:nuxsr.back()" title="szukaj wstecz [alt-2]" accesskey="2">&lt;</a>&nbsp;'
				+'<a href="javascript:nuxsr.next()" title="szukaj dalej [alt-3]" accesskey="3">szukaj&nbsp;&nbsp;&gt;</a> &nbsp; '
				+'<a href="javascript:nuxsr.replace();nuxsr.back()" title="zamień znalezione i szukaj poprzedniego [alt-4]" accesskey="4">&lt;</a>&nbsp;'
				+'<a href="javascript:nuxsr.replace()" title="zamień znalezione">zamień</a>&nbsp;'
				+'<a href="javascript:nuxsr.replace();nuxsr.next()" title="zamień znalezione i szukaj następnego [alt-5]" accesskey="5">&gt;</a> &nbsp; '
				+'<a href="javascript:nuxsr.replaceAll()" title="zamień wszystkie wystąpienia, które zostaną znalezione [alt-7]" accesskey="7">zamień&nbsp;wszystkie</a> &nbsp; '
			+'</span>'
		+'</div>'
		+'<div style="clear:both;padding-top:3px;">'
			+'<span>'
				+'<a href="javascript:nuxsr.mem.remind()" style="background:inherit">MR</a>'
			+'</span>'
			+' &nbsp; '
			+'<span>'
				+'<a href="javascript:nuxsr.gotoLine()" style="background:inherit" title="Skok do wiersza o podanym numerze.">Do wiersza:</a>'
				+' <input type="text" name="nuxsr_goto_line" tabindex="12" style="width:55px" />'
			+'</span>'
		+'</div>'
		+'<div style="clear:both"></div>'
	+'</div></form>'
;

//
// Variables set on page load
//
// nuxsr.t=document.editform.wpTextbox1;
// nuxsr.form=document.nuxsr_form;
// nuxsr.s=document.nuxsr_form.nuxsr.search;
// nuxsr.r=document.nuxsr_form.nuxsr.replace;
// nuxsr.srbox is a form container;

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
		nuxsr.msg(mw.msg('sbg-search-from-the-beginning'));
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
		nuxsr.msg( mw.msg('sbg-occurences-replaced', matchesArr.length, nuxsr.s.value, nuxsr.r.value));
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

	if ( !this.form ) {
		//
		// inserting search box
		var srbox = document.createElement( 'div' );
		srbox.innerHTML = nuxsr.boxHTML;
		srbox.firstChild.style.display = 'none';

		jQuery( this.t ).before( srbox );
		this.srbox = srbox;
		this.form = document.nuxsr_form;
		this.s = document.nuxsr_form.nuxsr_search;
		this.r = document.nuxsr_form.nuxsr_replace;

	}

	//
	// inserting message box
	if ( this.messages == undefined ) {
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
		jQuery('.wikiEditor-ui-text').after(el);
		nuxsr.messages = el;
	}

	// fix access key
	if ( nuxsr.form.style.display == 'none' ) {
		if (nuxsr.messages.value.length) {
			nuxsr.messages.style.display = 'block';
		}
		nuxsr.form.style.display = 'block';
		nuxsr.searchIcon.accessKey = "none";
		nuxsr.s.focus();

	} else {
		nuxsr.messages.style.display = 'none';
		nuxsr.form.style.display = 'none';
		nuxsr.searchIcon.accessKey = "F";
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
		'"(.*?)"([^>])'
	],
	r : [
		' – ',
		'„$1”$2'
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
nuxsr.init = function() {
	var that = this;
	mw.loader.using( "ext.gadget.lib-toolbar", function() {
		toolbarGadget.addButton( {
			title: 'Wyszukiwanie i zamiana (wer. ' + that.version + ')',
			alt: 'Szuk.',
			id: 'SearchIcon',
			oldIcon: '//upload.wikimedia.org/wikipedia/commons/1/12/Button_find.png',
			newIcon: '//commons.wikimedia.org/w/thumb.php?f=Crystal_Clear_action_viewmag.png&w=21',
			onclick: function() {
				that.showHide();
			},
			oncreate: function( button ) {
				that.searchIcon = button;
				that.searchIcon.accessKey = "F";
			}
		} );
		toolbarGadget.addButton( {
			title: 'Zmiana wielkości liter',
			alt: 'Wlk. lit.',
			id: 'SearchIcon',
			oldIcon: '//upload.wikimedia.org/wikipedia/commons/1/12/Button_case.png',
			newIcon: '//commons.wikimedia.org/w/thumb.php?f=Wynn.svg&w=23',
			onclick: function() {
				that.toggleCase();
			}
		} );
	} );

	jQuery( document ).ready( function() {
		if (typeof document.editform !== 'undefined') {
			that.t = document.editform.wpTextbox1;
		}
	} );
}

/* =====================================================
	Run init on edit
   ===================================================== */
if ( mw.config.get( 'wgAction' ) == 'edit' || mw.config.get( 'wgAction' ) == 'submit' ) {
	nuxsr.init();
}
