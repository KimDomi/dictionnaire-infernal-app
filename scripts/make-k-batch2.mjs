import fs from 'fs';

export const BATCH2_DATA = [
  {
    id: "e2258-khizzer",
    nameFr: "Khizzer",
    nameKo: "히즈르(영생의 녹색 예언자) [Khizzer / Al-Khidr]",
    nameKoShort: "히즈르",
    nameEn: "Al-Khidr (The Green One, Immortal Prophet of the Waters of Life in Islamic Lore)",
    category: "myth",
    rank: "이슬람 신비주의에서 생명수를 마시고 불로불사를 얻어 사막의 길 잃은 여행자를 인도하는 성스러운 예언자",
    domains: ["신화·전설(Mythe)", "이슬람 신비주의(Sufisme)", "알히즈르(Al-Khidr)", "생명수", "수피즘 스승"],
    translationKo: "동양과 이슬람 전승에서 불로불사의 은총을 얻은 신비로운 영적 안내자 알히즈르(Al-Khidr)를 가리킨다. 아랍인들은 종종 그를 구약의 예언자 엘리야와 동일시하기도 한다. 전설에 따르면 그는 칠흑 같은 어둠의 땅 끝에 있는 영생의 샘물을 찾아내어 마심으로써 죽지 않는 불멸의 생명을 얻었다. 그가 발을 딛는 곳마다 메마른 땅에서 푸른 풀잎과 꽃들이 솟아난다고 하여 '녹색의 사람(알히즈르)'이라 불린다. 사막이나 험한 산악에서 조난당한 신실한 여행자들 앞에 나타나 올바른 길을 안내하고 영적 깨달음을 주는 자비로운 수호 성자로 숭배된다."
  },
  {
    id: "e2259-khumanogoo",
    nameFr: "Khumano-Goo",
    nameKo: "구마노 고오후(까마귀 신토 서약 시련) [Khumano-Goo / Kumano Goou-houin]",
    nameKoShort: "구마노 고오후",
    nameEn: "Kumano Goou (Japanese Shinto Ordeal Using Crow-Inscribed Talismans to Detect Perjury)",
    category: "superstition",
    rank: "신의 사자인 세 발 까마귀가 새겨진 부적을 태운 재를 마시게 하여 위증자를 피 토하게 한 일본 신토 시련법(p.389 삽화)",
    domains: ["미신·풍습(Superstition)", "1863 원서 삽화 수록", "일본 신토(Shinto)", "구마노 신사", "시련 재판(Ordalie)", "신성 서약 부적"],
    translationKo: "일본 구마노(熊野) 신사에서 신성한 서약과 범죄 심문을 위해 사용했던 유명한 신토 부적 시련 의식(구마노 고오후, 熊野牛王符)에 관한 항목이다. 이 부적에는 신의 거룩한 사자인 수십 마리의 검은 까마귀들이 신비로운 문자의 형상으로 빼곡하게 인쇄되어 있다. 재판관은 피고인이나 서약자에게 이 부적 뒷면에 서약의 내용을 적고 피로 서명하게 한 뒤, 부적 한 장을 불태워 그 재를 물에 타서 마시게 했다. 만약 진술에 거짓이 있거나 위증을 했을 경우, 신의 노여움을 사 즉시 피를 토하고 미쳐 죽으며 구마노 산의 까마귀 세 마리가 즉각 목숨을 잃는다는 엄격한 종교적 시련 재판으로 두려움을 샀다."
  },
  {
    id: "e2260-kiakiak",
    nameFr: "Kiakiak",
    nameKo: "키아키악(페구의 산꼭대기 악마 우상) [Kiakiak / Demon of Pegu]",
    nameKoShort: "키아키악",
    nameEn: "Kiakiak (Demonic Deity of Burma Revered in Mountain Temples of Pegu)",
    category: "myth",
    rank: "미얀마 옛 페구 왕국의 험준한 산 정상 신전에 모셔져 사람들의 공포와 헌주를 받았던 파괴의 악마 우상",
    domains: ["신화·전설(Mythe)", "미얀마 민속", "페구 왕국", "토착 우상 숭배", "산악 악령"],
    translationKo: "미얀마 옛 버마 남부 페구(Pégu) 왕국의 원주민들이 숭배했던 무시무시한 악마 우상이다. 주민들은 험준한 산 정상에 거대한 신전을 짓고 흉측한 형상의 키아키악 상을 모셔두었다. 그가 노여워하면 나라에 가뭄, 역병, 전쟁의 참화를 내린다고 믿었기 때문에, 백성들은 재앙을 면하기 위해 정기적으로 산에 올라 많은 술과 가축을 제물로 바치며 분노를 달랬다."
  },
  {
    id: "e2261-kijoun",
    nameFr: "Kijoun",
    nameKo: "키윤(토성의 우상) [Kijoun / Chiun]",
    nameKoShort: "키윤",
    nameEn: "Chiun (Ancient Semitic Idolatrous Deity of Saturn Mentioned in Amos)",
    category: "myth",
    rank: "구약 아모스서에 언급된 광야의 이스라엘인들이 하느님을 저버리고 숭배했던 토성의 아스트랄 우상",
    domains: ["신화·전설(Mythe)", "구약 성서(Amos)", "고대 셈족 우상", "토성 숭배(Kewan)", "아스트랄 점성술"],
    translationKo: "구약성서 『아모스서』 5장 26절에 언급되는 고대 셈족의 우상이다. 아모스 선지자는 광야를 헤매던 이스라엘 백성들이 천지의 창조주를 저버리고 '너희의 신 식굿과 기윤(Chiun), 너희의 별 우상'을 가슴에 품고 다녔다고 통렬히 규탄했다. 아시리아와 바빌로니아의 토성 신 '카이와누(Kaiwanu)'에서 유래한 것으로, 고대 점성술에서 불길함과 파멸을 주관하는 토성의 악마적 신격으로 숭배되었다."
  },
  {
    id: "e2262-kiones",
    nameFr: "Kiones",
    nameKo: "키오네스(고대 그리스의 돌기둥 우상) [Kiones / Column Idols]",
    nameKoShort: "키오네스",
    nameEn: "Kiones (Ancient Aniconic Stone Pillars Revered as Deities in Archaic Greece)",
    category: "superstition",
    rank: "인간 형상의 신상이 조각되기 이전 고대 그리스인들이 신성을 모시기 위해 세웠던 직사각형의 거석 돌기둥",
    domains: ["미신·풍습(Superstition)", "고대 그리스 종교", "비상형 우상(Aniconism)", "거석 숭배", "베틸로스(Baetylus)"],
    translationKo: "인간의 형상으로 신상을 정교하게 깎아 만들기 이전 고대 그리스의 원시 종교 시대에 숭배되었던 긴 직사각형의 신성한 돌기둥 우상들을 가리키는 명칭이다. 고대인들은 이 거친 자연석 기둥 속에 신들의 영적인 임재가 깃들어 있다고 믿어, 기둥에 기름과 포도주를 붓고 향을 피우며 신탁을 구했다."
  },
  {
    id: "e2263-kirghis",
    nameFr: "Kirghis",
    nameKo: "키르기스인의 정령 신앙과 주술 [Kirghis / Kyrgyz Folk Beliefs]",
    nameKoShort: "키르기스인 미신",
    nameEn: "Kyrgyz (Central Asian Nomadic Superstitions, Wolf Totems, and Demon Scares)",
    category: "superstition",
    rank: "이슬람 신앙 속에서도 대초원의 늑대 토템과 악령들의 해악을 막기 위해 부적과 샤머니즘을 지켜온 유목민",
    domains: ["미신·풍습(Superstition)", "중앙아시아 유목민", "키르기스 민속", "늑대 토템", "초원의 악령"],
    translationKo: "중앙아시아 천산산맥과 대초원에 거주하는 유목 민족 키르기스인들의 민간 신앙과 주술에 관한 항목이다. 그들은 이슬람교를 신봉하면서도 태고의 샤머니즘과 애니미즘 전통을 깊이 간직하고 있었다. 초원의 사나운 악령들이 가축의 떼죽음과 아이들의 질병을 일으킨다고 믿어, 샤먼(박시)을 불러 양의 어깨뼈를 불에 태워 점을 치거나 늑대의 이빨과 발톱을 아이들의 옷깃에 매달아 마귀를 쫓는 강력한 벽사 부적으로 삼았다."
  },
  {
    id: "e2264-kericoff",
    nameFr: "Kericoff",
    nameKo: "케리코프의 호수 괴수 [Kericoff / Lake Monster of Russia]",
    nameKoShort: "케리코프 괴수",
    nameEn: "Kericoff (Russian Lake Monster Illustrated Stirring Giant Storm Waves)",
    category: "demon",
    rank: "러시아 호수 깊은 물속에서 거대한 비늘 꼬리로 파도를 휘저으며 어선을 뒤집는 수룡 괴수의 삽화 항목(p.390 삽화)",
    domains: ["악마학(Démonologie)", "1863 원서 삽화 수록", "러시아 수룡 괴수", "호수의 악마", "익사 괴담"],
    translationKo: "러시아 호수의 깊은 물속에 서식하며 어부들을 공포에 떨게 만드는 수생 악마 케리코프의 사나운 모습을 형상화한 본문 목판화 표제어이다. 뱀의 비늘과 용의 머리를 한 괴물이 호수 수면 위로 솟구쳐 거대한 파도를 일으키는 장엄하고 기괴한 모습을 담고 있다."
  },
  {
    id: "e2265-kisilovalevampirede",
    nameFr: "Kisilova (le vampire de)",
    nameKo: "키실로바의 뱀파이어(페테르 플로고요비치) [Kisilova / Vampire of Kisilova]",
    nameKoShort: "키실로바 뱀파이어",
    nameEn: "Vampire of Kisilova (Famous 1725 Peter Plogojowitz Case Documented by Austrian Officials)",
    category: "superstition",
    rank: "1725년 세르비아 키실로바에서 9명을 물어 죽이고 무덤에서 생생한 피를 흘려 심장에 말뚝을 박은 흡혈귀(p.390 삽화)",
    domains: ["미신·풍습(Superstition)", "1863 원서 삽화 수록", "흡혈귀(Vampire)", "키실로바 사건(1725)", "페테르 플로고요비치", "오스트리아 공식 보고서"],
    translationKo: "1725년 오스트리아 통치하의 세르비아 키실로바(Kisilova) 마을에서 발생한 역사상 가장 공인되고 유명한 뱀파이어 사건이다. 프랑스의 철학자 다르장스(Marquis d'Argens) 후작을 비롯한 학자들의 저술에 공식 보고서가 수록되었다. 페테르 플로고요비치(Petar Blagojević)라는 농부가 사망하여 매장된 지 열흘 만에, 마을 주민 9명이 그가 밤마다 침실에 찾아와 목을 조르고 피를 빨아먹었다고 호소한 뒤 차례로 숨졌다. 공포에 질린 마을 주민들의 요청으로 오스트리아 제국 군의관과 관리가 입회한 가운데 그의 무덤을 파헤쳤다. 놀랍게도 시신은 부패하지 않은 채 수의를 찢고 나와 있었으며, 머리카락과 손톱이 새로 자라나 있었고 입가에는 그가 희생자들에게서 빨아먹은 생생하고 붉은 피가 흘러넘치고 있었다. 사형 집행인이 날카로운 사시나무 말뚝을 심장에 박자 시신에서 끔찍한 비명과 함께 대량의 선혈이 솟구쳤으며, 시신을 완전히 불태워 잿더미로 만들고 나서야 끔찍한 연쇄 사망이 멈추었다."
  },
  {
    id: "e2266-klabber",
    nameFr: "Klabber",
    nameKo: "클라버(스코틀랜드 가택 난쟁이 요정) [Klabber / Kab-Outer]",
    nameKoShort: "클라버",
    nameEn: "Klabber (Scottish Brownies Shelter in Chimneys and Guarding the Fireside)",
    category: "myth",
    rank: "겨울철 스코틀랜드 시골 농가의 굴뚝과 벽난로 곁에 숨어 살며 온기를 지키는 작은 난쟁이 요정",
    domains: ["신화·전설(Mythe)", "스코틀랜드 민속", "가택 난쟁이 요정", "벽난로 정령"],
    translationKo: "스코틀랜드 시골 농가의 민간 전승에 등장하는 작은 난쟁이 가택 요정(브라우니)이다. 플랑드르의 카바우터(Kab-Outer)와 같은 계통의 정령으로 여겨진다. 혹독한 추위가 몰아치는 겨울밤이 되면 따뜻한 부엌 벽난로의 재 속이나 굴뚝 틈새에 숨어들어 웅크리고 잠을 자며, 집안에 불길이 번지지 않도록 화기를 지켜주고 착한 하녀들의 집안일을 은밀히 도와준다고 전해진다."
  },
  {
    id: "e2267-kleudde",
    nameFr: "Kleudde",
    nameKo: "클뢰드(플랑드르의 검은 변신 요마) [Kleudde / The Shape-Shifting Phantom]",
    nameKoShort: "클뢰드",
    nameEn: "Kleudde (Flemish Shapeshifting Fiend Appearing as Black Dog, Horse, or Bundle of Straw)",
    category: "demon",
    rank: "검은 개, 거대한 말, 짚더미로 변신해 밤길 나그네의 등 위에 올라타 늪지대에 빠뜨리는 플랑드르 요마(p.391 삽화)",
    domains: ["악마학(Démonologie)", "1863 원서 삽화 수록", "플랑드르 민속", "변신 악령", "밤길 습격자", "늪지대 익사"],
    translationKo: "벨기에 플랑드르 전역에서 밤마다 나그네들을 공포에 떨게 만드는 가장 사악하고 기괴한 변신 요마이다. 이름만 들어도 오싹한 불협화음을 풍기는 클뢰드는 특정한 고정된 형태가 없다. 으슥한 밤길을 홀로 걷는 여행자 앞에 처음에는 길가에 버려진 한 줌의 지푸라기 짚더미나 조그만 검은 강아지의 모습으로 나타난다. 그러나 여행자가 무심코 다가가거나 지나치려 하면, 순식간에 두 발로 일어서는 거대한 검은 개로 변하거나 불타는 눈을 번뜩이는 거대한 괴물 말(馬)로 팽창한다. 그런 다음 나그네의 등 뒤로 껑충 뛰어올라 목을 조르고 온몸을 무겁게 짓누르며 쏜살같이 질주하여 차가운 강물이나 깊은 늪지대 한가운데로 집어던져버린다. 허우적거리며 간신히 목숨을 건진 나그네의 귓가에 차가운 웃음소리를 남기고 홀연히 사라진다고 전해진다."
  },
  {
    id: "e2268-klingerfredericmaximiliende",
    nameFr: "Klinger (Frédéric-Maximilien de)",
    nameKo: "프리드리히 막시밀리안 폰 클링거 [Klinger (Frédéric-Maximilien de)]",
    nameKoShort: "클링거",
    nameEn: "Friedrich Maximilian Klinger (German Dramatist of Sturm und Drang and Author of Faust)",
    category: "person",
    rank: "독일 문학사 질풍노도 운동의 명명자이자 『파우스트의 삶, 행적, 지옥행』을 쓴 18세기 작가",
    domains: ["인물·역사(Personnage)", "질풍노도(Sturm und Drang)", "파우스트 문학", "독일 낭만주의"],
    translationKo: "1752년 프랑크푸르트암마인에서 태어나 1831년에 사망한 독일의 저명한 극작가이자 군인이다. 그의 희곡 『질풍노도(Sturm und Drang)』는 괴테와 실러를 비롯한 당대 독일 문학의 거대한 혁신 운동의 명칭이 되었다. 그는 1791년 악마학 문학의 명저인 『파우스트의 삶, 행적, 그리고 지옥으로의 추락(Fausts Leben, Thaten und Höllenfahrt)』이라는 철학적 소설을 출간하여, 지식에 목마른 지식인이 악마 메피스토펠레스와 계약을 맺고 세상을 유람하며 마주하는 인간 사회의 온갖 위선과 부패, 잔혹상을 적나라하게 폭로하였다."
  },
  {
    id: "e2269-knipperdolinck",
    nameFr: "Knipperdolinck",
    nameKo: "베른하르트 크니퍼돌링 [Bernhard Knipperdolinck]",
    nameKoShort: "크니퍼돌링",
    nameEn: "Bernhard Knipperdolling (Anabaptist Leader and Executioner of Münster Rebellion of 1534)",
    category: "person",
    rank: "1534년 뮌스터 재세례파 반란의 주동자이자 얀 판 레이던의 사형 집행인 겸 시장(p.392 삽화)",
    domains: ["인물·역사(Personnage)", "1863 원서 삽화 수록", "뮌스터 반란(1534)", "재세례파 이단", "광신주의와 참수"],
    translationKo: "1534년 독일 뮌스터(Münster) 시를 장악하고 신정정치 천년왕국을 세우려 했던 재세례파 광신 반란의 핵심 주동자이자 시당국의 수장이었던 인물이다. 자칭 '시온의 왕' 얀 판 레이던(Jean de Leyde)의 심복으로서 뮌스터의 시장이자 수석 사형 집행관을 맡았다. 그는 왕의 뜻에 조금이라도 반대하는 시민들의 목을 광장에서 거침없이 베어내는 등 잔혹한 공포정치를 집행했다. 1535년 뮌스터 시가 주교 연합군에 함락되자 체포되어 불에 달군 쇠집게로 온몸의 살점을 뜯기는 극형을 당한 뒤 시신이 철창 케이지에 갇혀 성 람베르티 성당 탑 꼭대기에 매달리는 처참한 최후를 맞았다."
  },
  {
    id: "e2270-knoxjean",
    nameFr: "Knox (Jean)",
    nameKo: "존 녹스 [John Knox]",
    nameKoShort: "존 녹스",
    nameEn: "John Knox (Scottish Reformer and Fiery Preacher Who Attacked Mary Queen of Scots)",
    category: "person",
    rank: "스코틀랜드 장로교를 창설하고 여왕 메리 스튜어트를 우상숭배자이자 마녀라 규탄했던 불굴의 종교개혁자",
    domains: ["인물·역사(Personnage)", "스코틀랜드 종교개혁", "장로교 창시자", "메리 스튜어트", "마녀 규탄"],
    translationKo: "1514년경 스코틀랜드 하딩턴에서 태어나 1572년 에든버러에서 사망한 스코틀랜드 종교개혁의 거두이자 장로교의 창시자이다. 가톨릭 사제 출신이었으나 제네바에서 장 칼뱅을 만나 깊은 감화를 받은 뒤 스코틀랜드로 돌아와 가톨릭 교회를 전면 타파하고 강력한 신정체제를 확립했다. 그는 프랑스에서 귀국한 아름다운 가톨릭 여왕 메리 스튜어트를 구약의 사악한 왕비 이세벨에 비유하며 악마의 하수인이자 마녀라고 맹렬히 공격하여 왕위를 폐위시키는 데 결정적인 역할을 하였다. 콜랭 드 플랑시는 독선과 광기로 가톨릭을 유린한 배교자이자 잔혹한 약탈자라는 비판적 시각을 담아 기록하였다."
  },
  {
    id: "e2271-kobal",
    nameFr: "Kobal",
    nameKo: "코발(지옥의 희극 총감독) [Kobal / Director of Comedies in Hell]",
    nameKoShort: "코발",
    nameEn: "Kobal (Treacherous Demon Who Bites Laughing, General Director of Infernal Farces)",
    category: "demon",
    rank: "얼굴에 웃음을 띤 채 인간을 치명적으로 물어뜯는 위선자이자 지옥 어릿광대들의 희극 총괄 궁정관",
    domains: ["악마학(Démonologie)", "지옥 궁정관", "위선과 조소", "풍자와 희극", "궁정 어릿광대"],
    translationKo: "지옥 제국의 최고 궁정에서 어릿광대와 배우들을 총괄 지휘하는 지옥의 희극 총감독(Directeur général des farces de l'enfer)이다. 그는 겉으로는 언제나 친절하고 유쾌하게 껄껄 웃는 얼굴을 하고 있으나, 상대방이 방심한 틈을 타 가장 잔인하고 치명적인 독니로 물어뜯는 배신과 위선의 악마이다. 인간 세상의 풍자 작가, 음흉한 모사꾼, 남을 조롱하며 쾌락을 느끼는 자들을 배후에서 조종하며, 지옥의 군주들이 따분해할 때 인간들의 어리석은 타락과 파멸을 우스꽝스러운 연극으로 재현하여 벨제뷔트의 궁정을 웃기는 역할을 맡고 있다."
  },
  {
    id: "e2272-kobold",
    nameFr: "Kobold",
    nameKo: "코볼트(독일 광산과 가택의 난쟁이 요정) [Kobold / German Mine Goblin]",
    nameKoShort: "코볼트",
    nameEn: "Kobold (German House and Mine Sprite Who Helps with Chores but Punishes Insults)",
    category: "myth",
    rank: "은밀히 광맥을 파내거나 부엌일을 돕고 집주인이 모욕하면 솥을 뒤엎는 독일의 전설적 난쟁이 요정(p.392 삽화)",
    domains: ["신화·전설(Mythe)", "1863 원서 삽화 수록", "독일 민속", "가택 요정", "광산의 코볼트", "코발트 원소의 유래"],
    translationKo: "독일 민간 전승에 등장하는 가장 대표적인 가택 요정이자 지하 광산의 난쟁이 정령이다. 키가 서너 뼘에 불과한 난쟁이의 모습을 하고 있으며, 때로는 붉은 재킷에 모자를 쓰고 나타난다. 부엌에 상주하는 가택 코볼트는 밤마다 장작을 패놓고 바닥을 쓸며 불씨를 지켜주어 집안에 번영을 가져다준다. 반면 광산에 사는 코볼트는 갱도 깊숙한 곳에서 곡괭이질 소리를 내며 광부들에게 풍부한 은광맥을 알려주기도 하지만, 광부들이 불경하게 굴면 낙반을 일으키거나 유독가스를 내뿜는다. 광부들이 은으로 착각하고 캤다가 독기만 뿜어내는 쓸모없는 광석을 '코볼트의 돌'이라 부른 데서 화학 원소 코발트(Cobalt)의 명칭이 유래하였다."
  },
  {
    id: "e2273-kojozed",
    nameFr: "Kojozed",
    nameKo: "코요제드의 유령 사냥개 [Kojozed / Phantom Hound of Bohemia]",
    nameKoShort: "코요제드 사냥개",
    nameEn: "Hound of Kojozed (Bohemian Phantom Greyhound Haunting the Woods with Fiery Eyes)",
    category: "superstition",
    rank: "보헤미아 코요제드 영주의 사냥개가 밤마다 불타는 눈으로 숲을 질주한다는 유령견 전설(p.392 삽화)",
    domains: ["미신·풍습(Superstition)", "1863 원서 삽화 수록", "유령 사냥개(Black Dog)", "보헤미아 전설", "야간 사냥"],
    translationKo: "중부 유럽 보헤미아의 코요제드(Kojozed) 영지에 전해 내려오는 불길한 유령 사냥개 전설이다. 옛 영주가 생전에 사냥에 광적으로 집착하다 숨진 뒤, 그가 가장 아끼던 사냥개 그레이하운드가 죽어서도 이승을 떠나지 못하고 밤마다 눈에서 이글거리는 불꽃을 내뿜으며 숲과 들판을 질주한다는 설화이다. 한밤중에 이 유령 사냥개의 거친 숨소리와 발자국 소리를 들은 여행자는 극심한 한기 속에 병을 얻어 앓아눕게 된다고 전해진다."
  },
  {
    id: "e2274-kolfi",
    nameFr: "Kolfi",
    nameKo: "콜피 [Kolfi]",
    nameKoShort: "콜피",
    nameEn: "Kolfi (Bavarian Regional Name for the Kobold)",
    category: "myth",
    rank: "독일 남부 바이에른과 오스트리아 알프스 지방에서 난쟁이 가택 요정 코볼트를 부르던 방언 명칭",
    domains: ["신화·전설(Mythe)", "가택 요정", "코볼트 방언", "알프스 민속"],
    translationKo: "독일 남부 바이에른과 오스트리아 알프스 일대에서 전설적인 난쟁이 가택 요정인 코볼트(Kobold)를 친근하게 부르던 고유한 방언 명칭이다."
  },
  {
    id: "e2275-koran",
    nameFr: "Koran",
    nameKo: "코란(이슬람 성전의 영적 전승) [Koran / The Holy Quran]",
    nameKoShort: "코란",
    nameEn: "The Quran (Islamic Holy Scripture Containing Suras on Jinn, Devils, and Magic)",
    category: "grimoire",
    rank: "무함마드가 천사 지브릴에게 받은 계시이자 진(Jinn)과 악마 이블리스의 기원이 수록된 이슬람의 성전",
    domains: ["마도서·문헌(Grimoire)", "이슬람 성전", "꾸란(Quran)", "진(Jinn)과 이블리스", "하룬과 마룬"],
    translationKo: "이슬람교의 창시자 예언자 무함마드가 대천사 지브릴(가브리엘)을 통해 알라에게 직접 받았다고 선포한 이슬람의 최고 경전이자 법전이다. 악마학과 초자연적 전승의 관점에서 코란에는 인간보다 먼저 연기 없는 순수한 불꽃으로 창조된 보이지 않는 영적 종족 '진(Jinn)'의 존재, 하느님께 불복종하여 아담에게 엎드리기를 거부하고 쫓겨난 최초의 타락자 이블리스(Iblis), 바빌론에서 인간에게 마법을 가르쳤다는 두 타락천사 하루트와 마루트의 전승 등 풍성한 초자연적 신화 설화들이 수록되어 있다."
  },
  {
    id: "e2276-kornmannhenri",
    nameFr: "Kornmann (Henri)",
    nameKo: "하인리히 코른만 [Henri Kornmann / Heinrich Kornmann]",
    nameKoShort: "하인리히 코른만",
    nameEn: "Heinrich Kornmann (17th-Century German Jurist and Scholar of Subterranean Spirits and Miracles)",
    category: "person",
    rank: "1620년에 사망한 독일 법학자이자 사후 영혼의 기적과 땅속 원소 정령에 관한 라틴어 명저를 남긴 학자",
    domains: ["인물·역사(Personnage)", "독일 법학자", "원소 정령론", "죽은 자의 기적", "17세기 오컬트 문헌"],
    translationKo: "1620년에 사망한 독일의 저명한 법학자이자 신비학 문헌 저술가이다. 그는 1610년 프랑크푸르트에서 『죽은 자들의 기적(De miraculis mortuorum)』을 출간하여 무덤 속 시체가 피를 흘리는 살인범 감별 현상과 뱀파이어 현상을 법학적·철학적으로 논증하였으며, 1614년에는 『자연의 기적(De miraculis naturae)』을 저술하여 불, 물, 공기, 흙 속에 깃든 샐러맨더, 운디네, 실프, 코볼트 등 파라켈수스적 원소 정령들의 실재를 방대한 고전 문헌을 인용하여 고증하였다."
  },
  {
    id: "e2277-kosaks",
    nameFr: "Kosaks",
    nameKo: "코사크족의 기마 전승과 주술 [Kosaks / Cossack Superstitions]",
    nameKoShort: "코사크족 미신",
    nameEn: "Cossacks (Don and Dnieper Cossack War Magic, Bullet-Catching Charms, and Omens)",
    category: "superstition",
    rank: "돈강과 드네프르강 대초원의 코사크 기마 전사들이 총알을 막고 상처를 치유하기 위해 품었던 전장 주술",
    domains: ["미신·풍습(Superstition)", "러시아·우크라이나 민속", "코사크 전사(Cosaques)", "방탄 부적", "전장 미신"],
    translationKo: "러시아 남부와 우크라이나의 대초원에 거주하던 자유 기마 전사 집단인 코사크(Cossacks)족의 전투 미신에 관한 항목이다. 정교회 신앙을 가지면서도 칼미크족과 타타르 유목민들의 영향을 강하게 받았다. 코사크 전사들은 전장에 나갈 때 적의 총알과 칼날이 몸을 뚫지 못하게 해준다는 특수한 성화 부적이나 늑대 가죽 조각을 가슴에 품었으며, 피를 멈추게 하는 성서 구절 주문을 외우고 까마귀의 비행을 보고 매복의 위험을 점쳤다."
  },
  {
    id: "e2278-kotter",
    nameFr: "Kotter",
    nameKo: "크리스토프 코터 [Kotter / Christoph Kotter]",
    nameKoShort: "크리스토프 코터",
    nameEn: "Christoph Kotter (Crossref to Comenius)",
    category: "crossref",
    rank: "상호참조 표제어 (Renvoi)",
    domains: ["상호참조", "코메니우스 [Comenius]"],
    translationKo: "환시가. 코메니우스(Comenius) 항목을 참조하라."
  },
  {
    id: "e2279-koughas",
    nameFr: "Koughas",
    nameKo: "쿠가스(알류샨 열도의 해양 식인 악령) [Koughas / Aleutian Cannibal Demon]",
    nameKoShort: "쿠가스",
    nameEn: "Koughas (Malignant Sea Fiend Feared by the Aleutian Islanders for Raising Storms)",
    category: "demon",
    rank: "알래스카 알류샨 열도 원주민들이 짙은 바다안개 속에서 가죽 카약을 뒤집고 사람을 잡아먹는다고 믿은 악령",
    domains: ["악마학(Démonologie)", "알류샨 열도 민속", "이누이트·알류트 신화", "바다의 악령", "식인 괴수"],
    translationKo: "북태평양 알래스카와 캄차카반도 사이에 길게 늘어선 알류샨(Aléoutiennes) 열도의 원주민 알류트족이 가장 두려워했던 사악한 해양 악령이다. 짙은 바다안개가 깔릴 때 거대한 바다사자나 검은 괴수의 형상으로 출몰하여, 물개 사냥을 나간 사냥꾼들의 가죽 카약을 거대한 발톱으로 찢어 뒤집고 어부들을 바닷속으로 끌고 가 살점을 뜯어먹는 잔혹한 식인 바다 괴수로 전해진다."
  },
  {
    id: "e2280-koupais",
    nameFr: "Koupaïs",
    nameKo: "쿠파이스(알타이 타타르의 7대 지하 신령) [Koupaïs / Seven Chthonic Deities of Altai]",
    nameKoShort: "쿠파이스",
    nameEn: "Koupais (Seven Underworld Deities of the Altai Tatars Who Devour Human Souls)",
    category: "myth",
    rank: "중앙아시아 알타이산맥 타타르족 신화에서 명계의 왕 에를릭 칸을 호위하는 일곱 명의 지하 악신",
    domains: ["신화·전설(Mythe)", "알타이 샤머니즘", "타타르 신화", "에를릭 칸", "지하 명계의 7신"],
    translationKo: "중앙아시아 알타이산맥에 거주하는 타타르족 신화에 등장하는 일곱 명의 강력한 지하 명계 신령들이다. 그들은 지하 암흑 제국의 지배자인 에를릭 칸(Erlik Khan)의 궁정에 거처하며, 인간 세상에 전염병과 죽음을 퍼뜨리고 죽은 자들의 영혼을 사슬에 묶어 지하로 끌고 가는 저승사자의 역할을 수행한다. 타타르족은 이들의 노여움을 달래기 위해 검은 말이나 양을 잡아 제단에 바쳤다."
  },
  {
    id: "e2281-kourrigans",
    nameFr: "Kourrigans",
    nameKo: "코리간(브르타뉴 거석 고인돌의 요정 여인들) [Kourrigans / Korrigans]",
    nameKoShort: "코리간",
    nameEn: "Korrigans (Breton Fairies Dancing on Dolmens and Bewitching Travelers by Springs)",
    category: "myth",
    rank: "백마를 타고 밤마다 고인돌과 맑은 샘가에서 춤을 추며 눈부신 아름다움으로 길손을 홀리는 브르타뉴 요정",
    domains: ["신화·전설(Mythe)", "브르타뉴 켈트 민속", "코리간(Korrigan)", "거석 고인돌(Dolmen)", "변신 요정", "체인질링"],
    translationKo: "프랑스 서부 브르타뉴 지방의 고대 거석 유적과 숲속 맑은 샘가에 출몰하는 전설적인 켈트 요정 여인들이다. 낮에는 늙고 추한 난쟁이 노파의 모습으로 바위 틈에 숨어 있다가, 밤이 되면 눈부실 만큼 아름다운 황금빛 머리칼의 처녀로 변신하여 순백의 백마를 타고 고인돌(돌멘)과 선돌 주위를 맴돌며 요정의 원무(Ronde)를 춘다. 그들의 신비로운 춤과 노래에 홀린 젊은 나그네는 밤새도록 함께 춤을 추다가 새벽녘 닭이 울 때 심장마비로 쓰러지거나 미쳐버린다. 또한 인간의 건강한 갓난아기를 훔쳐 가고 대신 자신들의 못생긴 아기(체인질링)를 요람에 두고 가는 요정으로도 악명 높다."
  },
  {
    id: "e2282-kraken",
    nameFr: "Kraken",
    nameKo: "크라켄(북해의 거대한 섬 괴수) [Kraken / The Giant Sea Monster of Norway]",
    nameKoShort: "크라켄",
    nameEn: "Kraken (Legendary Giant Cephalopod Sea Monster of Norway Covering Miles of Ocean)",
    category: "myth",
    rank: "등판이 섬처럼 떠오르고 수십 개의 거대한 촉수로 군함을 침몰시키는 노르웨이 북해의 전설적 대괴수(p.393 삽화)",
    domains: ["신화·전설(Mythe)", "1863 원서 삽화 수록", "북유럽 해양 전설", "크라켄(Kraken)", "폰토피단 주교", "대왕오징어"],
    translationKo: "노르웨이 해안과 북해의 차가운 바다에 서식한다고 전해지는 세계 해양 전설상 가장 거대하고 공포스러운 바다 괴수이다. 노르웨이의 베르겐 주교 에리크 폰토피단(Erik Pontoppidan)의 기록에 따르면, 바다 한가운데에서 갑자기 수심이 급격히 얕아지며 거대한 물고기 떼가 솟구쳐 오를 때 어부들은 즉시 사력을 다해 노를 저어 달아나야 했다. 잠시 후 바다 밑에서 섬 하나 크기에 달하는 거대한 괴수의 등판이 떠오르며, 군함의 돛대만큼 굵고 강력한 수십 개의 빛나는 촉수 팔들이 하늘 높이 솟구쳐 배를 통째로 휘감아 바닷속 깊은 심연으로 끌고 들어갔다. 괴물이 다시 물속으로 가라앉을 때 일어나는 거대한 소용돌이는 지나가던 대형 함선조차 집어삼킬 만큼 무시무시했다. 1680년 노르웨이 암반 해역에 한 마리가 좌초하여 썩으면서 온 나라에 역병의 공포를 불러일으켰다는 역사적 기록이 전해진다."
  },
  {
    id: "e2283-kratim",
    nameFr: "Kratim",
    nameKo: "크라팀(에페소스 일곱 잠자는 자들의 충견) [Kratim / Katmir]",
    nameKoShort: "크라팀",
    nameEn: "Kratim (Katmir, Faithful Dog of the Seven Sleepers Who Entered Paradise)",
    category: "myth",
    rank: "동굴 속에서 309년 동안 기독교 성인들을 지키며 인간의 말을 하여 천국에 들어갈 자격을 얻은 성견",
    domains: ["신화·전설(Mythe)", "에페소스 일곱 잠자는 자들", "이슬람 전승", "카트미르(Katmir)", "천국에 들어간 동물"],
    translationKo: "카트미르(Katmir)로도 불리는 에페소스의 일곱 잠자는 성인들을 지킨 충견이다. 로마 황제 데키우스의 박해를 피해 에페소스 인근 산속 동굴로 피신한 일곱 기독교 청년들을 따라간 충실한 개로, 동굴 입구에서 두 앞발을 뻗고 엎드려 309년 동안 성인들이 깊은 잠에 빠져 있는 내내 동굴을 지켰다. 이슬람 코란 『동굴의 장(수라 알카흐프)』에도 그 충절이 기록되어 있으며, 이슬람 전승에서는 예언자 무함마드의 낙타 알카스바, 솔로몬의 개미와 함께 동물로서는 예외적으로 최후의 심판 날 영원한 천국에 입장할 축복을 받은 성스러운 동물로 추앙받았다."
  },
  {
    id: "e2284-krechting",
    nameFr: "Krechting",
    nameKo: "베른하르트 크레히팅 [Bernhard Krechting]",
    nameKoShort: "크레히팅",
    nameEn: "Bernhard Krechting (Anabaptist Leader Executed with Iron Tongs in Münster in 1536)",
    category: "person",
    rank: "1536년 뮌스터 재세례파 반란의 주동자로 얀 판 레이던과 함께 처형되어 철창에 매달린 지도자(p.395 삽화)",
    domains: ["인물·역사(Personnage)", "1863 원서 삽화 수록", "뮌스터 반란(1536)", "재세례파 이단", "성 람베르티 성당 케이지"],
    translationKo: "1534~1536년 독일 뮌스터 재세례파 반란의 최고 지도부 중 한 사람이었던 성직자이자 설교자이다. 얀 판 레이던이 선포한 광신적 천년왕국에서 수석 궁정 고문관으로 활동하며 일부다처제와 사유재산 폐지 등 극단적인 교리를 집행했다. 1535년 도시가 함락되자 체포되어, 1536년 1월 22일 뮌스터 중앙 광장에서 얀 판 레이던, 크니퍼돌링과 함께 불에 달군 쇠집게로 온몸을 찢기는 잔혹한 고문 끝에 단검으로 심장이 찔려 처형되었다. 그들의 시신은 철창 케이지에 담겨 성 람베르티 성당 탑 꼭대기에 걸려 수백 년 동안 전시되었다."
  },
  {
    id: "e2285-krodo",
    nameFr: "Krodo",
    nameKo: "크로도(거대한 물고기를 탄 색슨족 고대 신) [Krodo / Ancient Saxon Fish God]",
    nameKoShort: "크로도",
    nameEn: "Krodo (Ancient Saxon Deity Depicted Standing Barefoot on a Giant Spiny Fish)",
    category: "myth",
    rank: "거대한 가시 물고기 등 위에 맨발로 서서 피비린내와 꽃향기를 동시에 풍겼다는 고대 작센족의 우상",
    domains: ["신화·전설(Mythe)", "고대 게르만 신화", "색슨족 우상", "물고기 탄 신령", "샤를마뉴 파괴 우상"],
    translationKo: "고대 게르만 색슨(작센)족이 하르츠 산맥 일대에서 숭배했던 기이한 옛 신령 우상이다. 머리가 하얗게 센 늙은 노인의 형상을 하고 있으며, 날카로운 가시 지느러미가 돋아난 거대한 물고기의 등판 위에 맨발로 서 있다. 한 손에는 꽃과 과일이 가득 담긴 바구니를 들고 다른 손에는 마법의 바퀴를 쥐고 있다. 전설에 따르면 그의 제단 주변에서는 달콤한 봄꽃의 향기와 함께 신선한 피비린내가 묘하게 뒤섞여 풍겼다고 하며, 샤를마뉴 대제가 색슨족을 정복하고 기독교로 개종시킬 때 이 우상을 파괴했다고 전해진다."
  },
  {
    id: "e2286-kuffacatherine",
    nameFr: "Kuffa (Catherine)",
    nameKo: "카트린 쿠파 [Catherine Kuffa]",
    nameKoShort: "카트린 쿠파",
    nameEn: "Catherine Kuffa (Lorraine Witch Under Henri III Who Confessed Flying on Black Horses)",
    category: "superstition",
    rank: "프랑스 앙리 3세 시대 로렌 지방에서 사바트에 참석해 검은 말을 타고 악마에게 경배했다고 자백한 마녀",
    domains: ["미신·풍습(Superstition)", "로렌 마녀재판", "니콜라 레미", "사바트 비행", "치욕의 입맞춤"],
    translationKo: "앙리 3세 치하 프랑스 동부 로렌(Lorraine) 공국에서 악명 높은 판사 니콜라 레미(Nicolas Rémy)에게 체포되어 심문을 받았던 마녀이다. 그녀는 젊은 시절 악마의 유혹에 빠져 사바트에 나갔으며, 어느 날 축제에 가던 중 길가에서 검은 옷을 입은 신사를 만나 말을 함께 타고 공중으로 날아올라 사바트 집회 장소로 이동했다고 자백했다. 그녀는 사바트에서 숫염소 악마에게 무릎을 꿇고 입을 맞추었으며, 이웃 사람들의 농작물을 망치는 마법 가루를 받았다고 진술하여 화형에 처해졌다."
  },
  {
    id: "e2287-kuhlmannquirinus",
    nameFr: "Kuhlmann (Quirinus)",
    nameKo: "퀴리누스 쿨만 [Quirinus Kuhlmann]",
    nameKoShort: "퀴리누스 쿨만",
    nameEn: "Quirinus Kuhlmann (17th-Century Silesian Mystic Visionary Burned at the Stake in Moscow)",
    category: "person",
    rank: "1651년 브레슬라우 출신의 종말론적 신비주의 예언자로 모스크바에서 차르를 설득하려다 화형된 비운의 환시가",
    domains: ["인물·역사(Personnage)", "종말론 신비주의", "야콥 뵈메 추종자", "모스크바 화형(1689)", "환시와 예언"],
    translationKo: "1651년 실레지아 브레슬라우에서 태어나 1689년 모스크바에서 화형당한 독일의 종말론적 신비주의 시인이자 환시가이다. 야콥 뵈메의 신비주의 철학에 깊이 매료되어 스스로 '신의 마지막 메신저'를 자처했다. 그는 전 세계의 모든 종교와 군주들이 하나의 신성한 천년왕국으로 통합될 것이라는 예언을 품고 동방으로 건너가, 러시아의 어린 차르 표트르 1세를 개종시키고 모스크바를 새 예루살렘으로 만들려 했다. 그러나 러시아 정교회 총대주교와 보야르(귀족)들에 의해 위험한 사탄의 이단자로 체포되어 모스크바 붉은 광장에서 공개 화형대의 불길 속에 생을 마감했다."
  },
  {
    id: "e2288-kupay",
    nameFr: "Kupay",
    nameKo: "쿠파이(페루 안데스의 지하 악마) [Kupay / Supay]",
    nameKoShort: "쿠파이",
    nameEn: "Supay (Incan Demonic God of Death and the Underworld Invoking Spitting)",
    category: "demon",
    rank: "페루 잉카 원주민들이 이름을 입에 올릴 때마다 부정과 액운을 막기 위해 땅에 침을 뱉었던 지하 악마",
    domains: ["악마학(Démonologie)", "잉카 신화", "수파이(Supay)", "우쿠 파차(지하세계)", "침 뱉기 벽사"],
    translationKo: "페루 잉카 제국과 안데스 원주민 신화에서 지하 명계인 우쿠 파차(Uku Pacha)를 다스리는 죽음과 암흑의 악마 수파이(Supay)의 프랑스어 음역이다. 원주민들은 쿠파이를 상상할 수 없을 만큼 끔찍하고 잔혹한 악령으로 여겼다. 일상생활에서 그의 불길한 이름을 입에 올릴 때마다, 그 즉시 입술을 깨물고 땅바닥에 침을 탁 뱉음으로써 악마의 저주와 질병의 독기가 자신에게 옮겨붙지 않도록 액막이를 해야만 했다."
  },
  {
    id: "e2289-kurdes",
    nameFr: "Kurdes",
    nameKo: "쿠르드족과 공작 천사 숭배 [Kurdes / Kurdish Yazidi Lore]",
    nameKoShort: "쿠르드족 미신",
    nameEn: "Kurds (Yazidi Veneration of the Peacock Angel Melek Taus Misunderstood as Devil Worship)",
    category: "superstition",
    rank: "중동 쿠르드족 일파인 야지디교도들이 공작 천사 멜렉 타우스를 모신 것이 외부인들에게 악마 숭배로 오인된 전승",
    domains: ["미신·풍습(Superstition)", "중동 민속", "쿠르드 야지디(Yazidi)", "공작 천사 멜렉 타우스", "악마 숭배 오인"],
    translationKo: "중동 메소포타미아와 자그로스 산맥에 거주하는 쿠르드족, 특히 고대 이란계 종교 전통을 간직한 야지디(Yazidi)족에 얽힌 유럽인들의 악마 숭배 오해에 관한 항목이다. 주변 무슬림과 기독교인들은 야지디인들이 '사탄을 숭배하는 민족'이라고 배척하였다. 그러나 실제 그들의 신앙은 하느님이 온 세상을 창조한 뒤 일곱 대천사 중 으뜸인 공작 천사 '멜렉 타우스(Melek Taus)'에게 세상을 다스리도록 위임했다는 독자적인 천사 숭배로, 외부인들이 이를 타락천사 루시퍼와 혼동하여 빚어낸 역사적 편견에 불과하다."
  },
  {
    id: "e2290-kurgon",
    nameFr: "Kurgon",
    nameKo: "퀴르공(가스코뉴의 늑대 사바트 마녀) [Kurgon / Werewolf Witches]",
    nameKoShort: "퀴르공",
    nameEn: "Kurgon (Gascon and Dauphine Term for Witches Adoring the Devil as a Wolf)",
    category: "superstition",
    rank: "프랑스 가스코뉴와 도피네 지방에서 늑대 형상을 한 악마를 숭배하러 밤마다 사바트로 모여들던 마녀",
    domains: ["미신·풍습(Superstition)", "프랑스 남부 민속", "사바트 늑대 숭배", "마녀 명칭", "가스코뉴 방언"],
    translationKo: "프랑스 남서부 가스코뉴와 도피네(Dauphiné) 지방에서 사바트에 나가는 마녀들을 일컫던 옛 방언 명칭이다. 이 지역의 마녀들은 밤마다 깊은 산골짜기에 모여, 숫염소 대신 거대하고 사나운 늑대 형상으로 현현한 악마 앞에 무릎을 꿇고 충성을 맹세하며 사람들을 해칠 수 있는 마법 가루와 늑대 변신 연고를 받아갔다고 전해진다."
  },
  {
    id: "e2291-kutuktus",
    nameFr: "Kutuktus",
    nameKo: "후툭투(칼카 몽골의 불멸의 활불) [Kutuktus / Jebtsundamba Khutuktu]",
    nameKoShort: "후툭투 활불",
    nameEn: "Khutuktu (Mongolian Living Buddha of Urga Believed to Be Immortal and Reincarnating)",
    category: "myth",
    rank: "칼카 몽골족이 영원히 죽지 않고 끊임없이 환생하며 신통력을 발휘한다고 믿었던 티베트 불교의 최고 지도자",
    domains: ["신화·전설(Mythe)", "몽골 티베트 불교", "젭춘담바 후툭투", "활불(Living Buddha)", "환생 전승"],
    translationKo: "몽골 북부 칼카(Khalkha) 몽골족이 살아있는 부처(활불, 活佛)로 숭배했던 티베트 불교의 최고 종정 젭춘담바 후툭투(Jebtsundamba Khutuktu)에 얽힌 민간 전승이다. 몽골 유목민들은 자신들의 최고 종교 지도자인 후툭투가 결코 죽지 않는 불멸의 존재라고 굳게 믿었다. 육신이 늙어 숨을 거두더라도 그것은 죽은 것이 아니라 낡은 옷을 벗듯 잠시 몸을 바꾼 것에 불과하며, 즉시 갓 태어난 신성한 아이의 몸으로 다시 환생하여 영원히 백성들을 다스린다고 믿으며 어린 활불의 발아래 엎드려 경배를 올렸다."
  }
];

fs.writeFileSync('scripts/curate-k-batch2.mjs', `export const K_BATCH2 = ${JSON.stringify(BATCH2_DATA, null, 2)};\n`, 'utf8');
console.log(`Generated scripts/curate-k-batch2.mjs with ${BATCH2_DATA.length} entries.`);
