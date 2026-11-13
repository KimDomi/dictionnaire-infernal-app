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
  'ulcères': '궤양', 'ukobach': '우코바크', 'universités occultes': '오컬트 비밀 학회와 대학',
  'uphir': '우피르', 'upiers': '우피에르', 'urda': '우르드', 'urgande': '우르간드',
  'urine': '소변', 'urotopégnie': '우로토페그니', 'uterpen': '유서 펜드래건', 'utéseture': '우티세타',
  'urne': '단지',
  'vagnoste': '바뇨스트', 'vaïcarani': '바이타라니 강', 'vaisseau-fantôme': '유령선',
  'valafar': '발라파르', 'valens': '발렌스 황제', 'valentin': '발렌티누스',
  'valentin (basile)': '바실 발랑탱', 'valère-maxime': '발레리우스 막시무스', 'valkiries': '발키리',
  'vampires': '흡혈귀', 'van-dale': '안토니 반 달레', 'van-dale (antoine)': '안토니 반 달레',
  'vanlund': '반룬트', 'vapeurs': '안개와 수증기 영혼', 'vapula': '바풀라', 'varonnin': '바루나',
  'vaudois': '발도파', 'vaulx': '장 드 볼크스', 'vaulx (jean de)': '장 드 볼크스',
  'vauvert': '보베르 저택의 악마 유령', 'veau d’or': '황금 송아지', 'veau marin': '바다표범',
  'veland le forgeron': '대장장이 벨란트', 'velleda': '벨레다', 'vendredi': '금요일',
  'veneur': '퐁텐블로의 유령 사냥꾼', 'ventriloques': '복화술', 'vents': '바람',
  'vépar': '베파르', 'vérandi': '베르단디', 'verdelet': '베르델레',
  'verdung': '미셸 베르됭', 'verdung (michel)': '미셸 베르됭', 'verge': '수맥 점술 지팡이',
  'verge d’aaron': '아론의 지팡이', 'verre d’eau': '물잔 점술', 'verrues': '사마귀',
  'vers': '벌레 치유 주술', 'vert': '녹색', 'vert-joli': '베르-졸리', 'verveine': '버베나',
  'vespasien': '베스파시아누스', 'vesta': '베스타', 'vêtements des morts': '망자의 옷',
  'vétin': '베틴', 'veu-pacha': '베우-파샤', 'viaram': '비아람',
  'vidal de la porte': '비달 드 라 포르트', 'vid-blain': '비드블라인', 'vieille': '노파 유령',
  'villain': '에티엔 빌랭 수도원장', 'villain (l’abbé)': '에티엔 빌랭 수도원장',
  'villars': '앙리 드 빌라르 수도원장', 'villars (l’abbé de)': '앙리 드 빌라르 수도원장',
  'villiers': '플로랑 드 빌리에', 'villiers (florent de)': '플로랑 드 빌리에',
  'vine': '비네', 'vipère': '독사', 'virgile': '베르길리우스', 'visions': '환영과 환각',
  'vocératrices': '보체라트리체', 'voile': '시신을 덮는 베일',
  'voisin (la)': '라 부아쟁', 'voisin': '라 부아쟁', 'voisinla': '라 부아쟁',
  'voiture du diable': '악마의 마차', 'voix': '빙의자의 목소리', 'volac': '볼라크',
  'volet': '마리 볼레', 'volet (marie)': '마리 볼레', 'vols': '부스트', 'volta': '볼타',
  'voltaire': '볼테르', 'voltigeur hollandais': '방황하는 네덜란드인', 'vondel': '요스트 판 덴 본델',
  'vouivre': '부아브르', 'voyages des sorcières': '빗자루를 탄 마녀의 여행',
  'vroucolacas': '브루콜라카스', 'vue': '마녀의 눈빛과 투시안',
  'waeter-elves': '워터 엘프', 'waeterelves': '워터 엘프',
  'wakeman': '웨이크먼', 'wakeman (rhoda)': '로다 웨이크먼',
  'walhalla': '발할라', 'walkiries': '발키리',
  'wall': '발(부알)',
  'walter': '발터 기사', 'walter-scott': '월터 스콧', 'walterscott': '월터 스콧',
  'wattier': '피에르 와티에', 'wattier (pierre)': '피에르 와티에',
  'wechselbalg': '벡셀발크', 'welz': '앙드레 벨츠', 'welz (andré)': '앙드레 벨츠',
  'wenham': '제인 웨넘', 'wenham (jane)': '제인 웨넘',
  'wesley': '웨슬리', 'wiclef': '존 위클리프',
  'wierus': '요한 바이어', 'wiérus': '요한 바이어',
  'wilis': '윌리', 'wiulmeroz': '기욤 드 비울메로즈',
  'wivre': '부아브르', 'woden': '보덴', 'wolotys': '볼로티',
  'woodward': '제임스 우드워드', 'wortigern': '보티건',
  'wulson de la colombière (marc)': '마르크 불송 드 라 콜롱비에르',
  'xacca': '샤카', 'xaphan': '자판', 'xéno': '제노', 'xeirscopie': '크세이로스코피',
  'xerxès': '크세르크세스', 'xerxes': '크세르크세스', 'xezbeth': '크세즈베트',
  'xitragupten': '치트라굽타', 'xylomancie': '크실로망시',
  'yaga-baba': '야가-바바', 'yagababa': '야가-바바',
  'yakouts': '야쿠트족',
  'yan-gant-y-tan': '얀 강 이 탄',
  'yasdh': '야쉬드',
  'ychain-bonawgs': '이카인-바나옥', 'ychainbonawgs': '이카인-바나옥',
  'yen-vang': '옌왕', 'yenvang': '옌왕',
  'yesdhoon': '예스둔',
  'yermoloff': '예르몰로프',
  'yeux': '악마의 눈과 마안',
  'yffrotte': '이프로테',
  'yormoungandour': '요르문간드',
  'youf (marie-anne)': '마리-안 유프', 'youf': '마리-안 유프', 'youfmarieanne': '마리-안 유프',
  'youma': '유마',
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
  'e973-chax': { nameKo: '샥스 또는 칵스 [Chax]', nameKoShort: '샥스 또는 칵스', nameFr: 'Chax', nameEn: 'Chax (Crossref to Scox)' },
  // R entries curated headwords (p.569-586)
  'e3172-rabbats': { nameKo: '라바트(목깃 달린 요정) [Rabbats]', nameKoShort: '라바트', nameFr: 'Rabbats', nameEn: 'Rabbats (Noisy Hobgoblins)' },
  'e3173-rabbins': { nameKo: '랍비의 마법 전승 [Rabbins / Rabbinical Magic]', nameKoShort: '랍비의 마법 전승', nameFr: 'Rabbins', nameEn: 'Rabbinical Occult Traditions' },
  'e3174-rabdomancie': { nameKo: '막대점·수맥 찾기(랍도망시) [Rabdomancie / Rhabdomancy]', nameKoShort: '막대점·수맥 찾기', nameFr: 'Rabdomancie', nameEn: 'Rhabdomancy (Dowsing Divination)' },
  'e3175-rachaders': { nameKo: '라샤데르(인도의 악령) [Rachaders / Rakshasas]', nameKoShort: '라샤데르', nameFr: 'Rachaders', nameEn: 'Rachaders (Indian Evil Spirits)' },
  'e3176-radcliffeanne': { nameKo: '앤 래드클리프 [Radcliffe (Anne)]', nameKoShort: '앤 래드클리프', nameFr: 'Radcliffe (Anne)', nameEn: 'Ann Radcliffe (Gothic Novelist)' },
  'e3177-ragalomancie': { nameKo: '라갈로망시(주사위·수조 점술) [Ragalomancie / Ragalomancy]', nameKoShort: '라갈로망시', nameFr: 'Ragalomancie', nameEn: 'Ragalomancy' },
  'e3178-rage': { nameKo: '광견병 치유의 주문과 미신 [Rage / Hydrophobia Superstitions]', nameKoShort: '광견병 치유 미신', nameFr: 'Rage', nameEn: 'Superstitions of Hydrophobia Cure' },
  'e3179-raginis': { nameKo: '라기니(천상의 님프) [Raginis / Rāginī]', nameKoShort: '라기니', nameFr: 'Raginis', nameEn: 'Raginis (Nymphs of Melody)' },
  'e3180-ragusegeorgede': { nameKo: '조르주 드 라구즈 [Raguse (George de)]', nameKoShort: '조르주 드 라구즈', nameFr: 'Raguse (George de)', nameEn: 'Georgius Raguseus' },
  'rahouart': { nameKo: '라우아르 [Rahouart]', nameKoShort: '라우아르', nameFr: 'Rahouart', nameEn: 'Rahouart (Demon of the Miser)' },
  'e3182-raiz': { nameKo: '레즈 또는 레츠 [Raiz]', nameKoShort: '레즈', nameFr: 'Raiz', nameEn: 'Raiz (Crossref to Retz)' },
  'e3183-raidemariedela': { nameKo: '마리 드 라 레드 [Raide (Marie de la)]', nameKoShort: '마리 드 라 레드', nameFr: 'Raide (Marie de la)', nameEn: 'Marie de la Raide (Child Witch)' },
  'e3184-raleighwalter': { nameKo: '월터 롤리 경 [Raleigh (Walter) / Sir Walter Raleigh]', nameKoShort: '월터 롤리 경', nameFr: 'Raleigh (Walter)', nameEn: 'Sir Walter Raleigh' },
  'e3185-rambouillet': { nameKo: '랑부예 후작의 유령 서약 [Rambouillet / Marquis de Rambouillet]', nameKoShort: '랑부예 후작의 유령', nameFr: 'Rambouillet', nameEn: 'Marquis of Rambouillet (Ghost Compact)' },
  'e3186-ranfaingmariede': { nameKo: '마리 드 랑팽 [Ranfaing (Marie de)]', nameKoShort: '마리 드 랑팽', nameFr: 'Ranfaing (Marie de)', nameEn: 'Elisabeth de Ranfaing' },
  'e3187-ranirazal': { nameKo: '라니 라잘(인도 혼인 여신) [Rani-Razal]', nameKoShort: '라니 라잘', nameFr: 'Rani-Razal', nameEn: 'Rani-Razal (Goddess of Satpura)' },
  'e3188-rannou': { nameKo: '라누 전설(브르타뉴 인어 이야기) [Rannou]', nameKoShort: '라누 전설', nameFr: 'Rannou', nameEn: 'Rannou (Breton Mermaid Legend)' },
  'e3189-raolletjacques': { nameKo: '자크 라올레 [Raollet (Jacques)]', nameKoShort: '자크 라올레', nameFr: 'Raollet (Jacques)', nameEn: 'Jacques Raollet (Werewolf of Angers)' },
  'e3190-rat': { nameKo: '쥐의 전조와 흉조 [Rat / Omens of the Rat]', nameKoShort: '쥐의 전조와 흉조', nameFr: 'Rat', nameEn: 'Omens and Superstitions of the Rat' },
  'e3191-raum': { nameKo: '라움 [Raum / Raym]', nameKoShort: '라움', nameFr: 'Raum', nameEn: 'Raum (Great Count of Hell)' },
  'e3192-realisme': { nameKo: '실재론과 유물론의 허구 [Réalisme / Realism and Materialism]', nameKoShort: '실재론과 유물론', nameFr: 'Réalisme', nameEn: 'Realism and Materialism Critique' },
  'e3193-redcap': { nameKo: '레드캡(붉은 모자 요정) [Red-cap / Redcap]', nameKoShort: '레드캡', nameFr: 'Red-cap', nameEn: 'Redcap (Bloodthirsty Goblin)' },
  'e3194-regard': { nameKo: '사시와 마안(사악한 눈) [Regard / Evil Eye]', nameKoShort: '사시와 마안', nameFr: 'Regard', nameEn: 'Evil Eye (Crossref to Yeux)' },
  'e3195-regensberg': { nameKo: '레겐스베르크의 사역마 [Regensberg]', nameKoShort: '레겐스베르크의 사역마', nameFr: 'Regensberg', nameEn: 'Regensberg (Familiar Spirit)' },
  'e3196-regiomontanus': { nameKo: '레기오몬타누스(요하네스 뮐러) [Regiomontanus]', nameKoShort: '레기오몬타누스', nameFr: 'Regiomontanus', nameEn: 'Regiomontanus (Crossref to Muller)' },
  'e3197-reidthomas': { nameKo: '토머스 리드 [Reid (Thomas)]', nameKoShort: '토머스 리드', nameFr: 'Reid (Thomas)', nameEn: 'Thomas Reid (Scottish Philosopher)' },
  'e3198-reineguetet': { nameKo: '게테 여왕(여장한 악마) [Reine Guétet]', nameKoShort: '게테 여왕', nameFr: 'Reine Guétet', nameEn: 'Reine Guétet (Queen of the Sabbath)' },
  'e3199-reinesdusabbat': { nameKo: '사바트의 여왕들 [Reines du sabbat / Queens of the Sabbath]', nameKoShort: '사바트의 여왕들', nameFr: 'Reines du sabbat', nameEn: 'Queens of the Witches\' Sabbath' },
  'e3200-religion': { nameKo: '원시 종교와 미신의 기원 [Religion / Origin of Religions and Superstitions]', nameKoShort: '원시 종교와 미신', nameFr: 'Religion', nameEn: 'Origins of Religion and Superstition' },
  'e3201-reminicolas': { nameKo: '니콜라 레미 [Remi (Nicolas) / Nicolaus Remigius]', nameKoShort: '니콜라 레미', nameFr: 'Remi (Nicolas)', nameEn: 'Nicolas de Rémy (Demonologist)' },
  'e3202-remmon': { nameKo: '렘몬 [Remmon]', nameKoShort: '렘몬', nameFr: 'Remmon', nameEn: 'Remmon (Crossref to Rimmon)' },
  'e3203-remords': { nameKo: '양심의 가책과 망령의 복수 [Remords / Remorse and Vengeful Ghosts]', nameKoShort: '양심의 가책과 망령', nameFr: 'Remords', nameEn: 'Remorse (White Lady Legend of Orlamünde)' },
  'e3204-remore': { nameKo: '빨판상어(레모라)의 신비적 냉기 [Rémore / Remora]', nameKoShort: '빨판상어의 냉기', nameFr: 'Rémore', nameEn: 'Remora (Ice-Fish Superstition)' },
  'e3205-remures': { nameKo: '레무레스(떠도는 망령) [Rémures / Lemures]', nameKoShort: '레무레스', nameFr: 'Rémures', nameEn: 'Lemures (Crossref to Lémures)' },
  'e3206-renards': { nameKo: '여우 요괴와 구미호 미신 [Renards / Fox Demons (Kitsune)]', nameKoShort: '여우 요괴 미신', nameFr: 'Renards', nameEn: 'Fox Demons and Kitsune Superstition' },
  'e3207-repare': { nameKo: '레파라투스 [Réparé / Reparatus]', nameKoShort: '레파라투스', nameFr: 'Réparé', nameEn: 'Reparatus (Visionary of Purgatory)' },
  'e3208-repasdumort': { nameKo: '망자의 진찬(사자 진찬 의례) [Repas du mort / Feast for the Dead]', nameKoShort: '망자의 진찬', nameFr: 'Repas du mort', nameEn: 'Feast for the Dead (Funeral Banquets)' },
  'e3209-repasdusabbat': { nameKo: '사바트의 연회와 모독의 식사 [Repas du sabbat / Banquet of the Sabbath]', nameKoShort: '사바트의 연회', nameFr: 'Repas du sabbat', nameEn: 'Witches\' Sabbath Feast' },
  'e3210-resurrection': { nameKo: '파르시교도의 육체 부활 전설 [Résurrection / Parsi Superstitions of Resurrection]', nameKoShort: '파르시교도의 육체 부활', nameFr: 'Résurrection', nameEn: 'Zoroastrian and Parsi Resurrection Myths' },
  'e3211-retz': { nameKo: '질 드 레 남작 [Retz, Gilles de Laval de / Gilles de Rais]', nameKoShort: '질 드 레 남작', nameFr: 'Retz (Gilles de Laval de)', nameEn: 'Gilles de Rais (Baron de Retz)' },
  'e3212-retz': { nameKo: '레츠 추기경의 야간 유령 목격담 [Retz (Le Cardinal de)]', nameKoShort: '레츠 추기경의 유령 목격담', nameFr: 'Retz (Le Cardinal de)', nameEn: 'Cardinal de Retz (Phantom of Saint-Cloud)' },
  'e3213-reve': { nameKo: '꿈과 해몽의 미신 [Rêve / Dreams and Oneiromancy]', nameKoShort: '꿈과 해몽의 미신', nameFr: 'Rêve', nameEn: 'Superstitions of Dreams and Oneiromancy' },
  'e3214-reveillematin': { nameKo: '등대풀(악마의 젖) [Réveille-matin / Petty Spurge]', nameKoShort: '등대풀(악마의 젖)', nameFr: 'Réveille-matin', nameEn: 'Petty Spurge (Devil\'s Milk)' },
  'e3215-revelations': { nameKo: '초자연적 계시와 환시 [Révélations / Supernatural Revelations]', nameKoShort: '초자연적 계시', nameFr: 'Révélations', nameEn: 'Supernatural Revelations and Omens' },
  'e3216-revenants': { nameKo: '되살아난 망령(르브낭) [Revenants / The Returned]', nameKoShort: '되살아난 망령', nameFr: 'Revenants', nameEn: 'Revenants (The Walking Dead and Phantoms)' },
  'e3217-rhapsodomancie': { nameKo: '시편점(랩소도망시) [Rhapsodomancie / Rhapsodomancy]', nameKoShort: '시편점', nameFr: 'Rhapsodomancie', nameEn: 'Rhapsodomancy (Divination by Poetry)' },
  'e3218-rhombus': { nameKo: '마법 회전판(롬보스) [Rhombus / Bullroarer]', nameKoShort: '마법 회전판(롬보스)', nameFr: 'Rhombus', nameEn: 'Rhombus (Ancient Magic Bullroarer)' },
  'e3219-rhone': { nameKo: '론 강의 악마와 괴물 [Rhône / Spirit of the River Rhône]', nameKoShort: '론 강의 악마', nameFr: 'Rhône', nameEn: 'Demon of the Rhône (River Legends)' },
  'e3220-rhotomago': { nameKo: '로토마고(요술의 거장 악마) [Rhotomago]', nameKoShort: '로토마고', nameFr: 'Rhotomago', nameEn: 'Rhotomago (Grand Master of Sorcerers)' },
  'e3221-rhune': { nameKo: '라 륀 산(숫염소의 숲) [Rhune / La Rhune]', nameKoShort: '라 륀 산', nameFr: 'Rhune', nameEn: 'La Rhune (Sabbath Mountain of the Basque)' },
  'e3222-ribadinjeannette': { nameKo: '잔 리바댕 [Ribadin (Jeannette)]', nameKoShort: '잔 리바댕', nameFr: 'Ribadin (Jeannette)', nameEn: 'Jeannette Ribadin (Basque Witch)' },
  'ribesal': { nameKo: '뤼베찰(산령) [Ribesal, Rübezahl]', nameKoShort: '뤼베찰', nameFr: 'Ribesal (Rübezahl)', nameEn: 'Rübezahl (Mountain Spirit of Krkonoše)' },
  'e3224-richardcoeurdelion': { nameKo: '사자심왕 리처드 1세 [Richard Cœur de lion / Richard the Lionheart]', nameKoShort: '사자심왕 리처드 1세', nameFr: 'Richard Cœur de lion', nameEn: 'Richard the Lionheart' },
  'e3225-richardsanspeur': { nameKo: '무용공 리샤르 1세 [Richard Sans peur / Richard the Fearless]', nameKoShort: '무용공 리샤르', nameFr: 'Richard Sans peur', nameEn: 'Richard the Fearless (Duke of Normandy)' },
  'e3226-richelieu': { nameKo: '리슐리외 원수 [Richelieu / Maréchal de Richelieu]', nameKoShort: '리슐리외 원수', nameFr: 'Richelieu', nameEn: 'Louis François Armand de Vignerot du Plessis, Duke of Richelieu' },
  'e3227-rickiusjacques': { nameKo: '야코부스 리키우스 [Rickius (Jacques)]', nameKoShort: '야코부스 리키우스', nameFr: 'Rickius (Jacques)', nameEn: 'Jacobus Rickius (Cologne Jurist)' },
  'e3228-rigouxmaitre': { nameKo: '마스터 리고 [Rigoux (maître) / Master Rigoux]', nameKoShort: '마스터 리고', nameFr: 'Rigoux (maître)', nameEn: 'Master Rigoux (Sabbath Demon)' },
  'e3229-rimmon': { nameKo: '림몬 [Rimmon]', nameKoShort: '림몬', nameFr: 'Rimmon', nameEn: 'Rimmon (Chief Physician of Hell)' },
  'e3230-riviererochlebaillifsieurdel': { nameKo: '로슈 르 바이프 드 라 리비에르 [Rivière (Roch le Baillif, sieur de la)]', nameKoShort: '로슈 르 바이프', nameFr: 'Rivière (Roch le Baillif, sieur de la)', nameEn: 'Roch le Baillif, Sieur de la Rivière' },
  'e3231-robert': { nameKo: '악마 로베르 [Robert (Démon)]', nameKoShort: '악마 로베르', nameFr: 'Robert (Démon)', nameEn: 'Robert (Possessing Demon of the Sabbath)' },
  'e3232-robertlediable': { nameKo: '악마 로베르(노르망디 전설) [Robert le Diable / Robert the Devil]', nameKoShort: '악마 로베르 전설', nameFr: 'Robert le Diable', nameEn: 'Robert the Devil (Norman Legend)' },
  'e3233-robert': { nameKo: '아르투아의 로베르 [Robert (Sorcier d’Artois) / Robert of Artois]', nameKoShort: '아르투아의 로베르', nameFr: 'Robert (Sorcier d’Artois)', nameEn: 'Robert of Artois (14th Century Sorcerer)' },
  'e3234-robert': { nameKo: '로베르 2세 국왕 [Robert II (Roi de France) / Robert II of France]', nameKoShort: '로베르 2세 국왕', nameFr: 'Robert II (Roi de France)', nameEn: 'Robert II the Pious (King of France)' },
  'e3235-robinhood': { nameKo: '로빈 후드 [Robin Hood]', nameKoShort: '로빈 후드', nameFr: 'Robin Hood', nameEn: 'Robin Hood (Crossref to Puck)' },
  'e3236-robinetdevaulx': { nameKo: '로비네 드 보 [Robinet de Vaulx]', nameKoShort: '로비네 드 보', nameFr: 'Robinet de Vaulx', nameEn: 'Robinet de Vaulx (False Hermit)' },
  'e3237-rocayamariede': { nameKo: '마리 드 로카야 [Rocaya (Marie de)]', nameKoShort: '마리 드 로카야', nameFr: 'Rocaya (Marie de)', nameEn: 'Marie de Rocaya (Basque Witch)' },
  'e3238-rodenstein': { nameKo: '로덴슈타인 기사 전설 [Rodenstein]', nameKoShort: '로덴슈타인', nameFr: 'Rodenstein', nameEn: 'Rodenstein (Crossref to Hakelberg)' },
  'e3239-roderik': { nameKo: '로드리고 국왕(로데릭) [Roderik / King Roderic]', nameKoShort: '로드리고 국왕', nameFr: 'Roderik', nameEn: 'Roderic (Last King of the Visigoths)' },
  'e3240-rodriguezignazio': { nameKo: '이그나시오 로드리게스 [Rodriguez (Ignazio)]', nameKoShort: '이그나시오 로드리게스', nameFr: 'Rodriguez (Ignazio)', nameEn: 'Ignazio Rodriguez (Crossref to Inquisition)' },
  'e3241-roisdelenfer': { nameKo: '지옥의 일곱 왕 [Rois de l’enfer / Kings of Hell]', nameKoShort: '지옥의 일곱 왕', nameFr: 'Rois de l’enfer', nameEn: 'Seven Kings of Hell' },
  'e3242-roisdefrance': { nameKo: '프랑스 국왕들의 신화와 기형 전설 [Rois de France / Kings of France Legends]', nameKoShort: '프랑스 국왕들의 신화', nameFr: 'Rois de France', nameEn: 'Myths and Monstrous Legends of French Kings' },
  'e3243-roitelet': { nameKo: '상모솔새의 미신 [Roitelet / Wren Superstitions]', nameKoShort: '상모솔새의 미신', nameFr: 'Roitelet', nameEn: 'Wren Superstitions (King of Birds)' },
  'e3244-rolandeduvernois': { nameKo: '롤랑드 뒤 베르누아 [Rolande du Vernois]', nameKoShort: '롤랑드 뒤 베르누아', nameFr: 'Rolande du Vernois', nameEn: 'Rolande du Vernois (Burgundian Witch)' },
  'e3245-rome': { nameKo: '로마와 교황권 전설 [Rome / Legends of Rome]', nameKoShort: '로마와 교황권 전설', nameFr: 'Rome', nameEn: 'Rome (The City Inviolable to Hell)' },
  'e3246-romulus': { nameKo: '로물루스 [Romulus]', nameKoShort: '로물루스', nameFr: 'Romulus', nameEn: 'Romulus (Founder of Rome)' },
  'ronwe': { nameKo: '로노베 또는 론웨 [Ronwe, Ronove]', nameKoShort: '로노베 또는 론웨', nameFr: 'Ronwe (Ronove)', nameEn: 'Ronove (Marquis and Earl of Hell)' },
  'e3248-rosecroix': { nameKo: '장미십자회 [Rose-croix / Rosicrucians]', nameKoShort: '장미십자회', nameFr: 'Rose-croix', nameEn: 'Rosicrucianism (Brethren of the Rosy Cross)' },
  'e3249-rosedejericho': { nameKo: '여리고의 장미 [Rose de Jéricho / Rose of Jericho]', nameKoShort: '여리고의 장미', nameFr: 'Rose de Jéricho', nameEn: 'Rose of Jericho (Crossref to Brown)' },
  'e3250-rosemberg': { nameKo: '로젠베르크의 백색 부인 [Rosemberg / White Lady of Rosenberg]', nameKoShort: '로젠베르크의 백색 부인', nameFr: 'Rosemberg', nameEn: 'White Lady of Rosenberg (Crossref to Femmes blanches)' },
  'e3251-rosendal': { nameKo: '로센달(장미의 계곡) [Rosendal / Valley of Roses]', nameKoShort: '로센달', nameFr: 'Rosendal', nameEn: 'Rosendal (Swedish Witches\' Sabbath Site)' },
  'e3252-rosier': { nameKo: '로지에르 [Rosier]', nameKoShort: '로지에르', nameFr: 'Rosier', nameEn: 'Rosier (Prince of Dominations)' },
  'e3253-roskolnicks': { nameKo: '라스콜니키(러시아 고의식파) [Roskolnicks / Raskolniks]', nameKoShort: '라스콜니키', nameFr: 'Roskolnicks', nameEn: 'Raskolniks (Russian Old Believers)' },
  'e3254-rounfl': { nameKo: '룬플(브르타뉴 식인귀) [Rounfl / Breton Ogre]', nameKoShort: '룬플', nameFr: 'Rounfl', nameEn: 'Rounfl (Breton Ogre)' },
  'e3255-roussalkis': { nameKo: '루살카(슬라브 물의 정령) [Roussalkis / Rusalkas]', nameKoShort: '루살카', nameFr: 'Roussalkis', nameEn: 'Rusalkas (Slavic Water Nymphs)' },
  'e3256-roustem': { nameKo: '로스탐 [Roustem / Rostam]', nameKoShort: '로스탐', nameFr: 'Roustem', nameEn: 'Rostam (Hero of the Shahnameh)' },
  'e3257-roux': { nameKo: '붉은 머리·붉은 수염의 미신 [Roux / Red Hair Superstitions]', nameKoShort: '붉은 머리·붉은 수염의 미신', nameFr: 'Roux', nameEn: 'Superstitions of Red Hair and Beards' },
  'e3258-rubezal': { nameKo: '뤼베잘 [Rubezal / Rübezahl]', nameKoShort: '뤼베잘', nameFr: 'Rubezal', nameEn: 'Rubezal (Crossref to Ribesal)' },
  'e3259-rubis': { nameKo: '루비의 신비적 효능 [Rubis / Virtues of the Ruby]', nameKoShort: '루비의 신비적 효능', nameFr: 'Rubis', nameEn: 'Mystical Properties of the Ruby' },
  'e3260-ruedenfer': { nameKo: '지옥 거리(뤼 당페르) [Rue d’Enfer / Hell Street]', nameKoShort: '지옥 거리', nameFr: 'Rue d’Enfer', nameEn: 'Rue d\'Enfer (Crossref to Vauvert)' },
  'e3261-ruffais': { nameKo: '루파이 수피 교단 [Ruffaïs / Rifa\'i Sufis]', nameKoShort: '루파이 수피 교단', nameFr: 'Ruffaïs', nameEn: 'Rifa\'i Dervishes (Howling Dervishes)' },
  'e3262-ruggiericosme': { nameKo: '코스모 루지에리 [Ruggieri (Cosme) / Cosmo Ruggieri]', nameKoShort: '코스모 루지에리', nameFr: 'Ruggieri (Cosme)', nameEn: 'Cosmo Ruggieri (Florentine Astrologer)' },
  'e3263-rugner': { nameKo: '흐룽그니르 [Rugner / Hrungnir]', nameKoShort: '흐룽그니르', nameFr: 'Rugner', nameEn: 'Hrungnir (Norse Stone Giant)' },
  'e3264-ruleelspet': { nameKo: '엘스펫 룰 [Rule (Elspet)]', nameKoShort: '엘스펫 룰', nameFr: 'Rule (Elspet)', nameEn: 'Elspet Rule (Dumfries Witch Trial)' },
  'e3265-runes': { nameKo: '룬 문자의 마법과 비전 [Runes / Runic Magic]', nameKoShort: '룬 문자의 마법', nameFr: 'Runes', nameEn: 'Runic Magic and Inscriptions' },
  'e3266-rush': { nameKo: '프라이어 러시(러시 수사) [Rush / Friar Rush]', nameKoShort: '프라이어 러시', nameFr: 'Rush', nameEn: 'Friar Rush (Monastery Goblin)' },
  'e3267-ryence': { nameKo: '리엔스 왕 [Ryence / King Ryence]', nameKoShort: '리엔스 왕', nameFr: 'Ryence', nameEn: 'King Ryence of North Wales' },
  'e3268-rymer': { nameKo: '흐륌(나글파르의 조종사 거인) [Rymer / Hrym]', nameKoShort: '흐륌', nameFr: 'Rymer', nameEn: 'Hrym (Captain of Naglfar)' },

  // S entries curated headwords (p.586-645)
  'e3269-sabaoth': { nameKo: '만군의 주(사바오트) [Sabaoth]', nameKoShort: '만군의 주(사바오트)', nameFr: 'Sabaoth', nameEn: 'Lord of Hosts (Sabaoth)' },
  'e3270-sabasius': { nameKo: '사바지우스 [Sabasius / Sabazios]', nameKoShort: '사바지우스', nameFr: 'Sabasius', nameEn: 'Sabazios (Thracian Deity)' },
  'e3271-sabathan': { nameKo: '사바탄 [Sabathan]', nameKoShort: '사바탄', nameFr: 'Sabathan', nameEn: 'Sabathan (Sabbath Demon)' },
  'e3272-sabba': { nameKo: '시바의 여왕(사바) [Sabba / Queen of Sheba]', nameKoShort: '시바의 여왕(사바)', nameFr: 'Sabba', nameEn: 'Queen of Sheba (Sabba)' },
  'e3273-sabbat': { nameKo: '사바트(마녀들의 밤 집회) [Sabbat / Witches\' Sabbath]', nameKoShort: '사바트(마녀들의 밤 집회)', nameFr: 'Sabbat', nameEn: 'Witches\' Sabbath' },
  'e3274-sabbathaizevi': { nameKo: '샤브타이 츠비 [Sabbathaï Zévi / Sabbatai Zevi]', nameKoShort: '샤브타이 츠비', nameFr: 'Sabbathaï Zévi', nameEn: 'Sabbatai Zevi (False Messiah)' },
  'e3275-sabeisme': { nameKo: '사비교(천체·별 숭배) [Sabéisme / Sabaism]', nameKoShort: '사비교(천체·별 숭배)', nameFr: 'Sabéisme', nameEn: 'Sabaism (Star Worship)' },
  'e3276-sabellicusgeorges': { nameKo: '게오르크 자벨리쿠스(파우스트 2세) [Sabellicus (Georges)]', nameKoShort: '게오르크 자벨리쿠스', nameFr: 'Sabellicus (Georges)', nameEn: 'Georgius Sabellicus (Faustus Junior)' },
  'e3277-sabienus': { nameKo: '사비에누스 [Sabiénus]', nameKoShort: '사비에누스', nameFr: 'Sabiénus', nameEn: 'Sabienus (Roman Naval Commander)' },
  'e3278-sabim': { nameKo: '사빔 [Sabim]', nameKoShort: '사빔', nameFr: 'Sabim', nameEn: 'Sabim (Turkish Astrologer)' },
  'e3279-sable': { nameKo: '모래점과 복술 미신 [Sable / Divination by Sand]', nameKoShort: '모래점과 복술 미신', nameFr: 'Sable', nameEn: 'Divination by Sand' },
  'e3280-sabnac': { nameKo: '사브낙 [Sabnac / Sabnock]', nameKoShort: '사브낙', nameFr: 'Sabnac', nameEn: 'Sabnock (Demon Marquis)' },
  'e3281-sacaras': { nameKo: '사카라스 [Sacaras]', nameKoShort: '사카라스', nameFr: 'Sacaras', nameEn: 'Sacaras (Madagascan Evil Spirit)' },
  'e3282-saccilaires': { nameKo: '사킬라리아(자루 마술사) [Saccilaires]', nameKoShort: '사킬라리아', nameFr: 'Saccilaires', nameEn: 'Saccilarii (Sack Magicians)' },
  'e3283-sacrifices': { nameKo: '희생 제물의 미신과 인신공양 [Sacrifices / Human Sacrifices]', nameKoShort: '희생 제물의 미신', nameFr: 'Sacrifices', nameEn: 'Superstitions of Sacrifices' },
  'e3284-sadey': { nameKo: '사데 [Sadey]', nameKoShort: '사데', nameFr: 'Sadey', nameEn: 'Sadey (Trial Witness)' },
  'e3285-sadial': { nameKo: '사디엘 [Sadial / Sadiel]', nameKoShort: '사디엘', nameFr: 'Sadial', nameEn: 'Sadiel (Angel of the Third Heaven)' },
  'e3286-saignementdenez': { nameKo: '코피의 징조와 미신 [Saignement de nez / Nosebleed Superstition]', nameKoShort: '코피의 징조와 미신', nameFr: 'Saignement de nez', nameEn: 'Nosebleed Superstitions' },
  'e3287-sainokavara': { nameKo: '사이노카와라(삼도천의 강변) [Sainokavara / Sai no Kawara]', nameKoShort: '사이노카와라(삼도천 강변)', nameFr: 'Sainokavara', nameEn: 'Sai no Kawara (Children Underworld Shore)' },
  'e3288-sainsmariede': { nameKo: '마리 드 생 [Sains (Marie de)]', nameKoShort: '마리 드 생', nameFr: 'Sains (Marie de)', nameEn: 'Marie de Sains (Possessed Nun)' },
  'e3289-saintandre': { nameKo: '생탕드레 [Saint-André / Dr. Saint-André]', nameKoShort: '생탕드레', nameFr: 'Saint-André', nameEn: 'Doctor Saint-André' },
  'e3290-saintaubin': { nameKo: '생토뱅 [Saint-Aubin]', nameKoShort: '생토뱅', nameFr: 'Saint-Aubin', nameEn: 'Saint-Aubin (Calvinist Author)' },
  'e3291-saintgermainlecomtede': { nameKo: '생제르맹 백작 [Saint-Germain (Le comte de)]', nameKoShort: '생제르맹 백작', nameFr: 'Saint-Germain (le comte de)', nameEn: 'Count of Saint-Germain' },
  'e3292-saintgille': { nameKo: '생질 [Saint-Gille]', nameKoShort: '생질', nameFr: 'Saint-Gille', nameEn: 'Saint-Gille (Ventriloquist)' },
  'e3293-saints': { nameKo: '성자 사칭 사기와 미신 [Saints / False Miracles of Saints]', nameKoShort: '성자 사칭 사기와 미신', nameFr: 'Saints', nameEn: 'False Miracles of Saints' },
  'e3294-sakhar': { nameKo: '사크르 [Sakhar / Sakhr]', nameKoShort: '사크르', nameFr: 'Sakhar', nameEn: 'Sakhr (Demon of Solomon’s Throne)' },
  'e3295-sakhrat': { nameKo: '사크라트(대지의 에메랄드 초석) [Sakhrat]', nameKoShort: '사크라트(에메랄드 초석)', nameFr: 'Sakhrat', nameEn: 'Sakhrat (Cosmic Emerald Rock)' },
  'e3296-sakimouni': { nameKo: '석가모니 [Sakimouni / Shakyamuni Buddha]', nameKoShort: '석가모니', nameFr: 'Sakimouni', nameEn: 'Shakyamuni Buddha' },
  'e3297-saladin': { nameKo: '살라딘(살라흐 앗 딘) [Saladin / Salah ad-Din]', nameKoShort: '살라딘', nameFr: 'Saladin', nameEn: 'Saladin (Sultan of Egypt and Syria)' },
  'e3298-salamandres': { nameKo: '살라만더(불의 정령) [Salamandres / Salamanders]', nameKoShort: '살라만더(불의 정령)', nameFr: 'Salamandres', nameEn: 'Salamanders (Fire Elementals)' },
  'e3299-salguesjeanbaptiste': { nameKo: '장바티스트 살그 [Salgues (Jean-Baptiste)]', nameKoShort: '장바티스트 살그', nameFr: 'Salgues (Jean-Baptiste)', nameEn: 'Jean-Baptiste Salgues' },
  'e3300-saliere': { nameKo: '소금통에 얽힌 민간 미신 [Salière / Saltcellar Superstitions]', nameKoShort: '소금통에 얽힌 미신', nameFr: 'Salière', nameEn: 'Saltcellar Superstitions' },
  'e3301-salisateurs': { nameKo: '살리사토르(신체 경련 복술사) [Salisateurs]', nameKoShort: '살리사토르', nameFr: 'Salisateurs', nameEn: 'Salisatores (Twitch Diviners)' },
  'e3302-salive': { nameKo: '침(타액)에 얽힌 민간 주술과 미신 [Salive / Superstition of Saliva]', nameKoShort: '침에 얽힌 주술과 미신', nameFr: 'Salive', nameEn: 'Superstitions of Saliva' },
  'e3303-salomon': { nameKo: '솔로몬 왕 [Salomon / King Solomon]', nameKoShort: '솔로몬 왕', nameFr: 'Salomon', nameEn: 'King Solomon (Master of Spirits)' },
  'e3304-saludadores': { nameKo: '살루다도르(스페인의 민간 치유사) [Saludadores]', nameKoShort: '살루다도르', nameFr: 'Saludadores', nameEn: 'Saludadores (Spanish Healers)' },
  'e3305-salvationderome': { nameKo: '로마의 구원(마법 경보 조각상) [Salvation de Rome]', nameKoShort: '로마의 구원(경보 조각상)', nameFr: 'Salvation de Rome', nameEn: 'Salvation of Rome (Magical Statues)' },
  'e3306-salverteeusebe': { nameKo: '외제브 살베르트 [Salverte (Eusèbe)]', nameKoShort: '외제브 살베르트', nameFr: 'Salverte (Eusèbe)', nameEn: 'Eusèbe Salverte' },
  'e3307-samael': { nameKo: '사마엘 [Samaël / Samael]', nameKoShort: '사마엘', nameFr: 'Samaël', nameEn: 'Samael (Angel of Death)' },
  'e3308-samaritainela': { nameKo: '라 사마리텐(퐁네프의 전설적 펌프 분수) [Samaritaine (la)]', nameKoShort: '라 사마리텐(퐁네프 분수)', nameFr: 'Samaritaine (la)', nameEn: 'La Samaritaine (Pont-Neuf Fountain)' },
  'e3309-sambethe': { nameKo: '삼베테(히브리 시빌라) [Sambethe / Hebrew Sibyl]', nameKoShort: '삼베테(히브리 시빌라)', nameFr: 'Sambethe', nameEn: 'Sambethe (The Persian or Hebrew Sibyl)' },
  'e3310-sampsonagnes': { nameKo: '애그니스 샘프슨 [Sampson (Agnès)]', nameKoShort: '애그니스 샘프슨', nameFr: 'Sampson (Agnès)', nameEn: 'Agnes Sampson (North Berwick Witch)' },
  'e3311-samuel': { nameKo: '선지자 사무엘의 환영 [Samuel / Ghost of Prophet Samuel]', nameKoShort: '선지자 사무엘의 환영', nameFr: 'Samuel', nameEn: 'Apparition of Prophet Samuel' },
  'e3312-sanaves': { nameKo: '사나베스(마다가스카르 향목 부적) [Sanaves]', nameKoShort: '사나베스(향목 부적)', nameFr: 'Sanaves', nameEn: 'Sanaves (Amulet of Madagascar)' },
  'e3313-sanche': { nameKo: '산초 [Sanche / Sancho the Faithful Servant]', nameKoShort: '산초', nameFr: 'Sanche', nameEn: 'Sancho (Ghostly Vision)' },
  'e3314-sandalphon': { nameKo: '대천사 산달폰 [Sandalphon / Archangel Sandalphon]', nameKoShort: '대천사 산달폰', nameFr: 'Sandalphon', nameEn: 'Archangel Sandalphon' },
  'e3315-sang': { nameKo: '피에 얽힌 주술과 미신 [Sang / Blood Superstition]', nameKoShort: '피에 얽힌 주술과 미신', nameFr: 'Sang', nameEn: 'Superstition of Blood' },
  'e3316-sangerrenee': { nameKo: '르네 상제르 [Sanger (Rénée)]', nameKoShort: '르네 상제르', nameFr: 'Sanger (Rénée)', nameEn: 'Renée Sanger (Munich Witch Trial)' },
  'e3317-santabarenus': { nameKo: '테오도로스 산타바레노스 [Santabarenus / Theodore Santabarenos]', nameKoShort: '산타바레노스', nameFr: 'Santabarenus', nameEn: 'Theodore Santabarenos (Byzantine Sorcerer)' },
  'e3318-saphis': { nameKo: '사피(코란 호신 부적) [Saphis / Safi Amulets]', nameKoShort: '사피(코란 부적)', nameFr: 'Saphis', nameEn: 'Saphis (Quranic Paper Charms)' },
  'e3319-sapondomad': { nameKo: '스펜타 아르마이티(스폰도마드) [Sapondomad / Spenta Armaiti]', nameKoShort: '스폰도마드', nameFr: 'Sapondomad', nameEn: 'Spenta Armaiti (Zoroastrian Earth Spirit)' },
  'e3320-sarcueil': { nameKo: '사르쾨유 [Sarcueil]', nameKoShort: '사르쾨유', nameFr: 'Sarcueil', nameEn: 'Sarcueil (Demon of Sabbath Litanies)' },
  'e3321-saremargueritede': { nameKo: '마르그리트 드 사르 [Sare (Marguerite de)]', nameKoShort: '마르그리트 드 사르', nameFr: 'Sare (Marguerite de)', nameEn: 'Marguerite de Sare (Basque Witch Trial)' },
  'e3322-sarmeniuslapis': { nameKo: '사르메니우스 라피스 [Sarmenius-Lapis]', nameKoShort: '사르메니우스 라피스', nameFr: 'Sarmenius-Lapis', nameEn: 'Sarmenius-Lapis (Anti-Abortion Stone)' },
  'e3323-sas': { nameKo: '체 점술(사스) [Sas / Divination by Sieve]', nameKoShort: '체 점술(사스)', nameFr: 'Sas', nameEn: 'Divination by Sieve (Coscinomancy)' },
  'e3324-satan': { nameKo: '사탄 [Satan / The Devil]', nameKoShort: '사탄', nameFr: 'Satan', nameEn: 'Satan (Prince of the Damned)' },
  'e3325-satanaki': { nameKo: '사타나키 [Satanaki]', nameKoShort: '사타나키', nameFr: 'Satanaki', nameEn: 'Satanaki (Manichaean Creator Demon)' },
  'e3326-satamins': { nameKo: '사타민스 [Satamins]', nameKoShort: '사타민스', nameFr: 'Satamins', nameEn: 'Satamins (Adversary Demons of Cabala)' },
  'e3327-satanalogie': { nameKo: '사탄학 [Satanalogie / Satanology]', nameKoShort: '사탄학', nameFr: 'Satanalogie', nameEn: 'Satanology (Study of Satan)' },
  'e3328-satyres': { nameKo: '사티로스 [Satyres / Satyrs]', nameKoShort: '사티로스', nameFr: 'Satyres', nameEn: 'Satyrs (Woodland Spirits)' },
  'e3329-saubadinedesubiette': { nameKo: '소바딘 드 쉬비에트 [Saubadine de Subiette]', nameKoShort: '소바딘 드 쉬비에트', nameFr: 'Saubadine de Subiette', nameEn: 'Saubadine de Subiette (Basque Witch)' },
  'e3330-sausine': { nameKo: '소진 [Sausine]', nameKoShort: '소진', nameFr: 'Sausine', nameEn: 'Sausine (Priestess of the Sabbath)' },
  'e3331-sautebuisson': { nameKo: '소트뷔송(덤불 도약자) [Saute-Buisson]', nameKoShort: '소트뷔송(덤불 도약자)', nameFr: 'Saute-Buisson', nameEn: 'Saute-Buisson (Familiar Spirit)' },
  'e3332-sauterelles': { nameKo: '메뚜기 떼의 재앙과 미신 [Sauterelles / Plague of Locusts]', nameKoShort: '메뚜기 떼의 재앙', nameFr: 'Sauterelles', nameEn: 'Plague of Locusts Superstition' },
  'e3333-sauveursditalie': { nameKo: '이탈리아의 구원자 사칭자 [Sauveurs d’Italie / Saviors of Italy]', nameKoShort: '이탈리아의 구원자 사칭자', nameFr: 'Sauveurs d’Italie', nameEn: 'Saviors of Italy (Snake Handlers)' },
  'e3334-savon': { nameKo: '비누에 얽힌 에게해 미신 [Savon / Soap Superstitions]', nameKoShort: '비누에 얽힌 에게해 미신', nameFr: 'Savon', nameEn: 'Soap Superstitions in the Levant' },
  'e3335-savonarolejerome': { nameKo: '지롤라모 사보나롤라 [Savonarole (Jérôme) / Girolamo Savonarola]', nameKoShort: '사보나롤라', nameFr: 'Savonarole (Jérôme)', nameEn: 'Girolamo Savonarola' },
  'e3336-sayrims': { nameKo: '세이림(털북숭이 들염소 악령) [Sayrims / Seirim]', nameKoShort: '세이림(털북숭이 악령)', nameFr: 'Sayrims', nameEn: 'Seirim (Hairy Goat Demons)' },
  'e3337-scaf': { nameKo: '스카프 [Scaf / Schaf]', nameKoShort: '스카프', nameFr: 'Scaf', nameEn: 'Scaf (Swiss Shapeshifter)' },
  'e3338-scandinaves': { nameKo: '스칸디나비아 신화와 오딘 [Scandinaves / Norse Mythology]', nameKoShort: '스칸디나비아 신화', nameFr: 'Scandinaves', nameEn: 'Norse Mythology (Odin and Edda)' },
  'e3339-schadaschivaoun': { nameKo: '샤다 시바운 [Schada-Schivaoun]', nameKoShort: '샤다 시바운', nameFr: 'Schada-Schivaoun', nameEn: 'Schada-Schivaoun (Hindu Cosmic Spirit)' },
  'e3340-schadukian': { nameKo: '샤두키안(요정들의 낙원) [Schadukian / Shadukiam]', nameKoShort: '샤두키안(요정들의 낙원)', nameFr: 'Schadukian', nameEn: 'Shadukiam (Realm of the Peris)' },
  'e3341-schamanes': { nameKo: '샤먼(시베리아의 무당) [Schamanes / Shamans]', nameKoShort: '샤먼(시베리아 무당)', nameFr: 'Schamanes', nameEn: 'Siberian Shamans' },
  'e3342-scheda': { nameKo: '셰다(유대의 파우스트) [Schéda]', nameKoShort: '셰다', nameFr: 'Schéda', nameEn: 'Scheda (Jewish Faust)' },
  'e3343-schedims': { nameKo: '셰딤(유대 전승의 정령·악령) [Schédims / Shedim]', nameKoShort: '셰딤(유대 정령)', nameFr: 'Schédims', nameEn: 'Shedim (Jewish Spirits)' },
  'e3344-scheithan': { nameKo: '샤이탄 [Scheithan / Shaitan]', nameKoShort: '샤이탄', nameFr: 'Scheithan', nameEn: 'Shaitan (Islamic Devil)' },
  'e3345-schenckjeangeorges': { nameKo: '요한 게오르크 솅크 [Schenck (Jean-Georges)]', nameKoShort: '솅크', nameFr: 'Schenck (Jean-Georges)', nameEn: 'Johann Georg Schenck' },
  'e3346-scheol': { nameKo: '스올(구약성경의 지하 음부) [Schéol / Sheol]', nameKoShort: '스올(지하 음부)', nameFr: 'Schéol', nameEn: 'Sheol (Hebrew Underworld)' },
  'e3347-schertzferdinand': { nameKo: '페르디난트 셰르츠 [Schertz (Ferdinand)]', nameKoShort: '셰르츠', nameFr: 'Schertz (Ferdinand)', nameEn: 'Ferdinand Schertz' },
  'e3348-schmidthans': { nameKo: '한스 슈미트 [Schmidt (Hans)]', nameKoShort: '한스 슈미트', nameFr: 'Schmidt (Hans)', nameEn: 'Hans Schmidt (Blacksmith Witch Trial)' },
  'e3349-schoumnus': { nameKo: '슘누스 [Schoumnus]', nameKoShort: '슘누스', nameFr: 'Schoumnus', nameEn: 'Schoumnus (Kalmyk Demon King)' },
  'e3350-schrammmichel': { nameKo: '미하엘 슈람 [Schramm (Michel)]', nameKoShort: '미하엘 슈람', nameFr: 'Schramm (Michel)', nameEn: 'Michel Schramm (Würzburg Student Trial)' },
  'e3351-schroettelis': { nameKo: '슈뢰텔리스(스위스 알프스 요정) [Schroettelis]', nameKoShort: '슈뢰텔리스', nameFr: 'Schroettelis', nameEn: 'Schroettelis (Swiss Alpine Goblin)' },
  'e3352-schroterulrich': { nameKo: '울리히 슈뢰터 [Schroter (Ulrich)]', nameKoShort: '울리히 슈뢰터', nameFr: 'Schroter (Ulrich)', nameEn: 'Ulrich Schroter (Lucerne Gambler)' },
  'e3353-sciamancie': { nameKo: '그림자점(스키아망시) [Sciamancie / Sciomancy]', nameKoShort: '그림자점(스키아망시)', nameFr: 'Sciamancie', nameEn: 'Sciomancy (Divination by Shadows)' },
  'e3354-sciences': { nameKo: '에녹의 비전 과학 [Sciences / Hermetic Sciences of Enoch]', nameKoShort: '에녹의 비전 과학', nameFr: 'Sciences', nameEn: 'Hermetic Sciences of Idris (Enoch)' },
  'e3355-sciencesoccultes': { nameKo: '오컬트 과학과 비전 마술 [Sciences occultes / The Occult Sciences]', nameKoShort: '오컬트 과학과 비전 마술', nameFr: 'Sciences occultes', nameEn: 'The Occult Sciences' },
  'e3356-scimasar': { nameKo: '스키마사르 [Scimasar / Scimasar Nova]', nameKoShort: '스키마사르', nameFr: 'Scimasar', nameEn: 'Scimasar (Divination of Michael Scot)' },
  'e3357-sciopodes': { nameKo: '스키아포데스(그늘발 종족) [Sciopodes / Shadow-Footed Race]', nameKoShort: '스키아포데스(그늘발 종족)', nameFr: 'Sciopodes', nameEn: 'Sciopodes (Monopod Shadow-Feet)' },
  'e3358-scopelisme': { nameKo: '스코펠리스무스(저주의 돌 투척) [Scopelisme / Scopelism]', nameKoShort: '스코펠리스무스', nameFr: 'Scopelisme', nameEn: 'Scopelism (Curse by Stones)' },
  'e3359-scorpion': { nameKo: '전갈에 얽힌 부적과 미신 [Scorpion / Superstitions of Scorpions]', nameKoShort: '전갈에 얽힌 부적과 미신', nameFr: 'Scorpion', nameEn: 'Superstitions of Scorpions' },
  'e3360-scot': { nameKo: '스콧 [Scot]', nameKoShort: '스콧', nameFr: 'Scot', nameEn: 'Scot (Magician)' },
  'e3361-scotopetes': { nameKo: '스코토페테스(어둠을 좇는 자들) [Scotopètes]', nameKoShort: '스코토페테스', nameFr: 'Scotopètes', nameEn: 'Scotopetes (Dark Seekers)' },
  'e3362-scottmichel': { nameKo: '마이클 스콧 [Scott (Michel) / Michael Scot]', nameKoShort: '마이클 스콧', nameFr: 'Scott (Michel)', nameEn: 'Michael Scot (Scottish Wizard)' },
  'e3363-scottreginald': { nameKo: '레지널드 스콧 [Scott (Réginald) / Reginald Scot]', nameKoShort: '레지널드 스콧', nameFr: 'Scott (Réginald)', nameEn: 'Reginald Scot' },
  'e3364-scottwalter': { nameKo: '월터 스콧 경 [Scott (Walter) / Sir Walter Scott]', nameKoShort: '월터 스콧 경', nameFr: 'Scott (Walter)', nameEn: 'Sir Walter Scott' },
  'e3365-scouminkes': { nameKo: '스쿠민케(독일 귀족 가문의 수호 가택령) [Scouminkes]', nameKoShort: '스쿠민케', nameFr: 'Scouminkes', nameEn: 'Scouminkes (German Noble House Spirits)' },
  'scox': { nameKo: '스콕스 또는 샥스 [Scox, Chax, Shax]', nameKoShort: '스콕스 또는 샥스', nameFr: 'Scox', nameEn: 'Scox (Shax, Chax)' },
  'e3367-scylla': { nameKo: '스킬라 [Scylla]', nameKoShort: '스킬라', nameFr: 'Scylla', nameEn: 'Scylla (Sea Monster)' },
  'e3368-sebhil': { nameKo: '세빌 또는 세바엘 [Sébhil / Sébhaël]', nameKoShort: '세빌(세바엘)', nameFr: 'Sébhil', nameEn: 'Sebhil (Recording Angel of Deeds)' },
  'e3369-secretainfrancoise': { nameKo: '프랑수아즈 세크레탱 [Secrétain (Françoise)]', nameKoShort: '프랑수아즈 세크레탱', nameFr: 'Secrétain (Françoise)', nameEn: 'Françoise Secrétain (Boguet Witch Trial)' },
  'e3370-secretsmerveilleux': { nameKo: '놀라운 비결 [Secrets merveilleux / Marvellous Secrets]', nameKoShort: '놀라운 비결', nameFr: 'Secrets merveilleux', nameEn: 'Marvellous Secrets (Folk Magical Recipes)' },
  'e3371-segjin': { nameKo: '시진(이슬람 최하층 제7지옥) [Segjin / Sijjin]', nameKoShort: '시진(제7지옥)', nameFr: 'Segjin', nameEn: 'Sijjin (The Seventh Abyss of Hell)' },
  'e3372-seidur': { nameKo: '세이드(노르드 흑마술) [Seidur / Seidr]', nameKoShort: '세이드(노르드 흑마술)', nameFr: 'Seidur', nameEn: 'Seidr (Norse Sorcery)' },
  'e3373-seings': { nameKo: '흑자점·신체 점 복술 [Seings / Divination by Moles]', nameKoShort: '흑자점·신체 점 복술', nameFr: 'Seings', nameEn: 'Divination by Moles and Birthmarks' },
  'e3374-sel': { nameKo: '소금에 얽힌 구마와 미신 [Sel / Superstitions of Salt]', nameKoShort: '소금에 얽힌 구마와 미신', nameFr: 'Sel', nameEn: 'Superstitions of Salt against Demons' },
  'e3375-separ': { nameKo: '세파르 [Sépar / Vepar]', nameKoShort: '세파르', nameFr: 'Sépar', nameEn: 'Separ (Demon Vepar)' },
  'e3376-sephiriothsles': { nameKo: '세피로트(카발라의 10대 영적 구체) [Séphirioths (les) / Sephiroth]', nameKoShort: '세피로트(카발라 10대 구체)', nameFr: 'Séphirioths (les)', nameEn: 'The Ten Sephiroth of Cabala' },
  'e3377-sepulture': { nameKo: '매장과 사체 훼손의 괴담 [Sépulture / Burial Superstitions]', nameKoShort: '매장과 사체 훼손의 괴담', nameFr: 'Sépulture', nameEn: 'Burial Superstitions and Ghosts' },
  'e3378-sermons': { nameKo: '사바트의 모독적 설교 [Sermons du Sabbat / Sabbath Sermons]', nameKoShort: '사바트의 모독적 설교', nameFr: 'Sermons', nameEn: 'Sabbath Sermons of Asmodeus' },
  'e3379-serosch': { nameKo: '스라오샤(세로슈) [Serosch / Sraosha]', nameKoShort: '세로슈', nameFr: 'Serosch', nameEn: 'Sraosha (Guardian Spirit of the Earth)' },
  'e3380-serpent': { nameKo: '뱀의 상징과 유혹 [Serpent / The Serpent]', nameKoShort: '뱀의 상징과 유혹', nameFr: 'Serpent', nameEn: 'The Serpent (Symbol of the Devil)' },
  'e3381-serpentdemerlegrand': { nameKo: '거대 바다뱀 [Serpent de mer (Le grand) / Great Sea Serpent]', nameKoShort: '거대 바다뱀', nameFr: 'Serpent de mer (Le grand)', nameEn: 'The Great Sea Serpent' },
  'e3382-serug': { nameKo: '세루그 [Sérug]', nameKoShort: '세루그', nameFr: 'Sérug', nameEn: 'Serug (Evil Spirit)' },
  'e3383-servants': { nameKo: '사역령·알프스 집요정 [Servants / House Spirits of the Alps]', nameKoShort: '사역령·알프스 집요정', nameFr: 'Servants', nameEn: 'Servant Spirits of the Alps' },
  'e3384-serviustullius': { nameKo: '세르비우스 툴리우스 왕 [Servius-Tullius]', nameKoShort: '세르비우스 툴리우스 왕', nameFr: 'Servius-Tullius', nameEn: 'Servius Tullius (King of Rome)' },
  'e3385-sethiens': { nameKo: '세트파(영지주의 분파) [Sethiens / Sethians]', nameKoShort: '세트파', nameFr: 'Sethiens', nameEn: 'Sethians (Gnostic Sect)' },
  'e3386-sethus': { nameKo: '세투스 [Séthus]', nameKoShort: '세투스', nameFr: 'Séthus', nameEn: 'Sethus (Byzantine Magician)' },
  'e3387-severeseptime': { nameKo: '셉티미우스 세베루스 황제 [Sévère (Septime) / Septimius Severus]', nameKoShort: '셉티미우스 세베루스 황제', nameFr: 'Sévère (Septime)', nameEn: 'Emperor Septimius Severus' },
  'e3388-sexe': { nameKo: '태아 성별 예측 미신 [Sexe / Prediction of Child’s Sex]', nameKoShort: '태아 성별 예측 미신', nameFr: 'Sexe', nameEn: 'Superstitions on Unborn Child’s Sex' },
  'e3389-shamavedam': { nameKo: '사마베다 [Shamavedam / Samaveda]', nameKoShort: '사마베다', nameFr: 'Shamavedam', nameEn: 'Samaveda (Hindu Sacred Veda)' },
  'e3390-shelo': { nameKo: '실로 [Shelo / Shiloh]', nameKoShort: '실로', nameFr: 'Shelo', nameEn: 'Shiloh (Messianic Child)' },
  'e3391-shoupeltins': { nameKo: '슈펠틴(셰틀랜드 인어 전설) [Shoupeltins / Shoopiltees]', nameKoShort: '슈펠틴(셰틀랜드 인어)', nameFr: 'Shoupeltins', nameEn: 'Shoopiltees (Shetland Water Spirits)' },
  'e3392-sibylles': { nameKo: '시빌라(고대 예언 무녀) [Sibylles / Sibyls]', nameKoShort: '시빌라(고대 무녀)', nameFr: 'Sibylles', nameEn: 'The Classical Sibyls' },
  'e3393-sibyllesmodernes': { nameKo: '근대 시빌라(여성 투시자들) [Sibylles modernes / Modern Sibyls]', nameKoShort: '근대 시빌라', nameFr: 'Sibylles modernes', nameEn: 'Modern Sibyls and Clairvoyants' },
  'e3394-sicidites': { nameKo: '시키디테스 [Sicidites]', nameKoShort: '시키디테스', nameFr: 'Sicidites', nameEn: 'Sicidites (Byzantine Illusionist)' },
  'e3395-sideromancie': { nameKo: '철점(시데로망시) [Sidéromancie / Sideromancy]', nameKoShort: '철점(시데로망시)', nameFr: 'Sidéromancie', nameEn: 'Sideromancy (Divination by Hot Iron)' },
  'e3396-sidragasum': { nameKo: '시드라가숨 [Sidragasum]', nameKoShort: '시드라가숨', nameFr: 'Sidragasum', nameEn: 'Sidragasum (Demon of Dancing Women)' },
  'e3397-sifflerlevent': { nameKo: '바람을 부르는 휘파람 [Siffler le vent / Whistling for Wind]', nameKoShort: '바람을 부르는 휘파람', nameFr: 'Siffler le vent', nameEn: 'Whistling for the Wind Superstition' },
  'e3398-siffletmagique': { nameKo: '마법의 피리와 하멜른의 피리 부는 사나이 [Sifflet magique / The Pied Piper’s Magic Whistle]', nameKoShort: '마법의 피리와 하멜른 전설', nameFr: 'Sifflet magique', nameEn: 'Magic Pipe of Hamelin' },
  'e3399-sigeani': { nameKo: '시게아니 [Sigéani]', nameKoShort: '시게아니', nameFr: 'Sigéani', nameEn: 'Sigeani (Thunder Spirit of Ava)' },
  'e3400-signedecroix': { nameKo: '십자가 성호의 구마 효능 [Signe de croix / Power of the Sign of the Cross]', nameKoShort: '십자가 성호의 구마 효능', nameFr: 'Signe de croix', nameEn: 'Power of the Sign of the Cross' },
  'e3401-silenes': { nameKo: '실레노스 [Silènes / Silenus]', nameKoShort: '실레노스', nameFr: 'Silènes', nameEn: 'Silenus (Elder Satyrs)' },
  'e3402-simagorad': { nameKo: '시마고라드(샤를 6세 치세의 마도서) [Simagorad]', nameKoShort: '시마고라드(마도서)', nameFr: 'Simagorad', nameEn: 'Simagorad (Grimoire of Charles VI)' },
  'e3403-simle': { nameKo: '김레(노르드 신세계의 황금 궁전) [Simle / Gimlé]', nameKoShort: '김레(황금 궁전)', nameFr: 'Simle', nameEn: 'Gimlé (Norse Golden Paradise)' },
  'e3404-simonlemagicien': { nameKo: '마술사 시몬(시몬 마구스) [Simon le magicien / Simon Magus]', nameKoShort: '마술사 시몬', nameFr: 'Simon le magicien', nameEn: 'Simon Magus (The Sorcerer)' },
  'e3405-simondephares': { nameKo: '시몽 드 파레스 [Simon de Pharès]', nameKoShort: '시몽 드 파레스', nameFr: 'Simon de Pharès', nameEn: 'Simon de Pharès (Astrologer)' },
  'e3406-simonide': { nameKo: '시모니데스 [Simonide / Simonides of Ceos]', nameKoShort: '시모니데스', nameFr: 'Simonide', nameEn: 'Simonides (Lyric Poet)' },
  'e3407-simorgue': { nameKo: '시무르그 [Simorgue / Simurgh]', nameKoShort: '시무르그', nameFr: 'Simorgue', nameEn: 'Simurgh (Mythical Persian Bird)' },
  'e3408-singes': { nameKo: '원숭이의 상징과 악마의 흉내 [Singes / Monkeys in Demonology]', nameKoShort: '원숭이의 상징과 악마의 흉내', nameFr: 'Singes', nameEn: 'Monkeys and the Devil as Ape of God' },
  'e3409-sirath': { nameKo: '시라트 다리 [Sirath / As-Sirat]', nameKoShort: '시라트 다리', nameFr: 'Sirath', nameEn: 'As-Sirat (Bridge of the Afterlife)' },
  'e3410-sirchade': { nameKo: '시르카드 [Sirchade]', nameKoShort: '시르카드', nameFr: 'Sirchade', nameEn: 'Sirchade (Demon of Animals)' },
  'e3411-sistre': { nameKo: '시스트룸(망령을 쫓는 방울풀) [Sistre / Sistrum Plant]', nameKoShort: '시스트룸(망령을 쫓는 풀)', nameFr: 'Sistre', nameEn: 'Sistrum Herb (Ghost Repelling Plant)' },
  'e3412-sittim': { nameKo: '시팀 [Sittim]', nameKoShort: '시팀', nameFr: 'Sittim', nameEn: 'Sittim (Indian Forest Demon)' },
  'e3413-skalda': { nameKo: '스칼드(노르드 운명의 여신) [Skalda / Skuld]', nameKoShort: '스칼드', nameFr: 'Skalda', nameEn: 'Skuld (Norn of the Future)' },
  'e3414-skinkraftigans': { nameKo: '스킨크라프티간(앵글로색슨 주술사) [Skinkraftigans]', nameKoShort: '스킨크라프티간', nameFr: 'Skinkraftigans', nameEn: 'Skinkraftigans (Anglo-Saxon Sorcerers)' },
  'e3415-smael': { nameKo: '스마엘 [Smaël]', nameKoShort: '스마엘', nameFr: 'Smaël', nameEn: 'Smael (Samael)' },
  'e3416-smyrne': { nameKo: '스미르나와 아마존 전설 [Smyrne / Smyrna and the Amazons]', nameKoShort: '스미르나와 아마존 전설', nameFr: 'Smyrne', nameEn: 'Smyrna and the Amazon Legends' },
  'e3417-socrate': { nameKo: '소크라테스와 다이모니온 [Socrate / Socrates and his Daemon]', nameKoShort: '소크라테스와 다이모니온', nameFr: 'Socrate', nameEn: 'Socrates and his Daemon' },
  'e3418-soleil': { nameKo: '태양 숭배와 태양의 춤 [Soleil / Sun Worship]', nameKoShort: '태양 숭배와 태양의 춤', nameFr: 'Soleil', nameEn: 'Sun Worship and the Sun Dance' },
  'e3419-soleves': { nameKo: '솔레브(알프스 산악 정령) [Solèves]', nameKoShort: '솔레브', nameFr: 'Solèves', nameEn: 'Solèves (Alpine Mountain Spirits)' },
  'e3420-soliman': { nameKo: '술레이만(솔로몬의 이슬람 전승) [Soliman / Suleiman]', nameKoShort: '술레이만(솔로몬 전승)', nameFr: 'Soliman', nameEn: 'Suleiman in Islamic Tradition' },
  'e3421-sommeil': { nameKo: '기이한 장기 수면과 혼수 미신 [Sommeil / Prodigious Sleep]', nameKoShort: '기이한 장기 수면', nameFr: 'Sommeil', nameEn: 'Prodigious Sleep and Lethargy' },
  'e3422-somnambules': { nameKo: '몽유병자의 초자연적 행동 [Somnambules / Sleepwalkers]', nameKoShort: '몽유병자의 행동', nameFr: 'Somnambules', nameEn: 'Sleepwalkers and Somnambulism' },
  'e3423-somnambulismemagnetique': { nameKo: '동물자기 몽유 투시 [Somnambulisme magnétique / Magnetic Somnambulism]', nameKoShort: '동물자기 몽유 투시', nameFr: 'Somnambulisme magnétique', nameEn: 'Magnetic Somnambulism (Mesmerism)' },
  'e3424-soneillon': { nameKo: '소넬롱 [Soneillon]', nameKoShort: '소넬롱', nameFr: 'Soneillon', nameEn: 'Soneillon (Demon of Louviers)' },
  'e3425-songes': { nameKo: '꿈의 생리 작용과 전조 [Songes / Dreams and Premonitions]', nameKoShort: '꿈의 생리 작용과 전조', nameFr: 'Songes', nameEn: 'Dreams, Physiology and Premonitions' },
  'e3426-songesexplicationdes': { nameKo: '꿈의 해석·해몽 도판집 [Songes (explication des) / Interpretation of Dreams]', nameKoShort: '꿈의 해석·해몽 도판집', nameFr: 'Songes (explication des)', nameEn: 'The Interpretation of Dreams (Illustrated Key)' },
  'e3427-sonhardibel': { nameKo: '손하르디벨 신부 [Sonhardibel]', nameKoShort: '손하르디벨 신부', nameFr: 'Sonhardibel', nameEn: 'Sonhardibel (Apostate Basque Priest)' },
  'e3428-sorciers': { nameKo: '마법사와 마녀 [Sorciers / Sorcerers and Witches]', nameKoShort: '마법사와 마녀', nameFr: 'Sorciers', nameEn: 'Sorcerers and Witches (The Great History)' },
  'e3429-sort': { nameKo: '제비뽑기와 저주 [Sort / Casting Lots and Spells]', nameKoShort: '제비뽑기와 저주', nameFr: 'Sort', nameEn: 'Casting Lots and Magical Spells' },
  'e3430-sortileges': { nameKo: '주술과 요술 [Sortilèges / Spells]', nameKoShort: '주술과 요술', nameFr: 'Sortilèges', nameEn: 'Magical Spells and Hexes' },
  'e3431-sotray': { nameKo: '소트레(말 갈기를 땋는 집요정) [Sotray]', nameKoShort: '소트레', nameFr: 'Sotray', nameEn: 'Sotray (French Stable Goblin)' },
  'e3432-souad': { nameKo: '수아드(원죄의 검은 핏방울) [Souad]', nameKoShort: '수아드', nameFr: 'Souad', nameEn: 'Souad (Black Seed of Sin)' },
  'e3433-sougaitoyon': { nameKo: '수가이 토욘 [Sougai-Toyon]', nameKoShort: '수가이 토욘', nameFr: 'Sougai-Toyon', nameEn: 'Sougai-Toyon (Yakut Thunder Demon)' },
  'e3434-souliefrederic': { nameKo: '프레데리크 술리에 [Soulié (Frédéric)]', nameKoShort: '프레데리크 술리에', nameFr: 'Soulié (Frédéric)', nameEn: 'Frédéric Soulié (French Novelist)' },
  'e3435-souris': { nameKo: '생쥐의 흉조와 퇴치 비방 [Souris / Mice Superstition]', nameKoShort: '생쥐의 흉조와 퇴치 비방', nameFr: 'Souris', nameEn: 'Superstition of Mice' },
  'e3436-souterrainsdemons': { nameKo: '지하의 악마들(코발로스·노움) [Souterrains (démons) / Subterranean Demons]', nameKoShort: '지하의 악마들', nameFr: 'Souterrains (démons)', nameEn: 'Subterranean Demons (Mine Spirits)' },
  'e3437-southcottjeanne': { nameKo: '조애나 사우스콧 [Southcott (Jeanne) / Joanna Southcott]', nameKoShort: '조애나 사우스콧', nameFr: 'Southcott (Jeanne)', nameEn: 'Joanna Southcott (Religious Prophetess)' },
  'e3438-souvigny': { nameKo: '수비니 성당과 요정 전설 [Souvigny / The Fairies of Souvigny]', nameKoShort: '수비니 성당과 요정 전설', nameFr: 'Souvigny', nameEn: 'The Fairies of Souvigny Church' },
  'e3439-sovasmunusinsempoisonneurset': { nameKo: '소바스 무누신(서아프리카 흡혈귀) [Sovas-Munusins]', nameKoShort: '소바스 무누신', nameFr: 'Sovas-Munusins (empoisonneurs et suceurs de sang)', nameEn: 'Sovas-Munusins (African Vampires)' },
  'e3440-spectres': { nameKo: '유령과 망령의 출현 [Spectres / Spectres and Apparitions]', nameKoShort: '유령과 망령의 출현', nameFr: 'Spectres', nameEn: 'Spectres and Supernatural Apparitions' },
  'e3441-spectriana': { nameKo: '스펙트리아나(유령 기담집) [Spectriana]', nameKoShort: '스펙트리아나', nameFr: 'Spectriana', nameEn: 'Spectriana (Book of Spectres)' },
  'e3442-speculaires': { nameKo: '스페쿨라리(거울 점술사) [Spéculaires / Specularii]', nameKoShort: '스페쿨라리(거울 점술사)', nameFr: 'Spéculaires', nameEn: 'Specularii (Mirror Diviners)' },
  'e3443-spee': { nameKo: '프리드리히 슈페 신부 [Spée (Friedrich) / Friedrich Spee]', nameKoShort: '프리드리히 슈페 신부', nameFr: 'Spée', nameEn: 'Father Friedrich Spee von Langenfeld' },
  'e3444-sper': { nameKo: '스페르(리에주 방언의 유령) [Sper]', nameKoShort: '스페르', nameFr: 'Sper', nameEn: 'Sper (Walloon Spirit)' },
  'e3445-sphinx': { nameKo: '스핑크스 [Sphinx]', nameKoShort: '스핑크스', nameFr: 'Sphinx', nameEn: 'The Sphinx (Monster of Thebes)' },
  'e3446-spinaalphonse': { nameKo: '알폰소 데 스피나 [Spina (Alphonse) / Alfonso de Spina]', nameKoShort: '알폰소 데 스피나', nameFr: 'Spina (Alphonse)', nameEn: 'Alfonso de Spina (Franciscan Theologian)' },
  'e3447-spinello': { nameKo: '스피넬로 아레티노 [Spinello / Spinello Aretino]', nameKoShort: '스피넬로 아레티노', nameFr: 'Spinello', nameEn: 'Spinello Aretino (Painter of Lucifer)' },
  'e3448-spirinxjean': { nameKo: '장 스피린크스 [Spirinx (Jean)]', nameKoShort: '장 스피린크스', nameFr: 'Spirinx (Jean)', nameEn: 'Jean Spirinx (Belgian Astrologer)' },
  'e3449-spiritisme': { nameKo: '심령술(스피리티즘) [Spiritisme / Spiritism]', nameKoShort: '심령술(스피리티즘)', nameFr: 'Spiritisme', nameEn: 'Spiritism (The Modern Movement)' },
  'e3450-spodomantie': { nameKo: '재점(스포도망시) [Spodomantie / Spodomancy]', nameKoShort: '재점(스포도망시)', nameFr: 'Spodomantie', nameEn: 'Spodomancy (Divination by Ashes)' },
  'e3451-sprangerbarthelemi': { nameKo: '바르톨로메우스 슈프랑거 [Spranger (Barthélemi)]', nameKoShort: '슈프랑거', nameFr: 'Spranger (Barthélemi)', nameEn: 'Bartholomeus Spranger (Mannerist Painter)' },
  'e3452-sprengerjacques': { nameKo: '야콥 슈프렝거 [Sprenger (Jacques)]', nameKoShort: '야콥 슈프렝거', nameFr: 'Sprenger (Jacques)', nameEn: 'Jacob Sprenger (Inquisitor)' },
  'e3453-spunkie': { nameKo: '스펑키(스코틀랜드 도깨비불) [Spunkie]', nameKoShort: '스펑키', nameFr: 'Spunkie', nameEn: 'Spunkie (Scottish Will-o’-the-Wisp)' },
  'e3454-spurina': { nameKo: '베스트리티우스 스푸린나 [Spurina / Vestricius Spurinna]', nameKoShort: '스푸린나', nameFr: 'Spurina', nameEn: 'Vestricius Spurinna (Etruscan Haruspex)' },
  'e3455-squelette': { nameKo: '해골의 환영 [Squelette / The Skeleton Spectre]', nameKoShort: '해골의 환영', nameFr: 'Squelette', nameEn: 'The Dancing Skeleton Spectre of St. Petersburg' },
  'e3456-stadius': { nameKo: '스타디우스(손금술사) [Stadius]', nameKoShort: '스타디우스', nameFr: 'Stadius', nameEn: 'Stadius (Chiromancer of Henri III)' },
  'e3457-staffirs': { nameKo: '스타피르(동유럽 백의의 망령) [Staffirs]', nameKoShort: '스타피르', nameFr: 'Staffirs', nameEn: 'Staffirs (Wallachian White Spectres)' },
  'e3458-stagirus': { nameKo: '스타기루스 수도사 [Stagirus / Monk Stagirus]', nameKoShort: '스타기루스 수도사', nameFr: 'Stagirus', nameEn: 'Stagirus (Possessed Monk)' },
  'e3459-stalkers': { nameKo: '스토커(플랑드르의 고블린) [Stalkers]', nameKoShort: '스토커', nameFr: 'Stalkers', nameEn: 'Stalkers (Flemish Goblins)' },
  'e3460-stanoska': { nameKo: '스타노스카(헝가리 흡혈귀 소녀) [Stanoska / Vampire Stanoska]', nameKoShort: '스타노스카', nameFr: 'Stanoska', nameEn: 'Stanoska (The Hungarian Vampire Girl)' },
  'e3461-stauffenberger': { nameKo: '슈타우펜베르크 가문의 운디네 전설 [Stauffenberger / The Undine of Stauffenberg]', nameKoShort: '슈타우펜베르크의 운디네 전설', nameFr: 'Stauffenberger', nameEn: 'The Undine Legend of Stauffenberg' },
  'e3462-steganographie': { nameKo: '스테가노그래피(트리테미우스의 비전 암호술) [Stéganographie / Steganographia]', nameKoShort: '스테가노그래피', nameFr: 'Stéganographie', nameEn: 'Steganographia of Johannes Trithemius' },
  'e3463-steinerveronique': { nameKo: '베로니카 슈타이너 [Steiner (Véronique)]', nameKoShort: '베로니카 슈타이너', nameFr: 'Steiner (Véronique)', nameEn: 'Véronique Steiner (Görres Mystic Case)' },
  'e3464-steinlinjean': { nameKo: '요한 슈타인린 [Steinlin (Jean)]', nameKoShort: '요한 슈타인린', nameFr: 'Steinlin (Jean)', nameEn: 'Jean Steinlin (Ghost of Altheim)' },
  'e3465-sternomancie': { nameKo: '가슴점·복화술 점(스테르노망시) [Sternomancie / Sternomancy]', nameKoShort: '가슴점(스테르노망시)', nameFr: 'Sternomancie', nameEn: 'Sternomancy (Divination by Chest or Belly)' },
  'e3466-stiffels': { nameKo: '미하엘 슈티펠 [Stiffels / Michael Stifel]', nameKoShort: '미하엘 슈티펠', nameFr: 'Stiffels', nameEn: 'Michael Stifel (The False Apocalyptic Prophet)' },
  'e3467-stoffler': { nameKo: '요하네스 슈퇴플러 [Stoffler / Johannes Stöffler]', nameKoShort: '요하네스 슈퇴플러', nameFr: 'Stoffler', nameEn: 'Johannes Stöffler (German Astrologer)' },
  'e3468-stoicheomancie': { nameKo: '서책점(스토이케이오망시) [Stoïchéomancie / Stoicheiomancy]', nameKoShort: '서책점(스토이케이오망시)', nameFr: 'Stoïchéomancie', nameEn: 'Stoicheiomancy (Divination by Verses)' },
  'stolas': { nameKo: '스톨라스 또는 스톨로스 [Stolas, Stolos]', nameKoShort: '스톨라스 또는 스톨로스', nameFr: 'Stolas', nameEn: 'Stolas (Prince of the Underworld)' },
  'e3470-stolisomancie': { nameKo: '의복점(스톨리소망시) [Stolisomancie / Stolisomancy]', nameKoShort: '의복점(스톨리소망시)', nameFr: 'Stolisomancie', nameEn: 'Stolisomancy (Divination by Dressing)' },
  'e3471-stollenwurms': { nameKo: '타첼부름(스톨렌부름) [Stollenwurms / Tatzelwurm]', nameKoShort: '타첼부름', nameFr: 'Stollenwurms', nameEn: 'Tatzelwurm (Alpine Dragon-Serpent)' },
  'e3472-strasite': { nameKo: '스트라시트(소화의 보석) [Strasite]', nameKoShort: '스트라시트', nameFr: 'Strasite', nameEn: 'Strasite (Digestive Stone)' },
  'e3473-stratagemes': { nameKo: '마법사들의 책략과 발광 물질 [Stratagèmes des Magiciens]', nameKoShort: '마법사들의 책략과 발광 물질', nameFr: 'Stratagèmes', nameEn: 'Stratagems of Magicians and Natural Phosphorus' },
  'e3474-strauss': { nameKo: '다비트 슈트라우스 (1부: 독일 신화론자 학설) [Strauss (Partie 1)]', nameKoShort: '다비트 슈트라우스(1부)', nameFr: 'Strauss', nameEn: 'David Friedrich Strauss (Part 1)' },
  'e3475-stryges': { nameKo: '스트릭스(흡혈 괴조·올빼미 마녀) [Stryges / Strix]', nameKoShort: '스트릭스(흡혈 괴조)', nameFr: 'Stryges', nameEn: 'Stryges (Vampiric Owl-Witches)' },
  'e3476-strauss': { nameKo: '슈트라우스의 초상 (2부: 동물 영성화 학자 도판) [Strauss (Partie 2) / Portrait of Strauss]', nameKoShort: '슈트라우스의 초상(2부)', nameFr: 'Strauss', nameEn: 'Portrait of Strauss (Part 2: The Spiritualizer of Beasts)' },
  'e3477-stuffefrederic': { nameKo: '프리드리히 슈투페 [Stuffe (Frédéric)]', nameKoShort: '프리드리히 슈투페', nameFr: 'Stuffe (Frédéric)', nameEn: 'Frédéric Stuffe (The Royal Impostor)' },
  'e3478-stumfpierre': { nameKo: '페터 슈툼프(베트부르크의 늑대인간) [Stumf (Pierre) / Peter Stumpp]', nameKoShort: '페터 슈툼프(늑대인간)', nameFr: 'Stumf (Pierre)', nameEn: 'Peter Stumpp (The Werewolf of Bedburg)' },
  'e3479-styx': { nameKo: '저승의 강 스틱스 [Styx / River Styx]', nameKoShort: '저승의 강 스틱스', nameFr: 'Styx', nameEn: 'River Styx (Underworld River)' },
  'e3480-succorbenoth': { nameKo: '수코트 베노트 [Succor-Bénoth / Succoth-Benoth]', nameKoShort: '수코트 베노트', nameFr: 'Succor-Bénoth', nameEn: 'Succoth-Benoth (Chief Eunuch of Hell)' },
  'e3481-succubes': { nameKo: '서큐버스(여성형 몽마) [Succubes / Succubi]', nameKoShort: '서큐버스(여성형 몽마)', nameFr: 'Succubes', nameEn: 'Succubi (Female Incubi)' },
  'e3482-sucre': { nameKo: '설탕의 고대 귀중품 미신 [Sucre / Superstitions of Sugar]', nameKoShort: '설탕의 고대 미신', nameFr: 'Sucre', nameEn: 'Superstitions of Sugar in Antiquity' },
  'e3483-suceursdemons': { nameKo: '흡혈 악마들 [Suceurs (démons) / Vampiric Suckers]', nameKoShort: '흡혈 악마들', nameFr: 'Suceurs (démons)', nameEn: 'Sucking Demons and Energy Vampires' },
  'e3484-sueur': { nameKo: '땀에 얽힌 독약 미신 [Sueur / Superstition of Sweat]', nameKoShort: '땀에 얽힌 독약 미신', nameFr: 'Sueur', nameEn: 'Superstitions of Human Sweat' },
  'e3485-summanus': { nameKo: '슘마누스(밤의 천둥신과 망령의 지배자) [Summanus]', nameKoShort: '슘마누스', nameFr: 'Summanus', nameEn: 'Summanus (Etruscan God of Night Thunder)' },
  'e3486-sunnyass': { nameKo: '사냐시(인도의 금욕 고행자) [Sunnyass / Sannyasi]', nameKoShort: '사냐시(금욕 고행자)', nameFr: 'Sunnyass', nameEn: 'Sannyasi (Hindu Ascetics)' },
  'e3487-supercherie': { nameKo: '가재 촛불 유령 소동 [Supercherie / The Crawfish Ghost Trick]', nameKoShort: '가재 촛불 유령 소동', nameFr: 'Supercherie', nameEn: 'The Crawfish and Candle Trick' },
  'e3488-superstitions': { nameKo: '미신의 정의와 분류 [Superstitions / Treatise on Superstition]', nameKoShort: '미신의 정의와 분류', nameFr: 'Superstitions', nameEn: 'Treatise on Superstition by Thomas Aquinas' },
  'e3489-sureau': { nameKo: '딱총나무(엘더베리)의 저주 퇴치 비방 [Sureau / Elder Tree Charms]', nameKoShort: '딱총나무의 저주 퇴치 비방', nameFr: 'Sureau', nameEn: 'Elder Tree in Counter-Magical Folk Medicine' },
  'e3490-surtur': { nameKo: '수르트(북유럽 화염의 거인) [Surtur / Surtr]', nameKoShort: '수르트(화염 거인)', nameFr: 'Surtur', nameEn: 'Surtr (The Fire Giant of Ragnarok)' },
  'e3491-sustrugiel': { nameKo: '수스트루기엘 [Sustrugiel]', nameKoShort: '수스트루기엘', nameFr: 'Sustrugiel', nameEn: 'Sustrugiel (Demon of the Clavicles of Solomon)' },
  'e3492-suttee': { nameKo: '사티(인도의 과부 분신 의식) [Suttée / Sati]', nameKoShort: '사티(과부 분신 의식)', nameFr: 'Suttée', nameEn: 'Sati (Widow Burning Ritual in India)' },
  'e3493-swedenborgemmanuel': { nameKo: '에마누엘 스베덴보리 [Swedenborg (Emmanuel)]', nameKoShort: '에마누엘 스베덴보리', nameFr: 'Swedenborg (Emmanuel)', nameEn: 'Emanuel Swedenborg' },
  'e3494-sycomancie': { nameKo: '무화과잎점(시코망시) [Sycomancie / Sycomancy]', nameKoShort: '무화과잎점(시코망시)', nameFr: 'Sycomancie', nameEn: 'Sycomancy (Divination by Fig Leaves)' },
  'e3495-sydonay': { nameKo: '시도나이 [Sydonay / Asmodée]', nameKoShort: '시도나이', nameFr: 'Sydonay', nameEn: 'Sydonay (Asmodeus)' },
  'e3496-sylla': { nameKo: '루키우스 코르넬리우스 술라 [Sylla / Lucius Cornelius Sulla]', nameKoShort: '술라', nameFr: 'Sylla', nameEn: 'Lucius Cornelius Sulla (Roman Dictator)' },
  'e3497-sylphes': { nameKo: '실프(공기의 정령) [Sylphes / Sylphs]', nameKoShort: '실프(공기의 정령)', nameFr: 'Sylphes', nameEn: 'Sylphs (Air Elementals)' },
  'e3498-sylvestreii': { nameKo: '교황 실베스테르 2세 [Sylvestre II / Pope Sylvester II]', nameKoShort: '실베스테르 2세', nameFr: 'Sylvestre II', nameEn: 'Pope Sylvester II (Gerbert of Aurillac)' },
  'e3499-symandius': { nameKo: '오시만디아스(시만디우스 파라오) [Symandius / Ozymandias]', nameKoShort: '오시만디아스', nameFr: 'Symandius', nameEn: 'Ozymandias (Pharaoh Ramesses II)' },
  'e3500-sympathie': { nameKo: '교감 마법·상응 주술 [Sympathie / Sympathetic Magic]', nameKoShort: '교감 마법·상응 주술', nameFr: 'Sympathie', nameEn: 'Sympathetic Magic and Celestial Harmony' },
  'e3501-syrenes': { nameKo: '세이렌(인어) [Syrènes / Sirens]', nameKoShort: '세이렌(인어)', nameFr: 'Syrènes', nameEn: 'Sirens and Mermaids' },
  'e3502-syrrochite': { nameKo: '시로키테스(강령술의 보석) [Syrrochite]', nameKoShort: '시로키테스', nameFr: 'Syrrochite', nameEn: 'Syrrochites (The Necromancer’s Gem)' },
  'e3503-sytry': { nameKo: '시트리 또는 비트루 [Sytry, Bitru]', nameKoShort: '시트리 또는 비트루', nameFr: 'Sytry', nameEn: 'Sytry (Prince of Hell)' },
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

  // T entries curated headwords (p.645-672)
  'e3504-taaora': { nameKo: '타아로아 [Taaora / Ta’aroa]', nameKoShort: '타아로아', nameFr: 'Taaora', nameEn: 'Ta’aroa' },
  'e3505-tabac': { nameKo: '담배에 얽힌 민간 미신 [Tabac / Tobacco]', nameKoShort: '담배에 얽힌 미신', nameFr: 'Tabac', nameEn: 'Tobacco Superstition' },
  'e3506-tablestournantes': { nameKo: '탁자 회전 강신술 [Tables tournantes / Table-Turning]', nameKoShort: '탁자 회전 강신술', nameFr: 'Tables tournantes', nameEn: 'Table-Turning Spiritualism' },
  'e3507-taciturnite': { nameKo: '과묵함의 마법 [Sort de taciturnité / Spell of Silence]', nameKoShort: '과묵함의 마법', nameFr: 'Taciturnité', nameEn: 'Spell of Silence' },
  'e3508-tacouins': { nameKo: '타쿠인 [Tacouins / Tacouin Fairies]', nameKoShort: '타쿠인', nameFr: 'Tacouins', nameEn: 'Tacouin Fairies' },
  'e3509-taillepiednoel': { nameKo: '노엘 타이유피에 [Taillepied (Noël)]', nameKoShort: '노엘 타이유피에', nameFr: 'Taillepied (Noël)', nameEn: 'Noël Taillepied' },
  'e3510-tailletrouxjeanne': { nameKo: '잔 타이유트루 [Tailletroux (Jeanne)]', nameKoShort: '잔 타이유트루', nameFr: 'Tailletroux (Jeanne)', nameEn: 'Jeanne Tailletroux' },
  'e3511-taingairi': { nameKo: '타잉가이리 [Taingairi]', nameKoShort: '타잉가이리', nameFr: 'Taingairi', nameEn: 'Taingairi Spirits' },
  'e3512-talapoins': { nameKo: '탈라푸앙 [Talapoins]', nameKoShort: '탈라푸앙', nameFr: 'Talapoins', nameEn: 'Talapoins (Buddhist Monks)' },
  'e3513-talismans': { nameKo: '탈리스만(부적과 인장) [Talismans]', nameKoShort: '탈리스만', nameFr: 'Talismans', nameEn: 'Talismans & Magic Seals' },
  'e3514-talissons': { nameKo: '탈리손 [Talissons]', nameKoShort: '탈리손', nameFr: 'Talissons', nameEn: 'Talissons' },
  'e3515-talmud': { nameKo: '탈무드 [Talmud]', nameKoShort: '탈무드', nameFr: 'Talmud', nameEn: 'Talmud' },
  'e3516-talys': { nameKo: '탈리 [Talys / Mangala Sutra]', nameKoShort: '탈리', nameFr: 'Talys', nameEn: 'Tali (Amulet of Marriage)' },
  'e3517-tambourmagique': { nameKo: '마법의 북 [Tambour magique / Magic Shamanic Drum]', nameKoShort: '마법의 북', nameFr: 'Tambour magique', nameEn: 'Magic Shamanic Drum' },
  'e3518-tamaracunga': { nameKo: '타마라쿵가 [Tamaracunga]', nameKoShort: '타마라쿵가', nameFr: 'Tamaracunga', nameEn: 'Tamaracunga' },
  'e3519-tamisdivinationparle': { nameKo: '체 점술 또는 코스키노만시 [Tamis / Koskinomancy]', nameKoShort: '체 점술', nameFr: 'Tamis (divination par le)', nameEn: 'Koskinomancy (Sieve Divination)' },
  'e3520-tamous': { nameKo: '타무스 지옥 [Tamous / Tamas]', nameKoShort: '타무스 지옥', nameFr: 'Tamous', nameEn: 'Tamous (Kalmyk Hell)' },
  'e3521-tanaquil': { nameKo: '타나퀼 [Tanaquil]', nameKoShort: '타나퀼', nameFr: 'Tanaquil', nameEn: 'Tanaquil (Etruscan Queen)' },
  'e3522-tanchelm': { nameKo: '탄켈름 또는 탄켈린 [Tanchelm, Tanchelin]', nameKoShort: '탄켈름', nameFr: 'Tanchelm', nameEn: 'Tanchelm of Antwerp' },
  'e3523-taniwoa': { nameKo: '타니와 [Taniwoa / Taniwha]', nameKoShort: '타니와', nameFr: 'Taniwoa', nameEn: 'Taniwha' },
  'e3524-tanner': { nameKo: '아담 탄너 [Tanner / Adam Tanner]', nameKoShort: '아담 탄너', nameFr: 'Tanner', nameEn: 'Adam Tanner (Jesuit Theologian)' },
  'tap': { nameKo: '타프 또는 가프 [Tap, Gaap]', nameKoShort: '타프 또는 가프', nameFr: 'Tap', nameEn: 'Tap / Gaap (Grand President of Hell)' },
  'e3526-tarentule': { nameKo: '타란툴라 거미와 타란티즘 [Tarentule / Tarantula & Tarantism]', nameKoShort: '타란툴라 거미와 타란티즘', nameFr: 'Tarentule', nameEn: 'Tarantula & Tarantism' },
  'e3527-tarni': { nameKo: '타르니(퇴마 진언) [Tarni / Dharani]', nameKoShort: '타르니', nameFr: 'Tarni', nameEn: 'Tarni (Exorcism Dharani)' },
  'e3528-taroataihetomeo': { nameKo: '타로아타이헤토메오 [Taroataihetomeo]', nameKoShort: '타로아타이헤토메오', nameFr: 'Taroataihetomeo', nameEn: 'Taroataihetomeo' },
  'e3529-tarots': { nameKo: '타로 카드 점술 [Tarots / Tarot Cards]', nameKoShort: '타로 카드 점술', nameFr: 'Tarots', nameEn: 'Tarot Cards & Cartomancy' },
  'e3530-tartara': { nameKo: '타르타라! [Tartara !]', nameKoShort: '타르타라!', nameFr: 'Tartara !', nameEn: 'Tartara! (War Cry)' },
  'e3531-tartare': { nameKo: '타르타로스 [Tartare / Tartarus]', nameKoShort: '타르타로스', nameFr: 'Tartare', nameEn: 'Tartarus (Greek Underworld)' },
  'e3532-tartini': { nameKo: '주세페 타르티니의 악마의 트릴 [Tartini / Giuseppe Tartini]', nameKoShort: '타르티니', nameFr: 'Tartini', nameEn: 'Giuseppe Tartini’s Devil’s Trill' },
  'e3533-tassotorquato': { nameKo: '토르콰토 타소 [Tasso (Torquato)]', nameKoShort: '토르콰토 타소', nameFr: 'Tasso (Torquato)', nameEn: 'Torquato Tasso' },
  'e3534-tatien': { nameKo: '타티아누스 [Tatien / Tatian the Assyrian]', nameKoShort: '타티아누스', nameFr: 'Tatien', nameEn: 'Tatian (Encratite Leader)' },
  'e3535-taupe': { nameKo: '두더지에 얽힌 점술과 민간 미신 [Taupe / Mole Superstitions]', nameKoShort: '두더지에 얽힌 미신', nameFr: 'Taupe', nameEn: 'Mole Superstition and Divination' },
  'e3536-tauses': { nameKo: '타우제 [Tauses / Tause Incubi]', nameKoShort: '타우제', nameFr: 'Tauses', nameEn: 'Tauses (German Nightmare Spirits)' },
  'e3537-tavides': { nameKo: '타비드 [Tavides / Tavid Amulets]', nameKoShort: '타비드', nameFr: 'Tavides', nameEn: 'Tavides (Maldivian Amulets)' },
  'e3538-taymural': { nameKo: '타흐무라스 [Taymural / Tahmuras]', nameKoShort: '타흐무라스', nameFr: 'Taymural', nameEn: 'Tahmuras (King of Persia)' },
  'e3539-tee': { nameKo: '티 [Tée / Ti’i Spirit]', nameKoShort: '티', nameFr: 'Tée', nameEn: 'Ti’i (Tahitian Ancestral Spirit)' },
  'e3540-tehuptehuh': { nameKo: '테후프테후 [Tehuptehuh]', nameKoShort: '테후프테후', nameFr: 'Tehuptehuh', nameEn: 'Tehuptehuh' },
  'e3541-tell': { nameKo: '빌헬름 텔과 잠자는 세 영웅 [Tell / William Tell & the Three Heroes]', nameKoShort: '빌헬름 텔과 세 영웅', nameFr: 'Tell', nameEn: 'William Tell and the Three Sleepers' },
  'e3542-tellezgabriel': { nameKo: '가브리엘 테예스(티르소 데 몰리나) [Téllez (Gabriel) / Tirso de Molina]', nameKoShort: '가브리엘 테예스', nameFr: 'Tellez (Gabriel)', nameEn: 'Gabriel Téllez (Tirso de Molina)' },
  'e3543-temperature': { nameKo: '기상 점술과 기우제 미신 [Température / Weather Divination]', nameKoShort: '기상 점술과 기우제 미신', nameFr: 'Température', nameEn: 'Weather Divination & Rainmakers' },
  'e3544-tempetes': { nameKo: '폭풍을 부르는 마녀의 주술 [Tempêtes / Storm-Raising Witches]', nameKoShort: '폭풍을 부르는 마녀 주술', nameFr: 'Tempêtes', nameEn: 'Witches Raising Storms' },
  'e3545-templiers': { nameKo: '성전기사단 (1부: 바포메트 우상 숭배와 기사단 기원) [Templiers / Knights Templar (Part I)]', nameKoShort: '성전기사단 (1부)', nameFr: 'Templiers', nameEn: 'Knights Templar (Part I)' },
  'e3546-temzarpouliet': { nameKo: '템자르풀리에 [Temzarpouliet]', nameKoShort: '템자르풀리에', nameFr: 'Temzarpouliet', nameEn: 'Temzarpouliet (Breton Goblin)' },
  'e3547-templiers': { nameKo: '성전기사단 (2부: 기사단장 자크 드 몰레의 화형) [Templiers / Execution of Jacques de Molay (Part II)]', nameKoShort: '성전기사단 (2부)', nameFr: 'Templiers', nameEn: 'Knights Templar: Execution of Jacques de Molay (Part II)' },
  'e3548-tenare': { nameKo: '테나론 곶 [Ténare / Cape Taenarum]', nameKoShort: '테나론 곶', nameFr: 'Ténare', nameEn: 'Cape Taenarum (Entrance to the Underworld)' },
  'e3549-tenebres': { nameKo: '어둠의 권세(악마들) [Ténèbres / Powers of Darkness]', nameKoShort: '어둠의 권세', nameFr: 'Ténèbres', nameEn: 'Powers of Darkness' },
  'e3550-tentations': { nameKo: '악마의 유혹 [Tentations / Demonic Temptations]', nameKoShort: '악마의 유혹', nameFr: 'Tentations', nameEn: 'Demonic Temptations' },
  'e3551-tephramancie': { nameKo: '테프라만시(재 점술) [Tephramancie / Tephramancy]', nameKoShort: '테프라만시', nameFr: 'Tephramancie', nameEn: 'Tephramancy (Ash Divination)' },
  'e3552-teratoscopie': { nameKo: '테라토스코피(기형·이형 점술) [Tératoscopie / Teratoscopy]', nameKoShort: '테라토스코피', nameFr: 'Tératoscopie', nameEn: 'Teratoscopy (Monstrous Omens)' },
  'e3553-terragon': { nameKo: '테라공 [Terragon]', nameKoShort: '테라공', nameFr: 'Terragon', nameEn: 'Terragon (Demon Executioner)' },
  'e3554-terre': { nameKo: '흙을 먹는 미신 [Terre / Earth-Eating Superstition]', nameKoShort: '흙을 먹는 미신', nameFr: 'Terre', nameEn: 'Earth-Eating Superstition' },
  'e3555-terrestres': { nameKo: '지상 악마와 지하 악마 [Terrestres / Terrestrial Demons]', nameKoShort: '지상 악마와 지하 악마', nameFr: 'Terrestres', nameEn: 'Terrestrial & Subterranean Demons' },
  'e3556-terreurspaniques': { nameKo: '공황 발작과 판의 공포 [Terreurs paniques / Panic Terrors]', nameKoShort: '판의 공포', nameFr: 'Terreurs paniques', nameEn: 'Panic Terrors (Terreur Panique)' },
  'e3557-terrier': { nameKo: '테리에 [Terrier]', nameKoShort: '테리에', nameFr: 'Terrier', nameEn: 'Terrier (Demon)' },
  'e3558-tervagant': { nameKo: '테르바강 [Tervagant / Termagant]', nameKoShort: '테르바강', nameFr: 'Tervagant', nameEn: 'Termagant (Tervagant)' },
  'e3559-tervilles': { nameKo: '테르빌 [Tervilles]', nameKoShort: '테르빌', nameFr: 'Tervilles', nameEn: 'Tervilles (Norwegian Goblins)' },
  'e3560-tespesion': { nameKo: '테스페시온 [Tespesion]', nameKoShort: '테스페시온', nameFr: 'Tespesion', nameEn: 'Thespesion the Gymnosophist' },
  'e3561-tete': { nameKo: '말하는 머리 예언 [Tête / Divining Head]', nameKoShort: '말하는 머리 예언', nameFr: 'Tête', nameEn: 'Oracular Severed Head' },
  'e3562-tetedebophomet': { nameKo: '바포메트의 머리 [Tête de Bophomet / Head of Baphomet]', nameKoShort: '바포메트의 머리', nameFr: 'Tête de Bophomet', nameEn: 'Head of Baphomet' },
  'e3563-tetedemort': { nameKo: '해골 강령 예언 [Tête de mort / Death’s Head Necromancy]', nameKoShort: '해골 강령 예언', nameFr: 'Tête de mort', nameEn: 'Death’s Head Necromancy' },
  'e3564-tetedesaintjean': { nameKo: '세례자 요한의 머리 사기극 [Tête de saint Jean / Head of Saint John]', nameKoShort: '세례자 요한의 머리 사기극', nameFr: 'Tête de saint Jean', nameEn: 'Fraudulent Head of Saint John' },
  'e3565-tetesdeserpent': { nameKo: '뱀의 머리들과 칠두사 사기극 [Têtes de serpent / Seven-Headed Serpent Fraud]', nameKoShort: '칠두사 사기극', nameFr: 'Têtes de serpent', nameEn: 'Seven-Headed Serpent Fraud (Linnaeus)' },
  'e3566-tetragrammaton': { nameKo: '테트라그라마톤(신의 네 글자 성호) [Tetragrammaton / YHWH]', nameKoShort: '테트라그라마톤', nameFr: 'Tetragrammaton', nameEn: 'Tetragrammaton (The Sacred Four Letters)' },
  'e3567-teula': { nameKo: '테울라(스코틀랜드 신기루) [Teula / Scottish Mirage]', nameKoShort: '테울라', nameFr: 'Teula', nameEn: 'Teula (Scottish Spectral Mirage)' },
  'e3568-teusarpouliet': { nameKo: '테우사르풀리에 [Teusarpouliet]', nameKoShort: '테우사르풀리에', nameFr: 'Teusarpouliet', nameEn: 'Teusarpouliet' },
  'e3569-teuss': { nameKo: '퇴스 [Teuss]', nameKoShort: '퇴스', nameFr: 'Teuss', nameEn: 'Teuss (Breton Benevolent Sprite)' },
  'e3570-teutates': { nameKo: '테우타테스 [Teutatès / Toutatis]', nameKoShort: '테우타테스', nameFr: 'Teutatès', nameEn: 'Toutatis (Gallic God)' },
  'e3571-thalmud': { nameKo: '탈무드 총론 [Thalmud / Talmud]', nameKoShort: '탈무드 총론', nameFr: 'Thalmud', nameEn: 'The Talmud (Rabbinic Lore & Traditions)' },
  'e3572-thamus': { nameKo: '타무스 선장 [Thamus]', nameKoShort: '타무스 선장', nameFr: 'Thamus', nameEn: 'Thamus the Pilot (Death of Great Pan)' },
  'e3573-thamuz': { nameKo: '타무즈 [Thamuz]', nameKoShort: '타무즈', nameFr: 'Thamuz', nameEn: 'Thamuz (Demon of Artillery)' },
  'e3574-theagenes': { nameKo: '테아게네스 [Théagènes]', nameKoShort: '테아게네스', nameFr: 'Théagènes', nameEn: 'Theagenes of Thasos' },
  'e3575-theantis': { nameKo: '테안티스 [Théantis]', nameKoShort: '테안티스', nameFr: 'Théantis', nameEn: 'Theantis' },
  'e3576-themeceleste': { nameKo: '천궁도 또는 천체도 [Thème céleste / Celestial Theme]', nameKoShort: '천궁도', nameFr: 'Thème céleste', nameEn: 'Celestial Theme (Astrological Chart)' },
  'e3577-themura': { nameKo: '테무라 [Thémura / Temurah]', nameKoShort: '테무라', nameFr: 'Thémura', nameEn: 'Temurah (Kabbalistic Permutation)' },
  'e3578-theoclimene': { nameKo: '테오클리메노스 [Théoclimène]', nameKoShort: '테오클리메노스', nameFr: 'Théoclimène', nameEn: 'Theoclymenus the Seer' },
  'e3579-theodat': { nameKo: '테오다트 [Théodat]', nameKoShort: '테오다트', nameFr: 'Théodat', nameEn: 'Theodahad (King of the Ostrogoths)' },
  'e3580-theodoric': { nameKo: '테오도릭 국왕과 보이티우스의 처형 [Théodoric / Theodoric the Great]', nameKoShort: '테오도릭 국왕', nameFr: 'Théodoric', nameEn: 'Theodoric the Great and Boethius' },
  'e3581-theodose': { nameKo: '테오도시우스 [Théodose]', nameKoShort: '테오도시우스', nameFr: 'Théodose', nameEn: 'Emperor Theodosius' },
  'e3582-theomancie': { nameKo: '테오만시(신명 점술) [Théomancie / Theomancy]', nameKoShort: '테오만시', nameFr: 'Théomancie', nameEn: 'Theomancy (Divine Name Divination)' },
  'e3583-theophile': { nameKo: '테오필루스 참사회원 [Théophile d’Adana / Theophilus of Adana]', nameKoShort: '테오필루스 참사회원', nameFr: 'Théophile', nameEn: 'Saint Theophilus the Penitent' },
  'e3584-theraphim': { nameKo: '테라핌 [Théraphim / Teraphim]', nameKoShort: '테라핌', nameFr: 'Théraphim', nameEn: 'Teraphim (Hebrew Oracular Idols)' },
  'e3585-thermometre': { nameKo: '온도계와 샤프 수도원장의 기지 [Thermomètre / Abbé Chappe’s Thermometer]', nameKoShort: '온도계와 샤프 수도원장', nameFr: 'Thermomètre', nameEn: 'Abbé Chappe’s Thermometer in Siberia' },
  'e3586-thespesius': { nameKo: '테스페시우스의 저승 여행 [Thespésius]', nameKoShort: '테스페시우스', nameFr: 'Thespésius', nameEn: 'Thespesius of Soli (Vision of the Afterlife)' },
  'e3587-thessaliennes': { nameKo: '테살리아의 마녀들 [Thessaliennes / Thessalian Witches]', nameKoShort: '테살리아의 마녀들', nameFr: 'Thessaliennes', nameEn: 'Thessalian Witches' },
  'e3588-theurgie': { nameKo: '테우르기(신동술·신성 마법) [Théurgie / Theurgy]', nameKoShort: '테우르기', nameFr: 'Théurgie', nameEn: 'Theurgy (Divine Magic)' },
  'e3589-thiersjeanbaptiste': { nameKo: '장-바티스트 티에르 [Thiers (Jean-Baptiste)]', nameKoShort: '장-바티스트 티에르', nameFr: 'Thiers (Jean-Baptiste)', nameEn: 'Jean-Baptiste Thiers' },
  'e3590-thomassaint': { nameKo: '성 토마스 아퀴나스 [Thomas d’Aquin (Saint) / Saint Thomas Aquinas]', nameKoShort: '성 토마스 아퀴나스', nameFr: 'Thomas (Saint)', nameEn: 'Saint Thomas Aquinas' },
  'e3591-thomas': { nameKo: '토마스와 악마의 설교 [Thomas / The Demon’s Sermon]', nameKoShort: '악마의 설교', nameFr: 'Thomas', nameEn: 'The Demon’s Lenten Sermon' },
  'e3592-thor': { nameKo: '토르 신 [Thor]', nameKoShort: '토르 신', nameFr: 'Thor', nameEn: 'Thor (Norse God of Thunder)' },
  'e3593-thou': { nameKo: '자크 오귀스트 드 투 [Thou (Jacques-Auguste de)]', nameKoShort: '자크 오귀스트 드 투', nameFr: 'Thou', nameEn: 'Jacques-Auguste de Thou' },
  'e3594-thuggisme': { nameKo: '서기파(터기즘) [Thuggisme / Thuggee Cult]', nameKoShort: '서기파', nameFr: 'Thuggisme', nameEn: 'Thuggee Cult of India' },
  'e3595-thurifumie': { nameKo: '튀리퓌미(향 연기 점술) [Thurifumie / Thurifumia]', nameKoShort: '튀리퓌미', nameFr: 'Thurifumie', nameEn: 'Thurifumia (Incense Smoke Divination)' },
  'e3596-thymiamata': { nameKo: '티미아마타(신성한 분향) [Thymiamata]', nameKoShort: '티미아마타', nameFr: 'Thymiamata', nameEn: 'Thymiamata (Sacred Incense Perfumes)' },
  'e3597-thyreepierre': { nameKo: '페트루스 티라이우스 [Thyrée (Pierre) / Petrus Thyraeus]', nameKoShort: '페트루스 티라이우스', nameFr: 'Thyrée (Pierre)', nameEn: 'Petrus Thyraeus' },
  'e3598-tibalang': { nameKo: '티크발랑 [Tibalang / Tikbalang]', nameKoShort: '티크발랑', nameFr: 'Tibalang', nameEn: 'Tikbalang (Philippine Forest Monster)' },
  'e3599-tibere': { nameKo: '티베리우스 황제 [Tibère / Tiberius]', nameKoShort: '티베리우스 황제', nameFr: 'Tibère', nameEn: 'Emperor Tiberius (Night Vision)' },
  'e3600-tichobrahe': { nameKo: '튀코 브라헤 [Ticho-Brahé / Tycho Brahe]', nameKoShort: '튀코 브라헤', nameFr: 'Ticho-Brahé', nameEn: 'Tycho Brahe (Astronomer’s Superstitions)' },
  'e3601-tiecklouis': { nameKo: '루트비히 티크 [Tieck (Louis)]', nameKoShort: '루트비히 티크', nameFr: 'Tieck (Louis)', nameEn: 'Ludwig Tieck (The Witches’ Sabbath)' },
  'e3602-tigrelegrand': { nameKo: '거대한 호랑이 [Tigre (Le grand)]', nameKoShort: '거대한 호랑이', nameFr: 'Tigre (Le grand)', nameEn: 'The Great Tiger' },
  'e3603-tintement': { nameKo: '귀울림과 뺨의 열기에 얽힌 흉조 [Tintement d’oreille / Ringing in the Ears]', nameKoShort: '귀울림의 흉조', nameFr: 'Tintement', nameEn: 'Ringing in the Ears Superstition' },
  'e3604-tiphaine': { nameKo: '티펜 라그네유 [Tiphaine Raguenel]', nameKoShort: '티펜 라그네유', nameFr: 'Tiphaine', nameEn: 'Tiphaine Raguenel (Breton Fairy Lady)' },
  'e3605-tiromancie': { nameKo: '티로만시(치즈 점술) [Tiromancie / Tyromancy]', nameKoShort: '티로만시', nameFr: 'Tiromancie', nameEn: 'Tyromancy (Cheese Divination)' },
  'e3606-titania': { nameKo: '티타니아 [Titania]', nameKoShort: '티타니아', nameFr: 'Titania', nameEn: 'Titania (Queen of the Fairies)' },
  'e3607-titus': { nameKo: '티투스 황제와 뇌 속의 날벌레 [Titus]', nameKoShort: '티투스 황제', nameFr: 'Titus', nameEn: 'Emperor Titus and the Gnat' },
  'e3608-toia': { nameKo: '토이아 [Toia]', nameKoShort: '토이아', nameFr: 'Toia', nameEn: 'Toia (Florida Demon)' },
  'e3609-tombeaux': { nameKo: '무덤 위의 수면과 영혼 교신 [Tombeaux / Sleeping on Tombs]', nameKoShort: '무덤 위의 수면', nameFr: 'Tombeaux', nameEn: 'Incubation on Tombs' },
  'e3610-tomtegobbe': { nameKo: '톰테고베 [Tomtegobbe / Tomte]', nameKoShort: '톰테고베', nameFr: 'Tomtegobbe', nameEn: 'Tomtegobbe (Swedish House Goblin)' },
  'e3611-tondal': { nameKo: '톤달의 환시 [Tondal / Vision of Tundale]', nameKoShort: '톤달의 환시', nameFr: 'Tondal', nameEn: 'Vision of Tundale (The Knight’s Journey)' },
  'e3612-tonnerre': { nameKo: '천둥과 벼락에 얽힌 민간 미신 [Tonnerre / Thunder Superstition]', nameKoShort: '천둥에 얽힌 미신', nameFr: 'Tonnerre', nameEn: 'Thunder Superstitions & Amulets' },
  'e3613-topielnitsys': { nameKo: '토피엘니차 [Topielnitsys / Topielce]', nameKoShort: '토피엘니차', nameFr: 'Topielnitsys', nameEn: 'Topielce (Slavic Water Spirits)' },
  'e3614-toqui': { nameKo: '토키 [Toqui]', nameKoShort: '토키', nameFr: 'Toqui', nameEn: 'Toqui (Araucanian Supreme God)' },
  'torngarsuk': { nameKo: '토른가르수크 [Torngarsuk, Tornarsuk]', nameKoShort: '토른가르수크', nameFr: 'Torngarsuk', nameEn: 'Torngarsuk (Great Inua of Greenland)' },
  'e3616-torquemadaantoinede': { nameKo: '안토니오 데 토르케마다 [Torquemada (Antoine de)]', nameKoShort: '안토니오 데 토르케마다', nameFr: 'Torquemada (Antoine de)', nameEn: 'Antonio de Torquemada' },
  'e3617-torreblancafrancois': { nameKo: '프란시스코 토레블랑카 [Torreblanca (François)]', nameKoShort: '프란시스코 토레블랑카', nameFr: 'Torreblanca (François)', nameEn: 'Francisco Torreblanca Villalpando' },
  'e3618-torture': { nameKo: '고문과 악마의 무통 주술 [Torture / Inquisitorial Torture]', nameKoShort: '고문과 무통 주술', nameFr: 'Torture', nameEn: 'Torture & Demonic Insensibility' },
  'e3619-totam': { nameKo: '토템과 수호동물 [Totam / Totem Animal]', nameKoShort: '토템과 수호동물', nameFr: 'Totam', nameEn: 'Totem (Animal Guardian Spirit)' },
  'e3620-toupan': { nameKo: '투판 [Toupan / Tupan]', nameKoShort: '투판', nameFr: 'Toupan', nameEn: 'Tupan (Thunder Spirit of Brazil)' },
  'e3621-tourdeforce': { nameKo: '두 마법사의 대결 묘기 [Tour de force / The Magicians’ Feat]', nameKoShort: '두 마법사의 대결 묘기', nameFr: 'Tour de force', nameEn: 'The Feat of the Two Rival Sorcerers' },
  'e3622-tourdemontpellier': { nameKo: '몽펠리에의 마법 탑 [Tour de Montpellier / Tower of Montpellier]', nameKoShort: '몽펠리에의 마법 탑', nameFr: 'Tour de Montpellier', nameEn: 'The Mystical Tower of Montpellier' },
  'e3623-tourdesrats': { nameKo: '쥐의 탑 [Tour des Rats / Mouse Tower]', nameKoShort: '쥐의 탑', nameFr: 'Tour des Rats', nameEn: 'The Mouse Tower of Bingen' },
  'e3624-tourdewigla': { nameKo: '비글라의 저주받은 탑 [Tour de Wigla / Tower of Wigla]', nameKoShort: '비글라의 저주받은 탑', nameFr: 'Tour de Wigla', nameEn: 'The Accursed Tower of Wigla' },
  'e3625-tourterelle': { nameKo: '멧비둘기에 얽힌 마술 미신 [Tourterelle / Turtle-Dove Superstition]', nameKoShort: '멧비둘기 미신', nameFr: 'Tourterelle', nameEn: 'Turtle-Dove Magic Superstitions' },
  'e3626-traditionspopulaires': { nameKo: '민간 전승 속 선과 악의 대결 [Traditions populaires / Popular Traditions]', nameKoShort: '민간 전승 속 선악 대결', nameFr: 'Traditions populaires', nameEn: 'Popular Traditions: The Duality of Good and Evil' },
  'e3627-traire': { nameKo: '젖을 짜내는 주술 [Traire / Milking Charms]', nameKoShort: '젖을 짜내는 주술', nameFr: 'Traire', nameEn: 'Milking Charms' },
  'e3628-trajan': { nameKo: '트라야누스 황제 [Trajan / Emperor Trajan]', nameKoShort: '트라야누스 황제', nameFr: 'Trajan', nameEn: 'Emperor Trajan (Parthian Expedition)' },
  'e3629-transmigrationdesames': { nameKo: '윤회와 영혼의 전이 [Transmigration des âmes / Metempsychosis]', nameKoShort: '윤회와 영혼의 전이', nameFr: 'Transmigration des âmes', nameEn: 'Transmigration of Souls (Metempsychosis)' },
  'transport-sorcerers': { nameKo: '마녀들의 공중 이동 [Transport des sorcières / Flight of the Witches]', nameKoShort: '마녀들의 공중 이동', nameFr: 'Transport des sorcières', nameEn: 'Flight of the Witches to the Sabbath' },
  'e3631-trasulle': { nameKo: '트라실루스 [Trasulle / Thrasyllus of Mendes]', nameKoShort: '트라실루스', nameFr: 'Trasulle', nameEn: 'Thrasyllus of Mendes' },
  'e3632-trazegnies': { nameKo: '트라제니 가문의 은빛 유령 백부인 [Trazégnies / The White Lady of Trazegnies]', nameKoShort: '트라제니의 백부인', nameFr: 'Trazégnies', nameEn: 'The White Lady of Trazegnies Castle' },
  'e3633-trazgos': { nameKo: '트라스고스 [Trazgos / Trasgos]', nameKoShort: '트라스고스', nameFr: 'Trazgos', nameEn: 'Trasgos (Spanish Household Goblins)' },
  'e3634-trefleaquatrefeuilles': { nameKo: '네잎클로버와 교수대의 풀 [Trèfle à quatre feuilles / Four-Leaf Clover]', nameKoShort: '네잎클로버와 교수대 풀', nameFr: 'Trèfle à quatre feuilles', nameEn: 'Four-Leaf Clover Superstition' },
  'e3635-tregitourie': { nameKo: '트레지투리(환영 기술·요술) [Trégitourie / Tregetry]', nameKoShort: '트레지투리', nameFr: 'Trégitourie', nameEn: 'Tregetry (Juggling and Illusions)' },
  'e3636-treize': { nameKo: '13의 불길한 미신 [Treize / Number Thirteen Superstition]', nameKoShort: '13의 불길한 미신', nameFr: 'Treize', nameEn: 'Superstition of Number Thirteen' },
  'e3637-tremblementsdeterre': { nameKo: '지진에 얽힌 민간 미신 [Tremblements de terre / Earthquake Superstition]', nameKoShort: '지진에 얽힌 미신', nameFr: 'Tremblements de terre', nameEn: 'Earthquake Superstition (Andean Beliefs)' },
  'e3638-tresors': { nameKo: '숨겨진 보물과 수호 악령 [Trésors / Hidden Treasures]', nameKoShort: '숨겨진 보물과 악령', nameFr: 'Trésors', nameEn: 'Hidden Treasures and Demon Guardians' },
  'e3639-tribunalsecret': { nameKo: '페메 비밀 재판소 [Tribunal secret / Vehmic Court]', nameKoShort: '페메 비밀 재판소', nameFr: 'Tribunal secret', nameEn: 'The Vehmic Secret Tribunal of Westphalia' },
  'e3640-trithemejean': { nameKo: '요하네스 트리테미우스 [Trithème (Jean) / Johannes Trithemius]', nameKoShort: '요하네스 트리테미우스', nameFr: 'Trithème (Jean)', nameEn: 'Johannes Trithemius (Abbot of Sponheim)' },
  'e3641-trodds': { nameKo: '트로드 [Trodds / Danish Trolds]', nameKoShort: '트로드', nameFr: 'Trodds', nameEn: 'Danish Trolds (Little Goblins)' },
  'e3642-troian': { nameKo: '트로얀 국왕 [Troian / Tsar Trojan]', nameKoShort: '트로얀 국왕', nameFr: 'Troian', nameEn: 'Tsar Trojan (Night Emperor of Serbia)' },
  'e3643-trois': { nameKo: '숫자 3의 마법적 신비 [Trois / Number Three Superstition]', nameKoShort: '숫자 3의 신비', nameFr: 'Trois', nameEn: 'Superstitions of Number Three' },
  'e3644-troisechelles': { nameKo: '트루아-에셸 [Trois-Échelles]', nameKoShort: '트루아-에셸', nameFr: 'Trois-Échelles', nameEn: 'Trois-Échelles (Court Sorcerer)' },
  'e3645-troisrieux': { nameKo: '트루아-리외 [Trois-Rieux]', nameKoShort: '트루아-리외', nameFr: 'Trois-Rieux', nameEn: 'Trois-Rieux' },
  'e3646-troldman': { nameKo: '트롤드만 [Troldman / Scandinavian Trollman]', nameKoShort: '트롤드만', nameFr: 'Troldman', nameEn: 'Troldman (Norse Wizard)' },
  'e3647-trollen': { nameKo: '트롤렌 [Trollen / Scandinavian Trolls]', nameKoShort: '트롤렌', nameFr: 'Trollen', nameEn: 'Trollen (House Spirits of Norway)' },
  'e3648-troncdarbre': { nameKo: '고목 나무 몸체로 변신한 악마 [Tronc d’arbre / Devil as a Tree Trunk]', nameKoShort: '고목으로 변신한 악마', nameFr: 'Tronc d’arbre', nameEn: 'Devil in the Shape of a Tree Trunk' },
  'e3649-trophonius': { nameKo: '트로포니우스의 동굴 [Trophonius / Cave of Trophonius]', nameKoShort: '트로포니우스의 동굴', nameFr: 'Trophonius', nameEn: 'Cave of Trophonius' },
  'e3650-trouduchateaudecarnoet': { nameKo: '카르노에 성의 심연 동굴 [Trou du château de Carnoët / Abyss of Carnoët]', nameKoShort: '카르노에 성의 동굴', nameFr: 'Trou du château de Carnoët', nameEn: 'The Chasm of Carnoët Castle' },
  'e3651-troupefurieuse': { nameKo: '광란의 군세(와일드 헌트) [Troupe furieuse / Furious Host]', nameKoShort: '광란의 군세', nameFr: 'Troupe furieuse', nameEn: 'The Furious Host (Wild Hunt)' },
  'e3652-troupeaux': { nameKo: '목동들의 가축 보호 주술 [Garde des troupeaux / Pastoral Charms]', nameKoShort: '가축 보호 주술', nameFr: 'Troupeaux', nameEn: 'Pastoral Charms for Herds and Flocks' },
  'e3653-trows': { nameKo: '트라우 [Trows / Shetland Trows]', nameKoShort: '트라우', nameFr: 'Trows', nameEn: 'Shetland Trows (Underground Trolls)' },
  'e3654-truie': { nameKo: '물레를 잣는 암퇘지와 질레 술라르 마녀 재판 [Truie / Trial of Gillet-Soulart & his Sow]', nameKoShort: '물레를 잣는 암퇘지 재판', nameFr: 'Truie', nameEn: 'Trial of Gillet-Soulart and the Spinning Sow' },
  'e3655-tschouwasches': { nameKo: '추바시족의 신성한 나뭇가지 다발 이리흐 [Tschouwasches / Chuvash Irikh]', nameKoShort: '추바시족의 신성한 다발', nameFr: 'Tschouwasches', nameEn: 'Chuvash Irikh (Sacred Rosebush Bundle)' },
  'e3656-tullie': { nameKo: '키케로의 딸 툴리아의 불멸의 등불 [Tullie / Tullia’s Tomb & Ever-Burning Lamp]', nameKoShort: '툴리아의 불멸의 등불', nameFr: 'Tullie', nameEn: 'Tullia’s Tomb & The Perpetual Lamp' },
  'e3657-turlupins': { nameKo: '튀를뤼팽파 [Turlupins]', nameKoShort: '튀를뤼팽파', nameFr: 'Turlupins', nameEn: 'The Turlupins (Free Spirit Heretics)' },
  'e3658-turpin': { nameKo: '튀르팽 대주교와 샤를마뉴의 영혼 [Turpin / Archbishop Turpin]', nameKoShort: '튀르팽 대주교', nameFr: 'Turpin', nameEn: 'Archbishop Turpin of Reims' },
  'e3659-tvardowski': { nameKo: '판 트바르도프스키 [Tvardowski / Pan Twardowski]', nameKoShort: '판 트바르도프스키', nameFr: 'Tvardowski', nameEn: 'Pan Twardowski (The Polish Faust)' },
  'e3660-tybilenus': { nameKo: '티빌레누스 [Tybilenus]', nameKoShort: '티빌레누스', nameFr: 'Tybilenus', nameEn: 'Tybilenus (Saxon Evil Spirit)' },
  'e3661-tylwythteglabellefamille': { nameKo: '틸위스 테그 [Tylwyth-Teg / The Fair Family]', nameKoShort: '틸위스 테그', nameFr: 'Tylwyth-Teg (la belle famille)', nameEn: 'Tylwyth Teg (The Fair Family of Wales)' },
  'e3662-tympanites': { nameKo: '팀파니테스(복수 흡혈귀) [Tympanites / Tympanites Vampire]', nameKoShort: '팀파니테스', nameFr: 'Tympanites', nameEn: 'Tympanites (Bloated Vampire)' },
  'e3663-tympanon': { nameKo: '팀파농(숫염소 가죽 가방) [Tympanon / Goat Skin Flagon]', nameKoShort: '팀파농', nameFr: 'Tympanon', nameEn: 'Tympanon (Goat Skin Flagon of the Sabbath)' },
  'e3664-tyre': { nameKo: '튀레(라플란드의 주술 탄환) [Tyre / Sami Magical Ball]', nameKoShort: '튀레', nameFr: 'Tyre', nameEn: 'Tyre (Sami Flying Magical Ball)' },

  // U entries curated headwords (p.672-675)
  'ukobach': { nameKo: '우코바크 [Ukobach]', nameKoShort: '우코바크', nameFr: 'Ukobach', nameEn: 'Ukobach' },
  'e3666-universitesoccultes': { nameKo: '오컬트 비밀 학회와 대학 [Universités occultes / Secret Occult Academies]', nameKoShort: '오컬트 비밀 학회와 대학', nameFr: 'Universités occultes', nameEn: 'Secret Occult Academies' },
  'e3667-uphir': { nameKo: '우피르 [Uphir]', nameKoShort: '우피르', nameFr: 'Uphir', nameEn: 'Uphir' },
  'e3668-upiers': { nameKo: '우피에르 [Upiers / Upir]', nameKoShort: '우피에르', nameFr: 'Upiers', nameEn: 'Upir' },
  'e3669-urda': { nameKo: '우르드 [Urda / Urd]', nameKoShort: '우르드', nameFr: 'Urda', nameEn: 'Urd' },
  'e3670-urgande': { nameKo: '우르간드 [Urgande / Urganda]', nameKoShort: '우르간드', nameFr: 'Urgande', nameEn: 'Urganda the Unknown' },
  'e3671-urine': { nameKo: '소변에 얽힌 민간요법과 기우제 주술 [Urine / Superstition of Urine]', nameKoShort: '소변에 얽힌 민간요법과 주술', nameFr: 'Urine', nameEn: 'Urine in Folk Medicine and Magic' },
  'e3672-urotopegnie': { nameKo: '우로토페그니(매듭 결박 주술서) [Urotopégnie / Urotopegny]', nameKoShort: '우로토페그니', nameFr: 'Urotopégnie', nameEn: 'Urotopegny' },
  'e3673-uterpen': { nameKo: '유서 펜드래건 또는 우테르펜 [Uterpen / Uther Pendragon]', nameKoShort: '유서 펜드래건 또는 우테르펜', nameFr: 'Uterpen', nameEn: 'Uther Pendragon' },
  'e3674-uteseture': { nameKo: '우티세타(야외 철야 강령술) [Utéseture / Útiseta]', nameKoShort: '우티세타', nameFr: 'Utéseture', nameEn: 'Útiseta' },

  // V entries curated headwords (p.675-698)
  'e3675-vaccine': { nameKo: '우두 접종과 백신 미신 [Vaccine]', nameKoShort: '우두 접종과 백신 미신', nameFr: 'Vaccine', nameEn: 'Vaccine' },
  'e3676-vache': { nameKo: '암소에 얽힌 민간 전승 [Vache / Sacred Cow]', nameKoShort: '암소에 얽힌 민간 전승', nameFr: 'Vache', nameEn: 'Sacred Cow' },
  'e3677-vade': { nameKo: '바데 또는 웨이드 [Vade / Wade]', nameKoShort: '바데 또는 웨이드', nameFr: 'Vade', nameEn: 'Wade' },
  'e3678-vafthrudnis': { nameKo: '바프스루드니르 [Vafthrudnis / Vafþrúðnir]', nameKoShort: '바프스루드니르', nameFr: 'Vafthrudnis', nameEn: 'Vafthruthnir' },
  'e3679-vagnoste': { nameKo: '바뇨스트 [Vagnoste]', nameKoShort: '바뇨스트', nameFr: 'Vagnoste', nameEn: 'Vagnoste' },
  'e3680-vaicarani': { nameKo: '바이타라니 강 또는 바이카라니 [Vaïcarani / Vaitarani]', nameKoShort: '바이타라니 강', nameFr: 'Vaïcarani', nameEn: 'Vaitarani River' },
  'e3681-vaisseaufantome': { nameKo: '유령선 [Vaisseau-fantôme / Phantom Ship]', nameKoShort: '유령선', nameFr: 'Vaisseau-fantôme', nameEn: 'Phantom Ship' },
  'e3682-valafar': { nameKo: '발라파르 또는 말라파르 [Valafar, Malaphar]', nameKoShort: '발라파르 또는 말라파르', nameFr: 'Valafar', nameEn: 'Valafar' },
  'e3683-valens': { nameKo: '발렌스 황제 [Valens / Flavius Julius Valens]', nameKoShort: '발렌스 황제', nameFr: 'Valens', nameEn: 'Valens' },
  'e3684-valentin': { nameKo: '발렌티누스 (영지주의 학자) [Valentin / Valentinus]', nameKoShort: '발렌티누스 (영지주의 학자)', nameFr: 'Valentin', nameEn: 'Valentinus' },
  'e3685-valentinbasile': { nameKo: '바실 발랑탱 [Valentin (Basile) / Basil Valentine]', nameKoShort: '바실 발랑탱', nameFr: 'Valentin (Basile)', nameEn: 'Basil Valentine' },
  'e3686-valeremaxime': { nameKo: '발레리우스 막시무스 [Valère-Maxime / Valerius Maximus]', nameKoShort: '발레리우스 막시무스', nameFr: 'Valère-Maxime', nameEn: 'Valerius Maximus' },
  'e3687-valkiries': { nameKo: '발키리 [Valkiries / Valkyries]', nameKoShort: '발키리', nameFr: 'Valkiries', nameEn: 'Valkyries' },
  'e3688-vampires': { nameKo: '흡혈귀 또는 뱀파이어 [Vampires]', nameKoShort: '흡혈귀 또는 뱀파이어', nameFr: 'Vampires', nameEn: 'Vampires' },
  'e3689-vandaleantoine': { nameKo: '안토니 반 달레 [Van-Dale (Antoine) / Antonius van Dale]', nameKoShort: '안토니 반 달레', nameFr: 'Van-Dale (Antoine)', nameEn: 'Antonius van Dale' },
  'e3690-vanlund': { nameKo: '반룬트 [Vanlund / Wayland]', nameKoShort: '반룬트', nameFr: 'Vanlund', nameEn: 'Wayland' },
  'e3691-vapeurs': { nameKo: '안개와 수증기 영혼 미신 [Vapeurs / Vapors]', nameKoShort: '안개와 수증기 영혼 미신', nameFr: 'Vapeurs', nameEn: 'Vapors' },
  'e3692-vapula': { nameKo: '바풀라 또는 나풀라 [Vapula, Naphula]', nameKoShort: '바풀라 또는 나풀라', nameFr: 'Vapula', nameEn: 'Vapula' },
  'e3693-varonnin': { nameKo: '바루나 또는 바론닌 [Varonnin / Varuna]', nameKoShort: '바루나 또는 바론닌', nameFr: 'Varonnin', nameEn: 'Varuna' },
  'e3694-vaudois': { nameKo: '발도파와 보드리 [Vaudois / Waldensians]', nameKoShort: '발도파와 보드리', nameFr: 'Vaudois', nameEn: 'Waldensians' },
  'e3695-vaulxjeande': { nameKo: '장 드 볼크스 [Vaulx (Jean de)]', nameKoShort: '장 드 볼크스', nameFr: 'Vaulx (Jean de)', nameEn: 'Jean de Vaulx' },
  'e3696-vauvert': { nameKo: '보베르 저택의 악마 유령 소동 [Vauvert / Diable Vauvert]', nameKoShort: '보베르 저택의 악마 유령', nameFr: 'Vauvert', nameEn: 'Vauvert Castle Devil' },
  'e3697-veaudor': { nameKo: '황금 송아지 [Veau d’or / Golden Calf]', nameKoShort: '황금 송아지', nameFr: 'Veau d’or', nameEn: 'Golden Calf' },
  'e3698-veaumarin': { nameKo: '바다표범의 심장과 피 주술 [Veau marin / Seal]', nameKoShort: '바다표범의 심장과 피 주술', nameFr: 'Veau marin', nameEn: 'Seal' },
  'e3699-velandleforgeron': { nameKo: '대장장이 벨란트 [Veland le Forgeron / Weyland Smith]', nameKoShort: '대장장이 벨란트', nameFr: 'Veland le Forgeron', nameEn: 'Wayland the Smith' },
  'e3700-velleda': { nameKo: '벨레다 [Velleda]', nameKoShort: '벨레다', nameFr: 'Velleda', nameEn: 'Velleda' },
  'e3701-vendredi': { nameKo: '금요일의 불길한 미신 [Vendredi / Friday]', nameKoShort: '금요일의 불길한 미신', nameFr: 'Vendredi', nameEn: 'Friday Superstitions' },
  'e3702-veneur': { nameKo: '퐁텐블로의 유령 사냥꾼 르 그랑 베뇌르 [Veneur (Le Grand) / The Great Hunter]', nameKoShort: '퐁텐블로의 유령 사냥꾼', nameFr: 'Veneur (Le Grand)', nameEn: 'The Great Hunter of Fontainebleau' },
  'e3703-ventriloques': { nameKo: '복화술과 점술 [Ventriloques / Ventriloquism]', nameKoShort: '복화술과 점술', nameFr: 'Ventriloques', nameEn: 'Ventriloquists' },
  'e3704-vents': { nameKo: '바람을 부르는 매듭 주술 [Vents / Winds]', nameKoShort: '바람을 부르는 매듭 주술', nameFr: 'Vents', nameEn: 'Winds' },
  'e3705-vepar': { nameKo: '베파르 또는 세파르 [Vépar, Separ]', nameKoShort: '베파르 또는 세파르', nameFr: 'Vépar', nameEn: 'Vepar' },
  'e3706-verandi': { nameKo: '베르단디 [Vérandi / Verdandi]', nameKoShort: '베르단디', nameFr: 'Vérandi', nameEn: 'Verdandi' },
  'e3707-verdelet': { nameKo: '베르델레 [Verdelet]', nameKoShort: '베르델레', nameFr: 'Verdelet', nameEn: 'Verdelet' },
  'e3708-verdungmichel': { nameKo: '미셸 베르됭 [Verdung (Michel)]', nameKoShort: '미셸 베르됭', nameFr: 'Verdung (Michel)', nameEn: 'Michel Verdung' },
  'e3709-verge': { nameKo: '수맥 점술 지팡이(다우징) [Verge divinatoire / Dowsing Rod]', nameKoShort: '수맥 점술 지팡이', nameFr: 'Verge', nameEn: 'Dowsing Rod' },
  'e3710-vergedaaron': { nameKo: '아론의 싹 난 지팡이 [Verge d’Aaron / Aaron’s Rod]', nameKoShort: '아론의 싹 난 지팡이', nameFr: 'Verge d’Aaron', nameEn: 'Aaron’s Rod' },
  'e3711-verredeau': { nameKo: '물잔 점술 [Verre d’eau / Water Glass Scrying]', nameKoShort: '물잔 점술', nameFr: 'Verre d’eau', nameEn: 'Water Glass Scrying' },
  'e3712-verrues': { nameKo: '사마귀를 없애는 민간요법 주술 [Verrues / Warts Cure]', nameKoShort: '사마귀를 없애는 민간요법', nameFr: 'Verrues', nameEn: 'Warts Superstition' },
  'e3713-vers': { nameKo: '벌레와 구더기 치유 주술 [Vers / Worms Cure]', nameKoShort: '벌레와 구더기 치유 주술', nameFr: 'Vers', nameEn: 'Worms Superstition' },
  'e3714-vert': { nameKo: '녹색의 악마적 상징 [Vert / Green Color]', nameKoShort: '녹색의 악마적 상징', nameFr: 'Vert', nameEn: 'Green Color Superstition' },
  'e3715-vertjoli': { nameKo: '베르-졸리 [Vert-Joli]', nameKoShort: '베르-졸리', nameFr: 'Vert-Joli', nameEn: 'Vert-Joli' },
  'e3716-verveine': { nameKo: '버베나 또는 버들마편초 [Verveine / Vervain]', nameKoShort: '버베나 또는 버들마편초', nameFr: 'Verveine', nameEn: 'Vervain' },
  'e3717-vespasien': { nameKo: '베스파시아누스 황제 [Vespasien / Titus Flavius Vespasianus]', nameKoShort: '베스파시아누스 황제', nameFr: 'Vespasien', nameEn: 'Vespasian' },
  'e3718-vesta': { nameKo: '베스타 여신 [Vesta]', nameKoShort: '베스타 여신', nameFr: 'Vesta', nameEn: 'Vesta' },
  'e3719-vetementsdesmorts': { nameKo: '망자의 옷에 얽힌 민간 미신 [Vêtements des morts]', nameKoShort: '망자의 옷에 얽힌 미신', nameFr: 'Vêtements des morts', nameEn: 'Clothes of the Dead' },
  'e3720-vetin': { nameKo: '베틴 [Vétin / Wetti]', nameKoShort: '베틴', nameFr: 'Vétin', nameEn: 'Wetti' },
  'e3721-veupacha': { nameKo: '베우-파샤 [Veu-Pacha]', nameKoShort: '베우-파샤', nameFr: 'Veu-Pacha', nameEn: 'Veu-Pacha' },
  'e3722-viaram': { nameKo: '비아람 또는 비람 [Viaram]', nameKoShort: '비아람 또는 비람', nameFr: 'Viaram', nameEn: 'Viaram' },
  'e3723-vidaldelaporte': { nameKo: '비달 드 라 포르트 [Vidal de la Porte]', nameKoShort: '비달 드 라 포르트', nameFr: 'Vidal de la Porte', nameEn: 'Vidal de la Porte' },
  'e3724-vidblain': { nameKo: '비드블라인 [Vid-Blain / Vithblain]', nameKoShort: '비드블라인', nameFr: 'Vid-Blain', nameEn: 'Vidblain' },
  'e3725-vieille': { nameKo: '노파 유령의 흉조 [Vieille (La) / The Old Woman Spectre]', nameKoShort: '노파 유령의 흉조', nameFr: 'Vieille', nameEn: 'The Old Woman Spectre' },
  'e3726-villainlabbe': { nameKo: '에티엔 빌랭 수도원장 [Villain (l’abbé) / Étienne-François Villain]', nameKoShort: '에티엔 빌랭 수도원장', nameFr: 'Villain (l’abbé)', nameEn: 'Abbé Étienne-François Villain' },
  'e3727-villarslabbede': { nameKo: '앙리 드 빌라르 수도원장 [Villars (l’abbé de) / Montfaucon de Villars]', nameKoShort: '앙리 드 빌라르 수도원장', nameFr: 'Villars (l’abbé de)', nameEn: 'Abbé de Montfaucon de Villars' },
  'e3728-villiersflorentde': { nameKo: '플로랑 드 빌리에 [Villiers (Florent de)]', nameKoShort: '플로랑 드 빌리에', nameFr: 'Villiers (Florent de)', nameEn: 'Florent de Villiers' },
  'e3729-vine': { nameKo: '비네 또는 비네아 [Viné / Vine]', nameKoShort: '비네 또는 비네아', nameFr: 'Vine', nameEn: 'Vine' },
  'e3730-vipere': { nameKo: '독사(살무사)에 얽힌 마술 미신 [Vipère / Viper]', nameKoShort: '독사에 얽힌 마술 미신', nameFr: 'Vipère', nameEn: 'Viper Superstition' },
  'e3731-virgile': { nameKo: '베르길리우스 (1부: 중세 전설의 대마법사) [Virgile / Virgil (Part I)]', nameKoShort: '베르길리우스 (1부)', nameFr: 'Virgile (Partie I)', nameEn: 'Virgil the Magician (Part I)' },
  'e3732-virgile': { nameKo: '베르길리우스 (2부: 잘츠부르크의 성직자) [Virgile / Saint Virgilius (Part II)]', nameKoShort: '베르길리우스 (2부)', nameFr: 'Virgile (Partie II)', nameEn: 'Virgilius of Salzburg (Part II)' },
  'e3733-visions': { nameKo: '환영과 환각의 역사적 고찰 [Visions]', nameKoShort: '환영과 환각의 고찰', nameFr: 'Visions', nameEn: 'Visions and Apparitions' },
  'e3734-voceratrices': { nameKo: '보체라트리체(코르시카의 곡비) [Vocératrices / Voceratrici]', nameKoShort: '보체라트리체', nameFr: 'Vocératrices', nameEn: 'Voceratrici' },
  'e3735-voile': { nameKo: '시신을 덮는 베일의 미신 [Voile / Shroud Veil]', nameKoShort: '시신을 덮는 베일의 미신', nameFr: 'Voile', nameEn: 'Shroud Veil Superstition' },
  'e3736-voisinla': { nameKo: '라 부아쟁 [Voisin (la) / Catherine Monvoisin]', nameKoShort: '라 부아쟁', nameFr: 'Voisin (la)', nameEn: 'La Voisin' },
  'e3737-voituredudiable': { nameKo: '악마의 마차 소동 [Voiture du diable / Devil’s Carriage]', nameKoShort: '악마의 마차 소동', nameFr: 'Voiture du diable', nameEn: 'Devil’s Carriage' },
  'e3738-voix': { nameKo: '빙의자의 목소리와 공중의 음성 [Voix / Voices]', nameKoShort: '빙의자의 목소리와 공중의 음성', nameFr: 'Voix', nameEn: 'Voices of the Possessed' },
  'volac': { nameKo: '볼라크 또는 발락 [Volac, Valac]', nameKoShort: '볼라크 또는 발락', nameFr: 'Volac (Valac)', nameEn: 'Volac' },
  'e3740-voletmarie': { nameKo: '마리 볼레 [Volet (Marie)]', nameKoShort: '마리 볼레', nameFr: 'Volet (Marie)', nameEn: 'Marie Volet' },
  'e3741-vols': { nameKo: '부스트 또는 밀랍 인형 저주술 [Vols, Voust / Poppet Curse]', nameKoShort: '부스트 또는 밀랍 인형 저주술', nameFr: 'Vols', nameEn: 'Wax Poppet Curse' },
  'e3742-volta': { nameKo: '볼타 [Volta]', nameKoShort: '볼타', nameFr: 'Volta', nameEn: 'Volta Monster' },
  'e3743-voltaire': { nameKo: '볼테르 [Voltaire / François-Marie Arouet]', nameKoShort: '볼테르', nameFr: 'Voltaire', nameEn: 'Voltaire' },
  'e3744-voltigeurhollandais': { nameKo: '방황하는 네덜란드인 (1부: 바다의 저주받은 유령선) [Voltigeur hollandais / Flying Dutchman (Part I)]', nameKoShort: '방황하는 네덜란드인 (1부)', nameFr: 'Voltigeur hollandais (Partie I)', nameEn: 'The Flying Dutchman (Part I)' },
  'e3745-voltigeurhollandais': { nameKo: '방황하는 네덜란드인 (2부: 유령선의 목격담과 재앙) [Voltigeur hollandais / Flying Dutchman (Part II)]', nameKoShort: '방황하는 네덜란드인 (2부)', nameFr: 'Voltigeur hollandais (Partie II)', nameEn: 'The Flying Dutchman (Part II)' },
  'e3746-vondel': { nameKo: '요스트 판 덴 본델 [Vondel / Joost van den Vondel]', nameKoShort: '요스트 판 덴 본델', nameFr: 'Vondel', nameEn: 'Joost van den Vondel' },
  'e3747-vouivre': { nameKo: '부아브르 또는 뷔브르 [Vouivre / Wyvern]', nameKoShort: '부아브르 또는 뷔브르', nameFr: 'Vouivre', nameEn: 'Vouivre' },
  'voyages-sorcerers': { nameKo: '빗자루를 탄 마녀의 여행 [Voyages des sorcières / Journey of the Witches]', nameKoShort: '빗자루를 탄 마녀의 여행', nameFr: 'Voyages des sorcières', nameEn: 'Journey of the Witches' },
  'e3749-vroucolacas': { nameKo: '브루콜라카스 [Vroucolacas / Vrykolakas]', nameKoShort: '브루콜라카스', nameFr: 'Vroucolacas', nameEn: 'Vrykolakas' },
  'e3750-vue': { nameKo: '마녀의 눈빛과 투시안 [Vue / Sight and Second Sight]', nameKoShort: '마녀의 눈빛과 투시안', nameFr: 'Vue', nameEn: 'Evil Eye and Second Sight' },

  // W entries curated headwords (p.698-702)
  'e3751-waeterelvesfeesdeseaux': { nameKo: '워터 엘프 또는 물의 요정 [Waeter-Elves (Fées des eaux)]', nameKoShort: '워터 엘프 또는 물의 요정', nameFr: 'Waeter-Elves (Fées des eaux)', nameEn: 'Water-Elves' },
  'e3752-wakemanrhoda': { nameKo: '로다 웨이크먼 사건 (1부: 광신적 종말론) [Wakeman (Rhoda) (Part I)]', nameKoShort: '로다 웨이크먼 사건 (1부)', nameFr: 'Wakeman (Rhoda) (Partie I)', nameEn: 'Rhoda Wakeman (Part I)' },
  'e3753-wakeman': { nameKo: '로다 웨이크먼 사건 (2부: 구마 살인과 재판) [Wakeman (Rhoda) (Part II)]', nameKoShort: '로다 웨이크먼 사건 (2부)', nameFr: 'Wakeman (Rhoda) (Partie II)', nameEn: 'Rhoda Wakeman (Part II)' },
  'e3754-walhalla': { nameKo: '발할라 [Walhalla / Valhalla]', nameKoShort: '발할라', nameFr: 'Walhalla', nameEn: 'Valhalla' },
  'e3755-walkiries': { nameKo: '발키리 [Walkiries / Valkyries]', nameKoShort: '발키리', nameFr: 'Walkiries', nameEn: 'Valkyries' },
  'wall': { nameKo: '발 또는 부알 [Wall, Vual, Uvall]', nameKoShort: '발 또는 부알', nameFr: 'Wall (Vual)', nameEn: 'Vual' },
  'e3757-walter': { nameKo: '발터 기사 전설 [Walter]', nameKoShort: '발터 기사 전설', nameFr: 'Walter', nameEn: 'Sir Walter' },
  'e3758-walterscott': { nameKo: '월터 스콧 경의 악마학 서간 (1부: 문학가의 악마학 고찰) [Walter Scott / Letters on Demonology (Part I)]', nameKoShort: '월터 스콧 경의 악마학 서간 (1부)', nameFr: 'Walter-Scott (Partie I)', nameEn: 'Sir Walter Scott (Part I)' },
  'e3759-danslapremierelettre': { nameKo: '월터 스콧 경의 악마학 서간 (2부: 10개 서간 요약 해제) [Walter Scott / Letters on Demonology (Part II)]', nameKoShort: '월터 스콧 경의 악마학 서간 (2부)', nameFr: 'Walter-Scott (Partie II)', nameEn: 'Sir Walter Scott (Part II)' },
  'e3760-wattierpierre': { nameKo: '피에르 와티에 [Wattier (Pierre)]', nameKoShort: '피에르 와티에', nameFr: 'Wattier (Pierre)', nameEn: 'Pierre Wattier' },
  'e3761-wechselbalg': { nameKo: '벡셀발크 또는 체인질링 [Wechselbalg / Changeling]', nameKoShort: '벡셀발크 또는 체인질링', nameFr: 'Wechselbalg', nameEn: 'Changeling' },
  'e3762-welzandre': { nameKo: '앙드레 벨츠 [Welz (André)]', nameKoShort: '앙드레 벨츠', nameFr: 'Welz (André)', nameEn: 'André Welz' },
  'e3763-wenhamjane': { nameKo: '제인 웨넘 [Wenham (Jane)]', nameKoShort: '제인 웨넘', nameFr: 'Wenham (Jane)', nameEn: 'Jane Wenham' },
  'e3764-wesley': { nameKo: '웨슬리 목사관의 폴터가이스트 [Wesley (Epworth Poltergeist)]', nameKoShort: '웨슬리 목사관의 폴터가이스트', nameFr: 'Wesley (Epworth)', nameEn: 'Epworth Poltergeist' },
  'e3765-wiclef': { nameKo: '존 위클리프 [Wiclef / John Wycliffe]', nameKoShort: '존 위클리프', nameFr: 'Wiclef', nameEn: 'John Wycliffe' },
  'e3766-wierus': { nameKo: '요한 바이어 [Wierus / Johann Weyer]', nameKoShort: '요한 바이어', nameFr: 'Wierus', nameEn: 'Johann Weyer' },
  'e3767-wilis': { nameKo: '윌리 또는 빌리 [Wilis / Vilis]', nameKoShort: '윌리 또는 빌리', nameFr: 'Wilis', nameEn: 'Vilis' },
  'e3768-wiulmerozguillaume': { nameKo: '기욤 드 비울메로즈 [Wiulmeroz (Guillaume)]', nameKoShort: '기욤 드 비울메로즈', nameFr: 'Wiulmeroz (Guillaume)', nameEn: 'Guillaume Wiulmeroz' },
  'e3769-wivre': { nameKo: '부아브르 또는 뷔브르 [Wivre / Vouivre]', nameKoShort: '부아브르 또는 뷔브르', nameFr: 'Wivre', nameEn: 'Vouivre' },
  'e3770-woden': { nameKo: '보덴 또는 오딘 [Woden / Odin]', nameKoShort: '보덴 또는 오딘', nameFr: 'Woden', nameEn: 'Odin' },
  'e3771-wolotys': { nameKo: '볼로티 거인족 [Wolotys / Voloty]', nameKoShort: '볼로티 거인족', nameFr: 'Wolotys', nameEn: 'Voloty' },
  'e3772-woodward': { nameKo: '제임스 우드워드 [Woodward (James)]', nameKoShort: '제임스 우드워드', nameFr: 'Woodward (James)', nameEn: 'James Woodward' },
  'e3773-wortigern': { nameKo: '보티건 [Wortigern / Vortigern]', nameKoShort: '보티건', nameFr: 'Wortigern', nameEn: 'Vortigern' },
  'e3774-wulsondelacolombieremarc': { nameKo: '마르크 불송 드 라 콜롱비에르 [Wulson de la Colombière (Marc)]', nameKoShort: '마르크 불송 드 라 콜롱비에르', nameFr: 'Wulson de la Colombière (Marc)', nameEn: 'Marc de Vulson' },

  // X entries curated headwords (p.705-707)
  'e3775-xacca': { nameKo: '샤카 또는 석가모니 [Xacca / Shakyamuni]', nameKoShort: '샤카 또는 석가모니', nameFr: 'Xacca', nameEn: 'Shakyamuni' },
  'xaphan': { nameKo: '자판 또는 크사판 [Xaphan]', nameKoShort: '자판 또는 크사판', nameFr: 'Xaphan', nameEn: 'Xaphan' },
  'e3777-xeirscopie': { nameKo: '크세이로스코피 또는 수상관찰술 (1부) [Xeirscopie / Cheiroscopy (Part I)]', nameKoShort: '크세이로스코피 또는 수상관찰술 (1부)', nameFr: 'Xeirscopie (Partie I)', nameEn: 'Cheiroscopy (Part I)' },
  'e3778-xeirscopie': { nameKo: '크세이로스코피 또는 수상관찰술 (2부) [Xeirscopie / Cheiroscopy (Part II)]', nameKoShort: '크세이로스코피 또는 수상관찰술 (2부)', nameFr: 'Xeirscopie (Partie II)', nameEn: 'Cheiroscopy (Part II)' },
  'e3779-xerxes': { nameKo: '크세르크세스 1세의 예지몽 [Xerxès / Xerxes I]', nameKoShort: '크세르크세스 1세의 예지몽', nameFr: 'Xerxès', nameEn: 'Xerxes I' },
  'e3780-xezbeth': { nameKo: '크세즈베트 [Xezbeth]', nameKoShort: '크세즈베트', nameFr: 'Xezbeth', nameEn: 'Xezbeth' },
  'e3781-xitragupten': { nameKo: '치트라굽타 또는 크시트라굽텐 [Xitragupten / Chitragupta]', nameKoShort: '치트라굽타 또는 크시트라굽텐', nameFr: 'Xitragupten', nameEn: 'Chitragupta' },
  'e3782-xylomancie': { nameKo: '크실로망시(나무 점술) [Xylomancie / Xylomancy]', nameKoShort: '크실로망시(나무 점술)', nameFr: 'Xylomancie', nameEn: 'Xylomancy' },

  // Y entries curated headwords (p.707-711)
  'e3783-yagababa': { nameKo: '야가-바바 또는 바바 야가 [Yaga-Baba / Baba Yaga]', nameKoShort: '야가-바바 또는 바바 야가', nameFr: 'Yaga-Baba', nameEn: 'Baba Yaga' },
  'e3784-yakouts': { nameKo: '야쿠트족 [Yakouts / Yakuts]', nameKoShort: '야쿠트족', nameFr: 'Yakouts', nameEn: 'Yakuts' },
  'yan-gant-y-tan': { nameKo: '얀 강 이 탄 [Yan-gant-y-tan]', nameKoShort: '얀 강 이 탄', nameFr: 'Yan-gant-y-tan', nameEn: 'Yan-gant-y-tan' },
  'e3786-yasdh': { nameKo: '야쉬드 또는 야쉬트 [Yasdh / Yashd]', nameKoShort: '야쉬드 또는 야쉬트', nameFr: 'Yasdh', nameEn: 'Yashd' },
  'e3787-ychainbonawgs': { nameKo: '이카인-바나옥 [Ychain-bonawgs / Ychain Bannog]', nameKoShort: '이카인-바나옥', nameFr: 'Ychain-bonawgs', nameEn: 'Ychain Bannog' },
  'e3788-yenvang': { nameKo: '옌왕 또는 염라대왕 [Yen-vang / Yanwang]', nameKoShort: '옌왕 또는 염라대왕', nameFr: 'Yen-vang', nameEn: 'Yanwang' },
  'e3789-yesdhoon': { nameKo: '예스둔 또는 야즈단 [Yesdhoon / Yazdan]', nameKoShort: '예스둔 또는 야즈단', nameFr: 'Yesdhoon', nameEn: 'Yazdan' },
  'e3790-yermoloff': { nameKo: '예르몰로프 [Yermoloff / Aleksey Yermolov]', nameKoShort: '예르몰로프', nameFr: 'Yermoloff', nameEn: 'Aleksey Yermolov' },
  'e3791-yeux': { nameKo: '악마의 눈과 마안 [Yeux / Evil Eye]', nameKoShort: '악마의 눈과 마안', nameFr: 'Yeux', nameEn: 'Evil Eye' },
  'e3792-yffrotte': { nameKo: '이프로테 [Yffrotte / Frotho]', nameKoShort: '이프로테', nameFr: 'Yffrotte', nameEn: 'Frotho' },
  'e3793-yormoungandour': { nameKo: '요르문간드 [Yormoungandour / Jörmungandr]', nameKoShort: '요르문간드', nameFr: 'Yormoungandour', nameEn: 'Jörmungandr' },
  'e3794-youfmarieanne': { nameKo: '마리-안 유프 [Youf (Marie-Anne)]', nameKoShort: '마리-안 유프', nameFr: 'Youf (Marie-Anne)', nameEn: 'Marie-Anne Youf' },
  'e3795-youma': { nameKo: '유마 또는 유말라 [Youma / Jumala]', nameKoShort: '유마 또는 유말라', nameFr: 'Youma', nameEn: 'Jumala' },

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
  const rawKey = `${raw.nameFr.toLowerCase()}@@${raw.page1863}`;
  const c = (id && CURATED_HEADWORD_RULES[id]) || CURATED_HEADWORD_RULES[rawKey];
  if (c) {
    return {
      nameKo: c.nameKo,
      nameKoShort: c.nameKoShort || c.nameKo.replace(/\s*\[.*\]$/, ''),
      nameFr: c.nameFr || (matchedPlate ? matchedPlate.nameFr : raw.nameFr),
      nameEn: c.nameEn || ''
    };
  }

  if (matchedPlate) {
    return {
      nameKo: matchedPlate.nameKo,
      nameKoShort: matchedPlate.nameKoShort || matchedPlate.nameKo.replace(/\s*\[.*\]$/, ''),
      nameFr: matchedPlate.nameFr,
      nameEn: matchedPlate.nameEn || ''
    };
  }
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
  // R entries curated meta (p.569-586)
  'e3172-rabbats': { category: 'myth', rank: '가정의 소음 요정·코볼트(Lutin tapageur)', domains: ["미신·민속(Superstition)","가정 정령·소령","폴터가이스트","민간 전승"] },
  'e3173-rabbins': { category: 'superstition', rank: '카발라와 유대 신비주의 전승(Traditions Cabalistiques et Magie)', domains: ["미신·민속(Superstition)","유대 카발라","비전 신비주의","골렘과 부적"] },
  'e3174-rabdomancie': { category: 'divination', rank: '지팡이와 막대기를 이용한 점술(Divination par la Baguette)', domains: ["점술·예언(Divination)","고대 점술","수맥 탐사봉","성서 시대 미신"] },
  'e3175-rachaders': { category: 'myth', rank: '인도 신화의 악령과 식인귀(Génies malfaisants des Indiens)', domains: ["신화·전설(Mythologie)","인도 신화","악령과 나찰","동양 전승"] },
  'e3176-radcliffeanne': { category: 'person', rank: '영국 고딕 소설 문학의 개척자(Romancière Gothique Anglaise)', domains: ["인물·역사(Personnage)","고딕 문학","유령 소설","『우돌포의 비밀』"] },
  'e3177-ragalomancie': { category: 'divination', rank: '수조와 목말뼈를 이용한 고대 비전 점술(Divination par Bassins et Osselets)', domains: ["점술·예언(Divination)","고대 점술","수조점과 주사위","비전 복술"] },
  'e3178-rage': { category: 'superstition', rank: '광견병에 대항하는 부적과 주술(Charmes contre la Rage)', domains: ["미신·민속(Superstition)","민간요법","주술 부적","악마의 병 미신"] },
  'e3179-raginis': { category: 'myth', rank: '인도 전통의 천상 정령과 음악의 여신(Nymphes et Déesses de la Musique)', domains: ["신화·전설(Mythologie)","인도 신화","음악과 라가","천상 정령"] },
  'e3180-ragusegeorgede': { category: 'person', rank: '파도바 대학교의 철학 교수이자 점술 연구가(Professeur à Padoue)', domains: ["인물·역사(Personnage)","파도바 대학","1623년 문헌","점술과 카발라 연구"] },
  'rahouart': { category: 'demon', rank: '중세 종교극의 수전노 영혼 수거 악마(Démon Collecteur d\'Âmes)', domains: ["악마학(Démonologie)","1863 원서 삽화 수록","루이 브르통 68대 목판화","중세 도덕극","나쁜 부자 전설"] },
  'e3182-raiz': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["인물·역사(Personnage)","상호참조","질 드 레"] },
  'e3183-raidemariedela': { category: 'person', rank: '10세에 사바트에 입문한 바스크 마녀(Sorcière Basque)', domains: ["인물·역사(Personnage)","마녀재판","사바트 고백","피에르 드 랑크르"] },
  'e3184-raleighwalter': { category: 'person', rank: '영국의 탐험가이자 황금향 엘도라도 탐사자(Navigateur et Écrivain)', domains: ["인물·역사(Personnage)","신대륙 탐험","황금향 엘도라도","가슴에 얼굴 달린 괴물 블레미에스"] },
  'e3185-rambouillet': { category: 'superstition', rank: '사후 출현 서약과 전쟁터의 망령(Pacte d\'Apparition d\'Outre-Tombe)', domains: ["미신·민속(Superstition)","유령과 망령","사후 출현 서약","17세기 프랑스 귀족"] },
  'e3186-ranfaingmariede': { category: 'person', rank: '17세기 로렌의 유명한 빙의 피해자이자 수녀원 설립자(Possédée de Lorraine)', domains: ["인물·역사(Personnage)","악마 빙의","구마 의식","로렌 공국 역사"] },
  'e3187-ranirazal': { category: 'myth', rank: '인도 사트푸라 민간 신앙의 수호 여신(Déesse Vénérée des Indiens)', domains: ["신화·전설(Mythologie)","인도 민속 신앙","혼인 수호신","신성한 나무 숭배"] },
  'e3188-rannou': { category: 'myth', rank: '브르타뉴 해안의 인어 은혜 갚기 전설(Légende Bretonne de la Sirène)', domains: ["신화·전설(Mythologie)","브르타뉴 민담","인어 전설","바다의 요정"] },
  'e3189-raolletjacques': { category: 'person', rank: '앙제 고등법원에서 사형을 선고받은 늑대인간(Loup-Garou d\'Angers)', domains: ["인물·역사(Personnage)","늑대인간(루가루)","16세기 마녀재판","식인 변신수"] },
  'e3190-rat': { category: 'superstition', rank: '전쟁과 재앙을 예고하는 동물의 징조(Présages et Superstitions des Rats)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","동물 징조","고대 로마 예언","침몰선 탈출"] },
  'e3191-raum': { category: 'demon', rank: '지옥의 대백작(Grand Comte aux Enfers)', legions: 30, domains: ["악마학(Démonologie)","솔로몬 72악마","좌천사 계급","도시 파괴와 화해"] },
  'e3192-realisme': { category: 'superstition', rank: '19세기 유물론적 자연주의 철학 비판(Critique du Matérialisme)', domains: ["미신·민속(Superstition)","19세기 사상 비판","쥘 미슐레와 오귀스트 콩트","자연주의 미신"] },
  'e3193-redcap': { category: 'demon', rank: '스코틀랜드 변경의 흉포한 고블린(Lutin Malfaisant Écossais)', domains: ["악마학(Démonologie)","스코틀랜드 민속","폐허 고성의 살인귀","퍽 상호참조"] },
  'e3194-regard': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","마안(이블 아이)"] },
  'e3195-regensberg': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["악마학(Démonologie)","상호참조","사역마"] },
  'e3196-regiomontanus': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["인물·역사(Personnage)","상호참조","자동인형과 점성술"] },
  'e3197-reidthomas': { category: 'person', rank: '스코틀랜드 상식학파 철학의 창시자(Philosophe Écossais)', domains: ["인물·역사(Personnage)","스코틀랜드 철학","상식학파","회의론 반박"] },
  'e3198-reineguetet': { category: 'demon', rank: '사바트에서 여장을 하고 나타나는 악마(Démon en Habit de Femme)', domains: ["악마학(Démonologie)","사바트 전승","마녀 집회","악마의 둔갑"] },
  'e3199-reinesdusabbat': { category: 'superstition', rank: '마녀 집회에서 악마의 짝으로 추대된 필멸자 마녀(Reines Humaines du Sabbat)', domains: ["미신·민속(Superstition)","사바트 의식","마녀재판 증언","악마의 연회"] },
  'e3200-religion': { category: 'superstition', rank: '고대 다신교 신화와 성서 원형론 고찰(Mythologie Comparée et Révélation)', domains: ["미신·민속(Superstition)","비교신화학","원시 계시론","이교 신들의 성서적 변형"] },
  'e3201-reminicolas': { category: 'person', rank: '로렌 공국의 대법관이자 악마학 저술가(Procureur Général de Lorraine)', domains: ["인물·역사(Personnage)","악마학자","『악마숭배론』","로렌 마녀재판"] },
  'e3202-remmon': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["악마학(Démonologie)","상호참조","시리아의 우상"] },
  'e3203-remords': { category: 'superstition', rank: '죄책감이 불러일으킨 유령 출현 전설(Revenants Nés du Remords)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","호엔촐레른 백색 부인","영아 살해 전설","올라뮌데 백작부인"] },
  'e3204-remore': { category: 'superstition', rank: '배를 멈추고 바다를 얼린다는 전설의 물고기(Poisson Magique Glacial)', domains: ["미신·민속(Superstition)","바다 괴물과 박물지","시라노 드 베르주라크","고대 항해 미신"] },
  'e3205-remures': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["신화·전설(Mythologie)","상호참조","로마의 사령"] },
  'e3206-renards': { category: 'myth', rank: '인간을 홀리고 영혼이 깃드는 영물(Renards Fantastiques et Possessions)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","일본 신토와 요괴(키츠네)","구미호 전설","빙의 동물"] },
  'e3207-repare': { category: 'person', rank: '12세기 연옥과 지옥, 천국의 환시를 본 인물(Visionnaire du Purgatoire)', domains: ["인물·역사(Personnage)","중세 사후세계 환시","연옥과 지옥","영적 체험"] },
  'e3208-repasdumort': { category: 'superstition', rank: '무덤에서 망자의 넋을 기리는 고대 제례(Banquets Funéraires Anciens)', domains: ["미신·민속(Superstition)","장례 풍습","조상 숭배","사후세계 음식 공양"] },
  'e3209-repasdusabbat': { category: 'superstition', rank: '악마를 찬양하며 치러지는 밤의 기괴한 향연(Festin Infernal du Sabbat)', domains: ["미신·민속(Superstition)","사바트 의식","식인과 영아 살해","소금 없는 악마 음식"] },
  'e3210-resurrection': { category: 'superstition', rank: '조로아스터교·파르시의 종말론적 육체 부활관(Croyances Parsies de la Résurrection)', domains: ["미신·민속(Superstition)","조로아스터교 종말론","파르시 전통","종말의 정화와 새 세상"] },
  'e3211-retz': { category: 'person', rank: '프랑스의 원수이자 연금술 흑마술 연루자(Maréchal de France et Barbe-Bleue)', domains: ["인물·역사(Personnage)","백년전쟁과 잔 다르크","푸른 수염의 원형","연금술과 인신공양"] },
  'e3212-retz': { category: 'person', rank: '프롱드의 난 주역이자 프랑스의 정치가(Cardinal et Mémorialiste)', domains: ["인물·역사(Personnage)","프랑스 정치가·추기경","생클루 유령 조우","회고록의 괴담"] },
  'e3213-reve': { category: 'superstition', rank: '복권 번호와 미래를 점치는 수면 미신(Songes et Présages Oniriques)', domains: ["미신·민속(Superstition)","꿈과 해몽","왕실 복권 미신","몽유병과 환각"] },
  'e3214-reveillematin': { category: 'superstition', rank: '유독성 유액을 지닌 마법 식물(Plante Magique et Toxique)', domains: ["미신·민속(Superstition)","식물 민속","악마의 풀","플랑드르 민간의학"] },
  'e3215-revelations': { category: 'superstition', rank: '원거리 참사와 국가 변란의 영적 예고(Avertissements Célestes et Visions)', domains: ["미신·민속(Superstition)","신비 계시","모리스 황제 암살 전조","원격 감응 예언"] },
  'e3216-revenants': { category: 'superstition', rank: '무덤에서 돌아와 산 자를 찾는 원혼과 육체 유령(Morts-Vivants et Ombres)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","유령과 망령","망자의 한기","지롤라모 카르다노 증언"] },
  'e3217-rhapsodomancie': { category: 'divination', rank: '고대 서사시를 무작위로 펼쳐 미래를 점치는 점술(Sortes Homericae et Virgilianae)', domains: ["점술·예언(Divination)","1863 원서 삽화 수록","호메로스 점술","베르길리우스 점술","서지점(비블리오망시)"] },
  'e3218-rhombus': { category: 'superstition', rank: '회전을 통해 마법적 바람과 정념을 일으키는 주술 도구(Toupie Magique)', domains: ["미신·민속(Superstition)","고대 그리스 마법","주술 팽이와 회전구","사랑의 미약과 매혹"] },
  'e3219-rhone': { category: 'myth', rank: '알프스 눈 녹은 물을 타고 내려오는 강의 정령(Monstre Aquatique du Rhône)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","프랑스 강 전설","타라스크와 수룡","황금 구체의 악마"] },
  'e3220-rhotomago': { category: 'demon', rank: '오컬트 환상 문학 속 지옥의 마법 총재(Grand Maître des Enchanteurs)', domains: ["악마학(Démonologie)","1863 원서 삽화 수록","베르비기에의 『소악마』","마법사들의 지배자"] },
  'e3221-rhune': { category: 'superstition', rank: '바스크 지방의 전설적인 사바트 성지(Bosquet du Bouc)', domains: ["미신·민속(Superstition)","바스크 마녀재판","피에르 드 랑크르","사바트 성지"] },
  'e3222-ribadinjeannette': { category: 'person', rank: '16세기 말 바스크 지방의 마녀재판 피고인(Sorcière Basque)', domains: ["인물·역사(Personnage)","마녀재판","사바트 고백","바스크 역사"] },
  'ribesal': { category: 'demon', rank: '실레지아 거인산맥의 영주이자 거인 산령(Seigneur des Monts Géants)', domains: ["악마학(Démonologie)","1863 원서 삽화 수록","루이 브르통 68대 목판화","독일·보헤미아 민속","날씨 조종 산령"] },
  'e3224-richardcoeurdelion': { category: 'person', rank: '십자군 전쟁의 영웅이자 잉글랜드 국왕(Roi d\'Angleterre et Croisé)', domains: ["인물·역사(Personnage)","십자군 전쟁","잉글랜드 역사","악마의 가문 전설"] },
  'e3225-richardsanspeur': { category: 'myth', rank: '노르망디 공작이자 기사도 모험 전설의 주인공(Duc de Normandie)', domains: ["신화·전설(Mythologie)","노르망디 중세 전설","악마 로베르 전승","악마 서큐버스 신부"] },
  'e3226-richelieu': { category: 'person', rank: '루이 15세 시대의 프랑스 원수이자 궁정 외교관(Maréchal de France)', domains: ["인물·역사(Personnage)","18세기 프랑스 궁정","벨제불 소환 연루","네크로맨시 스캔들"] },
  'e3227-rickiusjacques': { category: 'person', rank: '16세기 독일의 법학자이자 마녀 수침 재판 옹호론자(Juriste Rhénan)', domains: ["인물·역사(Personnage)","마녀재판 법학","수침 시험(냉수 시험)","1597년 쾰른 간행"] },
  'e3228-rigouxmaitre': { category: 'demon', rank: '사바트를 주재하는 악마의 이명(Nom du Diable Président)', domains: ["악마학(Démonologie)","사바트 전승","악마의 가명","프랑스 마녀재판"] },
  'e3229-rimmon': { category: 'demon', rank: '지옥 제국의 수석 시의(Premier Médecin de l\'Empire Infernal)', domains: ["악마학(Démonologie)","지옥의 직책","시리아 다마스쿠스의 고대 신","나병 치료와 폭풍우"] },
  'e3230-riviererochlebaillifsieurdel': { category: 'person', rank: '앙리 4세의 수석 주치의이자 파라켈수스파 연금술 점성가(Médecin de Henri IV)', domains: ["인물·역사(Personnage)","파라켈수스주의","궁정 점성술","1605년 사망"] },
  'e3231-robert': { category: 'demon', rank: '사바트를 관장하고 처녀들을 홀린 악령(Démon Évocateur)', domains: ["악마학(Démonologie)","악마 빙의","사바트 주재자","마녀재판 기록"] },
  'e3232-robertlediable': { category: 'myth', rank: '악마의 자식으로 태어나 참회로 성자가 된 전설의 영웅(Héros Légendaire Normand)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","노르망디 전설","마이어베어 오페라","회개와 구원"] },
  'e3233-robert': { category: 'person', rank: '프랑스 국왕 필리프 6세를 저주한 주술 혐의자(Accusé d\'Envoûtement)', domains: ["인물·역사(Personnage)","중세 마법 재판","밀랍 인형 주살(인보우트망)","1331년 추방"] },
  'e3234-robert': { category: 'person', rank: '프랑스 카페 왕조의 군주이자 근친혼 파문 국왕(Roi Pieux de France)', domains: ["인물·역사(Personnage)","카페 왕조","교황 그레고리오 5세 파문","거위 머리 괴물 탄생 전설"] },
  'e3235-robinhood': { category: 'myth', rank: '영국의 전설적 의적이자 숲의 요정(Héros Populaire Anglais)', domains: ["신화·전설(Mythologie)","상호참조","영국 셔우드 숲 전설","퍽(로빈 구드펠로)"] },
  'e3236-robinetdevaulx': { category: 'person', rank: '15세기 아라스 마녀재판의 거짓 은둔자(Faux Ermite et Sorcier)', domains: ["인물·역사(Personnage)","아라스 마녀재판","거짓 은둔자","사바트 혐의"] },
  'e3237-rocayamariede': { category: 'person', rank: '16세기 말 바스크 지방의 악명 높은 마녀(Célèbre Sorcière Basque)', domains: ["인물·역사(Personnage)","바스크 마녀재판","피에르 드 랑크르","사형 선고"] },
  'e3238-rodenstein': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["신화·전설(Mythologie)","상호참조","야생의 사냥(와일드 헌트)"] },
  'e3239-roderik': { category: 'person', rank: '서고트 왕국의 마지막 군주이자 마법의 탑 전설(Dernier Roi Wisigoth)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","스페인 서고트 왕국","톨레도 마법의 탑","무어인의 정복"] },
  'e3240-rodriguezignazio': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["인물·역사(Personnage)","상호참조","종교재판소"] },
  'e3241-roisdelenfer': { category: 'demon', rank: '지옥의 최고 통치 군주단(Sept Rois de la Monarchie Infernale)', domains: ["악마학(Démonologie)","지옥의 위계","솔로몬의 마법서","소환의 시간대"] },
  'e3242-roisdefrance': { category: 'superstition', rank: '초기 프랑크 군주들에게 얽힌 악마적 괴담(Légendes Monstrueuses des Mérovingiens)', domains: ["미신·민속(Superstition)","프랑스 왕실 민속","메로빙거 왕조","원숭이 꼬리와 멧돼지 털"] },
  'e3243-roitelet': { category: 'superstition', rank: '도박의 승리를 부른다는 작은 새의 깃털(Plume Porte-Bonheur)', domains: ["미신·민속(Superstition)","조류 민속","도박 부적","새들의 왕 전설"] },
  'e3244-rolandeduvernois': { category: 'person', rank: '앙리 보게에게 기소되어 처형된 16세기 마녀(Sorcière Condamnée par Boguet)', domains: ["인물·역사(Personnage)","부르고뉴 마녀재판","앙리 보게","복화술 악마 빙의"] },
  'e3245-rome': { category: 'superstition', rank: '지옥의 권세가 결코 이기지 못할 영원의 성도(Siège de l\'Église et Satan)', domains: ["미신·민속(Superstition)","가톨릭 교회 전승","콘스탄티누스의 기증","사탄과의 영적 전쟁"] },
  'e3246-romulus': { category: 'myth', rank: '로마의 건국 시조이자 악마학상의 마법사 전설(Fondateur de Rome et Magicien)', domains: ["신화·전설(Mythologie)","로마 건국 신화","장 보댕의 『악마광』","회오리바람 실종"] },
  'ronwe': { category: 'demon', rank: '지옥의 후작 겸 백작(Marquis et Comte aux Enfers)', legions: 19, domains: ["악마학(Démonologie)","1863 원서 삽화 수록","루이 브르통 68대 목판화","솔로몬 72악마","수사학과 언어학"] },
  'e3248-rosecroix': { category: 'superstition', rank: '17세기 유럽을 뒤흔든 신비주의 비밀결사(Fraternité Secrète Mystique)', domains: ["미신·민속(Superstition)","비의 결사","연금술과 카발라","가브리엘 노데의 비판"] },
  'e3249-rosedejericho': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","부활의 기적 식물"] },
  'e3250-rosemberg': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["신화·전설(Mythologie)","상호참조","백색 부인 망령"] },
  'e3251-rosendal': { category: 'superstition', rank: '스웨덴 마녀들의 전설적인 사바트 집회지(Lieu du Sabbat en Suède)', domains: ["미신·민속(Superstition)","스웨덴 마녀재판","모라 마녀재판","사바트 성지 블로쿨라"] },
  'e3252-rosier': { category: 'demon', rank: '지옥의 주권 군주(Prince des Dominations)', domains: ["악마학(Démonologie)","타락천사","미카엘리스 분류법","주권(주품천사) 계급"] },
  'e3253-roskolnicks': { category: 'superstition', rank: '담배를 악마의 풀로 금기시한 러시아 분리파 종파(Secte Russe)', domains: ["미신·민속(Superstition)","러시아 정교회 분열","구교도(고의식파)","악마의 풀 금기"] },
  'e3254-rounfl': { category: 'myth', rank: '브르타뉴 민담 속 숲속의 거인 식인귀(Ogre Légendaire Breton)', domains: ["신화·전설(Mythologie)","브르타뉴 민담","식인귀 오거","어린이 민속 설화"] },
  'e3255-roussalkis': { category: 'myth', rank: '슬라브 민속의 호수와 강의 매혹적인 운디네(Ondines Slaves)', domains: ["신화·전설(Mythologie)","슬라브 신화","물의 정령 운디네","루살카 주간"] },
  'e3256-roustem': { category: 'myth', rank: '페르시아 서사시 『샤나메』의 전설적 대영웅(Héros National Persan)', domains: ["신화·전설(Mythologie)","페르시아 신화","피르다우시의 『샤나메』","백마귀 디브 퇴치"] },
  'e3257-roux': { category: 'superstition', rank: '배신과 마법의 징표로 여겨진 신체적 미신(Préjugés contre les Roux)', domains: ["미신·민속(Superstition)","신체 관상 미신","가룟 유다의 붉은 털","금송아지 가루 전설"] },
  'e3258-rubezal': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["악마학(Démonologie)","상호참조","실레지아 산령"] },
  'e3259-rubis': { category: 'superstition', rank: '독과 역병을 막고 재앙을 예고하는 보석(Pierre Précieuse Magique)', domains: ["미신·민속(Superstition)","광물 신비주의","중세 보석지","독극물 해독 부적"] },
  'e3260-ruedenfer': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","파리 유령 저택 보베르"] },
  'e3261-ruffais': { category: 'superstition', rank: '불을 밟고 칼을 삼키는 이슬람 수행자·마술사(Derviches Hurleurs)', domains: ["미신·민속(Superstition)","이슬람 수피즘","초자연적 고통 무감각","1838년 영국 군사잡지 기록"] },
  'e3262-ruggiericosme': { category: 'person', rank: '카트린 드 메디시스의 이탈리아인 궁정 점성술사(Astrologue de la Cour)', domains: ["인물·역사(Personnage)","샤를 9세 암살 음모","밀랍 인형 주살","1574년 고문 심문"] },
  'e3263-rugner': { category: 'myth', rank: '토르와 결투를 벌인 북유럽 신화의 숫돌 거인(Géant Scandinave)', domains: ["신화·전설(Mythologie)","북유럽 신화","에다 전승","토르의 묠니르와 숫돌"] },
  'e3264-ruleelspet': { category: 'person', rank: '1708년 스코틀랜드 덤프리스의 마녀재판 피고인(Sorcière Écossaise)', domains: ["인물·역사(Personnage)","스코틀랜드 마녀재판","낙인형과 영구 추방","18세기 사법 완화"] },
  'e3265-runes': { category: 'superstition', rank: '북유럽 스칸디나비아의 신성 마법 문자(Caractères Magiques du Nord)', domains: ["미신·민속(Superstition)","북유럽 오딘 신화","승리의 룬과 치유의 룬","고대 암각 비문"] },
  'e3266-rush': { category: 'demon', rank: '수도원에 침투하여 수도사들을 타락시킨 변신 악마(Lutin Diabolique)', domains: ["악마학(Démonologie)","중세 민간 전승","수도원 타락 악마","퍽 상호참조"] },
  'e3267-ryence': { category: 'myth', rank: '24명의 국왕 수염으로 망토를 만든 북웨일스의 거인 왕(Roi Magicien de Galles)', domains: ["신화·전설(Mythologie)","아서 왕 전설","원탁의 기사","마법사 거인 군주"] },
  'e3268-rymer': { category: 'myth', rank: '종말의 날 사자의 손톱 배를 모는 서리 거인의 수장(Capitaine de Naglfar)', domains: ["신화·전설(Mythologie)","북유럽 신화","라그나로크 종말론","사자의 손톱 배 나글파르"] },

  // S entries curated metadata (p.586-645)
  'e3269-sabaoth': { category: 'myth', rank: '성경·히브리 신명(Nom Divin)', domains: ["신비주의","히브리 전통","구약성경","카발라 신명","구마 의식"] },
  'e3270-sabasius': { category: 'myth', rank: '프리기아·트라키아 신격(Divinité Antique)', domains: ["고대 신화","프리기아 신앙","디오니소스 밀의","뱀 숭배","사바트 기원설"] },
  'e3271-sabathan': { category: 'demon', rank: '사바트 호명 악마(Démon du Sabbat)', domains: ["악마학","사바트 기도문","마녀 집회","지옥 악령"] },
  'e3272-sabba': { category: 'myth', rank: '고대 예언자·시빌라(Sibylle & Reine)', domains: ["고대 신화","시빌라 무녀","시바의 여왕","쿠마에 신탁","솔로몬 전승"] },
  'e3273-sabbat': { category: 'superstition', rank: '사바트 의식·마녀 집회(Rituel du Sabbat)', domains: ["마녀 집회","사바트 의식","1863 원서 삽화 수록","악마 숭배","브로켄 산","흑마술 연회"] },
  'e3274-sabbathaizevi': { category: 'person', rank: '거짓 메시아·카발라 신비주의자(Faux Messie)', domains: ["역사 인물","유대교 신비주의","카발라","오스만 제국","거짓 메시아"] },
  'e3275-sabeisme': { category: 'superstition', rank: '고대 천체 숭배·점성 신앙(Culte Astral)', domains: ["고대 종교","천체 숭배","점성술 기원","칼데아 신앙","별의 마법"] },
  'e3276-sabellicusgeorges': { category: 'person', rank: '마법사·강령술사 사기꾼(Magicien & Nécromancien)', domains: ["역사 인물","독일 르네상스","파우스트 전설","연금술사","트리테미우스 비판"] },
  'e3277-sabienus': { category: 'person', rank: '고대 로마 해군 제독·기담(Personnage Historique)', domains: ["로마 역사","시칠리아 전쟁","카이사르 함대","참수와 예언","괴이 기담"] },
  'e3278-sabim': { category: 'person', rank: '오스만 궁정 점성술사(Astrologue)', domains: ["오스만 제국","점성술","천문 예언","동방 비술"] },
  'e3279-sable': { category: 'divination', rank: '지오망시·모래 점술(Géomancie)', domains: ["점술·예언","지오망시","마다가스카르 민속","전쟁 점술","모래의 궤적"] },
  'e3280-sabnac': { category: 'demon', subCategory: 'marquis', rank: '지옥의 대후작(Grand Marquis des Enfers)', legions: 50, domains: ["악마학","지옥의 계급 체계","50개 군단 지휘","성채와 요새 축조","상처와 구더기"] },
  'e3281-sacaras': { category: 'demon', rank: '마다가스카르 제6계급 악령(Mauvais Génie)', domains: ["악마학","마다가스카르 민속","질병의 영","악령 위계"] },
  'e3282-saccilaires': { category: 'person', rank: '고대 마술사·사기사(Jongleur & Magicien)', domains: ["고대 역사","환술과 사기","자루 마술","고대 로마 법률"] },
  'e3283-sacrifices': { category: 'superstition', rank: '고대 제의·인신공양 잔혹사(Rituel & Sacrifice)', domains: ["미신·민속","고대 제의","인신공양","헤로도토스 기록","피의 제단"] },
  'e3284-sadey': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","마녀재판","플라크"] },
  'e3285-sadial': { category: 'myth', rank: '이슬람 제3천의 천사(Ange du Troisième Ciel)', domains: ["이슬람 신화","천사학","천체 운행","대지의 지주"] },
  'e3286-saignementdenez': { category: 'superstition', rank: '신체 전조·민간 흉조(Présage Populaire)', domains: ["미신·민속","신체 징조","피의 전조","민간 속설"] },
  'e3287-sainokavara': { category: 'myth', rank: '일본 불교·저승 전승(Enfer Japonais)', domains: ["일본 불교","저승 전승","삼도천","지장보살","어린이 영혼"] },
  'e3288-sainsmariede': { category: 'person', rank: '악령 빙의 수녀·마녀재판(Possédée de Flandre)', domains: ["역사 인물","빙의 사건","플랑드르 마녀재판","루비에 수녀원","퇴마 의식"] },
  'e3289-saintandre': { category: 'person', rank: '의사·미신 비판 저술가(Médecin & Sceptique)', domains: ["역사 인물","의학사","메리 토프트 사건","토끼 출산 사기","미신 비판"] },
  'e3290-saintaubin': { category: 'person', rank: '칼뱅파 저술가·루됭 사건 기록자(Auteur Calviniste)', domains: ["역사 인물","위르뱅 그랑디에","루됭 빙의 사건","종교 논쟁"] },
  'e3291-saintgermainlecomtede': { category: 'person', rank: '불사의 연금술사·오컬트 인물(Alchimiste Immortel)', domains: ["역사 인물","연금술","불로불사 전설","18세기 궁정 오컬트","현자의 돌"] },
  'e3292-saintgille': { category: 'person', rank: '복화술사·초자연 현상 해명자(Ventriloque)', domains: ["역사 인물","복화술","과학 아카데미","유령 소리 해명"] },
  'e3293-saints': { category: 'superstition', rank: '성자 사칭 사기·사이비 종교(Superstition & Charlatanisme)', domains: ["미신·민속","성자 사칭","1863 원서 삽화 수록","종교 사기","생캉탱 법원 판결"] },
  'e3294-sakhar': { category: 'demon', rank: '솔로몬 옥좌 찬탈 악마(Démon du Trône de Salomon)', domains: ["탈무드 전승","솔로몬의 인장","옥좌 찬탈","반지의 마법","물고기 뱃속"] },
  'e3295-sakhrat': { category: 'myth', rank: '이슬람 우주론·신화적 초석(Pierre Cosmique)', domains: ["이슬람 우주론","카프 산","에메랄드 초석","지진의 기원","거대한 황소 쿠유타"] },
  'e3296-sakimouni': { category: 'person', rank: '불교 교조·동방 종교 설화(Fondateur du Bouddhisme)', domains: ["세계 종교","불교 교조","1863 원서 삽화 수록","칼미크 불교 설화","본생담 토끼 설화"] },
  'e3297-saladin': { category: 'person', rank: '이슬람 술탄·십자군 전설(Sultan & Héros)', domains: ["역사 인물","십자군 전쟁","아이유브 왕조","기사도 문학","악마학 전승"] },
  'e3298-salamandres': { category: 'myth', rank: '4대 원소 정령·화령(Esprit Élémentaire du Feu)', domains: ["연금술","4대 원소","파라켈수스","가발리스 백작","불의 정령"] },
  'e3299-salguesjeanbaptiste': { category: 'person', rank: '계몽주의 학자·편견 비판 저술가(Savant & Philosophe)', domains: ["역사 인물","계몽사상","미신 비판","대중 편견 고발"] },
  'e3300-saliere': { category: 'superstition', rank: '식탁 예법·불길한 징조(Superstition de Table)', domains: ["미신·민속","식탁 미신","소금의 상징","지혜의 표시","불길한 징조"] },
  'e3301-salisateurs': { category: 'divination', rank: '신체 경련 점술·고대 복술(Art Divinatoire)', domains: ["점술·예언","신체 경련","고대 점술","징조 해석"] },
  'e3302-salive': { category: 'superstition', rank: '신체 분비물 주술·벽사 비방(Magie Populaire)', domains: ["미신·민속","타액 주술","사안(이블아이) 퇴치","플리니우스 박물지","민간 치유"] },
  'e3303-salomon': { category: 'person', rank: '이스라엘 성왕·마도서의 시조(Roi & Maître des Esprits)', domains: ["성경 역사","솔로몬의 열쇠","악마 결박","인장 반지","정령들의 지배자"] },
  'e3304-saludadores': { category: 'person', rank: '민간 치유사·성녀 카타리나 전승(Guérisseurs Espagnols)', domains: ["스페인 민속","민간 치유사","광견병 치료","화상 면역","종교재판"] },
  'e3305-salvationderome': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","로마 전설","베르길리우스"] },
  'e3306-salverteeusebe': { category: 'person', rank: '학자·마술 과학화 연구가(Savant & Député)', domains: ["역사 인물","오컬트 비판","고대 과학","기적의 자연적 해명"] },
  'e3307-samael': { category: 'demon', subCategory: 'monarch', rank: '죽음의 천사·지옥 군주(Ange de la Mort & Prince des Démons)', domains: ["카발라","유대 악마학","죽음의 천사","에덴동산의 뱀","릴리스의 배우자"] },
  'e3308-samaritainela': { category: 'superstition', rank: '파리 도시 전설·외세 침략 예언(Légende Urbaine de Paris)', domains: ["도시 전설","파리 퐁네프","사마리아 여인 조각","외세 침략 예언","1813년 분수 철거"] },
  'e3309-sambethe': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","고대 신화","시빌라 무녀"] },
  'e3310-sampsonagnes': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","스코틀랜드 마녀재판","제임스 1세"] },
  'e3311-samuel': { category: 'person', rank: '성경 인물·엔도르의 강령술(Nécromancie Biblique)', domains: ["구약성경","엔도르의 마녀","사울 왕","강령술","선지자의 망령"] },
  'e3312-sanaves': { category: 'superstition', rank: '아프리카 호신 부적(Amulette Malgache)', domains: ["미신·민속","마다가스카르","호신 부적","향목","악령 퇴치"] },
  'e3313-sanche': { category: 'person', rank: '유령 기담·전쟁 귀환병(Revenant & Vision)', domains: ["중세 기담","아라곤 왕국","사후 출현","연옥의 영혼","유령 기사"] },
  'e3314-sandalphon': { category: 'myth', rank: '유대 카발라 3대 지성·대천사(Intelligence Supérieure)', domains: ["카발라","천사학","탈무드","메타트론의 쌍둥이","기도의 꽃관"] },
  'e3315-sang': { category: 'superstition', rank: '생명수·피의 제의 미신(Magie du Sang)', domains: ["미신·민속","혈액 주술","황소의 피","고대 해독제","악마와의 피의 계약"] },
  'e3316-sangerrenee': { category: 'person', rank: '마녀재판 희생자·소년 마녀(Procès de Sorcellerie)', domains: ["역사 인물","30년 전쟁","1863 원서 삽화 수록","바이에른 마녀재판","마녀의 낙인"] },
  'e3317-santabarenus': { category: 'person', rank: '비잔티움 수도사·강령술사(Moine & Magicien)', domains: ["비잔티움 제국","환영 강령술","1863 원서 삽화 수록","바실리우스 1세","죽은 황자의 유령"] },
  'e3318-saphis': { category: 'superstition', rank: '이슬람 서면 부적(Amulette Islamique)', domains: ["미신·민속","이슬람 부적","코란 성구","무적의 부적","서아프리카 무어인"] },
  'e3319-sapondomad': { category: 'myth', rank: '조로아스터교 대지의 수호령(Amesha Spenta)', domains: ["조로아스터교","게브르 신앙","아메샤 스펜타","대지의 수호신","경작의 축복"] },
  'e3320-sarcueil': { category: 'demon', rank: '사바트 기도문 악마(Démon du Sabbat)', domains: ["악마학","사바트 호명","마녀의 호명 기도문"] },
  'e3321-saremargueritede': { category: 'person', rank: '바스크 마녀재판 희생자(Sorcière Basque)', domains: ["역사 인물","피에르 드 랑크르","바스크 마녀사냥","악마와의 계약","보르도 감옥"] },
  'e3322-sarmeniuslapis': { category: 'superstition', rank: '신비 보석·임신 수호석(Pierre Magique)', domains: ["미신·민속","광물 미신","임산부 보호","유산 방지 부적"] },
  'e3323-sas': { category: 'divination', rank: '체 점술·코스키노망시(Coscinomancie)', domains: ["점술·예언","코스키노망시","가루 체 점술","도둑 색출"] },
  'e3324-satan': { category: 'demon', subCategory: 'monarch', rank: '지옥의 반역 군주·대원수(Prince Révolutionnaire des Enfers)', domains: ["악마학","루시퍼의 반역","지옥의 계급 체계","사바트의 군주","원초의 악"] },
  'e3325-satanaki': { category: 'demon', rank: '마니교 악의 창조신(Créateur Manichéen)', domains: ["영지주의","마니교","미하엘 프셀로스","물질계 창조주","이원론"] },
  'e3326-satamins': { category: 'demon', rank: '카발라 사탄의 수행 악령(Démons Contradicteurs)', domains: ["카발라","유대 악마학","사탄의 군세","반역과 고발"] },
  'e3327-satanalogie': { category: 'grimoire', rank: '철학적 악마학 연구(Étude Philosophique)', domains: ["악마학 문헌","독일 관념론","셸링 철학","루뱅 대학교","악의 형이상학"] },
  'e3328-satyres': { category: 'myth', rank: '그리스·로마 신화 숲의 신(Divinité Champêtre)', domains: ["고대 신화","숲의 신령","1863 원서 삽화 수록","염소 다리와 뿔","플리니우스 박물지"] },
  'e3329-saubadinedesubiette': { category: 'person', rank: '바스크 마녀재판 연루자(Sorcière Basque)', domains: ["역사 인물","피에르 드 랑크르","사바트 동행","바스크 마녀재판"] },
  'e3330-sausine': { category: 'person', rank: '사바트의 대여사제·사탄의 첫 번째 아내(Grande Prêtresse du Sabbat)', domains: ["사바트 의식","1863 원서 삽화 수록","바스크 사바트","사탄의 첫 번째 아내","피에르 드 랑크르"] },
  'e3331-sautebuisson': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","가택 정령","베르들레"] },
  'e3332-sauterelles': { category: 'superstition', rank: '자연재해·초자연적 흉조(Fléau & Prodige)', domains: ["미신·민속","메뚜기 재앙","대머리왕 샤를","구마 의식","성 카르포포로스"] },
  'e3333-sauveursditalie': { category: 'person', rank: '뱀잡이 돌팔이 치유사(Charlatans & Dompteurs)', domains: ["이탈리아 민속","성 바오로 사칭","뱀 면역","독사 조련","돌팔이 마술"] },
  'e3334-savon': { category: 'superstition', rank: '민간 속신·우정의 단절(Superstition Populaire)', domains: ["미신·민속","에게해 민속","크레타 섬","비누 선물 금기"] },
  'e3335-savonarolejerome': { category: 'person', rank: '도미니코회 수도사·예언자(Moine Dominicain & Prophète)', domains: ["역사 인물","피렌체 르네상스","허영의 소각","예언과 환시","종교재판"] },
  'e3336-sayrims': { category: 'demon', rank: '성경·카발라 광야의 악령(Démons de la Bible)', domains: ["성경 악마학","카발라","이사야서","들염소 악령","황야의 춤"] },
  'e3337-scaf': { category: 'person', rank: '스위스 변신 마법사(Magicien Métamorphe)', domains: ["스위스 역사","베른 주","쥐 변신술","마법사 재판"] },
  'e3338-scandinaves': { category: 'myth', rank: '북유럽 에다·신통기(Mythologie Scandinave)', domains: ["북유럽 신화","에다(Edda)","알파디르(오딘)","발할라","라그나로크"] },
  'e3339-schadaschivaoun': { category: 'myth', rank: '인도 힌두 우주령(Génie Cosmique Hindou)', domains: ["힌두 신화","우주 지배령","시바 신격","우마(파르바티)"] },
  'e3340-schadukian': { category: 'myth', rank: '페르시아 요정의 영토(Royaume des Péris)', domains: ["페르시아 전설","지니스탄","페리 요정","다이브 악령","황금 낙원"] },
  'e3341-schamanes': { category: 'person', rank: '시베리아 원주민 제사장·무속인(Prêtres & Sorciers)', domains: ["인류학·무속","시베리아 샤머니즘","탈혼과 트랜스","정령과의 교신","북방 민속"] },
  'e3342-scheda': { category: 'person', rank: '탈무드 시대의 유대인 마술사(Magicien Juif)', domains: ["유대 전승","탈무드 시대","파우스트 원형","악마와의 밀약"] },
  'e3343-schedims': { category: 'demon', rank: '탈무드·카발라의 정령(Esprits du Talmud)', domains: ["유대 악마학","탈무드","사마엘의 사역마","반인반마","그림자의 영"] },
  'e3344-scheithan': { category: 'demon', rank: '이슬람의 악마·이블리스(Diable Musulman)', domains: ["이슬람 신학","코란","이블리스","유혹자","알라의 저주"] },
  'e3345-schenckjeangeorges': { category: 'person', rank: '기형학 의사·의학 저술가(Médecin & Auteur)', domains: ["의학사","기형학(Teratology)","프랑크푸르트 출판","기형 괴물 기록"] },
  'e3346-scheol': { category: 'myth', rank: '구약성경·유대 명계(Enfer des Hébreux)', domains: ["구약성경","유대 명계","그림자의 땅","죽은 자들의 거처"] },
  'e3347-schertzferdinand': { category: 'person', rank: '흡혈귀 연구 법률가(Auteur sur les Vampires)', domains: ["흡혈귀 전승","사후 마술","올뮈츠 출판","모라비아 흡혈귀"] },
  'e3348-schmidthans': { category: 'person', rank: '대장장이 청년·악마 집회 연루자(Procès de Sorcellerie)', domains: ["역사 인물","바이에른 마녀재판","1863 원서 삽화 수록","잉골슈타트","악마의 연회"] },
  'e3349-schoumnus': { category: 'myth', rank: '칼미크·몽골 불교 마왕(Roi des Démons)', domains: ["칼미크 민속","불교 설화","마왕 마라","악령의 군세"] },
  'e3350-schrammmichel': { category: 'person', rank: '대학생 악마 계약자·사형수(Étudiant Condamné)', domains: ["역사 인물","뷔르츠부르크 대학교","1863 원서 삽화 수록","피의 계약서","독일 종교재판"] },
  'e3351-schroettelis': { category: 'myth', rank: '알프스 소정령·몽마(Lutin des Alpes)', domains: ["스위스 민속","알프스 정령","몽마(나이트메어)","가축 수호"] },
  'e3352-schroterulrich': { category: 'person', rank: '도박꾼·악마의 환영 조우자(Joueur de Lucerne)', domains: ["역사 인물","스위스 루체른","신성모독","도박꾼의 파멸","악마의 환영"] },
  'e3353-sciamancie': { category: 'divination', rank: '그림자 강령 복술(Évocation des Ombres)', domains: ["점술·예언","강령술","고대 그리스 비의","망령의 그림자"] },
  'e3354-sciences': { category: 'myth', rank: '헤르메스 전승·원초 과학(Sciences Primordiales)', domains: ["이슬람 전승","선지자 이드리스","에녹서","천문학 기원","비전 과학"] },
  'e3355-sciencesoccultes': { category: 'grimoire', rank: '비전 마법 체계 총론(Traité des Arts Secrets)', domains: ["오컬트 총론","점술 체계","마도서 전통","카발라","연금술"] },
  'e3356-scimasar': { category: 'divination', rank: '마이클 스콧의 징조 점술(Présage Animal)', domains: ["점술·예언","마이클 스콧","관상학 논문","새의 비행","발소리 징조"] },
  'e3357-sciopodes': { category: 'myth', rank: '고대 박물지 괴이 종족(Peuple Monstrueux)', domains: ["고대 신화","플리니우스 박물지","모노포드","에티오피아 전설","기형 종족"] },
  'e3358-scopelisme': { category: 'superstition', rank: '아라비아 저주 주술(Maléfice Arabe)', domains: ["고대 법률","아라비아 주술","돌 던지기 저주","농경 방해","로마 법전"] },
  'e3359-scorpion': { category: 'superstition', rank: '동물 부적·벽사 비방(Superstition Animale)', domains: ["미신·민속","전갈 부적","페르시아 박물지","벽사 조각","해독 비방"] },
  'e3360-scot': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","마법사","시빌라"] },
  'e3361-scotopetes': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","이단 종파","키르쿰켈리온파"] },
  'e3362-scottmichel': { category: 'person', rank: '스코틀랜드 궁정 마법사(Savant & Magicien)', domains: ["역사 인물","신성로마제국","프리드리히 2세","단테 신곡 지옥편","아리스토텔레스 번역"] },
  'e3363-scottreginald': { category: 'person', rank: '의회 의원·마녀사냥 회의론 저술가(Auteur Sceptique)', domains: ["역사 인물","영국 마녀사냥","마술의 폭로","요한 바이어","제임스 1세 분서"] },
  'e3364-scottwalter': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","스코틀랜드 문학","악마학 서한"] },
  'e3365-scouminkes': { category: 'myth', rank: '독일 가택 소정령(Esprits Familiers)', domains: ["독일 민속","가택 정령","귀족 가문 수호","가정 요정"] },
  'scox': { category: 'demon', subCategory: 'duke', rank: '지옥의 공작·대후작(Duc et Grand Marquis)', legions: 30, domains: ["악마학","지옥의 계급 체계","68대 목판화 도판 수록","30개 군단 지휘","황새의 형상","시력과 분별력 박탈"] },
  'e3367-scylla': { category: 'myth', rank: '그리스 신화 바다 괴물(Monstre Marin)', domains: ["그리스 신화","키르케의 질투","메시나 해협","짖는 늑대 머리","오디세이아"] },
  'e3368-sebhil': { category: 'myth', rank: '이슬람 선악 기록 천사(Ange Enregistreur)', domains: ["이슬람 신학","선악 기록부","심판의 날","천사학"] },
  'e3369-secretainfrancoise': { category: 'person', rank: '프랑슈콩테 마녀재판 희생자(Sorcière Condamnée)', domains: ["역사 인물","앙리 보게 판사","생클로드 마녀재판","개와 고양이 변신","화형 판결"] },
  'e3370-secretsmerveilleux': { category: 'grimoire', rank: '알베르투스 마그누스 민간 비방집(Recettes Magiques)', domains: ["마도서·민속","1863 원서 삽화 수록","대알베르 마도서","민간 약초 비방","동물 포획 주술"] },
  'e3371-segjin': { category: 'myth', rank: '이슬람 지옥 우주론·심연(Septième Enfer)', domains: ["이슬람 우주론","코란","최하층 심연","불경한 자들의 감옥","칠흑의 암흑"] },
  'e3372-seidur': { category: 'divination', rank: '고대 스칸디나비아 샤머니즘 마술(Magie Noire Islandaise)', domains: ["북유럽 신화","아이슬란드 사가","오딘과 프레이야","운명의 직조","샤머니즘 주술"] },
  'e3373-seings': { category: 'divination', rank: '신체 특징 점술·멜람푸스 비방(Mélampodie)', domains: ["점술·예언","신체 흑자점","멜람푸스 관상","프톨레마이오스 왕","사마귀 징조"] },
  'e3374-sel': { category: 'superstition', rank: '벽사 물질·성수 제의(Antidote de l’Enfer)', domains: ["미신·민속","벽사 소금","앙리 보게 악마학","사바트 무염식","부패 방지"] },
  'e3375-separ': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","악마학","베파르"] },
  'e3376-sephiriothsles': { category: 'grimoire', rank: '유대 카발라 생명나무 유출 체계(Émanations Divines)', domains: ["카발라","생명의 나무","10대 세피라","케테르에서 말쿠트","신성 유출"] },
  'e3377-sepulture': { category: 'superstition', rank: '장례 풍습·망령의 복수 기담(Coutume Funéraire)', domains: ["미신·민속","페르시아 조로아스터교","조장 풍습","매장 금기","유령의 경고"] },
  'e3378-sermons': { category: 'superstition', rank: '사바트 의식·악마 설교(Rituel du Sabbat)', domains: ["사바트 의식","1863 원서 삽화 수록","아스모데우스","교회 풍자","신성모독 설교"] },
  'e3379-serosch': { category: 'myth', rank: '조로아스터교 수호 천령·순종의 영(Yazata)', domains: ["조로아스터교","파르시 신앙","야자타 천령","밤의 수호자","아흐리만 퇴치"] },
  'e3380-serpent': { category: 'superstition', rank: '원초의 유혹자·악마의 동물 상징(Symbole Démoniaque)', domains: ["성경 상징","1863 원서 삽화 수록","에덴동산의 뱀","펜실베이니아 검은 뱀","사안과 최면"] },
  'e3381-serpentdemerlegrand': { category: 'myth', rank: '심해 괴수·크라켄 전설(Monstre des Abîmes)', domains: ["신화·전설","1863 원서 삽화 수록","심해 바다뱀","1837년 르아브르호 목격담","비숍 폰토피단"] },
  'e3382-serug': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","악령","하센"] },
  'e3383-servants': { category: 'myth', rank: '알프스 가택 수호 소정령(Lutins Familiers)', domains: ["신화·전설","알프스 민속","1863 원서 삽화 수록","가택 정령","우유 한 숟가락의 보답"] },
  'e3384-serviustullius': { category: 'person', rank: '고대 로마 국왕·화령 탄생 전설(Roi de Rome)', domains: ["로마 역사","로마 왕정","화로 속 불기둥","살라만더의 아들","카발라 전승"] },
  'e3385-sethiens': { category: 'person', rank: '2세기 영지주의 이단 종파(Hérétiques Gnostiques)', domains: ["교회사","영지주의(Gnosticism)","아담의 아들 셋","가인과 아벨의 천사","비전 계시"] },
  'e3386-sethus': { category: 'person', rank: '비잔티움 궁정 마술사(Magicien Byzantin)', domains: ["비잔티움 제국","마누엘 콤네노스","사랑의 묘약","마법 복숭아","니케타스 연대기"] },
  'e3387-severeseptime': { category: 'person', rank: '로마 황제·선황의 복수 유령(Empereur Romain)', domains: ["로마 역사","안티오키아","카라칼라의 악몽","형제 살해의 복수","황제의 망령"] },
  'e3388-sexe': { category: 'superstition', rank: '출산 민간 복술·신체 징후(Présage de Naissance)', domains: ["미신·민속","임신 민간요법","태아 성별 점치기","출산 미신"] },
  'e3389-shamavedam': { category: 'grimoire', rank: '인도 힌두 4대 성전(Veda Sacré)', domains: ["힌두 종교","4대 베다","찬가 성전","제의 의식","고대 인도 경전"] },
  'e3390-shelo': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","거짓 메시아","조애나 사우스콧"] },
  'e3391-shoupeltins': { category: 'myth', rank: '스코틀랜드 바다 정령·인어(Génies de la Mer)', domains: ["신화·전설","셰틀랜드 제도","스코틀랜드 민속","물말(켈피)","북해 인어"] },
  'e3392-sibylles': { category: 'divination', rank: '고대 그리스·로마 신탁 무녀(Prophétesses Antiques)', domains: ["고대 신화","시빌라의 신탁","1863 원서 삽화 수록","쿠마에 무녀","아이네이아스의 황금가지"] },
  'e3393-sibyllesmodernes': { category: 'person', rank: '근대 여성 예언가·점술사(Devineresses Modernes)', domains: ["역사 인물","점성술사","1863 원서 삽화 수록","마담 르노르망","피에르 크레스페 악마론"] },
  'e3394-sicidites': { category: 'person', rank: '비잔티움 환영 마술사(Magicien Illusionniste)', domains: ["비잔티움 제국","마누엘 콤네노스","환영 마술","항구의 도자기 배"] },
  'e3395-sideromancie': { category: 'divination', rank: '고대 쇠 점술(Art Divinatoire par le Fer)', domains: ["점술·예언","붉게 달군 쇠","밀짚 연소","불꽃 궤적"] },
  'e3396-sidragasum': { category: 'demon', rank: '광란의 무도 악마(Démon de la Danse)', domains: ["악마학","광란의 춤","여성의 유혹","사바트 춤"] },
  'e3397-sifflerlevent': { category: 'superstition', rank: '해양 미신·풍신 소환(Superstition Maritime)', domains: ["해양 민속","선원들의 미신","무풍지대","휘파람 금기","바람 소환"] },
  'e3398-siffletmagique': { category: 'myth', rank: '마법 악기·독일 하멜른 전설(Légende de Hamelin)', domains: ["독일 전설","하멜른의 피리 부는 사나이","1284년 사건","쥐 떼 유인","어린이들의 실종"] },
  'e3399-sigeani': { category: 'myth', rank: '미얀마 아바 왕국의 뇌전 정령(Génie du Tonnerre)', domains: ["미얀마 신화","아바 왕국","천둥과 번개","자연 정령"] },
  'e3400-signedecroix': { category: 'superstition', rank: '가톨릭 성사·악마 퇴치 비방(Protection Contre les Démons)', domains: ["종교 기담","십자가 성호","나폴리 신전 일화","구마 효능","악마의 도주"] },
  'e3401-silenes': { category: 'myth', rank: '디오니소스의 스승·늙은 사티로스(Divinité Antique)', domains: ["그리스 신화","사티로스","소크라테스 수호령","당나귀를 탄 현자"] },
  'e3402-simagorad': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","마도서","샤를 6세"] },
  'e3403-simle': { category: 'myth', rank: '북유럽 신화 지고의 낙원(Paradis Scandinave)', domains: ["북유럽 신화","에다","라그나로크 이후","황금 지붕 궁전","의로운 영혼"] },
  'e3404-simonlemagicien': { category: 'person', rank: '성경 사마리아 마술사·시모니의 어원(Magicien Hérésiarque)', domains: ["성경 역사","사도행전","베드로와의 대결","공중 부양","성직매매(Simony)"] },
  'e3405-simondephares': { category: 'person', rank: '15세기 프랑스 점성술사·연대기 작가(Astrologue)', domains: ["역사 인물","샤를 8세","점성술 역사서","파리 대학 재판"] },
  'e3406-simonide': { category: 'person', rank: '고대 그리스 서정시인·신들의 구원 기담(Poète Lyrique)', domains: ["고대 그리스","디오스쿠로이 쌍둥이 신","기적의 탈출","연회장 붕괴"] },
  'e3407-simorgue': { category: 'myth', rank: '페르시아 신화 불사의 영조(Oiseau Fabuleux)', domains: ["페르시아 신화","카프 산","안카(Anqa)","자알과 로스탐","지혜의 거조"] },
  'e3408-singes': { category: 'superstition', rank: '동물 상징·신의 원숭이(Singe de Dieu)', domains: ["동물 상징","1863 원서 삽화 수록","신의 원숭이(Simia Dei)","로마 흉조","이집트 바분 숭배"] },
  'e3409-sirath': { category: 'myth', rank: '이슬람 저승의 다리·심판(Pont de l’Enfer)', domains: ["이슬람 종말론","칼날보다 얇은 다리","지옥불 위의 시험","낙원의 통로"] },
  'e3410-sirchade': { category: 'demon', rank: '동물 지배 악마(Démon des Animaux)', domains: ["악마학","야수 조종","사역마","솔로몬 마도서"] },
  'e3411-sistre': { category: 'superstition', rank: '마법 약초·유령 퇴치 비방(Plante Magique)', domains: ["미신·민속","고대 식물학","스카만드로스 강","망령 퇴치","공포 진정"] },
  'e3412-sittim': { category: 'demon', rank: '인도 삼림 악령(Démon des Forêts)', domains: ["악마학","인도 신화","숲의 환영","인간 형상 악령"] },
  'e3413-skalda': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","북유럽 신화","노른 세 여신"] },
  'e3414-skinkraftigans': { category: 'person', rank: '앵글로색슨 이교 마법사(Sorciers Anglo-Saxons)', domains: ["중세 역사","앵글로색슨","이교 마술","거짓 기적"] },
  'e3415-smael': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","악마학","사마엘"] },
  'e3416-smyrne': { category: 'myth', rank: '소아시아 고대 전설·도시 기원담(Légende Antique)', domains: ["고대 신화","아마존 여전사","도시 창건 설화","소아시아"] },
  'e3417-socrate': { category: 'person', rank: '고대 그리스 철학자·내면의 수호령(Philosophe & Démon Familière)', domains: ["철학사","다이모니온(수호령)","내면의 양심","아테네 재판"] },
  'e3418-soleil': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","태양 숭배","태양의 춤"] },
  'e3419-soleves': { category: 'myth', rank: '스위스 알프스 공기 요정(Esprits des Montagnes)', domains: ["스위스 민속","알프스 정령","실프","가벼운 공기 요정"] },
  'e3420-soliman': { category: 'myth', rank: '이슬람 예언자·진(Jinn)의 지배자(Prophète & Maître des Djinns)', domains: ["이슬람 전승","선지자 술레이만","진(Jinn) 정령","아담 이전의 세계"] },
  'e3421-sommeil': { category: 'superstition', rank: '초자연 현상·의학적 수면 기담(Sommeil Prodigieux)', domains: ["초자연 현상","장기 수면","1684년 런던 도예공","가사 상태","몽유 기담"] },
  'e3422-somnambules': { category: 'superstition', rank: '수면 보행·무의식 행동 기담(Somnambulisme)', domains: ["의학사","몽유병","지붕 위 보행","무의식 글쓰기"] },
  'e3423-somnambulismemagnetique': { category: 'superstition', rank: '메스메르 동물자기·최면 투시(Mesmérisme & Lucidité)', domains: ["최면술","메스메르","동물자기","투시와 독심술","환청과 예언"] },
  'e3424-soneillon': { category: 'demon', rank: '좌천 악마·루비에 빙의령(Démon de Louviers)', domains: ["악마학","루비에 수녀원 빙의","좌천된 악마","수녀들의 유혹"] },
  'e3425-songes': { category: 'divination', rank: '몽점·수면 심리학 총론(Oniromancie & Psychologie)', domains: ["점술·심리학","해몽의 역사","타르티니 악마의 트릴","예지몽","뇌의 작용"] },
  'e3426-songesexplicationdes': { category: 'divination', rank: '고전 몽점 사전·해몽 도판(Dictionnaire des Songes)', domains: ["점술·예언","1863 원서 삽화 수록","해몽 사전","아르테미도로스","길흉 징조 도판"] },
  'e3427-sonhardibel': { category: 'person', rank: '배교 신부·사바트 검은 미사 집전자(Prêtre Apostat)', domains: ["역사 인물","바스크 마녀재판","검은 미사","사바트 제의","공중 부양"] },
  'e3428-sorciers': { category: 'superstition', rank: '마녀사냥 역사·악마학 총론(Histoire de la Sorcellerie)', domains: ["마녀사냥 역사","악마와의 계약","1863 원서 삽화 수록","유럽 종교재판","마녀의 망치","마술과 사기"] },
  'e3429-sort': { category: 'superstition', rank: '주술 행위·제비 복술(Magie & Sortilège)', domains: ["미신·민속","제비뽑기","저주 주술","악마와의 계약","마법 문자"] },
  'e3430-sortileges': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","주술","저주"] },
  'e3431-sotray': { category: 'myth', rank: '프랑스 마구간 소정령(Lutin des Écuries)', domains: ["프랑스 민속","솔로뉴 민담","마구간 정령","말 갈기 매듭","가택 요정"] },
  'e3432-souad': { category: 'myth', rank: '이슬람 신학·원죄의 응결(Germe du Péché)', domains: ["이슬람 신학","원죄 전승","대천사 가브리엘","예언자 무함마드 정화"] },
  'e3433-sougaitoyon': { category: 'myth', rank: '시베리아 야쿠트족 뇌전 악령(Dieu du Tonnerre des Yakouts)', domains: ["시베리아 신화","야쿠트족","천둥신","복수의 악령"] },
  'e3434-souliefrederic': { category: 'person', rank: '프랑스 낭만주의 소설가(Romancier)', domains: ["프랑스 문학","악마의 회고록","낭만주의","사탄 문학"] },
  'e3435-souris': { category: 'superstition', rank: '동물 흉조·민간 방서술(Présage Animal & Conjuration)', domains: ["미신·민속","1863 원서 삽화 수록","고대 로마 길조","농가 쥐 퇴치 주술","쥐 울음 흉조"] },
  'e3436-souterrainsdemons': { category: 'demon', rank: '광산 악령·지하 정령(Démons des Mines & Abîmes)', domains: ["악마학","미하엘 프셀로스","광산 정령 코발로스","노르웨이 민속","땅속의 폭발"] },
  'e3437-southcottjeanne': { category: 'person', rank: '영국 거짓 예언자·실로 잉태 소동(Fausse Prophétesse)', domains: ["역사 인물","영국 종교사","거짓 메시아 실로","예언의 상자","광신 종파"] },
  'e3438-souvigny': { category: 'myth', rank: '프랑스 건축 기담·요정 축조 설화(Légende des Fées)', domains: ["프랑스 민속","오베르뉴 전설","요정의 건축","수비니 수도원","기적의 계곡"] },
  'e3439-sovasmunusinsempoisonneurset': { category: 'myth', rank: '아프리카 코자족 흡혈 악령(Vampires Africains)', domains: ["아프리카 민속","코자족","흡혈귀 전승","독살과 흡혈","야간 습격"] },
  'e3440-spectres': { category: 'superstition', rank: '사후 영혼 가시화 현상 총론(Apparitions Surnaturelles)', domains: ["심령 현상","유령의 출현","영혼 불멸설","철학적 논쟁","고대 기담"] },
  'e3441-spectriana': { category: 'grimoire', rank: '19세기 초 유령 기담 선집(Recueil de Spectres)', domains: ["오컬트 문헌","1817년 파리 출간","카타콤 필사본","유령 기담"] },
  'e3442-speculaires': { category: 'divination', rank: '거울 환영 점술사·카톱트로망시(Catoptromancie)', domains: ["점술·예언","거울 점술","수정구 투시","고대 로마 복술사"] },
  'e3443-spee': { category: 'person', rank: '예수회 신부·마녀재판 비판자(Jésuite & Réformateur)', domains: ["역사 인물","1863 원서 삽화 수록","사법적 경고(Cautio Criminalis)","고문 반대","라이프니츠 찬사"] },
  'e3444-sper': { category: 'myth', rank: '벨기에 왈롱 민속 유령(Revenant Wallon)', domains: ["벨기에 민속","리에주 방언","스피리투스(Spiritus)","망령"] },
  'e3445-sphinx': { category: 'myth', rank: '고대 그리스·이집트 전설의 괴수(Monstre Mythologique)', domains: ["고대 신화","오이디푸스 전설","테베의 수수께끼","사자 몸과 여성 얼굴","이집트 수호신"] },
  'e3446-spinaalphonse': { category: 'person', rank: '프란치스코회 신학자·악마 분류학자(Théologien Franciscain)', domains: ["악마학 문헌","신앙의 성채(Fortalitium Fidei)","악마 10대 계급","1494년 뉘른베르크 출판","중세 악마학"] },
  'e3447-spinello': { category: 'person', rank: '14세기 토스카나 화가·루시퍼 환영 일화(Peintre Toscan)', domains: ["미술사","아레초 화가","타락천사의 추락 벽화","루시퍼의 악몽","공포의 죽음"] },
  'e3448-spirinxjean': { category: 'person', rank: '15세기 벨기에 궁정 점성술사(Astrologue Flamand)', domains: ["역사 인물","부르고뉴 공국","용담공 샤를","스위스 원정 패사 예언"] },
  'e3449-spiritisme': { category: 'grimoire', rank: '19세기 영매·강신술 운동 총론(Doctrine Spirite)', domains: ["오컬트 역사","알랑 카르덱","탁자 회전 강신술","영매와 망령 교신","심령주의"] },
  'e3450-spodomantie': { category: 'divination', rank: '제단 재 점술·스포다노망시(Art Divinatoire par la Cendre)', domains: ["점술·예언","제단의 재","독일 민간 점술","바람의 궤적","문자 해석"] },
  'e3451-sprangerbarthelemi': { category: 'person', rank: '16세기 안트베르펜 화가·마법사의 초상(Peintre Flamand)', domains: ["미술사","루돌프 2세 궁정","프라하 매너리즘","마법사 초상화"] },
  'e3452-sprengerjacques': { category: 'person', rank: '도미니코회 종교재판관·마녀의 망치 공저자(Inquisiteur)', domains: ["교회사","마녀의 망치(Malleus Maleficarum)","하인리히 크레머","마녀사냥 지침서"] },
  'e3453-spunkie': { category: 'myth', rank: '스코틀랜드 늪지 도깨비불·소악령(Lutin Écossais)', domains: ["스코틀랜드 민속","도깨비불(Will-o-the-wisp)","늪지대의 불빛","여행자 유혹"] },
  'e3454-spurina': { category: 'person', rank: '에트루리아 점성관·카이사르의 암살 예언(Haruspice Étrusque)', domains: ["로마 역사","수에토니우스","카이사르 암살","3월의 이데스(15일) 예언"] },
  'e3455-squelette': { category: 'superstition', rank: '심령 기담·상상력의 환각(Spectre & Hallucination)', domains: ["심령 기담","1863 원서 삽화 수록","표트르 대제 외과의사","류트 연주와 해골","환각의 과학적 해명"] },
  'e3456-stadius': { category: 'person', rank: '프랑스 궁정 손금술사(Chiromancien)', domains: ["역사 인물","앙리 3세 궁정","수상술(손금)","교수형 선고 손금"] },
  'e3457-staffirs': { category: 'myth', rank: '몰다비아·왈라키아 악령(Spectres Dangereux)', domains: ["동유럽 민속","루마니아 민담","백의의 여인","길가의 망령"] },
  'e3458-stagirus': { category: 'person', rank: '고대 악령 빙의 수도사(Moine Possédé)', domains: ["교회사","요한 크리소스토모스","돼지 형상의 악마","퇴마 기도","빙의와 치유"] },
  'e3459-stalkers': { category: 'myth', rank: '플랑드르 소정령·고블린(Mauvais Gobelins)', domains: ["플랑드르 민속","벨기에 전설","악의적인 고블린","밤길 습격"] },
  'e3460-stanoska': { category: 'demon', rank: '동유럽 흡혈귀 전승 희생자(Vampire de Hongrie)', domains: ["흡혈귀 전승","1863 원서 삽화 수록","헝가리 흡혈귀","밀로 하이두크","무덤 말뚝 처형"] },
  'e3461-stauffenberger': { category: 'myth', rank: '독일 기사도 전설·물의 요정(Légende d’Undine)', domains: ["독일 전설","슈바벤 기사도","물의 요정(운디네)","결혼 서약 파기","천장의 푸른 발"] },
  'e3462-steganographie': { category: 'grimoire', rank: '비전 암호학·천사 강령 마도서(Grimoire Cryptographique)', domains: ["마도서·암호학","요하네스 트리테미우스","천사 소환 주문","비밀 서신 암호화","샤를 드 부벨"] },
  'e3463-steinerveronique': { category: 'person', rank: '오스트리아 영혼 감응 소녀(Visionnaire d’Autriche)', domains: ["요제프 괴레스","신비주의(Christliche Mystik)","영혼 감응","스타렌베르크 성"] },
  'e3464-steinlinjean': { category: 'person', rank: '콘스탄츠 시의원·사후 출현 유령(Revenant d’Altheim)', domains: ["역사 인물","1625년 사건","콘스탄츠 교구","사후 유령 소동","채무 변제 청원"] },
  'e3465-sternomancie': { category: 'divination', rank: '가슴·복부 소리 점술(Art Divinatoire par la Poitrine)', domains: ["점술·예언","가슴의 소리","복화술 신탁","빙의된 영의 음성"] },
  'e3466-stiffels': { category: 'person', rank: '독일 수학자·종말론 예언자(Mathématicien & Prophète)', domains: ["역사 인물","1863 원서 삽화 수록","종교개혁","1533년 종말론","수비학 예언 실패"] },
  'e3467-stoffler': { category: 'person', rank: '튀빙겐 대학 교수·점성술사(Mathématicien & Astrologue)', domains: ["점성술사","튀빙겐 대학교","1524년 대홍수 예언","물고기자리 행성 직렬"] },
  'e3468-stoicheomancie': { category: 'divination', rank: '고전 시구 서책 복술(Art Divinatoire par les Vers)', domains: ["점술·예언","호메로스 시편점","베르길리우스 신탁","무작위 시구 해석"] },
  'stolas': { category: 'demon', subCategory: 'monarch', rank: '지옥의 대군주(Grand Prince aux Enfers)', legions: 26, domains: ["악마학","지옥의 계급 체계","68대 목판화 도판 수록","26개 군단 지휘","왕관을 쓴 올빼미","천문학과 약초학"] },
  'e3470-stolisomancie': { category: 'divination', rank: '의복 착용 징조 점술(Présage du Vêtement)', domains: ["점술·예언","아우구스투스 황제","신발 거꾸로 신기","군사 반란 전조"] },
  'e3471-stollenwurms': { category: 'myth', rank: '알프스 전설의 괴룡·지룡(Dragon des Alpes)', domains: ["스위스 전설","알프스 괴수","베르너 오버란트","다리 달린 뱀","화염의 벼슬"] },
  'e3472-strasite': { category: 'superstition', rank: '신비 보석·약효 광물(Pierre Fabuleuse)', domains: ["미신·민속","보석 미신","소화 촉진","위장병 치유"] },
  'e3473-stratagemes': { category: 'superstition', rank: '환술 트릭·과학적 착시 해명(Artifices des Magiciens)', domains: ["환술의 역사","오자낭 수학 철학","자연 인광","스코틀랜드 켄트 백작","야간 도깨비불 트릭"] },
  'e3474-strauss': { category: 'person', rank: '독일 신학자·신화론 비판(Théologien & Sceptique)', domains: ["역사 인물","예수의 생애","신화론적 해석","19세기 종교 비판"] },
  'e3475-stryges': { category: 'myth', rank: '고대 그리스·로마 흡혈 괴물(Monstres Vampiriques)', domains: ["고대 신화","올빼미 마녀","유아 흡혈","살리카 법전","흡혈귀의 원형"] },
  'e3476-strauss': { category: 'person', rank: '동물 영성화 기담·목판화 도판(Portrait Satirique)', domains: ["역사 인물","1863 원서 삽화 수록","동물 영성화 학설","곰의 사유와 개의 언어","풍자 초상화"] },
  'e3477-stuffefrederic': { category: 'person', rank: '독일 마술사·황제 사칭자(Magicien Imposteur)', domains: ["역사 인물","합스부르크 루돌프 1세","신성로마제국 프리드리히 2세 사칭","악마의 군대 환각"] },
  'e3478-stumfpierre': { category: 'person', rank: '늑대인간 연쇄살인범·사형수(Loup-Garou de Bedburg)', domains: ["늑대인간 전승","베트부르크 늑대인간","악마의 벨트","연쇄살인","1589년 처형"] },
  'e3479-styx': { category: 'myth', rank: '그리스 신화 명계의 강·신들의 맹세(Fleuve des Enfers)', domains: ["그리스 신화","지하 명계","카론의 나룻배","아킬레우스의 발뒤꿈치","신들의 불가침 맹세"] },
  'e3480-succorbenoth': { category: 'demon', rank: '질투의 악마·베엘제붑의 환관장(Chef des Eunuques de Belzébuth)', domains: ["악마학","바빌론 우상","질투와 음란","열왕기하","환관들의 우두머리"] },
  'e3481-succubes': { category: 'demon', rank: '음란의 여성 몽마(Démons Femelles)', domains: ["악마학","몽마 전승","인큐버스와 서큐버스","정기 갈취","아담과 릴리스 전승"] },
  'e3482-sucre': { category: 'superstition', rank: '식품 미신·희귀 영약 전승(Superstition Médicale)', domains: ["미신·민속","테오프라스토스","갈대 꿀","연금술 영약"] },
  'e3483-suceursdemons': { category: 'demon', rank: '흡혈·생체 에너지 갈취 악령(Démons Vampiriques)', domains: ["악마학","요제프 괴레스 신비주의","에너지 흡혈","생명력 고갈"] },
  'e3484-sueur': { category: 'superstition', rank: '신체 분비물 미신(Superstition Populaire)', domains: ["미신·민속","인체 분비물","땀과 독약 속설","광견병 오해"] },
  'e3485-summanus': { category: 'myth', rank: '에트루리아·로마 야간 천둥신(Souverain des Mânes)', domains: ["로마 신화","에트루리아 신앙","밤의 벼락","지하 망령(마네스)의 군주","키르쿠스 막시무스"] },
  'e3486-sunnyass': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","힌두 고행","미신"] },
  'e3487-supercherie': { category: 'superstition', rank: '돌팔이 마술·유령 조작 사기극(Fraude & Superstition)', domains: ["미신 풍자","앙리 에티엔","묘지 도깨비불","가재와 촛불","사제들의 사기극"] },
  'e3488-superstitions': { category: 'superstition', rank: '신학적 미신 총론·도판 수록(Traité Théologique)', domains: ["미신 총론","1863 원서 삽화 수록","토마스 아퀴나스","우상숭배","점술과 주술"] },
  'e3489-sureau': { category: 'superstition', rank: '벽사 식물·반사 주술 비방(Plante Magique)', domains: ["미신·민속","딱총나무","마법 반사 주술","마녀의 저주 퇴치"] },
  'e3490-surtur': { category: 'myth', rank: '북유럽 신화 무스펠헤임의 군주(Géant du Feu)', domains: ["북유럽 신화","라그나로크","무스펠헤임","화염의 검","비프로스트 파괴"] },
  'e3491-sustrugiel': { category: 'demon', rank: '마술 전수 악마·사역마의 부여관(Démon des Clavicules)', domains: ["마도서","솔로몬의 열쇠","마술 비전 전수","사역마 소환"] },
  'e3492-suttee': { category: 'superstition', rank: '인도 종교 잔혹 풍습(Coutume Indienne)', domains: ["인도 민속","사티 의식","장례 풍습","화장 장작더미","영국령 인도 탄압"] },
  'e3493-swedenborgemmanuel': { category: 'person', rank: '스웨덴 신비주의 철학자·영계 투시가(Visionnaire Suédois)', domains: ["역사 인물","1863 원서 삽화 수록","천국과 지옥","스톡홀름 대화재 투시","영계 소통"] },
  'e3494-sycomancie': { category: 'divination', rank: '식물 잎 건조 점술(Art Divinatoire par les Feuilles)', domains: ["점술·예언","무화과 잎","건조 속도 징조","고대 그리스 점술"] },
  'e3495-sydonay': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","악마학","아스모데우스"] },
  'e3496-sylla': { category: 'person', rank: '로마 독재관·불길한 징조(Dictateur Romain)', domains: ["로마 역사","공중의 검은 염소","내전의 징조","로마 내전"] },
  'e3497-sylphes': { category: 'myth', rank: '4대 원소 정령·공기의 영(Esprits Élémentaires de l’Air)', domains: ["연금술","파라켈수스","가발리스 백작","공기의 정령","바람과 투명성"] },
  'e3498-sylvestreii': { category: 'person', rank: '학자 교황·청동 머리 신탁 오토마타(Pape & Savant)', domains: ["교회사","제르베르 드 오리야크","아랍 수학과 천문학","청동 머리 오토마타","악마와의 계약설"] },
  'e3499-symandius': { category: 'person', rank: '고대 이집트 파라오·황금 천문비(Roi d’Égypte)', domains: ["고대 이집트","람세스 2세","순금의 365큐빗 원판","천문 관측","연금술 대작업"] },
  'e3500-sympathie': { category: 'superstition', rank: '우주 조화·교감 오컬트 총론(Magie Sympathique)', domains: ["오컬트 원리","대우주와 소우주","별자리 상응","무기 연고(Unguentum Armarium)","유감 주술"] },
  'e3501-syrenes': { category: 'myth', rank: '바다의 매혹 괴물·반인반어(Monstres Marins)', domains: ["고대 신화","1863 원서 삽화 수록","호메로스 오디세이아","매혹의 노랫소리","인어 목격담"] },
  'e3502-syrrochite': { category: 'superstition', rank: '신비 보석·강령술 결박석(Pierre des Nécromanciens)', domains: ["미신·민속","플리니우스 박물지","강령술","망령의 결박","보석 비방"] },
  'e3503-sytry': { category: 'demon', subCategory: 'monarch', rank: '지옥의 대공(Grand Prince aux Enfers)', legions: 60, domains: ["악마학","지옥의 계급 체계","60개 군단 지휘","그리폰 날개와 표범","사랑과 욕망 유발"] },
  'e2167-jean': { category: 'person', rank: '마법사·비술사(Magicien)', domains: ['인물·역사(Personnage)', '서양 마법사', '비전 마법'] },
  'e2168-jean': { category: 'person', rank: '총대주교·비술사(Patriarche & Enchanteur)', domains: ['인물·역사(Personnage)', '교회 인물·성직자', '비잔티움 역사'] },
  'e2169-jeanxxii': { category: 'person', rank: '교황·역사 인물(Pape & Personnage)', domains: ['인물·역사(Personnage)', '교회 인물·성직자', '가톨릭 역사'] },
  'e2170-jean': { category: 'person', rank: '역사 속 군주·귀족(Souverain & Personnage)', domains: ['인물·역사(Personnage)', '유럽 군주·귀족', '러시아 역사'] },
  'e3011-phenix': { category: 'demon', rank: '지옥의 후작(Marquis de l’Enfer)', legions: 20, domains: ['악마학(Démonologie)', '지옥의 계급 체계', '고위 악마'] },
  'e3012-phenix': { category: 'superstition', rank: '신비 동물·상징(Superstition Animale)', domains: ['미신·민속(Superstition)', '신비 동물·상징', '고대 신화'] },
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

  // T entries curated metadata (p.645-672)
  'e3504-taaora': { category: 'myth', rank: '타히티 신화의 최고 창조신(Dieu Créateur de Tahiti)', domains: ["신화·전설(Mythologie)","폴리네시아 신화","타히티 창조 신화","우주 창조신"] },
  'e3505-tabac': { category: 'superstition', rank: '식물 약효와 악마적 미신(Histoire et Superstition du Tabac)', domains: ["미신·민속(Superstition)","식물 민속","장 니코와 프랜시스 드레이크","악마의 풀 미신"] },
  'e3506-tablestournantes': { category: 'superstition', rank: '19세기 영매술과 회전 탁자 현상(Spiritisme et Tables Parlantes)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","19세기 강신술","테이블 터닝","영매와 폴터가이스트"] },
  'e3507-taciturnite': { category: 'superstition', rank: '심문과 고문을 견디는 악마의 침묵 주술(Charme de Silence)', domains: ["미신·민속(Superstition)","마녀재판","고문 무력화 주술","침묵의 매듭"] },
  'e3508-tacouins': { category: 'myth', rank: '이슬람 민속의 선한 운명 요정(Fées Bienfaisantes Musulmanes)', domains: ["신화·전설(Mythologie)","이슬람 민속","선한 요정","운명의 인도자"] },
  'e3509-taillepiednoel': { category: 'person', rank: '프란체스코회 수도사·유령학 저술가(Théologien et Démonologue)', domains: ["인물·문헌(Personnages)","16세기 신학자","유령론(Traité de l’Apparition)","영혼의 사후 세계"] },
  'e3510-tailletrouxjeanne': { category: 'person', rank: '푸아투 몽모리용의 마녀 재판 피고인(Sorcière Accusée de Poitou)', domains: ["인물·문헌(Personnages)","마녀재판","푸아투 민속","사바트 참석 혐의"] },
  'e3511-taingairi': { category: 'myth', rank: '칼미크 신화의 천체 운행 공중 정령(Esprits Aériens des Kalmouks)', domains: ["신화·전설(Mythologie)","칼미크 신화","별의 운행","공중의 정령"] },
  'e3512-talapoins': { category: 'person', rank: '시암(태국)의 승려·주술사 전승(Prêtres et Magiciens de Siam)', domains: ["인물·문헌(Personnages)","동남아시아 종교","시암 왕국","승려와 주술 전승"] },
  'e3513-talismans': { category: 'superstition', rank: '행성과 별자리의 감응 인장 총론(Art et Vertu des Talismans)', domains: ["미신·민속(Superstition)","탈리스만","행성 인장","아랍·유대 카발라","점성술 부적"] },
  'e3514-talissons': { category: 'person', rank: '고대 프로이센의 이교 제사장(Prêtres Païens des Prussiens)', domains: ["인물·문헌(Personnages)","발트 이교","고대 프로이센","이교 제사장"] },
  'e3515-talmud': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","유대 문헌","탈무드"] },
  'e3516-talys': { category: 'superstition', rank: '인도 힌두 혼례의 액막이 부적 목걸이(Amulette de Mariage Hindoue)', domains: ["미신·민속(Superstition)","힌두 민속","혼례 의식","망갈라 수트라","액막이 목걸이"] },
  'e3517-tambourmagique': { category: 'superstition', rank: '라플란드 샤먼의 주술·점술용 북(Tambour Magique des Lapons)', domains: ["미신·민속(Superstition)","라플란드 사미족","샤머니즘","점술 북","트랜스 상태"] },
  'e3518-tamaracunga': { category: 'superstition', rank: '페루 잉카 소년의 악마 퇴치 기담(Histoire d’un Jeune Péruvien)', domains: ["미신·민속(Superstition)","페루 식민지 전승","악마의 괴롭힘","성수와 퇴마"] },
  'e3519-tamisdivinationparle': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","체 점술","도둑 찾기"] },
  'e3520-tamous': { category: 'superstition', rank: '칼미크 불교의 암흑 지옥(Enfer Général des Kalmouks)', domains: ["미신·민속(Superstition)","칼미크 불교","지옥 형벌","황소 머리 악마"] },
  'e3521-tanaquil': { category: 'person', rank: '에트루리아 출신의 로마 예언자 왕비(Reine et Devin Étrusque)', domains: ["인물·문헌(Personnages)","로마 역사","에트루리아 점술","조점술(鳥占術)"] },
  'e3522-tanchelm': { category: 'person', rank: '12세기 플랑드르의 광신적 이단자(Hérétique Dissolu du XIIe Siècle)', domains: ["인물·문헌(Personnages)","중세 이단사","앤트워프","거짓 예언과 광신"] },
  'e3523-taniwoa': { category: 'myth', rank: '뉴질랜드 마오리 신화의 바다 괴수·수호신(Monstre Marin Maori)', domains: ["신화·전설(Mythologie)","마오리 신화","바다의 정령","바다 괴수"] },
  'e3524-tanner': { category: 'person', rank: '마녀재판 고문에 반대한 예수회 신학자(Théologien Jésuite)', domains: ["인물·문헌(Personnages)","1863 원서 삽화 수록","예수회 신학자","마녀재판 비판","관솔불 전설"] },
  'tap': { category: 'demon', subCategory: 'monarch', rank: '지옥의 대총재·대군주(Grand Président et Grand Prince)', legions: 60, domains: ["악마학(Démonologie)","지옥의 계급 체계","1863 원서 삽화 수록","루이 브르통 68대 목판화","철학과 교양학예","순간 공간 이동"] },
  'e3526-tarentule': { category: 'superstition', rank: '남부 이탈리아 거미 물림과 춤추는 광기 미신(Superstition du Tarantisme)', domains: ["미신·민속(Superstition)","타란티즘","이탈리아 풀리아 민속","음악 치료","타란텔라 춤"] },
  'e3527-tarni': { category: 'superstition', rank: '칼미크 불교의 퇴마·축귀 주문 진언(Formules d’Exorcisme Kalmoukes)', domains: ["미신·민속(Superstition)","칼미크 민속","불교 다라니","퇴마 부적"] },
  'e3528-taroataihetomeo': { category: 'myth', rank: '타히티 섬의 최고신(Dieu Suprême d’Otahiti)', domains: ["신화·전설(Mythologie)","타히티 신화","타아로아","폴리네시아 신앙"] },
  'e3529-tarots': { category: 'divination', rank: '78장 상징 카드와 아르카나 점술 총론(Cartes Tarotées et Cartomancie)', domains: ["점술·예언(Divination)","타로 점술","대아르카나","카드 점술(Cartomancie)","오컬트 상징"] },
  'e3530-tartara': { category: 'superstition', rank: '도피네 예언자들의 거짓 승리 함성(Cri Prophétique du Dauphiné)', domains: ["미신·민속(Superstition)","프랑스 도피네 민속","거짓 예언","광신적 함성"] },
  'e3531-tartare': { category: 'myth', rank: '그리스 신화의 지하 심연과 명계(Enfer des Anciens Grecs)', domains: ["신화·전설(Mythologie)","그리스 신화","하데스와 타르타로스","플레게톤 강","티시포네"] },
  'e3532-tartini': { category: 'person', rank: '꿈속 악마의 바이올린 연주 전승(Sonate du Diable)', domains: ["인물·문헌(Personnages)","음악가 전기","악마의 트릴 소나타","꿈속 악마 영감"] },
  'e3533-tassotorquato': { category: 'person', rank: '이탈리아 서사시인·점성술과 수호령 전승(Poète Italien et Astrologie)', domains: ["인물·문헌(Personnages)","이탈리아 르네상스 문학","해방된 예루살렘","점성술 예언","수호령 전승"] },
  'e3534-tatien': { category: 'person', rank: '2세기 교부이자 극단적 금욕주의 이단 수장(Chef des Encratites)', domains: ["인물·문헌(Personnages)","초기 기독교 이단","엔크라티테스파","극단적 금욕주의"] },
  'e3535-taupe': { category: 'superstition', rank: '고대 내장 점술과 민간 치료 마술(Divination et Médecine Populaire)', domains: ["미신·민속(Superstition)","동물 민속","플리니우스 내장 점술","두더지 손 치료 마술"] },
  'e3536-tauses': { category: 'myth', rank: '독일 민속의 수면 가위눌림 악령(Esprits Malins du Cauchemar)', domains: ["신화·전설(Mythologie)","독일 민속","인쿠부스","가위눌림과 악몽"] },
  'e3537-tavides': { category: 'superstition', rank: '몰디브 제도의 액막이·사랑의 묘약 글귀(Caractères Magiques des Maldives)', domains: ["미신·민속(Superstition)","몰디브 민속","액막이 문자","사랑의 묘약 부적"] },
  'e3538-taymural': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","페르시아 신화","진니스탄"] },
  'e3539-tee': { category: 'myth', rank: '타히티 각 가문의 수호 조상 영령(Génie Protecteur d’Otahiti)', domains: ["신화·전설(Mythologie)","타히티 민속","조상신","수호 영령","치유와 질병"] },
  'e3540-tehuptehuh': { category: 'myth', rank: '부탄 산악의 쇠사슬 다리를 놓은 수호 정령(Génie Constructeur du Boutan)', domains: ["신화·전설(Mythologie)","부탄 신화","철교 가설 전설","히말라야 수호신"] },
  'e3541-tell': { category: 'myth', rank: '스위스 동굴에 잠든 세 명의 구원자 전설(Les Trois Sauveurs de la Suisse)', domains: ["신화·전설(Mythologie)","스위스 건국 전설","빌헬름 텔","잠자는 영웅 모티프","알프스 동굴"] },
  'e3542-tellezgabriel': { category: 'person', rank: '스페인 극작가·메르세드 수도회 사제(Dramaturge et Religieux Espagnol)', domains: ["인물·문헌(Personnages)","스페인 황금세기 연극","설교하는 악마","티르소 데 몰리나"] },
  'e3543-temperature': { category: 'superstition', rank: '고대 사제들의 피의 제례와 일기예보 책력(Observation et Présages du Temps)', domains: ["미신·민속(Superstition)","기상 점술","피의 희생 기우제","알마낙 책력","마티외 란스베르크"] },
  'e3544-tempetes': { category: 'superstition', rank: '해상 돌풍과 파도를 일으키는 북유럽 마술 전승(Tempêtes Soulevées par la Sorcellerie)', domains: ["미신·민속(Superstition)","발트해 해상 마법","폭풍 소환 주술","선원들의 미신"] },
  'e3545-templiers': { category: 'person', rank: '중세 종교 기사단과 이단·마법 기소 총론(Ordre Religieux et Procès)', domains: ["인물·문헌(Personnages)","성전기사단","바포메트 우상","알비파 이단 연루","필리프 4세와 클레멘스 5세"] },
  'e3546-temzarpouliet': { category: 'myth', rank: '프랑스 브르타뉴의 변신 집요정(Lutin Domestique en Bretagne)', domains: ["신화·전설(Mythologie)","브르타뉴 민속","집요정(뤼탱)","변신 요정"] },
  'e3547-templiers': { category: 'person', rank: '기사단장 자크 드 몰레의 화형과 저주 전설(Supplice du Grand Maître)', domains: ["인물·문헌(Personnages)","1863 원서 삽화 수록","자크 드 몰레","노트르담 대성당 화형식","필리프 4세"] },
  'e3548-tenare': { category: 'myth', rank: '고대 그리스 신화의 명계 출입구 동굴(Soupirail des Enfers)', domains: ["신화·전설(Mythologie)","그리스 신화","하데스의 입구","케르베로스","헤라클레스"] },
  'e3549-tenebres': { category: 'superstition', rank: '악마들을 어둠의 권능이라 부르는 신학적 이유(Puissances des Ténèbres)', domains: ["미신·민속(Superstition)","기독교 신학","빛과 어둠의 대립","타락천사의 추락"] },
  'e3550-tentations': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","악마학","성 안토니우스의 유혹","악마의 유혹"] },
  'e3551-tephramancie': { category: 'divination', rank: '제물과 제단이 탄 재로 치는 고대 점술(Divination par la Cendre)', domains: ["점술·예언(Divination)","고대 점술","제물의 재","상형문자 해독"] },
  'e3552-teratoscopie': { category: 'divination', rank: '기형 생명체와 괴물의 출현으로 미래를 읽는 점술(Présages des Monstres)', domains: ["점술·예언(Divination)","괴물과 흉조","기형 출산","로마 점술"] },
  'e3553-terragon': { category: 'demon', rank: '앙리 3세 비방 팜플렛의 사형집행인 악마(Démon Bourreau)', domains: ["악마학(Démonologie)","프랑스 종교전쟁","앙리 3세 비방","사형집행 악마"] },
  'e3554-terre': { category: 'superstition', rank: '흙의 신비한 영양과 기이한 미신(Mangeurs de Terre)', domains: ["미신·민속(Superstition)","식토증(토식)","펠릭스 노가레","토양 영양 미신"] },
  'e3555-terrestres': { category: 'demon', rank: '칼데아인들이 분류한 땅과 지하의 악마(Démons Terrestres et Souterrains)', domains: ["악마학(Démonologie)","고대 칼데아 악마학","지상령과 지하령","광산과 동굴"] },
  'e3556-terreurspaniques': { category: 'superstition', rank: '밤중 묘지에서 겪는 갑작스러운 환각 공포(Peur Soudaine et Irraisonnée)', domains: ["미신·민속(Superstition)","판(Pan) 신","야간 묘지 공포","환각과 심리 기담"] },
  'e3557-terrier': { category: 'demon', rank: '사바트 호칭 기도에서 불리는 악마(Démon Invoqué au Sabbat)', domains: ["악마학(Démonologie)","사바트 악마","마녀의 호칭 기도","프랑스 악마학"] },
  'e3558-tervagant': { category: 'myth', rank: '중세 무훈시에서 사라센의 수호 악마로 오인된 우상(Fausse Idole Médiévale)', domains: ["신화·전설(Mythologie)","중세 십자군 문학","롤랑의 노래","가상의 사라센 우상"] },
  'e3559-tervilles': { category: 'myth', rank: '노르웨이 숲에 드롤과 함께 사는 악령(Démons de Norvège)', domains: ["신화·전설(Mythologie)","노르웨이 민속","북유럽 트롤","숲의 악령"] },
  'e3560-tespesion': { category: 'person', rank: '나무들에게 말을 건네 화답을 받은 인도 마법사(Enchanteur Gymnosophiste)', domains: ["인물·문헌(Personnages)","인도 짐노소피스트","필로스트라토스","나무와의 대화 마술"] },
  'e3561-tete': { category: 'divination', rank: '플레곤이 기록한 전사한 시인의 예언 머리(Tête Prophétique de Phlégon)', domains: ["점술·예언(Divination)","고대 강령술","말하는 머리","플레곤의 기담"] },
  'e3562-tetedebophomet': { category: 'superstition', rank: '성전기사단의 신비한 우상 머리 유물 고찰(Idole Mystérieuse des Templiers)', domains: ["미신·민속(Superstition)","성전기사단","바포메트","요제프 폰 함머","금지된 우상"] },
  'e3563-tetedemort': { category: 'divination', rank: '해골을 통한 수명과 죽음의 시간 예언(Nécromancie par le Crâne)', domains: ["점술·예언(Divination)","강령술","해골 점술","죽음의 예언"] },
  'e3564-tetedesaintjean': { category: 'person', rank: '17세기 점술가의 거짓 예언 머리 장치(Supercherie d’un Devin)', domains: ["인물·문헌(Personnages)","점술 사기극","17세기 기계 장치","세례자 요한"] },
  'e3565-tetesdeserpent': { category: 'superstition', rank: '칼 폰 린네가 함부르크에서 폭로한 괴수 박제 사기(Supercherie Démasquée par Linné)', domains: ["미신·민속(Superstition)","칼 폰 린네","함부르크의 칠두사","박제 사기극","요한계시록 괴수"] },
  'e3566-tetragrammaton': { category: 'superstition', rank: '유대 카발라와 마법 소환의 신성한 네 글자(Nom Sacré de Quatre Lettres)', domains: ["미신·민속(Superstition)","유대 카발라","야훼(YHWH)","마법 소환과 퇴마"] },
  'e3567-teula': { category: 'superstition', rank: '스코틀랜드의 영혼 신기루 현상과 미신(Sorte de Mirage en Écosse)', domains: ["미신·민속(Superstition)","스코틀랜드 하이랜드","신기루 현상","도플갱어와 흉조"] },
  'e3568-teusarpouliet': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","브르타뉴 민속","집요정"] },
  'e3569-teuss': { category: 'myth', rank: '프랑스 피니스테르의 선량한 수호 요정(Génie Bienfaisant du Finistère)', domains: ["신화·전설(Mythologie)","브르타뉴 피니스테르","선량한 요정","가정 수호령"] },
  'e3570-teutates': { category: 'myth', rank: '켈트 골족의 지하 명계 신이자 수호신(Pluton des Gaulois)', domains: ["신화·전설(Mythologie)","켈트 갈리아 신화","드루이드 숲","인간 희생 제의"] },
  'e3571-thalmud': { category: 'superstition', rank: '유대 랍비 전승과 미슈나·게마라 총론(Doctrine et Contes Merveilleux des Juifs)', domains: ["미신·민속(Superstition)","유대교 문헌","미슈나와 게마라","유다 하-나시","신비주의와 설화"] },
  'e3572-thamus': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","그리스 신화","위대한 판의 죽음"] },
  'e3573-thamuz': { category: 'demon', subCategory: 'subordinate', rank: '지옥 제2계급 악마·화포와 화염의 창시자(Démon du Second Ordre)', domains: ["악마학(Démonologie)","지옥의 계급 체계","화포와 대포의 발명자","화염과 석쇠","여성의 팔찌"] },
  'e3574-theagenes': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","그리스 신화","신탁"] },
  'e3575-theantis': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","신비한 여인","오페레이트"] },
  'e3576-themeceleste': { category: 'divination', rank: '점성술 천체 배치도 작도법과 황도십이궁(Figure d’Astrologie)', domains: ["점술·예언(Divination)","점성술","천궁도 작도","12궁과 12하우스"] },
  'e3577-themura': { category: 'divination', rank: '유대 카발라의 글자 치환·조합 비술(Division de la Cabale)', domains: ["점술·예언(Divination)","유대 카발라","문자 치환술","비밀 성호 해독"] },
  'e3578-theoclimene': { category: 'person', rank: '호메로스 오디세이아에 등장하는 멜람푸스 가문의 예언자(Devin Grec)', domains: ["인물·문헌(Personnages)","그리스 신화","오디세이아","구혼자들의 최후 예언"] },
  'e3579-theodat': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","동고트 왕국","이름 점술"] },
  'e3580-theodoric': { category: 'person', rank: '동고트 왕의 환각과 죄책감의 비참한 최후(Roi des Goths et Remords)', domains: ["인물·문헌(Personnages)","1863 원서 삽화 수록","동고트 테오도리쿠스 대왕","보이티우스 처형","식탁의 머리 환각"] },
  'e3581-theodose': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","로마 황제","수탉 점술"] },
  'e3582-theomancie': { category: 'divination', rank: '하느님의 거룩한 이름과 신성 기적 비술(Mystères de la Divine Majesté)', domains: ["점술·예언(Divination)","유대 카발라","신성 신명","모세와 엘리야의 기적"] },
  'e3583-theophile': { category: 'person', rank: '성모 마리아에게 참회하여 악마 계약을 파기한 성자(Pacte Diabolique et Repentir)', domains: ["인물·문헌(Personnages)","중세 파우스트 전승 모태","아다나의 테오필루스","피로 쓴 악마 계약","성모 마리아의 구원"] },
  'e3584-theraphim': { category: 'superstition', rank: '고대 히브리인들의 청동 해시계 부적과 예언 우상(Idoles et Talismans Hébreux)', domains: ["미신·민속(Superstition)","성서 고고학","히브리 가정 우상","만드라고라","해시계 부적"] },
  'e3585-thermometre': { category: 'person', rank: '시베리아 빙판에서 온도계로 마법사를 자처한 탐험 일화(Ruse Scientifique)', domains: ["인물·문헌(Personnages)","과학사 일화","시베리아 토볼스크 탐험","온도계 마술 사칭"] },
  'e3586-thespesius': { category: 'myth', rank: '플루타르코스가 기록한 킬리키아인의 영계 환시(Vision de l’Autre Monde)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","플루타르코스","영혼의 사후 세계","환생과 업보"] },
  'e3587-thessaliennes': { category: 'myth', rank: '달을 끌어내리는 고대 그리스 테살리아의 마술 전승(Sorcières de Thessalie)', domains: ["신화·전설(Mythologie)","고대 그리스 마법","달을 끌어내리는 주술","아풀레이우스","황금 당나귀"] },
  'e3588-theurgie': { category: 'divination', rank: '천사와 신적 존재와의 영적 교신을 추구하는 신성 비술(Magie Blanche et Divine)', domains: ["점술·예언(Divination)","신플라톤주의","야블리코스","정화 의식","천사와의 교신"] },
  'e3589-thiersjeanbaptiste': { category: 'person', rank: '소르본 신학자·미신 연구의 대학자(Auteur du Traité des Superstitions)', domains: ["인물·문헌(Personnages)","17세기 신학자","미신론(Traité des Superstitions)","민간 풍습 비판"] },
  'e3590-thomassaint': { category: 'person', rank: '중세 가톨릭의 보편박사·천사와 악마 신학(Docteur Angélique)', domains: ["인물·문헌(Personnages)","중세 스콜라 철학","신학대전","천사론과 악마론"] },
  'e3591-thomas': { category: 'superstition', rank: '수도원에 나타나 회개의 설교를 전한 악마 기담(Conte Populaire Diabolique)', domains: ["미신·민속(Superstition)","중세 설화집","사순절 설교","악마의 절망"] },
  'e3592-thor': { category: 'myth', rank: '게르만·노르드 신화의 천둥과 벼락의 신(Dieu de la Foudre Germanique)', domains: ["신화·전설(Mythologie)","북유럽 신화","천둥신 토르","묠니르 망치","거인 퇴치"] },
  'e3593-thou': { category: 'person', rank: '프랑스 역사가 드 투가 겪은 방앗간의 흑요정 소동(Aventure Singulière de 1598)', domains: ["인물·문헌(Personnages)","프랑스 역사가","1598년 유령 소동","밀가루 방앗간의 악령"] },
  'e3594-thuggisme': { category: 'superstition', rank: '칼리 여신에게 여행자를 바치던 인도 비밀 암살 교단(Secte des Thugs)', domains: ["미신·민속(Superstition)","인도 암살단","칼리 여신 숭배","노란 스카프 교살","은밀한 종교 범죄"] },
  'e3595-thurifumie': { category: 'divination', rank: '유향이 타오르는 연기의 모양으로 치는 고대 점술(Divination par l’Encens)', domains: ["점술·예언(Divination)","고대 점술","향 연기 관찰","리바노만시"] },
  'e3596-thymiamata': { category: 'superstition', rank: '고대 그리스·로마 신전의 제의용 성스러운 향료(Parfums Sacrés des Anciens)', domains: ["미신·민속(Superstition)","고대 향료","신전 제의","악령 퇴치 분향"] },
  'e3597-thyreepierre': { category: 'person', rank: '빙의와 악령의 출현에 관한 16세기 예수회 신학자(Théologien Jésuite Démonologue)', domains: ["인물·문헌(Personnages)","예수회 신학자","빙의와 구마","유령론(De Apparitionibus)"] },
  'e3598-tibalang': { category: 'myth', rank: '필리핀 민속의 사람을 홀리는 긴 다리의 반인반마 숲 정령(Fantôme des Philippines)', domains: ["신화·전설(Mythologie)","필리핀 민속","반인반마 정령","숲속의 환각","길 잃게 만드는 요괴"] },
  'e3599-tibere': { category: 'person', rank: '어둠 속을 꿰뚫어 보았다는 로마 황제의 신비한 시력(Vision dans les Ténèbres)', domains: ["인물·문헌(Personnages)","로마 제정사","야간 시력","수에토니우스 기록"] },
  'e3600-tichobrahe': { category: 'person', rank: '노파나 토끼를 마주치면 불길하여 귀가했던 덴마크 천문학자(Astronome Danois)', domains: ["인물·문헌(Personnages)","과학사 인물","튀코 브라헤","천문학자의 미신","토끼와 노파의 흉조"] },
  'e3601-tiecklouis': { category: 'person', rank: '독일 낭만파 작가·15세기 아르투아 마녀재판 소설(Écrivain Romantique Allemand)', domains: ["인물·문헌(Personnages)","독일 낭만주의","마녀들의 사바트","아르투아 발도파 재판"] },
  'e3602-tigrelegrand': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","동물 전승","토끼와 호랑이"] },
  'e3603-tintement': { category: 'superstition', rank: '귀울림으로 타인의 험담을 감지하는 민간 미신(Croyance Populaire Ancienne)', domains: ["미신·민속(Superstition)","신체 징후 미신","이명과 귓속 울림","타인의 험담"] },
  'e3604-tiphaine': { category: 'person', rank: '남편의 운명을 예언했던 브르타뉴의 신비한 요정 여인(Dame Prophétique de Bretagne)', domains: ["인물·문헌(Personnages)","브르타뉴 역사","뒤 게클랭 장군","점성술 예언","요정 여인 전승"] },
  'e3605-tiromancie': { category: 'divination', rank: '치즈의 응고와 구멍 형태로 미래를 점치던 고대 비술(Divination par le Fromage)', domains: ["점술·예언(Divination)","고대 점술","치즈 발효와 구멍","음식 점술"] },
  'e3606-titania': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","요정 신화","오베론과 티타니아"] },
  'e3607-titus': { category: 'person', rank: '예루살렘 성전 파괴 후 벌레로 고통받다 숨진 탈무드 전설(Légende Talmudique)', domains: ["인물·문헌(Personnages)","탈무드 전설","로마 황제 티투스","신의 징벌","뇌 속의 벌레"] },
  'e3608-toia': { category: 'demon', rank: '플로리다 인디언들이 숭배하던 악령이자 악의 근원(Démon de la Floride)', domains: ["악마학(Démonologie)","아메리카 인디언 신앙","플로리다 부족","악의 근원"] },
  'e3609-tombeaux': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","강령술","망자와의 교신","무덤 수면 신탁"] },
  'e3610-tomtegobbe': { category: 'myth', rank: '스웨덴 농가 다락방의 수호 난쟁이 집요정(Lutin Suédois)', domains: ["신화·전설(Mythologie)","스웨덴 민속","톰테(Tomte)","다락방 노인","가축 수호 요정"] },
  'e3611-tondal': { category: 'myth', rank: '아일랜드 기사가 천사의 인도로 지옥과 천국을 본 설화(Vision de l’Enfer)', domains: ["신화·전설(Mythologie)","중세 내세 환시 문학","아일랜드 기사 톤달","지옥의 유황과 냉기","참회와 회개"] },
  'e3612-tonnerre': { category: 'superstition', rank: '천둥의 신격화와 벼락을 막는 민간 액막이(Culte et Préservatifs du Tonnerre)', domains: ["미신·민속(Superstition)","자연물 숭배","싱할라족 전승","브르타뉴 쇠붙이 부적","교회 종소리"] },
  'e3613-topielnitsys': { category: 'myth', rank: '러시아와 폴란드의 물가에서 춤추는 익사자 수령(Esprits des Eaux en Russie)', domains: ["신화·전설(Mythologie)","슬라브 민속","익사자의 원혼","물귀신","토피엘레츠"] },
  'e3614-toqui': { category: 'myth', rank: '칠레 아라우카니아(마푸체) 인디언의 최고신(Dieu Suprême des Araucaniens)', domains: ["신화·전설(Mythologie)","마푸체 신화","남미 인디언 신앙","게쿠바 악마와의 대결"] },
  'torngarsuk': { category: 'myth', rank: '그린란드 이누이트 신화의 바다와 북극의 대정령', legions: 0, domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","루이 브르통 68대 목판화","이누이트 신화","샤먼 앙가코크","바다와 어업의 수호 정령"] },
  'e3616-torquemadaantoinede': { category: 'person', rank: '스페인 기담집 육일담의 작가(Auteur Espagnol de l’Hexameron)', domains: ["인물·문헌(Personnages)","스페인 르네상스 문학","육일담(Hexameron)","유령과 환상 기담"] },
  'e3617-torreblancafrancois': { category: 'person', rank: '스페인 코르도바의 법학자·마술 범죄론 저자(Jurisconsulte de Cordoue)', domains: ["인물·문헌(Personnages)","스페인 법학자","마술 범죄론(Epitome Delictorum)","종교재판 법학"] },
  'e3618-torture': { category: 'superstition', rank: '마녀가 고통을 느끼지 못하도록 악마가 돕는다는 미신(Insensibilité à la Douleur)', domains: ["미신·민속(Superstition)","마녀재판","종교재판 고문","무감각 부적","악마의 마취 주술"] },
  'e3619-totam': { category: 'superstition', rank: '북미 원주민 개인과 부족의 수호동물 영령(Esprit Gardien des Indiens)', domains: ["미신·민속(Superstition)","북미 인디언 신앙","토테미즘","수호동물 금기"] },
  'e3620-toupan': { category: 'demon', rank: '브라질 투피족의 천둥과 벼락을 다스리는 영령(Esprit Malin du Tonnerre)', domains: ["악마학(Démonologie)","브라질 투피 신화","천둥의 악령","번개와 폭풍"] },
  'e3621-tourdeforce': { category: 'superstition', rank: '마르틴 델리오가 전하는 희극적인 마법 대결 일화(Histoire Plaisante de Delrio)', domains: ["미신·민속(Superstition)","마르틴 델리오 악마학","궁정 마술 대결","희극적 마술 일화"] },
  'e3622-tourdemontpellier': { category: 'superstition', rank: '세상의 종말 직전에 무너진다는 몽펠리에의 고탑 전설(Vieille Tour Légendaire)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","몽펠리에 전설","우주의 종말 예언","고탑 전설"] },
  'e3623-tourdesrats': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","라인강 전설","하토 주교"] },
  'e3624-tourdewigla': { category: 'superstition', rank: '성녀를 고문한 뒤 벼락에 불타는 노르웨이의 저주받은 탑(Tour Maudite de Norvège)', domains: ["미신·민속(Superstition)","노르웨이 전설","이교 왕 베르문트","성 에텔레다","하늘의 벼락"] },
  'e3625-tourterelle': { category: 'superstition', rank: '비둘기 심장과 탈모 민간 비술(Superstitions et Sortilèges)', domains: ["미신·민속(Superstition)","동물 민속","비둘기 심장","늑대 가죽 부적","탈모 주술"] },
  'e3626-traditionspopulaires': { category: 'superstition', rank: '동서양 민담과 신화 속 선악 대결 총론(Antagonisme du Bien et du Mal)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","민간 전승 철학","선과 악의 이원론","민담 비교 연구"] },
  'e3627-traire': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","마녀의 가축 주술","블로쿨라"] },
  'e3628-trajan': { category: 'person', rank: '디오 카시우스가 기록한 파르티아 원정 중 폭풍우 환각(Histoire de Dion Cassius)', domains: ["인물·문헌(Personnages)","로마 제정사","트라야누스 황제","파르티아 원정","번개와 폭풍 환각"] },
  'e3629-transmigrationdesames': { category: 'superstition', rank: '엠페도클레스와 피타고라스의 윤회론 고찰(Métempsycose et Philosophie Ancienne)', domains: ["미신·민속(Superstition)","고대 그리스 철학","피타고라스 윤회설","환생과 동물 변신"] },
  'transport-sorcerers': { category: 'myth', rank: '숫염소를 타고 밤하늘을 날아 사바트로 향하는 마녀 비행 전승', legions: 0, domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","루이 브르통 68대 목판화","사바트 야간 비행","하늘을 나는 숫염소","비행 연고"] },
  'e3631-trasulle': { category: 'person', rank: '로도스섬에서 티베리우스의 살해 음모를 간파한 점성술사(Astrologue de Tibère)', domains: ["인물·문헌(Personnages)","로마 제정사","티베리우스 황제","점성술 예언","절벽 살해 음모"] },
  'e3632-trazegnies': { category: 'myth', rank: '벨기에 유서 깊은 성에 출몰하는 백부인 유령 전설(Dame Blanche Fantôme)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","벨기에 귀족 가문","성채의 유령","백부인(Dame Blanche)"] },
  'e3633-trazgos': { category: 'myth', rank: '스페인·갈리시아 민속의 장난꾸러기 집요정(Lutins Espagnols)', domains: ["신화·전설(Mythologie)","스페인 민속","집요정(고블린)","가사 도우미","심술궂은 장난"] },
  'e3634-trefleaquatrefeuilles': { category: 'superstition', rank: '악령을 꿰뚫어 보게 해주는 신비한 네잎클로버 미신(Herbe Magique)', domains: ["미신·민속(Superstition)","식물 민속","네잎클로버","교수대 아래 피의 풀","투시력과 행운"] },
  'e3635-tregitourie': { category: 'superstition', rank: '중세 네크로맨서와 요술쟁이들의 시각적 환영술(Art des Illusions)', domains: ["미신·민속(Superstition)","중세 요술","환영 마법","트레제투어(요술쟁이)"] },
  'e3636-treize': { category: 'superstition', rank: '식탁의 13인과 최후의 만찬에서 유래한 불길한 숫자 미신(Nombre Fatidique)', domains: ["미신·민속(Superstition)","수비학 미신","숫자 13의 저주","최후의 만찬과 유다","13인의 식탁"] },
  'e3637-tremblementsdeterre': { category: 'superstition', rank: '안데스 인디언들의 지진과 세상의 종말 신화(Croyance des Indiens des Andes)', domains: ["미신·민속(Superstition)","자연재해 미신","안데스 인디언","지하 거인의 분노","종말의 징조"] },
  'e3638-tresors': { category: 'superstition', rank: '스코틀랜드 산속 금광과 보물을 지키는 정령들(Gardiens des Trésors)', domains: ["미신·민속(Superstition)","보물 매장 전승","스코틀랜드 민속","불타는 도깨비불","수호 악령과의 계약"] },
  'e3639-tribunalsecret': { category: 'person', rank: '중세 독일 베스트팔렌의 피의 비밀 재판소와 교수형(Sainte-Vehme)', domains: ["인물·문헌(Personnages)","1863 원서 삽화 수록","중세 독일사","페메 성심재판소","복면 재판관","야간 처형"] },
  'e3640-trithemejean': { category: 'person', rank: '암호학과 천사 마법을 집대성한 베네딕토회 수도원장(Savant Abbé Bénédictin)', domains: ["인물·문헌(Personnages)","르네상스 마법사","슈폰하임 수도원장","스테가노그라피아","암호학과 천사 소환"] },
  'e3641-trodds': { category: 'myth', rank: '붉은 옷을 입고 다니는 덴마크 민속의 작은 난쟁이 요정(Petits Lutins Danois)', domains: ["신화·전설(Mythologie)","덴마크 민속","트롤 난쟁이","붉은 모자 요정","지하 둔덕"] },
  'e3642-troian': { category: 'myth', rank: '햇빛을 피해 밀랍 날개로 밤에만 날아다니던 세르비아의 밤의 왕(Roi de Servie)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","세르비아 전설","밤의 황제","밀랍 날개와 태양"] },
  'e3643-trois': { category: 'superstition', rank: '침을 세 번 뱉는 액막이와 3의 신성한 힘(Nombre Mystérieux)', domains: ["미신·민속(Superstition)","수비학","숫자 3의 상징","삼위일체","침 세 번 뱉기 액막이"] },
  'e3644-troisechelles': { category: 'person', rank: '샤를 9세 앞 마술을 선보였으나 결국 화형당한 마법사(Sorcier de Charles IX)', domains: ["인물·문헌(Personnages)","프랑스 궁정 마술","샤를 9세","마녀재판 화형","보댕의 데모노마니아"] },
  'e3645-troisrieux': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","마크로도르","프랑스 설화"] },
  'e3646-troldman': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","북유럽 마법사","해럴드 왕"] },
  'e3647-trollen': { category: 'myth', rank: '피에르 르 로이에가 기록한 노르웨이의 일하는 트롤 요정(Esprits Follets de Norvège)', domains: ["신화·전설(Mythologie)","노르웨이 민속","피에르 르 로이에","집요정 트롤","가사 노동"] },
  'e3648-troncdarbre': { category: 'superstition', rank: '사바트 집회에서 잎 없는 검은 고목 형상을 취하는 악마(Forme Diabolique au Sabbat)', domains: ["미신·민속(Superstition)","사바트 변신","검은 고목나무","악마의 현현"] },
  'e3649-trophonius': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","그리스 신탁","꿈 점술"] },
  'e3650-trouduchateaudecarnoet': { category: 'superstition', rank: '브르타뉴 캉브리가 탐사한 영혼의 거대한 지하 동굴(Voyage dans le Finistère)', domains: ["미신·민속(Superstition)","브르타뉴 피니스테르","캉브리 여행기","카르노에 숲","지하 심연 동굴"] },
  'e3651-troupefurieuse': { category: 'myth', rank: '독일 민속의 밤하늘을 달리는 저주받은 사냥꾼 군세(Chasse Sauvage)', domains: ["신화·전설(Mythologie)","게르만 민속","와일드 헌트(Wild Hunt)","오딘의 군세","밤하늘의 유령 사냥꾼"] },
  'e3652-troupeaux': { category: 'superstition', rank: '늑대와 악마의 주술로부터 양떼를 지키는 목동들의 민간 비술(Garde des Troupeaux)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","목축 민속","양떼 수호 주술","늑대 퇴치 주문"] },
  'e3653-trows': { category: 'myth', rank: '셰틀랜드 제도 언덕 동굴에 살며 금속을 주조하는 난쟁이 야간 정령(Esprits des Îles Shetland)', domains: ["신화·전설(Mythologie)","셰틀랜드 민속","언덕의 정령","야간 대장장이","음악과 춤"] },
  'e3654-truie': { category: 'person', rank: '1466년 파리에서 기예를 부리다 마녀 혐의로 처형된 돼지와 곡예사(Procès Sorcier d’un Animal)', domains: ["인물·문헌(Personnages)","중세 동물 재판","빅토르 위고 노트르담 드 파리","물레 잣는 돼지","코르베유 화형"] },
  'e3655-tschouwasches': { category: 'superstition', rank: '시베리아 추바시족의 장미 나뭇가지 15개 가을 제례(Faisceau Sacré des Tschouwasches)', domains: ["미신·민속(Superstition)","시베리아 민속","추바시족 신앙","이리흐(Irikh)","가정 수호 부적"] },
  'e3656-tullie': { category: 'person', rank: '아피아 가도 무덤의 1500년간 썩지 않은 시신과 영구 등불(Lampe Perpétuelle)', domains: ["인물·문헌(Personnages)","로마 아피아 가도 발굴","키케로의 딸 툴리아","불멸의 영구 등불","연금술 보존액"] },
  'e3657-turlupins': { category: 'person', rank: '14세기 프랑스와 독일에 출현한 나체파 자유영성 이단(Secte de Libertins Nus)', domains: ["인물·문헌(Personnages)","중세 이단사","자유영성 형제단","나체주의","종교재판"] },
  'e3658-turpin': { category: 'person', rank: '샤를마뉴 대제의 영혼을 노리다 쫓겨난 악마 무리의 환시(Vision des Démons)', domains: ["인물·문헌(Personnages)","중세 기사도 연대기","샤를마뉴 전설","랭스 대주교","악마들의 패퇴 환시"] },
  'e3659-tvardowski': { category: 'myth', rank: '악마와 계약을 맺고 달로 날아간 폴란드의 전설적 마법사(Faust Polonais)', domains: ["신화·전설(Mythologie)","폴란드 전설","폴란드의 파우스트","달에 사는 마법사","악마 베엘제붑과의 계약"] },
  'e3660-tybilenus': { category: 'demon', rank: '고대 작센족이 두려워했던 사악한 악령(Mauvais Génie des Saxons)', domains: ["악마학(Démonologie)","고대 색슨 신화","게르만 악령","재앙의 신령"] },
  'e3661-tylwythteglabellefamille': { category: 'myth', rank: '웨일스 민속의 깨끗한 농가를 돕는 아름다운 요정 일족(Fées du Pays de Galles)', domains: ["신화·전설(Mythologie)","웨일스 켈트 민속","아름다운 요정 일족","달빛 아래 춤","엘릴론과의 대립"] },
  'e3662-tympanites': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","흡혈귀 전승","북처럼 부푼 시신"] },
  'e3663-tympanon': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","마녀의 가죽 주머니","사바트 스프"] },
  'e3664-tyre': { category: 'superstition', rank: '셰페루스가 기록한 사미족의 회전하는 저주 양모 공(Boule Magique des Lapons)', domains: ["미신·민속(Superstition)","라플란드 사미족","요하네스 셰페루스","주술 탄환","원거리 저주술"] },

  // U entries curated metadata (p.672-675)
  'ukobach': { category: 'demon', subCategory: 'subordinate', rank: '지옥 제2계급 악마·화마(Démon du Second Ordre)', domains: ['악마학(Démonologie)', '지옥의 계급 체계', '1863 원서 삽화 수록', '지옥 가마솥 관리자', '튀김과 불꽃놀이의 발명자'] },
  'e3666-universitesoccultes': { category: 'superstition', rank: '16세기 궁정 점성술·연금술 학회 총론(Histoire des Sciences Occultes)', domains: ['미신·민속(Superstition)', '16세기 오컬트 역사', '1863 원서 삽화 수록', '카트린 드 메디시스', '노스트라다무스와 루지에리', '오노레 드 발자크'] },
  'e3667-uphir': { category: 'demon', subCategory: 'subordinate', rank: '지옥의 화학자·시의 악마(Démon Chimiste & Médecin)', domains: ['악마학(Démonologie)', '지옥의 계급 체계', '약초학과 화학', '벨제붑의 주치의'] },
  'e3668-upiers': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '슬라브 민속', '흡혈귀'] },
  'e3669-urda': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '북유럽 신화', '노른 여신'] },
  'e3670-urgande': { category: 'myth', rank: '기사도 로맨스의 선한 수호 요정(Bonne Fée des Romans de Chevalerie)', domains: ['신화·전설(Mythologie)', '기사도 문학', '아마디스 드 가울라', '마법의 검', '사악한 요정 멜리에'] },
  'e3671-urine': { category: 'superstition', rank: '민간요법·기우제 주술 미신(Médecine Populaire & Magie)', domains: ['미신·민속(Superstition)', '민간요법', '마녀의 기우제', '마틴 델리오 악마학', '키노케팔루스 전승'] },
  'e3672-urotopegnie': { category: 'grimoire', rank: '사물과 사람을 결박하는 마술서(Grimoire de Ligatures)', domains: ['마도서·문헌(Grimoire)', '매듭 결박 주술', '피에르 드 랑크르', '풍차와 양조통 주술'] },
  'e3673-uterpen': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '아서왕 전설', '마법사 멀린'] },
  'e3674-uteseture': { category: 'divination', rank: '고대 노르드·아이슬란드의 강령 점술(Magie Nocturne d’Odin)', domains: ['점술·예언(Divination)', '아이슬란드 오컬트', '오딘의 비술', '망령과의 교신', '야외 철야'] },

  // V entries curated metadata (p.675-698)
  'e3675-vaccine': { category: 'superstition', rank: '19세기 의학 미신·종교 반발(Superstition Médicale)', domains: ['미신·민속(Superstition)', '19세기 의학사', '종두법 논쟁', '종교적 미신'] },
  'e3676-vache': { category: 'superstition', rank: '동물 숭배·민간 미신(Culte & Superstition Animale)', domains: ['미신·민속(Superstition)', '힌두교 동물 숭배', '1863 원서 삽화 수록', '성스러운 소'] },
  'e3677-vade': { category: 'myth', rank: '게르만·스칸디나비아 전설의 거인(Géant Légendaire)', domains: ['신화·전설(Mythologie)', '게르만 영웅 전설', '벨란트의 아버지', '거인 전승'] },
  'e3678-vafthrudnis': { category: 'myth', rank: '북유럽 신화의 지혜로운 태고의 거인(Géant Primordial de la Sagesse)', domains: ['신화·전설(Mythologie)', '북유럽 신화(에다)', '오딘의 수수께끼 대결', '요툰 거인'] },
  'e3679-vagnoste': { category: 'myth', rank: '스칸디나비아 전설의 거인(Géant Scandinave)', domains: ['신화·전설(Mythologie)', '북유럽 전설', '아가베르트의 아버지', '거인 전승'] },
  'e3680-vaicarani': { category: 'myth', rank: '힌두 명계의 심판의 강·삼도천(Fleuve des Enfers Hindous)', domains: ['신화·전설(Mythologie)', '힌두 명계관', '사후세계의 강', '염라대왕(야마)'] },
  'e3681-vaisseaufantome': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '해양 전승', '방황하는 네덜란드인'] },
  'e3682-valafar': { category: 'demon', subCategory: 'duke', rank: '지옥의 대공·총재(Grand-Duc & Président)', legions: 36, domains: ['악마학(Démonologie)', '지옥의 계급 체계', '솔로몬 72 악마', '도둑질의 사역마'] },
  'e3683-valens': { category: 'person', rank: '로마 황제·역사 인물(Empereur Romain)', domains: ['인물·문헌(Personnages)', '로마 제국사', '차기 황제 예언 점술', '아리우스파'] },
  'e3684-valentin': { category: 'person', rank: '초기 기독교 영지주의 학자(Gnostique & Théologien)', domains: ['인물·문헌(Personnages)', '초기 기독교사', '영지주의(그노시스)', '에온과 플레로마'] },
  'e3685-valentinbasile': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '연금술사', '바실 발랑탱'] },
  'e3686-valeremaxime': { category: 'person', rank: '고대 로마 역사가·저술가(Historien & Auteur Romain)', domains: ['인물·문헌(Personnages)', '고대 로마사', '언행록', '신탁과 징조 기록'] },
  'e3687-valkiries': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '북유럽 신화', '발키리'] },
  'e3688-vampires': { category: 'myth', rank: '동유럽 흡혈귀 전승 총론(Traité des Vampires)', domains: ['신화·전설(Mythologie)', '동유럽 민속', '1863 원서 삽화 수록', '흡혈귀 소동', '돔 칼메 논문'] },
  'e3689-vandaleantoine': { category: 'person', rank: '네덜란드 의사·신탁 비판 학자(Médecin & Savant Hollandais)', domains: ['인물·문헌(Personnages)', '계몽주의 선구자', '고대 신탁 사기론', '폰트넬의 스승'] },
  'e3690-vanlund': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '북유럽 전설', '대장장이 벨란트'] },
  'e3691-vapeurs': { category: 'superstition', rank: '북미 원주민 크리족 영혼 미신(Superstition des Âmes Indiennes)', domains: ['미신·민속(Superstition)', '북미 원주민 민속', '영혼 전승', '수증기 환영'] },
  'e3692-vapula': { category: 'demon', subCategory: 'duke', rank: '지옥의 대공작(Grand-Duc Infernal)', legions: 36, domains: ['악마학(Démonologie)', '지옥의 계급 체계', '솔로몬 72 악마', '기계 공학과 철학'] },
  'e3693-varonnin': { category: 'myth', rank: '인도 힌두교의 바다와 질서의 신(Dieu de l’Océan & de la Justice)', domains: ['신화·전설(Mythologie)', '베다·힌두 신화', '물의 주신', '천상의 심판자'] },
  'e3694-vaudois': { category: 'person', rank: '초기 종교개혁 교파·마녀사냥 희생자(Mouvement Vaudois & Hérésie)', domains: ['인물·문헌(Personnages)', '중세 이단 재판', '마녀사냥사', '보드리(Vauderie)'] },
  'e3695-vaulxjeande': { category: 'person', rank: '스타블로의 악명 높은 마법사(Sorcier de Stavelot)', domains: ['인물·문헌(Personnages)', '벨기에 마녀재판', '1863 원서 삽화 수록', '사바트 주재'] },
  'e3696-vauvert': { category: 'superstition', rank: '13세기 파리 카르투시오회 수도원 기담(Légende Parisienne)', domains: ['미신·민속(Superstition)', '파리 유령 전설', '생루이 국왕', '프랑스 관용구'] },
  'e3697-veaudor': { category: 'myth', rank: '성경과 코란의 우상 숭배(Idole Biblique)', domains: ['신화·전설(Mythologie)', '성경 출애굽기', '1863 원서 삽화 수록', '우상 숭배', '사마엘 전승'] },
  'e3698-veaumarin': { category: 'superstition', rank: '해양 민간 마술 미신(Superstition Maritime)', domains: ['미신·민속(Superstition)', '동물 주술', '폭풍 소환 미신'] },
  'e3699-velandleforgeron': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '게르만 신화', '대장장이 벨란트'] },
  'e3700-velleda': { category: 'person', rank: '게르만 브룩테리족의 예언자 여사제(Prêtresse & Prophétesse Germaine)', domains: ['인물·문헌(Personnages)', '고대 게르만 역사', '타키투스 게르마니아', '바타비 반란'] },
  'e3701-vendredi': { category: 'superstition', rank: '서양의 불길한 날 미신(Superstition des Jours Malheureux)', domains: ['미신·민속(Superstition)', '요일 미신', '사바트 날짜', '13일의 금요일'] },
  'e3702-veneur': { category: 'myth', rank: '프랑스 왕실 유령 사냥꾼 설화(Légende du Veneur Noir)', domains: ['신화·전설(Mythologie)', '앙리 4세 일화', '1863 원서 삽화 수록', '야생의 사냥', '퐁텐블로 궁정'] },
  'e3703-ventriloques': { category: 'divination', rank: '고대·중세 복화술과 악마학적 사기(Ventriloquie & Prestidigitation)', domains: ['점술·예언(Divination)', '고대 신탁 사기', '빙의와 복화술', '델포이 퓌톤'] },
  'e3704-vents': { category: 'superstition', rank: '항해자들의 바람 조종 비방(Magie des Vents)', domains: ['미신·민속(Superstition)', '해양 민속', '라플란드 매듭 주술', '폭풍 마법'] },
  'e3705-vepar': { category: 'demon', subCategory: 'duke', rank: '지옥의 대공(Grand-Duc Infernal)', legions: 29, domains: ['악마학(Démonologie)', '지옥의 계급 체계', '솔로몬 72 악마', '바다와 군함 통솔'] },
  'e3706-verandi': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '북유럽 신화', '노른 여신'] },
  'e3707-verdelet': { category: 'demon', subCategory: 'subordinate', rank: '지옥 제2계급 악마·사바트 의전관(Maître des Cérémonies du Sabbat)', domains: ['악마학(Démonologie)', '사바트 안내자', '프랑스 마녀재판', '녹색 악마'] },
  'e3708-verdungmichel': { category: 'person', rank: '16세기 폴리니의 늑대인간 피고인(Loup-Garou Accusé)', domains: ['인물·문헌(Personnages)', '늑대인간(루가루) 재판', '폴리니 마녀재판', '요한 바이어 기록'] },
  'e3709-verge': { category: 'divination', rank: '탐사 점술 도구(Rhabdomancie)', domains: ['점술·예언(Divination)', '다우징', '모세의 지팡이', '수맥·광맥 탐사'] },
  'e3710-vergedaaron': { category: 'myth', rank: '성경의 거룩한 기적의 지팡이(Relique Sacrée Biblique)', domains: ['신화·전설(Mythologie)', '출애굽기 기적', '파라오의 요술사', '성스러운 유물'] },
  'e3711-verredeau': { category: 'divination', rank: '수경점·투시 점술(Hydromancie & Cristallomancie)', domains: ['점술·예언(Divination)', '수경점', '오를레앙 공작 섭정기', '투시술'] },
  'e3712-verrues': { category: 'superstition', rank: '치유 주술·민간 비방(Remède Populaire & Charme)', domains: ['미신·민속(Superstition)', '민간요법', '완두콩 액막이', '소 알베르투스'] },
  'e3713-vers': { category: 'superstition', rank: '민간 구충 주문·액막이(Conjuration des Vers)', domains: ['미신·민속(Superstition)', '치유 주문', '가축 질병 주술'] },
  'e3714-vert': { category: 'superstition', rank: '색채 상징·악마의 색 미신(Symbolisme Diabolique des Couleurs)', domains: ['미신·민속(Superstition)', '색채 상징', '악마의 옷', '연극계의 금기'] },
  'e3715-vertjoli': { category: 'demon', subCategory: 'subordinate', rank: '지옥의 소악마·사역마(Diablotin Familier)', domains: ['악마학(Démonologie)', '프랑스 마녀재판', '사역마', '소악마'] },
  'e3716-verveine': { category: 'superstition', rank: '성스러운 마법 약초(Herbe Sacrée Magique)', domains: ['미신·민속(Superstition)', '마법 약초', '드루이드 성초', '액막이 부적'] },
  'e3717-vespasien': { category: 'person', rank: '로마 황제·기적 치유 일화(Empereur Romain)', domains: ['인물·문헌(Personnages)', '로마 제국사', '알렉산드리아의 치유 기적', '타키투스 기록'] },
  'e3718-vesta': { category: 'myth', rank: '로마 화로와 성화의 여신(Déesse Romaine du Foyer)', domains: ['신화·전설(Mythologie)', '로마 신화', '베스타 처녀 사제(베스탈)', '불의 제의'] },
  'e3719-vetementsdesmorts': { category: 'superstition', rank: '장례 의례·망자 의복 금기(Superstitions Funéraires)', domains: ['미신·민속(Superstition)', '장례 풍습', '망자의 영혼', '유럽 민간 금기'] },
  'e3720-vetin': { category: 'person', rank: '9세기 라이헤나우 수도사·내세 환영(Moine de Reichenau)', domains: ['인물·문헌(Personnages)', '카롤링거 르네상스', '지옥과 연옥 환영', '중세 환상 문학'] },
  'e3721-veupacha': { category: 'myth', rank: '터키·오스만 전승의 지옥의 거인(Géant Diabolique Turc)', domains: ['신화·전설(Mythologie)', '투르크 민간 전승', '외눈박이 거인', '지옥 괴물'] },
  'e3722-viaram': { category: 'myth', rank: '동양·페르시아 전승의 악마(Démon Oriental)', domains: ['신화·전설(Mythologie)', '동양 악마학', '명계 정령'] },
  'e3723-vidaldelaporte': { category: 'person', rank: '프랑스 피레네의 마술사 피고인(Sorcier Pyrénéen)', domains: ['인물·문헌(Personnages)', '프랑스 마녀재판', '피레네 산악 주술'] },
  'e3724-vidblain': { category: 'myth', rank: '북유럽 신화의 제3천궁(Troisième Ciel Scandinave)', domains: ['신화·전설(Mythologie)', '북유럽 신화(에다)', '천상 세계', '세계수 위드라실'] },
  'e3725-vieille': { category: 'superstition', rank: '환영·죽음의 전조 기담(Spectre & Présage de Mort)', domains: ['미신·민속(Superstition)', '유령 환영', '1863 원서 삽화 수록', '죽음의 흉조'] },
  'e3726-villainlabbe': { category: 'person', rank: '18세기 프랑스 성직자·연금술 비판 역사가(Abbé & Historien Critique)', domains: ['인물·문헌(Personnages)', '니콜라 플라멜 연금술 전설 비판', '역사 문헌 실증 비평'] },
  'e3727-villarslabbede': { category: 'person', rank: '프랑스 성직자·카발라 풍자 작가(Auteur Satirique & Abbé)', domains: ['인물·문헌(Personnages)', '가발리스 백작', '원소 정령(실프, 님프, 운디네)', '장미십자회'] },
  'e3728-villiersflorentde': { category: 'person', rank: '16세기 노르망디 마술사(Sorcier Normand)', domains: ['인물·문헌(Personnages)', '노르망디 마녀재판', '프랑스 마술사'] },
  'e3729-vine': { category: 'demon', subCategory: 'monarch', rank: '지옥의 왕·백작(Grand Roi & Comte Infernal)', legions: 36, domains: ['악마학(Démonologie)', '지옥의 계급 체계', '솔로몬 72 악마', '마법사와 은신처 탐지'] },
  'e3730-vipere': { category: 'superstition', rank: '파충류 미신·해독 비방(Superstition des Reptiles)', domains: ['미신·민속(Superstition)', '동물 마술', '뱀 기름 치료', '민간 약방문'] },
  'e3731-virgile': { category: 'person', rank: '중세 전설 속의 위대한 마법사(Grand Enchanteur Légendaire)', domains: ['인물·문헌(Personnages)', '로마 대시인의 마법사화', '나폴리의 마법 유물', '중세 기담'] },
  'e3732-virgile': { category: 'person', rank: '8세기 아일랜드 성직자·잘츠부르크 주교(Évêque & Savant Irlandais)', domains: ['인물·문헌(Personnages)', '중세 지구구형설 논쟁', '대척지(대지구) 논쟁', '가톨릭 성인'] },
  'e3733-visions': { category: 'superstition', rank: '초자연적 환상·의학적 분석 총론(Traité des Hallucinations)', domains: ['미신·민속(Superstition)', '심령 환영', '의학적 착시 분석', '브리에르 드 부아몽'] },
  'e3734-voceratrices': { category: 'superstition', rank: '코르시카 장례 애도가·복수 선동자(Pleureuses Corses)', domains: ['미신·민속(Superstition)', '코르시카 장례 풍습', '곡비(哭婢)', '방데타(피의 복수)'] },
  'e3735-voile': { category: 'superstition', rank: '유대인 장례 전승(Tradition Funéraire Juive)', domains: ['미신·민속(Superstition)', '유대 민간 미신', '무덤 속 시신 보존'] },
  'e3736-voisinla': { category: 'person', rank: '17세기 궁정 독살 사건의 주범·점술사(Sorcière & Empoisonneuse de la Cour)', domains: ['인물·문헌(Personnages)', '독살 사건(Affaire des poisons)', '검은 미사', '루이 14세 궁정'] },
  'e3737-voituredudiable': { category: 'superstition', rank: '17세기 파리 강도단의 가짜 악마 소동(Supercherie Parisienne)', domains: ['미신·민속(Superstition)', '파리 범죄 실화', '위장 악마 마차', '사회 범죄'] },
  'e3738-voix': { category: 'superstition', rank: '악령 빙의 판별 징후·신비 음성(Signe de Possession)', domains: ['미신·민속(Superstition)', '빙의 판별법', '앙리 보게 악마학', '불길한 음성'] },
  'volac': { category: 'demon', subCategory: 'president', rank: '지옥의 대총재(Grand Président)', legions: 30, domains: ['악마학(Démonologie)', '지옥의 계급 체계', '솔로몬 72 악마', '1863 원서 삽화 수록', '숨겨진 보물과 뱀'] },
  'e3740-voletmarie': { category: 'person', rank: '거짓 계시를 사칭한 사기범(Faussaire Mystique)', domains: ['인물·문헌(Personnages)', '프랑스 종교 사기', '거짓 기적', '수녀원 감금'] },
  'e3741-vols': { category: 'superstition', rank: '밀랍 저주 인형 비술(Envoutement & Figurine de Cire)', domains: ['미신·민속(Superstition)', '인형 저주술', '앙부트망(Envoûtement)', '밀랍 인형'] },
  'e3742-volta': { category: 'myth', rank: '고대 에트루리아 전설의 괴수(Monstre d’Étrurie)', domains: ['신화·전설(Mythologie)', '에트루리아 전설', '포르세나 국왕의 벼락 비술', '환상 괴수'] },
  'e3743-voltaire': { category: 'person', rank: '프랑스 계몽사상가·문인(Philosophe des Lumières)', domains: ['인물·문헌(Personnages)', '프랑스 계몽주의', '가톨릭 보수파의 악마 모함', '미신 조롱'] },
  'e3744-voltigeurhollandais': { category: 'myth', rank: '해양 전설의 저주받은 유령선(Vaisseau-Fantôme Légendaire)', domains: ['신화·전설(Mythologie)', '플라잉 더치맨', '해양 민속', '희망봉의 저주', '선원들의 흉조'] },
  'e3745-voltigeurhollandais': { category: 'myth', rank: '해양 전설의 저주받은 유령선(Vaisseau-Fantôme Légendaire)', domains: ['신화·전설(Mythologie)', '플라잉 더치맨 목격담', '1863 원서 삽화 수록', '바다의 재앙과 난파'] },
  'e3746-vondel': { category: 'person', rank: '네덜란드 국민 시인·극작가(Poète & Dramaturge Hollandais)', domains: ['인물·문헌(Personnages)', '네덜란드 황금기 문학', '비극 루시퍼', '실낙원의 모태'] },
  'e3747-vouivre': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '프랑스 환상 괴수', '부아브르'] },
  'voyages-sorcerers': { category: 'myth', rank: '마녀 비행 전승 총론(Vol & Excursion des Sorcières)', domains: ['신화·전설(Mythologie)', '마녀 비행', '1863 원서 삽화 수록', '빗자루와 마법 연고', '사바트 야간 여행'] },
  'e3749-vroucolacas': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '그리스 민속', '흡혈귀'] },
  'e3750-vue': { category: 'superstition', rank: '시선 저주·스코틀랜드 제2의 시야(Mauvais Œil & Seconde Vue)', domains: ['미신·민속(Superstition)', '마안(Evil Eye)', '스코틀랜드 투시안', '영적 시각'] },

  // W entries curated metadata (p.698-702)
  'e3751-waeterelvesfeesdeseaux': { category: 'myth', rank: '북해 뱃사람들의 물의 요정(Fées des Eaux)', domains: ['신화·전설(Mythologie)', '해양 민속', '물의 정령·요정', '휘파람 미신'] },
  'e3752-wakemanrhoda': { category: 'person', rank: '19세기 미국 광신 교주(Illuminée Fanatique)', domains: ['인물·문헌(Personnages)', '사이비 종교 실화', '미국 종말론', '광신 범죄'] },
  'e3753-wakeman': { category: 'person', rank: '구마 살인 재판 기록(Procès de Meurtre Fanatique)', domains: ['인물·문헌(Personnages)', '미국 법정 실화', '구마 살인 사건', '종교 광신'] },
  'e3754-walhalla': { category: 'myth', rank: '북유럽 신화의 전사들의 궁전(Palais des Morts)', domains: ['신화·전설(Mythologie)', '북유럽 신화(에다)', '오딘의 궁전', '에인헤랴르'] },
  'e3755-walkiries': { category: 'myth', rank: '전장의 전사자를 인도하는 여신(Vierges Guerrières)', domains: ['신화·전설(Mythologie)', '북유럽 신화(에다)', '발키리', '오딘의 사자'] },
  'wall': { category: 'demon', subCategory: 'duke', rank: '지옥의 대공(Grand-Duc Infernal)', legions: 37, domains: ['악마학(Démonologie)', '지옥의 계급 체계', '고에티아 72 악마', '1863 원서 삽화 수록'] },
  'e3757-walter': { category: 'myth', rank: '중세 독일 기사 설화(Légende de Chevalier)', domains: ['신화·전설(Mythologie)', '독일 민간 설화', '악마의 유혹', '중세 기사도'] },
  'e3758-walterscott': { category: 'person', rank: '영국 대문호·악마학 저술가(Auteur & Homme de Lettres)', domains: ['인물·문헌(Personnages)', '월터 스콧', '악마학 서간', '19세기 스코틀랜드 문학'] },
  'e3759-danslapremierelettre': { category: 'person', rank: '악마학 서간집 해제(Analyse de la Démonologie)', domains: ['인물·문헌(Personnages)', '마도서·문헌', '영국 마녀 재판사', '월터 스콧'] },
  'e3760-wattierpierre': { category: 'person', rank: '거짓 예언자·사기꾼(Faux Prophète & Charlatan)', domains: ['인물·문헌(Personnages)', '프랑스 종교 사기', '거짓 예언'] },
  'e3761-wechselbalg': { category: 'myth', rank: '독일 전승의 바꿔치기 아이(Enfant Substitué)', domains: ['신화·전설(Mythologie)', '게르만 요정 전승', '체인질링', '민간 설화'] },
  'e3762-welzandre': { category: 'person', rank: '오스트리아 연금술사(Alchimiste)', domains: ['인물·문헌(Personnages)', '연금술', '신비주의자'] },
  'e3763-wenhamjane': { category: 'person', rank: '잉글랜드 마지막 마녀재판 피고인(Accusée de Sorcellerie)', domains: ['인물·문헌(Personnages)', '영국 마녀재판사', '하트퍼드셔 재판', '사법적 사면'] },
  'e3764-wesley': { category: 'superstition', rank: '에프워스 목사관 심령 소동(Poltergeist d’Epworth)', domains: ['미신·민속(Superstition)', '폴터가이스트', '존 웨슬리', '영국 심령 기록'] },
  'e3765-wiclef': { category: 'person', rank: '영국 종교개혁 선구자(Réformateur Anglais)', domains: ['인물·문헌(Personnages)', '중세 교회 역사', '종교개혁', '이단 논쟁'] },
  'e3766-wierus': { category: 'person', rank: '16세기 네덜란드 의사·악마학자(Médecin & Démonologue)', domains: ['인물·문헌(Personnages)', '의사악마왕국', '마녀사냥 비판', '근대 정신의학 선구자'] },
  'e3767-wilis': { category: 'myth', rank: '슬라브 전승의 춤추는 처녀 유령(Fantômes de Fiancées)', domains: ['신화·전설(Mythologie)', '슬라브 민속', '1863 원서 삽화 수록', '처녀 유령', '발레 지젤'] },
  'e3768-wiulmerozguillaume': { category: 'person', rank: '중세 프랑스 마술사(Sorcier Français)', domains: ['인물·문헌(Personnages)', '프랑스 마술사', '중세 오컬트'] },
  'e3769-wivre': { category: 'myth', rank: '프랑스 전승의 보석을 품은 비사·용(Serpent Volant)', domains: ['신화·전설(Mythologie)', '프랑스 환상 괴수', '부아브르', '이마의 보석 카벙클'] },
  'e3770-woden': { category: 'myth', rank: '고대 게르만·앵글로색슨의 주신(Souverain des Dieux)', domains: ['신화·전설(Mythologie)', '게르만 신화', '보덴·오딘', '야생의 사냥', '수요일의 기원'] },
  'e3771-wolotys': { category: 'myth', rank: '슬라브 신화의 고대 거인족(Géants Slaves)', domains: ['신화·전설(Mythologie)', '슬라브 신화', '고대 거인족', '로모노소프 기록'] },
  'e3772-woodward': { category: 'person', rank: '미국 신시내티의 돌팔이 의사(Médecin Empirique)', domains: ['인물·문헌(Personnages)', '의료 사기 실화', '신시내티 돌팔이 의사'] },
  'e3773-wortigern': { category: 'person', rank: '고대 브리타니아의 전설적 국왕(Roi Légendaire de Bretagne)', domains: ['인물·문헌(Personnages)', '아서왕 전설', '마법사 멀린', '붉은 용과 흰 용의 예언'] },
  'e3774-wulsondelacolombieremarc': { category: 'person', rank: '프랑스 문장학자·오컬트 저술가(Héraldiste & Auteur)', domains: ['인물·문헌(Personnages)', '문장학', '해몽학(Oniromancie)', '관상학 저술'] },

  // X entries curated metadata (p.705-707)
  'e3775-xacca': { category: 'person', rank: '동양의 철학자·불교 창시자(Philosophe & Législateur)', domains: ['인물·문헌(Personnages)', '동양 종교·불교', '석가모니 전승', '아미타불 신앙'] },
  'xaphan': { category: 'demon', subCategory: 'subordinate', rank: '지옥 제2계급 악마·화부(Démon du Second Ordre)', domains: ['악마학(Démonologie)', '지옥의 계급 체계', '화마·지옥의 풀무질', '루시퍼의 반란'] },
  'e3777-xeirscopie': { category: 'divination', rank: '손 관상학·수상관찰술(Physiognomie de la Main)', domains: ['점술·예언(Divination)', '골상학·관상학', '19세기 과학과 오컬트'] },
  'e3778-xeirscopie': { category: 'divination', rank: '손 관상학·수상관찰술(Physiognomie de la Main)', domains: ['점술·예언(Divination)', '골상학·관상학', '1863 원서 삽화 수록', '손 형태 분석'] },
  'e3779-xerxes': { category: 'superstition', rank: '역사 속 환영·흉몽 기담(Songe & Vision Historique)', domains: ['미신·민속(Superstition)', '고대 페르시아 역사', '예지몽과 환영', '헤로도토스 역사'] },
  'e3780-xezbeth': { category: 'demon', subCategory: 'subordinate', rank: '거짓말과 허황된 기담의 악마(Démon du Mensonge)', domains: ['악마학(Démonologie)', '거짓말과 환상', '허황된 기담', '미혹의 악령'] },
  'e3781-xitragupten': { category: 'myth', rank: '힌두 명계의 서기 신격(Secrétaire du Dieu des Enfers)', domains: ['신화·전설(Mythologie)', '인도 힌두 신화', '치트라굽타', '명계의 재판관 야마', '선악의 기록자'] },
  'e3782-xylomancie': { category: 'divination', rank: '고대·중세 점술(Art Divinatoire)', domains: ['점술·예언(Divination)', '고대·중세 점복술', '슬라브 민속'] },

  // Y entries curated metadata (p.707-711)
  'e3783-yagababa': { category: 'myth', rank: '슬라브 전승의 악마적 마녀·괴물(Monstre Infernal)', domains: ['신화·전설(Mythologie)', '슬라브 민담', '민간 괴물'] },
  'e3784-yakouts': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '시베리아 샤머니즘', '민속 신앙'] },
  'yan-gant-y-tan': { category: 'demon', subCategory: 'subordinate', rank: '브르타뉴 피니스테르의 밤길 촛불 악령(Démon Errant)', domains: ['악마학(Démonologie)', '브르타뉴 전승', '밤의 방랑자', '불길한 징조'] },
  'e3786-yasdh': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ['상호참조', '조로아스터교', '성스러운 경전'] },
  'e3787-ychainbonawgs': { category: 'myth', rank: '스코틀랜드 산악의 전설적 괴수 황소(Bœufs Monstres)', domains: ['신화·전설(Mythologie)', '켈트 전승', '괴수·환상종', '산악 정령'] },
  'e3788-yenvang': { category: 'demon', subCategory: 'monarch', rank: '중국의 지옥의 왕·염라대왕(Roi de l’Enfer Chinois)', domains: ['악마학(Démonologie)', '동양 명계 신앙', '지옥의 왕', '사후세계의 심판자'] },
  'e3789-yesdhoon': { category: 'myth', rank: '조로아스터교의 유일신격(Dieu Unique Zoroastrien)', domains: ['신화·전설(Mythologie)', '조로아스터교(배화교)', '오르무즈드', '종말론과 신성한 불'] },
  'e3790-yermoloff': { category: 'person', rank: '19세기 러시아 장군·학자(Général Russe)', domains: ['인물·문헌(Personnages)', '유령의 집(Maison Hantée)', '러시아 심령 기록'] },
  'e3791-yeux': { category: 'superstition', rank: '시선 저주와 마안 신앙(Superstition du Mauvais Œil)', domains: ['미신·민속(Superstition)', '마안(Evil Eye)', '시선 저주', '마녀 판별법', '민간 방양술'] },
  'e3792-yffrotte': { category: 'person', rank: '고티아와 스웨덴의 전설적 국왕(Roi Légendaire)', domains: ['인물·문헌(Personnages)', '북유럽 군주 전설', '마녀 둔갑담', '토르케마다 헥사메론'] },
  'e3793-yormoungandour': { category: 'myth', rank: '북유럽 신화의 거대한 세계뱀(Serpent Monstrueux)', domains: ['신화·전설(Mythologie)', '북유럽 신화(에다)', '세계뱀', '라그나로크'] },
  'e3794-youfmarieanne': { category: 'person', rank: '19세기 프랑스 마술 치료 사기 피해자(Victime d’Escroquerie)', domains: ['인물·문헌(Personnages)', '프랑스 법정 실화', '마술 치료 사기', '19세기 미신 풍속'] },
  'e3795-youma': { category: 'myth', rank: '볼가 핀계 체레미스인의 최고신(Dieu Suprême des Tchérémisses)', domains: ['신화·전설(Mythologie)', '핀-우그리아 신화', '자연 숭배', '신성한 숲(케레메트)', '희생 제의'] },

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

    if (id && TRANSLATION_CACHE[id] && TRANSLATION_CACHE[id].length > 25) {
      const curRef = TRANSLATION_CACHE[id];
      const meta = (id && CURATED_META[id]) || null;
      return {
        category: (meta && meta.category) || 'crossref',
        rank: (meta && meta.rank) || '상호참조 표제어 (Renvoi)',
        legions: 0,
        domains: (meta && meta.domains) || ['상호참조', targetHead.nameKo],
        summary: curRef.length > 150 ? curRef.slice(0, 150) + '…' : curRef,
        description: curRef
      };
    }

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
  const rawKo = (id && TRANSLATION_CACHE[id]) || TRANSLATION_CACHE[cacheKey] || (e.textFr && TRANSLATION_CACHE[e.textFr]) || '';
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
  const isCrossref = raw.textFr && (raw.textFr.startsWith('Voy. ') || raw.textFr.startsWith('Voyez ') || raw.textFr.includes('Voy. ') || raw.textFr.includes('Voyez '));
  for (const pe of PLATE_ENTRIES) {
    if (usedPlateIds.has(pe.id)) continue;
    if (isCrossref && pe.id !== norm(raw.nameFr)) continue;
    if (pe.id === 'scox' && nBase !== 'scox') continue;
    if (pe.id === 'tap' && nBase !== 'tap') continue;
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
    const meta = (CURATED_META && CURATED_META[matchedPlate.id]) || null;
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
      rank: (meta && meta.rank) || matchedPlate.rank,
      legions: (meta && meta.legions !== undefined) ? meta.legions : (matchedPlate.legions || 0),
      category: (meta && meta.category) || (matchedPlate.category === 'myth' ? 'myth' : 'demon'),
      subCategory: (meta && meta.subCategory) || matchedPlate.category,
      domains: (meta && meta.domains) || (matchedPlate.domains || []),
      appearance: matchedPlate.appearance || '',
      summary: (TRANSLATION_CACHE && TRANSLATION_CACHE[matchedPlate.id] ? (TRANSLATION_CACHE[matchedPlate.id].slice(0, 150) + '…') : matchedPlate.summary),
      description: (TRANSLATION_CACHE && TRANSLATION_CACHE[matchedPlate.id]) || matchedPlate.description,
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

