import fs from 'node:fs';

// Load the 3,810 clean 1863 entries
const rawEntries = JSON.parse(fs.readFileSync('resources/entries_1863_all.json', 'utf8'));
// Load the existing 68 rich illustrated entries
const PLATE_ENTRIES = JSON.parse(fs.readFileSync('resources/entries_68_plates.json', 'utf8'));

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]/g, '');
}

const WORD_DICT = {
  'aaron': '아론', 'abaddon': '아바돈', 'abadie': '아바디', 'abalam': '아발람', 'abano': '아바노',
  'abaris': '아바리스', 'abdeel': '압델', 'abd-el-azys': '압델아지즈', 'abdias de babylone': '바빌론의 오바댜',
  'abeilard': '아벨라르', 'abeilles': '꿀벌', 'abel': '아벨', 'abel de la rue': '아벨 드 라 뤼',
  'aben-ezra': '아벤 에즈라', 'aben-ragel': '아벤 라겔', 'abigor': '아비고르', 'abîme': '심연',
  'abominations': '가증한 의식', 'abou-ryhan': '아부 리한', 'aboyeurs': '짖는 빙의자들',
  'abracadabra': '아브라카다브라', 'abracax': '아브라카스', 'abraham': '아브라함', 'abrahel': '아브라엘',
  'absalon': '압살롬', 'abstinence': '금욕', 'abundia': '아분디아', 'acatriel': '아카트리엘',
  'acca-laurentia': '아카 라우렌티아', 'accidents': '기이한 재해', 'accouchements': '출산 미신',
  'accouchements prodigieux': '기이한 출산', 'acham': '아캄', 'achamoth': '아카모트',
  'acharai-rioho': '아카라이 리오호', 'achéron': '아케론', 'achérusie': '아케루시아',
  'achguaya-xerac': '아치과야 세라크', 'achmet': '아흐메트', 'aconce': '아콘시오', 'adalbert': '아달베르트',
  'adam': '아담', 'adamantius': '아다만티우스', 'adamiens': '아담파', 'adelgreiff': '아델그라이프',
  'adeline': '아들린', 'adelites': '아델리트파', 'adelung': '아델룽',
  'adeptes': '아뎁투스(연금술 비전가)', 'adès': '하데스', 'adhab-algab': '아드하브 알가브',
  'adjuration': '구마 명령(아주라시옹)', 'adonis': '아도니스', 'adoration du crapaud': '두꺼비 숭배',
  'adramelech': '아드라멜레크', 'adranos': '아드라노스', 'adrien': '하드리아누스',
  'aéromancie': '공기점(아에로망시)', 'aétite': '독수리돌(아에티트)', 'agaberte': '아가베르트',
  'agarès': '아가레스', 'agate': '마노(아가트)', 'agathion': '아가티온', 'agathodémon': '아가토다이몬',
  'agla': '아글라', 'aglaophotis': '아글라오포티스', 'agnan': '아냥', 'agobard': '아고바르드',
  'agraféna-shiganskaia': '아그라페나 시간스카야', 'agrippa': '아그리파', 'aguapa': '아과파',
  'aguarès': '아과레스', 'aguerre': '아게르', 'aigle': '독수리', 'aiguilles': '바늘 주술',
  'aiguillette': '매듭 주술(에귀예트)', 'aimant': '자석', 'aimar': '에마르',
  'ajournement': '신판 소환(아주르느망)', 'akbaba': '악바바', 'akhmin': '아크밈', 'akiba': '아키바',
  'akouan': '아쿠안', 'alain de l’isle': '알랭 드 릴', 'alaric': '알라리크', 'alary': '알라리',
  'alastor': '알라스토르', 'albert le grand': '알베르투스 마그누스', 'albigeois': '알비파',
  'albinos': '알비노', 'alborak': '알보라크', 'albumazar': '알부마사르', 'albunée': '알부네아',
  'alchabitius': '알카비티우스', 'alchimie': '연금술', 'alchimistes': '연금술사', 'alcoran': '코란(알코란)',
  'alectryomancie': '수탉점(알렉트리오망시)', 'aleuromancie': '밀가루점(알뢰로망시)', 'allégorie': '알레고리',
  'alliance': '계약', 'almanach': '역서(알마낙)', 'almanachs': '역서(알마낙)', 'aloès': '알로에',
  'alocer': '알로케르', 'alomancie': '소금점(알로망시)', 'alrunes': '알루나(만드라고라 우상)',
  'alphitomancie': '보리떡점(알피토망시)', 'amduscias': '암두시아스', 'améthyste': '자수정',
  'amitié': '우정', 'amnios': '양막(행운의 막)', 'amon': '아몬', 'amour': '사랑의 주술',
  'amulettes': '호신부(아뮬레트)', 'amy': '아미', 'anagramme': '애너그램(철자 바꾸기)',
  'anathème': '파문·저주(아나테마)', 'anatomie': '해부 미신', 'andras': '안드라스',
  'androgynes': '양성구유(안드로지누스)', 'âne': '당나귀', 'anges': '천사', 'anguilles': '뱀장어',
  'animaux': '동물 미신', 'anneau': '마법 반지', 'anneaux': '마법 반지', 'année': '연도 미신',
  'antechrist': '적그리스도', 'antéchrist': '적그리스도', 'anthropomancie': '인체 내장점(안트로포망시)',
  'anthropophages': '식인 풍습', 'antipathie': '상극(안티파티)', 'apantomancie': '우연 조우점(아판토망시)',
  'apocalypse': '요한묵시록', 'apollon': '아폴론', 'apparitions': '유령 출현', 'araignée': '거미',
  'arbre': '나무', 'arbres': '신목(나무 미신)', 'arc-en-ciel': '무지개', 'archanges': '대천사',
  'argent': '은·화폐 미신', 'argus': '아르고스', 'arithmomancie': '수비점(아리모망시)',
  'armes': '마법 무기', 'armoires': '벽장 괴이', 'art': '마법 기술', 'asmodée': '아스모데우스',
  'astaroth': '아스타로트', 'astrologie': '점성술', 'astrologues': '점성술사',
  'astrolabe': '아스트롤라베(천문관측기)', 'astronomie': '천문학', 'augures': '조점관(아우구르)',
  'auréole': '후광', 'automates': '자동인형(오토마타)', 'avarice': '탐욕', 'aveugles': '맹인',
  'aveux des sorciers': '마녀·마법사의 자백', 'averroès': '아베로에스', 'azazel': '아자젤',
  'baël': '바엘', 'baguette divinatoire': '다우징 막대(점술 지팡이)', 'bâillement': '하품 미신',
  'bains': '목욕 미신', 'balaam': '발람', 'balan': '발란', 'balai': '마녀의 빗자루', 'baleine': '고래',
  'baphomet': '바포메트', 'baptême': '세례 미신', 'barbatos': '바르바토스', 'barbe': '수염',
  'barbe bleue': '푸른 수염', 'basilic': '바실리스크', 'bâton': '지팡이',
  'bâton du bon voyageur': '여행자의 마법 지팡이', 'baume universel': '만병통치 영약',
  'béhémoth': '베헤모스', 'belzébuth': '벨제붑', 'belphégor': '벨페고르', 'bélial': '벨리알',
  'belette': '족제비', 'bélomancie': '화살점(벨로망시)', 'bénédiction': '축복', 'berceau': '요람',
  'berith': '베리트', 'beurre': '버터 주술', 'beurre des sorcières': '마녀의 버터',
  'bibliomancie': '서책점(비블리오망시)', 'bœuf': '황소', 'bohémiens': '보헤미안(집시)',
  'bois': '숲과 나무', 'bois de vie': '생명의 나무', 'boissons': '마법 음료',
  'bonne aventure': '운세 점치기', 'bonnet': '모자', 'bonzes': '승려(봉즈)',
  'botanomancie': '식물점(보타노망시)', 'bouc': '사바트의 숫염소', 'bougies': '양초',
  'bouillon du sabbat': '사바트의 수프', 'boule': '구체', 'bourreau': '사형집행인',
  'boussole': '나침반', 'brahmanes': '브라만', 'brouillard': '안개', 'bruits': '괴음',
  'buer': '부에르', 'byleth': '빌레트',
  'cabale': '카발라', 'cabalistes': '카발리스트', 'cacodémon': '카코다이몬', 'cacus': '카쿠스',
  'cadavre': '시체', 'cadavres': '시체 미신', 'cailloux': '조약돌', 'cali': '칼리',
  'calice du sabbat': '사바트의 성배', 'caméléon': '카멜레온', 'caractères': '부적 문자',
  'cartes': '카드점(트럼프·타로)', 'catoptromancie': '거울점(카톱트로망시)', 'cauchemar': '몽마(악몽)',
  'caverne': '동굴', 'cavernes': '마법 동굴', 'caym': '카임', 'ceinture': '허리띠',
  'cendres': '재(회분)', 'cerbère': '케르베로스', 'cercle': '마법진', 'cercles': '마법진',
  'cerf': '사슴', 'cerveau': '뇌', 'chaîne': '사슬', 'chambres infestées': '흉가(유령 들린 방)',
  'chameau': '낙타', 'champignons': '버섯(마녀의 고리)', 'chandelle': '양초', 'chanson': '노래',
  'chant': '주문가', 'chanvre': '대마', 'chapeau': '모자', 'charbon': '숯',
  'charlatans': '돌팔이 마술사', 'charlemagne': '샤를마뉴', 'charme': '주술·매혹',
  'charmes': '주술·부적', 'chasse': '마탄과 사냥 비방', 'chasseur noir': '검은 사냥꾼',
  'chat': '고양이', 'chats': '고양이', 'chaudron': '마녀의 가마솥', 'chauve-souris': '박쥐',
  'chemise de nécessité': '구원투(위급의 속옷)', 'chêne': '참나무', 'cheval': '말',
  'chevaux': '말', 'cheveux': '머리카락 주술', 'chèvres': '염소', 'chien': '개', 'chiens': '개',
  'chimère': '키마이라', 'chiromancie': '수상술(손금 보기)', 'chouette': '올빼미',
  'chrétiens': '기독교인', 'ciel': '하늘', 'cimetière': '묘지', 'cire': '밀랍 인형 주술',
  'clairs-voyants': '투시자', 'clavicules de salomon': '솔로몬의 열쇠(클라비쿨라)', 'clefs': '열쇠 점술',
  'cloches': '종소리', 'clou': '못', 'clous': '못 주술', 'cobales': '코발로스', 'cochon': '돼지',
  'code des sorciers': '마법사 법전', 'cœur': '심장', 'coffin': '관', 'collier': '목걸이',
  'colombes': '비둘기', 'comètes': '혜성', 'commandements': '계명', 'compact': '악마와의 조약',
  'comte de gabalis': '가발리스 백작', 'conjuration': '소환 주문(콩쥐라시옹)', 'constellations': '별자리',
  'contre-sorciers': '대(對)마법사', 'convulsions': '경련파(생메다르 기적 소동)', 'coq': '수탉',
  'coquilles': '조개껍데기', 'corail': '산호', 'corbeau': '까마귀', 'corde de pendu': '교수형당한 자의 밧줄',
  'cornes': '뿔', 'corps': '육체', 'coscinomancie': '체(篩) 점술', 'coucou': '뻐꾸기',
  'couleuvre': '구렁이', 'couleurs': '색채 상징', 'couronne': '왕관', 'couteau': '단검',
  'crabes': '게', 'crachat': '침 미신', 'crâne': '두개골', 'crapaud': '두꺼비', 'cristal': '수정구',
  'cristallomancie': '수정점(크리스탈로망시)', 'crocodiles': '악어', 'croix': '십자가',
  'crucifixion au sabbat': '사바트의 십자가 모독', 'cruentation': '시체 출혈 신판(크뤼앙타시옹)',
  'cuisine': '주방', 'cuivre': '구리', 'cyclopes': '키클롭스', 'cygne': '백조',
  'cynocephales': '견두인(키노케팔로스)',
  'dactyliomancie': '반지점(닥틸리오망시)', 'dagon': '다곤', 'dames blanches': '백의의 여인(담 블랑슈)',
  'damnés': '지옥에 떨어진 자들', 'danse de saint guy': '성 기(비투스)의 무도병',
  'danse des morts': '죽음의 무도(단스 마카브르)', 'danse du sabbat': '사바트의 춤',
  'dauphin': '돌고래', 'décembre': '12월', 'décapitation': '참수', 'déluge': '대홍수',
  'démon': '악마(데몬)', 'démonologie': '악마학(데모놀로지)', 'démonomanie': '악마광(데모노마니아)',
  'démons': '악마들', 'dents': '치아 미신', 'derviches': '데르비시(수피 수행자)', 'destin': '운명',
  'deuil': '상복·애도 풍습', 'devins': '점쟁이(예언자)', 'diable': '악마(디아블)', 'diables': '악마들',
  'diamant': '다이아몬드', 'dieu': '신', 'dieux': '이교의 신들', 'dimanche': '일요일 미신',
  'divination': '점술(디비나시옹)', 'doigts': '손가락', 'don': '재능', 'dragon': '용(드래곤)',
  'dragons': '용(드래곤)', 'druides': '드루이드', 'duel': '결투 신판',
  'eau': '물', 'eau bénite': '성수', 'eaux': '물의 정령과 샘', 'écho': '메아리',
  'éclipses': '일식과 월식', 'écoles de magie': '마법 학교(살라망카·톨레도)', 'écriture': '문자',
  'écrouelles': '연주창(국왕의 치유 손길)', 'églises': '교회', 'égypans': '아이기판',
  'égyptiens': '이집트인과 집시', 'éléments': '4원소와 정령', 'éléphant': '코끼리',
  'élixir': '엘릭서(영약)', 'émeraude': '에메랄드', 'empereurs': '황제',
  'enchantements': '마법 부여(앙샹트망)', 'enchanteurs': '마법사', 'encre': '잉크',
  'énergumènes': '악령 들린 자(에네르귀멘)', 'enfant': '아이', 'enfants': '아이들',
  'enfer': '지옥', 'enfers': '지옥', 'engagements du sabbat': '사바트 입문 서약',
  'énigmes': '수수께끼', 'ensorcellement': '저주·마법 걸기', 'épée': '검', 'épervier': '새매',
  'épreuves': '신판(불·물 시련)', 'épreuves du sabbat': '사바트의 시련', 'ermites': '은수자',
  'escarboucle': '카벙클(석류석)', 'esclaves': '노예', 'esprits': '정령·영혼',
  'esprits familiers': '사역마(패밀리어)', 'esprits frappeurs': '폴터가이스트(두드리는 영)',
  'éternuement': '재채기 미신', 'étoiles': '별과 운명', 'étoile': '별', 'eurynome': '에우리노모스',
  'évangile': '복음서 부적', 'évocation': '영혼·악마 소환술', 'excommunication': '파문',
  'exorcisme': '구마 의식(엑소시즘)', 'exorcismes': '구마 의식(엑소시즘)',
  'exorcistes': '구마사제(엑소시스트)', 'extase': '황홀경(엑스터시)',
  'fables': '우화', 'faim diabolique': '악마적 허기', 'fantasmagorie': '판타스마고리아(환등기 유령극)',
  'fantômes': '유령(판톰)', 'farfadets': '파르파데(집요정)', 'fascination': '사안(매혹·주박)',
  'fatalisme': '운명론', 'faust': '파우스트', 'fées': '요정(페)', 'femmes': '여성과 마법',
  'fer': '철과 편자 미신', 'fer à cheval': '말굽(편자) 부적', 'festins du sabbat': '사바트의 연회',
  'fêtes': '축제일', 'feu': '불', 'feux follets': '도깨비불(윌오더위스프)', 'fèves': '콩 미신',
  'fièvre': '열병 치유 부적', 'figuier': '무화과나무', 'fil': '실', 'filles': '소녀',
  'filtres': '미약(필트르)', 'flammes': '불꽃', 'flauros': '플라우로스', 'flèches': '화살',
  'fleurs': '꽃', 'fleuves': '강', 'foie': '간 점술', 'folie': '광기', 'fontaines': '신성한 샘',
  'forêts': '숲', 'forcalor': '포르칼로르', 'forgerons': '대장장이 전설', 'foudre': '벼락·뇌전',
  'fourmis': '개미', 'francs-maçons': '프리메이슨', 'frénésie': '광란', 'froid': '냉기',
  'fumée': '연기', 'funérailles': '장례 미신', 'furcas': '푸르카스', 'furfur': '푸르푸르',
  'furie': '복수의 여신(퓨리아이)', 'furies': '복수의 여신(퓨리아이)',
  'ganga-gramma': '강가 그람마', 'garuda': '가루다', 'géants': '거인', 'génies': '지니·정령',
  'géomancie': '땅점·지오망시(흙점)', 'glace': '얼음·거울', 'gnomes': '노움(땅의 정령)',
  'gnostiques': '영지주의자(그노시스파)', 'gobelins': '고블린', 'gorgones': '고르곤',
  'graisse des sorciers': '마녀의 비행 연고(기름)', 'grêle': '우박 마법', 'grenouille': '개구리',
  'grenouilles': '개구리', 'griffon': '그리폰', 'grimoire': '그리무아르(마도서)',
  'grimoires': '그리무아르(마도서)', 'grossesse': '임신 미신', 'grottes': '동굴',
  'guérisons': '기적 치유', 'guerre': '전쟁 징조', 'gui': '겨우살이', 'gusoyn': '구소인',
  'gymnosophistes': '나체 현자(김노소피스트)',
  'haagenti': '하겐티', 'habits': '의복', 'haleine': '입김', 'hallucinations': '환각',
  'halphas': '할파스', 'harmonie': '조화', 'harpe': '하프', 'harpies': '하르피이아',
  'hasard': '우연', 'hépatoscopie': '간장점(헤파토스코피)', 'hérésie': '이단',
  'hérétiques': '이단자', 'héros': '영웅', 'herbes': '약초와 마법초',
  'hermaphrodites': '자웅동체(헤르마프로디토스)', 'hibou': '부엉이',
  'hiéroglyphes': '상형문자(히에로글리프)', 'hippogriffe': '히포그리프', 'hirondelle': '제비',
  'hommes': '인간', 'homoncule': '호문쿨루스', 'horloge': '시계',
  'horoscope': '호로스코프(별자리 운세)', 'hostie': '성체 모독과 기적', 'huile': '기름',
  'hydromancie': '수점(히드로망시)', 'hyène': '하이에나', 'hypnotisme': '최면술',
  'idoles': '우상', 'idolâtrie': '우상숭배', 'îles': '환상의 섬', 'illusions': '환술',
  'illuminés': '일루미나티(광명파)', 'images': '주술 인형·형상', 'imagination': '상상력의 힘',
  'immortalité': '불사(영생)', 'imposteurs': '사칭자·사기꾼', 'imprécations': '저주 기도',
  'incantations': '주문 영창(인칸테이션)', 'incendies': '화재', 'incubes': '인큐버스(남성 몽마)',
  'incrédules': '불신자들', 'indes': '인도의 마법', 'infanticide': '영아 살해',
  'inquisiteurs': '이단심문관', 'inquisition': '종교재판(이단심문소)',
  'insectes': '곤충 파문 재판', 'inspiration': '영감', 'invisibilité': '투명화 마법', 'ipos': '이포스',
  'jardin': '정원', 'jardins': '마법 정원', 'jaspe': '벽옥(재스퍼)', 'jeûne': '단식',
  'jeux': '도박과 놀이 미신', 'jours': '길일과 흉일', 'jugement de dieu': '신의 심판(신판)',
  'juif errant': '방황하는 유대인', 'juifs': '유대인 전승', 'jumeaux': '쌍둥이',
  'jurements': '맹세', 'justice': '재판',
  'kamis': '카미(일본의 신령)', 'kobolds': '코볼트',
  'labyrinthe': '미궁(라비린토스)', 'lacs': '마법 호수', 'lait': '우유 주술', 'lamas': '라마승',
  'lamies': '라미아(흡혈 요괴)', 'lampes': '꺼지지 않는 고대 램프', 'langues': '방언과 언어',
  'lanterne magique': '마술 환등기', 'lapidation': '투석', 'laurier': '월계수',
  'lémures': '레무레스(악령)', 'lépreux': '나병 환자 음모론', 'léthargie': '가사 상태',
  'lettres': '문자 부적', 'léviathan': '레비아탄', 'lézard': '도마뱀', 'licorne': '유니콘(일각수)',
  'lièvre': '산토끼 미신', 'ligature': '결박 주술(성불능 저주)', 'lignes de la main': '손금',
  'lilith': '릴리트', 'lion': '사자', 'litanies du sabbat': '사바트의 연도(기도문)',
  'livres de magie': '마법서', 'loups': '늑대', 'loups-garous': '늑대인간(루가루)',
  'lucifer': '루키페르', 'lumières': '괴화(빛)', 'lune': '달의 마법', 'lunettes': '안경',
  'lutins': '뤼탱(장난꾸러기 요정)', 'lycanthropie': '낭인병(리칸트로피)',
  'magicien': '마법사', 'magiciens': '마법사들', 'magie': '마법(마기)', 'magie blanche': '백마법',
  'magie noire': '흑마법', 'magnétisme': '동물 자기(메스머리즘)',
  'main de gloire': '영광의 손(만드라고라·사형수의 손)', 'mains': '손',
  'maisons hantées': '유령 들린 집(흉가)', 'maladies': '악마적 질병',
  'maléfices': '해악 주술(말레피키움)', 'malphas': '말파스', 'mammon': '맘몬',
  'mandragore': '만드라고라(맨드레이크)', 'mânes': '마네스(조상신·망자의 영)', 'manteau': '망토',
  'marbas': '마르바스', 'marbre': '대리석', 'marchosias': '마르코시아스',
  'maréchaux': '대장장이 마법', 'mariage': '결혼 미신', 'marins': '선원들의 미신',
  'marque des sorciers': '마녀의 낙인(악마의 표식)',
  'marteau des sorcières': '마녀들의 망치(말레우스 말레피카룸)', 'martyrs': '순교자',
  'masques': '가면', 'médecine': '마법 의학', 'médecins': '의사', 'médiums': '영매(미디엄)',
  'mélancolie': '우울증(멜랑콜리)', 'mélusine': '멜뤼진', 'mendiants': '걸인',
  'mensonge': '거짓', 'méphistophélès': '메피스토펠레스', 'mer': '바다',
  'mercuriale': '수은초', 'mères': '어머니', 'merlin': '멀린', 'merveilles': '경이로운 현상',
  'messe': '흑미사와 미사 미신', 'métempsycose': '윤회전생(메템프시코시스)', 'météores': '기상 이변',
  'métaux': '7대 금속과 행성', 'métoposcopie': '이마 관상술(메토포스코피)', 'midi': '정오의 악마',
  'miel': '꿀', 'mines': '광산의 정령', 'miroir': '마법 거울', 'miroirs magiques': '마법 거울',
  'moloch': '몰로크', 'momies': '미라', 'monde': '세계', 'monstres': '괴물',
  'montagnes': '마법의 산', 'mort': '죽음과 징조', 'morts': '망자(죽은 자들)',
  'mots magiques': '마법 주문어', 'mouches': '파리(악마의 화신)', 'moulins': '풍차와 방앗간',
  'moutons': '양', 'muets': '벙어리', 'murmur': '무르무르', 'musique': '음악과 악마',
  'mystères': '비의(미스터리)', 'mythologie': '신화',
  'nains': '난쟁이(드워프)', 'naissance': '탄생 점성술', 'naufrages': '난파',
  'navires': '유령선과 선박', 'nécromancie': '강령술(네크로맨시)',
  'nécromanciens': '강령술사(네크로맨서)', 'neige': '눈', 'neuf': '숫자 9의 신비',
  'nez': '코 관상', 'noeuds': '매듭 주술', 'nœuds': '매듭 주술', 'noël': '성탄절 밤의 전승',
  'noir': '검은색', 'nombres': '수비학(숫자의 신비)', 'noms': '이름의 마법', 'noix': '호두 미신',
  'nord': '북방의 악마와 마법', 'nostradamus': '노스트라다무스', 'noyés': '익사자 탐지 미신',
  'nuages': '구름과 폭풍 마법', 'nuit': '밤의 망령', 'nymphes': '님프',
  'obsession': '악마의 집착(외적 빙의)', 'odeur': '악마의 악취와 성인의 향기', 'odin': '오딘',
  'œil': '사안(이블 아이)', 'œufs': '달걀 점술과 미신', 'ogres': '오거(식인 거인)', 'oie': '거위',
  'oiseaux': '새 점술', 'ombre': '그림자 상실 전설', 'ombres': '망자의 그림자',
  'ongles': '손톱 점술(오니코망시)', 'onguent': '마녀의 비행 연고', 'oniromancie': '해몽술(오니로망시)',
  'onze': '숫자 11', 'opale': '오팔', 'or': '연금술의 금', 'oracles': '신탁(오라클)',
  'orages': '폭풍을 부르는 자들', 'ordalies': '시련 재판(오달리)', 'oreilles': '귀 울림 미신',
  'orgueil': '교만', 'orias': '오리아스', 'origines du monde': '세계의 기원', 'os': '뼈 주술',
  'ours': '곰', 'oz': '오즈',
  'pacte': '악마와의 계약', 'pactes': '악마와의 계약', 'pain': '빵 점술과 미신',
  'palais': '마법 궁전', 'palladium': '팔라디움(수호신상)', 'palmier': '종려나무',
  'pan': '판(목신)', 'paon': '공작새', 'papes': '교황과 마법 전설', 'papillons': '나비',
  'paracelse': '파라켈수스', 'paradis': '낙원', 'paroles': '주문과 말의 힘', 'passions': '정념',
  'pâte': '반죽', 'paymon': '파이몬', 'peau': '가죽', 'péché originel': '원죄', 'péchés': '죄악',
  'peinture': '성화와 악마 그림', 'pèlerinages': '순례', 'pendus': '교수형당한 자의 부적',
  'pentacle': '펜타클(오망성 호신부)', 'perles': '진주', 'perroquet': '앵무새',
  'perse': '페르시아 마법', 'peste': '흑사병(역병)의 악마', 'peur': '공포가 일으키는 기현상',
  'fantôme': '유령', 'philtres': '사랑의 묘약(필트르)', 'philosophes': '철학자',
  'phrénologie': '골상학(프레놀로지)', 'physiognomonie': '인상학(관상술)', 'pie': '까치',
  'pied': '발', 'pierre philosophale': '현자의 돌', 'pierres': '마법 보석과 광물',
  'pierres précieuses': '보석의 마법적 효능', 'plantes': '마법 식물', 'planètes': '행성과 점성술',
  'plomb': '납 융해점(몰리브도망시)', 'pluie': '기우제와 비 마법', 'plumes': '깃털',
  'poison': '독약과 마녀', 'poissons': '물고기', 'pomme': '사과',
  'ponts du diable': '악마의 다리', 'porc': '돼지', 'portes': '문지방 미신',
  'possédés': '악령 들린 자(빙의자)', 'possession': '악마 빙의(포제션)',
  'poules': '암탉이 수탉처럼 울 때의 흉조', 'poupées': '저주 인형', 'poussière': '먼지',
  'prédictions': '예언', 'présages': '전조(징조)', 'prestiges': '환술(프레스티지)',
  'prêtres': '사제', 'prières': '기도와 주문', 'princes': '군주', 'prison': '감옥 탈출 마법',
  'procès': '마녀재판', 'prodiges': '기적과 이변', 'prophètes': '예언자', 'prophéties': '예언',
  'pruflas': '프루플라스', 'psylles': '프실리(뱀 부리는 부족)', 'puces': '벼룩', 'puits': '우물',
  'purgatoire': '연옥(성 파트리치오의 연옥)', 'pygmées': '피그미', 'pyromancie': '불점(피로망시)',
  'pythagore': '피타고라스', 'pythonisse': '피토니사(무녀·엔돌의 신접한 여인)',
  'quarante': '숫자 40', 'quatre': '숫자 4', 'queue': '악마의 꼬리',
  'rabdomancie': '막대점·수맥 찾기(랍도망시)', 'racines': '뿌리', 'rage': '광견병 치유 미신',
  'raoum': '라움', 'rats': '쥐 떼 소환과 추방', 'rayons': '빛줄기', 'reines du sabbat': '사바트의 여왕',
  'reliques': '성유물', 'remèdes': '비방 치료제', 'renard': '여우', 'repas du sabbat': '사바트의 식사',
  'reptiles': '파충류', 'résurrection': '부활 전설', 'rêves': '꿈과 해몽',
  'revenants': '르브낭(되살아난 망자)', 'richesse': '보물 찾기와 부', 'rire': '웃음',
  'rivières': '강', 'rois': '국왕', 'romains': '로마인의 미신', 'ronwe': '론웨',
  'rose-croix': '장미십자회(로젠크로이처)', 'rosée': '오월의 이슬', 'roue': '바퀴',
  'rouge': '붉은색', 'rubis': '루비', 'runes': '룬 문자',
  'sabbat': '사바트(마녀들의 밤 집회)', 'sable': '모래점', 'sacrifices': '인신공양과 제물',
  'sages': '현자', 'salomon': '솔로몬', 'sang': '피의 계약과 미신', 'saphir': '사파이어',
  'satan': '사탄', 'satyres': '사티로스', 'sauterelles': '메뚜기 재앙', 'savants': '학자',
  'scarabée': '풍뎅이(스카라베)', 'science': '비학(오컬트 학문)', 'scorpions': '전갈',
  'secrets': '비전(시크릿)', 'sel': '소금과 사바트', 'sept': '숫자 7의 신비', 'sépulcres': '무덤',
  'serments': '맹세', 'serpent': '뱀', 'serpent de mer': '거대 바다뱀(크라켄·씨서펜트)',
  'serpents': '뱀과 주술', 'shax': '샥스', 'sibylles': '시빌라(무녀)', 'siècles': '세기',
  'signes': '징표', 'silence': '침묵', 'singes': '원숭이', 'sirènes': '세이렌(인어)',
  'soleil': '태양 숭배와 징조', 'sommeil': '수면', 'somnambulisme': '몽유병과 투시',
  'songes': '꿈과 해몽(몽점)', 'sorcellerie': '마녀술(소르셀러리)', 'sorciers': '마법사·마녀(소르시에)',
  'sorcières': '마녀(소르시에르)', 'sort': '제비뽑기·주술', 'sorts': '제비뽑기 점술(소르틸레주)',
  'souffle': '입김 주술', 'soufre': '유황', 'souris': '생쥐', 'spectres': '망령(스펙터)',
  'sphinx': '스핑크스', 'spirites': '심령주의자(스피리티스트)', 'spiritisme': '심령술(스피리티즘)',
  'squelettes': '해골', 'statues': '움직이는 조각상', 'stolas': '스톨라스',
  'stryges': '스트릭스(올빼미 마녀)', 'succubes': '서큐버스(여성 몽마)', 'suicide': '자살과 악마',
  'superstitions': '미신', 'sylphes': '실프(바람의 정령)', 'sympathie': '교감 마법(유감 주술)',
  'table': '원탁', 'tables tournantes': '테이블 터닝(분신사바·강령 탁자)', 'taches': '반점',
  'talismans': '탈리스만(호신부)', 'tambour': '샤먼의 북', 'tarots': '타로 카드', 'taupe': '두더지',
  'taureau': '황소', 'tempêtes': '폭풍을 일으키는 마법', 'templiers': '성전기사단(템플 기사단)',
  'temps': '날씨와 시간', 'tentations': '악마의 유혹', 'terre': '대지', 'tête': '머리',
  'tête de mort': '예언하는 해골', 'théurgie': '신성 마법(테우르기아)', 'tombeaux': '무덤과 분묘',
  'tonnerre': '천둥과 벼락', 'topaze': '토파즈', 'tortue': '거북', 'torture': '마녀재판의 고문',
  'toucher': '치유의 손길', 'tour': '탑', 'tour des rats': '쥐의 탑(하토 주교 전설)',
  'tourbillons': '회오리바람 속의 악마', 'traditions': '전승', 'transmutation': '금속 변환(연금술)',
  'transport des sorcières': '마녀들의 공중 이동', 'trèfle': '네잎클로버 미신',
  'treize': '숫자 13의 미신', 'tremblements de terre': '지진', 'trésors': '숨겨진 보물과 수호 악령',
  'trinité': '삼위일체', 'trois': '숫자 3의 신비', 'trompette': '나팔', 'tunique': '성모의 성의',
  'turcs': '튀르크인의 미신', 'turquoise': '터키석',
  'ulcères': '궤양', 'ukobach': '우코바크', 'urne': '단지',
  'vache': '암소', 'valafar': '발라파르', 'valkyries': '발키리', 'vampires': '뱀파이어(흡혈귀)',
  'veau d’or': '황금 송아지', 'veille': '철야', 'veines': '혈관', 'vendredi': '금요일 미신',
  'vent': '바람을 파는 마법', 'ventriloques': '복화술사와 무녀', 'vénus': '베누스(비너스)',
  'verbe': '말씀', 'verge': '마법 지팡이', 'vérité': '진실', 'verre': '유리',
  'vers': '벌레와 주술 시구', 'vertus': '권능', 'vêtements': '의복', 'veuves': '과부',
  'viande': '사바트의 고기', 'vie': '생명 연장술', 'vieillards': '노인',
  'vierge': '성모 마리아와 처녀', 'vierges': '처녀', 'vigne': '포도나무', 'vin': '포도주',
  'vingt': '숫자 20', 'vipère': '살무사', 'visage': '얼굴', 'visions': '환시(비전)',
  'voix': '신비한 목소리', 'vol': '공중 부양과 비행', 'voleurs': '도둑을 잡는 점술',
  'volac': '볼라크', 'volonté': '의지의 마법', 'voyages des sorcières': '마녀들의 사바트 비행',
  'vue': '시력과 투시',
  'wall': '발(부알)', 'wierus': '요한 바이어', 'wiérus': '요한 바이어',
  'xaphan': '자판', 'xéno': '제노',
  'yan-gant-y-tan': '얀간티탄', 'yeux': '눈과 사안',
  'zaebos': '자에보스', 'zapan': '자판', 'zeernébooch': '체르네보크', 'zodiaque': '황도 12궁',
  'zombi': '좀비', 'zoroastre': '조로아스터'
};

const NAME_MAP = {
  'jean': '장', 'jeanne': '잔', 'jeannette': '잔네트', 'pierre': '피에르', 'paul': '폴',
  'jacques': '자크', 'françois': '프랑수아', 'françoise': '프랑수아즈', 'louis': '루이',
  'louise': '루이즈', 'charles': '샤를', 'henri': '앙리', 'henriette': '앙리에트',
  'antoine': '앙투안', 'antoinette': '앙투아네트', 'nicolas': '니콜라', 'michel': '미셸',
  'joseph': '조제프', 'marie': '마리', 'marguerite': '마르그리트', 'catherine': '카트린',
  'anne': '안', 'madeleine': '마들렌', 'élisabeth': '엘리자베트', 'guillaume': '기욤',
  'robert': '로베르', 'richard': '리샤르', 'thomas': '토마', 'martin': '마르탱',
  'bernard': '베르나르', 'albert': '알베르', 'alexandre': '알렉상드르', 'andré': '앙드레',
  'barthélemy': '바르텔레미', 'barthélémy': '바르텔레미', 'benoît': '브누아', 'claude': '클로드',
  'clément': '클레망', 'daniel': '다니엘', 'david': '다비드', 'denis': '드니', 'dominique': '도미니크',
  'édouard': '에두아르', 'étienne': '에티엔', 'eugène': '외젠', 'félipe': '펠리페', 'philippe': '필리프',
  'frédéric': '프레데리크', 'gabriel': '가브리엘', 'gaspard': '가스파르', 'georges': '조르주',
  'george': '조르주', 'gilles': '질', 'grégoire': '그레구아르', 'guy': '기', 'hugues': '위그',
  'ignace': '이냐스', 'innocent': '이노상', 'isaac': '이자크', 'isidore': '이지도르',
  'jérôme': '제롬', 'jules': '쥘', 'julien': '쥘리앵', 'laurent': '로랑', 'léon': '레옹',
  'léopold': '레오폴드', 'luc': '뤼크', 'marc': '마르크', 'mathieu': '마티외', 'maurice': '모리스',
  'maximilian': '막시밀리앙', 'maximilien': '막시밀리앙', 'noël': '노엘', 'olivier': '올리비에',
  'pascal': '파스칼', 'patrick': '파트리크', 'philibert': '필리베르', 'raymond': '레몽',
  'rené': '르네', 'renée': '르네', 'roger': '로제', 'salomon': '살로몬', 'samuel': '사뮈엘',
  'sébastien': '세바스티앵', 'simon': '시몽', 'siméon': '시메옹', 'sylvestre': '실베스트르',
  'théodore': '테오도르', 'théophile': '테오필', 'urbain': '위르뱅', 'valentin': '발랑탱',
  'victor': '빅토르', 'vincent': '뱅상', 'xavier': '자비에', 'zacharie': '자카리',
  'saint': '성', 'sainte': '성녀', 'abbé': '수도원장', 'père': '신부', 'frère': '수사',
  'roi': '왕', 'reine': '여왕', 'empereur': '황제', 'pape': '교황', 'duc': '공작',
  'comte': '백작', 'marquis': '후작', 'marquise': '후작부인', 'baron': '남작',
  'grand': '대', 'petit': '소', 'ier': '1세', 'ii': '2세', 'iii': '3세',
  'iv': '4세', 'v': '5세', 'vi': '6세', 'vii': '7세', 'viii': '8세', 'ix': '9세',
  'x': '10세', 'xi': '11세', 'xii': '12세', 'xiii': '13세', 'xiv': '14세', 'xv': '15세', 'xvi': '16세'
};

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

function composeHangul(cho, jung, jong = '') {
  const ci = CHO.indexOf(cho);
  const vi = JUNG.indexOf(jung);
  const fi = JONG.indexOf(jong);
  if (ci < 0 || vi < 0 || fi < 0) return '';
  return String.fromCharCode(0xAC00 + (ci * 21 + vi) * 28 + fi);
}

function addBatchim(syl, jong) {
  if (!syl) return null;
  const code = syl.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return null;
  const fi = code % 28;
  if (fi !== 0) return null;
  const nfi = JONG.indexOf(jong);
  if (nfi <= 0) return null;
  return String.fromCharCode(syl.charCodeAt(0) + nfi);
}

function wordToHangul(word) {
  let w = String(word || '').toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/ç/g, 's')
    .replace(/[àâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/ÿ/g, 'i')
    .replace(/[^a-z]/g, '');
  if (!w) return word;

  if (/mancie$/.test(w)) {
    const stem = w.replace(/mancie$/, '');
    return `${wordToHangul(stem)}망시(점술)`;
  }
  if (/scopie$/.test(w)) {
    const stem = w.replace(/scopie$/, '');
    return `${wordToHangul(stem)}스코피(관찰점)`;
  }

  w = w
    .replace(/^aa/, 'a')
    .replace(/sch/g, 'S')
    .replace(/tch/g, 'C')
    .replace(/ch/g, 'S')
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/qu/g, 'k')
    .replace(/gu(?=[eiy])/g, 'g')
    .replace(/gn/g, 'N')
    .replace(/eau/g, 'o')
    .replace(/au/g, 'o')
    .replace(/ou/g, 'u')
    .replace(/oi/g, 'W')
    .replace(/ai/g, 'e')
    .replace(/ei/g, 'e')
    .replace(/eu/g, 'O')
    .replace(/ce/g, 'se')
    .replace(/ci/g, 'si')
    .replace(/cy/g, 'si')
    .replace(/ge/g, 'je')
    .replace(/gi/g, 'ji')
    .replace(/gy/g, 'ji')
    .replace(/ck/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/([bcdfghjklmnpqrstvwz])\1+/g, '$1')
    .replace(/([bcdfghjklmnpqrstvwzSN])e$/, '$1');

  const C_CHO = {
    b:'ㅂ', c:'ㅋ', d:'ㄷ', f:'ㅍ', g:'ㄱ', h:'ㅎ', j:'ㅈ', k:'ㅋ',
    l:'ㄹ', m:'ㅁ', n:'ㄴ', p:'ㅍ', q:'ㅋ', r:'ㄹ', s:'ㅅ', t:'ㅌ',
    v:'ㅂ', w:'ㅇ', z:'ㅈ', S:'ㅅ', C:'ㅊ', N:'ㄴ'
  };
  const V_JUNG = {
    a:'ㅏ', e:'ㅔ', i:'ㅣ', o:'ㅗ', u:'ㅜ', y:'ㅣ', W:'ㅘ', O:'ㅚ'
  };
  const BATCHIM_MAP = {
    n: 'ㄴ', m: 'ㅁ', l: 'ㄹ', p: 'ㅂ', k: 'ㄱ', c: 'ㄱ'
  };

  const syls = [];
  let i = 0;
  while (i < w.length) {
    const ch = w[i];
    const next = w[i + 1] || '';
    if (V_JUNG[ch]) {
      syls.push(composeHangul('ㅇ', V_JUNG[ch]));
      i += 1;
    } else if (C_CHO[ch]) {
      if (V_JUNG[next]) {
        let jung = V_JUNG[next];
        if ((ch === 'S' || ch === 'N') && jung === 'ㅏ') jung = 'ㅑ';
        if ((ch === 'S' || ch === 'N') && jung === 'ㅗ') jung = 'ㅛ';
        if ((ch === 'S' || ch === 'N') && jung === 'ㅜ') jung = 'ㅠ';
        syls.push(composeHangul(C_CHO[ch], jung));
        i += 2;
      } else {
        const b = BATCHIM_MAP[ch];
        if (b && syls.length > 0) {
          const merged = addBatchim(syls[syls.length - 1], b);
          if (merged) {
            syls[syls.length - 1] = merged;
            i += 1;
            continue;
          }
        }
        syls.push(composeHangul(C_CHO[ch], ch === 'S' || ch === 'j' || ch === 'C' ? 'ㅠ' : 'ㅡ'));
        i += 1;
      }
    } else {
      i += 1;
    }
  }
  return syls.join('') || word;
}

function frHeadwordToKo(nameFr, baseFr) {
  const fullLow = String(nameFr || '').toLowerCase().replace(/’/g, '’').trim();
  const baseLow = String(baseFr || '').toLowerCase().replace(/’/g, '’').trim();
  const fullLowPlain = fullLow.replace(/’/g, "'");
  const baseLowPlain = baseLow.replace(/’/g, "'");

  if (WORD_DICT[fullLow]) return WORD_DICT[fullLow];
  if (WORD_DICT[fullLowPlain]) return WORD_DICT[fullLowPlain];

  let baseKo = '';
  if (WORD_DICT[baseLow]) baseKo = WORD_DICT[baseLow];
  else if (WORD_DICT[baseLowPlain]) baseKo = WORD_DICT[baseLowPlain];
  else if (NAME_MAP[baseLow]) baseKo = NAME_MAP[baseLow];
  else {
    const cleanTarget = baseFr || nameFr;
    const tokens = cleanTarget.split(/(\s+|\-)/);
    baseKo = tokens.map(tok => {
      if (/^\s+$/.test(tok)) return ' ';
      if (tok === '-') return '·';
      const sub = tok.replace(/^(?:d’|d'|l’|l')/i, '');
      const low = sub.toLowerCase();
      if (low === 'de' || low === 'du' || low === 'des') return '드';
      if (low === 'la') return '라';
      if (low === 'le') return '르';
      if (low === 'les') return '레';
      if (low === 'et') return '와';
      if (['ou','en','au','aux','sur','sous','dans','par','pour','avec','sans','chez','contre','dit','dite','m.'].includes(low)) return '';
      if (WORD_DICT[low]) return WORD_DICT[low];
      if (NAME_MAP[low]) return NAME_MAP[low];
      return wordToHangul(sub);
    }).filter(Boolean).join(' ').replace(/\s+/g, ' ').replace(/\s*·\s*/g, '·').trim();
  }

  // If nameFr has a parenthetical first name like "Abdeel (Abraham)" or "Abadie (Jeannette d’)", include its Korean transliteration too
  const parenM = String(nameFr || '').match(/\(([^)]+)\)/);
  if (parenM && !WORD_DICT[fullLow] && !WORD_DICT[fullLowPlain]) {
    const inner = parenM[1].replace(/(?:\s+de|\s+d’|\s+d'|\s+du|\s+des|\s+la|\s+le)$/i, '').trim();
    if (inner && inner.length < 28) {
      const innerTokens = inner.split(/[\s\-]+/).map(t => {
        const tl = t.toLowerCase().replace(/^(?:d’|d'|l’|l')/i, '');
        if (!tl || ['m.','mm.','dit','dite','de','du','la','le'].includes(tl)) return '';
        return NAME_MAP[tl] || WORD_DICT[tl] || wordToHangul(tl);
      }).filter(Boolean);
      if (innerTokens.length) {
        return `${baseKo} (${innerTokens.join(' ')})`;
      }
    }
  }

  return baseKo || baseFr || nameFr;
}

// Proper nouns dictionary for body text extraction (ensuring Korean + (English/Latin) notation)
const PROPER_MENTIONS = [
  ['Salomon', '솔로몬 (Salomon)'],
  ['Clavicules de Salomon', '『솔로몬의 열쇠 (Clavicules de Salomon)』'],
  ['Petit Albert', '『소 알베르트 (Petit Albert)』'],
  ['Grand Grimoire', '『그랑 그리무아르 (Grand Grimoire)』'],
  ['Malleus Maleficarum', '『마녀들의 망치 (Malleus Maleficarum)』'],
  ['Wierus', '요한 바이어 (Wierus)'],
  ['Wiérus', '요한 바이어 (Wiérus)'],
  ['Delancre', '피에르 드 랑크르 (Delancre)'],
  ['Bodin', '장 보댕 (Bodin)'],
  ['Boguet', '앙리 보게 (Boguet)'],
  ['Delrio', '마르틴 델리오 (Delrio)'],
  ['Leloyer', '피에르 르루아예 (Leloyer)'],
  ['Bekker', '발타자르 베커르 (Bekker)'],
  ['Calmet', '돔 아우구스탱 칼메 (Calmet)'],
  ['Görres', '요제프 괴레스 (Görres)'],
  ['Gœrres', '요제프 괴레스 (Gœrres)'],
  ['Berbiguier', '베르비기에 (Berbiguier)'],
  ['Torquemada', '토르케마다 (Torquemada)'],
  ['Sprenger', '야코프 슈프렝거 (Sprenger)'],
  ['Agrippa', '아그리파 (Agrippa)'],
  ['Paracelse', '파라켈수스 (Paracelse)'],
  ['Cardan', '지롤라모 카르다노 (Cardan)'],
  ['Nostradamus', '노스트라다무스 (Nostradamus)'],
  ['Albert le Grand', '알베르투스 마그누스 (Albert le Grand)'],
  ['Pline', '플리니우스 (Pline)'],
  ['Plutarque', '플루타르코스 (Plutarque)'],
  ['Suétone', '수에토니우스 (Suétone)'],
  ['Hérodote', '헤로도토스 (Hérodote)'],
  ['Pythagore', '피타고라스 (Pythagore)'],
  ['Platon', '플라톤 (Platon)'],
  ['Aristote', '아리스토텔레스 (Aristote)'],
  ['Socrate', '소크라테스 (Socrate)'],
  ['Homère', '호메로스 (Homère)'],
  ['Virgile', '베르길리우스 (Virgile)'],
  ['Ovide', '오비디우스 (Ovide)'],
  ['Apulée', '아풀레이우스 (Apulée)'],
  ['Lucien', '루키아노스 (Lucien)'],
  ['Origène', '오리게네스 (Origène)'],
  ['Augustin', '아우구스티누스 (Augustin)'],
  ['Thomas d’Aquin', '토마스 아퀴나스 (Thomas d’Aquin)'],
  ['saint Bernard', '성 베르나르두스 (Saint Bernard)'],
  ['Grégoire de Tours', '투르의 그레고리우스 (Grégoire de Tours)'],
  ['Mahomet', '무함마드 (Mahomet)'],
  ['Zoroastre', '조로아스터 (Zoroastre)'],
  ['Hermès', '헤르메스 (Hermès)'],
  ['Apollon', '아폴론 (Apollon)'],
  ['Jupiter', '유피테르 (Jupiter)'],
  ['Vénus', '베누스 (Vénus)'],
  ['Minerve', '미네르바 (Minerve)'],
  ['Diane', '디아나 (Diane)'],
  ['Hécate', '헤카테 (Hécate)'],
  ['Mercure', '메르쿠리우스 (Mercure)'],
  ['Saturne', '사투르누스 (Saturne)'],
  ['Lucifer', '루키페르 (Lucifer)'],
  ['Satan', '사탄 (Satan)'],
  ['Belzébuth', '벨제붑 (Belzébuth)'],
  ['Astaroth', '아스타로트 (Astaroth)'],
  ['Asmodée', '아스모데우스 (Asmodée)'],
  ['Léviathan', '레비아탄 (Léviathan)'],
  ['Béhémoth', '베헤모스 (Béhémoth)'],
  ['Belphégor', '벨페고르 (Belphégor)'],
  ['Baphomet', '바포메트 (Baphomet)'],
  ['Méphistophélès', '메피스토펠레스 (Méphistophélès)'],
  ['Faust', '파우스트 (Faust)'],
  ['Merlin', '멀린 (Merlin)'],
  ['Cagliostro', '칼리오스트로 (Cagliostro)'],
  ['Mesmer', '메스머 (Mesmer)'],
  ['Swedenborg', '스베덴보리 (Swedenborg)'],
  ['Luther', '마르틴 루터 (Luther)'],
  ['Calvin', '장 칼뱅 (Calvin)'],
  ['Charlemagne', '샤를마뉴 (Charlemagne)'],
  ['Napoléon', '나폴레옹 (Napoléon)'],
  ['Louis XIV', '루이 14세 (Louis XIV)'],
  ['Louis XIII', '루이 13세 (Louis XIII)'],
  ['Henri IV', '앙리 4세 (Henri IV)'],
  ['Henri III', '앙리 3세 (Henri III)'],
  ['Catherine de Médicis', '카트린 드 메디시스 (Catherine de Médicis)'],
  ['Urbain Grandier', '위르뱅 그랑디에 (Urbain Grandier)'],
  ['Loudun', '루됭 (Loudun)'],
  ['Louviers', '루비에 (Louviers)'],
  ['Lorraine', '로렌 (Lorraine)'],
  ['Bretagne', '브르타뉴 (Bretagne)'],
  ['Normandie', '노르망디 (Normandie)'],
  ['Gascogne', '가스코뉴 (Gascogne)'],
  ['Écosse', '스코틀랜드 (Écosse)'],
  ['Angleterre', '잉글랜드 (Angleterre)'],
  ['Allemagne', '독일 (Allemagne)'],
  ['Espagne', '스페인 (Espagne)'],
  ['Italie', '이탈리아 (Italie)'],
  ['Suède', '스웨덴 (Suède)'],
  ['Égypte', '이집트 (Égypte)'],
  ['Inde', '인도 (Inde)'],
  ['Chine', '중국 (Chine)'],
  ['Japon', '일본 (Japon)'],
  ['Perse', '페르시아 (Perse)'],
  ['Rome', '로마 (Rome)'],
  ['Paris', '파리 (Paris)'],
  ['Venise', '베네치아 (Venise)'],
  ['Babylone', '바빌론 (Babylone)'],
  ['Jérusalem', '예루살렘 (Jérusalem)']
];

const TRANSLATION_CACHE = fs.existsSync('resources/translations_ko_cache.json')
  ? JSON.parse(fs.readFileSync('resources/translations_ko_cache.json', 'utf8'))
  : {};

function polishTranslation(rawKo, e, koBase) {
  let s = String(rawKo || '').trim();
  const displayTitle = `${koBase} (${e.nameFr})`;
  if (!s) return `${displayTitle} — ${e.textFr}`;

  // Strip leading headword repetition if present
  const escName = e.nameFr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escBase = e.baseFr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escKo = koBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  s = s.replace(new RegExp(`^(?:${escName}|${escBase}|${escKo})\\s*(?:—|-|\\.)\\s*`, 'i'), '');

  // Fix common occult/demonology mistranslations and attach English/original proper nouns
  s = s
    .replace(/마술사 안식일의 밤 모임|마녀 안식일의 밤 모임|안식일 밤 마술사들의 모임|마법사의 안식일|마녀들의 안식일|안식일/g, '사바트 (Sabbat)')
    .replace(/솔로몬의 빗장뼈|솔로몬의 쇄골/g, '『솔로몬의 열쇠 (Clavicules de Salomon)』')
    .replace(/항목보기\.?|항목 참조\.?|이 기사를 참조하세요\.?|이 기사를 보십시오\.?/g, '해당 항목 참조.')
    .replace(/참조\s*:\s*이 단어\.?/g, '해당 항목 참조.')
    .replace(/\bDelancre\b/g, '피에르 드 랑크르 (Delancre)')
    .replace(/\bWierus\b|\bWiérus\b/g, '요한 바이어 (Wierus)')
    .replace(/\bBodin\b/g, '장 보댕 (Bodin)')
    .replace(/\bBoguet\b/g, '앙리 보게 (Boguet)')
    .replace(/\bDelrio\b/g, '마르틴 델리오 (Delrio)')
    .replace(/\bBekker\b/g, '발타자르 베커르 (Bekker)')
    .replace(/\bCalmet\b/g, '아우구스탱 칼메 (Calmet)')
    .replace(/\bGörres\b|\bGœrres\b/g, '요제프 괴레스 (Görres)')
    .replace(/\bPaymon\b/g, '파이몬 (Paymon)')
    .replace(/\bPythagore\b|피타고라스(?![\s(]*Pythagore)/g, '피타고라스 (Pythagore)')
    .replace(/\bApollo\b|\bApollon\b|아폴론(?![\s(]*Apollon)/g, '아폴론 (Apollon)')
    .replace(/\bMinerve\b|미네르바(?![\s(]*Minerve)/g, '미네르바 (Minerve)');

  // Replace raw French headword at the very start of the Korean sentence with "한글명 (원문)"
  const plainNameFr = e.nameFr.replace(/’/g, "'");
  if (s.startsWith(e.nameFr)) {
    s = displayTitle + s.slice(e.nameFr.length);
  } else if (s.startsWith(plainNameFr)) {
    s = displayTitle + s.slice(plainNameFr.length);
  } else if (s.startsWith(e.baseFr)) {
    let rest = s.slice(e.baseFr.length);
    const parenM = e.nameFr.match(/\(([^)]+)\)/);
    if (parenM) {
      const p1 = `(${parenM[1]})`;
      const p2 = `(${parenM[1].replace(/’/g, "'")})`;
      if (rest.trimStart().startsWith(p1)) {
        rest = rest.trimStart().slice(p1.length);
      } else if (rest.trimStart().startsWith(p2)) {
        rest = rest.trimStart().slice(p2.length);
      }
    }
    s = displayTitle + rest;
  }

  return s.replace(/\s+/g, ' ').trim();
}

// Classify and attach pure Korean translation for any 1863 entry
function analyzeAndTranslateEntry(e, koBase) {
  const t = e.textFr.trim();
  const lead = t.slice(0, 260);

  // 1. Check if cross-reference ("Voy. X")
  if (/^(?:voy\.|voyez)\s+/i.test(t) && t.length < 110) {
    const target = t.replace(/^(?:voy\.|voyez)\s+/i, '').replace(/\.$/, '').trim();
    const targetKo = frHeadwordToKo(target, target);
    const pureRef = `${targetKo} (${target}) 참조.`;
    return {
      category: 'crossref',
      rank: '상호참조 표제어 (Renvoi)',
      legions: 0,
      domains: ['상호참조', `${targetKo} (${target})`],
      summary: pureRef,
      description: pureRef
    };
  }

  // Extract legions if mentioned
  let legions = 0;
  const legM = t.match(/\b(\d+|vingt|trente|quarante|cinquante|soixante|cent)\s+légions/i);
  if (legM) {
    const wMap = { vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, cent: 100 };
    legions = Number(legM[1]) || wMap[legM[1].toLowerCase()] || 0;
  }

  // Extract years / centuries
  const years = [...new Set((t.match(/\b1[0-8]\d{2}\b/g) || []).slice(0, 3))];
  const centMap = {
    'premier': '1', 'deuxième': '2', 'second': '2', 'troisième': '3', 'quatrième': '4',
    'cinquième': '5', 'sixième': '6', 'septième': '7', 'huitième': '8', 'neuvième': '9',
    'dixième': '10', 'onzième': '11', 'douzième': '12', 'treizième': '13', 'quatorzième': '14',
    'quinzième': '15', 'seizième': '16', 'dix-septième': '17', 'dix-huitième': '18', 'dix-neuvième': '19'
  };
  let centuryKo = '';
  const centM = t.match(/\b(premier|deuxième|second|troisième|quatrième|cinquième|sixième|septième|huitième|neuvième|dixième|onzième|douzième|treizième|quatorzième|quinzième|seizième|dix-septième|dix-huitième|dix-neuvième)\s+siècle/i);
  if (centM) {
    centuryKo = `${centMap[centM[1].toLowerCase()]}세기`;
  }

  // Determine Category & Role Title
  let category = 'superstition';
  let rank = '민간 전승·기담 (Tradition & Superstition)';
  const domains = [];

  if (/\b(?:grand-duc|grand président|marquis de l’enfer|prince de l’enfer|prince des démons|chef des démons|démon|diable|succube|incube|lutin|farfadet|gobelin|vampire|loup-garou|sabbat|possédé|possession|exorcis)/i.test(lead)) {
    category = 'demon';
    if (/grand-duc/i.test(lead)) rank = '지옥의 대공 (Grand-Duc Infernal)';
    else if (/grand président/i.test(lead)) rank = '지옥의 대총재 (Grand Président)';
    else if (/marquis/i.test(lead)) rank = '지옥의 후작 (Marquis de l’Enfer)';
    else if (/prince|chef|roi de l’enfer/i.test(lead)) rank = '지옥 군주·고위 악마 (Prince des Démons)';
    else if (/loup-garou|lycanthrop/i.test(lead)) rank = '늑대인간 전승 (Loup-Garou)';
    else if (/vampire/i.test(lead)) rank = '흡혈귀 전승 (Vampire)';
    else if (/lutin|farfadet|gobelin|esprit familier/i.test(lead)) rank = '가정 정령·사역마 (Esprit Familier / Lutin)';
    else if (/possédé|possession|énergumène/i.test(lead)) rank = '악령 빙의 사건 (Possession Démoniaque)';
    else if (/sabbat/i.test(lead + ' ' + e.nameFr)) rank = '사바트 의식·전승 (Rituel du Sabbat)';
    else rank = '악마·초자연적 정령 (Démon & Esprit)';
    domains.push('악마학 (Démonologie)');
  } else if (/mancie\b|scopie\b|\bdivination\b|\bprésage|\baugure|\boracle|\bsonge|\bastrolog|\bchiroman|\bhoroscope/i.test(e.nameFr + ' ' + lead)) {
    category = 'divination';
    if (/mancie\b|divination/i.test(e.nameFr + ' ' + lead)) rank = '고대·중세 점술 (Art Divinatoire)';
    else if (/astrolog|horoscope|planète|constellation/i.test(e.nameFr + ' ' + lead)) rank = '점성술·천문 예언 (Astrologie)';
    else if (/songe|oniroman|rêve/i.test(e.nameFr + ' ' + lead)) rank = '해몽·몽점 (Oniromancie)';
    else rank = '징조·신탁·예언술 (Présage & Oracle)';
    domains.push('점술·예언 (Divination)');
  } else if (/\b(?:livre|ouvrage|traité|grimoire|clavicule|manuscrit|recueil)\b/i.test(lead) && !/\b(?:sorcier|sorcière|magicien|astrologue|alchimiste|inquisiteur|empereur|roi|pape|évêque|prêtre|philosophe)\b/i.test(lead.slice(0, 75))) {
    category = 'grimoire';
    rank = '마도서·오컬트 문헌 (Grimoire & Traité)';
    domains.push('마도서·문헌 (Grimoire)');
  } else if (/\([A-ZÀ-Ÿ]/.test(e.nameFr) || /\b(?:magicien|magicienne|sorcier|sorcière|astrologue|alchimiste|devin|devineresse|cabaliste|inquisiteur|démonographe|philosophe|médecin|savant|écrivain|auteur|empereur|roi|reine|pape|évêque|prêtre|moine|religieuse|saint|sainte|hérétique|imposteur|prédicateur|né\s+à|née\s+à|mort\s+en|vivait\s+au)\b/i.test(lead)) {
    category = 'person';
    if (/sorcière/i.test(lead)) rank = '마녀·주술사 (Sorcière)';
    else if (/sorcier/i.test(lead)) rank = '마법사·주술사 (Sorcier)';
    else if (/magicien|magicienne|enchanteur/i.test(lead)) rank = '마법사·비술사 (Magicien)';
    else if (/astrologue/i.test(lead)) rank = '점성술사 (Astrologue)';
    else if (/alchimiste|adepte/i.test(lead)) rank = '연금술사 (Alchimiste)';
    else if (/démonographe|inquisiteur/i.test(lead)) rank = '악마학자·이단심문관 (Démonographe & Inquisiteur)';
    else if (/empereur|roi|reine|prince/i.test(lead)) rank = '역사 속 군주·귀족 (Souverain & Personnage)';
    else if (/pape|évêque|prêtre|abbé|moine|religieuse|saint/i.test(lead)) rank = '성직자·종교 인물 (Ecclésiastique & Saint)';
    else if (/philosophe|médecin|savant|auteur|écrivain/i.test(lead)) rank = '학자·의사·저술가 (Savant & Auteur)';
    else rank = '오컬트·역사 인물 (Personnage Historique)';
    domains.push('인물·역사 (Personnage)');
  } else if (/\b(?:dieu|déesse|idole|mythologie|fée|géant|monstre|enfer des|purgatoire des|ange|prophète|peuple|habitants de|chez les anciens|légende)\b/i.test(lead)) {
    category = 'myth';
    if (/dieu|déesse|idole/i.test(lead)) rank = '고대 신격·우상 (Divinité & Idole)';
    else if (/fée|nymphe|géant|monstre/i.test(lead)) rank = '신화·전설의 존재 (Créature Mythologique)';
    else if (/enfer|purgatoire|paradis/i.test(lead)) rank = '내세관·타계 전승 (Mythologie de l’Au-delà)';
    else rank = '세계 신화·종교 전승 (Mythologie & Légende)';
    domains.push('신화·종교 (Mythologie)');
  } else {
    category = 'superstition';
    if (/pierre|plante|herbe|arbre|racine/i.test(lead)) rank = '마법 광물·식물 비방 (Pierre & Plante Magique)';
    else if (/animal|oiseau|serpent|poisson|insecte|chat|chien/i.test(lead)) rank = '동물 관련 미신·상징 (Superstition Animale)';
    else if (/talisman|amulette|charme|remède/i.test(lead)) rank = '부적·치유 주술 (Talisman & Charme)';
    else rank = '민간 미신·기담 (Superstition & Coutume)';
    domains.push('미신·민속 (Superstition)');
  }

  if (centuryKo) domains.push(centuryKo);
  if (years.length) domains.push(`${years[0]}년 기록`);
  if (e.images && e.images.length) domains.push('1863 원서 삽화 수록');

  const cacheKey = `${e.nameFr}@@${e.page1863}`;
  const rawKo = TRANSLATION_CACHE[cacheKey] || '';
  const bodyKo = polishTranslation(rawKo, e, koBase);

  // First 1-2 sentences for card preview summary
  const sentMatch = bodyKo.match(/^(.{20,140}?[\.!\?])\s+/);
  const summaryKo = sentMatch ? sentMatch[1] : (bodyKo.length > 140 ? bodyKo.slice(0, 140) + '…' : bodyKo);

  return {
    category,
    rank,
    legions,
    domains,
    summary: summaryKo,
    description: bodyKo
  };
}

// Match the 68 existing illustrated entries against rawEntries
const usedPlateIds = new Set();
const fullEntries = [];

for (let idx = 0; idx < rawEntries.length; idx++) {
  const raw = rawEntries[idx];
  const nBase = norm(raw.baseFr);
  const nFull = norm(raw.nameFr);

  // Find matching plate entry
  let matchedPlate = null;
  for (const pe of PLATE_ENTRIES) {
    if (usedPlateIds.has(pe.id)) continue;
    const cands = pe.nameFr.split(/[\(\)\/,]/).map(s => norm(s)).filter(Boolean);
    if (pe.id === 'transport-sorcerers' && nFull === norm('Transport des sorcières')) {
      matchedPlate = pe;
      break;
    }
    if (pe.id === 'voyages-sorcerers' && nFull === norm('Voyages des sorcières')) {
      matchedPlate = pe;
      break;
    }
    if (cands.some(c => c === nBase || c === nFull)) {
      matchedPlate = pe;
      break;
    }
  }

  const koBase = matchedPlate ? matchedPlate.nameKo : frHeadwordToKo(raw.nameFr, raw.baseFr);
  // Ensure nameKo ALWAYS includes English/Original notation alongside Korean proper noun!
  const nameKoWithOriginal = `${koBase} (${raw.nameFr})`;

  if (matchedPlate) {
    usedPlateIds.add(matchedPlate.id);
    fullEntries.push({
      id: matchedPlate.id,
      letter: raw.letter,
      plate: matchedPlate.plate,
      plateNo: matchedPlate.plateNo,
      hasPlate: true,
      nameKo: nameKoWithOriginal,
      nameKoShort: koBase,
      nameFr: matchedPlate.nameFr,
      rank: matchedPlate.rank,
      legions: matchedPlate.legions || 0,
      category: 'demon',
      subCategory: matchedPlate.category,
      domains: matchedPlate.domains || [],
      appearance: matchedPlate.appearance || '',
      summary: matchedPlate.summary,
      description: matchedPlate.description,
      quoteFr: raw.textFr || matchedPlate.quoteFr,
      page1863: raw.page1863 || matchedPlate.page1863
    });
  } else {
    const slugBase = norm(raw.nameFr).slice(0, 28) || `entry${idx + 1}`;
    const id = `e${idx + 1}-${slugBase}`;
    const info = analyzeAndTranslateEntry(raw, koBase);
    fullEntries.push({
      id,
      letter: raw.letter,
      plate: '',
      plateNo: 0,
      hasPlate: false,
      nameKo: nameKoWithOriginal,
      nameKoShort: koBase,
      nameFr: raw.nameFr,
      rank: info.rank,
      legions: info.legions,
      category: info.category,
      subCategory: info.category,
      domains: info.domains,
      appearance: '',
      summary: info.summary,
      description: info.description,
      quoteFr: raw.textFr,
      page1863: raw.page1863
    });
  }
}

// Check if any of the 68 plate entries wasn't matched (fallback)
for (const pe of PLATE_ENTRIES) {
  if (!usedPlateIds.has(pe.id)) {
    console.log('Adding unmatched plate entry:', pe.id, pe.nameFr);
    const letter = pe.nameFr[0].toUpperCase();
    fullEntries.push({
      id: pe.id,
      letter,
      plate: pe.plate,
      plateNo: pe.plateNo,
      hasPlate: true,
      nameKo: `${pe.nameKo} (${pe.nameFr})`,
      nameKoShort: pe.nameKo,
      nameFr: pe.nameFr,
      rank: pe.rank,
      legions: pe.legions || 0,
      category: 'demon',
      subCategory: pe.category,
      domains: pe.domains || [],
      appearance: pe.appearance || '',
      summary: pe.summary,
      description: pe.description,
      quoteFr: pe.quoteFr,
      page1863: pe.page1863
    });
  }
}

console.log('Total full entries built:', fullEntries.length);
console.log('Illustrated plate entries:', fullEntries.filter(e => e.hasPlate).length);

const jsContent = `export const CATEGORIES=[
  {id:"all",label:"전체 (3,810)"},
  {id:"illustrated",label:"판화 수록 (68)"},
  {id:"demon",label:"악마·정령·사바트"},
  {id:"person",label:"마법사·인물"},
  {id:"divination",label:"점술·점성술"},
  {id:"superstition",label:"미신·민속·기담"},
  {id:"myth",label:"신화·종교·타계"},
  {id:"grimoire",label:"마도서·문헌"},
  {id:"crossref",label:"상호참조"}
];

export const GALLERY_CATEGORIES=[
  {id:"all",label:"전체 (68)"},
  {id:"monarch",label:"지옥 군주"},
  {id:"duke",label:"대공·후작·총재"},
  {id:"spirit",label:"하급 악마·괴이"},
  {id:"myth",label:"고대 신화·사바트"}
];

export const LETTERS=["ALL","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];

export const ENTRIES=${JSON.stringify(fullEntries)};

export const ILLUSTRATED_ENTRIES=ENTRIES.filter(entry=>entry.hasPlate);
export const ENTRY_MAP=new Map(ENTRIES.map(entry=>[entry.id,entry]));
export const VALID_ENTRY_IDS=new Set(ENTRIES.map(entry=>entry.id));

export function getDailyEntry(dateStr=new Date().toISOString().slice(0,10)){
  let hash=2166136261;
  for(let i=0;i<dateStr.length;i++){
    hash^=dateStr.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }
  const pool=ILLUSTRATED_ENTRIES.length?ILLUSTRATED_ENTRIES:ENTRIES;
  const index=Math.abs(hash)%pool.length;
  return pool[index];
}

export function filterEntries({query="",category="all",letter="ALL",sort="page",onlyIllustrated=false}={}){
  const q=String(query||"").trim().toLowerCase();
  const source=onlyIllustrated?ILLUSTRATED_ENTRIES:ENTRIES;
  const filtered=source.filter(entry=>{
    if(letter&&letter!=="ALL"&&entry.letter!==letter)return false;
    if(category!=="all"){
      if(onlyIllustrated){
        if(entry.subCategory!==category)return false;
      }else if(category==="illustrated"){
        if(!entry.hasPlate)return false;
      }else if(category==="monarch"||category==="duke"||category==="spirit"){
        if(entry.subCategory!==category)return false;
      }else if(entry.category!==category){
        return false;
      }
    }
    if(!q)return true;
    const haystack=[
      entry.nameKo,
      entry.nameFr,
      entry.rank,
      entry.summary,
      entry.description,
      entry.quoteFr,
      ...(entry.domains||[])
    ].join(" ").toLowerCase();
    return haystack.includes(q);
  });

  return filtered.sort((a,b)=>{
    if(sort==="ko")return a.nameKo.localeCompare(b.nameKo,"ko");
    if(sort==="fr")return a.nameFr.localeCompare(b.nameFr,"fr");
    if(sort==="legions")return (b.legions||0)-(a.legions||0)||(a.plateNo||9999)-(b.plateNo||9999)||a.page1863-b.page1863;
    if(sort==="plate")return (b.hasPlate?1:0)-(a.hasPlate?1:0)||(a.plateNo||9999)-(b.plateNo||9999)||a.page1863-b.page1863;
    return a.page1863-b.page1863||a.nameFr.localeCompare(b.nameFr,"fr");
  });
}
`;
fs.writeFileSync('dist/entries.js', jsContent);

