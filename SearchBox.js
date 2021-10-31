/*
; Instrukcja obsługi: [[Wikipedia:Narzędzia/Wyszukiwanie i zamiana]]
; Autorzy: [[:en:User:Zocky]], Maciej Jaros [[:pl:User:Nux]]
; Wykorzystana wersja skryptu Zocky: http://en.wikipedia.org/w/index.php?title=User:Zocky/SearchBox.js&oldid=60000195

<pre>
/* ======================================================================== *\
    Search box for Mediawiki
	
	+ search in edit area
	+ replace found text
	+ search and replace with regular expressions
	+ memory (basic functionality)
	
	- not yet fully working with IE
	
	copyright:  (C) 2006 Zocky (en:User:Zocky), (C) 2006-2010 Maciej Jaros (pl:User:Nux, en:User:EcceNux)
	licence:    GNU General Public License v2,
                http://opensource.org/licenses/gpl-license.php
\* ======================================================================== */
	// version
	var tmp_VERSION = '2.0.0.dev2';  // = nuxsr.version = nuxsr.ver
// ----------

/* =====================================================
	External modules
   ===================================================== */
if (typeof importScriptAtr=='undefined')
{
	function importScriptAtr(page, atr)
	{	
		var uri = wgScript + '?atr='+atr+'&title=' +
			encodeURIComponent(page.replace(/ /g,'_')).replace(/%2F/ig,'/').replace(/%3A/ig,':') +
			'&action=raw&ctype=text/javascript';
		importScriptURI(uri);
	}
}
if ((typeof sel_t)!='object' || ((typeof sel_t)=='object' && (typeof sel_t.version)=='string' && sel_t.version.indexOf('1.1')==0))
{
	importScriptAtr('Wikipedysta:Nux/sel_t.js', 'ver120')
}
if ((typeof nuxedtoolkit)!='object')
{
	importScriptAtr('Wikipedysta:Nux/nuxedtoolkit.js', 'ver106')
}

/* =====================================================
	CSS
   ===================================================== */
document.write('<link rel="stylesheet" type="text/css" href="'
+'http://pl.wikipedia.org/w/index.php?title=Wikipedysta:Nux/SearchBox.css'
+'&action=raw&ctype=text/css&dontcountme=s">');


/* =====================================================
	Lang array / object
   ===================================================== */
var tmp_nuxsr_lang = {'_' : ''
	,'_num_ ocurrences of _str_ replaced with _str_' : 'Zmieniono $1 wystąpień [$2] na [$3].'
	,'searching from the beginning' : 'wyszukiwanie od początku'
	,'name conflict error' : 'Błąd krytyczny - konflikt nazw!\n\nJeden ze skryptów używa już nazwy nuxsr jako zmienną globalną.'
};
// 'Critical error - name conflict!\n\nOne of the scripts uses nuxsr as a global variable.'

/* =====================================================
	Object Init
   ===================================================== */
if (nuxsr!=undefined)
{
	alert();
}
var nuxsr = new Object();
nuxsr.ver = nuxsr.version = tmp_VERSION;
nuxsr.lang = tmp_nuxsr_lang;

//
// btns definitions
nuxsr.btns =
{
	sr :
	{
		attrs :
		{
			title : 'Wyszukiwanie i zamiana (wer. '+nuxsr.ver+')',
			alt : "Szuk.",
			style : "width:auto;height:auto",
			id : 'SearchIcon'
		},
		icons :
		{
			oldbar : 'http://upload.wikimedia.org/wikipedia/en/1/12/Button_find.png',
			newbar : 'http://commons.wikimedia.org/w/thumb.php?f=Crystal_Clear_action_viewmag.png&width=21px'
		}
	},
	tc :
	{
		attrs :
		{
			title : 'Zmiana wielkości liter',
			alt : "Wlk. lit.",
			style : "width:auto;height:auto"
		},
		icons :
		{
			oldbar : 'http://upload.wikimedia.org/wikipedia/commons/1/12/Button_case.png',
			newbar : 'http://commons.wikimedia.org/w/thumb.php?f=Wynn.svg&width=23px'
		}
	}
}

//
// search box code
nuxsr.boxHTML =
	'<form name="nuxsr_form"><div id="srBox">'
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
				+'<a href="javascript:nuxsr.back()" onmouseover="nuxsr.t.focus()" title="szukaj wstecz [alt-2]" accesskey="2">&lt;</a>&nbsp;'
				+'<a href="javascript:nuxsr.next()" onmouseover="nuxsr.t.focus()" title="szukaj dalej [alt-3]" accesskey="3">szukaj&nbsp;&nbsp;&gt;</a>&emsp;'
				+'<a href="javascript:nuxsr.replace();nuxsr.back()" onmouseover="nuxsr.t.focus()" title="zamień znalezione i szukaj poprzedniego [alt-4]" accesskey="4">&lt;</a>&nbsp;'
				+'<a href="javascript:nuxsr.replace()" onmouseover="nuxsr.t.focus()" title="zamień znalezione">zamień</a>&nbsp;'
				+'<a href="javascript:nuxsr.replace();nuxsr.next()" onmouseover="nuxsr.t.focus()" title="zamień znalezione i szukaj następnego [alt-5]" accesskey="5">&gt;</a>&emsp;'
				+'<a href="javascript:nuxsr.replaceAll()" onmouseover="nuxsr.t.focus()" title="zamień wszystkie wystąpienia, które zostaną znalezione [alt-7]" accesskey="7">zamień&nbsp;wszystkie</a>&emsp;'
			+'</span>'
		+'</div>'
		+'<div style="clear:both;padding-top:3px;">'
			+'<span>'
				+'<a href="javascript:nuxsr.mem.remind()" style="background:inherit">MR</a>'
				+' <a href="javascript:wiki_p.wiki2html()" title="Convert mediawiki-like code to HTML code">Wiki2HTML</a>'
				+' <a href="javascript:mass_rep.quick_rep(nuxsr.t, sr_seria_htmlspecialchars)" title="Convert special HTML chars to their entities">HTMLSpecialChars</a>'
			+'</span>'
		+'</div>'
		+'<div style="clear:both"></div>'
	+'</div></form>'
;

//
// Variables set on page load
//
// nuxsr.t=document.editform.wpTextbox1;
// nuxsr.f=document.nuxsr_form;
// nuxsr.s=document.nuxsr_form.nuxsr.search;
// nuxsr.r=document.nuxsr_form.nuxsr.replace;
// nuxsr.w=nuxsr.t.style.width;
// nuxsr.i=document.getElementById('SearchIcon');

/* =====================================================
	Common replace/search functions
   ===================================================== */
nuxsr.getSearchString = function ()
{
	var str = nuxsr.s.value;
	if (!nuxsr.f.nuxsr_regexp.checked)
	{
		str = str.replace(/([\[\]\{\}\|\.\*\?\(\)\$\^\\])/g,'\\$1')
	}
	return str;
}
nuxsr.getReplaceString = function ()
{
	var str = nuxsr.r.value;
	if (!nuxsr.f.nuxsr_regexp.checked)
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
}

/* =====================================================
	Search functions
   ===================================================== */
nuxsr.back = function ()
{
	if (nuxsr.s.value=='')
	{
		nuxsr.t.focus();
		return;
	}
	
	var searchString = nuxsr.getSearchString();

	// set up for search backword and execute
	searchString="("+searchString+")(?![\\s\\S]*"+searchString+")";
	var re=new RegExp(searchString, (nuxsr.f.nuxsr_case.checked ? "" : "i"));
	var res = re.exec (nuxsr.t.value.substring(0,nuxsr.t.selectionStart));
	if (!res)
	{
		var res = re.exec (nuxsr.t.value)
	}
	
	// set up selection
	if (res)
	{
		sel_t.setSelRange (nuxsr.t, res.index, res.index+res[1].length)
	}
	else
	{
		nuxsr.t.selectionStart=nuxsr.t.selectionEnd
	}
	
	// move to selection
	nuxsr.sync();
}
	
nuxsr.next = function (norev)
{
	if (nuxsr.s.value=='')
	{
		nuxsr.t.focus();
		return
	}
	
	var searchString = nuxsr.getSearchString();
	
	// set up for search forward and execute
	var re=new RegExp(searchString, (nuxsr.f.nuxsr_case.checked ? "g" : "gi"));
	re.lastIndex=nuxsr.t.selectionEnd;
	var res = re.exec (nuxsr.t.value)
	if (!res && !norev)
	{
		nuxsr.msg(nuxsr.lang['searching from the beginning'])
		re.lastIndex=0;
		var res = re.exec (nuxsr.t.value)
	}
	
	// set up selection
	if (res)
	{
		sel_t.setSelRange (nuxsr.t, res.index, res.index+res[0].length)
	}
	else
	{
		nuxsr.t.selectionStart=nuxsr.t.selectionEnd
	}
	
	// move to selection
	nuxsr.sync();
}
	
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
	
	var re=new RegExp(searchString, (nuxsr.f.nuxsr_case.checked ? "g" : "gi"));

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
			start : nuxsr.t.selectionStart,
			strlen_post : str.length
		}
		
		// replace in selection
		sel_t.qsetSelStr(nuxsr.t, str, true);

		// set new selection range
		sel_t.setSelRange (nuxsr.t, sel_tmp.start, sel_tmp.start + sel_tmp.strlen_post);
	}
	
	//
	// focus
	nuxsr.t.focus();
}
	
nuxsr.replaceAll = function ()
{
	//
	// get string
	var str = sel_t.getSelStr(nuxsr.t, true);
	
	//
	// get attributes
	var searchString = nuxsr.getSearchString();
	var replaceString = nuxsr.getReplaceString();
	
	var re=new RegExp(searchString, (nuxsr.f.nuxsr_case.checked ? "g" : "gi"));

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
	if (matchesArr.length)
	{
		nuxsr.msg(nuxsr.lang['_num_ ocurrences of _str_ replaced with _str_'].replace(/\$1/, matchesArr.length).replace(/\$2/, nuxsr.s.value).replace(/\$3/, nuxsr.r.value));
	}

	return;
}

/* =====================================================
	Toggle case functions
   ===================================================== */
nuxsr.toggleCase = function ()
{
	var sels=nuxsr.t.selectionStart;
	var sele=nuxsr.t.selectionEnd;
	var selr=nuxsr.t.value.length-sele;
	var selt=nuxsr.t.value.substring(sels,sele);
	
	if (sele>sels)
	{
		if (selt==selt.toUpperCase())
			selt=selt.toLowerCase()
		else if (selt==selt.toLowerCase() && sele-sels>1)
			selt=selt.substring(0,1).toUpperCase()+selt.substring(1).toLowerCase()
		else
			selt=selt.toUpperCase()
		;
		
		nuxsr.t.value = nuxsr.t.value.substring(0,sels) + selt + nuxsr.t.value.substring(sele);
		nuxsr.t.selectionStart=sels;
		nuxsr.t.selectionEnd=sele>sels ? nuxsr.t.value.length-selr : sels;
	}
	nuxsr.sync();
}

/* =====================================================
	Move selection to view
   ===================================================== */
/*
nuxsr.sync_old = function ()
{
	var i;
	var allLines=0;
	var lineNo=0;
	var w=nuxsr.t.cols-5;
	
	var dummy=nuxsr.t.value.split("\n");
	for (i=0;i<dummy.length;i++){allLines+=Math.ceil(dummy[i].length/w)}
	
	var dummy=nuxsr.t.value.substring(0,nuxsr.t.selectionStart).split("\n");
	for (i=0;i<dummy.length;i++){lineNo+=Math.ceil(dummy[i].length/w)}
	
//	alert (w+" "+lineNo+"/"+allLines);

	nuxsr.t.scrollTop=nuxsr.t.scrollHeight*(lineNo-10)/allLines;
	nuxsr.t.focus();
}
*/
	
nuxsr.sync = function ()
{
	nuxsr.t.focus();
}
	
/* =====================================================
	Init search and replace
   ===================================================== */
nuxsr.init = function ()
{
	if(document.getElementById('wpTextbox1'))
	{
		//
		// set some values
		nuxsr.t=document.editform.wpTextbox1;
		//nuxsr.w=nuxsr.t.style.width;
		
		//
		// inserting buttons
		nuxedtoolkit.prepare();
		var group_el = nuxedtoolkit.addGroup();
		nuxedtoolkit.addBtn(
			group_el, 'nuxsr.showHide()',
			nuxsr.btns.sr.icons, nuxsr.btns.sr.attrs
		);
		nuxedtoolkit.addBtn(
			group_el, 'nuxsr.toggleCase()',
			nuxsr.btns.tc.icons, nuxsr.btns.tc.attrs
		);
		
		// fix access key
		nuxsr.i=document.getElementById('SearchIcon');
		nuxsr.i.accessKey="F";

		//
		// inserting search box
		var srbox = document.createElement('div');
		srbox.innerHTML = nuxsr.boxHTML;
		srbox.firstChild.style.display = 'none';
		
		//el=document.getElementById('editform');
		el=document.getElementById('wpTextbox1');
		el.parentNode.insertBefore(srbox,el);
		
		nuxsr.f=document.nuxsr_form;
		nuxsr.s=document.nuxsr_form.nuxsr_search;
		nuxsr.r=document.nuxsr_form.nuxsr_replace;

		//
		// inserting message box
		if (document.editform.messages == undefined)
		{
			el=document.createElement('textarea');
			el.cols=nuxsr.t.cols;
			el.style.cssText=nuxsr.t.style.cssText;
			el.rows=5;
			el.id='messages';
			el.style.display='none';
			el.style.width='auto';
			nuxsr.t.parentNode.insertBefore(el,nuxsr.t.nextSibling);
		}
	}
	
	// defaults
	//nuxsr.mem.remind();
	//nuxsr.f.nuxsr_regexp.checked = true;
}
	
/* =====================================================
	Box show/hide
   ===================================================== */
nuxsr.showHide = function ()
{
	if (nuxsr.f.style.display=='none')
	{
		//var width_pre = nuxsr.t.clientWidth;
		document.editform.messages.style.display='block';
		nuxsr.f.style.display='block';
		nuxsr.i.accessKey="none";
		//nuxsr.t.style.width='auto';
		nuxsr.s.focus();
		/*
		var width_post = nuxsr.t.clientWidth;
		if (width_post != width_pre)
		{
			nuxsr.t.cols = Math.floor(width_pre * nuxsr.t.cols / width_post);
		}
		*/
	}
	else
	{
		document.editform.messages.style.display='none';
		nuxsr.f.style.display='none';
		//nuxsr.t.style.width=nuxsr.w;
		nuxsr.i.accessKey="F";
	}
}

/* =====================================================
	Run init on load
   ===================================================== */
addOnloadHook(nuxsr.init);

/* =====================================================
	Memory module
   ===================================================== */
nuxsr.mem = new Object();
nuxsr.mem.s = new Array(
	//'(.*)(\\n\\n|$)'
	'((.|.\\n.)+)(\\n\\n|$)'
);
nuxsr.mem.r = new Array(
	'<p>$1</p>\\n\\n'
);
nuxsr.mem.index = -1;
nuxsr.mem.remind = function()
{
	nuxsr.mem.index++;
	nuxsr.mem.index%=nuxsr.mem.s.length;
	nuxsr.s.value = nuxsr.mem.s[nuxsr.mem.index];
	nuxsr.r.value = nuxsr.mem.r[nuxsr.mem.index];
}

//
// Serial changes
//
var sr_seria = {
	s : [
		'\\*[ ]?(.*)\\n',
		'(<li>(.|\\n)*</li>)',
		'([ \\n><(),.])"',
		'"([ \\n><(),.])',
		' > ',
		' < ',
		' - '
	]
	,
	r : [
		'<li>$1</li>\\n',
		'<ul>\\n$1\\n</ul>',
		'$1„',
		'”$1',
		' › ',
		' ‹ ',
		' – '
	]
};

var sr_seria_htmlspecialchars = {
	s : ['&',		'>',		'<'],
	r : ['&amp;',	'&gt;',		'&lt;']
};

function sr_mass_rep(obj)
{
	//
	// always as regExp
	//
	var prev_ser_RE = nuxsr.f.nuxsr_regexp.checked;
	nuxsr.f.nuxsr_regexp.checked = true;

	//
	// always from the beginning
	//
	/*
	// nuxsr.t.selectionStart = nuxsr.t.selectionEnd = 0;
	if (nuxsr.t.selectionStart == nuxsr.t.selectionEnd)
	{
		nuxsr.t.selectionStart = nuxsr.t.selectionEnd = 0;
	}
	*/
	var user_sel_start = nuxsr.t.selectionStart;
	var user_sel_end = nuxsr.t.selectionEnd;
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
		if (user_sel_start!=user_sel_end)
		{
			field_len_diff = nuxsr.t.value.length - field_len; // change after replacing stuff
			user_sel_end += field_len_diff;
			field_len = nuxsr.t.value.length;
		}

		nuxsr.t.selectionStart = user_sel_start;
		nuxsr.t.selectionEnd = user_sel_end;
	}

	//
	// previous settings
	//
	nuxsr.f.nuxsr_regexp.checked = prev_ser_RE;
}

//
// Messages
//
nuxsr.msg = function (str)
{
	document.editform.messages.value = str+'\n'+document.editform.messages.value;
}
