import fs from 'node:fs';
import { BODY_PROPER_REPLACEMENTS } from './scripts-proper-nouns.mjs';

// Load the 3,810 clean 1863 entries
const rawEntries = JSON.parse(fs.readFileSync('resources/entries_1863_all.json', 'utf8'));
// Load the existing 68 rich illustrated entries
const PLATE_ENTRIES = JSON.parse(fs.readFileSync('resources/entries_68_plates.json', 'utf8'));
const entryPlateMap = fs.existsSync('resources/entry_plate_map.json')
  ? JSON.parse(fs.readFileSync('resources/entry_plate_map.json', 'utf8'))
  : {};
import path from 'node:path';
let nextPlateNo = 69;

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
  'accouchements prodigieux': '불가사의한 출산', 'acham': '아캄', 'achamoth': '아카모트',
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
  'voisin (la)': '라 부아쟁', 'voisin': '라 부아쟁', 'voisinla': '라 부아쟁',
  'wall': '발(부알)', 'wierus': '요한 바이어', 'wiérus': '요한 바이어',
  'xaphan': '자판', 'xéno': '제노',
  'zabulon': '자불론', 'zacharie': '자카리아', 'zacoum': '자쿰 나무', 'zaebos': '자에보스',
  'zagam': '자감', 'zahuris': '자후리스', 'zairagie': '자이라지에', 'zairagie (zairagiah)': '자이라지에',
  'zapan': '자판', 'zariatnatmik': '자리아트나트믹', 'zazarraguan': '자자라구안', 'zédéchias': '체데키아스',
  'zeernébooch': '체르노보그', 'zépar': '제파르', 'ziganis': '치가니스', 'zigheuners': '치고이너',
  'zodiaque': '황도 12궁', 'zombi': '좀비', 'zoroastre': '조로아스터'
};

const NAME_MAP = {
  'jean': '장', 'jeanne': '잔', 'jeannette': '잔네트', 'pierre': '피에르', 'paul': '폴',
  'jacques': '자크', 'françois': '프랑수아', 'françoise': '프랑수아즈', 'louis': '루이',
  'louise': '루이즈', 'charles': '샤를', 'henri': '앙리', 'henriette': '앙리에트',
  'antoine': '앙투안', 'antoinette': '앙투아네트', 'nicolas': '니콜라', 'michel': '미셸',
  'joseph': '조제프', 'marie': '마리', 'marguerite': '마르그리트', 'catherine': '카트린',
  'anne': '안', 'madeleine': '마들렌', 'élisabeth': '엘리자베트', 'guillaume': '기욤',
  'robert': '로베르', 'richard': '리샤르', 'thomas': '토마', 'martin': '마르탱',
  'bernard': '베르나르', 'albert': '알베르', 'alexandre': '알렉산드로스', 'alexandre le grand': '알렉산드로스 대왕', 'andré': '앙드레',
  'barthélemy': '바르텔레미', 'barthélémy': '바르텔레미', 'benoît': '브누아', 'claude': '클로드',
  'clément': '클레망', 'daniel': '다니엘', 'david': '다비드', 'denis': '드니', 'dominique': '도미니크',
  'édouard': '에두아르', 'étienne': '에티엔', 'eugène': '외젠', 'félipe': '펠리페', 'philippe': '필리프',
  'frédéric': '프레데리크', 'gabriel': '가브리엘', 'gaspard': '가스파르', 'georges': '조르주',
  'george': '조르주', 'gilles': '질', 'grégoire': '그레구아르', 'guy': '기', 'hugues': '위그', 'hugues le grand': '위그 대공',
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
    .replace(/chr/g, 'kr')
    .replace(/chl/g, 'kl')
    .replace(/chn/g, 'kn')
    .replace(/chm/g, 'km')
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
    .replace(/ll/g, 'L')
    .replace(/([bcdfghjkmnprstvwz])\1+/g, '$1')
    .replace(/([bcdfghjklmnpqrstvwzSNL])e$/, '$1');

  const C_CHO = {
    b:'ㅂ', c:'ㅋ', d:'ㄷ', f:'ㅍ', g:'ㄱ', h:'ㅎ', j:'ㅈ', k:'ㅋ',
    l:'ㄹ', L:'ㄹ', m:'ㅁ', n:'ㄴ', p:'ㅍ', q:'ㅋ', r:'ㄹ', s:'ㅅ', t:'ㅌ',
    v:'ㅂ', w:'ㅇ', z:'ㅈ', S:'ㅅ', C:'ㅊ', N:'ㄴ'
  };
  const V_JUNG = {
    a:'ㅏ', e:'ㅔ', i:'ㅣ', o:'ㅗ', u:'ㅜ', y:'ㅣ', W:'ㅘ', O:'ㅚ'
  };
  const BATCHIM_MAP = {
    n: 'ㄴ', m: 'ㅁ', l: 'ㄹ', L: 'ㄹ', p: 'ㅂ', k: 'ㄱ', c: 'ㄱ'
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
      if ((ch === 'L' || ch === 'l') && syls.length > 0 && V_JUNG[next]) {
        const merged = addBatchim(syls[syls.length - 1], 'ㄹ');
        if (merged) syls[syls.length - 1] = merged;
      }
      if (V_JUNG[next]) {
        let jung = V_JUNG[next];
        if ((ch === 'S' || ch === 'N') && jung === 'ㅏ') jung = 'ㅑ';
        if ((ch === 'S' || ch === 'N') && jung === 'ㅗ') jung = 'ㅛ';
        if ((ch === 'S' || ch === 'N') && jung === 'ㅜ') jung = 'ㅠ';
        syls.push(composeHangul(C_CHO[ch], jung));
        i += 2;
      } else {
        const b = BATCHIM_MAP[ch];
        // Do not merge p, k, c as batchim when followed by r or l (e.g. pr, pl, cr, cl)
        const skipBatchim = (ch === 'p' || ch === 'k' || ch === 'c') && (next === 'r' || next === 'l' || next === 'L');
        if (b && !skipBatchim && syls.length > 0) {
          const merged = addBatchim(syls[syls.length - 1], b);
          if (merged) {
            syls[syls.length - 1] = merged;
            i += 1;
            continue;
          }
        }
        const emptySyl = composeHangul(C_CHO[ch], ch === 'S' || ch === 'j' || ch === 'C' ? 'ㅠ' : 'ㅡ');
        if ((next === 'l' || next === 'L') && V_JUNG[w[i + 2] || '']) {
          syls.push(addBatchim(emptySyl, 'ㄹ') || emptySyl);
        } else {
          syls.push(emptySyl);
        }
        i += 1;
      }
    } else {
      i += 1;
    }
  }
  return syls.join('') || word;
}

const TRANSLATION_CACHE = fs.existsSync('resources/translations_ko_cache.json')
  ? JSON.parse(fs.readFileSync('resources/translations_ko_cache.json', 'utf8'))
  : {};

const CURATED_OVERRIDES = fs.existsSync('resources/curated_ko_overrides.json')
  ? JSON.parse(fs.readFileSync('resources/curated_ko_overrides.json', 'utf8'))
  : {};

const BAD_CACHE_HEADWORDS = new Set([
  '헛소리','바커','콘돔','방부제','캐릭터','표창','도당','마법의 책','그러나','하지만',
  '따라서','그들은','우리는','이것은','그것은','그녀는','그는','모든','일부','많은',
  '어떤','비록','아마도','오늘날','옛날','참조','보라','이웃'
]);

const ROMAN_NUMERALS_MAP = {
  'i': '1세', 'ii': '2세', 'iii': '3세', 'iv': '4세', 'v': '5세',
  'vi': '6세', 'vii': '7세', 'viii': '8세', 'ix': '9세', 'x': '10세',
  'xi': '11세', 'xii': '12세', 'xiii': '13세', 'xiv': '14세', 'xv': '15세',
  'xvi': '16세', 'xvii': '17세', 'xviii': '18세', 'xix': '19세', 'xx': '20세',
  'xxi': '21세', 'xxii': '22세', 'xxiii': '23세', 'xxiv': '24세'
};

function extractKoHeadwordFromCache(rawKo, e) {
  if (!rawKo || !e) return '';
  const v = String(rawKo).trim();
  let m = v.match(/^([0-9가-힣][0-9가-힣\s·]{0,18}?)(?:\s*\([^)]+\))?\s*(?:—|-)\s+/);
  if (!m && e.textFr && (e.textFr.indexOf('.') < 0 || e.textFr.indexOf('.') > 25)) {
    m = v.match(/^([0-9가-힣][0-9가-힣\s·]{0,16}?)(?:\s*\([^)]+\))?\.\s+/);
  }
  if (!m) {
    m = v.match(/^([0-9가-힣]{2,10})(?:\s*\([^)]+\))?[은는]\s+/);
  }
  if (!m) return '';
  let cand = m[1].trim()
    .replace(/마법사의 안식일|마녀들의 안식일|안식일/g, '사바트')
    .replace(/솔로몬의 쇄골|솔로몬의 빗장뼈/g, '솔로몬의 열쇠');
  if (cand.length < 1 || cand.length > 18) return '';
  if (/[다요죠네까]$/.test(cand)) return '';
  if (BAD_CACHE_HEADWORDS.has(cand)) return '';
  return cand;
}

function frHeadwordToKo(nameFr, baseFr, rawEntry = null, id = null) {
  if (id && CURATED_HEADWORD_RULES[id]) return CURATED_HEADWORD_RULES[id].nameKoShort;
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
    // Check if TRANSLATION_CACHE already has a clean Korean headword for this entry
    if (rawEntry) {
      const cacheKey = `${rawEntry.nameFr}@@${rawEntry.page1863}`;
      const fromCache = (id && TRANSLATION_CACHE[id] && extractKoHeadwordFromCache(TRANSLATION_CACHE[id], rawEntry)) ||
                        extractKoHeadwordFromCache(TRANSLATION_CACHE[cacheKey], rawEntry);
      if (fromCache) baseKo = fromCache;
    }
    if (!baseKo) {
      const cleanTarget = baseFr || nameFr;
      const tokens = cleanTarget.split(/(\s+|\-)/);
      const isMultiWord = tokens.filter(t => t.trim() && t !== '-').length > 1;
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
        if (ROMAN_NUMERALS_MAP[low]) return ROMAN_NUMERALS_MAP[low];
        if (NAME_MAP[low]) return NAME_MAP[low];
        if (!isMultiWord && WORD_DICT[low]) return WORD_DICT[low];
        return wordToHangul(sub);
      }).filter(Boolean).join(' ').replace(/\s+/g, ' ').replace(/\s*·\s*/g, '·').trim();
    }
  }

  // Rule 2: Parenthetical surname inversion or title handling
  const parenM = String(nameFr || '').match(/\(([^)]+)\)/);
  if (parenM && !WORD_DICT[fullLow] && !WORD_DICT[fullLowPlain]) {
    const inner = parenM[1].trim();
    const innerLow = inner.toLowerCase();

    // Check titles
    if (innerLow === 'l’abbé' || innerLow === "l'abbé" || innerLow === 'abbé') {
      return `수도원장 ${baseKo}`;
    }
    if (innerLow.startsWith('le comte') || innerLow.startsWith('comte')) {
      return `${baseKo} 백작`;
    }
    if (innerLow === 'le chevalier') {
      return `${baseKo} 기사`;
    }
    if (innerLow === 'le roi') {
      return `${baseKo} 왕`;
    }
    if (innerLow === 'le vénérable') {
      return `가경자 ${baseKo}`;
    }

    // Given names
    const cleanInner = inner.replace(/^(?:d’|d'|l’|l'|de\s+)/i, '').trim();
    if (cleanInner && cleanInner.length < 30) {
      const innerTokens = cleanInner.split(/[\s\-]+/).map(t => {
        const tl = t.toLowerCase().replace(/^(?:d’|d'|l’|l')/i, '');
        if (!tl || ['m.','mm.','dit','dite','de','du','la','le'].includes(tl)) return '';
        return NAME_MAP[tl] || wordToHangul(tl);
      }).filter(Boolean);
      if (innerTokens.length) {
        const innerStr = innerTokens.join(' ');
        if (baseKo.includes(innerStr)) return baseKo;
        if (innerLow.includes('d’') || innerLow.includes("d'") || innerLow.startsWith('de ')) {
          const joinedBase = (baseKo.startsWith('다') || baseKo.startsWith('드')) ? baseKo : `드 ${baseKo}`;
          return `${innerStr} ${joinedBase}`;
        }
        return `${innerStr} ${baseKo}`;
      }
    }
  }

  return baseKo || baseFr || nameFr;
}


const CURATED_HEADWORD_RULES = {
  'aigle@@11': { nameKo: '독수리 [Aigle / Eagle]', nameKoShort: '독수리' },
  'accouchements prodigieux@@5': { nameKo: '불가사의한 출산 [Accouchements Prodigieux / Prodigious Births]', nameKoShort: '불가사의한 출산' },
  'adam (l’abbé)@@6': { nameKo: '수도원장 아담 [Adam (L’Abbé)]', nameKoShort: '수도원장 아담' },
  'abadie (jeannette d’)@@1': { nameKo: '자네뜨 다바디 [Abadie (Jeannette d’)]', nameKoShort: '자네뜨 다바디' },
  'abracax@@3': { nameKo: '아브라카스 또는 아브락사스 [Abracax, Abraxas]', nameKoShort: '아브라카스 또는 아브락사스' },
  'alexandre le grand@@14': { nameKo: '알렉산드로스 대왕 [Alexandre le Grand / Alexander the Great]', nameKoShort: '알렉산드로스 대왕' },
  'hugues le grand@@340': { nameKo: '위그 대공 [Hugues le Grand / Hugh the Great]', nameKoShort: '위그 대공' },
  'albert le grand@@12': { nameKo: '알베르투스 마그누스 [Albert le Grand / Albert the Great]', nameKoShort: '알베르투스 마그누스' },
  'alary (françois)@@12': { nameKo: '프랑수아 알라리 [Alary (François)]', nameKoShort: '프랑수아 알라리' },
  'abdeel (abraham)@@1': { nameKo: '아브라함 압델 [Abdeel (Abraham)]', nameKoShort: '아브라함 압델' },
  'aconce (jacques)@@6': { nameKo: '자크 아콘시오 [Aconce (Jacques)]', nameKoShort: '자크 아콘시오' },
  'adelgreiff (jean-albert)@@7': { nameKo: '장알베르트 아델그라이프 [Adelgreiff (Jean-Albert)]', nameKoShort: '장알베르트 아델그라이프' },
  'adelung (jean-christophe)@@7': { nameKo: '요한 크리스토프 아델룽 [Adelung (Jean-Christophe)]', nameKoShort: '요한 크리스토프 아델룽' },
  'ævoli (césar)@@9': { nameKo: '체사레 아에볼리 [Ævoli (César)]', nameKoShort: '체사레 아에볼리' },
  'agrippa (henri-corneille)@@10': { nameKo: '하인리히 코르넬리우스 아그리파 [Agrippa (Henri-Corneille)]', nameKoShort: '하인리히 코르넬리우스 아그리파' },
  'aguerre (pierre d’)@@10': { nameKo: '피에르 다게르 [Aguerre (Pierre d’)]', nameKoShort: '피에르 다게르' },

  // Disambiguated Jean entries (p.373)
  'e2167-jean': { nameKo: '마법사 장 [Jean (Magicien) / John the Magician]', nameKoShort: '마법사 장', nameFr: 'Jean (Magicien)', nameEn: 'John the Magician' },
  'e2168-jean': { nameKo: '총대주교 장 [Jean (Patriarche de Constantinople)]', nameKoShort: '총대주교 장', nameFr: 'Jean (Patriarche de Constantinople)', nameEn: '' },
  'e2169-jeanxxii': { nameKo: '요한 22세 [Jean XXII / Pope John XXII]', nameKoShort: '요한 22세', nameFr: 'Jean XXII', nameEn: 'Pope John XXII' },
  'e2170-jean': { nameKo: '이반 뇌제 또는 장 [Jean, Iwan Basilowitz / Ivan the Terrible]', nameKoShort: '이반 뇌제 또는 장', nameFr: 'Jean, Iwan Basilowitz', nameEn: 'Ivan the Terrible' },

  // Disambiguated Phénix entries (p.525)
  'e3011-phenix': { nameKo: '페닉스 [Phénix / Phenex]', nameKoShort: '페닉스', nameFr: 'Phénix', nameEn: 'Phenex' },
  'e3012-phenix': { nameKo: '불사조 [Phénix / Phoenix]', nameKoShort: '불사조', nameFr: 'Phénix', nameEn: 'Phoenix' },

  // Disambiguated Retz entries (p.576)
  'e3211-retz': { nameKo: '질 드 레 또는 레츠 [Retz, Gilles de Laval de / Gilles de Rais]', nameKoShort: '질 드 레 또는 레츠', nameFr: 'Retz (Gilles de Laval de)', nameEn: 'Gilles de Rais' },
  'e3212-retz': { nameKo: '레츠 추기경 [Retz (Le Cardinal de)]', nameKoShort: '레츠 추기경', nameFr: 'Retz (Le Cardinal de)', nameEn: '' },

  // Disambiguated Robert entries (p.583)
  'e3231-robert': { nameKo: '악마 로베르 [Robert (Démon)]', nameKoShort: '악마 로베르', nameFr: 'Robert (Démon)', nameEn: '' },
  'e3233-robert': { nameKo: '아르투아의 로베르 [Robert (Sorcier d’Artois) / Robert of Artois]', nameKoShort: '아르투아의 로베르', nameFr: 'Robert (Sorcier d’Artois)', nameEn: 'Robert of Artois' },
  'e3234-robert': { nameKo: '로베르 2세 [Robert II (Roi de France) / Robert II of France]', nameKoShort: '로베르 2세', nameFr: 'Robert II (Roi de France)', nameEn: 'Robert II of France' },

  // Disambiguated David entries (p.199)
  'e1248-david': { nameKo: '다윗 [David / King David]', nameKoShort: '다윗', nameFr: 'David', nameEn: 'King David' },
  'e1249-david': { nameKo: '사제 다비드 [David (Prêtre) / Father David]', nameKoShort: '사제 다비드', nameFr: 'David (Prêtre)', nameEn: 'Father David' },

  // Disambiguated Henri III entries (p.331)
  'e1989-henriiii': { nameKo: '앙리 3세 [Henri III (Roi de France) / Henry III of France]', nameKoShort: '앙리 3세', nameFr: 'Henri III (Roi de France)', nameEn: 'Henry III of France' },
  'e1990-henriiii': { nameKo: '하인리히 3세 [Henri III (Empereur d’Allemagne) / Henry III]', nameKoShort: '하인리히 3세', nameFr: 'Henri III (Empereur d’Allemagne)', nameEn: 'Henry III' },

  // Disambiguated Henri IV entries (p.331)
  'e1991-henriiv': { nameKo: '하인리히 4세 [Henri IV (Empereur d’Allemagne) / Henry IV]', nameKoShort: '하인리히 4세', nameFr: 'Henri IV (Empereur d’Allemagne)', nameEn: 'Henry IV' },
  'e1992-henriiv': { nameKo: '헨리 4세 [Henri IV (Roi d’Angleterre) / Henry IV of England]', nameKoShort: '헨리 4세', nameFr: 'Henri IV (Roi d’Angleterre)', nameEn: 'Henry IV of England' },
  'e1994-henriiv': { nameKo: '앙리 4세 [Henri IV (Roi de France) / Henry IV of France]', nameKoShort: '앙리 4세', nameFr: 'Henri IV (Roi de France)', nameEn: 'Henry IV of France' },

  // Disambiguated Hélène entries (p.329)
  'e1976-helene': { nameKo: '헬레나 또는 올레인 [Hélène, Oléine / Helena of Adiabene]', nameKoShort: '헬레나 또는 올레인', nameFr: 'Hélène, Oléine', nameEn: 'Helena of Adiabene' },
  'e1977-helene': { nameKo: '헬레나 또는 셀레네 [Hélène, Sélène / Helena]', nameKoShort: '헬레나 또는 셀레네', nameFr: 'Hélène, Sélène', nameEn: 'Helena' },

  // Disambiguated Godwin entries (p.306)
  'e1846-godwin': { nameKo: '고드윈 백작 [Godwin (Comte de Kent)]', nameKoShort: '고드윈 백작', nameFr: 'Godwin (Comte de Kent)', nameEn: '' },
  'e1847-godwin': { nameKo: '윌리엄 고드윈 [Godwin (William)]', nameKoShort: '윌리엄 고드윈', nameFr: 'Godwin (William)', nameEn: '' },

  // Disambiguated Marguerite entries (p.445)
  'e2542-marguerite': { nameKo: '마르그리트 [Marguerite (De Hollande)]', nameKoShort: '마르그리트', nameFr: 'Marguerite (De Hollande)', nameEn: '' },
  'e2543-marguerite': { nameKo: '마르그리트 [Marguerite (De Milan)]', nameKoShort: '마르그리트', nameFr: 'Marguerite (De Milan)', nameEn: '' },

  // Disambiguated Charles II entries (p.158)
  'e950-charlesii': { nameKo: '샤를 2세 [Charles II (Duc de Lorraine)]', nameKoShort: '샤를 2세', nameFr: 'Charles II (Duc de Lorraine)', nameEn: '' },
  'e952-charlesii': { nameKo: '찰스 2세 [Charles II (Roi d’Angleterre) / Charles II of England]', nameKoShort: '찰스 2세', nameFr: 'Charles II (Roi d’Angleterre)', nameEn: 'Charles II of England' },

  // Disambiguated Desfontaines entries (p.206)
  'e1294-desfontaines': { nameKo: '데퐁텐 유령 기담 1부 [Desfontaines (Apparition I)]', nameKoShort: '데퐁텐 유령 기담 1부', nameFr: 'Desfontaines (Apparition I)', nameEn: '' },
  'e1296-desfontaines': { nameKo: '데퐁텐 유령 기담 2부 [Desfontaines (Apparition II)]', nameKoShort: '데퐁텐 유령 기담 2부', nameFr: 'Desfontaines (Apparition II)', nameEn: '' },

  // Disambiguated Année climatérique entries (p.39)
  'e225-anneeclimaterique': { nameKo: '환갑의 해 또는 위기의 해 (1) [Année climatérique / Climacteric Year]', nameKoShort: '환갑의 해 또는 위기의 해', nameFr: 'Année climatérique', nameEn: 'Climacteric Year' },
  'e227-anneeclimaterique': { nameKo: '환갑의 해 또는 위기의 해 (2) [Année climatérique / Climacteric Year]', nameKoShort: '환갑의 해 또는 위기의 해', nameFr: 'Année climatérique', nameEn: 'Climacteric Year' },

  // Z entries curated headwords
  'e3796-zabulon': { nameKo: '자불론 [Zabulon]', nameKoShort: '자불론', nameFr: 'Zabulon', nameEn: '' },
  'e3797-zacharie': { nameKo: '자카리아 [Zacharie / Zechariah]', nameKoShort: '자카리아', nameFr: 'Zacharie', nameEn: 'Zechariah' },
  'e3798-zacoum': { nameKo: '자쿰 나무 또는 자꿈 [Zacoum / Zaqqum]', nameKoShort: '자쿰 나무 또는 자꿈', nameFr: 'Zacoum', nameEn: 'Zaqqum' },
  'zaebos': { nameKo: '자에보스 또는 살로스 [Zaebos, Sallos]', nameKoShort: '자에보스 또는 살로스', nameFr: 'Zaebos (Sallos)', nameEn: '' },
  'e3800-zagam': { nameKo: '자감 또는 자간 [Zagam / Zagan]', nameKoShort: '자감 또는 자간', nameFr: 'Zagam', nameEn: 'Zagan' },
  'e3801-zahuris': { nameKo: '자후리스 또는 자호리스 [Zahuris, Zahories]', nameKoShort: '자후리스 또는 자호리스', nameFr: 'Zahuris', nameEn: '' },
  'e3802-zairagiezairagiah': { nameKo: '자이라지에 또는 자이라지아 [Zairagie, Zairagiah / Zairaja]', nameKoShort: '자이라지에 또는 자이라지아', nameFr: 'Zairagie (Zairagiah)', nameEn: 'Zairaja' },
  'e3803-zapan': { nameKo: '자판 [Zapan]', nameKoShort: '자판', nameFr: 'Zapan', nameEn: '' },
  'e3804-zariatnatmik': { nameKo: '자리아트나트믹 [Zariatnatmik]', nameKoShort: '자리아트나트믹', nameFr: 'Zariatnatmik', nameEn: '' },
  'e3805-zazarraguan': { nameKo: '자자라구안 [Zazarraguan]', nameKoShort: '자자라구안', nameFr: 'Zazarraguan', nameEn: '' },
  'e3806-zedechias': { nameKo: '체데키아스 또는 제데시아스 [Zédéchias / Zedechias]', nameKoShort: '체데키아스 또는 제데시아스', nameFr: 'Zédéchias', nameEn: 'Zedechias' },
  'e3807-zeernebooch': { nameKo: '체르노보그 또는 체르네보크 [Zeernébooch / Chernobog]', nameKoShort: '체르노보그 또는 체르네보크', nameFr: 'Zeernébooch', nameEn: 'Chernobog' },
  'e3808-zepar': { nameKo: '제파르 [Zépar / Zepar]', nameKoShort: '제파르', nameFr: 'Zépar', nameEn: 'Zepar' },
  'e3809-ziganis': { nameKo: '치가니스 또는 지가니스 [Ziganis / Tsiganes]', nameKoShort: '치가니스 또는 지가니스', nameFr: 'Ziganis', nameEn: 'Tsiganes' },
  'e3810-zigheuners': { nameKo: '치고이너 또는 지그회네르스 [Zigheuners / Zigeuner]', nameKoShort: '치고이너 또는 지그회네르스', nameFr: 'Zigheuners', nameEn: 'Zigeuner' }
};

const ENGLISH_HEADWORD_MAP = {
  'alexandre le grand': 'Alexander the Great',
  'hugues le grand': 'Hugh the Great',
  'albert le grand': 'Albert the Great',
  'aigle': 'Eagle',
  'accouchements prodigieux': 'Prodigious Births',
  'abeilles': 'Bees',
  'abîme': 'Abyss',
  'abominations': 'Abominations',
  'aboyeurs': 'Barkers',
  'abstinence': 'Abstinence',
  'accidents': 'Accidents',
  'accouchements': 'Childbirth Superstitions',
  'adeptes': 'Adepts',
  'adjuration': 'Adjuration',
  'adoration du crapaud': 'Worship of the Toad',
  'aéromancie': 'Aeromancy',
  'aétite': 'Eagle-stone',
  'aglaophotis': 'Aglaophotis',
  'aguapa': 'Aguapa',
  'aiguilles': 'Needles',
  'aiguillette': 'Lacing Spell',
  'aimant': 'Magnet',
  'aimant (magnes)': 'Magnet, Magnes',
  'ajournement': 'Summons',
  'alchimie': 'Alchemy',
  'alchimistes': 'Alchemists',
  'alectryomancie': 'Alectryomancy',
  'aleuromancie': 'Aleuromancy',
  'allégorie': 'Allegory',
  'alliance': 'Pact',
  'almanach': 'Almanac',
  'almanachs': 'Almanacs',
  'aloès': 'Aloes',
  'alomancie': 'Alomancy',
  'alrunes': 'Alrunes (Mandrake Idols)',
  'alphitomancie': 'Alphitomancy',
  'améthyste': 'Amethyst',
  'amitié': 'Friendship',
  'amnios': 'Caul',
  'amour': 'Love Spells',
  'amulettes': 'Amulets',
  'anagramme': 'Anagram',
  'anathème': 'Anathema',
  'anatomie': 'Anatomy',
  'androgynes': 'Androgynes',
  'âne': 'Donkey',
  'anges': 'Angels',
  'anguilles': 'Eels',
  'animaux': 'Animals',
  'anneau': 'Magic Ring',
  'anneaux': 'Magic Rings',
  'année': 'Year Superstitions',
  'antéchrist': 'Antichrist',
  'antechrist': 'Antichrist',
  'anthropomancie': 'Anthropomancy',
  'anthropophages': 'Cannibals',
  'antipathie': 'Antipathy',
  'apantomancie': 'Apantomancy',
  'apocalypse': 'Apocalypse',
  'apparitions': 'Apparitions',
  'araignée': 'Spider',
  'arbre': 'Tree',
  'arbres': 'Trees',
  'arc-en-ciel': 'Rainbow',
  'archanges': 'Archangels',
  'argent': 'Money & Silver',
  'arithmomancie': 'Arithmancy',
  'armes': 'Magic Weapons',
  'armoires': 'Cupboard Haunting',
  'art': 'Magic Art',
  'asmodee': 'Asmodeus',
  'asmodée': 'Asmodeus',
  'astragalomancie': 'Astragalomancy',
  'astrologie': 'Astrology',
  'bâillement': 'Yawning',
  'balai': 'Broomstick',
  'bélomancie': 'Belomancy',
  'bibliomancie': 'Bibliomancy',
  'botanomancie': 'Botanomancy',
  'capnomancie': 'Capnomancy',
  'cartomancie': 'Cartomancy',
  'catoptromancie': 'Catoptromancy',
  'céphalonomancie': 'Cephalonomancy',
  'cerbère': 'Cerberus',
  'chat': 'Cat',
  'chats': 'Cats',
  'chien': 'Dog',
  'chiens': 'Dogs',
  'chouette': 'Owl',
  'chiromancie': 'Chiromancy',
  'cléidomancie': 'Cleidomancy',
  'cléromancie': 'Cleromancy',
  'corbeau': 'Crow',
  'cosquinomancie': 'Coscinomancy',
  'crapaud': 'Toad',
  'cristallomancie': 'Crystallomancy',
  'cygne': 'Swan',
  'dactyliomancie': 'Dactyliomancy',
  'danse du sabbat': 'Sabbath Dance',
  'démons': 'Demons',
  'diable': 'Devil',
  'enfer': 'Hell',
  'esprits': 'Spirits',
  'fantômes': 'Phantoms',
  'géomancie': 'Geomancy',
  'hydromancie': 'Hydromancy',
  'loup-garou': 'Werewolf',
  'loups-garous': 'Werewolves',
  'lutin': 'Goblin',
  'lutins': 'Goblins',
  'magie': 'Magic',
  'magiciens': 'Magicians',
  'miroir magique': 'Magic Mirror',
  'nécromancie': 'Necromancy',
  'onéiromancie': 'Oneiromancy',
  'pacte': 'Pact',
  'poule noire': 'Black Hen',
  'pyromancie': 'Pyromancy',
  'rhabdomancie': 'Rhabdomancy',
  'sabbat': "Witches' Sabbath",
  'sorciers': 'Sorcerers',
  'sorcières': 'Witches',
  'spectres': 'Spectres',
  'transport des sorciers': 'Flight of the Sorcerers',
  'vampires': 'Vampires',
  'voyages des sorciers': 'Journey of the Witches'
};

function buildEntryHeadword(raw, koBase, matchedPlate = null, id = null) {
  if (matchedPlate) {
    return {
      nameKo: matchedPlate.nameKo,
      nameKoShort: matchedPlate.nameKoShort || matchedPlate.nameKo.replace(/\s*\[.*\]$/, ''),
      nameFr: matchedPlate.nameFr,
      nameEn: matchedPlate.nameEn || ''
    };
  }

  const rawKey = `${raw.nameFr.toLowerCase()}@@${raw.page1863}`;
  const c = (id && CURATED_HEADWORD_RULES[id]) || CURATED_HEADWORD_RULES[rawKey];
  if (c) {
    return {
      nameKo: c.nameKo,
      nameKoShort: c.nameKoShort || c.nameKo.replace(/\s*\[.*\]$/, ''),
      nameFr: c.nameFr || raw.nameFr,
      nameEn: c.nameEn || ''
    };
  }

  const fullLow = String(raw.nameFr || '').toLowerCase().trim();
  const baseLow = String(raw.baseFr || '').toLowerCase().trim();

  // Rule 3: Alternative names with 'ou'
  if (/\bou\b/i.test(raw.nameFr)) {
    const parts = raw.nameFr.split(/\s+ou\s+/i);
    if (parts.length === 2) {
      const ko1 = frHeadwordToKo(parts[0].trim(), parts[0].trim());
      const ko2 = frHeadwordToKo(parts[1].trim(), parts[1].trim());
      const koMerged = `${ko1} 또는 ${ko2}`;
      return {
        nameKo: `${koMerged} [${parts[0].trim()}, ${parts[1].trim()}]`,
        nameKoShort: koMerged,
        nameFr: raw.nameFr,
        nameEn: ''
      };
    }
  }

  // Rule 2: Parenthetical surname inversion
  if (raw.nameFr.includes('(')) {
    return {
      nameKo: `${koBase} [${raw.nameFr}]`,
      nameKoShort: koBase,
      nameFr: raw.nameFr,
      nameEn: ''
    };
  }

  // Rule 1: English headword when needed & different
  if (ENGLISH_HEADWORD_MAP[fullLow]) {
    const en = ENGLISH_HEADWORD_MAP[fullLow];
    return {
      nameKo: `${koBase} [${raw.nameFr} / ${en}]`,
      nameKoShort: koBase,
      nameFr: raw.nameFr,
      nameEn: en
    };
  }
  if (ENGLISH_HEADWORD_MAP[baseLow]) {
    const en = ENGLISH_HEADWORD_MAP[baseLow];
    return {
      nameKo: `${koBase} [${raw.nameFr} / ${en}]`,
      nameKoShort: koBase,
      nameFr: raw.nameFr,
      nameEn: en
    };
  }

  // Rule 1: Divinations ending in -mancie
  if (fullLow.endsWith('mancie')) {
    const en = raw.nameFr.replace(/mancie$/i, 'mancy');
    return {
      nameKo: `${koBase} [${raw.nameFr} / ${en}]`,
      nameKoShort: koBase,
      nameFr: raw.nameFr,
      nameEn: en
    };
  }

  // Default: Rule 1 standard [French]
  return {
    nameKo: `${koBase} [${raw.nameFr}]`,
    nameKoShort: koBase,
    nameFr: raw.nameFr,
    nameEn: ''
  };
}

const ADJ_SET = new Set([
  '가능합니다','간단합니다','강력합니다','강합니다','거룩합니다','거대합니다','건조합니다','격렬합니다',
  '결백합니다','고귀합니다','공정합니다','공평하십니다','궁금합니다','기괴합니다','기묘합니다','기이합니다',
  '능숙합니다','다양합니다','단단합니다','단순합니다','당연합니다','대담합니다','독특합니다','동일합니다',
  '뚜렷합니다','마땅합니다','만합니다','명백합니다','명확합니다','모호합니다','무력합니다','무모합니다',
  '무시무시합니다','무익합니다','무한합니다','미묘합니다','미세합니다','민감합니다','복잡합니다',
  '부정확합니다','부족합니다','분명합니다','분분합니다','불가능합니다','불과합니다','불쌍합니다',
  '불완전합니다','불투명합니다','불행합니다','비슷합니다','빈약합니다','사악합니다','상당합니다',
  '생생합니다','성급합니다','순수합니다','습합니다','신비합니다','신성합니다','신속합니다','심각합니다',
  '심오합니다','악합니다','안전합니다','약합니다','엄격합니다','엄청납니다','열등합니다','영원합니다',
  '완고합니다','완만합니다','완벽합니다','왕성합니다','우아합니다','우울합니다','우월합니다','웅장합니다',
  '위험합니다','유능합니다','유명합니다','유사합니다','유용합니다','유익합니다','유치합니다','익숙합니다',
  '일정합니다','잔인합니다','적합합니다','정중합니다','정통합니다','정확합니다','죄송합니다','중요합니다',
  '진지합니다','추악합니다','충분합니다','친절합니다','특유합니다','특이합니다','편안합니다','평행합니다',
  '풍부합니다','필요합니다','행복합니다','현명합니다','확실합니다','훌륭합니다','흔합니다','희귀합니다',
  '이상합니다','투명합니다','가득합니다','아름답습니다','놀랍습니다','두렵습니다','무섭습니다','즐겁습니다',
  '슬픕니다','기쁩니다','가깝습니다','멉니다','길습니다','짧습니다','넓습니다','좁습니다','깊습니다',
  '얕습니다','높습니다','낮습니다','많습니다','적습니다','작습니다','좋습니다','나쁩니다','같습니다',
  '다릅니다','옳습니다','그릅니다','쉽습니다','어렵습니다','무겁습니다','가볍습니다','밝습니다',
  '어둡습니다','뜨겁습니다','차갑습니다','따뜻합니다','시원합니다','부드럽습니다','빠릅니다','느립니다',
  '새롭습니다','오래되었습니다','그렇습니다','싶습니다','어리석습니다','괜찮습니다','똑같습니다','걸맞습니다',
  '알맞습니다','점잖습니다','시원찮습니다','만만찮습니다','하얗습니다','까맣습니다','노랗습니다','파랗습니다',
  '빨갛습니다','뛰어납니다','큽니다','아름다우십니다'
]);

const ADJ_NEG_STEMS = new Set([
  '강력하지','같지','그렇지','나쁘지','동일하지','드물지','많지','목마르지','부족하지','분명하지',
  '뾰족하지','쉽지','싶지','어렵지','옳지','완전하지','우스꽝스럽지','유사하지','있지','정확하지',
  '좋지','충분하지','필요하지','행복하지','현명하지','흔하지','비슷하지','가능하지','안전하지',
  '중요하지','적합하지','익숙하지','완벽하지','강하지','약하지','선명하지','분명치','마땅치',
  '만만치','흔치','못지','크지','작지','적지','길지','짧지','높지','낮지','깊지','넓지','좁지',
  '멀지','가깝지','다르지','그르지','아름답지','두렵지','무섭지','놀랍지','새롭지','어리석지','빠르지'
]);

function convertEnding(word) {
  if (word.endsWith('습니다')) {
    const stem = word.slice(0, -3);
    const last = stem[stem.length - 1];
    const code = last ? last.charCodeAt(0) - 0xAC00 : -1;
    const jong = code >= 0 && code <= 11171 ? code % 28 : -1;
    if (jong === 20 || last === '겠') return stem + '다';
    if (stem.endsWith('있') || stem.endsWith('없') || stem.endsWith('같') || stem.endsWith('싶') || stem.endsWith('렇') || stem.endsWith('찮') || stem.endsWith('잖')) return stem + '다';
    if (ADJ_SET.has(word) || stem.endsWith('롭') || stem.endsWith('스럽') || stem.endsWith('답')) return stem + '다';
    return stem + '는다';
  }

  if (word.endsWith('니다') && !['다니다','돌아다니다','아니다'].includes(word)) {
    if (word === '아닙니다') return '아니다';
    if (word === '겁니다') return '것이다';
    if (word === '드뭅니다') return '드물다';
    if (word.endsWith('이십니다')) return word.slice(0, -4) + '이다';
    if (word.endsWith('입니다')) {
      // Distinguish verbs whose stem ends in 이 + ㅂ니다 (보입니다, 놓입니다, 움직입니다...) from Noun + 입니다
      if (/^(?:.*(?:덧붙|밀어붙|기울|움직|속삭|뒤섞)|보|놓|쓰|죽|줄|높|붙|모|섞|묶|속|숙|먹)입니다$/.test(word)) {
        const stem = word.slice(0, -2);
        const baseCode = stem.charCodeAt(stem.length - 1) - 0xAC00 - 17;
        return stem.slice(0, -1) + String.fromCharCode(0xAC00 + baseCode + 4) + '다';
      }
      return word.slice(0, -3) + '이다';
    }
    const stem = word.slice(0, -2);
    const last = stem[stem.length - 1];
    const code = last ? last.charCodeAt(0) - 0xAC00 : -1;
    if (code >= 0 && code <= 11171 && code % 28 === 17) {
      const baseCode = code - 17;
      if (ADJ_SET.has(word)) {
        return stem.slice(0, -1) + String.fromCharCode(0xAC00 + baseCode) + '다';
      }
      return stem.slice(0, -1) + String.fromCharCode(0xAC00 + baseCode + 4) + '다';
    }
  }
  return word;
}

// Replace regex matches only when outside parentheses (...) so nested parentheses never occur
function replaceOutsideParens(text, re, replacement) {
  const parts = text.split(/(\[[^\]]*\]|\([^)]*\)|「[^」]*」|《[^》]*》)/g);
  return parts.map(part => {
    if ((part.startsWith('(') && part.endsWith(')')) || (part.startsWith('[') && part.endsWith(']')) || (part.startsWith('「') && part.endsWith('」')) || (part.startsWith('《') && part.endsWith('》'))) {
      return part;
    }
    return part.replace(re, replacement);
  }).join('');
}

// Remove original language annotations inside outer parenthetical explanations so no parenthesis is nested inside another
function removeOriginalInsideParens(text) {
  if (!text || !text.includes('(')) return text;
  let out = '';
  let depth = 0;
  let buffer = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') {
      depth++;
      buffer += '(';
    } else if (ch === ')') {
      depth--;
      buffer += ')';
      if (depth === 0) {
        if (buffer.slice(1, -1).includes('(')) {
          let inner = buffer.slice(1, -1);
          inner = inner.replace(/([가-힣0-9]+)\s*\([A-Za-zÀ-ÿŒœÆæ0-9\s,.'’\-–—/°]+\)/g, '$1');
          inner = inner.replace(/\s*\([A-Za-zÀ-ÿŒœÆæ0-9\s,.'’\-–—/°]+\)/g, '');
          buffer = '(' + inner + ')';
        }
        out += buffer;
        buffer = '';
      } else if (depth < 0) {
        depth = 0;
        out += buffer;
        buffer = '';
      }
    } else {
      if (depth === 0) {
        out += ch;
      } else {
        buffer += ch;
      }
    }
  }
  if (buffer) out += buffer;
  return out;
}

// Format body Korean (Original) notation without space in between: 한글(원문)
function formatKoreanParen(text) {
  if (!text) return text;
  return text.replace(/([가-힣])\s+\(([A-Za-zÀ-ÿŒœÆæ0-9][^\(\)]*)\)/g, '$1($2)');
}

// Harmonize Korean particles (은/는, 이/가, 을/를, 과/와, 으로/로) after Korean nouns or Korean + (Original)
function fixKoreanParticles(text) {
  // 1. After "한글 (Original)" or "한글(Original)" + particle
  let out = text.replace(/([가-힣])(\s*(?:\[[^\]]+\]|\([^)]+\)))+((?:은|는|이|가|을|를|과|와|으로|로)(?=[ \.,;!\?]|$)|이라고|라고|이라는|라는)/g, (m, korChar, parens, particle) => {
    const code = korChar.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return m;
    const jong = code % 28;
    const hasBatchim = jong !== 0;
    let fixed = particle;
    if (particle === '은' || particle === '는') fixed = hasBatchim ? '은' : '는';
    else if (particle === '이' || particle === '가') fixed = hasBatchim ? '이' : '가';
    else if (particle === '을' || particle === '를') fixed = hasBatchim ? '을' : '를';
    else if (particle === '과' || particle === '와') fixed = hasBatchim ? '과' : '와';
    else if (particle === '으로' || particle === '로') fixed = (hasBatchim && jong !== 8) ? '으로' : '로';
    else if (particle === '이라고' || particle === '라고') fixed = hasBatchim ? '이라고' : '라고';
    else if (particle === '이라는' || particle === '라는') fixed = hasBatchim ? '이라는' : '라는';
    return `${korChar}${parens}${fixed}`;
  });
  // 2. Direct particle fixes on replaced words without parens
  out = out.replace(/([가-힣])(이라고|라고|이라는|라는)/g, (m, korChar, particle) => {
    const code = korChar.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return m;
    const hasFinal = (code % 28) !== 0;
    let correct = particle;
    if (particle === '이라고' || particle === '라고') correct = hasFinal ? '이라고' : '라고';
    else if (particle === '이라는' || particle === '라는') correct = hasFinal ? '이라는' : '라는';
    return korChar + correct;
  });
  out = out
    .replace(/사바트으로/g, '사바트로')
    .replace(/사바트은/g, '사바트는')
    .replace(/사바트이/g, '사바트가')
    .replace(/사바트을/g, '사바트를')
    .replace(/카발라으로/g, '카발라로')
    .replace(/카발라은/g, '카발라는')
    .replace(/카발라이/g, '카발라가')
    .replace(/카발라을/g, '카발라를')
    .replace(/호신부으로/g, '호신부로')
    .replace(/호신부은/g, '호신부는')
    .replace(/호신부을/g, '호신부를');
  return out;
}

const PLACE_MAP = {
  'Fiésole': '피에솔레(Fiésole)', 'Fiesole': '피에솔레(Fiesole)', 'Laval': '라발(Laval)', 'Cumae': '쿠마이(Cumae)',
  'Reims': '랭스(Reims)', 'Saxony': '작센(Saxony)', 'Sorbonne': '소르본(Sorbonne)', 'Cluny': '클뤼니(Cluny)',
  'Malabar': '말라바르(Malabar)', 'Paphlagonia': '파플라고니아(Paphlagonia)', 'Poitou': '푸아투(Poitou)',
  'Basses-Pyrénées': '바스피레네(Basses-Pyrénées)', 'Kamtschatka': '캄차카(Kamtschatka)',
  'Kamtschadales': '캄차카인(Kamtschadales)', 'Tartary': '타타르(Tartary)', 'Pégu': '페구(Pégu)',
  'Henri IV': '앙리 4세(Henri IV)', 'Tubalcain': '투발카인(Tubalcain)', 'Percival': '파르치팔(Percival)',
  'Mélusine': '멜뤼진(Mélusine)', 'Monomotapa': '모노모타파(Monomotapa)', 'Satpoura': '사트푸라(Satpura)',
  'Limoux': '리무(Limoux)', 'Lomonosoff': '로모노소프(Lomonosov)', 'Getae': '게타이족(Getae)',
  'Angerbode': '앙게르보다(Angrboda)', 'Madeleine de la Palud': '마들렌 드 라 팔뤼(Madeleine de la Palud)',
  'Michel Verdung': '미셸 베르둥(Michel Verdung)', 'John of Leiden': '레이던의 얀(Jean de Leyde)',
  'Tyana': '티아나(Tyana)', 'Sommona-Kodom': '솜모나 코돔(Sommona-Kodom)',
  'Domingina Maletena': '도밍기나 말레테나(Domingina Maletena)', 'Flaque': '플라크(Flaque)',
  'Saint-Germain en Laye': '생제르맹앙레(Saint-Germain-en-Laye)', 'Cerhenians': '케르헤니아족(Cerhenians)',
  'Haën': '하엔(Haën)', 'Anarazel': '아나라젤(Anarazel)', 'Iden': '이덴(Iden)', 'Berne': '베른(Berne)',
  'Krechting': '크레슈틴그(Krechting)', 'Knipperdolinck': '크니페르돌린크(Knipperdolinck)',
  'Enguerrand': '앙게랑(Enguerrand)', 'Gham': '함(Gham)', 'Radzivill': '라지비우(Radziwiłł)',
  'Mademoiselle de Guise': '기즈 공녀(Mademoiselle de Guise)', 'Theoclimene - Pylos': '테오클리메노스 - 필로스(Pylos)'
};

const UNTRANSLATED_CROSSREFS = {
  'Philter': '사랑의 묘약·미약 [Philtres]',
  'Kephalonomancy': '당나귀 머리점(케팔로노망시) [Céphalomancie]',
  'Eleazar': '엘레아자르 [Éléazar]',
  'Abdeel': '압디엘 [Abdeel]',
  'Dodona': '도도나의 신목 [Dodone]',
  'Retz, etc': '레츠 등 [Retz]',
  'Albert the Great, Bacon, Enchantments, etc': '대 알베르투스, 로저 베이컨, 마법 등',
  'Aubry': '오브리 [Aubry]',
  'Xylomancy': '나뭇가지점(크실로망시) [Xylomancie]',
  'Tailletroux': '타이에트루 [Tailletroux]',
  'Cartomancy': '카드점(카르토망시) [Cartomancie]',
  'Palingenesia': '재생술(팔린게네시아) [Palingénésie]',
  'Veneur': '검은 사냥꾼(베뇌르) [Veneur]',
  'Basilides': '바실리데스 [Basilide]',
  'Hecdekin': '헤크데킨 [Hecdekin]',
  'Gutheyl': '구트하일 [Gutheyl]',
  'Hatton, Poppiel, Magic Whistle': '하톤, 포피엘, 마법의 호루라기 등',
  'Conjurations, Sakhar, Belial, Asrael, Asmodeus, Notorious Art': '주문, 사하르, 벨리알, 아즈라엘, 아스모데우스, 솔로몬의 현의술 [Art notoire] 등'
};

const RAW_ENGLISH_REPLACEMENTS = [
  // Books and treatises
  [/Cabbalistic Letters, or Philosophical, Historical and Critical Correspondence Between Two Cabalists/g, '「카발라 서한, 혹은 두 카발리스트 간의 철학적·역사적·비판적 서신」'],
  [/The Key to the Cabinet of Chevalier Borri/g, '「기사 보리의 내실 열쇠」'],
  [/The New Heaven and the Reign of the Antichrist/g, '「새 하늘과 적그리스도의 통치」'],
  [/The Life of Robert the Devil/g, '「악마 로베르의 생애」'],
  [/The Variety of Things, of the Subtility of Demons/g, '「사물의 다양성, 악마의 정묘함에 관하여」'],
  [/The Admirable Secrets of Albert the Great/g, '「대 알베르투스의 놀라운 비결들」'],
  [/The Secrets of Albert the Great/g, '「대 알베르투스의 비결들」'],
  [/The Literal Sense of Holy Bible/g, '「성경의 문자적 의미」'],
  [/The Court and Camp of Rundjet-Sing/g, '「란지트 싱의 궁정과 진영」'],
  [/Incredulity and disbelief of the Spell/g, '「주술에 대한 불신과 회의」'],
  [/The Grand Enlightenment of the Philosopher\'s Stone for the Transmutation of All Metals/g, '「모든 금속 변성을 위한 현자의 돌의 대계몽」'],
  [/The Herald of the Great King Jesus, Amsterdam/g, '「위대한 왕 예수의 전령」, 암스테르담'],
  [/The Art of Judging Men by Physiognomy/g, '「관상으로 사람을 판단하는 기술」'],
  [/Errors and Prejudices Widespread in Society/g, '「사회에 널리 퍼진 오류와 편견들」'],
  [/Discourse on Lycanthropy or the Transmutation of Men into Wolves/g, '「늑대인간증, 혹은 인간이 늑대로 변하는 것에 관한 논설」'],
  [/Discourse on lycanthropy, or the transmutation of men to wolves/g, '「늑대인간증, 혹은 인간이 늑대로 변하는 것에 관한 논설」'],
  [/The Marvelous History of the Spirit/g, '「영령의 기이한 역사」'],
  [/On Lycanthropy, Transformation and ecstasies of sorcerers/g, '「늑대인간증, 마법사들의 변신과 탈혼에 관하여」'],
  [/The Earth is an Animal/g, '「지구는 하나의 동물이다」'],
  [/Demonstration of the apparitions of today/g, '「오늘날의 유령 발현에 관한 증명」'],
  [/On the Inspiration of the Camisards/g, '「카미자르의 영감에 관하여」'],
  [/the Door of the elements, Porta elementorum/g, '「원소의 문(Porta elementorum)」'],
  [/Admirable Power of Art and Nature/g, '「예술과 자연의 놀라운 힘에 관하여」'],
  [/Responses to the History of the Oracles of Fontenelle/g, '「퐁트넬의 신탁 역사에 대한 답변」'],
  [/the Regulator of the Shareholders of the Lottery/g, '「복권 주주들의 규제자」'],
  [/Cabalistic Letters, by the Marquis d\'Argens/g, '아르장스 후작의 「카발라 서한」'],
  // Raw prose phrases
  [/Odilon Barrot, Chambolle, three Aliborons of the Chamber/g, '오딜롱 바로, 샹볼, 의회의 세 얼간이(Trois Aliborons de la Chambre)'],
  [/three Aliborons of the Chamber/g, '의회의 세 얼간이(Trois Aliborons de la Chambre)'],
  [/Albert the Great, Bacon, Enchantments, etc/g, '대 알베르투스, 로저 베이컨, 마법 등'],
  [/Jehovah; but Geneva sings under his gaze of love\. Calvary split at the hearing of the voice of God;/g, '여호와를 찬양하나, 제네바는 그의 사랑 어린 시선 아래 노래한다. 갈보리는 하나님의 음성을 듣고 갈라졌다;'],
  [/A\. Memphis, Chez Alibeck the Egypt/g, '멤피스, 이집트인 알리베크 출판'],
  [/Kim-Ker gave seventy hand figures to the public; the learned Mélampus, twelve; the deep Compotus, eight; John of Hagen, thirty-seven; the subtle Romphilius, six; the scholar Corvæus, one hundred and fifty; Jean Cirus, twenty; Patrice Tricassus, eighty; Jean Belot, four; Traisnerus, forty, and Perrucho, six; which makes four hundred and twenty-three hands on which your sagacity can be exercised\./g, '킴케르는 대중에게 70점의 손 도판을 공개했고, 학식 있는 멜람푸스는 12점, 심오한 콤포투스는 8점, 하겐의 요한은 37점, 명민한 롬필리우스는 6점, 학식 있는 코르바이우스는 150점, 장 시루스는 20점, 파트리스 트리카수스는 80점, 장 벨로는 4점, 트라이스네르는 40점, 페루키오는 6점을 제시했으니, 당신의 총명함을 시험해 볼 수 있는 손 도판이 총 423점에 달한다.'],
  [/this some people have obtained magnetism or the same effects or at least some of them/g, '이를 통해 일부 사람들은 동물자기(동물자기 요법)나 그와 동일한 효과 또는 적어도 그 일부를 얻어냈다'],
  [/Antiochus misfortunately heard this, ordered that he be bound, and had him given the stirrup leather/g, '안티오코스는 불행히도 이를 듣고 그를 결박하라고 명령한 뒤 가죽 채찍형에 처했다'],
  [/rue Saint-Jacques, at the Elephant, in front of Mathhuirins/g, '생자크 거리(rue Saint-Jacques), 코끼리상 맞은편, 마튀랭 수도원 앞'],
  // Catiau
  [/150 fr\. to Father Delhaye\. He takes several more bottles of water; all are generously given to him at the price of 10 francs\. each\. » As we can see, the usable material was good\. Catiau does not fail to use it; he makes Delhaye believe that his intelligence with/g, '델라예 노인에게는 150프랑이었다. 그는 몇 병의 물을 더 가져갔는데, 모두 한 병당 10프랑의 가격에 기꺼이 그에게 건네졌다. 보시다시피 먹잇감은 아주 훌륭했다. 카티오는 이를 이용하는 데 주저하지 않았고, 자신이'],
  [/cure hernias; for this you have to drink water which Catiau fortunately has at home and which comes from a fountain in Rome where the angel goes to bathe once a year\. This wonderful consultation costs/g, '탈장을 치료하려면 카티오가 다행히 집에 보관하고 있는, 일 년에 한 번 천사가 내려와 목욕한다는 로마의 기적의 샘물을 마셔야 한다. 이 신비한 진료의 비용은'],
  [/from a fountain in Rome where the angel goes to bathe once a year\. This wonderful consultation costs/g, '일 년에 한 번 천사가 내려와 목욕한다는 로마의 기적의 샘물을 마셔야 한다. 이 신비한 진료의 비용은'],
  // Bortisme
  [/Jehovah will strike the rebellious and cursed city; but a good father smiles in Geneva/g, '여호와께서는 반역하고 저주받은 도시를 치실 것이나, 인자하신 아버지는 제네바에서 미소 짓고 계신다'],
  [/alem like a flood; but Geneva will be covered with the dew of his paternal breath\. The lightning of/g, '홍수처럼 예루살렘을 덮었으나, 제네바는 아버지의 숨결이 맺힌 이슬로 뒤덮일 것이다. 번개가'],
  [/but Geneva blossoms like a flower at the call of his sweet voice\. The wrath of Jehovah covered Jerus/g, '하지만 제네바는 그의 감미로운 음성에 꽃처럼 피어난다. 여호와의 진노가 예루살렘을 덮었으나'],
  [/Yes, Geneva! blessed city which from your childhood was lying on the arms of your God, call your waters and your laughing 시골에서 주님의 날을 축복하라!/g, '그렇다, 제네바여! 어린 시절부터 너의 하나님의 품에 안겨 있던 축복받은 도시여, 너의 강물과 웃음 짓는 들판을 불러 모아 주님의 날을 찬미하라!'],
  // Songes
  [/Mr\. Fox falls, and in his fall he breaks an arm and a leg/g, '르나르 군(Baptiste Renard)은 떨어지면서 팔과 다리가 부러졌고'],
  [/A more extraordinary anecdote is told about the death of the actor Champmeslé\./g, '배우 샹메슬레(Champmeslé)의 죽음에 대해서는 더욱 기이한 일화가 전해진다.'],
  [/Champmeslé having given the sacristan a thirty sous coin, the monk was at a loss to return the remaining ten sous\. “Keep everything,” said the actor, and have a third mass said immediately; 그녀는 나를 위한 것이다\. » 사실 그는 코드 제작자가 그를 만나러 온 바로 그날 갑자기 사망했다\./g, '샹메슬레가 성구지기 수도사에게 30수짜리 은화를 건넸으나, 수도사는 거스름돈 10수를 돌려주지 못해 난처해했다. “거스름돈은 다 가지시고, 즉시 세 번째 미사를 올려 주십시오. 그 미사는 나를 위한 것입니다.” 배우가 말했다. 그리고 실제로 그는 수도사가 그를 찾아온 바로 그날 갑자기 사망했다.'],
  [/From that moment on, the musician lost the habit of dreaming, or at least of boasting about his dreams/g, '그 순간 이후 음악가는 꿈을 꾸거나 적어도 자신의 꿈을 자랑하는 습관을 잃었다'],
  [/s\. From that moment on, the musician lost the habit of dreaming, or at least of boasting about his d/g, '그 순간 이후 음악가는 꿈을 꾸거나 적어도 자신의 꿈을 자랑하는 습관을 잃었다'],
  [/On the Blindness of Men and the Light Born in Darkness/g, '「인간의 맹목과 어둠 속에서 태어난 빛에 관하여」'],
  // Residual english syntax words & MT oddities
  [/약간의 물리학자(?:였습니다|였다|에 불과했다|입니다)?/g, '단지 당대의 자연학자에 불과했다'],
  [/약간의 물리학자/g, '당대의 자연학자'],
  [/전화를 걸었(?:지만|으나|다|습니다)?/g, '큰 소리로 불렀$1'],
  [/전화를 걸/g, '소리쳐 부르'],
  [/도당적인/g, '카발라적인'],
  [/John of Leiden and Muncer/g, '레이던의 얀(Jean de Leyde)과 토마스 뮌처(Thomas Müntzer)'],
  [/John of Leiden/g, '레이던의 얀(Jean de Leyde)'],
  [/Louis the Great/g, '루이 대왕(루이 14세)'],
  [/Albert the Great/g, '대 알베르투스'],
  [/Alexander the Great/g, '알렉산드로스 대왕'],
  [/나 자신이 싫어요/g, '나 자신이 싫다'],
  [/그런데 아직도요\?/g, '그런데 아직도인가?'],
  [/그리고 왜요\?/g, '그리고 어째서인가?']
];

function hasJongseong(str) {
  const clean = str.replace(/[^가-힣]/g, '');
  if (!clean.length) return false;
  const lastCode = clean.charCodeAt(clean.length - 1);
  return (lastCode - 0xAC00) % 28 !== 0;
}

function adjustJosa(word, josa) {
  const hasJong = hasJongseong(word);
  if (josa === '은' || josa === '는') return hasJong ? '은' : '는';
  if (josa === '이' || josa === '가') return hasJong ? '이' : '가';
  if (josa === '을' || josa === '를') return hasJong ? '을' : '를';
  if (josa === '과' || josa === '와') return hasJong ? '과' : '와';
  return josa;
}

function fixBareForeignOpenings(s, e, koBase, headword) {
  const bareMatch = s.match(/^([A-ZÀ-Ÿ][a-zà-ÿA-Z\s\-]{2,25})(은|는|이|가|을|를|의|와|과)\s+/);
  if (!bareMatch) return s;

  const foreignWord = bareMatch[1].trim();
  const josa = bareMatch[2];
  const targetKo = headword ? headword.nameKo.replace(/\s*\[.*\]$/, '').trim() : koBase;

  if (josa === '의') {
    if (PLACE_MAP[foreignWord]) {
      return PLACE_MAP[foreignWord] + '의 ' + s.slice(bareMatch[0].length);
    }
  } else {
    const adjustedJosa = adjustJosa(targetKo, josa);
    return targetKo + adjustedJosa + ' ' + s.slice(bareMatch[0].length);
  }
  return s;
}

function polishTranslation(rawKo, e, koBase, headword = null, id = null) {
  const cacheKey = `${e.nameFr}@@${e.page1863}`;
  const override = (id && CURATED_OVERRIDES[id]) || CURATED_OVERRIDES[cacheKey];
  if (override) {
    let cur = override;
    for (const [re, rep] of RAW_ENGLISH_REPLACEMENTS) {
      cur = cur.replace(re, rep);
    }
    cur = fixBareForeignOpenings(cur, e, koBase, headword);
    cur = removeOriginalInsideParens(cur);
    cur = formatKoreanParen(cur);
    cur = fixKoreanParticles(cur);
    return cur.replace(/\s+/g, ' ').trim();
  }

  let s = String(rawKo || '').trim();
  const displayTitle = headword ? headword.nameKo : `${koBase} [${e.nameFr}]`;
  if (!s) return `${displayTitle} — ${e.textFr}`;

  // Remove any leftover wiki table markup
  s = s.replace(/\{\|[\s\S]*?\|\}/g, '');

  // Strip leading headword repetition (French, English mistranslation, or Korean) followed by — or .
  const escName = e.nameFr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escBase = e.baseFr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escKo = koBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  s = s.replace(new RegExp(`^(?:${escName}|${escBase}|${escKo})(?:\\s*(?:\\[[^\]]+\\]|\\([^)]+\\)))?\\s*(?:—|-|\\.|:)\\s*`, 'i'), '');
  s = s.replace(/^[^\.\n]{1,35}\s+—\s+/, '');
  // Also strip short 1-3 word leading noun phrase + period if French text did not start with a short 1-3 word sentence
  const firstDotIdx = s.indexOf('. ');
  const frFirstDotIdx = e.textFr.indexOf('.');
  if (firstDotIdx > 0 && firstDotIdx <= 18 && (frFirstDotIdx < 0 || frFirstDotIdx > 25)) {
    const prefix = s.slice(0, firstDotIdx).trim();
    if (!/[다까요]$/.test(prefix)) {
      s = s.slice(firstDotIdx + 2).trim();
    }
  }

  // Replace raw French headword at the very start of the sentence
  const plainNameFr = e.nameFr.replace(/’/g, "'");
  for (const prefix of [e.nameFr, plainNameFr, e.baseFr]) {
    if (s.startsWith(prefix)) {
      let rest = s.slice(prefix.length);
      if (e.nameFr.includes('(')) {
        rest = rest.replace(/^\s*\([^)]+\)/, '');
      }
      s = displayTitle + rest;
      break;
    }
  }

  // Fix occult/historical mistranslations and literal French idioms across the 1863 corpus
  s = s
    .replace(/마술사 안식일의 밤 모임|마녀 안식일의 밤 모임|안식일 밤 마술사들의 모임|마법사의 안식일|마녀들의 안식일|안식일/g, '사바트(Sabbat)')
    .replace(/솔로몬의 빗장뼈|솔로몬의 쇄골/g, '「솔로몬의 열쇠(Clavicules de Salomon)」')
    .replace(/유대인 도당/g, '유대 카발라(Cabale)')
    .replace(/위대한 도당으로/g, '대카발라 학자(Cabaliste)로')
    .replace(/마술사,\s*도당으로/g, '마법사이자 카발라 학자(Cabaliste)로')
    .replace(/도당적인 유대인들은/g, '카발라를 신봉하는 유대인들은')
    .replace(/도당의 세 번째/g, '카발라(Cabale)의 세 번째')
    .replace(/도당들/g, '카발리스트(Cabalistes)들')
    .replace(/악마광/g, '악마학(Démonomanie)')
    .replace(/콘돔|방부제/g, '수호 부적(호신부)')
    .replace(/친숙한 정신|친숙한 영|친숙한 악마|친숙한 요정/g, '사역마(패밀리어, Esprit familier)')
    .replace(/바늘 묶는 사람/g, '매듭 주술사(Noueur d’aiguillettes)')
    .replace(/바늘을 묶는 기술/g, '매듭 주술(에귀예트, Aiguillette)을 거는 기술')
    .replace(/바늘을 묶/g, '매듭 주술을 걸')
    .replace(/바늘을 풀/g, '매듭 주술을 풀')
    .replace(/물리적 합자\s*\(Physical Ligatures\)/g, '「물리적 결박 주술(Ligatures physiques)」')
    .replace(/참조\s*:\s*합자\.?/g, '참조: 결박 주술 [Ligatures].')
    .replace(/\(참조\s*:\s*합자\)/g, '(참조: 결박 주술 [Ligatures])')
    .replace(/사법 점성술|법한 점성술/g, '판단 점성술(Astrologie judiciaire)')
    .replace(/후기 제국의/g, '동로마(비잔티움) 제국의')
    .replace(/산적이라는 선고를/g, '강도·흉악범으로 판결을')
    .replace(/악마의 리더\.?/g, '악마들의 수장이다.')
    .replace(/지옥의 왕자/g, '지옥의 군주')
    .replace(/의 행렬에 있습니다|의 행렬에 있다/g, '의 수행단에 속한다')
    .replace(/우리는 그에게\s+(.+?)\s*의무가 있습니다/g, '그의 주요 저서로 $1 등이 전해진다')
    .replace(/우리는 그에게\s+(.+?)\s*빚지고 있습니다/g, '그는 $1 등을 남겼다')
    .replace(/을 소개할 등이 전해진다/g, ' 입문서 등이 전해진다')
    .replace(/전화를 걸어/g, '불러')
    .replace(/전화를 걸었습니다|전화를 걸었다/g, '불렀다')
    .replace(/전화를 겁니다|전화를 건다/g, '부른다')
    .replace(/천사들과 거래/g, '천사들과 교류')
    .replace(/악마들과 거래|악마와 거래/g, '악마와 교류(계약)')
    .replace(/조약에 따라/g, '계약(Pacte)에 따라')
    .replace(/미란돌라 그림/g, '피코 델라 미란돌라(Giovanni Pico della Mirandola)')
    .replace(/그러한 기사는/g, '이러한 표제어는')
    .replace(/이 기사는/g, '이 항목은')
    .replace(/표창은 정령을/g, '소환장(Citation)은 정령을')
    .replace(/우표를 목에 걸는/g, '부적(호신부)을 목에 거는')
    .replace(/마법의 인물을/g, '마법 도형(부적)을')
    .replace(/과도한 도덕성 때문에/g, '방종한 품행 때문에')
    .replace(/화살을주었습니다|화살을주었다/g, '화살을 주었다')
    .replace(/피타고라스의 주인이었다/g, '피타고라스(Pythagoras)의 스승이었다')
    .replace(/Brandenburg 행진에서/g, '브란덴부르크 변경백령(Margraviate of Brandenburg)의')
    .replace(/화가 나서 환상을 보고 있다고/g, '광기에 빠져 환시를 본다고')
    .replace(/원칙이 되지 않았습니다|원칙이 되지 않았다/g, '정설로 받아들여지지는 않았다')
    .replace(/비극적인 무질서로/g, '비극적인 사랑과 파란만장한 행적으로')
    .replace(/무슬림 의사들은/g, '이슬람 학자들은')
    .replace(/유대인 의사들은/g, '유대 학자들은')
    .replace(/동정과 반감에 관한 논문/g, '교감(Sympathie)과 반감(Antipathie)에 관한 논문')
    .replace(/\bin\s*-\s*folio\b|\bin\s*-\s*fol\.(?!\w)|\bin\s*-\s*f°(?!\w)/gi, '전지판(in-folio)')
    .replace(/\bin\s*-\s*4[°o]?(?!\w)/gi, '4절판(in-4°)')
    .replace(/\bin\s*-\s*8[°o]?(?!\w)|\bin\s*-\s*a°(?!\w)/gi, '8절판(in-8°)')
    .replace(/\bin\s*-\s*12[°o]?(?!\w)/gi, '12절판(in-12)')
    .replace(/\bin\s*-\s*16[°o]?(?!\w)/gi, '16절판(in-16)')
    .replace(/\bin\s*-\s*18[°o]?(?!\w)/gi, '18절판(in-18)')
    .replace(/\bin\s*-\s*24[°o]?(?!\w)/gi, '24절판(in-24)')
    .replace(/\bin\s*-\s*32[°o]?(?!\w)/gi, '32절판(in-32)')
    .replace(/(\d+절판\([^)]+\))°+/g, '$1')
    .replace(/(\d+절판)°+/g, '$1')
    .replace(/\b1o\s+/g, '첫째, ')
    .replace(/\b2o\s+/g, '둘째, ')
    .replace(/\b3o\s+/g, '셋째, ')
    .replace(/\b4o\s+/g, '넷째, ')
    .replace(/그분은/g, '그는')
    .replace(/그분을/g, '그를')
    .replace(/그분의/g, '그의')
    .replace(/그분에게/g, '그에게')
    .replace(/말씀하십니다|말씀하신다/g, '말한다')
    .replace(/나타나시므로/g, '나타나므로')
    .replace(/사단이나/g, '사탄(Satan)이나')
    .replace(/희귀한\./g, '희귀본이다.')
    .replace(/항목보기\.?|항목 참조\.?|이 기사를 참조하세요\.?|이 기사를 보십시오\.?/g, '해당 항목 참조.')
    .replace(/참조\s*:\s*이 단어\.?|참조\s*:\s*이 이름\.?/g, '해당 항목 참조.')
    // Rule 6: Newspapers use 《 》, books use 「 」
    .replace(/『주르날 뒤 론 \(Journal du Rhône\)』/g, '《주르날 뒤 론(Journal du Rhône)》')
    .replace(/『/g, '「')
    .replace(/』/g, '」')
    // Rule 8: Book citations (Lib -> 권, Cap -> 장, P -> 페이지, etc.)
    .replace(/\bLib\.\s*([0-9IVXLCDM]+)/gi, '$1권')
    .replace(/\b(?:Cap|Ch)\.\s*([0-9IVXLCDM]+)/gi, '$1장')
    .replace(/\bT\.\s*([0-9IVXLCDM]+)/gi, '$1권')
    .replace(/\bP\.\s*([0-9]+)/gi, '$1페이지')
    .replace(/\bDis\.\s*([0-9IVXLCDM]+)/gi, '논설 $1')
    .replace(/\bExt\.\s*([0-9IVXLCDM]+)/gi, '추가본 $1')
    .replace(/제([0-9IVXLCDM]+)권\s*제([0-9IVXLCDM]+)장/g, '$1권 $2장')
    .replace(/제([0-9IVXLCDM]+)권/g, '$1권')
    .replace(/제([0-9IVXLCDM]+)장/g, '$1장')
    // Occult and machine translation fixes from audit
    .replace(/초등 영/g, '4원소 정령')
    .replace(/알렉상드르 르 대/g, '알렉산드로스 대왕')
    .replace(/위그 르 대/g, '위그 대공')
    .replace(/매혹적인 단어/g, '마법의 주문')
    .replace(/허용 마법/g, '자연 마법')
    .replace(/약간의 물리학자였다/g, '단지 당대의 자연학자에 불과했다')
    .replace(/분류하는 데 만족한/g, '분류하는 데 그쳤던')
    .replace(/사기꾼,\s*사기꾼,\s*사기꾼,\s*미치광이,\s*미치광이/g, '협잡꾼, 사기꾼, 돌팔이, 광인, 망상가')
    .replace(/가이 피로/g, '가 이 피로')
    .replace(/독살했다고보고한다/g, '독살했다고 보고한다');

  // Replace un-annotated proper nouns outside parentheses and brackets
  for (const [re, rep] of BODY_PROPER_REPLACEMENTS) {
    s = replaceOutsideParens(s, re, rep);
  }
  // Deduplicate any accidental double parenthetical or duplicate title
  s = s.replace(/([가-힣A-Za-z·\s]+)\s*\(\1\s*\(([^)]+)\)\)/g, '$1 ($2)')
       .replace(/수도원장\(Abbé\)\s*de\s*빌라르\s*수도원장\(Abbé\s*de\s*Villars\)/g, '빌라르 수도원장(Abbé de Villars)')
       .replace(/수도원장\(Abbé\)의\s*수도원장\(Abbé\)/g, '수도원장(Abbé)')
       .replace(/라\s*부아쟁\(La\s*Voisin\)\(la\)/g, '라 부아쟁(La Voisin)');

  // Handle "~지 않습니다" before general convertEnding so adjective stems become "~지 않다"
  s = s.replace(/([가-힣]+지)\s*않습니다/g, (_, jiWord) => {
    if (ADJ_NEG_STEMS.has(jiWord) || /(?:스럽지|롭지|답지)$/.test(jiWord)) {
      return `${jiWord} 않다`;
    }
    if (jiWord.endsWith('하지')) {
      const asHamnida = jiWord.slice(0, -2) + '합니다';
      if (ADJ_SET.has(asHamnida)) return `${jiWord} 않다`;
    }
    return `${jiWord} 않는다`;
  });

  // Convert all formal polite endings (~습니다 / ~ㅂ니다) to encyclopedia plain style (~다 / ~는다 / ~이다)
  s = s.replace(/[가-힣]+(?:습니다|니다)/g, w => convertEnding(w));

  // Convert remaining ~어요 / ~아요 / ~해요 / ~예요 / ~이에요 at sentence boundaries
  s = s
    .replace(/이에요(?=[.!?]|$)/g, '이다')
    .replace(/예요(?=[.!?]|$)/g, '이다')
    .replace(/해요(?=[.!?]|$)/g, '한다')
    .replace(/어요(?=[.!?]|$)/g, '다')
    .replace(/아요(?=[.!?]|$)/g, '다')
    .replace(/정확하지 않는다/g, '정확하지 않다')
    .replace(/아닙다/g, '아니다');

  // Harmonize Korean particles after replacements and parentheticals/brackets
  s = fixKoreanParticles(s);

  // Translate trailing "참조: X" targets into "참조: [한국어명] [[원어명]]"
  s = s.replace(/참조\s*:\s*([A-ZÀ-ŸŒÆ][^\.\n]{1,40})\.?$/g, (_, target) => {
    const tClean = target.trim().replace(/\.$/, '');
    if (/[가-힣]/.test(tClean)) return `참조: ${tClean}.`;
    const tKo = frHeadwordToKo(tClean, tClean);
    const tHead = buildEntryHeadword({ nameFr: tClean, baseFr: tClean }, tKo);
    return `참조: ${tHead.nameKo}.`;
  });

  // Apply raw English replacements
  for (const [re, rep] of RAW_ENGLISH_REPLACEMENTS) {
    s = s.replace(re, rep);
  }

  // Apply untranslated cross-references
  for (const [target, rep] of Object.entries(UNTRANSLATED_CROSSREFS)) {
    const escTarget = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(new RegExp('참조\\s*:\\s*' + escTarget + '\\b\\.?', 'g'), '참조: ' + rep + '.');
  }

  // Fix bare foreign openings
  s = fixBareForeignOpenings(s, e, koBase, headword);

  // Remove original language annotations inside outer parenthetical explanations (no nested parens)
  s = removeOriginalInsideParens(s);

  // Format Korean (Original) without space in the middle: 한글(원문)
  s = formatKoreanParen(s);

  // Final particle harmonization
  s = fixKoreanParticles(s);

  return s.replace(/\s+/g, ' ').trim();
}

const CURATED_META = {
  'e2167-jean': { category: 'person', rank: '마법사·비술사(Magicien)', domains: ['인물·역사(Personnage)', '서양 마법사', '비전 마법'] },
  'e2168-jean': { category: 'person', rank: '총대주교·비술사(Patriarche & Enchanteur)', domains: ['인물·역사(Personnage)', '교회 인물·성직자', '비잔티움 역사'] },
  'e2169-jeanxxii': { category: 'person', rank: '교황·역사 인물(Pape & Personnage)', domains: ['인물·역사(Personnage)', '교회 인물·성직자', '가톨릭 역사'] },
  'e2170-jean': { category: 'person', rank: '역사 속 군주·귀족(Souverain & Personnage)', domains: ['인물·역사(Personnage)', '유럽 군주·귀족', '러시아 역사'] },
  'e3011-phenix': { category: 'demon', rank: '지옥의 후작(Marquis de l’Enfer)', legions: 20, domains: ['악마학(Démonologie)', '지옥의 계급 체계', '고위 악마'] },
  'e3012-phenix': { category: 'superstition', rank: '신비 동물·상징(Superstition Animale)', domains: ['미신·민속(Superstition)', '신비 동물·상징', '고대 신화'] },
  'e3211-retz': { category: 'person', rank: '오컬트·역사 인물(Personnage Historique)', domains: ['인물·역사(Personnage)', '프랑스 역사', '푸른 수염 전설'] },
  'e3212-retz': { category: 'person', rank: '성직자·종교 인물(Ecclésiastique & Saint)', domains: ['인물·역사(Personnage)', '교회 인물·성직자', '프랑스 역사'] },
  'e3231-robert': { category: 'demon', rank: '사바트의 악마(Démon du Sabbat)', domains: ['악마학(Démonologie)', '사바트 전승', '악마'] },
  'e3233-robert': { category: 'person', rank: '마법사·주술사(Sorcier)', domains: ['인물·역사(Personnage)', '서양 마법사', '중세 마법 재판'] },
  'e3234-robert': { category: 'person', rank: '역사 속 군주·귀족(Souverain & Personnage)', domains: ['인물·역사(Personnage)', '유럽 군주·귀족', '프랑스 국왕'] },
  'e1248-david': { category: 'person', rank: '성경·역사 인물(Personnage Biblique)', domains: ['인물·역사(Personnage)', '성경 인물', '고대 이스라엘'] },
  'e1249-david': { category: 'person', rank: '성직자·종교 인물(Ecclésiastique & Saint)', domains: ['인물·역사(Personnage)', '마녀 재판 전승', '루비에 빙의 사건'] },
  'e1989-henriiii': { category: 'person', rank: '역사 속 군주·귀족(Souverain & Personnage)', domains: ['인물·역사(Personnage)', '유럽 군주·귀족', '프랑스 국왕'] },
  'e1990-henriiii': { category: 'person', rank: '역사 속 군주·귀족(Souverain & Personnage)', domains: ['인물·역사(Personnage)', '유럽 군주·귀족', '신성 로마 황제'] },
  'e1991-henriiv': { category: 'person', rank: '역사 속 군주·귀족(Souverain & Personnage)', domains: ['인물·역사(Personnage)', '유럽 군주·귀족', '신성 로마 황제'] },
  'e1992-henriiv': { category: 'person', rank: '역사 속 군주·귀족(Souverain & Personnage)', domains: ['인물·역사(Personnage)', '유럽 군주·귀족', '잉글랜드 국왕'] },
  'e1994-henriiv': { category: 'person', rank: '역사 속 군주·귀족(Souverain & Personnage)', domains: ['인물·역사(Personnage)', '유럽 군주·귀족', '프랑스 국왕'] },
  'e1976-helene': { category: 'person', rank: '역사 속 군주·귀족(Souverain & Personnage)', domains: ['인물·역사(Personnage)', '고대 역사', '역사 인물'] },
  'e1977-helene': { category: 'person', rank: '신비 인물·동반자(Personnage Mystique)', domains: ['인물·역사(Personnage)', '영지주의 전승', '신비 인물'] },
  'e1846-godwin': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '고드윈 백작'] },
  'e1847-godwin': { category: 'person', rank: '학자·저술가(Savant & Auteur)', domains: ['인물·역사(Personnage)', '학자·저술가', '영국 저술가'] },
  'e2542-marguerite': { category: 'person', rank: '민간 전승·기담 (Tradition & Superstition)', domains: ['인물·역사(Personnage)', '네덜란드 민담', '기담'] },
  'e2543-marguerite': { category: 'person', rank: '영매·주술사(Sorcier & Médium)', domains: ['인물·역사(Personnage)', '이탈리아 영매', '사역마 전승'] },
  'e950-charlesii': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '샤를 2세'] },
  'e952-charlesii': { category: 'person', rank: '역사 속 군주·귀족(Souverain & Personnage)', domains: ['인물·역사(Personnage)', '유럽 군주·귀족', '잉글랜드 국왕'] },
  'e1294-desfontaines': { category: 'superstition', rank: '유령·환영 기담(Spectre & Fantôme)', domains: ['미신·민속(Superstition)', '유령·환영', '프랑스 기담'] },
  'e1296-desfontaines': { category: 'superstition', rank: '유령·환영 기담(Spectre & Fantôme)', domains: ['미신·민속(Superstition)', '유령·환영', '프랑스 기담'] },
  'e225-anneeclimaterique': { category: 'superstition', rank: '민간 미신·기담(Superstition & Coutume)', domains: ['미신·민속(Superstition)', '점성술·수비학', '위기의 해'] },
  'e227-anneeclimaterique': { category: 'superstition', rank: '민간 미신·기담(Superstition & Coutume)', domains: ['미신·민속(Superstition)', '신체 변화 주기', '수비학'] },

  // Z entries curated metadata
  'e3796-zabulon': { category: 'demon', rank: '지옥의 악마(Démon)', domains: ['악마학(Démonologie)', '루됭 빙의 사건', '빙의 악령'] },
  'e3797-zacharie': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '망령 전승', '비엣카'] },
  'e3798-zacoum': { category: 'myth', rank: '지옥의 마목(Arbre Infernal)', domains: ['신화·종교 전승', '이슬람 지옥 전승', '마법 수목'] },
  'e3800-zagam': { category: 'demon', subCategory: 'monarch', rank: '지옥의 왕·총재(Grand Roi & Président)', legions: 30, domains: ['악마학(Démonologie)', '지옥의 계급 체계', '연금술 악마', '고에티아 72 악마'] },
  'e3801-zahuris': { category: 'superstition', rank: '투시 능력자 전승(Voyance & Clairvoyance)', domains: ['미신·민속(Superstition)', '스페인 민간 전승', '투시술'] },
  'e3802-zairagiezairagiah': { category: 'divination', rank: '아랍의 천문 점술(Divination Arabe)', domains: ['점술·점성술(Divination)', '아랍 오컬트', '천문 바퀴 점술'] },
  'e3803-zapan': { category: 'demon', subCategory: 'monarch', rank: '지옥의 왕(Roi de l’Enfer)', domains: ['악마학(Démonologie)', '지옥의 군주', '의사악마왕국'] },
  'e3804-zariatnatmik': { category: 'superstition', rank: '마법 지팡이의 비전적 존재(Entité Magique)', domains: ['미신·민속(Superstition)', '마법 도구', '지팡이 비술'] },
  'e3805-zazarraguan': { category: 'myth', rank: '태평양 마리아나 제도의 지옥(Enfer des Mariannes)', domains: ['신화·종교 전승', '타계관·지옥 전승', '오세아니아 신화'] },
  'e3806-zedechias': { category: 'person', rank: '카발리스트·궁정 의사(Cabaliste & Médecin)', domains: ['인물·역사(Personnage)', '서양 마법사', '카발라 비전', '원소 정령 전승'] },
  'e3807-zeernebooch': { category: 'myth', rank: '명계의 흑신(Dieu Noir des Morts)', domains: ['신화·종교 전승', '북방·슬라브 신화', '암흑과 명계의 신격'] },
  'e3808-zepar': { category: 'demon', subCategory: 'duke', rank: '지옥의 대공(Grand-Duc)', legions: 28, domains: ['악마학(Démonologie)', '지옥의 계급 체계', '고위 악마', '솔로몬 72 악마'] },
  'e3809-ziganis': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '집시 전승', '진칼리스'] },
  'e3810-zigheuners': { category: 'superstition', rank: '독일 집시 전승과 미신(Tradition des Bohémiens)', domains: ['미신·민속(Superstition)', '유럽 집시 전승', '민간 점술', '민담'] }
};

// Classify and attach pure Korean translation for any 1863 entry
function analyzeAndTranslateEntry(e, koBase, headword = null, id = null) {
  const t = e.textFr.trim();
  const lead = t.slice(0, 260);

  // 1. Check if cross-reference ("Voy. X")
  if (/^(?:voy\.|voyez)\s+/i.test(t) && t.length < 110) {
    const target = t.replace(/^(?:voy\.|voyez)\s+/i, '').replace(/\.$/, '').trim();
    const targetKo = frHeadwordToKo(target, target);
    const targetHead = buildEntryHeadword({ nameFr: target, baseFr: target }, targetKo);
    const pureRef = `${targetHead.nameKo} 참조.`;
    return {
      category: 'crossref',
      rank: '상호참조 표제어 (Renvoi)',
      legions: 0,
      domains: ['상호참조', targetHead.nameKo],
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

  // Extract year / century if present
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

  const PERSON_KEYWORDS = /\b(?:magicien|magicienne|sorcier|sorcière|astrologue|alchimiste|devin|devineresse|cabaliste|inquisiteur|démonographe|démonologue|philosophe|médecin|savant|savante|écrivain|auteur|empereur|roi|reine|pape|évêque|prêtre|moine|abbé|religieuse|saint|sainte|hérétique|imposteur|prédicateur|avocat|jurisconsulte|chanoine|cardinal|patriarche|dominicain|franciscain|jésuite|bénédictin|grand-duc|duc|comte|marquis|baron|prince|tsar|czar|tyran)\b/i;
  const BIO_PATTERNS = /\b(?:né\s+à|née\s+à|mort\s+en|mourut\s+en|vivait\s+au|homme\s+qui|femme\s+qui|homme\s+de|femme\s+de|homme\s+très|femme\s+très)\b/i;
  const isPersonName = /\([a-zA-ZÀ-Ÿ]/.test(e.nameFr) && !/divination|possession|mal\s+des|songe/i.test(e.nameFr);
  const isPersonText = PERSON_KEYWORDS.test(lead.slice(0, 320)) || BIO_PATTERNS.test(lead.slice(0, 320));

  if (isPersonName || isPersonText) {
    category = 'person';
    if (/sorcière/i.test(lead)) { rank = '마녀·주술사(Sorcière)'; domains.push('마녀 재판 전승', '민간 주술'); }
    else if (/sorcier/i.test(lead)) { rank = '마법사·주술사(Sorcier)'; domains.push('서양 마법사', '주술 전승'); }
    else if (/magicien|magicienne|enchanteur/i.test(lead)) { rank = '마법사·비술사(Magicien)'; domains.push('서양 마법사', '비전 마법'); }
    else if (/astrologue/i.test(lead)) { rank = '점성술사(Astrologue)'; domains.push('점성술(Astrologie)', '천문 예언'); }
    else if (/alchimiste|adepte/i.test(lead)) { rank = '연금술사(Alchimiste)'; domains.push('연금술(Alchimie)', '현자의 돌 전승'); }
    else if (/démonographe|inquisiteur|démonologue/i.test(lead)) { rank = '악마학자·이단심문관(Démonographe & Inquisiteur)'; domains.push('이단심문·악마학 연구', '중세 교회재판'); }
    else if (/empereur|roi|reine|prince|grand-duc|duc|comte|marquis|tsar/i.test(lead)) { rank = '역사 속 군주·귀족(Souverain & Personnage)'; domains.push('유럽 군주·귀족', '역사 인물'); }
    else if (/pape|évêque|prêtre|abbé|moine|religieuse|saint|cardinal|patriarche/i.test(lead)) { rank = '성직자·종교 인물(Ecclésiastique & Saint)'; domains.push('교회 인물·성직자', '가톨릭 역사'); }
    else if (/philosophe|médecin|savant|auteur|écrivain/i.test(lead)) { rank = '학자·의사·저술가(Savant & Auteur)'; domains.push('학자·저술가', '중세·르네상스 학술'); }
    else { rank = '오컬트·역사 인물(Personnage Historique)'; domains.push('오컬트 역사', '역사 인물'); }
    domains.unshift('인물·역사(Personnage)');
  } else if (/mancie\b|scopie\b|\bdivination\b|\bprésage|\baugure|\boracle|\bsonge|\bastrolog|\bchiroman|\bhoroscope/i.test(e.nameFr + ' ' + lead.slice(0, 120))) {
    category = 'divination';
    if (/mancie\b|divination/i.test(e.nameFr + ' ' + lead)) rank = '고대·중세 점술(Art Divinatoire)';
    else if (/astrolog|horoscope|planète|constellation/i.test(e.nameFr + ' ' + lead)) rank = '점성술·천문 예언(Astrologie)';
    else if (/songe|oniroman|rêve/i.test(e.nameFr + ' ' + lead)) rank = '해몽·몽점(Oniromancie)';
    else rank = '징조·신탁·예언술(Présage & Oracle)';
    domains.push('점술·예언(Divination)', '고대·중세 점복술');
  } else if (/\b(?:livre|ouvrage|traité|grimoire|clavicule|manuscrit|recueil|rituel|encyclopédie|dissertation|bible du diable)\b/i.test(lead.slice(0, 120))) {
    category = 'grimoire';
    rank = '마도서·오컬트 문헌(Grimoire & Traité)';
    domains.push('마도서·문헌(Grimoire)', '오컬트 비전서');
  } else if (/\b(?:plante|herbe|arbre|racine|fleur|graine|feuille|fruit|pierre|minéral|métal|animal|oiseau|serpent|poisson|insecte|abeille|chat|chien|beurre|bouillon|bâillement|pain|sel|eau|charme|amulette|talisman|remède)\b/i.test(lead.slice(0, 120))) {
    category = 'superstition';
    if (/pierre|minéral|métal/i.test(lead)) { rank = '신비 광물·보석 비방(Pierre Magique)'; domains.push('신비 광물·보석', '민간요법'); }
    else if (/plante|herbe|arbre|racine/i.test(lead)) { rank = '마법 약초·수목 전승(Plante Magique)'; domains.push('마법 약초·수목 비방', '민간요법'); }
    else if (/animal|oiseau|serpent|poisson|chat|chien/i.test(lead)) { rank = '동물 관련 미신·상징(Superstition Animale)'; domains.push('신비 동물·상징', '민간 전승'); }
    else if (/talisman|amulette|charme|remède/i.test(lead)) { rank = '부적·치유 주술(Talisman & Charme)'; domains.push('호신 부적·탈리스만', '액막이 주술'); }
    else { rank = '민간 미신·기담(Superstition & Coutume)'; domains.push('민간 미신·주술', '유럽 민간 풍습'); }
    domains.unshift('미신·민속(Superstition)');
  } else if (/\b(?:dieu|déesse|idole|mythologie|fée|nymphe|géant|monstre|enfer des|purgatoire des|ange|prophète|peuple|habitants de|chez les anciens|légende)\b/i.test(lead)) {
    category = 'myth';
    if (/dieu|déesse|idole/i.test(lead)) rank = '고대 신격·우상(Divinité & Idole)';
    else if (/fée|nymphe|géant|monstre/i.test(lead)) rank = '신화·전설의 존재(Créature Mythologique)';
    else if (/enfer|purgatoire|paradis/i.test(lead)) rank = '내세관·타계 전승(Mythologie de l’Au-delà)';
    else rank = '세계 신화·종교 전승(Mythologie & Légende)';
    domains.push('신화·종교(Mythologie)', '고대 신화·전설');
  } else if (/\b(?:grand-duc des enfers|grand-duc infernal|grand président|marquis de l’enfer|prince de l’enfer|prince des démons|chef des démons|démon|diable|succube|incube|lutin|farfadet|gobelin|vampire|loup-garou|sabbat|possédé|possession|exorcis|esprit infernal)/i.test(lead)) {
    category = 'demon';
    if (/grand-duc des enfers|grand-duc infernal/i.test(lead)) { rank = '지옥의 대공(Grand-Duc Infernal)'; domains.push('지옥의 계급 체계', '고위 악마'); }
    else if (/grand président/i.test(lead)) { rank = '지옥의 대총재(Grand Président)'; domains.push('지옥의 계급 체계', '고위 악마'); }
    else if (/marquis/i.test(lead)) { rank = '지옥의 후작(Marquis de l’Enfer)'; domains.push('지옥의 계급 체계', '고위 악마'); }
    else if (/prince|chef|roi de l’enfer/i.test(lead)) { rank = '지옥 군주·고위 악마(Prince des Démons)'; domains.push('지옥 군주', '솔로몬 72 악마'); }
    else if (/loup-garou|lycanthrop/i.test(lead)) { rank = '늑대인간 전승(Loup-Garou)'; domains.push('늑대인간(Lycanthropie)', '변신 전승'); }
    else if (/vampire/i.test(lead)) { rank = '흡혈귀 전승(Vampire)'; domains.push('흡혈귀 전승', '동유럽 민속'); }
    else if (/lutin|farfadet|gobelin/i.test(lead)) { rank = '가정 요정·소정령(Lutin & Farfadet)'; domains.push('유럽 요정 전승', '가정 정령'); }
    else if (/succube|incube/i.test(lead)) { rank = '몽마·음마(Incube & Succube)'; domains.push('몽마 전승', '악령 유혹'); }
    else if (/esprit familier/i.test(lead)) { rank = '사역마(패밀리어, Esprit familier)'; domains.push('사역마 전승', '마술 도우미'); }
    else if (/possédé|possession|énergumène/i.test(lead)) { rank = '악령 빙의 사건(Possession Démoniaque)'; domains.push('악령 빙의 사건', '엑소시즘(Exorcisme)'); }
    else if (/sabbat/i.test(lead + ' ' + e.nameFr)) { rank = '사바트 의식·주술(Rituel du Sabbat)'; domains.push('사바트 의식', '마녀 집회'); }
    else { rank = '고위 악마·지옥 정령(Démon Supérieur)'; domains.push('지옥 정령', '악마 전승'); }
    domains.unshift('악마학(Démonologie)');
  } else {
    category = 'superstition';
    rank = '민간 미신·기담(Superstition & Coutume)';
    domains.push('미신·민속(Superstition)', '유럽 민간 풍습');
  }

  // Apply curated metadata if configured
  const meta = (id && CURATED_META[id]) || null;
  if (meta) {
    if (meta.category) category = meta.category;
    if (meta.rank) rank = meta.rank;
    if (meta.legions !== undefined) legions = meta.legions;
    if (meta.domains) domains.push(...meta.domains);
  }

  if (centuryKo) domains.push(centuryKo);
  if (years.length) domains.push(`${years[0]}년 기록`);
  if (e.images && e.images.length) domains.push('1863 원서 삽화 수록');

  const cacheKey = `${e.nameFr}@@${e.page1863}`;
  const rawKo = (id && TRANSLATION_CACHE[id]) || TRANSLATION_CACHE[cacheKey] || '';
  const bodyKo = polishTranslation(rawKo, e, koBase, headword, id);

  // First 1-2 sentences for card preview summary
  const sentMatch = bodyKo.match(/^(.{20,160}?[\.!\?])\s+/);
  let summaryKo = sentMatch ? sentMatch[1] : (bodyKo.length > 150 ? bodyKo.slice(0, 150) + '…' : bodyKo);
  const openCount = (summaryKo.match(/\(/g) || []).length;
  const closeCount = (summaryKo.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    const lastOpen = summaryKo.lastIndexOf('(');
    if (lastOpen > 40) {
      summaryKo = summaryKo.slice(0, lastOpen).trim() + '…';
    } else {
      summaryKo += ')';
    }
  }

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

  const slugBase = norm(raw.nameFr).slice(0, 28) || `entry${idx + 1}`;
  const uncuratedId = `e${idx + 1}-${slugBase}`;
  const id = matchedPlate ? matchedPlate.id : uncuratedId;
  const koBase = matchedPlate ? (matchedPlate.nameKoShort || matchedPlate.nameKo) : frHeadwordToKo(raw.nameFr, raw.baseFr, raw, id);
  const headword = buildEntryHeadword(raw, koBase, matchedPlate, id);

  if (matchedPlate) {
    usedPlateIds.add(matchedPlate.id);
    fullEntries.push({
      id: matchedPlate.id,
      letter: raw.letter,
      plate: matchedPlate.plate,
      plateNo: matchedPlate.plateNo,
      hasPlate: true,
      nameKo: headword.nameKo,
      nameKoShort: headword.nameKoShort,
      nameFr: matchedPlate.nameFr,
      nameEn: headword.nameEn || '',
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
    const info = analyzeAndTranslateEntry(raw, koBase, headword, id);
    const assignedPlate = entryPlateMap[String(idx)];
    const hasAssignedPlate = Boolean(assignedPlate && fs.existsSync(path.join(process.cwd(), 'dist', assignedPlate)));
    fullEntries.push({
      id,
      letter: raw.letter,
      plate: hasAssignedPlate ? assignedPlate : '',
      plateNo: hasAssignedPlate ? (nextPlateNo++) : 0,
      hasPlate: hasAssignedPlate,
      nameKo: headword.nameKo,
      nameKoShort: headword.nameKoShort,
      nameFr: headword.nameFr || raw.nameFr,
      nameEn: headword.nameEn || '',
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

const illustratedCount = fullEntries.filter(e => e.hasPlate).length;
console.log('Total full entries built:', fullEntries.length);
console.log('Illustrated plate entries:', illustratedCount);

const jsContent = `export const CATEGORIES=[
  {id:"all",label:"전체 (${fullEntries.length.toLocaleString()})"},
  {id:"illustrated",label:"판화 수록 (${illustratedCount.toLocaleString()})"},
  {id:"demon",label:"악마·정령"},
  {id:"myth",label:"신화·종교"},
  {id:"person",label:"마법사·인물"},
  {id:"divination",label:"점술·점성술"},
  {id:"superstition",label:"미신·민속"},
  {id:"grimoire",label:"마도서·문헌"},
  {id:"crossref",label:"상호참조"}
];

export const GALLERY_CATEGORIES=[
  {id:"all",label:"전체 (${illustratedCount.toLocaleString()})"},
  {id:"monarch",label:"악마 · 지옥 군주"},
  {id:"duke",label:"악마 · 대공·후작"},
  {id:"demon",label:"악마·괴이"},
  {id:"myth",label:"신화·종교"},
  {id:"person",label:"마법사·연금술사"},
  {id:"superstition",label:"미신·마법 의식"}
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
        if(category!=="all"&&entry.subCategory!==category&&entry.category!==category)return false;
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
      entry.nameKoShort || '',
      entry.nameFr,
      entry.nameEn || '',
      entry.rank,
      entry.summary,
      entry.description,
      entry.quoteFr,
      ...(entry.domains||[])
    ].join(" ").toLowerCase();
    return haystack.includes(q);
  });

  return filtered.sort((a,b)=>{
    if(sort==="ko")return (a.nameKoShort||a.nameKo).localeCompare(b.nameKoShort||b.nameKo,"ko") || a.nameKo.localeCompare(b.nameKo,"ko");
    if(sort==="fr")return a.nameFr.localeCompare(b.nameFr,"fr");
    if(sort==="legions")return (b.legions||0)-(a.legions||0)||(a.plateNo||9999)-(b.plateNo||9999)||a.page1863-b.page1863;
    if(sort==="plate")return (b.hasPlate?1:0)-(a.hasPlate?1:0)||(a.plateNo||9999)-(b.plateNo||9999)||a.page1863-b.page1863;
    return a.page1863-b.page1863||a.nameFr.localeCompare(b.nameFr,"fr");
  });
}
`;
fs.writeFileSync('dist/entries.js', jsContent);

