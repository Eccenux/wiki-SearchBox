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
	+ memory
	
	version:    1.2.0
	copyright:  (C) 2006 Zocky (en:User:Zocky), (C) 2006-2009 Maciej Jaros (pl:User:Nux, en:User:EcceNux)
	licence:    GNU General Public License v2,
                http://opensource.org/licenses/gpl-license.php
\* ======================================================================== */

//
// Moduł(y) zewnętrzne
//
if ((typeof sel_t)!='object' || ((typeof sel_t)=='object' && (typeof sel_t.version)=='string' && sel_t.version.indexOf('1.0')==0))
{
	document.write('<'
	+'script type="text/javascript" src="'
	+'http://pl.wikipedia.org/w/index.php?title=Wikipedysta:Nux/sel_t.js'
	+'&action=raw&ctype=text/javascript&dontcountme=s&ver110'
	+'"><'
	+'/script>');
}

//
// Zmienne globalne
//
var sr$t;	// sr$t=document.editform.wpTextbox1;
var sr$f;	// sr$f=document.srForm;
var sr$s;	// sr$s=document.srForm.srSearch;
var sr$r;	// sr$r=document.srForm.srReplace;
var sr$w;	// sr$w=sr$t.style.width;
var sr$i;	// sr$i=document.getElementById('SearchIcon');

var sr$lang = {
//	'_num_ ocurrences of _str_ replaced' : '$1 ocurrences of $2 replaced.'
//	'_num_ ocurrences of _str_ replaced' : 'Zmieniono $1 wystąpień #$2#.'
	'_num_ ocurrences of _str_ replaced with _str_' : 'Zmieniono $1 wystąpień [$2] na [$3].',
	'searching from the beginning' : 'wyszukiwanie od początku'
};

/*
 Translate also:
 var srBoxCode = ...
*/

function srBack()
{
	if (sr$s.value=='')
	{
		sr$t.focus();
		return;
	}
	
	var searchString = sr$s.value;
	if (!sr$f.srRegexp.checked)
		searchString = searchString.replace(/([\[\]\{\}\|\.\*\?\(\)\$\^\\])/g,'\\$1')
	;
	
	searchString="("+searchString+")(?![\\s\\S]*"+searchString+")";
	if (sr$f.srCase.checked)
		var re=new RegExp(searchString)
	else
		var re=new RegExp(searchString,"i")
	;
	
	var res = re.exec (sr$t.value.substring(0,sr$t.selectionStart));
	if (!res)
		var res = re.exec (sr$t.value)
	;
	
	if (res)
	{
		sr$t.selectionStart=res.index;
		sr$t.selectionEnd=res.index+res[1].length;
	}
	else
		sr$t.selectionStart=sr$t.selectionEnd
	;
	
	srSync();
}
	
function srNext(norev)
{
	if (sr$s.value=='')
	{
		sr$t.focus();
		return
	}
	
	var searchString = sr$s.value;
	if (!sr$f.srRegexp.checked)
		searchString=searchString.replace(/([\[\]\{\}\|\.\*\?\(\)\$\^\\])/g,'\\$1')
	;
	
	if (sr$f.srCase.checked)
		var re=new RegExp(searchString,"g")
	else
		var re=new RegExp(searchString,"gi")
	;
	
	re.lastIndex=sr$t.selectionEnd;
	var res = re.exec (sr$t.value)
	if (!res && !norev)
	{
		sr_msg(sr$lang['searching from the beginning'])
		re.lastIndex=0;
		var res = re.exec (sr$t.value)
	}
	
	if (res)
	{
		sr$t.selectionEnd=res.index+res[0].length;
		sr$t.selectionStart=res.index;
	}
	else
		sr$t.selectionStart=sr$t.selectionEnd
	;
	
	srSync();
}
	
function srReplace()
{
	
	var sels=sr$t.selectionStart;
	var sele=sr$t.selectionEnd;
	var selr=sr$t.value.length-sele;
	
	if (sr$s.value=='' || sels==sele)
	{
		sr$t.focus();
		return;
	}
	
	var searchString = sr$s.value;
	var replaceString = sr$r.value;
	if (!sr$f.srRegexp.checked)
	{
		searchString=searchString.replace(/([\[\]\{\}\|\.\*\?\(\)\$\^\\])/g,'\\$1');
		replaceString=replaceString.replace(/([\$\\])/g,'\\$1');
	}
	
	if (sr$f.srCase.checked)
		var re=new RegExp(searchString,"g")
	else
		var re=new RegExp(searchString,"gi")
	;
	
	re.lastIndex=sels;
	var res = re.exec (sr$t.value);
	var $$=0;
	if (res && res.index==sels && res[0].length==sele-sels)
	{
		if (sr$f.srRegexp.checked)
		{
			replaceString=replaceString.replace(/\\\\/g,'&backslash;').replace(/\\\$/g,'&dollar;');
			var replaceBits=(" "+replaceString).split(/(?=\$\d)/);
			replaceString=replaceBits[0].substring(1);
			for (var i=1; i<replaceBits.length; i++)
			{
				$$=replaceBits[i][1]-'0';
				if ($$<res.length)
					replaceString += res[$$] + replaceBits[i].substring(2)
				else
					replaceString += replaceBits[i]
				;
			}
			replaceString=replaceString.replace(/\\n/g,"\n").replace(/&backslash;/g,"\\").replace(/&dollar;/g,"\$")
		}
		sr$t.value= sr$t.value.substring(0,sels) + replaceString + sr$t.value.substring(sele);
	}
	
	sr$t.selectionStart=sels;
	sr$t.selectionEnd=sr$t.value.length-selr;
	srSync();
}
	
function srReplaceall()
{
	//
	// get string
	var str = sel_t.getSelStr(sr$t, true);
	
	//
	// get attributes
	var searchString = sr$s.value;
	var replaceString = sr$r.value;
	if (!sr$f.srRegexp.checked)
	{
		searchString=searchString.replace(/([\[\]\{\}\|\.\*\?\(\)\$\^\\])/g,'\\$1');
		replaceString=replaceString.replace(/([\$\\])/g,'\\$1');
	}
	
	var re=new RegExp(searchString, (sr$f.srCase.checked ? "g" : "gi"));
	
	//
	// run
	str = str.replace(re, replaceString);
	
	//
	// output
	sel_t.qsetSelStr(sr$t, str, true);

	return;
}

function srToggleCase()
{
	var sels=sr$t.selectionStart;
	var sele=sr$t.selectionEnd;
	var selr=sr$t.value.length-sele;
	var selt=sr$t.value.substring(sels,sele);
	
	if (sele>sels)
	{
		if (selt==selt.toUpperCase())
			selt=selt.toLowerCase()
		else if (selt==selt.toLowerCase() && sele-sels>1)
			selt=selt.substring(0,1).toUpperCase()+selt.substring(1).toLowerCase()
		else
			selt=selt.toUpperCase()
		;
		
		sr$t.value = sr$t.value.substring(0,sels) + selt + sr$t.value.substring(sele);
		sr$t.selectionStart=sels;
		sr$t.selectionEnd=sele>sels ? sr$t.value.length-selr : sels;
	}
	srSync();
}
	
	
function srSync()
{
	var i;
	var allLines=0;
	var lineNo=0;
	var w=sr$t.cols-5;
	
	var dummy=sr$t.value.split("\n");
	for (i=0;i<dummy.length;i++){allLines+=Math.ceil(dummy[i].length/w)}
	
	var dummy=sr$t.value.substring(0,sr$t.selectionStart).split("\n");
	for (i=0;i<dummy.length;i++){lineNo+=Math.ceil(dummy[i].length/w)}
	
//	alert (w+" "+lineNo+"/"+allLines);

	sr$t.scrollTop=sr$t.scrollHeight*(lineNo-10)/allLines;
	sr$t.focus();
}
	
	
function srInit()
{
	if(document.getElementById('wpTextbox1'))
	{
		var srBoxCode =
			'<form name="srForm"><table id="srBox" cellpadding="0" cellspacing="2">'
			+'<tr>'
				+'<td valign="bottom">'
					+'<span class="label">znajdź:</span><br />'
					+'<input size="17" type="text" name="srSearch" id="srSearch" accesskey="F" tabindex="8" onkeypress="event.which == 13 && srNext()"; value="" />'
				+'</td>'
				+'<td valign="bottom">'
					+'<span class="label">zamień na:</span><br />'
					+'<input size="17" type="text" name="srReplace" id="srReplace" accesskey="G" tabindex="9" onkeypress="event.which == 13 && srNext()"; value="" />'
				+'</td>'
				+'<td valign="top">'
					+'<label><input type="checkbox" name="srCase" onclick="sr$t.focus()" tabindex="10" />uwzględnij wielkość liter</label>'
					+'<label><input type="checkbox" name="srRegexp" onclick="sr$t.focus()" tabindex="11" />użyj RegEx</label>'
					+'<br />'
					+'<a href="javascript:srBack()" onmouseover="sr$t.focus()" title="szukaj wstecz [alt-2]" accesskey="2">&lt;</a>&nbsp;'
					+'<a href="javascript:srNext()" onmouseover="sr$t.focus()" title="szukaj dalej [alt-3]" accesskey="3">szukaj&nbsp;&nbsp;&gt;</a>&emsp;'
					+'<a href="javascript:srReplace();srBack()" onmouseover="sr$t.focus()" title="zamień znalezione i szukaj poprzedniego [alt-4]" accesskey="4">&lt;</a>&nbsp;'
					+'<a href="javascript:srReplace()" onmouseover="sr$t.focus()" title="zamień znalezione">zamień</a>&nbsp;'
					+'<a href="javascript:srReplace();srNext()" onmouseover="sr$t.focus()" title="zamień znalezione i szukaj następnego [alt-5]" accesskey="5">&gt;</a>&emsp;'
					+'<a href="javascript:srReplaceall()" onmouseover="sr$t.focus()" title="zamień wszystkie wystąpienia, które zostaną znalezione [alt-7]" accesskey="7">zamień&nbsp;wszystkie</a>&emsp;'
				+'</td>'
			+'</tr>'
			+'<tr>'
				+'<td valign="top" colspan="3">'
					+'<a href="javascript:sr_mem.remind()" style="background:inherit">MR</a> <a href="javascript:sr_mass_rep(sr_seria)">Wiki to HTML</a> <a href="javascript:sr_mass_rep(sr_seria_htmlspecialchars)">HTML Special Chars</a><br />'
				+'</td>'
			+'</tr>'
			+'</table></form>'
		;
	
		document.getElementById('searchInput').accessKey='none';
		
		sr$t=document.editform.wpTextbox1;
		sr$w=sr$t.style.width;
		
		//
		// inserting buttons
		var btns=document.createElement('span');
		btns.innerHTML=
			'<a id="SearchIcon" href="javascript:srShowHide()">'
				+'<img style="cursor: pointer;" title="Wyszukiwanie i zamiana" alt="Wyszukiwanie i zamiana" src="http://upload.wikimedia.org/wikipedia/en/1/12/Button_find.png" border="0" height="22" width="23">'
			+'</a>'
			+'<a href="javascript:srToggleCase()">'
				+'<img style="cursor: pointer;" title="Zmiana wielkości liter" alt="Zmiana wielkości liter" src="http://upload.wikimedia.org/wikipedia/en/1/12/Button_case.png" border="0" height="22" width="23">'
			+'</a>'
		;
		
		var el=document.getElementById('toolbar');
		if (el)
		{
			el.appendChild(btns)
		}
		else
		{
			el=document.getElementById('editform');
			el.parentNode.insertBefore(btns,el);
		}
		
		sr$i=document.getElementById('SearchIcon');
		sr$i.accessKey="F";

		//
		// inserting search box
		var srbox=document.createElement('div');
		srbox.innerHTML=srBoxCode;
		srbox.firstChild.style.display='none';		
		
		el=document.getElementById('editform');
		el.parentNode.insertBefore(srbox,el);
		
		sr$f=document.srForm;
		sr$s=document.srForm.srSearch;
		sr$r=document.srForm.srReplace;

		//
		// inserting message box
		if (document.editform.messages == undefined)
		{
			el=document.createElement('textarea');
			el.cols=sr$t.cols;
			el.style.cssText=sr$t.style.cssText;
			el.rows=5;
			el.id='messages';
			el.style.display='none';
			el.style.width='auto';
			sr$t.parentNode.insertBefore(el,sr$t.nextSibling);
		}
	}
	
	// defaults
	//sr_mem.remind();
	//sr$f.srRegexp.checked = true;
}
	
function srShowHide()
{
	if (sr$f.style.display=='none')
	{
		document.editform.messages.style.display='block';
		sr$f.style.display='block';
		sr$i.accessKey="none";
		sr$t.style.width='auto';
		sr$s.focus();
	}
	else
	{
		document.editform.messages.style.display='none';
		sr$f.style.display='none';
		sr$t.style.width=sr$w;
		sr$i.accessKey="F";
	}
}

addOnloadHook(srInit);

//</pre>

 document.write('<link rel="stylesheet" type="text/css" href=" \
 http://pl.wikipedia.org/w/index.php?title=Wikipedysta:Nux/SearchBox.css \
 &action=raw&ctype=text/css&dontcountme=s">');

//
// Memory
// 
var sr_mem = new Object();
sr_mem.s = new Array(
	//'(.*)(\\n\\n|$)'
	'((.|.\\n.)+)(\\n\\n|$)'
);
sr_mem.r = new Array(
	'<p>$1</p>\\n\\n'
);
sr_mem.index = -1;
sr_mem.remind = function()
{
	sr_mem.index++;
	sr_mem.index%=sr_mem.s.length;
	sr$s.value = sr_mem.s[sr_mem.index];
	sr$r.value = sr_mem.r[sr_mem.index];
}



//
// Zamiana seryjna
//
var sr_seria = new Object();
sr_seria.s = new Array(
	'\\*[ ]?(.*)\\n',
	'(<li>(.|\\n)*</li>)',
	'([ \\n><(),.])"',
	'"([ \\n><(),.])',
	' > ',
	' < ',
	' - '
);
sr_seria.r = new Array(
	'<li>$1</li>\\n',
	'<ul>\\n$1\\n</ul>',
	'$1„',
	'”$1',
	' → ',
	' ← ',
	' – '
);
var sr_seria_htmlspecialchars = new Object();
sr_seria_htmlspecialchars.s = new Array(
	'&',
	'>',
	'<'
);
sr_seria_htmlspecialchars.r = new Array(
	'&amp;',
	'&gt;',
	'&lt;'
);
function sr_mass_rep(obj)
{
	//
	// always as regExp
	//
	var prev_ser_RE = sr$f.srRegexp.checked;
	sr$f.srRegexp.checked = true;

	//
	// always from the beginning
	//
	/*
	// sr$t.selectionStart = sr$t.selectionEnd = 0;
	if (sr$t.selectionStart == sr$t.selectionEnd)
	{
		sr$t.selectionStart = sr$t.selectionEnd = 0;
	}
	*/
	var user_sel_start = sr$t.selectionStart;
	var user_sel_end = sr$t.selectionEnd;
	var field_len = sr$t.value.length;
	var field_len_diff = 0;
	
	//
	// replace
	//
	for (var i=0; i<obj.s.length; i++)
	{
		sr$s.value = obj.s[i];
		sr$r.value = obj.r[i];
		srReplaceall();
		
		// recalculate end of the user's selection
		if (user_sel_start!=user_sel_end)
		{
			field_len_diff = sr$t.value.length - field_len; // change after replacing stuff
			user_sel_end += field_len_diff;
			field_len = sr$t.value.length;
		}

		sr$t.selectionStart = user_sel_start;
		sr$t.selectionEnd = user_sel_end;
	}

	//
	// previous settings
	//
	sr$f.srRegexp.checked = prev_ser_RE;
}

//
// Messages
//
function sr_msg(str)
{
	document.editform.messages.value = str+'\n'+document.editform.messages.value;
}
