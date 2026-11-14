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

// H section audit assertions (154 entries, 16 illustrated)
const hEntries = ENTRIES.filter(e => e.letter === 'H');
assert.equal(hEntries.length, 154, 'H section must contain exactly 154 entries (after G/H boundary fix: Haagenti to Hypnotisme)');

const hIllustrated = hEntries.filter(e => e.hasPlate);
assert.equal(hIllustrated.length, 16, 'H section must contain exactly 16 illustrated entries');

const haborymDemon = ENTRIES.find(e => e.id === 'haborym');
assert.ok(haborymDemon && haborymDemon.hasPlate && haborymDemon.plate === 'plates/haborym.jpg' && haborymDemon.plateNo === 37 && haborymDemon.legions === 26 && haborymDemon.category === 'demon' && haborymDemon.nameKo.includes('하보림'), 'Haborym Plate 37 infernal duke with 26 legions');

const haagentiDemon = ENTRIES.find(e => e.id === 'e1936-haagenti');
assert.ok(haagentiDemon && haagentiDemon.category === 'demon' && haagentiDemon.legions === 33 && haagentiDemon.nameKo.includes('하겐티'), 'Haagenti Grand President with 33 legions');

const halphasDemon = ENTRIES.find(e => e.id === 'e1946-halphas');
assert.ok(halphasDemon && halphasDemon.category === 'demon' && halphasDemon.legions === 26 && halphasDemon.nameKo.includes('할파스'), 'Halphas infernal count with 26 legions');

const hallucinationPlate = ENTRIES.find(e => e.id === 'e1945-hallucination');
assert.ok(hallucinationPlate && hallucinationPlate.hasPlate && hallucinationPlate.plate === 'plates/e1945-hallucination.jpg' && hallucinationPlate.nameKo.includes('환각'), 'Hallucination illustrated');

const haroldGermsonPlate = ENTRIES.find(e => e.id === 'e1959-haroldgermson');
assert.ok(haroldGermsonPlate && haroldGermsonPlate.hasPlate && haroldGermsonPlate.plate === 'plates/e1959-harold-germson.jpg' && haroldGermsonPlate.nameKo.includes('하랄드'), 'Harold-Germson illustrated');

const henriLeLionPlate = ENTRIES.find(e => e.id === 'e1995-henrilelion');
assert.ok(henriLeLionPlate && henriLeLionPlate.hasPlate && henriLeLionPlate.plate === 'plates/e1995-henri-le-lion.jpg' && henriLeLionPlate.nameKo.includes('사자공 하인리히'), 'Henry the Lion illustrated');

const hocquePlate = ENTRIES.find(e => e.id === 'e2038-hocque');
assert.ok(hocquePlate && hocquePlate.hasPlate && hocquePlate.plate === 'plates/e2038-hocque.jpg' && hocquePlate.nameKo.includes('에티엔 오크'), 'Etienne Hocque illustrated');

const hommeNoirPlate = ENTRIES.find(e => e.id === 'e2046-hommenoir');
assert.ok(hommeNoirPlate && hommeNoirPlate.hasPlate && hommeNoirPlate.plate === 'plates/e2046-homme-noir.jpg' && hommeNoirPlate.category === 'demon' && hommeNoirPlate.nameKo.includes('검은 남자'), 'Black Man illustrated demon');

const horoscopesToutFaits = ENTRIES.find(e => e.id === 'e2055-horoscopestoutfaits');
assert.ok(horoscopesToutFaits && horoscopesToutFaits.hasPlate && horoscopesToutFaits.plate === 'plates/e2055-horoscopes-tout-faits.jpg' && horoscopesToutFaits.category === 'divination' && horoscopesToutFaits.nameKo.includes('기성 천궁도 운세표'), 'Ready-Made Horoscopes illustrated');

const hyenePlate = ENTRIES.find(e => e.id === 'e2086-hyene');
assert.ok(hyenePlate && hyenePlate.hasPlate && hyenePlate.plate === 'plates/e2086-hy-ne.jpg' && hyenePlate.nameKo.includes('하이에나'), 'Hyena and Hyaenia Stone illustrated');

const henri3Fr = ENTRIES.find(e => e.id === 'e1989-henriiii');
assert.ok(henri3Fr && henri3Fr.nameKo.includes('앙리 3세') && henri3Fr.nameFr === 'Henri III (Roi de France)', 'Disambiguated Henri III of France');

const henri3De = ENTRIES.find(e => e.id === 'e1990-henriiii');
assert.ok(henri3De && henri3De.nameKo.includes('하인리히 3세') && henri3De.nameFr === 'Henri III (Empereur d’Allemagne)', 'Disambiguated Henry III HRE');

const henri4De = ENTRIES.find(e => e.id === 'e1991-henriiv');
assert.ok(henri4De && henri4De.nameKo.includes('하인리히 4세') && henri4De.nameFr === 'Henri IV (Empereur d’Allemagne)', 'Disambiguated Henry IV HRE');

const henri4En = ENTRIES.find(e => e.id === 'e1992-henriiv');
assert.ok(henri4En && henri4En.nameKo.includes('헨리 4세') && henri4En.nameFr === 'Henri IV (Roi d’Angleterre)', 'Disambiguated Henry IV of England');

const henri4Fr = ENTRIES.find(e => e.id === 'e1994-henriiv');
assert.ok(henri4Fr && henri4Fr.nameKo.includes('앙리 4세') && henri4Fr.nameFr === 'Henri IV (Roi de France)', 'Disambiguated Henri IV of France');

const helene1 = ENTRIES.find(e => e.id === 'e1976-helene');
assert.ok(helene1 && helene1.nameKo.includes('아디아베네의 헬레나') && helene1.nameFr === 'Hélène, Oléine', 'Disambiguated Helena of Adiabene');

const helene2 = ENTRIES.find(e => e.id === 'e1977-helene');
assert.ok(helene2 && helene2.nameKo.includes('시몬 마구스의 연인 셀레네') && helene2.nameFr === 'Hélène, Sélène', 'Disambiguated Helena companion of Simon Magus');

const hypnotisme = ENTRIES.find(e => e.id === 'e2089-hypnotisme');
assert.ok(hypnotisme && hypnotisme.letter === 'H' && hypnotisme.nameKo.includes('최면술'), 'Hypnotisme ends H section');

const gyromancie = ENTRIES.find(e => e.id === 'e1935-gyromancie');
assert.ok(gyromancie && gyromancie.letter === 'G', 'Gyromancie moved from H to G at boundary');

// I section audit assertions (59 entries, 11 illustrated)
const iEntries = ENTRIES.filter(e => e.letter === 'I');
assert.equal(iEntries.length, 59, 'I section must contain exactly 59 entries (after I/J boundary fix: Ialysiens to Iwangis)');

const iIllustrated = iEntries.filter(e => e.hasPlate);
assert.equal(iIllustrated.length, 11, 'I section must contain exactly 11 illustrated entries');

const ipesDemon = ENTRIES.find(e => e.id === 'ipes');
assert.ok(ipesDemon && ipesDemon.hasPlate && ipesDemon.plate === 'plates/ipes.jpg' && ipesDemon.plateNo === 38 && ipesDemon.legions === 36 && ipesDemon.category === 'demon' && ipesDemon.nameKo.includes('이페스'), 'Ipos Plate 38 infernal prince and count with 36 legions');

const ibis = ENTRIES.find(e => e.id === 'e2092-ibis');
assert.ok(ibis && ibis.hasPlate && ibis.plate === 'plates/e2092-ibis.jpg' && ibis.category === 'superstition' && ibis.nameKo.includes('이비스'), 'Ibis Egyptian sacred bird illustrated');

const illuminesPlate = ENTRIES.find(e => e.id === 'e2100-illumines');
assert.ok(illuminesPlate && illuminesPlate.hasPlate && illuminesPlate.plate === 'plates/e2100-illumin-s.jpg' && illuminesPlate.nameKo.includes('독일의 일루미나티'), 'Illuminati of Germany secret society illustrated');

const imaginationPlate = ENTRIES.find(e => e.id === 'e2107-imagination');
assert.ok(imaginationPlate && imaginationPlate.hasPlate && imaginationPlate.plate === 'plates/e2107-imagination.jpg' && imaginationPlate.nameKo.includes('상상력'), 'Imagination magical power illustrated');

const immortalitePlate = ENTRIES.find(e => e.id === 'e2110-immortalite');
assert.ok(immortalitePlate && immortalitePlate.hasPlate && immortalitePlate.plate === 'plates/e2110-immortalit.jpg' && immortalitePlate.nameKo.includes('불멸성'), 'Physical immortality delusion illustrated');

const imprimeriePlate = ENTRIES.find(e => e.id === 'e2114-imprimeriel');
assert.ok(imprimeriePlate && imprimeriePlate.hasPlate && imprimeriePlate.plate === 'plates/e2114-imprimerie-l.jpg' && imprimeriePlate.nameKo.includes('인쇄술'), 'Invention of printing and devil accusations illustrated');

const infidelitePlate = ENTRIES.find(e => e.id === 'e2121-infidelite');
assert.ok(infidelitePlate && infidelitePlate.hasPlate && infidelitePlate.plate === 'plates/e2121-infid-lit.jpg' && infidelitePlate.nameKo.includes('불륜 시험의 성배'), 'Cup of Suspicion ordeal of infidelity illustrated');

const inquisitionPlate = ENTRIES.find(e => e.id === 'e2125-inquisition');
assert.ok(inquisitionPlate && inquisitionPlate.hasPlate && inquisitionPlate.plate === 'plates/e2125-inquisition.jpg' && inquisitionPlate.category === 'person' && inquisitionPlate.nameKo.includes('이단심문소'), 'Holy Inquisition tribunal and torture illustrated');

const interditPlate = ENTRIES.find(e => e.id === 'e2128-interdit');
assert.ok(interditPlate && interditPlate.hasPlate && interditPlate.plate === 'plates/e2128-interdit.jpg' && interditPlate.nameKo.includes('성무정지령'), 'Papal interdict censure illustrated');

const invisibilitePlate = ENTRIES.find(e => e.id === 'e2130-invisibilite');
assert.ok(invisibilitePlate && invisibilitePlate.hasPlate && invisibilitePlate.plate === 'plates/e2130-invisibilit.jpg' && invisibilitePlate.category === 'grimoire' && invisibilitePlate.nameKo.includes('투명술'), 'Magic of invisibility illustrated');

const isPlate = ENTRIES.find(e => e.id === 'e2137-is');
assert.ok(isPlate && isPlate.hasPlate && isPlate.plate === 'plates/e2137-is.jpg' && isPlate.category === 'myth' && isPlate.nameKo.includes('이스'), 'Sunken city of Ys illustrated');

const ialysiens = ENTRIES.find(e => e.id === 'e2090-ialysiens');
assert.ok(ialysiens && ialysiens.category === 'myth' && ialysiens.nameKo.includes('이알리소스인'), 'Ialysians of Rhodes with evil eye');

const iamen = ENTRIES.find(e => e.id === 'e2091-iamen');
assert.ok(iamen && iamen.category === 'myth' && iamen.nameKo.includes('야마'), 'Yama Hindu god of death');

const ichneumon = ENTRIES.find(e => e.id === 'e2094-ichneumon');
assert.ok(ichneumon && ichneumon.category === 'superstition' && ichneumon.nameKo.includes('이크뉴몬'), 'Ichneumon Egyptian sacred mongoose');

const ichthyomancie = ENTRIES.find(e => e.id === 'e2095-ichthyomancie');
assert.ok(ichthyomancie && ichthyomancie.category === 'divination' && ichthyomancie.nameKo.includes('어점'), 'Ichthyomancy fish divination');

const ida = ENTRIES.find(e => e.id === 'e2096-ida');
assert.ok(ida && ida.category === 'person' && ida.nameKo.includes('이다'), 'Blessed Ida of Louvain');

const idiot = ENTRIES.find(e => e.id === 'e2098-idiot');
assert.ok(idiot && idiot.category === 'superstition' && idiot.nameKo.includes('백치'), 'Scottish folklore on innocent idiots');

const ifurinn = ENTRIES.find(e => e.id === 'e2101-ifurinn');
assert.ok(ifurinn && ifurinn.category === 'myth' && ifurinn.nameKo.includes('이푸린'), 'Ifurinn Gaulish underworld');

const ileFantome = ENTRIES.find(e => e.id === 'e2103-ilefantome');
assert.ok(ileFantome && ileFantome.category === 'myth' && ileFantome.nameKo.includes('유령섬'), 'Phantom Island of Saint Brendan');

const illuminesText = ENTRIES.find(e => e.id === 'e2105-illumines');
assert.ok(illuminesText && illuminesText.category === 'person' && illuminesText.nameKo.includes('일루미나티'), 'Illuminati sect text');

const imagesDeCire = ENTRIES.find(e => e.id === 'e2106-imagesdecire');
assert.ok(imagesDeCire && imagesDeCire.category === 'grimoire' && imagesDeCire.nameKo.includes('밀랍 인형'), 'Wax images in envoûtement');

const impair = ENTRIES.find(e => e.id === 'e2111-impair');
assert.ok(impair && impair.category === 'superstition' && impair.nameKo.includes('홀수'), 'Superstition of odd numbers');

const incombustibles = ENTRIES.find(e => e.id === 'e2116-incombustibles');
assert.ok(incombustibles && incombustibles.category === 'person' && incombustibles.nameKo.includes('불에 타지 않는 자들'), 'Incombustible Saludadores');

const incubes = ENTRIES.find(e => e.id === 'e2118-incubes');
assert.ok(incubes && incubes.category === 'demon' && incubes.nameKo.includes('인쿠부스'), 'Incubi male night demons');

const incubo = ENTRIES.find(e => e.id === 'e2119-incubo');
assert.ok(incubo && incubo.category === 'myth' && incubo.nameKo.includes('인쿠보'), 'Incubo Roman guardian of earth treasures');

const infernaux = ENTRIES.find(e => e.id === 'e2120-infernaux');
assert.ok(infernaux && infernaux.category === 'person' && infernaux.nameKo.includes('지옥파'), 'Infernaux Lutheran theological controversy');

const inisFail = ENTRIES.find(e => e.id === 'e2123-inisfail');
assert.ok(inisFail && inisFail.category === 'myth' && inisFail.nameKo.includes('운명의 돌'), 'Stone of Destiny Lia Fail');

const insensibilite = ENTRIES.find(e => e.id === 'e2126-insensibilite');
assert.ok(insensibilite && insensibilite.category === 'superstition' && insensibilite.nameKo.includes('무통각'), 'Witch insensibility stigma diabolicum');

const institor = ENTRIES.find(e => e.id === 'e2127-institorhenri');
assert.ok(institor && institor.category === 'person' && institor.nameKo.includes('하인리히 크레머'), 'Heinrich Kramer author of Malleus Maleficarum');

const intersignes = ENTRIES.find(e => e.id === 'e2129-intersignes');
assert.ok(intersignes && intersignes.category === 'superstition' && intersignes.nameKo.includes('인터신'), 'Intersignes Breton death omens');

const irmentrude = ENTRIES.find(e => e.id === 'e2136-irmentrude');
assert.ok(irmentrude && irmentrude.category === 'myth' && irmentrude.nameKo.includes('이르멘트루트'), 'Irmentrude legend of the Welf dynasty');

const islandais = ENTRIES.find(e => e.id === 'e2141-islandais');
assert.ok(islandais && islandais.category === 'superstition' && islandais.nameKo.includes('아이슬란드인'), 'Icelandic clairvoyance magic');

const mainfroy = ENTRIES.find(e => e.id === 'e2142-isleenjourdainmainfroydel');
assert.ok(mainfroy && mainfroy.category === 'person' && mainfroy.nameKo.includes('맹프로이'), 'Mainfroy de l Isle en Jourdain Tour de Nesle');

const ithyphalle = ENTRIES.find(e => e.id === 'e2145-ithyphalle');
assert.ok(ithyphalle && ithyphalle.category === 'superstition' && ithyphalle.nameKo.includes('이티팔로스'), 'Ithyphallus fascinum amulet');

const ivoLeNoir = ENTRIES.find(e => e.id === 'e2146-ivolenoir');
assert.ok(ivoLeNoir && ivoLeNoir.category === 'myth' && ivoLeNoir.nameKo.includes('검은 이보'), 'Ivo the Black sleeping king of Montenegro');

const iwangis = ENTRIES.find(e => e.id === 'e2148-iwangis');
assert.ok(iwangis && iwangis.category === 'person' && iwangis.nameKo.includes('이완기스'), 'Iwangis of Moluccas cannibal sorcerers');

// J section audit assertions (74 entries, 8 illustrated)
const jEntries = ENTRIES.filter(e => e.letter === 'J');
assert.equal(jEntries.length, 74, 'J section must contain exactly 74 entries (after I/J boundary fix and Jurieu transfer)');

const jIllustrated = jEntries.filter(e => e.hasPlate);
assert.equal(jIllustrated.length, 8, 'J section must contain exactly 8 illustrated entries');

const jacquesIer = ENTRIES.find(e => e.id === 'e2153-jacquesier');
assert.ok(jacquesIer && jacquesIer.hasPlate && jacquesIer.plate === 'plates/e2153-jacques-ier.jpg' && jacquesIer.category === 'person' && jacquesIer.nameKo.includes('제임스 1세'), 'James I illustrated monarch author of Daemonologie');

const jannesEtMambres = ENTRIES.find(e => e.id === 'e2161-jannesetmambres');
assert.ok(jannesEtMambres && jannesEtMambres.hasPlate && jannesEtMambres.plate === 'plates/e2161-jann-s-et-mambr-s.jpg' && jannesEtMambres.category === 'person' && jannesEtMambres.nameKo.includes('얀네와 얌브레'), 'Jannes and Jambres illustrated Egyptian magicians');

const jeanDeLeyde = ENTRIES.find(e => e.id === 'e2174-jeandeleyde');
assert.ok(jeanDeLeyde && jeanDeLeyde.hasPlate && jeanDeLeyde.plate === 'plates/e2174-jean-de-leyde.jpg' && jeanDeLeyde.category === 'person' && jeanDeLeyde.nameKo.includes('얀 판 레이던'), 'John of Leiden illustrated Anabaptist king of Münster');

const jeanneDArc = ENTRIES.find(e => e.id === 'e2180-jeannedarc');
assert.ok(jeanneDArc && jeanneDArc.hasPlate && jeanneDArc.plate === 'plates/e2180-jeanne-d-arc.jpg' && jeanneDArc.category === 'person' && jeanneDArc.nameKo.includes('잔 다르크'), 'Joan of Arc Maid of Orleans illustrated');

const jenounes = ENTRIES.find(e => e.id === 'e2188-jenounes');
assert.ok(jenounes && jenounes.hasPlate && jenounes.plate === 'plates/e2188-j-nounes.jpg' && jenounes.category === 'myth' && jenounes.nameKo.includes('제눈'), 'Jenounes Arab jinn spirits illustrated');

const jormungandur = ENTRIES.find(e => e.id === 'e2207-jormungandur');
assert.ok(jormungandur && jormungandur.hasPlate && jormungandur.plate === 'plates/e2207-jormungandur.jpg' && jormungandur.category === 'myth' && jormungandur.nameKo.includes('요르문간드'), 'Jormungandr Norse world serpent illustrated');

const juifErrant = ENTRIES.find(e => e.id === 'e2215-juiferrant');
assert.ok(juifErrant && juifErrant.hasPlate && juifErrant.plate === 'plates/e2215-juif-errant.jpg' && juifErrant.category === 'myth' && juifErrant.nameKo.includes('방랑하는 유대인'), 'Wandering Jew Ahasuerus illustrated');

const juifs = ENTRIES.find(e => e.id === 'e2216-juifs');
assert.ok(juifs && juifs.hasPlate && juifs.plate === 'plates/e2216-juifs.jpg' && juifs.category === 'superstition' && juifs.nameKo.includes('유대인'), 'Jewish superstitions illustrated');

const jabamiah = ENTRIES.find(e => e.id === 'e2149-jabamiah');
assert.ok(jabamiah && jabamiah.category === 'grimoire' && jabamiah.nameKo.includes('자바미아'), 'Jabamiah cabalistic healing word');

const jack = ENTRIES.find(e => e.id === 'e2152-jack');
assert.ok(jack && jack.category === 'demon' && jack.nameKo.includes('등불 든 잭'), 'Jack with the lantern fire sphere demon');

const jade = ENTRIES.find(e => e.id === 'e2154-jade');
assert.ok(jade && jade.category === 'superstition' && jade.nameKo.includes('비취'), 'Jade nephritic healing stone');

const jagghernat = ENTRIES.find(e => e.id === 'e2155-jagghernat');
assert.ok(jagghernat && jagghernat.category === 'demon' && jagghernat.nameKo.includes('자게르나트'), 'Jagannath idol demon');

const jaldabaoth = ENTRIES.find(e => e.id === 'e2157-jaldabaoth');
assert.ok(jaldabaoth && jaldabaoth.category === 'myth' && jaldabaoth.nameKo.includes('얄다바오트'), 'Yaldabaoth Ophite demiurge');

const jamambuxes = ENTRIES.find(e => e.id === 'e2158-jamambuxes');
assert.ok(jamambuxes && jamambuxes.category === 'person' && jamambuxes.nameKo.includes('야마부시'), 'Yamabushi Japanese mountain ascetics');

const jamblique = ENTRIES.find(e => e.id === 'e2159-jamblique');
assert.ok(jamblique && jamblique.category === 'person' && jamblique.nameKo.includes('이암블리코스'), 'Iamblichus theurgic philosopher');

const jammaloka = ENTRIES.find(e => e.id === 'e2160-jammaloka');
assert.ok(jammaloka && jammaloka.category === 'myth' && jammaloka.nameKo.includes('야마 로카'), 'Yama-Loka Hindu underworld');

const jarretiere = ENTRIES.find(e => e.id === 'e2162-jarretiere');
assert.ok(jarretiere && jarretiere.category === 'grimoire' && jarretiere.nameKo.includes('각반 비방'), 'Traveler garter charm with mugwort');

const jayetIslande = ENTRIES.find(e => e.id === 'e2165-jayetdislande');
assert.ok(jayetIslande && jayetIslande.category === 'superstition' && jayetIslande.nameKo.includes('아이슬란드의 흑옥'), 'Icelandic jet black amber');

const jechiel = ENTRIES.find(e => e.id === 'e2185-jechiel');
assert.ok(jechiel && jechiel.category === 'person' && jechiel.nameKo.includes('예히엘'), 'Rabbi Jehiel of Paris magic lamp');

const jetzer = ENTRIES.find(e => e.id === 'e2193-jetzer');
assert.ok(jetzer && jetzer.category === 'person' && jetzer.nameKo.includes('예처'), 'Johann Jetzer Dominican fraud of Bern');

const jezerTob = ENTRIES.find(e => e.id === 'e2196-jezertob');
assert.ok(jezerTob && jezerTob.category === 'myth' && jezerTob.nameKo.includes('예체르 토브'), 'Yetzer Tov and Yetzer Hara Cabala inclinations');

const joachim = ENTRIES.find(e => e.id === 'e2197-joachim');
assert.ok(joachim && joachim.category === 'person' && joachim.nameKo.includes('피오레의 요아킴'), 'Joachim of Fiore prophetic abbot');

const jockeyDesFees = ENTRIES.find(e => e.id === 'e2201-jockeydesfees');
assert.ok(jockeyDesFees && jockeyDesFees.category === 'myth' && jockeyDesFees.nameKo.includes('요정의 기수'), 'Fairy Jockey Scottish folklore');

const josueBenLevi = ENTRIES.find(e => e.id === 'e2210-josuebenlevi');
assert.ok(josueBenLevi && josueBenLevi.category === 'person' && josueBenLevi.nameKo.includes('여호수아 벤 레비'), 'Joshua ben Levi rabbi who tricked death');

const julienLApostat = ENTRIES.find(e => e.id === 'e2217-julienlapostat');
assert.ok(julienLApostat && julienLApostat.category === 'person' && julienLApostat.nameKo.includes('율리아누스 배교자'), 'Julian the Apostate Roman emperor');

const jungStilling = ENTRIES.find(e => e.id === 'e2218-jung');
assert.ok(jungStilling && jungStilling.category === 'person' && jungStilling.nameKo.includes('융'), 'Jung-Stilling author of Geister-Kunde');

const junier = ENTRIES.find(e => e.id === 'e2219-junier');
assert.ok(junier && junier.category === 'demon' && junier.nameKo.includes('쥐니에'), 'Junier demon called prince of angels');

const jurieu = ENTRIES.find(e => e.id === 'e2222-jurieu');
assert.ok(jurieu && jurieu.category === 'person' && jurieu.nameKo.includes('피에르 쥐리외'), 'Pierre Jurieu Huguenot false prophet');

// K section audit assertions (69 entries, 16 illustrated)
const kEntries = ENTRIES.filter(e => e.letter === 'K');
assert.equal(kEntries.length, 69, 'K section must contain exactly 69 entries (after J/K and K/L boundary fixes)');

const kIllustrated = kEntries.filter(e => e.hasPlate);
assert.equal(kIllustrated.length, 16, 'K section must contain exactly 16 illustrated entries');

const kahlhammer = ENTRIES.find(e => e.id === 'e2229-kahlhammermarie');
assert.ok(kahlhammer && kahlhammer.hasPlate && kahlhammer.nameKo.includes('마리 칼하머'), 'Kahlhammer possessed woman illustrated');

const kalmouks = ENTRIES.find(e => e.id === 'e2233-kalmouks');
assert.ok(kalmouks && kalmouks.hasPlate && kalmouks.nameKo.includes('칼미크족'), 'Kalmouks shamanism illustrated');

const kalpatarou = ENTRIES.find(e => e.id === 'e2234-kalpatarou');
assert.ok(kalpatarou && kalpatarou.hasPlate && kalpatarou.nameKo.includes('칼파타루'), 'Kalpa-Tarou wish-granting tree illustrated');

const kalta = ENTRIES.find(e => e.id === 'e2236-kalta');
assert.ok(kalta && kalta.hasPlate && kalta.nameKo.includes('칼타'), 'Kalta Eyrbyggja saga witch illustrated');

const kantius = ENTRIES.find(e => e.id === 'e2240-kantiuslesilesien');
assert.ok(kantius && kantius.hasPlate && kantius.nameKo.includes('칸티우스'), 'John Cantius vampire illustrated');

const kamlatPlate = ENTRIES.find(e => e.id === 'e2241-kamlat');
assert.ok(kamlatPlate && kamlatPlate.hasPlate && kamlatPlate.nameKo.includes('카믈라트 주술사'), 'Kamlat Siberian shaman illustrated');

const kephalonomancie = ENTRIES.find(e => e.id === 'e2256-kephalonomancie');
assert.ok(kephalonomancie && kephalonomancie.hasPlate && kephalonomancie.nameKo.includes('당나귀 머리뼈'), 'Kephalonomancie ass head divination illustrated');

const khumanoGoo = ENTRIES.find(e => e.id === 'e2259-khumanogoo');
assert.ok(khumanoGoo && khumanoGoo.hasPlate && khumanoGoo.nameKo.includes('구마노 고오후'), 'Khumano-Goo Japanese crow talisman ordeal illustrated');

const kericoff = ENTRIES.find(e => e.id === 'e2264-kericoff');
assert.ok(kericoff && kericoff.hasPlate && kericoff.nameKo.includes('케리코프'), 'Kericoff Russian lake monster illustrated');

const kisilova = ENTRIES.find(e => e.id === 'e2265-kisilovalevampirede');
assert.ok(kisilova && kisilova.hasPlate && kisilova.nameKo.includes('키실로바'), 'Kisilova vampire Peter Plogojowitz illustrated');

const kleudde = ENTRIES.find(e => e.id === 'e2267-kleudde');
assert.ok(kleudde && kleudde.hasPlate && kleudde.nameKo.includes('클뢰드'), 'Kleudde Flemish shapeshifting fiend illustrated');

const knipperdolinck = ENTRIES.find(e => e.id === 'e2269-knipperdolinck');
assert.ok(knipperdolinck && knipperdolinck.hasPlate && knipperdolinck.nameKo.includes('크니퍼돌링'), 'Knipperdolinck Anabaptist leader illustrated');

const kobold = ENTRIES.find(e => e.id === 'e2272-kobold');
assert.ok(kobold && kobold.hasPlate && kobold.nameKo.includes('코볼트'), 'Kobold German goblin illustrated');

const kojozed = ENTRIES.find(e => e.id === 'e2273-kojozed');
assert.ok(kojozed && kojozed.hasPlate && kojozed.nameKo.includes('코요제드'), 'Kojozed phantom hound illustrated');

const kraken = ENTRIES.find(e => e.id === 'e2282-kraken');
assert.ok(kraken && kraken.hasPlate && kraken.nameKo.includes('크라켄'), 'Kraken giant sea monster illustrated');

const krechting = ENTRIES.find(e => e.id === 'e2284-krechting');
assert.ok(krechting && krechting.hasPlate && krechting.nameKo.includes('크레히팅'), 'Krechting Anabaptist leader illustrated');

const kaaba = ENTRIES.find(e => e.id === 'e2223-kaaba');
assert.ok(kaaba && kaaba.category === 'superstition' && kaaba.nameKo.includes('카바 신전'), 'Kaaba Black Stone of Mecca');

const kaf = ENTRIES.find(e => e.id === 'e2227-kaf');
assert.ok(kaf && kaf.category === 'myth' && kaf.nameKo.includes('카프 산'), 'Mount Kaf emerald realm of Jinn');

const kardec = ENTRIES.find(e => e.id === 'e2244-kardecallan');
assert.ok(kardec && kardec.category === 'person' && kardec.nameKo.includes('알랑 카르덱'), 'Allan Kardec spiritism founder');

const katakhanes = ENTRIES.find(e => e.id === 'e2246-katakhanes');
assert.ok(katakhanes && katakhanes.category === 'myth' && katakhanes.nameKo.includes('카타카나스'), 'Katakhanas Cretan vampire');

const kobal = ENTRIES.find(e => e.id === 'e2271-kobal');
assert.ok(kobal && kobal.category === 'demon' && kobal.nameKo.includes('코발'), 'Kobal director of infernal comedies');

const kourrigans = ENTRIES.find(e => e.id === 'e2281-kourrigans');
assert.ok(kourrigans && kourrigans.category === 'myth' && kourrigans.nameKo.includes('코리간'), 'Kourrigans Breton dolmen fairies');

const kratim = ENTRIES.find(e => e.id === 'e2283-kratim');
assert.ok(kratim && kratim.category === 'myth' && kratim.nameKo.includes('크라팀'), 'Kratim dog of Seven Sleepers');

const kupay = ENTRIES.find(e => e.id === 'e2288-kupay');
assert.ok(kupay && kupay.category === 'demon' && kupay.nameKo.includes('쿠파이'), 'Kupay Incan underworld demon Supay');

const kutuktus = ENTRIES.find(e => e.id === 'e2291-kutuktus');
assert.ok(kutuktus && kutuktus.category === 'myth' && kutuktus.nameKo.includes('후툭투'), 'Kutuktus Mongolian living Buddha');

// L section audit assertions (169 entries, 20 illustrated)
const lEntries = ENTRIES.filter(e => e.letter === 'L');
assert.equal(lEntries.length, 169, 'L section must contain exactly 169 entries (after K/L and L/M boundary fixes)');

const lIllustrated = lEntries.filter(e => e.hasPlate);
assert.equal(lIllustrated.length, 20, 'L section must contain exactly 20 illustrated entries');

const lamia = ENTRIES.find(e => e.id === 'lamia');
assert.ok(lamia && lamia.hasPlate && lamia.plate === 'plates/lamia.jpg' && lamia.category === 'demon' && lamia.nameKo.includes('라미아'), 'Lamia 68 plate demon queen of Libya');

const lechies = ENTRIES.find(e => e.id === 'lechies');
assert.ok(lechies && lechies.hasPlate && lechies.plate === 'plates/lechies.jpg' && lechies.category === 'demon' && lechies.nameKo.includes('레시'), 'Lechies 68 plate Slavic forest spirit');

const leonard = ENTRIES.find(e => e.id === 'leonard');
assert.ok(leonard && leonard.hasPlate && leonard.plate === 'plates/leonard.jpg' && leonard.category === 'demon' && leonard.nameKo.includes('레오나르'), 'Leonard 68 plate Grand Master of the Sabbath');

const lucifer = ENTRIES.find(e => e.id === 'lucifer');
assert.ok(lucifer && lucifer.hasPlate && lucifer.plate === 'plates/lucifer.jpg' && lucifer.category === 'demon' && lucifer.nameKo.includes('루시퍼'), 'Lucifer 68 plate Monarch of the East');

const lamiesPlate = ENTRIES.find(e => e.id === 'e2309-lamies');
assert.ok(lamiesPlate && lamiesPlate.hasPlate && lamiesPlate.nameKo.includes('라미아 무리'), 'Lamies illustrated in-text desert fiends');

const lapons = ENTRIES.find(e => e.id === 'e2325-lapons');
assert.ok(lapons && lapons.hasPlate && lapons.nameKo.includes('사미족'), 'Lapons Sami shamans illustrated');

const lavater = ENTRIES.find(e => e.id === 'e2334-lavaterjeangaspard');
assert.ok(lavater && lavater.hasPlate && lavater.nameKo.includes('라바터'), 'Lavater physiognomy illustrated');

const leonIII = ENTRIES.find(e => e.id === 'e2357-leoniii');
assert.ok(leonIII && leonIII.hasPlate && leonIII.nameKo.includes('교황 레오 3세'), 'Pope Leo III illustrated');

const lieder = ENTRIES.find(e => e.id === 'e2384-liedermadeleine');
assert.ok(lieder && lieder.hasPlate && lieder.nameKo.includes('마들렌 리더'), 'Madeleine Lieder possessed illustrated');

const lievre = ENTRIES.find(e => e.id === 'e2385-lievre');
assert.ok(lievre && lievre.hasPlate && lievre.nameKo.includes('토끼'), 'Lievre hare superstition illustrated');

const ligature = ENTRIES.find(e => e.id === 'e2387-ligature');
assert.ok(ligature && ligature.hasPlate && ligature.nameKo.includes('리가튀르'), 'Ligature knot magic illustrated');

const limacons = ENTRIES.find(e => e.id === 'e2390-limacons');
assert.ok(limacons && limacons.hasPlate && limacons.nameKo.includes('달팽이'), 'Limacons snails illustrated');

const lion = ENTRIES.find(e => e.id === 'e2395-lion');
assert.ok(lion && lion.hasPlate && lion.nameKo.includes('사자'), 'Lion magical virtues illustrated');

const louisXIII = ENTRIES.find(e => e.id === 'e2421-louisxiii');
assert.ok(louisXIII && louisXIII.hasPlate && louisXIII.nameKo.includes('루이 13세'), 'Louis XIII king illustrated');

const louisHongrie = ENTRIES.find(e => e.id === 'e2423-louisdehongrie');
assert.ok(louisHongrie && louisHongrie.hasPlate && louisHongrie.nameKo.includes('러요시 2세'), 'Louis of Hungary Mohacs omens illustrated');

const loup = ENTRIES.find(e => e.id === 'e2425-loup');
assert.ok(loup && loup.hasPlate && loup.nameKo.includes('늑대'), 'Loup wolf demonology illustrated');

const ludlam = ENTRIES.find(e => e.id === 'e2437-ludlam');
assert.ok(ludlam && ludlam.hasPlate && ludlam.nameKo.includes('러들럼'), 'Mother Ludlam cave fairy illustrated');

const luricaunes = ENTRIES.find(e => e.id === 'e2444-luricaunes');
assert.ok(luricaunes && luricaunes.hasPlate && luricaunes.nameKo.includes('루리카운'), 'Luricaunes Irish brownies illustrated');

const luther = ENTRIES.find(e => e.id === 'e2448-luthermartin');
assert.ok(luther && luther.hasPlate && luther.nameKo.includes('마르틴 루터'), 'Martin Luther devil encounters illustrated');

const lynx = ENTRIES.find(e => e.id === 'e2458-lynx');
assert.ok(lynx && lynx.hasPlate && lynx.nameKo.includes('스라소니'), 'Lynx penetrating vision illustrated');

const legions = ENTRIES.find(e => e.id === 'e2348-legions');
assert.ok(legions && legions.category === 'demon' && legions.nameKo.includes('지옥 군단론'), 'Legions of Hell demon hierarchy');

const leviathan = ENTRIES.find(e => e.id === 'e2375-leviathan');
assert.ok(leviathan && leviathan.category === 'demon' && leviathan.nameKo.includes('레비아탄'), 'Leviathan grand admiral of Hell');

const lilith = ENTRIES.find(e => e.id === 'e2388-lilith');
assert.ok(lilith && lilith.category === 'demon' && lilith.nameKo.includes('릴리트'), 'Lilith queen of succubi');

const loudun = ENTRIES.find(e => e.id === 'e2418-loudun');
assert.ok(loudun && loudun.category === 'superstition' && loudun.nameKo.includes('루됭'), 'Loudun possessions scandal');

const loupsGarous = ENTRIES.find(e => e.id === 'e2428-loupsgarous');
assert.ok(loupsGarous && loupsGarous.category === 'superstition' && loupsGarous.nameKo.includes('늑대인간'), 'Loups-garous werewolves history');

const louviers = ENTRIES.find(e => e.id === 'e2429-louvierspossessionde');
assert.ok(louviers && louviers.category === 'superstition' && louviers.nameKo.includes('루비에'), 'Louviers convent possessions');

const lutins = ENTRIES.find(e => e.id === 'e2449-lutins');
assert.ok(lutins && lutins.category === 'myth' && lutins.nameKo.includes('뤼탱'), 'Lutins French house goblins');

const lycanthropie = ENTRIES.find(e => e.id === 'e2454-lycanthropie');
assert.ok(lycanthropie && lycanthropie.category === 'superstition' && lycanthropie.nameKo.includes('라이칸스로피'), 'Lycanthropy mental delusion');

const lycaon = ENTRIES.find(e => e.id === 'e2455-lycaon');
assert.ok(lycaon && lycaon.category === 'myth' && lycaon.nameKo.includes('뤼카온'), 'Lycaon first werewolf of Arcadia');

// M section audit assertions (271 entries, 33 illustrated)
const mEntries = ENTRIES.filter(e => e.letter === 'M');
assert.equal(mEntries.length, 271, 'M section must contain exactly 271 entries (after L boundary fix)');

const mIllustrated = mEntries.filter(e => e.hasPlate);
assert.equal(mIllustrated.length, 33, 'M section must contain exactly 33 illustrated entries');

const malphas = ENTRIES.find(e => e.id === 'malphas');
assert.ok(malphas && malphas.hasPlate && malphas.plate === 'plates/malphas.jpg' && malphas.category === 'demon' && malphas.legions === 40 && malphas.nameKo.includes('말파스'), 'Malphas 68 plate demon President with 40 legions');

const mammon = ENTRIES.find(e => e.id === 'mammon');
assert.ok(mammon && mammon.hasPlate && mammon.plate === 'plates/mammon.jpg' && mammon.category === 'demon' && mammon.nameKo.includes('마몬'), 'Mammon 68 plate demon of avarice');

const marchocias = ENTRIES.find(e => e.id === 'marchocias');
assert.ok(marchocias && marchocias.hasPlate && marchocias.plate === 'plates/marchocias.jpg' && marchocias.category === 'demon' && marchocias.legions === 30 && marchocias.nameKo.includes('마르코시아스'), 'Marchosias 68 plate demon Marquis with 30 legions');

const melchom = ENTRIES.find(e => e.id === 'melchom');
assert.ok(melchom && melchom.hasPlate && melchom.plate === 'plates/melchom.jpg' && melchom.category === 'demon' && melchom.nameKo.includes('멜콤'), 'Melchom 68 plate purse-bearing paymaster demon');

const moloch = ENTRIES.find(e => e.id === 'moloch');
assert.ok(moloch && moloch.hasPlate && moloch.plate === 'plates/moloch.jpg' && moloch.category === 'demon' && moloch.nameKo.includes('몰록'), 'Moloch 68 plate Prince of Tears');

const mycale = ENTRIES.find(e => e.id === 'mycale');
assert.ok(mycale && mycale.hasPlate && mycale.plate === 'plates/mycale.jpg' && mycale.category === 'myth' && mycale.nameKo.includes('미칼레'), 'Mycale 68 plate Thessalian moon-drawing sorceress');

const mainPlate = ENTRIES.find(e => e.id === 'e2486-main');
assert.ok(mainPlate && mainPlate.hasPlate && mainPlate.nameKo.includes('손과 수상술'), 'Main chiromancy illustrated');

const mainfroi = ENTRIES.find(e => e.id === 'e2489-mainfroi');
assert.ok(mainfroi && mainfroi.hasPlate && mainfroi.nameKo.includes('만프레디'), 'Mainfroi Manfred king illustrated');

const marat = ENTRIES.find(e => e.id === 'e2530-marat');
assert.ok(marat && marat.hasPlate && marat.nameKo.includes('장폴 마라'), 'Marat demon of Terror illustrated');

const merlin = ENTRIES.find(e => e.id === 'e2618-merlin');
assert.ok(merlin && merlin.hasPlate && merlin.nameKo.includes('마법사 멀린'), 'Merlin the enchanter illustrated');

const mort = ENTRIES.find(e => e.id === 'e2697-mort');
assert.ok(mort && mort.hasPlate && mort.nameKo.includes('죽음의 신'), 'Mort Grim Reaper illustrated');

const mozart = ENTRIES.find(e => e.id === 'e2707-mozart');
assert.ok(mozart && mozart.hasPlate && mozart.nameKo.includes('모차르트'), 'Mozart Requiem illustrated');

const muncer = ENTRIES.find(e => e.id === 'e2714-muncerthomas');
assert.ok(muncer && muncer.hasPlate && muncer.nameKo.includes('토마스 뮌처'), 'Thomas Muncer illustrated');

const myomancie = ENTRIES.find(e => e.id === 'e2728-myomancie');
assert.ok(myomancie && myomancie.hasPlate && myomancie.nameKo.includes('쥐 점술'), 'Myomancie rat divination illustrated');

const mephisto = ENTRIES.find(e => e.id === 'e2610-mephistopheles');
assert.ok(mephisto && mephisto.category === 'demon' && mephisto.nameKo.includes('메피스토펠레스'), 'Mephistopheles demon of Faust');

const morax = ENTRIES.find(e => e.id === 'e2690-morax');
assert.ok(morax && morax.category === 'demon' && morax.legions === 36 && morax.nameKo.includes('모락스'), 'Morax Earl and President with 36 legions');

const murmur = ENTRIES.find(e => e.id === 'e2718-murmur');
assert.ok(murmur && murmur.category === 'demon' && murmur.legions === 30 && murmur.nameKo.includes('무르무르'), 'Murmur Duke and Earl with 30 legions');

const mastication = ENTRIES.find(e => e.id === 'e2568-mastication');
assert.ok(mastication && mastication.category === 'superstition' && mastication.nameKo.includes('시체 저작'), 'Mastication of the dead vampire shroud chewing');

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
