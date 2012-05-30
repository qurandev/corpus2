﻿//var QuranNavigator = (function() {

var CORPUS = {
	LinkWordMorphology: "http://corpus.quran.com/wordmorphology.jsp?location=($1)",
	LinkQuranDictionary: "http://corpus.quran.com/qurandictionary.jsp?q=$1",
	LinkLemmaSearch:	 "http://corpus.quran.com/search.jsp?q=lem:$1",

	TemplateRefLink:	"$3<A HREF=$1 TARGET=_>$2</A><IMG SRC=images/external_link.gif></IMG>",
	TemplateRootLink:	"$3<A HREF=$1 TARGET=_>$2</A>",
	TemplateRootDecoratedLink:	"<SPAN CLASS=r1 style=color:red>$1</SPAN>&zwnj;<SPAN CLASS=r2 style=color:green>$2</SPAN>&zwnj;<SPAN CLASS=r3 style=color:blue>$3</SPAN>",
	TemplateLemmaLink:	"$3<A HREF='$1' TARGET=_>$2</A>",
	
	UIgetRefLink:		function(ref, linkname, linkprefix){
		var link = CORPUS.LinkWordMorphology.replace(/\$1/, ref);
		return CORPUS.TemplateRefLink.replace(/\$1/, link).replace(/\$2/, linkname?linkname:ref).replace(/\$3/, linkprefix?linkprefix:'');
	},
	
	UIgetArabicAlmanacLink:	function(root){
		var ejlink = '&nbsp;<A HREF=http://ejtaal.net/m/aa/#q=' + CORPUS.mapBuckToEjtaal(root) + ' TARGET=_ title=Arabic_Almanac><span dir=ltr style=font-size:0.81em;>(AA)</span></A>';
		return ejlink;
	},
	
	mapBuckToEjtaal:	function(root){
		root = root.replace(/v/g, 'th').replace(/x/g, 'kh').replace(/\*/g, 'dh').replace(/\$/g, 'sh') ; //.replace(/g/g, 'gh'); //no need ghain. g ok.
		return root;
	},
	
	UIgetRootLink:		function(root, linkname, linkprefix){
		var link = CORPUS.LinkQuranDictionary.replace(/\$1/, root);
		return CORPUS.TemplateRootLink.replace(/\$1/, link).replace(/\$2/, linkname?linkname:root).replace(/\$3/, linkprefix?linkprefix:'Root: ') + 
			( CORPUS.UIgetRootCount(root) ? '&nbsp;<span dir=ltr style=font-size:0.87em;>(' + CORPUS.UIgetRootCount(root) + ' times)</span>' : '' ) + 
			CORPUS.UIgetArabicAlmanacLink(root);
	},

	UIgetRootDecoratedLink:		function(root, linkname, linkprefix){
		var temp='', rootLetters = (linkname ? linkname.split('') : root.split('') );
		temp = CORPUS.TemplateRootDecoratedLink.replace(/\$1/, rootLetters[0]).replace(/\$2/, rootLetters[1]).replace(/\$3/, rootLetters[2]);
		return CORPUS.UIgetRootLink(root, temp, linkprefix);
	},

	UIgetLemmaLink:		function(lemma, linkname, linkprefix){
		var link = CORPUS.LinkLemmaSearch.replace(/\$1/, escape(lemma));
		return CORPUS.TemplateLemmaLink.replace(/\$1/, link).replace(/\$2/, linkname?linkname:escape(lemma)).replace(/\$3/, linkprefix?linkprefix:'Lemma: ') + (CORPUS.UIgetLemmaCount(lemma) ? '&nbsp;<span dir=ltr style=font-size:0.92em;>(' + CORPUS.UIgetLemmaCount(lemma) + ' times)</span>' : '');
	},
	
	
	UIgetLemmaCountTillRef: function(lemma, root, gq_verse, ref){  if(gq.loadedPercent != 100) return '';
		var tempstr = '', temparr, pattern = 'LEM\\:', count = 0, countTotal = -1, message = '', regexp, arr, lineno;
		if(lemma){
			try{//get verseNo from ref. ref '4:5:12'
				lineno = Quran.verseNo.ayah( parseInt(ref.split(':')[0]), parseInt(ref.split(':')[1]) );
			}catch(e){} 
			if(!lineno){ console.log('invalid ref ' + ref + ' using gq_verse ' + gq_verse); lineno = gq_verse;
			}
			temparr = gq.strings.slice(0, lineno);
			
			if(temparr) tempstr = temparr.join('\n');
			regexp = RegExp( pattern + escapeForRegex(lemma), "g");
			arr = tempstr.match( regexp ); if(arr) count = arr.length;
			tempstr = ''; tempstr = null;
			countTotal = CORPUS.UIgetLemmaCount(lemma);
			message = count>0 ? CORPUS.UIprettifyCount(1+count, countTotal) +' occurence' : '<b>First</b> occurrence';	
			if(countTotal)
				message += ' of <b>' + countTotal + '</b> total. ' + CORPUS.UIprettifyCount(countTotal - count, countTotal) + ' from ending.';
			if(message) message = '<li>' + message + '</li>';
		}
		return message;
	},
	
	UIprettifyCount: function(number, countTotal){ var suffix = '';
		if(countTotal){ 
			if(number == countTotal) return '<b>last</b>';
			else if(number == 1) return '<b>first</b>';
		}
		suffix = (number%10 == 1 ? 'st' : (number%10 == 2 ? 'nd' : (number%10 ==3 ? 'rd' : 'th') ) );
		return '<b>'+number + '</b><span style=vertical-align:super;font-size:xx-small;>'+suffix + '</span>';
	},

	UIgetNearSynonyms: function(lemma){
		var nearsynonyms = '', synonymFound = false, antonyms='', antonymFound = false, more = '', more2 = '';
		if(NEAR_SYNONYMS && NEAR_SYNONYMS_METADATA){
			$.each(NEAR_SYNONYMS, function(lineno, line){
				if( /*regexp.test( line ) CHECK FOR EXACT WORD only using regex.. */ 
					(' ' + line + ' ').indexOf(' ' + lemma +' ') != -1){
					synonymFound = true; nearsynonyms = '';
					nearsynonyms += EnToAr(line);
					if( NEAR_SYNONYMS_METADATA[lineno]){
						nearsynonyms =  NEAR_SYNONYMS_METADATA[lineno].topic + '&nbsp;' + nearsynonyms + '&nbsp;' +
										CORPUS.UIgetNearSynonymsPageLink( lemma, NEAR_SYNONYMS_METADATA[lineno].page );
						more = (NEAR_SYNONYMS_METADATA[lineno].info ? ' (<A HREF=../widgets/datastore.html?synonyms='+lineno +' TARGET=_ >more</A>) ' : ''); 
					}else nearsynonyms += '<BR/>Refer book for details. (User contributions welcome!)<BR/>' + CORPUS.UIgetNearSynonymsPageLink( 1 ) + '&nbsp; (Pls type summary & submit via feedback.)'; 
				}
			});
			if(ANTONYMS){
				$.each(ANTONYMS, function(lineno, line){
					if((' ' + line + ' ').indexOf(' ' + lemma +' ') != -1){
						antonymFound = true; antonyms = '';
						more2 = ' (<A HREF=../widgets/datastore.html?antonyms='+lineno +' TARGET=_ >more</A>) '; 
						antonyms += EnToAr(line) + '&nbsp;' + CORPUS.UIgetNearSynonymsPageLink( lemma, 978 );
					}
				});
			}

		}
		return (synonymFound ? '<li><font color=green><b>Synonyms</b></font>' + more + ': ' + nearsynonyms + '</li>' : '') +
			   (antonymFound ? '<li><font color=maroon><b>Antonyms</b></font>' + more2 + ': ' + antonyms + '</li>' : '')
	},
	
	UIgetNearSynonymsPageLink: function(lemma, pageno){
		var TEMPLATE = '<A HREF="javascript:CORPUS.UIsynonymClicked(\'$LEM\', $PAGENO, $1);" TARGET=_>$2</A>';
		var mapPageno = pageno ? ( 18 + parseInt(pageno) ) : 1;
		var linktext = pageno ? 'Page# ' + parseInt(pageno) : 'Book';
		return TEMPLATE.replace(/\$1/g, mapPageno ).replace(/\$2/g, linktext ).replace(/\$LEM/g, lemma).replace(/\$PAGENO/g, pageno);
	},

	UIsynonymClicked: function(lemma, pageno, mappageno){
		var mappedpageno, offset, temp, width, height, BOOKLINK = "<A HREF='$URL' TARGET=_>Link to PDF of this part</A><BR><BR><A HREF='http://archive.org/details/MutaraadifaatUlQuran-UrduToEnglishProject-10PageSplitsOfficial' TARGET=_>Link to all PDF parts.</A>", URL = "http://ia600405.us.archive.org/16/items/MutaraadifaatUlQuran-UrduToEnglishProject-10PageSplitsOfficial/Mutaradifaat-ul-Quran-COMPLETE.$PAGE.pdf#page=$OFFSET";
		mappedpageno = 1 + parseInt( (pageno + 18) / 10 );
		offset = (pageno + 18) - 10*(mappedpageno-1);
		temp = 100000 + mappedpageno;
		temp = (temp + '').substring(1);
		URL = URL.replace(/\$PAGE/g, temp).replace(/\$OFFSET/g, offset); console.log(pageno +' '+ mappedpageno +' ' + offset + ' ' + URL);
		var embedPDF = function(){
			var myPDF = new PDFObject({ 
			  url: URL
			}).embed('embedded_doc');
			$('#book').hide();
			$.blockUI({ message: $('#book') }); 
			$('.blockOverlay').attr('title','Click to unblock').click( function(){ $.unblockUI(); $('#book').hide(); } );
			$("#bookclose, #bookclose2").click(function() { $.unblockUI(); $('#book').hide(); });
		}
		if( !$('#book') || $('#book').length <= 0 ){
			$('body').append('<div id=book style="display: none;border: 4px solid #69F;height: 85%; width: 40%; position:fixed; bottom:0; left:0;"><div style="background-color: #32BD2F; height: 12px;"><div style="float: right; width: 42px; height: 12px; padding: 2px;"><img id="bookclose" alt="Close" src="images/close.gif" /></div></div><div id="embedded_doc" class=leftcolumn><img src="images/loading.gif" /></div></div></div>');
			$.getScript( 'javascript/pdfobject.js', function(){
				embedPDF();
			});
		}
		else{ $('#book').show(); embedPDF(); //if page# has changed???
		}
		//$('#results').html( BOOKLINK.replace(/\$URL/, URL ) );
		return false;
	},
	
	UIgetSarfSagheer: function(root, form){
		var sarfSagheer = '', sarfFound = false, verbConj = 'http://acon.baykal.be/index.php'; //?r3=%D9%82&r2=%D9%84&r1=%D8%AE&type=III&pvowel=a&ivowel=a';
		try{
			var r1, r2, r3, type, arr= $.trim(root).split('');
			r1 = encodeURIComponent( EnToAr( arr[0] ) ); r2 = encodeURIComponent( EnToAr( arr[1] ) ); r3 = encodeURIComponent( EnToAr( arr[2] ) ); 
			if(form) type = form.substring(1, form.length - 1); else type = 'I';
			verbConj = verbConj + '?r3=' + r3 +'&r2=' + r2 + '&r1=' + r1 + '&type=' + type + ''; //&pvowel=a&ivowel=a
		}catch(e){}
		if(SARF_SAGHEER){
			var key = root;
			if(form) (form!='(I)') ? key = root + ',d' + CORPUS.FORM_MAPPING[ form ] : key = root + ',b'; //to avoid multiple false matches
			$.each(SARF_SAGHEER, function(a, line){
				if(line.indexOf(key) != -1){ console.log(key +'\t\t'+ line);
					sarfFound = true; sarfSagheer = '';
					var arr = line.split(',');
					for(var j=0; j<6; ++j) sarfSagheer += arr[arr.length - 9 +j ] + '&nbsp;&nbsp;';
					//break;
				}
			});
			sarfSagheer += '&nbsp;&nbsp;<A HREF=http://www.scribd.com/embeds/89383169/content?start_page=1&view_mode=slideshow&access_key=key-26c3dogrsa7rabyiehvm&secret_password=1u076toxw5hnczujpoly TARGET=_>(ref)</A>&nbsp;&nbsp;<span style="font-size:0.61em;"><A HREF=' + verbConj + ' target=_>(conj.)</a></span>';
		}
		return sarfFound ? '<li><span style=color:purple;font-weight:bold;>Sarf:</span> ' + sarfSagheer + '</li>': '';
	},
	
	FORM_MAPPING: { "(I)": "1", "(II)": "2", "(III)": "3", "(IV)": "4", "(V)": "5",
					"(VI)": "6", "(VII)": "7", "(VIII)": "8", "(IX)": "9", "(X)": "10", "(XI)": "11", "(XII)": "12" },
	
	UIgetLemmaCount:	function(lemma){ if(gq.loadedPercent != 100) return;
		if(CORPUS._RAWDATAALL == ''){
			CORPUS._RAWDATAALL = gq.strings.join('\n'); 
		}
		var pattern = 'LEM\\:', count = '';
		var regexp = RegExp( pattern + escapeForRegex(lemma), "g");
		var arr = CORPUS._RAWDATAALL.match( regexp ); if(arr) count = arr.length;
		return count;
	},
	
	UIgetRootCount:		function(root, linkname, linkprefix){  if(gq.loadedPercent != 100) return;
		if(CORPUS._RAWDATAALL == ''){
			CORPUS._RAWDATAALL = gq.strings.join('\n'); 
		}
		var pattern = 'ROOT\\:', count='';
		var regexp = RegExp( pattern + escapeForRegex(root), "g");
		var arr = CORPUS._RAWDATAALL.match( regexp ); if(arr) count = arr.length;
		return count;
	},
	
	
	UIgetPOSLink:		function(pos, linkname, linkprefix){
		return (linkprefix?linkprefix : '') + pos;
	},
	
	UIgetFeaturesLink:	function(features, linkname, linkprefix){
		if(!features) return;
		var html='', items = features.split('|'), item, lookup;
		lookup = CORPUS.FEATURES_MAPPING[ features ]; //it might be readymade
		if(lookup) html += lookup  + '&nbsp;&nbsp;';
		else for(var i=0; i<items.length; ++i){
			item = items[i];
			lookup = CORPUS.FEATURES_MAPPING[ item ];
			if(lookup) html += lookup + '&nbsp;&nbsp;';
			else html += UI_grammarEscapeUIFriendly( item ) + '&nbsp;&nbsp;'; //since it can be SP: w foreign chars.
		}
		html += '<!--&nbsp;('+ UI_grammarEscapeUIFriendly(features) +')-->'; //(linkprefix?linkprefix : 'Features: ') + 
		return html;
	},
	
	UIgetMiscLink:		function(misc, linkname, linkprefix){
		return '<span class=misc style=display:none;font-size:8px;color:#C0C0C0;#F0F0F0; >' + (linkprefix?linkprefix : 'Misc: ') + escapeMisc(misc) + '</span>';
	},
	
	UIgetWordGrammarDisplay: function(refAndData)
	{
		var corpus, str = '', root='', lemma = '', pos = '', features='', ref, Data;
		if(!refAndData || refAndData.indexOf('||')==-1) return;
		ref = refAndData.split('||')[0];
		Data = refAndData.split('||')[1];
		try{
			corpus = CORPUS.parse( Data ); //console.log(corpus);
		}catch(err){ console.log(err.message); console.log(err); debugger; }
		if(corpus){
			str = '<ul style="line-height:1.2em !important;">';
			if(corpus.pos) 			str +=	'<li>'+ '<span style=font-size:1.3em; class=POS-'+ corpus.pos + '>'+ corpus.pos +'</span> – '+
											//CORPUS.UIgetPOSLink(corpus.pos) + 
											(corpus.vn ? ' Verbal Noun ' : '' ) + 
											(corpus.activepassivepcpl ? ' '+ CORPUS.ACTIVEPASSIVEPCPL_MAPPING[corpus.activepassivepcpl] + ' ' : '') + 
											(corpus.passive ? ' '+(corpus.passive == 'PASS' ? 'Passive' : corpus.passive )+' ' : '') +
											(corpus.form != '(I)' ? (' Form '+corpus.form+' ') : '') + // form: ' + corpus.form +
											(corpus.tense ? ' ' + CORPUS.TENSE_MAPPING[ corpus.tense ] + ' ' : '') + 
											'<span style=font-size:1.3em; class=POS-'+ corpus.pos + '>'+ CORPUS.UIlookupPOS(corpus.pos) +'</span></li>';
			if(corpus.features) 	str += '<li>' + CORPUS.UIgetFeaturesLink(corpus.features) + '</li>';
			
			if(corpus.lemma || corpus.root){
				str += '<li>';
				if(corpus.lemma)		str += CORPUS.UIgetLemmaLink(corpus.lemma, EnToAr(corpus.lemma), 'Dict: ') + '&nbsp;';
				if(corpus.root)			str += CORPUS.UIgetRootDecoratedLink(corpus.root, EnToAr(corpus.root), 'Root: ') + '&nbsp;'; //If u dont want colored, use UIgetRootLink
				str += '</li>';
			}
			if(typeof(corpus.pos) != 'undefined' && corpus.pos == 'V' && corpus.root && corpus.form)
									str += CORPUS.UIgetSarfSagheer(corpus.root, corpus.form);
			if(typeof(corpus.lemma) != 'undefined' && corpus.lemma /*&& corpus.pos == 'N'*/)
									str += CORPUS.UIgetNearSynonyms( corpus.lemma );
			if(corpus.lemma)		str += CORPUS.UIgetLemmaCountTillRef(corpus.lemma, corpus.root, gq.verse(), ref );
			if(corpus.misc)			str += '<li>' + CORPUS.UIgetMiscLink(corpus.misc) + '</li>';
			if(corpus.features)
				if(CORPUS.FEATURES_MAPPING[ corpus.features ])
									str += '<li><IMG SRC=plugins/quran-grammar/Images/' + [ corpus.features ] + '.gif /></li> ';
			str += '</ul>';
		}
		var obj = {};
		obj.corpus = corpus;
		obj.html   = str;
		obj.pos    = corpus.pos;
		return obj;
	},

	UIgetAyahInfoDisplay: function(ref){
		var ret = '', GEM = '<IMG SRC=images/gem.gif style=float:none!important; />', LIT_DEV = '<IMG SRC=images/lit_dev.gif style=float:none!important; />';
		$.each( Object.keys( AYAHS_METADATA.LITERARY_DEVICES ), function(a, b){
			if(b.indexOf(' ' + ref + ' ') != -1) ret += '<li>- Literary Device: ' + LIT_DEV + '&nbsp;<A TARGET=_ HREF=' + AYAHS_METADATA.LITERARY_DEVICES[b].url +' >'+ AYAHS_METADATA.LITERARY_DEVICES[b].topic + '</A><BR></li>';
		});
		$.each( Object.keys( AYAHS_METADATA.MIRACLES ), function(a, b){
			if(b.indexOf(' ' + ref + ' ') != -1) ret += '<li>- Gem: ' + GEM + '&nbsp;<A TARGET=_ HREF=' + AYAHS_METADATA.MIRACLES[b].url +' >'+ AYAHS_METADATA.MIRACLES[b].topic + '</A><BR></li>';
		});
		return ret;
	},
	
	UIgetAyahInfoIndicator: function(ref){
		var ret = '', GEM = '<IMG SRC=images/gem.gif style=float:none!important; />', LIT_DEV = '<IMG SRC=images/lit_dev.gif style=float:none!important; />';
		$.each( Object.keys( AYAHS_METADATA.LITERARY_DEVICES ), function(a, b){
			if(b.indexOf(' ' + ref + ' ') != -1) ret += LIT_DEV;
		});
		$.each( Object.keys( AYAHS_METADATA.MIRACLES ), function(a, b){
			if(b.indexOf(' ' + ref + ' ') != -1) ret += GEM;		
		});
		return ret;
	},
	
	FEATURES_MAPPING: {'GEN': 'Genitive case.', 'ACC': 'Accusative case.', 'NOM': 'Nominative case.', 'INDEF': 'Indefinte.', 
						'3MS': '3rd person Masculine Singular.', '3MP': '3rd person Masculine Plural.', 
						'2MP': '2nd person Masculine Plural.', '2MS': '2nd person Masculine Singular.',
						'M': 'Masculine.', 'F': 'Feminine.', 'S': 'Singular.', 'P': 'Plural.',
						'SP:kaAn': 'belongs to a special group of words known as <BR/>kāna and her sisters (كان واخواتها). <BR/>', 
						'SP:<in~': 'belongs to a special group of words known as <BR/>inna and her sisters (ان واخواتها). <BR/>',
						'SP:kaAd': 'belongs to a special group of words known as <BR/>kāda and her sisters (كاد واخواتها). <BR/>', 
						'MP': 'Masculine Plural', '1P': '1st person Plural', 
						'2MS': '2nd person Masculine Singular', '3FS': '3rd person Feminine Singular', 'MS': 'Masculine singular', 
						'FP': 'Feminine plural', 'FS': 'Feminine Singular', '1S': '1st person Singular', 
						'MD': 'Masculine Dual', 'FD': 'Feminine Dual', '3D': '3rd person Dual', '3FD': '', 
						'MOOD:JUS': 'Jussive mood.', 'MOOD:SUBJ': 'Subjunctive mood.'},
	
	TENSE_MAPPING: {"IMPV": "Imperative", "IMPF": "Imperfect", "PERF": "Perfect"},
					//{"IMPV": "Imperative (commanding etc tense)", "IMPF": "Imperfect (present, future tense)", "PERF": "Perfect (past tense)"},
					
	ACTIVEPASSIVEPCPL_MAPPING: {"PASS|PCPL": "Passive participle", "ACT|PCPL": "Active participle"},
	
	POS_MAPPING: { "N": "NOUN", "V": "VERB", 'PN': 'Proper Name', 'ADJ': 'Adjective', 'REL': 'Relative pronoun', 
						'PRON': 'Pronoun', 'CONJ': 'Conjunction', 'NEG': 'Negative particle', 'P': 'Preposition',
						'INL': 'Quranic initials', 'DEM': 'Demonstrative pronoun', 'ACC': 'accusative particle',
						'RES': 'restriction particle', 'T': 'time adverb', 'PRO': 'prohibition particle', 'PREV': 'preventive particle',
						'INC': 'inceptive particle', 'AMD': 'amendment particle', 'SUB': 'subordinating conjunction', 'LOC': 'Location adverb', 'COND': 'conditional particle'
					},
		//REM: prefixed resumption particle
		//EQ: prefixed equalization particle
		//INTG: prefixed interrogative alif
		//EMPH: emphatic prefix lām
		//VOC: prefixed vocative particle ya
					
	UIlookupPOS: function(pos){
		if( CORPUS.POS_MAPPING[pos]) return CORPUS.POS_MAPPING[pos];
		else return pos;
	}
			
};









	//   -- SAMPLE CORPUS links to get idea -- 
	//LEMMA link:	http://corpus.quran.com/search.jsp?q=lem:liHoyat
	//ROOT  link:	http://corpus.quran.com/search.jsp?q=root:lHy
	//				http://corpus.quran.com/qurandictionary.jsp?q=jwz
	//Form link:	http://corpus.quran.com/search.jsp?q=(vii)
	//POS link:		http://corpus.quran.com/search.jsp?q=POS:N
	//STEM link:	http://corpus.quran.com/search.jsp?q=stem:fiY
	//Meaning:		http://corpus.quran.com/search.jsp?q=%22old%20woman%22  (u can quote the word for exact search)

	var CORPUS_SEARCH_TEMPLATES = [ 'http://corpus.quran.com/search.jsp?q=LEM:', 'http://corpus.quran.com/search.jsp?q=ROOT:', 'http://corpus.quran.com/search.jsp?q=', 'http://corpus.quran.com/search.jsp?q=POS:', 'http://corpus.quran.com/search.jsp?q=STEM:', 'http://corpus.quran.com/search.jsp?q=', 'http://corpus.quran.com/qurandictionary.jsp?q=' ];
	function linkifyCorpusFeature(typeindex, value){ if(typeindex<0 || typeindex >= CORPUS_SEARCH_TEMPLATES.length){debugger; return value; }//failed ASSERTION
		var template = CORPUS_SEARCH_TEMPLATES[typeindex];
		if(!template) return value;
		if(typeindex == 5) template += '"' + value + '"'; //This for meanings, to enclose in dbl quotes
		else template += value;
		var url = "<A HREF='"+ template + "' target=_blank >" + value + "</A>";
		if(typeindex == 1) url += "&nbsp;&nbsp;&nbsp;&nbsp;<A HREF='" + CORPUS_SEARCH_TEMPLATES[6] + value + "' target=_blank >" + "<small>2</small>" + "</A>";
		return url;		
	}
	
	CORPUS.isInitialized = false;
	CORPUS._regexStems = /.*?STEM[^\n]*/g;
	CORPUS._regexMatchRef = "\\($REF.*$"; //Ex: "\\(1:7:9.*$";
	CORPUS._regexParse =							   /(([^\|\n]*))?(?:\|((?:ACT|PASS)\|PCPL))?(?:\|(IMPF|IMPV|PERF))?(?:\|(PASS))?(?:\|(VN))?(?:\|(\([IVX]*\)))?(?:\|LEM:([^\|\n]*))?(?:\|ROOT:([^\|\n]*))?(?:\|(.*?))?$/;	
	CORPUS._regexParseFullLine = /(.*?)?(?:STEM)(?:\|POS:([^\|\n]*))?(?:\|((?:ACT|PASS)\|PCPL))?(?:\|(IMPF|IMPV|PERF))?(?:\|(PASS))?(?:\|(VN))?(?:\|(\([IVX]*\)))?(?:\|LEM:([^\|\n]*))?(?:\|ROOT:([^\|\n]*))?(?:\|(.*?))?$/;	
	CORPUS.LEMMA = 8; CORPUS.ROOT = 9; CORPUS.FORM = 7; CORPUS.PERSONGS = 10; CORPUS.MISC = 0; CORPUS.POS = 2;
	CORPUS.ACTIVEPASSIVEPCPL = 3; CORPUS.TENSE = 4; CORPUS.PASSIVE = 5; CORPUS.VN = 6;
	CORPUS._rawdata = CORPUS._rawdataArr = '';
	CORPUS._RAWDATAALL = '';


	CORPUS.parse = function(corpustext){ if(!CORPUS.isInitialized){ CORPUS.init(); } 
		var oParsed, corpus; 
		try{//			if(!parseInt(index) ){debugger; return;}
			oParsed = CORPUS.regexParse( corpustext );
			corpus = {}; corpus.lemma = corpus.root  = corpus.form  = corpus.features = corpus.misc = corpus.pos = '--';
			corpus.lemma = oParsed[ CORPUS.LEMMA ];
			corpus.root  = oParsed[ CORPUS.ROOT ];
			corpus.form  = oParsed[ CORPUS.FORM ]; if(!corpus.form) corpus.form = '(I)';
			corpus.features = oParsed[ CORPUS.PERSONGS ];
			corpus.misc  = oParsed[ CORPUS.MISC ];
			corpus.pos	 = $.trim( oParsed[ CORPUS.POS ] );
			
			corpus.tense = $.trim( oParsed[ CORPUS.TENSE ] );
			corpus.passive = $.trim( oParsed[ CORPUS.PASSIVE ] );
			corpus.activepassivepcpl = $.trim( oParsed[ CORPUS.ACTIVEPASSIVEPCPL ] );
			corpus.vn = $.trim( oParsed[ CORPUS.VN ] );
		}catch(err){ console.log(err.message); console.log(err); debugger; }
		return corpus;
	}
	
	CORPUS.parseFromRef = function(ref, index){ if(!CORPUS.isInitialized){ CORPUS.init(); } 
		var oParsed, corpus; 
		try{//			if(!parseInt(index) ){debugger; return;}
			oParsed = CORPUS.regexParseFullLine( CORPUS.lookupRef(ref, index) );
			corpus = {}; corpus.lemma = corpus.root  = corpus.form  = corpus.features = corpus.misc = corpus.pos = '--';
			corpus.lemma = oParsed[ CORPUS.LEMMA ];
			corpus.root  = oParsed[ CORPUS.ROOT ];
			corpus.form  = oParsed[ CORPUS.FORM ]; if(!corpus.form) corpus.form = '(I)';
			corpus.features = oParsed[ CORPUS.PERSONGS ];
			corpus.misc  = oParsed[ CORPUS.MISC ];
			corpus.pos	 = oParsed[ CORPUS.POS ];
		}catch(err){ console.log(err.message); console.log(err); debugger; }
		return corpus;
	}

	CORPUS.lookupRef = function(ref, index){ var str = '', pattern, regexp;
		pattern = CORPUS._regexMatchRef.replace(/\$REF/, ref);
		regexp = new RegExp(pattern, "m");
		str = regexp.exec( CORPUS._rawdataArr.join('\n') );
		if(!str){ debugger;
			if(index && parseInt(index) ) str = CORPUS._rawdataArr[ index ];
		}
		return str;
	}
	
	CORPUS.init = function(){ if(CORPUS.isInitialized) return;
		try{
			CORPUS._rawdata = document.getElementById('dataislandcorpus').innerHTML; 
			//.replace(/\|PCPL\|/g, '*PCPL|').replace(/\|INDEF\|/g, '*INDEF|').replace(/\|PASS\|/g, '*PASS|');
		}catch(err){ console.log(err.message); console.log(err); }
		if(!CORPUS._rawdata){ debugger; return; }
		CORPUS._rawdataArr = CORPUS._rawdata.match( CORPUS._regexStems ); 
		CORPUS.isInitialized = true;
	}

	CORPUS.regexParse = function(teststring){
		return CORPUS._regexParse.exec( teststring );
	}

	CORPUS.regexParseFullLine = function(teststring){
		return CORPUS._regexParseFullLine.exec( teststring );
	}

	



	
	
	
	
	
	
	
	
	
	
	
	
var BuckToBare = function(str){ if(!str) return;
	str = str.replace(/[{`><]/g, 'A').replace(/[\&]/g, 'w').replace(/[}]/g, 'y').replace( /[\FNK#aeiou~\^]/g, '');
	return str;
}


var EnToAr = function(word){
	if(!word) return null;
	initializeMapper();
	var ar = '', l, letter, found=false;
	try{
		var wordArr = word.split(''); //split into letters.	//lookup from english to arabic letter. and return it.
		for(l=0; l<wordArr.length; ++l){
			letter = wordArr[l]; found = false;
			for(n=1; n<_buckArr.length; ++n){
				if(letter == _buckArr[n]){
					ar += _charsArr[n]; found=true;
					break;
				}
			}
			if(!found)  ar += ''; //letter; //' ??'+letter+'?? ';
		}
	}catch(ex){
		debugger;
		ar = '-err: ' + ex + ex.message + ex.lineno;
	}
	return ar;
}

var ArToEn = function(word){
	if(!word) return null;
	initializeMapper();
	var ar = '', l, letter, found=false;
	try{
		var wordArr = word.split(''); //split into letters.	//lookup from english to arabic letter. and return it.
		for(l=0; l<wordArr.length; ++l){
			letter = wordArr[l]; found = false;
			for(n=1; n<_charsArr.length; ++n){
				if(letter == _charsArr[n]){
					ar += _buckArr[n]; found=true;
					break;
				}
			}
			if(!found){  ar += ''; 
						 if(_bMAPPER_DEBUG){ 
							if(typeof(UNKNOWNS) == NULL) UNKNOWNS={}; 
							else{
								if(!UNKNOWNS[letter]){ UNKNOWNS[letter] = 1; _log('No mapping found:\t' + letter + '');  }
								else UNKNOWNS[letter] = 1+UNKNOWNS[letter];
							}								
						}
			}
		}
	}catch(ex){
		debugger;
		ar = '-err: ' + ex + ex.message + ex.lineno;
	}
	return ar;
}

var _charsArr, _buckArr, bInitialized = false;
var initializeMapper = function(){
	if(bInitialized) return;
	var qBare = null, qBuck = null;		
	var stopletters = "ۚۖۛۗۙ";
	var chars='آ ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي';
	var buck = 'A A b t v j H x d * r z s $ S D T Z E g f q k l m n h w y';
	var buckArr, charsArr;
	var ext = new Array();
	var map = { };
	charsArr = chars.split(' ');
	buckArr  = buck.split(' ');
	//mISSING CHARACTERS:		// أ إ ئ ء ة ؤ
	charsArr.push( 'ى' ); buckArr.push( 'Y' );
	charsArr.push( 'أ' ); buckArr.push( '>' );
	charsArr.push( 'إ' ); buckArr.push( '<' );	//charsArr.push( ' ' ); buckArr.push( ' ' ); //charsArr.push( '' ); buckArr.push( '' );
	charsArr.push( 'ئ' ); buckArr.push( '}' );
	charsArr.push( 'ء' ); buckArr.push( 'X' ); //buckArr.push( '\'' );
	//charsArr.push( 'ة' ); buckArr.push( 'P' );
	charsArr.push( 'ؤ' ); buckArr.push( '&' );
	//missing characters for harakath.
	charsArr.push( '\u0652' ); buckArr.push( 'o' );
	charsArr.push( '\u064e' ); buckArr.push( 'a' );
	charsArr.push( '\u0650' ); buckArr.push( 'i' );
	charsArr.push( '\u064f' ); buckArr.push( 'u' );
	charsArr.push( '\u064b' ); buckArr.push( 'F' );
	charsArr.push( '\u064d' ); buckArr.push( 'K' );
	charsArr.push( '\u064c' ); buckArr.push( 'N' );
	charsArr.push( '\u0626' ); buckArr.push( '}' );
	charsArr.push( '\u0640' ); buckArr.push( '_' );
	charsArr.push( '\u0651' ); buckArr.push( '~' );
	charsArr.push( '\u0653' ); buckArr.push( '^' );
	charsArr.push( '\u0654' ); buckArr.push( '#' );
	charsArr.push( '\u0671' ); buckArr.push( '{' );
	charsArr.push( '\u0670' ); buckArr.push( '`' );
	charsArr.push( '\u06e5' ); buckArr.push( ',' );
	charsArr.push( '\u06e6' ); buckArr.push( '.' );
	charsArr.push( 'ة' ); buckArr.push( 'p' );
	charsArr.push( '\u06df' ); buckArr.push( '@' );
	charsArr.push( '\u06e2' ); buckArr.push( '[' );
	charsArr.push( '\u06ed' ); buckArr.push( ']' );
	charsArr.push( '\u0621' ); buckArr.push( '\'' );
	charsArr.push( '\u06DC' ); buckArr.push( ':' );
	charsArr.push( '\u06E0' ); buckArr.push( '\"' );
	charsArr.push( ' ' ); buckArr.push( ' ' );
	charsArr.push( ';' ); buckArr.push( ';' );
	charsArr.push( '\n' ); buckArr.push( '\n' );
	
	charsArr.push( 'ع' ); buckArr.push( '3' ); //ayn //support for arabi/chat letters
	charsArr.push( 'ء' ); buckArr.push( '2' ); //hamza
	charsArr.push( 'ح' ); buckArr.push( '7' ); //HAA
	charsArr.push( 'خ' ); buckArr.push( '5' ); //KHAA
	charsArr.push( 'ص' ); buckArr.push( '9' ); //Saad
	charsArr.push( 'ط' ); buckArr.push( '6' ); //Thaw

	charsArr.push( charsArr[2] ); buckArr.push( 'B' ); //Support for Capital letters
	charsArr.push( charsArr[4] ); buckArr.push( 'V' );
	charsArr.push( charsArr[5] ); buckArr.push( 'J' );
	charsArr.push( charsArr[10] ); buckArr.push( 'R' );
	charsArr.push( charsArr[19] ); buckArr.push( 'G' );
	charsArr.push( charsArr[21] ); buckArr.push( 'Q' );
	charsArr.push( charsArr[23] ); buckArr.push( 'L' );
	charsArr.push( charsArr[24] ); buckArr.push( 'M' );
	charsArr.push( charsArr[27] ); buckArr.push( 'W' );
	charsArr.push( 'ة' ); buckArr.push( 'P' );
	
	//For IndoPak script extra letters
	charsArr.push( 'ی' ); buckArr.push( 'y' );
	charsArr.push( 'ۃ' ); buckArr.push( 'p' );
	charsArr.push( 'ہ' ); buckArr.push( 'h' );
	charsArr.push( 'ی' ); buckArr.push( 'Y' );
	charsArr.push( 'ک' ); buckArr.push( 'k' );
	charsArr.push( 'ۤ ' ); buckArr.push( '?' );
	charsArr.push( 'ۤۚ ' ); buckArr.push( '?' );
	charsArr.push( 'ۡ ' ); buckArr.push( '?' );
	charsArr.push( 'ۚ ' ); buckArr.push( '?' );
	charsArr.push( 'ۤ ' ); buckArr.push( '?' );

	_charsArr = charsArr; _buckArr = buckArr;
	bInitialized = true;
}		
initializeMapper();





	var Escape = function(input){ if(!input) return; return input.replace(/\</g, '&lt;').replace(/\>/g, '&gt;'); }
	var Unescape = function(input){ if(!input) return; return input.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>'); }

	var escapeForRegex = function(regex){ //^l~
		if(!regex) return;
		return regex.replace(/\'/g, '\\\'').replace(/\^/g, '\\\^').replace(/\~/g, '\\\~').replace(/\[/g, '\\\[').replace(/\*/g, '\\\*').replace(/\$/g, '\\\$').replace(/\@/g, '\\\@').replace(/\+/g, '\\\+');
	}
	
	var escapeMisc = function(input){ var output='';
		if(!input) return; output = input.replace(/\</g, '&#171;').replace(/\>/g, '&gt;').replace(/\"/g, '&#9674;');
		return output;
	}

	
 
var SARF_SAGHEER = [ //'Verbs_VerbNo,Verbs_Words_Corpus_Root_English,Verbs_Type,Verbs_class,Verbs_Sura,Verbs_Verse,Meaning-English,Meaning-Urdu,Count,perfect,Imperfect,Imperative,Active-participle,Passive-participle,Verbal-noun,root,type,class',
'1,fEl,b1,فتح,2,24,to do,كرنا ,105,فَعَلَ, يَفْعَلُ, اِفْعَلْ , فَاعِل, مَفْعُول, فِعْل,ف ع ل ,1,فتح',
'2,ftH,b1,فتح,2,76,"to open, to give victory",کھولنا,29,فَتَحَ, يَفْتَحُ, اِفْتَحْ, فَاتِح, مَفْتُوح, فَتْح,ف ت ح ,1,فتح',
'3,bEv,b1,فتح,2,56,to raise; to resurrect, پہنچا نا,65,بَعَثَ, يَبْعَثُ, اِبْعَثْ, بَاعِث, مَبْعُوث, بَعْث,ب ع ث ,1,فتح',
'4,jEl,b1,فتح,2,19,"to make, to place, to set up",کردینا,346,جَعَلَ, يَجْعَلُ, اِجْعَلْ, جَاعِل, مَجْعُول, جَعْل,ج ع ل ,1,فتح',
'5,jmE,b1,فتح,3,25,"to gather,  to collect",جمع کرنا,40,جَمَعَ, يَجْمَعُ, اِجْمَعْ, جَامِع, مَجْمُوع, جَمْع,ج م ع ,1,فتح',
'6,*hb,b1,فتح,2,17,to go,جانا ,35,ذَهَبَ, يَذْهَبُ, اِذْهَبْ, ذَاهِب, -, ذِهَاب,ذ ه ب ,1,فتح',
'7,rfE,b1,فتح,2,63,to raise,اونچا كرنا,28,رَفَعَ, يَرْفَعُ, اِرْفَعْ, رَافِع, مَرْفُوع, رَفْع,ر ف ع ,1,فتح',
'8,sHr,b1,فتح,7,116,"to enchant, to bewitch",جادو كرنا,49,سَحَرَ, يَسْحَرُ, اِسْحَرْ, سَاحِر, مَسْحُور, سِحْر,س ح ر ,1,فتح',
'9,slH,b1,فتح,3,39,to act righteously,نيك هونا,131,صَلَحَ, يَصْلَحُ, اِصْلَحْ, صَالِح, -, مَصْلَحَة,ص ل ح ,1,فتح',
'10,lEn,b1,فتح,2,88,to curse,لعنت كرنا,27,لَعَنَ, يَلْعَنُ, اِلْعَنْ, لَاعِن, مَلْعُون, لَعْن,ل ع ن ,1,فتح',

'11,nfE,b1,فتح,2,102,to profit,نفع پهنچانا,42,نَفَعَ, يَنْفَعُ, اِنْفَعْ, نَافِع, مَنْفُوع, نَفْع,ن ف ع ,1,فتح',
'12,nsr,b2,نصر,2,250,to help; to deliver,مدد كرنا,92,نَصَرَ, يَنْصُرُ, اُنْصُرْ, نَاصِر, مَنْصُور, نَصْر,ن ص ر ,1,نصر',
'13,blg,b2,نصر,2,196,to reach,پهنچنا,49,بلَغَ, يَبْلُغُ, اُبْلُغْ, بَالِغ, -, بُلُوغ,ب ل غ ,1,نصر',
'14,trk,b2,نصر,,,to leave,چھوڑ دينا,43,تَرَكَ, يَتْرُكُ, اُتْرُكْ, تَارِك, مَتْرُوك, تَرْك  ,ت ر ك ,1,نصر',
'15,H$r,b2,نصر,4,172,to gather; to bring together,جمع کرنا,43,حَشَرَ, يَحْشُرُ, اُحْشُرْ, حَاشِر, مَحْشُور, حَشْر ,ح ش ر ,1,نصر',
'16,Hkm,b2,نصر,,,to judge; to rule,فيصله كرنا,80,حَكَمَ, يَحْكُمُ, اُحْكُمْ, حَاكِم, مَحْكُوم, حُكْم,ح ك م ,1,نصر',
'17,xrj,b2,نصر,2,74,to come out,نكلنا,61,خَرَجَ, يَخْرُجُ, اُخْرُجْ, خَارِج, -, خُرُوج,خ ر ج ,1,نصر',
'18,xld,b2,نصر,3,15,to live forever,هميشه رهنا,83,خَلَدَ, يَخْلُدُ, اُخْلُدْ, خَالِد, -, خُلُود,خ ل د ,1,نصر',
'19,xlq,b2,نصر,2,21,to create out of nothing,پيدا كرنا,248,خَلَقَ, يَخْلُقُ, اُخْلُقْ, خَالِق, مَخْلُوق, خَلْق,خ ل ق ,1,نصر',

'20,dxl,b2,نصر,2,58,to enter,داخل هونا,78,دَخَلَ, يَدْخُلُ, اُدْخُلْ, دَاخِل, مَدْخُول, دُخُول,د خ ل ,1,نصر',
'21,*kr,b2,نصر,,,to remember,ياد كرنا,163,ذَكَرَ, يَذْكُرُ, اُذْكُرْ, ذَاكِر, مَذْكُور, ذِكْر,ذ ك ر ,1,نصر',
'22,rzq,b2,نصر,2,3,to provide,رزق دينا,122,رَزَقَ, يَرْزُقُ, اُرْزُقْ, رَازِق, مَرْزُوق, رِزْق,ر ز ق ,1,نصر',
'23,sjd,b2,نصر,2,34,to prostrate,سجده كرنا,49,سَجَدَ, يَسْجُدُ, اُسْجُدْ, سَاجِد, مَسْجُود, سُجُود,س ج د ,1,نصر',
'24,$Er,b2,نصر,2,9,to perceive,سمجھنا,29,شَعَرَ, يَشْعُرُ, اُشْعُرْ, شَاعِر, -, شُعُور,ش ع ر ,1,نصر',
'25,$kr,b2,نصر,,,to be grateful,شكر كرنا,63,شَكَرَ, يَشْكُرُ, اُشْكُرْ, شَاكِر, مَشْكُور, شُكْر,ش ك ر ,1,نصر',
'26,sdq,b2,نصر,2,111,to be true; to say the truth,سچ بولنا,89,صَدَقَ, يَصْدُقُ, اُصْدُقْ, صَادِق, مَصْدُوق, صِدْق,ص د ق ,1,نصر',
'27,Ebd,b2,نصر,1,5,to worship; to serve,عبادت كرنا,143,عَبَدَ , يَعْبُدُ, اُعْبُدْ, عَابِد, مَعْبُود, عِبَادَة,ع ب د  ,1,نصر',
'28,fsq,b2,نصر,2,59,to transgress,نافرماني كرنا,54,فَسَقَ, يَفْسُقُ, اُفْسُقْ, فَاسِق, -, فِسْق، فُسُوق,ف س ق ,1,نصر',
'29,qtl,b2,نصر,2,54,to kill; to slay,قتل كرنا، مارنا,93,قَتَلَ, يَقْتُلُ, اُقْتُلْ, قَاتِل, مَقْتُول, قَتْل,ق ت ل ,1,نصر',
'30,qEd,b2,نصر,3,168,to sit; to remain behind,بيٹھنا,23,قَعَدَ, يَقْعُدُ, اُقْعُدْ, قَاعِد, -, قُعُود ,ق ع د ,1,نصر',
'31,ktb,b2,نصر,,,to prescribe; to write,لكھنا,56,كَتَبَ, يَكْتُبُ, اُكْتُبْ, كَاتِب, مَكْتُوب, كِتَابَة,ك ت ب ,1,نصر',
'32,kfr,b2,نصر,,,to disbelieve; to be ungrateful,انكار كرنا، ناشكري كرنا,461,كَفَرَ, يَكْفُرُ, اُكْفُرْ, كَافِر, مَكْفُور, كُفْر,ك ف ر ,1,نصر',
'33,mkr,b2,نصر,,,to plot,چال چلنا، مكر كرنا,43,مَكَرَ, يَمْكُرُ, اُمْكُرْ, مَاكِر, مَمْكُور, مَكْر,م ك ر ,1,نصر',
'34,nZr,b2,نصر,2,50,to look; to wait,ديكھنا,95,نَظَرَ, يَنْظُرُ, اُنْظُرْ, نَاظِر, مَنْظُور, نَظَر,ن ظ ر ,1,نصر',
'35,Drb,b3,ضرب,2,26,to strike,مارنا,58,ضَرَبَ, يَضْرِبُ, اِضْرِبْ, ضَارِب, مَضْرُوب, ضَرْب,ض ر ب ,1,ضرب',
'36,Hml,b3,ضرب,2,248,to carry; to bear,اٹھانا,50,حَمَلَ, يَحْمِلُ, اِحْمِلْ, حَامِل, مَحْمُول, حَمْل,ح م ل ,1,ضرب',
'37,sbr,b3,ضرب,2,175,to bear with patience,صبر كرنا,94,صَبَرَ, يَصْبِرُ, اِصْبِرْ, صَابِر, -, صَبْر,ص ب ر ,1,ضرب',
'38,Zlm,b3,ضرب,2,54,to wrong,ظلم كرنا,266,ظَلَمَ, يَظْلِمُ, اِظْلِمْ, ظَالِم, مَظْلُوم, ظُلْم,ظ ل م ,1,ضرب',
'39,Erf,b3,ضرب,2,146,to recognize,پهچاننا,59,عَرَفَ, يَعْرِفُ , اِعْرِفْ, عَارِف, مَعْرُوف, مَعْرِفَة,ع ر ف ,1,ضرب',
'40,Eql,b3,ضرب,2,44,to understand; to comprehend,عقل كا استعمال كرنا,49,عَقَلَ, يَعْقِلُ, اِعْقِلْ, عَاقِل, مَعْقُول, عَقْل,ع ق ل ,1,ضرب',
'41,gfr,b3,ضرب,2,58,to forgive;  to cover,بخش دينا,95,غَفَرَ, يَغْفِرُ, اِغْفِرْ, غَافِر, مَغْفُور, مَغْفِرَة,غ ف ر ,1,ضرب',
'42,qdr,b3,ضرب,2,264,to decree; to have power; ..,,47,قَدَرَ, يَقْدِرُ, اِقْدِرْ, قَادِر, مَقْدُور, قَدْر، قُدْرَة,ق د ر ,1,ضرب',
'43,k*b,b3,ضرب,,,to lie,جھوٹ بولنا,76,كَذَبَ, يَكْذِبُ, اِكْذِبْ, كَاذِب, مَكْذُوب, كَذِب ,ك ذ ب ,1,ضرب',
'44,ksb,b3,ضرب,,,to earn,كمانا,62,كَسَبَ, يَكْسِبُ, اِكْسِبْ, كَاسِب, مَكْسُوب, كَسْب,ك س ب ,1,ضرب',
'45,mlk,b3,ضرب,,,to possess,مالك هونا,49,مَلَكَ, يَمْلِكُ, اِمْلِكْ, مَالِك, مَمْلُوك, مِلْك,م ل ك ,1,ضرب',
'46,smE,b4,سمع,2,7,to hear,سننا,100,سَمِعَ, يَسْمَعُ, اِسْمَعْ, سَامِع, مَسْمُوع, سَمَاعَة,س م ع ,1,سمع',
'47,Hzn,b4,سمع,2,38,to be grieved,غم كرنا,30,حَزِنَ, يَحْزَنُ, اِحْزَنْ, حَازِن, -, حُزْن,ح ز ن ,1,سمع',
'48,Hsb,b4,سمع,2,214,to think;  to consider,گمان كرنا,46,حَسِبَ, يَحْسَبُ, اِحْسَبْ, حَاسِب, مَحْسُوب, حَسْب,ح س ب ,1,سمع',
'49,HfZ,b4,سمع,4,34,to guard; to protect,حفاظت كرنا,27,حَفِظَ, يَحْفَظُ, اِحْفَظْ, حَافِظ, مَحْفُوظ, حِفْظ ,ح ف ظ ,1,سمع',
'50,xsr,b4,سمع,3,85,to lose,نقصان ميں پڑنا,51,خَسِرَ, يَخْسَرُ, اِخْسَرْ, خَاسِر, -, خُسْر,خ س ر ,1,سمع',
'51,rHm,b4,سمع,2,286,to have mercy on someone,رحم كرنا,148,رَحِمَ, يَرْحَمُ, اِرْحَمْ, رَاحِم, مَرْحُوم, رَحْمَة,ر ح م ,1,سمع',
'52,$hd,b4,سمع,2,84,to bear witness; to be present,گواهي دينا,66,شَهِدَ, يَشْهَدُ, اِشْهَدْ, شَاهِد, مَشْهُود, شَهُود,ش ه د ,1,سمع',
'53,Elm,b4,سمع,2,13,to know,جاننا,518,عَلِمَ, يَعْلَمُ, اِعْلَمْ, عَالِم, مَعْلُوم, عِلْم,ع ل م ,1,سمع',
'54,Eml,b4,سمع,2,25,to work; to do,عمل كرنا,318,عَمِلَ, يَعْمَلُ, اِعْمَلْ, عَامِل, مَعْمُول, عَمَل,ع م ل ,1,سمع',
'55,krh,b4,سمع,,,to dislike;  to detest,كراهت كرنا، ناپسند كرنا,25,كَرِهَ, يَكْرَهُ, اِكْرَهْ, كَارِه, مَكْرُوه, كُرْه,ك ر ه ,1,سمع',
'56,w*r,b5,وعد,26,166,to leave behind,چھوڑ دينا,45,وَذَرَ, يَذَرُ, ذَرْ, وَاذِر, مَوْذُور, وَذْر,و ذ ر ,1,سمع',
'57,wDE,b5,وعد,,,to put; to set,ركھ دينا,22,وَضَعَ, يَضَعُ, ضَعْ, وَاضِع, مَوْضُوع, وُضْع,و ض ع ,1,سمع',
'58,wqE,b5,وعد,,,to befall,واقع هونا,20,وَقَعَ, يَقَعُ, قَعْ, وَاقِع, -, وَقُوع,و ق ع ,1,سمع',
'59,whb,b5,وعد,3,8,to grant,دينا,23,وَهَبَ, يَهَبُ, هَبْ, وَاهِب, مَوْهُوب, وَهْب,و ه ب ,1,سمع',
'60,wjd,b5,وعد,2,96,to find,پانا,107,وَجَدَ, يَجِدُ, جِدْ, وَاجِد, مَوْجُود, وُجُود,و ج د ,1,سمع',
'61,wrv,b5,وعد,4,176,to inherit,وارث هونا,19,وَرِثَ, يَرِثُ, رِثْ, وَارِث, مَوْرُوث, وَرَاثَة,و ر ث ,1,سمع',
'62,wzr,b5,وعد,6,31,to bear a load,بوجھ اٹھانا,19,وَزَرَ, يَزِرُ, زِرْ, وَازِر, مَوْزُور, وِزْر,و ز ر ,1,سمع',
'63,wsf,b5,وعد,6,100,to describe; to ascribe,بيان كرنا,14,وَصَفَ, يَصِفُ, صِفْ, وَاصِف, مَوْصُوف, وَصْف,و ص ف ,1,سمع',
'64,wEd,b5,وعد,2,268,to promise,وعده كرنا,124,وَعَدَ, يَعِدُ, عِدْ, وَاعِد, مَوْعُود, وَعْد,و ع د ,1,سمع',
'65,wqy,b5,وعد,2,201,to protect;  to save,بچانا,19,وَقَى, يَقِي, قِ, وَاق, مَوْقى, وِقَايَة,و ق ى,1,سمع',
'66,wsE,b5,وعد,,,to embrace;  to comprehend,سما لينا، وسيع هونا,25,وَسِعَ, يَوْسَعُ, اِيْسَعْ, وَاسِع, مَوْسُوع, سَعَة,و س ع ,1,سمع',
'67,twb,b6,قال,2,37,to repent,پلٹنا,72,تَابَ, يَتُوبُ, تُبْ, تَائِب, -, تَوْبَة,ت و ب ,1,سمع',
'68,*wq,b6,قال,3,106,to taste,چكھنا,42,ذَاقَ, يَذُوقُ, ذُقْ, ذَائِق, مَذَاق, ذَوْق,ذ و ق ,1,سمع',
'69,fwz,b6,قال,3,185,to succeed; to gain victory,كامياب هونا,26,فَازَ, يَفُوزُ, فُزْ, فَائِز, -, فُوْز ,ف و ز ,1,سمع',
'70,qwl,b6,قال,2,8,to say,كهنا,1719,قَالَ, يَقُولُ, قُلْ, قَائِل, مَقَال, قَوْل,ق و ل ,1,سمع',
'71,qwm,b6,قال,2,20,to stand up; to raise,كھڑا هونا,55,قَامَ, يَقُومُ, قُمْ, قَائِم, -, قِيَام، قَوْمَة,ق و م ,1,سمع',
'72,kwn,b6,قال,,,to be,هونا,1361,كَانَ, يَكُونُ, كُنْ, كَائِن, -, كَوْن,ك و ن ,1,سمع',
'73,mwt,b6,قال,2,132,to die,مرنا، بے جان هونا,93,مَاتَ, يَمُوتُ, مُتْ, مَائِت, -, مَوْت,م و ت ,1,سمع',
'74,xwf,b6,قال,2,112,to be afraid,ڈرنا,112,خَافَ, يَخَافُ, خِفْ, خَائِف, -, خَوْف,خ و ف ,1,سمع',
'75,kwd,b6,قال,,,to become nigh; to be close to,قريب هونا,24,كَادَ, يَكَادُ, كِدْ, كَائِد, -, كَوْد,ك و د ,1,سمع',
'76,kyd,b6,قال,,,to plot against,خفيه تدبير كرنا,35,كَادَ, يَكِيدُ, كِدْ, كَائِد, مَكَيد, كَيْد,ك ي د ,1,سمع',
'77,zyd,b6,قال,2,10,to increase,زياده كرنا,51,زَادَ, يَزِيدُ, زِدْ, زَائِد, مَزِيد, زِيَادَة,ز ي د ,1,سمع',
'78,tlw,b7,دعا,,,to recite,تلاوت كرنا,61,تَلَا, يَتْلُو, اُتْلُ, تَالٍ, مَتْلُو, تِلَاوَة,ت ل و ,1,سمع',
'79,dEw,b7,دعا,2,23,to call; to pray,پكارنا، بلانا,197,دَعَا, يَدْعُو, اُدْعُ, دَاعٍ, مَدْعُوّ, دُعَاء,د ع و ,1,سمع',
'80,Efw,b7,دعا,2,52,to forgo,معاف كرنا,30,عَفَا, يَعْفُو, اُعْفُ, عَافٍ, مَعْفُو, عَفْو,ع ف و ,1,سمع',
'81,bgy,b7,دعا,3,83,"to want, to seek",چاهنا، زيادتي كرنا,29,بَغَى, يَبْغِي, اِبْغِ, بَاغٍ, مَبْغَى, بَغْى,ب غ ى,1,سمع',
'82,jry,b7,دعا,,,to flow,چلنا ، جاري هونا,60,جَرَى, يَجْرِي, اِجْرِ, جَارٍ, -, جَرَيَان,ج ر ى,1,سمع',
'83,jzy,b7,دعا,,,to reward,بدله دينا,116,جَزَى, يَجْزِي, اِجْزِ, جَازٍ, مَجْزِي, جَزَاء,ج ز ى,1,سمع',
'84,qDy,b7,دعا,,,to decree;  to fulfil,فيصله كرنا، پورا كرنا,62,قَضَى, يَقْضِي, اِقْضِ, قَاضٍ, مَقْضِيّ,  قَضَاء ,ق ض ى,1,سمع',
'85,kfy,b7,دعا,,,to suffice,كافي هونا، ضرورت پورا كرنا,32,كَفَى, يَكْفِي, اِكْفِ, كَافٍ, مَكْفِيّ, كِفَايَة,ك ف ى,1,سمع',
'86,hdy,b7,دعا,1,6,to guide;  to direct,راسته بتانا,163,هَدَى, يَهْدِي, اِهْدِ, هَادٍ, مَهْدِيّ, هَدْى,ه د ى,1,سمع',
'87,x$y,b7,دعا,2,150,to fear,ڈرنا، خوف كھانا,48,خَشِيَ, يَخْشَى, اِخْشَ, خَاشٍ, -, خَشِيَّة,خ ش ي ,1,سمع',
'88,rDy,b7,دعا,,,"to be satisfied, to be content",راضي هونا، خوش هونا,57,رَضِيَ, يَرْضَى, اِرْضَ, رَاضٍ, مَرْضِيّ, رِضْوَان,ر ض ي ,1,سمع',
'89,nsy,b7,دعا,2,44,to forget,بھول جانا,36,نَسِيَ, يَنْسَى, اِنْسَ, نَاسٍ, مَنْسِيّ, نِسْيَان,ن س ي ,1,سمع',
'90,sAl,b8,أمر,2,61,to ask,پوچھنا,119,سَأَلَ, يَسْأَلُ, سَلْ  اِسْئَلْ, سَائِل, مَسْئُول, سُؤَال   ,س أ  ل ,1,سمع',
'91,qrA,b8,أمر,,,to read; to recite,پڑھنا,17,قَرَأَ, يَقْرَأُ, اِقْرَأْ, قَارِئ, مَقْرُوء, قِرَاءَة,ق ر أ  ,1,سمع',
'92,Ax*,b8,أمر,2,55,to take; to catch,پكڑنا، لينا,142,أَخَذَ, يَأْخُذُ, خُذْ, آخِذ, مَأْخُوذ, أَخْذ,أ  خ ذ ,1,سمع',
'93,Akl,b8,أمر,,,to eat,كھانا,101,أَكَلَ, يَأْكُلُ, كُلْ, آكِل, مَأْكُول, أَكْل,أ  ك ل ,1,سمع',
'94,Amr,b8,أمر,2,27,to command,حكم دينا,232,أَمَرَ, يَأْمُرُ, مُرْ, آمِر, مَأْمُور, أَمْر,أ  م ر ,1,سمع',
'95,Amn,b8,أمر,2,196,to be safe; to feel safe; to trust,امن ميں هونا,25,أَمِنَ, يَأَمَنُ, ائْمَنْ, آمِن, -, أَمْن ,أ  م ن ,1,سمع',
'96,Aby,b8,أمر,,,to refuse,سخت انكار كرنا,13,أَبَى, يَأْبَى, اِئْبَ, آبٍ, -, اِبَاء,أ  ب ى,1,سمع',
'97,rAy,b8,أمر,2,55,to see,ديكھنا,269,رَأَى, يَرَى, رَ, رَاءٍ, مَرْءِيّ, رَأْيٌ,ر أ  ى,1,سمع',
'98,Aty,b8,أمر,,,to come,آنا,263,أَتَى, يَأْتِي, اِئْتِ, آتٍ, مَأْتِيّ, اِتْيَان,أ  ت ى,1,سمع',
'99,$yA,b8,أمر,2,20,"to will, to wish",چاهنا,277,شَاءَ, يَشَاءُ, شَأْ, شَاءٍ, -, مَشِيئَة,ش ي ء ,1,سمع',
'100,swA,b8,أمر,,,to be evil,برُا هونا,39,سَاءَ, يَسُوءُ, سُؤْ, سَاوِئ, -, سَوْء,س و ء ,1,سمع',
'101,jyA,b8,أمر,2,71,to come,آنا,236,جَاءَ, يَجِيءُ, جِئْ, جَاءٍ, -, مَجِيء,ج ي ء ,1,سمع',
'102,Dll,b9,ضَلَّ,2,108,to go astray; to err; to waste,گمراه هونا,113,ضَلَّ, يَضِلُّ , ضِلَّ, ضَالّ, -, ضَلَالَة، ضَلَال,ض ل ل,1,ضَلَّ',
'103,Hyy,b9,ضَلَّ,4,86,to live; to greet,جينا، زنده رهنا,83,حَيَّ, يَحْيَا, حَيَّ, حَيّ, -, حَيَاة,ح ي ي,1,ضَلَّ',
'104,rdd,b9,ضَلَّ,2,109,to give back;  to return,لوٹانا، واپس كرنا,45,رَدَّ, يَرُدُّ, رُدَّ, رَادّ, مَرْدُود, رَدّ,ر د د,1,ضَلَّ',
'105,sdd,b9,ضَلَّ,3,99,to turn away;  to hinder,روكنا، ركنا,39,صَدَّ, يَصُدُّ, صُدَّ, صَادّ, مَصْدُود, صَدّ,ص د د ,1,ضَلَّ',
'106,Drr,b9,ضَلَّ,2,102,to hurt; to harm,نقصان پهنچانا,31,ضَرَّ, يَضُرُّ, ضُرَّ, ضَارّ, مَضْرُور, ضَرّ,ض ر ر,1,ضَلَّ',
'107,Znn,b9,ضَلَّ,2,46,to think;   to believe,گمان كرنا، يقين كرنا,68,ظَنَّ, يَظُنُّ, ظُنَّ, ظَانّ, -, ظَنّ,ظ ن ن,1,ضَلَّ',
'108,Edd,b9,ضَلَّ,14,34,to count,گننا، شمار كرنا,17,عَدَّ, يَعُدُّ, عُدَّ, عَادّ, مَعْدُود, عَدّ,ع د د,1,ضَلَّ',
'109,grr,b9,ضَلَّ,,,to beguile,دھوكه دينا,24,غَرَّ, يَغِرُّ, غِرَّ, غَارّ, مَغْرُور, غُرُور,غ ر ر,1,ضَلَّ',
'110,mdd,b9,ضَلَّ,13,3,to spread out;  to stretch,پھيلانا، مهلت دينا,17,مَدَّ, يَمُدُّ, مُدَّ, مَادّ, مَمْدُود, مَدّ,م د د,1,ضَلَّ',
'111,mss,b9,ضَلَّ,2,80,to touch,چھونا,58,مَسَّ, يَمَسُّ, مَسَّ, مَاسّ, مَمْسُوس, مَسّ,م س س,1,ضَلَّ',
'112,wdd,b9,ضَلَّ,2,96,to love; to wish,چاهنا,18,وَدَّ, يَوَدُّ, وَدَّ, وَادّ, مَوْدُود, وُدّ,و د د,1,ضَلَّ',
'113,bdl,d2,سَبَّحَ,2,59,to change,بدل دينا,33,بَدَّلَ, يُبَدِّلُ, بَدِّلْ, مُبَدِّل, مُبَدَّل, تَبْدِيْل,ب د ل ,2,سَبَّحَ',
'114,b$r,d2,سَبَّحَ,2,25,to give good news,بشارت، خوشخبري دينا,48,بَشَّرَ, يُبَشِّرُ, بَشِّرْ, مُبَشِّر, مُبَشَّر, تَبْشِيْر,ب ش ر ,2,سَبَّحَ',
'115,byn,d2,سَبَّحَ,2,68,to make clear,بيان كرنا، واضح كرنا,35,بَيَّنَ, يُبَيِّنُ, بَيِّنْ, مُبَيِّن, مُبَيَّن, تَبْيِيْن,ب ي ن ,2,سَبَّحَ',
'116,zyn,d2,سَبَّحَ,2,212,to adorn / make st  to seem fair,خوشنما بنانا، زينت دينا,26,زَيَّنَ, يُزَيِّنُ, زَيِّنْ, مُزَيِّن, مُزَيَّن, تَزْيِين,ز ي ن ,2,سَبَّحَ',
'117,sbH,d2,سَبَّحَ,2,30,to glorify;  to praise,پاكي بيان كرنا,48,سَبَّحَ, يُسَبِّحُ, سَبِّحْ, مُسَبِّح, مُسَبَّح, تَسْبِيْح,س ب ح ,2,سَبَّحَ',
'118,sxr,d2,سَبَّحَ,2,164,to bring under control,مسخر كنرا,26,سَخَّرَ, يُسَخِّرُ, سَخِّرْ, مُسَخِّر, مُسَخَّر, تَسْخِير ,س خ ر ,2,سَبَّحَ',
'119,sdq,d2,سَبَّحَ,2,41,to pronounce ss to be true,سچا ماننا، تصديق كرنا,31,صَدَّقَ, يُصَدِّقُ, صَدِّقْ, مُصَدِّق, مُصَدَّق, تَصْدِيْق,ص د ق ,2,سَبَّحَ',
'120,E*b,d2,سَبَّحَ,2,284,to punish;  to torment,عذاب دينا,49,عَذَّبَ, يُعَذِّبُ, عَذِّبْ, مُعَذِّب, مُعَذَّب, تَعْذِيْب,ع ذ ب ,2,سَبَّحَ',
'121,Elm,d2,سَبَّحَ,2,31,to teach,سكھانا,42,عَلَّمَ, يُعَلِّمُ, عَلِّمْ, مُعَلِّم, مُعَلَّم, تَعْلِيْم,ع ل م ,2,سَبَّحَ',
'122,qdm,d2,سَبَّحَ,2,95,to send forward,آگے بھيجنا، سامنے لانا,27,قَدَّمَ, يُقَدِّمُ, قَدِّمْ, مُقَدِّم, مُقَدَّم, تَقْدِيْم,ق د م ,2,سَبَّحَ',
'123,k*b,d2,سَبَّحَ,,,to accuse ss of falsehood,جھٹلانا,198,كَذَّبَ, يُكَذِّبُ, كَذِّبْ, مُكَذِّب, مُكَذَّب, تَكْذِيْب,ك ذ ب ,2,سَبَّحَ',
'124,nbw,d2,سَبَّحَ,,,to declare;  to apprise,خبر دينا، بتانا,46,نَبَّأَ, يُنَبِّئُ, نَبِّئْْ, مُنَبِّئ, مُنَبَّئْ, تَنْبِئَة,ن ب و  ,2,سَبَّحَ',
'125,nzl,d2,سَبَّحَ,2,23,to send down,اُتارنا,79,نَزَّلَ, يُنَزِّلُ, نَزِّلْ, مُنَزِّل, مُنَزَّل, تَنْزِيْل,ن ز ل ,2,سَبَّحَ',
'126,njy,d2,سَبَّحَ,,,to deliver;  to rescue,نجات دينا,39,نَجَّى, يُنَجِّي, نَجِّ, مُنَجِّي, مُنَجَّى, تَنْجِيَة,ن ج ى,2,سَبَّحَ',
'127,wly,d2,سَبَّحَ,2,115,to turn,رخ كرنا، منه موڑنا,45,وَلَّى, يُوَلِّي, وَلِّ, مُوَلِّي, -, تَوْلِيَة,و ل ى,2,سَبَّحَ',
'128,jhd,d3,جَاهَدَ,2,218,to struggle;  to strive,جهاد كرنا,31,جَاهَدَ, يُجَاهِدُ, جَاهِدْ, مُجَاهِد, مُجَاهَد, مُجَاهَدَة,ج ه د ,3,جَاهَدَ',
'129,qtl,d3,جَاهَدَ,2,190,to fight,قتال كرنا، لڑنا,54,قَاتَلَ, يُقَاتِلُ, قَاتِلْ, مُقَاتِل, مُقَاتَل, مُقَاتَلَة,ق ت ل ,3,جَاهَدَ',
'130,ndy,d3,جَاهَدَ,,,to call out; to cry unto,پكارنا,44,نَادَى, يُنَادِي , نَادِ,مُنَادٍ, مُنَادَى   , مُنَادَاة,ن د ى,3,جَاهَدَ',
'131,nfq,d3,جَاهَدَ,3,167,to play hypocricy,منافقت كرنا,34,نَافَقَ, يُنَافِقُ, نَافِقْ, مُنَافِق, -, مُنَافَقَة,ن ف ق ,3,جَاهَدَ',
'132,hjr,d3,جَاهَدَ,2,218,to migrate,هجرت كرنا، چھوڑنا,24,هَاجَرَ, يُهَاجِرُ, هَاجِرْ, مُهَاجِر, -, مُهَاجَرَة,ه ج ر ,3,جَاهَدَ',
'133,bsr,d4,أَسْلَمَ,2,17,to see; to watch,ديكھنا,36,أَبْصَرَ, يُبْصِرُ, أَبْصِرْ, مُبْصِر, مُبْصَر, إِبْصَار,ب ص ر ,4,أَسْلَمَ',
'134,Hsn,d4,أَسْلَمَ,2,58,to do good; to do excellently,اچھي طرح كرنا,72,أَحْسَنَ, يُحْسِنُ, أَحْسِنْ, مُحْسِن, مُحْسَن, إِحْسَان,ح س ن ,4,أَسْلَمَ',
'135,xrj,d4,أَسْلَمَ,2,22,to bring forth,باهر نكالنا,108,أَخْرَجَ, يُخْرِجُ, أَخْرِجْ, مُخْرِج, مُخْرَج, إِخْرَاج,خ ر ج ,4,أَسْلَمَ',
'136,dxl,d4,أَسْلَمَ,3,185,to make ss enter,داخل كرنا,45,أَدْخَلَ, يُدْخِلُ, أَدْخِلْ, مُدْخِل, مُدْخَل, إِدْخَال,د خ ل ,4,أَسْلَمَ',
'137,rjE,d4,أَسْلَمَ,,,to send back; to take back,لوٹانا، واپس كرنا,33,أَرْجَعَ, يُرْجِعُ, أَرْجِعْ, مُرْجِع, مُرْجَع, إِرْجَاع ,ر ج ع ,4,أَسْلَمَ',
'138,rsl,d4,أَسْلَمَ,2,119,to send,بھيجنا,135,أَرْسَلَ, يُرْسِلُ, أَرْسِلْ, مُرْسِل, مُرْسَل, إِرْسَال,ر س ل ,4,أَسْلَمَ',
'139,srf,d4,أَسْلَمَ,3,147,to exceed; to be extravagant,اسراف كرنا,23,أَسْرَفَ, يُسْرِفُ, اَسْرِفْ, مُسْرِف, -, إِسْرَاف ,س ر ف ,4,أَسْلَمَ',
'140,slm,d4,أَسْلَمَ,2,112,to submit;  to surrender,حكم ماننا,72,أَسْلَمَ, يُسْلِمُ, أَسْلِمْ, مُسْلِم, -, إِسْلَام,س ل م ,4,أَسْلَمَ',
'141,$rk,d4,أَسْلَمَ,,,to ascribe a partner,شريك كرنا,120,أَشْرَكَ, يُشْرِكُ, أَشْرِكْ, مُشْرِك, مُشْرَك, إِشْرَاك,ش ر ك ,4,أَسْلَمَ',
'142,sbH,d4,أَسْلَمَ,3,103,to become,هوجانا، صبح كرنا,34,أَصْبَحَ, يُصْبِحُ, أَصْبِحْ, مُصْبِح, -, إِصْبَاح ,ص ب ح ,4,أَسْلَمَ',
'143,slH,d4,أَسْلَمَ,2,11,to become good; to make good,اصلاح كرنا,40,أَصْلَحَ, يُصْلِحُ, أَصْلِحْ, مُصْلِح, مُصْلَح, إِصْلَاح,ص ل ح ,4,أَسْلَمَ',
'144,ErD,d4,أَسْلَمَ,2,83,to turn away; to backslide,منه پھيرنا,53,أَعْرَضَ, يُعْرِضُ, أَعْرِضْ, مُعْرِض, -, إِعْرَاض,ع ر ض ,4,أَسْلَمَ',
'145,grq,d4,أَسْلَمَ,2,50,to drown,ڈبو دينا,21,أَغْرَقَ, يُغْرِقُ, أَغْرِقْ, مُغْرِق, -, إِغْرَاق,غ ر ق ,4,أَسْلَمَ',
'146,fsd,d4,أَسْلَمَ,2,11,to spread corruption,خراب كرنا، فساد پھيلانا,36,أَفْسَدَ, يُفْسِدُ, أَفْسِدْ, مُفْسِد, مُفْسَد, إِفْسَاد,ف س د ,4,أَسْلَمَ',
'147,flH,d4,أَسْلَمَ,2,5,to be successful,فلاح پانا,40,أَفْلَحَ, يُفْلِحُ, أَفْلِحْ, مُفْلِح, -, إِفْلَاح,ف ل ح ,4,أَسْلَمَ',
'148,nbt,d4,أَسْلَمَ,2,61,to make st grow; to cause to grow,اگانا,16,أَنْبَتَ, يُنْبِتُ, أَنْبِتْ, مُنْبِت, -, إِنْبِات,ن ب ت ,4,أَسْلَمَ',
'149,n*r,d4,أَسْلَمَ,2,6,to warn,ڈرانا,70,أَنْذَرَ, يُنْذِرُ, أَنْذِرْ, مُنْذِر, مُنْذَر, إِنْذَار,ن ذ ر ,4,أَسْلَمَ',
'150,nzl,d4,أَسْلَمَ,2,4,to send down; to reveal,نازل كرنا,190,أَنْزَلَ, يُنْزِلُ, أَنْزِلْ, مُنْزِل, مُنْزَل, إِنْزَال,ن ز ل ,4,أَسْلَمَ',
'151,n$A,d4,أَسْلَمَ,6,6,to produce/ create;  to make st grow,كھڑا كرنا,22,أَنْشَأَ, يُنْشِئُ, أَنْشِئْ, مُنْشِئ, مُنْشَئ, إِنْشَاء,ن ش أ,4,أَسْلَمَ',
'152,nEm,d4,أَسْلَمَ,1,7,to favor; to bestow grace,انعام كرنا,17,أَنْعَمَ, يُنْعِمُ, أَنْعِمْ, مُنْعِم, مُنْعَم, إِنْعَام,ن ع م ,4,أَسْلَمَ',
'153,nfq,d4,أَسْلَمَ,2,3,to spend,خرچ كرنا,69,أَنْفَقَ, يُنْفِقُ, أَنْفِقْ, مُنْفِق, مُنْفَق, إِنْفَاق,ن ف ق ,4,أَسْلَمَ',
'154,nkr,d4,أَسْلَمَ,,,to not recognize; to deny,انكار كرنا,25,أَنْكَرَ, يُنْكِرُ, أَنْكِرْ, مُنْكِر, مُنْكَر, إِنْكَار ,ن ك ر ,4,أَسْلَمَ',
'155,hlk,d4,أَسْلَمَ,,,to destroy,هلاك كرنا,58,أَهْلَكَ, يُهْلِكُ, أَهْلِكْ, مُهْلِك, مُهْلَك, إِهْلَاك,ه ل ك ,4,أَسْلَمَ',
'156,tmm,d4,أَسْلَمَ,2,124,to complete,پورا كرنا,17,أَتَمَّ, يُتِمُّ, أَتْمِمْ, مُتِمّ, مُتَمّ, إِتْمَام,ت م م,4,أَسْلَمَ',
'157,Hbb,d4,أَسْلَمَ,2,165,to love,محبت كرنا,64,أَحَبَّ, يُحِبُّ, أَحْبِبْ, مُحِبّ, مُحَبّ, إِحْبَاب,ح ب ب,4,أَسْلَمَ',
'158,Hll,d4,أَسْلَمَ,2,187,to make lawful; to cause to dwell,حلال كرنا، ركھوانا,21,أَحَلَّ, يُحِلُّ, أَحْلِلْ, مُحِلّ, مُحَلّ, إِحْلَال ,ح ل ل,4,أَسْلَمَ',
'159,srr,d4,أَسْلَمَ,2,77,to conceal; to speak secretly,چھپانا,18,أَسَرَّ, يُسِرُّ, أَسْرِرْ, مُسِرّ, مُسَرّ, إِسْرَار,س ر ر,4,أَسْلَمَ',
'160,Dll,d4,أَسْلَمَ,2,26,to leave in error; to send astray,گمراه كرنا,68,أَضَلَّ, يُضِلُّ, أَضْلِلْ, مُضِلّ, مُضَلّ, إِضْلَال,ض ل ل,4,أَسْلَمَ',
'161,Edd,d4,أَسْلَمَ,2,24,to prepare; to make st ready,تياري كرنا,20,أَعَدَّ, يُعِدُّ, أَعْدِدْ, مُعِدّ, مُعَدّ, إِعْدَاد,ع د د,4,أَسْلَمَ',
'162,*wq,d4,أَسْلَمَ,6,65,to make sb taste,چكھانا,22,أَذَاقَ, يُذِيقُ, أَذِقْ, مُذِيق, مُذَاق, إِذَاقَة,ذ و ق ,4,أَسْلَمَ',
'163,rwd,d4,أَسْلَمَ,2,26,to intend;  to wish,اراده كرنا,139,أَرَادَ, يُرِيدُ, أَرِدْ, مُرِيد, مُرَاد, إِرَادَة,ر و د ,4,أَسْلَمَ',
'164,syb,d4,أَسْلَمَ,,,to befall; to inflict,آپڑنا,65,أَصَابَ, يُصِيبُ, أَصِبْ, مُصِيب, مُصَاب, إِصَابَة,ص ي ب ,4,أَسْلَمَ',
'165,TwE,d4,أَسْلَمَ,2,285,to obey,اطاعت كرنا,74,أَطَاعَ, يُطِيعُ, أَطِعْ, مُطِيع, مُطَاع, إِطَاعَة,ط وع ,4,أَسْلَمَ',
'166,qwm,d4,أَسْلَمَ,2,3,to establish;  to set upright,كھڑا كرنا,67,أَقَامَ, يُقِيمُ, أَقِمْ, مُقِيم, مُقَام, إِقَامَة,ق و م ,4,أَسْلَمَ',
'167,mwt,d4,أَسْلَمَ,2,28,to cause someone to die,موت دينا,21,أَمَاتَ, يُمِيتُ, أَمِتْ, مُمِيت, مُمَات, إِمَاتَة,م و ت ,4,أَسْلَمَ',
'168,Hyy,d4,أَسْلَمَ,2,28,to give life,زندگي دينا,53,أَحْيَا, يُحْيِي, أَحْيِ, مُحْيٍ, مُحْيَا, إِحْيَاء,ح ي ي,4,أَسْلَمَ',
'169,xfy,d4,أَسْلَمَ,2,271,to conceal,چھپانا,18,أَخْفَى, يُخْفِي, أَخْفِ, مُخْفٍ, مُخْفَى, إِخْفَاء,خ ف ى,4,أَسْلَمَ',
'170,rAy,d4,أَسْلَمَ,2,73,to show,دِكھانا,44,أَرَى, يُرِي, أَرِ, مُرٍ, مُرً, إِرَاءَ ة,ر أ ى,4,أَسْلَمَ',
'171,gny,d4,أَسْلَمَ,3,10,to enrich,كام آنا، غني كرنا,41,أَغْنَى, يُغْنِي, أَغْنِ, مُغْنٍ, مُغْنَى, إِغْنَاء,غ ن ى,4,أَسْلَمَ',
'172,lqy,d4,أَسْلَمَ,2,195,to throw; to cast; to place,ڈالنا,71,أَلْقَى, يُلقِي, أَلْقِ, مُلقٍ, مُلقَى, إِلقَاء,ل ق ى,4,أَسْلَمَ',
'173,njy,d4,أَسْلَمَ,,,to rescue; to save; to deliver,نجات دينا,23,أَنْجَى, يُنْجِي, أَنْجِ, مُنْجٍ, مُنْجَى, إِنْجَاء,ن ج ى,4,أَسْلَمَ',
'174,wHy,d4,أَسْلَمَ,3,44,to reveal;  to inspire,وحي كرنا,72,أَوْحَى, يُوحِي, أَوْحِ, مُوحٍ, مُوحَى, إِيحَاء,و ح ى,4,أَسْلَمَ',
'175,wfy,d4,أَسْلَمَ,2,40,to fulfil,پورا كرنا,18,أَوْفَى, يُوفِي, أَوْفِ, مُوفٍ, مُوفَى, إِيفَاء,و ف ى,4,أَسْلَمَ',
'176,Amn,d4,أَسْلَمَ,2,3,to believe,ايمان لانا,782,آمَنَ, يُؤْمِنُ, آمِنْ, مُؤْمِن, مُؤْمَن, إِيمَان,أ م ن ,4,أَسْلَمَ',
'177,Aty,d4,أَسْلَمَ,,,to give,دينا,274,آ تَى, يُؤْتِي, آتِ, مُؤْتِي, مُؤْتَى, إِيتَاء,أ ت ى,4,أَسْلَمَ',
'178,A*y,d4,أَسْلَمَ,,,to give trouble; to harm; to annoy,تكليف دينا,16,آذَى, يُؤْذِي, آذِ, مُؤْذِي, مُؤْذَى, إِيذَاء,أ ذ ى,4,أَسْلَمَ',
'179,fkr,d5,تَدَبَّرَ,,,to think over; to reflect,تفكر كرنا، غور كنا,17,تَفَكَّرَ, يَتَفَكَّرُ, تَفَكَّرْ, مُتَفَكِّر, مُتَفَكَّر, تَفَكُّر,ف ك ر,5,تَدَبَّرَ',
'180,*kr,d5,تَدَبَّرَ,,,to receive admonition; to remember,نصيحت پكڑنا,51,تَذَكَّرَ, يَتَذَكَّرُ, تَذَكَّرْ, مُتَذَكِّر, مُتَذَكَّر, تَذَكُّر,ذ ك ر,5,تَدَبَّرَ',
'181,wkl,d5,تَدَبَّرَ,,,to put one\'s trust,بھروسه كرنا,44,تَوَكَّلَ, يَتَوَكَّلُ, تَوَكَّلْ, مُتَوَكِّل, مُتَوَكَّل, تَوَكُّل,و ك ل,5,تَدَبَّرَ',
'182,byn,d5,تَدَبَّرَ,2,109,to become clear,ظاهر هونا، واضح هونا,18,تَبَيَّنَ, يَتَبَيَّنُ, تَبَيَّنْ, مُتَبَيِّن, مُتَبَيَّن, تَبَيُّن,ب ي ن,5,تَدَبَّرَ',
'183,rbs,d5,تَدَبَّرَ,2,226,to wait & watch for opportunity,انتظار كرنا,17,تَرَبَّصَ, يَتَرَبَّصُ, تَرَبَّصْ, مُتَرَبِّص, مُتَرَبَّص, تَرَبُّص,ر ب ص,5,تَدَبَّرَ',
'184,wly,d5,تَدَبَّرَ,2,64,to turn away; to take for friend,دوستي كرنا، منه موڑنا,79,تَوَلَّى, يَتَوَلَّى, تَوَلَّ, مُتَوَلٍّ, مُتَوَلَّى, تَوَلٍّ,و ل ي,5,تَدَبَّرَ',
'185,wfy,d5,تَدَبَّرَ,2,234,to make sb die; to receive in full,جان نكالنا,25,تَوَفَّى, يَتَوَفَّى, تَوَفَّ, مُتَوَفٍّ, مُتَوَفَّى, تَوَفٍّ,و ف ي,5,تَدَبَّرَ',
'186,brk,d6,تَدَارَسَ,,,to be blessed or exalted,با بركت هونا,9,تَبَارَكَ, يَتَبَارَكُ, تَبَارَكْ, مُتَبَارِك, -, تَبَارُك,ب ر ك,6,تَدَارَسَ',
'187,sAl,d6,تَدَارَسَ,4,1,to ask each other,آپس ميں پوچھنا,9,تَسَاءَلَ, يَتَسَاءَلُ, تَسَاءَلْ, مُتَسَاءِل, مُتَسَاءَل, تَسَاءُل,س أ ل,6,تَدَارَسَ',
'188,xlf,d7,اِخْتَلَفَ,,,to differ,اختلاف كرنا,52,اِخْتَلَفَ, يَخْتَلِفُ, اِخْتَلِفْ, مُخْتَلِف, مُخْتَلَف, اِخْتِلَاف,خ ل ف,7,اِخْتَلَفَ',
'189,tbE,d7,اِخْتَلَفَ,,,to follow,پيروي كرنا، اتباع كرنا,140,اِتَّبَعَ, يَتَّبِعُ, اِتَّبِعْ, مُتَّبِع, مُتَّبَع, اِتِّبَاع,ت ب ع,7,اِخْتَلَفَ',
'190,Ax*,d7,اِخْتَلَفَ,,,to take; to adopt,اختيار كرنا,128,اِتَّخَذَ, يَتَّخِذُ, اِتَّخِذْ, مُتَّخِذ, مُتَّخَذ, اِتِّخَاذ,أ خ ذ,7,اِخْتَلَفَ',
'191,wqy,d7,اِخْتَلَفَ,,,to be on guard; to protect,تقوي كرنا,215,اِتَّقَى, يَتَّقِي, اِتَّقِ, مُتَّقِي, -, اِتِّقَاء,و ق ي,7,اِخْتَلَفَ',
'192,fry,d7,اِخْتَلَفَ,,,to fabricate a lie,جھوٹ باندھنا,59,اِفْتَرَى, يَفْتَرِي, اِفْتَرِ, مُفْتَرٍ, -, اِفْتِرَاء,ف ر ي,7,اِخْتَلَفَ',
'193,hdy,d7,اِخْتَلَفَ,,,to find or to follow the right path,هدايت پانا,61,اِهْتَدَى, يَهْتَدِي, اِهْتَدِ, مُهْتَدٍ, -, اِهْتِدَاء,ه د ي,7,اِخْتَلَفَ',
'194,bgy,d7,اِخْتَلَفَ,19,92,to seek,چاهنا، تلاش كرنا,48,اِبْتَغَى, يَبْتَغِي, اِبْتَغِ, مُبْتَغٍ, مُبْتَغَى, اِبْتِغَاء,ب غ ي,7,اِخْتَلَفَ',
'195,nhy,d7,اِخْتَلَفَ,,,to refrain; to end,چھوڑ دينا، رك جانا,16,اِنْتَهَى, يَنْتَهِي, اِنْتَهِ, مُنْتَهٍ, -, اِنْتِهَاء,ن ه ي,7,اِخْتَلَفَ',
'196,qlb,d8,اِنْقَلَبَ,,,to turn around; to return,پھر جانا,20,اِنْقَلَبَ, يَنْقَلِبُ, اِنْقَلِبْ, مُنْقَلِب, -, اِنْقِلَاب,ق ل ب,8,اِنْقَلَبَ',
'197,byD,d9,اِبْيَضَّ,3,106,to become white,سفيد هونا,3,اِبْيَضَّ, يَبْيَضُّ, اِبْيَضَّ, مُبْيَضٍّ, -, اِبْيِضَاض,ب ي ض,9,اِبْيَضَّ',
'198,swd,d9,اِبْيَضَّ,3,106,to become black,كالا هونا,3,اِسْوَدَّ, يَسْوَدُّ, اِسْوَدَّ, مُسْوَدٍّ, -, اِسْوِدَاد,س و د,9,اِبْيَضَّ',
'199,Ejl,d10,اِسْتَغْفَرَ,6,57,to seek ss to hasten,جلدي كرنا,20,اِسْتَعْجَلَ, يَسْتَعْجِلُ, اِسْتَعْجِلْ, مُسْتَعْجِل,  -, اِسْتِعْجَال,ع ج ل,10,اِسْتَغْفَرَ',
'200,gfr,d10,اِسْتَغْفَرَ,2,199,to ask forgiveness,بخشش مانگنا,42,اِسْتَغْفَرَ, يَسْتَغْفِرُ, اِسْتَغْفِرْ, مُسْتَغْفِر, مُسْتَغْفَر, اِسْتِغْفَار,غ ف ر,10,اِسْتَغْفَرَ',
'201,kbr,d10,اِسْتَغْفَرَ,,,to act arrogantly,گھمنڈ كرنا,48,اِسْتَكْبَرَ, يَسْتَكْبِرُ, اِسْتَكْبِرْ, مُسْتَكْبِر, -, اِسْتِكْبَار,ك ب ر,10,اِسْتَغْفَرَ',
'202,hzA,d10,اِسْتَغْفَرَ,2,14,to mock at,ٹھٹھا كرنا,23,اِسْتَهْزَأَ, يَسْتَهْزِئُ, اِسْتَهْزِئْ, مُسْتَهْزِئ, مُسْتَهْزَئ, اِسْتِهْزَاء,ه ز ء,10,اِسْتَغْفَرَ',
'203,jwb,d10,اِسْتَغْفَرَ,2,186,to accept;  to respond,قبول كرنا,28,اِسْتَجَابَ, يَسْتَجِيب, اِسْتَجِبْ, مُسْتَجِيب, مُسْتَجَاب, اِسْتِجَابَة,ج و ب,10,اِسْتَغْفَرَ',
'204,TwE,d10,اِسْتَغْفَرَ,2,217,to be able to,كرسكنا,42,اِسْتَطَاعَ, يَسْتَطِيعُ, اِسْتَطِعْ, مُسْتَطِيع, مُسْتَطَاع, اِسْتِطَاعَة,ط و ع,10,اِسْتَغْفَرَ',
'205,qwm,d10,اِسْتَغْفَرَ,1,6,to be straight;  to act straight,ثابت قدم رهنا,47,اِسْتَقَامَ, يَسْتَقِيمُ, اِسْتَقِمْ, مُسْتَقِيم, -, اِسْتِقَامَة,ق و م,10,اِسْتَغْفَرَ',
];

var NEAR_SYNONYMS = [
"falak samaA^' ",
"{ll~ah <ila`h",
">aHad waHiyd farod fura`daY`",
"S~amad ganiY~",
"lam l~ayosa lan laA <in maA hal balaY` kal~aA ", 
"walada waDaEa",
"kaAna >aSobaHa yaSoduru waAqiE",
"kufuw qariyn >atoraAb samiy~ kufuw Saf~ Sa`^f~a`t yuDa`hi_#u ",

"faEala fiEol faEolat Eamila Eamal SanaEu SunoE SanoEap {SodaEo jaraHo {jotaraHu taEam~adato >amor >amara $a>on",
"Hamod $ukor $akara mdH",
"sakan sakana >asokan yatabaw~a>u vaAwiy mavowFY badow bada>a HaDara >axolada xulod yaxoludo m~uxal~aduwn EaA$iru",
"n~aAs <insa`n <ins <insiy~ A^dam ba$ar",
"qadimo yasotaqodimu musotaqodimiyn taqad~ama sabaqa saboq >aqobala",
"Sawot Sad~a yaSoTarixu hamos Hasiys mukaA^' taSodiyap DaboH xuwaAr $ahiyq zafiyr yalohavo rikoz SayoHap tagay~uZ S~aA^x~ap had~ yagoliY galoY SaloSa`l qaAriEap",
">amor >amara >a*ina Hukom Hakama Hakam yuHak~imu >awoSa`",
"Har~ama muHar~amap s~uHot",
"hadaY hudFY {hotadaY` r~a$iyd ra$ad m~uro$id ru$od yaro$udu",
"Earafa Ear~afa mutawas~imiyn",
"yumaH~iSa zak~aY` m~uSaf~FY bar~a>a tubori}u",
"n~ukur nakira naqamu munkar >ankar n~ukur n~ukor",

"xaAfa xawof xa$iYa xaA$iE xa$aEati xu$uwE {t~aqaY` taqowaY yaHo*aru Hi*or Ha*ar r~awoE xiyfap >awojasa wajilato wajilap wajiluwn yarohabu rahobap ruEob mu$ofiquwn waAjifap >awojafo",
"qaroD >aqoraDu dayon",
"faDol man~a >anoEama >aHosana >aHosan",
"ka*ib ba`Til z~uwr <ifok",
"jaA^'a >ataY hayota lum~a taEaAla",
"qad~ama taqad~ama salafa >asolafato",
"qara>a nuqori}u talaY` tarotiyl darasu diraAsat >amolaY`",
"Eaduw~ bagoDaA^' Eada`wap $ana_#aAn $aAni}",
"qalob fu&aAd Sador nafos",

"jaAr {sotajaAra Eu*o {sotaEi*o",
"rab~  rab~aya >an[bata  >an$a>a n~a$o>ap yuna$~a&uA@  rab~  kaf~ala yakofulu kifol >akofilo kafiyl",
"malik suloTaAn mulok malakuwot",
"$ar~",
"wasowaAs wasowasa waHoYN AilohaAm AiloqaA` wasowaAs hamazaat",
"xan~aAs jin~ap",

"falaq",
"xalaqa",
"gaAsiq waqaba",
"<i*aA",
"n~af~a`va`t",

"tab~a",
"lahab",
">agonaY`",
"kasaba",
"yaSolaY",
"naAr",
"*uw",
"HaTab",
"jiyd",
"Habol m~asad",

"baAri} badiyE faTara xa`liq xalaqa xaloq >an$a>a <in$aA^' *ara>a",
];


var ANTONYMS = ["bi}osa niEoma","ba>osaA^' s~ar~aA^'","badaA gAb xfY","badaA badow HDr","bar~  baHor","Aabrama naqD","ba$ar malak","ba$yr  na*iyr","bugD Hub~","baATil Haq~","baTana Zahara","baATin ZaAhir","baEd qabl","baEuda qarub","baEiyd qariyb","baEaD kul~u","bqy  fnY nafad","bikor vay~ib","bayoDaA'a sawdaA'a","AboyaDo Aasowado","taHt fawq","","<ivom  bar~ ",">aviym  saliym ",">abadFA  >azal~a ","A^xir  >aw~al  saAbiq ","A^xar  >aw~al ",">ax~ara  qad~ama ","yasotaqodimu yasota>oxiru ",">aroD samaA^' ",">aSol >aSiyl bukorap ",">al~afa $at~aY` ",">amara nahaY` ","'aAmana kafara ",">amon xawof ",">ama`nat xiyaAnap ",">unvaY` *akar ","<ins jin~ ","<ins wH$ ",">aw~al A^xir ","","vbt   zAl zal~a zalaya","Aavobata   mHA mHw","vaqula   xaf~a","vqyl    xfyf","vwAb    E*Ab","jbr qdr","jdyd qdym","jazaEa Sabara","jz' kl","jalasa qaAma","jlw xfY","jamaEa far~aq","tjm~E tfr~q","AijotimAE Ainti$Ar","AijmAE AixtilAf","jin~ Ains","janafa Hanafa","jwE $bE","jwf mHd~b","jahara Aasar~","jahal Ealima","jAhl EAlm","mjhwl mErwf","HAA:","Hab~a karih","Hub~ bgD","Hdb mjwf","Hadava Eadama","Hdyv qdym","Har~ Zil~ ZlAl","Hr~k sakana rakada","Hrkt skwn","Har~am Hl~l Hl~","AiHrAm AHlAl","mHrwm mrzwq","Hazana fariHa","Hasana saA^'a","Hasuna qabuHa","AaHosana AasaA^'","Hasanap say~i}ap","HaDara bdw","HADr bAd gA}b","HafiZ nasiya","HfAZt AaDaAEa","HafiDha:","Haq~ bATl","Haq~ DlAl","Haqq:","Hal~a Eaqada","AaHal~a Hr~m","Hal~ala AaHorama","Hlm safira","Hamiyom gas~aAq","HyAt mwt","KHAA:","xabiyv Tay~ib","xaraba Eamara","xaraja daxala walaja","xasira rabiHa","xaf~a vafula","xfyf vqyl","xafaDa rafaEa","xfy badaA Ealan jal`Y","xalaSa xalaTa","xalafa salafa","AxtlAf AtfAq AjmAE","xlf qdAm","xwn AmAnt","xwf Amn","xyb AafolaHa","xyr $r~","","dubur qubul","AdbAr AqbAl","daxala xaraja","drjAt drkAt","dwrh dwlp","*akar nasiya","*akarN  >unvaY`","*al~ Eaz~a","A*l~ AEzn","*l*t Ez~t Ezyz","*am~a mzmt  Hmd mdH","rabiHa xasira","ryw >arobaY` maHaqa","rajaA rjw ya}isa","raHaba xasa>a","ra$ada gawaY`","ru$d gY~","raDiYa kariha","raDiya saxaTa","raTaba yabasa","ragaba rahoba","rafaEa xafaDa","rifq Eunof","raq~ riq~ap qasowp giloZap","rdH rwAH gdw gdwp","raHaba ragaba","zaAda naqaSa","AazodaAd AagaADa","zfyr $hyq","zalq vabata","zal~a vabata","Aasobaga qaSara","satar ka$af","sar~ faDaHa","sar~aA^' ba>osaA^'","Aasar~a AEln AZhr","saraEa baTala","srf AsrAf AqtAr","safira Halum","saEada $q`Y >a$oqaY","saEiyd $aqiY~u","sfl Asfl >aEolaY`","sufolY` ElyA","salof xalof","salama Aslm kafara","salAm hlAkt","smn smAn EjAf","smw smA' ArD","swd Aswd AbyD","sawdA' bayDA'","swg sAg gaS~a","AstwA' tfAwt","$_#m ymn mymnp","$at~a Aal~af","$itA' Sayf","$Ahd  gaA^}ib","$r~ xyr","Aa$raAr AbrAr","$rq Ai$rAq E$y~A","m$rq mgrb","$rqyp grbyp","$gl faraga","$q~Y sEyd","$iqwap sEAdt","$akar kafar","$mAl ymyn","$hyq zfyr","$hwl nfwr","SbH ASbH AmsA","Sabara jazaEa","Sadara warada","Sadaqa ka*iba","Sdyq Edw~","Sd~q ka*~b","SrSr smwm","SaEada nazala","SaEaqa AfAq","SAEiqh SAqEp","Sagara kabara","Sgyr kbyr Akbr","SgAr Ez~t","SalaHa qsd","AaSolaHa Aafosada","SAlH mfsd","Samata naTaqa","SwAb xaTa>a xaTa_#","Sayof $itA'","DaHik bakY`","Dr~ nfE","Dar~aA' sw~A'","DuEuf qw~t","DaEiyof qwY","Dl~ AihtdY","DlAl hdAyt","ADAE HafiZ","DAq raHub","","TlE grb","TwE kariha","AaTaAEa EaS`Y","Twl ErD","TwY na$ara","Tay~ib xabiyv","Zil~ ZlAl Hr~ Haruwr","Zalama Eadala","Zlmt nwr Zulum`t","Zahara baTan","ZAhr bATn","Ebd Hur~","Eijz qudrt","EijAf simAn","EjmY ErbY","Edl Zlm","Edm Hdv","Eaduw~ Sd~yq wlY","EdwAn tqw`Y","Earaja nazala","EaraDa Aakan~a","EaroD Twl","Erf nkr","AErf Ankr","Asm mErfp nkrh","mErwf mjhwl mnkr","Eusor yusor","E$y~FA gdw~ gdAp","ETw ETA` mnE","EqAb vwAb","Eaqada Hala","Eaqam laq~aH","Eqym lAqiH","Elm EAlm jhl jAhl","Ealana xfY Aasar~a","Elw AEl`Y Asfl","EuloyaA sufol`Y","AiEwijAj tqwym","garab TalaHa","magoribo ma$oriqo","garobiy~ap $aroqiy~ap","gdwp gdAp gdw rwAH E$yA","gas~aq Hmym","gaS~a saAga","galiyoz rafiyq","galqa fk~","Aagolaqa ftH wDwH","gaw`Y r$d","gY~ r$d","gwY~ r$yd","gyb gaAba HaDar $ahid","gyD gaADa AzdAd","","ftH Aagolaqa","ftH hzymp","ftq rataqa","frH Hazana","frE Asl","faraga $agal","fsd SlH","fSl wSl","AnfSAl At~SAl","fZ~ lyn","faqar ganY","flH AflH xAb","fnY` bqaY`","tfAwut AistwA'","fwq tHt","qbH Hasuna","qbD bsT","qabol baEod","qtr AsrAf","qadara basaTa","qudrt Eijz","qad~am Aax~r","Aistqdm AistAxr","qdym jdyd","qryb bEyd","qaswap riq~p","qaSara mad~a TAla","qaTaEa wasal","qaEad qAm","ql~ kasur","qlyl kvyr","qAm qEd jls","tqwym AiEwijAj","quw~t DuEf","","kbr kbyr Akbr Sgyr ASgr","katama AabodaA","kavur kvyr ql~ qlyl","k*b Sdq","ki*~aba Sid~aq","krm Aakorama AahaAna","k$f satara","kfr A`mn","kfr $kr","kul~ jz'","kAmil nAqiS","kn Akn~ AaEolana AaZohara EaraDa","kafara $akara","lqH Eaqama","layl nhAr","lyn fZ~","mHw mHA vbt","mHq rbY`","mad~a qaSara","mdH *am~a","msw Amsa AaSobh","mDY` Aistaqbl","malak b$r","mnE AiETA'","mwt HyAt","nvr nZm","nHs sEd","n*r n*yr b$yr","nzl Erj","nasiya *akara","nsyAn HfZ","n$r TwY","nTq Smt","niEom bi}os","naEmA' Dr~A'a ba>osaA^'","nafada bqY","nfwr $hwp","nfE Dr~","nfY vbt","nqS zAd","nqD Abrm","nkr Erf","AnkAr AqrAr","mnkr mErwf","nkrh mErfp","nwr Zulmat","nhAr lyl","nahaY` Aamara","wH$ Ains","warada Sadara","wrY wArY AabodaA","wSl fsl","wSl qTE","At~aSAl AnfSAl","wDE rfE","wfY` gdr","wqY tqw`Y EdwAn","wlAyt EdAwt","hjr waSal","hdY DlAl","Ahtd`Y Dl~","hzm ftH","hwn AahaAn Akrm","yAs rjA'","yaAbasa raTob","yusr Eusr","ymyn $imAl","yumn $_#m","mayomnp ma$_#amp","mymnp mysrp",
"batara bataka","baraza bariHa","tariba tarifa","jas~asa Has~asa","janafa Hanafa","Ha*~a HaD~a","HaSada xaDada","xalaSa xalaTa","daraja daraka","dawr dawl","rataqa fataqa","ragab rahab","saraAb $araAb","salof xalaf","saqaTa laqaTa","SalaHa TalaHa","faSama qaSama","qaT~a qad~a","nafoHap lafoHap","myl myd","naA$a naAla","haz~a ha$~a",
];


var _PDF = "<A HREF=http://ia600705.us.archive.org/12/items/BayyinahE-bookGemsCollection-Linguisticmiracle.com/near-synonyms-nouman-ali-khan-muslimmattersorg.pdf TARGET=_>Source: NearSynonyms PDF - Nouman Ali Khan</A><BR/>";
var NEAR_SYNONYMS_METADATA = {
	"0": {"topic": "The Sky", "page": 83, "info": true},		
	"1": {"topic": "God", "page": 818, "info": true },
	"2": {"topic": "One", "page": 138, "info": "aHad, waHiyd, fard, furādā different synonyms. <BR/><BR/>See related: <STRONG><A HREF=http://www.linguisticmiracle.com/gems/waheed TARGET=_>Gem/Linguistic miracle</A></STRONG><BR/><BR/> See entry: akeyla in below page. " },
	"3": {"topic": "Self-Sufficient", "page": 256, "info": "ghaniyy and Samad are synonyms.<BR/> See entry: beniyaaz in below page. " },
	"4": {"topic": "Not", "page": 862, "info": "lam laysa lan laa 'in maa hal balaa kallaa etc are some synonyms. lot more below.<BR/> See entry: naheen in below page. " },	
	"5": {"topic": "Begetting", "page": 396, "info": "walada and waḍaʿa are synonyms.<BR/> See entry: jann-naa in below page. " },
	"6": {"topic": "Become", "page": 900, "info": "kaana, aSbaHa, Sadara, aSdara, waqa3a are synonyms.<BR/> See entry: how-naa in below page. " },
	"7": {"topic": "Equal", "page": 890, "info": "Kufuw, qariyn, aTraab, samiyy, Saffa, Saaffaat, yuḍāhiūna. <BR/>See entry: hamhaa-hangiy hona in below page. " },	
	"8": {"topic": "Work/doing work", "info": true },
	"9": {"topic": "Praise & Thanks", "page": 347, "info": true},
	"11": {"topic":"human", "page": 71, "info":  true},
	"12": {"topic":"Go ahead", "page": 94, "info": true},	
	"13": {"topic":"noise", "page": 100, "info": true},	
	"14": {"topic":"Executing Authority", "page": 451, "info": true},
	"15": {"topic":"The Forbidden", "page": 446, "info": true},
	"16": {"topic":"To Guide & to be guided", "page": 883, "info": true},	
	"17": {"topic":"To recognize", "page": 296, "info": true},
	"18": {"topic":"To Purify", "page": 265, "info": true},
	"19": {"topic":"To feel bad", "page": 209, "info": true},	
	"20": {"topic":"Fear", "page": 518, "info": "Khawf Khashyah Khushoo' Taqwa Hadthr Raa'a Wajas Wajl Rahb Ru'b Shafaq Wajf. <BR/> See <A HREF=http://www.linguisticmiracle.com/gems/usage-of-fear-in-the-quran TARGET=_>Article</A> and entry for 'Darna' in the book below."},
	"21": {"topic":"Borrowing", "page": 127, "info": true},

	"22": {"topic":"Favors", "page": 124, "info": "faDlun manna an3ama aHsana. See: ihsaan karna."},
	"23": {"topic":"Lie", "page": 405, "info": "kazib (opposite: Sidqun). baaTil (opposite: Haqqun), zuwr, ifkun. See: jhuwt."},
	"24": {"topic":"Coming", "page": 97, "info": "jaa'a ataa hayta halumma ta3aala. See: aana."},
	"25": {"topic":"To send forward", "page": 95, "info": "qaddama aslafa. See: aage bhejna."},
	"26": {"topic":"Read & Recite", "page": 251, "info": "qara'a talaa rattala darasa amlaa. See: padhna, padhaana."},
	"27": {"topic":"Enemy, Enmity", "page": 481, "info": "3aduwwun baghDaa'u shaaniyyun. See: Dushman, dushmani."},
	"28": {"topic":"The heart, the chest & the self", "page": 483, "info": "qalb fu'ad Sadr nafs. See: Dil."},

	"29": {"topic": "Seeking protection", "page": 289, "info": "Ajaar and istijaar. Aa3aza and isti3aza. Panah dena, panah maangna." },
	"30": {"topic": "To nourish/bring up", "page": 279, "info": "Rabb. Parvarish karna." },
	"31": {"topic": "King", "page": 172, "info": "Malik. Badshahi." },
	"32": {"topic": "Evil", "page": 206, "info": "Shar. Burai." },
	"33": {"topic": "Whisperer", "page": 485, "info": "Waswaas. dil main baat daalna." },
	"34": {"topic": "One who withdraws", "page": 392, "info": "Khannas. Jinn. Also pg 326 'peeche ke doosre mustaqqaat'." },
	
	"35": {"topic": "Dawn", "page": 302, "info": "Falaq. Phaarna." },
	"36": {"topic": "Creator", "page": 327, "info": "Khalaq. peda karna." },
	"37": {"topic": "darkness", "page": 337, "info": "Ghaasiq. taareeki chaana." },
	"38": {"topic": "when", "page": 381, "info": "Iza." },
	"39": {"topic": "blowers", "page": 313, "info": "naffathaat. phoonkna." },
	
	"40": {"topic": "Perish", "page": 370, "info": "Tabbat. tootna. Also see pg 884, Halaakat." },
	"41": {"topic": "Flame", "page": 610, "info": "Lahab. Sho`la." },
	"42": {"topic": "to be of use/to avail", "page": 692, "info": "Aghna. kaam aana." },
	"43": {"topic": "to earn", "page": 706, "info": "kasab. kamaana." },
	"44": {"topic": "to enter", "page": 473, "info": "Yasla, daakhil hona" },
	"45": {"topic": "fire", "page": 85, "info": "Naaran, aag" },
	"46": {"topic": "owner/possessor of", "page": 873, "info": "Zaat (zu), waala" },
	"47": {"topic": "fuel/firewood", "page": 165, "info": "Hatab, eendhan. Also see pg 764, Lakri." },
	"48": {"topic": "neck", "page": 728, "info": "Jeed, gardan" },
	"49": {"topic": "rope", "page": 541, "info": "Habl, rassi. Masad, moonj ki rassi." },

	"50": {"topic": "to create", "page": 327, "info": true},
	"51": {"topic": "", "page": 1, "info": "" },
	};

var LITDEV_URL = "http://qurandev.github.com/widgets/literarydevices.html";
var AYAHS_METADATA = {
	"MIRACLES": {
		" 35:32 ": {
			"topic": "The letter Waaw in Faatir 35:32 has a right to be written in tears…",
			"url": "http://www.linguisticmiracle.com/gems/waaw"
		},
		" 79:40 74:53 106:4 36:11 35:28 23:1 23:2 79:9 2:197 9:64 11:74 11:70 20:67 8:2 16:51 59:13 8:12 18:18 52:26 42:22 79:8 24:52 ": {
			"topic": "Usage of 'Fear' in the Qur’an",
			"url": "http://www.linguisticmiracle.com/gems/usage-of-fear-in-the-quran"
		},
		" 2:23 9:64 9:86 9:124 9:127 10:38 11:13 24:1 47:20 ": { // suwrapN swrp. bakka:  bibak~apa bbkp  mak~apa mkp
			"topic": "Surah",
			"url": "http://www.linguisticmiracle.com/gems/surah"
		},
		
		" 74:3 36:40 ": {
			"topic": "Palindromes", 
			"url": "http://www.linguisticmiracle.com/gems/palindromes" 
		},

		" 105:1 90:4  -  18:6 18:8  19:77 19:80 6:94 74:11  - 37:96 2:186  4:85 40:40  82:10 82:11 82:12  22:74 22:75 22:78  26:106 26:176 26:177 7:85  33:4 17:23 30:21 57:20 36:68 33:13 - 81:5  2:257 47:11  57:15  4:13 4:14  3:170 76:11 28:76  53:11  39:71 39:74  43:79  3:96 3:97 48:24 42:7  2:34  4:92 4:93  12:4 12:5 12:6  15:39 15:40 ":{
			"topic": "Precise word selection",
			"url": "http://www.linguisticmiracle.com/gems/precise-word-selection"
		},

		" 26:80 15:9 42:43  94:5 94:6  14:7 2:1 ":{
			"topic": "Emphasises",
			"url": "http://www.linguisticmiracle.com/gems/emphasises"
		},

		" 33:24 2:286 42:43  91:5 91:6 92:3 41:39  3:134 3:136  1:5 10:1  19:2 19:32 19:33 19:34  17:1 18:1  40:49 42:45 39:15  2:143  6:151 17:31  10:84 5:72 ":{
			"topic": "Word placement",
			"url": "http://www.linguisticmiracle.com/gems/word-placement"
		},


		"  17:45 18:57 16:108 45:23 36:9  2:102 ": {
			"topic": "Supernatural",
			"url": "http://www.linguisticmiracle.com/gems/supernatural"
		},

		" 11:42 80:1 26:10 93:10 53:17 100:1 100:9 18:45 18:7 81:5 101:9 22:31 21:18 28:10   12:4  81:2 82:2  20:9 20:21  20:37 20:40 12:2 12:111 ":{
			"topic": "pictures",
			"url": "http://www.linguisticmiracle.com/gems/pictures"
		},
		
		" 93:2 100:2 78:14 80:33 20:120 69:27 91:14   56:4 79:6 79:7 20:120 99:1 ": {
			"topic": "Sounds [Onomatopoeia] in al-Qur'an",
			"url": "http://www.linguisticmiracle.com/gems/sounds"
		},		
		" 14:24 14:26 ": {
			"topic": "Tajweed Sounds",
			"url": "http://www.linguisticmiracle.com/gems/sounds"
		},

		"  11:90 85:14  2:31 2:33 2:34 2:35 2:37 3:33 3:59 5:27 7:11 7:19 7:26 7:27 7:31 7:35 7:172 17:61 17:70 18:50 19:58 20:115 20:116 210:117 20:120 20:121 36:60  3:144 33:40 47:2 48:29 61:6  19:8 ": {
			"topic": "Names",
			"url": "http://www.linguisticmiracle.com/gems/names"
		},
		"  30:12 6:44 23:77 30:49 43:75 2:34 7:11 15:31 15:32 17:61 18:50 20:116 26:95 34:20 38:74 38:75 " : {
			"topic": "Names - iblees",
			"url": "http://www.linguisticmiracle.com/gems/names"
		},
	},
	
	"LITERARY_DEVICES": {
		" 55:60 37:91 37:92 ": {
			"topic": "Rhetorical questions",
			"url": LITDEV_URL,
			"info": "This type of question is a figure of speech in the form of a question posed for its persuasive effect without the expectation of a reply (for example, Why me?). Rhetorical questions encourage the listener to think about what the (often obvious) answer to the question must be. When a speaker states, “How much longer must our people endure this injustice?”, no formal answer is expected. Rather, it is a device used by the speaker to assert or deny something. In the Qur’an, Allah uses rhetorical questions in many places, for example:\n\
\n\
'Is there any reward for good other than good?' Surah ar-Rahmaan (The Most Gracious) 55: 60.\n\
\n\
'Then he turned to their alihah (gods) and said: 'Will you not eat (of the offering before you)?' Surah as-Saaffaat (Those Ranged in Ranks) 37: 91.'"
		},
		" 54:13 6:127 ": {
			"topic": "Metonymy (kinayah)",
			"url": LITDEV_URL,
			"info": "This device is used in rhetoric in which a thing or concept is not called by its own name, but by the name of something intimately associated with that thing or concept. So for example in the following verse when describing the story of Prophet Noah (peace be upon him), the Arabic word for ark or ship is not in the verse but is implied by Allah’s mention of planks and nails:\n\
\n\
“And We carried him on a (ship) made of planks and nails” Surah al-Qamar (The Moon) 54: 13."
		},
		
		" 88:15 88:16 93:9 93:10 ": {
			"topic": "Analogy",
			"url": LITDEV_URL,
		},	
		" 33:71 77:20 ": {
			"topic": "Alliteration",
			"url": LITDEV_URL,
		},
		" 44:49 ": {
			"topic": "Antiphrasis",
			"url": LITDEV_URL,
		},
		" 35:7 9:82 ": {
			"topic": "Antithesis",
			"url": LITDEV_URL,
		},
		" 13:2 ": {
			"topic": "Asyndeton",
			"url": LITDEV_URL,
		},	
		" 88:25 88:26 88:14 88:15 ": {
			"topic": "Assonance",
			"url": LITDEV_URL,
		}, //cadence: present in whole quran
		" 3:27 ": {
			"topic": "Chiasmus",
			"url": LITDEV_URL,
		},
		" 94:5 94:6 ": {
			"topic": "Epizeuxis",
			"url": LITDEV_URL,
		},
		" 24:43 ": {
			"topic": "Equivoque",
			"url": LITDEV_URL,
		},
		" 2:14 2:15 3:54 ": {
			"topic": "Homynymy",
			"url": LITDEV_URL,
		},
		" 7:40 33:10 39:71 39:72 ": {
			"topic": "Hyperbole",
			"url": LITDEV_URL,
		},
		" 65:7 65:8 65:9 65:10 ": {
			"topic": "Isocolon",
			"url": LITDEV_URL,
		},
		" 19:4 21:18 ": {
			"topic": "Metaphor",
			"url": LITDEV_URL,
		},
		" 54:13 6:127 ": {
			"topic": "Metonymy",
			"url": LITDEV_URL,
		},
		" 7:42 4:73 ": {
			"topic": "Parenthesis / Hazaf(?)",
			"url": LITDEV_URL,
		},
		" 80:25 80:26 ": {
			"topic": "Polypton",
			"url": LITDEV_URL,
		},
		" 29:62 3:92 ": {
			"topic": "Stress",
			"url": LITDEV_URL,
		},
		" 90:12 90:13 ": {
			"topic": "Synedoche",
			"url": LITDEV_URL,
		}, /*
		"  ": {
			"topic": "",
			"url": LITDEV_URL,
		},
		"  ": {
			"topic": "",
			"url": LITDEV_URL,
		},
		"  ": {
			"topic": "",
			"url": LITDEV_URL,
		},
		"  ": {
			"topic": "",
			"url": LITDEV_URL,
		},
		"  ": {
			"topic": "",
			"url": LITDEV_URL,
		},*/
	}
}
	
var offlinesearch = function(keyword){
		var results = {}, title='', mixMode=false, arrMode=false, engMode=false, transMode=false;
		var keyword1, keyword2, keyword3, keyword4, keyword5,  word=keyword;
		if(!arrMode && !engMode) transMode=true;
mixMode = arrMode = engMode = transMode = true;
keyword1 = keyword2 = keyword3 = keyword4 = keyword5 = keyword;
		if(mixMode){
			title='mix';
			regexp = new RegExp(".*(?:" + escapeForRegex(word=keyword1) + ").*", "g");
			results[title] = search2(word, regexp); //COST=profile(title,0,true); results[title+'COST'] = COST;
			//console.log( results[title] );//UI_displaySearchHits(title, word, results, COST);
			if(results[title]){ var refs = '';
				console.log( results[title].length + ' hits for keyword: ' + keyword);
				$.each(results[title], function(a, hit){
					refs += ( hit ? hit.split('|')[0] : '-') + '; ';
				});
				UIdisplayResults(refs, 'Search results for keyword: ' + keyword); console.log(refs);
			}else{ UIdisplayResults(null, 'No search results for keyword: ' + keyword); console.log( 'no hits for keyword: ' + keyword ); }
		}
return;
		if(arrMode || engMode){ transMode = true;
			title='arabic';
			regexp = new RegExp(".*(?:" + escapeForRegex(word=keyword1) + ").*", "g");
			results[title] = search2(word, regexp, qBare); //COST=profile(title,0,true); results[title+'COST'] = COST;
			console.log( results );//UI_displaySearchHits(title, word, results, COST);
		}
		
		if(arrMode || engMode){
			title = 'arabicBuckTranslit';
			regexp = new RegExp(".*(?:" + escapeForRegex(word=keyword2) + ").*", "g");
			results[title] = search2(word, regexp, qBuck); //COST=profile(title,0,true); results[title+'COST'] = COST;
			console.log( results );//UI_displaySearchHits(title, word, results, COST);
		}		
return;
		if(transMode && keyword.length < 3) transMode=false;
		if(transMode){
			title='translation';
			regexp = new RegExp(".*(?:" + escapeForRegex(word=keyword3) + ").*", "gi");
			results[title] = searchTrans(word, regexp); //COST=profile(title,0,true); results[title+'COST'] = COST;
			UI_displaySearchHits(title, word, results,COST);
		}
}

var UIlinkifySearchResult = function(ref){
	var TEMPLATE = '<A HREF=#!/quran-corpus/$1>$2</A>';
	return TEMPLATE.replace(/\$1/, ref).replace(/\$2/, ref);
}

var UIdisplayResults = function(refs, msg){
	var html = '';
	if(refs){
		$.each(refs.split('; '), function(a, ref){
			html += (a+1) + ') ' + UIlinkifySearchResult(ref) + '<BR/>';
		});
		html = '<div style=max-height:400px;overflow:scroll;>' + html + '</div';
	}
	$.blockUI({
					message: '<BR/><h3>' + msg + '</h3><div style=font-size:3em;text-align:left;>' + html + '</div>',
					css: { height: '500px', width: '800px', top: '20%' }
				});  $('.blockOverlay').attr('title','Click to unblock').click($.unblockUI); //ui-tooltip-content
}

		var qBuck, qBare2, qBuck2, RESET=false, qBare, qBareArr, qBare2, qBuck2, percentComplete = -1;
var _bPROFILE_SEARCH = false;
		var search2 = function(word, regexp, DATA){ var results;
			if(gq.loadedPercent != 100){
				alert('Searching on partial data only ' + gq.loadedPercent + '%');
			}
			else if(gq.loadedPercent == 0){ alert('data yet to be loaded'); return; }
			if(percentComplete != gq.loadedPercent){
				qBuck = gq.strings.join('\n');
				qBuck2 = _prefixData( qBuck );
				percentComplete = gq.loadedPercent;
			}
			
		  if(!DATA) DATA = qBuck;
		  //if(qBare == null)		qBare = BuckToBare(qBuck);
		  //if(qBareArr == null)	qBareArr = qBare.split(/\r?\n/);
		  //if(!qBare2 || RESET){ qBare2 = _prefixData( qBare ); RESET=false;}
		  if(!qBuck2 || RESET){ qBuck2 = _prefixData( qBuck ); RESET=false;}
		  if(DATA == qBuck) results = qBuck2.match(regexp);
		  //else if(DATA == qBare) results = qBare2.match(regexp);
		  //if(!results){if(_bPROFILE_SEARCH) _log('no hits');}else{ if(_bPROFILE_SEARCH) _log(results.length + ' hits');}
		  return results;
		}

		var _prefixData = function(DATA){  if(!DATA) return;
		   var ARRAY = DATA.split('\n'), SEP='|'; //TODO: split using a regex, to account for /r/n
		   for(var n=0; n<ARRAY.length; ++n){
			 ARRAY[n] = mapLinenoToRef(n, SEP) + '|' + ARRAY[n];
		   } /*console.log( ARRAY );*/
		   return ARRAY.join('\n');
		}

		var mapLinenoToRef = function(lineno){
			var obj = Quran.ayah.fromVerse(lineno);
			return obj.surah +':'+ obj.ayah;
		}

//KNOWN ISSUES:  For LemmaCountTillRef, check 2:228:22 (says 7 occurences. only 6 in corpus). 

/*Miracles:   http://www.linguisticmiracle.com/
1 gems/waheed
2 gems/palindrome gems/floating
3 
4 gems/the-companions-of-elephant
*/