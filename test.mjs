import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ENTRIES,ILLUSTRATED_ENTRIES,VALID_ENTRY_IDS,filterEntries,getDailyEntry} from './dist/entries.js';

assert.equal(ENTRIES.length,3810,'Expected all 3,810 A-Z entries from the 1863 6th edition');
assert.ok(ILLUSTRATED_ENTRIES.length>=400,`Expected at least 400 illustrated plate entries from 1863 edition, got ${ILLUSTRATED_ENTRIES.length}`);
assert.equal(VALID_ENTRY_IDS.size,3810,'All entry IDs must be unique');

for(const entry of ENTRIES){
  assert.ok(entry.id&&entry.nameKo&&entry.nameFr,`Missing name fields for ${entry.id}`);
  assert.ok(entry.nameKo.includes('[')&&entry.nameKo.includes(']'),`Proper noun bracket notation missing in nameKo: ${entry.nameKo}`);
  if(entry.hasPlate){
    assert.ok(fs.existsSync(new URL('./dist/'+entry.plate,import.meta.url)),`Missing plate file dist/${entry.plate}`);
  }
}

// Verify the user's 9 rules examples in entries
const aigle = ENTRIES.find(e => e.nameFr === 'Aigle');
assert.ok(aigle && aigle.nameKo === '독수리 [Aigle / Eagle]', 'Rule 1: 독수리 [Aigle / Eagle]');

const accouchements = ENTRIES.find(e => e.nameFr === 'Accouchements prodigieux');
assert.ok(accouchements && accouchements.nameKo === '불가사의한 출산 [Accouchements Prodigieux / Prodigious Births]', 'Rule 1: 불가사의한 출산 [Accouchements Prodigieux / Prodigious Births]');

const adamAbbe = ENTRIES.find(e => e.nameFr === 'Adam (l’abbé)');
assert.ok(adamAbbe && adamAbbe.nameKo === '수도원장 아담 [Adam (L’Abbé)]', 'Rule 2: 수도원장 아담 [Adam (L’Abbé)]');

const abadie = ENTRIES.find(e => e.nameFr === 'Abadie (Jeannette d’)');
assert.ok(abadie && abadie.nameKo === '자네뜨 다바디 [Abadie (Jeannette d’)]', 'Rule 2: 자네뜨 다바디 [Abadie (Jeannette d’)]');

const abraxas = ENTRIES.find(e => e.id === 'abraxas');
assert.ok(abraxas && abraxas.nameKo === '아브라카스 또는 아브락사스 [Abracax, Abraxas]', 'Rule 3: 아브라카스 또는 아브락사스 [Abracax, Abraxas]');

// Verify the 4 Jean entries disambiguation on page 373
const jeanMagician = ENTRIES.find(e => e.id === 'e2167-jean');
assert.ok(jeanMagician && jeanMagician.nameKo === '마법사 장 [Jean (Magicien) / John the Magician]', 'Jean 1: 마법사 장');
assert.ok(jeanMagician.description.includes('아폴로니우스'), 'Jean 1 description contains Apollonius');

const jeanPatriarch = ENTRIES.find(e => e.id === 'e2168-jean');
assert.ok(jeanPatriarch && jeanPatriarch.nameKo === '총대주교 장 [Jean (Patriarche de Constantinople)]', 'Jean 2: 총대주교 장');
assert.ok(jeanPatriarch.description.includes('콘스탄티노폴리스'), 'Jean 2 description contains Constantinople');

const jeanXXII = ENTRIES.find(e => e.id === 'e2169-jeanxxii');
assert.ok(jeanXXII && jeanXXII.nameKo === '요한 22세 [Jean XXII / Pope John XXII]', 'Jean XXII: 요한 22세');
assert.ok(jeanXXII.description.includes('교황'), 'Jean XXII description contains pope');

const jeanIvan = ENTRIES.find(e => e.id === 'e2170-jean');
assert.ok(jeanIvan && jeanIvan.nameKo === '이반 뇌제 또는 장 [Jean, Iwan Basilowitz / Ivan the Terrible]', 'Jean 3: 이반 뇌제 또는 장');
assert.ok(jeanIvan.description.includes('이반 바실리예비치'), 'Jean 3 description contains Ivan Vasilyevich');

// Verify descriptions are unique
const jeanDescs = new Set([jeanMagician.description, jeanPatriarch.description, jeanXXII.description, jeanIvan.description]);
assert.equal(jeanDescs.size, 4, 'All four Jean entries must have distinct descriptions');

// Verify Phénix demon vs sacred bird disambiguation
const phenixDemon = ENTRIES.find(e => e.id === 'e3011-phenix');
const phenixBird = ENTRIES.find(e => e.id === 'e3012-phenix');
assert.ok(phenixDemon && phenixDemon.nameKo === '페닉스 [Phénix / Phenex]' && phenixDemon.category === 'demon', 'Phenix demon');
assert.ok(phenixBird && phenixBird.nameKo === '불사조 [Phénix / Phoenix]' && phenixBird.category === 'superstition', 'Phenix bird');

// Verify Retz Gilles de Rais vs Cardinal de Retz disambiguation
const retzGilles = ENTRIES.find(e => e.id === 'e3211-retz');
const retzCardinal = ENTRIES.find(e => e.id === 'e3212-retz');
assert.ok(retzGilles && retzGilles.nameKo.includes('질 드 레'), 'Gilles de Rais');
assert.ok(retzCardinal && retzCardinal.nameKo.includes('레츠 추기경'), 'Cardinal de Retz');

const monarchs=filterEntries({category:'monarch',onlyIllustrated:true});
assert.ok(monarchs.some(e=>e.id==='belzebuth'));
assert.ok(monarchs.some(e=>e.id==='astaroth'));

const letterZ=filterEntries({letter:'Z'});
assert.equal(letterZ.length,15,'Expected 15 letter Z entries');
assert.ok(letterZ.some(e=>e.id==='zaebos'));

// Verify Z audit corrections
const zabulon = ENTRIES.find(e => e.id === 'e3796-zabulon');
assert.ok(zabulon && zabulon.description.includes('평수녀') && !zabulon.description.includes('자매를 소유한'), 'Zabulon lay sister possession');

const zacharie = ENTRIES.find(e => e.id === 'e3797-zacharie');
assert.ok(zacharie && zacharie.category === 'crossref' && !zacharie.description.includes('귀국자'), 'Zacharie crossref not revenant repatriate');

const zagam = ENTRIES.find(e => e.id === 'e3800-zagam');
assert.ok(zagam && zagam.category === 'demon' && zagam.rank.includes('왕'), 'Zagam demon king');

const zahuris = ENTRIES.find(e => e.id === 'e3801-zahuris');
assert.ok(zahuris && !zahuris.description.includes('눈을 갉아먹') && zahuris.description.includes('수맥'), 'Zahuris clairvoyant not eating eyes');

const zairagie = ENTRIES.find(e => e.id === 'e3802-zairagiezairagiah');
assert.ok(zairagie && zairagie.category === 'divination', 'Zairagie divination category');

const zedechias = ENTRIES.find(e => e.id === 'e3806-zedechias');
assert.ok(zedechias && zedechias.description.includes('실프') && !zedechias.description.includes('기본 존재'), 'Zedechias elementals not basic beings');

const zepar = ENTRIES.find(e => e.id === 'e3808-zepar');
assert.ok(zepar && zepar.category === 'demon' && zepar.rank.includes('대공'), 'Zepar demon duke');

// Y section audit assertions (13 entries)
const yEntries = ENTRIES.filter(e => e.letter === 'Y');
assert.equal(yEntries.length, 13, 'Y section must contain exactly 13 entries in 1863 edition');

const xylomancie = ENTRIES.find(e => e.nameFr === 'Xylomancie');
assert.ok(xylomancie && xylomancie.letter === 'X' && xylomancie.category === 'divination', 'Xylomancie must be in X letter');
assert.ok(xylomancie.description.includes('목점') && xylomancie.description.includes('슬라보니아'), 'Xylomancie wood divination translation');

const yagababa = ENTRIES.find(e => e.id === 'e3783-yagababa');
assert.ok(yagababa && yagababa.category === 'myth' && yagababa.nameKo.includes('바바 야가'), 'Yaga-Baba myth Baba Yaga');

const yakouts = ENTRIES.find(e => e.id === 'e3784-yakouts');
assert.ok(yakouts && yakouts.category === 'crossref' && yakouts.summary.includes('Mangtaar'), 'Yakouts crossref Mangtaar');

const yangant = ENTRIES.find(e => e.id === 'yan-gant-y-tan');
assert.ok(yangant && yangant.hasPlate && yangant.plate === 'plates/yan-gant-y-tan.jpg' && yangant.category === 'demon', 'Yan-gant-y-tan illustrated plate demon');

const yasdh = ENTRIES.find(e => e.id === 'e3786-yasdh');
assert.ok(yasdh && yasdh.category === 'crossref' && !yasdh.description.includes('raw=1') && yasdh.description.includes('Yesdhoon'), 'Yasdh crossref not raw=1 bug');

const ychain = ENTRIES.find(e => e.id === 'e3787-ychainbonawgs');
assert.ok(ychain && ychain.category === 'myth' && ychain.description.includes('괴물 황소'), 'Ychain-bonawgs myth monster oxen');

const yenvang = ENTRIES.find(e => e.id === 'e3788-yenvang');
assert.ok(yenvang && yenvang.category === 'demon' && yenvang.nameKo.includes('염라대왕'), 'Yen-vang demon king Yanwang');

const yesdhoon = ENTRIES.find(e => e.id === 'e3789-yesdhoon');
assert.ok(yesdhoon && yesdhoon.category === 'myth' && yesdhoon.description.includes('조로아스터'), 'Yesdhoon myth Zoroastrianism');

const yermoloff = ENTRIES.find(e => e.id === 'e3790-yermoloff');
assert.ok(yermoloff && yermoloff.category === 'person' && yermoloff.description.includes('모스크바'), 'Yermoloff person haunted house Moscow');

const yeux = ENTRIES.find(e => e.id === 'e3791-yeux');
assert.ok(yeux && yeux.category === 'superstition' && yeux.description.includes('마안') && yeux.description.includes('사슴뿔'), 'Yeux evil eye superstition');

const yffrotte = ENTRIES.find(e => e.id === 'e3792-yffrotte');
assert.ok(yffrotte && yffrotte.category === 'person' && yffrotte.description.includes('토르케마다'), 'Yffrotte person Torquemada');

const yormoungandour = ENTRIES.find(e => e.id === 'e3793-yormoungandour');
assert.ok(yormoungandour && yormoungandour.category === 'myth' && yormoungandour.nameKo.includes('요르문간드'), 'Yormoungandour myth Jormungandr');

const youf = ENTRIES.find(e => e.id === 'e3794-youfmarieanne');
assert.ok(youf && youf.category === 'person' && youf.description.includes('생로') && youf.description.includes('사기'), 'Youf person Saint-Lo trial');

const youma = ENTRIES.find(e => e.id === 'e3795-youma');
assert.ok(youma && youma.category === 'myth' && youma.description.includes('체레미스') && youma.description.includes('케레메트'), 'Youma myth Cheremisses Keremet');

// X section audit assertions (8 entries)
const xEntries = ENTRIES.filter(e => e.letter === 'X');
assert.equal(xEntries.length, 8, 'X section must contain exactly 8 entries');

const xacca = ENTRIES.find(e => e.id === 'e3775-xacca');
assert.ok(xacca && xacca.category === 'person' && xacca.nameKo.includes('석가모니') && xacca.description.includes('나무묘법연화경'), 'Xacca Shakyamuni translation');

const xaphan = ENTRIES.find(e => e.id === 'xaphan');
assert.ok(xaphan && xaphan.category === 'demon' && xaphan.hasPlate && xaphan.plate === 'plates/xaphan.jpg', 'Xaphan illustrated demon');

const xeir1 = ENTRIES.find(e => e.id === 'e3777-xeirscopie');
assert.ok(xeir1 && !xeir1.nameKo.includes('독자들') && xeir1.nameKo.includes('1부') && xeir1.category === 'divination', 'Xeirscopie part 1 no reader mistranslation');

const xeir2 = ENTRIES.find(e => e.id === 'e3778-xeirscopie');
assert.ok(xeir2 && xeir2.hasPlate && xeir2.plate === 'plates/e3778-xeirscopie.jpg' && xeir2.nameKo.includes('2부'), 'Xeirscopie part 2 illustrated plate');

const xerxes = ENTRIES.find(e => e.id === 'e3779-xerxes');
assert.ok(xerxes && xerxes.category === 'superstition' && xerxes.description.includes('아르타바누스'), 'Xerxes historical dream');

const xezbeth = ENTRIES.find(e => e.id === 'e3780-xezbeth');
assert.ok(xezbeth && xezbeth.category === 'demon' && xezbeth.description.includes('거짓말'), 'Xezbeth demon of lies');

const xitragupten = ENTRIES.find(e => e.id === 'e3781-xitragupten');
assert.ok(xitragupten && xitragupten.category === 'myth' && xitragupten.nameKo.includes('치트라굽타') && xitragupten.description.includes('야마'), 'Xitragupten Chitragupta myth');

// W section audit assertions (24 entries)
const wEntries = ENTRIES.filter(e => e.letter === 'W');
assert.equal(wEntries.length, 24, 'W section must contain exactly 24 entries');

const waeter = ENTRIES.find(e => e.id === 'e3751-waeterelvesfeesdeseaux');
assert.ok(waeter && waeter.category === 'myth' && waeter.nameKo.includes('워터 엘프'), 'Waeter-Elves myth water fairies');

const wakeman1 = ENTRIES.find(e => e.id === 'e3752-wakemanrhoda');
assert.ok(wakeman1 && wakeman1.category === 'person' && wakeman1.nameKo.includes('1부'), 'Wakeman part 1');

const wakeman2 = ENTRIES.find(e => e.id === 'e3753-wakeman');
assert.ok(wakeman2 && wakeman2.category === 'person' && wakeman2.nameKo.includes('2부'), 'Wakeman part 2');

const walhalla = ENTRIES.find(e => e.id === 'e3754-walhalla');
assert.ok(walhalla && walhalla.category === 'myth' && walhalla.nameKo.includes('발할라'), 'Walhalla Norse myth');

const walkiries = ENTRIES.find(e => e.id === 'e3755-walkiries');
assert.ok(walkiries && walkiries.category === 'myth' && walkiries.nameKo.includes('발키리'), 'Walkiries Norse myth');

const wall = ENTRIES.find(e => e.id === 'wall');
assert.ok(wall && wall.category === 'demon' && wall.hasPlate && wall.plate === 'plates/wall.jpg', 'Wall illustrated demon duke');

const walterscott1 = ENTRIES.find(e => e.id === 'e3758-walterscott');
assert.ok(walterscott1 && walterscott1.nameKo.includes('1부'), 'Walter-Scott part 1');

const walterscott2 = ENTRIES.find(e => e.id === 'e3759-danslapremierelettre');
assert.ok(walterscott2 && !walterscott2.nameKo.includes('라 프레미에르') && walterscott2.nameKo.includes('2부'), 'Walter-Scott part 2 no bad French snippet headword');

const wechselbalg = ENTRIES.find(e => e.id === 'e3761-wechselbalg');
assert.ok(wechselbalg && wechselbalg.category === 'myth' && wechselbalg.nameKo.includes('체인질링'), 'Wechselbalg changeling myth');

const wiclef = ENTRIES.find(e => e.id === 'e3765-wiclef');
assert.ok(wiclef && wiclef.category === 'person' && wiclef.nameKo.includes('위클리프'), 'Wiclef reformer person not demon');

const wierus = ENTRIES.find(e => e.id === 'e3766-wierus');
assert.ok(wierus && wierus.category === 'person' && wierus.nameKo.includes('요한 바이어') && wierus.description.includes('의사악마왕국'), 'Wierus Johann Weyer');

const wilis = ENTRIES.find(e => e.id === 'e3767-wilis');
assert.ok(wilis && wilis.category === 'myth' && wilis.hasPlate && wilis.plate === 'plates/e3767-wilis.jpg' && wilis.nameKo.includes('윌리'), 'Wilis illustrated Slavic maidens');

const wivre = ENTRIES.find(e => e.id === 'e3769-wivre');
assert.ok(wivre && wivre.category === 'myth' && wivre.nameKo.includes('부아브르'), 'Wivre French dragon');

const woden = ENTRIES.find(e => e.id === 'e3770-woden');
assert.ok(woden && woden.category === 'myth' && woden.nameKo.includes('오딘'), 'Woden Odin myth');

// V section audit assertions (76 entries)
const vEntries = ENTRIES.filter(e => e.letter === 'V');
assert.equal(vEntries.length, 76, 'V section must contain exactly 76 entries');

const vaccine = ENTRIES.find(e => e.id === 'e3675-vaccine');
assert.ok(vaccine && vaccine.category === 'superstition' && vaccine.nameKo.includes('우두 접종'), 'Vaccine medical superstition');

const vache = ENTRIES.find(e => e.id === 'e3676-vache');
assert.ok(vache && vache.hasPlate && vache.plate === 'plates/e3676-vache.jpg' && vache.nameKo.includes('암소'), 'Vache sacred cow illustrated');

const vaicarani = ENTRIES.find(e => e.id === 'e3680-vaicarani');
assert.ok(vaicarani && vaicarani.category === 'myth' && vaicarani.nameKo.includes('바이타라니 강'), 'Vaicarani Hindu underworld river');

const valafar = ENTRIES.find(e => e.id === 'e3682-valafar');
assert.ok(valafar && valafar.category === 'demon' && valafar.legions === 36 && valafar.nameKo.includes('발라파르'), 'Valafar demon duke');

const vampires = ENTRIES.find(e => e.id === 'e3688-vampires');
assert.ok(vampires && vampires.hasPlate && vampires.plate === 'plates/e3688-vampires.jpg' && vampires.nameKo.includes('흡혈귀'), 'Vampires illustrated treatise');

const vapula = ENTRIES.find(e => e.id === 'e3692-vapula');
assert.ok(vapula && vapula.category === 'demon' && vapula.legions === 36 && vapula.nameKo.includes('바풀라'), 'Vapula demon duke');

const vaulx = ENTRIES.find(e => e.id === 'e3695-vaulxjeande');
assert.ok(vaulx && vaulx.category === 'person' && vaulx.hasPlate && vaulx.plate === 'plates/e3695-vaulx-jean-de.jpg' && vaulx.nameKo.includes('장 드 볼크스'), 'Vaulx illustrated sorcerer');

const veaudor = ENTRIES.find(e => e.id === 'e3697-veaudor');
assert.ok(veaudor && veaudor.category === 'myth' && veaudor.hasPlate && veaudor.plate === 'plates/e3697-veau-d-or.jpg' && veaudor.nameKo.includes('황금 송아지'), 'Veau dor illustrated golden calf');

const veneur = ENTRIES.find(e => e.id === 'e3702-veneur');
assert.ok(veneur && veneur.category === 'myth' && veneur.hasPlate && veneur.plate === 'plates/e3702-veneur.jpg' && veneur.nameKo.includes('르 그랑 베뇌르'), 'Veneur illustrated Great Hunter');

const vepar = ENTRIES.find(e => e.id === 'e3705-vepar');
assert.ok(vepar && vepar.category === 'demon' && vepar.legions === 29 && vepar.nameKo.includes('베파르'), 'Vepar demon duke');

const vieille = ENTRIES.find(e => e.id === 'e3725-vieille');
assert.ok(vieille && vieille.category === 'superstition' && vieille.hasPlate && vieille.plate === 'plates/e3725-vieille.jpg' && vieille.nameKo.includes('노파 유령'), 'Vieille illustrated old woman spectre');

const villain = ENTRIES.find(e => e.id === 'e3726-villainlabbe');
assert.ok(villain && !villain.nameKo.includes('수도원장 악당') && villain.nameKo.includes('에티엔 빌랭 수도원장'), 'Villain no mistranslation as abbot villain');

const vine = ENTRIES.find(e => e.id === 'e3729-vine');
assert.ok(vine && !vine.nameKo.includes('포도나무') && vine.category === 'demon' && vine.nameKo.includes('비네'), 'Vine demon king not grape vine');

const virgile1 = ENTRIES.find(e => e.id === 'e3731-virgile');
assert.ok(virgile1 && virgile1.nameKo.includes('1부') && virgile1.category === 'person', 'Virgile part 1 magician');

const virgile2 = ENTRIES.find(e => e.id === 'e3732-virgile');
assert.ok(virgile2 && virgile2.nameKo.includes('2부') && virgile2.category === 'person', 'Virgile part 2 bishop');

const volac = ENTRIES.find(e => e.id === 'volac');
assert.ok(volac && volac.category === 'demon' && volac.hasPlate && volac.plate === 'plates/volac.jpg' && volac.nameKo.includes('볼라크'), 'Volac illustrated president demon');

const voltigeur1 = ENTRIES.find(e => e.id === 'e3744-voltigeurhollandais');
assert.ok(voltigeur1 && !voltigeur1.nameKo.includes('볼티게르') && voltigeur1.nameKo.includes('1부') && voltigeur1.nameKo.includes('방황하는 네덜란드인'), 'Voltigeur part 1 Flying Dutchman');

const voltigeur2 = ENTRIES.find(e => e.id === 'e3745-voltigeurhollandais');
assert.ok(voltigeur2 && voltigeur2.hasPlate && voltigeur2.plate === 'plates/e3745-voltigeur-hollandais.jpg' && voltigeur2.nameKo.includes('2부') && voltigeur2.nameKo.includes('방황하는 네덜란드인'), 'Voltigeur part 2 illustrated Flying Dutchman');

const voyagesSorcerers = ENTRIES.find(e => e.id === 'voyages-sorcerers');
assert.ok(voyagesSorcerers && voyagesSorcerers.category === 'myth' && voyagesSorcerers.hasPlate && voyagesSorcerers.plate === 'plates/voyages-sorcerers.jpg' && voyagesSorcerers.nameKo.includes('빗자루를 탄 마녀의 여행'), 'Voyages des sorcieres illustrated witches flight');

// U section audit assertions (10 entries)
const uEntries = ENTRIES.filter(e => e.letter === 'U');
assert.equal(uEntries.length, 10, 'U section must contain exactly 10 entries');

const ukobach = ENTRIES.find(e => e.id === 'ukobach');
assert.ok(ukobach && ukobach.hasPlate && ukobach.plate === 'plates/ukobach.jpg' && ukobach.category === 'demon' && ukobach.nameKo.includes('우코바크'), 'Ukobach illustrated demon');

const universites = ENTRIES.find(e => e.id === 'e3666-universitesoccultes');
assert.ok(universites && universites.hasPlate && universites.plate === 'plates/e3666-universit-s-occultes.jpg' && universites.category === 'superstition' && universites.description.includes('루지에리'), 'Universites occultes illustrated');

const uphir = ENTRIES.find(e => e.id === 'e3667-uphir');
assert.ok(uphir && uphir.category === 'demon' && uphir.nameKo.includes('우피르') && uphir.description.includes('약초학'), 'Uphir demon physician');

const urgande = ENTRIES.find(e => e.id === 'e3670-urgande');
assert.ok(urgande && urgande.category === 'myth' && urgande.nameKo.includes('우르간드') && urgande.description.includes('아마디스'), 'Urgande chivalric fairy');

const urine = ENTRIES.find(e => e.id === 'e3671-urine');
assert.ok(urine && urine.category === 'superstition' && urine.nameKo.includes('소변') && urine.description.includes('델리오'), 'Urine superstition and rain magic');

const urotopegnie = ENTRIES.find(e => e.id === 'e3672-urotopegnie');
assert.ok(urotopegnie && urotopegnie.category === 'grimoire' && urotopegnie.nameKo.includes('우로토페그니'), 'Urotopegnie grimoire');

const uterpen = ENTRIES.find(e => e.id === 'e3673-uterpen');
assert.ok(uterpen && uterpen.category === 'crossref' && uterpen.nameKo.includes('유서 펜드래건'), 'Uterpen King Uther crossref');

const uteseture = ENTRIES.find(e => e.id === 'e3674-uteseture');
assert.ok(uteseture && uteseture.category === 'divination' && uteseture.nameKo.includes('우티세타') && uteseture.description.includes('오딘'), 'Uteseture Norse divination');

// T section audit assertions (161 entries)
const tEntries = ENTRIES.filter(e => e.letter === 'T');
assert.equal(tEntries.length, 161, 'T section must contain exactly 161 entries');

// 68 Plates demons & illustrations
const tap = ENTRIES.find(e => e.id === 'tap');
assert.ok(tap && tap.letter === 'T' && tap.hasPlate && tap.plate === 'plates/tap.jpg' && tap.plateNo === 60 && tap.nameKo.includes('타프 또는 가프'), 'Tap illustrated demon');

const torngarsuk = ENTRIES.find(e => e.id === 'torngarsuk');
assert.ok(torngarsuk && torngarsuk.letter === 'T' && torngarsuk.hasPlate && torngarsuk.plate === 'plates/torngarsuk.jpg' && torngarsuk.plateNo === 61 && torngarsuk.nameKo.includes('토른가르수크'), 'Torngarsuk illustrated Inuit spirit');

const transportSorcerers = ENTRIES.find(e => e.id === 'transport-sorcerers');
assert.ok(transportSorcerers && transportSorcerers.letter === 'T' && transportSorcerers.hasPlate && transportSorcerers.plate === 'plates/transport-sorcerers.jpg' && transportSorcerers.plateNo === 62, 'Transport des sorcieres illustrated');

// Disambiguated Templiers Part 1 & Part 2
const templiers1 = ENTRIES.find(e => e.id === 'e3545-templiers');
assert.ok(templiers1 && templiers1.letter === 'T' && templiers1.nameKo.includes('1부') && templiers1.description.length > 500, 'Templiers Part 1');

const templiers2 = ENTRIES.find(e => e.id === 'e3547-templiers');
assert.ok(templiers2 && templiers2.letter === 'T' && templiers2.hasPlate && templiers2.plate === 'plates/e3547-templiers.jpg' && templiers2.nameKo.includes('2부') && templiers2.description.length > 200, 'Templiers Part 2 illustrated');

// Illustrated entries in T (14 total)
const tIllustrated = tEntries.filter(e => e.hasPlate);
assert.equal(tIllustrated.length, 14, 'T section must contain exactly 14 illustrated entries');

// Other notable T entries
const tablesTournantes = ENTRIES.find(e => e.id === 'e3506-tablestournantes');
assert.ok(tablesTournantes && tablesTournantes.hasPlate && tablesTournantes.plate === 'plates/e3506-tables-tournantes.jpg' && tablesTournantes.nameKo.includes('탁자 회전 강신술'), 'Tables tournantes');

const theodoric = ENTRIES.find(e => e.id === 'e3580-theodoric');
assert.ok(theodoric && theodoric.hasPlate && theodoric.plate === 'plates/e3580-th-odoric.jpg' && theodoric.nameKo.includes('테오도릭'), 'Theodoric illustrated');

const thespesius = ENTRIES.find(e => e.id === 'e3586-thespesius');
assert.ok(thespesius && thespesius.hasPlate && thespesius.plate === 'plates/e3586-thesp-sius.jpg' && thespesius.nameKo.includes('테스페시우스'), 'Thespesius illustrated');

const tourMontpellier = ENTRIES.find(e => e.id === 'e3622-tourdemontpellier');
assert.ok(tourMontpellier && tourMontpellier.hasPlate && tourMontpellier.plate === 'plates/e3622-tour-de-montpellier.jpg', 'Tour de Montpellier illustrated');

const traditionsPop = ENTRIES.find(e => e.id === 'e3626-traditionspopulaires');
assert.ok(traditionsPop && traditionsPop.hasPlate && traditionsPop.plate === 'plates/e3626-traditions-populaires.jpg', 'Traditions populaires illustrated');

const trazegnies = ENTRIES.find(e => e.id === 'e3632-trazegnies');
assert.ok(trazegnies && trazegnies.hasPlate && trazegnies.plate === 'plates/e3632-traz-gnies.jpg' && trazegnies.nameKo.includes('트라제니'), 'Trazegnies illustrated');

const tribunalSecret = ENTRIES.find(e => e.id === 'e3639-tribunalsecret');
assert.ok(tribunalSecret && tribunalSecret.hasPlate && tribunalSecret.plate === 'plates/e3639-tribunal-secret.jpg' && tribunalSecret.nameKo.includes('페메 비밀 재판소'), 'Tribunal secret illustrated');

const troian = ENTRIES.find(e => e.id === 'e3642-troian');
assert.ok(troian && troian.hasPlate && troian.plate === 'plates/e3642-troian.jpg' && troian.nameKo.includes('트로얀'), 'Troian illustrated');

const troupeaux = ENTRIES.find(e => e.id === 'e3652-troupeaux');
assert.ok(troupeaux && troupeaux.hasPlate && troupeaux.plate === 'plates/e3652-troupeaux.jpg' && troupeaux.nameKo.includes('가축 보호 주술'), 'Troupeaux illustrated');

const thamuz = ENTRIES.find(e => e.id === 'e3573-thamuz');
assert.ok(thamuz && thamuz.category === 'demon' && thamuz.nameKo.includes('타무즈') && thamuz.description.includes('화포'), 'Thamuz demon of artillery');

const turlupins = ENTRIES.find(e => e.id === 'e3657-turlupins');
assert.ok(turlupins && turlupins.category === 'person' && turlupins.nameKo.includes('튀를뤼팽파'), 'Turlupins sect');

const tvardowski = ENTRIES.find(e => e.id === 'e3659-tvardowski');
assert.ok(tvardowski && tvardowski.category === 'myth' && tvardowski.nameKo.includes('판 트바르도프스키') && tvardowski.description.includes('파우스트'), 'Tvardowski Polish Faust');

const tyre = ENTRIES.find(e => e.id === 'e3664-tyre');
assert.ok(tyre && tyre.nameKo.includes('튀레') && tyre.description.includes('셰페루스'), 'Tyre Sami magical ball');

// S section audit assertions (235 entries, 30 illustrated)
const sEntries = ENTRIES.filter(e => e.letter === 'S');
assert.equal(sEntries.length, 235, 'S section must contain exactly 235 entries');

// 68 Plates demons & illustrations in S
const scox = ENTRIES.find(e => e.id === 'scox');
assert.ok(scox && scox.letter === 'S' && scox.hasPlate && scox.plate === 'plates/scox.jpg' && scox.plateNo === 58 && scox.nameKo.includes('스콕스'), 'Scox illustrated demon duke');

const stolas = ENTRIES.find(e => e.id === 'stolas');
assert.ok(stolas && stolas.letter === 'S' && stolas.hasPlate && stolas.plate === 'plates/stolas.jpg' && stolas.plateNo === 59 && stolas.nameKo.includes('스톨라스'), 'Stolas illustrated grand prince');

const sIllustrated = sEntries.filter(e => e.hasPlate);
assert.equal(sIllustrated.length, 30, 'S section must contain exactly 30 illustrated entries');

// Key S illustrated entries
const sabbat = ENTRIES.find(e => e.id === 'e3273-sabbat');
assert.ok(sabbat && sabbat.hasPlate && sabbat.nameKo.includes('사바트'), 'Sabbat illustrated');

const satyres = ENTRIES.find(e => e.id === 'e3328-satyres');
assert.ok(satyres && satyres.hasPlate && satyres.nameKo.includes('사티로스'), 'Satyres illustrated');

const serpentDeMer = ENTRIES.find(e => e.id === 'e3381-serpentdemerlegrand');
assert.ok(serpentDeMer && serpentDeMer.hasPlate && serpentDeMer.nameKo.includes('거대 바다뱀'), 'Serpent de mer illustrated');

const spee = ENTRIES.find(e => e.id === 'e3443-spee');
assert.ok(spee && spee.hasPlate && spee.nameKo.includes('프리드리히 슈페 신부') && spee.category === 'person', 'Spee illustrated Jesuit priest');

const stanoska = ENTRIES.find(e => e.id === 'e3460-stanoska');
assert.ok(stanoska && stanoska.hasPlate && stanoska.nameKo.includes('스타노스카') && stanoska.category === 'demon', 'Stanoska illustrated vampire');

const swedenborg = ENTRIES.find(e => e.id === 'e3493-swedenborgemmanuel');
assert.ok(swedenborg && swedenborg.hasPlate && swedenborg.nameKo.includes('스베덴보리') && swedenborg.category === 'person', 'Swedenborg illustrated');

const syrenes = ENTRIES.find(e => e.id === 'e3501-syrenes');
assert.ok(syrenes && syrenes.hasPlate && syrenes.nameKo.includes('세이렌') && syrenes.category === 'myth', 'Syrenes illustrated');

// Disambiguated Strauss Part 1 & Part 2
const strauss1 = ENTRIES.find(e => e.id === 'e3474-strauss');
assert.ok(strauss1 && strauss1.nameKo.includes('1부') && strauss1.category === 'person', 'Strauss Part 1');

const strauss2 = ENTRIES.find(e => e.id === 'e3476-strauss');
assert.ok(strauss2 && strauss2.hasPlate && strauss2.plate === 'plates/e3476-strauss.jpg' && strauss2.nameKo.includes('2부'), 'Strauss Part 2 illustrated portrait');

// Other notable S demons & entries
const satan = ENTRIES.find(e => e.id === 'e3324-satan');
assert.ok(satan && satan.category === 'demon' && satan.nameKo.includes('사탄') && satan.rank.includes('대원수'), 'Satan demon prince');

const samael = ENTRIES.find(e => e.id === 'e3307-samael');
assert.ok(samael && samael.category === 'demon' && samael.nameKo.includes('사마엘') && samael.rank.includes('죽음의 천사'), 'Samael demon');

const sytry = ENTRIES.find(e => e.id === 'e3503-sytry');
assert.ok(sytry && sytry.category === 'demon' && sytry.legions === 60 && sytry.nameKo.includes('시트리'), 'Sytry demon prince');

const sabnac = ENTRIES.find(e => e.id === 'e3280-sabnac');
assert.ok(sabnac && sabnac.category === 'demon' && sabnac.legions === 50 && sabnac.nameKo.includes('사브낙'), 'Sabnac demon marquis');

// R section audit assertions (97 entries, 12 illustrated)
const rEntries = ENTRIES.filter(e => e.letter === 'R');
assert.equal(rEntries.length, 97, 'R section must contain exactly 97 entries');

const rIllustrated = rEntries.filter(e => e.hasPlate);
assert.equal(rIllustrated.length, 12, 'R section must contain exactly 12 illustrated entries');

// 68 Plates demons in R
const rahouart = ENTRIES.find(e => e.id === 'rahouart');
assert.ok(rahouart && rahouart.letter === 'R' && rahouart.hasPlate && rahouart.plate === 'plates/rahouart.jpg' && rahouart.plateNo === 55 && rahouart.nameKo.includes('라우아르'), 'Rahouart illustrated demon');

const ribesal = ENTRIES.find(e => e.id === 'ribesal');
assert.ok(ribesal && ribesal.letter === 'R' && ribesal.hasPlate && ribesal.plate === 'plates/ribesal.jpg' && ribesal.plateNo === 56 && ribesal.nameKo.includes('뤼베찰'), 'Ribesal illustrated mountain spirit');

const ronwe = ENTRIES.find(e => e.id === 'ronwe');
assert.ok(ronwe && ronwe.letter === 'R' && ronwe.hasPlate && ronwe.plate === 'plates/ronwe.jpg' && ronwe.plateNo === 57 && ronwe.legions === 19 && ronwe.nameKo.includes('로노베'), 'Ronwe illustrated demon marquis');

// Key R illustrated entries
const rat = ENTRIES.find(e => e.id === 'e3190-rat');
assert.ok(rat && rat.hasPlate && rat.nameKo.includes('쥐'), 'Rat illustrated');

const remords = ENTRIES.find(e => e.id === 'e3203-remords');
assert.ok(remords && remords.hasPlate && remords.nameKo.includes('양심의 가책'), 'Remords illustrated');

const renards = ENTRIES.find(e => e.id === 'e3206-renards');
assert.ok(renards && renards.hasPlate && renards.nameKo.includes('여우'), 'Renards illustrated');

const revenants = ENTRIES.find(e => e.id === 'e3216-revenants');
assert.ok(revenants && revenants.hasPlate && revenants.nameKo.includes('되살아난 망령'), 'Revenants illustrated');

const rhapsodomancie = ENTRIES.find(e => e.id === 'e3217-rhapsodomancie');
assert.ok(rhapsodomancie && rhapsodomancie.hasPlate && rhapsodomancie.category === 'divination' && rhapsodomancie.nameKo.includes('시편점'), 'Rhapsodomancie illustrated');

const rhone = ENTRIES.find(e => e.id === 'e3219-rhone');
assert.ok(rhone && rhone.hasPlate && rhone.nameKo.includes('론 강'), 'Rhône illustrated');

const rhotomago = ENTRIES.find(e => e.id === 'e3220-rhotomago');
assert.ok(rhotomago && rhotomago.hasPlate && rhotomago.category === 'demon' && rhotomago.nameKo.includes('로토마고'), 'Rhotomago illustrated');

const robertLeDiable = ENTRIES.find(e => e.id === 'e3232-robertlediable');
assert.ok(robertLeDiable && robertLeDiable.hasPlate && robertLeDiable.nameKo.includes('악마 로베르'), 'Robert le Diable illustrated');

const roderik = ENTRIES.find(e => e.id === 'e3239-roderik');
assert.ok(roderik && roderik.hasPlate && roderik.nameKo.includes('로드리고'), 'Roderik illustrated');

// Critical mistranslation fixes in R
const repare = ENTRIES.find(e => e.id === 'e3207-repare');
assert.ok(repare && repare.nameKo.includes('레파라투스') && !repare.nameKo.includes('수리됨'), 'Réparé not translated as 수리됨');

const elspetRule = ENTRIES.find(e => e.id === 'e3264-ruleelspet');
assert.ok(elspetRule && elspetRule.nameKo.includes('엘스펫 룰') && !elspetRule.nameKo.includes('규칙'), 'Rule (Elspet) not translated as 규칙');

const rush = ENTRIES.find(e => e.id === 'e3266-rush');
assert.ok(rush && rush.letter === 'R' && rush.category === 'demon' && rush.nameKo.includes('프라이어 러시'), 'Rush friar goblin');

const ryence = ENTRIES.find(e => e.id === 'e3267-ryence');
assert.ok(ryence && ryence.letter === 'R' && ryence.nameKo.includes('리엔스 왕'), 'Ryence king of Wales');

const rymer = ENTRIES.find(e => e.id === 'e3268-rymer');
assert.ok(rymer && rymer.letter === 'R' && rymer.nameKo.includes('흐륌'), 'Rymer Hrym of Naglfar');

const raum = ENTRIES.find(e => e.id === 'e3191-raum');
assert.ok(raum && raum.category === 'demon' && raum.legions === 30 && raum.nameKo.includes('라움'), 'Raum demon count 30 legions');

const rimmon = ENTRIES.find(e => e.id === 'e3229-rimmon');
assert.ok(rimmon && rimmon.category === 'demon' && rimmon.nameKo.includes('림몬'), 'Rimmon demon chief physician');

// Disambiguated Retz & Robert in R
const rRetzGilles = ENTRIES.find(e => e.id === 'e3211-retz');
assert.ok(rRetzGilles && rRetzGilles.nameKo.includes('질 드 레 남작'), 'Gilles de Rais');

const rRetzCardinal = ENTRIES.find(e => e.id === 'e3212-retz');
assert.ok(rRetzCardinal && rRetzCardinal.nameKo.includes('레츠 추기경'), 'Cardinal de Retz');

const robertDemon = ENTRIES.find(e => e.id === 'e3231-robert');
assert.ok(robertDemon && robertDemon.nameKo.includes('악마 로베르') && robertDemon.category === 'demon', 'Demon Robert');

const robertArtois = ENTRIES.find(e => e.id === 'e3233-robert');
assert.ok(robertArtois && robertArtois.nameKo.includes('아르투아의 로베르') && robertArtois.category === 'person', 'Robert of Artois');

const robertKing = ENTRIES.find(e => e.id === 'e3234-robert');
assert.ok(robertKing && robertKing.nameKo.includes('로베르 2세 국왕') && robertKing.category === 'person', 'King Robert II');

// N section audit assertions (91 entries, 11 illustrated)
const nEntries = ENTRIES.filter(e => e.letter === 'N');
assert.equal(nEntries.length, 91, 'N section must contain exactly 91 entries');

const nIllustrated = nEntries.filter(e => e.hasPlate);
assert.equal(nIllustrated.length, 11, 'N section must contain exactly 11 illustrated entries');

const nickar = ENTRIES.find(e => e.id === 'nickar');
assert.ok(nickar && nickar.hasPlate && nickar.plate === 'plates/nickar.jpg' && nickar.category === 'demon' && nickar.nameKo.includes('니카르'), 'Nickar 68 plate Nordic water demon');

const nybbas = ENTRIES.find(e => e.id === 'nybbas');
assert.ok(nybbas && nybbas.hasPlate && nybbas.plate === 'plates/nybbas.jpg' && nybbas.category === 'demon' && nybbas.nameKo.includes('니바스'), 'Nybbas 68 plate Grand Paradiste demon of dreams');

const nagates = ENTRIES.find(e => e.id === 'e2737-nagates');
assert.ok(nagates && nagates.hasPlate && nagates.nameKo.includes('나가테스'), 'Nagates illustrated');

const nainLaurin = ENTRIES.find(e => e.id === 'e2743-nainlaurinoulelfroi');
assert.ok(nainLaurin && nainLaurin.hasPlate && nainLaurin.nameKo.includes('라우린'), 'Nain-Laurin illustrated dwarf king');

const nains = ENTRIES.find(e => e.id === 'e2744-nains');
assert.ok(nains && nains.hasPlate && nains.nameKo.includes('난쟁이 요정'), 'Nains illustrated dwarfs');

const napoleonIer = ENTRIES.find(e => e.id === 'e2754-napoleonier');
assert.ok(napoleonIer && napoleonIer.hasPlate && napoleonIer.nameKo.includes('나폴레옹 1세'), 'Napoleon Ier Red Man illustrated');

const nostradamus = ENTRIES.find(e => e.id === 'e2810-nostradamusmichel');
assert.ok(nostradamus && nostradamus.hasPlate && nostradamus.nameKo.includes('노스트라다무스'), 'Nostradamus illustrated prophet');

const noyes = ENTRIES.find(e => e.id === 'e2812-noyes');
assert.ok(noyes && noyes.hasPlate && noyes.nameKo.includes('익사자'), 'Noyes drowned sailors illustrated');

const nuitDesTrepasses = ENTRIES.find(e => e.id === 'e2813-nuitdestrepasses');
assert.ok(nuitDesTrepasses && nuitDesTrepasses.hasPlate && nuitDesTrepasses.nameKo.includes('위령의 밤'), 'Nuit des trepasses illustrated All Souls Night');

const nymphes = ENTRIES.find(e => e.id === 'e2817-nymphes');
assert.ok(nymphes && nymphes.hasPlate && nymphes.nameKo.includes('님프'), 'Nymphes illustrated');

const nympheDeLElbe = ENTRIES.find(e => e.id === 'e2818-nymphedelelbe');
assert.ok(nympheDeLElbe && nympheDeLElbe.hasPlate && nympheDeLElbe.nameKo.includes('엘베강의 님프'), 'Nymphe de l Elbe illustrated');

const nan = ENTRIES.find(e => e.id === 'e2748-nan');
assert.ok(nan && nan.category === 'superstition' && nan.nameKo.includes('난') && !nan.nameKo.startsWith('아니 ['), 'Nan Lappish gadfly fairy, not French non');

const notarique = ENTRIES.find(e => e.id === 'e2811-notarique');
assert.ok(notarique && notarique.category === 'grimoire' && notarique.nameKo.includes('노타리콘') && !notarique.nameKo.includes('공증인'), 'Notarique Cabbalistic acronym method, not notary');

const naberus = ENTRIES.find(e => e.id === 'e2733-naberus');
assert.ok(naberus && naberus.category === 'demon' && naberus.legions === 19 && naberus.nameKo.includes('나베리우스'), 'Naberius demon Marquis with 19 legions');

const nysrock = ENTRIES.find(e => e.id === 'e2822-nysrock');
assert.ok(nysrock && nysrock.category === 'demon' && nysrock.nameKo.includes('니스록'), 'Nysrock Nisroch demon chef of Beelzebub');

const neuhaus = ENTRIES.find(e => e.id === 'e2781-neuhausfemmeblanchede');
assert.ok(neuhaus && neuhaus.category === 'crossref' && neuhaus.nameKo.includes('노이하우스의 백의 부인') && !neuhaus.nameKo.includes('펨 블란슈'), 'Neuhaus White Lady, not raw femme blanche MT');

// O section audit assertions (104 entries, 11 illustrated)
const oEntries = ENTRIES.filter(e => e.letter === 'O');
assert.equal(oEntries.length, 104, 'O section must contain exactly 104 entries (after N boundary fix)');

const oIllustrated = oEntries.filter(e => e.hasPlate);
assert.equal(oIllustrated.length, 11, 'O section must contain exactly 11 illustrated entries');

const orobas = ENTRIES.find(e => e.id === 'orobas');
assert.ok(orobas && orobas.hasPlate && orobas.plate === 'plates/orobas.jpg' && orobas.category === 'demon' && orobas.legions === 20 && orobas.nameKo.includes('오로바스'), 'Orobas 68 Goetic demon Prince with 20 legions');

const oberon = ENTRIES.find(e => e.id === 'e2827-oberon');
assert.ok(oberon && oberon.hasPlate && oberon.nameKo.includes('오베론'), 'Oberon King of Fairies illustrated');

const ondins = ENTRIES.find(e => e.id === 'e2872-ondins');
assert.ok(ondins && ondins.hasPlate && ondins.nameKo.includes('운디네') && !ondins.nameKo.includes('머포크'), 'Ondins Undines water elementals illustrated, not merfolk');

const ogres = ENTRIES.find(e => e.id === 'e2852-ogres');
assert.ok(ogres && ogres.hasPlate && ogres.nameKo.includes('오거'), 'Ogres man-eating monsters illustrated');

const oldenbourg = ENTRIES.find(e => e.id === 'e2859-oldenbourg');
assert.ok(oldenbourg && oldenbourg.hasPlate && oldenbourg.nameKo.includes('올덴부르크'), 'Oldenbourg fairy horn illustrated');

const optimisme = ENTRIES.find(e => e.id === 'e2888-optimisme');
assert.ok(optimisme && optimisme.hasPlate && optimisme.nameKo.includes('낙천주의'), 'Optimism Voltaire satire illustrated');

const oracles = ENTRIES.find(e => e.id === 'e2889-oracles');
assert.ok(oracles && oracles.hasPlate && oracles.nameKo.includes('신탁'), 'Oracles ancient pagan illustrated');

const originesMonde = ENTRIES.find(e => e.id === 'e2901-originesdumonde');
assert.ok(originesMonde && originesMonde.hasPlate && originesMonde.nameKo.includes('세계의 기원'), 'Origines du monde cosmogonies illustrated');

const ours = ENTRIES.find(e => e.id === 'e2923-ours');
assert.ok(ours && ours.hasPlate && ours.nameKo.includes('곰 숭배'), 'Ours bear cult illustrated');

const oxyones = ENTRIES.find(e => e.id === 'e2925-oxyones');
assert.ok(oxyones && oxyones.hasPlate && oxyones.nameKo.includes('옥시오네스'), 'Oxyones bird-headed tribe illustrated');

const ophites = ENTRIES.find(e => e.id === 'e2885-ophites');
assert.ok(ophites && ophites.category === 'superstition' && ophites.nameKo.includes('오피스파') && !ophites.nameKo.includes('아편족'), 'Ophites serpent-worshipping Gnostics, not opium tribe');

const ophthalmius = ENTRIES.find(e => e.id === 'e2886-ophthalmius');
assert.ok(ophthalmius && ophthalmius.category === 'superstition' && ophthalmius.nameKo.includes('오프탈미우스') && !ophthalmius.nameKo.includes('안과'), 'Ophthalmius invisibility stone, not ophthalmology clinic');

const ophthalmoscopie = ENTRIES.find(e => e.id === 'e2887-ophthalmoscopie');
assert.ok(ophthalmoscopie && ophthalmoscopie.category === 'divination' && ophthalmoscopie.nameKo.includes('안상술') && !ophthalmoscopie.nameKo.includes('검안경검사'), 'Ophthalmoscopie physiognomy of eyes, not medical ophthalmoscopy');

const obsedes = ENTRIES.find(e => e.id === 'e2830-obsedes');
assert.ok(obsedes && obsedes.category === 'superstition' && obsedes.nameKo.includes('강박 빙의자들') && !obsedes.nameKo.startsWith('집착 ['), 'Obsedes demonic obsession, not generic obsession');

const oze = ENTRIES.find(e => e.id === 'e2926-oze');
assert.ok(oze && oze.category === 'demon' && oze.legions === 3 && oze.nameKo.includes('오제'), 'Oze demon President with 3 legions');

const oray = ENTRIES.find(e => e.id === 'e2892-oray');
assert.ok(oray && oray.category === 'demon' && oray.legions === 30 && oray.nameKo.includes('오라이'), 'Oray Leraje Marquis with 30 legions');

const otis = ENTRIES.find(e => e.id === 'e2916-otis');
assert.ok(otis && otis.category === 'demon' && otis.legions === 60 && otis.nameKo.includes('오티스'), 'Otis Botis President with 60 legions');

const orias = ENTRIES.find(e => e.id === 'e2899-orias');
assert.ok(orias && orias.category === 'demon' && orias.legions === 30 && orias.nameKo.includes('오리아스'), 'Orias Marquis with 30 legions');

// P section audit assertions (238 entries, 31 illustrated)
const pEntries = ENTRIES.filter(e => e.letter === 'P');
assert.equal(pEntries.length, 238, 'P section must contain exactly 238 entries');

const pIllustrated = pEntries.filter(e => e.hasPlate);
assert.equal(pIllustrated.length, 31, 'P section must contain exactly 31 illustrated entries');

const paymon = ENTRIES.find(e => e.id === 'paymon');
assert.ok(paymon && paymon.hasPlate && paymon.plate === 'plates/paymon.jpg' && paymon.category === 'demon' && paymon.legions === 200 && paymon.nameKo.includes('파이몬'), 'Paymon 68 Goetic demon King with 200 legions');

const picollus = ENTRIES.find(e => e.id === 'picollus');
assert.ok(picollus && picollus.hasPlate && picollus.plate === 'plates/picollus.jpg' && picollus.category === 'demon' && picollus.nameKo.includes('피콜루스'), 'Picollus 68 plate ancient Prussian underworld god');

const pruflas = ENTRIES.find(e => e.id === 'pruflas');
assert.ok(pruflas && pruflas.hasPlate && pruflas.plate === 'plates/pruflas.jpg' && pruflas.category === 'demon' && pruflas.legions === 26 && pruflas.nameKo.includes('프루플라스'), 'Pruflas 68 plate demon Prince with 26 legions');

const peanite = ENTRIES.find(e => e.id === 'e2974-peanite');
assert.ok(peanite && peanite.category === 'superstition' && peanite.nameKo.includes('페아니테스') && !peanite.nameKo.includes('땅콩'), 'Peanite gemstone for childbirth, not peanut');

const pharmacie = ENTRIES.find(e => e.id === 'e3010-pharmacie');
assert.ok(pharmacie && pharmacie.category === 'divination' && pharmacie.nameKo.includes('약초 훈증 점술') && !pharmacie.nameKo.includes('약국'), 'Pharmacie ancient herbal divination, not drugstore');

const persil = ENTRIES.find(e => e.id === 'e2995-persilmaitre');
assert.ok(persil && persil.category === 'crossref' && persil.nameKo.includes('마스터 파슬리') && !persil.nameKo.startsWith('파슬리 ['), 'Master Parsley alias of Verdelet');

const pythons = ENTRIES.find(e => e.id === 'e3164-pythons');
assert.ok(pythons && pythons.category === 'myth' && pythons.nameKo.includes('퓌톤') && !pythons.nameKo.includes('비단뱀'), 'Pythons Apollo divining spirits, not pythons snake');

const philinnion = ENTRIES.find(e => e.id === 'e3014-philinnion');
assert.ok(philinnion && philinnion.hasPlate && philinnion.plate === 'plates/e3014-philinnion.jpg' && philinnion.nameKo.includes('필린니온'), 'Philinnion illustrated ancient vampire bride');

const pierrePhilosophale = ENTRIES.find(e => e.id === 'e3038-pierrephilosophale');
assert.ok(pierrePhilosophale && pierrePhilosophale.hasPlate && pierrePhilosophale.nameKo.includes('현자의 돌'), 'Philosopher Stone illustrated');

const pouleNoire = ENTRIES.find(e => e.id === 'e3109-poulenoire');
assert.ok(pouleNoire && pouleNoire.hasPlate && pouleNoire.category === 'grimoire' && pouleNoire.nameKo.includes('검은 암탉'), 'Black Pullet grimoire illustrated');

const puck = ENTRIES.find(e => e.id === 'e3152-puck');
assert.ok(puck && puck.hasPlate && puck.nameKo.includes('퍽'), 'Puck illustrated fairy');

const pursan = ENTRIES.find(e => e.id === 'e3156-pursan');
assert.ok(pursan && pursan.hasPlate && pursan.legions === 22 && pursan.nameKo.includes('푸르손'), 'Purson King with 22 legions illustrated');

const pythagore = ENTRIES.find(e => e.id === 'e3162-pythagore');
assert.ok(pythagore && pythagore.hasPlate && pythagore.category === 'person' && pythagore.nameKo.includes('피타고라스'), 'Pythagoras illustrated philosopher');

// Q section audit assertions (7 entries, 3 illustrated)
const qEntries = ENTRIES.filter(e => e.letter === 'Q');
assert.equal(qEntries.length, 7, 'Q section must contain exactly 7 entries');

const qIllustrated = qEntries.filter(e => e.hasPlate);
assert.equal(qIllustrated.length, 3, 'Q section must contain exactly 3 illustrated entries');

const quakerisme = ENTRIES.find(e => e.id === 'e3165-quakerisme');
assert.ok(quakerisme && quakerisme.hasPlate && quakerisme.plate === 'plates/e3165-quakerisme.jpg' && quakerisme.nameKo.includes('퀘이커교'), 'Quakerisme illustrated');

const queiran = ENTRIES.find(e => e.id === 'e3166-queiranisaac');
assert.ok(queiran && queiran.hasPlate && queiran.plate === 'plates/e3166-queiran-isaac.jpg' && queiran.category === 'person' && queiran.nameKo.includes('이자크 케랑'), 'Queiran Isaac illustrated sorcerer');

const question = ENTRIES.find(e => e.id === 'e3167-question');
assert.ok(question && question.category === 'crossref' && question.nameKo.includes('사법 고문') && !question.nameKo.startsWith('질문 ['), 'Question translated as judicial torture, not generic question');

const queys = ENTRIES.find(e => e.id === 'e3168-queys');
assert.ok(queys && queys.category === 'myth' && queys.nameKo.includes('귀신'), 'Queys Chinese evil spirits');

const quintillianites = ENTRIES.find(e => e.id === 'e3169-quintillianites');
assert.ok(quintillianites && quintillianites.category === 'superstition' && quintillianites.nameKo.includes('퀸틸리아누스파'), 'Quintillianites Gnostic sect');

const quirim = ENTRIES.find(e => e.id === 'e3170-quirim');
assert.ok(quirim && quirim.category === 'superstition' && quirim.nameKo.includes('퀴림'), 'Quirim stone of betrayal');

const quivogne = ENTRIES.find(e => e.id === 'e3171-quivognefemme');
assert.ok(quivogne && quivogne.hasPlate && quivogne.plate === 'plates/e3171-quivogne-femme.jpg' && quivogne.category === 'person' && quivogne.nameKo.includes('키보뉴 부인') && !quivogne.nameKo.includes('펨 키보느'), 'Quivogne femme translated as Madame Quivogne, not femme MT');

const searchAbaris=filterEntries({query:'Abaris'});
assert.ok(searchAbaris.some(e=>e.nameKo.includes('아바리스 [Abaris]')));

const searchBuer=filterEntries({query:'Buer'});
assert.ok(searchBuer.some(e=>e.id==='buer'));

const byLegions=filterEntries({sort:'legions',onlyIllustrated:true});
assert.equal(byLegions[0].id,'abraxas');
assert.equal(byLegions[1].id,'paymon');

const dailyA=getDailyEntry('2026-11-12');
const dailyB=getDailyEntry('2026-11-12');
assert.equal(dailyA.id,dailyB.id,'Daily entry must be deterministic for a given date');

console.log('PASS: all 3,810 A-Z entries dataset, proper noun English notation, plate assets, search, filtering, sorting, and daily entry');
