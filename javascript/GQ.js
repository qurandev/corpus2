/**
 * Global Quran object to navigate through quran.
 * @author Basit (i@basit.me || http://Basit.me)
 *
 * Online Quran Project
 * http://GlobalQuran.com/
 *
 * Copyright 2011, imegah.com
 * Simple Public License (Simple-2.0)
 * http://www.opensource.org/licenses/Simple-2.0
 * 
 */
var gq = {
	
	apiURL: 'http://api.globalquran.com/',
	noData: false, // switch to true, if you want to have audio only.
	
	googleAnalyticsID: '',
	
	/**
	 * object contains selected page info
	 */
	settings: {
		ayah: 1,
		surah: 1,
		page: 0,
		juz: 0,
		selectedBy: null,
		selectedLanguage: null,
		selectedSearchBy: null,		
		
		selectedRecitor: null,
		selectedLastRecitorBytes: '',
		playing: true,
		volume: 100,
		muted: false,
		repeat: false,
		repeatEach: 'ayah',
		repeatTimes: 0,
		audioDelay: 0,
		
		showAlef: true,
		showSigns: true,
		ignoreInternalSigns: false,
		
		wbwDirection: 'arabic2english', // if change, then it will be english2arabic
		wbwMouseOver: false,
		
		font: 'auto',
		fontSize: 'medium',
		
		fullScreen: false,
		view: ''
	},
	
	_gaID: 'UA-1019966-3',
	
	
	/**
	 * caching all the data here
	 */
	data: {
		loaded: false,
		ayahList: {},
		quranList: {},
		quran: {},		
		languageCountryList: {},
		languageList: {},		
		search: {}
	},
	
	/**
	 * initial load 
	 */
	init: function () {
		Quran.init();
		
		for (var i in Quran._data.UGroups)
	        Quran._data.UGroups[i] = this.quran.parse.regTrans(Quran._data.UGroups[i]);
		
		this.googleAnalytics();
	},
	
	/**
	 * language object holds all the site languages
	 * TODO still need to add more functoins here
	 */
	language: {
		
		load: function () {},
		
		list: function ()
		{
			return gq.data.languageList;
		},
		
		countryList: function ()
		{
			return gq.data.languageCountryList;
		},
		
		selected: function ()
		{
			return gq.settings.selectedLanguage;
		}
	},
	
	/**
	 * quran object
	 */
	quran: {
		
		init: function ()
		{
			if (gq.settings.selectedBy && typeof(gq.settings.selectedBy) == 'object' && this.length() > 0)
				return false;
			
			//backward compatibility
			if (gq.settings.selectedBy && typeof(gq.settings.selectedBy) != 'object')
			{
				by = gq.settings.selectedBy;
				gq.quran.reset();
				var selectedArray = by.split('|');
				$.each(selectedArray, function(a, quranBy) {
					gq.quran.add(quranBy);					
				});
			}
			else
				gq.quran.reset();
		},
		
		load: function () {
			gq.load(gq.settings.surah, gq.settings.ayah);
		},
		
		text: function ()
		{
			var text = {};
			var selected = this.selected();
			var fromVerseNo = Quran.verseNo.page(gq.settings.page);
			var toVerseNo = Quran.verseNo.page(gq.settings.page+1)-1;

			if (typeof selected == 'object')
			{					
				$.each(selected, function(a, quranBy) {
					text[quranBy] = {};
					for (var i = fromVerseNo; i <= toVerseNo; i++)
					{
						if (gq.data.quran[quranBy])
							text[quranBy][i] = gq.data.quran[quranBy][i];
						else
						{
							gq.quran.remove(quranBy);
							gq._gaqPush(['_trackEvent', 'Text', 'Error::`'+quranBy+'` not loaded in text']);
						}
					}
				});
			}
			
			return text;
		},
		
		textNotCached: function ()
		{
			var notCached = [];
			var selected = this.selected();
			var fromVerseNo = Quran.verseNo.page(gq.settings.page);
					
			$.each(selected, function(i, quranBy) {

				if (gq.data.quran[quranBy])
				{	
					if (!gq.data.quran[quranBy][fromVerseNo])
						notCached.push(quranBy);		
				}
				else
					notCached.push(quranBy);	
			});
			
			return notCached.join('|');
		},
		
		list: function (format)
		{
			if (!format)
				return gq.data.quranList;
			else
			{
				list = {};
				$.each(gq.data.quranList, function(i, info) {
					if (format == info['format'])
						list[i] = info;
				});
				
				return list;
			}
		},
		
		detail: function (by)
		{
			return this.list()[by];
		},
		
		direction: function (by)
		{
			if (by == 'quran-wordbyword')
				return (gq.settings.wbwDirection == 'arabic2english') ? 'right' : 'left';
			else if (by == 'quran-kids')
				return (gq.settings.wbwDirection == 'arabic2english') ? 'right' : 'left';
			
			languageCode = this.detail(by).language_code;
			return  (typeof(gq.language.list()[languageCode]) !== 'undefined') ? gq.language.list()[languageCode].dir : 'left';
		},
		
		selected: function ()
		{
			return gq.settings.selectedBy;
		},
		
		selectedString: function ()
		{
			var by = [];
			var selected = this.selected();
					
			$.each(selected, function(i, quranBy) {
				by.push(quranBy);	
			});
			
			return by.join('|');
		},
		
		reset: function ()
		{
			gq.settings.selectedBy = {};
			gq.save();
		},
		
		length: function ()
		{
			if (!gq.settings.selectedBy || typeof(gq.settings.selectedBy) != 'object')
				return 0;
			
			return Object.keys(gq.settings.selectedBy).length;
		},
		
		isSelected: function (quranBy)
		{
			return gq.settings.selectedBy[quranBy] ? true : false;
		},
		
		add: function (quranBy)
		{
			gq.settings.selectedBy[quranBy] = quranBy;
			gq.save();
		},
		
		remove: function (quranBy)
		{
			delete gq.settings.selectedBy[quranBy];
			gq.save();
		},
		
		parse: {
			
			load: function (quranBy, text, value)
			{	
				type = gq.data.quranList[quranBy].type;
				
				if (type == 'quran' && /tajweed/.test(quranBy))
					return this.parseTajweed(quranBy, text);
				else if (type == 'quran' && /wordbyword/.test(quranBy))
					return this.parseWordByWord(quranBy, text, value);
				else if (type == 'quran' && /kids/.test(quranBy))
					return this.parseKidsWordByWord(quranBy, text, value);
				else if (type == 'quran' && /corpus/.test(quranBy))
					return this.parseCorpus(quranBy, text, value);
				else if (type == 'quran')
					return this.parseQuran(quranBy, text);
				else
					return this.parseTranslation(quranBy, text);
			},
			
			parseQuran: function (quranBy, text)
			{
				if (gq.settings.showSigns)
			    {
			        text = this.pregReplace(' ([$HIGH_SALA-$HIGH_SEEN])', '<span class="sign">&nbsp;$1</span>', text);
			        text = this.pregReplace('($SAJDAH)', gq.settings.ignoreInternalSigns ? '' : '<span class="internal-sign">$1</span>', text);
			        text = this.pregReplace('$RUB_EL_HIZB', gq.settings.ignoreInternalSigns ? '' : '<span class="icon juz-sign"></span>', text);
			    }
			    else
			    	text = this.pregReplace('[$HIGH_SALA-$RUB_EL_HIZB$SAJDAH]', '', text);
			    
			    if (!gq.settings.showAlef)
			    	text = this.pregReplace('$SUPERSCRIPT_ALEF', '', text);
			    
			    if (gq.settings.font == 'me_quran')
			    {
			        text = this.addSpaceTatweel(text);
			        text = this.pregReplace('($LAM$HARAKA*)$TATWEEL$HAMZA_ABOVE($HARAKA*$ALEF)', '$1$HAMZA$2', text);
			    }
			    else if (/uthmani/.test(quranBy))
			    {
			        text = this.removeExtraMeems(text);
			    }
			    
			    text = this.addTatweel(text);
			    text = this.pregReplace('$ALEF$MADDA', '$ALEF_WITH_MADDA_ABOVE', text);
			    
			    if (gq.settings.font != 'me_quran')
			    {
			        text = this.pregReplace('($SHADDA)([$KASRA$KASRATAN])', '$2$1', text);
			        text = this.pregReplace('($LAM$HARAKA*$LAM$HARAKA*)($HEH)', '$1$TATWEEL$2', text);
			    }
			    
			    return text;
			},
			
			parseWordByWord: function (quranBy, text, value)
			{
				var words = text.split('$');
				var verse_html = '';
				$.each(words, function(i, verse) {
					if (verse)
					{
						var verse = verse.split('|');
					    var ref, refHtml=''; if(value && value.surah && value.ayah) ref = (value?value.surah:'?') +':'+ (value?value.ayah:'?') + ':'+ (1+i);
						var urlTemplate = '<A HREF=\'http://corpus.quran.com/wordmorphology.jsp?location=($1)\' target=_>$1</A>'; 
						if(ref) refHtml = ' title="<span color=green class=corpusref>' + urlTemplate.replace(/\$1/g, ref) + '</span>" ';
						
						if (gq.settings.wbwDirection == 'english2arabic')
						{
							if (gq.settings.wbwMouseOver)
								verse_html += '<span class="word"><span class="en tipsWord" title="'+verse[0]+'">'+verse[1]+'</span></span>';
							else
								verse_html += '<span class="word staticWord"><span class="en first ltr" dir="ltr">'+verse[1]+'</span><span class="ar quranText second rtl" dir="rtl">'+verse[0]+'</span></span>';
						}
						else
						{
							if (gq.settings.wbwMouseOver)
								verse_html += '<span class="word"><span class="ar quranText tipsWord" title="'+verse[1]+'">'+verse[0]+'</span></span>';
							else
								verse_html   += '<span class="word staticWord"><span class="ar quranText top first rtl tipsWord tipsGrmr" dir="rtl" ' + refHtml + '>'+ verse[0]+'</span><span class="en second ltr" dir="ltr">'+verse[1]+'</span></span>';
						}
					}
				});
				
				return verse_html;
			},


			parseCorpus: function (quranBy, text, value)
			{
				var SEP = '|,', SEP2 = '|;', SEP0 = ' ', words;
				SEP = '⚓'; SEP2 = '★'; if(!text){	gq.custom.blockui();
													console.log('no data ' + value.surah +':'+ value.ayah); if(text!="") debugger;};
				if(text.indexOf(SEP2) != -1) 
					words = text.split( SEP2 ); 
				else words = text.split( SEP0 ); 
				var verse_html = '', verse_template='', verse_template_mouseover=''; var unicodeSupported = true, isTablet = false;
				var REFURL = "<A HREF='http://corpus.quran.com/wordmorphology.jsp?location=($1)' TARGET=_>$1</A>";

				$.each(words, function(i, verse) {
					if (verse){
						var verse = verse.split( SEP );
					    var ref = (value?value.surah:'?') +':'+ (value?value.ayah:'?') + ':'+ (1+i);
						var refPOS='', corpus, token1, token2, token2Esc, token3, token3_1, tooltip='';
						var wordImageLink = '<span class=wordimage><img src2=http://corpus.quran.com/wordimage?id=$1 ></img></span>';
						wordImageLink = wordImageLink.replace( /\$1/, 1 + Quran.word.number(value.surah, value.ayah, i));
						token1 = EnToAr( verse[0] ); if(isTablet) token1 = wordImageLink;
						token2 = verse[1] ? verse[1] : '-';
						token3 = verse[2] ? UI_grammarEscape( verse[2] ) : '-'; 
						token3_1 = verse[2] ? UI_grammarEscapeUIFriendly( verse[2] ) : '-'; 
						///UNCOMMENT THIS IF U WANT IMAGE SIDE BY SIDE FOR VERIFICATION/// 
						//token1 += wordImageLink;
						if(!verse[1]) token1 = token2 = token3 = verse[0];
						if(verse[2])
							refPOS = $.trim( verse[2].split('|')[0] );
						token2Esc = encodeURIComponent(token2);
						tooltip = '<span class=hotlink grmr><span class=arr>$TOKEN1</span>&nbsp;&nbsp;<span class=w2w>$TOKEN2ESC</span>&nbsp;'+
									'<span class=ref style=font-size:0.7em;color:blue;>' + REFURL.replace(/\$1/g, ref) +
									'&nbsp;</span>&nbsp;&nbsp;<IMG class=MOREINFO src=images/info.png></img><br/>' +
								  '<span class=grammar style=font-size:0.5em; data='+ token3 + ' >' + ( token3_1 ) + /*wordImageLink +*/ '</span></span>';

						verse_template_mouseover = '<span class="word"><span class="ar quranText lineheight tipsWord POS-$POS" title="$TOOLTIP">$TOKEN1</span></span>';
						verse_template = '<span class="word staticWord">' +
											'<span class="ar quranText top first rtl tipsWord POS-$POS" dir="rtl" title="$TOOLTIP" >$TOKEN1</span>'+  //data-tips-position="bottom center" data-tips-dynamic="true"
											'<span class="en second ltr" dir="ltr" style="font-size:0.5em;" >$TOKEN2</span></span>';
						if (gq.settings.wbwDirection == 'english2arabic'){
							if (gq.settings.wbwMouseOver)
								verse_html += '<span dir=ltr class="word"><span class="en tipsWord" title="'+ token1 +'">'+ token2 +'</span></span>';
							else
								verse_html += '<span class="word staticWord"><span class="en first ltr" dir="ltr">'+ token2 +'</span><span class="ar quranText second rtl" dir="rtl">'+ token1 +'</span></span>';
						}
						else{
							if (!gq.settings.wbwMouseOver)
								verse_html += verse_template_mouseover.replace(/\$TOOLTIP/, tooltip).replace(/\$TOKEN1/g, token1).replace(/\$TOKEN2ESC/g, token2Esc).replace(/\$TOKEN2/g, token2).replace(/\$POS/g, refPOS);
							else //*** THIS IS THE TYPICAL CASE BELOW.
								verse_html += verse_template.replace(/\$TOOLTIP/, tooltip).replace(/\$TOKEN1/g, token1).replace(/\$TOKEN2ESC/g, token2Esc).replace(/\$TOKEN2/g, token2).replace(/\$POS/g, refPOS);
						}
					}
				});
				return verse_html;
			},
			
			

			
			parseKidsWordByWord: function (quranBy, text, value)
			{
				var words = text.split('$');
				var verse_html = '';
				var color = this._color;
				$.each(words, function(i, verse) {
					if (verse)
					{
						var verse = verse.split('|');
					    
						if (gq.settings.wbwDirection == 'english2arabic')
						{
							if (gq.settings.wbwMouseOver)
								verse_html += '<span class="word wordColor'+color+'"><span class="en tipsWord" title="'+verse[0]+'">'+verse[1]+'</span></span>';
							else
								verse_html += '<span class="word wordColor'+color+' staticWord"><span class="en first ltr" dir="ltr">'+verse[1]+'</span><span class="ar quranText second rtl" dir="rtl">'+verse[0]+'</span></span>';
						}
						else
						{
							if (gq.settings.wbwMouseOver)
								verse_html += '<span class="word wordColor'+color+'"><span class="ar quranText tipsWord" title="'+verse[1]+'">'+verse[0]+'</span></span>';
							else
								verse_html += '<span class="word wordColor'+color+' staticWord"><span class="ar quranText top first rtl" dir="rtl">'+verse[0]+'</span><span class="en second ltr" dir="ltr">'+verse[1]+'</span></span>'; 
						}
					}
					
					if (color == 10)
						color = 1;
					++color;
				});
				
				this._color = color;
				
				return verse_html;
			},
			_color: 1,
			
			parseTajweed: function (quranBy, text)
			{
				return text.replace(/\[h/g, '<span class="ham_wasl" title="Hamzat Wasl" alt="').replace(/\[s/g, '<span class="slnt" title="Silent" alt="').replace(/\[l/g, '<span class="slnt" title="Lam Shamsiyyah" alt="').replace(/\[n/g, '<span class="madda_normal" title="Normal Prolongation: 2 Vowels" alt="').replace(/\[p/g, '<span class="madda_permissible" title="Permissible Prolongation: 2, 4, 6 Vowels" alt="').replace(/\[m/g, '<span class="madda_necessary" title="Necessary Prolongation: 6 Vowels" alt="').replace(/\[q/g, '<span class="qlq" title="Qalqalah" alt="').replace(/\[o/g, '<span class="madda_obligatory" title="Obligatory Prolongation: 4-5 Vowels" alt="').replace(/\[c/g, '<span class="ikhf_shfw" title="Ikhfa\' Shafawi - With Meem" alt="').replace(/\[f/g, '<span class="ikhf" title="Ikhfa\'" alt="').replace(/\[w/g, '<span class="idghm_shfw" title="Idgham Shafawi - With Meem" alt="').replace(/\[i/g, '<span class="iqlb" title="Iqlab" alt="').replace(/\[a/g, '<span class="idgh_ghn" title="Idgham - With Ghunnah" alt="').replace(/\[u/g, '<span class="idgh_w_ghn" title="Idgham - Without Ghunnah" alt="').replace(/\[d/g, '<span class="idgh_mus" title="Idgham - Mutajanisayn" alt="').replace(/\[b/g, '<span class="idgh_mus" title="Idgham - Mutaqaribayn" alt="').replace(/\[g/g, '<span class="ghn" title="Ghunnah: 2 Vowels" alt="').replace(/\[/g, '" >').replace(/\]/g, '</span>');
			},
			
			parseTranslation: function (quranBy, text)
			{
				text = text.replace(/\]\]/g, '$').replace(/ *\[\[[^$]*\$/g, '');
				return text;
			},
		
			addSpaceTatweel: function (text)
			{
			    text = this.pregReplace('($SHADDA|$FATHA)($SUPERSCRIPT_ALEF)', '$1$TATWEEL$2', text);
			    text = this.pregReplace('([$HAMZA$DAL-$ZAIN$WAW][$SHADDA$FATHA]*)$TATWEEL($SUPERSCRIPT_ALEF)', '$1$ZWNJ$2', text);
			    return text;
			},
			
			addTatweel: function (text)
			{
			    text = this.pregReplace('($SHADDA|$FATHA)($SUPERSCRIPT_ALEF)', '$1$TATWEEL$2', text);
			    text = this.pregReplace('([$HAMZA$DAL-$ZAIN$WAW][$SHADDA$FATHA]*)$TATWEEL($SUPERSCRIPT_ALEF)', '$1$2', text);
			    return text;
			},
			
			removeExtraMeems: function (text)
			{
			    text = this.pregReplace('([$FATHATAN$DAMMATAN])$LOW_MEEM', '$1', text);
			    text = this.pregReplace('($KASRATAN)$HIGH_MEEM', '$1', text);
			    return text;
			},
			
			highlight: function (pattern, str)
			{
			    pattern = new RegExp('(' + pattern + ')', 'g');
			    str = str.replace(pattern, '◄$1►');
			    str = str.replace(/◄\s/g, ' ◄').replace(/\s►/g, '► ');
			    str = str.replace(/([^\s]*)◄/g, '◄$1').replace(/►([^\s]*)/g, '$1►');
			    
			    while (/◄[^\s]*◄/.test(str))
			    	str = str.replace(/(◄[^\s]*)◄/g, '$1').replace(/►([^\s]*►)/g, '$1');
			    
			    str = str.replace(/◄/g, '<span class="highlight">').replace(/►/g, '</span>');
			    return str;
			},
			
			pregReplace: function (fromExp, toExp, str)
			{
			    fromExp = new RegExp(this.regTrans(fromExp), 'g');
			    toExp = this.regTrans(toExp);
			    return str.replace(fromExp, toExp);
			},
			
			regTrans: function (str) {
			    return str.replace(/\$([A-Z_]+)/g, function (s, i, ofs, all) {
			        return Quran._data.UGroups[i] || Quran._data.UChars[i] || '';
			    });
			}
		}
	},
	
	search: {
		
		_keyword: '',
		_position: 0,
		_positionStartVerse: 0,
		_loading: false,
		
		init: function ()
		{
			if (gq.settings.selectedSearchBy && typeof(gq.settings.selectedSearchBy) == 'object' && Object.keys(gq.settings.selectedSearchBy).length > 0)
				return false;
			
			gq.settings.selectedSearchBy = {};
			
			by = gq.quran.list('text');
			$.each(by, function(quranBy, detail)
			{
				if (detail.type == 'quran')
					gq.search.addQuranBy(quranBy);
				else if (gq.data.languageCountryList[quranBy.language_code])
					gq.search.addQuranBy(quranBy);
			});
		},
		
		isActive: function ()
		{
			return (this._keyword != '');
		},
		
		load: function (keyword, more)
		{
			if (more && !this.isNext())
				return false;
			
			if (/^[0-9]+:?[0-9]*$/.test(keyword))
			{
				verse = keyword.split(':');
				
				if (verse.length > 1)
				{
					gq.settings.surah = Quran._fixSurahNum(parseInt(verse['0']));
					gq.settings.ayah = Quran._fixAyahNum(gq.settings.surah, parseInt(verse['1']));
				}
				else
				{
					verse = Quran.ayah.fromPage(keyword);
					gq.settings.surah = verse.surah;
					gq.settings.ayah = verse.ayah;
				}
				
				gq.player.reset();
				gq.load(gq.settings.surah, gq.settings.ayah);
				
				return true;
			}				
						
			this._keyword = keyword;
			this._position = more ? this.next() : 0;
			this._loading = true;
			gq.load();
		},
		
		loading: function (set)
		{
			if (typeof set != 'undefined')
				this._loading = set;
			
			return this._loading;
		},
			
		stop: function ()
		{
			this._keyword = '';
			this._position = 0;
			gq.load(gq.surah(), gq.ayah());
		},
		
		text: function ()
		{
			return gq.data.search.quran;
		},
		
		keyword: function ()
		{
			return this._keyword;
		},
		
		position: function ()
		{
			return this._position;
		},
		
		isNext: function ()
		{
			return gq.data.search.paging.next ? true : false;
		},
		
		next: function ()
		{
			return gq.data.search.paging.next;
		},
		
		timeTook: function ()
		{
			return gq.data.search.timeTook;
		},
		
		totalRows: function ()
		{
			return gq.data.search.paging.total_rows;
		},
		
		totalShowing: function ()
		{
			return this.isNext() ? this.next() : this.totalRows; 
		},
		
		selected: function ()
		{
			return gq.settings.selectedSearchBy;
		},
				
		isSelected: function (quranBy)
		{
			return gq.settings.selectedSearchBy[quranBy] ? true : false;
		},
		
		addQuranBy: function (quranBy)
		{
			gq.settings.selectedSearchBy[quranBy] = quranBy;
			gq.save();
		},
		
		removeQuranBy: function (quranBy)
		{
			delete gq.settings.selectedSearchBy[quranBy];
			gq.save();
		},
		
		beginVerse: function ()
		{
			return this._positionStartVerse;
		}
	},
	
	recitor: {
		
		init: function()
		{
			if (gq.settings.selectedRecitor && typeof(gq.settings.selectedRecitor) == 'object' && this.length() > 0)
			{
				gq.recitor.remove('auto'); // incase it was added
				return false;
			}
			
			//backward compatibility
			if (gq.settings.selectedRecitor && typeof(gq.settings.selectedRecitor) != 'object')
			{
				by = gq.settings.selectedRecitor;
				this.reset();
				var selectedArray = by.split('|');
				$.each(selectedArray, function(a, quranBy) {
					if (quranBy != 'auto')
						gq.recitor.add(quranBy);					
				});
			}
			else
				this.reset();
		},
		
		load: function ()
		{
			gq.player.load('new');
		},
		
		list: function()
		{
			return gq.quran.list('audio');
		},
		
		bitrateList: function (by)
		{			
			row = gq.quran.detail(by);
			
			if (!row)
				return {'auto': 'mp3,ogg'};
					
			media = row.media;
			media = media ? $.parseJSON(media) : {};
			
			bitrate = {'auto': 'mp3,ogg'};
			$.each(media, function (id, mediaRow) {
				if (bitrate[mediaRow.kbs])
					bitrate[mediaRow.kbs] += ','+mediaRow.type;
				else
					bitrate[mediaRow.kbs] = mediaRow.type;
			});
			
			return bitrate;
		},
		
		selected: function ()
		{
			return gq.settings.selectedRecitor;
		},
		
		selectedKbs: function (quranBy)
		{
			return gq.settings.selectedRecitor[quranBy];
		},
		
		reset: function ()
		{
			gq.settings.selectedRecitor = {};
			gq.save();
		},
		
		length: function ()
		{
			if (!gq.settings.selectedRecitor || typeof(gq.settings.selectedRecitor) != 'object')
				return 0;
			
			return Object.keys(gq.settings.selectedRecitor).length;
		},
		
		isSelected: function (quranBy)
		{			
			return gq.settings.selectedRecitor[quranBy] ? true : false;
		},
		
		add: function (quranBy, kbs)
		{	
			if (kbs)
				gq.settings.selectedLastRecitorBytes = kbs;
			
			gq.settings.selectedRecitor[quranBy] = kbs || 'auto';
			gq.save();
		},
		
		remove: function (quranBy)
		{
			delete gq.settings.selectedRecitor[quranBy];
			gq.save();
		}		
	},
	
	player: {
		off: false,
		id: '#audioPlayer',
		id2: '#audioPlayer2',
		swfPath: 'http://globalquran.com/images',
		audioPath: 'http://audio.globalquran.com/',
		preload: true, // true (two players playing continuesly), false (play with one and load with one) or -1 (just play only, no preload)
		autoBitrate: 'high', // high, low
		_recitor: {},
		_currentPlayer: 0,
		_i: 0, // repeat counter
		_iBug: 0, // for OS bug, triggers pause two times, need second trigger and ignore first
		_delayID: '',
		
		/**
		 * jplayer settings object, you can replace the methods in it, for customization calls
		 */
		setting: {
			supplied: 'mp3,oga,m4v', // m4v is required here, but not required on files
			wmode: "window",
			preload: 'auto',
			cssSelectorAncestor: '',
			cssSelector: {
		        play: "",
		        pause: "",
		        stop: "",
		        seekBar: "",
		        playBar: "",
		        mute: "",
		        unmute: "",
		        volumeBar: "",
		        volumeBarValue: "",
		        currentTime: "",
		        duration: ""
		      },
			size: {
			  width:"0px",
			  height: "0px",
			  cssClass: ""
			},
			ready: function (event)
			{
				gq.player.load('new'); // already getting load from recitation change
			},				
			ended: function (event)
			{		
				if (!gq.player.isOS())
				{
					if (gq.settings.audioDelay && (gq.settings.audioDelay > 0 || gq.settings.audioDelay != false))
					{
						var delay = (gq.settings.audioDelay == 'ayah') ? event.jPlayer.status.duration : gq.settings.audioDelay;
						delay = delay * 1000;
						clearTimeout(gq.player._delayID);
						gq.player._delayID = setTimeout('gq.player.next()', delay);
					}
					else
					{					        
						gq.player.next();
					}
				}
				
				$('.buffer').css('width', '0%');
			},
			loadstart: function (event)
			{
				if (gq.player.status().seekPercent != 100)
				{
					$(".progressBar").addClass("audioLoading");
				}
			},
			loadeddata: function (event)
			{
				$(".progressBar").removeClass("audioLoading");
				gq._gaqPush(['_trackEvent', 'Audio', 'load', event.jPlayer.status.src]);
			},
			seeking: function()
			{
				$(".progressBar").addClass("audioLoading");
			},
			seeked: function()
			{
				$(".progressBar").removeClass("audioLoading");
			},
			progress: function (event)
			{
				var percent = 0;
				var audio = gq.player.data().htmlElement.audio;
				
				if((typeof audio.buffered === "object") && (audio.buffered.length > 0))
				{
					if(audio.duration > 0)
					{
						var bufferTime = 0;
						for(var i = 0; i < audio.buffered.length; i++)
						{
							bufferTime += audio.buffered.end(i) - audio.buffered.start(i);
							 //console.log(i + " | start = " + audio.buffered.start(i) + " | end = " + audio.buffered.end(i) + " | bufferTime = " + bufferTime + " | duration = " + audio.duration);
						}
						percent = 100 * bufferTime / audio.duration;
					} // else the Metadata has not been read yet.
					//console.log("percent = " + percent);
				} else { // Fallback if buffered not supported
					// percent = event.jPlayer.status.seekPercent;
					percent = 100; // Cleans up the inital conditions on all browsers, since seekPercent defaults to 100 when object is undefined.
				}
				
				$('.buffer').css('width', percent+'%');
			},
			play: function (event)
			{
				$(this).jPlayer("pauseOthers"); // pause all players except this one.
				$(".playingTime").text($.jPlayer.convertTime(event.jPlayer.status.currentTime));
				$(".totalTime").text($.jPlayer.convertTime(event.jPlayer.status.duration));
				$(".progressBar").slider("value", event.jPlayer.status.currentPercentRelative);
			},
			pause: function (event)
			{
				var status = gq.player.status();

				if (gq.player.isOS() && ((gq.player._iBug == 1) || (status.duration > 0 && $.jPlayer.convertTime(status.duration) != 'NaN' && $.jPlayer.convertTime(status.duration) != '00:00' && (status.currentTime == 0 || status.currentTime == status.duration))))
				{						
					if (gq.player._iBug == 1)
						gq.player.load('play');
					else
						gq.player.next();
								
					gq.player._iBug++;
				}
			},
			timeupdate: function (event)
			{
				$(".playingTime").text($.jPlayer.convertTime(event.jPlayer.status.currentTime));
				$(".totalTime").text($.jPlayer.convertTime(event.jPlayer.status.duration));
				$(".progressBar").slider("value", event.jPlayer.status.currentPercentRelative);
			},
			error: function(event)
			{
				gq._gaqPush(['_trackEvent', 'Audio', 'Error::'+event.jPlayer.error.type, event.jPlayer.error]);
				switch(event.jPlayer.error.type)
				{
					case $.jPlayer.error.URL:
						gq._gaqPush(['_trackEvent', 'Audio', 'Error::MISSING'+$.jPlayer.error.URL]);
						gq.player.next(); // A function you might create to move on to the next media item when an error occurs.
					break;
					case $.jPlayer.error.NO_SOLUTION:
						gq._gaqPush(['_trackEvent', 'Audio', 'Error::NO_SOLUTION']);
				    break;
				}
			}
		},
				
		init: function () 
		{
			if (this.off)
				return; // player is off
			
			if (this.isOS()) // pre-settings for iphone/ipod/ipad/mac
			{
				gq.settings.playing = false; // cant auto play in iphone
				gq.player.preload = -1;  // cant load two instance in iphone
			}
			
			this.setup();
		},
		
		setup: function ()
		{	
			gq.player.setting.swfPath = gq.player.swfPath;
			gq.player.setting.volume = gq.settings.volume;
			gq.player.setting.muted = gq.settings.muted;
			
			if (!$(this.id).length)
			{
				var id = this.id; id = id.replace(/#/, '');
				$('body').append('<div id="'+id+'"></div>');
			}
			
			$(this.id).jPlayer(gq.player.setting);
			
			if (this.preload != -1)
			{
				if (!$(this.id2).length)
				{
					var id = this.id2; id = id.replace(/#/, '');
					$('body').append('<div id="'+id+'"></div>');
				}
				
				$(this.id2).jPlayer(gq.player.setting);
			}
			
			$( ".progressBar" ).slider({
				range: "min",
				min: 0,
				max: 100,
				animate: true,
				slide: function( event, ui ) {
					gq.player.seek(ui.value);
				}
			})
			.bind('mousemove', function(e) {
				var offset = $(this).offset();
				var x = e.pageX - offset.left;
				var w =  $(this).width();
				var percent = 100*x/w;
				var duration = gq.player.duration();
				var time = percent * duration / 100;
				$('.progressBar').attr('title', $.jPlayer.convertTime(time));
			})
			.find('.ui-slider-handle').addClass('icon');
			
			$( ".volumeBar" ).slider({
				orientation: "vertical",
				range: "min",
				min: 0,
				max: 100,
				value: gq.settings.volume,
				animate: true,
				slide: function( event, ui ) {
					gq.player.volume(ui.value);
					gq.layout.volume(ui.value);
				}
			})
			.find('.ui-slider-handle').addClass('icon');
			
			$.jPlayer.timeFormat.padMin = false;
		},
		
		isOS: function ()
		{
			if (/iPad/i.test(navigator.userAgent) || /iPhone/i.test(navigator.userAgent) || /iPod/i.test(navigator.userAgent))
				return true;
			else
				return false;
		},
		
		load: function (action)
		{
			if (this.off)
				return; // player is off
			
			if (action == 'new') // check if its new recitor or new bitrate, before reseting the settings.
			{
				this.reset();
			}

			if (!this.preload || this.preload == -1)
			{
				current = this._getFiles('current');
				$(this.id).jPlayer("setMedia", current);
				
				if (this.preload != -1)
				{
					next = this._getFiles('next');
					if (!next) // if reached to 6237 
						this.reset();
					else
						$(this.id2).jPlayer("setMedia", next); // just load only
				}
				
				this._currentPlayer = 1;
			}
			else if (action == 'new' || this._currentPlayer == 0) // this._currentPlayer == 0  needed for prev, but action is needed for new, because there is bug in FF
			{
				current = this._getFiles('current');
				next = this._getFiles('next');
				
				$(this.id).jPlayer("setMedia", current);
				if (!next) // if reached to 6237 
					this.reset();
				else
					$(this.id2).jPlayer("setMedia", next);
				
				this._currentPlayer = 1;
			}
			else if (this._currentPlayer == 1) // player 1
			{
				next = this._getFiles('next');
				if (next) // dont need NOT here, like others. also plays player 1 again, if set this.reset();
					$(this.id).jPlayer("setMedia", next);
				
				this._currentPlayer = 2; // play player 2, while 1 gets load
			}
			else // player 2
			{
				next = this._getFiles('next');
				if (!next) // if reached to 6237 
					this.reset();
				else
					$(this.id2).jPlayer("setMedia", next);
				
				this._currentPlayer = 1; // play player 1, while 2 gets load
			}
		
			if (gq.settings.playing && !gq.search.isActive()) // if playing, auto play
				gq.layout.play();
		},
		
		_getPlayerID: function ()
		{
			if (this._currentPlayer == 0 || this._currentPlayer == 1)
				return this.id;
			else
				return this.id2;
		},
		
		_getFiles: function (get)
		{
			get = get || 'current';
			var files = {};
			var rPos = this._recitor.position;
			var rLen = this._recitor.length;
			
			var surah = gq.surah();
			var ayah = gq.ayah();
			var verse = gq.verse();

			if (get == 'next' && rLen > 1 && rPos <= rLen)
			{
				if (rPos == rLen) // reached the last position
					rPos = 1;
				else
					rPos++;
			}
			
			//single recitor
			var recitor = this._recitor['row'+rPos];
			
			if (rPos == 1 && recitor.lastLoad == verse && ((this.preload == true && this._currentPlayer != 0) || get == 'next')) // increment, sence its same ayah
			{
				verse++;
				next = Quran.ayah.fromVerse(verse);
				surah = next.surah;
				ayah = next.ayah;
			}
			else if (this._currentPlayer == 0 && recitor.lastLoad >= 0) // this is for prev ayahs
				verse = this._recitor['row'+rPos].lastLoad;

			if (surah != 115 && surah != 9 && ayah == 1 && this._recitor.auz && recitor.lastLoad != verse && recitor.lastLoad != 0 && recitor.lastLoad != 1) // play auz
				verse = 0;
			else if (surah != 115 && surah != 9 && surah != 1 && ayah == 1 && recitor.lastLoad != verse && recitor.lastLoad != 1) // play bis
				verse = 1;

			
			if (this.preload == true || ((!this.preload || this.preload == -1) && get != 'next'))
				this._recitor['row'+rPos].lastLoad = verse;
		
			if (verse == 6237)
				return false; // there is no verse 6237
			
			if (recitor.mp3)
				files.mp3 = this.audioPath+recitor.name+'/mp3/'+recitor.kbs+'kbs/'+verse+'.mp3';
			if (recitor.ogg)
				files.oga = this.audioPath+recitor.name+'/ogg/'+recitor.kbs+'kbs/'+verse+'.ogg';
						
			return files;
		},
		
		_recitorReset: function ()
		{
			if (!gq.data.loaded)
				return false; // need to load data first
			
			var recitorArray = gq.recitor.selected();
			
			if (gq.recitor.length() == 0)
			{
				gq.recitor.add('ar.alafasy');
								
				list = gq.recitor.list();
				$.each(list, function(by, row)
				{
					if (gq.language.selected() != 'ar' && gq.language.selected() == row.language_code)
					{
						gq.recitor.add(by);
						return true;
					}
				});
				
				gq.layout.recitorList();
			}			
			
			// setting the recitor array
			var recitor = {auz: true, position: 1, length: gq.recitor.length()};
			
			recitorArray = gq.recitor.selected();

			i = 0;
			$.each(recitorArray, function(recitorName, kbs) {
				++i; // increment on start, because i starts with 0
				recitorInfo = gq.player._recitorInfo(recitorName);
				recitor['row'+i] = recitorInfo;
				recitor['row'+i].name = recitorName;
				recitor['row'+i].lastLoad = -1;
				
				if (!recitorInfo.auz) // if one of the recitor dont have auz, then turn off completely.
					recitor.auz = false;
			});

			this._recitor = recitor;
			this._currentPlayer = 0;
		},
		
		_recitorInfo: function (recitorName)
		{
			if (!recitorName)
				return {
					kbs: '0',
					mp3: false,
					ogg: false,
					auz: false
				};

			row = gq.data.quranList[recitorName];
			kbs = gq.recitor.selectedKbs(recitorName);
			
			media = row.media;
			media = media ? $.parseJSON(media) : {};
						
			if (kbs == 'auto' || (!media['mp3-'+kbs] && !media['ogg-'+kbs]))
			{
				$.each(media, function(key, mediaRow) {
					kbs = mediaRow.kbs;
					if (gq.player.autoBitrate == 'low')
						return; // exit loop
				});
			}
			
			if (media['mp3-'+kbs] && media['mp3-'+kbs]['auz'])
				auz = true;
			else if (media['ogg-'+kbs] && media['ogg-'+kbs]['auz'])
				auz = true;
			else
				auz = false;
			
			return {
				kbs: kbs,
				mp3: media['mp3-'+kbs] ? true : false,
				ogg: media['ogg-'+kbs] ? true : false,
				auz: auz
			};
		},
		
		recitorBy: function ()
		{
			return (this._recitor.length > 0) ? this._recitor['row'+this._recitor.position].name : 'undefined';
		},
		
		recitorKbs: function ()
		{
			return (this._recitor.length > 0) ? this._recitor['row'+this._recitor.position].kbs  : 'undefined';
		},
		
		isPlaying: function ()
		{
			return !this.status().paused;
		},
		
		reset: function (from)
		{
			this._recitorReset();
			this._recitor.position = 1;
			this._i = 0;
			this._currentPlayer = 0;
		},
		
		play: function ()
		{	
			$(this._getPlayerID()).jPlayer('play');
			gq.settings.playing = true;
			gq.save();
			gq._gaqPush(['_trackEvent', 'Audio', 'Play', this.recitorBy()]);
		},
		
		pause: function ()
		{	
			$(this._getPlayerID()).jPlayer('pause');
			gq.settings.playing = false;
			gq.save();
			gq._gaqPush(['_trackEvent', 'Audio', 'Pause', this.recitorBy()]);
		},
		
		stop: function ()
		{	
			$(this._getPlayerID()).jPlayer('stop');
			this.reset();
			gq._gaqPush(['_trackEvent', 'Audio', 'Stop', this.recitorBy()]);
		},
		
		next: function ()
		{
			var rPos = this._recitor.position;
			var rLen = this._recitor.length;
			var lastLoad = this._recitor['row'+rPos].lastLoad;
			
			var next = Quran.ayah.next(gq.surah(), gq.ayah());
			var page = Quran.ayah.page(next.surah, next.ayah);
			var juz  = Quran.ayah.juz(next.surah, next.ayah);
			var surah = next.surah;
			var ayah  =  next.ayah;
			var verse = Quran.verseNo.ayah(next.surah, next.ayah);
			var conf = gq.settings;
	
			if (rLen > 1 && rPos != rLen)
			{
				this._recitor.position++;
				this.load('play');
				return;
			}
			else if (gq.surah() != 9 && gq.ayah() == 1 && (lastLoad == 0 || (gq.surah() != 1 && lastLoad == 1))) // for auz,bis and ayah
			{
				if (rLen > 1 && rPos == rLen) // reset to first recitor
					this._recitor.position = 1; 
				
				this.load('play');
				return;
			}
			else if (rLen > 1 && rPos == rLen) // reset to first recitor
				this._recitor.position = 1;
						
			
			if (this.preload == true && rLen == 1 && lastLoad != verse && lastLoad != 0 && lastLoad != 1) // for single recitor
			{
				this.load('play');
				return;
			}
			
			
			if (conf.repeat && conf.repeatEach == 'ayah' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{			
				// loop through recitors, if more then one recitor is selected.
				if (rLen > 1)
				{
					this.load('play'); // recitor position has been reset above.
					return;
				}
				
				if (this.isOS())
					this.load('play'); // for OS we have to load again
				else
					this.play(); // just play, no load
				this._i++;
				return;
			}
			else if (surah != gq.surah() && conf.repeat && conf.repeatEach == 'surah' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				if (this.preload != true)
					this._recitor['row1'].lastLoad = -1;
				gq.load(gq.surah(), 1);
				this._i++;
				return;
			}
			else if (page != gq.page() && conf.repeat && conf.repeatEach == 'page' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				if (this.preload != true)
					this._recitor['row1'].lastLoad = -1;
				load = Quran.ayah.fromPage(gq.page());
				gq.load(load.surah, load.ayah);
				this._i++;
				return;
			}
			else if (juz != gq.juz() && conf.repeat && conf.repeatEach == 'juz' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				if (this.preload != true)
					this._recitor['row1'].lastLoad = -1;
				load = Quran.ayah.fromJuz(gq.juz());
				gq.load(load.surah, load.ayah);
				this._i++;
				return;
			}
			else
			{	
				if (verse == Quran.verseNo.ayah(gq.surah(), gq.ayah()) && verse >= 6236)
				{
					if (gq.settings.playing && verse >= 6236)
						gq.layout.stop();
					return;
				}
				
				gq.nextAyah();
				gq.layout.ayahChanged();
				//gq.load(surah, ayah);
				this._i = 0;
				return;
			}
		},
		
		prev: function ()
		{
			var rPos = this._recitor.position;
			var rLen = this._recitor.length;
			var lastLoad = this._recitor['row'+rPos].lastLoad;
			
			var prev = Quran.ayah.prev(gq.surah(), gq.ayah());
			var page = Quran.ayah.page(prev.surah, prev.ayah);
			var juz  = Quran.ayah.juz(prev.surah, prev.ayah);
			var surah = prev.surah;
			var ayah  =  prev.ayah;
			var verse = Quran.verseNo.ayah(prev.surah, prev.ayah);
			var conf = gq.settings;
			
			this._currentPlayer = 0;
			this._i = 0;
			
			//FIXME doesnt work properly on preload enabled, so for now we not repeating auz,bis for ayahs on prev
			if (!this.preload && this.preload == -1 && gq.surah() != 9 && gq.ayah() == 1 && ((lastLoad != 0 && this._recitor.auz) || (lastLoad != 1 && !this._recitor.auz) || ((lastLoad == 1 && rPos > 1) || (this._recitor.auz && lastLoad == 0 && rPos > 1)))) //&& (lastLoad == gq.verse() || (gq.surah() != 1 && lastLoad == 1))) // for auz,bis and ayah
			{
				if (!conf.repeat || (conf.repeat && conf.repeatEach != 'ayah')) // ayah repeat on bis gives problem
				{					
					if (rLen > 1 && rPos == 1) // reset to first recitor
						this._recitor.position = this._recitor.length;
					else if (rLen > 1 && rPos > 1)
						this._recitor.position--;
					
					lastLoad = this._recitor['row'+this._recitor.position].lastLoad; 
					
					if (lastLoad == 1 && this._recitor.auz)
					{
						if (this.preload == true)
							this._prevRestRecitor(this._recitor.position, verse);						
						this._recitor['row'+this._recitor.position].lastLoad = 0;
					}
					else if (lastLoad == gq.verse())
					{
						if (this.preload == true)
							this._prevRestRecitor(this._recitor.position, this._recitor.auz ? 0 : 1);
						this._recitor['row'+this._recitor.position].lastLoad = 1;
					} 
					else if (lastLoad > gq.verse())
					{
						if (this.preload == true)
							this._prevRestRecitor(this._recitor.position, 1);
						this._recitor['row'+this._recitor.position].lastLoad = gq.verse();
					}
					
					this.load('play');
					return;
				}
			}
			
			if (rLen > 1 && rPos > 1)
			{
				this._recitor.position--;
				this._recitor['row'+this._recitor.position].lastLoad = gq.verse();
				this.load('play');
				return;
			}
			else if (rLen > 1 && rPos == 1) // reset to first recitor
			{
				this._recitor.position = this._recitor.length;
				this._recitor['row'+this._recitor.position].lastLoad = verse;
			}
						
			if (conf.repeat && conf.repeatEach == 'ayah' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				this._recitor['row'+this._recitor.position].lastLoad = gq.verse();
				// loop through recitors, if more then one recitor is selected.
				if (rLen > 1)
				{
					this.load('play'); // recitor position has been reset above.
					return;
				}
				this.play(); // just play, no load
				this._i = (this._i > 1) ? this._i-1 : 1;
				return;
			}
			else if (surah != gq.surah() && conf.repeat && conf.repeatEach == 'surah' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				if (gq.surah() == 114)
					verse = 6236;
				else
					verse = Quran.verseNo.surah(gq.surah()+1)-1;
				
				this._recitor.position = this._recitor.length;
				this._recitor['row'+this._recitor.position].lastLoad = verse;
				
				load = Quran.ayah.fromVerse(verse);
				gq.load(load.surah, load.ayah);
				this._i = (this._i > 1) ? this._i-1 : 1;
				return;
			}
			else if (page != gq.page() && conf.repeat && conf.repeatEach == 'page' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				if (gq.page() == 604)
					verse = 6236;
				else
					verse = Quran.verseNo.page(gq.page()+1)-1;
				
				this._recitor.position = this._recitor.length;
				this._recitor['row'+this._recitor.position].lastLoad = verse;
				
				load = Quran.ayah.fromVerse(verse);		
				gq.load(load.surah, load.ayah);
				this._i = (this._i > 1) ? this._i-1 : 1;
				return;
			}
			else if (juz != gq.juz() && conf.repeat && conf.repeatEach == 'juz' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				if (gq.juz() == 30)
					verse = 6236;
				else
					verse = Quran.verseNo.juz(gq.juz()+1)-1;
				
				this._recitor.position = this._recitor.length;
				this._recitor['row'+this._recitor.position].lastLoad = verse;
				
				load = Quran.ayah.fromVerse(verse);	
				gq.load(load.surah, load.ayah);
				this._i = (this._i > 1) ? this._i-1 : 1;
				return;
			}
			else
			{
				this._recitor['row'+this._recitor.position].lastLoad = verse;
				
				if (verse == Quran.verseNo.ayah(gq.surah(), gq.ayah()) && verse == 1)
					return;

				gq.load(surah, ayah);
				this._i = 0;
				return;
			}
		},
		
		_prevRestRecitor: function (pos, verse)
		{
			for ( var i = 1; i < pos; i++)
            {
				this._recitor['row'+i].lastLoad = verse;
            }
		},
		
		/**
		 * seek to new position in audio
		 * @param number
		 * @param usingSeconds if set to true, then number should be seconds / else percentage
		 */
		seek: function (number, usingSeconds)
		{
			number = number || 0;
			usingSeconds = usingSeconds || false;
			
			if (usingSeconds == false)
			{
				$(this._getPlayerID()).jPlayer('playHead', number);
			}
			else
			{
				if (this.isPlaying())
					$(this._getPlayerID()).jPlayer('play', number);
				else
					$(this._getPlayerID()).jPlayer('pause', number);				
			}			
		},
		
		volume: function (volume)
		{
			$(this.id).jPlayer('volume', volume);
			$(this.id2).jPlayer('volume', volume);
			gq.settings.volume = volume;
			gq.save();
		},
		
		mute: function ()
		{			
			$(this.id).jPlayer('mute');
			$(this.id2).jPlayer('mute');
			gq.settings.muted = true;
			gq.save();
		},
		
		unmute: function ()
		{
			$(this.id).jPlayer('unmute');
			$(this.id2).jPlayer('unmute');
			gq.settings.muted = false;
			gq.save();
		},
		
		repeat: function (bool)
		{
			gq.settings.repeat = bool;
			gq.save();
		},
		
		repeatEach: function (repeat)
		{
			gq.settings.repeatEach = repeat;
			gq.save();
		},
		
		repeatTimes: function (times)
		{
			gq.settings.repeatTimes = times;
			gq.save();
		},
		
		audioDelay: function (delay)
		{
			gq.settings.audioDelay = delay;
			gq.save();
		},
		
		duration: function ()
		{
			return this.status().duration;
		},
		
		playingTime: function ()
		{
			return this.status().currentTime;
		},
		
		status: function (playerID)
		{
			var playerID = playerID || this._getPlayerID();
			return $(playerID).data("jPlayer").status;
		},
		
		data: function (playerID)
		{
			var playerID = playerID || this._getPlayerID();
			return $(playerID).data("jPlayer");
		},
		
		destroy: function (playerID)
		{
			if (playerID)			
				$(playerID).jPlayer("destroy").remove();
			else
			{
				if ($(this.id).length)
					$(this.id).jPlayer("destroy").remove();
				if ($(this.id2).length)
					$(this.id2).jPlayer("destroy").remove();
			}
		}
	},
	
	layout: {
		displayStartup: function (success) {}, // replace this function with yours
		display: function (success) {}, // replace this function with yours
		ayahChanged: function () {},
		volume: function (val) {},
		play: function () {},
		stop: function () {},
		recitorList: function () {}
	},
	
	font: {
		setFamily: function (fontFamily)
		{
			gq.settings.font = fontFamily;
			gq.save();
		},
		
		setSize: function (size)
		{
			gq.settings.fontSize = size;
			gq.save();
		},
		
		getFamily: function (by)
		{			
			if (gq.settings.font == 'auto' && gq.quran.isSelected(by) && gq.quran.detail(by).type == 'quran')
			{
				if (/mac/i.test(navigator.platform)) // isMac
						return 'Scheherazade';
				if (/uthmani/.test(by)) // isUthamani
					return 'me_quran';
				else if (/tajweed/.test(by)) // isTajweed
					return '_PDMS_Saleem_QuranFont';
				else
					return 'KFGQPC Uthman Taha Naskh';
			}
			
			return (gq.settings.font != 'auto') ? gq.settings.font : '';			
		},
		
		getSize: function ()
		{
			return gq.settings.fontSize;
		}
	},
	
	
	
	
	setFullScreen: function (enable)
	{
		this.settings.fullScreen = enable;
		this.save();
	},
	
	juz: function (juz)
	{		
		if (juz)
		{
			juz = Quran._fixJuzNum(juz);
			var verse = Quran.ayah.fromJuz(juz);
			
			if (this.page() != Quran.ayah.page(verse.surah, verse.ayah))
			{
				this.load(verse.surah, verse.ayah);
				return false;
			}
		}
		
		return this.settings.juz;
	},
	
	page: function (page)
	{		
		if (page)
		{
			page = Quran._fixPageNum(page);
			var verse = Quran.ayah.fromPage(page);
			
			if (this.page() != Quran.ayah.page(verse.surah, verse.ayah))
			{
				this.load(verse.surah, verse.ayah);
				return false;
			}
		}
		
		return this.settings.page;
	},
	
	surah: function (surah)
	{		
		if (surah)
		{
			surah = Quran._fixSurahNum(surah);
			var ayah = 1;
			
			if (this.page() != Quran.ayah.page(surah, ayah))
			{
				this.load(surah, ayah);
				return false;
			}
			else
			{
				this.settings.surah = surah;
				this.settings.ayah = 1;
			}
		}
		
		return this.settings.surah;
	},
	
	ayah: function (surah, ayah)
	{		
		if (surah)
		{
			surah = Quran._fixSurahNum(surah);
			ayah  = Quran._fixAyahNum(surah, ayah);
			
			if (this.page() != Quran.ayah.page(surah, ayah))
			{
				this.load(surah, ayah);
				return false;
			}
			else
			{
				this.settings.surah = surah;
				this.settings.ayah = ayah;
				this.player.load('new');
				this.save();
			}
		}
		
		return this.settings.ayah;
	},
	
	verse: function (surah, ayah)
	{
		surah = surah ? Quran._fixSurahNum(surah) : this.settings.surah;
		ayah  = ayah ? Quran._fixAyahNum(surah, ayah) : this.settings.ayah;
	
		return Quran.verseNo.ayah(surah, ayah);
	},
	

	nextAyah: function ()
	{
		var verse = Quran.ayah.next(this.surah(), this.ayah());
		
		if (verse.surah == this.surah() && verse.ayah == this.ayah())
			return verse; // ayah already exist on the page
	
		this.settings.surah = verse.surah;
		this.settings.ayah = verse.ayah;
				
		if (this.ayah(verse.surah, verse.ayah))
			return verse; // ayah already exist on the page
		else
			return false;	
	},
	
	prevAyah: function ()
	{
		var verse = Quran.ayah.prev(this.surah(), this.ayah());
		
		if (verse.surah == this.surah() && verse.ayah == this.ayah())
			return verse; // ayah already exist on the page

		this.settings.surah = verse.surah;
		this.settings.ayah = verse.ayah;
				
		if (this.ayah(verse.surah, verse.ayah))
			return verse; // ayah already exist on the page
		else
			return false;
	},
	
	nextPage: function ()
	{
		return this.page(this.page()+1);
	},
	
	prevPage: function ()
	{
		return this.page(this.page()-1);
	},
	
	nextSurah: function () {
		return this.surah(this.surah()+1);
	},
	
	prevSurah: function () {
		return this.surah(this.surah()-1);
	},
	
	ayahs: function () {	
		return this.data.ayahList;
	},
	
	save: function () {
		this._cookieSave(); // save settings
	},
	
	load: function (surah, ayah)
	{
		firstLoad = false;
		notCachedQuranID = true;

		if (surah && ayah)
			this.search._keyword = false;
		
		if (!surah && !ayah && !this.search.isActive())
		{
			firstLoad = true;
			this._cookieRead();
			this.url.load();
		}
		
		if (this.search.isActive())
		{
			this.search.loading(true);
			var requestUrl = this.apiURL;
			
			if (firstLoad)
				requestUrl += 'all/';
			
			requestUrl += 'search/'+this.search.keyword()+'/'+this.search.position();
			
			if (this.search.position() == 0)
				this.url.save();
		}
		else if (!surah && !ayah)
		{	
			this.settings.page = 0; // url wont load, if its same as url page 1=1
			this.url.load();
			
			this.settings.surah = this.settings.surah || 1;
			this.settings.ayah = this.settings.ayah || 1;
			this.settings.juz =  Quran.ayah.juz(this.settings.surah, this.settings.ayah);	
			this.settings.page = Quran.ayah.page(this.settings.surah, this.settings.ayah);		
			this.data.ayahList = Quran.ayah.listFromPage(this.settings.page);
	
			requestUrl = this.apiURL+'all/page/'+this.settings.page;

			if (this.quran.length() > 0)// TODO add this.noData for getting no quran text from server.
				requestUrl += '/'+this.quran.selectedString();
			/*if (this.settings.selectedLanguage) // TODO language selection here
				requestUrl += '/'+this.settings.selectedLanguage;*/
		}//TODO add other methods too ex: search and language pack
		else
		{
			this.settings.surah = surah;
			this.settings.ayah = ayah;
			this.settings.juz = Quran.ayah.juz(surah, ayah);
			this.settings.page = Quran.ayah.page(surah, ayah);		
			this.data.ayahList = Quran.ayah.listFromPage(this.settings.page);
						
			notCachedQuranID = this.quran.textNotCached();			
			
			requestUrl = this.apiURL+'page/'+this.settings.page+'/'+notCachedQuranID;
			this.url.save();
		}
		
		this.save();
		this._gaqPush(['_trackPageview', '/#!'+this.url.page()]);
		
		if (this.noData && !firstLoad) // if no data need to be output, then run request only once
			notCachedQuranID = false;

		if (notCachedQuranID)
		{
			$jsonp = $.support.cors ? '' : '.jsonp?callback=?';
			$.ajaxSetup({ cache: true, jsonpCallback: 'quranData' });

			$.getJSON(requestUrl+$jsonp, function(response) {			
				gq._loadResponse(response, firstLoad);
			});
			
			//$.getJSON('quran-all.json', function(response) {			
			//	gq._loadResponse(response, firstLoad);
			//});
		//});

		}
		else
		{
			gq.layout.display(true);	
			gq.player.load('play');
		}
		
		return false;
	},
	
	_loadResponse: function (response, firstLoad)
	{
		if (typeof(response) == 'object')			
		{
			gq.data = $.extend(true, gq.data, response);
			gq.data.loaded = true;
			
		if(!gq.loadedEMPTYQURANJSON){ gq.data = $.extend(true, gq.data, EMPTYQURANJSON); gq.loadedEMPTYQURANJSON = true; }//loadup the empty base structure
		gq.cookdata();  //*********** HARDCODING THE DATA
		
		}
		
		if (gq.search.isActive())
		{
			gq.search.init();
			gq.search.loading(false);
			if (gq.search.totalRows() > 0)
			{
				for (var verseNo in response.search.quran)
				{
					gq.search._positionStartVerse = verseNo;
					break;
				}
			}			
		}
		
		if (response.languageSelected)
			gq.settings.selectedLanguage = response.languageSelected;
				
		if (firstLoad) // first time loading the page
		{
			gq.player.init(); // player
			
			if (!gq.quran.length() && typeof(response) == 'object' && response.quran)
			{
				$.each(response.quran, function(defaultQuranBy, ignore) {
					gq.quran.add(defaultQuranBy);
				});
				
				this.url.save(); // cause defaultQuranBy set here
			}

			gq.layout.displayStartup((typeof(response) == 'object'));
		}
		else
		{
			gq.layout.display((typeof(response) == 'object'));
			gq.player.load('play');
		}
	},
	
	url: {
		
		load: function ()
		{
			var hash = window.location.hash;
			hash = hash.split('/');
			var count = hash.length;

			if (count > 2 && hash['1'] == 'search')
			{
				if (gq.search.keyword() == hash['2'] && gq.search.position() == 0)
					return false;
				
				gq.search._keyword = hash['2'];
				gq.search._position = 0;
				
				return true;
			}
			else if (count > 2 && gq.settings.page != hash['2'])
			{
				gq.quran.reset();
				selectedBy = hash['1'].split('|');
		
				$.each (selectedBy, function(i, quranBy)
				{
					gq.quran.add(quranBy);
				});
				
				verse = hash['2'].split(':');
				
				if (verse.length > 1)
				{
					gq.settings.surah = Quran._fixSurahNum(parseInt(verse['0']));
					gq.settings.ayah = Quran._fixAyahNum(gq.settings.surah, parseInt(verse['1']));
				}
				else
				{
					verse = Quran.ayah.fromPage(hash['2']);
					gq.settings.surah = verse.surah;
					gq.settings.ayah = verse.ayah;
				}		
				
				gq.player.reset();
			
				return true;
			}
			else if (/^[0-9]+:?[0-9]*$/.test(hash['1']))
			{
				verse = hash['1'].split(':');
				
				if (verse.length > 1)
				{
					gq.settings.surah = Quran._fixSurahNum(parseInt(verse['0']));
					gq.settings.ayah = Quran._fixAyahNum(gq.settings.surah, parseInt(verse['1']));
				}
				else
				{
					verse = Quran.ayah.fromPage(hash['1']);
					gq.settings.surah = verse.surah;
					gq.settings.ayah = verse.ayah;
				}		
				
				gq.player.reset();
			
				return true;
			}
			
			return false;
		},
		
		save: function ()
		{
			window.location.hash = '#!'+this.page();
		},
		
		hashless: function ()
		{
		    var url = window.location.href;
		    var hash = window.location.hash;
		    var index_of_hash = url.indexOf(hash) || url.length;
		    var hashless_url = url.substr(0, index_of_hash);
		    return hashless_url;
		},
		
		page: function (page)
		{
			if (gq.search.isActive())
				return '/search/'+gq.search.keyword();
			else
			{
				url = '/';
				by = gq.quran.selectedString();
				if (by)
					url += by+'/';
				url += page || gq.settings.page;
				return url;
			}
		},
		
		ayah: function (surah, ayah)
		{
			if (gq.search.isActive())
				return '/'+gq.settings.surah+':'+gq.settings.ayah;
			else
			{
				url = '/';
				by = gq.quran.selectedString();
				if (by)
					url += by+'/';
				if (surah)
					url += gq.settings.surah+':'+gq.settings.ayah;
				else
					url += surah+':'+ayah;
				return url;
			}
		}
	},
	
	_cookieRead: function ()
	{
		var settings = '';
		var nameEQ = "settings=";
	    var ca = document.cookie.split(';');
	    for(var i=0;i < ca.length;i++)
	    {
	        var c = ca[i];
	        while (c.charAt(0)==' ')
	        	c = c.substring(1,c.length);
	        
	        if (c.indexOf(nameEQ) == 0) 
	        	settings = c.substring(nameEQ.length,c.length);
	    }
	    
	    settings = $.parseJSON(settings);
	    $.extend(true, this.settings, settings);
	    this.quran.init();
	    this.recitor.init();
	},
	
	_cookieSave: function (data)
	{
		var firstRun = (typeof(data) == 'undefined'); 
		var settings = '';
		data =  firstRun ? this.settings : data;
		
		if (!firstRun && data == null)
			return '{}';
		
		$.each(data, function(key, val) {
			if (typeof(val) == 'object' || typeof(val) == 'array')
				settings += '"'+key+'":'+gq._cookieSave(val)+',';
			else if (typeof(val) != 'string')
				settings += '"'+key+'":'+val+','; // no quote's
			else
				settings += '"'+key+'":"'+val+'",';
		});
		settings = settings.slice(0, -1); // this is here, just to remove comma
		settings = '{'+settings+'}';
			
		// first time load  save only
		if (firstRun)
		{
			var date = new Date();
	        date.setTime(date.getTime()+(365*24*60*60*1000)); // expire in 1 year
	        var expires = "; expires="+date.toGMTString();
	        document.cookie = "settings="+settings+expires+"; path=/";
		}
		
		return settings;
	},
	
	googleAnalytics: function ()
	{
		var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	    
	    if (typeof(_gaq) == 'undefined')
	    	_gaq = [];	    
	    window._gaq = _gaq || [];
	    
	    if (this.googleAnalyticsID)
	    {
	    	_gaq.push(['b._setAccount', this.googleAnalyticsID]);
	    }
	    
	    _gaq.push(['_setAccount', this._gaID]);
	    this._gaqPush(['_setSessionCookieTimeout', 360000000]);
	    this._gaqPush(['_trackPageview']);   
	},
	
	_gaqPush: function(arrayValue)
	{		
		_gaq.push(arrayValue);
		if (this.googleAnalyticsID)
		{
			arrayValue[0] = 'b.'+arrayValue[0];
			_gaq.push(arrayValue);
		}
	}
};

if (!Object.keys)
{
    Object.keys = function (obj)
    {
        var keys = [],
            k;
        for (k in obj)
        {
            if (Object.prototype.hasOwnProperty.call(obj, k))
            {
                keys.push(k);
            }
        }
        return keys;
    };
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
