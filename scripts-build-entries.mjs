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
  // M entries curated headwords (p.423-485)
  'e2461-ma': { nameKo: '마(일본의 사악한 여우 요마) [Ma / Evil Spirit of Japan]', nameKoShort: '마', nameFr: 'Ma', nameEn: 'Ma (Japanese Demonic Fox Spirit)' },
  'e2462-mab': { nameKo: '요정 여왕 맙(꿈을 잣는 요정) [Mab / Queen Mab]', nameKoShort: '요정 여왕 맙', nameFr: 'Mab', nameEn: 'Queen Mab (Fairy Queen of Dreams in Celtic Lore)' },
  'e2463-maberthe': { nameKo: '마베르트(플랑드르의 부유한 빙의 과부) [Maberthe]', nameKoShort: '마베르트', nameFr: 'Maberthe', nameEn: 'Maberthe (Wealthy Possessed Widow in Flanders)' },
  'e2464-macallanfanny': { nameKo: '패니 맥앨런 [Fanny Mac-Allan]', nameKoShort: '패니 맥앨런', nameFr: 'Mac-Allan (Fanny)', nameEn: 'Fanny Mac-Allan' },
  'e2465-macalzeaneuphemie': { nameKo: '유피미아 맥캘진(노스베릭 마녀재판의 귀족 부인) [Euphémie Mac-Alzéan / Euphemia MacCalzean]', nameKoShort: '유피미아 맥캘진', nameFr: 'Mac-Alzéan (Euphémie)', nameEn: 'Euphemia MacCalzean (Noblewoman Burned in North Berwick Witch Trials)' },
  'e2466-maccarthy': { nameKo: '찰스 맥카시(아일랜드의 망령 전설) [Charles Mac-Carthy]', nameKoShort: '찰스 맥카시', nameFr: 'Mac-Carthy', nameEn: 'Charles Mac-Carthy (Irish Legend of the Repentant Ghost)' },
  'e2467-macdonaldarchibald': { nameKo: '아치볼드 맥도널드(천리안 영매) [Archibald Mac-Donald]', nameKoShort: '아치볼드 맥도널드', nameFr: 'Mac-Donald (Archibald)', nameEn: 'Archibald Mac-Donald (Scottish Clairvoyant / Second Sight)' },
  'e2468-machahalla': { nameKo: '마샤알라(8세기 아랍 점성술사) [Macha-Halla / Mashallah ibn Athari]', nameKoShort: '마샤알라', nameFr: 'Macha-Halla', nameEn: 'Mashallah ibn Athari (8th-Century Jewish-Arab Astrologer in Baghdad)' },
  'e2469-machines': { nameKo: '기계장치와 자동인형(마술로 오인된 과학) [Machines / Automata and Magic]', nameKoShort: '기계장치와 자동인형', nameFr: 'Machines', nameEn: 'Machines (Mechanical Wonders Mistaken for Sorcery)' },
  'e2470-machlyes': { nameKo: '마클리에스족(양성구유의 전설 부족) [Machlyes]', nameKoShort: '마클리에스족', nameFr: 'Machlyes', nameEn: 'Machlyes (Mythical Androgynous Tribe in Pliny)' },
  'e2471-macintos': { nameKo: '맥킨토시 [Mac-Intos]', nameKoShort: '맥킨토시', nameFr: 'Mac-Intos', nameEn: 'Mac-Intos' },
  'e2472-macreuses': { nameKo: '검둥오리(나무에서 자라는 오리의 전설) [Macreuses / Barnacle Geese Myth]', nameKoShort: '검둥오리', nameFr: 'Macreuses', nameEn: 'Scoters / Barnacle Geese (Vegetable Bird Legend)' },
  'e2473-macrodor': { nameKo: '맥로도르(악마의 의술을 부린 스코틀랜드 의사) [Mac-Rodor]', nameKoShort: '맥로도르', nameFr: 'Mac-Rodor', nameEn: 'Mac-Rodor (Scottish Physician in 1514 Dark Healing Pact)' },
  'e2474-maczocha': { nameKo: '마초하(거대 괴조가 솟아난 폴란드의 심연) [Maczocha / Polish Abyss of Hussite Monster]', nameKoShort: '마초하', nameFr: 'Maczocha', nameEn: 'Maczocha (Famous Polish Chasm and Winged Monster Legend)' },
  'e2475-madeleinedelacroix': { nameKo: '막달레나 데 라 크루스(악마와 계약한 코르도바 수녀원장) [Madeleine de la Croix / Magdalena de la Cruz]', nameKoShort: '막달레나 수녀원장', nameFr: 'Madeleine de la Croix', nameEn: 'Magdalena de la Cruz (Cordoba Abbess Who Made a 30-Year Pact with the Devil)' },
  'e2476-magares': { nameKo: '마가레스(결혼을 방해하는 밍그렐리아의 매듭 마술사들) [Magares / Sorcerers of Mingrelia]', nameKoShort: '마가레스', nameFr: 'Magares', nameEn: 'Magares (Mingrelian Knot Sorcerers Preventing Marriages)' },
  'e2477-mages': { nameKo: '마기(동방의 불 숭배 점성술사이자 마술사) [Mages / Magi]', nameKoShort: '마기', nameFr: 'Mages', nameEn: 'Magi (Persian Zoroastrian Priests and Astrologers)' },
  'e2478-magieetmagiciens': { nameKo: '마술과 마법사들(비의의 대계보) [Magie et Magiciens / Magic and Sorcerers]', nameKoShort: '마술과 마법사들', nameFr: 'Magie et Magiciens', nameEn: 'Magic and Sorcerers (Grand History and Philosophy of the Occult Arts)' },
  'e2479-magieislandaise': { nameKo: '아이슬란드 마술(룬 문자와 공중 악령 소환술) [Magie islandaise / Icelandic Magic]', nameKoShort: '아이슬란드 마술', nameFr: 'Magie islandaise', nameEn: 'Icelandic Magic (Galdr, Staves, and Aerial Spirits of the North)' },
  'e2480-magnetisme': { nameKo: '동물 자기(메스메르의 최면술과 신비주의) [Magnétisme / Animal Magnetism]', nameKoShort: '동물 자기', nameFr: 'Magnétisme', nameEn: 'Animal Magnetism (Mesmerism and Occult Somnambulism)' },
  'e2481-magoa': { nameKo: '마고아(지옥 동방의 지배자 군주) [Magoa / King of the East]', nameKoShort: '마고아', nameFr: 'Magoa', nameEn: 'Magoa (Mighty Demonic King of the Orient in Occult Grimoires)' },
  'e2482-magog': { nameKo: '마곡(룬 문자의 발명자이자 스키타이의 거인) [Magog]', nameKoShort: '마곡', nameFr: 'Magog', nameEn: 'Magog (Giant Leader of Scythians and Inventor of Runes)' },
  'e2483-mahomet': { nameKo: '무함마드(중세 기독교 문헌 속의 마술사 왜곡) [Mahomet / Muhammad in Medieval Legend]', nameKoShort: '무함마드', nameFr: 'Mahomet', nameEn: 'Muhammad (Medieval European Anti-Islamic Legends and Occult Tales)' },
  'e2484-maillatlouise': { nameKo: '루이즈 마이야(다섯 악마에 빙의된 프랑슈콩테의 소녀) [Louise Maillat]', nameKoShort: '루이즈 마이야', nameFr: 'Maillat (Louise)', nameEn: 'Louise Maillat (French Girl Possessed by Five Demons in 1598)' },
  'e2485-maimon': { nameKo: '마이몬(지옥 제9계급 유혹자들의 대장) [Maimon]', nameKoShort: '마이몬', nameFr: 'Maimon', nameEn: 'Maimon (Chief of the Ninth Hierarchy of Demons / Captain of Tempters)' },
  'e2486-main': { nameKo: '손과 수상술(손금 423개 선의 신비) [Main / Chiromancy and Palmistry]', nameKoShort: '손과 수상술', nameFr: 'Main', nameEn: 'Hand (Chiromancy, Palmistry, and the 423 Lines of Destiny)' },
  'e2487-maindegloire': { nameKo: '영광의 손(교수형수의 손으로 만든 마법 양초) [Main de gloire / Hand of Glory]', nameKoShort: '영광의 손', nameFr: 'Main de gloire', nameEn: 'Hand of Glory (Dried Hand of a Hanged Man Used by Thieves)' },
  'e2488-maininvisible': { nameKo: '보이지 않는 손(초자연적 타격 현상) [Main invisible / Invisible Hand Poltergeist]', nameKoShort: '보이지 않는 손', nameFr: 'Main invisible', nameEn: 'Invisible Hand (Supernatural Blows and Poltergeist Shocks)' },
  'e2489-mainfroi': { nameKo: '만프레디(점성술에 심취했던 시칠리아 국왕) [Mainfroi / Manfred of Sicily]', nameKoShort: '만프레디 왕', nameFr: 'Mainfroi', nameEn: 'Manfred of Sicily (Hohenstaufen King Devoted to Astrology and the Occult)' },
  'e2490-maisonensorcelee': { nameKo: '마법에 걸린 흉가(1805년 파리의 폴터가이스트 소동) [Maison ensorcelée / Haunted House of Paris]', nameKoShort: '마법에 걸린 흉가', nameFr: 'Maison ensorcelée', nameEn: 'Haunted House (1805 Paris Poltergeist and Stone-Throwing Phenomenon)' },
  'e2491-malachechabbalah': { nameKo: '말라케이 하발라(사마엘 수하의 파괴 천사들) [Malache-Chabbalah / Angels of Destruction]', nameKoShort: '말라케이 하발라', nameFr: 'Malache-Chabbalah', nameEn: 'Malache-Chabbalah (Kabbalistic Angels of Destruction Serving Samael)' },
  'e2492-malades': { nameKo: '환자들의 생사 점술(병상에 깃든 길흉 징조) [Malades / Omina of Life and Death for the Sick]', nameKoShort: '환자들의 생사 점술', nameFr: 'Malades', nameEn: 'Sick Persons (Folk Omens Determining Recovery or Approaching Death)' },
  'e2493-malafar': { nameKo: '말라파르 [Malafar]', nameKoShort: '말라파르', nameFr: 'Malafar', nameEn: 'Malafar' },
  'e2494-malaingha': { nameKo: '말라잉가(천체를 움직이는 마다가스카르의 천사들) [Malaingha]', nameKoShort: '말라잉가', nameFr: 'Malaingha', nameEn: 'Malaingha (First-Order Cosmic Angels of Madagascar)' },
  'e2495-malatasca': { nameKo: '말라타스카(성녀 카타리나가 악마에게 붙인 조롱의 별명) [Malatasca]', nameKoShort: '말라타스카', nameFr: 'Malatasca', nameEn: 'Malatasca (Derisive Name for the Devil Coined by St. Catherine of Siena)' },
  'e2496-malcaduc': { nameKo: '간질과 은반지 주술(추락병의 민간 치유) [Mal caduc / Falling Sickness Amulet]', nameKoShort: '간질과 은반지 주술', nameFr: 'Mal caduc', nameEn: 'Falling Sickness (Epilepsy Ring Charm and Folk Cures)' },
  'e2497-maldonat': { nameKo: '후안 말도나도(악마학을 연구한 예수회 신학자) [Juan Maldonat / Juan Maldonado]', nameKoShort: '후안 말도나도', nameFr: 'Maldonat', nameEn: 'Juan Maldonado (16th-Century Jesuit Theologian and Scholar of Demonology)' },
  'e2498-malebete': { nameKo: '말베트(툴루즈 밤거리를 배회하던 전설의 괴수) [Male-Bête / Evil Beast of Toulouse]', nameKoShort: '말베트', nameFr: 'Male-Bête', nameEn: 'Male-Bête (Nocturnal Monster Terrorizing the Streets of Toulouse)' },
  'e2499-malebranchenicolas': { nameKo: '니콜라 말브랑슈(상상력의 오류를 비판한 오라토리오회 철학자) [Nicolas Malebranche]', nameKoShort: '니콜라 말브랑슈', nameFr: 'Malebranche (Nicolas)', nameEn: 'Nicolas Malebranche (Philosopher on the Deceptions of Imagination and Sorcery)' },
  'e2500-malefices': { nameKo: '유해 마술(인간과 가축을 해치는 사악한 주술) [Maléfices / Maleficium]', nameKoShort: '유해 마술', nameFr: 'Maléfices', nameEn: 'Maleficium (Evil Sorcery Damaging Humans, Cattle, and Harvests)' },
  'e2501-maletenadomingina': { nameKo: '도밍기나 말레테나(사바트 멀리뛰기 내기를 건 바스크 마녀) [Domingina Maletena]', nameKoShort: '도밍기나 말레테나', nameFr: 'Maletena (Domingina)', nameEn: 'Domingina Maletena (Basque Witch in the Jumping Contest of the Sabbat)' },
  'e2502-malheur': { nameKo: '불운과 흉조(재앙을 예고하는 민간 징조들) [Malheur / Omens of Misfortune]', nameKoShort: '불운과 흉조', nameFr: 'Malheur', nameEn: 'Bad Luck / Omens of Misfortune (Swallow Nests, Salt Spills, and Crickets)' },
  'e2503-malicesdesdemons': { nameKo: '악마의 간계(인간을 시험하고 기만하는 마귀의 속임수) [Malices des démons / Malice of Demons]', nameKoShort: '악마의 간계', nameFr: 'Malices des démons', nameEn: 'Malice of Demons (Medieval Legends of Diabolical Deception and Mockery)' },
  'e2504-malin': { nameKo: '악한 자(악마의 별칭 \'르 말랭\') [Malin / The Evil One]', nameKoShort: '악한 자', nameFr: 'Malin', nameEn: 'The Evil One (L\'Esprit Malin / Common Folk Epithet for Satan)' },
  'e2505-malina': { nameKo: '말리나 [Malina]', nameKoShort: '말리나', nameFr: 'Malina', nameEn: 'Malina' },
  'e2506-mallebranche': { nameKo: '말브랑슈(1618년 파리 테니스 경기 점수원의 악마 조우) [Mallebranche]', nameKoShort: '말브랑슈', nameFr: 'Mallebranche', nameEn: 'Mallebranche (Tennis Court Marker Visited by a Golden-Offering Devil in 1618)' },
  'malphas': { nameKo: '말파스(성채를 짓는 까마귀 형상의 지옥 대총재) [Malphas / Grand President of Hell]', nameKoShort: '말파스', nameFr: 'Malphas', nameEn: 'Malphas (Grand President of Hell / Architect Demon of 40 Legions)' },
  'e2508-mambres': { nameKo: '얌브레스(모세에게 대적한 파라오의 마술사) [Mambrés / Jambres]', nameKoShort: '얌브레스', nameFr: 'Mambrés', nameEn: 'Jambres (Mambrés / Egyptian Enchanter Confuted by Moses)' },
  'mammon': { nameKo: '마몬(탐욕의 지옥 군주, 황금의 숭배자) [Mammon / Demon of Avarice]', nameKoShort: '마몬', nameFr: 'Mammon', nameEn: 'Mammon (Demon of Avarice and Wealth / Lord of Greed)' },
  'e2510-mammouth': { nameKo: '매머드(지하에 사는 거대 두더지 요마) [Mammouth / Siberian Underworld Beast]', nameKoShort: '매머드', nameFr: 'Mammouth', nameEn: 'Mammoth (Prehistoric Beast in Siberian and Native American Lore)' },
  'e2511-man': { nameKo: '만(마라, 석가모니를 시험한 샴의 악마) [Man / Mara in Siamese Buddhism]', nameKoShort: '만', nameFr: 'Man', nameEn: 'Man (Mara / The Arch-Demon and Enemy of Sommona-Kodom in Siam)' },
  'e2512-mancanas': { nameKo: '만카나스(자연과 질병을 다스린다는 마리아나의 마술사) [Mancanas / Sorcerer of the Marianas]', nameKoShort: '만카나스', nameFr: 'Mancanas', nameEn: 'Mancanas (Impostor Magician in the Mariana Islands)' },
  'e2513-mancheabalai': { nameKo: '빗자루 자루(사바트로 날아가는 마녀들의 탈것) [Manche à balai / Broomstick of Witches]', nameKoShort: '빗자루 자루', nameFr: 'Manche à balai', nameEn: 'Broomstick (The Traditional Flying Mount of Witches to the Sabbat)' },
  'e2514-mandragores': { nameKo: '만드라고라(사람 모양을 한 작은 사역마 요마) [Mandragores / Mandrake Familiars]', nameKoShort: '만드라고라', nameFr: 'Mandragores', nameEn: 'Mandragores (Benevolent Familiar Demons in the Form of Little Men)' },
  'e2515-maneraja': { nameKo: '마누 라자(대홍수에서 인류를 구한 인도의 족장) [Mâné-Raja / King Manu]', nameKoShort: '마누 라자', nameFr: 'Mâné-Raja', nameEn: 'King Manu (Mâné-Raja / The Indian Noah in the Great Flood Legend)' },
  'e2516-manes': { nameKo: '마네스(지하의 조상 망령과 신격) [Mânes / Manes]', nameKoShort: '마네스', nameFr: 'Mânes', nameEn: 'Manes (Roman Ancestral Underworld Spirits and Gods of the Dead)' },
  'e2517-manfred': { nameKo: '만프레트 [Manfred]', nameKoShort: '만프레트', nameFr: 'Manfred', nameEn: 'Manfred' },
  'e2518-mangtaar': { nameKo: '망타르(야쿠트족 신화의 8대 악령 지옥) [Mang-Taar / Yakut Underworld]', nameKoShort: '망타르', nameFr: 'Mang-Taar', nameEn: 'Mang-Taar (Siberian Yakut Underworld of Eight Demonic Tribes)' },
  'e2519-manicheens': { nameKo: '마니교도(빛과 어둠의 이원론 영지주의) [Manichéens / Manichaeans]', nameKoShort: '마니교도', nameFr: 'Manichéens', nameEn: 'Manichaeans (Followers of Mani / Dualistic Doctrine of Light and Darkness)' },
  'e2520-manie': { nameKo: '광기와 흉포증(악령 빙의로 오인된 정신 착란) [Manie / Diabolical Mania and Possession]', nameKoShort: '광기와 흉포증', nameFr: 'Manie', nameEn: 'Mania (Violent Mental Delusions Formerly Regarded as Demonic Possession)' },
  'e2521-manifestationsfluidiques': { nameKo: '유체 현상 [Manifestations fluidiques]', nameKoShort: '유체 현상', nameFr: 'Manifestations fluidiques', nameEn: 'Fluidic Manifestations' },
  'e2522-manipa': { nameKo: '마니파(아홉 머리를 지닌 타타르의 우상신) [Manipa / Nine-Headed Tartar Idol]', nameKoShort: '마니파', nameFr: 'Manipa', nameEn: 'Manipa (Nine-Headed Idol Worshipped in Tangut and Tartary)' },
  'e2523-manitou': { nameKo: '마니투(아메리카 원주민의 신령과 정령) [Manitou / Algonquian Spirit]', nameKoShort: '마니투', nameFr: 'Manitou', nameEn: 'Manitou (Algonquian Great Spirit and Supernatural Essence)' },
  'e2524-manto': { nameKo: '만토(테베의 예언자이자 테살리아의 시빌라) [Manto / Theban Prophetess]', nameKoShort: '만토', nameFr: 'Manto', nameEn: 'Manto (Daughter of Tiresias / Prophetess Associated with Christ\'s Coming)' },
  'e2525-mansotela': { nameKo: '라 망소트 [La Mansote]', nameKoShort: '라 망소트', nameFr: 'Mansote (La)', nameEn: 'La Mansote' },
  'e2526-many': { nameKo: '마니(페르시아의 화가이자 종교 창시자) [Many / Mani the Prophet]', nameKoShort: '마니', nameFr: 'Many', nameEn: 'Mani (Persian Prophet, Painter, and Founder of Manichaeism)' },
  'e2527-maoun': { nameKo: '마운(독수리 천사들이 사는 이슬람 제3천) [Maoun / Third Heaven of Islam]', nameKoShort: '마운', nameFr: 'Maoun', nameEn: 'Maoun (Third Heaven in Islamic Cosmogony Inhabited by Vulture Angels)' },
  'e2528-maoridath': { nameKo: '알무아우위다타인(마법을 격퇴하는 코란의 마지막 두 장) [Maoridath / Al-Mu\'awwidhatayn]', nameKoShort: '알무아우위다타인', nameFr: 'Maoridath', nameEn: 'Al-Mu\'awwidhatayn (The Two Refuge Surahs of the Quran against Sorcery)' },
  'e2529-marais': { nameKo: '팔레네의 늪(헤엄치면 새로 변하는 마법의 늪) [Marais / Magic Swamp of Pallene]', nameKoShort: '팔레네의 늪', nameFr: 'Marais', nameEn: 'Swamp of Pallene (Mythical Northern Lake Transforming Bathers into Birds)' },
  'e2530-marat': { nameKo: '장폴 마라(공포정치의 악마 화신) [Jean-Paul Marat / Demon of the Terror]', nameKoShort: '장폴 마라', nameFr: 'Marat', nameEn: 'Jean-Paul Marat (Jacobin Demagogue Portrayed as an Incarnate Demon of Blood)' },
  'e2531-marbas': { nameKo: '마르바스(바르바스, 질병과 치유의 지옥 대총재) [Marbas / Barbas]', nameKoShort: '마르바스', nameFr: 'Marbas', nameEn: 'Marbas (Barbas / Grand President of Hell Commanding 36 Legions)' },
  'e2532-marc': { nameKo: '마르코스(최면술을 부린 영지주의 마술사) [Marc / Marcus the Gnostic Magician]', nameKoShort: '마르코스', nameFr: 'Marc', nameEn: 'Marcus the Gnostic (2nd-Century Heresiarch and Early Magnetizer)' },
  'e2533-marcdecafeartdedirelabonneav': { nameKo: '커피 찌꺼기 점술(카페오만시의 비결) [Marc de café / Tasseography]', nameKoShort: '커피 찌꺼기 점술', nameFr: 'Marc de café (Art de dire la bonne aventure par le)', nameEn: 'Coffee Grounds Divination (Tasseography and Symbol Interpretation)' },
  'e2534-marceau': { nameKo: '프랑수아 세브랭 마르소(예지몽을 꾼 청년 장군) [François Séverin Marceau]', nameKoShort: '마르소 장군', nameFr: 'Marceau', nameEn: 'General Marceau (French Revolutionary Hero and His Premonitory Dream)' },
  'e2535-marcellus': { nameKo: '마르켈루스(늑대인간 서사시를 쓴 팜필리아의 의사) [Marcellus of Side]', nameKoShort: '마르켈루스', nameFr: 'Marcellus', nameEn: 'Marcellus of Side (Ancient Greek Physician and Author on Lycanthropy)' },
  'marchocias': { nameKo: '마르코시아스(그리핀 날개를 단 늑대 형상의 지옥 대후작) [Marchocias / Marchosias]', nameKoShort: '마르코시아스', nameFr: 'Marchocias (Marchosias)', nameEn: 'Marchosias (Great Marquis of Hell / Winged She-Wolf of 30 Legions)' },
  'e2537-marcionites': { nameKo: '마르키온파(구약의 신을 악신으로 본 초대교회 이단) [Marcionites]', nameKoShort: '마르키온파', nameFr: 'Marcionites', nameEn: 'Marcionites (2nd-Century Dualist Heretics Rejecting the Old Testament God)' },
  'e2538-mardi': { nameKo: '화요일(손톱 깎기와 금기의 요일) [Mardi / Tuesday Folk Superstition]', nameKoShort: '화요일', nameFr: 'Mardi', nameEn: 'Tuesday (Folklore Superstitions on Cutting Nails and Luck)' },
  'e2539-marechaldesalon': { nameKo: '마레샬 드 살롱 [Maréchal de salon]', nameKoShort: '마레샬 드 살롱', nameFr: 'Maréchal de salon', nameEn: 'Maréchal de salon' },
  'e2540-marentakein': { nameKo: '마렌타케인 [Marentakein]', nameKoShort: '마렌타케인', nameFr: 'Marentakein', nameEn: 'Marentakein' },
  'e2541-margaritomancie': { nameKo: '진주점술(마르가리토만시) [Margaritomancie / Margaritomancy]', nameKoShort: '진주점술', nameFr: 'Margaritomancie', nameEn: 'Margaritomancy (Divination by Pearls Heated near Fire to Expose Thieves)' },
  'e2542-marguerite': { nameKo: '홀란트의 마르가레타(365명의 아이를 낳은 백작부인) [Marguerite de Hollande / Margaret of Henneberg]', nameKoShort: '마르가레타 백작부인', nameFr: 'Marguerite (De Hollande)', nameEn: 'Margaret of Henneberg (Countess Cursed to Give Birth to 365 Children)' },
  'e2543-marguerite': { nameKo: '밀라노의 마르게리타(사역마를 부린 점술 여인) [Marguerite de Milan]', nameKoShort: '밀라노의 마르게리타', nameFr: 'Marguerite (De Milan)', nameEn: 'Marguerite of Milan (Italian Woman with a Familiar Spirit Predicting Secrets)' },
  'e2544-margueritedenavarre': { nameKo: '나바라의 마르그리트(혜성을 보고 임종을 예감한 여왕) [Marguerite de Navarre]', nameKoShort: '나바라의 마르그리트', nameFr: 'Marguerite de Navarre', nameEn: 'Marguerite of Navarre (Queen Who Foretold Her Death upon Seeing a Comet)' },
  'e2545-mariachodemoleres': { nameKo: '마리아초 드 몰레레스(바스크의 악명 높은 마녀) [Mariacho de Molères]', nameKoShort: '마리아초', nameFr: 'Mariacho de Molères', nameEn: 'Mariacho de Molères (Notorious Basque Witch Accused by Marie Aspiculette)' },
  'e2546-mariage': { nameKo: '혼인 점술(미래의 배우자를 알아보는 민간 비방) [Mariage / Marriage Divination Omens]', nameKoShort: '혼인 점술', nameFr: 'Mariage', nameEn: 'Marriage (Folklore Divinations to Foretell One\'s Future Spouse)' },
  'e2547-mariagedudiable': { nameKo: '악마의 결혼(괴레스의 신비주의 알레고리) [Mariage du diable / Devil\'s Wedding]', nameKoShort: '악마의 결혼', nameFr: 'Mariage du diable', nameEn: 'The Devil\'s Marriage (Görres\' Mystical Allegory of Sins and Vices)' },
  'e2548-mariagranemarie': { nameKo: '마리 마리아그란(사탄의 면전을 목격한 바스크 마녀) [Marie Mariagrane]', nameKoShort: '마리 마리아그란', nameFr: 'Mariagrane (Marie)', nameEn: 'Marie Mariagrane (Basque Witch Describing the Devil in Delancre\'s Trials)' },
  'e2549-marignyenguerrandde': { nameKo: '앙게랑 드 마리니(밀랍 인형 저주로 교수형된 프랑스 재상) [Enguerrand de Marigny]', nameKoShort: '앙게랑 드 마리니', nameFr: 'Marigny ( Enguerrand de)', nameEn: 'Enguerrand de Marigny (Chamberlain of Philip IV Executed for Wax Image Sorcery)' },
  'e2550-marionnettes': { nameKo: '꼭두각시 인형(작은 악마가 깃들었다고 여겨진 인형극) [Marionnettes / Puppets and Imp Familiars]', nameKoShort: '꼭두각시 인형', nameFr: 'Marionnettes', nameEn: 'Marionettes (Puppet Shows Once Believed to Be Inhabited by Small Demons)' },
  'e2551-marissane': { nameKo: '마리산(사바트 공중 비행에 휩쓸린 청년의 일화) [Marissane / Flight to the Sabbat]', nameKoShort: '마리산', nameFr: 'Marissane', nameEn: 'Marissane (Tale of a Youth Kidnapped into the Air to the Sabbat)' },
  'e2552-marius': { nameKo: '가이우스 마리우스(스키타이 마녀를 대동한 로마 장군) [Gaius Marius]', nameKoShort: '마리우스', nameFr: 'Marius', nameEn: 'Gaius Marius (Roman Consul Who Campaigned with a Syrian/Scythian Prophetess)' },
  'e2553-marlethomasde': { nameKo: '토마 드 마를(악마적 잔혹함으로 악명 높았던 쿠시 영주) [Thomas de Marle / Thomas de Coucy]', nameKoShort: '토마 드 마를', nameFr: 'Marle (Thomas de)', nameEn: 'Thomas de Marle (Brutal 12th-Century Feudal Tyrant of Coucy)' },
  'e2554-marlowe': { nameKo: '크리스토퍼 말로(파우스트를 무대에 올린 비극 시인) [Christopher Marlowe]', nameKoShort: '크리스토퍼 말로', nameFr: 'Marlowe', nameEn: 'Christopher Marlowe (Elizabethan Dramatist of Doctor Faustus)' },
  'e2555-marot': { nameKo: '마루트(바빌론의 타락 천사) [Marot / Harut and Marut]', nameKoShort: '마루트', nameFr: 'Marot', nameEn: 'Marut (Fallen Angel of Babylon in the Quran and Islamic Lore)' },
  'e2556-marquedudiable': { nameKo: '악마의 표식(마녀의 몸에 새겨진 무통점 스티그마) [Marque du diable / Devil\'s Mark]', nameKoShort: '악마의 표식', nameFr: 'Marque du diable', nameEn: 'Devil\'s Mark (Insensitive Spot on Witches Found by Pinpricking)' },
  'e2557-marquisdelenfer': { nameKo: '지옥의 후작들(지옥 귀족 위계) [Marquis de l\'enfer / Marquises of Hell]', nameKoShort: '지옥의 후작들', nameFr: 'Marquis de l\'enfer', nameEn: 'Marquises of Hell (Infernal Nobility Ranking between Dukes and Counts)' },
  'e2558-marsay': { nameKo: '마르세 [Marsay]', nameKoShort: '마르세', nameFr: 'Marsay', nameEn: 'Marsay' },
  'e2559-martibelsarenaouserena': { nameKo: '세레나 마르티벨(수아송의 사바트 춤꾼 마녀) [Séréna Martibel]', nameKoShort: '세레나 마르티벨', nameFr: 'Martibel (Sarena ou Séréna)', nameEn: 'Séréna Martibel (15th-Century Soissons Witch Seen Dancing at the Sabbat)' },
  'e2560-martinsaint': { nameKo: '투르의 성 마르티노(미사 중 악마를 물리친 주교 성인) [Saint Martin de Tours]', nameKoShort: '성 마르티노', nameFr: 'Martin (Saint)', nameEn: 'Saint Martin of Tours (Bishop Who Banished the Devil Disrupting Mass)' },
  'e2561-martinmarie': { nameKo: '마리 마르탱(가축을 병들게 한 피카르디의 마녀) [Marie Martin]', nameKoShort: '마리 마르탱', nameFr: 'Martin (Marie)', nameEn: 'Marie Martin (Picardy Witch Arrested for Killing Farm Animals with Sorcery)' },
  'e2562-martinthomas': { nameKo: '토마 마르탱(대천사 라파엘의 환시를 본 보스의 농부) [Thomas Martin]', nameKoShort: '토마 마르탱', nameFr: 'Martin (Thomas)', nameEn: 'Thomas Martin of Gallardon (Peasant Visionary Who Warned King Louis XVIII in 1816)' },
  'e2563-martinet': { nameKo: '마르티네(마법사의 허락 없는 행동을 금지한 사역마 악령) [Martinet / Familiar Demon]', nameKoShort: '마르티네', nameFr: 'Martinet', nameEn: 'Martinet (Familiar Demon Who Accompanied Sorcerers and Dictated Rules)' },
  'e2564-martre': { nameKo: '담비 모피(사악한 주술을 막아주는 러시아의 부적) [Martre / Marten Fur Amulet]', nameKoShort: '담비 모피', nameFr: 'Martre', nameEn: 'Marten Fur (Russian Amulet Warded against Spells and Bewitchment)' },
  'e2565-martym': { nameKo: '마르팀(바팀, 독사의 꼬리를 지닌 지옥의 대공) [Martym / Bathym]', nameKoShort: '마르팀', nameFr: 'Martym', nameEn: 'Martym (Bathin / Bathym / Duke of Hell Commanding 30 Legions)' },
  'e2566-mascarades': { nameKo: '가면무도회(고대 갈리아의 미트라 제의와 동물 변장) [Mascarades / Mithraic Disguises]', nameKoShort: '가면무도회', nameFr: 'Mascarades', nameEn: 'Masquerades (Ancient Celtic and Mithraic Animal Disguises and Rituals)' },
  'e2567-massaliens': { nameKo: '메살리아파(몸속 악마를 침으로 뱉어낸다는 초대교회 이단) [Massaliens / Messalians]', nameKoShort: '메살리아파', nameFr: 'Massaliens', nameEn: 'Messalians (4th-Century Praying Heretics Who Believed in Spitting Out Demons)' },
  'e2568-mastication': { nameKo: '시체 저작(무덤 속에서 수의를 씹어먹는 시체의 전염병 저주) [Mastication des morts]', nameKoShort: '시체 저작', nameFr: 'Mastication', nameEn: 'Mastication of the Dead (Vampiric Chewing of Shrouds Spreading Pestilence)' },
  'e2569-mastiphal': { nameKo: '마스티파(외경 희년서의 악마 군주 마스테마) [Mastiphal / Mastema]', nameKoShort: '마스티파', nameFr: 'Mastiphal', nameEn: 'Mastiphal (Mastema / Prince of Evil Demons in the Book of Jubilees)' },
  'e2570-matchimanitou': { nameKo: '마치 마니투(북아메리카 원주민의 악의적인 대정령) [Matchi-Manitou / Evil Great Spirit]', nameKoShort: '마치 마니투', nameFr: 'Matchi-Manitou', nameEn: 'Matchi-Manitou (Algonquian Evil Spirit / Counterpart of the Good Manitou)' },
  'e2571-matiere': { nameKo: '물질 숭배(오컬트와 카발라의 유물론적 기원) [Matière / Worship of Matter]', nameKoShort: '물질 숭배', nameFr: 'Matière', nameEn: 'Worship of Matter (Materialistic Roots of the Cabala and Occultism)' },
  'e2572-matignonjacquesgoyonde': { nameKo: '자크 고용 드 마티뇽(마법 소문에 휘말린 프랑스 원수) [Jacques Goyon de Matignon]', nameKoShort: '마티뇽 원수', nameFr: 'Matignon (Jacques Goyon de)', nameEn: 'Jacques Goyon de Matignon (Marshal of France Accused of Sorcery by Rivals)' },
  'e2573-matignonlepade': { nameKo: 'A. 드 마티뇽 신부(초자연의 문제를 저술한 예수회 학자) [Père A. de Matignon]', nameKoShort: '마티뇽 신부', nameFr: 'Matignon (le P. A. de)', nameEn: 'Father A. de Matignon (Jesuit Author of The Question of the Supernatural in 1861)' },
  'e2574-matthieulaensberg': { nameKo: '마티외 란스베르크(리에주의 전설적인 예언자이자 점성가) [Matthieu Laensberg]', nameKoShort: '마티외 란스베르크', nameFr: 'Matthieu Laensberg', nameEn: 'Matthieu Laensberg (Legendary Astrologer and Prophet of Liège Almanac)' },
  'e2575-matzou': { nameKo: '마조(바다의 수호 여신이자 항해의 여마술사) [Matzou / Mazu]', nameKoShort: '마조', nameFr: 'Matzou', nameEn: 'Mazu (Matzou / Chinese Goddess of the Sea and Sailors)' },
  'e2576-maupertuis': { nameKo: '모페르튀 [Maupertuis]', nameKoShort: '모페르튀', nameFr: 'Maupertuis', nameEn: 'Maupertuis' },
  'e2577-maurice': { nameKo: '마우리키우스(요람에서 요정에게 납치되었던 비잔티움 황제) [Maurice / Emperor Maurice]', nameKoShort: '마우리키우스 황제', nameFr: 'Maurice', nameEn: 'Emperor Maurice (Byzantine Ruler Kidnapped by Fairies in Infancy)' },
  'e2578-mauryalfred': { nameKo: '알프레드 모리(마술과 점성술을 심리학으로 해부한 석학) [Alfred Maury]', nameKoShort: '알프레드 모리', nameFr: 'Maury (Alfred)', nameEn: 'Alfred Maury (19th-Century Scholar on Magic, Astrology, and Dream Psychology)' },
  'e2579-mauryjeansiffrein': { nameKo: '장시프랭 모리 추기경(파리 행상의 풍자 대상이 된 성직자) [Jean-Siffrein Maury]', nameKoShort: '모리 추기경', nameFr: 'Maury (Jean-Siffrein)', nameEn: 'Cardinal Jean-Siffrein Maury (French Royalist Cleric Ridiculed in 1792 Pamphlets)' },
  'e2580-mecanique': { nameKo: '기계공학의 이적(마술로 둔갑한 과학 장치) [Mécanique / Mechanical Wonders]', nameKoShort: '기계공학의 이적', nameFr: 'Mécanique', nameEn: 'Mechanical Wonders (Automata and Devices Mistaken for Magic, p.451 Plate)' },
  'e2581-mecasphins': { nameKo: '메카스핌(독약과 유골을 사용하는 칼데아의 마술사들) [Mécasphins / Mekhashephim]', nameKoShort: '메카스핌', nameFr: 'Mécasphins', nameEn: 'Mekhashephim (Chaldean and Hebrew Sorcerers Using Herbs and Bones)' },
  'e2582-mechant': { nameKo: '악한 자(사탄의 칭호 \'르 메샹\') [Méchant / The Wicked One]', nameKoShort: '악한 자', nameFr: 'Méchant', nameEn: 'The Wicked One (Le Méchant / Universal Title for the Devil)' },
  'e2583-mechtildesainte': { nameKo: '성녀 메히틸트(지옥과 천상의 환시를 본 헬프타의 수녀) [Sainte Mechtilde of Hackeborn]', nameKoShort: '성녀 메히틸트', nameFr: 'Mechtilde (sainte)', nameEn: 'Saint Mechtilde (13th-Century German Mystic Nun of Helfta)' },
  'e2584-medecine': { nameKo: '의술과 주술(주술적 미신에서 벗어난 의학의 역사) [Médecine / Medicine and Superstition]', nameKoShort: '의술과 주술', nameFr: 'Médecine', nameEn: 'Medicine (Historical Transition from Magical Charms to Rational Healing)' },
  'e2585-medee': { nameKo: '메데이아(콜키스의 마법사 공주) [Médée / Medea]', nameKoShort: '메데이아', nameFr: 'Médée', nameEn: 'Medea (Colchian Sorceress Who Aided Jason and Possessed Rejuvenation Magic)' },
  'e2586-medie': { nameKo: '메디아의 신비석(시력을 회복시키는 마법의 보석) [Médie / Wonder Stones of Media]', nameKoShort: '메디아의 신비석', nameFr: 'Médie', nameEn: 'Stones of Media (Black and Green Miraculous Gems Restoring Sight)' },
  'e2587-meerman': { nameKo: '메어만(발트해의 바다 사나이, 인어의 남성형) [Meerman / Baltic Merman]', nameKoShort: '메어만', nameFr: 'Meerman', nameEn: 'Meerman (Sea-Man / Baltic Legend of Male Merfolk)' },
  'e2588-megalanthropogenesie': { nameKo: '위인 탄생술(아름답고 총명한 아이를 낳는 비법) [Mégalanthropogénésie]', nameKoShort: '위인 탄생술', nameFr: 'Mégalanthropogénésie', nameEn: 'Megalanthropogenesis (18th-Century Theory on Producing Genius Children)' },
  'e2589-mehdi': { nameKo: '알마흐디(1841년 아라비아의 거짓 예언자) [Al-Mahdi / The False Prophet of Arabia]', nameKoShort: '알마흐디', nameFr: 'Mehdi', nameEn: 'Al-Mahdi (The Arab Prophet Appearing in 1841 Portrayed as an Impostor, p.452 Plate)' },
  'e2590-meigmalloch': { nameKo: '메이그말록(소녀의 모습을 한 스코틀랜드 브라우니 요정) [Meigmalloch]', nameKoShort: '메이그말록', nameFr: 'Meigmalloch', nameEn: 'Meigmalloch (Scottish Highland Brownie Appearing as a Young Girl)' },
  'e2591-melampus': { nameKo: '멜람푸스(동물의 말을 알아듣고 신체점을 창시한 그리스 현자) [Mélampus / Melampous]', nameKoShort: '멜람푸스', nameFr: 'Mélampus', nameEn: 'Melampus (Legendary Greek Healer Who Understood Animals and Wrote on Divination)' },
  'e2592-melanchthon': { nameKo: '필리프 멜란히톤(점성술과 유령을 믿은 종교개혁가) [Philipp Melanchthon]', nameKoShort: '멜란히톤', nameFr: 'Mélanchthon', nameEn: 'Philipp Melanchthon (Reformer and Humanist Who Believed in Ghosts and Astrology)' },
  'e2593-melancolie': { nameKo: '우울증(악마의 목욕탕으로 불린 흑담즙병) [Mélancolie / The Devil\'s Bath]', nameKoShort: '우울증', nameFr: 'Mélancolie', nameEn: 'Melancholy (The Devil\'s Bath / Humoral Black Bile Exploited by Demons)' },
  'e2594-melchisedech': { nameKo: '멜키세덱(살렘의 왕이자 신비주의 이단의 신격화) [Melchisédech / Melchizedek]', nameKoShort: '멜키세덱', nameFr: 'Melchisédech', nameEn: 'Melchizedek (King of Salem / Divine Figure in Gnostic Heresies)' },
  'melchom': { nameKo: '멜콤(지옥 궁정의 총괄 급료 지급관 악마) [Melchom / Treasurer of Hell]', nameKoShort: '멜콤', nameFr: 'Melchom', nameEn: 'Melchom (Paymaster and Treasurer of Hell / Purse-Bearer Demon, Plate 47)' },
  'e2596-melekalmout': { nameKo: '말라크 알마우트(이슬람의 죽음의 천사 아즈라엘) [Melek-al-Mout / Angel of Death]', nameKoShort: '말라크 알마우트', nameFr: 'Melek-al-Mout', nameEn: 'Malak al-Mawt (Azrael / Islamic Angel of Death Separating Soul from Body)' },
  'e2597-melissa': { nameKo: '멜리사 [Melissa]', nameKoShort: '멜리사', nameFr: 'Melissa', nameEn: 'Melissa' },
  'e2598-meleze': { nameKo: '낙엽송(타타르족이 두려워한 저주받은 마법 나무) [Mélèze / Larch]', nameKoShort: '낙엽송', nameFr: 'Mélèze', nameEn: 'Larch (Cursed Tree in Tartar Folklore Inhabited by Evil Spirits)' },
  'e2599-melusine': { nameKo: '멜뤼진(뤼지냥 가문의 수호 요정, 뱀의 여인) [Mélusine / Fairy of Lusignan]', nameKoShort: '멜뤼진', nameFr: 'Mélusine', nameEn: 'Melusine (Famous Fairy Ancestress of the House of Lusignan)' },
  'e2600-melye': { nameKo: '멜리에(물푸레나무의 님프와 요정들의 위계) [Melye / Meliae Nymphs]', nameKoShort: '멜리에', nameFr: 'Melye', nameEn: 'Meliae (Ash Tree Nymphs and the Hierarchy of Fairy Powers)' },
  'e2601-menah': { nameKo: '메나(메카 순례길 사탄의 유혹을 물리치는 신비의 계곡) [Menah / Mina Valley]', nameKoShort: '메나 계곡', nameFr: 'Menah', nameEn: 'Mina Valley (Menah / Sacred Valley near Mecca Where Pilgrims Stone the Devil)' },
  'e2602-menandre': { nameKo: '메난드로스(사마리아의 영지주의 마술사) [Ménandre / Menander the Gnostic]', nameKoShort: '메난드로스', nameFr: 'Ménandre', nameEn: 'Menander (1st-Century Gnostic Disciple of Simon Magus in Antioch)' },
  'e2603-menassehbenisrael': { nameKo: '므낫세 벤 이스라엘(탈무드와 영혼의 신비를 저술한 랍비) [Menasseh ben Israël]', nameKoShort: '므낫세 벤 이스라엘', nameFr: 'Menasseh ben Israël', nameEn: 'Menasseh ben Israel (17th-Century Amsterdam Rabbi, Scholar, and Friend of Rembrandt)' },
  'e2604-menestrierclaudefrancois': { nameKo: '클로드프랑수아 메네스트리에(수수께끼 상징학의 대가 예수회 신부) [Claude-François Ménestrier]', nameKoShort: '메네스트리에 신부', nameFr: 'Ménestrier (Claude-François)', nameEn: 'Claude-François Ménestrier (Jesuit Polymath on Emblems, Heraldry, and Enigmas)' },
  'e2605-meneursdeloups': { nameKo: '늑대몰이꾼(늑대 떼를 부리는 프랑스의 숲속 주술사) [Meneurs de loups / Wolf Leaders]', nameKoShort: '늑대몰이꾼', nameFr: 'Meneurs de loups', nameEn: 'Wolf Leaders (French Folklore Sorcerers Who Commanded Packs of Wolves)' },
  'e2606-menippe': { nameKo: '메닙포스(뱀 요마 라미아의 유혹에서 구출된 철학자) [Menippe / Menippus]', nameKoShort: '메닙포스', nameFr: 'Menippe', nameEn: 'Menippus of Corinth (Saved by Apollonius of Tyana from a Vampiric Lamia)' },
  'e2607-menjoin': { nameKo: '망주앙 [Menjoin]', nameKoShort: '망주앙', nameFr: 'Menjoin', nameEn: 'Menjoin' },
  'e2608-menra': { nameKo: '멤라(카발라 신비주의의 말씀이자 창조자) [Menra / Memra]', nameKoShort: '멤라', nameFr: 'Menra', nameEn: 'Memra (The Divine Word / Logos as Creator in Cabalistic and Targumic Lore)' },
  'e2609-mensonge': { nameKo: '거짓말의 아비(악마의 본질적 정의) [Mensonge / Father of Lies]', nameKoShort: '거짓말의 아비', nameFr: 'Mensonge', nameEn: 'Father of Lies (Diabolical Deception in the Gospel of John)' },
  'e2610-mephistopheles': { nameKo: '메피스토펠레스(차가운 조소의 지옥 악마) [Méphistophélès / Mephistopheles]', nameKoShort: '메피스토펠레스', nameFr: 'Méphistophélès', nameEn: 'Mephistopheles (Faust\'s Cynical Demon of Cold Irony and Skepticism)' },
  'e2611-mercana': { nameKo: '메르카바(초자연적 비의를 전수하는 카발라 병거 신비주의) [Mercana / Merkavah]', nameKoShort: '메르카바', nameFr: 'Mercana', nameEn: 'Merkavah Mysticism (Chariot Vision of Ezekiel Imparting Supernatural Lore)' },
  'e2612-mercatimichel': { nameKo: '미켈레 메르카티 [Michele Mercati]', nameKoShort: '미켈레 메르카티', nameFr: 'Mercati (Michel)', nameEn: 'Michele Mercati' },
  'e2613-mercier': { nameKo: '루이 세바스티앵 메르시에(철학적 꿈의 기록자) [Louis-Sébastien Mercier]', nameKoShort: '메르시에', nameFr: 'Mercier', nameEn: 'Louis-Sébastien Mercier (Author of Tableau de Paris and Philosophical Dreams)' },
  'e2614-mercredi': { nameKo: '수요일(사바트의 비밀 미사가 열리는 마녀의 요일) [Mercredi / Wednesday]', nameKoShort: '수요일', nameFr: 'Mercredi', nameEn: 'Wednesday (Day of Sabbat Mysteries and Inverted Litanies)' },
  'e2615-mercure': { nameKo: '메르쿠리우스(망자의 영혼을 저승으로 인도하는 신) [Mercure / Mercury Psychopomp]', nameKoShort: '메르쿠리우스', nameFr: 'Mercure', nameEn: 'Mercury (Psychopomp Deity Guiding Souls of the Dead to the Underworld)' },
  'e2616-meres': { nameKo: '어머니 요정들(브르타뉴의 백조 변신 요정) [Mères / Breton Mother Fairies]', nameKoShort: '어머니 요정들', nameFr: 'Mères', nameEn: 'Mother Fairies (Les Mères / Breton Fairies Transforming into White Swans)' },
  'e2617-merle': { nameKo: '지빠귀의 깃털(붉은 실로 묶어 잠을 쫓는 마법 부적) [Merle / Blackbird Feather Charm]', nameKoShort: '지빠귀의 깃털', nameFr: 'Merle', nameEn: 'Blackbird (Folk Amulet of Right Wing Feather Preventing Sleep)' },
  'e2618-merlin': { nameKo: '마법사 멀린(아서왕 전설의 대마법사이자 인큐버스의 아들) [Merlin the Enchanter]', nameKoShort: '마법사 멀린', nameFr: 'Merlin', nameEn: 'Merlin the Enchanter (Legendary Wizard Born of an Incubus Demon, p.455 Plate)' },
  'e2619-merovee': { nameKo: '메로베우스(바다 괴물 퀴노타우루스의 혈통 전설) [Mérovée / Merovech]', nameKoShort: '메로베우스 왕', nameFr: 'Mérovée', nameEn: 'Merovech (Legendary Frankish King Born of a Sea Monster Quinotaur)' },
  'e2620-merveilles': { nameKo: '경이로운 불가사의들(토끼 떼의 습격과 고대의 기이한 사건들) [Merveilles / Ancient Miracles]', nameKoShort: '경이로운 불가사의들', nameFr: 'Merveilles', nameEn: 'Wonders and Prodigies (Pliny\'s Account of Rabbit Invasions and Prodigies)' },
  'e2621-mesmerantoine': { nameKo: '프란츠 안톤 메스메르(동물자기설과 최면술의 개척자) [Franz Anton Mesmer]', nameKoShort: '메스메르', nameFr: 'Mesmer (Antoine)', nameEn: 'Franz Anton Mesmer (German Physician Who Developed Animal Magnetism)' },
  'e2622-messahala': { nameKo: '메사할라 [Messa-Hala]', nameKoShort: '메사할라', nameFr: 'Messa-Hala', nameEn: 'Messa-Hala' },
  'e2623-messedudiable': { nameKo: '검은 미사(사바트의 사탄 숭배 전례) [Messe du diable / Black Mass]', nameKoShort: '검은 미사', nameFr: 'Messe du diable', nameEn: 'The Devil\'s Mass (Black Mass of the Sabbat Parodying Catholic Liturgy)' },
  'e2624-messiedesjuifs': { nameKo: '거짓 메시아들(유대 역사에 출현한 사이비 구원자들) [Messie des juifs / False Messiahs]', nameKoShort: '거짓 메시아들', nameFr: 'Messie des juifs', nameEn: 'False Messiahs (Dositheus, Shabbetai Zvi, and Other Impostors in Jewish History)' },
  'e2625-metamorphoses': { nameKo: '변신 설화(동물과 식물로 둔갑하는 마술적 변신) [Métamorphoses / Transformations]', nameKoShort: '변신 설화', nameFr: 'Métamorphoses', nameEn: 'Metamorphoses (Mythological and Folk Transformations of Humans into Beasts)' },
  'e2626-metatron': { nameKo: '메타트론(카발라 신비주의의 옥좌 천사) [Métatron / Metatron]', nameKoShort: '메타트론', nameFr: 'Métatron', nameEn: 'Metatron (Supreme Cabalistic Angel of the Divine Presence)' },
  'e2627-metempsycose': { nameKo: '윤회사상(영혼 윤회와 환생의 교리) [Métempsycose / Metempsychosis]', nameKoShort: '윤회사상', nameFr: 'Métempsycose', nameEn: 'Metempsychosis (Transmigration of Souls in Pythagorean and Eastern Lore)' },
  'e2628-metoposcopie': { nameKo: '이마 관상술(메토포스코피, 이마 주름 점술) [Métoposcopie / Metoposcopy]', nameKoShort: '이마 관상술', nameFr: 'Métoposcopie', nameEn: 'Metoposcopy (Cardano\'s Divination by Forehead Lines and Planetary Signs)' },
  'e2629-meurtre': { nameKo: '살인과 피의 복수(선량공 샤를 살해범들의 악령 환각) [Meurtre / Terrors of Murderers]', nameKoShort: '살인과 피의 복수', nameFr: 'Meurtre', nameEn: 'Murder (Supernatural Horrors and Demonic Visions Haunting Murderers, p.458 Plate)' },
  'e2630-meyer': { nameKo: '요한 프리드리히 마이어(유령 출현을 연구한 할레 대학 철학교수) [Johann Friedrich Meyer]', nameKoShort: '요한 마이어', nameFr: 'Meyer', nameEn: 'Johann Friedrich Meyer (Halle Philosophy Professor and Author on Apparitions)' },
  'e2631-michaeleliacim': { nameKo: '엘리아킴 미카엘(국왕에게 성령의 경고를 보낸 파리의 광신자) [Éliacim Michael]', nameKoShort: '엘리아킴 미카엘', nameFr: 'Michael (Éliacim)', nameEn: 'Éliacim Michael (Jean Desmarets de Saint-Sorlin and the Royal Prophecies)' },
  'e2632-michaelissebastien': { nameKo: '세바스티앵 미카엘리스(엑상프로방스 구마록을 쓴 도미니코회 수도원장) [Sébastien Michaélis]', nameKoShort: '미카엘리스 신부', nameFr: 'Michaélis (Sébastien)', nameEn: 'Sébastien Michaélis (Dominican Inquisitor and Author of the 1612 Aix-en-Provence Possession)' },
  'e2633-michelmontsaint': { nameKo: '몽생미셸의 바위(인간에게서 쫓겨난 악마들이 모이는 성소) [Mont Saint-Michel / Mount of St. Michael]', nameKoShort: '몽생미셸', nameFr: 'Michel (Mont Saint-)', nameEn: 'Mont Saint-Michel (Breton Sacred Rock Where Exorcised Demons Gather)' },
  'e2634-michel': { nameKo: '살롱의 마제사 미셸(루이 14세를 독대한 대장장이) [Michel / Farrier of Salon]', nameKoShort: '살롱의 미셸', nameFr: 'Michel', nameEn: 'Michel the Farrier of Salon (Visionary Blacksmith Granted Private Audience with Louis XIV, p.459 Plate)' },
  'e2635-micheldesahourspe': { nameKo: '미셸 드 사우르스프(사바트의 대소 악마를 목격한 작센 마법사) [Michel de Sahourspe]', nameKoShort: '미셸 드 사우르스프', nameFr: 'Michel de Sahourspe', nameEn: 'Michel de Sahourspe (Saxon Sorcerer Who Saw the Great and Lesser Devils at the Sabbat)' },
  'e2636-michellecossais': { nameKo: '마이클 스콧(신성로마제국 황제의 마법사이자 점성가) [Michael Scot / Michel l\'Écossais]', nameKoShort: '마이클 스콧', nameFr: 'Michel l\'Écossais', nameEn: 'Michael Scot (13th-Century Scottish Polymath, Alchemist, and Astrologer of Frederick II)' },
  'e2637-michellebohemien': { nameKo: '보헤미아의 미셸(악마와 결탁한 경험적 돌팔이 의사) [Michel le Bohémien]', nameKoShort: '보헤미아의 미셸', nameFr: 'Michel le Bohémien', nameEn: 'Michael the Bohemian (16th-Century Empiric Healer Accused of Demonic Pacts)' },
  'e2638-midas': { nameKo: '미다스(황금의 손과 당나귀 귀의 프리기아 왕) [Midas / King Midas]', nameKoShort: '미다스 왕', nameFr: 'Midas', nameEn: 'King Midas (Phrygian King of the Golden Touch and Ass\'s Ears, p.460 Plate)' },
  'e2639-midi': { nameKo: '정오의 악마 [Midi]', nameKoShort: '정오의 악마', nameFr: 'Midi', nameEn: 'Midi (Demon of Noontide)' },
  'e2640-migalena': { nameKo: '미갈레나(라부르 지방의 61세 바스크 마녀) [Migalena]', nameKoShort: '미갈레나', nameFr: 'Migalena', nameEn: 'Migalena (61-Year-Old Basque Witch Arrested in Labourd in 1609)' },
  'e2641-mikado': { nameKo: '미카도(일본의 살아있는 신성 군주) [Mikado / Emperor of Japan]', nameKoShort: '미카도', nameFr: 'Mikado', nameEn: 'Mikado (Sacred Spiritual Emperor of Japan in European Demonological Accounts)' },
  'e2642-milan': { nameKo: '솔개(분노를 잠재우는 솔개 머리뼈의 비방) [Milan / Kite Bird Amulet]', nameKoShort: '솔개', nameFr: 'Milan', nameEn: 'Kite (Bird of Marvelous Virtues in Albertus Magnus\' Occult Lore, p.460 Plate)' },
  'e2643-millenaires': { nameKo: '천년왕국설(그리스도의 지상 천년 통치와 종말론) [Millénaires / Millenarians]', nameKoShort: '천년왕국설', nameFr: 'Millénaires', nameEn: 'Millenarians (Chiliasts Believing in the 1,000-Year Earthly Reign of Christ)' },
  'e2644-miller': { nameKo: '윌리엄 밀러(1843년 지구 종말을 예언한 미국의 시한부 종말론자) [William Miller]', nameKoShort: '윌리엄 밀러', nameFr: 'Miller', nameEn: 'William Miller (American Baptist Preacher Foretelling the 1843/1844 Apocalypse)' },
  'e2645-millo': { nameKo: '밀로(18세기 헝가리의 처녀를 습격한 흡혈귀) [Millo the Vampire]', nameKoShort: '흡혈귀 밀로', nameFr: 'Millo', nameEn: 'Millo (18th-Century Hungarian Vampire Strangling the Maiden Stanoska)' },
  'e2646-milon': { nameKo: '크로토네의 밀론(황소를 짊어진 고대 그리스의 천하장사) [Milon de Crotone / Milo of Croton]', nameKoShort: '밀론', nameFr: 'Milon', nameEn: 'Milo of Croton (6th-Century BC Legendary Greek Wrestler of Prodigious Strength)' },
  'e2647-milton': { nameKo: '존 밀턴(『실낙원』으로 지옥의 위용을 노래한 대시인) [John Milton]', nameKoShort: '존 밀턴', nameFr: 'Milton', nameEn: 'John Milton (Author of Paradise Lost Portraying Satan and the Infernal Hierarchy)' },
  'e2648-mimer': { nameKo: '미미르(오딘에게 지혜를 준 북유럽의 거인) [Mimer / Mímir]', nameKoShort: '미미르', nameFr: 'Mimer', nameEn: 'Mimir (Norse Giant Guarding the Well of Wisdom beneath Yggdrasil)' },
  'e2649-mimi': { nameKo: '미미 [Mimi]', nameKoShort: '미미', nameFr: 'Mimi', nameEn: 'Mimi' },
  'e2650-mimique': { nameKo: '표정 몸짓학(신체 언어와 인상 감정술) [Mimique / Physiognomic Mimicry]', nameKoShort: '표정 몸짓학', nameFr: 'Mimique', nameEn: 'Mimicry and Gesture Science (Reading Character from Habits and Expressions, p.461 Plate)' },
  'e2651-mineursdemon': { nameKo: '광산의 악마(갱도 속의 코볼트와 요마들) [Démons des mines / Mine Goblins]', nameKoShort: '광산의 악마', nameFr: 'Mineurs (Démon)', nameEn: 'Demons of the Mines (Kobolds, Knockers, and Underground Spirits Haunting Miners)' },
  'e2652-mingrelie': { nameKo: '밍그렐리아(타락한 성직자와 기괴한 주술의 나라) [Mingrélie / Mingrelia]', nameKoShort: '밍그렐리아', nameFr: 'Mingrélie', nameEn: 'Mingrelia (Caucasian Region Noted for Superstitious Priests and Idolatrous Charms)' },
  'e2653-minoson': { nameKo: '미노손(모든 도박과 내기에서 승리하게 돕는 악마) [Minoson / Demon of Gambling]', nameKoShort: '미노손', nameFr: 'Minoson', nameEn: 'Minoson (Subordinate of Bael Ensuring Victory in All Games of Chance)' },
  'e2654-minuit': { nameKo: '자정(마녀의 사바트와 악령들의 시간) [Minuit / Witching Hour of Midnight]', nameKoShort: '자정', nameFr: 'Minuit', nameEn: 'Midnight (The Witching Hour When Graves Open and Demons Gather)' },
  'e2655-mirabelhonore': { nameKo: '오노레 미라벨(가짜 유령 환시로 금화를 편취한 사기꾼) [Honoré Mirabel]', nameKoShort: '오노레 미라벨', nameFr: 'Mirabel (Honoré)', nameEn: 'Honoré Mirabel (Swindler Condemned to Galley for Fake Ghost Treasure Hoax, p.467 Plate)' },
  'e2656-mirabilisliber': { nameKo: '미라빌리스 리베르(1522년에 출간된 경이로운 예언집) [Mirabilis liber / Book of Wonders]', nameKoShort: '미라빌리스 리베르', nameFr: 'Mirabilis liber', nameEn: 'Mirabilis Liber (1522 Latin Grimoire of Prophecies Attributed to St. Caesarius)' },
  'e2657-miracles': { nameKo: '거짓 기적들(돌팔이 마술사들의 혹세무민 사기극) [Miracles / False Wonders and Sorcery]', nameKoShort: '거짓 기적들', nameFr: 'Miracles', nameEn: 'False Miracles (Fraudulent Feats and Trickery Exposed by Demonologists)' },
  'e2658-mirage': { nameKo: '신기루(사막과 바다의 요정 파타 모르가나) [Mirage / Fata Morgana]', nameKoShort: '신기루', nameFr: 'Mirage', nameEn: 'Mirage (Atmospheric Optical Illusion Personified as Fairy Enchantments)' },
  'e2659-mirak': { nameKo: '미라크 [Mirak]', nameKoShort: '미라크', nameFr: 'Mirak', nameEn: 'Mirak' },
  'e2660-miroir': { nameKo: '마법 거울(카토프트로만시, 천리 밖을 비추는 예언의 거울) [Miroir / Catoptromancy and Magic Mirrors]', nameKoShort: '마법 거울', nameFr: 'Miroir', nameEn: 'Magic Mirrors (Catoptromancy Revealing Distant Wars to Kings, p.468 Plate)' },
  'e2661-mirvillejeudesde': { nameKo: '쥘 외드 드 미르빌(악령의 실재성을 옹호한 19세기 악마학자) [Jules Eudes de Mirville]', nameKoShort: '미르빌 후작', nameFr: 'Mirville (J. Eudes de)', nameEn: 'Jules Eudes de Mirville (19th-Century Catholic Demonologist on Spirit Phenomena)' },
  'e2662-miscaunmarry': { nameKo: '미스콘 매리(아일랜드 늪지의 도깨비불) [Miscaun-Marry / Irish Will-o\'-the-Wisp]', nameKoShort: '미스콘 매리', nameFr: 'Miscaun-Marry', nameEn: 'Miscaun-Marry (Irish Folklore Name for the Will-o\'-the-Wisp or Ignis Fatuus)' },
  'e2663-misraim': { nameKo: '미스라임(함의 아들이자 이집트 마술의 시조) [Misraïm / Mizraim]', nameKoShort: '미스라임', nameFr: 'Misraïm', nameEn: 'Mizraim (Son of Ham / Patriarch and Mythical Founder of Egyptian Magic)' },
  'e2664-moensklint': { nameKo: '묀스 클린트(발트해 백악 절벽의 벼락 전설) [Mœnsklint / Chalk Cliffs of Møn]', nameKoShort: '묀스 클린트', nameFr: 'Mœnsklint', nameEn: 'Møns Klint (Danish Chalk Cliffs Struck by Lightning in Baltic Storm Legends)' },
  'e2665-mog': { nameKo: '모그(마술사 마구스의 어원이 된 아르메니아의 고대 사제) [Mog / Armenian Magus]', nameKoShort: '모그', nameFr: 'Mog', nameEn: 'Mog (Ancient Armenian Priest and Etymological Root of the Word Magus)' },
  'e2666-mogol': { nameKo: '무굴 황제의 발 씻은 물(질병을 고친다는 인도의 미신) [Mogol / Mughal Emperor\'s Foot Water]', nameKoShort: '무굴 황제의 발 씻은 물', nameFr: 'Mogol', nameEn: 'Mughal Emperor (Folklore Charm of Washing Water Curing Sickness in Delancre)' },
  'e2667-mohra': { nameKo: '모라의 마녀재판(1669년 스웨덴의 대규모 어린이 사바트 사건) [Mohra / Mora Witch Trials]', nameKoShort: '모라의 마녀재판', nameFr: 'Mohra', nameEn: 'Mora Witch Trials (1669 Swedish Mass Panic Involving Hundreds of Children at Blockula)' },
  'e2668-moinebourru': { nameKo: '무뚝뚝한 수도사 [Moine bourru]', nameKoShort: '무뚝뚝한 수도사', nameFr: 'Moine bourru', nameEn: 'Moine bourru' },
  'e2669-moines': { nameKo: '수도사들의 악마 유혹(금식 중에 닥쳐온 붉은 소시지의 환영) [Moines / Monks Tempted by the Devil]', nameKoShort: '수도사들의 유혹', nameFr: 'Moines', nameEn: 'Monks (Medieval Moral Tales of Devils Tempting Monks during Strict Fasts)' },
  'e2670-mois': { nameKo: '열두 달의 수호신들(고대 로마 달력의 이교도 신격) [Mois / Tutelary Deities of the Months]', nameKoShort: '열두 달의 수호신들', nameFr: 'Mois', nameEn: 'Months (Pagan Tutelary Deities Governing the Twelve Months of the Year)' },
  'e2671-moise': { nameKo: '모세(신비주의 전승 속의 대예언자이자 비의의 입문자) [Moïse / Moses]', nameKoShort: '모세', nameFr: 'Moise', nameEn: 'Moses (Patriarch and Master of Secret Wisdom in Talmudic and Occult Legends)' },
  'e2672-moiset': { nameKo: '무아제(사바트 계약을 맺고 도망친 프랑스의 사기꾼 악마) [Moiset / Deceitful Imp]', nameKoShort: '무아제', nameFr: 'Moiset', nameEn: 'Moiset (Name Taken by a Swindler Imposter Claiming to Be a Sabbat Demon)' },
  'e2673-mokissos': { nameKo: '모키소스(로앙고 왕국의 수호 정령들) [Mokissos / Nkisi Spirits of Loango]', nameKoShort: '모키소스', nameFr: 'Mokissos', nameEn: 'Mokissos (Nkisi / Guardian Spirits and Fetish Powers in the Kingdom of Loango)' },
  'e2674-molitorulrich': { nameKo: '울리히 몰리토르(마녀의 환각론을 저술한 15세기 콘스탄츠 법학자) [Ulrich Molitor]', nameKoShort: '울리히 몰리토르', nameFr: 'Molitor (Ulrich)', nameEn: 'Ulrich Molitor (15th-Century Jurist and Author of De Lamiis et Pythonicis Mulieribus)' },
  'moloch': { nameKo: '몰록(눈물의 나라 군주, 암몬의 잔혹한 신) [Moloch / Prince of the Land of Tears]', nameKoShort: '몰록', nameFr: 'Moloch', nameEn: 'Moloch (Prince of the Land of Tears / Bull-Headed Demon of Child Sacrifice, Plate 48)' },
  'e2676-momies': { nameKo: '미라의 저주(폭풍우를 부른 라지비우 공작의 항해) [Momies / Curse of Egyptian Mummies]', nameKoShort: '미라의 저주', nameFr: 'Momies', nameEn: 'Mummies (Prince Radzivill\'s Shipwreck and the Curse of Transported Mummies, p.470 Plate)' },
  'e2677-monarchieinfernale': { nameKo: '지옥 군주국(요한 바이어가 체계화한 지옥의 제국 체제) [Monarchie infernale / Infernal Monarchy]', nameKoShort: '지옥 군주국', nameFr: 'Monarchie infernale', nameEn: 'Infernal Monarchy (Wierus\' Hierarchy of Belzebuth, Kings, Dukes, and Legions)' },
  'e2678-monde': { nameKo: '세계의 기원 [Monde]', nameKoShort: '세계의 기원', nameFr: 'Monde', nameEn: 'Monde' },
  'e2679-monkir': { nameKo: '뭉카르(무덤 속에서 죄인을 심문하는 이슬람의 천사) [Monkir / Munkar and Nakir]', nameKoShort: '뭉카르', nameFr: 'Monkir', nameEn: 'Munkar (Monkir / Islamic Grave-Interrogating Angel alongside Nakir)' },
  'e2680-monsieurdelaforet': { nameKo: '숲의 영주(퐁텐블로 숲의 검은 사냥꾼 유령) [Monsieur de Laforêt / Grand Huntsman]', nameKoShort: '숲의 영주', nameFr: 'Monsieur de Laforêt', nameEn: 'Monsieur de Laforêt (The Black Hunter Ghost of the Forest of Fontainebleau)' },
  'e2681-monstres': { nameKo: '괴물과 기형(초자연적 징조로 여겨진 해부학적 기형) [Monstres / Teratological Marvels]', nameKoShort: '괴물과 기형', nameFr: 'Monstres', nameEn: 'Monsters (Teratological Marvels and Mythical Beasts in History, p.471 Plate)' },
  'e2682-montagnards': { nameKo: '산악의 악마들(산속 광산 갱도를 지키는 요마들) [Montagnards / Mountain Mine Demons]', nameKoShort: '산악의 악마들', nameFr: 'Montagnards', nameEn: 'Mountain Demons (Subterranean Goblins Haunting Miners, p.473 Plate)' },
  'e2683-montalembertadriende': { nameKo: '아드리앙 드 몽탈랑베르(폴터가이스트 소동을 기록한 프랑수아 1세의 궁정 사제) [Adrien de Montalembert]', nameKoShort: '몽탈랑베르 사제', nameFr: 'Montalembert (Adrien de)', nameEn: 'Adrien de Montalembert (Almoner of Francis I and Author of the 1528 Spirit of Lyon)' },
  'e2684-montan': { nameKo: '몬타누스(광포한 황홀경과 예언을 주장한 2세기 이단) [Montan / Montanus]', nameKoShort: '몬타누스', nameFr: 'Montan', nameEn: 'Montanus (2nd-Century Phrygian Heresiarch Claiming to Be the Paraclete)' },
  'e2685-montanay': { nameKo: '몽타네 [Montanay]', nameKoShort: '몽타네', nameFr: 'Montanay', nameEn: 'Montanay' },
  'e2686-montezuma': { nameKo: '몬테수마 2세 [Montézuma]', nameKoShort: '몬테수마', nameFr: 'Montézuma', nameEn: 'Montezuma' },
  'e2687-monturedesesprits': { nameKo: '영령들의 탈것(아일랜드 요정들의 야간 질주) [Monture des esprits / Mounts of Spirits]', nameKoShort: '영령들의 탈것', nameFr: 'Monture des esprits', nameEn: 'Mounts of Spirits (Folk Belief in Fairies Riding Stolen Horses at Night, p.473 Plate)' },
  'e2688-mopsus': { nameKo: '몹소스(칼카스를 질투로 죽게 만든 그리스의 대예언가) [Mopsus / Mopsos]', nameKoShort: '몹소스', nameFr: 'Mopsus', nameEn: 'Mopsus (Ancient Greek Seer Who Defeated Calchas in a Divination Contest)' },
  'e2689-morail': { nameKo: '모라일(투명 마법을 부여하는 지옥의 악마) [Morail / Demon of Invisibility]', nameKoShort: '모라일', nameFr: 'Morail', nameEn: 'Morail (Demon in the Clavicles of Solomon Granting Invisibility)' },
  'e2690-morax': { nameKo: '모락스(마락스, 천문학과 약초를 가르치는 황소 악마) [Morax / Marax]', nameKoShort: '모락스', nameFr: 'Morax', nameEn: 'Morax (Marax / Great Earl and President of Hell Commanding 30 Legions)' },
  'e2691-mordad': { nameKo: '아모르다드(생명과 수목을 주관하는 페르시아의 천사) [Mordad / Ameretat]', nameKoShort: '아모르다드', nameFr: 'Mordad', nameEn: 'Ameretat (Mordad / Zoroastrian Amesha Spenta of Immortality and Plants)' },
  'e2692-moreau': { nameKo: '모로(나폴레옹의 몰락을 손금으로 예언한 19세기 수상가) [Moreau / Chiromancer]', nameKoShort: '모로', nameFr: 'Moreau', nameEn: 'Moreau (19th-Century Chiromancer Who Foretold Napoleon\'s Fall)' },
  'e2693-morellouise': { nameKo: '루이즈 모렐 [Louise Morel]', nameKoShort: '루이즈 모렐', nameFr: 'Morel (Louise)', nameEn: 'Louise Morel' },
  'e2694-morgane': { nameKo: '요정 모르간(아서왕의 누이이자 아발론의 대마녀) [Fée Morgane / Morgan le Fay]', nameKoShort: '요정 모르간', nameFr: 'Morgane', nameEn: 'Morgan le Fay (Fairy Sorceress Sister of King Arthur Taught by Merlin)' },
  'e2695-morinjeanbaptiste': { nameKo: '장밥티스트 모랭(리슐리외의 궁정 점성술사) [Jean-Baptiste Morin de Villefranche]', nameKoShort: '모랭 드 빌프랑슈', nameFr: 'Morin (Jean-Baptiste)', nameEn: 'Jean-Baptiste Morin (Astrologer and Physician to Cardinal Richelieu and Mazarin)' },
  'e2696-morinsimon': { nameKo: '시몽 모랭(자신을 성령이라 자처하다 화형된 17세기 광신자) [Simon Morin]', nameKoShort: '시몽 모랭', nameFr: 'Morin (Simon)', nameEn: 'Simon Morin (French Fanatic Burned Alive in 1663 for Claiming to Be the Incarnation of God)' },
  'e2697-mort': { nameKo: '죽음의 신(낫을 든 해골의 의인화와 죽음의 춤) [Mort / Grim Reaper and Dance of Death]', nameKoShort: '죽음의 신', nameFr: 'Mort', nameEn: 'Death (Grim Reaper, Danse Macabre, and the Fourth Horseman of the Apocalypse, p.474 Plate)' },
  'e2698-mortemart': { nameKo: '모르트마르 백작의 망령(죽은 아내의 영혼과 재회한 귀족) [Mortemart / Ghost of Countess]', nameKoShort: '모르트마르 백작', nameFr: 'Mortemart', nameEn: 'Lord of Mortemart (Noble Visited by the Ghost of His Beloved Wife)' },
  'e2699-mostmastite': { nameKo: '모스트마스티트 [Most-Mastite]', nameKoShort: '모스트마스티트', nameFr: 'Most-Mastite', nameEn: 'Most-Mastite' },
  'e2700-motelu': { nameKo: '모텔뤼(마녀 드니즈 드 라카유를 홀린 사역마 악마) [Motelu]', nameKoShort: '모텔뤼', nameFr: 'Motelu', nameEn: 'Motelu (Familiar Demon Named in the Witch Trial of Denise de Lacaille)' },
  'e2701-motogon': { nameKo: '모토곤(호주 원주민 신화의 창조자 영령) [Motogon / Australian Creator Spirit]', nameKoShort: '모토곤', nameFr: 'Motogon', nameEn: 'Motogon (Australian Aboriginal Creator Being Walking on Earth and Breathing Winds)' },
  'e2702-mouche': { nameKo: '파리와 나비(악마가 둔갑하는 곤충의 형상) [Mouche / Fly and Butterfly Demon Shapes]', nameKoShort: '파리와 나비', nameFr: 'Mouche', nameEn: 'Fly (Insect Forms Taken by Devils / The Fly Leaving the Mouth of Sorcerers)' },
  'e2703-moultthomasjoseph': { nameKo: '토마조제프 물트(예언 연감을 남긴 나폴리 점성술사) [Thomas-Joseph Moult]', nameKoShort: '토마조제프 물트', nameFr: 'Moult (Thomas-Joseph)', nameEn: 'Thomas-Joseph Moult (Neapolitan Astrologer Known for Popular Almanacs and Prophecies)' },
  'e2704-mouni': { nameKo: '무니(인도 민간 신앙의 숲속 고행 정령들) [Mouni / Muni Spirits]', nameKoShort: '무니', nameFr: 'Mouni', nameEn: 'Muni (Indian Ascetic Spirits Revering Old Trees and Guarding Fields)' },
  'e2705-mouton': { nameKo: '양의 형상을 한 악마(사바트의 검은 양과 마법사 오펠리) [Mouton / Ram-Shaped Demon]', nameKoShort: '양의 형상을 한 악마', nameFr: 'Mouton', nameEn: 'Sheep / Ram (Diabolical Shape of a Black Sheep at the Sabbat, p.481 Plate)' },
  'e2706-mouzouko': { nameKo: '무주코(모노모타파 왕국의 사악한 악마) [Mouzouko / Demon of Monomotapa]', nameKoShort: '무주코', nameFr: 'Mouzouko', nameEn: 'Mouzouko (Evil Demon in the Monomotapa Empire of Southern Africa)' },
  'e2707-mozart': { nameKo: '볼프강 아마데우스 모차르트(『레퀴엠』과 검은 옷의 사자) [Wolfgang Amadeus Mozart]', nameKoShort: '모차르트', nameFr: 'Mozart', nameEn: 'Wolfgang Amadeus Mozart (Singular Circumstances of the Requiem Commission, p.481 Plate)' },
  'e2708-mugetadessen': { nameKo: '뮈게타 데센(화형대에서 사탄을 저주한 로렌의 마녀) [Mugeta d\'Essen]', nameKoShort: '뮈게타 데센', nameFr: 'Mugeta d\'Essen', nameEn: 'Mugeta d\'Essen (Lorraine Witch Burned at the Stake Defying the Impure Spirit)' },
  'e2709-muhazimim': { nameKo: '무하지밈(문신과 마법진으로 구마하는 아프리카의 빙의자들) [Muhazimim]', nameKoShort: '무하지밈', nameFr: 'Muhazimim', nameEn: 'Muhazimim (African Term for Demoniacs Healed by Circles and Inscribed Characters)' },
  'e2710-mulet': { nameKo: '노새(요정 오데가 둔갑하는 짐승 형상) [Mulet / Mule Shape of Imp Odet]', nameKoShort: '노새', nameFr: 'Mulet', nameEn: 'Mule (Shape Assumed by the Mischievous French Brownie Odet)' },
  'e2711-mullerjean': { nameKo: '레기오몬타누스(기계 독수리와 철파리를 만든 천재 천문학자) [Johannes Müller / Regiomontanus]', nameKoShort: '레기오몬타누스', nameFr: 'Muller (Jean)', nameEn: 'Regiomontanus (Johannes Müller / Renowned Renaissance Astronomer and Clockwork Inventor)' },
  'e2712-mullin': { nameKo: '물랭(벨제뷔트의 수석 침실 시종 악마) [Mullin / First Valet of Beelzebub]', nameKoShort: '물랭', nameFr: 'Mullin', nameEn: 'Mullin (First Valet de Chambre of Beelzebub in the Infernal Court)' },
  'e2713-mummol': { nameKo: '뭄몰루스(이질에 걸린 왕자를 저주했다는 누명을 쓴 프랑크 장군) [Mummol / General Mummolus]', nameKoShort: '뭄몰루스 장군', nameFr: 'Mummol', nameEn: 'Patrician Mummolus (Frankish General Accused of Sorcery by Queen Fredegund in 578)' },
  'e2714-muncerthomas': { nameKo: '토마스 뮌처(성령의 계시를 주장한 재세례파 농민전쟁 지도자) [Thomas Müntzer / Thomas Muncer]', nameKoShort: '토마스 뮌처', nameFr: 'Muncer (Thomas)', nameEn: 'Thomas Müntzer (Radical Anabaptist Leader of the German Peasants\' War, p.482 Plate)' },
  'e2715-munnings': { nameKo: '머니스 노파(1694년 영국에서 마녀로 기소된 외눈의 노파) [Mother Munnings]', nameKoShort: '머니스 노파', nameFr: 'Munnings', nameEn: 'Mother Munnings (Elderly English Woman Tried for Witchcraft in 1694 and Acquitted)' },
  'e2716-munster': { nameKo: '뮌스터의 묵시록 참극(1534년 재세례파 광신 왕국) [Münster / Anabaptist Rebellion of Münster]', nameKoShort: '뮌스터의 참극', nameFr: 'Munster', nameEn: 'Münster Rebellion (1534 Fanatical Anabaptist Kingdom Preceded by Heavenly Omens)' },
  'e2717-murailledudiable': { nameKo: '악마의 성벽(하드리아누스 장벽의 전설) [Muraille du diable / Devil\'s Wall]', nameKoShort: '악마의 성벽', nameFr: 'Muraille du diable', nameEn: 'The Devil\'s Wall (Hadrian\'s Wall between England and Scotland in Popular Lore)' },
  'e2718-murmur': { nameKo: '무르무르(음악과 사령술의 지옥 대공 겸 백작) [Murmur / Great Duke of Hell]', nameKoShort: '무르무르', nameFr: 'Murmur', nameEn: 'Murmur (Great Duke and Earl of Hell Commanding 30 Legions / Demon of Music)' },
  'e2719-murzanti': { nameKo: '무르잔티(이탈리아 처녀를 빙의한 살해당한 영혼) [Murzanti / Wandering Soul of Poncini]', nameKoShort: '무르잔티', nameFr: 'Murzanti', nameEn: 'Murzanti (Spirit of a Murdered Man Possessing a Maiden in Poncini)' },
  'e2720-muschat': { nameKo: '머스챗의 케언(에든버러 솔즈베리 바위의 살인 묘비 돌무지) [Muschat\'s Cairn]', nameKoShort: '머스챗의 케언', nameFr: 'Muschat', nameEn: 'Muschat\'s Cairn (Haunted Stone Mound of a Murderer near Salisbury Crags)' },
  'e2721-musiqueceleste': { nameKo: '천구의 음악(피타고라스가 들었던 행성들의 천상 화음) [Musique céleste / Harmony of the Spheres]', nameKoShort: '천구의 음악', nameFr: 'Musique céleste', nameEn: 'Celestial Music (Pythagorean Harmony of the Spheres / Music of the Cosmos)' },
  'e2722-muspelheim': { nameKo: '무스펠헤임(화염 거인 수르트가 다스리는 태초의 불의 세계) [Muspelheim]', nameKoShort: '무스펠헤임', nameFr: 'Muspelheim', nameEn: 'Muspelheim (Norse Primordial Realm of Fire Ruled by Surtr the Black)' },
  'e2723-musucca': { nameKo: '무수카(사악한 질병과 죽음을 내리는 아프리카의 마귀) [Musucca]', nameKoShort: '무수카', nameFr: 'Musucca', nameEn: 'Musucca (Name for the Devil among African Tribes Causing Extreme Terror)' },
  'e2724-mutisme': { nameKo: '악령이 초래한 함구증(벙어리가 되는 악마 빙의) [Mutisme / Demonic Mutism]', nameKoShort: '악령의 함구증', nameFr: 'Mutisme', nameEn: 'Mutism (Demonic Loss of Speech in Possessed Persons Cured by Exorcism)' },
  'mycale': { nameKo: '미칼레(주문으로 보름달을 끌어내린 테살리아의 대마녀) [Mycale / Thessalian Sorceress]', nameKoShort: '미칼레', nameFr: 'Mycale', nameEn: 'Mycale (Thessalian Sorceress Who Drew Down the Moon, Plate 48)' },
  'e2726-myagorus': { nameKo: '미아그로스(제단에서 파리 떼를 쫓아내는 파리의 신) [Myagorus / Fly-Chasing Deity]', nameKoShort: '미아그로스', nameFr: 'Myagorus', nameEn: 'Myagorus (Fly-Chasing Deity Invoked during Pagan Sacrifices)' },
  'e2727-myoam': { nameKo: '미오암(바실리데스파 영지주의의 천상 수호령) [Myoam / Basilidian Aeon]', nameKoShort: '미오암', nameFr: 'Myoam', nameEn: 'Myoam (Gnostic Spiritual Entity Invoked by Basilidians)' },
  'e2728-myomancie': { nameKo: '쥐 점술(미오만시, 쥐들의 소리와 행동 점술) [Myomancie / Myomancy]', nameKoShort: '쥐 점술', nameFr: 'Myomancie', nameEn: 'Myomancy (Divination by the Cries, Movements, and Gnawing of Rats, p.484 Plate)' },
  'e2729-myricaeus': { nameKo: '미리카이우스(위성류 가지로 점을 치는 아폴론의 칭호) [Myricæus / Apollo Myricaeus]', nameKoShort: '미리카이우스', nameFr: 'Myricæus', nameEn: 'Myricaeus (Epithet of Apollo Presiding over Tamarix Wood Divination)' },
  'e2730-mysteres': { nameKo: '고대의 밀의들(80단계의 시련을 거치는 입문 제의) [Mystères / Ancient Mystery Rites]', nameKoShort: '고대의 밀의들', nameFr: 'Mystères', nameEn: 'Ancient Mysteries (Mithraic and Eleusinian Initiations Requiring 80 Trials)' },
  'e2731-mythologie': { nameKo: '신화학(이교도 신들과 지옥 악마들의 상응 고찰) [Mythologie / Pagan Gods as Demons]', nameKoShort: '신화학', nameFr: 'Mythologie', nameEn: 'Mythology (Benjamin Binet\'s Treatise on Pagan Deities as Masks of Demons)' },

  // N entries curated headwords (p.486-497)
  'e2732-nabam': { nameKo: '나밤(사바트의 장난 악마) [Nabam / Demon of the Sabbat]', nameKoShort: '나밤', nameFr: 'Nabam', nameEn: 'Nabam (Mischievous Demon of the Sabbat)' },
  'e2733-naberus': { nameKo: '나베리우스(세르베로스) [Nabérus / Naberius (Cerberus)]', nameKoShort: '나베리우스', nameFr: 'Nabérus', nameEn: 'Naberius (Cerberus / Valiant Marquis of Hell)' },
  'e2734-nabuchodonosor': { nameKo: '느부갓네살 2세(짐승으로 변한 바빌론 왕) [Nabuchodonosor / Nebuchadnezzar II]', nameKoShort: '느부갓네살 왕', nameFr: 'Nabuchodonosor', nameEn: 'Nebuchadnezzar II (Lycanthropy and Boanthropy in Daniel)' },
  'e2735-nachtmaneken': { nameKo: '나흐트마네켄(플랑드르의 밤의 난쟁이 요정) [Nachtmaneken]', nameKoShort: '나흐트마네켄', nameFr: 'Nachtmaneken', nameEn: 'Nachtmaneken (Flemish Night Goblin)' },
  'e2736-nachtvrouwtje': { nameKo: '나흐트브라우트예(플랑드르의 밤의 여인 요정) [Nachtvrouwtje]', nameKoShort: '나흐트브라우트예', nameFr: 'Nachtvrouwtje', nameEn: 'Nachtvrouwtje (Flemish Night Hag)' },
  'e2737-nagates': { nameKo: '나가테스(일본 신토의 우상과 수호신) [Nagates / Japanese Shrine Idols]', nameKoShort: '나가테스 우상', nameFr: 'Nagates', nameEn: 'Nagates (Japanese Folk Shrine Idols)' },
  'e2738-naglefare': { nameKo: '나글파르(망자의 손톱으로 만든 종말의 배) [Naglefare / Naglfar]', nameKoShort: '나글파르', nameFr: 'Naglefare', nameEn: 'Naglfar (Norse Ship of the Dead Made of Fingernails)' },
  'e2739-nagual': { nameKo: '나우알(메소아메리카 원주민의 수호 동물령) [Nagual / Nagualism]', nameKoShort: '나우알', nameFr: 'Nagual', nameEn: 'Nagual (Mesoamerican Guardian Animal Spirit and Shapeshifter)' },
  'e2740-naguillecatherine': { nameKo: '카트린 나기유 [Naguille (Catherine)]', nameKoShort: '카트린 나기유', nameFr: 'Naguille (Catherine)', nameEn: 'Catherine Naguille (Basque Witch Trial of Pierre de Lancre)' },
  'e2741-naguillemarie': { nameKo: '마리 나기유 [Naguille (Marie)]', nameKoShort: '마리 나기유', nameFr: 'Naguille (Marie)', nameEn: 'Marie Naguille (Sister of Catherine in Basque Trials)' },
  'e2742-nahama': { nameKo: '나아마(음란과 악마들의 어머니) [Nahama / Naamah]', nameKoShort: '나아마', nameFr: 'Nahama', nameEn: 'Naamah (Mother of Demons in Zoharic Kabbalah)' },
  'e2743-nainlaurinoulelfroi': { nameKo: '난쟁이 라우린 왕(장미원의 엘프 국왕) [Nain-Laurin ou l’Elf-roi / King Laurin]', nameKoShort: '난쟁이 라우린 왕', nameFr: 'Nain-Laurin ou l’Elf-roi', nameEn: 'King Laurin (Laurin the Dwarf King of the Rose Garden)' },
  'e2744-nains': { nameKo: '드워프와 난쟁이 요정들 [Nains / Dwarfs (Elves and Gnomes)]', nameKoShort: '드워프(난쟁이 요정)', nameFr: 'Nains', nameEn: 'Dwarfs (Mythological Craftsmen of the Earth)' },
  'e2745-nairancie': { nameKo: '네란시(태양 광선 점술) [Nairancie / Heliomancy]', nameKoShort: '네란시(태양광선점)', nameFr: 'Nairancie', nameEn: 'Nairancie (Divination by Solar Rays)' },
  'e2746-nakaronkir': { nameKo: '나카론키르(마다가스카르의 숲의 식인 요정) [Nakaronkir]', nameKoShort: '나카론키르', nameFr: 'Nakaronkir', nameEn: 'Nakaronkir (Madagascan Forest Ogre Spirit)' },
  'e2747-nambroth': { nameKo: '남브로트(마도서의 소환 악마) [Nambroth / Grimoire Demon]', nameKoShort: '남브로트', nameFr: 'Nambroth', nameEn: 'Nambroth (Demon Invoked in Grimoires)' },
  'e2748-nan': { nameKo: '난(라플란드 사미족의 쇠파리 요정) [Nan / Lappish Fly Goblins]', nameKoShort: '난 요정', nameFr: 'Nan', nameEn: 'Nan (Lappish Fairy Spirits Disguised as Flies)' },
  'e2749-napierbarbara': { nameKo: '바바라 네이피어(노스베릭 마녀재판의 스코틀랜드 여인) [Napier (Barbara)]', nameKoShort: '바바라 네이피어', nameFr: 'Napier (Barbara)', nameEn: 'Barbara Napier (North Berwick Witch Trials 1591)' },
  'e2750-napoleonier': { nameKo: '나폴레옹 1세(붉은 인간과 운명의 수호령) [Napoléon Ier / Napoleon I (Part 1)]', nameKoShort: '나폴레옹 1세(제1부)', nameFr: 'Napoléon Ier', nameEn: 'Napoleon I (The Red Man of Destiny - Part 1)' },
  'e2751-narac': { nameKo: '나라카(인도 힌두교의 뱀과 불의 지옥) [Narac / Naraka]', nameKoShort: '나라카 지옥', nameFr: 'Narac', nameEn: 'Naraka (Hindu Underworld of Torments)' },
  'e2752-nastrande': { nameKo: '나스트론드(북유럽 신화의 시체 해안 지옥) [Nastrande / Náströnd]', nameKoShort: '나스트론드', nameFr: 'Nastrande', nameEn: 'Náströnd (Norse Shore of Corpses in Helheim)' },
  'e2753-nathandegaza': { nameKo: '가자의 나탄(사바타이 제비의 거짓 예언자) [Nathan de Gaza]', nameKoShort: '가자의 나탄', nameFr: 'Nathan de Gaza', nameEn: 'Nathan of Gaza (Prophet of Sabbatai Zevi)' },
  'e2754-napoleonier': { nameKo: '나폴레옹 1세(튈르리 궁전의 붉은 인간) [Napoléon Ier / Napoleon I (Part 2, Illustrated)]', nameKoShort: '나폴레옹 1세(제2부·도판)', nameFr: 'Napoléon Ier', nameEn: 'Napoleon I (The Red Man of the Tuileries - Part 2, Illustrated)' },
  'e2755-natonaberthe': { nameKo: '베르타 나토나(제노바의 세 악마 빙의 여인) [Natona (Berthe)]', nameKoShort: '베르타 나토나', nameFr: 'Natona (Berthe)', nameEn: 'Bertha Natona (Genoese Possessed by Three Demons 1217)' },
  'e2756-natureletsurnaturel': { nameKo: '자연적인 것과 초자연적인 것 [Naturel et Surnaturel / Natural vs. Supernatural]', nameKoShort: '자연과 초자연의 분별', nameFr: 'Naturel et Surnaturel', nameEn: 'Natural and Supernatural (Discerning False Marvels)' },
  'e2757-naudegabriel': { nameKo: '가브리엘 노데(『위대한 인물들의 마법 혐의 변명』) [Naudé (Gabriel)]', nameKoShort: '가브리엘 노데', nameFr: 'Naudé (Gabriel)', nameEn: 'Gabriel Naudé (Apology for Great Men Falsely Accused of Magic)' },
  'e2758-naurausepierresde': { nameKo: '노루즈의 마법 바위들 [Naurause (Pierres de)]', nameKoShort: '노루즈의 바위들', nameFr: 'Naurause (Pierres de)', nameEn: 'Stones of Naurouze (Megalithic Legends of Languedoc)' },
  'e2759-naviusaccius': { nameKo: '앗키우스 나비우스(칼로 숫돌을 벤 로마 복술관) [Navius (Accius)]', nameKoShort: '앗키우스 나비우스', nameFr: 'Navius (Accius)', nameEn: 'Accius Navius (Roman Augur Who Cut Whetstone with Razor)' },
  'e2760-naylorjames': { nameKo: '제임스 네일러(자칭 재림 예수 퀘이커 광신자) [Naylor (James)]', nameKoShort: '제임스 네일러', nameFr: 'Naylor (James)', nameEn: 'James Nayler (Quaker Leader Who Claimed to Be Christ)' },
  'e2761-naxac': { nameKo: '낙삭(페르시아의 악마 바위) [Naxac / Demon Rock of Persia]', nameKoShort: '낙삭', nameFr: 'Naxac', nameEn: 'Naxac (Persian Mountain of Evil Spirits)' },
  'e2762-nebiros': { nameKo: '네비로스(지옥의 육군 원수 겸 감찰장관) [Nébiros / Field Marshal of Hell]', nameKoShort: '네비로스', nameFr: 'Nébiros', nameEn: 'Nebiros (Naberius / Field Marshal and Inspector General)' },
  'e2763-necato': { nameKo: '네카토(사바트의 살육 악마) [Nécato / Demon of the Sabbat]', nameKoShort: '네카토', nameFr: 'Nécato', nameEn: 'Necato (Sabbat Demon of Slaughter)' },
  'e2764-necromancie': { nameKo: '강령술(네크로만시 / 망령 소환술) [Nécromancie / Necromancy]', nameKoShort: '강령술(사령 마술)', nameFr: 'Nécromancie', nameEn: 'Necromancy (Divination by Evoking the Dead)' },
  'e2765-neffesoliens': { nameKo: '네페솔리아인(바람을 먹고 사는 상상 속의 종족) [Neffesoliens]', nameKoShort: '네페솔리아인', nameFr: 'Neffesoliens', nameEn: 'Neffesoliens (Imaginary Wind-Eating Race in Rabelais)' },
  'e2766-nega': { nameKo: '네가(부정의 영) [Néga]', nameKoShort: '네가', nameFr: 'Néga', nameEn: 'Nega (Crossref to Négation)' },
  'e2767-negation': { nameKo: '부정주의(메피스토펠레스의 ‘영원히 부정하는 영’) [Négation / The Spirit of Negation]', nameKoShort: '부정주의', nameFr: 'Négation', nameEn: 'Negation (The Spirit that Denies in Goethe\'s Faust)' },
  'e2768-negres': { nameKo: '흑인에 관한 고대 유럽의 편견과 악마화 [Nègres / Racial Superstitions]', nameKoShort: '흑인 악마화 편견', nameFr: 'Nègres', nameEn: 'Prejudices and Demonic Associations of Black Skin' },
  'e2769-nekir': { nameKo: '나키르와 뭉카르(이슬람 묘지의 무덤 심문 천사) [Nékir / Nakir and Munkar]', nameKoShort: '나키르와 뭉카르', nameFr: 'Nékir', nameEn: 'Nakir and Munkar (Islamic Angels of Grave Interrogation)' },
  'e2770-nembroth': { nameKo: '넴브로트 [Nembroth]', nameKoShort: '넴브로트', nameFr: 'Nembroth', nameEn: 'Nembroth (Crossref to Nemrod)' },
  'e2771-nemrod': { nameKo: '니므롯(하느님을 대적한 사냥꾼이자 바벨탑의 거인 왕) [Nemrod / Nimrod]', nameKoShort: '니므롯 왕', nameFr: 'Nemrod', nameEn: 'Nimrod (Mighty Hunter and Builder of Tower of Babel)' },
  'e2772-nenufar': { nameKo: '수련(욕망을 잠재우는 순결의 꽃) [Nénufar / Water Lily]', nameKoShort: '수련 미신', nameFr: 'Nénufar', nameEn: 'Water Lily (Anaphrodisiac Herb of Chastity)' },
  'e2773-nephelim': { nameKo: '네필림(타락천사와 인간 딸들의 거인 후예) [Néphélim / Nephilim]', nameKoShort: '네필림 거인족', nameFr: 'Néphélim', nameEn: 'Nephilim (Giants Born of the Sons of God and Daughters of Men)' },
  'e2774-nequam': { nameKo: '알렉산더 네캄(12세기 영국의 대학자이자 마법사 전설) [Nequam / Alexander Neckam]', nameKoShort: '알렉산더 네캄', nameFr: 'Nequam', nameEn: 'Alexander Neckam (English Scholar Fabled as Magician)' },
  'e2775-nerounere': { nameKo: '네르(캄차카 원주민의 태양신) [Ner ou Néré / Sun God of Kamchatka]', nameKoShort: '네르 태양신', nameFr: 'Ner ou Néré', nameEn: 'Ner or Nere (Kamchatka Solar Deity)' },
  'e2776-nergal': { nameKo: '네르갈(바빌로니아 지하세계의 죽음의 마신) [Nergal / Babylonian Underworld Lord]', nameKoShort: '네르갈', nameFr: 'Nergal', nameEn: 'Nergal (Lord of the Underworld and Secret Police Chief of Hell)' },
  'e2777-neron': { nameKo: '네로 황제(적그리스도의 원형과 로마 방화) [Néron / Emperor Nero (Antichrist)]', nameKoShort: '네로 황제', nameFr: 'Néron', nameEn: 'Nero (Emperor Nero and the Antichrist Beast 666)' },
  'e2778-netla': { nameKo: '네틀라 [Netla]', nameKoShort: '네틀라', nameFr: 'Netla', nameEn: 'Netla' },
  'e2779-netos': { nameKo: '네토스(몰루카 제도의 악령들) [Netos]', nameKoShort: '네토스', nameFr: 'Netos', nameEn: 'Netos (Evil Spirits of the Moluccas)' },
  'e2780-neuf': { nameKo: '숫자 9(완성과 신비의 수) [Neuf / Number Nine]', nameKoShort: '숫자 9', nameFr: 'Neuf', nameEn: 'Number Nine (Mystical and Sacred Nine)' },
  'e2781-neuhausfemmeblanchede': { nameKo: '노이하우스의 백의 부인 [Neuhaus (Femme blanche de)]', nameKoShort: '노이하우스의 백의 부인', nameFr: 'Neuhaus (Femme blanche de)', nameEn: 'White Lady of Neuhaus (Rosenberg Family Ghost)' },
  'e2782-neures': { nameKo: '네우로이족(늑대인간 변신 부족) [Neures / Neuri]', nameKoShort: '네우로이족', nameFr: 'Neures', nameEn: 'Neuri (Werewolf Tribe of European Sarmatia)' },
  'e2783-newhaven': { nameKo: '뉴헤이븐의 요정의 배(하늘을 나는 유령선) [New-Haven (Barque de la fée de)]', nameKoShort: '뉴헤이븐의 요정의 배', nameFr: 'New-Haven', nameEn: 'Phantom Ship of New Haven (Ghost Ship in the Sky)' },
  'e2784-niais': { nameKo: '부정하는 자(어리석은 자) [Niais / Simpleton]', nameKoShort: '부정하는 자', nameFr: 'Niais', nameEn: 'Niais (The Skeptic / Simpleton)' },
  'e2785-nibrianes': { nameKo: '니브리아네(나폴리의 가택 요정들) [Nibrianes]', nameKoShort: '니브리아네', nameFr: 'Nibrianes', nameEn: 'Nibrianes (House Fairies of Naples)' },
  'nickar': { nameKo: '니카르(보덴의 닉, 익사의 수룡 악마) [Nickar / Neck / Nix]', nameKoShort: '니카르', nameFr: 'Nickar (Neck, Nix)', nameEn: 'Nickar (Neck / Hnickar / Demon of Drowning)' },
  'e2787-nicksa': { nameKo: '닉사 [Nicksa]', nameKoShort: '닉사', nameFr: 'Nicksa', nameEn: 'Nicksa' },
  'e2788-nicolai': { nameKo: '니콜라이 [Nicolaï]', nameKoShort: '니콜라이', nameFr: 'Nicolaï', nameEn: 'Nicolaï (Christoph Friedrich Nicolai)' },
  'e2789-nid': { nameKo: '니드(아이슬란드의 저주 주술가) [Nid / Níð]', nameKoShort: '니드', nameFr: 'Nid', nameEn: 'Nid (Icelandic Curse Magic / Níð)' },
  'e2790-niderjean': { nameKo: '요하네스 니더(도미니코회 신학자) [Jean Nider / Johannes Nider]', nameKoShort: '요하네스 니더', nameFr: 'Nider (Jean)', nameEn: 'Johannes Nider (Dominican Author of Formicarium)' },
  'e2791-niflheimabime': { nameKo: '니플헤임(안개의 심연, 북유럽의 원초 지옥) [Niflheim / Abîme de glace]', nameKoShort: '니플헤임', nameFr: 'Niflheim (Abîme)', nameEn: 'Niflheim (Abyss of Fog and Frost in Norse Myth)' },
  'e2792-nigromancie': { nameKo: '흑암점술(니그로만시) [Nigromancie / Black Magic Divination]', nameKoShort: '흑암점술', nameFr: 'Nigromancie', nameEn: 'Nigromancy (Divination in Dark Places)' },
  'e2793-ninondelenclos': { nameKo: '니농 드 랑클로(젊음을 유지한 살롱의 여걸) [Ninon de Lenclos]', nameKoShort: '니농 드 랑클로', nameFr: 'Ninon de Lenclos', nameEn: 'Ninon de Lenclos (Courtesan and the Devil\'s Youth Pact)' },
  'e2794-nirudy': { nameKo: '니루디(니르리티, 인도의 나찰왕) [Nirudy / Nirriti]', nameKoShort: '니루디', nameFr: 'Nirudy', nameEn: 'Nirriti (Nirudy / King of Evil Demons in Hindu Myth)' },
  'e2795-nis': { nameKo: '니스(덴마크의 가택 요정) [Nis / Nisgodreng]', nameKoShort: '니스', nameFr: 'Nis', nameEn: 'Nis (Danish House Brownie / Nisse)' },
  'e2796-nisses': { nameKo: '니시(스코틀랜드의 소인 요정들) [Nisses]', nameKoShort: '니시', nameFr: 'Nisses', nameEn: 'Nisses (Small Scottish Fairies)' },
  'e2797-nitoes': { nameKo: '니토(몰루카 제도의 신탁 악령) [Nitoës]', nameKoShort: '니토', nameFr: 'Nitoës', nameEn: 'Nitoës (Oracle Spirits of the Moluccas)' },
  'e2798-nixas': { nameKo: '닉사스(발트해의 바다와 강의 신) [Nixas / Nicksa]', nameKoShort: '닉사스', nameFr: 'Nixas', nameEn: 'Nixas (Nicksa / Baltic River and Ocean Deity)' },
  'e2799-noalsjeanne': { nameKo: '잔 노알(방앗간에 마법을 건 마녀) [Jeanne Noals]', nameKoShort: '잔 노알', nameFr: 'Noals (Jeanne)', nameEn: 'Jeanne Noals (Witch Burned at Bordeaux in 1619)' },
  'e2800-nodiercharles': { nameKo: '샤를 노디에(환상 문학의 선구자) [Charles Nodier]', nameKoShort: '샤를 노디에', nameFr: 'Nodier (Charles)', nameEn: 'Charles Nodier (Author of Trilby and Gothic Romances)' },
  'e2801-noe': { nameKo: '노아(대홍수의 의로운 족장) [Noé / Noah]', nameKoShort: '노아', nameFr: 'Noé', nameEn: 'Noah (Patriarch of the Ark in Occult Legends)' },
  'e2802-noeljacques': { nameKo: '자크 노엘(파리의 유령 망상 환자) [Jacques Noël]', nameKoShort: '자크 노엘', nameFr: 'Noël (Jacques)', nameEn: 'Jacques Noël (Parisian Visionary of 1667)' },
  'e2803-noh': { nameKo: '노(호텐토트족의 시조 인류) [Noh]', nameKoShort: '노', nameFr: 'Noh', nameEn: 'Noh (First Man of the Hottentots)' },
  'e2804-noix': { nameKo: '호두(탈모 방지와 민간 주술) [Noix / Walnut]', nameKoShort: '호두', nameFr: 'Noix', nameEn: 'Walnut (Folklore Secret against Hair Loss)' },
  'e2805-nomancie': { nameKo: '성명점술(노만시) [Nomancie / Onomancy]', nameKoShort: '성명점술', nameFr: 'Nomancie', nameEn: 'Nomancy (Divination by Names / Onomancy)' },
  'e2806-nombredeux': { nameKo: '숫자 2(분열과 불길함의 상징) [Nombre deux / Number Two]', nameKoShort: '숫자 2', nameFr: 'Nombre deux', nameEn: 'Number Two (Ill-Omened Binary Principle)' },
  'e2807-nonos': { nameKo: '노노스(필리핀 제도의 수변 악령들) [Nonos]', nameKoShort: '노노스', nameFr: 'Nonos', nameEn: 'Nonos (Aquatic Evil Spirits of the Philippines)' },
  'e2808-nornes': { nameKo: '노른(북유럽 운명의 세 여신) [Nornes / Norns]', nameKoShort: '노른', nameFr: 'Nornes', nameEn: 'Norns (Norse Fates of Urd, Verdandi, and Skuld)' },
  'e2809-norsgubb': { nameKo: '노르스굽(북방의 늙은이, 스웨덴의 악마) [Nors-Gubb / Old Man of the North]', nameKoShort: '노르스굽', nameFr: 'Nors-Gubb', nameEn: 'Nors-Gubb (Old Man of the North / Swedish Devil)' },
  'e2810-nostradamusmichel': { nameKo: '미셸 드 노스트라다무스(점성술사이자 대예언가) [Michel Nostradamus]', nameKoShort: '노스트라다무스', nameFr: 'Nostradamus (Michel)', nameEn: 'Michel Nostradamus (Physician, Astrologer, and Prophet)' },
  'e2811-notarique': { nameKo: '노타리콘(카발라 머리글자 약어 해석법) [Notarique / Notarikon]', nameKoShort: '노타리콘', nameFr: 'Notarique', nameEn: 'Notarikon (Cabbalistic Acronym and Initial Mysticism)' },
  'e2812-noyes': { nameKo: '익사자(출항 선박의 불길한 징조) [Noyés / Drowned Men]', nameKoShort: '익사자', nameFr: 'Noyés', nameEn: 'Drowned Men (Nautical Omen on Sailing Ships)' },
  'e2813-nuitdestrepasses': { nameKo: '위령의 밤(11월 1일 망자의 밤) [Nuit des trépassés / All Souls\' Night]', nameKoShort: '위령의 밤', nameFr: 'Nuit des trépassés', nameEn: 'All Souls\' Night (Flemish Legend of the Walking Dead)' },
  'e2814-numapompilius': { nameKo: '누마 폼필리우스(로마의 제2대 현왕) [Numa Pompilius]', nameKoShort: '누마 폼필리우스', nameFr: 'Numa Pompilius', nameEn: 'Numa Pompilius (Second King of Rome and Nymph Egeria)' },
  'e2815-nursie': { nameKo: '누르시아(시빌라의 동굴과 마녀들의 마을) [Nursie / Norcia]', nameKoShort: '누르시아', nameFr: 'Nursie', nameEn: 'Norcia (Cave of the Sibyl and Witches\' Mountain)' },
  'nybbas': { nameKo: '니바스(지옥 궁정의 대어릿광대, 환각과 꿈의 관리자) [Nybbas / Grand Paradiste of Hell]', nameKoShort: '니바스', nameFr: 'Nybbas', nameEn: 'Nybbas (Grand Paradiste of Hell / Master of Visions and Dreams)' },
  'e2817-nymphes': { nameKo: '님프(자연의 아름다운 여성 정령들) [Nymphes / Nymphs]', nameKoShort: '님프', nameFr: 'Nymphes', nameEn: 'Nymphs (Nature Spirits in Classical and Demonological Lore)' },
  'e2818-nymphedelelbe': { nameKo: '엘베강의 님프(로렐라이와 물의 요정) [Nymphe de l\'Elbe / Siren of the Elbe]', nameKoShort: '엘베강의 님프', nameFr: 'Nymphe de l\'Elbe', nameEn: 'Nymph of the Elbe (River Siren Combing Hair)' },
  'e2819-nynauldjeande': { nameKo: '장 드 니노(늑대인간 연구 의사) [Jean de Nynauld]', nameKoShort: '장 드 니노', nameFr: 'Nynauld (Jean de)', nameEn: 'Jean de Nynauld (Physician and Author on Lycanthropy)' },
  'e2820-nyol': { nameKo: '니올(브로스 자작, 마법 혐의 귀족) [Nyol / Vicomte de Brosse]', nameKoShort: '니올', nameFr: 'Nyol', nameEn: 'Nyol (Vicomte de Brosse / Accused Noble of Sorcery)' },
  'e2821-nyphoounyphusaugustin': { nameKo: '아고스티노 니포(사역마를 부린 철학자) [Agostino Nifo / Augustinus Niphus]', nameKoShort: '아고스티노 니포', nameFr: 'Nypho ou Nyphus (Augustin)', nameEn: 'Agostino Nifo (Italian Philosopher and Astrologer)' },
  'e2822-nysrock': { nameKo: '니스록(벨제뷔트의 총괄 주방장, 미식의 유혹자 악마) [Nysrock / Nisroch]', nameKoShort: '니스록', nameFr: 'Nysrock', nameEn: 'Nysrock (Nisroch / Chief Cook of Beelzebub / Lord of Delicacies)' },

  // O entries curated headwords (p.497-512)
  'e2823-oannesouoes': { nameKo: '오안네스(오에스 / 바빌로니아 반인반어 현자) [Oannès ou Oès / Oannes]', nameKoShort: '오안네스', nameFr: 'Oannès ou Oès', nameEn: 'Oannes (Babylonian Fish-Man Sage)' },
  'e2824-ob': { nameKo: '오브(시리아의 복화술 악마) [Ob / Ventriloquist Demon]', nameKoShort: '오브', nameFr: 'Ob', nameEn: 'Ob (Syrian Demon of Ventriloquism and Divination)' },
  'e2825-obereitjacqueshermann': { nameKo: '야코프 헤르만 오베라이트 [Obereit (Jacques Hermann)]', nameKoShort: '야코프 오베라이트', nameFr: 'Obereit (Jacques Hermann)', nameEn: 'Jakob Hermann Obereit (Swiss Alchemist and Mystic)' },
  'e2826-obergemeiner': { nameKo: '오버게마이너(그라츠 근교의 악령 들린 집) [Obergemeiner / Haunted House of Graz]', nameKoShort: '오버게마이너 저택', nameFr: 'Obergemeiner', nameEn: 'Obergemeiner\'s Haunted House near Graz' },
  'e2827-oberon': { nameKo: '오베론(요정의 제왕) [Obéron / Oberon (King of Shadows)]', nameKoShort: '오베론', nameFr: 'Obéron', nameEn: 'Oberon (King of the Fairies)' },
  'e2828-obesslik': { nameKo: '오베슬리크(후스파 전쟁의 도적과 유령) [Obesslik]', nameKoShort: '오베슬리크', nameFr: 'Obesslik', nameEn: 'Obesslik (Hussite Brigand and Ghost)' },
  'e2829-obole': { nameKo: '오볼(카론의 뱃삯 노자돈) [Obole / Charon\'s Obol]', nameKoShort: '카론의 오볼', nameFr: 'Obole', nameEn: 'Charon\'s Obol (Coin for the Underworld Ferryman)' },
  'e2830-obsedes': { nameKo: '강박 빙의자들 [Obsédés / The Obsessed (External Demonic Harassment)]', nameKoShort: '강박 빙의자들', nameFr: 'Obsédés', nameEn: 'The Obsessed (Distinction between Possession and Obsession)' },
  'e2831-obsequensjulius': { nameKo: '율리우스 옵세퀜스(『이적의 서』) [Obsequens (Julius) / Julius Obsequens]', nameKoShort: '율리우스 옵세퀜스', nameFr: 'Obsequens (Julius)', nameEn: 'Julius Obsequens (Author of the Book of Prodigies)' },
  'e2832-occultes': { nameKo: '오컬트 학문(신비학의 체계) [Occultes / Occult Sciences]', nameKoShort: '오컬트 학문', nameFr: 'Occultes', nameEn: 'Occult Sciences (Magic, Alchemy, Kabbalah, Divination)' },
  'e2833-ochosias': { nameKo: '아하시야(바알세붑에게 점을 친 북이스라엘 왕) [Ochosias / Ahaziah of Israel]', nameKoShort: '아하시야 왕', nameFr: 'Ochosias', nameEn: 'Ahaziah of Israel (Consulting Baal-Zebub)' },
  'e2834-oculomancie': { nameKo: '안점술(눈점) [Oculomancie / Oculomancy]', nameKoShort: '안점술(눈점)', nameFr: 'Oculomancie', nameEn: 'Oculomancy (Divination by Eye Inspection)' },
  'e2835-oddo': { nameKo: '오도 [Oddo]', nameKoShort: '오도', nameFr: 'Oddo', nameEn: 'Oddo (Crossref to Kalta)' },
  'e2836-oddon': { nameKo: '오돈(바람을 조종한 플랑드르 해적) [Oddon / Oddon the Pirate]', nameKoShort: '오돈', nameFr: 'Oddon', nameEn: 'Oddon (Flemish Sorcerer-Pirate)' },
  'e2837-odesprit': { nameKo: '오드 영기(라이헨바흐의 오드력과 심령술) [Od-esprit / Odic Force Spirit]', nameKoShort: '오드 영기', nameFr: 'Od-esprit', nameEn: 'Od-Spirit (Reichenbach\'s Odic Force in Spiritualism)' },
  'e2838-odet': { nameKo: '오데(오를레앙의 기마 야마령) [Odet / Night Demon of Orléans]', nameKoShort: '오데', nameFr: 'Odet', nameEn: 'Odet (Horse-Shaped Night Demon of Orléans)' },
  'e2839-odeur': { nameKo: '악마의 유황 악취와 성인의 천상 향기 [Odeur / Odor of Devils and Sanctity]', nameKoShort: '악마의 악취와 성인의 향기', nameFr: 'Odeur', nameEn: 'Odor of Sanctity vs. Demonic Stench of Sulfur' },
  'e2840-odin': { nameKo: '오딘(북유럽 신화의 최고신이자 룬 마법의 주신) [Odin / Woden]', nameKoShort: '오딘', nameFr: 'Odin', nameEn: 'Odin (Allfather and Master of Runic Sorcery)' },
  'e2841-odontotyrannus': { nameKo: '오돈토티란누스(갠지스강의 괴수) [Odontotyrannus]', nameKoShort: '오돈토티란누스', nameFr: 'Odontotyrannus', nameEn: 'Odontotyrannus (Crossref to Serpent de mer)' },
  'e2842-odorat': { nameKo: '후각의 예민함과 악마의 감각 [Odorat / Sense of Smell]', nameKoShort: '후각과 악마학', nameFr: 'Odorat', nameEn: 'Sense of Smell in Demonology (Cardano)' },
  'e2843-odet': { nameKo: '오데(사바트의 마법 악마) [Odet / Demon of the Sabbat]', nameKoShort: '오데', nameFr: 'Odet', nameEn: 'Odet (Illustrated Sabbat Demon)' },
  'e2844-oeil': { nameKo: '사안(사시와 이블 아이) [Œil / The Evil Eye]', nameKoShort: '사안(이블 아이)', nameFr: 'Œil', nameEn: 'The Evil Eye (Gorgons and Malocchio)' },
  'e2845-oenomancie': { nameKo: '주점술(포도주점) [Œnomancie / Oenomancy]', nameKoShort: '주점술(포도주점)', nameFr: 'Œnomancie', nameEn: 'Oenomancy (Divination by Wine)' },
  'e2846-oenothere': { nameKo: '에노테르(샤를마뉴 군대의 거인 장수) [Œnothère / Oenothere]', nameKoShort: '에노테르', nameFr: 'Œnothère', nameEn: 'Oenothere (Giant Warrior of Charlemagne)' },
  'e2847-oeonistice': { nameKo: '조점술(오이오니스티케) [Œonistice / Oenistics]', nameKoShort: '조점술', nameFr: 'Œonistice', nameEn: 'Oenistics (Crossref to Augures)' },
  'e2848-oes': { nameKo: '오에스 [Oès]', nameKoShort: '오에스', nameFr: 'Oès', nameEn: 'Oes (Crossref to Oannès)' },
  'e2849-oeufs': { nameKo: '달걀 껍데기 깨기와 마녀 주술 [Œufs / Egg Shells and Witchcraft]', nameKoShort: '달걀 껍데기 미신', nameFr: 'Œufs', nameEn: 'Breaking Egg Shells against Witches' },
  'e2850-og': { nameKo: '옥(바산의 거인 왕) [Og / King of Bashan]', nameKoShort: '바산 왕 옥', nameFr: 'Og', nameEn: 'Og of Bashan (Giant King in Rabbinic Lore)' },
  'e2851-ogierledanois': { nameKo: '오지에 르 다누아(잠든 덴마크의 거인 기사) [Ogier le Danois / Holger Danske]', nameKoShort: '오지에 르 다누아', nameFr: 'Ogier le Danois', nameEn: 'Ogier the Dane (Holger Danske / Sleeping Hero)' },
  'e2852-ogres': { nameKo: '오거(식인 거인과 괴수) [Ogres / Man-Eating Giants]', nameKoShort: '오거(식인 거인)', nameFr: 'Ogres', nameEn: 'Ogres (Flesh-Devouring Giants in Folklore)' },
  'e2853-oiarou': { nameKo: '와아루(이로쿼이 인디언의 수호물 숭배) [Oiarou]', nameKoShort: '와아루', nameFr: 'Oiarou', nameEn: 'Oiarou (Iroquois Protective Fetish)' },
  'e2854-oigours': { nameKo: '위구르인과 오거의 어원 [Oigours]', nameKoShort: '위구르인', nameFr: 'Oigours', nameEn: 'Oigours (Crossref to Ogres)' },
  'e2855-oilette': { nameKo: '왈레트(사바트의 하급 악마) [Oilette / Demon of the Sabbat]', nameKoShort: '왈레트', nameFr: 'Oilette', nameEn: 'Oilette (Demon of the Sabbat)' },
  'e2856-oiseaux': { nameKo: '새의 지저귐을 해독한 대주교 로랑 [Oiseaux / Language of Birds]', nameKoShort: '새점과 조류 언어', nameFr: 'Oiseaux', nameEn: 'Language of Birds and Archbishop Laurent' },
  'e2857-okkisiks': { nameKo: '오키식스(휴런족의 사계절 정령) [Okkisiks]', nameKoShort: '오키식스', nameFr: 'Okkisiks', nameEn: 'Okkisiks (Huron Spirits of Seasons and Skies)' },
  'e2858-oldenberg': { nameKo: '올덴베르크산(샤를마뉴 대제가 잠든 산) [Oldenberg / Mount Oldenberg]', nameKoShort: '올덴베르크산', nameFr: 'Oldenberg', nameEn: 'Mount Oldenberg (Sleeping Charlemagne Legend)' },
  'e2859-oldenbourg': { nameKo: '올덴부르크의 요정 뿔잔 [Oldenbourg / Horn of Oldenburg]', nameKoShort: '올덴부르크의 요정 뿔잔', nameFr: 'Oldenbourg', nameEn: 'The Fairy Horn of Oldenburg (Graf Otto Legend)' },
  'e2860-oldgentleman': { nameKo: '올드 젠틀맨(노신사 / 영국의 악마 완곡어) [Old Gentleman / The Devil]', nameKoShort: '올드 젠틀맨(노신사)', nameFr: 'Old Gentleman', nameEn: 'Old Gentleman (English Euphemism for the Devil)' },
  'e2861-oliverobert': { nameKo: '로베르 올리브(팔레즈의 마법사) [Olive (Robert)]', nameKoShort: '로베르 올리브', nameFr: 'Olive (Robert)', nameEn: 'Robert Olive (Sorcerer Burned at Falaise 1556)' },
  'e2862-olivier': { nameKo: '올리비에(사바트 대천사령 악마) [Olivier / Demon of the Sabbat]', nameKoShort: '올리비에', nameFr: 'Olivier', nameEn: 'Olivier (Demon Prince of Archangels)' },
  'e2863-ololygmancie': { nameKo: '견명점(올롤리그만시 / 개의 울음소리 점술) [Ololygmancie / Ololygmancy]', nameKoShort: '견명점(개 울음점)', nameFr: 'Ololygmancie', nameEn: 'Ololygmancy (Divination by Howling of Dogs)' },
  'e2864-olys': { nameKo: '올리스(마다가스카르의 악어 방지 탈리스만) [Olys / Crocodile Amulet]', nameKoShort: '올리스 부적', nameFr: 'Olys', nameEn: 'Olys (Madagascan Anti-Crocodile Talisman)' },
  'e2865-ombre': { nameKo: '그림자 상실 미신과 망령 [Ombre / Lost Shadow Superstition]', nameKoShort: '그림자 미신', nameFr: 'Ombre', nameEn: 'Shadows (Soul\'s Double and Lost Shadow Lore)' },
  'e2866-ombriel': { nameKo: '옴브리엘(우울과 비탄의 흑암 정령) [Ombriel / Spirit of Melancholy]', nameKoShort: '옴브리엘', nameFr: 'Ombriel', nameEn: 'Ombriel (Gnome of Spleen in Pope\'s Rape of the Lock)' },
  'e2867-omestes': { nameKo: '디오니소스 오메스테스(날고기를 뜯어먹는 신) [Omestès / Dionysus Omestes]', nameKoShort: '디오니소스 오메스테스', nameFr: 'Omestès', nameEn: 'Dionysus Omestes (The Raw-Flesh Eater)' },
  'e2868-omomancie': { nameKo: '견갑골점(스카풀리만시 / 어깨뼈점) [Omomancie / Scapulimancy]', nameKoShort: '견갑골점(어깨뼈점)', nameFr: 'Omomancie', nameEn: 'Scapulimancy (Divination by Shoulder Blades)' },
  'e2869-omphalomancie': { nameKo: '탯줄점(옴팔로만시) [Omphalomancie / Omphalomancy]', nameKoShort: '탯줄점', nameFr: 'Omphalomancie', nameEn: 'Omphalomancy (Divination by Umbilical Cord Knots)' },
  'e2870-omphalophysiques': { nameKo: '배꼽 응시파(헤시카즘 정적주의 수도사들) [Omphalophysiques / Hesychasts]', nameKoShort: '배꼽 응시파', nameFr: 'Omphalophysiques', nameEn: 'Omphalopsychics (Navel-Gazing Hesychast Monks)' },
  'e2871-on': { nameKo: '온(신의 신성한 마법 주문어) [On / Sacred Magical Name]', nameKoShort: '온(신성한 주문어)', nameFr: 'On', nameEn: 'On (Sacred Egyptian/Hebrew Divine Name in Grimoires)' },
  'e2872-ondins': { nameKo: '운디네(물의 정령) [Ondins / Undines (Water Elementals)]', nameKoShort: '운디네(물의 정령)', nameFr: 'Ondins', nameEn: 'Undines (Elemental Spirits of Water)' },
  'e2873-oneirocritique': { nameKo: '해몽술(꿈의 해석) [Oneirocritique / Oneirocriticism]', nameKoShort: '해몽술', nameFr: 'Oneirocritique', nameEn: 'Oneirocriticism (Crossref to Songes)' },
  'e2874-ongles': { nameKo: '손톱 깎기와 마녀의 저주 미신 [Ongles / Fingernail Superstitions]', nameKoShort: '손톱 미신', nameFr: 'Ongles', nameEn: 'Fingernail Trimmings in Witchcraft and Magic' },
  'e2875-onguents': { nameKo: '마녀의 비행 연고 [Onguents / Flying Ointments]', nameKoShort: '마녀의 비행 연고', nameFr: 'Onguents', nameEn: 'Flying Ointments of Witches (Unguentum Sabbati)' },
  'e2876-onomancie': { nameKo: '성명점(오노만시 / 이름 점술) [Onomancie / Onomancy]', nameKoShort: '성명점(이름 점술)', nameFr: 'Onomancie', nameEn: 'Onomancy (Divination by Names and Numerology)' },
  'e2877-onychomancie': { nameKo: '손톱점(오니코만시 / 손톱 반사 점술) [Onychomancie / Onychomancy]', nameKoShort: '손톱점', nameFr: 'Onychomancie', nameEn: 'Onychomancy (Divination by Fingernail Reflection)' },
  'e2878-oomancie': { nameKo: '난점술(오오만시 / 달걀점) [Oomancie / Oomancy]', nameKoShort: '난점술(달걀점)', nameFr: 'Oomancie', nameEn: 'Oomancy (Ooscopy / Divination by Eggs)' },
  'e2879-opale': { nameKo: '오팔(단백석 / 무지갯빛 보석의 명암) [Opale / Opal Superstitions]', nameKoShort: '오팔 미신', nameFr: 'Opale', nameEn: 'Opal (Gemstone of Changing Luck and Melancholy)' },
  'e2880-opalski': { nameKo: '오팔스키(캄차카 온천과 지옥의 악령) [Opalski / Kamchatka Springs]', nameKoShort: '오팔스키 온천', nameFr: 'Opalski', nameEn: 'Opalski (Hot Springs and Spirits of Kamchatka)' },
  'e2881-ophiogenes': { nameKo: '오피오게네스(헬레스폰트의 뱀술사 일족) [Ophiogènes / Ophiogeneis]', nameKoShort: '오피오게네스 일족', nameFr: 'Ophiogènes', nameEn: 'Ophiogeneis (Serpent-Born Tribe of Hellespont)' },
  'e2882-ophiomancie': { nameKo: '사점술(뱀점 / 오피오만시) [Ophiomancie / Ophiomancy]', nameKoShort: '사점술(뱀점)', nameFr: 'Ophiomancie', nameEn: 'Ophiomancy (Divination by Serpents)' },
  'e2883-ophionee': { nameKo: '오피오네우스(신들에게 반역한 태고의 뱀신) [Ophionée / Ophion]', nameKoShort: '오피오네우스', nameFr: 'Ophionée', nameEn: 'Ophion (Ancient Serpent Titan Cast into Tartarus)' },
  'e2884-ophioneus': { nameKo: '오피오네우스(메세니아의 맹인 예언가) [Ophioneus]', nameKoShort: '메세니아의 오피오네우스', nameFr: 'Ophioneus', nameEn: 'Ophioneus (Blind Prophet of Messenia)' },
  'e2885-ophites': { nameKo: '오피스파(뱀 숭배 영지주의 이단) [Ophites / Ophite Gnostics]', nameKoShort: '오피스파(뱀 숭배 이단)', nameFr: 'Ophites', nameEn: 'Ophites (Serpent-Worshipping Gnostic Sect)' },
  'e2886-ophthalmius': { nameKo: '오프탈미우스(도둑의 투명 마법석) [Ophthalmius / Stone of Invisibility]', nameKoShort: '오프탈미우스', nameFr: 'Ophthalmius', nameEn: 'Ophthalmius (Fabulous Stone of Invisibility)' },
  'e2887-ophthalmoscopie': { nameKo: '안상술(눈 관상점) [Ophthalmoscopie / Ophthalmoscopy]', nameKoShort: '안상술(눈 관상술)', nameFr: 'Ophthalmoscopie', nameEn: 'Ophthalmoscopy (Judging Character by Eyes)' },
  'e2888-optimisme': { nameKo: '낙천주의(볼테르의 『캉디드』와 팡글로스 풍자) [Optimisme / Philosophical Optimism]', nameKoShort: '낙천주의 풍자', nameFr: 'Optimisme', nameEn: 'Optimism (Voltaire\'s Candide and Panglossian Satire)' },
  'e2889-oracles': { nameKo: '고대 신탁의 역사와 악마적 기만 [Oracles / Ancient Pagan Oracles]', nameKoShort: '고대 신탁의 역사', nameFr: 'Oracles', nameEn: 'Oracles (Delphic Oracle and Demonic Impostures)' },
  'e2890-orages': { nameKo: '폭풍을 부르는 자들(템페스타리이) [Orages / Storm-Makers]', nameKoShort: '폭풍을 부르는 자들', nameFr: 'Orages', nameEn: 'Storms and Weather-Makers (Crossref to Criériens, Tonnerre)' },
  'e2891-oraisonduloup': { nameKo: '늑대 기도문(늑대 퇴치 주문) [Oraison du loup / Wolf\'s Prayer]', nameKoShort: '늑대 기도문', nameFr: 'Oraison du loup', nameEn: 'Prayer of the Wolf (Folk Charm against Wolves)' },
  'e2892-oray': { nameKo: '오라이(레라지에) [Oray / Leraje (Great Marquis of Hell)]', nameKoShort: '오라이(레라지에)', nameFr: 'Oray', nameEn: 'Leraje (Oray / Loray / Great Marquis of Hell)' },
  'e2893-orcavelle': { nameKo: '오르카벨(기사도 로맨스의 강력한 마녀) [Orcavelle / Sorceress of Romance]', nameKoShort: '오르카벨', nameFr: 'Orcavelle', nameEn: 'Orcavelle (Enchantress in Chivalric Romances)' },
  'e2894-ordalie': { nameKo: '신명재판(오르달리아 / 불과 끓는 물의 시련) [Ordalie / Ordeal (Judgment of God)]', nameKoShort: '신명재판(오르달리아)', nameFr: 'Ordalie', nameEn: 'Ordeal (Judicium Dei / Trial by Fire and Water)' },
  'e2895-oreille': { nameKo: '귀울림과 험담의 징조 미신 [Oreille / Ringing in the Ears]', nameKoShort: '귀울림 미신', nameFr: 'Oreille', nameEn: 'Ringing Ears (Friends Speaking of Us)' },
  'e2896-oresmeguillaume': { nameKo: '니콜 오렘(기욤 오렘 / 점성술 비판의 선구자) [Oresme (Guillaume) / Nicole Oresme]', nameKoShort: '니콜 오렘', nameFr: 'Oresme (Guillaume)', nameEn: 'Nicole Oresme (14th-Century Philosopher and Critic of Astrology)' },
  'e2897-orfa': { nameKo: '오르파 호수의 신성한 잉어 전설 [Orfa / Sacred Fish of Edessa]', nameKoShort: '오르파 호수 전설', nameFr: 'Orfa', nameEn: 'Lake of Orfa (Sacred Fish Pool of Abraham in Urfa)' },
  'e2898-orgueil': { nameKo: '교만(오만 / 루시퍼를 파멸시킨 칠죄종의 으뜸) [Orgueil / Pride (Superbia)]', nameKoShort: '교만(오만)', nameFr: 'Orgueil', nameEn: 'Pride (Superbia / The Sin of Lucifer)' },
  'e2899-orias': { nameKo: '오리아스(오리악스) [Orias / Oriax (Great Marquis of Hell)]', nameKoShort: '오리아스', nameFr: 'Orias', nameEn: 'Orias (Oriax / Great Marquis of Hell)' },
  'e2900-originelpeche': { nameKo: '원죄 [Originel (Péché) / Original Sin]', nameKoShort: '원죄', nameFr: 'Originel (Péché)', nameEn: 'Original Sin (Crossref to Péché originel)' },
  'e2901-originesdumonde': { nameKo: '세계의 기원(고대 우주 창조 신화의 비교) [Origines du monde / Origins of the World]', nameKoShort: '세계의 기원 신화', nameFr: 'Origines du monde', nameEn: 'Cosmogonies (Myths of the Origin of the World)' },
  'e2902-ornithomancie': { nameKo: '조점술(오르니토만시 / 새의 비행과 울음소리 점술) [Ornithomancie / Ornithomancy]', nameKoShort: '조점술(새점)', nameFr: 'Ornithomancie', nameEn: 'Ornithomancy (Divination by Birds)' },
  'orobas': { nameKo: '오로바스 [Orobas (Great Prince of Hell)]', nameKoShort: '오로바스', nameFr: 'Orobas', nameEn: 'Orobas (Great Prince of Hell)' },
  'e2904-oromasis': { nameKo: '오로마시스(불의 군주 살라만더) [Oromasis / Salamander King]', nameKoShort: '오로마시스', nameFr: 'Oromasis', nameEn: 'Oromasis (King of the Salamanders)' },
  'e2905-oromaze': { nameKo: '오르무즈드(아후라 마즈다 / 페르시아 빛의 최고신) [Oromaze / Ahura Mazda]', nameKoShort: '오르무즈드', nameFr: 'Oromaze', nameEn: 'Ormazd (Ahura Mazda / Persian Supreme God of Light)' },
  'e2906-oronte': { nameKo: '오론테스강의 거인 유골 [Oronte / Giant of the Orontes]', nameKoShort: '오론테스강의 거인', nameFr: 'Oronte', nameEn: 'Giant Skeleton of the Orontes River (Pausanias)' },
  'e2907-orphee': { nameKo: '오르페우스(하데스 저승을 감동시킨 음유시인) [Orphée / Orpheus]', nameKoShort: '오르페우스', nameFr: 'Orphée', nameEn: 'Orpheus (Thracian Bard and Underworld Descent)' },
  'e2908-orphelinats': { nameKo: '고아원 집단 악마 빙의 사건 [Orphelinats / Orphanage Possessions]', nameKoShort: '고아원 빙의 사건', nameFr: 'Orphelinats', nameEn: 'Possessions in Orphanages (Amsterdam 1566)' },
  'e2909-orpheotelestes': { nameKo: '오르페오텔레스테스(오르페우스교 밀의 사제들) [Orphéotelestes]', nameKoShort: '오르페오텔레스테스', nameFr: 'Orphéotelestes', nameEn: 'Orpheotelestes (Initiators of Orphic Mysteries)' },
  'e2910-orportable': { nameKo: '가용성 황금 비약(오르 포타블 / 마시는 금) [Or portable / Aurum Potabile]', nameKoShort: '마시는 금(가용성 황금)', nameFr: 'Or portable', nameEn: 'Aurum Potabile (Drinkable Gold Elixir of Life)' },
  'e2911-orrjohn': { nameKo: '존 오어(켄터키의 투시 능력자) [Orr (John)]', nameKoShort: '존 오어', nameFr: 'Orr (John)', nameEn: 'John Orr (American Clairvoyant of Kentucky)' },
  'e2912-orthon': { nameKo: '오르통(코라스 영주의 전설적 사역령) [Orthon / Familiar Spirit of Corasse]', nameKoShort: '오르통', nameFr: 'Orthon', nameEn: 'Orthon (Familiar Sprite of Lord Corasse)' },
  'e2913-ortiebrulante': { nameKo: '쐐기풀(아이슬란드의 악령 퇴치 약초) [Ortie brûlante / Stinging Nettle]', nameKoShort: '쐐기풀 미신', nameFr: 'Ortie brûlante', nameEn: 'Stinging Nettle (Icelandic Protective Herb Netla)' },
  'e2914-osdesmorts': { nameKo: '망자의 유골과 무덤 기피 미신 [Os des morts / Bones of the Dead]', nameKoShort: '망자의 유골 미신', nameFr: 'Os des morts', nameEn: 'Bones of the Dead in Mauritanian Lore' },
  'e2915-othon': { nameKo: '오토 황제(갈바의 원혼에 쫓긴 로마 황제) [Othon / Emperor Otho]', nameKoShort: '오토 황제', nameFr: 'Othon', nameEn: 'Emperor Otho (Haunted by the Ghost of Galba)' },
  'e2916-otis': { nameKo: '오티스(보티스) [Otis / Botis (Great President and Earl)]', nameKoShort: '오티스(보티스)', nameFr: 'Otis', nameEn: 'Botis (Otis / Great President and Earl of Hell)' },
  'e2917-ouahiche': { nameKo: '와히슈(이로쿼이 샤먼의 사역 악령) [Ouahiche]', nameKoShort: '와히슈', nameFr: 'Ouahiche', nameEn: 'Ouahiche (Iroquois Shamanic Familiar Spirit)' },
  'e2918-ouikka': { nameKo: '위카(이누이트 에스키모의 병마 악령) [Ouikka]', nameKoShort: '위카', nameFr: 'Ouikka', nameEn: 'Ouikka (Inuit Evil Spirit of Disease)' },
  'e2919-oulontoyon': { nameKo: '울론 토욘(시베리아 야쿠트족의 27개 악령 부족의 마왕) [Oulon-Toyon]', nameKoShort: '울론 토욘', nameFr: 'Oulon-Toyon', nameEn: 'Ulu Toyon (Oulon-Toyon / Yakut Creator of Evil Spirits)' },
  'e2920-oupires': { nameKo: '우피르(슬라브의 흡혈귀 뱀파이어) [Oupires / Upir]', nameKoShort: '우피르', nameFr: 'Oupires', nameEn: 'Upir (Oupires / Slavic Vampires)' },
  'e2921-ouran': { nameKo: '우란(안디블레 / 카리브해 원주민의 악마 마술사) [Ouran / Ouran-Soangue]', nameKoShort: '우란', nameFr: 'Ouran', nameEn: 'Ouran-Soangue (Demon-Possessed Sorcerer of the Antilles)' },
  'e2922-ourisk': { nameKo: '우리스크(스코틀랜드 하일랜드의 털북숭이 요정) [Ourisk / Urisk]', nameKoShort: '우리스크', nameFr: 'Ourisk', nameEn: 'Urisk (Scottish Highland Satyr-Brownie)' },
  'e2923-ours': { nameKo: '곰 숭배와 오스티야크족의 곰 축제 [Ours / Bear Worship and Superstitions]', nameKoShort: '곰 숭배 미신', nameFr: 'Ours', nameEn: 'Bear Cult and Superstitions (Ostyaks of Siberia)' },
  'e2924-ovide': { nameKo: '오비디우스(『변신 이야기』와 가공의 마법서) [Ovide / Ovid]', nameKoShort: '오비디우스', nameFr: 'Ovide', nameEn: 'Ovid (Roman Poet and Pseudo-Ovidian Grimoire)' },
  'e2925-oxyones': { nameKo: '옥시오네스(새 머리를 가진 북방의 괴물 종족) [Oxyones / Bird-Headed Tribe]', nameKoShort: '옥시오네스', nameFr: 'Oxyones', nameEn: 'Oxyones (Mythical Bird-Headed People of Germania)' },
  'e2926-oze': { nameKo: '오제(오소) [Oze / Ose (Great President of Hell)]', nameKoShort: '오제(오소)', nameFr: 'Oze', nameEn: 'Ose (Oze / Oso / Great President of Hell)' },

  // P entries curated headwords (p.507-567)
  'e2927-paolaus': { nameKo: '올라우스 파 [Pa (Olaùs)]', nameKoShort: '올라우스 파', nameFr: 'Pa (Olaùs)', nameEn: 'Olaus Pa (Crossref to Harppe)' },
  'e2928-pacte': { nameKo: '악마와의 계약 [Pacte / Pact with the Devil]', nameKoShort: '악마와의 계약', nameFr: 'Pacte', nameEn: 'Pact with the Devil' },
  'e2929-painepreuvedu': { nameKo: '빵의 시련(보리빵 신명재판) [Pain (Épreuve du) / Ordeal of the Bread]', nameKoShort: '빵의 시련', nameFr: 'Pain (Épreuve du)', nameEn: 'Ordeal of the Bread (Corsned)' },
  'e2930-painbenit': { nameKo: '축복받은 빵의 미신 [Pain bénit / Blessed Bread]', nameKoShort: '축복받은 빵', nameFr: 'Pain bénit', nameEn: 'Superstitions of Blessed Bread' },
  'e2931-pajotmarguerite': { nameKo: '마르그리트 파조 [Pajot (Marguerite)]', nameKoShort: '마르그리트 파조', nameFr: 'Pajot (Marguerite)', nameEn: 'Marguerite Pajot (Witch of Nancy)' },
  'e2932-palingenesie': { nameKo: '팔린게네시아(재생 연금술) [Palingénésie / Palingenesis]', nameKoShort: '팔린게네시아', nameFr: 'Palingénésie', nameEn: 'Palingenesis (Chemical Rebirth)' },
  'e2933-palmoscopie': { nameKo: '경련점(팔모스코피) [Palmoscopie / Palmoscopy]', nameKoShort: '경련점', nameFr: 'Palmoscopie', nameEn: 'Palmoscopy (Divination by Twitching)' },
  'e2934-paludmadeleinedemendozdela': { nameKo: '마들렌 드 라 팔뤼 [Palud (Madeleine de Mendoz de la)]', nameKoShort: '마들렌 드 라 팔뤼', nameFr: 'Palud (Madeleine de Mendoz de la)', nameEn: 'Madeleine de Demandolx de la Palud' },
  'e2935-pamilius': { nameKo: '파밀리아(사역마) [Pamilius / Familiar Spirits]', nameKoShort: '파밀리아', nameFr: 'Pamilius', nameEn: 'Pamilius (Crossref to Démons familiers)' },
  'e2936-pan': { nameKo: '판(목신) [Pan / Faun]', nameKoShort: '판(목신)', nameFr: 'Pan', nameEn: 'Pan (Great God of the Woods)' },
  'e2937-pandaemonium': { nameKo: '판데모니움(만마전) [Pandæmonium / Pandemonium]', nameKoShort: '판데모니움', nameFr: 'Pandæmonium', nameEn: 'Pandemonium (Capital of Hell)' },
  'e2938-panenbartholomee': { nameKo: '바르톨로메 파넨 [Panen (Bartholomée)]', nameKoShort: '바르톨로메 파넨', nameFr: 'Panen (Bartholomée)', nameEn: 'Bartholomée Panen (Protestant Exorcist)' },
  'e2939-paneros': { nameKo: '파네로스(임신을 돕는 보석) [Paneros]', nameKoShort: '파네로스', nameFr: 'Paneros', nameEn: 'Paneros (Fertility Gem)' },
  'e2940-paniers': { nameKo: '바구니와 하와의 어원 [Paniers / Baskets Superstition]', nameKoShort: '바구니와 하와의 어원', nameFr: 'Paniers', nameEn: 'Baskets and Rabbinic Fable of Eve' },
  'e2941-panjacartaguel': { nameKo: '판차카르타겔(인도 5대 원소신) [Panjacartaguel]', nameKoShort: '판차카르타겔', nameFr: 'Panjacartaguel', nameEn: 'Pancha Kartas (Five Cosmic Elements)' },
  'e2942-panjangam': { nameKo: '판장감(브라만 길흉 역서) [Panjangam / Panchanga]', nameKoShort: '판장감', nameFr: 'Panjangam', nameEn: 'Panchanga (Hindu Astrological Almanac)' },
  'e2943-pantacles': { nameKo: '펜타클(부적과 인장) [Pantacles / Pentacles]', nameKoShort: '펜타클', nameFr: 'Pantacles', nameEn: 'Pentacles (Solomonic Talismans)' },
  'e2944-pantarbe': { nameKo: '판타르베(황금을 끄는 보석) [Pantarbe]', nameKoShort: '판타르베', nameFr: 'Pantarbe', nameEn: 'Pantarbe (Magnetic Gold Stone)' },
  'e2945-paouaouci': { nameKo: '파와와우시(기우 주술) [Paouaouci / Powwow]', nameKoShort: '파와와우시', nameFr: 'Paouaouci', nameEn: 'Paouaouci (Algonquian Rain Incantation)' },
  'e2946-pape': { nameKo: '교황과 적그리스도 미신 [Pape / The Pope and Antichrist]', nameKoShort: '교황과 적그리스도 미신', nameFr: 'Pape', nameEn: 'Papacy and Antichrist Myths' },
  'e2947-papillon': { nameKo: '나비(영혼의 상징) [Papillon / Butterfly Symbol of Soul]', nameKoShort: '나비(영혼의 상징)', nameFr: 'Papillon', nameEn: 'Butterfly as Symbol of the Soul' },
  'e2948-paracelsephilippebombastdit': { nameKo: '파라켈수스 [Paracelse / Paracelsus]', nameKoShort: '파라켈수스', nameFr: 'Paracelse (Philippe Bombast, dit)', nameEn: 'Paracelsus (Philippus Aureolus Theophrastus Bombastus von Hohenheim)' },
  'e2949-paramelle': { nameKo: '파라멜 신부(수맥 탐사 사제) [Paramelle / Abbé Paramelle]', nameKoShort: '파라멜 신부', nameFr: 'Paramelle', nameEn: 'Abbé Paramelle (Hydrogeologist Priest)' },
  'e2950-parcheminvierge': { nameKo: '순결한 양피지 [Parchemin vierge / Virgin Parchment]', nameKoShort: '순결한 양피지', nameFr: 'Parchemin vierge', nameEn: 'Virgin Parchment (Occult Ritual Parchment)' },
  'e2951-parfums': { nameKo: '향과 훈증의 마법 [Parfums / Magic Incenses and Fumigations]', nameKoShort: '향과 훈증의 마법', nameFr: 'Parfums', nameEn: 'Magical Incenses and Suffumigations' },
  'e2952-paris': { nameKo: '파리 멸망 예언의 미신 [Paris / Prophecies of Paris Destruction]', nameKoShort: '파리 멸망 예언', nameFr: 'Paris', nameEn: 'False Prophecies of the Fall of Paris' },
  'e2953-parkerguillaume': { nameKo: '윌리엄 파커 [Parker (Guillaume)]', nameKoShort: '윌리엄 파커', nameFr: 'Parker (Guillaume)', nameEn: 'William Parker (Crossref to Buckingham)' },
  'e2954-parkesthomas': { nameKo: '토머스 파크스 [Parkes (Thomas)]', nameKoShort: '토머스 파크스', nameFr: 'Parkes (Thomas)', nameEn: 'Thomas Parkes (Haunted Englishman)' },
  'e2955-parlements': { nameKo: '고등법원과 마녀재판 [Parlements / Parliaments and Witch Trials]', nameKoShort: '고등법원과 마녀재판', nameFr: 'Parlements', nameEn: 'French Parlements and the Prosecution of Witches' },
  'e2956-parolesmagiques': { nameKo: '마법의 주문과 주술어 [Paroles magiques / Magical Words]', nameKoShort: '마법의 주문', nameFr: 'Paroles magiques', nameEn: 'Magical Words and Incomprehensible Incantations' },
  'e2957-parquemariedela': { nameKo: '마리 드 라 파르크 [Parque (Marie de la)]', nameKoShort: '마리 드 라 파르크', nameFr: 'Parque (Marie de la)', nameEn: 'Marie de la Parque (Sabbat Sorceress)' },
  'e2958-parques': { nameKo: '파르카이(운명의 삼여신) [Parques / The Fates (Moirai)]', nameKoShort: '파르카이', nameFr: 'Parques', nameEn: 'The Fates (Parcae / Moirai)' },
  'e2959-parris': { nameKo: '패리스 일가(세일럼 마녀재판의 발단) [Parris / Parris Family]', nameKoShort: '패리스 일가', nameFr: 'Parris', nameEn: 'Parris Family (Salem Witch Trials Origin)' },
  'e2960-parthenomancie': { nameKo: '처녀점(파르테노만시) [Parthénomancie / Parthenomancy]', nameKoShort: '처녀점', nameFr: 'Parthénomancie', nameEn: 'Parthenomancy (Divination of Virginity)' },
  'e2961-pasetes': { nameKo: '파세테스 [Pasétès / Pasetes the Magician]', nameKoShort: '파세테스', nameFr: 'Pasétès', nameEn: 'Pasetes (Greek Illusionist Magician)' },
  'e2962-passalorynchithes': { nameKo: '파살로링키타이(침묵의 코막이파 이단) [Passalorynchithes]', nameKoShort: '파살로링키타이', nameFr: 'Passalorynchithes', nameEn: 'Passalorynchites (Nose-Pinning Silent Sect)' },
  'e2963-patala': { nameKo: '파탈라(인도 신화의 지하세계 지옥) [Patala]', nameKoShort: '파탈라', nameFr: 'Patala', nameEn: 'Patala (Hindu Underworld Realms)' },
  'e2964-patiniac': { nameKo: '파티니악(필리핀의 태아 낙태 주술) [Patiniac]', nameKoShort: '파티니악', nameFr: 'Patiniac', nameEn: 'Patiniac (Philippine Sorcery of Abortion)' },
  'e2965-patrispierre': { nameKo: '피에르 파트리스 [Patris (Pierre)]', nameKoShort: '피에르 파트리스', nameFr: 'Patris (Pierre)', nameEn: 'Pierre Patris (French Wit and Courtier)' },
  'e2966-patrous': { nameKo: '제우스 파트로오스(세 눈을 가진 목상) [Patroüs / Zeus Patroos]', nameKoShort: '제우스 파트로오스', nameFr: 'Patroüs', nameEn: 'Zeus Patroos (Three-Eyed Statue of Argos)' },
  'e2967-pauana': { nameKo: '파바나(사바트의 지옥 춤) [Pauana / Sabbat Infernal Dance]', nameKoShort: '파바나', nameFr: 'Pauana', nameEn: 'Pauana (Flemish Sabbat Dance)' },
  'e2968-paularnold': { nameKo: '아르놀트 파올(세르비아의 흡혈귀) [Paul (Arnold) / Arnold Paole]', nameKoShort: '아르놀트 파올', nameFr: 'Paul (Arnold)', nameEn: 'Arnold Paole (Famous Serbian Vampire Case)' },
  'e2969-paulsaint': { nameKo: '성 바오로의 비술 [Paul (Saint) / Art of Saint Paul]', nameKoShort: '성 바오로의 비술', nameFr: 'Paul (Saint)', nameEn: 'Saint Paul (Crossref to Art de Saint Paul)' },
  'e2970-paule': { nameKo: '아름다운 폴(툴루즈의 불패 미라) [Paule / La Belle Paule]', nameKoShort: '아름다운 폴', nameFr: 'Paule', nameEn: 'La Belle Paule (Incorrupt Mummy of Toulouse)' },
  'e2971-pausanias': { nameKo: '파우사니아스(원혼의 복수와 영혼 소환) [Pausanias / Ghost of Cleonice]', nameKoShort: '파우사니아스', nameFr: 'Pausanias', nameEn: 'Pausanias (Spartan General Haunted by Cleonice)' },
  'e2972-pavanisles': { nameKo: '파바니스(다리엔 지협의 예언 주술사) [Pavanis (Les)]', nameKoShort: '파바니스', nameFr: 'Pavanis (Les)', nameEn: 'The Pavanis (Darien Diviners)' },
  'paymon': { nameKo: '파이몬 [Paymon / Paimon (King of Hell)]', nameKoShort: '파이몬', nameFr: 'Paymon (Paimon)', nameEn: 'Paimon (Great King of Hell)' },
  'e2974-peanite': { nameKo: '페아니테스(순산의 마법 보석) [Péanite / Paeanitis]', nameKoShort: '페아니테스', nameFr: 'Péanite', nameEn: 'Paeanitis (Fabulous Gem of Childbirth)' },
  'e2975-peau': { nameKo: '피부 질환과 시체 접촉 미신 [Peau / Skin Diseases and Corpse Cure]', nameKoShort: '피부 질환 치료 미신', nameFr: 'Peau', nameEn: 'Skin Diseases and Corpse Touching Superstition' },
  'e2976-peche': { nameKo: '죄악 [Péché / Sin]', nameKoShort: '죄악', nameFr: 'Péché', nameEn: 'Sin (Path to Hell)' },
  'e2977-pecheoriginel': { nameKo: '원죄와 인류의 유전적 책임 [Péché originel / Original Sin]', nameKoShort: '원죄', nameFr: 'Péché originel', nameEn: 'Original Sin (Hereditary Responsibility)' },
  'e2978-pedasiens': { nameKo: '페다소스인(여사제의 수염 징조) [Pédasiens / Pedasians of Caria]', nameKoShort: '페다소스인', nameFr: 'Pédasiens', nameEn: 'Pedasians (Bearded Priestess of Caria)' },
  'e2979-pedegache': { nameKo: '페드가슈(악마의 시선과 사안) [Pédegache / Evil Eye]', nameKoShort: '페드가슈', nameFr: 'Pédegache', nameEn: 'Pedegache (Crossref to Yeux)' },
  'e2980-pegomancie': { nameKo: '샘물점(페고만시) [Pégomancie / Pegomancy]', nameKoShort: '샘물점', nameFr: 'Pégomancie', nameEn: 'Pegomancy (Divination by Spring Waters)' },
  'e2981-pegu': { nameKo: '페구의 거대 우상 키악키악 [Pégu / Kiak-Kiak of Pegu]', nameKoShort: '페구의 우상 키악키악', nameFr: 'Pégu', nameEn: 'Pegu (Giant Idol Kiak-Kiak)' },
  'e2982-peigne': { nameKo: '빗을 줍는 행운의 징조 [Peigne / Comb Superstition]', nameKoShort: '빗 줍기 미신', nameFr: 'Peigne', nameEn: 'Finding a Comb as Good Omen' },
  'e2983-pendus': { nameKo: '교수형 밧줄 부적과 도박 미신 [Pendus / Hanged Man\'s Rope]', nameKoShort: '교수형 밧줄 부적', nameFr: 'Pendus', nameEn: 'Hanged Man\'s Rope (Gambler\'s Talisman)' },
  'e2984-penitence': { nameKo: '포르모사 원주민의 카리창 참회 [Pénitence / Kari-Chang of Formosa]', nameKoShort: '카리창 참회', nameFr: 'Pénitence', nameEn: 'Penance (Kari-Chang of Formosa)' },
  'e2985-penote': { nameKo: '베르나르 페노트(빈털터리 연금술사) [Penote / Bernard Gilles Penotus]', nameKoShort: '베르나르 페노트', nameFr: 'Penote', nameEn: 'Bernard Gilles Penotus (Impoverished Alchemist)' },
  'e2986-penteman': { nameKo: '펜테만(해골 화폭의 공포로 사망한 화가) [Penteman / Dutch Painter]', nameKoShort: '펜테만', nameFr: 'Penteman', nameEn: 'Penteman (Dutch Vanitas Painter)' },
  'e2987-peratoscopie': { nameKo: '공중 이상 징조점(페라토스코피) [Pératoscopie / Peratoscopy]', nameKoShort: '공중 이상 징조점', nameFr: 'Pératoscopie', nameEn: 'Peratoscopy (Divination by Aerial Phenomena)' },
  'e2988-perdrix': { nameKo: '자고새 깃털 침대와 임종 미신 [Perdrix / Partridge Feathers]', nameKoShort: '자고새 깃털 미신', nameFr: 'Perdrix', nameEn: 'Partridge Feathers and Lingering Death' },
  'e2989-perezjuan': { nameKo: '후안 페레스 [Pérez (Juan)]', nameKoShort: '후안 페레스', nameFr: 'Pérez (Juan)', nameEn: 'Juan Pérez (Crossref to Inquisition)' },
  'e2990-pericles': { nameKo: '페리클레스(병영의 미신 타파와 징조 조작) [Périclès / Pericles]', nameKoShort: '페리클레스', nameFr: 'Périclès', nameEn: 'Pericles (Athenian Statesman and Omen Manipulation)' },
  'e2991-peris': { nameKo: '페리(페르시아 신화의 아름다운 요정) [Péris / Peri]', nameKoShort: '페리', nameFr: 'Péris', nameEn: 'Peri (Persian Winged Fairy Spirits)' },
  'e2992-perithe': { nameKo: '페리테스(통풍을 치료하는 황색 보석) [Périthe / Pyrites]', nameKoShort: '페리테스', nameFr: 'Périthe', nameEn: 'Perithe (Healing Yellow Stone)' },
  'e2993-peroun': { nameKo: '페룬(슬라브 신화의 천둥과 뇌우의 최고신) [Péroun / Perun]', nameKoShort: '페룬', nameFr: 'Péroun', nameEn: 'Perun (Slavic God of Thunder and Lightning)' },
  'e2994-perrier': { nameKo: '페리에(사바트 권능령 악마) [Perrier / Demon of the Sabbat]', nameKoShort: '페리에', nameFr: 'Perrier', nameEn: 'Perrier (Demon of Principalities)' },
  'e2995-persilmaitre': { nameKo: '마스터 파슬리(베르델레의 별칭) [Persil (Maître) / Master Parsley]', nameKoShort: '마스터 파슬리', nameFr: 'Persil (Maître)', nameEn: 'Master Parsley (Crossref to Verdelet)' },
  'e2996-perteman': { nameKo: '페르테만(위클 마을 처녀의 악마 계약) [Perteman / Perteman of Uccle]', nameKoShort: '페르테만', nameFr: 'Perteman', nameEn: 'Perteman (Young Woman of Uccle)' },
  'e2997-pertinax': { nameKo: '페르티낙스 황제의 흉조 [Pertinax / Roman Emperor]', nameKoShort: '페르티낙스 황제의 흉조', nameFr: 'Pertinax', nameEn: 'Pertinax (Assassinated Roman Emperor)' },
  'e2998-peste': { nameKo: '페스트와 흑사병의 미신 [Peste / Plague Superstitions]', nameKoShort: '페스트 미신', nameFr: 'Peste', nameEn: 'Plague Superstitions and Royal Healing' },
  'e2999-pet': { nameKo: '방귀에 관한 민간 속담과 미신 [Pet / Flatulence Superstition]', nameKoShort: '방귀 미신', nameFr: 'Pet', nameEn: 'Farting at the Table (Popular Proverb)' },
  'e3000-petchimancie': { nameKo: '솔점(페치만시) [Petchimancie / Petchimancy]', nameKoShort: '솔점', nameFr: 'Petchimancie', nameEn: 'Petchimancy (Divination by Clothes Brushes)' },
  'e3001-petitmonde': { nameKo: '프티 몽드(영국의 소우주 비밀결사) [Petit monde / Little World Society]', nameKoShort: '프티 몽드', nameFr: 'Petit monde', nameEn: 'Petit Monde (Secret Conspiratorial Society)' },
  'e3002-petitpierre': { nameKo: '프티 피에르(작은 피터) [Petit-Pierre / Little Peter Demon]', nameKoShort: '프티 피에르', nameFr: 'Petit-Pierre', nameEn: 'Petit-Pierre (German Devil of Usury and Souls)' },
  'e3003-petpayatons': { nameKo: '펫파야톤(샴의 공중 부유 악령) [Petpayatons]', nameKoShort: '펫파야톤', nameFr: 'Petpayatons', nameEn: 'Petpayatons (Siamese Airborne Evil Spirits)' },
  'e3004-petrobusiens': { nameKo: '페트로브루스파(십자가 우상 파괴 이단) [Pétrobusiens / Petrobrusians]', nameKoShort: '페트로브루스파', nameFr: 'Pétrobusiens', nameEn: 'Petrobrusians (Followers of Peter of Bruys)' },
  'e3005-pettimancie': { nameKo: '주사위점(페티만시) [Pettimancie / Pettimancy]', nameKoShort: '주사위점', nameFr: 'Pettimancie', nameEn: 'Pettimancy (Divination by Dice Throwing)' },
  'e3006-peucergaspard': { nameKo: '카스파어 포이커 [Peucer (Gaspard) / Caspar Peucer]', nameKoShort: '카스파어 포이커', nameFr: 'Peucer (Gaspard)', nameEn: 'Caspar Peucer (Reformation Physician and Scholar)' },
  'e3007-peuplier': { nameKo: '포플러 나무와 지하세계 미신 [Peuplier / Poplar Tree]', nameKoShort: '포플러 나무 미신', nameFr: 'Peuplier', nameEn: 'Poplar Tree (Sacred to the Underworld)' },
  'e3008-peur': { nameKo: '공포 퇴치 부적 [Peur / Amulet Against Fear]', nameKoShort: '공포 퇴치 부적', nameFr: 'Peur', nameEn: 'Charms Against Fear' },
  'e3009-pharaildis': { nameKo: '파라일디스(노르웨이의 선량한 요정) [Phara-Ildis]', nameKoShort: '파라일디스', nameFr: 'Phara-Ildis', nameEn: 'Phara-Ildis (Beneficent Norwegian Fairy)' },
  'e3010-pharmacie': { nameKo: '약초 훈증 점술(파르마키아) [Pharmacie / Pharmakeia]', nameKoShort: '약초 훈증 점술', nameFr: 'Pharmacie', nameEn: 'Pharmakeia (Herbal and Fumigation Sorcery)' },
  'e3011-phenix': { nameKo: '페닉스 [Phénix / Phenex (Great Marquis)]', nameKoShort: '페닉스', nameFr: 'Phénix', nameEn: 'Phenex (Great Marquis of Hell)' },
  'e3012-phenix': { nameKo: '불사조(피닉스) [Phénix / The Phoenix Bird]', nameKoShort: '불사조', nameFr: 'Phénix', nameEn: 'The Phoenix (Sacred Bird of Resurrection)' },
  'e3013-phenomenes': { nameKo: '카르타헤나의 기형아 출산 괴담 [Phénomènes / Monsters of Cartagena]', nameKoShort: '카르타헤나의 기형아 괴담', nameFr: 'Phénomènes', nameEn: 'Monstrous Births of Cartagena' },
  'e3014-philinnion': { nameKo: '필린니온(되살아난 신부의 흡혈귀 전승) [Philinnion / The Bride of Corinth]', nameKoShort: '필린니온', nameFr: 'Philinnion', nameEn: 'Philinnion (The Bride of Amphipolis / Phlegon of Tralles)' },
  'e3015-philosophiehermetique': { nameKo: '헤르메스 철학과 연금술 [Philosophie hermétique / Hermetic Philosophy]', nameKoShort: '헤르메스 철학', nameFr: 'Philosophie hermétique', nameEn: 'Hermetic Philosophy (Crossref to Pierre philosophale)' },
  'e3016-philotanus': { nameKo: '필로타누스 [Philotanus]', nameKoShort: '필로타누스', nameFr: 'Philotanus', nameEn: 'Philotanus (Subordinate Demon of Belial)' },
  'e3017-philtre': { nameKo: '미약(사랑의 마법 묘약) [Philtre / Love Potion]', nameKoShort: '미약', nameFr: 'Philtre', nameEn: 'Love Philtre (Aphrodisiac Potion)' },
  'e3018-phlegeton': { nameKo: '플레게톤(지옥을 감싼 불의 강) [Phlégéton / Phlegethon]', nameKoShort: '플레게톤', nameFr: 'Phlégéton', nameEn: 'Phlegethon (River of Fire in Hades)' },
  'e3019-phooka': { nameKo: '푸카(아일랜드의 검은 야생 망아지 요정) [Phooka / Púca]', nameKoShort: '푸카', nameFr: 'Phooka', nameEn: 'Púca (Irish Shape-Shifting Trickster Spirit)' },
  'e3020-phosphore': { nameKo: '인광과 영구 램프 [Phosphore / Phosphorus and Perpetual Lamps]', nameKoShort: '인광', nameFr: 'Phosphore', nameEn: 'Phosphorus (Crossref to Lampes perpétuelles)' },
  'e3021-phrenologie': { nameKo: '골상학(두개골 측정술) [Phrénologie / Phrenology]', nameKoShort: '골상학', nameFr: 'Phrénologie', nameEn: 'Phrenology (Craniology of Franz Joseph Gall)' },
  'e3022-phylacteres': { nameKo: '필락테리(성구함과 액막이 부적) [Phylactères / Phylacteries (Tefillin)]', nameKoShort: '필락테리', nameFr: 'Phylactères', nameEn: 'Phylacteries (Tefillin and Protective Amulets)' },
  'e3023-phyllorhodomancie': { nameKo: '장미잎점(필로로도만시) [Phyllorhodomancie / Phyllorhodomancy]', nameKoShort: '장미잎점', nameFr: 'Phyllorhodomancie', nameEn: 'Phyllorhodomancy (Divination by Rose Leaves)' },
  'e3024-physiognomonie': { nameKo: '인상학(관상술) [Physiognomonie / Physiognomy]', nameKoShort: '인상학(관상술)', nameFr: 'Physiognomonie', nameEn: 'Physiognomy (Art of Judging Character by Face)' },
  'e3025-piaces': { nameKo: '피아세스(이스파니올라 섬의 마법 사제) [Piaces / Priests of Hispaniola]', nameKoShort: '피아세스', nameFr: 'Piaces', nameEn: 'Piaces (Magician-Priests of Hispaniola)' },
  'e3026-piaches': { nameKo: '피아체스(쿠마나 해안의 원주민 주술사) [Piaches / Priests of Cumana]', nameKoShort: '피아체스', nameFr: 'Piaches', nameEn: 'Piaches (Shaman Priests of Cumana)' },
  'e3027-picardmathurin': { nameKo: '마튀랭 피카르(루비에 수녀원 빙의 사건의 사제) [Picard (Mathurin)]', nameKoShort: '마튀랭 피카르', nameFr: 'Picard (Mathurin)', nameEn: 'Mathurin Picard (Louviers Convent Possessions)' },
  'e3028-picatrix': { nameKo: '피카트릭스(아랍 점성 마술서의 전설적 저자) [Picatrix / Ghayat al-Hakim]', nameKoShort: '피카트릭스', nameFr: 'Picatrix', nameEn: 'Picatrix (Pseudo-Masilma al-Majriti / Ghayat al-Hakim)' },
  'e3029-picdelamirandolejean': { nameKo: '조반니 피코 델라 미란돌라 [Pic de la Mirandole (Jean)]', nameKoShort: '피코 델라 미란돌라', nameFr: 'Pic de la Mirandole (Jean)', nameEn: 'Giovanni Pico della Mirandola (Renaissance Humanist)' },
  'e3030-pichacha': { nameKo: '피샤차(인도 신화의 식인 악귀와 원혼) [Pichacha / Pishacha]', nameKoShort: '피샤차', nameFr: 'Pichacha', nameEn: 'Pishacha (Flesh-Eating Demons of Hindu Lore)' },
  'picollus': { nameKo: '피콜루스(고대 프로이센의 지하세계 신) [Picollus / Peckols]', nameKoShort: '피콜루스', nameFr: 'Picollus (Peckols)', nameEn: 'Picollus (Ancient Prussian God of Death and Underworld)' },
  'e3032-pie': { nameKo: '까치와 흉조의 미신 [Pie / Magpie Omens]', nameKoShort: '까치 흉조 미신', nameFr: 'Pie', nameEn: 'The Magpie as Omen of Misfortune' },
  'e3033-pied': { nameKo: '오른발 문턱 넘기와 발 미신 [Pied / Right Foot Superstition]', nameKoShort: '오른발 문턱 미신', nameFr: 'Pied', nameEn: 'Stepping with Right Foot First' },
  'e3034-piedfourchu': { nameKo: '갈라진 발굽(악마의 식별 표식) [Pied fourchu / Cloven Hoof of the Devil]', nameKoShort: '갈라진 발굽', nameFr: 'Pied fourchu', nameEn: 'Cloven Hoof (Mark of the Disguised Devil)' },
  'e3035-pierreasouhaits': { nameKo: '소원의 돌 [Pierre à souhaits / Wishing Stone]', nameKoShort: '소원의 돌', nameFr: 'Pierre à souhaits', nameEn: 'Wishing Stone (Crossref to Aselle)' },
  'e3036-pierredaigle': { nameKo: '독수리 돌(아에티테스) [Pierre d’aigle / Aetites]', nameKoShort: '독수리 돌', nameFr: 'Pierre d’aigle', nameEn: 'Eagle Stone (Aetites / Pregnancy Talisman)' },
  'e3037-pierredudiable': { nameKo: '악마의 바위(셸레넨 계곡의 전설) [Pierre du diable / Devil\'s Stone]', nameKoShort: '악마의 바위', nameFr: 'Pierre du diable', nameEn: 'Devil\'s Stone (Schöllenen Gorge Legend)' },
  'e3038-pierrephilosophale': { nameKo: '현자의 돌(궁극의 연금술 비약) [Pierre philosophale / Philosopher\'s Stone]', nameKoShort: '현자의 돌', nameFr: 'Pierre philosophale', nameEn: 'Philosopher\'s Stone (Magnum Opus of Alchemy)' },
  'e3039-pierredesante': { nameKo: '건강의 돌(황철석 부적) [Pierre de santé / Health Stone]', nameKoShort: '건강의 돌', nameFr: 'Pierre de santé', nameEn: 'Health Stone (Iron Pyrite Talisman)' },
  'e3040-pierredefeu': { nameKo: '피에르 드 푀(사바트의 불돌 악마) [Pierre-de-feu / Fire-Stone Demon]', nameKoShort: '피에르 드 푀', nameFr: 'Pierre-de-feu', nameEn: 'Pierre-de-feu (Demon of the Sabbat)' },
  'e3041-pierrefort': { nameKo: '피에르 포르(사바트의 반석 악마) [Pierre-fort / Strong-Rock Demon]', nameKoShort: '피에르 포르', nameFr: 'Pierre-fort', nameEn: 'Pierre-fort (Demon of the Sabbat)' },
  'e3042-pierredapone': { nameKo: '피에트로 다바노(파도바의 철학자이자 점성술사) [Pierre d’Apone / Pietro d\'Abano]', nameKoShort: '피에트로 다바노', nameFr: 'Pierre d’Apone', nameEn: 'Pietro d\'Abano (Italian Physician, Astrologer and Philosopher)' },
  'e3043-pierrelabourant': { nameKo: '피에르 라부랑(사바트 마왕의 별칭) [Pierre Labourant / Sabbat Devil Alias]', nameKoShort: '피에르 라부랑', nameFr: 'Pierre Labourant', nameEn: 'Pierre Labourant (Pseudonym of Sabbat Devil)' },
  'e3044-pierrelebrabancon': { nameKo: '브라반트의 피에르(네덜란드의 사기 사술사) [Pierre le Brabançon]', nameKoShort: '브라반트의 피에르', nameFr: 'Pierre le Brabançon', nameEn: 'Pierre the Brabantian (Charlatan Magician)' },
  'e3045-pierrelevenerable': { nameKo: '존자 베드로(클뤼니 수도원장) [Pierre le Vénérable / Peter the Venerable]', nameKoShort: '존자 베드로', nameFr: 'Pierre le Vénérable', nameEn: 'Peter the Venerable (Abbot of Cluny)' },
  'e3046-pierresdanatheme': { nameKo: '파문의 돌무더기(저주의 돌 던지기) [Pierres d’anathème / Stones of Anathema]', nameKoShort: '파문의 돌무더기', nameFr: 'Pierres d’anathème', nameEn: 'Stones of Anathema (Cursing Cairns of Greece)' },
  'e3047-pigeons': { nameKo: '비둘기의 쓸개와 순결 미신 [Pigeons / Dove Bile Superstition]', nameKoShort: '비둘기 미신', nameFr: 'Pigeons', nameEn: 'Doves and Bile (Superstition of Purity)' },
  'e3048-pij': { nameKo: '피(샴 불교의 지하 지옥) [Pij / Siamese Hell]', nameKoShort: '피', nameFr: 'Pij', nameEn: 'Pij (Siamese Underworld of Torments)' },
  'e3049-pilalkarras': { nameKo: '필랄카라스(말라바르의 구마 주술사) [Pilal-Karras]', nameKoShort: '필랄카라스', nameFr: 'Pilal-Karras', nameEn: 'Pilal-Karras (Exorcists of Malabar)' },
  'e3050-pilapiens': { nameKo: '필라피아인(북극해 라플란드 원주민의 샤머니즘) [Pilapiens / Laplanders]', nameKoShort: '필라피아인', nameFr: 'Pilapiens', nameEn: 'Pilapiens (Sami/Lapp Shamanic Traditions)' },
  'e3051-pilatemont': { nameKo: '필라투스산(빌라도 망령의 호수) [Pilate (Mont) / Mount Pilatus]', nameKoShort: '필라투스산', nameFr: 'Pilate (Mont)', nameEn: 'Mount Pilatus (Legend of Pontius Pilate\'s Ghost)' },
  'e3052-piletski': { nameKo: '필레츠키 가문의 처녀 유령 [Piletski / Maidens of Piletski]', nameKoShort: '필레츠키 가문의 유령', nameFr: 'Piletski', nameEn: 'Piletski (Haunted Polish Noble Family)' },
  'e3053-pinet': { nameKo: '피네(환영 마법사) [Pinet / Sorcerer Pinet]', nameKoShort: '피네', nameFr: 'Pinet', nameEn: 'Pinet (Illusionist Sorcerer of Mirandola)' },
  'e3054-pipimarie': { nameKo: '마리 피피(사바트의 헌주관 마녀) [Pipi (Marie)]', nameKoShort: '마리 피피', nameFr: 'Pipi (Marie)', nameEn: 'Marie Pipi (Cupbearer of the Sabbat)' },
  'e3055-piqueur': { nameKo: '피쾨르(마르산 마을의 밤의 사냥꾼 유령) [Piqueur / Spectral Huntsman]', nameKoShort: '피쾨르', nameFr: 'Piqueur', nameEn: 'Piqueur (Phantom Huntsman of Marsanne)' },
  'e3056-piripiris': { nameKo: '피리피리스(페루 인디오의 사냥 탈리스만) [Piripiris]', nameKoShort: '피리피리스', nameFr: 'Piripiris', nameEn: 'Piripiris (Peruvian Hunting Amulets)' },
  'e3057-pison': { nameKo: '피소(게르마니쿠스 저주 암살 음모) [Pison / Gnaeus Calpurnius Piso]', nameKoShort: '피소', nameFr: 'Pison', nameEn: 'Piso (Accused of Cursing Germanicus)' },
  'e3058-pistolevolante': { nameKo: '피스톨 볼랑트(날아오는 마법 금화) [Pistole volante / Flying Coin]', nameKoShort: '피스톨 볼랑트', nameFr: 'Pistole volante', nameEn: 'Flying Pistole (Returning Magic Coin)' },
  'e3059-pithon': { nameKo: '피톤(마들렌 드 라 크루아의 사역마 악마) [Pithon / Familiar Demon]', nameKoShort: '피톤', nameFr: 'Pithon', nameEn: 'Pithon (Familiar Demon of Magdalena de la Cruz)' },
  'e3060-pivert': { nameKo: '딱따구리와 봄의 약초 미신 [Pivert / Woodpecker and Springwort]', nameKoShort: '딱따구리 미신', nameFr: 'Pivert', nameEn: 'Woodpecker and the Springwort Herb' },
  'e3061-planetes': { nameKo: '행성들의 점성술과 악마학적 상응 [Planètes / Planets and Astrology]', nameKoShort: '행성 점성술', nameFr: 'Planètes', nameEn: 'Planets (Astrological and Demonic Correspondences)' },
  'e3062-plantebornes': { nameKo: '플랑트본(경계석 말뚝 귀신) [Plante-bornes / Boundary Stone Ghost]', nameKoShort: '플랑트본', nameFr: 'Plante-bornes', nameEn: 'Plante-bornes (Phantom of the Boundary Mover)' },
  'e3063-platon': { nameKo: '플라톤(수호 다이몬과 영혼 윤회의 철학) [Platon / Plato]', nameKoShort: '플라톤', nameFr: 'Platon', nameEn: 'Plato (Greek Philosopher and Theory of Daimones)' },
  'e3064-plats': { nameKo: '접시점(레카노만시) [Plats / Lecanomancy]', nameKoShort: '접시점', nameFr: 'Plats', nameEn: 'Divination by Dishes (Lecanomancy)' },
  'e3065-pline': { nameKo: '플리니우스(『박물지』의 박물학자) [Pline / Pliny the Elder]', nameKoShort: '플리니우스', nameFr: 'Pline', nameEn: 'Pliny the Elder (Author of Natural History)' },
  'e3066-plogojowitspierre': { nameKo: '페타르 블라고예비치(키실로바의 흡혈귀) [Plogojowits (Pierre) / Petar Blagojević]', nameKoShort: '페타르 블라고예비치', nameFr: 'Plogojowits (Pierre)', nameEn: 'Petar Blagojević (Kisilova Vampire Case 1725)' },
  'e3067-plotin': { nameKo: '플로티노스(이시스 신전의 수호령 소환) [Plotin / Plotinus]', nameKoShort: '플로티노스', nameFr: 'Plotin', nameEn: 'Plotinus (Neoplatonist Philosopher and Guardian Spirit)' },
  'e3068-pluiesmerveilleuses': { nameKo: '불가사의한 비(개구리와 피의 비) [Pluies merveilleuses / Prodigious Rains]', nameKoShort: '불가사의한 비', nameFr: 'Pluies merveilleuses', nameEn: 'Prodigious Rains (Frogs, Blood, and Sulfur)' },
  'e3069-plutarque': { nameKo: '플루타르코스(『신탁의 침묵에 관하여』) [Plutarque / Plutarch]', nameKoShort: '플루타르코스', nameFr: 'Plutarque', nameEn: 'Plutarch (Greek Historian and Demonology)' },
  'e3070-pluton': { nameKo: '플루톤(하데스 / 지옥의 대공) [Pluton / Pluto (Hades)]', nameKoShort: '플루톤', nameFr: 'Pluton', nameEn: 'Pluto (Hades / Arch-Fiend of Hell)' },
  'e3071-plutus': { nameKo: '플루투스(눈먼 재물의 악마) [Plutus / God of Wealth]', nameKoShort: '플루투스', nameFr: 'Plutus', nameEn: 'Plutus (Blind Demon of Wealth)' },
  'e3072-pnigalion': { nameKo: '프니갈리온(가위눌림과 악몽의 악마) [Pnigalion / Ephialtes]', nameKoShort: '프니갈리온', nameFr: 'Pnigalion', nameEn: 'Pnigalion (Demon of Nightmare and Sleep Paralysis)' },
  'e3073-pocel': { nameKo: '포켈(고대 프로이센의 지옥왕) [Pocel / Pocolo]', nameKoShort: '포켈', nameFr: 'Pocel', nameEn: 'Pocel (Ancient Prussian Underworld King)' },
  'e3074-pochwist': { nameKo: '포흐비스트(슬라브 신화의 겨울 폭풍신) [Pochwist / Pogwhist]', nameKoShort: '포흐비스트', nameFr: 'Pochwist', nameEn: 'Pochwist (Slavic God of Winter Storms and Blizzards)' },
  'e3075-pogoda': { nameKo: '포고다(슬라브 신화의 화창한 날씨의 여신) [Pogoda]', nameKoShort: '포고다', nameFr: 'Pogoda', nameEn: 'Pogoda (Slavic Goddess of Fair Weather)' },
  'e3076-pointsdecote': { nameKo: '옆구리 결림의 주술 치료 미신 [Points de côté / Side Stitch Cure]', nameKoShort: '옆구리 결림 치료 미신', nameFr: 'Points de côté', nameEn: 'Superstition of Curing Side Stitch' },
  'e3077-poiriermarguerite': { nameKo: '마르그리트 푸아리에(장 그르니에 재판의 소녀 증인) [Poirier (Marguerite)]', nameKoShort: '마르그리트 푸아리에', nameFr: 'Poirier (Marguerite)', nameEn: 'Marguerite Poirier (Witness in Jean Grenier Werewolf Trial)' },
  'e3078-poisons': { nameKo: '독약과 마법의 혼동 [Poisons / Poisons Confused with Magic]', nameKoShort: '독약과 마법', nameFr: 'Poisons', nameEn: 'Poisons (Veneficia and Sorcery)' },
  'e3079-polkan': { nameKo: '폴칸(슬라브 신화의 반인반마 거인) [Polkan / Polkan the Centaur]', nameKoShort: '폴칸', nameFr: 'Polkan', nameEn: 'Polkan (Slavic Centaur Hero)' },
  'e3080-pollierabraham': { nameKo: '아브라함 폴리에(스위스 용기병의 악마 계약) [Pollier (Abraham)]', nameKoShort: '아브라함 폴리에', nameFr: 'Pollier (Abraham)', nameEn: 'Abraham Pollier (Swiss Dragon Soldier Devil Pact)' },
  'e3081-polycrite': { nameKo: '폴리크리토스(아이톨리아의 두 성별 아기와 전조) [Polycrite / Polycritus]', nameKoShort: '폴리크리토스', nameFr: 'Polycrite', nameEn: 'Polycritus (Aetolian Magistrate and Hermaphrodite Child)' },
  'e3082-polyglossos': { nameKo: '폴리글로소스(도도나의 예언 참나무) [Polyglossos / Dodona Oak]', nameKoShort: '폴리글로소스', nameFr: 'Polyglossos', nameEn: 'Polyglossos (Prophetic Oak of Dodona)' },
  'e3083-polyphage': { nameKo: '다식증 환자와 악마적 폭식 [Polyphage / Polyphagy]', nameKoShort: '다식증 환자', nameFr: 'Polyphage', nameEn: 'Polyphagy (Voracious Eaters and Demonic Hunger)' },
  'e3084-polypheme': { nameKo: '폴리페모스(외눈박이 키클롭스 거인) [Polyphême / Polyphemus]', nameKoShort: '폴리페모스', nameFr: 'Polyphême', nameEn: 'Polyphemus (One-Eyed Cyclops of the Odyssey)' },
  'e3085-polyphidee': { nameKo: '폴리피데스(히페레시아의 예언가) [Polyphidée / Polyphides]', nameKoShort: '폴리피데스', nameFr: 'Polyphidée', nameEn: 'Polyphides (Prophet of Hyperesia)' },
  'e3086-polytheisme': { nameKo: '다신교의 악마적 우상 숭배 [Polythéisme / Polytheism]', nameKoShort: '다신교', nameFr: 'Polythéisme', nameEn: 'Polytheism (Idolatry and Demonic Gods)' },
  'e3087-pommedadam': { nameKo: '아담의 사과(목젖 돌출부 미신) [Pomme d’Adam / Adam\'s Apple]', nameKoShort: '아담의 사과', nameFr: 'Pomme d’Adam', nameEn: 'Adam\'s Apple (Throat Superstition)' },
  'e3088-pomponace': { nameKo: '피에트로 폼포나치 [Pomponace / Pietro Pomponazzi]', nameKoShort: '피에트로 폼포나치', nameFr: 'Pomponace', nameEn: 'Pietro Pomponazzi (Renaissance Rationalist Philosopher)' },
  'e3089-poniatowskacatherine': { nameKo: '카타르지나 포니아토프스카 [Poniatowska (Catherine)]', nameKoShort: '포니아토프스카', nameFr: 'Poniatowska (Catherine)', nameEn: 'Catherine Poniatowska (Crossref to Comenius)' },
  'e3090-pont': { nameKo: '비프로스트(북유럽 신화의 무지개다리) [Pont / Bifröst Bridge]', nameKoShort: '비프로스트 다리', nameFr: 'Pont', nameEn: 'Bifröst (Rainbow Bridge of Norse Gods)' },
  'e3091-pontdadam': { nameKo: '아담의 다리(라마세투의 사주 전설) [Pont d’Adam / Adam\'s Bridge (Rama Setu)]', nameKoShort: '아담의 다리', nameFr: 'Pont d’Adam', nameEn: 'Adam\'s Bridge (Rama Setu Shoals)' },
  'e3092-pontdudiable': { nameKo: '악마의 다리(셸레넨 협곡의 사탄 건축 설화) [Pont du diable / Devil\'s Bridge]', nameKoShort: '악마의 다리', nameFr: 'Pont du diable', nameEn: 'Devil\'s Bridge (Schöllenen Gorge Legend)' },
  'e3093-popoguno': { nameKo: '포포구노(버지니아 원주민의 지하 지옥) [Popoguno / Virginia Indian Underworld]', nameKoShort: '포포구노', nameFr: 'Popoguno', nameEn: 'Popoguno (Underworld of Virginia Algonquians)' },
  'e3094-poppielier': { nameKo: '포피엘 1세(쥐 떼에게 뜯어먹힌 폭군) [Poppiel Ier / Popiel I]', nameKoShort: '포피엘 1세', nameFr: 'Poppiel Ier', nameEn: 'Popiel I (Legendary Polish King Eaten by Mice)' },
  'e3095-porcsdivinationparles': { nameKo: '돼지점(돼지의 행동으로 치는 점술) [Porcs (Divination par les)]', nameKoShort: '돼지점', nameFr: 'Porcs (Divination par les)', nameEn: 'Divination by Pigs (Omens of Weather and Fate)' },
  'e3096-poromhoungse': { nameKo: '파라마함사(인도의 최고위 수행 고행승) [Porom-Houngse / Paramahamsa]', nameKoShort: '파라마함사', nameFr: 'Porom-Houngse', nameEn: 'Paramahamsa (Highest Class of Hindu Ascetics)' },
  'e3097-porphyre': { nameKo: '포르피리오스(신플라톤주의 악마학 철학자) [Porphyre / Porphyry]', nameKoShort: '포르피리오스', nameFr: 'Porphyre', nameEn: 'Porphyry (Neoplatonist Philosopher and Daemonologist)' },
  'e3098-porriciae': { nameKo: '포리키아이(제단 화염에 바치는 희생 내장) [Porriciæ / Porricere]', nameKoShort: '포리키아이', nameFr: 'Porriciæ', nameEn: 'Porriciae (Entrails Cast into Sacrificial Fire)' },
  'e3099-portajeanbaptiste': { nameKo: '잠바티스타 델라 포르타 [Porta (Jean-Baptiste) / Giambattista della Porta]', nameKoShort: '잠바티스타 델라 포르타', nameFr: 'Porta (Jean-Baptiste)', nameEn: 'Giambattista della Porta (Natural Magic and Physiognomy Master)' },
  'e3100-porte': { nameKo: '문지기 정령(만주 타르타르인의 문 수호신) [Porte / Spirit of the Door]', nameKoShort: '문지기 정령', nameFr: 'Porte', nameEn: 'Door Guardian Spirit (Manchu Tartar Lore)' },
  'e3101-portesdessonges': { nameKo: '꿈의 문(뿔의 문과 상아의 문) [Portes des Songes / Gates of Dreams]', nameKoShort: '꿈의 문', nameFr: 'Portes des Songes', nameEn: 'Gates of Dreams (Horn and Ivory)' },
  'e3102-possedes': { nameKo: '빙의자들(테이 마을의 1816년 빙의 소동) [Possédés / Possessed of Teilly]', nameKoShort: '빙의자들', nameFr: 'Possédés', nameEn: 'The Possessed (Teilly Village Possession 1816)' },
  'e3103-possedeesdeflandre': { nameKo: '플랑드르 수녀원 빙의 사건 [Possédées de Flandre]', nameKoShort: '플랑드르 수녀 빙의', nameFr: 'Possédées de Flandre', nameEn: 'Possessed of Flanders (Lille Brigitte Nuns 1613)' },
  'e3104-postelguillaume': { nameKo: '기욤 포스텔 [Postel (Guillaume)]', nameKoShort: '기욤 포스텔', nameFr: 'Postel (Guillaume)', nameEn: 'Guillaume Postel (Renaissance Visionary and Polyglot)' },
  'e3105-potabeurre': { nameKo: '버터 단지 속에 갇힌 악마들 [Pot à beurre / Demons in a Butter Pot]', nameKoShort: '버터 단지 악마', nameFr: 'Pot à beurre', nameEn: 'Demons in a Butter Pot (Exorcism Tale)' },
  'e3106-poudargent': { nameKo: '은빛 이(사탄이 마녀에게 내리는 훈장) [Pou d’argent / Silver Louse]', nameKoShort: '은빛 이', nameFr: 'Pou d’argent', nameEn: 'Silver Louse (Devil\'s Medal of Witchcraft)' },
  'e3107-poudot': { nameKo: '푸도(툴루즈 구두장이 집의 폴터가이스트) [Poudot / Shoemaker of Toulouse]', nameKoShort: '푸도', nameFr: 'Poudot', nameEn: 'Poudot (Haunted Shoemaker of Toulouse)' },
  'e3108-poudres': { nameKo: '마녀의 독가루와 저주 가루 [Poudres / Witchcraft Powders]', nameKoShort: '마녀의 독가루', nameFr: 'Poudres', nameEn: 'Magical Powders of Sorcerers' },
  'e3109-poulenoire': { nameKo: '『검은 암탉』(마도서와 황금 암탉의 비술) [Poule noire / The Black Pullet]', nameKoShort: '검은 암탉', nameFr: 'Poule noire', nameEn: 'The Black Pullet (La Poule Noire Grimoire)' },
  'e3110-poulets': { nameKo: '신성한 닭점 [Poulets / Sacred Chickens]', nameKoShort: '신성한 닭점', nameFr: 'Poulets', nameEn: 'Sacred Chickens (Crossref to Augures)' },
  'e3111-poulpiquets': { nameKo: '풀피케(브르타뉴 거석 요정) [Poulpiquets]', nameKoShort: '풀피케', nameFr: 'Poulpiquets', nameEn: 'Poulpiquets (Crossref to Boléguéans)' },
  'e3112-poupart': { nameKo: '푸파르(유령 출현 사건) [Poupart]', nameKoShort: '푸파르', nameFr: 'Poupart', nameEn: 'Poupart (Crossref to Apparitions)' },
  'e3113-pourang': { nameKo: '포랑(일본 신화 호박 속 최초의 인간) [Pourang / First Man of Japan]', nameKoShort: '포랑', nameFr: 'Pourang', nameEn: 'Pourang (Japanese Creation Myth of First Man)' },
  'e3114-pousha': { nameKo: '푸사(풍화 / 중국 도자기의 신) [Pou-Sha / Tong Bin (God of Porcelain)]', nameKoShort: '도자기 신 풍화', nameFr: 'Pou-Sha', nameEn: 'Pou-Sha (Tong Bin / Chinese Porcelain Deity)' },
  'e3115-poussiere': { nameKo: '먼지 회오리와 요정의 행렬 [Poussière / Dust Devil Superstition]', nameKoShort: '먼지 회오리 미신', nameFr: 'Poussière', nameEn: 'Dust Whirlwinds and Sabbat Spirits' },
  'e3116-powel': { nameKo: '존 파월 판사(영국 마녀재판의 합리주의 판결) [Powel / Sir John Powell]', nameKoShort: '존 파월 판사', nameFr: 'Powel', nameEn: 'Sir John Powell (Rationalist English Judge)' },
  'e3117-praariaseria': { nameKo: '프라 아리아세리아(샴의 전설적 불교 성자) [Pra-Ariaseria]', nameKoShort: '프라 아리아세리아', nameFr: 'Pra-Ariaseria', nameEn: 'Pra-Ariaseria (Legendary Siamese Saint)' },
  'e3118-preadamites': { nameKo: '아담 이전 인류론(프레아다미트) [Préadamites / Pre-Adamites]', nameKoShort: '아담 이전 인류론', nameFr: 'Préadamites', nameEn: 'Pre-Adamites (Isaac La Peyrère\'s Theory)' },
  'e3119-precy': { nameKo: '프레시의 유령 [Précy]', nameKoShort: '프레시의 유령', nameFr: 'Précy', nameEn: 'Précy (Crossref to Rambouillet)' },
  'e3120-predictions': { nameKo: '거짓 예언과 점성술의 기만 [Prédictions / False Predictions]', nameKoShort: '거짓 예언의 역사', nameFr: 'Prédictions', nameEn: 'False Predictions (Fallibility of Astrologers)' },
  'e3121-prejuge': { nameKo: '편견과 미신적 선입견 [Préjugé / Prejudice]', nameKoShort: '편견', nameFr: 'Préjugé', nameEn: 'Prejudice (Irrational Beliefs and Superstition)' },
  'e3122-prelati': { nameKo: '프랑수아 프렐라티(질 드 레의 강령술사) [Prélati / François Prelati]', nameKoShort: '프랑수아 프렐라티', nameFr: 'Prélati', nameEn: 'François Prelati (Crossref to Raiz)' },
  'e3123-presages': { nameKo: '전조와 징조(일상의 불길한 전조 미신) [Présages / Omens and Portents]', nameKoShort: '전조와 징조', nameFr: 'Présages', nameEn: 'Omens and Presages (Everyday Superstitions)' },
  'e3124-prescience': { nameKo: '예지(신의 전지전능한 미래 통찰) [Prescience / Foreknowledge]', nameKoShort: '예지', nameFr: 'Prescience', nameEn: 'Divine Prescience vs. Demonic Guesses' },
  'e3125-preservatifs': { nameKo: '호신 부적과 재앙 방지구 [Préservatifs / Protective Amulets]', nameKoShort: '호신 부적', nameFr: 'Préservatifs', nameEn: 'Protective Charms (Crossref to Amulettes, Cornes, etc.)' },
  'e3126-pressentiment': { nameKo: '육감과 불길한 예감 [Pressentiment / Presentiment]', nameKoShort: '육감과 예감', nameFr: 'Pressentiment', nameEn: 'Presentiments (Calpurnia\'s Nightmare)' },
  'e3127-pressine': { nameKo: '프레신(멜뤼진의 어머니 요정) [Pressine / Mother of Melusine]', nameKoShort: '프레신', nameFr: 'Pressine', nameEn: 'Pressine (Crossref to Mélusine)' },
  'e3128-prestantius': { nameKo: '프레스탄티우스(당나귀 변신 환각) [Prestantius]', nameKoShort: '프레스탄티우스', nameFr: 'Prestantius', nameEn: 'Prestantius (Crossref to Extases)' },
  'e3129-prestiges': { nameKo: '환영과 눈속임 사술 [Prestiges / Prestiges (Demonic Illusions)]', nameKoShort: '환영과 눈속임', nameFr: 'Prestiges', nameEn: 'Prestiges (Optical and Demonic Illusions)' },
  'e3130-pretresnoirs': { nameKo: '검은 사제들(사바트의 타락 사제들) [Prêtres noirs / Black Priests]', nameKoShort: '검은 사제들', nameFr: 'Prêtres noirs', nameEn: 'Black Priests (Officiants of the Black Mass)' },
  'e3131-prieressuperstitieuses': { nameKo: '미신적 기도문(왜곡된 주술 기도) [Prières superstitieuses]', nameKoShort: '미신적 기도문', nameFr: 'Prières superstitieuses', nameEn: 'Superstitious Prayers (Corrupted Folk Charms)' },
  'e3132-prieriosylvestremozzolinode': { nameKo: '실베스트로 마촐리니 다 프리에리오 [Prierio / Sylvester Mazzolini]', nameKoShort: '프리에리오', nameFr: 'Prierio (Sylvestre Mozzolino de)', nameEn: 'Sylvester Mazzolini (Prierias / Dominican Inquisitor)' },
  'e3133-prisier': { nameKo: '프리지에(사바트의 심판 악마) [Prisier / Demon of the Sabbat]', nameKoShort: '프리지에', nameFr: 'Prisier', nameEn: 'Prisier (Inquisitorial Sabbat Demon)' },
  'e3134-prodiges': { nameKo: '기이한 이적과 자연의 징조 [Prodiges / Prodigies and Portents]', nameKoShort: '기이한 이적', nameFr: 'Prodiges', nameEn: 'Prodigies (Strange Natural Marvels and Omens)' },
  'e3135-promethee': { nameKo: '프로메테우스(인류에게 불을 준 티탄) [Prométhée / Prometheus]', nameKoShort: '프로메테우스', nameFr: 'Prométhée', nameEn: 'Prometheus (Titan of Fire and Forethought)' },
  'e3136-pronosticspopulaires': { nameKo: '민간의 기상 예보 미신 [Pronostics populaires / Folk Weather Lore]', nameKoShort: '민간 기상 예보', nameFr: 'Pronostics populaires', nameEn: 'Popular Prognostics (Folk Weather Omens)' },
  'e3137-prophetes': { nameKo: '예언자들과 거짓 선지자의 역사 [Prophètes / Prophets]', nameKoShort: '예언자들의 역사', nameFr: 'Prophètes', nameEn: 'Prophets (Divine Messengers and False Pretenders)' },
  'e3138-proprete': { nameKo: '청결의 미덕과 악마의 오물 [Propreté / Cleanliness and Virtue]', nameKoShort: '청결의 미덕', nameFr: 'Propreté', nameEn: 'Cleanliness (Virtue Loved by God and Hated by Devils)' },
  'e3139-proserpine': { nameKo: '프로세르피나(페르세포네 / 지옥의 대공비) [Proserpine / Persephone]', nameKoShort: '프로세르피나', nameFr: 'Proserpine', nameEn: 'Proserpina (Queen of the Infernal Underworld)' },
  'e3140-prostrophies': { nameKo: '프로스트로피아이(그리스 신화의 재앙을 부르는 악령) [Prostrophies / Prostropaioi]', nameKoShort: '프로스트로피아이', nameFr: 'Prostrophies', nameEn: 'Prostropia (Greek Vengeful Demons)' },
  'e3141-proudhon': { nameKo: '피에르 조제프 프루동(사탄을 찬양한 철학자) [Proudhon / Pierre-Joseph Proudhon]', nameKoShort: '프루동', nameFr: 'Proudhon', nameEn: 'Pierre-Joseph Proudhon (Anarchist Praise of Satan)' },
  'pruflas': { nameKo: '프루플라스(부사스) [Pruflas / Busas (Great Prince of Hell)]', nameKoShort: '프루플라스', nameFr: 'Pruflas (Busas)', nameEn: 'Pruflas (Busas / Grand Duke of Hell)' },
  'e3143-psellusmichel': { nameKo: '미카엘 프셀로스(『악마의 작용에 관하여』) [Psellus (Michel) / Michael Psellos]', nameKoShort: '미카엘 프셀로스', nameFr: 'Psellus (Michel)', nameEn: 'Michael Psellos (Byzantine Polymath and Demonologist)' },
  'e3144-psylles': { nameKo: '프실리족(리비아의 독사 부리는 뱀술사 부족) [Psylles / Psylli]', nameKoShort: '프실리족', nameFr: 'Psylles', nameEn: 'Psylli (Ancient Libyan Snake Charmers)' },
  'e3145-psylotoxotes': { nameKo: '프실로톡소테스(벼룩을 탄 궁수 종족) [Psylotoxotes]', nameKoShort: '프실로톡소테스', nameFr: 'Psylotoxotes', nameEn: 'Psyllotoxotae (Lucian\'s Flea-Riding Archers)' },
  'e3146-psephos': { nameKo: '조약돌점(프세포스) [Psephos / Psephomancy]', nameKoShort: '조약돌점', nameFr: 'Psephos', nameEn: 'Psephomancy (Divination by Pebbles)' },
  'e3147-psychomancie': { nameKo: '영혼점(사이코만시 / 강령술) [Psychomancie / Psychomancy]', nameKoShort: '영혼점', nameFr: 'Psychomancie', nameEn: 'Psychomancy (Crossref to Nécromancie)' },
  'e3148-publius': { nameKo: '푸블리우스의 잘린 머리 [Publius]', nameKoShort: '푸블리우스', nameFr: 'Publius', nameEn: 'Publius (Crossref to Tête)' },
  'e3149-pucel': { nameKo: '푸셀(크로셀) [Pucel / Crocell (Great Duke of Hell)]', nameKoShort: '푸셀', nameFr: 'Pucel', nameEn: 'Crocell (Pucel / Great Duke of Hell)' },
  'e3150-pucelledorleans': { nameKo: '오를레앙의 처녀 [Pucelle d’Orléans / Maid of Orléans]', nameKoShort: '오를레앙의 처녀', nameFr: 'Pucelle d’Orléans', nameEn: 'Maid of Orléans (Crossref to Jeanne d\'Arc)' },
  'e3151-puces': { nameKo: '벼룩 쫓는 주술 미신 [Puces / Flea Superstition]', nameKoShort: '벼룩 쫓는 미신', nameFr: 'Puces', nameEn: 'Superstition of Banishing Fleas' },
  'e3152-puck': { nameKo: '퍽(로빈 굿펠로 / 장난꾸러기 사역 요정) [Puck / Robin Goodfellow]', nameKoShort: '퍽', nameFr: 'Puck', nameEn: 'Puck (Robin Goodfellow / Shakespearean Fairy)' },
  'e3153-punaises': { nameKo: '빈대와 거머리 퇴치 민간요법 [Punaises / Bedbug Folk Medicine]', nameKoShort: '빈대 퇴치 민간요법', nameFr: 'Punaises', nameEn: 'Bedbugs in Vinegar for Leeches' },
  'e3154-purgatoire': { nameKo: '유대교의 연옥(게헨나의 정화) [Purgatoire / Jewish Purgatory (Gehenna)]', nameKoShort: '유대교의 연옥', nameFr: 'Purgatoire', nameEn: 'Jewish Purgatory (Gehenna\'s 11 Months)' },
  'e3155-purrikeh': { nameKo: '푸리케(인도의 물과 불 신명재판) [Purrikeh / Ordeals of India]', nameKoShort: '푸리케', nameFr: 'Purrikeh', nameEn: 'Purrikeh (Indian Fire and Water Ordeals)' },
  'e3156-pursan': { nameKo: '푸르손(쿠르손) [Pursan / Purson (Great King of Hell)]', nameKoShort: '푸르손', nameFr: 'Pursan', nameEn: 'Purson (Pursan / Curson / Great King of Hell)' },
  'e3157-puteorites': { nameKo: '푸테오리타이(우물 숭배 이단 종파) [Putéorites]', nameKoShort: '푸테오리타이', nameFr: 'Putéorites', nameEn: 'Puteorites (Well-Worshipping Sect)' },
  'e3158-pygmees': { nameKo: '피그미족(두루미와 전쟁을 벌인 난쟁이 부족) [Pygmées / Pygmies]', nameKoShort: '피그미족', nameFr: 'Pygmées', nameEn: 'Pygmies of Classical Mythology' },
  'e3159-pyramides': { nameKo: '이집트 피라미드와 마법의 수호 정령 [Pyramides / Pyramids of Egypt]', nameKoShort: '피라미드 전설', nameFr: 'Pyramides', nameEn: 'Pyramids of Egypt (Arabian Legends of Hidden Treasures)' },
  'e3160-pyromancie': { nameKo: '화점술(파이로만시 / 불점) [Pyromancie / Pyromancy]', nameKoShort: '화점술(불점)', nameFr: 'Pyromancie', nameEn: 'Pyromancy (Divination by Fire)' },
  'e3161-pyrrhus': { nameKo: '피로스 왕과 페르세포네의 저주 [Pyrrhus / King Pyrrhus of Epirus]', nameKoShort: '피로스 왕', nameFr: 'Pyrrhus', nameEn: 'Pyrrhus (Curse of Persephone\'s Temple)' },
  'e3162-pythagore': { nameKo: '피타고라스(수비학과 영혼 윤회의 비조) [Pythagore / Pythagoras]', nameKoShort: '피타고라스', nameFr: 'Pythagore', nameEn: 'Pythagoras (Greek Philosopher and Mathematician)' },
  'e3163-pythonissedendor': { nameKo: '엔도르의 무당(사무엘의 망령을 부른 강령술사) [Pythonisse d’Endor / Witch of Endor]', nameKoShort: '엔도르의 무당', nameFr: 'Pythonisse d’Endor', nameEn: 'Witch of Endor (Necromancer of Samuel)' },
  'e3164-pythons': { nameKo: '퓌톤(아폴론의 예언 영령들) [Pythons / Pythonic Spirits]', nameKoShort: '퓌톤 영령', nameFr: 'Pythons', nameEn: 'Pythons (Pythonic Divining Spirits of Apollo)' },

  // Q entries curated headwords (p.567-568)
  'e3165-quakerisme': { nameKo: '퀘이커교의 광신과 황홀경 [Quakerisme / Quakerism]', nameKoShort: '퀘이커교', nameFr: 'Quakerisme', nameEn: 'Quakerism (Tremblers\' Sect)' },
  'e3166-queiranisaac': { nameKo: '이자크 케랑 [Queiran (Isaac)]', nameKoShort: '이자크 케랑', nameFr: 'Queiran (Isaac)', nameEn: 'Isaac Queiran (Sorcerer of Nérac)' },
  'e3167-question': { nameKo: '사법 고문(문초) [Question / Judicial Torture]', nameKoShort: '사법 고문(문초)', nameFr: 'Question', nameEn: 'Judicial Torture (Crossref to Insensibilité)' },
  'e3168-queys': { nameKo: '귀신(중국의 악귀) [Queys / Chinese Demons (Gui)]', nameKoShort: '귀신', nameFr: 'Queys', nameEn: 'Queys (Chinese Demons and Spectres)' },
  'e3169-quintillianites': { nameKo: '퀸틸리아누스파(영지주의 이단) [Quintillianites]', nameKoShort: '퀸틸리아누스파', nameFr: 'Quintillianites', nameEn: 'Quintillianists (Gnostic Sect)' },
  'e3170-quirim': { nameKo: '퀴림(비밀을 토하게 하는 돌) [Quirim / Stone of Betrayal]', nameKoShort: '퀴림', nameFr: 'Quirim', nameEn: 'Quirim (Stone of the Traitor)' },
  'e3171-quivognefemme': { nameKo: '키보뉴 부인 [Quivogne (Femme) / Madame Quivogne]', nameKoShort: '키보뉴 부인', nameFr: 'Quivogne (femme)', nameEn: 'Madame Quivogne (19th-Century Fraudulent Witch)' },

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
  // M entries curated metadata (p.423-485)
  'e2461-ma': { category: 'myth', rank: '일본 민간 신앙에서 인간을 홀리고 곡식을 해치는 여우 요마(Kitsune)에게 깃든 악령', domains: ["신화·전설(Mythe)","일본 신토·민속","여우 요괴(키츠네)","빙의와 홀림","마(魔)의 개념"] },
  'e2462-mab': { category: 'myth', rank: '아일랜드와 영국 켈트 전설에서 잠든 인간의 영혼에 꿈을 불어넣는 요정들의 여왕', domains: ["신화·전설(Mythe)","켈트 요정 전설","티타니아(Titania)","잠과 백일몽","셰익스피어 문학"] },
  'e2463-maberthe': { category: 'superstition', rank: '교만한 허영심 때문에 악령에게 빙의되어 비극적 파멸을 맞은 플랑드르의 여인', domains: ["미신·풍습(Superstition)","플랑드르 빙의 역사","악령 빙의와 구마","허영에 대한 경고","교회 연대기"] },
  'e2464-macallanfanny': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","관 [Cercueil]"] },
  'e2465-macalzeaneuphemie': { category: 'person', rank: '제임스 6세의 배를 침몰시키기 위해 폭풍을 일으켰다는 혐의로 화형된 스코틀랜드 귀족', domains: ["인물·역사(Personnage)","스코틀랜드 노스베릭 마녀재판(1591년)","제임스 1세(6세)","가톨릭 탄압","해상 폭풍 주술"] },
  'e2466-maccarthy': { category: 'myth', rank: '방탕한 젊은 날을 보낸 뒤 악마의 사후 징벌을 피하기 위해 임종 사제를 부른 아일랜드인', domains: ["신화·전설(Mythe)","아일랜드 켈트 민담","망령과 영혼 구원","악마와의 대결","가톨릭 성사"] },
  'e2467-macdonaldarchibald': { category: 'person', rank: '10리 밖을 지나는 사람의 옷차림과 행동을 투시해 낸 스코틀랜드의 천리안 능력자', domains: ["인물·역사(Personnage)","스코틀랜드 제2의 시각(Second Sight)","천리안(Clairvoyance)","원격 투시","영매 현상"] },
  'e2468-machahalla': { category: 'person', rank: '바그다드 왕궁에서 칼리프의 천문도를 작성하고 중세 점성술의 기틀을 세운 대학자', domains: ["인물·역사(Personnage)","아바스 왕조 바그다드","이슬람 황금기 천문학","출생 천궁도 점성술","중세 라틴어 번역 문헌"] },
  'e2469-machines': { category: 'superstition', rank: '알베르투스 마그누스의 말하는 청동 머리 등 중세 민중이 마법으로 오인한 기계공학', domains: ["미신·풍습(Superstition)","자동인형(Automata)","기계공학과 마술의 경계","알베르투스 마그누스","민중의 무지와 착각"] },
  'e2470-machlyes': { category: 'myth', rank: '플리니우스 박물지에 기록된 남성과 여성의 성징을 동시에 지닌 아프리카 부족', domains: ["신화·전설(Mythe)","플리니우스 박물지","고대 아프리카 괴물 설화","양성구유(Androgynos)","기이한 종족"] },
  'e2471-macintos': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","관 [Cercueil]"] },
  'e2472-macreuses': { category: 'superstition', rank: '바다에 떠 있는 썩은 통나무나 바위의 따개비에서 알 없이 부화한다는 중세의 조류 미신', domains: ["미신·풍습(Superstition)","중세 박물학 미신","바너클 기러기(Barnacle Goose)","사순절 육식 허용 논쟁","자연발생설"] },
  'e2473-macrodor': { category: 'person', rank: '1514년 프랑스인 환자의 목숨을 담보로 기괴한 주술적 치료 계약을 맺은 의사', domains: ["인물·역사(Personnage)","1514년 마법 의술","치료 계약과 사탄의 의술","스코틀랜드 의사","기이한 연대기"] },
  'e2474-maczocha': { category: 'myth', rank: '후스파 전쟁 때 처형된 죄수를 태우고 하늘로 솟구친 거대한 괴물이 산다는 동굴 심연', domains: ["신화·전설(Mythe)","폴란드 민담","후스 전쟁(Hussites)","지하 심연과 괴조","기적적 구출 설화"] },
  'e2475-madeleinedelacroix': { category: 'person', rank: '30년 동안 두 마리의 사역마를 부리며 거짓 성흔과 공중부양 기적으로 스페인을 속인 수녀원장', domains: ["인물·역사(Personnage)","스페인 종교재판(Inquisition)","코르도바 성녀의 타락","악마와의 계약(Pacte)","거짓 성흔과 위선"] },
  'e2476-magares': { category: 'superstition', rank: '신랑 신부의 혼인을 가로막는 매듭 주술(에귈레트)로 악명 높았던 캅카스의 마법사들', domains: ["미신·풍습(Superstition)","캅카스 밍그렐리아(조지아)","매듭 마술(Nouer l'aiguillette)","성적 무능화 주술","결혼 방해 주술"] },
  'e2477-mages': { category: 'person', rank: '조로아스터의 가르침을 따르며 불을 숭배하고 천문 점성술을 창시한 고대 페르시아의 사제단', domains: ["인물·역사(Personnage)","고대 페르시아 조로아스터교","마기 사제단","점성술과 천문학","마술(Magie)의 어원"] },
  'e2478-magieetmagiciens': { category: 'superstition', rank: '인간의 능력을 초월한 초자연적 현상을 일으키는 비술의 역사와 흑마술·백마술의 총람', domains: ["미신·풍습(Superstition)","마술의 역사와 철학","백마술과 자연마술","흑마술과 악마 계약","콜랭 드 플랑시 총람"] },
  'e2479-magieislandaise': { category: 'grimoire', rank: '공중의 영령을 부르고 룬 문자 기호(갈드라스타프)로 적을 제압하는 바이킹의 주술 체계', domains: ["마도서·문헌(Grimoire)","아이슬란드 민속 마술","갈드라보크(Galdrabók)","룬 마법과 스태브 부적","세이두르 흑마술"] },
  'e2480-magnetisme': { category: 'superstition', rank: '우주에 흐르는 보이지 않는 유체를 통해 질병을 치유하고 영적 투시를 일으킨다는 18세기 비술', domains: ["미신·풍습(Superstition)","프란츠 안톤 메스메르","메스메리즘(최면술)","몽유병 투시안","칼리오스트로"] },
  'e2481-magoa': { category: 'demon', rank: '지옥의 4대 방위 중 동방을 통치하며 마법진 한가운데에서 소환되는 강력한 악마 대왕', domains: ["악마·마귀(Démon)","지옥 4대 방위 군주","동방의 대왕","의식 마술과 마법진","오컬트 소환 기도문"] },
  'e2482-magog': { category: 'myth', rank: '북유럽 신화에서 고대 스키타이족의 수장이자 신비로운 룬 문자를 창시한 거인', domains: ["신화·전설(Mythe)","스칸디나비아 신화","곡과 마곡(Gog and Magog)","룬 문자의 기원","거인족 전설"] },
  'e2483-mahomet': { category: 'person', rank: '중세 유럽의 악마학과 이단 비판 문헌에서 마술사이자 기만자로 왜곡된 이슬람의 창시자', domains: ["인물·역사(Personnage)","중세 기독교 반이슬람 전설","미라주(천국 승천 여행)","공중 부양 철관 전설","콜랭 드 플랑시 비평"] },
  'e2484-maillatlouise': { category: 'person', rank: '1598년 늑대인간의 빵을 받아먹고 다섯 마리의 악마에게 사지가 마비된 8세 소녀', domains: ["인물·역사(Personnage)","1598년 프랑슈콩테 마녀재판","앙리 보게(Henri Boguet)","늑대인간 자크 보케","악령 빙의와 구마"] },
  'e2485-maimon': { category: 'demon', rank: '인간의 영혼을 낚아채기 위해 보이지 않는 덫과 함정을 놓는 지옥 유혹자들의 군단장', domains: ["악마·마귀(Démon)","지옥 제9계급 악마","유혹자(Tentateur)","올가미와 함정","영혼의 사냥꾼"] },
  'e2486-main': { category: 'divination', rank: '손바닥의 구릉과 손금의 형상을 통해 인간의 수명과 운명을 판독하는 수상학(p.429 삽화)', domains: ["점술·점막(Divination)","루이 브르통 본문 목판화","수상술(Chéromancie)","생명선과 두뇌선","중세 손금 도판"] },
  'e2487-maindegloire': { category: 'grimoire', rank: '교수형당한 죄수의 손을 말려 시체 지방 양초를 꽂아 모든 자물쇠를 열고 사람을 잠재우는 주술', domains: ["마도서·문헌(Grimoire)","도둑들의 마법 부적","사형수의 손","잠과 마비 주술","프티 알베르(Petit Albert)"] },
  'e2488-maininvisible': { category: 'superstition', rank: '허공에서 날아와 인간의 뺨을 치거나 물건을 내던지는 정령과 망령의 불가사의한 타격', domains: ["미신·풍습(Superstition)","가스파르 쇼트의 보편 마술","폴터가이스트 현상","보이지 않는 힘","심령 타격"] },
  'e2489-mainfroi': { category: 'person', rank: '신성로마제국 황제의 아들이자 점성술사의 예언을 맹신하다 전사한 나폴리 군주(p.436 삽화)', domains: ["인물·역사(Personnage)","루이 브르통 본문 목판화","시칠리아 왕국(1254~1266)","호엔슈타우펜 가문","베네벤토 전투와 점성술"] },
  'e2490-maisonensorcelee': { category: 'superstition', rank: '1805년 파리 나자레트 거리의 폐옥에서 밤마다 돌멩이가 쏟아지고 유령이 출몰한 사건', domains: ["미신·풍습(Superstition)","1805년 파리 유령 소동","폴터가이스트(투석 현상)","흉가와 퇴마","도시 괴담"] },
  'e2491-malachechabbalah': { category: 'demon', rank: '유대 카발라에서 사마엘의 명령을 받아 지옥의 일곱 영역을 가득 채우고 죄인을 징벌하는 파괴령', domains: ["악마·마귀(Démon)","유대 카발라(Cabale)","사마엘(Samaël)","파괴의 천사","지옥의 7개 영역"] },
  'e2492-malades': { category: 'superstition', rank: '환자의 얼굴 혈색, 맥박, 베개 밑 약초의 반응으로 회복과 사망을 판별하는 민간 비방(p.436 삽화)', domains: ["미신·풍습(Superstition)","루이 브르통 본문 목판화","임종 징조와 민간 의술","병상의 악령","생사 판정"] },
  'e2493-malafar': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","발라파르 [Valafar]"] },
  'e2494-malaingha': { category: 'myth', rank: '마다가스카르 말라가시 신화에서 하늘, 별, 행성을 회전시키고 천둥을 주관하는 제1계급 천사', domains: ["신화·전설(Mythe)","마다가스카르 말라가시 신화","천체 운행의 영령","우주 창조와 천사","아프리카 토착 신앙"] },
  'e2495-malatasca': { category: 'demon', rank: '시에나의 성녀 카타리나가 지옥의 사탄을 사악하고 볼품없는 가죽 자루로 멸시해 부른 이름', domains: ["악마·마귀(Démon)","시에나의 성녀 카타리나","가톨릭 신비주의","사탄에 대한 경멸","악마의 민간 별칭"] },
  'e2496-malcaduc': { category: 'superstition', rank: '악령의 타격으로 간주된 간질 발작을 막기 위해 순은 반지에 신비한 문자를 새겨 착용한 주술', domains: ["미신·풍습(Superstition)","간질(추락병, Mal caduc)","은반지 호신 부적","악령 빙의 치료","민간 주술 의학"] },
  'e2497-maldonat': { category: 'person', rank: '살라망카와 파리 대학에서 악마 빙의와 마술의 본질을 체계적으로 강의한 스페인 예수회 학자', domains: ["인물·역사(Personnage)","예수회 신학(Compagnie de Jésus)","스페인 살라망카 학파","마녀학과 악마론 강의","16세기 파리 대학"] },
  'e2498-malebete': { category: 'myth', rank: '한밤중 툴루즈 거리를 질주하며 늦은 밤 귀가하는 사람들을 습격했다는 악령 괴수', domains: ["신화·전설(Mythe)","프랑스 랑그도크 툴루즈 민담","야간 괴수 설화","밤의 공포","도시 민속"] },
  'e2499-malebranchenicolas': { category: 'person', rank: '『진리의 탐구』에서 마녀사냥의 광기와 악마적 환각이 병적인 상상력의 전염임을 논증한 철학자', domains: ["인물·역사(Personnage)","오라토리오 수도회","기회원인론(Occasionalism)","진리의 탐구(Recherche de la vérité)","미신과 마녀사냥 비판"] },
  'e2500-malefices': { category: 'superstition', rank: '악마와의 결탁이나 독초와 부적을 이용해 타인에게 질병, 불임, 재앙을 가하는 주술 행위', domains: ["미신·풍습(Superstition)","말레피키움(Maleficium)","마녀재판의 기소 사유","독살과 질병 주술","가축 폐사 저주"] },
  'e2501-maletenadomingina': { category: 'person', rank: '사바트 집회에서 다른 마녀들보다 더 멀리 뛰어넘는 내기를 했다고 자백한 폰타라비의 여인', domains: ["인물·역사(Personnage)","바스크 마녀재판(1609년)","피에르 드 랑크르","폰타라비(온다리비아)","사바트의 기괴한 경기"] },
  'e2502-malheur': { category: 'superstition', rank: '제비 둥지 파괴, 소금 엎지르기, 거울 깨뜨리기 등 가정에 불행을 부른다는 민간 금기', domains: ["미신·풍습(Superstition)","불길한 징조(Omen)","가택의 금기","제비와 귀뚜라미 살생","민간 민속 신앙"] },
  'e2503-malicesdesdemons': { category: 'demon', rank: '카이사리우스 폰 하이스터바흐 연대기에 수록된 경건한 사제들을 시험하는 악마의 짓궂은 음모', domains: ["악마·마귀(Démon)","하이스터바흐의 카이사리우스","기적의 대화(Dialogus Miraculorum)","사제의 유혹","지옥의 속임수"] },
  'e2504-malin': { category: 'demon', rank: '기독교와 유럽 민간 사회에서 사탄과 악령을 두려움과 경계심을 담아 부르던 대중적 칭호', domains: ["악마·마귀(Démon)","사탄의 이명","악령(Esprit malin)","민간 신앙","언령과 금기어"] },
  'e2505-malina': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","안닝가 [Anninga]"] },
  'e2506-mallebranche': { category: 'person', rank: '1618년 파리에서 악마의 환영을 만나 3천 리브르의 황금을 주겠다는 유혹을 받은 점수원', domains: ["인물·역사(Personnage)","1618년 파리 사건","테니스 경기(Jeu de paume)","황금의 유혹과 계약","파리 종교 일화"] },
  'malphas': { category: 'demon', rank: '까마귀의 모습으로 나타나 난공불락의 요새를 짓고 40군단을 지휘하는 지옥 대총재(Plate 44)', legions: 40, domains: ["악마·마귀(Démon)","루이 브르통 68대 목판화","솔로몬 72 악마","지옥 40군단 통솔","요새 건축과 적의 의중 간파"] },
  'e2508-mambres': { category: 'person', rank: '지팡이를 뱀으로 바꾸는 비술로 모세의 신성한 기적에 도전했던 이집트의 궁정 마술사', domains: ["인물·역사(Personnage)","구약 성서 출애굽기","얀네와 얌브레스(Jannès et Jambrès)","이집트 파라오 궁정","모세와의 기적 대결"] },
  'mammon': { category: 'demon', rank: '인간에게 대지를 찢어 금과 보물을 캐내게 만든 7대 죄악 탐욕의 지옥 지배자(Plate 45)', domains: ["악마·마귀(Démon)","루이 브르통 68대 목판화","7대 죄악(탐욕·인색)","존 밀턴 실낙원","황금과 물질 숭배"] },
  'e2510-mammouth': { category: 'myth', rank: '영구동토층에서 발견된 거대한 화석 뼈로 인해 지하 암흑 속에 서식하는 요수로 전승된 거수', domains: ["신화·전설(Mythe)","시베리아 원주민 전설","북아메리카 원주민 민담","빙하시대 거수 화석","지하 요마 설화"] },
  'e2511-man': { category: 'myth', rank: '태국 불교에서 머리에 뱀을 두르고 수많은 팔로 부처의 보리수 정진을 방해한 마왕', domains: ["신화·전설(Mythe)","태국(샴) 불교 신화","마왕 마라(Mara)","솜모나 코돔(석가모니)","보리수 아래의 유혹"] },
  'e2512-mancanas': { category: 'superstition', rank: '바람과 파도를 다스리고 환자를 고친다고 자처하며 주민들을 착취한 마리아나 제도의 주술사(p.440 삽화)', domains: ["미신·풍습(Superstition)","루이 브르통 본문 목판화","마리아나 제도 원주민 신앙","자연 제어 주술","가짜 기적과 사기"] },
  'e2513-mancheabalai': { category: 'superstition', rank: '마법의 환각 연고를 바르고 굴뚝을 통해 사바트 밤하늘로 날아오르는 마녀들의 상징적 도구', domains: ["미신·풍습(Superstition)","사바트 비행(Vol au Sabbat)","마녀의 연고(Onguent)","빗자루의 상징성","마녀재판 기록"] },
  'e2514-mandragores': { category: 'demon', rank: '턱수염이 없고 헝클어진 머리를 한 작은 남자의 모습으로 나타나는 온순한 사역마 요마', domains: ["악마·마귀(Démon)","사역마(Familier)","만드라고라 식물 요정","가택의 수호와 부","프랑스 민간 전승"] },
  'e2515-maneraja': { category: 'myth', rank: '인도 신화에서 물고기 아바타라의 인도를 받아 방주를 타고 대홍수에서 살아남은 인류의 시조', domains: ["신화·전설(Mythe)","인도 신화(마츠야 아바타라)","대홍수 전설","인류의 시조 마누","성서 노아의 비교신화학"] },
  'e2516-manes': { category: 'myth', rank: '고대 로마에서 무덤을 지키고 산 자들에게 길흉을 내리는 지하세계의 조상 영령들', domains: ["신화·전설(Mythe)","고대 로마 종교","조상 숭배와 위령제","지하세계의 신(Dii Manes)","망령과 유령"] },
  'e2517-manfred': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","만프레디 [Mainfroi]"] },
  'e2518-mangtaar': { category: 'myth', rank: '시베리아 야쿠트족 전설에서 여덟 갈래의 사악한 악령 부족이 서식하는 얼어붙은 명계', domains: ["신화·전설(Mythe)","시베리아 야쿠트(사하) 신화","지하 명계","8대 악령 부족","샤머니즘 지옥관"] },
  'e2519-manicheens': { category: 'superstition', rank: '서기 240년 페르시아의 마니가 창시하여 우주를 빛과 어둠의 영원한 투쟁으로 본 이단', domains: ["미신·풍습(Superstition)","페르시아 마니교","선악 이원론","영지주의 이단","중세 카타리파의 기원"] },
  'e2520-manie': { category: 'superstition', rank: '중세와 르네상스 시기에 악마의 빙의로 간주되어 가혹한 구마 의식을 치렀던 극단적 정신질환', domains: ["미신·풍습(Superstition)","정신의학적 광기(Mania)","악령 빙의 오인","중세 구마 의식","콜랭 드 플랑시의 비평"] },
  'e2521-manifestationsfluidiques': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","탁자 회전 강신술 [Tables tournantes]"] },
  'e2522-manipa': { category: 'myth', rank: '타르타리아 탕구트와 바란톨라 왕국에서 숭배된 피라미드형 아홉 머리의 거대 신상', domains: ["신화·전설(Mythe)","중앙아시아 타르타리아","탕구트 왕국","아홉 머리 우상신","동양의 기이한 신상"] },
  'e2523-manitou': { category: 'crossref', rank: '북아메리카 원주민 알곤킨족의 모든 자연물에 깃든 영적 에너지와 정령', domains: ["상호참조","마치 마니투 [Matchi-Manitou]"] },
  'e2524-manto': { category: 'person', rank: '테베의 맹인 예언자 티레시아스의 딸이자 기독교 메시아의 탄생을 예견했다고 전해진 예언녀', domains: ["인물·역사(Personnage)","그리스 신화","티레시아스의 딸","시빌라의 신탁","단테 신곡 지옥편"] },
  'e2525-mansotela': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","베르비기에 [Berbiguier]"] },
  'e2526-many': { category: 'person', rank: '신비로운 그림으로 계시를 전파하고 빛과 어둠의 이원론을 창시한 페르시아의 종교가', domains: ["인물·역사(Personnage)","사산조 페르시아","마니교 창시자","화가이자 예언가","샤푸르 1세"] },
  'e2527-maoun': { category: 'myth', rank: '이슬람 우주론에서 붉은 루비로 빛나며 거대한 독수리 형상의 천사들이 머무는 제3의 하늘', domains: ["신화·전설(Mythe)","이슬람 7층천 우주론","제3천 마운","독수리 형상 천사","미라주(천국 여행기)"] },
  'e2528-maoridath': { category: 'grimoire', rank: '악마의 유혹과 마녀들의 저주 매듭을 파괴하기 위해 알라의 보호를 청하는 피난의 두 수라', domains: ["마도서·문헌(Grimoire)","이슬람 코란(Coran)","알팔라크(새벽)와 안나스(인간)","마술 퇴치 부적","예언자의 주술 치유"] },
  'e2529-marais': { category: 'myth', rank: '고대 작가들이 기록한 북방의 신비한 호수로 아홉 번 잠수하면 깃털이 돋아 새로 변하는 늪', domains: ["신화·전설(Mythe)","고대 그리스·로마 지리학","변신 신화(Métamorphose)","조류 변신 호수","오비디우스 변신 이야기"] },
  'e2530-marat': { category: 'person', rank: '1793년 프랑스 혁명기를 피로 물들인 선동가이자 아스모데우스 악마의 화신으로 풍자된 인물(p.442 삽화)', domains: ["인물·역사(Personnage)","루이 브르통 본문 목판화","프랑스 대혁명(1793년 공포정치)","인민의 벗(L'Ami du peuple)","콜랭 드 플랑시의 풍자"] },
  'e2531-marbas': { category: 'demon', rank: '성난 사자의 모습으로 나타나 은밀한 진실을 밝히고 질병을 내리거나 고치는 36군단의 대총재', legions: 36, domains: ["악마·마귀(Démon)","솔로몬 72 악마","지옥 36군단 통솔","사자의 형상","기계공학과 질병 치유"] },
  'e2532-marc': { category: 'person', rank: '성찬의 포도주를 보라색으로 물들이고 여성 신도들을 최면술로 홀린 2세기의 영지주의자', domains: ["인물·역사(Personnage)","2세기 영지주의(Gnosticisme)","발렌티누스 학파","초기 최면술(Magnétisme)","이레네우스 반이단론"] },
  'e2533-marcdecafeartdedirelabonneav': { category: 'divination', rank: '커피 잔 바닥에 남은 찌꺼기의 침전물 문양을 판독하여 미래의 운명을 점치는 비술', domains: ["점술·점막(Divination)","카페오만시(Caféomancie)","커피점","상징 형상 판독","민간 점술"] },
  'e2534-marceau': { category: 'person', rank: '27세의 나이로 전사하기 직전 자신의 비극적 최후를 예언하는 기괴한 꿈을 꾼 프랑스 명장', domains: ["인물·역사(Personnage)","프랑스 제1공화국","혁명 전쟁 명장","예지몽(Songe prémonitoire)","알텐키르헨 전투"] },
  'e2535-marcellus': { category: 'person', rank: '로마 황제 마르쿠스 아우렐리우스 시대에 늑대인간 증후군을 의학적 시로 저술한 의사', domains: ["인물·역사(Personnage)","고대 그리스·로마 의학","팜필리아의 시데","늑대인간병(Lycanthropie)","임상적 광견병과 변신망상"] },
  'marchocias': { category: 'demon', rank: '그리핀 날개와 독사 꼬리를 한 암늑대 형상으로 입에서 불을 뿜는 30군단의 대후작(Plate 46)', legions: 30, domains: ["악마·마귀(Démon)","루이 브르통 68대 목판화","솔로몬 72 악마","지옥 30군단 통솔","용맹한 전사 악마","천상 복귀의 희망"] },
  'e2537-marcionites': { category: 'superstition', rank: '구약 성서의 창조신을 가혹한 악신 데미우르고스로 규정하고 신약의 사랑의 신만을 인정한 종파', domains: ["미신·풍습(Superstition)","초대교회 교부시대","마르키온(Marcion)","이원론(Dualisme)","영지주의 이단"] },
  'e2538-mardi': { category: 'superstition', rank: '프랑스어로 R 철자가 들어간 날에 손톱을 깎으면 부스럼과 재앙이 닥친다는 민간 미신', domains: ["미신·풍습(Superstition)","요일 미신","손톱 깎기 금기","민간 주술 신앙","신체 금기"] },
  'e2539-marechaldesalon': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","미셸 [Michel]"] },
  'e2540-marentakein': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","귀테블 [Guthevl]"] },
  'e2541-margaritomancie': { category: 'divination', rank: '화로 곁에서 달군 진주 위에 거꾸로 엎은 유리잔의 뜀박질로 도둑의 이름을 밝히는 점술', domains: ["점술·점막(Divination)","진주 점술","도둑 색출 비술","가열 점술","고대 점성 비법"] },
  'e2542-marguerite': { category: 'person', rank: '가난한 쌍둥이 어머니를 모욕했다가 저주를 받아 한 번에 365명의 아이를 출산한 13세기 백작부인', domains: ["인물·역사(Personnage)","13세기 네덜란드 전설","헤네베르크 백작부인","모욕에 대한 신벌","헤이그 로스다위넌의 365 아이"] },
  'e2543-marguerite': { category: 'person', rank: '보이지 않는 사역마 악령의 속삭임을 듣고 사람들의 감추어진 비밀을 투시한 이탈리아 여인(p.445 삽화)', domains: ["인물·역사(Personnage)","루이 브르통 본문 목판화","사역마(Esprit familier)","랑글레 뒤프레누아 기록","비밀 투시"] },
  'e2544-margueritedenavarre': { category: 'person', rank: '『엡타메롱』의 저자이자 밤하늘의 불길한 혜성을 목격하고 자신의 죽음을 예견한 르네상스 여왕', domains: ["인물·역사(Personnage)","프랑수아 1세의 누이","나바라 왕국","엡타메롱(Heptaméron)","혜성과 죽음의 징조"] },
  'e2545-mariachodemoleres': { category: 'person', rank: '19세 소녀의 고발로 사바트에서 두꺼비 기름을 만들고 아이들을 해친 죄로 기소된 바스크 마녀', domains: ["인물·역사(Personnage)","1609년 바스크 마녀재판","피에르 드 랑크르","사바트 독약 조제","두꺼비 기름"] },
  'e2546-mariage': { category: 'superstition', rank: '사과 껍질 던지기, 신발 벗어 던지기, 한밤중 거울 보기로 배필의 얼굴을 보는 민간 비술', domains: ["미신·풍습(Superstition)","배우자 예언 점술","성 요한 축일 전야","신발 던지기","러시아와 유럽의 혼인 미신"] },
  'e2547-mariagedudiable': { category: 'myth', rank: '독일 신비주의 철학자 요제프 괴레스가 『신비주의』에서 묘사한 죄악과 악마의 결합 우화', domains: ["신화·전설(Mythe)","요제프 괴레스(Joseph Görres)","기독교 신비주의(Christliche Mystik)","죄악의 알레고리","도덕적 풍자 우화"] },
  'e2548-mariagranemarie': { category: 'person', rank: '사바트에서 사탄이 뿔 달린 거대한 짐승과 아름다운 귀족의 모습으로 변신함을 증언한 여인', domains: ["인물·역사(Personnage)","피에르 드 랑크르 저서","1609년 사바트 목격담","악마의 변신","바스크 마녀"] },
  'e2549-marignyenguerrandde': { category: 'person', rank: '필리프 4세의 수석 재상으로 국왕을 저주하는 밀랍 주술 인형을 제작했다는 누명을 쓰고 처형된 권신', domains: ["인물·역사(Personnage)","프랑스 카페 왕조","필리프 4세와 루이 10세","몽포콩 교수대(Montfaucon)","밀랍 인형 저주(Envoûtement)"] },
  'e2550-marionnettes': { category: 'superstition', rank: '살아 움직이는 듯한 정교한 인형극을 보고 작은 악령들이 조종한다고 믿었던 중세 민중의 미신', domains: ["미신·풍습(Superstition)","인형극(Marionnettes)","브리오셰(Brioché)의 원숭이","사역마 인형 착각","민중의 미신"] },
  'e2551-marissane': { category: 'myth', rank: '마법 연고를 바르지 않고도 마녀들의 강풍에 휩쓸려 사바트 축제로 날아간 소년의 전설', domains: ["신화·전설(Mythe)","바스크 민담","사바트 공중 납치","공중 비행","피에르 드 랑크르 연대기"] },
  'e2552-marius': { category: 'person', rank: '게르만족과의 대전쟁에서 스키타이 여마술사 마르타의 신탁을 받아 승리를 거둔 로마 집정관', domains: ["인물·역사(Personnage)","고대 로마 공화정","집정관 가이우스 마리우스","시리아 예언녀 마르타","전쟁 점술과 신탁"] },
  'e2553-marlethomasde': { category: 'person', rank: '루이 6세 치세에 백성들을 산 채로 매달고 고문하여 사탄의 화신으로 불린 잔혹한 영주', domains: ["인물·역사(Personnage)","12세기 프랑스 봉건 영주","루이 6세 치세 연대기","중세 잔혹 행위","사탄의 화신"] },
  'e2554-marlowe': { category: 'person', rank: '『파우스트 박사의 비극』으로 지옥의 메피스토펠레스를 생생하게 묘사하고 결투로 요절한 극작가', domains: ["인물·역사(Personnage)","엘리자베스조 영국 문학","파우스트 박사의 비극","메피스토펠레스 소환","무신론 혐의와 결투"] },
  'e2555-marot': { category: 'myth', rank: '쿠란 제2장에 기록된 천사로 바빌론에서 인간 여인의 유혹에 빠져 주술을 가르친 타락 천사', domains: ["신화·전설(Mythe)","이슬람 쿠란 제2장(바카라)","하루트와 마루트(Harut et Marut)","바빌론의 마술 전수","거꾸로 매달린 천사"] },
  'e2556-marquedudiable': { category: 'superstition', rank: '사바트에서 사탄이 발톱이나 이빨로 마녀의 살갗에 새겨 넣었다는 바늘로 찔러도 통증 없는 낙인', domains: ["미신·풍습(Superstition)","마녀재판의 증거","바늘 찌르기 시험(Pricking)","악마의 낙인(Stigma diabolicum)","무통증 부위"] },
  'e2557-marquisdelenfer': { category: 'demon', rank: '페닉스, 키메리에스, 안드라스 등 지옥 군주들 아래에서 수십 개 군단을 통솔하는 고위 지휘관', domains: ["악마·마귀(Démon)","지옥 귀족 위계","대후작(Grand Marquis)","솔로몬 72 악마 계급","지옥 군단 통수권"] },
  'e2558-marsay': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","오베라이트 [Obereit]"] },
  'e2559-martibelsarenaouserena': { category: 'person', rank: '15세기 수아송 교구에서 사바트에 참석하여 마귀들과 춤을 추었다는 목격담으로 기소된 마녀', domains: ["인물·역사(Personnage)","15세기 프랑스 마녀재판","수아송 교구","사바트의 윤무(Ronde)","마녀 고발"] },
  'e2560-martinsaint': { category: 'person', rank: '거지에게 군복 외투를 베풀고 미사 중에 난입한 사탄을 신성한 위엄으로 제압한 성인(p.448 삽화)', domains: ["인물·역사(Personnage)","루이 브르통 본문 목판화","투르의 주교 성인","사탄의 조롱과 퇴치","가톨릭 성인전(황금전설)"] },
  'e2561-martinmarie': { category: 'person', rank: '이웃 농가의 소와 말을 저주 마술로 몰살시킨 혐의로 체포된 피카르디의 여인', domains: ["인물·역사(Personnage)","프랑스 피카르디 마녀재판","가축 살해 주술","질병의 저주","마녀의 원한"] },
  'e2562-martinthomas': { category: 'person', rank: '1816년 밭을 갈다 대천사의 계시를 받고 국왕 루이 18세를 독대해 비밀 경고를 전한 농부(p.449 삽화)', domains: ["인물·역사(Personnage)","루이 브르통 본문 목판화","1816년 보스 지방의 기적","대천사 라파엘 환시","루이 18세 독대"] },
  'e2563-martinet': { category: 'demon', rank: '마법사를 수행하며 자신의 허락 없이는 어떠한 마술도 행하지 못하도록 통제한 까다로운 사역마', domains: ["악마·마귀(Démon)","사역마(Démon familier)","마법사의 종복","지옥의 계약 조건","마술 통제"] },
  'e2564-martre': { category: 'superstition', rank: '러시아 민간 전승에서 마녀의 저주와 악령의 침투를 완벽하게 차단한다고 믿어진 동물 모피', domains: ["미신·풍습(Superstition)","러시아 민간 신앙","담비 모피(Martre)","방호 주술(Apotropaïque)","동물 부적"] },
  'e2565-martym': { category: 'demon', rank: '건장한 남성의 몸에 뱀 꼬리를 달고 창백한 말 위에 올라탄 30군단의 지옥 대공', legions: 30, domains: ["악마·마귀(Démon)","솔로몬 72 악마","바틴(Bathin) 동일시","지옥 30군단 통솔","공간 이동과 약초학"] },
  'e2566-mascarades': { category: 'superstition', rank: '태양신 미트라의 성좌 제의에서 사자, 까마귀, 늑대의 가면을 쓰고 춤추던 고대 의식의 잔재', domains: ["미신·풍습(Superstition)","고대 갈리아 제의","미트라 밀의(Mithraïsme)","동물 가면 변장","사육제(카니발)의 기원"] },
  'e2567-massaliens': { category: 'superstition', rank: '모든 인간이 태어날 때부터 악마를 품고 태어나며 오직 끊임없는 기도로 침을 뱉어야 구원받는다는 종파', domains: ["미신·풍습(Superstition)","4세기 동방 초대교회","에우키테스(기도하는 자들)","침 뱉기와 코 풀기 구마","체계적 악령관"] },
  'e2568-mastication': { category: 'superstition', rank: '무덤 속 시체가 돼지처럼 수의와 자신의 살점을 씹어먹으며 마을에 흑사병을 퍼뜨린다는 흡혈귀 미신', domains: ["미신·풍습(Superstition)","시체 저작론(De Masticatione Mortuorum)","슬라브·독일 흡혈귀 신앙","흑사병과 무덤의 소리","발터 미하엘 란프트"] },
  'e2569-mastiphal': { category: 'demon', rank: '비잔티움 연대기 작가 케드레누스가 인용한 외경 모세의 묵시록에 등장하는 악마들의 군주', domains: ["악마·마귀(Démon)","비잔티움 연대기 작가 케드레누스","외경 희년서(Jubilees)","마스테마(Mastema)","사탄과 유혹자"] },
  'e2570-matchimanitou': { category: 'myth', rank: '알곤킨 인디언들이 혹독한 질병, 기근, 눈보라의 재앙을 내린다고 두려워한 어둠의 악령', domains: ["신화·전설(Mythe)","북아메리카 원주민 알곤킨 신화","선악 이원론","선한 마니투와 악한 마니투","자연의 공포"] },
  'e2571-matiere': { category: 'superstition', rank: '영적 신성을 외면하고 눈앞의 물질과 육체를 신격화함으로써 오컬트 비술이 태동했다는 신학적 비판', domains: ["미신·풍습(Superstition)","오컬트 철학 비판","물질 숭배","카발라 신비주의","콜랭 드 플랑시 고찰"] },
  'e2572-matignonjacquesgoyonde': { category: 'person', rank: '앙리 3세와 앙리 4세를 섬기며 뛰어난 군공을 세웠으나 정적들로부터 마술사라는 모함을 받은 장군', domains: ["인물·역사(Personnage)","프랑스 종교전쟁","앙리 4세의 원수","마티뇽 가문","정적의 마술 모함"] },
  'e2573-matignonlepade': { category: 'person', rank: '1861년 『초자연의 문제』를 출간하여 당대 강신술과 신비 현상을 가톨릭 시각에서 해부한 신학자', domains: ["인물·역사(Personnage)","예수회 신부","초자연의 문제(1861년)","19세기 강신술 비판","가톨릭 변증학"] },
  'e2574-matthieulaensberg': { category: 'person', rank: '17세기부터 수백 년간 서민들의 날씨와 운명을 예언한 베스트셀러 『리에주 연감』의 전설적 저자', domains: ["인물·역사(Personnage)","벨기에 리에주","리에주 연감(Almanach de Liège)","민간 점성술","기상 예언"] },
  'e2575-matzou': { category: 'myth', rank: '중국 연안과 동남아시아 뱃사람들을 풍랑에서 구원하는 바다의 여신(천상성모)', domains: ["신화·전설(Mythe)","중국 도교·민간 신앙","바다의 여신 마조(媽祖)","천상성모","해양 안전 수호"] },
  'e2576-maupertuis': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","환각 [Hallucination]"] },
  'e2577-maurice': { category: 'person', rank: '582년 비잔티움 제국 황제로 즉위하였으며 어린 시절 요정들에게 공중으로 납치되었던 군주', domains: ["인물·역사(Personnage)","비잔티움 제국(582~602)","요정 납치 설화(Changelin)","기이한 유년기","포카스의 반란"] },
  'e2578-mauryalfred': { category: 'person', rank: '방대한 고증으로 『마술과 점성술』을 저술하여 초자연 현상을 인간 정신의 착각으로 규명한 학자', domains: ["인물·역사(Personnage)","19세기 프랑스 학술원","마술과 점성술(La Magie et l'Astrologie)","꿈의 심리학","수면마비(가위눌림)"] },
  'e2579-mauryjeansiffrein': { category: 'person', rank: '프랑스 대혁명기 왕당파를 옹호하다가 파리 거리의 행상인들에게 악마적 풍자의 표적이 된 추기경', domains: ["인물·역사(Personnage)","프랑스 대혁명(1792년)","왕당파 가톨릭 추기경","파리의 풍자 팸플릿","거리 행상의 조롱"] },
  'e2580-mecanique': { category: 'superstition', rank: '보캉송의 오리와 시계 장치 자동인형이 무지한 민중에게 마법으로 비쳤던 과학사(p.451 삽화)', domains: ["미신·풍습(Superstition)","루이 브르통 본문 목판화","자동인형(Automate)","보캉송(Vaucanson)","과학과 마술의 경계"] },
  'e2581-mecasphins': { category: 'grimoire', rank: '구약 성서 신명기에 금지된 부류로 시체 뼈와 독초를 달여 흑마술을 행한 고대 마술사들', domains: ["마도서·문헌(Grimoire)","히브리 성서(메카셰핌)","칼데아 점성술","시체 유골 주술","독초 마법"] },
  'e2582-mechant': { category: 'demon', rank: '선함과 조화의 정반대편에서 모든 죄악과 파멸의 시원이 되는 사탄의 근원적 칭호', domains: ["악마·마귀(Démon)","사탄의 신학적 칭호","악의 원리(Mal)","복음서의 악령","빛과 어둠"] },
  'e2583-mechtildesainte': { category: 'person', rank: '성녀 힐데가르트의 뒤를 이어 지옥의 끔찍한 고통과 천상의 은총을 환시로 기록한 신비가', domains: ["인물·역사(Personnage)","13세기 독일 신비주의","헬프타 수녀원","성녀 게르트루트","지옥과 천상의 환시"] },
  'e2584-medecine': { category: 'superstition', rank: '오스만 튀르크와 이집트에서 부적과 악마 퇴치에 의존하던 의술이 합리적 과학으로 발전한 역사', domains: ["미신·풍습(Superstition)","의학사(Histoire de la médecine)","부적과 주술 의술","터키와 이집트의 의학 발전","미신 타파"] },
  'e2585-medee': { category: 'myth', rank: '이아손의 황금 양털 원정을 돕고 노인을 회춘시키는 솥단지 마술을 부린 그리스 신화의 대마녀', domains: ["신화·전설(Mythe)","그리스 신화(아르고호 원정)","헤카테의 여사제","회춘의 솥단지 마술","비극적 복수"] },
  'e2586-medie': { category: 'superstition', rank: '고대 메디아 왕국에서 산출되어 눈먼 자의 시력을 회복시키고 질병을 쫓는다는 마법의 돌', domains: ["미신·풍습(Superstition)","고대 메디아 왕국","광물 마법(Lithothérapie)","시력 회복 신비석","고대 박물학 설화"] },
  'e2587-meerman': { category: 'myth', rank: '상반신은 수염 난 건장한 사나이이고 하반신은 물고기 꼬리를 한 발트해 연안의 바다 정령', domains: ["신화·전설(Mythe)","발트해 해양 전설","바다 사나이(Merman)","물고기 인간","폭풍의 징조"] },
  'e2588-megalanthropogenesie': { category: 'superstition', rank: '임신 중 아름다운 명화와 영웅들의 조각상을 응시하여 천재와 미남미녀를 잉태한다는 18세기 비술', domains: ["미신·풍습(Superstition)","18세기 프랑스 의학 이론","로베르 의사(Dr. Robert)","모성 상상력(Imagination maternelle)","태교 미신"] },
  'e2589-mehdi': { category: 'person', rank: '1841년 아라비아 사막에 출현하여 메시아를 자처하며 메카를 위협한 종교 선동가(p.452 삽화)', domains: ["인물·역사(Personnage)","루이 브르통 본문 목판화","이슬람 구원자 마흐디(Mahdi)","1841년 아라비아 소동","거짓 메시아"] },
  'e2590-meigmalloch': { category: 'myth', rank: '스코틀랜드 하일랜드 전설에서 아름다운 처녀의 모습으로 나타나 농가를 돕는 요정', domains: ["신화·전설(Mythe)","스코틀랜드 하일랜드 민담","가택 요정 브라우니","처녀 형상 요정","가택 평화"] },
  'e2591-melampus': { category: 'person', rank: '뱀이 귀를 핥아주어 동물의 언어를 해득하고 사마귀와 손금으로 운명을 점친 고대 예언자', domains: ["인물·역사(Personnage)","그리스 신화","치유자이자 예언자","점술서(신체 사마귀 점술)","동물의 언어 해득"] },
  'e2592-melanchthon': { category: 'person', rank: '마르틴 루터의 수제자이자 종교개혁의 이론가로서 밤마다 나타나는 망령과 점성술을 굳게 믿은 학자', domains: ["인물·역사(Personnage)","독일 종교개혁","루터의 동지","망령(Revenant) 신앙","점성술 옹호"] },
  'e2593-melancolie': { category: 'superstition', rank: '체내 흑담즙이 끓어올라 영혼을 어둡게 물들일 때 사탄이 파고들어 광기를 일으킨다는 중세 의학관', domains: ["미신·풍습(Superstition)","4체액설(흑담즙)","악마의 목욕탕(Bain du diable)","우울증과 악령 빙의","중세 정신병리학"] },
  'e2594-melchisedech': { category: 'person', rank: '성서 창세기에 떡과 포도주로 아브라함을 축복한 지고한 사제왕이자 천상의 영으로 숭배된 인물', domains: ["인물·역사(Personnage)","구약 성서 창세기 14장","살렘의 왕이자 지극히 높으신 신의 사제","멜키세덱파(영지주의 이단)","대천사 미카엘 동일시"] },
  'melchom': { category: 'demon', rank: '허리춤에 돈주머니를 차고 지옥의 모든 공직자 악마들에게 급료를 지급하는 지옥 재무관(Plate 47)', domains: ["악마·마귀(Démon)","루이 브르통 68대 목판화","지옥 궁정 관직","지옥의 회계관(Payeur)","금화 주머니"] },
  'e2596-melekalmout': { category: 'myth', rank: '수많은 눈과 날개를 지니고 지상의 모든 인간의 수명이 다할 때 영혼을 거두는 죽음의 천사', domains: ["신화·전설(Mythe)","이슬람 천사론","아즈라엘(Azraël)","죽음의 천사(말라크 알마우트)","생명의 서"] },
  'e2597-melissa': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","꿀벌 [Abeilles]"] },
  'e2598-meleze': { category: 'superstition', rank: '타르타리아 원주민들이 악령이 깃들어 밤마다 비명을 지른다고 믿어 벌목을 금기시한 나무', domains: ["미신·풍습(Superstition)","타르타리아 민간 전승","식물 마법","저주받은 나무","샤머니즘 수목 숭배"] },
  'e2599-melusine': { category: 'myth', rank: '매주 토요일 하반신이 거대한 뱀으로 변하며 성의 몰락 직전 높은 망루에서 비명을 지르는 요정', domains: ["신화·전설(Mythe)","프랑스 푸아투 전설","뤼지냥 가문 시조","뱀 여인 변신 설화","비극적 금기 파기"] },
  'e2600-melye': { category: 'myth', rank: '그리스 신화의 물푸레나무 님프이자 요정들의 권능에도 엄격한 위계가 존재함을 보여주는 항목', domains: ["신화·전설(Mythe)","그리스 신화(헤시오도스)","물푸레나무 님프","요정의 능력 서열","자연의 정령"] },
  'e2601-menah': { category: 'myth', rank: '아브라함을 유혹하러 온 사탄을 향해 일곱 개의 자갈돌을 던져 쫓아내는 이슬람의 성스러운 계곡', domains: ["신화·전설(Mythe)","이슬람 메카 성지순례(하지)","미나 계곡(Mina)","자마라트(악마의 돌기둥 투석)","아브라함의 믿음"] },
  'e2602-menandre': { category: 'person', rank: '시몬 마구스의 수제자로서 안티오키아에서 마술을 가르치며 자신을 불사의 구원자로 칭한 이단', domains: ["인물·역사(Personnage)","초대교회 교부 문헌","시몬 마구스의 제자","안티오키아 영지주의","불로불사의 약속"] },
  'e2603-menassehbenisrael': { category: 'person', rank: '암스테르담에서 최초의 히브리어 인쇄소를 세우고 카발라와 유대 신비주의를 유럽에 전파한 대학자', domains: ["인물·역사(Personnage)","17세기 네덜란드 유대인 사회","암스테르담 랍비","탈무드와 영혼 불멸","크롬웰과의 협상"] },
  'e2604-menestrierclaudefrancois': { category: 'person', rank: '『수수께끼 이미지의 철학』을 저술하여 신비주의 상징과 오컬트 문양을 합리적으로 해독한 학자', domains: ["인물·역사(Personnage)","예수회 대학자(1631~1705)","문장학과 상징학","수수께끼 이미지의 철학","축제 연출가"] },
  'e2605-meneursdeloups': { category: 'superstition', rank: '호각이나 비밀 주문으로 수십 마리의 야생 늑대들을 복종시켜 사람을 습격하게 만든 마법사', domains: ["미신·풍습(Superstition)","프랑스 푸아투와 베리 민담","늑대몰이꾼(Meneur de loups)","동물 지배 주술","뤼지냥 성채"] },
  'e2606-menippe': { category: 'person', rank: '부유하고 아름다운 페니키아 여인으로 둔갑한 식인 흡혈귀 라미아와 결혼하려다 구출된 청년', domains: ["인물·역사(Personnage)","티아나의 아폴로니우스 전기","필로스트라토스","라미아(Lamia / Succube)","환영의 파괴와 구출"] },
  'e2607-menjoin': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","쇼로피크 [Chorropique]"] },
  'e2608-menra': { category: 'myth', rank: '아람어 타르굼과 유대 신비주의에서 우주를 무에서 창조한 신의 거룩한 로고스', domains: ["신화·전설(Mythe)","유대 신비주의(Cabale)","타르굼(Targum)","로고스(Logos) / 말씀","천지창조의 권능"] },
  'e2609-mensonge': { category: 'demon', rank: '신약 성서 요한복음에서 예수 그리스도가 사탄을 규정한 가장 근본적인 악마학적 명제', domains: ["악마·마귀(Démon)","신약 성서 요한복음 8장 44절","거짓의 아비(Père du mensonge)","악마의 속임수","기독교 신학"] },
  'e2610-mephistopheles': { category: 'demon', rank: '파우스트 전설과 괴테 문학에서 모든 창조를 부정하며 냉소적인 조소로 영혼을 사냥하는 악마', domains: ["악마·마귀(Démon)","파우스트 전설","요한 볼프강 폰 괴테","냉소적 회의주의","영혼의 계약(Pacte)"] },
  'e2611-mercana': { category: 'grimoire', rank: '에스겔서의 불타는 천상 전차를 관조하여 영계의 가장 깊은 신비를 해독하는 고등 카발라', domains: ["마도서·문헌(Grimoire)","유대 카발라(Cabale)","메르카바 신비주의(Merkavah)","에스겔의 병거 환시","천상 보좌의 비의"] },
  'e2612-mercatimichel': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","피치노 [Ficino]"] },
  'e2613-mercier': { category: 'person', rank: '『파리의 풍경』과 『철학적 꿈』을 저술하여 당대 파리의 미신과 오컬트 풍속을 생생하게 기록한 작가', domains: ["인물·역사(Personnage)","18세기 계몽주의 문학","파리의 풍경(Tableau de Paris)","철학적 꿈(Songes philosophiques)","풍속 관찰기"] },
  'e2614-mercredi': { category: 'superstition', rank: '마녀들이 한밤중 사바트에 모여 거꾸로 된 연도를 낭송하고 악마극을 상연하는 요일', domains: ["미신·풍습(Superstition)","사바트 요일(금요일과 수요일)","악마의 연도(Litanie)","요일 미신","마녀재판 기록"] },
  'e2615-mercure': { category: 'myth', rank: '헤르메스 지팡이를 쥐고 날개 달린 모자를 쓴 채 죽은 자의 영혼을 하데스로 인도하는 신', domains: ["신화·전설(Mythe)","로마 신화(헤르메스)","사이코폼프(영혼 인도자)","카두케우스 지팡이","지하 명계의 사자"] },
  'e2616-meres': { category: 'myth', rank: '프랑스 브르타뉴 민담에서 백조의 모습으로 강물 위를 떠다니며 가정을 축복하는 가택 요정', domains: ["신화·전설(Mythe)","프랑스 브르타뉴 민담","어머니 요정(Les Mères)","백조 변신(Cygne)","가택의 축복"] },
  'e2617-merle': { category: 'superstition', rank: '지빠귀의 오른쪽 날개 깃털을 붉은 명주실로 묶어 베개 밑에 두면 잠을 잘 수 없다는 주술', domains: ["미신·풍습(Superstition)","동물 주술","지빠귀(Merle)","불면증 주술 부적","중세 마법 비방"] },
  'e2618-merlin': { category: 'myth', rank: '인큐버스 악마와 순결한 처녀 사이에서 태어나 아서왕을 보좌하고 원탁의 기사를 창설한 마법사(p.455 삽화)', domains: ["신화·전설(Mythe)","루이 브르통 본문 목판화","아서왕 전설(Matière de Bretagne)","인큐버스 악마의 아들","스톤헨지와 원탁"] },
  'e2619-merovee': { category: 'person', rank: '서기 450년 프랑크 왕국 메로빙거 왕조를 창시하였으며 바다 요마의 피를 이어받았다는 전설의 군주', domains: ["인물·역사(Personnage)","프랑크 왕국 메로빙거 왕조","퀴노타우루스(Quinotaure)","카탈라우눔 전투","괴물 혈통 전설"] },
  'e2620-merveilles': { category: 'superstition', rank: '플리니우스가 기록한 미노르카섬의 토끼 떼 재앙 등 고대 박물학에 수록된 기이한 이적들', domains: ["미신·풍습(Superstition)","플리니우스 박물지","미노르카섬 토끼 재앙","자연의 기이한 이적","고대 경이 설화"] },
  'e2621-mesmerantoine': { category: 'person', rank: '18세기 파리 사교계에 자석 욕조(바케)를 설치하고 집단 최면 치료로 센세이션을 일으킨 의사', domains: ["인물·역사(Personnage)","동물자기설(Magnétisme animal)","바케(Baquet) 욕조 집단 치료","최면술(Mesmerism)","과학 아카데미 조사"] },
  'e2622-messahala': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","마샤알라 [Macha-Halla]"] },
  'e2623-messedudiable': { category: 'superstition', rank: '마녀들이 검은 제단 위에서 가톨릭 성찬례를 거꾸로 모독하며 사탄에게 제물을 바친 의식', domains: ["미신·풍습(Superstition)","검은 미사(Messe noire)","사바트의 신성모독","성체 모독","마녀재판 자백"] },
  'e2624-messiedesjuifs': { category: 'person', rank: '참된 메시아를 거부한 뒤 나타나 유대 민중을 기만하고 파멸로 이끈 도시테우스, 사바타이 체비 등', domains: ["인물·역사(Personnage)","유대교 역사","거짓 메시아(Faux messies)","사바타이 체비(Shabbetai Zvi)","종교적 기만"] },
  'e2625-metamorphoses': { category: 'myth', rank: '오비디우스의 신화부터 늑대인간과 백조 처녀에 이르는 동서양의 주술적 변신 총람', domains: ["신화·전설(Mythe)","변신(Métamorphose)","오비디우스 변신 이야기","늑대인간과 요괴 변신","민간 설화"] },
  'e2626-metatron': { category: 'myth', rank: '아카트리엘, 산달폰과 함께 신성한 보좌의 현존을 수호하는 카발라 최고의 천사', domains: ["신화·전설(Mythe)","유대 카발라(Cabale)","에녹의 승천","신의 얼굴을 뵙는 천사","계약의 서기"] },
  'e2627-metempsycose': { category: 'superstition', rank: '육체의 죽음 뒤 영혼이 죄업에 따라 다른 인간이나 동물의 몸으로 옮겨간다는 고대 교리', domains: ["미신·풍습(Superstition)","피타고라스 학파","영혼 윤회설","인도 힌두교 윤회(Samsara)","플라톤 철학"] },
  'e2628-metoposcopie': { category: 'divination', rank: '이마에 새겨진 일곱 행성의 주름선 모양과 깊이를 분석하여 수명과 성격을 점치는 관상학', domains: ["점술·점막(Divination)","이마 점술(Métoposcopie)","지롤라모 카르다노","7대 행성 주름선","인상학"] },
  'e2629-meurtre': { category: 'superstition', rank: '1127년 플랑드르 백작 선량공 샤를을 암살한 자들이 밤마다 지옥의 망령에 시달린 사건(p.458 삽화)', domains: ["미신·풍습(Superstition)","루이 브르통 본문 목판화","플랑드르 백작 선량공 샤를","살인자의 죄책감과 환각","시체의 피 흘림"] },
  'e2630-meyer': { category: 'person', rank: '『유령 출현에 관한 시론』을 저술하여 망령의 실재성을 학문적으로 옹호한 18세기 독일 학자', domains: ["인물·역사(Personnage)","독일 할레 대학 철학교수","유령 출현론(Essai sur les apparitions)","영혼의 사후 세계","18세기 독일 철학"] },
  'e2631-michaeleliacim': { category: 'person', rank: '루이 14세에게 자신이 대천사 미카엘의 계시를 받은 메시아 군대 총사령관이라 주장한 극작가', domains: ["인물·역사(Personnage)","아카데미 프랑세즈 초대 원장","장 데마레 드 생소를랭","종교적 망상과 광신","성령의 경고"] },
  'e2632-michaelissebastien': { category: 'person', rank: '1612년 마들렌 드 망돌 수녀의 빙의 사건을 조사하고 악마들의 계보와 위계를 체계화한 이단심문관', domains: ["인물·역사(Personnage)","도미니코 수도회(Marseille)","엑상프로방스 빙의 사건(1611년)","악마의 계보와 위계(Hierarchie)","루이 고프리디 화형"] },
  'e2633-michelmontsaint': { category: 'myth', rank: '대천사 미카엘의 성소가 자리하여 구마 의식으로 쫓겨난 악마들이 맴돌다 바다로 추락한다는 조수 바위', domains: ["신화·전설(Mythe)","프랑스 노르망디·브르타뉴 경계","대천사 미카엘 성소","구마와 악령 추방","바다의 조수"] },
  'e2634-michel': { category: 'person', rank: '1697년 숲속에서 유령의 환시를 보고 베르사유 궁전으로 가 태양왕 루이 14세를 독대한 대장장이(p.459 삽화)', domains: ["인물·역사(Personnage)","루이 브르통 본문 목판화","1697년 프로방스 살롱","루이 14세 베르사유 독대","유령의 비밀 계시"] },
  'e2635-micheldesahourspe': { category: 'person', rank: '사바트 제단에서 거대한 군주 악마와 잔심부름을 하는 작은 도깨비 악마를 목격했다고 자백한 마법사', domains: ["인물·역사(Personnage)","독일 작센 마녀재판","사바트의 악마 계급","대악마와 소악마","마법사 자백"] },
  'e2636-michellecossais': { category: 'person', rank: '신성로마제국 프리드리히 2세의 궁정 점성술사이자 성당 안에서 작은 돌에 맞아 사망한 대학자', domains: ["인물·역사(Personnage)","13세기 스코틀랜드 석학","신성로마제국 프리드리히 2세 궁정","아랍어 과학 번역","단테 신곡 지옥편(점술사)"] },
  'e2637-michellebohemien': { category: 'person', rank: '16세기 보헤미아에서 비밀 약초와 악마의 비방으로 불치병을 고쳐 마녀학자들의 조사를 받은 의사', domains: ["인물·역사(Personnage)","16세기 보헤미아 민간 의술","경험 의사(Empirique)","악마와의 결탁 소문","마녀학 문헌 인용"] },
  'e2638-midas': { category: 'myth', rank: '어린 시절 개미들이 입에 밀알을 물어다 주어 황금의 부를 예견받은 프리기아의 군주(p.460 삽화)', domains: ["신화·전설(Mythe)","루이 브르통 본문 목판화","그리스 신화(디오니소스)","미다스의 손(황금 변환)","당나귀 귀"] },
  'e2639-midi': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","정오의 악마 [Démon de midi]"] },
  'e2640-migalena': { category: 'person', rank: '1609년 피에르 드 랑크르의 마녀재판에서 사바트의 온갖 추악한 음모를 자백한 노파', domains: ["인물·역사(Personnage)","1609년 바스크 라부르 마녀재판","피에르 드 랑크르","사바트의 독약 제조","노파 마녀"] },
  'e2641-mikado': { category: 'myth', rank: '태양의 여신 아마테라스의 후손으로 지상에 발이 닿지 않고 신성한 불가침의 존재로 묘사된 군주', domains: ["신화·전설(Mythe)","일본 신토·황실 신화","살아있는 신(아라히토가미)","태양신 아마테라스","서양의 동양 종교관"] },
  'e2642-milan': { category: 'superstition', rank: '알베르투스 마그누스가 기록한 솔개의 머리뼈를 주머니에 넣고 다니면 분노와 투쟁을 가라앉히는 주술(p.460 삽화)', domains: ["미신·풍습(Superstition)","루이 브르통 본문 목판화","알베르투스 마그누스의 비의","맹금류 솔개(Milan)","분노 억제 부적"] },
  'e2643-millenaires': { category: 'superstition', rank: '요한계시록 20장을 문자 그대로 해석하여 종말 직전 그리스도가 지상에서 천 년간 다스린다고 본 종파', domains: ["미신·풍습(Superstition)","기독교 종말론","천년왕국설(Chiliasme)","요한계시록 20장","열광주의 종파"] },
  'e2644-miller': { category: 'person', rank: '다니엘서의 숫자를 계산하여 1843년 세상이 불타 멸망한다고 선포해 대실망을 낳은 목사', domains: ["인물·역사(Personnage)","미국 제2차 대각성운동","시한부 종말론(Millerism)","대실망(The Great Disappointment)","재림 예언"] },
  'e2645-millo': { category: 'superstition', rank: '무덤에서 일어나 밤마다 잠든 처녀의 목을 조르고 피를 빨아 숨지게 한 헝가리의 흡혈귀', domains: ["미신·풍습(Superstition)","18세기 헝가리 흡혈귀 소동","스타노스카 처녀(Stanoska)","시체 말뚝 박기","흡혈귀(Vampire)"] },
  'e2646-milon': { category: 'person', rank: '살아있는 황소를 어깨에 메고 올림피아 경기장을 질주했으나 쪼개진 나무 틈에 손이 끼어 늑대에게 먹힌 장사', domains: ["인물·역사(Personnage)","고대 그리스 올림피아 레슬링","초인적인 완력","피타고라스의 제자","비극적 최후"] },
  'e2647-milton': { category: 'person', rank: '시력을 잃은 뒤 불후의 서사시 『실낙원』을 구술하여 사탄과 판데모니엄의 웅장함을 형상화한 영국의 문호', domains: ["인물·역사(Personnage)","영국 서사시 문학","실낙원(Paradise Lost)","사탄의 반역과 추락","지옥 판데모니엄 궁전"] },
  'e2648-mimer': { category: 'myth', rank: '세계수 위그드라실 뿌리 곁에서 지혜의 샘을 지키며 오딘에게 한쪽 눈을 대가로 마법을 준 거인', domains: ["신화·전설(Mythe)","북유럽 신화 에다","미미르의 지혜의 샘","오딘의 외눈","잘려진 예언의 머리"] },
  'e2649-mimi': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","조조 [Zozo]"] },
  'e2650-mimique': { category: 'divination', rank: '얼굴 표정, 손짓, 걸음걸이의 무의식적 습관을 통해 인간의 숨겨진 본성을 간파하는 감정술(p.461 삽화)', domains: ["점술·점막(Divination)","루이 브르통 본문 목판화","관상학(Physiognomie)","신체 언어(Mimique)","인간 본성 간파"] },
  'e2651-mineursdemon': { category: 'demon', rank: '사티로스나 염소의 형상으로 어두운 광산 갱도에 출몰하여 낙반을 일으키고 광부를 괴롭히는 지하 악령', domains: ["악마·마귀(Démon)","지하 광산 전설","코볼트(Kobold)","노커(Knocker)","유독가스와 낙반 사고"] },
  'e2652-mingrelie': { category: 'superstition', rank: '흑해 연안 캅카스 지역에서 성직자들이 술 취해 세례를 베풀고 이교도 부적을 팔았던 타락한 민속', domains: ["미신·풍습(Superstition)","캅카스 조지아(밍그렐리아)","타락한 사제들의 주술","기괴한 세례식","이교도 미신 혼합"] },
  'e2653-minoson': { category: 'demon', rank: '지옥의 최고 군주 바엘의 직속 수하로서 주사위와 카드놀이에서 상대의 패를 꿰뚫어 보게 돕는 악마', domains: ["악마·마귀(Démon)","바엘(Baël)의 수하 악마","도박의 신통력","카드와 주사위 내기","행운의 악마"] },
  'e2654-minuit': { category: 'superstition', rank: '밤의 12시 종이 울릴 때 묘지의 무덤이 열리고 마녀와 악마들이 사바트로 모여드는 시간', domains: ["미신·풍습(Superstition)","마녀의 시간(Witching Hour)","자정의 금기","유령과 악령의 활동","새벽닭의 울음소리"] },
  'e2655-mirabelhonore': { category: 'person', rank: '1726년 마르세유에서 유령이 매장된 보물을 알려주었다고 사기를 치다 갤리선 노역형을 받은 죄수(p.467 삽화)', domains: ["인물·역사(Personnage)","루이 브르통 본문 목판화","1726년 마르세유 재판","가짜 유령 사기극","갤리선 종신 노역형"] },
  'e2656-mirabilisliber': { category: 'grimoire', rank: '아를의 성 체사리오 등 고대 성자들의 예언을 집대성하여 교회의 대분열과 혁명을 예고한 예언서', domains: ["마도서·문헌(Grimoire)","1522년 파리 출간","아를의 성 체사리오","교회의 위기와 흑사병 예언","종말론적 예언집"] },
  'e2657-miracles': { category: 'superstition', rank: '등에 붙인 가짜 혹을 떼어내는 눈속임으로 군중을 속여 성자로 군림하려 했던 사이비 마술사들', domains: ["미신·풍습(Superstition)","가짜 기적(Faux miracles)","돌팔이 마술사의 사기극","민중의 맹신","콜랭 드 플랑시 폭로"] },
  'e2658-mirage': { category: 'superstition', rank: '사막과 바다 상공에 찬란한 궁전과 오아시스를 펼쳐 여행자의 넋을 빼놓는 대기의 마법', domains: ["미신·풍습(Superstition)","대기 굴절 현상","파타 모르가나(Fata Morgana)","사막의 미신","감각의 기만"] },
  'e2659-mirak': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","아그라페나 [Agraféna]"] },
  'e2660-miroir': { category: 'divination', rank: '프랑수아 1세에게 카를 5세와의 전황을 비추어 보여준 마법사의 거울 점술(p.468 삽화)', domains: ["점술·점막(Divination)","루이 브르통 본문 목판화","거울 점술(Catoptromancie)","원격 투시","카트린 드 메디시스의 거울"] },
  'e2661-mirvillejeudesde': { category: 'person', rank: '『영령들의 명백한 사실과 실재성』을 저술하여 당대 강신술의 배후에 사탄이 있음을 논증한 귀족', domains: ["인물·역사(Personnage)","19세기 프랑스 가톨릭 변증학","강신술 비판","악령의 실재성 논증","탁자 회전 반박"] },
  'e2662-miscaunmarry': { category: 'myth', rank: '아일랜드 늪지와 황야에서 푸르스름한 불꽃으로 여행자를 유혹하여 늪에 빠뜨리는 요정 불', domains: ["신화·전설(Mythe)","아일랜드 켈트 민담","도깨비불(Feu follet / Ignis fatuus)","늪지의 유혹","요정의 등불"] },
  'e2663-misraim': { category: 'crossref', rank: '구약 성서 창세기에 등장하는 함의 아들이자 고대 이집트 왕국과 오컬트 마술의 시조', domains: ["상호참조","마술과 마법사들 [Magie et Magiciens]"] },
  'e2664-moensklint': { category: 'myth', rank: '덴마크 묀 섬의 거대한 흰색 석회암 절벽으로 폭풍우의 신 토르의 벼락이 내리친다는 전설의 절벽', domains: ["신화·전설(Mythe)","덴마크 발트해 전설","묀 섬 백악 절벽(Møns Klint)","천둥신 토르의 벼락","해양 바위 전설"] },
  'e2665-mog': { category: 'myth', rank: '고대 아르메니아와 조로아스터교 사제들을 일컫던 명칭으로 마술(Magie)의 어원적 기원', domains: ["신화·전설(Mythe)","고대 아르메니아 종교","마구스(Magus)의 어원","불 숭배 사제단","언어학적 고증"] },
  'e2666-mogol': { category: 'superstition', rank: '무굴 제국의 황제가 발을 씻은 성스러운 물을 마시면 온갖 악령의 질병이 낫는다는 미신', domains: ["미신·풍습(Superstition)","인도 무굴 제국","피에르 드 랑크르 기록","황제 숭배와 신성수","민간 주술 치료"] },
  'e2667-mohra': { category: 'superstition', rank: '수백 명의 아이들이 밤마다 마녀들의 등에 업혀 블라쿨라 초원으로 날아갔다고 증언한 사건', domains: ["미신·풍습(Superstition)","1669년 스웨덴 마녀재판","블라쿨라(Blockula)","어린이 집단 망상","집단 화형 사건"] },
  'e2668-moinebourru': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","부뤼 [Bourru]"] },
  'e2669-moines': { category: 'superstition', rank: '오랜 금식과 고행에 지친 수도사의 방에 먹음직스러운 음식으로 둔갑해 나타난 사탄의 시험', domains: ["미신·풍습(Superstition)","중세 수도원 설화","사순절 금식과 악마","음식의 환각","도덕적 교훈담"] },
  'e2670-mois': { category: 'superstition', rank: '1월 유노, 2월 넵투누스, 3월 미네르바 등 로마인들이 달력의 각 달에 배정한 수호신 체계', domains: ["미신·풍습(Superstition)","고대 로마 달력","12개월의 수호신","길일과 흉일","점성학적 달력"] },
  'e2671-moise': { category: 'person', rank: '이집트 파라오의 궁정에서 신비 학문을 배우고 시나이산에서 토라와 카발라 비전을 받은 예언자', domains: ["인물·역사(Personnage)","구약 성서 출애굽기","모세오경의 저자","탈무드와 카발라 전승","기적의 지팡이"] },
  'e2672-moiset': { category: 'demon', rank: '농부들에게 사바트 참가를 약속하고 은화를 가로채 달아난 사기꾼 또는 소악마', domains: ["악마·마귀(Démon)","프랑스 마녀재판 일화","사기꾼 악마","사바트 계약 사기","민간 도깨비"] },
  'e2673-mokissos': { category: 'myth', rank: '아프리카 로앙고 주민들이 지고신 아래에서 질병을 막고 마을을 지켜준다고 믿은 수호 영령들', domains: ["신화·전설(Mythe)","중앙아프리카 로앙고 왕국","은키시(Nkisi) 정령","토착 페티시즘","수호 정령 신앙"] },
  'e2674-molitorulrich': { category: 'person', rank: '1489년 『마녀와 여성 점술가들에 관하여』를 출간하여 마녀의 비행이 악마의 환각임을 주장한 선각자', domains: ["인물·역사(Personnage)","콘스탄츠 주교좌 법학자","마녀론(De Lamiis, 1489년)","악마의 환각설","초기 마녀학 목판화 저작"] },
  'moloch': { category: 'demon', rank: '황소 머리를 하고 가슴속 화로에 갓난아이를 제물로 받아 삼킨 지옥 최고 평의회 고위 군주(Plate 48)', domains: ["악마·마귀(Démon)","루이 브르통 68대 목판화","구약 성서 암몬인의 우상","인신공양(게헨나 힌놈의 골짜기)","눈물의 나라 군주"] },
  'e2676-momies': { category: 'superstition', rank: '1583년 폴란드 공작이 이집트에서 가져온 미라 상자로 인해 바다에 거대한 폭풍이 몰아친 사건(p.470 삽화)', domains: ["미신·풍습(Superstition)","루이 브르통 본문 목판화","라지비우 공작 예루살렘 여행기","이집트 미라의 저주","해양 조난과 유령"] },
  'e2677-monarchieinfernale': { category: 'demon', rank: '황제 벨제뷔트 아래에 7명의 방위 대왕과 7,405,926마리의 악마 군단으로 조직된 지옥 관료 체계', domains: ["악마·마귀(Démon)","요한 바이어(Jean Wier)","악마의 가짜 군주국(Pseudomonarchia Daemonum)","지옥 궁정 관직","악마 군단 통계"] },
  'e2678-monde': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","세계의 기원 [Origines du monde]"] },
  'e2679-monkir': { category: 'myth', rank: '나키르와 함께 매장 직후 무덤 속 망자를 깨워 신앙을 시험하고 쇠몽둥이로 내리치는 심문 천사', domains: ["신화·전설(Mythe)","이슬람 내세관","무덤의 심문","뭉카르와 나키르(Munkar et Nakir)","영혼의 심판"] },
  'e2680-monsieurdelaforet': { category: 'myth', rank: '1598년 앙리 4세의 사냥길에 출몰하여 불길한 경고를 외치고 사라진 퐁텐블로의 유령 사냥꾼', domains: ["신화·전설(Mythe)","프랑스 퐁텐블로 숲","그랑 브뇌르(Grand Veneur)","야간 사냥꾼 유령","앙리 4세 전설"] },
  'e2681-monstres': { category: 'superstition', rank: '1720년 해부학자 메리가 부검한 샴쌍둥이 기형아 등 신의 징벌로 오인된 기형 설화(p.471 삽화)', domains: ["미신·풍습(Superstition)","루이 브르통 본문 목판화","기형학(Tératologie)","외과의사 메리(Méry)","불길한 전조"] },
  'e2682-montagnards': { category: 'demon', rank: '험준한 산악 깊은 바위 동굴과 광산 갱도에 거처하며 광부들을 시험하는 지하 악령(p.473 삽화)', domains: ["악마·마귀(Démon)","루이 브르통 본문 목판화","산악 정령(Génie montagnard)","지하 광산 요마","괴테 파우스트 산악 악령"] },
  'e2683-montalembertadriende': { category: 'person', rank: '1528년 리옹의 성 우르술라 수녀원에서 일어난 유령의 노크 소리와 폴터가이스트를 기록한 사제', domains: ["인물·역사(Personnage)","프랑수아 1세 궁정 사제","리옹 수녀원 유령 소동(1528년)","폴터가이스트(Esprit frappeur)","초기 퇴마 기록"] },
  'e2684-montan': { category: 'person', rank: '프리기아 출신으로 경련 발작과 신들린 황홀경 속에서 종말과 금욕을 설파한 몬타누스파의 창시자', domains: ["인물·역사(Personnage)","2세기 초대교회 이단","몬타누스주의(Montanisme)","황홀경 예언(Extase)","테르툴리아누스의 가담"] },
  'e2685-montanay': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","갈리가이 [Galigaï]"] },
  'e2686-montezuma': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","징조 [Présages]"] },
  'e2687-monturedesesprits': { category: 'superstition', rank: '밤마다 마구간의 말을 훔쳐 타고 갈기를 땋으며 새벽까지 질주한다는 아일랜드 요정 미신(p.473 삽화)', domains: ["미신·풍습(Superstition)","루이 브르통 본문 목판화","아일랜드·북유럽 요정 전승","말 갈기 땋기(Elflocks)","야간 승마"] },
  'e2688-mopsus': { category: 'person', rank: '무화과나무의 열매 개수와 어미 돼지 뱃속 새끼 수를 맞혀 트로이의 칼카스를 제압한 예언자', domains: ["인물·역사(Personnage)","그리스 신화","아폴론의 아들","예언 대결","칼카스의 죽음"] },
  'e2689-morail': { category: 'demon', rank: '솔로몬의 마도서에서 소환자에게 사람들의 눈에 보이지 않는 투명망토 비술을 전수하는 악마', domains: ["악마·마귀(Démon)","솔로몬의 작은 열쇠","마도서 그리모어","투명화 비술(Invisibilité)","지옥 악령"] },
  'e2690-morax': { category: 'demon', rank: '인간의 얼굴을 한 거대한 황소의 모습으로 나타나는 30군단의 지옥 대백작 겸 총재', legions: 36, domains: ["악마·마귀(Démon)","솔로몬 72 악마","지옥 30군단 통솔","황소 머리 악마","천문학과 자유학예"] },
  'e2691-mordad': { category: 'myth', rank: '고대 페르시아 조로아스터교에서 불멸을 상징하며 대지의 모든 식물과 수목을 관장하는 신성한 영령', domains: ["신화·전설(Mythe)","고대 페르시아 조로아스터교","아메샤 스펜타(Amesha Spenta)","불멸(Ameretat)","식물과 생명의 수호"] },
  'e2692-moreau': { category: 'person', rank: '19세기 초 파리에서 나폴레옹 보나파르트의 손바닥을 보고 러시아 원정 실패와 몰락을 예언한 수상술사', domains: ["인물·역사(Personnage)","19세기 프랑스 수상술","손금 감정","나폴레옹 보나파르트","몰락의 예언"] },
  'e2693-morellouise': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","마르탱 [Martin]"] },
  'e2694-morgane': { category: 'myth', rank: '마법사 멀린에게 비술을 전수받아 구름을 부르고 상처 입은 아서왕을 아발론 섬으로 인도한 요정', domains: ["신화·전설(Mythe)","아서왕 전설(원탁의 기사)","모르간 르 페이","마법사 멀린의 제자","아발론 섬(Avalon)"] },
  'e2695-morinjeanbaptiste': { category: 'person', rank: '콜레주 드 프랑스 수학 교수이자 추기경 리슐리외와 마자랭의 천궁도를 작성한 17세기 점성가', domains: ["인물·역사(Personnage)","콜레주 드 프랑스 수학 교수","점성학 체계(Astrologia Gallica)","리슐리외 추기경","천궁도 예언"] },
  'e2696-morinsimon': { category: 'person', rank: '일루미나티 종파를 재건하려다 1663년 파리 그레브 광장에서 자신의 저서와 함께 산 채로 화형된 광신자', domains: ["인물·역사(Personnage)","17세기 프랑스 광신 사건","파리 그레브 광장 화형","자칭 성령의 화신","신성모독 재판"] },
  'e2697-mort': { category: 'superstition', rank: '날카로운 큰 낫을 쥐고 모든 계급의 인간을 평등하게 무덤으로 거두어가는 죽음의 형상(p.474 삽화)', domains: ["미신·풍습(Superstition)","루이 브르통 본문 목판화","죽음의 춤(Danse macabre)","그림 리퍼(Grim Reaper)","묵시록의 제4기사"] },
  'e2698-mortemart': { category: 'superstition', rank: '사별한 아내를 그리워하다 밤마다 침실에 나타난 아내의 차가운 망령과 손을 맞잡은 귀족의 일화', domains: ["미신·풍습(Superstition)","프랑스 귀족 가문 괴담","망령과의 재회","유령의 방문","영혼의 불멸"] },
  'e2699-mostmastite': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","혼인 점술 [Mariage]"] },
  'e2700-motelu': { category: 'demon', rank: '17세기 프랑스 마녀재판에서 피고인에게 접근해 사바트의 주술을 전수한 하급 악마', domains: ["악마·마귀(Démon)","프랑스 마녀재판 기록","드니즈 드 라카유 재판","사역마 악령","마녀의 계약"] },
  'e2701-motogon': { category: 'myth', rank: '호주 원주민들이 태초에 지상을 거닐며 입김으로 바람과 구름을 창조했다고 믿은 거인 영령', domains: ["신화·전설(Mythe)","호주 원주민(애보리지널) 신화","드림타임(Dreamtime)","창조신 모토곤","바람과 대지의 정령"] },
  'e2702-mouche': { category: 'demon', rank: '파리의 군주 바알제붑처럼 화형당하는 마법사의 입에서 검은 파리나 나비로 빠져나가는 악령', domains: ["악마·마귀(Démon)","바알제붑(파리의 군주)","곤충 변신 악마","영혼의 탈출","마녀재판 목격담"] },
  'e2703-moultthomasjoseph': { category: 'person', rank: '마티외 란스베르크와 더불어 18세기 서민들에게 널리 읽힌 통속 기상 예언집의 저자', domains: ["인물·역사(Personnage)","이탈리아 나폴리 점성가","민간 예언 연감","기상과 농경 예언","통속 점성술"] },
  'e2704-mouni': { category: 'myth', rank: '인도 남부 민담에서 오래된 반얀나무에 거처하며 마을의 경계를 수호하는 고행자 신령들', domains: ["신화·전설(Mythe)","인도 힌두 민속 신앙","무니(고행자 신격)","수목 숭배(반얀나무)","마을의 수호령"] },
  'e2705-mouton': { category: 'demon', rank: '사바트 집회에서 숫양이나 거대한 검은 양의 모습으로 나타나 마녀들에게 경배를 받은 사탄(p.481 삽화)', domains: ["악마·마귀(Démon)","루이 브르통 본문 목판화","사바트의 동물 변신","검은 숫양(Mouton noir)","마법사 오펠리 재판"] },
  'e2706-mouzouko': { category: 'myth', rank: '남아프리카 모노모타파(짐바브웨) 원주민들이 모든 질병과 재앙의 원흉으로 두려워한 악령', domains: ["신화·전설(Mythe)","남아프리카 모노모타파 제국","사악한 악령 무주코","아프리카 토착 신앙","질병의 마귀"] },
  'e2707-mozart': { category: 'person', rank: '1791년 정체불명의 회색 사자에게 진혼곡 작곡을 의뢰받고 자신의 죽음을 직감한 천재 작곡가(p.481 삽화)', domains: ["인물·역사(Personnage)","루이 브르통 본문 목판화","진혼곡 레퀴엠(Requiem K.626)","잿빛 옷의 사자(발제크 백작)","죽음의 직감"] },
  'e2708-mugetadessen': { category: 'person', rank: '로렌 지방에서 화형 판결을 받고 기둥에 묶이기 직전 악마의 잔혹한 배신을 폭로한 마녀', domains: ["인물·역사(Personnage)","프랑스 로렌 마녀재판","니콜라 레미(Nicolas Rémy)","화형대에서의 자백","악마의 배신"] },
  'e2709-muhazimim': { category: 'superstition', rank: '아프리카 원주민들이 악령에 씌어 광포해진 빙의자들의 몸에 주술 기호를 새겨 치유하던 의식', domains: ["미신·풍습(Superstition)","아프리카 토착 구마 의식","신체 주술 기호(문신)","마법 원(Cercle)","악령 빙의 치료"] },
  'e2710-mulet': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","오데 [Odet]"] },
  'e2711-mullerjean': { category: 'person', rank: '15세기 독일 르네상스 최고의 천문학자이자 공중을 나는 철파리 자동인형을 제작한 과학자', domains: ["인물·역사(Personnage)","독일 르네상스 천문학","레기오몬타누스(Regiomontanus)","기계 자동인형(철파리와 독수리)","교황청 달력 개정"] },
  'e2712-mullin': { category: 'demon', rank: '지옥의 황제 벨제뷔트의 침실을 지키며 옷을 입혀드리는 하급 관직의 수석 시종 악마', domains: ["악마·마귀(Démon)","지옥 궁정 시종직","벨제뷔트의 수석 시종(Premier valet)","지옥 관료 체계","마녀재판 기록"] },
  'e2713-mummol': { category: 'person', rank: '578년 프레데군트 왕비의 아들이 병사하자 파리에서 마술사들을 매수해 저주를 걸었다는 혐의를 받은 장군', domains: ["인물·역사(Personnage)","메로빙거 왕조(투르의 그레고리우스)","프레데군트 왕비의 복수","이질 전염병","중세 마녀 모함"] },
  'e2714-muncerthomas': { category: 'person', rank: '성령의 직접적인 계시를 내세워 모든 지주와 영주를 타도하려다 프랑켄하우젠에서 참수된 예언자(p.482 삽화)', domains: ["인물·역사(Personnage)","루이 브르통 본문 목판화","독일 종교개혁과 농민전쟁(1525년)","재세례파(Anabaptistes)","묵시록적 천년왕국"] },
  'e2715-munnings': { category: 'person', rank: '술집을 나오며 불길한 저주를 중얼거려 하룻밤 사이에 사람을 급사하게 만들었다고 고발된 노파', domains: ["인물·역사(Personnage)","1694년 영국 마녀재판","외눈박이 노파","말의 저주","무죄 석방 판결"] },
  'e2716-munster': { category: 'superstition', rank: '하늘에 세 개의 태양이 뜨는 흉조 속에 재세례파 광신자들이 예루살렘을 선포하고 몰살당한 사건', domains: ["미신·풍습(Superstition)","1534년 뮌스터 반란","얀 판 레이던","하늘의 흉조(삼일 현상)","종교적 광기의 참극"] },
  'e2717-murailledudiable': { category: 'myth', rank: '잉글랜드와 스코틀랜드를 가르는 고대 로마 하드리아누스 장벽을 악마가 하룻밤에 쌓았다는 설화', domains: ["신화·전설(Mythe)","영국·스코틀랜드 국경","하드리아누스 장벽(Hadrian's Wall)","악마의 건축 설화","거석 신앙"] },
  'e2718-murmur': { category: 'demon', rank: '독수리를 탄 군인의 형상으로 나팔 소리와 함께 나타나 죽은 자의 영혼을 소환하는 30군단의 대공', legions: 30, domains: ["악마·마귀(Démon)","솔로몬 72 악마","지옥 30군단 통솔","음악의 악마","사령술(Nécromancie) 영혼 소환"] },
  'e2719-murzanti': { category: 'superstition', rank: '원통하게 살해당해 묻히지 못한 원혼이 이탈리아 처녀의 몸에 깃들어 살인범을 고발한 사건', domains: ["미신·풍습(Superstition)","이탈리아 폰치니 빙의 사건","원혼(Âme en peine)","살인범 고발","구마와 진혼"] },
  'e2720-muschat': { category: 'superstition', rank: '1720년 아내를 잔혹하게 살해한 니콜 머스챗의 범행 장소에 망령을 진정시키려 돌을 쌓은 무덤', domains: ["미신·풍습(Superstition)","스코틀랜드 에든버러 민담","솔즈베리 바위(Salisbury Crags)","머스챗의 케언","월터 스콧의 미드인지언"] },
  'e2721-musiqueceleste': { category: 'superstition', rank: '태양과 행성들이 천구를 회전하며 자아내는 영혼을 정화하는 지극히 장엄한 신성 음악', domains: ["미신·풍습(Superstition)","피타고라스 철학","천구의 화음(Harmonia Mundi)","행성의 궤도와 음률","영혼의 정화"] },
  'e2722-muspelheim': { category: 'myth', rank: '북유럽 신화에서 남쪽에 위치한 혹열의 세계이자 라그나로크 때 세상을 불태울 불꽃의 땅', domains: ["신화·전설(Mythe)","북유럽 신화 에다","태초의 화염 세계","화염 거인 수르트(Surtr)","라그나로크(종말의 날)"] },
  'e2723-musucca': { category: 'myth', rank: '아프리카 일부 부족들이 인간에게 극심한 공포와 질병을 퍼뜨린다고 두려워한 악마의 명칭', domains: ["신화·전설(Mythe)","서아프리카 부족 신앙","사악한 악령 무수카","질병의 마귀","토착 정령"] },
  'e2724-mutisme': { category: 'superstition', rank: '악령에 빙의되어 혀가 마비되고 말을 잃었다가 십자가와 성수로 치유된 중세의 구마 사례', domains: ["미신·풍습(Superstition)","함구증(벙어리병)","악령 빙의의 신체적 징후","복음서의 벙어리 마귀","가톨릭 구마 의식"] },
  'mycale': { category: 'myth', rank: '오비디우스의 변신 이야기에 수록된 밤하늘의 달을 지상으로 끌어내리는 주술을 부린 마녀(Plate 48)', domains: ["신화·전설(Mythe)","루이 브르통 68대 목판화","오비디우스 변신 이야기","테살리아 마술(달 끌어내리기)","월식의 주술"] },
  'e2726-myagorus': { category: 'myth', rank: '고대 아르카디아인들이 제물을 바칠 때 꼬여드는 파리 떼를 쫓아내기 위해 기원했던 영령', domains: ["신화·전설(Mythe)","고대 그리스 아르카디아 신앙","파리 쫓는 신(Myiagros)","제물 봉헌 제의","바알제붑과의 비교"] },
  'e2727-myoam': { category: 'myth', rank: '2세기 알렉산드리아의 바실리데스파 영지주의자들이 천상의 365개 천구를 통과하기 위해 부른 영령', domains: ["신화·전설(Mythe)","2세기 영지주의(Gnosticisme)","바실리데스 학파","천상 아이온(Aeon)","비밀 주문"] },
  'e2728-myomancie': { category: 'divination', rank: '생쥐나 쥐의 울음소리, 창고 곡식을 갉아먹는 행태로 전쟁과 기근의 흉조를 점치는 고대 비술(p.484 삽화)', domains: ["점술·점막(Divination)","루이 브르통 본문 목판화","쥐 점술(Myomancie)","고대 로마 불길한 징조","곡식 갉아먹기"] },
  'e2729-myricaeus': { category: 'myth', rank: '위성류(타마릭스) 나뭇가지를 꺾어 흔들며 미래의 신탁을 내리던 아폴론 신의 고대 별칭', domains: ["신화·전설(Mythe)","고대 그리스 아폴론 신앙","목점(위성류 점술)","신탁 의식","타마릭스 나무"] },
  'e2730-mysteres': { category: 'superstition', rank: '엘레우시스와 미트라 제의에서 불, 물, 지하 암흑의 80가지 시험을 거쳐 비밀 지혜를 전수받은 의식', domains: ["미신·풍습(Superstition)","엘레우시스 밀의","미트라 밀의(80단계 시험)","비의 입문식(Initiation)","고대 밀의 종교"] },
  'e2731-mythologie': { category: 'myth', rank: '벤자민 비네의 논고를 인용하여 고대 이교도의 모든 신들이 실상은 인류를 타락시킨 악마들임을 논증', domains: ["신화·전설(Mythe)","비교신화학","벤자민 비네(Benjamin Binet)","신들과 악마들의 논고","M 섹션 완결"] },

  // N entries curated metadata (p.486-497)
  'e2732-nabam': { category: 'demon', rank: '사바트 연도에서 마녀들이 찬양하던 장난과 소동의 지옥 악령(Démon du Sabbat)', domains: ["악마·마귀(Démon)","마녀재판과 사바트","사바트 연도","익살과 소동"] },
  'e2733-naberus': { category: 'demon', rank: '까마귀의 형상으로 쉰 목소리를 내며 수사학을 가르치는 19개 군단의 지옥 대후작(Grand Marquis)', legions: 19, domains: ["악마·마귀(Démon)","솔로몬 72 악마","지옥 19군단 통솔","수사학과 웅변술","잃어버린 명예 회복","케르베로스 동일시"] },
  'e2734-nabuchodonosor': { category: 'person', rank: '신의 진노로 7년 동안 궁궐에서 쫓겨나 소처럼 풀을 뜯어먹은 신바빌로니아 대왕(Roi de Babylone)', domains: ["인물·역사(Personnage)","구약 성서 다니엘서 4장","임상적 수화망상(Boanthropy)","교만의 신벌","바빌론 공중정원"] },
  'e2735-nachtmaneken': { category: 'myth', rank: '한밤중 침실 문틈으로 들어와 악몽을 불어넣는 플랑드르 민담의 작은 도깨비(Lutin Flamand)', domains: ["신화·전설(Mythologie)","플랑드르 벨기에 민속","야간 요정","가위눌림과 악몽"] },
  'e2736-nachtvrouwtje': { category: 'myth', rank: '안개 자욱한 들판을 떠돌며 나그네를 홀려 늪에 빠뜨리는 밤의 여성 정령(Femme de la Nuit)', domains: ["신화·전설(Mythologie)","플랑드르 벨기에 민속","야간 요정","늪지의 유혹","서큐버스 전승"] },
  'e2737-nagates': { category: 'superstition', rank: '가택의 번영과 액막이를 위해 부엌과 문가에 모시던 일본 민간의 목각 신상(Idoles du Japon)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","일본 민속 신앙","신토 가신(家神)","액막이 목각상"] },
  'e2738-naglefare': { category: 'myth', rank: '라그나로크 때 거인족과 로키 군대를 태우고 신들의 세계로 출항하는 거대한 배(Navire des Morts)', domains: ["신화·전설(Mythologie)","북유럽 신화","에다(Edda)","라그나로크(종말의 날)","망자의 손톱 금기"] },
  'e2739-nagual': { category: 'superstition', rank: '인간의 영혼과 운명을 공유하며 재규어나 새로 변신하던 멕시코 원주민 신앙(Génie Protecteur)', domains: ["미신·민속(Superstition)","멕시코 아즈텍·마야 신앙","나우알리즘(Nagualism)","변신 주술사(Shapeshifter)","수호 동물(Tonal)"] },
  'e2740-naguillecatherine': { category: 'person', rank: '1609년 피에르 드 랑크르의 바스크 마녀재판에서 사바트의 밀의를 자백한 마녀(Sorcière Basque)', domains: ["인물·역사(Personnage)","바스크 마녀재판","피에르 드 랑크르","1609년 판결","사바트 독약"] },
  'e2741-naguillemarie': { category: 'person', rank: '사바트에서 악마와 춤추고 동생을 마법에 입문시켰다는 혐의를 받은 바스크 여인(Complice au Sabbat)', domains: ["인물·역사(Personnage)","바스크 마녀재판","가족 마녀 연루","피에르 드 랑크르 기록"] },
  'e2742-nahama': { category: 'demon', rank: '릴리트와 함께 잠든 인간을 유혹하여 인큐버스와 악령들을 낳는 타락천사의 아내(Mère des Démons)', domains: ["악마·마귀(Démon)","유대 조하르 카발라","창세기 카인의 후예","서큐버스(Succubus)","릴리트의 자매"] },
  'e2743-nainlaurinoulelfroi': { category: 'myth', rank: '티롤 로젠가르텐의 마법 장미밭을 지키며 보이지 않는 망토를 두른 난쟁이 제왕(Roi des Nains)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","독일·티롤 영웅 서사시","디트리히 폰 베른","로젠가르텐의 전설","타른캅페(투명 망토)"] },
  'e2744-nains': { category: 'myth', rank: '지하 광산에서 금은보화를 채굴하고 신들의 무기를 벼려낸 북유럽과 게르만의 종족(Peuple Souterrain)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","북유럽 신화(Dvergr)","토르의 묠니르 제작","지하의 금속 장인"] },
  'e2745-nairancie': { category: 'divination', rank: '햇빛이 거울이나 물에 반사되는 광선의 굴절로 미래를 읽던 고대 태양 점술(Divination Solaire)', domains: ["점술·예언(Divination)","헬리오만시(Heliomancy)","태양광 점술","광선 굴절","고대 칼데아 점술"] },
  'e2746-nakaronkir': { category: 'myth', rank: '깊은 밀림 속에 숨어 살며 길 잃은 사냥꾼을 납치해 삼킨다는 야생 정령(Monstre des Forêts)', domains: ["신화·전설(Mythologie)","마다가스카르 민속","밀림의 식인 괴물","숲의 요정"] },
  'e2747-nambroth': { category: 'demon', rank: '화요일 자정에 소환되어 숨겨진 보물과 마술 비법을 전수한다는 악령(Démon Évoqué)', domains: ["악마·마귀(Démon)","의식 마술 마도서","『대 대주서(Grand Grimoire)』","화요일의 악마","숨겨진 재물"] },
  'e2748-nan': { category: 'superstition', rank: '순록을 미치게 날뛰게 만드는 쇠파리로 둔갑한 북극의 사악한 장난 요정들(Esprits Follets)', domains: ["미신·민속(Superstition)","북극권 라플란드 민속","사미족 샤머니즘","동물 변신 요정","순록 떼의 발작"] },
  'e2749-napierbarbara': { category: 'person', rank: '국왕 제임스 6세의 배를 난파시키려 폭풍을 일으켰다는 혐의로 기소된 귀족 여성(Sorcière d\'Écosse)', domains: ["인물·역사(Personnage)","스코틀랜드 마녀재판","노스베릭 재판(1591)","제임스 1세 국왕","임신으로 처형 유예"] },
  'e2750-napoleonier': { category: 'person', rank: '소크라테스의 다이몬처럼 운명을 계시했던 ‘붉은 인간’의 전설을 지닌 프랑스 황제(Empereur des Français)', domains: ["인물·역사(Personnage)","나폴레옹 보나파르트","튈르리 궁전의 붉은 인간","운명의 별","소크라테스 다이몬"] },
  'e2751-narac': { category: 'myth', rank: '맹독을 품은 뱀들과 불타는 구덩이에서 죄인들을 징벌하는 인도의 나락(Enfer des Indiens)', domains: ["신화·전설(Mythologie)","힌두 우주론","야마(염라대왕)의 심판","나락(Naraka)","업보의 징벌"] },
  'e2752-nastrande': { category: 'myth', rank: '살인자와 서약 파기자들의 시신을 니드호그가 뜯어먹는 혹한의 독사 해안(Partie de l\'Enfer)', domains: ["신화·전설(Mythologie)","북유럽 신화","에다(Edda)","헬헤임의 시체 해안","용 니드호그"] },
  'e2753-nathandegaza': { category: 'person', rank: '17세기 오스만 제국을 뒤흔든 가짜 메시아 사바타이 제비의 대변자이자 카발라 환시가(Juif Visionnaire)', domains: ["인물·역사(Personnage)","유대 메시아 운동","사바타이 제비(Sabbatai Zevi)","루리아 카발라","1666년 종말론"] },
  'e2754-napoleonier': { category: 'person', rank: '루이 브르통의 목판화 삽화로 묘사된 나폴레옹 황제와 운명의 정령(Illustration Historique)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","나폴레옹 보나파르트","튈르리 궁전의 망령","워털루의 패망"] },
  'e2755-natonaberthe': { category: 'person', rank: '1217년 제노바에서 세 마리의 교만한 악마에 씌어 사제들에게 지옥의 비밀을 토해낸 여인(Génoise Possédée)', domains: ["인물·역사(Personnage)","13세기 이탈리아 빙의","제노바 주교관 구마","악마와의 문답","성모 마리아의 굴복"] },
  'e2756-natureletsurnaturel': { category: 'superstition', rank: '알려지지 않은 자연의 법칙을 악마의 마법이나 기적으로 오인했던 인간의 무지(Erreurs de l\'Esprit)', domains: ["미신·민속(Superstition)","계몽주의 과학 철학","자연 마법(Natural Magic)","미신 타파","착시와 대기 현상"] },
  'e2757-naudegabriel': { category: 'person', rank: '마자리앵 추기경의 사서이자 피타고라스, 아그리파 등의 마법 혐의를 벗겨낸 17세기 석학(Érudit Distingué)', domains: ["인물·역사(Personnage)","17세기 프랑스 도서관학","마자리앵 도서관","『마법 혐의 변명서』(1625)","합리주의적 비판"] },
  'e2758-naurausepierresde': { category: 'superstition', rank: '악마가 하룻밤 사이에 쌓아 올렸다는 프랑스 랑그독 노루즈 고개의 거석 전설(Rochers Légendaires)', domains: ["미신·민속(Superstition)","프랑스 랑그독 민속","미디 운하 분수령","거석 기념물","악마의 토목 전설"] },
  'e2759-naviusaccius': { category: 'person', rank: '타르퀴니우스 프리스쿠스 왕의 의심을 꺾고 면도칼로 단단한 숫돌을 두 동강 낸 복술관(Célèbre Augure)', domains: ["인물·역사(Personnage)","고대 로마 공화정 역사","리비우스 로마사","조점관(Augur)","면도칼과 숫돌의 기적"] },
  'e2760-naylorjames': { category: 'person', rank: '호산나를 외치는 추종자들과 함께 나귀를 타고 브리스틀에 입성했다가 혀에 낙인을 찍힌 17세기 종교 광신자(Fanatique)', domains: ["인물·역사(Personnage)","영국 청교도 혁명","퀘이커교 역사","신성모독 재판","종교적 망상"] },
  'e2761-naxac': { category: 'myth', rank: '사막 한가운데서 사악한 디브와 마귀들이 밤마다 연회를 연다는 험준한 바위산(Rocher des Mauvais Esprits)', domains: ["신화·전설(Mythologie)","페르시아 민속","디브(Div) 마신","사막의 조난"] },
  'e2762-nebiros': { category: 'demon', rank: '광물과 동식물의 숨겨진 약효를 꿰뚫어 보며 미래를 예언하는 지옥의 대장군(Maréchal de Camp)', domains: ["악마·마귀(Démon)","『대 대주서(Grand Grimoire)』","지옥 제국 군사령관","강령술과 미래 예언","약초와 독극물 학술"] },
  'e2763-necato': { category: 'demon', rank: '라틴어로 살해를 뜻하는 이름으로 마녀들에게 독살을 부추기던 악령(Démon Invoqué au Sabbat)', domains: ["악마·마귀(Démon)","마녀재판과 사바트","사바트 연도","독살과 살육"] },
  'e2764-necromancie': { category: 'divination', rank: '무덤에서 갓 파낸 시체나 피의 제례를 통해 망자의 영혼을 불러내어 미래를 묻던 흑마술(Art d\'Évoquer les Morts)', domains: ["점술·예언(Divination)","흑마술의 정수","사령 소환","엔도르의 무당","호메로스 오디세이아","무덤 발굴 금기"] },
  'e2765-neffesoliens': { category: 'myth', rank: '프랑수아 라블레의 풍자 소설에 등장하는 오직 공기와 풍차 바람만을 먹고 사는 기괴한 종족(Peuple Imaginaire)', domains: ["신화·전설(Mythologie)","프랑수아 라블레 『가르강튀아와 팡타그뤼엘』","바람을 먹는 종족","풍자 문학"] },
  'e2766-nega': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","악마적 부정주의"] },
  'e2767-negation': { category: 'superstition', rank: '괴테의 파우스트에서 메피스토펠레스가 자처한 창조와 선을 파괴하는 악마의 본질(Esprit qui Toujours Nie)', domains: ["미신·민속(Superstition)","괴테 『파우스트』","메피스토펠레스","철학적 허무주의","악의 본질"] },
  'e2768-negres': { category: 'superstition', rank: '어둠과 지옥의 색채라는 이유로 악마를 검은 피부로 묘사했던 중세 유럽의 무지와 편견(Préjugés Populaires)', domains: ["미신·민속(Superstition)","중세 마녀재판 편견","악마의 검은 피부 묘사","인종적 편견 비판"] },
  'e2769-nekir': { category: 'myth', rank: '푸른 눈과 검은 피부로 거대한 쇠망치를 들고 무덤 속 망자의 신앙을 심문하는 두 천사(Anges de la Tombe)', domains: ["신화·전설(Mythologie)","이슬람 종말론","무덤의 심문","알라와 쿠란 신앙 시험","쇠망치 징벌"] },
  'e2770-nembroth': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["신화·전설(Mythologie)","상호참조","바벨탑의 군주 니므롯"] },
  'e2771-nemrod': { category: 'myth', rank: '하늘에 닿는 탑을 쌓아 신에게 화살을 쏘았다는 전설적인 바빌론의 거인 군주(Premier Tyran)', domains: ["신화·전설(Mythologie)","구약 성서 창세기 10장","바벨탑 건설","인류 최초의 폭군","단테 신곡 지옥편 거인"] },
  'e2772-nenufar': { category: 'superstition', rank: '뿌리와 꽃을 달여 마시면 성적 욕망과 음란한 악몽을 없애준다는 수도원 약초(Plante Antivénérienne)', domains: ["미신·민속(Superstition)","수도원 식물학","성욕 억제제(Anaphrodisiac)","순결의 상징","인큐버스 퇴치"] },
  'e2773-nephelim': { category: 'myth', rank: '하느님의 아들들과 사람의 딸들이 결합하여 낳은 태고의 포악한 거인 족속(Géants Bibliques)', domains: ["신화·전설(Mythologie)","구약 성서 창세기 6장","에녹서(Book of Enoch)","감시자 천사(Watcher)","대홍수의 원인"] },
  'e2774-nequam': { category: 'person', rank: '나침반의 자성을 유럽에 최초로 소개했으나 사후 마법사라는 누명을 쓴 세인트올번스 학승(Savant Anglais)', domains: ["인물·역사(Personnage)","12세기 영국 학문","파리 대학교 교수","나침반 최초 기록","『사물의 본성에 관하여』"] },
  'e2775-nerounere': { category: 'myth', rank: '혹한의 동토에 빛과 온기를 가져다주는 시베리아 캄차카반도의 태양신(Dieu du Soleil)', domains: ["신화·전설(Mythologie)","시베리아 원주민 신화","캄차카 이텔멘족","태양 숭배","봄의 해방"] },
  'e2776-nergal': { category: 'demon', rank: '지옥의 비밀경찰 장관이자 전염병과 전쟁을 관장하는 고대 메소포타미아의 맹독 악마(Démon d\'Enfer)', domains: ["악마·마귀(Démon)","바빌로니아·아시리아 신화","지하세계의 왕(에레시키갈의 남편)","전염병과 맹화","지옥 비밀경찰관"] },
  'e2777-neron': { category: 'person', rank: '사도 베드로와 바오로를 처형하고 요한계시록의 짐승 666으로 각인된 로마의 폭군(Empereur Romain)', domains: ["인물·역사(Personnage)","로마 제국 역사","요한계시록 13장 짐승(666)","기독교 대박해","네로 재림 전설(Nero Redivivus)"] },
  'e2778-netla': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","오르티에 [Ortie]"] },
  'e2779-netos': { category: 'myth', rank: '동인도 제도 몰루카 군도 원주민들이 두려워하는 악의적인 정령 무리', domains: ["신화·전설(Mythe)","인도네시아 몰루카 제도","토착 정령 신앙","악령과 재앙","란틸라"] },
  'e2780-neuf': { category: 'superstition', rank: '동서양의 제의, 황제 알현, 주술 의식에서 완전성과 신성함을 상징하는 숫자', domains: ["미신·풍습(Superstition)","수비학(Arithmancie)","구고두례(삼궤구고두)","사바트 9인 무리","노베나(9일 기도)"] },
  'e2781-neuhausfemmeblanchede': { category: 'crossref', rank: '보헤미아 로젠베르크 가문의 성에 출몰하는 백의의 유령', domains: ["상호참조","백의의 여인들 [Femmes blanches]","가문의 수호망령","보헤미아 전설"] },
  'e2782-neures': { category: 'myth', rank: '1년에 한 번씩 며칠 동안 늑대로 변신한다는 사르마티아의 전설적인 종족', domains: ["신화·전설(Mythe)","헤로도토스 역사","늑대인간(Lycanthropie)","고대 사르마티아","민간 변신 설화"] },
  'e2783-newhaven': { category: 'superstition', rank: '신대륙 연안에서 해난 사고와 폭풍우를 예고하며 구름 속에 출몰하는 공중 유령선', domains: ["미신·풍습(Superstition)","유령선 전설","뉴잉글랜드 해양 민담","코튼 매더의 기록","공중 신기루 현상"] },
  'e2784-niais': { category: 'superstition', rank: '신비와 영적 현상을 무조건 부정하며 자만에 빠진 자를 풍자한 사전적 해학', domains: ["미신·풍습(Superstition)","철학적 풍자","회의주의 비판","콜랭 드 플랑시의 격언"] },
  'e2785-nibrianes': { category: 'myth', rank: '가정마다 깃들어 거주자들의 험담과 불평을 감시하는 나폴리의 가택 요정', domains: ["신화·전설(Mythe)","이탈리아 나폴리 민담","가택 요정(Fée)","가정 평화의 수호","임대인과 세입자"] },
  'nickar': { category: 'demon', rank: '호수와 강에서 사람을 홀려 익사시키는 북유럽의 수룡이자 파괴적 오딘의 현현(Plate 49)', domains: ["악마·마귀(Démon)","루이 브르통 68대 목판화","북유럽 신화","익사의 악령","물의 정령 넥(Neck)"] },
  'e2787-nicksa': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","닉사스 [Nixas]"] },
  'e2788-nicolai': { category: 'crossref', rank: '상호참조 표제어 (Renvoi)', domains: ["상호참조","환각 [Hallucination]"] },
  'e2789-nid': { category: 'superstition', rank: '적을 파멸시키기 위해 저주의 문구와 모욕의 주문을 읊조리는 바이킹의 고등 흑마술', domains: ["미신·풍습(Superstition)","아이슬란드 세이두르(Seidur)","흑마술과 저주","니드스통(Níðstang)","바이킹 룬 주술"] },
  'e2790-niderjean': { category: 'person', rank: '마녀들의 집회와 악마 빙의 사례를 체계적으로 기록한 저작 『개미탑』의 저자', domains: ["인물·역사(Personnage)","도미니코 수도회","마녀학 문헌","개미탑(Formicarium)","빙의와 구마 의식"] },
  'e2791-niflheimabime': { category: 'myth', rank: '천지창조 이전부터 북쪽에 존재한 얼음과 안개의 제9세계 심연', domains: ["신화·전설(Mythe)","북유럽 신화 에다","제9세계 심연","흐베르겔미르 샘","니드호그와 망자의 고통"] },
  'e2792-nigromancie': { category: 'divination', rank: '광산의 갱도나 지하 암흑 속에서 악령을 소환하여 숨겨진 보물을 알아내는 비술', domains: ["점술·점막(Divination)","지하 점술","지옥 악령 소환","매장된 보물 탐사","강령술(Nécromancie) 혼용"] },
  'e2793-ninondelenclos': { category: 'person', rank: '80세가 넘도록 눈부신 젊음과 미모를 유지하여 악마와의 계약 소문이 돈 프랑스 명사', domains: ["인물·역사(Personnage)","17세기 프랑스 살롱","악마와의 청춘 계약","불로장생의 비약","몰리에르와 볼테르의 후원"] },
  'e2794-nirudy': { category: 'myth', rank: '거인의 어깨 위에 올라타 손에 번뜩이는 칼을 쥐고 있는 인도의 악령왕', domains: ["신화·전설(Mythe)","인도 신화(베다)","남서방위의 수호신","나찰(라크샤사)의 지배자","어둠과 파멸의 신"] },
  'e2795-nis': { category: 'myth', rank: '농가와 가축을 보살피지만 버터가 빠진 귀리죽에 분노하는 스칸디나비아의 난쟁이 요정', domains: ["신화·전설(Mythe)","덴마크·스칸디나비아 민담","가택 요정 닛세(Nisse)","톰테(Tomte)","가축과 농가 수호"] },
  'e2796-nisses': { category: 'myth', rank: '스코틀랜드 하일랜드 전설에 깃든 친절하고 작은 요정 무리', domains: ["신화·전설(Mythe)","스코틀랜드 민담","하일랜드 요정","가택 정령"] },
  'e2797-nitoes': { category: 'myth', rank: '중대한 대소사에서 작은 북을 울리고 횃불을 밝혀 신탁을 청취하던 몰루카의 정령', domains: ["신화·전설(Mythe)","인도네시아 몰루카 제도","토착 신탁 의식","강신술과 북소리","정령 숭배"] },
  'e2798-nixas': { category: 'myth', rank: '발트해 연안에서 안개와 폭풍우를 다스리며 숭배받던 넵투누스 속성의 바다와 강의 신', domains: ["신화·전설(Mythe)","발트해 슬라브·게르만 신화","바다의 신 넵투누스","폭풍우와 안개","수중 정령 닉스(Nix)"] },
  'e2799-noalsjeanne': { category: 'person', rank: '방앗간 맷돌에 주술 쐐기를 박아 곡식 분쇄를 멈추게 한 죄로 보르도에서 화형된 마녀', domains: ["인물·역사(Personnage)","보르도 고등법원 판결","마녀재판(1619년)","방앗간 방해 마술(Chevillage)","피에르 드 랑크르"] },
  'e2800-nodiercharles': { category: 'person', rank: '요정과 도깨비의 서정적 전설을 프랑스 낭만주의 문학으로 승화시킨 프랑스 아카데미 문호', domains: ["인물·역사(Personnage)","프랑스 낭만주의 문학","트릴비(Trilby)","고딕 환상소설","민간 설화 수집"] },
  'e2801-noe': { category: 'person', rank: '신의 계시로 방주를 건조하여 인류를 보존하고 비밀스런 오컬트 지혜를 전수한 성서의 족장', domains: ["인물·역사(Personnage)","구약 성서 창세기","대홍수와 노아의 방주","동방의 오컬트 전설","연금술과 천문 비의"] },
  'e2802-noeljacques': { category: 'person', rank: '끊임없이 유령의 환각을 목격하며 자신이 악령에 씌었다고 주장한 파리의 청년', domains: ["인물·역사(Personnage)","1667년 파리 소동","악령 빙의와 강박(Obsession)","아르쿠르 대학","정신의학적 환각증"] },
  'e2803-noh': { category: 'myth', rank: '신의 명을 받아 창문이나 문을 통해 지상에 강림했다는 남아프리카 코이코이족의 시조', domains: ["신화·전설(Mythe)","남아프리카 코이코이(호텐토트) 신화","인류 기원 설화","시조신","아프리카 창조 전승"] },
  'e2804-noix': { category: 'superstition', rank: '불에 태워 빻은 재를 포도주와 기름에 개어 바르면 머리카락이 무성해진다는 마법적 처방', domains: ["미신·풍습(Superstition)","민간 약초 주술","탈모 방지 비방","호두의 상징성","유사성의 법칙"] },
  'e2805-nomancie': { category: 'divination', rank: '이름을 이루는 철자와 음운의 수비학적 해석을 통해 운명을 예언하는 비술', domains: ["점술·점막(Divination)","오노만시(Onomancie)","이름 점술","수비학적 운명 감정"] },
  'e2806-nombredeux': { category: 'superstition', rank: '피타고라스와 플라톤 철학 이래 조화의 파괴와 악의 원리로 낙인찍힌 불행의 숫자', domains: ["미신·풍습(Superstition)","피타고라스 수비학","불길한 숫자 2","이원론과 대립","고대 로마의 불운관"] },
  'e2807-nonos': { category: 'myth', rank: '물로 둘러싸인 험한 바위와 숲속에 도사려 제물을 요구하는 필리핀의 악령', domains: ["신화·전설(Mythe)","필리핀 토착 신앙","수변 악령","제물 봉헌 의식","원주민 공포 설화"] },
  'e2808-nornes': { category: 'myth', rank: '세계수 위그드라실 뿌리 곁에서 인간과 신들의 운명의 실을 잣는 세 여신', domains: ["신화·전설(Mythe)","북유럽 신화","우르드(과거)","베르단디(현재)","스쿨드(미래)","운명의 세 여신(파르카이)"] },
  'e2809-norsgubb': { category: 'demon', rank: '스웨덴 민간 전승에서 혹한과 어둠을 몰고 오는 악마를 부르는 대중적 별칭', domains: ["악마·마귀(Démon)","스웨덴 민속 신앙","북방의 노인","사탄의 민간 이명","스칸디나비아 설화"] },
  'e2810-nostradamusmichel': { category: 'person', rank: '16세기 프랑스 궁정을 뒤흔든 의사이자 4행시 예언집 『백시선』의 저자(p.494 삽화)', domains: ["인물·역사(Personnage)","루이 브르통 본문 목판화","르네상스 점성술","백시선(Les Prophéties)","앙리 2세와 카트린 드 메디시스"] },
  'e2811-notarique': { category: 'grimoire', rank: '히브리어 성서 단어의 철자들을 머리글자로 풀어 비밀 문장을 조합하는 유대 카발라 3대 비술', domains: ["마도서·문헌(Grimoire)","유대 카발라(Cabale)","노타리콘(Notarikon)","게마트리아와 테무라","성서 암호 해독"] },
  'e2812-noyes': { category: 'superstition', rank: '출항하려는 배의 갑판에 건져 올린 익사자가 숨을 거두면 파멸과 난파를 예고하는 해양 미신(p.494 삽화)', domains: ["미신·풍습(Superstition)","루이 브르통 본문 목판화","영국·미국 뱃사람 미신","해양 조난과 불길한 징조","해난 구호"] },
  'e2813-nuitdestrepasses': { category: 'superstition', rank: '자정에 무덤에서 깨어난 망자들의 영혼이 집집마다 문을 두드린다는 플랑드르의 공포 민담(p.495 삽화)', domains: ["미신·풍습(Superstition)","루이 브르통 본문 목판화","플랑드르 민간 신앙","만성절과 위령의 날","망령의 부활과 배회"] },
  'e2814-numapompilius': { category: 'person', rank: '님프 에게리아의 신탁을 받아 종교 의례를 제정하고 마술사로도 오인된 로마의 군주', domains: ["인물·역사(Personnage)","고대 로마 역사","님프 에게리아(Égérie)","길일과 흉일 제정","악마소환사 오인"] },
  'e2815-nursie': { category: 'myth', rank: '시빌라의 신탁 동굴이 자리하여 중세 내내 마법사들이 비의를 구하러 찾던 아펜니노의 성지', domains: ["신화·전설(Mythe)","이탈리아 아펜니노 산맥(노르차)","시빌라의 동굴(Grotte de la Sibylle)","마녀와 마법사의 순례지","이탈리아 주술 전승"] },
  'nybbas': { category: 'demon', rank: '기괴한 몸짓으로 궁정을 웃기며 인간에게 헛된 망상을 불어넣는 지옥 하급 궁정관(Plate 50)', domains: ["악마·마귀(Démon)","루이 브르통 68대 목판화","지옥의 어릿광대(Grand Paradiste)","환각과 백일몽","사기꾼과 익살꾼"] },
  'e2817-nymphes': { category: 'myth', rank: '숲, 샘, 나무, 산에 깃들어 사는 아름다운 여성 신령이자 유혹의 여성 마귀(p.496 삽화)', domains: ["신화·전설(Mythe)","루이 브르통 본문 목판화","그리스·로마 신화","자연의 정령","여성 악령(서큐버스) 연계"] },
  'e2818-nymphedelelbe': { category: 'myth', rank: '강변 바위에 앉아 황금 머리칼을 빗으며 강의 범람과 재앙을 예고하는 독일의 물귀신(p.496 삽화)', domains: ["신화·전설(Mythe)","루이 브르통 본문 목판화","독일 엘베강 전설","요하네스 프레토리우스 기록","세이렌과 로렐라이"] },
  'e2819-nynauldjeande': { category: 'person', rank: '늑대 변신 망상과 마녀의 탈혼 상태를 의학적·마술적으로 규명한 17세기 프랑스 학자', domains: ["인물·역사(Personnage)","마녀학 및 늑대인간 연구","늑대인간론(De la Lycanthropie)","악마의 망상과 식물 마약","1615년 파리"] },
  'e2820-nyol': { category: 'person', rank: '마녀사냥의 화형 소식을 듣고 은신했다가 혐의를 벗은 16세기 말 프랑스의 자작', domains: ["인물·역사(Personnage)","16세기 말 프랑스 귀족","마녀재판의 공포","도피와 누명","브로스 자작령"] },
  'e2821-nyphoounyphusaugustin': { category: 'person', rank: '턱수염 난 악령 사역마를 데리고 다니며 비의를 배웠다는 르네상스 이탈리아의 철학자', domains: ["인물·역사(Personnage)","르네상스 아리스토텔레스주의","점술론(De divinatione)","사역마 전설","피에르 드 랑크르의 기록"] },
  'e2822-nysrock': { category: 'demon', rank: '지옥 제2계급 악마이자 벨제뷔트 궁정의 식탁 쾌락과 미식 탐닉을 관장하는 주방장', domains: ["악마·마귀(Démon)","지옥 제2계급 악마","벨제뷔트의 총괄 주방장(Chef de cuisine)","미식과 식탐(Gourmandise)","음식의 정교한 유혹"] },

  // O entries curated metadata (p.497-512)
  'e2823-oannesouoes': { category: 'myth', rank: '홍해에서 올라와 메소포타미아 인류에게 문명과 지혜를 전수한 반인반어신(Monstre Fabuleux)', domains: ["신화·전설(Mythologie)","메소포타미아 신화","베로소스 역사","아프칼루(Apkallu) 현자","반인반어"] },
  'e2824-ob': { category: 'demon', rank: '무당의 배나 뼈 속에서 은밀하게 신탁을 속삭이던 고대 시리아의 악령(Démon des Syriens)', domains: ["악마·마귀(Démon)","고대 근동 신앙","복화술(Engastrimythe)","성서의 혼령(‘오브’)","신탁령"] },
  'e2825-obereitjacqueshermann': { category: 'person', rank: '현자의 돌과 불로불사를 탐구했던 18세기 스위스의 괴짜 연금술사이자 신비주의자(Alchimiste et Mystique)', domains: ["인물·역사(Personnage)","18세기 스위스 연금술","현자의 돌","신비주의 철학","괴테와의 교류"] },
  'e2826-obergemeiner': { category: 'superstition', rank: '오스트리아 그라츠 근교 뮌히호프 저택을 덮친 18세기 폴터가이스트 소동(Maison Hantée)', domains: ["미신·민속(Superstition)","오스트리아 민속","폴터가이스트","유령 들린 집","가구 비행과 돌팔매"] },
  'e2827-oberon': { category: 'myth', rank: '마법의 뿔나팔과 황금 술잔을 지닌 요정국과 공중 정령들의 군주(Roi des Fées)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","샤를마뉴 무훈시 『위옹 드 보르도』","셰익스피어 『한여름 밤의 꿈』","요정의 왕"] },
  'e2828-obesslik': { category: 'person', rank: '교회 약탈과 살육을 일삼다 교수형된 뒤 유령으로 나타난 15세기 보헤미아 도적(Brigand Hussite)', domains: ["인물·역사(Personnage)","후스 전쟁","보헤미아 전설","교회 약탈의 신벌","교수형과 원혼"] },
  'e2829-obole': { category: 'superstition', rank: '망자가 스틱스강을 건널 수 있도록 시신의 입이나 눈 위에 얹어두던 고대 동전(Pièce des Morts)', domains: ["미신·민속(Superstition)","그리스·로마 장례 풍습","저승 뱃사공 카론","스틱스강의 노자돈","동전 매장"] },
  'e2830-obsedes': { category: 'superstition', rank: '악마가 몸속에 침투하지 않고 외부에서 감각과 정신을 지속적으로 괴롭히는 상태(Obsession Démoniaque)', domains: ["미신·민속(Superstition)","가톨릭 악마학 교리","돔 칼메 『악마학 논고』","빙의(Possession)와 강박(Obsession)","영적 분별"] },
  'e2831-obsequensjulius': { category: 'person', rank: '고대 로마 공화정 시대의 모든 기이한 천재지변과 흉조를 집대성한 4세기 역사가(Auteur des Prodiges)', domains: ["인물·역사(Personnage)","고대 로마 역사","『이적의 서(Prodigiorum Liber)』","티투스 리비우스 발췌","전조와 신탁"] },
  'e2832-occultes': { category: 'superstition', rank: '마법, 강령술, 연금술, 점성술, 카발라 등 숨겨진 자연의 힘을 탐구하던 비전 학문(Sciences Occultes)', domains: ["미신·민속(Superstition)","오컬티즘(Occultism)","헤르메스주의","자연 마법","신비주의 철학"] },
  'e2833-ochosias': { category: 'person', rank: '다락 난간에서 떨어져 병들자 파리의 마신 바알세붑에게 신탁을 구했다가 급사한 왕(Roi d\'Israël)', domains: ["인물·역사(Personnage)","구약 성서 열왕기하 1장","에크론의 바알세붑","예언자 엘리야의 책망","우상 숭배의 신벌"] },
  'e2834-oculomancie': { category: 'divination', rank: '용의자의 눈동자를 유심히 들여다보아 도둑질과 거짓말을 밝혀내던 고대 점술(Divination par les Yeux)', domains: ["점술·예언(Divination)","도둑 색출 점술","신체 점술","눈동자의 반사"] },
  'e2835-oddo': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["신화·전설(Mythologie)","상호참조","북유럽 핀란드 전설"] },
  'e2836-oddon': { category: 'person', rank: '마법으로 바람과 안개를 불러일으켜 상선을 약탈했던 중세 플랑드르의 마술사 해적(Pirate Flamand)', domains: ["인물·역사(Personnage)","북해 해적사","날씨 마법","바람의 조종","마술사 해적"] },
  'e2837-odesprit': { category: 'superstition', rank: '자석과 인체에서 방출되는 오드력을 영혼의 물질적 실체로 본 19세기 심령주의 학설(Force Odique)', domains: ["미신·민속(Superstition)","19세기 심령주의","카를 폰 라이헨바흐","오드력(Odic force)","동물 자기학"] },
  'e2838-odet': { category: 'demon', rank: '말의 형상으로 어둠 속에 나타나 나그네를 유혹하는 밤의 악마(Démon de la Nuit)', domains: ["악마·마귀(Démon)","프랑스 오를레앙 민속","변신 악마","야간의 공포","말 형상 악령"] },
  'e2839-odeur': { category: 'superstition', rank: '마녀재판에서 악마가 남긴 지독한 유황 냄새와 성인 유해의 장미 향기(Signe d\'Infection)', domains: ["미신·민속(Superstition)","마녀재판 증거","유황 악취(Brimstone)","성인의 향기(Odor of Sanctity)","영적 식별"] },
  'e2840-odin': { category: 'myth', rank: '지혜를 얻기 위해 한쪽 눈을 바치고 두 마리 까마귀를 거느린 에시르 신족의 주신(Dieu des Scandinaves)', domains: ["신화·전설(Mythologie)","북유럽 신화","에다(Edda)","후긴과 무닌(까마귀)","룬(Rune) 마법과 발할라"] },
  'e2841-odontotyrannus': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["신화·전설(Mythologie)","상호참조","알렉산드로스 원정 괴담","바다뱀"] },
  'e2842-odorat': { category: 'superstition', rank: '카르다노가 논한 비정상적으로 발달한 후각과 영적 기질(Subtilité de Cardan)', domains: ["미신·민속(Superstition)","지롤라모 카르다노","후각과 영적 감응","멜랑콜리아 기질"] },
  'e2843-odet': { category: 'demon', rank: '사바트 연도에서 마녀들이 찬양하던 어둠의 하급 악마(Démon du Sabbat)', domains: ["악마·마귀(Démon)","1863 원서 삽화 수록","마녀재판과 사바트","사바트 연도","야간 악령"] },
  'e2844-oeil': { category: 'superstition', rank: '고르곤의 단 하나의 눈과 상대를 병들게 하는 사악한 시선 미신(Mauvais Œil)', domains: ["미신·민속(Superstition)","사안(邪視) 신앙","그리스 신화 고르곤","이탈리아 말로키오(Malocchio)","코르노 부적"] },
  'e2845-oenomancie': { category: 'divination', rank: '포도주의 색상, 거품, 잔에 따를 때의 소리로 길흉을 읽던 고대 점술(Divination par le Vin)', domains: ["점술·예언(Divination)","고대 그리스·로마 점술","디오니소스 신앙","제례 헌주(Libation)","포도주 거품 해석"] },
  'e2846-oenothere': { category: 'myth', rank: '단칼에 40명의 적군을 베어 넘겼다는 샤를마뉴 무훈시의 거인(Géant de Charlemagne)', domains: ["신화·전설(Mythologie)","샤를마뉴 전설","중세 프랑스 무훈시","거인 영웅"] },
  'e2847-oeonistice': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["점술·예언(Divination)","상호참조","새의 비행 점술","고대 그리스 신탁"] },
  'e2848-oes': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["신화·전설(Mythologie)","상호참조","바빌로니아 반인반어신"] },
  'e2849-oeufs': { category: 'superstition', rank: '달걀을 먹은 뒤 껍데기를 으깨지 않으면 마녀가 배로 타고 바다로 나간다는 민간 미신(Croyance Populaire)', domains: ["미신·민속(Superstition)","유럽 민간 미신","마녀의 항해","달걀점(Oomancie)","껍데기 파괴"] },
  'e2850-og': { category: 'myth', rank: '대홍수 때 방주 지붕에 매달려 살아남았다는 탈무드 전승의 거인(Roi de Basan)', domains: ["신화·전설(Mythologie)","구약 성서 신명기 3장","유대 탈무드 전승","거인족 르바임","철제 침대"] },
  'e2851-ogierledanois': { category: 'myth', rank: '조국이 위기에 처할 때 깨어난다는 크론보르 성 지하의 잠자는 영웅(Héros Endormi)', domains: ["신화·전설(Mythologie)","샤를마뉴 12기사","덴마크 국민 영웅(홀게르 단스케)","잠자는 전설의 군주","아발론 섬 전승"] },
  'e2852-ogres': { category: 'myth', rank: '어린아이를 잡아먹고 피를 마신다는 유럽 전설과 동화의 포악한 식인 괴물(Monstres Fabuleux)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","샤를 페로 동화","호메로스 폴리페모스","민담의 식인 괴물"] },
  'e2853-oiarou': { category: 'superstition', rank: '꿈에서 보거나 우연히 발견한 조약돌이나 뼈를 신령으로 모신 북미 원주민 신앙(Culte des Iroquois)', domains: ["미신·민속(Superstition)","북미 원주민 신앙","이로쿼이 부족","페티시즘(Fetishism)","오렌다(Orenda) 영기"] },
  'e2854-oigours': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["신화·전설(Mythologie)","상호참조","오거의 어원","중앙아시아 유목민"] },
  'e2855-oilette': { category: 'demon', rank: '사바트 연도에서 마녀들이 찬양하던 무명의 지옥 악령(Démon sans Renommée)', domains: ["악마·마귀(Démon)","마녀재판과 사바트","사바트 연도","하급 악령"] },
  'e2856-oiseaux': { category: 'divination', rank: '까마귀와 제비의 울음소리를 듣고 인간의 미래를 예언했던 10세기 아말피 대주교(Chant des Oiseaux)', domains: ["점술·예언(Divination)","가브리엘 노데 기록","새의 언어(Language of Birds)","조점술","아말피 대주교"] },
  'e2857-okkisiks': { category: 'myth', rank: '바람, 천둥, 계절의 순환을 관장하는 북미 휴런 인디언의 공중 영령들(Génies des Hurons)', domains: ["신화·전설(Mythologie)","북미 원주민 신앙","휴런(와이언돗) 부족","자연 정령","기후와 풍요"] },
  'e2858-oldenberg': { category: 'myth', rank: '황금 왕관을 쓰고 지하 궁전에서 제국의 부활을 기다리는 잠자는 샤를마뉴(Montagne d\'Allemagne)', domains: ["신화·전설(Mythologie)","독일 알프스 전설","잠자는 황제(Kyffhäuser 모티프)","샤를마뉴 대제","황금 궁전"] },
  'e2859-oldenbourg': { category: 'superstition', rank: '오토 백작이 사냥 중 요정 처녀에게 건네받아 가문의 보물로 전해진 은뿔잔(Corne Merveilleuse)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","발타사르 베커 기록","독일 올덴부르크 가문","요정의 선물"] },
  'e2860-oldgentleman': { category: 'demon', rank: '영국 민간에서 사탄의 이름을 부르기 두려워 우아하게 위장하여 부르던 통칭(Nom du Diable)', domains: ["악마·마귀(Démon)","영국 민속","악마의 완곡어법","올드 닉(Old Nick) 동류","신사로 위장한 사탄"] },
  'e2861-oliverobert': { category: 'person', rank: '사바트에서 독초와 기름을 제조해 가축을 몰살시킨 혐의로 화형당한 16세기 마법사(Sorcier de Falaise)', domains: ["인물·역사(Personnage)","노르망디 마녀재판","1556년 팔레즈 화형","사바트 독약 제조","보댕 『마법사의 악마광』"] },
  'e2862-olivier': { category: 'demon', rank: '사바트 연도에서 대천사들의 대공으로 칭송받던 타락천사 악마(Prince des Archanges)', domains: ["악마·마귀(Démon)","마녀재판과 사바트","사바트 연도","타락천사 계급"] },
  'e2863-ololygmancie': { category: 'divination', rank: '한밤중 개의 구슬픈 하울링 울음소리로 전염병과 죽음을 예측하던 고대 점술(Hurlement des Chiens)', domains: ["점술·예언(Divination)","동물 점술(Zoomancie)","헤카테 여신 신앙","죽음과 전란의 흉조","개 하울링"] },
  'e2864-olys': { category: 'superstition', rank: '식인 악어의 습격을 막기 위해 강을 건널 때 착용하던 마다가스카르 원주민 부적(Talisman de Madagascar)', domains: ["미신·민속(Superstition)","마다가스카르 민속","원주민 사제 옴비아시","호신 부적","악어 퇴치"] },
  'e2865-ombre': { category: 'superstition', rank: '그림자를 영혼의 분신으로 여겨 악마에게 팔거나 잃어버리면 죽는다는 민간 전승(Système Mythologique)', domains: ["미신·민속(Superstition)","그리스·로마 망령관(Skia)","샤미소 『페터 슈레밀』","악마와의 계약","영혼의 분신"] },
  'e2866-ombriel': { category: 'myth', rank: '인간의 가슴에 음울한 비탄과 멜랑콜리아를 불어넣는 묵직한 날개의 늙은 정령(Génie Vieux et Rechigné)', domains: ["신화·전설(Mythologie)","알렉산더 포프 『머리타래의 겁탈』","정령학(Gnome)","우울증과 비탄","공중 정령"] },
  'e2867-omestes': { category: 'myth', rank: '인간 희생 제물의 날고기를 먹는 포악한 식인 늑대인간 신앙의 디오니소스(Surnom de Bacchus)', domains: ["신화·전설(Mythologie)","고대 그리스 밀의종교","오모파기아(날고기 섭취 의식)","인신공양","테미스토클레스 살라미스 해전"] },
  'e2868-omomancie': { category: 'divination', rank: '희생양의 어깨뼈를 불에 구워 생긴 균열과 그을음으로 미래를 읽던 고대 유목 점술(Divination par les Épaules)', domains: ["점술·예언(Divination)","골점술(Scapulimancy)","아랍 베두인 점술","몽골 유목민 의식","균열 점괘"] },
  'e2869-omphalomancie': { category: 'divination', rank: '신생아 탯줄의 매듭 수와 길이로 어머니의 다음 자녀 수를 점치던 산파들의 점술(Divination par le Nombril)', domains: ["점술·예언(Divination)","민간 출산 점술","산파들의 미신","탯줄 매듭"] },
  'e2870-omphalophysiques': { category: 'superstition', rank: '턱을 가슴에 묻고 배꼽을 응시하며 타보르산의 영적 빛을 보려 했던 14세기 비잔티움 수도사들(Fanatiques de Bulgarie)', domains: ["미신·민속(Superstition)","비잔티움 동방정교회","헤시카즘(Hesychasm)","타보르산의 빛","정적주의 논쟁"] },
  'e2871-on': { category: 'grimoire', rank: '테트라그라마톤과 함께 악령을 굴복시키는 강력한 신의 이름으로 사용된 주술어(Mot Magique)', domains: ["마도서·문헌(Grimoire)","솔로몬의 열쇠","카발라 신성 문자","이집트 헬리오폴리스","구마 주문"] },
  'e2872-ondins': { category: 'myth', rank: '파라켈수스가 규정한 4대 원소 중 물을 다스리며 인간과의 사랑으로 영혼을 얻는 요정(Esprits Élémentaires)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","파라켈수스 원소 정령론","물의 요정(Nymphe)","불멸의 영혼 획득"] },
  'e2873-oneirocritique': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["점술·예언(Divination)","상호참조","아르테미도로스 해몽서","꿈의 상징 해독"] },
  'e2874-ongles': { category: 'superstition', rank: '깎은 손톱 조각을 땅에 묻거나 태우지 않으면 흑마술의 매개물이 된다는 민간 신앙(Superstition Populaire)', domains: ["미신·민속(Superstition)","마다가스카르 원주민 신앙","유럽 손톱 마법","접촉 주술(Contagious Magic)","손톱점(Onychomancie)"] },
  'e2875-onguents': { category: 'superstition', rank: '사바트로 날아가기 위해 온몸에 발랐던 벨라도나와 독초 연고(Onguents Magiques)', domains: ["미신·민속(Superstition)","마녀재판과 사바트","비행 연고(Unguentum)","벨라도나와 사리풀","환각 생리학"] },
  'e2876-onomancie': { category: 'divination', rank: '이름을 이루는 알파벳 철자와 모음의 수비학적 가치로 운명을 읽던 고대 점술(Divination par les Noms)', domains: ["점술·예언(Divination)","피타고라스 수비학","고대 그리스 성명학","모음과 자음","운명 예측"] },
  'e2877-onychomancie': { category: 'divination', rank: '기름과 그을음을 바른 소년의 손톱에 태양빛을 비추어 환영을 보던 점술(Divination par les Ongles)', domains: ["점술·예언(Divination)","수경점술(Catoptromancy)","손톱 마법","도둑 색출","소년 매개체"] },
  'e2878-oomancie': { category: 'divination', rank: '달걀 흰자를 따뜻한 물에 떨어뜨려 굳어지는 형상으로 운명을 읽던 고대 점술(Divination par les Œufs)', domains: ["점술·예언(Divination)","고대 로마 점술","리비아 황후의 전설","황제 탄생 예언","물점술"] },
  'e2879-opale': { category: 'superstition', rank: '심장을 상쾌하게 하고 독을 막아주나 불길한 액운을 부른다고도 믿어진 보석(Pierre Précieuse)', domains: ["미신·민속(Superstition)","광물 마법","월터 스콧 『기어스타인의 앤』","보석의 변색","길흉의 양면성"] },
  'e2880-opalski': { category: 'superstition', rank: '유황 김이 솟구치는 온천에 지하 악령이 살고 있다고 믿었던 캄차카 원주민 미신(Sources Chaudes)', domains: ["미신·민속(Superstition)","시베리아 캄차카 민속","지열 온천","지하 악령 숭배","이텔멘족 전승"] },
  'e2881-ophiogenes': { category: 'myth', rank: '뱀의 피를 이어받아 타액과 접촉만으로 맹독사 독을 치유하던 고대 가문(Charmeurs de Serpents)', domains: ["신화·전설(Mythologie)","고대 그리스 전설","스트라보 지리지","뱀술사","독 해독 면역"] },
  'e2882-ophiomancie': { category: 'divination', rank: '뱀이 기어가는 궤적, 똬리의 형태, 먹이를 삼키는 방식으로 길흉을 치던 고대 점술(Divination par les Serpents)', domains: ["점술·예언(Divination)","동물 점술(Zoomancie)","고대 그리스 밀의","아스클레피오스 신전","뱀의 신탁"] },
  'e2883-ophionee': { category: 'myth', rank: '크로노스 이전 올림포스를 다스리다 타르타로스로 추락한 악마들의 수장(Chef des Démons)', domains: ["신화·전설(Mythologie)","오르페우스 밀의 신화","올림포스의 원초 지배자","타르타로스 추락","기독교 사탄의 원형"] },
  'e2884-ophioneus': { category: 'person', rank: '선천적 장님이었으나 백일해를 앓은 뒤 미래를 내다보는 혜안을 얻은 그리스 예언자(Célèbre Devin)', domains: ["인물·역사(Personnage)","고대 그리스 역사","파우사니아스 기록","맹인 예언자","투시력"] },
  'e2885-ophites': { category: 'superstition', rank: '에덴의 뱀을 인간에게 영적 지혜를 깨우쳐준 참된 선구자로 숭배한 2세기 이단(Secte Gnostique)', domains: ["미신·민속(Superstition)","초기 기독교 영지주의","그리스어 오피스(Ophis=뱀)","데미우르고스 타파","성찬식 뱀 숭배"] },
  'e2886-ophthalmius': { category: 'superstition', rank: '착용자를 다른 사람들의 눈에 보이지 않게 감추어준다는 전설의 도둑의 보석(Pierre Fabuleuse)', domains: ["미신·민속(Superstition)","중세 보석지","투명 마법","도둑들의 부적","알베르투스 마그누스"] },
  'e2887-ophthalmoscopie': { category: 'divination', rank: '눈의 색깔, 동공의 크기, 안구 돌출도로 성격과 기질을 판별하던 인상학(Art de Connaître les Hommes)', domains: ["점술·예언(Divination)","인상학(Physiognomie)","고대 관상술","안구 색채론","눈의 특징"] },
  'e2888-optimisme': { category: 'superstition', rank: '“모든 것은 가능한 최선의 세계에 있다”며 현실의 악과 고통을 방관하던 철학적 미망(Chimère Philosophique)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","라이프니츠 변신론","볼테르 『캉디드』","리스본 대지진"] },
  'e2889-oracles': { category: 'superstition', rank: '델포이와 도도나 신전에서 피티아 무녀를 조종하여 세상을 미혹했던 사탄의 신전들(Temples Païens)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","델포이 아폴론 신탁","피티아 무녀의 삼발이","그리스도 탄생과 신탁 침묵","폰토넬 『신탁의 역사』"] },
  'e2890-orages': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","템페스타리이(Tempestarii)","우박과 벼락 마술"] },
  'e2891-oraisonduloup': { category: 'superstition', rank: '일출 때 5일간 외우면 들판에서 사나운 늑대의 습격을 막는다는 민간 주술 기도(Prière Superstitieuse)', domains: ["미신·민속(Superstition)","프랑스 농촌 민속","늑대 퇴치 부적","주술 기도문","맹수 결박"] },
  'e2892-oray': { category: 'demon', rank: '녹색 옷을 입고 활과 화살통을 멘 30개 군단의 지옥 대후작(Grand Marquis des Enfers)', legions: 30, domains: ["악마·마귀(Démon)","솔로몬 72 악마","지옥 30군단 통솔","전투와 불화의 조장","화살에 의한 치명상과 부패"] },
  'e2893-orcavelle': { category: 'myth', rank: '아마디스 드 가울라를 마법의 잠에 빠뜨리고 지하 미궁에 가두었던 사악한 마녀(Magicienne Célèbre)', domains: ["신화·전설(Mythologie)","기사도 문학 『아마디스 드 가울라』","미궁 마법","매혹과 감금"] },
  'e2894-ordalie': { category: 'superstition', rank: '달군 쇠를 쥐거나 끓는 물에 손을 넣어 결백을 증명하던 중세의 가혹한 신판(Épreuves Judiciaires)', domains: ["미신·민속(Superstition)","중세 법제사","하느님의 심판(Judicium Dei)","화심(火審)과 수심(水審)","교황령 금지"] },
  'e2895-oreille': { category: 'superstition', rank: '왼쪽 귀가 울리면 남이 흉을 보고 오른쪽 귀가 울리면 칭찬한다는 민간 속설(Croyance Populaire)', domains: ["미신·민속(Superstition)","신체 징조 미신","고대 로마 플리니우스","좌우 길흉 미신"] },
  'e2896-oresmeguillaume': { category: 'person', rank: '샤를 5세의 고문이자 점성술과 미신적 마법을 이성적으로 논박한 14세기 대철학자(Savant Évêque)', domains: ["인물·역사(Personnage)","중세 스콜라 철학","리지외 주교","『점성술에 반대하는 논고』","수학적 합리주의"] },
  'e2897-orfa': { category: 'myth', rank: '아브라함이 던져진 불구덩이가 변하여 생겨났다는 터키 우르파의 성스러운 연못(Lac Poétique)', domains: ["신화·전설(Mythologie)","이슬람 성서 전승","터키 샨르우르파(에데사)","예언자 아브라함(이브라힘)","신성한 잉어"] },
  'e2898-orgueil': { category: 'superstition', rank: '가장 아름다운 천사 루시퍼를 지옥의 사탄으로 전락시킨 모든 죄악의 뿌리(Premier des Péchés)', domains: ["미신·민속(Superstition)","가톨릭 칠죄종(Seven Deadly Sins)","루시퍼의 반역","신학적 도덕론"] },
  'e2899-orias': { category: 'demon', rank: '뱀의 꼬리를 쥔 사자의 모습으로 말을 탄 30개 군단의 점성술 악마 대후작(Grand Marquis)', legions: 30, domains: ["악마·마귀(Démon)","솔로몬 72 악마","지옥 30군단 통솔","점성술과 천문학","친구와 적의 화해"] },
  'e2900-originelpeche': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","아담의 타락","기독교 원죄 교리"] },
  'e2901-originesdumonde': { category: 'myth', rank: '혼돈의 알, 거인의 시체, 빛과 어둠의 대립으로 세상을 설명한 고대 신화들(Cosmogonies Anciennes)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","비교우주론(Cosmogony)","우주란(Cosmic Egg)","창세기와 오컬트"] },
  'e2902-ornithomancie': { category: 'divination', rank: '독수리, 까마귀, 올빼미의 비행 방향과 날갯짓 소리로 미래를 판별하던 고대 그리스 점술(Vol et Chant)', domains: ["점술·예언(Divination)","고대 그리스 점술","오스피키움(Auspice)","새의 비행 궤적","조류 점술"] },
  'orobas': { category: 'demon', rank: '말의 모습으로 나타나 거짓 없이 진실만을 말하는 20개 군단의 지옥 대공(Grand Prince du Sombre Empire)', legions: 20, domains: ["악마·마귀(Démon)","1863 원서 삽화 수록","68대 악마 목판화","솔로몬 72 악마","성실한 악마","지옥 20군단 통솔"] },
  'e2904-oromasis': { category: 'myth', rank: '카발라와 장미십자회에서 화염의 원소를 통치하는 최고의 살라만더 군주(Prince des Salamandres)', domains: ["신화·전설(Mythologie)","원소 정령론","화염의 정령 살라만더","장미십자회 신비주의","보나방튀르 드 빌라르 『빌라르 백작』"] },
  'e2905-oromaze': { category: 'myth', rank: '어둠의 마신 아리만과 끝없는 영적 전쟁을 벌이는 조로아스터교의 빛과 선의 창조신(Dieu du Bien)', domains: ["신화·전설(Mythologie)","고대 페르시아 조로아스터교","아베스타(Avesta)","빛과 어둠의 이원론","아리만과의 결전"] },
  'e2906-oronte': { category: 'myth', rank: '시리아 오론테스강 준설 중 발굴된 길이 11큐빗의 거대한 인간 유골(Squelette de Géant)', domains: ["신화·전설(Mythologie)","파우사니아스 여행기","고대 거인 유골 발굴","선사시대 화석 오인","시리아 오론테스강"] },
  'e2907-orphee': { category: 'myth', rank: '리라 연주로 저승의 신들을 울리고 아내 에우리디케를 구하러 명계로 내려간 시인(Époux d\'Eurydice)', domains: ["신화·전설(Mythologie)","그리스 신화","저승 강림(Katabasis)","오르페우스 밀의","뒤돌아보지 마라의 금기"] },
  'e2908-orphelinats': { category: 'superstition', rank: '1566년 암스테르담 고아원 아이들을 덮친 집단 경련과 악령 발작(Établissements de Charité)', domains: ["미신·민속(Superstition)","16세기 네덜란드 역사","집단 히스테리","암스테르담 고아원","악마 빙의 소동"] },
  'e2909-orpheotelestes': { category: 'superstition', rank: '주문과 정화 의식으로 조상의 죄를 씻고 지옥의 형벌을 면하게 해준다며 돈을 받던 고대 방랑 사제들(Gens du Sabbat)', domains: ["미신·민속(Superstition)","고대 그리스 밀의종교","오르페우스교","플라톤 『국가』 비판","면죄와 정화 의식"] },
  'e2910-orportable': { category: 'superstition', rank: '순금을 액체로 용해하여 복용하면 만병을 고치고 영생을 누린다는 연금술 비약(Or Artificiel)', domains: ["미신·민속(Superstition)","연금술 의학(Iatrochemistry)","불로장생의 엘릭서","금 용해액","파라켈수스"] },
  'e2911-orrjohn': { category: 'person', rank: '최면 상태에서 수천 마일 떨어진 장소의 분실물을 찾아냈다는 19세기 미국의 투시가(Américain Clairvoyant)', domains: ["인물·역사(Personnage)","19세기 동물 자기학","메스머 최면술","원거리 투시(Clairvoyance)","미국 켄터키"] },
  'e2912-orthon': { category: 'myth', rank: '프로이사르 연대기에 기록된 밤마다 전 세계 소식을 침실로 물어다 준 다정한 정령(Lutin ou Esprit)', domains: ["신화·전설(Mythologie)","장 프로이사르 『연대기』","푸아 백작 가스통 페뷔스","사역마(Familiar)","돼지 형상 변신"] },
  'e2913-ortiebrulante': { category: 'superstition', rank: '손에 쥐면 두려움이 사라지고 침실에 걸어두면 악귀를 쫓는다는 북유럽 약초(Plante Protectrice)', domains: ["미신·민속(Superstition)","아이슬란드 민속","넷틀라(Netla)","식물 주술","공포 퇴치"] },
  'e2914-osdesmorts': { category: 'superstition', rank: '조상의 뼈를 밟으면 저주를 받는다며 묘지를 신성불가침으로 여긴 북아프리카 신앙(Coutume Étrange)', domains: ["미신·민속(Superstition)","북아프리카 베르베르 민속","모리타니 무덤 금기","유골 숭배"] },
  'e2915-othon': { category: 'person', rank: '갈바 황제를 살해하고 제위에 올랐으나 밤마다 피투성이 망령에 시달려 침대에서 굴러떨어진 황제(Empereur Romain)', domains: ["인물·역사(Personnage)","로마 제국 네 황제의 해","수에토니우스 황제전","암살자의 양심 가책","원혼의 복수"] },
  'e2916-otis': { category: 'demon', rank: '추악한 살무사의 형상으로 큰 칼을 쥐고 나타나는 60개 군단의 지옥 대총재 겸 백작(Grand Président)', legions: 60, domains: ["악마·마귀(Démon)","솔로몬 72 악마","지옥 60군단 통솔","친구와 적의 화해","과거와 미래의 비밀"] },
  'e2917-ouahiche': { category: 'myth', rank: '주술사들의 귓가에 미래를 속삭여 병자를 고치게 돕는 북미 원주민의 정령(Génie ou Démon)', domains: ["신화·전설(Mythologie)","북미 원주민 신앙","이로쿼이 샤머니즘","사역령","환각과 치유"] },
  'e2918-ouikka': { category: 'myth', rank: '극북의 얼음 바다에서 인간의 몸속에 침투해 얼어붙는 열병을 일으키는 악귀(Mauvais Génie)', domains: ["신화·전설(Mythologie)","북극권 이누이트 민속","샤머니즘 앙가코크","병마 악령","한기(寒氣)의 고통"] },
  'e2919-oulontoyon': { category: 'myth', rank: '뇌우와 불길을 다스리며 인간에게 번개와 재앙을 내리는 북방 샤머니즘의 암흑 군주(Chef des Esprits)', domains: ["신화·전설(Mythologie)","시베리아 야쿠트(사하) 신화","상계의 뇌신","27개 악령 부족","천둥과 불의 하사"] },
  'e2920-oupires': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","슬라브 흡혈귀","뱀파이어 어원"] },
  'e2921-ouran': { category: 'superstition', rank: '악마에 홀려 광포한 맹수로 변신하여 밤마다 들판을 질주하던 카리브해 주술사(Homme Endiablé)', domains: ["미신·민속(Superstition)","카리브해 안틸레스 민속","악마 빙의 마법사","늑대인간 변신 모티프","야간 광기"] },
  'e2922-ourisk': { category: 'myth', rank: '외딴 협곡 폭포 속에 살며 밤중에 방앗간 일을 돕던 고대 사티로스형 요정(Lutin des Sylvains)', domains: ["신화·전설(Mythologie)","스코틀랜드 하일랜드 켈트 민속","사티로스 요정","가정의 도우미(브라우니 동류)","외로운 요정"] },
  'e2923-ours': { category: 'superstition', rank: '시베리아 원주민들이 곰을 사냥한 뒤 죄책감을 씻기 위해 거행하던 곰 숭배 제례(Culte de l\'Ours)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","시베리아 오스티야크(한티)족","곰 의례(Bear Feast)","동물 숭배 샤머니즘"] },
  'e2924-ovide': { category: 'person', rank: '신화 속 변신 설화의 대가이자 중세에 마법서 저자로 위명되었던 고대 로마 시인(Poète Romain)', domains: ["인물·역사(Personnage)","고대 로마 문학","『변신 이야기(Metamorphoses)』","중세 위작 『오비디우스의 마법서』","토미스 유배"] },
  'e2925-oxyones': { category: 'myth', rank: '게르마니아 극북에 산다고 전해진 인간의 몸에 새의 머리와 부리를 가진 종족(Peuples Imaginaires)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","고대 로마 박물학","타키투스 게르마니아 전승","괴물 종족"] },
  'e2926-oze': { category: 'demon', rank: '표범의 형상으로 나타나 인간을 광기와 착각에 빠뜨리는 3개 군단의 지옥 대총재(Grand Président)', legions: 3, domains: ["악마·마귀(Démon)","솔로몬 72 악마","지옥 3군단 통솔","자유학예 교육","광기와 변신 착각 유발"] },

  // P entries curated metadata (p.507-567)
  'e2927-paolaus': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["인물·역사(Personnage)","상호참조","북유럽 전승"] },
  'e2928-pacte': { category: 'superstition', rank: '피로 서명하는 지옥의 맹약(Pacte Diabolique)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","악마학","피의 서약서","파우스트 전설"] },
  'e2929-painepreuvedu': { category: 'superstition', rank: '무죄를 입증하는 고대 종교 재판(Jugement de Dieu)', domains: ["미신·민속(Superstition)","신명재판(오르달리)","도둑 검출 주술","중세 사법 의례"] },
  'e2930-painbenit': { category: 'superstition', rank: '마귀와 벼락을 막는 축성 빵의 영험(Pain Bénit Populaire)', domains: ["미신·민속(Superstition)","가톨릭 민간 미신","화재 방지 부적","질병 치유 속신"] },
  'e2931-pajotmarguerite': { category: 'person', rank: '17세기 초 로렌 공국의 마녀재판 피고인(Sorcière de Lorraine)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","로렌 마녀재판","니콜라 레미","사바트 고백"] },
  'e2932-palingenesie': { category: 'superstition', rank: '식물의 재에서 본래의 형상을 되살려내는 연금술(Résurrection des Plantes)', domains: ["미신·민속(Superstition)","연금술 신비주의","파라켈수스 의학","유리병 속의 장미"] },
  'e2933-palmoscopie': { category: 'divination', rank: '신체 근육과 맥박의 불수의적 경련을 통한 복술(Divination par les Palpitations)', domains: ["점술·예언(Divination)","고대 그리스 점술","신체 징조","눈꺼풀 떨림 속신"] },
  'e2934-paludmadeleinedemendozdela': { category: 'person', rank: '엑상프로방스 우르술라회 수녀원 빙의 사건의 주역(Possédée d\'Aix)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","악마 빙의","루이 고프리디 신부","1611년 화형"] },
  'e2935-pamilius': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["악마학(Démonologie)","상호참조","사역마"] },
  'e2936-pan': { category: 'myth', rank: '고대 그리스 목동과 들판의 신이자 인큐버스의 원형(Dieu des Forêts et Démons)', domains: ["신화·전설(Mythologie)","그리스 신화","목신 판과 사티로스","인큐버스 악마화","공황(패닉)의 어원"] },
  'e2937-pandaemonium': { category: 'myth', rank: '존 밀턴의 『실락원』에 등장하는 지옥의 수도(Capitale de l\'Empire Infernal)', domains: ["신화·전설(Mythologie)","존 밀턴의 『실락원』","지옥 궁정","사탄의 황금 궁전"] },
  'e2938-panenbartholomee': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["인물·역사(Personnage)","상호참조","개신교 구마 의식"] },
  'e2939-paneros': { category: 'superstition', rank: '불임 여성을 잉태하게 한다는 전설의 보석(Pierre de Fécondité)', domains: ["미신·민속(Superstition)","고대 박물지","플리니우스 기록","광물 다산 부적"] },
  'e2940-paniers': { category: 'myth', rank: '유대 탈무드 전승의 바구니 비유와 인류 시조 설화(Fable Rabbinique)', domains: ["신화·전설(Mythologie)","랍비 전승","하와(이브)의 창조","바구니 비유"] },
  'e2941-panjacartaguel': { category: 'myth', rank: '인도 힌두 우주론의 5대 창조 원소 신격(Cinq Éléments Cosmiques)', domains: ["신화·전설(Mythologie)","인도 힌두 철학","판차마하부타","우주 창조설"] },
  'e2942-panjangam': { category: 'superstition', rank: '인도 점성술의 길일과 흉일을 기록한 천문 역서(Almanach des Brahmines)', domains: ["미신·민속(Superstition)","인도 점성술","힌두 판창가","행운의 시간과 액일"] },
  'e2943-pantacles': { category: 'grimoire', rank: '『솔로몬의 열쇠』에 수록된 신성 인장과 행성 부적(Talismans Magiques)', domains: ["마도서·문헌(Grimoire)","1863 원서 삽화 수록","『솔로몬의 열쇠』","카발라 신성 문자","영들의 결박"] },
  'e2944-pantarbe': { category: 'superstition', rank: '자석이 쇠를 끌어당기듯 황금을 끌어당기는 신비석(Aimant de l\'Or)', domains: ["미신·민속(Superstition)","고대 전설석","티아나의 아폴로니우스","필로스트라토스 기록"] },
  'e2945-paouaouci': { category: 'superstition', rank: '북아메리카 원주민의 비를 부르는 샤머니즘 의식(Conjuration de la Pluie)', domains: ["미신·민속(Superstition)","아메리카 원주민 신앙","샤머니즘","기우제와 파우와우"] },
  'e2946-pape': { category: 'superstition', rank: '종교개혁기 교황권에 얽힌 악마적 비방과 여교황 요한나 전설(Polémique Religieuse)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","호교론과 종교개혁","적그리스도 논쟁","여교황 요한나 전설"] },
  'e2947-papillon': { category: 'superstition', rank: '육체를 떠나 불멸하는 영혼의 형상(Image Matérielle de l\'Âme)', domains: ["미신·민속(Superstition)","고대 그리스 프시케","영혼 불멸 사상","플라톤의 나비 날개"] },
  'e2948-paracelsephilippebombastdit': { category: 'person', rank: '16세기 의학 개혁자이자 연금술 신비학자(Médecin et Alchimiste)', domains: ["인물·역사(Personnage)","화학 의학(이아트론화학)","호문쿨루스 제조법","검 손잡이의 아조트"] },
  'e2949-paramelle': { category: 'person', rank: '지질학적 관찰로 수맥을 짚어낸 19세기 프랑스 사제(Découvreur de Sources)', domains: ["인물·역사(Personnage)","수맥 탐사(라브도망시)","수문지질학 개척","쥐라 산맥의 샘물 발견"] },
  'e2950-parcheminvierge': { category: 'superstition', rank: '악마 소환과 신성 부적 제작에 쓰이는 정결 양피지(Support des Talismans)', domains: ["미신·민속(Superstition)","의식 마법","마도서 제작 의례","초태 새끼 가죽"] },
  'e2951-parfums': { category: 'superstition', rank: '영들을 불러내거나 쫓아내는 주술적 훈향 비방(Fumigations Magiques)', domains: ["미신·민속(Superstition)","행성 훈증 비방","영의 소환과 구마","약초와 송진"] },
  'e2952-paris': { category: 'superstition', rank: '불의 비로 파리가 멸망한다는 묵시록적 거짓 예언(Prédictions Apocalyptiques)', domains: ["미신·민속(Superstition)","종말론 미신","1840년 불의 비 예언","거짓 예언자 풍자"] },
  'e2953-parkerguillaume': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["인물·역사(Personnage)","상호참조","영국 왕실 유령"] },
  'e2954-parkesthomas': { category: 'person', rank: '악령 소환을 시도하다 공포에 쫓긴 영국인(Invocateur d\'Esprits)', domains: ["인물·역사(Personnage)","악령 소환","환각과 광기","초자연 공포 체험"] },
  'e2955-parlements': { category: 'superstition', rank: '가톨릭 성직자가 아닌 사법 관료가 주도한 화형 역사(Histoire Judiciaire)', domains: ["미신·민속(Superstition)","마녀재판 역사","프랑스 고등법원","성직자와 사법관의 대립"] },
  'e2956-parolesmagiques': { category: 'superstition', rank: '도박의 연승과 질병 퇴치를 위해 외우는 신비 주문(Mots Cabalistiques)', domains: ["미신·민속(Superstition)","주문과 언령","도박 주술","라틴어·그리스어 왜곡어"] },
  'e2957-parquemariedela': { category: 'person', rank: '바스크 사바트의 마녀(Sorcière du Sabbat Basque)', domains: ["인물·역사(Personnage)","상호참조","피에르 드 랑크르","사바트 무도","도밍기나 말레테나 동료"] },
  'e2958-parques': { category: 'myth', rank: '인간의 수명과 운명의 실을 관장하는 고대 삼여신(Déesses du Destin)', domains: ["신화·전설(Mythologie)","그리스·로마 신화","클로토·라케시스·아트로포스","운명의 실타래","죽음과 숙명"] },
  'e2959-parris': { category: 'person', rank: '1692년 세일럼 마녀재판의 도화선이 된 청교도 목사 일가(Famille Pastorale de Salem)', domains: ["인물·역사(Personnage)","세일럼 마녀재판","새뮤얼 패리스 목사","청교도 광신","빙의 소동과 집단 히스테리"] },
  'e2960-parthenomancie': { category: 'divination', rank: '실로 목 둘레를 측정하여 처녀성을 판별하던 미신적 점술(Divination de Virginité)', domains: ["점술·예언(Divination)","민간 점술","신체 계측 미신","처녀성 판별"] },
  'e2961-pasetes': { category: 'person', rank: '스스로 돌아오는 마법 동전의 고대 마술사(Magicien Illusionniste)', domains: ["인물·역사(Personnage)","고대 그리스 마술","환영 마법","돌아오는 동전(Obelos Pasetis)"] },
  'e2962-passalorynchithes': { category: 'superstition', rank: '코와 입술에 손가락을 얹고 엄격한 침묵으로 기도하던 2세기 이단(Secte Hérétique du Silence)', domains: ["미신·민속(Superstition)","초기 기독교 이단","몬타누스파 분파","엄격한 침묵 계율","성 아우구스티누스 기록"] },
  'e2963-patala': { category: 'myth', rank: '힌두 우주론의 7대 지하세계이자 뱀신의 영토(Enfers des Indiens)', domains: ["신화·전설(Mythologie)","인도 신화","힌두 우주론","지하세계 7층","나가(Naga)와 아수라"] },
  'e2964-patiniac': { category: 'superstition', rank: '임신부의 태아를 사산시키던 필리핀 원주민의 저주 마술(Sortilège des Philippines)', domains: ["미신·민속(Superstition)","동남아시아 민속","필리핀 원주민 신앙","저주와 사산 주술"] },
  'e2965-patrispierre': { category: 'person', rank: '오를레앙 공 가스통의 시종이자 궁정 시인(Poëte et Courtisan)', domains: ["인물·역사(Personnage)","17세기 프랑스 문학","꿈과 죽음의 풍자시","오를레앙 공작 궁정"] },
  'e2966-patrous': { category: 'myth', rank: '천상과 지상, 지하세계를 모두 통찰하는 세 눈의 제우스(Jupiter à Trois Yeux)', domains: ["신화·전설(Mythologie)","그리스 신화","아르고스 신전","삼계(三界)의 통찰","파우사니아스 여행기"] },
  'e2967-pauana': { category: 'superstition', rank: '플랑드르 마녀들이 사바트에서 추던 광란의 춤(Danse Infernale du Sabbat)', domains: ["미신·민속(Superstition)","마녀사냥과 사바트","플랑드르 민속","악마의 윤무"] },
  'e2968-paularnold': { category: 'superstition', rank: '18세기 유럽을 뒤흔든 세르비아 메드로이가의 전설적 뱀파이어(Vampire de Hongrie)', domains: ["미신·민속(Superstition)","흡혈귀(Vampire) 전승","1728년 메드로이가 사건","무덤 발굴과 말뚝형","오스트리아 군의관 공식 보고서"] },
  'e2969-paulsaint': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["마도서·문헌(Grimoire)","상호참조","중세 마법서","아르스 노토리아"] },
  'e2970-paule': { category: 'superstition', rank: '수백 년간 생전의 미모를 간직했다는 툴루즈 수도원 카타콤의 미라(Momie de Toulouse)', domains: ["미신·민속(Superstition)","프랑스 민속","불패의 유해","툴루즈 코르델리에 수도원","프랑수아 1세의 찬탄"] },
  'e2971-pausanias': { category: 'person', rank: '억울하게 죽인 처녀 클레오니케의 망령에 시달린 스파르타 장군(Général Spartiate)', domains: ["인물·역사(Personnage)","고대 그리스 역사","네크로만시(강령술)","헤라클레이아의 네크로만테이온","플루타르코스 기록"] },
  'e2972-pavanisles': { category: 'superstition', rank: '파나마 원주민 사회의 마법사이자 점술사 계급(Devins du Darien)', domains: ["미신·민속(Superstition)","아메리카 원주민 신앙","파나마 다리엔 지협","점술과 주술"] },
  'paymon': { category: 'demon', rank: '루시퍼에게 가장 충성스러운 200개 군단의 지옥 대왕(Grand Roi de l\'Empire Infernal)', legions: 200, domains: ["악마·마귀(Démon)","1863 원서 삽화 수록","68대 악마 목판화","루시퍼의 최측근","지옥 200군단 통솔","음악과 학술의 군주"] },
  'e2974-peanite': { category: 'superstition', rank: '고대인들이 산모의 순산을 돕는다고 신봉한 전설의 보석(Pierre Merveilleuse)', domains: ["미신·민속(Superstition)","광물 마법","출산과 모성 주술","플리니우스 박물지","고대 보석지"] },
  'e2975-peau': { category: 'superstition', rank: '시신의 손이나 사형수의 피부를 문질러 피부병을 고치려던 미신(Remède Populaire)', domains: ["미신·민속(Superstition)","민간요법","시체 마법","사마귀 치료","접촉 주술"] },
  'e2976-peche': { category: 'superstition', rank: '영혼을 파멸과 지옥으로 인도하는 유혹의 길(Chemin de l\'Enfer)', domains: ["미신·민속(Superstition)","기독교 윤리","지옥으로 가는 길","신학적 고찰"] },
  'e2977-pecheoriginel': { category: 'superstition', rank: '아담의 타락과 조상의 죄에 대한 인간의 원초적 책임(Faute Héréditaire)', domains: ["미신·민속(Superstition)","원죄 교리","신학 논쟁","인간 본성과 구원"] },
  'e2978-pedasiens': { category: 'myth', rank: '국가적 재앙이 닥칠 때마다 여사제에게 턱수염이 자란 소아시아 부족(Peuple de Carie)', domains: ["신화·전설(Mythologie)","헤로도토스 역사","카리아 전승","기이한 전조","신전 여사제"] },
  'e2979-pedegache': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","사안(邪視)","악마의 눈길"] },
  'e2980-pegomancie': { category: 'divination', rank: '신성한 샘물에 돌을 던져 파문과 거품을 읽던 고대 점술(Divination par les Sources)', domains: ["점술·예언(Divination)","고대 수점술","샘물과 파문","거품과 신탁"] },
  'e2981-pegu': { category: 'myth', rank: '미얀마 남부 페구 왕국의 거대한 누운 와불과 악마 우상(Idole du Pégu)', domains: ["신화·전설(Mythologie)","동남아시아 종교","미얀마 버마 전승","거대 우상 숭배"] },
  'e2982-peigne': { category: 'superstition', rank: '길에서 빗을 주우면 큰 행운이 온다는 민간 징조(Présage de Bonheur)', domains: ["미신·민속(Superstition)","민간 길흉 징조","행운의 부적","일상 도구 미신"] },
  'e2983-pendus': { category: 'superstition', rank: '사형수의 밧줄 조각으로 도박 연승과 재물을 얻는다는 미신(Corde de Pendu)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","사형수 유물 미신","도박 부적","교수형 밧줄(Corde de pendu)"] },
  'e2984-penitence': { category: 'superstition', rank: '대만 원주민들이 금식과 고행으로 행하던 속죄 의식(Temps de Pénitence)', domains: ["미신·민속(Superstition)","동아시아 원주민 신앙","대만 포르모사 민속","금식과 고행"] },
  'e2985-penote': { category: 'person', rank: '현자의 돌을 찾다 파산하여 병원에서 사망한 16세기 연금술사(Alchimiste Ruiné)', domains: ["인물·역사(Personnage)","연금술의 허망함","현자의 돌 탐색","이베르동 병원"] },
  'e2986-penteman': { category: 'person', rank: '해골 정물화를 그리다 지진에 놀라 심장마비로 사망한 17세기 네덜란드 화가(Peintre de Rotterdam)', domains: ["인물·역사(Personnage)","바니타스(Vanitas) 미술","로테르담 화가","공포와 환각","1692년 지진"] },
  'e2987-peratoscopie': { category: 'divination', rank: '대기 중에 나타나는 기이한 현상과 환영을 관찰하던 고대 점술(Divination par les Phénomènes Aériens)', domains: ["점술·예언(Divination)","대기 점술","천공의 징조","환영과 혜성"] },
  'e2988-perdrix': { category: 'superstition', rank: '자고새 깃털로 채운 요에 누우면 숨이 끊어지지 않는다는 민간 미신(Croyance Populaire)', domains: ["미신·민속(Superstition)","민간 신앙","죽음과 임종 미신","새의 깃털"] },
  'e2989-perezjuan': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["인물·역사(Personnage)","상호참조","스페인 종교재판"] },
  'e2990-pericles': { category: 'person', rank: '미신에 질린 군사들의 사기를 북돋우기 위해 신탁을 조작한 아테네의 정치가(Général Athénien)', domains: ["인물·역사(Personnage)","고대 그리스 역사","아테네 황금기","점술 조작","플루타르코스 전기"] },
  'e2991-peris': { category: 'myth', rank: '향기와 꽃이슬을 먹고 사는 천상의 날개 달린 여성 정령(Génies Femelles des Persans)', domains: ["신화·전설(Mythologie)","페르시아 신화","이슬람 민속","디브(Div)와의 대립","낙원의 요정"] },
  'e2992-perithe': { category: 'superstition', rank: '손에 쥐면 불타오르며 통풍을 치유한다는 전설의 광물(Pierre Merveilleuse)', domains: ["미신·민속(Superstition)","광물 마법","고대 보석지","통풍 치료"] },
  'e2993-peroun': { category: 'myth', rank: '은빛 머리와 금수염을 지닌 고대 슬라브의 뇌신(Dieu du Tonnerre des Slaves)', domains: ["신화·전설(Mythologie)","슬라브 신화","천둥과 번개","키예프 공국 신전","블라디미르 1세의 우상"] },
  'e2994-perrier': { category: 'demon', rank: '사바트 연도에서 권품 천사들의 대공으로 불리는 악마(Prince des Principautés)', domains: ["악마·마귀(Démon)","마녀재판과 사바트","사바트 연도","타락천사 계급"] },
  'e2995-persilmaitre': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["악마·마귀(Démon)","상호참조","사바트 악마","베르델레의 별칭"] },
  'e2996-perteman': { category: 'person', rank: '브뤼셀 근교에서 악마에게 영혼을 팔겠다고 선언한 피고인(Sorcière d\'Uccle)', domains: ["인물·역사(Personnage)","벨기에 브뤼셀 민속","악마와의 계약","위클 마녀재판"] },
  'e2997-pertinax': { category: 'person', rank: '암살 직전 연못에 비친 불길한 환영을 목격한 로마 황제(Empereur Romain)', domains: ["인물·역사(Personnage)","로마 제국 역사","암살의 전조","수점술과 환영","디오 카시우스 기록"] },
  'e2998-peste': { category: 'superstition', rank: '흑사병의 악령과 군주들의 치유 기적 미신(Fléau et Guérisons Fabuleuses)', domains: ["미신·민속(Superstition)","흑사병 역사","전염병 악마설","왕의 접촉 치유"] },
  'e2999-pet': { category: 'superstition', rank: '식사 중 방귀를 뀌면 임종 시 악마를 본다는 민간 경고(Axiome Populaire)', domains: ["미신·민속(Superstition)","민간 속담","예절과 악마 경고","프랑스 속담"] },
  'e3000-petchimancie': { category: 'divination', rank: '옷솔질로 먼지가 털리지 않는 상태로 길흉을 점치던 민간 점술(Divination par les Brosses)', domains: ["점술·예언(Divination)","민간 점술","의복 미신","징조와 점괘"] },
  'e3001-petitmonde': { category: 'superstition', rank: '17세기 영국에서 음모와 신비주의를 결합했던 비밀결사(Société Secrète d\'Angleterre)', domains: ["미신·민속(Superstition)","영국 역사","비밀결사","정치 음모와 오컬트"] },
  'e3002-petitpierre': { category: 'demon', rank: '독일 민담에서 영혼을 흥정하고 사들이는 악마의 통칭(Démon des Contes Allemands)', domains: ["악마·마귀(Démon)","독일 민담","파우스트 전승","영혼 매매"] },
  'e3003-petpayatons': { category: 'myth', rank: '대기 중에 떠돌며 질병과 폭풍을 일으키는 태국의 악귀(Mauvais Esprits de l\'Air)', domains: ["신화·전설(Mythologie)","동남아시아 신화","태국 샴 민속","공중의 악령"] },
  'e3004-petrobusiens': { category: 'superstition', rank: '십자가 숭배와 유아세례를 거부하고 화형당한 12세기 남프랑스 이단(Hérétiques du Dauphiné)', domains: ["미신·민속(Superstition)","중세 이단사","피에르 드 브뤼","성 베르나르두스 논박","십자가 소각"] },
  'e3005-pettimancie': { category: 'divination', rank: '상호참조(Renvoi)', domains: ["점술·예언(Divination)","상호참조","주사위 점술","골사점"] },
  'e3006-peucergaspard': { category: 'person', rank: '멜란히톤의 사위이자 점술과 악마학을 연구한 16세기 독일 의학자(Médecin de Bautzen)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","종교개혁사","필리프 멜란히톤 사위","『점술의 제반 양식에 관한 해설』(1553)"] },
  'e3007-peuplier': { category: 'myth', rank: '헤라클레스와 하데스의 저승에 봉헌된 신성한 나무(Arbre Dédié aux Enfers)', domains: ["신화·전설(Mythologie)","그리스 신화","식물 상징","헤라클레스 저승 여행","명계의 식물"] },
  'e3008-peur': { category: 'superstition', rank: '두려움과 공포를 없애기 위해 맹수의 심장이나 뼈를 지니던 미신(Préservatif)', domains: ["미신·민속(Superstition)","민간 주술","용기 부여 부적","동물 마법"] },
  'e3009-pharaildis': { category: 'myth', rank: '북유럽 설원의 병자를 치유하고 길을 밝혀주는 요정(Bonne Fée en Norvège)', domains: ["신화·전설(Mythologie)","북유럽 신화","노르웨이 민속","치유와 수호 요정"] },
  'e3010-pharmacie': { category: 'divination', rank: '환각성 약초와 독풀을 태운 연기로 환영을 보고 미래를 점치던 고대 마법(Divination Magique)', domains: ["점술·예언(Divination)","약초 마법","고대 그리스 주술","파르마콘(독과 약)","신탁 환영"] },
  'e3011-phenix': { category: 'demon', rank: '아이의 목소리로 노래하는 20개 군단의 지옥 대후작(Grand Marquis des Enfers)', legions: 20, domains: ["악마·마귀(Démon)","솔로몬 72 악마","지옥 20군단 통솔","시가와 음악의 악마","타락천사의 귀환 희망"] },
  'e3012-phenix': { category: 'myth', rank: '스스로 향나무 장작 위에서 불타 죽은 뒤 잿더미에서 부활하는 신조(Oiseau Sacré)', domains: ["신화·전설(Mythologie)","헤로도토스 역사","이집트 헬리오폴리스","부활과 영생의 상징"] },
  'e3013-phenomenes': { category: 'superstition', rank: '악마와의 교합으로 태어났다고 오인된 기형 신생아 미신(Accouchements Monstrueux)', domains: ["미신·민속(Superstition)","기형학(Teratology)","식민지 시대 괴담","악마 교합 미신"] },
  'e3014-philinnion': { category: 'superstition', rank: '무덤에서 되살아나 연인의 침실을 찾아온 고대 그리스의 뱀파이어 신부(Spectre Revenant)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","고대 흡혈귀 문헌","트랄레스의 플레곤 기록","괴테 『코린트의 신부』 원형"] },
  'e3015-philosophiehermetique': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["마도서·문헌(Grimoire)","상호참조","연금술과 비전","현자의 돌"] },
  'e3016-philotanus': { category: 'demon', rank: '벨리알 휘하에서 남색과 육욕의 타락을 부추기는 하급 악마(Démon d\'Ordre Inférieur)', domains: ["악마·마귀(Démon)","벨리알의 부하","음란과 타락의 유혹","악마학 위계"] },
  'e3017-philtre': { category: 'superstition', rank: '상대방에게 거부할 수 없는 정념을 불러일으키는 마법의 음료(Breuvage d\'Amour)', domains: ["미신·민속(Superstition)","사랑의 주술","최음제와 독초","고대 로마 마법","루크레티우스의 광기"] },
  'e3018-phlegeton': { category: 'myth', rank: '타르타로스를 휘감고 붉은 불길과 유황 급류를 뿜어내는 저승의 강(Fleuve d\'Enfer)', domains: ["신화·전설(Mythologie)","그리스·로마 신화","저승의 강 5대 지류","타르타로스의 화염","단테 신곡 지옥편"] },
  'e3019-phooka': { category: 'myth', rank: '야생 망아지로 변신해 여행자를 태우고 절벽을 질주하는 아일랜드 악령(Mauvais Esprit d\'Irlande)', domains: ["신화·전설(Mythologie)","켈트 신화","아일랜드 민속","변신 정령(Shape-shifter)","야생마의 유혹"] },
  'e3020-phosphore': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","발광 물질","영구 램프"] },
  'e3021-phrenologie': { category: 'divination', rank: '두개골의 돌출 형태를 만져 인간의 성격과 지능을 판별하던 19세기 학설(Crânologie)', domains: ["점술·예언(Divination)","19세기 의사과학","프란츠 요제프 갈","두개골 형태 측정","두뇌 국소화 이론"] },
  'e3022-phylacteres': { category: 'superstition', rank: '성경 구절을 적어 이마와 팔에 묶어 악령을 물리치던 유대인들의 호신 부적(Préservatifs)', domains: ["미신·민속(Superstition)","유대교 전승","테필린(Tefillin)","호신 부적","토라 양피지"] },
  'e3023-phyllorhodomancie': { category: 'divination', rank: '장미 꽃잎을 손뼉으로 쳐서 터뜨리는 소리로 애정을 점치던 고대 그리스 점술(Divination par les Roses)', domains: ["점술·예언(Divination)","고대 그리스 민속","사랑의 점술","식물점(잎점)","파열음 점괘"] },
  'e3024-physiognomonie': { category: 'divination', rank: '얼굴 생김새와 이목구비로 성격과 운명을 읽어내는 학문(Art des Traits du Visage)', domains: ["점술·예언(Divination)","1863 원서 삽화 수록","아리스토텔레스 인상학","지암바티스타 델라 포르타","동물 형상과 인물 대조"] },
  'e3025-piaces': { category: 'superstition', rank: '신대륙 발견 당시 이스파니올라 원주민들의 주술사 계급(Prêtres Magiciens)', domains: ["미신·민속(Superstition)","카리브해 원주민 신앙","타이노족 문화","주술과 치료"] },
  'e3026-piaches': { category: 'superstition', rank: '가혹한 2년간의 금욕 수련을 거쳐 악령과 소통하던 베네수엘라의 주술사(Prêtres Idolâtres)', domains: ["미신·민속(Superstition)","남아메리카 원주민 신앙","베네수엘라 쿠마나 해안","혹독한 주술 입문식","금식과 환각"] },
  'e3027-picardmathurin': { category: 'person', rank: '루비에 성 우르술라 수녀들을 집단 빙의시켰다는 혐의로 부관참시된 사제(Directeur de Couvent)', domains: ["인물·역사(Personnage)","루비에 수녀원 빙의 사건","1647년 마녀재판","시신 화형과 부관참시","마들렌 바방 자백"] },
  'e3028-picatrix': { category: 'grimoire', rank: '13세기 유럽을 뒤흔든 고대 아랍 점성술 마법의 집대성(Traité de Magie Astrale)', domains: ["마도서·문헌(Grimoire)","아랍 점성 마술","가야트 알 하킴","카스티야 알폰소 10세 번역","행성 탈리스만"] },
  'e3029-picdelamirandolejean': { category: 'person', rank: '인간의 존엄성과 기독교 카발라를 제창한 르네상스 천재 철학자(Célèbre Érudit)', domains: ["인물·역사(Personnage)","르네상스 인문주의","『인간 존엄성에 관한 연설』","기독교 카발라","900개 명제"] },
  'e3030-pichacha': { category: 'myth', rank: '화장터와 어둠 속을 배회하며 인간의 살과 생기를 갉아먹는 악령(Esprits Follets des Indiens)', domains: ["신화·전설(Mythologie)","힌두 신화","식인 악귀(Rakshasa 동류)","화장터의 망령","광기와 빙의"] },
  'picollus': { category: 'demon', rank: '시신의 해골과 지하의 암흑을 관장하는 고대 발트의 파멸신(Démon Révéré en Prusse)', domains: ["악마·마귀(Démon)","1863 원서 삽화 수록","68대 악마 목판화","발트 신화 최고 3신","지하세계와 죽음","인신공양 전승"] },
  'e3032-pie': { category: 'superstition', rank: '마녀의 변신과 불길한 재앙을 알리는 유럽 민간의 흉조(Oiseau de Mauvais Augure)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","조류 조점술","서양의 흉조","브르타뉴 민속"] },
  'e3033-pied': { category: 'superstition', rank: '문턱을 넘을 때 오른발부터 디뎌야 액운을 피한다는 고대 로마 이래의 미신(Coutume Romaine)', domains: ["미신·민속(Superstition)","고대 로마 풍습","문턱 미신","오른쪽과 왼쪽(길흉)"] },
  'e3034-piedfourchu': { category: 'superstition', rank: '인간으로 둔갑한 사탄이 숨기지 못하는 유일한 육체적 징표(Signe du Diable)', domains: ["미신·민속(Superstition)","악마학 전승","사탄의 변신","염소 발굽","악마 식별법"] },
  'e3035-pierreasouhaits': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","마법의 돌","소원 성취"] },
  'e3036-pierredaigle': { category: 'superstition', rank: '독수리가 둥지 알을 보호하기 위해 물어온다는 속이 빈 임신 부적석(Aétite)', domains: ["미신·민속(Superstition)","광물 마법","플리니우스 박물지","유산 방지와 순산","갈철석 노듈"] },
  'e3037-pierredudiable': { category: 'myth', rank: '다리를 지어준 대가를 받지 못해 분노한 악마가 던진 거대한 암석(Rocher Légendaire)', domains: ["신화·전설(Mythologie)","스위스 알프스 민속","생고타르 고개","악마의 다리 전설"] },
  'e3038-pierrephilosophale': { category: 'superstition', rank: '비금속을 황금으로 변환하고 불로불사를 가져다준다는 붉은 투약 물질(Grand Œuvre)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","연금술의 대작업(Magnum Opus)","엘릭서(만병통치약)","니콜라 플라멜과 에르메스주의"] },
  'e3039-pierredesante': { category: 'superstition', rank: '체온과 건강 상태에 따라 광택과 색이 변한다고 믿어진 광물(Pyrite Martiale)', domains: ["미신·민속(Superstition)","스위스 제네바 민속","사부아 민간요법","황철석 부적"] },
  'e3040-pierredefeu': { category: 'demon', rank: '사바트 연도에서 마녀들이 찬양하던 화염의 악마(Démon Inconnu du Sabbat)', domains: ["악마·마귀(Démon)","마녀재판과 사바트","사바트 연도","화염의 악마"] },
  'e3041-pierrefort': { category: 'demon', rank: '사바트 연도에서 굳건한 사탄의 권능을 상징하던 악마(Démon du Sabbat)', domains: ["악마·마귀(Démon)","마녀재판과 사바트","사바트 연도","지옥의 권능"] },
  'e3042-pierredapone': { category: 'person', rank: '수정 플라스크에 7마리의 악마를 가두었다는 누명을 쓴 13세기 파도바 의학자(Médecin et Philosophe)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","파도바 대학교 교수","아베로에스주의","종교재판과 부관참시"] },
  'e3043-pierrelabourant': { category: 'demon', rank: '마녀 잔느 가리보가 사바트의 마왕에게 붙인 농부 별칭(Nom Donné au Diable)', domains: ["악마·마귀(Démon)","마녀재판 자백","사바트 마왕","악마의 변장"] },
  'e3044-pierrelebrabancon': { category: 'person', rank: '화려한 환영 마술로 귀족들의 돈을 갈취한 16세기 네덜란드 협잡꾼(Charlatan des Pays-Bas)', domains: ["인물·역사(Personnage)","네덜란드 마술 사기","환영 마법","살그의 기록"] },
  'e3045-pierrelevenerable': { category: 'person', rank: '쿠란을 라틴어로 최초 번역하고 기적지를 저술한 12세기 학승(Savant Abbé de Cluny)', domains: ["인물·역사(Personnage)","중세 교회학","클뤼니 수도원","『기적에 관한 서한집』","이슬람 문헌 연구"] },
  'e3046-pierresdanatheme': { category: 'superstition', rank: '교회에서 파문당한 반역자나 배교자에게 돌을 던져 쌓은 저주의 돌무지(Tas de Pierres)', domains: ["미신·민속(Superstition)","그리스 파트라스 민속","종교적 저주","파문 의식","돌무더기 투석"] },
  'e3047-pigeons': { category: 'superstition', rank: '비둘기는 쓸개가 없어 악의와 쓴맛이 없다는 민간 속설(Croyance Populaire)', domains: ["미신·민속(Superstition)","동물 상징","기독교 상징주의","성령의 비둘기"] },
  'e3048-pij': { category: 'myth', rank: '죄인들이 혹독한 업보의 고초를 겪는 태국의 지하 지옥(Enfer des Siamois)', domains: ["신화·전설(Mythologie)","동남아시아 종교","태국 샴 불교","나락과 업보"] },
  'e3049-pilalkarras': { category: 'superstition', rank: '바다의 물귀신과 상어를 결박하던 인도 남서부의 주술사(Exorcistes du Malabar)', domains: ["미신·민속(Superstition)","인도 말라바르 민속","바다의 악령 퇴치","진주 채취 주술"] },
  'e3050-pilapiens': { category: 'superstition', rank: '마법의 북과 바람의 매듭을 다루던 북극해 반도의 샤먼들(Peuples de la Mer Glaciale)', domains: ["미신·민속(Superstition)","북극권 민속","라플란드 사미족","샤머니즘 북 의식","바람의 매듭"] },
  'e3051-pilatemont': { category: 'myth', rank: '돌을 던지면 폭풍이 일어난다는 본디오 빌라도 망령의 스위스 호수(Lac de Montagne)', domains: ["신화·전설(Mythologie)","스위스 루체른 알프스","본디오 빌라도 전설","폭풍을 부르는 호수"] },
  'e3052-piletski': { category: 'superstition', rank: '사후에 사악한 원혼이 되어 산 자들을 홀린다는 폴란드 명문 귀족(Famille Polonaise)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","동유럽 귀족 괴담","흡혈귀와 원혼","사후 출현"] },
  'e3053-pinet': { category: 'person', rank: '피코 델라 미란돌라가 기록한 이탈리아의 마술사(Sorcier Italien)', domains: ["인물·역사(Personnage)","피코 델라 미란돌라 기록","환영 마법","사역마"] },
  'e3054-pipimarie': { category: 'person', rank: '해골 잔에 지옥의 독주를 따라주던 사바트의 마녀(Échanson au Sabbat)', domains: ["인물·역사(Personnage)","마녀재판과 사바트","사바트 연회","해골 술잔","피에르 드 랑크르 기록"] },
  'e3055-piqueur': { category: 'superstition', rank: '도피네 계곡에서 채찍을 휘두르며 질주하는 투명한 기마 망령(Spectre Invisible)', domains: ["미신·민속(Superstition)","프랑스 도피네 민속","와일드 헌트(Wild Hunt)","기마 유령"] },
  'e3056-piripiris': { category: 'superstition', rank: '동물의 발톱과 약초로 제작하던 페루 아마존 원주민의 부적(Talismans du Pérou)', domains: ["미신·민속(Superstition)","아메리카 원주민 신앙","페루 아마존 민속","사냥과 전투 부적"] },
  'e3057-pison': { category: 'person', rank: '납판 저주와 주술로 로마 영웅 게르마니쿠스를 독살했다는 시리아 총독(Gouverneur Romain)', domains: ["인물·역사(Personnage)","로마 제국 역사","게르마니쿠스 암살","납판 저주(Defixio)","타키투스 연대기"] },
  'e3058-pistolevolante': { category: 'superstition', rank: '사용하고 나면 마법사의 주머니로 스스로 날아 되돌아오는 악마의 금화(Pièce Merveilleuse)', domains: ["미신·민속(Superstition)","악마의 금화","사바트 보상","돌아오는 돈(Pasetes 동류)"] },
  'e3059-pithon': { category: 'demon', rank: '코르도바 수녀를 거짓 성녀로 위장시켰던 사역마 악마(Démon Familier)', domains: ["악마·마귀(Démon)","스페인 마녀재판","거짓 성녀 위장","사역마(Familiar)"] },
  'e3060-pivert': { category: 'superstition', rank: '모든 자물쇠와 바위를 부수는 마법의 풀 스프링워트를 아는 새(Oiseau Magique)', domains: ["미신·민속(Superstition)","『소 알베르투스』","스프링워트(Springwurzel)","자물쇠 해제 마법"] },
  'e3061-planetes': { category: 'divination', rank: '인간의 기질과 운명을 지배한다고 믿어진 칠요의 천체학(Astrologie Planétaire)', domains: ["점술·예언(Divination)","점성 마술","행성 지배자","칠요(七曜) 상응","금속과 요일"] },
  'e3062-plantebornes': { category: 'superstition', rank: '생전에 토지 경계석을 훔친 죄로 무거운 돌을 메고 밤마다 방황하는 원혼(Fantôme Errant)', domains: ["미신·민속(Superstition)","프랑스 시골 민속","토지 경계석 절도","도덕적 계명 괴담","무덤 밖의 형벌"] },
  'e3063-platon': { category: 'person', rank: '신과 인간의 매개자인 다이몬과 사후 심판을 설파한 고대 그리스 대철학자(Philosophe Grec)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","고대 그리스 철학","다이몬(Daimon)론","에르의 신화(사후 세계)"] },
  'e3064-plats': { category: 'divination', rank: '은쟁반이나 물 담은 접시에 기름과 보석을 떨어뜨려 치던 고대 점술(Divination par les Plats)', domains: ["점술·예언(Divination)","고대 이집트 점술","퀴르티우스 루푸스 기록","수점술(Lecanomancy)"] },
  'e3065-pline': { category: 'person', rank: '고대의 모든 괴수, 마법 광물, 기적을 집대성하고 베수비오 화산에서 순직한 학자(Naturaliste Romain)', domains: ["인물·역사(Personnage)","고대 로마 박물학","『박물지』(Historia Naturalis)","베수비오 화산 폭발","중세 마법의 원천"] },
  'e3066-plogojowitspierre': { category: 'superstition', rank: '1725년 합스부르크 제국 군당국이 공식 검시한 세르비아의 역사적 뱀파이어(Vampire de Kisilova)', domains: ["미신·민속(Superstition)","흡혈귀(Vampire) 역사","1725년 키실로바 사건","오스트리아 제국 공식 보고서","무덤 발굴과 화형"] },
  'e3067-plotin': { category: 'person', rank: '알렉산드리아 학파의 거두이자 신적 존재를 수호령으로 거느린 신플라톤주의자(Philosophe d\'Alexandrie)', domains: ["인물·역사(Personnage)","신플라톤주의","『엔네아데스』","이시스 신전 강령술","수호령(Daimon)"] },
  'e3068-pluiesmerveilleuses': { category: 'superstition', rank: '하늘에서 두꺼비, 물고기, 피, 돌이 쏟아져 내린 기이한 기상 현상(Phénomènes Singuliers)', domains: ["미신·민속(Superstition)","이상 기상 현상","전쟁과 기근의 전조","용오름과 돌풍"] },
  'e3069-plutarque': { category: 'person', rank: '위대한 판(Pan)의 죽음과 고대 신탁의 소멸을 기록한 그리스 역사가(Sage Philosophe)', domains: ["인물·역사(Personnage)","고대 그리스 역사","『영웅전』","『신탁의 몰락에 관하여』","목신 판의 죽음"] },
  'e3070-pluton': { category: 'demon', rank: '이교도들의 지하세계 왕이자 악마학의 타오르는 심연의 총독(Roi des Enfers)', domains: ["악마·마귀(Démon)","그리스·로마 신화","지옥의 3대 군주","지하세계의 왕","악마학 위계"] },
  'e3071-plutus': { category: 'demon', rank: '인간에게 무차별하게 황금을 쥐여주어 타락시키는 맹목의 악마(Dieu des Richesses)', domains: ["악마·마귀(Démon)","그리스 신화","재물의 탐욕","눈먼 신","단테 신곡 지옥편"] },
  'e3072-pnigalion': { category: 'demon', rank: '수면 중인 인간의 가슴을 짓눌러 숨을 막히게 하는 가위눌림 악령(Démon du Cauchemar)', domains: ["악마·마귀(Démon)","1863 원서 삽화 수록","악몽(Nightmare)","수면 마비(가위눌림)","인큐버스 전승"] },
  'e3073-pocel': { category: 'myth', rank: '프로이센 이교도들이 섬기던 지하 암흑의 지배자이자 악마(Roi de l\'Enfer)', domains: ["신화·전설(Mythologie)","발트 신화","피콜루스(Picollus) 동류","지하세계의 군주"] },
  'e3074-pochwist': { category: 'myth', rank: '휘몰아치는 눈보라와 혹한의 돌풍을 일으키는 고대 폴란드의 악신(Divinité de l\'Hiver)', domains: ["신화·전설(Mythologie)","슬라브 신화","폴란드 민속","겨울과 혹한","폭풍우의 신"] },
  'e3075-pogoda': { category: 'myth', rank: '온화한 미풍과 따스한 햇살을 가져다주는 고대 폴란드의 선량한 여신(Divinité du Beau Temps)', domains: ["신화·전설(Mythologie)","슬라브 신화","폴란드 민속","화창한 날씨","풍요와 봄바람"] },
  'e3076-pointsdecote': { category: 'superstition', rank: '돌을 들어 올리고 침을 뱉어 다시 내려놓는 아르덴 민간요법(Remède Populaire)', domains: ["미신·민속(Superstition)","프랑스 아르덴 민속","민간 주술","신체 고통 전이"] },
  'e3077-poiriermarguerite': { category: 'person', rank: '1603년 늑대인간 장 그르니에에게 습격당했다고 증언한 13세 소녀(Témoin du Loup-Garou)', domains: ["인물·역사(Personnage)","보르도 마녀재판","늑대인간(Lycanthropie)","장 그르니에 사건","피에르 드 랑크르 기록"] },
  'e3078-poisons': { category: 'superstition', rank: '실제 독살 범죄가 마녀들의 초자연적 주술로 오인된 역사적 사실(Crime et Magie)', domains: ["미신·민속(Superstition)","독살 사건 역사","마녀재판의 진실","베네피키움(Veneficium)"] },
  'e3079-polkan': { category: 'myth', rank: '상반신은 인간이고 하반신은 말인 엄청난 괴력의 슬라브 반인반수(Centaure des Slavons)', domains: ["신화·전설(Mythologie)","러시아 슬라브 영웅 서사시(Bylina)","켄타우로스","보바 코롤레비치"] },
  'e3080-pollierabraham': { category: 'person', rank: '사탄에게 피로 서명한 계약서를 품고 다니다 체포된 스위스 용기병(Dragon Suisse)', domains: ["인물·역사(Personnage)","군대 마술","악마와의 혈서 계약","총알 무력화 부적"] },
  'e3081-polycrite': { category: 'myth', rank: '죽은 후 기괴한 양성구유 아이의 예언을 막기 위해 망령으로 나타난 관료(Citoyen d\'Étolie)', domains: ["신화·전설(Mythologie)","고대 그리스 전승","플레곤 기록","양성구유 기형","국가 멸망의 전조"] },
  'e3082-polyglossos': { category: 'myth', rank: '바람에 흔들리는 나뭇잎 소리로 수많은 언어의 신탁을 전하던 참나무(Chêne Prophétique)', domains: ["신화·전설(Mythologie)","고대 그리스 신탁","도도나 제우스 신전","신성한 참나무","나뭇잎 소리 점술"] },
  'e3083-polyphage': { category: 'superstition', rank: '산 돌이나 쇠붙이, 시체까지 게걸스럽게 삼키던 비정상적 식욕(Faim Insatiable)', domains: ["미신·민속(Superstition)","비텐베르크 학술 논문","타라르(Tarrare)","폭식의 악마","의학적 이상 질환"] },
  'e3084-polypheme': { category: 'myth', rank: '오디세우스의 부하들을 잡아먹다 눈이 찔린 포세이돈의 식인 거인(Géant d\'Odyssée)', domains: ["신화·전설(Mythologie)","호메로스 오디세이아","키클롭스(외눈 거인)","시칠리아 에트나 화산"] },
  'e3085-polyphidee': { category: 'myth', rank: '아폴론의 영감을 받아 당대 최고의 명성을 누린 고대 아르고스의 예언자(Devin d\'Argos)', domains: ["신화·전설(Mythologie)","호메로스 전승","그리스 신화 예언자","아폴론의 신탁"] },
  'e3086-polytheisme': { category: 'superstition', rank: '수많은 이교 신들을 사탄의 악마 군단으로 규정한 기독교적 변증(Culte des Faux Dieux)', domains: ["미신·민속(Superstition)","비교종교학","우상 숭배 논박","힌두 다신교 변증"] },
  'e3087-pommedadam': { category: 'superstition', rank: '금단의 열매 조각이 목구멍에 걸려 남성의 목에 영구히 남았다는 민간 설화(Légende Populaire)', domains: ["미신·민속(Superstition)","창세기 민담","신체 해부학 미신","금단의 열매"] },
  'e3088-pomponace': { category: 'person', rank: '영혼 불멸과 마법 현상을 자연학적으로 해명하여 논란을 부른 르네상스 철학자(Professeur de Philosophie)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","르네상스 아리스토텔레스주의","『영혼 불멸론』","『마법과 주문에 관하여』"] },
  'e3089-poniatowskacatherine': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["인물·역사(Personnage)","상호참조","폴란드 환시자","코메니우스"] },
  'e3090-pont': { category: 'myth', rank: '신들의 세계 아스가르드와 인간계를 연결하는 불타는 무지개다리(Pont des Dieux)', domains: ["신화·전설(Mythologie)","북유럽 신화","에다(Edda)","헤임달의 파수","라그나로크의 붕괴"] },
  'e3091-pontdadam': { category: 'myth', rank: '인도 남부와 실론 섬을 잇는 산호 사주이자 낙원 추방의 통로(Suite de Bancs de Sable)', domains: ["신화·전설(Mythologie)","힌두 라마야나","이슬람 아담 전승","실론(스리랑카) 아담의 봉우리"] },
  'e3092-pontdudiable': { category: 'superstition', rank: '첫 번째 건너는 자의 영혼을 대가로 요구했으나 개에게 속아 넘어간 사탄(Légende Populaire)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","스위스 알프스 전설","생고타르 협곡","영혼 계약 속임수"] },
  'e3093-popoguno': { category: 'myth', rank: '죄인의 영혼이 거꾸로 매달려 영원히 고통받는 북미 알곤킨족의 저승(Enfers des Virginiens)', domains: ["신화·전설(Mythologie)","북미 원주민 신앙","버지니아 알곤킨 부족","영벌의 구덩이"] },
  'e3094-poppielier': { category: 'person', rank: '악독한 저주를 일삼다 수백만 마리의 쥐에게 파먹혀 죽은 9세기 폴란드 군주(Roi de Pologne)', domains: ["인물·역사(Personnage)","폴란드 역사 전설","크루슈비차 쥐의 탑","신의 징벌","쥐 떼의 습격"] },
  'e3095-porcsdivinationparles': { category: 'divination', rank: '돼지가 짚을 물고 달리거나 꿀꿀거리는 소리로 날씨와 운수를 읽던 미신(Procédé Singulier)', domains: ["점술·예언(Divination)","동물 점술(Zoomancie)","농촌 민간 미신","기상 예측"] },
  'e3096-poromhoungse': { category: 'myth', rank: '세속의 모든 번뇌를 초탈하여 백조의 경지에 이른 브라만 성자(Sorte de Fakirs)', domains: ["신화·전설(Mythologie)","힌두 철학","산스크리트 영적 칭호","사두와 파키르","신비주의 고행"] },
  'e3097-porphyre': { category: 'person', rank: '플로티노스의 전기와 신탁 및 악령의 계급론을 집대성한 3세기 철학자(Philosophe Grec)', domains: ["인물·역사(Personnage)","신플라톤주의","『신탁의 철학』","악령과 정화 의식","기독교 비판"] },
  'e3098-porriciae': { category: 'superstition', rank: '내장점(Haruspicina)을 마친 희생 제물의 간과 심장을 불길에 던져 바치던 로마 제례(Entrailles)', domains: ["미신·민속(Superstition)","고대 로마 제례","내장점(Haruspice)","희생제물 번제"] },
  'e3099-portajeanbaptiste': { category: 'person', rank: '『자연 마법』과 『인간 인상학』을 저술하여 과학과 오컬트의 교량을 놓은 나폴리 학자(Physicien Célèbre)', domains: ["인물·역사(Personnage)","르네상스 자연 마법","『자연 마법(Magia Naturalis)』","카메라 옵스큐라","인상학(Physiognomonia)"] },
  'e3100-porte': { category: 'superstition', rank: '집 문턱과 대문에 붉은 부적을 붙여 악귀를 막던 만주족의 수호신 숭배(Esprit Gardien)', domains: ["미신·민속(Superstition)","동북아시아 민속","만주 샤머니즘","문신(門神) 숭배"] },
  'e3101-portesdessonges': { category: 'myth', rank: '진실한 꿈이 나오는 뿔의 문과 거짓 환영이 나오는 상아의 문(Portes de Corne et d\'Ivoire)', domains: ["신화·전설(Mythologie)","호메로스 오디세이아","베르길리우스 아이네이스","꿈과 예언"] },
  'e3102-possedes': { category: 'superstition', rank: '19세기 프랑스 아미앵 근교에서 벌어진 마녀 고발과 집단 빙의(Possession Démoniaque)', domains: ["미신·민속(Superstition)","19세기 빙의 사건","집단 히스테리","구마 의식","아미앵 테이 마을"] },
  'e3103-possedeesdeflandre': { category: 'superstition', rank: '17세기 릴의 브리지트회 수녀들을 덮친 집단 악마 빙의와 마녀재판(Affaire Historique)', domains: ["미신·민속(Superstition)","플랑드르 릴 마녀재판","브리지트회 수녀원","집단 광기","구마 사제 데스페르방"] },
  'e3104-postelguillaume': { category: 'person', rank: '동양어의 대가이자 여성 메시아 주아나를 찬양하며 투옥된 16세기 신비주의자(Visionnaire Célèbre)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","콜레주 드 프랑스 교수","베네치아의 마더 주아나","우주적 대화합의 메시아주의"] },
  'e3105-potabeurre': { category: 'superstition', rank: '구마 사제가 퇴마한 수많은 악령을 봉인하여 던져버린 도자기 항아리(Conte d\'Exorciste)', domains: ["미신·민속(Superstition)","구마 민담","악령 봉인","솔로몬의 청동 항아리 모티프"] },
  'e3106-poudargent': { category: 'superstition', rank: '마녀의 피부 속에 박아 넣어 악마적 충성을 보증하던 사탄의 기괴한 증표(Décoration du Diable)', domains: ["미신·민속(Superstition)","악마의 표식(Stigma Diaboli)","사바트 훈장","고통 무감각"] },
  'e3107-poudot': { category: 'superstition', rank: '16세기 툴루즈의 구두장이 집을 뒤흔든 악마적 소음과 돌팔매(Maison Hantée)', domains: ["미신·민속(Superstition)","프랑스 툴루즈 민속","폴터가이스트(Poltergeist)","악령의 소음"] },
  'e3108-poudres': { category: 'superstition', rank: '사바트에서 사탄이 하사하여 우박과 전염병을 일으킨다는 마법의 가루(Poudres Maléfiques)', domains: ["미신·민속(Superstition)","마녀재판과 사바트","독약과 주술","농작물 파괴","유황과 두꺼비 가루"] },
  'e3109-poulenoire': { category: 'grimoire', rank: '자정의 사거리에서 바쳐 보물을 찾는다는 전설의 마도서(Grimoire Célèbre)', domains: ["마도서·문헌(Grimoire)","1863 원서 삽화 수록","18세기 마법서","이집트 나폴레옹 원정 전설","황금 알을 낳는 암탉"] },
  'e3110-poulets': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["점술·예언(Divination)","상호참조","고대 로마 조점술","풀리카리아(Pullarius)"] },
  'e3111-poulpiquets': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["신화·전설(Mythologie)","상호참조","브르타뉴 민속 요정","코리간"] },
  'e3112-poupart': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","유령 출현","망령과의 대화"] },
  'e3113-pourang': { category: 'myth', rank: '거대한 호박 열매를 쪼개고 세상 밖으로 나온 인류의 시조(Premier Homme)', domains: ["신화·전설(Mythologie)","일본 민속 신화","천지창조 신화","식물 탄생 모티프"] },
  'e3114-pousha': { category: 'myth', rank: '완벽한 황실 도자기를 굽기 위해 가마 불길 속에 뛰어든 경덕진의 장인신(Dieu de la Porcelaine)', domains: ["신화·전설(Mythologie)","중국 도자기 역사","경덕진 풍화신(童賓)","자기 장인들의 수호신"] },
  'e3115-poussiere': { category: 'superstition', rank: '바람에 휘말리는 흙먼지 기둥을 요정이나 악마의 춤으로 본 민간 미신(Tourbillon de Vent)', domains: ["미신·민속(Superstition)","아일랜드 켈트 민속","프랑스 시골 전승","회오리바람(Dust Devil)","칼 던지기 주술"] },
  'e3116-powel': { category: 'person', rank: '“빗자루를 타고 날아다니는 것은 법에 저촉되지 않는다”며 석방한 18세기 법관(Chief-Justice)', domains: ["인물·역사(Personnage)","영국 법제사","제인 웬햄 마녀재판","사법적 합리주의","마녀사냥의 종식"] },
  'e3117-praariaseria': { category: 'myth', rank: '공중을 걷고 강물을 멈추게 하는 신통력을 부렸다는 태국의 성인(Personnage Fameux)', domains: ["신화·전설(Mythologie)","동남아시아 불교","태국 아유타야 전승","신통력과 이적"] },
  'e3118-preadamites': { category: 'superstition', rank: '성서의 아담 창조 이전에 이미 다른 인류가 존재했다는 17세기 이단설(Thèse Hérétique)', domains: ["미신·민속(Superstition)","이사크 라 페레이르","1655년 암스테르담 출간","성서 비평의 시초","종교재판 철회"] },
  'e3119-precy': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","랑부예 후작","전장의 유령"] },
  'e3120-predictions': { category: 'divination', rank: '카이사르와 폼페이우스에게 천수를 누릴 것이라 장담했던 고대 이래의 점성술 허구(Chaldéens et Astrologues)', domains: ["점술·예언(Divination)","1863 원서 삽화 수록","점성술 비판","로마 삼두정치의 파멸","키케로 『점술론』"] },
  'e3121-prejuge': { category: 'superstition', rank: '이성적 검토 없이 맹목적으로 사물을 판단하는 미신의 뿌리(Manière Irréfléchie)', domains: ["미신·민속(Superstition)","계몽주의 철학","미신의 심리학","합리주의적 비판"] },
  'e3122-prelati': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["인물·역사(Personnage)","상호참조","질 드 레(푸른 수염)","바론 악마 소환"] },
  'e3123-presages': { category: 'superstition', rank: '소금 엎지르기, 거울 깨짐, 식탁의 13인 등 미래의 불행을 알린다는 징조(Indices de l\'Avenir)', domains: ["미신·민속(Superstition)","일상의 미신","길흉화복 징조","소금과 거울"] },
  'e3124-prescience': { category: 'superstition', rank: '오직 신에게만 속하며 악마는 자연법칙의 추론으로 흉내 낼 뿐인 미래 지식(Connaissance Infaillible)', domains: ["미신·민속(Superstition)","기독교 신학","신의 전지(Omniscience)","악마의 예지 한계"] },
  'e3125-preservatifs': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","액막이 부적","코르노와 필락테리"] },
  'e3126-pressentiment': { category: 'superstition', rank: '카이사르의 암살 전날 아내 칼푸르니아가 겪은 악몽과 불길한 영감(Mouvement Intérieur)', domains: ["미신·민속(Superstition)","로마 역사 일화","칼푸르니아의 악몽","3월 15일의 이두스","심리적 무의식"] },
  'e3127-pressine': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["신화·전설(Mythologie)","상호참조","멜뤼진 전설","알바니아 왕 엘리나스"] },
  'e3128-prestantius': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","변신 환각","성 아우구스티누스 『신국론』"] },
  'e3129-prestiges': { category: 'superstition', rank: '카스파어 포이커가 기록한 시각을 기만하고 헛것을 보게 만드는 마술(Illusions Magiques)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","카스파어 포이커","환영 마술(Prestigiatores)","눈속임의 원리"] },
  'e3130-pretresnoirs': { category: 'person', rank: '사바트에서 검은 미사를 집전하고 성체를 모독하던 배교 성직자들(Prêtres du Sabbat)', domains: ["인물·역사(Personnage)","마녀사냥과 사바트","검은 미사(Messe Noire)","배교 성직자"] },
  'e3131-prieressuperstitieuses': { category: 'superstition', rank: '티에르 신부가 수집한 악령 퇴치와 도둑 잡기를 가장한 왜곡된 민간 기도(Petits Chefs-d\'œuvre)', domains: ["미신·민속(Superstition)","장 밥티스트 티에르 신부","민간 주술 기도","성서 구절 왜곡"] },
  'e3132-prieriosylvestremozzolinode': { category: 'person', rank: '루터를 이단으로 공격하고 악마학 백과를 저술한 16세기 교황청 도미니코회 신학자(Savant Dominicain)', domains: ["인물·역사(Personnage)","도미니코 수도회","마녀재판 이론서","『악마들의 기이한 행적에 관하여』(1575)","마르틴 루터의 적수"] },
  'e3133-prisier': { category: 'demon', rank: '사바트 연도에서 마녀들의 복종을 감시하는 지옥의 관리령(Démon Invoqué au Sabbat)', domains: ["악마·마귀(Démon)","마녀재판과 사바트","사바트 연도","지옥의 감찰관"] },
  'e3134-prodiges': { category: 'superstition', rank: '지진, 혜성, 두 개의 태양 등 원인을 몰라 신의 진노로 두려워했던 천재지변(Événements Surprenants)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","고대 로마 역사","리비우스 연대기","이상 자연현상"] },
  'e3135-promethee': { category: 'myth', rank: '신들의 불을 훔쳐 인간에게 전해주고 코카서스 바위에 묶여 독수리에게 뜯긴 티탄(Grand Astrologue)', domains: ["신화·전설(Mythologie)","그리스 신화","천상의 불 절도","코카서스 바위의 형벌","헤시오도스 신통기"] },
  'e3136-pronosticspopulaires': { category: 'superstition', rank: '도토리의 결실량과 제비의 비행 고도로 겨울 추위와 비를 예측하던 농촌 지혜(Présages Naturels)', domains: ["미신·민속(Superstition)","농촌 민간 속담","기상 관천망기(觀天望氣)","동식물 관찰"] },
  'e3137-prophetes': { category: 'superstition', rank: '신의 계시를 전한다고 자처하며 민중을 현혹한 수많은 종교적 광신자들(Prophètes et Fanatiques)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","이슬람 12만 4천 예언자","거짓 선지자","종교적 광신"] },
  'e3138-proprete': { category: 'superstition', rank: '성 베르나르두스가 칭송한 청결과 악마가 깃드는 오물의 대조(Vertu Chrétienne)', domains: ["미신·민속(Superstition)","기독교 윤리","클레르보의 성 베르나르두스","악마와 악취"] },
  'e3139-proserpine': { category: 'demon', rank: '플루톤의 아내이자 악마학에서 지옥의 여왕으로 군림하는 악마(Reine de l\'Empire Infernal)', domains: ["악마·마귀(Démon)","그리스·로마 신화","명계의 여왕","석류 열매의 맹세","악마학 위계"] },
  'e3140-prostrophies': { category: 'myth', rank: '살인과 죄악에 복수하기 위해 파견되는 고대 그리스의 징벌령(Esprits Malfaisants)', domains: ["신화·전설(Mythologie)","고대 그리스 종교","복수의 악령","정화 의식(Katharmos)"] },
  'e3141-proudhon': { category: 'person', rank: '“사탄이여 오라, 반역자들의 벗이여”를 외쳤던 19세기 아나키즘 사상가(Écrivain Contemporain)', domains: ["인물·역사(Personnage)","19세기 사회주의","아나키즘 창시자","『빈곤의 철학』","루시퍼주의 비판"] },
  'pruflas': { category: 'demon', rank: '불화와 전쟁, 반란을 조장하는 바빌론 탑의 26개 군단 지옥 대공(Grand Prince et Grand-Duc)', legions: 26, domains: ["악마·마귀(Démon)","1863 원서 삽화 수록","68대 악마 목판화","요한 바이어 『악마의 거짓 왕국』","불화와 반란의 군주","지옥 26군단 통솔"] },
  'e3143-psellusmichel': { category: 'person', rank: '악마를 화염, 대기, 지하 등 6대 계급으로 체계화한 11세기 비잔티움 대학자(Auteur de Démonologie)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","비잔티움 제국","콘스탄티노플 총대주교","『악마의 작용에 관하여(De operatione daemonum)』"] },
  'e3144-psylles': { category: 'myth', rank: '몸에서 풍기는 체취만으로 치명적인 맹독사를 마비시키던 고대 북아프리카 부족(Peuples de Libye)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","고대 로마 문헌","헤로도토스와 플리니우스","뱀 독 면역과 치료"] },
  'e3145-psylotoxotes': { category: 'myth', rank: '코끼리만 한 거대 벼룩을 타고 활을 쏘는 루키아노스의 달나라 종족(Peuples Imaginaires)', domains: ["신화·전설(Mythologie)","고대 그리스 풍자 문학","사모사타의 루키아노스","『진실한 역사』","달세계 환상 여행"] },
  'e3146-psephos': { category: 'divination', rank: '색깔이 다른 조약돌을 항아리에서 무작위로 뽑아 치던 고대 그리스 점술(Divination par Cailloux)', domains: ["점술·예언(Divination)","고대 그리스 민속","돌점술(Lithomancie)","흑백 조약돌 점괘"] },
  'e3147-psychomancie': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["점술·예언(Divination)","상호참조","강령술","죽은 자의 영혼 소환"] },
  'e3148-publius': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","말하는 머리","시신의 예언"] },
  'e3149-pucel': { category: 'demon', rank: '온천의 물을 덥히고 기하학을 가르치는 48개 군단의 지옥 대공(Grand et Puissant Duc)', legions: 48, domains: ["악마·마귀(Démon)","솔로몬 72 악마","지옥 48군단 통솔","수온 상승과 온천 발견","기하학의 학술령"] },
  'e3150-pucelledorleans': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["인물·역사(Personnage)","상호참조","잔 다르크","백년전쟁의 영웅"] },
  'e3151-puces': { category: 'superstition', rank: '성금요일 침대 밑 흙을 뿌려 벼룩의 번식을 막던 민간 주술(Remède Superstitieux)', domains: ["미신·민속(Superstition)","장 밥티스트 티에르 신부","민간 주술","기생충 구제 미신"] },
  'e3152-puck': { category: 'myth', rank: '밤중에 집안일을 돕고 나그네를 골탕 먹이는 영국 민담의 둔갑 요정(Démon Familier)', domains: ["신화·전설(Mythologie)","1863 원서 삽화 수록","영국 민속","셰익스피어 『한여름 밤의 꿈』","도깨비불(Will-o'-the-wisp)"] },
  'e3153-punaises': { category: 'superstition', rank: '목구멍에 걸린 거머리를 뱉어내기 위해 식초에 빈대를 타서 마시던 고대 처방(Remède Ancien)', domains: ["미신·민속(Superstition)","고대 민간요법","플리니우스 기록","기생충 구제"] },
  'e3154-purgatoire': { category: 'superstition', rank: '죄인의 영혼이 최대 1년 동안 불길 속에서 정화된다는 랍비 전승(Croyance Juive)', domains: ["미신·민속(Superstition)","유대교 탈무드 전승","게헨나(Gehenna)","영혼의 정화","카디시 기도"] },
  'e3155-purrikeh': { category: 'superstition', rank: '끓는 기름에 손을 넣거나 붉은 쇠를 쥐어 무죄를 증명하던 힌두 신명재판(Épreuve Judiciaire)', domains: ["미신·민속(Superstition)","인도 힌두 법전(마누 법전)","신명재판(Ordeal)","불과 물의 시험"] },
  'e3156-pursan': { category: 'demon', rank: '사자의 얼굴로 곰을 타고 트럼펫을 울리며 나타나는 22개 군단의 지옥 대왕(Grand Roi de l\'Enfer)', legions: 22, domains: ["악마·마귀(Démon)","1863 원서 삽화 수록","솔로몬 72 악마","지옥 22군단 통솔","숨겨진 보물 탐색","지상 창조의 비밀"] },
  'e3157-puteorites': { category: 'superstition', rank: '깊은 우물과 샘물에 제물을 바치며 정령을 섬기던 고대 분파(Secte Superstitieuse)', domains: ["미신·민속(Superstition)","고대 이단","우물과 샘물 숭배","수신 숭배 미신"] },
  'e3158-pygmees': { category: 'myth', rank: '키가 1피트에 불과하여 해마다 두루미 떼의 습격에 맞서 싸운다는 고대 전설의 난쟁이(Peuple Fabuleux)', domains: ["신화·전설(Mythologie)","호메로스 일리아스","고대 그리스 박물학","두루미와의 전쟁(Geranomachia)"] },
  'e3159-pyramides': { category: 'myth', rank: '대홍수 이전에 마법과 천문학의 비결을 보존하기 위해 건설된 거대 석조물(Monuments d\'Égypte)', domains: ["신화·전설(Mythologie)","아랍 오컬트 전승","피라미드 수호령","대홍수 이전의 지혜","파라오 사우르드 전설"] },
  'e3160-pyromancie': { category: 'divination', rank: '제단 불길의 색상, 연기, 장작의 딱딱거리는 소리로 미래를 점치던 고대 점술(Divination par le Feu)', domains: ["점술·예언(Divination)","4대 원소 점술","제단 화염","수지 훈증","불꽃 모양 해석"] },
  'e3161-pyrrhus': { category: 'person', rank: '페르세포네 신전의 보물을 약탈했다가 난파와 패망의 저주를 받은 에페이로스의 정복왕(Roi d\'Épire)', domains: ["인물·역사(Personnage)","고대 그리스·로마사","신전 보물 약탈","신벌(神罰)","피로스의 승리"] },
  'e3162-pythagore': { category: 'person', rank: '수의 조화, 천구의 음악, 영혼의 윤회환생을 가르친 사모스의 대철학자(Philosophe de Samos)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","고대 그리스 철학","수비학(Arithmancy)","윤회설(Metempsychosis)","황금 허벅지 전설"] },
  'e3163-pythonissedendor': { category: 'superstition', rank: '블레셋과의 결전을 앞둔 사울 왕의 부탁으로 사무엘의 영혼을 소환한 성서의 마녀(Évocation Historique)', domains: ["미신·민속(Superstition)","구약 성서 사무엘상 28장","네크로만시(강령술)","사울 왕의 최후","사무엘의 망령 예언"] },
  'e3164-pythons': { category: 'myth', rank: '무녀의 몸을 빌려 복화술과 예언 신탁을 내리던 고대 그리스의 영령들(Esprits Prophétiques)', domains: ["신화·전설(Mythologie)","고대 그리스 신탁","피티아 무녀","복화술(Engastrimythes)","사도행전 16장 뱀의 점술령"] },

  // Q entries curated metadata (p.567-568)
  'e3165-quakerisme': { category: 'superstition', rank: '17세기 신비주의 종파와 종교적 황홀경(Secte Mystique des Trembleurs)', domains: ["미신·민속(Superstition)","1863 원서 삽화 수록","조지 폭스와 윌리엄 펜","종교적 광신","신체 경련과 황홀경"] },
  'e3166-queiranisaac': { category: 'person', rank: '1609년 보르도 마녀재판의 마법사 하인(Sorcier de Nérac)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","피에르 드 랑크르","사바트와 독약 제조","1609년 처형"] },
  'e3167-question': { category: 'crossref', rank: '상호참조(Renvoi)', domains: ["미신·민속(Superstition)","상호참조","마녀재판 고문","고통 무감각"] },
  'e3168-queys': { category: 'myth', rank: '중국 전통 신앙의 원혼과 악귀(Mauvais Génies Chinois)', domains: ["신화·전설(Mythologie)","동양 신화","중국 민속 신앙","귀신(鬼神) 전승"] },
  'e3169-quintillianites': { category: 'superstition', rank: '2세기 북아프리카의 영지주의 카인파 이단(Secte Gnostique Hérétique)', domains: ["미신·민속(Superstition)","초기 기독교 이단","테르툴리아누스 기록","카인파 영지주의","상호참조"] },
  'e3170-quirim': { category: 'superstition', rank: '수면 중 가슴속 진실을 자백하게 만드는 마법의 돌(Pierre Merveilleuse)', domains: ["미신·민속(Superstition)","광물 마법","중세 보석지","배신자의 돌","비밀 누설 주술"] },
  'e3171-quivognefemme': { category: 'person', rank: '19세기 브줄의 사기 점쟁이이자 마녀 피고인(Sorcière Contemporaine)', domains: ["인물·역사(Personnage)","1863 원서 삽화 수록","19세기 프랑스 범죄","공중 전차 마법 사기","브줄 법원 판결"] },

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

