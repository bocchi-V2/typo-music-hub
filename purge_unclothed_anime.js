const fs = require('fs');

console.log('🚀 Starting Deep Purge of All Unclothed, Topless, Bikini, and Ecchi Anime...');

const content = fs.readFileSync('data.js', 'utf8');
const animesMatch = content.match(/const ANIMES = (\[[\s\S]*?\]);/);
if (!animesMatch) {
  console.error('ANIMES not found');
  process.exit(1);
}

const animes = eval(animesMatch[1]);
console.log('Original anime count:', animes.length);

// Comprehensive list of titles with naked/topless/bikini/ecchi/unclothed characters:
const UNCLOTHED_BAN_LIST = [
  'undead unluck', // Andy is literally naked with mosaic
  'free!: eternal summer', // topless male swimmers
  'free!',
  'grand blue', // naked drunk men
  'baki', // topless fighters
  'kill la kill', // naked / skimpy battle gear
  'no game no life', // naked bath scenes
  'dance in the vampire bund', // naked vampire
  'ichiban ushiro no daimaou', // Demon King Daimao naked girls
  'isekai maou', // How Not to Summon a Demon Lord slave girls
  'how not to summon a demon lord',
  'yuusha ni narenakatta', // Yusibu unclothed
  'yusibu',
  'air gear', // topless Simca
  '2.5 dimensional seduction', // cosplay bikini
  '2.5 jigen no ririsa',
  'bunny girl senpai', // bunny leotard
  'rascal does not dream of bunny girl',
  'my dress-up darling', // underwear / bikini
  'sono bisque doll',
  'panty & stocking', // stripping
  'citrus', // yuri naked
  'tasogare otome', // ghost naked
  'dusk maiden of amnesia',
  'gokukoku no brynhildr', // test tube naked girls
  'brynhildr in the darkness',
  'arifureta', // Shea/Yue fanservice
  'saenai heroine', // Saekano fanservice
  'saekano',
  'taimadou gakuen', // 35th test platoon
  'antimagic academy',
  'medaka box',
  'seiken tsukai no world break',
  'world break',
  'taboo tattoo',
  'bokutachi wa benkyou ga dekinai',
  'we never learn',
  'magical warfare',
  'plastic neesan',
  'rail wars',
  'seitokai no ichizon',
  'dumbbell nan-kilo moteru', // gym bikini/bra
  'how heavy are the dumbbells',
  '11eyes',
  'big order',
  'rent-a-girlfriend',
  'kanojo, okarishimasu',
  '5-toubun no hanayome',
  'the quintessential quintuplets',
  'netoge no yome',
  'and you thought there is never a girl online',
  'musaigen no phantom world',
  'myriad colors phantom world',
  'haiyore! nyaruko-san',
  'baka to test',
  'seto no hanayome',
  'shinchou yuusha',
  'cautious hero',
  'absolute duo',
  'berserk', // full nudity
  'cyberpunk: edgerunners', // Lucy naked on moon/ice bath
  'made in abyss', // unclothed checkup
  'chobits', // naked android
  'reze-hen', // naked swimming
  'dan da dan', // alien abduction unclothed
  'dandadan',
  'ranma', // female Ranma naked bath
  'shingeki no bahamut',
  'rage of bahamut',
  'gabriel dropout',
  'amagami ss',
  'maoyu',
  'pseudo harem',
  'kakegurui',
  'nanatsu no taizai',
  'the seven deadly sins',
  'tengen toppa gurren lagann', // Yoko tiny bikini
  'gurren lagann',
  'fairy tail', // Lucy stripped
  'soul eater not',
  'chaos;head',
  'devils line',
  'fuuka',
  'gakusen toshi asterisk',
  'the asterisk war',
  'konosuba', // Darkness bondage/naked bath
  'kono subarashii',
  'chainsaw man', // bathroom breast grabbing / bath scenes
  'overlord', // Albedo naked Ainz pillow
  'misfit of demon king academy',
  'maou gakuin',
  'gate: jieitai',
  'extra edition', // SAO bikini pool
  'aho girl',
  'darwin\'s game',
  'ryuugajou nanana',
  'kancolle',
  'kantai collection',
  'dagashi kashi',
  'beelzebub', // baby Beel is completely naked
  'mushoku tensei', // Rudeus panty/lewd
  'goblin slayer', // naked rape scene
  'uzumaki', // naked spiral bodies
  'akame ga kill',
  'guilty crown',
  'd-frag',
  'hanasaku iroha', // episode 3 bondage
  'mangaka-san to assistant-san',
  'binbougami ga',
  'white album 2',
  'kino no tabi: the beautiful world - the animated series',
  'strike witches',
  'vividred',
  'grenadier',
  'najica',
  'aika',
  'valkyrie drive',
  'food wars',
  'shokugeki',
  'highschool of the dead',
  'hotd',
  'corpse party',
  'another',
  'gleipnir',
  'elfen lied',
  'devilman',
  'devil survivor',
  'mayoiga',
  'shiki'
];

// Rich pool of 100% wholesome, clean, clothed masterpieces:
const SFW_POOL = [
  {
    name: "Frieren: Beyond Journey's End",
    nameTH: "คำอธิษฐานในวันที่จากลา Frieren",
    genre: ["แฟนตาซี", "ผจญภัย", "ดราม่า", "อบอุ่นหัวใจ"],
    coverUrl: "https://media.kitsu.app/anime/46170/poster_image/medium-df0d9f0322baebc8a5146c2439a341b5.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1015/138006.jpg",
    anifumeUrl: "https://anifume.com/?s=Frieren",
    mood: "calm"
  },
  {
    name: "Delicious in Dungeon",
    nameTH: "สูตรลับตำรับดันเจี้ยน (Dungeon Meshi)",
    genre: ["แฟนตาซี", "คอมเมดี้", "ผจญภัย", "ทำอาหาร"],
    coverUrl: "https://media.kitsu.app/anime/46313/poster_image/medium-bb2001fa79e436fa6c5c7d8ef11bc76f.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1429/140224.jpg",
    anifumeUrl: "https://anifume.com/?s=Dungeon%20Meshi",
    mood: "happy"
  },
  {
    name: "Bocchi the Rock!",
    nameTH: "บ็อจจิ เดอะ ร็อก!",
    genre: ["คอมเมดี้", "ดนตรี", "ชีวิตประจำวัน"],
    coverUrl: "https://media.kitsu.app/anime/44196/poster_image/medium-64fa78ba8fcbb1405b5832a884ef4606.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1448/127956.jpg",
    anifumeUrl: "https://anifume.com/?s=Bocchi%20the%20Rock",
    mood: "hype"
  },
  {
    name: "Spy x Family",
    nameTH: "สปาย × แฟมิลี",
    genre: ["แอ็คชั่น", "คอมเมดี้", "ครอบครัว"],
    coverUrl: "https://media.kitsu.app/anime/45343/poster_image/medium-6330ce4f72ff37c89fca6cb942ee4ad8.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1441/122795.jpg",
    anifumeUrl: "https://anifume.com/?s=Spy%20x%20Family",
    mood: "happy"
  },
  {
    name: "Spy x Family Code: White",
    nameTH: "สปาย × แฟมิลี โค้ด ไวท์",
    genre: ["แอ็คชั่น", "คอมเมดี้", "ครอบครัว"],
    coverUrl: "https://media.kitsu.app/anime/46949/poster_image/medium-ef1e7c53d08c5c79be7bebe58a0e8892.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1307/138499.jpg",
    anifumeUrl: "https://anifume.com/?s=Spy%20x%20Family%20Code%20White",
    mood: "happy"
  },
  {
    name: "Haikyuu!!",
    nameTH: "ไฮคิว!! คู่ตบฟ้าประทาน",
    genre: ["กีฬา", "ดราม่า", "มิตรภาพ"],
    coverUrl: "https://media.kitsu.app/anime/8133/poster_image/medium-b61ad6f316f73111867c29661f006456.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/7/59931.jpg",
    anifumeUrl: "https://anifume.com/?s=Haikyuu",
    mood: "hype"
  },
  {
    name: "Haikyuu!! The Dumpster Battle",
    nameTH: "ไฮคิว!! ศึกที่กองขยะ",
    genre: ["กีฬา", "ดราม่า", "มิตรภาพ"],
    coverUrl: "https://media.kitsu.app/anime/46487/poster_image/medium-8efcf49b38cf4e883582ca0e80b85292.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1792/141047.jpg",
    anifumeUrl: "https://anifume.com/?s=Haikyuu%20Dumpster%20Battle",
    mood: "hype"
  },
  {
    name: "Slam Dunk",
    nameTH: "สแลมดังก์",
    genre: ["กีฬา", "คอมเมดี้", "ดราม่า"],
    coverUrl: "https://media.kitsu.app/anime/207/poster_image/medium-f661dfd694cb9b09ff44ffebdfa7b97a.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/12/8687.jpg",
    anifumeUrl: "https://anifume.com/?s=Slam%20Dunk",
    mood: "hype"
  },
  {
    name: "The First Slam Dunk",
    nameTH: "เดอะ เฟิสต์ สแลมดังก์",
    genre: ["กีฬา", "ดราม่า", "โรงเรียน"],
    coverUrl: "https://media.kitsu.app/anime/44053/poster_image/medium-20516fc292f5fa03328221bc9891fb4e.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1169/129759.jpg",
    anifumeUrl: "https://anifume.com/?s=The%20First%20Slam%20Dunk",
    mood: "hype"
  },
  {
    name: "Mob Psycho 100",
    nameTH: "ม็อบไซโค 100 คนพลังจิต",
    genre: ["แอ็คชั่น", "คอมเมดี้", "เหนือธรรมชาติ"],
    coverUrl: "https://media.kitsu.app/anime/11578/poster_image/medium-bbf5a2e5cae1f3fe118a803b9016e7dc.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/8/80356.jpg",
    anifumeUrl: "https://anifume.com/?s=Mob%20Psycho%20100",
    mood: "hype"
  },
  {
    name: "Mob Psycho 100 III",
    nameTH: "ม็อบไซโค 100 คนพลังจิต ซีซั่น 3",
    genre: ["แอ็คชั่น", "คอมเมดี้", "การเติบโต"],
    coverUrl: "https://media.kitsu.app/anime/45281/poster_image/medium-ea88a3813959bc9d5ecdc942aa341777.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1228/127136.jpg",
    anifumeUrl: "https://anifume.com/?s=Mob%20Psycho%20100%20III",
    mood: "hype"
  },
  {
    name: "Dr. Stone",
    nameTH: "ดร.สโตน",
    genre: ["ผจญภัย", "วิทยาศาสตร์", "ไซไฟ"],
    coverUrl: "https://media.kitsu.app/anime/41999/poster_image/medium-f6dfefdb66f393eeae2cff8fc6f8b9d6.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1613/102576.jpg",
    anifumeUrl: "https://anifume.com/?s=Dr.%20Stone",
    mood: "hype"
  },
  {
    name: "Dr. Stone: New World",
    nameTH: "ดร.สโตน: โลกใบใหม่ ซีซั่น 3",
    genre: ["ผจญภัย", "วิทยาศาสตร์", "การค้นพบ"],
    coverUrl: "https://media.kitsu.app/anime/45974/poster_image/medium-335c0293eb3e9663d1a84f37471257fe.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1199/134444.jpg",
    anifumeUrl: "https://anifume.com/?s=Dr.%20Stone%20New%20World",
    mood: "hype"
  },
  {
    name: "Wind Breaker",
    nameTH: "วินด์เบรกเกอร์ นักเรียนสายบู๊",
    genre: ["แอ็คชั่น", "โรงเรียน", "มิตรภาพ"],
    coverUrl: "https://media.kitsu.app/anime/47039/poster_image/medium-1ec1fa6e9f656082cbba21eb0c80081e.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1795/141058.jpg",
    anifumeUrl: "https://anifume.com/?s=Wind%20Breaker",
    mood: "hype"
  },
  {
    name: "Mashle: Magic and Muscles",
    nameTH: "ศึกโลกเวทมนตร์คนพลังกล้าม",
    genre: ["แอ็คชั่น", "คอมเมดี้", "เวทมนตร์"],
    coverUrl: "https://media.kitsu.app/anime/46229/poster_image/medium-a25e2aa6a8bb1cf5b47a3e7fc9da88a0.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1435/134547.jpg",
    anifumeUrl: "https://anifume.com/?s=Mashle",
    mood: "hype"
  },
  {
    name: "Kaiju No. 8",
    nameTH: "ไคจูหมายเลข 8",
    genre: ["แอ็คชั่น", "ไซไฟ", "ฮีโร่"],
    coverUrl: "https://media.kitsu.app/anime/46307/poster_image/medium-3e3cb642bc222530eb74da924fcbe9e6.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1370/140362.jpg",
    anifumeUrl: "https://anifume.com/?s=Kaiju%20No.%208",
    mood: "hype"
  },
  {
    name: "Blue Lock",
    nameTH: "ขังดวลแข้ง",
    genre: ["กีฬา", "จิตวิทยา", "ดราม่า"],
    coverUrl: "https://media.kitsu.app/anime/44917/poster_image/medium-b3f465d34208a32bbd718b53298a0c20.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1258/126929.jpg",
    anifumeUrl: "https://anifume.com/?s=Blue%20Lock",
    mood: "hype"
  },
  {
    name: "Detective Conan",
    nameTH: "ยอดนักสืบจิ๋วโคนัน",
    genre: ["สืบสวน", "ปริศนา", "ดราม่า"],
    coverUrl: "https://media.kitsu.app/anime/210/poster_image/medium-8ef64c519ba29497d31fe186e8da49f4.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/7/75199.jpg",
    anifumeUrl: "https://anifume.com/?s=Detective%20Conan",
    mood: "calm"
  },
  {
    name: "Detective Conan: The Million-dollar Pentagram",
    nameTH: "ยอดนักสืบจิ๋วโคนัน: ปริศนาปราการ 1 ล้านดอลลาร์",
    genre: ["สืบสวน", "แอ็คชั่น", "การผจญภัย"],
    coverUrl: "https://media.kitsu.app/anime/47990/poster_image/medium-d806a66a1d48c08fc46fa7dfc418041a.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1231/141011.jpg",
    anifumeUrl: "https://anifume.com/?s=Million%20dollar%20Pentagram",
    mood: "hype"
  },
  {
    name: "Detective Conan: Black Iron Submarine",
    nameTH: "ยอดนักสืบจิ๋วโคนัน: มฤตยูใต้น้ำทมิฬ",
    genre: ["สืบสวน", "แอ็คชั่น", "ระทึกขวัญ"],
    coverUrl: "https://media.kitsu.app/anime/46665/poster_image/medium-b67f67ad2fc9062eb295b95579978a3c.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1066/133642.jpg",
    anifumeUrl: "https://anifume.com/?s=Black%20Iron%20Submarine",
    mood: "hype"
  },
  {
    name: "Kuroko's Basketball",
    nameTH: "คุโรโกะ โนะ บาสเก็ต",
    genre: ["กีฬา", "โรงเรียน", "มิตรภาพ"],
    coverUrl: "https://media.kitsu.app/anime/6698/poster_image/medium-996ff52d7ee8f0a07e997ca9387e3820.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/11/50453.jpg",
    anifumeUrl: "https://anifume.com/?s=Kuroko",
    mood: "hype"
  },
  {
    name: "Spirited Away",
    nameTH: "มิติวิญญาณมหัศจรรย์",
    genre: ["แฟนตาซี", "ผจญภัย", "ครอบครัว"],
    coverUrl: "https://media.kitsu.app/anime/186/poster_image/medium-976fae4cb604bb978d2b270a3c75abf1.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/6/79597.jpg",
    anifumeUrl: "https://anifume.com/?s=Spirited%20Away",
    mood: "calm"
  },
  {
    name: "Princess Mononoke",
    nameTH: "เจ้าหญิงจิตวิญญาณแห่งพงไพร",
    genre: ["แฟนตาซี", "ผจญภัย", "ธรรมชาติ"],
    coverUrl: "https://media.kitsu.app/anime/187/poster_image/medium-52ee6cb439e6a0d2685955a90ad11f93.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/7/75919.jpg",
    anifumeUrl: "https://anifume.com/?s=Princess%20Mononoke",
    mood: "hype"
  },
  {
    name: "Howl's Moving Castle",
    nameTH: "ปราสาทเวทมนตร์ของฮาวล์",
    genre: ["แฟนตาซี", "โรแมนติก", "ผจญภัย"],
    coverUrl: "https://media.kitsu.app/anime/424/poster_image/medium-50d75a1d7c3ea406ba26978cece57f49.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/5/75810.jpg",
    anifumeUrl: "https://anifume.com/?s=Howl%27s%20Moving%20Castle",
    mood: "calm"
  },
  {
    name: "My Neighbor Totoro",
    nameTH: "โทโทโร่เพื่อนรัก",
    genre: ["แฟนตาซี", "ครอบครัว", "ธรรมชาติ"],
    coverUrl: "https://media.kitsu.app/anime/720/poster_image/medium-aa187fe7d6f51cb3200b3438a2e7c4f6.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/4/75923.jpg",
    anifumeUrl: "https://anifume.com/?s=Totoro",
    mood: "calm"
  },
  {
    name: "Kiki's Delivery Service",
    nameTH: "แม่มดน้อยกิกิ",
    genre: ["แฟนตาซี", "การเติบโต", "อบอุ่น"],
    coverUrl: "https://media.kitsu.app/anime/480/poster_image/medium-641a9dbb2eb7e974e2d3dfae8156157f.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1167/116641.jpg",
    anifumeUrl: "https://anifume.com/?s=Kiki%27s%20Delivery%20Service",
    mood: "calm"
  },
  {
    name: "Ponyo",
    nameTH: "โปเนียว ธิดาสมุทรผจญภัย",
    genre: ["แฟนตาซี", "ผจญภัย", "ครอบครัว"],
    coverUrl: "https://media.kitsu.app/anime/2681/poster_image/medium-c598be604eb651c6e11894a45f92ffb1.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/10/75914.jpg",
    anifumeUrl: "https://anifume.com/?s=Ponyo",
    mood: "happy"
  },
  {
    name: "Castle in the Sky",
    nameTH: "ลาพิวต้า พลิกตำนานเหนือเวหา",
    genre: ["ผจญภัย", "แฟนตาซี", "ไซไฟ"],
    coverUrl: "https://media.kitsu.app/anime/478/poster_image/medium-b6ee08f0a1c1d0ba00a89456eeea83bf.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1205/116640.jpg",
    anifumeUrl: "https://anifume.com/?s=Castle%20in%20the%20Sky",
    mood: "hype"
  },
  {
    name: "Whisper of the Heart",
    nameTH: "วันนั้น...วันไหน หัวใจจะเป็นสีชมพู",
    genre: ["โรแมนติก", "ดราม่า", "แรงบันดาลใจ"],
    coverUrl: "https://media.kitsu.app/anime/524/poster_image/medium-0e28f325ad87a8ca1b9ea0b8eb9bcf53.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/4/75808.jpg",
    anifumeUrl: "https://anifume.com/?s=Whisper%20of%20the%20Heart",
    mood: "calm"
  },
  {
    name: "The Tale of the Princess Kaguya",
    nameTH: "เจ้าหญิงกระบอกไม้ไผ่",
    genre: ["แฟนตาซี", "ดราม่า", "ตำนาน"],
    coverUrl: "https://media.kitsu.app/anime/5488/poster_image/medium-95e0c5928d3ef7ffaa12fcba18c89424.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1935/129464.jpg",
    anifumeUrl: "https://anifume.com/?s=Princess%20Kaguya",
    mood: "calm"
  },
  {
    name: "The Wind Rises",
    nameTH: "ปีกแห่งฝัน วันแห่งรัก",
    genre: ["ดราม่า", "ประวัติศาสตร์", "ความฝัน"],
    coverUrl: "https://media.kitsu.app/anime/7281/poster_image/medium-0498b530c3095aa7e4e1a4f0bb447c2b.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1114/116642.jpg",
    anifumeUrl: "https://anifume.com/?s=The%20Wind%20Rises",
    mood: "calm"
  },
  {
    name: "The Cat Returns",
    nameTH: "เจ้าแมวยอดนักสืบ",
    genre: ["แฟนตาซี", "คอมเมดี้", "ผจญภัย"],
    coverUrl: "https://media.kitsu.app/anime/523/poster_image/medium-a2323e0ecf79b006ecfa0e50f555c1b6.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/5/75809.jpg",
    anifumeUrl: "https://anifume.com/?s=The%20Cat%20Returns",
    mood: "happy"
  },
  {
    name: "The Boy and the Heron",
    nameTH: "เด็กชายกับนกกระสา",
    genre: ["แฟนตาซี", "ผจญภัย", "การเติบโต"],
    coverUrl: "https://media.kitsu.app/anime/41198/poster_image/medium-355979eb46d03d360efbe37f44d15654.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1887/137530.jpg",
    anifumeUrl: "https://anifume.com/?s=The%20Boy%20and%20the%20Heron",
    mood: "calm"
  },
  {
    name: "Your Name",
    nameTH: "หลับตาฝัน ถึงชื่อเธอ",
    genre: ["โรแมนติก", "แฟนตาซี", "ดราม่า"],
    coverUrl: "https://media.kitsu.app/anime/11614/poster_image/medium-99b51fa1e7c5364188b0a996fbc3a830.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/5/87048.jpg",
    anifumeUrl: "https://anifume.com/?s=Your%20Name",
    mood: "sad"
  },
  {
    name: "Weathering With You",
    nameTH: "ฤดูฝัน ฉันมีเธอ",
    genre: ["โรแมนติก", "แฟนตาซี", "ดราม่า"],
    coverUrl: "https://media.kitsu.app/anime/41982/poster_image/medium-3c224f8dbecfc5f8df5650aa738bbd60.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1880/101146.jpg",
    anifumeUrl: "https://anifume.com/?s=Weathering%20With%20You",
    mood: "sad"
  },
  {
    name: "Suzume",
    nameTH: "การผนึกประตูของซูซูเมะ",
    genre: ["แฟนตาซี", "ผจญภัย", "ดราม่า"],
    coverUrl: "https://media.kitsu.app/anime/45506/poster_image/medium-796ba04a11fc1efcf1d7b3dc04423b08.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1105/133031.jpg",
    anifumeUrl: "https://anifume.com/?s=Suzume",
    mood: "hype"
  },
  {
    name: "5 Centimeters per Second",
    nameTH: "ยามซากุระร่วงโรย (5 cm/s)",
    genre: ["โรแมนติก", "ดราม่า", "ความทรงจำ"],
    coverUrl: "https://media.kitsu.app/anime/336/poster_image/medium-8ef64c519ba29497d31fe186e8da49f4.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/10/77561.jpg",
    anifumeUrl: "https://anifume.com/?s=5%20Centimeters%20per%20Second",
    mood: "sad"
  },
  {
    name: "The Garden of Words",
    nameTH: "ยามสายฝนโปรยปราย",
    genre: ["โรแมนติก", "ดราม่า", "สายฝน"],
    coverUrl: "https://media.kitsu.app/anime/7386/poster_image/medium-09ee0997c0ad8f2d59ae35e2c560ae8f.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/3/50429.jpg",
    anifumeUrl: "https://anifume.com/?s=Garden%20of%20Words",
    mood: "sad"
  },
  {
    name: "A Silent Voice",
    nameTH: "รักไร้เสียง (Koe no Katachi)",
    genre: ["ดราม่า", "โรงเรียน", "การให้อภัย"],
    coverUrl: "https://media.kitsu.app/anime/8935/poster_image/medium-637937861937ff7a898a9606d05fca1c.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1122/96442.jpg",
    anifumeUrl: "https://anifume.com/?s=Koe%20no%20Katachi",
    mood: "sad"
  },
  {
    name: "I Want to Eat Your Pancreas",
    nameTH: "ตับอ่อนเธอนั้น ขอฉันเถอะนะ",
    genre: ["ดราม่า", "โรแมนติก", "ความประทับใจ"],
    coverUrl: "https://media.kitsu.app/anime/13569/poster_image/medium-23a3beeb63999903c73fc52250ea5d63.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1760/94043.jpg",
    anifumeUrl: "https://anifume.com/?s=Kimi%20no%20Suizou%20wo%20Tabetai",
    mood: "sad"
  },
  {
    name: "Josee, the Tiger and the Fish",
    nameTH: "โจเซ่ กับเสือและหมู่ปลา",
    genre: ["ดราม่า", "โรแมนติก", "การก้าวข้ามขีดจำกัด"],
    coverUrl: "https://media.kitsu.app/anime/42663/poster_image/medium-bbf5a2e5cae1f3fe118a803b9016e7dc.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1706/110729.jpg",
    anifumeUrl: "https://anifume.com/?s=Josee",
    mood: "sad"
  },
  {
    name: "Belle",
    nameTH: "เบล เจ้าหญิงแห่งเสียงเพลง",
    genre: ["ดนตรี", "ไซไฟ", "ดราม่า"],
    coverUrl: "https://media.kitsu.app/anime/44040/poster_image/medium-bb2001fa79e436fa6c5c7d8ef11bc76f.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1917/116905.jpg",
    anifumeUrl: "https://anifume.com/?s=Belle",
    mood: "happy"
  },
  {
    name: "Summer Wars",
    nameTH: "สงครามฤดูร้อน",
    genre: ["ไซไฟ", "คอมเมดี้", "ครอบครัว"],
    coverUrl: "https://media.kitsu.app/anime/4144/poster_image/medium-99b51fa1e7c5364188b0a996fbc3a830.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1209/116639.jpg",
    anifumeUrl: "https://anifume.com/?s=Summer%20Wars",
    mood: "hype"
  },
  {
    name: "The Boy and the Beast",
    nameTH: "ศิษย์มหัศจรรย์กับอาจารย์พันธุ์อสูร",
    genre: ["ผจญภัย", "เหนือธรรมชาติ", "มิตรภาพ"],
    coverUrl: "https://media.kitsu.app/anime/8828/poster_image/medium-50d75a1d7c3ea406ba26978cece57f49.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/10/75916.jpg",
    anifumeUrl: "https://anifume.com/?s=The%20Boy%20and%20the%20Beast",
    mood: "hype"
  },
  {
    name: "Wolf Children",
    nameTH: "คู่จี๊ดชีวิตอัศจรรย์",
    genre: ["ดราม่า", "ครอบครัว", "ความรักของแม่"],
    coverUrl: "https://media.kitsu.app/anime/6727/poster_image/medium-df0d9f0322baebc8a5146c2439a341b5.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/9/35721.jpg",
    anifumeUrl: "https://anifume.com/?s=Wolf%20Children",
    mood: "calm"
  },
  {
    name: "The Girl Who Leapt Through Time",
    nameTH: "กระโดดจั๊มพ์ทะลุข้ามเวลา",
    genre: ["ไซไฟ", "โรแมนติก", "ดราม่า"],
    coverUrl: "https://media.kitsu.app/anime/1105/poster_image/medium-b61ad6f316f73111867c29661f006456.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1182/116638.jpg",
    anifumeUrl: "https://anifume.com/?s=The%20Girl%20Who%20Leapt%20Through%20Time",
    mood: "sad"
  },
  {
    name: "Words Bubble Up Like Soda Pop",
    nameTH: "ถ้อยคำเอ่อล้นด้วยหัวใจรัก",
    genre: ["โรแมนติก", "ดนตรี", "บทกวีไฮกุ"],
    coverUrl: "https://media.kitsu.app/anime/42498/poster_image/medium-1ec1fa6e9f656082cbba21eb0c80081e.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1376/115454.jpg",
    anifumeUrl: "https://anifume.com/?s=Words%20Bubble%20Up",
    mood: "calm"
  },
  {
    name: "Hotarubi no Mori e",
    nameTH: "สู่ป่าแห่งแสงหิ่งห้อย",
    genre: ["ดราม่า", "โรแมนติก", "ภูตผี"],
    coverUrl: "https://media.kitsu.app/anime/6154/poster_image/medium-aa187fe7d6f51cb3200b3438a2e7c4f6.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/9/34719.jpg",
    anifumeUrl: "https://anifume.com/?s=Hotarubi%20no%20Mori%20e",
    mood: "sad"
  },
  {
    name: "Violet Evergarden",
    nameTH: "ไวโอเล็ต เอเวอร์การ์เดน",
    genre: ["ดราม่า", "แฟนตาซี", "ความทรงจำ"],
    coverUrl: "https://media.kitsu.app/anime/11993/poster_image/medium-8ef64c519ba29497d31fe186e8da49f4.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1795/95088.jpg",
    anifumeUrl: "https://anifume.com/?s=Violet%20Evergarden",
    mood: "sad"
  },
  {
    name: "Violet Evergarden: The Movie",
    nameTH: "ไวโอเล็ต เอเวอร์การ์เดน เดอะมูฟวี่",
    genre: ["ดราม่า", "โรแมนติก", "บทสรุป"],
    coverUrl: "https://media.kitsu.app/anime/41444/poster_image/medium-796ba04a11fc1efcf1d7b3dc04423b08.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1825/110716.jpg",
    anifumeUrl: "https://anifume.com/?s=Violet%20Evergarden%20Movie",
    mood: "sad"
  },
  {
    name: "K-On!",
    nameTH: "เค-อง! ก๊วนดนตรีแป๋วแหวว",
    genre: ["ดนตรี", "คอมเมดี้", "ชีวิตประจำวัน"],
    coverUrl: "https://media.kitsu.app/anime/4089/poster_image/medium-aa187fe7d6f51cb3200b3438a2e7c4f6.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/10/76120.jpg",
    anifumeUrl: "https://anifume.com/?s=K-On",
    mood: "happy"
  },
  {
    name: "Hyouka",
    nameTH: "ปริศนาความทรงจำ (เฮียวกะ)",
    genre: ["สืบสวน", "โรงเรียน", "ชีวิตประจำวัน"],
    coverUrl: "https://media.kitsu.app/anime/6744/poster_image/medium-09ee0997c0ad8f2d59ae35e2c560ae8f.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/13/37083.jpg",
    anifumeUrl: "https://anifume.com/?s=Hyouka",
    mood: "calm"
  },
  {
    name: "Tamako Market",
    nameTH: "ตลาดป่วน ก๊วนทามาโกะ",
    genre: ["คอมเมดี้", "ชีวิตประจำวัน", "ความอบอุ่น"],
    coverUrl: "https://media.kitsu.app/anime/7292/poster_image/medium-1ec1fa6e9f656082cbba21eb0c80081e.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/12/47413.jpg",
    anifumeUrl: "https://anifume.com/?s=Tamako%20Market",
    mood: "happy"
  },
  {
    name: "Nichijou",
    nameTH: "สามัญชนคนกวนโอ๊ย",
    genre: ["คอมเมดี้", "แก๊ก", "โรงเรียน"],
    coverUrl: "https://media.kitsu.app/anime/5863/poster_image/medium-b61ad6f316f73111867c29661f006456.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/3/75624.jpg",
    anifumeUrl: "https://anifume.com/?s=Nichijou",
    mood: "happy"
  },
  {
    name: "Non Non Biyori",
    nameTH: "สาวใสหัวใจบ้านทุ่ง",
    genre: ["ชนบท", "ชีวิตประจำวัน", "ผ่อนคลาย"],
    coverUrl: "https://media.kitsu.app/anime/7512/poster_image/medium-f6dfefdb66f393eeae2cff8fc6f8b9d6.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/11/54685.jpg",
    anifumeUrl: "https://anifume.com/?s=Non%20Non%20Biyori",
    mood: "calm"
  },
  {
    name: "Yuru Camp△",
    nameTH: "แคมป์สบายสไตล์สาว ม.ปลาย",
    genre: ["แคมปิ้ง", "ธรรมชาติ", "ผ่อนคลาย"],
    coverUrl: "https://media.kitsu.app/anime/13258/poster_image/medium-df0d9f0322baebc8a5146c2439a341b5.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/4/89877.jpg",
    anifumeUrl: "https://anifume.com/?s=Yuru%20Camp",
    mood: "calm"
  },
  {
    name: "Barakamon",
    nameTH: "เกาะมีฮา คนมีเฮ",
    genre: ["คอมเมดี้", "การเติบโต", "ชนบท"],
    coverUrl: "https://media.kitsu.app/anime/8014/poster_image/medium-64fa78ba8fcbb1405b5832a884ef4606.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/10/65481.jpg",
    anifumeUrl: "https://anifume.com/?s=Barakamon",
    mood: "happy"
  },
  {
    name: "A Place Further than the Universe",
    nameTH: "ดินแดนที่ห่างไกลยิ่งกว่าอวกาศ",
    genre: ["ผจญภัย", "การเดินทาง", "มิตรภาพ"],
    coverUrl: "https://media.kitsu.app/anime/13596/poster_image/medium-6330ce4f72ff37c89fca6cb942ee4ad8.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1291/90799.jpg",
    anifumeUrl: "https://anifume.com/?s=A%20Place%20Further%20than%20the%20Universe",
    mood: "hype"
  },
  {
    name: "Little Witch Academia",
    nameTH: "โรงเรียนแม่มดน้อย",
    genre: ["เวทมนตร์", "แฟนตาซี", "ความฝัน"],
    coverUrl: "https://media.kitsu.app/anime/12148/poster_image/medium-ea88a3813959bc9d5ecdc942aa341777.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/8/84227.jpg",
    anifumeUrl: "https://anifume.com/?s=Little%20Witch%20Academia",
    mood: "happy"
  },
  {
    name: "Natsume's Book of Friends",
    nameTH: "นัตสึเมะกับบันทึกพิศวง",
    genre: ["ภูตผี", "ดราม่า", "อบอุ่นหัวใจ"],
    coverUrl: "https://media.kitsu.app/anime/3092/poster_image/medium-3e3cb642bc222530eb74da924fcbe9e6.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1487/93557.jpg",
    anifumeUrl: "https://anifume.com/?s=Natsume%20Yuujinchou",
    mood: "calm"
  },
  {
    name: "Mushishi",
    nameTH: "กีฏจารย์กับสัตว์ประหลาด",
    genre: ["ลึกลับ", "ธรรมชาติ", "ปรัชญา"],
    coverUrl: "https://media.kitsu.app/anime/417/poster_image/medium-b61ad6f316f73111867c29661f006456.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/2/73862.jpg",
    anifumeUrl: "https://anifume.com/?s=Mushishi",
    mood: "calm"
  },
  {
    name: "Fullmetal Alchemist: Brotherhood",
    nameTH: "แขนกลคนแปรธาตุ บราเธอร์ฮูด",
    genre: ["แอ็คชั่น", "ผจญภัย", "ดราม่า"],
    coverUrl: "https://media.kitsu.app/anime/3936/poster_image/medium-1ec1fa6e9f656082cbba21eb0c80081e.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
    anifumeUrl: "https://anifume.com/?s=Fullmetal%20Alchemist%20Brotherhood",
    mood: "hype"
  },
  {
    name: "Steins;Gate",
    nameTH: "สไตน์ส;เกท",
    genre: ["ไซไฟ", "ระทึกขวัญ", "ข้ามเวลา"],
    coverUrl: "https://media.kitsu.app/anime/5610/poster_image/medium-09ee0997c0ad8f2d59ae35e2c560ae8f.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/5/73797.jpg",
    anifumeUrl: "https://anifume.com/?s=Steins;Gate",
    mood: "hype"
  },
  {
    name: "Run with the Wind",
    nameTH: "ลมพัดผ่านเรา (Kaze ga Tsuyoku Fuiteiru)",
    genre: ["กีฬา", "วิ่งมาราธอน", "การเติบโต"],
    coverUrl: "https://media.kitsu.app/anime/41344/poster_image/medium-bb2001fa79e436fa6c5c7d8ef11bc76f.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1066/95995.jpg",
    anifumeUrl: "https://anifume.com/?s=Run%20with%20the%20Wind",
    mood: "hype"
  },
  {
    name: "Bakuman",
    nameTH: "วัยซนคนการ์ตูน",
    genre: ["คอมเมดี้", "ดราม่า", "มังงะ"],
    coverUrl: "https://media.kitsu.app/anime/5241/poster_image/medium-df0d9f0322baebc8a5146c2439a341b5.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/6/26251.jpg",
    anifumeUrl: "https://anifume.com/?s=Bakuman",
    mood: "hype"
  },
  {
    name: "March Comes in Like a Lion",
    nameTH: "ตราบวันฟ้าใส (3-gatsu no Lion)",
    genre: ["ดราม่า", "โชงิ", "ความอบอุ่น"],
    coverUrl: "https://media.kitsu.app/anime/11440/poster_image/medium-f6dfefdb66f393eeae2cff8fc6f8b9d6.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/6/82898.jpg",
    anifumeUrl: "https://anifume.com/?s=March%20Comes%20in%20Like%20a%20Lion",
    mood: "calm"
  },
  {
    name: "Keep Your Hands Off Eizouken!",
    nameTH: "ชมรมอนิเมะสุดป่วน",
    genre: ["คอมเมดี้", "ความฝัน", "แอนิเมชั่น"],
    coverUrl: "https://media.kitsu.app/anime/42233/poster_image/medium-aa187fe7d6f51cb3200b3438a2e7c4f6.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1070/104771.jpg",
    anifumeUrl: "https://anifume.com/?s=Eizouken",
    mood: "happy"
  },
  {
    name: "Vivy: Fluorite Eye's Song",
    nameTH: "วิวี่ บทเพลงแห่งฟลูออไรท์",
    genre: ["ไซไฟ", "ดนตรี", "แอ็คชั่น"],
    coverUrl: "https://media.kitsu.app/anime/44034/poster_image/medium-64fa78ba8fcbb1405b5832a884ef4606.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1815/115453.jpg",
    anifumeUrl: "https://anifume.com/?s=Vivy",
    mood: "hype"
  },
  {
    name: "The Apothecary Diaries",
    nameTH: "สืบคดีปริศนาหมอยาตำรับโคมแดง",
    genre: ["สืบสวน", "ประวัติศาสตร์", "การแพทย์"],
    coverUrl: "https://media.kitsu.app/anime/46788/poster_image/medium-6330ce4f72ff37c89fca6cb942ee4ad8.jpeg",
    coverFallback: "https://cdn.myanimelist.net/images/anime/1708/138033.jpg",
    anifumeUrl: "https://anifume.com/?s=Apothecary%20Diaries",
    mood: "calm"
  }
];

let replacedCount = 0;
let sfwIdx = 0;

for (let i = 0; i < animes.length; i++) {
  const a = animes[i];
  const name = a.name.toLowerCase();
  const nameTH = (a.nameTH || '').toLowerCase();
  
  let shouldPurge = false;
  let matchedReason = '';

  for (const b of UNCLOTHED_BAN_LIST) {
    if (name.includes(b) || nameTH.includes(b)) {
      shouldPurge = true;
      matchedReason = b;
      break;
    }
  }

  if (shouldPurge) {
    const replacement = SFW_POOL[sfwIdx % SFW_POOL.length];
    sfwIdx++;
    console.log(`[REPLACING #${a.id}] "${a.name}" (${matchedReason}) -> "${replacement.name}"`);

    animes[i] = {
      id: a.id,
      name: replacement.name,
      nameTH: replacement.nameTH,
      genre: replacement.genre,
      coverUrl: replacement.coverUrl,
      coverFallback: replacement.coverFallback,
      anifumeUrl: replacement.anifumeUrl,
      mood: replacement.mood
    };
    replacedCount++;
  }
}

console.log(`\n✅ Finished! Replaced ${replacedCount} anime entries with 100% wholesome, fully-clothed SFW titles.`);
console.log('Final anime count:', animes.length);

// Replace in data.js
const updatedAnimesJson = JSON.stringify(animes, null, 2);
const newContent = content.replace(/const ANIMES = \[[\s\S]*?\];/, `const ANIMES = ${updatedAnimesJson};`);

fs.writeFileSync('data.js', newContent, 'utf8');
console.log('✅ Successfully updated data.js!');
