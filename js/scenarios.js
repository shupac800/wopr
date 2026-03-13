// 1957 Early Cold War Scenarios — USSR vs NATO
// All targets based on historical probable target lists from SAC Basic War Plan
// and Soviet Long Range Aviation targeting doctrine circa 1957.
// Narratives written in 1950s newsreel style.

const SCENARIOS_1957 = {};

// Active scenarios object — swapped by switchEra()
const SCENARIOS = {};

SCENARIOS_1957["SAC FIRST STRIKE"] = {
  narrative: "Ladies and gentlemen, we interrupt this broadcast with a bulletin of the gravest importance. Strategic Air Command has executed the Basic War Plan — a full preemptive atomic assault upon the Soviet Union. Over one thousand B-47 Stratojets and B-52 Stratofortresses are at this hour thundering across the Arctic Circle, each bearing the terrible swift sword of the hydrogen bomb. Their targets: the industrial heart of Red Russia — Moscow, Leningrad, Kiev, Sverdlovsk, and the sprawling war factories of the Urals. God help us all, for the die is cast.",
  waves: [
    { from: ["OMAHA", "COLORADO SPRINGS", "WASHINGTON DC"], to: ["MOSCOW", "LENINGRAD", "KIEV", "MINSK", "SVERDLOVSK"], delay: 0 },
    { from: ["SEATTLE", "SAN FRANCISCO", "ANCHORAGE"], to: ["VLADIVOSTOK", "KHABAROVSK", "IRKUTSK", "NOVOSIBIRSK", "PETROPAVLOVSK"], delay: 4000 },
    { from: ["BOSTON", "NORFOLK", "WASHINGTON DC"], to: ["MURMANSK", "ARCHANGELSK", "RIGA", "TALLINN", "GORKY"], delay: 7000 },
    { from: ["OMAHA", "DENVER", "DALLAS"], to: ["STALINGRAD", "CHELYABINSK", "OMSK", "KRASNOYARSK", "KAZAN"], delay: 11000 },
    { from: ["LONDON", "PARIS"], to: ["WARSAW", "EAST BERLIN", "PRAGUE", "BUDAPEST"], delay: 9000 },
    { from: ["MOSCOW", "LENINGRAD", "SVERDLOVSK"], to: ["WASHINGTON DC", "NEW YORK", "CHICAGO", "DETROIT"], delay: 16000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1957["SOVIET FIRST STRIKE"] = {
  narrative: "This is not a test! This is not a test! The Distant Early Warning Line has detected massive formations of Soviet Bison and Bear bombers crossing the Arctic on attack headings toward North America. Continental Air Defense Command reports upwards of five hundred hostile aircraft inbound. Civil Defense authorities urge all citizens to proceed immediately to the nearest fallout shelter. The Soviets have launched an unprovoked and treacherous surprise attack upon the free world. Pray for America, ladies and gentlemen. Pray for the world.",
  waves: [
    // The USSR's handful of R-7 ICBMs strike first — 30 minutes to Washington
    { from: ["BAIKONUR COSMODROME"], to: ["WASHINGTON DC", "OMAHA"], delay: 0, deliveryType: 'icbm' },
    // Then the bomber waves follow
    { from: ["MOSCOW", "LENINGRAD", "SVERDLOVSK"], to: ["NEW YORK", "CHICAGO", "DETROIT", "PHILADELPHIA"], delay: 2000 },
    { from: ["VLADIVOSTOK", "KHABAROVSK", "PETROPAVLOVSK"], to: ["SEATTLE", "SAN FRANCISCO", "LOS ANGELES", "ANCHORAGE"], delay: 3000 },
    { from: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], to: ["BOSTON", "NORFOLK", "PITTSBURGH", "COLORADO SPRINGS"], delay: 6000 },
    { from: ["KIEV", "MINSK", "STALINGRAD"], to: ["LONDON", "PARIS", "BERLIN", "HAMBURG", "BRUSSELS"], delay: 5000 },
    { from: ["WASHINGTON DC", "OMAHA", "SAN FRANCISCO"], to: ["MOSCOW", "LENINGRAD", "KIEV", "MINSK", "SVERDLOVSK"], delay: 14000, retaliation: true },
    { from: ["LONDON", "PARIS", "BERLIN"], to: ["WARSAW", "EAST BERLIN", "PRAGUE", "BUDAPEST", "BUCHAREST"], delay: 12000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1957["NATO MASSIVE RETALIATION"] = {
  narrative: "From the halls of the North Atlantic Council comes word of the most fateful decision since Hiroshima. Soviet armored divisions have breached the inner German border in massive strength, and the Supreme Allied Commander Europe has exercised the authority vested in him under the doctrine of Massive Retaliation. Make no mistake, ladies and gentlemen — this is not a limited engagement. This is the full and terrible answer of the free world to Communist aggression. Every airfield from Lincolnshire to Morocco is launching its bombers at this hour. The Valiant and Vulcan squadrons of Her Majesty's Royal Air Force join their American cousins in this grim crusade against tyranny.",
  waves: [
    { from: ["EAST BERLIN", "WARSAW", "PRAGUE", "BUDAPEST"], to: ["BERLIN", "FRANKFURT", "HAMBURG", "BONN", "COLOGNE"], delay: 0 },
    { from: ["LONDON", "PARIS", "BERLIN", "BRUSSELS"], to: ["MOSCOW", "LENINGRAD", "WARSAW", "EAST BERLIN", "PRAGUE"], delay: 4000, retaliation: true },
    { from: ["WASHINGTON DC", "OMAHA", "BOSTON"], to: ["MOSCOW", "SVERDLOVSK", "KIEV", "MINSK", "GORKY"], delay: 7000 },
    { from: ["MOSCOW", "MINSK", "KIEV"], to: ["LONDON", "PARIS", "WASHINGTON DC", "NEW YORK", "CHICAGO"], delay: 12000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1957["FULDA GAP BREAKTHROUGH"] = {
  narrative: "We bring you now a special report from the European theater. At oh-four-hundred hours Central European Time, Soviet and East German tank armies surged through the Fulda Gap in what military experts are calling the largest armored offensive since the Battle of Kursk. NATO ground forces, heavily outnumbered, are falling back toward the Rhine. In a dramatic address from SHAPE headquarters near Paris, General Norstad has announced that tactical atomic weapons are being employed against the advancing Red columns. The mushroom clouds now rising over the Hessian countryside tell a story that needs no narration, friends.",
  waves: [
    { from: ["EAST BERLIN", "DRESDEN", "PRAGUE"], to: ["FRANKFURT", "BONN", "COLOGNE", "HAMBURG", "MUNICH"], delay: 0 },
    { from: ["FRANKFURT", "BERLIN", "MUNICH"], to: ["EAST BERLIN", "DRESDEN", "LEIPZIG", "WARSAW", "PRAGUE"], delay: 4000, retaliation: true },
    { from: ["MOSCOW", "MINSK"], to: ["PARIS", "LONDON", "AMSTERDAM", "BRUSSELS", "BERLIN"], delay: 8000 },
    { from: ["LONDON", "PARIS", "WASHINGTON DC"], to: ["MOSCOW", "LENINGRAD", "MINSK", "KIEV"], delay: 11000, retaliation: true },
    { from: ["MOSCOW", "LENINGRAD", "SVERDLOVSK"], to: ["WASHINGTON DC", "NEW YORK", "CHICAGO", "LOS ANGELES"], delay: 15000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1957["BERLIN CRISIS"] = {
  narrative: "Flash bulletin from the divided city of Berlin! Soviet forces have sealed all road, rail, and canal access to the Western sectors in a blockade far more severe than that of nineteen forty-eight. But this time, ladies and gentlemen, there will be no airlift. An armed American convoy attempting to force the Helmstedt checkpoint has been fired upon by Soviet troops, and we are receiving reports — still unconfirmed — that an atomic demolition munition has been detonated in the Marienborn corridor. The crisis that every diplomat has feared for a decade has arrived. Berlin — that brave island of freedom in a Red sea — has become the fuse on the powder keg of the world.",
  waves: [
    { from: ["EAST BERLIN", "WARSAW"], to: ["BERLIN", "HAMBURG", "FRANKFURT"], delay: 0 },
    { from: ["BERLIN", "FRANKFURT", "LONDON"], to: ["EAST BERLIN", "WARSAW", "DRESDEN"], delay: 5000, retaliation: true },
    { from: ["MOSCOW", "MINSK", "KIEV"], to: ["BERLIN", "LONDON", "PARIS", "BONN"], delay: 9000, retaliation: true },
    { from: ["WASHINGTON DC", "OMAHA", "BOSTON"], to: ["MOSCOW", "LENINGRAD", "MINSK", "KIEV"], delay: 12000, retaliation: true },
    { from: ["MOSCOW", "LENINGRAD"], to: ["WASHINGTON DC", "NEW YORK", "DETROIT", "CHICAGO"], delay: 16000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1957["BOMBER GAP SURPRISE"] = {
  narrative: "American intelligence has suffered its gravest failure since Pearl Harbor. What our reconnaissance had estimated as fewer than two hundred Soviet long-range bombers has proven to be a force numbering well over a thousand. The so-called Bomber Gap was no gap at all, friends — it was a chasm of miscalculation. At this hour, wave upon wave of Myasishchev M-4 Bison jets and Tupolev Bear turboprops are streaming across the Pole on one-way missions to the American heartland. The DEW Line saw them coming, yes — but too many, and too late. Strategic Air Command has scrambled everything that can fly, but our boys in the B-47s must first survive to reach their targets.",
  waves: [
    // R-7 ICBMs from Baikonur strike SAC command first
    { from: ["BAIKONUR COSMODROME"], to: ["OMAHA", "COLORADO SPRINGS"], delay: 0, deliveryType: 'icbm' },
    { from: ["MOSCOW", "LENINGRAD", "MURMANSK"], to: ["WASHINGTON DC", "NEW YORK", "BOSTON", "PHILADELPHIA", "NORFOLK"], delay: 1500 },
    { from: ["SVERDLOVSK", "CHELYABINSK", "NOVOSIBIRSK"], to: ["CHICAGO", "DETROIT", "DENVER"], delay: 3000 },
    { from: ["VLADIVOSTOK", "KHABAROVSK"], to: ["SEATTLE", "SAN FRANCISCO", "LOS ANGELES", "ANCHORAGE"], delay: 5000 },
    { from: ["KIEV", "MINSK", "MOSCOW"], to: ["LONDON", "PARIS", "BERLIN", "HAMBURG"], delay: 4000 },
    { from: ["WASHINGTON DC", "OMAHA", "SAN FRANCISCO", "BOSTON"], to: ["MOSCOW", "LENINGRAD", "SVERDLOVSK", "KIEV", "GORKY"], delay: 12000, retaliation: true },
    { from: ["LONDON", "PARIS"], to: ["WARSAW", "EAST BERLIN", "MINSK"], delay: 10000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1957["SUEZ ESCALATION"] = {
  narrative: "What began as a quarrel over a canal in the Egyptian desert has now engulfed the great powers in the most perilous confrontation of our atomic age. Premier Bulganin's threat to rain rockets upon London and Paris was dismissed by Western leaders as bluster — but tonight, that bluster has become blood and fire. Soviet volunteer divisions pouring into Egypt have clashed with Anglo-French paratroopers near Port Said, and in the skies above the Eastern Mediterranean, a Royal Air Force Canberra has been brought down by a Soviet-piloted MiG. The Kremlin, emboldened by Western division, has issued an ultimatum: withdraw from Egypt in twelve hours, or face the consequences. The clock, ladies and gentlemen, is ticking.",
  waves: [
    { from: ["CAIRO", "DAMASCUS"], to: ["TEL AVIV", "JERUSALEM"], delay: 0 },
    { from: ["MOSCOW", "KIEV", "ODESSA"], to: ["LONDON", "PARIS", "ISTANBUL", "ANKARA"], delay: 4000 },
    { from: ["LONDON", "PARIS", "ROME"], to: ["MOSCOW", "KIEV", "ODESSA", "LENINGRAD"], delay: 8000, retaliation: true },
    { from: ["WASHINGTON DC", "NORFOLK", "OMAHA"], to: ["MOSCOW", "LENINGRAD", "SVERDLOVSK"], delay: 11000 },
    { from: ["MOSCOW", "SVERDLOVSK"], to: ["WASHINGTON DC", "NEW YORK", "CHICAGO"], delay: 15000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1957["ARCTIC OVERWATCH"] = {
  narrative: "Our cameras take you now to the frozen top of the world, where a drama of almost unimaginable tension is unfolding beneath the Aurora Borealis. A flight of Soviet Bear bombers, tracked by the Distant Early Warning stations across northern Canada, has refused all attempts at radio contact and is maintaining attack heading toward the continental United States. NORAD has scrambled interceptors from Thule, Goose Bay, and Elmendorf. The President has been awakened and taken to the underground command post. Is this the real thing? Or is it another test of our vigilance? America holds its breath.",
  waves: [
    { from: ["MURMANSK", "ARCHANGELSK"], to: ["ANCHORAGE", "SEATTLE", "OMAHA"], delay: 0 },
    { from: ["ANCHORAGE", "SEATTLE", "OMAHA"], to: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], delay: 5000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1957["TURKISH STRAITS CRISIS"] = {
  narrative: "From the ancient crossroads of East and West comes word of a crisis that may well determine the fate of civilization. Soviet naval forces have demanded passage through the Turkish Straits in violation of the Montreux Convention, and when Turkey — faithful ally of the free world — refused, Russian guns opened fire on the fortifications along the Dardanelles. NATO Article Five has been invoked for the first time in the history of the Alliance. American Jupiter missiles — newly deployed on Turkish soil — stand ready on their launch pads, their terrible warheads aimed at the cities of southern Russia. The ancient straits that once echoed with the war galleys of Greeks and Persians now tremble before the prospect of atomic annihilation.",
  waves: [
    { from: ["MOSCOW", "ODESSA", "TBILISI"], to: ["ISTANBUL", "ANKARA", "IZMIR", "ADANA"], delay: 0 },
    { from: ["ISTANBUL", "ANKARA", "ATHENS"], to: ["MOSCOW", "ODESSA", "TBILISI", "BUCHAREST"], delay: 4000, retaliation: true },
    { from: ["LONDON", "PARIS", "ROME"], to: ["MOSCOW", "LENINGRAD", "KIEV", "MINSK"], delay: 8000 },
    { from: ["MOSCOW", "LENINGRAD", "SVERDLOVSK"], to: ["LONDON", "PARIS", "WASHINGTON DC", "NEW YORK"], delay: 12000, retaliation: true },
    { from: ["WASHINGTON DC", "OMAHA", "NORFOLK"], to: ["MOSCOW", "LENINGRAD", "SVERDLOVSK", "STALINGRAD"], delay: 15000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1957["KOREAN FLASHPOINT"] = {
  narrative: "The fragile armistice that silenced the guns along the thirty-eighth parallel four years ago has shattered like glass. North Korean forces, stiffened by fresh Chinese divisions and equipped with the latest Soviet weapons, have hurled themselves across the demilitarized zone in a human wave assault of staggering proportions. But this is not nineteen fifty, friends — this time, the atomic genie is out of the bottle from the very first hour. American tactical atomic bombs are falling on the massed Communist formations, and Manchurian staging bases are being struck by SAC medium bombers flying from Okinawa and Guam. The question on every lip from Tokyo to Washington: will Comrade Khrushchev accept the destruction of his Far Eastern allies — or will the bear strike back with all his terrible might?",
  waves: [
    { from: ["PYONGYANG"], to: ["SEOUL", "INCHEON"], delay: 0 },
    { from: ["SEOUL", "TOKYO"], to: ["PYONGYANG", "SHENYANG", "HARBIN"], delay: 3000, retaliation: true },
    { from: ["BEIJING", "SHENYANG"], to: ["SEOUL", "TOKYO", "OSAKA"], delay: 6000, retaliation: true },
    { from: ["VLADIVOSTOK", "KHABAROVSK", "MOSCOW"], to: ["TOKYO", "ANCHORAGE", "SEATTLE", "HONOLULU"], delay: 10000 },
    { from: ["WASHINGTON DC", "OMAHA", "SAN FRANCISCO"], to: ["MOSCOW", "VLADIVOSTOK", "LENINGRAD"], delay: 14000, retaliation: true }
  ],
  defcon: 2
};

// Populate active SCENARIOS from the selected era
function switchScenarios(era) {
  Object.keys(SCENARIOS).forEach(k => delete SCENARIOS[k]);
  const source = era === '1957' ? SCENARIOS_1957 : SCENARIOS_1983;
  Object.assign(SCENARIOS, source);
}

// Initialize with default era
switchScenarios(typeof CURRENT_ERA !== 'undefined' ? CURRENT_ERA : '1957');
