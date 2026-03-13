const SCENARIOS_1983 = {};

SCENARIOS_1983["U.S. FIRST STRIKE"] = {
  narrative: "STRATCOM initiates SIOP-6 preemptive launch sequence. Primary counterforce strike targets Soviet ICBM fields, command nodes, and naval assets.",
  waves: [
    { from: ["OMAHA", "COLORADO SPRINGS", "WASHINGTON DC"], to: ["MOSCOW", "LENINGRAD", "MINSK", "KIEV", "SVERDLOVSK"], delay: 0 },
    { from: ["SAN FRANCISCO", "SEATTLE", "ANCHORAGE"], to: ["VLADIVOSTOK", "PETROPAVLOVSK", "MAGADAN", "KHABAROVSK", "IRKUTSK"], delay: 3000 },
    { from: ["WASHINGTON DC", "NORFOLK", "CHARLESTON"], to: ["MURMANSK", "ARCHANGELSK", "RIGA", "TALLINN", "VILNIUS"], delay: 6000 },
    { from: ["OMAHA", "DENVER", "COLORADO SPRINGS"], to: ["NOVOSIBIRSK", "OMSK", "CHELYABINSK", "KRASNOYARSK", "PERM"], delay: 10000 },
    { fromSubs: ["us", "uk"], to: ["MURMANSK", "ARCHANGELSK", "PETROPAVLOVSK", "LENINGRAD"], delay: 7000 },
    { from: ["MOSCOW", "LENINGRAD", "SVERDLOVSK"], fromSubs: ["ussr"], to: ["WASHINGTON DC", "OMAHA", "COLORADO SPRINGS", "NORFOLK"], delay: 14000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1983["USSR FIRST STRIKE"] = {
  narrative: "Soviet strategic forces execute RYAN war plan. Massive first strike targets US command authority, ICBM silos, and coastal population centers.",
  waves: [
    { from: ["MOSCOW", "LENINGRAD", "SVERDLOVSK"], to: ["WASHINGTON DC", "OMAHA", "COLORADO SPRINGS", "NORFOLK", "NEW YORK"], delay: 0 },
    { from: ["PETROPAVLOVSK", "VLADIVOSTOK", "MAGADAN"], to: ["SEATTLE", "ANCHORAGE", "SAN FRANCISCO", "LOS ANGELES", "HONOLULU"], delay: 3000 },
    { from: ["MURMANSK", "ARCHANGELSK", "RIGA"], to: ["BOSTON", "NEW YORK", "PHILADELPHIA", "DETROIT", "CHICAGO"], delay: 6000 },
    { from: ["NOVOSIBIRSK", "OMSK", "CHELYABINSK"], to: ["DENVER", "DALLAS", "HOUSTON", "KANSAS CITY", "ST LOUIS"], delay: 10000 },
    { fromSubs: ["ussr"], to: ["NEW YORK", "NORFOLK", "CHARLESTON", "BOSTON", "SEATTLE"], delay: 7000 },
    { from: ["WASHINGTON DC", "OMAHA", "NORFOLK", "COLORADO SPRINGS"], fromSubs: ["us", "uk"], to: ["MOSCOW", "LENINGRAD", "KIEV", "MINSK", "SVERDLOVSK"], delay: 13000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1983["NATO / WARSAW PACT"] = {
  narrative: "Warsaw Pact armor crosses the Fulda Gap. NATO tactical nuclear release authority granted; full alliance nuclear exchange follows conventional breakthrough.",
  waves: [
    { from: ["EAST BERLIN", "WARSAW", "PRAGUE", "BUDAPEST"], to: ["BERLIN", "FRANKFURT", "BONN", "HAMBURG", "COLOGNE"], delay: 0 },
    { from: ["MOSCOW", "MINSK", "KIEV"], to: ["LONDON", "PARIS", "BRUSSELS", "AMSTERDAM", "OSLO"], delay: 3500 },
    { from: ["BERLIN", "FRANKFURT", "LONDON", "PARIS"], fromSubs: ["uk", "france"], to: ["MOSCOW", "LENINGRAD", "WARSAW", "EAST BERLIN", "PRAGUE"], delay: 7000, retaliation: true },
    { from: ["WASHINGTON DC", "OMAHA"], fromSubs: ["us"], to: ["MOSCOW", "SVERDLOVSK", "MINSK", "KIEV", "RIGA"], delay: 10000 },
    { from: ["LENINGRAD", "SVERDLOVSK", "NOVOSIBIRSK"], fromSubs: ["ussr"], to: ["NEW YORK", "WASHINGTON DC", "CHICAGO", "LOS ANGELES"], delay: 13000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1983["FAR EAST STRATEGY"] = {
  narrative: "DPRK launches ballistic strikes against South Korean and Japanese targets. PACOM executes theater nuclear option; Chinese forward staging areas targeted in second wave.",
  waves: [
    { from: ["PYONGYANG"], to: ["SEOUL", "INCHEON", "TOKYO"], delay: 0 },
    { from: ["SEOUL", "TOKYO", "YOKOHAMA"], to: ["PYONGYANG", "BEIJING", "SHENYANG", "HARBIN"], delay: 3000, retaliation: true },
    { from: ["BEIJING", "SHENYANG"], to: ["SEOUL", "TOKYO", "OSAKA"], delay: 6000, retaliation: true },
    { from: ["GUAM", "HONOLULU"], fromSubs: ["us"], to: ["VLADIVOSTOK", "PYONGYANG", "CHANGCHUN", "DALIAN"], delay: 9000 }
  ],
  defcon: 3
};

SCENARIOS_1983["US USSR ESCALATION"] = {
  narrative: "Border incident in Central Europe initiates limited exchange. Mutual escalation protocols activate; theater conflict expands to intercontinental threshold.",
  waves: [
    { from: ["BERLIN", "FRANKFURT"], to: ["EAST BERLIN", "WARSAW", "PRAGUE"], delay: 0 },
    { from: ["EAST BERLIN", "WARSAW"], to: ["BERLIN", "HAMBURG", "FRANKFURT"], delay: 4000, retaliation: true },
    { from: ["WASHINGTON DC", "LONDON", "PARIS"], fromSubs: ["us", "uk"], to: ["MOSCOW", "LENINGRAD", "MINSK"], delay: 7000 },
    { from: ["MOSCOW", "LENINGRAD"], fromSubs: ["ussr"], to: ["WASHINGTON DC", "NEW YORK", "LONDON", "PARIS"], delay: 11000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["MIDDLE EAST WAR"] = {
  narrative: "Israeli preemptive strike on Syrian and Iraqi nuclear infrastructure triggers Soviet response. Superpower confrontation escalates beyond regional containment.",
  waves: [
    { from: ["TEL AVIV", "JERUSALEM"], to: ["DAMASCUS", "BAGHDAD", "CAIRO", "AMMAN"], delay: 0 },
    { from: ["MOSCOW", "TBILISI"], to: ["TEL AVIV", "JERUSALEM", "RIYADH", "TEHRAN"], delay: 4000 },
    { from: ["WASHINGTON DC", "NORFOLK"], fromSubs: ["us"], to: ["MOSCOW", "KIEV", "TBILISI", "BAKU"], delay: 7000 },
    { from: ["MOSCOW", "LENINGRAD", "SVERDLOVSK"], fromSubs: ["ussr"], to: ["WASHINGTON DC", "NEW YORK", "NORFOLK", "ATLANTA"], delay: 11000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1983["USSR CHINA ATTACK"] = {
  narrative: "Sino-Soviet border clashes escalate. Soviet Far Eastern Military District executes preemptive counterforce strike against PLA nuclear arsenal and command nodes.",
  waves: [
    { from: ["VLADIVOSTOK", "IRKUTSK", "KHABAROVSK"], to: ["BEIJING", "SHENYANG", "HARBIN", "XIAN", "LHASA"], delay: 0 },
    { from: ["MOSCOW", "SVERDLOVSK", "NOVOSIBIRSK"], fromSubs: ["ussr"], to: ["SHANGHAI", "CHONGQING", "WUHAN", "CHENGDU", "LANZHOU"], delay: 3500 },
    { from: ["BEIJING", "SHANGHAI", "SHENYANG"], to: ["VLADIVOSTOK", "IRKUTSK", "KHABAROVSK", "NOVOSIBIRSK"], delay: 7000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["INDIA PAKISTAN WAR"] = {
  narrative: "Pakistani first strike targets Indian command and industrial centers. Indian second-strike capability activates; subcontinental exchange reaches full nuclear threshold.",
  waves: [
    { from: ["ISLAMABAD", "KARACHI", "LAHORE"], to: ["NEW DELHI", "MUMBAI", "CALCUTTA", "BANGALORE"], delay: 0 },
    { from: ["NEW DELHI", "MUMBAI", "CALCUTTA"], to: ["ISLAMABAD", "KARACHI", "LAHORE", "RAWALPINDI", "FAISALABAD"], delay: 4000, retaliation: true },
    { from: ["MOSCOW", "WASHINGTON DC"], fromSubs: ["us", "ussr"], to: ["ISLAMABAD", "NEW DELHI"], delay: 9000 }
  ],
  defcon: 1
};

SCENARIOS_1983["MEDITERRANEAN WAR"] = {
  narrative: "Turkish Straits closure triggers NATO Article 5 response. Soviet Black Sea Fleet engages; Mediterranean theater engulfed in tactical nuclear exchange.",
  waves: [
    { from: ["MOSCOW", "TBILISI", "ODESSA"], to: ["ISTANBUL", "ANKARA", "ATHENS", "ROME", "NAPLES"], delay: 0 },
    { from: ["ISTANBUL", "ANKARA", "ATHENS", "ROME"], to: ["MOSCOW", "ODESSA", "TBILISI", "ROSTOV-ON-DON", "BELGRADE"], delay: 4000, retaliation: true },
    { from: ["LONDON", "PARIS", "WASHINGTON DC"], fromSubs: ["us", "uk", "france"], to: ["MOSCOW", "LENINGRAD", "MINSK", "KIEV"], delay: 8000 },
    { fromSubs: ["ussr"], to: ["LONDON", "NEW YORK", "NORFOLK"], delay: 10000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1983["HONGKONG VARIANT"] = {
  narrative: "PRC mobilizes against Hong Kong colonial administration. British nuclear guarantee invoked; limited exchange contained to regional theater.",
  waves: [
    { from: ["GUANGZHOU", "BEIJING", "SHANGHAI"], to: ["HONG KONG", "MACAU", "TAIPEI", "MANILA"], delay: 0 },
    { from: ["LONDON", "HONG KONG"], fromSubs: ["uk"], to: ["GUANGZHOU", "SHANGHAI", "BEIJING"], delay: 4000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["SEATO DECAPITATING"] = {
  narrative: "Soviet Pacific Fleet submarine-launched first strike targets SEATO command nodes. PLA coordinates second wave against allied Pacific infrastructure.",
  waves: [
    { fromSubs: ["ussr"], subFilter: "OKHOTSK", to: ["MANILA", "BANGKOK", "SINGAPORE", "KUALA LUMPUR"], delay: 0 },
    { from: ["VLADIVOSTOK NB", "PETROPAVLOVSK-K"], to: ["TOKYO", "SEOUL", "GUAM", "HONOLULU"], delay: 3500 },
    { from: ["BEIJING", "SHANGHAI"], fromSubs: ["china"], to: ["TAIPEI", "SINGAPORE", "DARWIN", "SYDNEY"], delay: 7000 },
    { from: ["WASHINGTON DC", "GUAM"], fromSubs: ["us"], to: ["VLADIVOSTOK", "PETROPAVLOVSK", "MOSCOW"], delay: 11000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1983["CUBAN PROVOCATION"] = {
  narrative: "Cuban MiGs intercept US reconnaissance aircraft over international waters. Castro regime deploys tactical nuclear artillery; CINCLANT authorizes response.",
  waves: [
    { from: ["HAVANA"], to: ["MIAMI", "TAMPA", "NEW ORLEANS"], delay: 0 },
    { from: ["MIAMI", "WASHINGTON DC", "NORFOLK"], to: ["HAVANA"], delay: 3500, retaliation: true },
    { from: ["MOSCOW"], to: ["WASHINGTON DC", "MIAMI", "NORFOLK"], delay: 7000 },
    { fromSubs: ["us"], to: ["HAVANA", "MURMANSK"], delay: 5000 },
    { fromSubs: ["ussr"], to: ["NORFOLK", "CHARLESTON", "MIAMI"], delay: 9000 }
  ],
  defcon: 3
};

SCENARIOS_1983["ATLANTIC HEAVY"] = {
  narrative: "Soviet Northern Fleet engages NATO SACLANT forces in convoy interdiction. Tactical nuclear depth charges escalate to coastal strike exchange.",
  waves: [
    { from: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], fromSubs: ["ussr"], to: ["REYKJAVIK", "OSLO", "BERGEN", "LONDON", "GLASGOW"], delay: 0 },
    { fromSubs: ["us", "uk"], to: ["MURMANSK", "ARCHANGELSK", "LENINGRAD", "RIGA"], delay: 2000 },
    { from: ["LONDON", "OSLO", "REYKJAVIK"], to: ["MURMANSK", "ARCHANGELSK", "LENINGRAD", "RIGA"], delay: 4000, retaliation: true },
    { from: ["WASHINGTON DC", "NORFOLK", "BOSTON"], to: ["MURMANSK", "LENINGRAD", "MOSCOW"], delay: 8000 }
  ],
  defcon: 2
};

SCENARIOS_1983["CUBAN PARAMILITARY"] = {
  narrative: "Cuban-backed paramilitary forces destabilize Central American governments. Limited US punitive strike authorized against Cuban military infrastructure.",
  waves: [
    { from: ["MIAMI", "NORFOLK"], to: ["HAVANA"], delay: 0 },
    { from: ["HAVANA"], to: ["MIAMI", "TAMPA", "KEY WEST"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["NICARAGUAN PREEMPTIVE"] = {
  narrative: "Sandinista government accepts Soviet nuclear deployment. CINCSOUTH executes preemptive strike before operational status achieved.",
  waves: [
    { from: ["WASHINGTON DC", "MIAMI"], to: ["MANAGUA"], delay: 0 },
    { from: ["HOUSTON", "NEW ORLEANS"], to: ["MANAGUA", "HAVANA"], delay: 4000 },
    { fromSubs: ["us"], to: ["HAVANA", "MANAGUA"], delay: 2000 },
    { from: ["MOSCOW", "HAVANA"], fromSubs: ["ussr"], to: ["MIAMI", "WASHINGTON DC", "HOUSTON"], delay: 8000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["PACIFIC TERRITORIAL"] = {
  narrative: "Disputed island chain triggers US-Soviet naval confrontation. Limited exchange confined to Pacific theater with mutual stand-down before escalation threshold.",
  waves: [
    { from: ["VLADIVOSTOK", "PETROPAVLOVSK"], fromSubs: ["ussr"], to: ["TOKYO", "GUAM", "HONOLULU"], delay: 0 },
    { from: ["GUAM", "HONOLULU", "TOKYO"], fromSubs: ["us"], to: ["VLADIVOSTOK", "PETROPAVLOVSK"], delay: 4000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["BURMESE THEATERWIDE"] = {
  narrative: "Chinese forces cross Burmese border in force. SEATO theater command activates; India and Soviet advisors drawn into widening regional exchange.",
  waves: [
    { from: ["KUNMING", "CHONGQING", "BEIJING"], to: ["RANGOON", "MANDALAY", "BANGKOK", "CHIANG MAI"], delay: 0 },
    { from: ["NEW DELHI", "MOSCOW"], fromSubs: ["ussr"], to: ["KUNMING", "CHONGQING", "BEIJING"], delay: 4000 },
    { from: ["BEIJING", "SHANGHAI"], to: ["NEW DELHI", "CALCUTTA", "MOSCOW"], delay: 8000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["TURKISH DECOY"] = {
  narrative: "False flag operation simulates Turkish aggression to trigger NATO Article 5. Soviet intelligence assets expose provocation before full exchange.",
  waves: [
    { from: ["ISTANBUL", "ANKARA"], to: ["SOFIA", "BUCHAREST", "BELGRADE"], delay: 0 },
    { from: ["MOSCOW", "TBILISI"], to: ["ISTANBUL", "ANKARA", "IZMIR"], delay: 5000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["ARGENTINA ESCALATION"] = {
  narrative: "Argentine junta acquires tactical nuclear device. Regional destabilization forces US and Soviet diplomatic crisis into limited military exchange.",
  waves: [
    { from: ["BUENOS AIRES", "CORDOBA"], to: ["SANTIAGO", "MONTEVIDEO", "SAO PAULO"], delay: 0 },
    { from: ["WASHINGTON DC"], fromSubs: ["us"], to: ["BUENOS AIRES", "CORDOBA"], delay: 4000 },
    { from: ["MOSCOW"], fromSubs: ["ussr"], to: ["WASHINGTON DC", "BUENOS AIRES"], delay: 8000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["ICELAND MAXIMUM"] = {
  narrative: "Soviet airborne forces seize Keflavik NATO air base. US counterattack triggers maximum theater response; Iceland becomes nuclear flashpoint.",
  waves: [
    { from: ["MURMANSK", "ARCHANGELSK"], fromSubs: ["ussr"], to: ["REYKJAVIK", "OSLO", "BERGEN"], delay: 0 },
    { from: ["REYKJAVIK", "LONDON", "OSLO"], fromSubs: ["us", "uk"], to: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], delay: 3500, retaliation: true },
    { from: ["MURMANSK", "LENINGRAD", "MOSCOW"], to: ["REYKJAVIK", "OSLO", "GLASGOW", "LONDON"], delay: 7000, retaliation: true },
    { from: ["WASHINGTON DC", "NORFOLK", "LONDON"], fromSubs: ["us", "uk"], to: ["MOSCOW", "LENINGRAD", "SVERDLOVSK", "MURMANSK"], delay: 10000, retaliation: true },
    { from: ["MOSCOW", "SVERDLOVSK"], fromSubs: ["ussr"], to: ["WASHINGTON DC", "NEW YORK", "NORFOLK", "BOSTON"], delay: 13000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["ARABIAN THEATERWIDE"] = {
  narrative: "Soviet-backed Iraqi forces advance on Saudi oil infrastructure. Baghdad launches preemptive strikes against Gulf states; US CENTCOM retaliates with full theater response.",
  waves: [
    { from: ["BAGHDAD", "MOSCOW", "TBILISI"], to: ["RIYADH", "JEDDAH", "KUWAIT CITY", "ABU DHABI"], delay: 0 },
    { from: ["RIYADH", "WASHINGTON DC", "NORFOLK"], fromSubs: ["us"], to: ["BAGHDAD", "BASRA", "MOSCOW", "TBILISI"], delay: 4000, retaliation: true },
    { from: ["MOSCOW", "BAKU"], fromSubs: ["ussr"], to: ["TEHRAN", "RIYADH", "WASHINGTON DC"], delay: 8000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["U.S. SUBVERSION"] = {
  narrative: "CIA-backed coup attempt in Warsaw Pact nation detected. US preemptive strikes target Pact command nodes before Soviet countermeasures activate.",
  waves: [
    { from: ["WASHINGTON DC", "FRANKFURT"], to: ["WARSAW", "BUDAPEST", "BUCHAREST"], delay: 0 },
    { from: ["MOSCOW", "MINSK"], to: ["FRANKFURT", "BERLIN", "BRUSSELS"], delay: 5000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["AUSTRALIAN MANEUVER"] = {
  narrative: "Soviet Pacific Fleet conducts provocative maneuver through Australian territorial waters. ANZUS alliance activates; limited theater response authorized.",
  waves: [
    { from: ["CANBERRA", "DARWIN", "SYDNEY"], to: ["VLADIVOSTOK", "PETROPAVLOVSK"], delay: 0 },
    { from: ["VLADIVOSTOK", "PETROPAVLOVSK"], to: ["DARWIN", "SYDNEY", "PERTH"], delay: 5000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["SUDAN SURPRISE"] = {
  narrative: "Soviet-aligned Sudanese government granted basing rights for Indian Ocean operations. Combined US-Egyptian preemptive strike eliminates forward deployment capability.",
  waves: [
    { from: ["CAIRO", "WASHINGTON DC"], to: ["KHARTOUM"], delay: 0 },
    { from: ["MOSCOW", "TBILISI"], fromSubs: ["ussr"], to: ["CAIRO", "ADDIS ABABA", "WASHINGTON DC"], delay: 4000 },
    { from: ["WASHINGTON DC", "CAIRO"], fromSubs: ["us"], to: ["MOSCOW", "TBILISI"], delay: 8000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["NATO TERRITORIAL"] = {
  narrative: "Warsaw Pact forces occupy disputed border zone. NATO flexible response activated; limited nuclear demonstration fails to halt advance.",
  waves: [
    { from: ["EAST BERLIN", "WARSAW", "PRAGUE"], to: ["BERLIN", "HAMBURG", "FRANKFURT"], delay: 0 },
    { from: ["BERLIN", "FRANKFURT", "LONDON"], fromSubs: ["us", "uk", "france"], to: ["EAST BERLIN", "WARSAW", "DRESDEN", "LEIPZIG"], delay: 4000, retaliation: true },
    { from: ["MOSCOW", "MINSK"], fromSubs: ["ussr"], to: ["BERLIN", "FRANKFURT", "BRUSSELS", "AMSTERDAM"], delay: 8000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["ZAIRE ALLIANCE"] = {
  narrative: "Soviet-backed Angolan forces cross Zaire border. US AFSOUTH and Belgian paratroopers respond; limited superpower proxy exchange authorized.",
  waves: [
    { from: ["MOSCOW", "LUANDA"], to: ["KINSHASA", "LUBUMBASHI", "BRAZZAVILLE"], delay: 0 },
    { from: ["WASHINGTON DC", "BRUSSELS"], fromSubs: ["us"], to: ["MOSCOW", "LUANDA"], delay: 5000, retaliation: true },
    { fromSubs: ["ussr"], to: ["WASHINGTON DC", "NORFOLK"], delay: 7000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["ICELAND INCIDENT"] = {
  narrative: "Unidentified submarine detected in Icelandic waters. NATO SOSUS alerts trigger precautionary alert; incident resolved before nuclear threshold.",
  waves: [
    { from: ["REYKJAVIK"], to: ["MURMANSK"], delay: 0 },
    { from: ["MURMANSK"], to: ["REYKJAVIK"], delay: 6000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["ENGLISH ESCALATION"] = {
  narrative: "Soviet Backfire bombers penetrate UK air defense identification zone. RAF intercept leads to shootdown; rapid escalation through English Channel theater.",
  waves: [
    { from: ["MURMANSK", "LENINGRAD"], fromSubs: ["ussr"], to: ["LONDON", "GLASGOW", "EDINBURGH"], delay: 0 },
    { from: ["LONDON", "GLASGOW", "EDINBURGH"], fromSubs: ["uk"], to: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], delay: 4000, retaliation: true },
    { from: ["MOSCOW", "MINSK"], to: ["BIRMINGHAM", "MANCHESTER", "PARIS", "BRUSSELS"], delay: 7000, retaliation: true },
    { from: ["PARIS", "BRUSSELS", "WASHINGTON DC"], fromSubs: ["us", "france"], to: ["MOSCOW", "LENINGRAD", "MINSK"], delay: 10000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["MIDDLE EAST HEAVY"] = {
  narrative: "Combined Arab strike overwhelms Israeli air defenses. Israeli Jericho missiles respond; superpower nuclear umbrellas activated across full Middle East theater.",
  waves: [
    { from: ["CAIRO", "DAMASCUS", "BAGHDAD", "TEHRAN"], to: ["TEL AVIV", "JERUSALEM", "AMMAN"], delay: 0 },
    { from: ["TEL AVIV", "JERUSALEM"], to: ["CAIRO", "DAMASCUS", "BAGHDAD", "AMMAN", "TEHRAN"], delay: 3500, retaliation: true },
    { from: ["MOSCOW", "TBILISI", "BAKU"], fromSubs: ["ussr"], to: ["TEL AVIV", "RIYADH", "ANKARA"], delay: 7000 },
    { from: ["WASHINGTON DC", "NORFOLK"], fromSubs: ["us"], to: ["MOSCOW", "TBILISI", "KIEV", "ODESSA"], delay: 11000 }
  ],
  defcon: 2
};

SCENARIOS_1983["MEXICAN TAKEOVER"] = {
  narrative: "Soviet-aligned coup seizes Mexican government and requests nuclear deployment rights. US Southern Command executes preemptive regime elimination strike.",
  waves: [
    { from: ["WASHINGTON DC", "SAN ANTONIO", "SAN DIEGO"], to: ["MEXICO CITY", "GUADALAJARA", "MONTERREY"], delay: 0 },
    { from: ["MEXICO CITY", "MOSCOW"], fromSubs: ["ussr"], to: ["SAN ANTONIO", "HOUSTON", "LOS ANGELES", "WASHINGTON DC"], delay: 4000, retaliation: true },
    { from: ["WASHINGTON DC", "HOUSTON", "LOS ANGELES"], fromSubs: ["us"], to: ["MOSCOW", "MEXICO CITY", "HAVANA"], delay: 8000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["CHAD ALERT"] = {
  narrative: "Libyan armor moves toward Chadian border. US reconnaissance satellite detects possible nuclear artillery deployment; standby alert only.",
  waves: [
    { from: ["TRIPOLI", "BENGHAZI"], to: ["NDJAMENA"], delay: 0 },
    { from: ["WASHINGTON DC"], to: ["TRIPOLI"], delay: 7000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["SAUDI MANEUVER"] = {
  narrative: "Iranian Revolutionary Guard forces advance toward Saudi oil fields. Limited US punitive strike authorized to protect Gulf Cooperation Council infrastructure.",
  waves: [
    { from: ["TEHRAN", "ISFAHAN"], to: ["RIYADH", "JEDDAH", "KUWAIT CITY"], delay: 0 },
    { from: ["RIYADH", "WASHINGTON DC"], to: ["TEHRAN", "ISFAHAN", "BASRA"], delay: 5000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["AFRICAN TERRITORIAL"] = {
  narrative: "Soviet-backed forces seize disputed mineral-rich territory in southern Africa. US-backed South African response escalates to superpower proxy confrontation.",
  waves: [
    { from: ["MOSCOW", "LUANDA"], to: ["PRETORIA", "JOHANNESBURG", "HARARE", "WINDHOEK"], delay: 0 },
    { from: ["PRETORIA", "JOHANNESBURG", "WASHINGTON DC"], fromSubs: ["us"], to: ["LUANDA", "MAPUTO", "MOSCOW"], delay: 4000, retaliation: true },
    { from: ["MOSCOW"], fromSubs: ["ussr"], to: ["PRETORIA", "JOHANNESBURG", "WASHINGTON DC"], delay: 8000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["ETHIOPIAN ESCALATION"] = {
  narrative: "Soviet-Cuban forces supporting Mengistu regime clash with US-backed Somali and Eritrean insurgents. Horn of Africa crisis triggers wider superpower exchange.",
  waves: [
    { from: ["ADDIS ABABA", "MOSCOW", "HAVANA"], to: ["MOGADISHU", "ASMARA", "DJIBOUTI", "NAIROBI"], delay: 0 },
    { from: ["WASHINGTON DC", "NAIROBI", "DJIBOUTI"], to: ["ADDIS ABABA", "HAVANA", "MOSCOW"], delay: 4000, retaliation: true },
    { from: ["MOSCOW", "TBILISI"], to: ["NAIROBI", "DJIBOUTI", "WASHINGTON DC", "RIYADH"], delay: 8000, retaliation: true },
    { fromSubs: ["us"], to: ["MOSCOW", "LENINGRAD", "MURMANSK"], delay: 10000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["TURKISH HEAVY"] = {
  narrative: "Turkish theater ignites as Soviet armor crosses the Caucasus. Ankara requests immediate nuclear release authority.",
  waves: [
    { from: ["MOSCOW", "TBILISI", "BAKU"], to: ["ISTANBUL", "ANKARA", "IZMIR", "ADANA"], delay: 0 },
    { from: ["ISTANBUL", "ANKARA", "IZMIR"], to: ["MOSCOW", "TBILISI", "BAKU", "YEREVAN"], delay: 4000, retaliation: true },
    { from: ["ADANA", "ANTALYA", "ATHENS"], to: ["YEREVAN", "BAKU", "TBILISI", "ODESSA"], delay: 8000, retaliation: true },
    { fromSubs: ["us", "uk"], to: ["MOSCOW", "LENINGRAD", "MURMANSK", "ODESSA"], delay: 10000 },
    { fromSubs: ["ussr"], to: ["ISTANBUL", "LONDON", "NEW YORK"], delay: 12000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["NATO INCURSION"] = {
  narrative: "Pact armor breaches the Fulda Gap under electronic jamming. SACEUR authorizes tactical nuclear release.",
  waves: [
    { from: ["EAST BERLIN", "WARSAW", "PRAGUE", "DRESDEN"], to: ["FRANKFURT", "BONN", "COLOGNE", "HAMBURG"], delay: 0 },
    { from: ["FRANKFURT", "BONN", "COLOGNE"], to: ["EAST BERLIN", "WARSAW", "PRAGUE", "DRESDEN"], delay: 4000, retaliation: true },
    { from: ["BERLIN", "MUNICH", "ROTTERDAM"], to: ["WARSAW", "KRAKOW", "BUDAPEST", "SOFIA"], delay: 7000, retaliation: true },
    { fromSubs: ["us", "uk"], to: ["MOSCOW", "LENINGRAD", "MURMANSK"], delay: 9000 }
  ],
  defcon: 3
};

SCENARIOS_1983["U.S. DEFENSE"] = {
  narrative: "NORAD confirms inbound Soviet ICBMs on primary US population centers. Launch-on-warning protocol initiated; US retaliatory strike ordered before impact.",
  waves: [
    { from: ["MOSCOW", "LENINGRAD", "SVERDLOVSK"], fromSubs: ["ussr"], to: ["WASHINGTON DC", "NEW YORK", "CHICAGO", "OMAHA"], delay: 0 },
    { from: ["WASHINGTON DC", "OMAHA", "COLORADO SPRINGS"], fromSubs: ["us"], to: ["MOSCOW", "LENINGRAD", "MINSK", "SVERDLOVSK"], delay: 2000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["CAMBODIAN HEAVY"] = {
  narrative: "Vietnamese forces mass on the Cambodian border following Khmer Rouge provocations. Regional powers escalate.",
  waves: [
    { from: ["HANOI", "HO CHI MINH CITY", "DA NANG"], to: ["PHNOM PENH", "BANGKOK", "SINGAPORE"], delay: 0 },
    { from: ["PHNOM PENH", "BANGKOK", "SINGAPORE"], to: ["HANOI", "HO CHI MINH CITY", "DA NANG"], delay: 3000, retaliation: true },
    { from: ["BEIJING", "GUANGZHOU", "CHENGDU"], to: ["HANOI", "HO CHI MINH CITY", "MANILA"], delay: 7000 }
  ],
  defcon: 2
};

SCENARIOS_1983["PACT MEDIUM"] = {
  narrative: "Warsaw Pact conducts coordinated medium-yield strikes against NATO rear logistics. Response is measured but firm.",
  waves: [
    { from: ["WARSAW", "BUDAPEST", "BUCHAREST"], to: ["BERLIN", "MUNICH", "FRANKFURT", "VIENNA"], delay: 0 },
    { from: ["FRANKFURT", "BERLIN", "VIENNA"], to: ["WARSAW", "BUDAPEST", "SOFIA", "BELGRADE"], delay: 4000, retaliation: true },
    { fromSubs: ["us"], to: ["MOSCOW", "LENINGRAD", "MINSK"], delay: 6000 }
  ],
  defcon: 3
};

SCENARIOS_1983["ARCTIC MINIMAL"] = {
  narrative: "Single Soviet submarine launches on anomalous trajectory over the Pole. NORAD classifies as limited probe.",
  waves: [
    { fromSubs: ["ussr"], to: ["THULE AB", "REYKJAVIK", "ANCHORAGE"], delay: 0 }
  ],
  defcon: 5
};

SCENARIOS_1983["MEXICAN DOMESTIC"] = {
  narrative: "Domestic insurgency in northern Mexico prompts cross-border military action. Conflict remains contained.",
  waves: [
    { from: ["MEXICO CITY", "MONTERREY"], to: ["TIJUANA", "GUADALAJARA", "PUEBLA"], delay: 0 }
  ],
  defcon: 5
};

SCENARIOS_1983["TAIWAN THEATERWIDE"] = {
  narrative: "PRC initiates amphibious assault on Taiwan following failed reunification talks. US 7th Fleet repositions.",
  waves: [
    { from: ["BEIJING", "SHANGHAI", "GUANGZHOU"], to: ["TAIPEI", "KAOHSIUNG", "HONG KONG"], delay: 0 },
    { from: ["TAIPEI", "KAOHSIUNG"], to: ["GUANGZHOU", "SHANGHAI", "SHENZHEN"], delay: 3000, retaliation: true },
    { from: ["TOKYO", "SEOUL", "MANILA"], to: ["BEIJING", "SHENYANG", "TIANJIN"], delay: 7000 }
  ],
  defcon: 2
};

SCENARIOS_1983["PACIFIC MANEUVER"] = {
  narrative: "Soviet Pacific Fleet exercises off Hokkaido coincide with submarine activity near Guam. CINCPAC elevates readiness.",
  waves: [
    { from: ["VLADIVOSTOK", "PETROPAVLOVSK"], to: ["TOKYO", "OSAKA", "SEOUL", "GUAM"], delay: 0 },
    { from: ["TOKYO", "GUAM", "HONOLULU"], to: ["VLADIVOSTOK", "PETROPAVLOVSK", "KHABAROVSK"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["PORTUGAL REVOLUTION"] = {
  narrative: "Leftist coup in Lisbon threatens NATO Atlantic flank. Soviet advisors reported in Porto within 48 hours.",
  waves: [
    { from: ["MADRID", "LONDON", "PARIS"], to: ["LISBON", "PORTO"], delay: 0 },
    { from: ["LISBON", "MOSCOW"], to: ["MADRID", "LONDON", "PARIS", "BRUSSELS"], delay: 4000, retaliation: true },
    { fromSubs: ["us", "uk"], to: ["MOSCOW", "LENINGRAD"], delay: 6000 }
  ],
  defcon: 3
};

SCENARIOS_1983["ALBANIAN DECOY"] = {
  narrative: "Albanian troop movements mask a diversionary feint to split NATO attention from the central front.",
  waves: [
    { from: ["TIRANA"], to: ["ATHENS", "BELGRADE"], delay: 0 },
    { from: ["ATHENS", "ROME"], to: ["TIRANA", "SKOPJE", "SARAJEVO"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["PALESTINIAN LOCAL"] = {
  narrative: "Cross-border rocket fire escalates into localized exchange between Israeli and Syrian forces.",
  waves: [
    { from: ["DAMASCUS", "BEIRUT"], to: ["TEL AVIV", "JERUSALEM"], delay: 0 },
    { from: ["TEL AVIV", "JERUSALEM"], to: ["DAMASCUS", "BEIRUT", "ALEPPO"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["MOROCCAN MINIMAL"] = {
  narrative: "Disputed Western Saharan border sparks brief artillery exchange between Morocco and Algeria. Both sides refrain from escalation.",
  waves: [
    { from: ["RABAT", "CASABLANCA"], to: ["ALGIERS", "ORAN"], delay: 0 },
    { from: ["ALGIERS"], to: ["RABAT", "CASABLANCA"], delay: 3000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["BAVARIAN DIVERSITY"] = {
  narrative: "Soviet forces probe Bavarian sector as feint to draw NATO reserves from northern German plain.",
  waves: [
    { from: ["EAST BERLIN", "PRAGUE", "BRATISLAVA"], to: ["MUNICH", "FRANKFURT", "VIENNA"], delay: 0 },
    { from: ["MUNICH", "FRANKFURT", "BERLIN"], to: ["EAST BERLIN", "PRAGUE", "DRESDEN", "LEIPZIG"], delay: 4000, retaliation: true },
    { fromSubs: ["us"], to: ["MOSCOW", "LENINGRAD"], delay: 7000 }
  ],
  defcon: 3
};

SCENARIOS_1983["CZECH OPTION"] = {
  narrative: "Prague Spring redux: Soviet armor rolls in as Czechoslovak reformers seek Western guarantees.",
  waves: [
    { from: ["MOSCOW", "WARSAW"], to: ["PRAGUE", "BRATISLAVA"], delay: 0 },
    { from: ["PRAGUE", "BERLIN", "FRANKFURT"], to: ["WARSAW", "KRAKOW", "MOSCOW"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["FRENCH ALLIANCE"] = {
  narrative: "France activates Force de Frappe as Soviet armor enters West Germany. NATO fires in coordinated wave.",
  waves: [
    { from: ["PARIS", "MARSEILLE", "LYON"], to: ["MOSCOW", "LENINGRAD", "MINSK", "EAST BERLIN"], delay: 0 },
    { from: ["MOSCOW", "MINSK", "WARSAW"], to: ["PARIS", "LONDON", "FRANKFURT", "BRUSSELS"], delay: 4000, retaliation: true },
    { from: ["LONDON", "BERLIN", "AMSTERDAM"], fromSubs: ["uk", "france"], to: ["MOSCOW", "WARSAW", "BUDAPEST", "SOFIA"], delay: 8000 },
    { fromSubs: ["us"], to: ["MOSCOW", "LENINGRAD", "MURMANSK", "SVERDLOVSK"], delay: 10000 },
    { fromSubs: ["ussr"], to: ["PARIS", "LONDON", "NEW YORK", "WASHINGTON DC"], delay: 12000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["ARABIAN CLANDESTINE"] = {
  narrative: "Unattributed missile strikes hit Gulf oil infrastructure. CIA traces launch origin to rogue state proxy.",
  waves: [
    { from: ["BAGHDAD", "TEHRAN"], to: ["RIYADH", "KUWAIT CITY", "ABU DHABI"], delay: 0 },
    { from: ["RIYADH", "TEL AVIV"], to: ["BAGHDAD", "TEHRAN", "DAMASCUS"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["GABON REBELLION"] = {
  narrative: "Military coup in Libreville threatens French access to strategic uranium deposits. Paris deploys Foreign Legion with tactical nuclear authorization.",
  waves: [
    { from: ["PARIS", "MARSEILLE"], fromSubs: ["france"], to: ["LIBREVILLE", "KINSHASA"], delay: 0 },
    { from: ["MOSCOW"], to: ["PARIS", "MARSEILLE"], delay: 5000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["NORTHERN MAXIMUM"] = {
  narrative: "Full northern theater engagement as Soviet Arctic forces surge south. NORAD and SACEUR respond in kind.",
  waves: [
    { from: ["MURMANSK", "ARCHANGELSK", "MOSCOW"], fromSubs: ["ussr"], to: ["OSLO", "COPENHAGEN", "REYKJAVIK", "THULE AB"], delay: 0 },
    { from: ["OSLO", "COPENHAGEN", "LONDON"], fromSubs: ["us", "uk"], to: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], delay: 3000, retaliation: true },
    { from: ["WASHINGTON DC", "OMAHA", "ANCHORAGE"], to: ["MOSCOW", "LENINGRAD", "MINSK", "SVERDLOVSK"], delay: 7000 },
    { from: ["MOSCOW", "SVERDLOVSK", "LENINGRAD"], fromSubs: ["ussr"], to: ["WASHINGTON DC", "NEW YORK", "CHICAGO", "BOSTON"], delay: 11000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["DANISH PARAMILITARY"] = {
  narrative: "Soviet-backed paramilitary units infiltrate Danish waters under Baltic exercises. Copenhagen requests NATO support.",
  waves: [
    { from: ["LENINGRAD", "RIGA", "TALLINN"], to: ["COPENHAGEN", "OSLO", "STOCKHOLM"], delay: 0 },
    { from: ["COPENHAGEN", "HAMBURG", "BERLIN"], to: ["LENINGRAD", "RIGA", "TALLINN", "GDANSK"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["SEATO TAKEOVER"] = {
  narrative: "Soviet-aligned forces seize key SEATO ports under guise of stabilization. Allies respond with carrier strikes.",
  waves: [
    { from: ["MOSCOW", "VLADIVOSTOK", "HANOI"], to: ["SINGAPORE", "MANILA", "BANGKOK", "KUALA LUMPUR"], delay: 0 },
    { from: ["SINGAPORE", "MANILA", "TOKYO"], to: ["HANOI", "HO CHI MINH CITY", "VLADIVOSTOK"], delay: 4000, retaliation: true },
    { from: ["WASHINGTON DC", "HONOLULU", "GUAM"], to: ["MOSCOW", "VLADIVOSTOK", "PETROPAVLOVSK"], delay: 8000 },
    { fromSubs: ["us"], to: ["MOSCOW", "LENINGRAD", "VLADIVOSTOK", "PETROPAVLOVSK"], delay: 5000 },
    { fromSubs: ["ussr"], to: ["HONOLULU", "SAN FRANCISCO", "SEATTLE"], delay: 10000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["HAWAIIAN ESCALATION"] = {
  narrative: "Soviet submarines surface west of Hawaii crossing restricted waters. Pacific Command responds.",
  waves: [
    { from: ["VLADIVOSTOK", "PETROPAVLOVSK"], fromSubs: ["ussr"], to: ["HONOLULU", "GUAM", "ANCHORAGE"], delay: 0 },
    { from: ["HONOLULU", "ANCHORAGE", "SEATTLE"], fromSubs: ["us"], to: ["VLADIVOSTOK", "PETROPAVLOVSK", "MAGADAN"], delay: 4000, retaliation: true },
    { from: ["LOS ANGELES", "SAN DIEGO", "OMAHA"], to: ["MOSCOW", "SVERDLOVSK", "NOVOSIBIRSK"], delay: 7000 }
  ],
  defcon: 3
};

SCENARIOS_1983["IRANIAN MANEUVER"] = {
  narrative: "Iranian Revolutionary Guard seizes Strait of Hormuz. US Central Command authorizes precision strike package.",
  waves: [
    { from: ["TEHRAN", "ISFAHAN"], to: ["RIYADH", "KUWAIT CITY", "DOHA", "ABU DHABI"], delay: 0 },
    { from: ["RIYADH", "DIEGO GARCIA"], to: ["TEHRAN", "ISFAHAN", "TABRIZ"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["NATO CONTAINMENT"] = {
  narrative: "NATO executes containment strike to halt Soviet armor at the Elbe. Escalation deliberately limited.",
  waves: [
    { from: ["FRANKFURT", "BERLIN", "BRUSSELS"], to: ["EAST BERLIN", "WARSAW", "GDANSK", "POZNAN"], delay: 0 },
    { from: ["MOSCOW", "WARSAW", "MINSK"], to: ["FRANKFURT", "BRUSSELS", "AMSTERDAM", "BONN"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["SWISS INCIDENT"] = {
  narrative: "Classified research facility on Swiss territory destroyed in unattributed strike. Both superpowers deny involvement.",
  waves: [
    { from: ["MOSCOW", "PARIS"], to: ["BERN", "VIENNA"], delay: 0 }
  ],
  defcon: 5
};

SCENARIOS_1983["CUBAN MINIMAL"] = {
  narrative: "Cuban forces conduct brief incursion into Guantanamo buffer zone. Washington issues final ultimatum.",
  waves: [
    { from: ["HAVANA"], to: ["MIAMI"], delay: 0 },
    { from: ["WASHINGTON DC", "MIAMI"], to: ["HAVANA"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["ICELAND ESCALATION"] = {
  narrative: "Soviet naval forces establish forward base in Icelandic waters, severing GIUK gap. NATO scrambles to respond.",
  waves: [
    { from: ["MURMANSK", "ARCHANGELSK"], fromSubs: ["ussr"], to: ["REYKJAVIK", "OSLO", "BERGEN"], delay: 0 },
    { from: ["REYKJAVIK", "LONDON", "OSLO"], fromSubs: ["us", "uk"], to: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], delay: 4000, retaliation: true },
    { from: ["WASHINGTON DC", "NORFOLK"], to: ["MURMANSK", "LENINGRAD", "ARCHANGELSK"], delay: 8000 }
  ],
  defcon: 3
};

SCENARIOS_1983["VIETNAMESE RETALIATION"] = {
  narrative: "Hanoi retaliates against Chinese punitive expedition with deep strikes into Yunnan and Guangxi. Beijing authorizes full southern theater response.",
  waves: [
    { from: ["HANOI", "DA NANG", "HO CHI MINH CITY"], to: ["GUANGZHOU", "KUNMING", "NANJING"], delay: 0 },
    { from: ["BEIJING", "GUANGZHOU", "KUNMING"], to: ["HANOI", "DA NANG", "HO CHI MINH CITY"], delay: 3000, retaliation: true },
    { from: ["HANOI", "HO CHI MINH CITY"], to: ["CHENGDU", "CHONGQING", "WUHAN"], delay: 7000 }
  ],
  defcon: 2
};

SCENARIOS_1983["SYRIAN PROVOCATION"] = {
  narrative: "Syrian armor crosses into Israeli-held Golan Heights under Iranian air umbrella. Tel Aviv considers nuclear release.",
  waves: [
    { from: ["DAMASCUS", "ALEPPO", "TEHRAN"], to: ["TEL AVIV", "JERUSALEM", "AMMAN"], delay: 0 },
    { from: ["TEL AVIV", "JERUSALEM"], to: ["DAMASCUS", "ALEPPO", "BEIRUT"], delay: 3000, retaliation: true },
    { from: ["RIYADH", "CAIRO", "ANKARA"], to: ["TEHRAN", "DAMASCUS", "BAGHDAD"], delay: 7000 }
  ],
  defcon: 3
};

SCENARIOS_1983["LIBYAN LOCAL"] = {
  narrative: "Libyan forces bombard Tunisian border positions. Egypt mobilizes on eastern flank.",
  waves: [
    { from: ["TRIPOLI", "BENGHAZI"], to: ["TUNIS", "ALGIERS"], delay: 0 },
    { from: ["TUNIS", "CAIRO"], to: ["TRIPOLI", "BENGHAZI"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["GABON TAKEOVER"] = {
  narrative: "Soviet-backed junta seizes Libreville oil terminals and expels French nationals. Paris authorizes full intervention; Moscow warns of consequences.",
  waves: [
    { from: ["PARIS", "LONDON", "MADRID"], fromSubs: ["france"], to: ["LIBREVILLE", "KINSHASA"], delay: 0 },
    { from: ["MOSCOW"], to: ["PARIS", "LONDON", "BRUSSELS"], delay: 4000, retaliation: true },
    { from: ["WASHINGTON DC", "NORFOLK"], fromSubs: ["us", "uk"], to: ["MOSCOW", "LENINGRAD", "ODESSA"], delay: 8000 }
  ],
  defcon: 2
};

SCENARIOS_1983["ROMANIAN WAR"] = {
  narrative: "Romania defects from the Pact, triggering full Soviet invasion. NATO and China intervene; global conflict ignites.",
  waves: [
    { from: ["MOSCOW", "KIEV", "ODESSA"], to: ["BUCHAREST", "CONSTANTA", "TIMISOARA", "SOFIA"], delay: 0 },
    { from: ["BUCHAREST", "BELGRADE", "ATHENS"], to: ["MOSCOW", "KIEV", "MINSK", "WARSAW"], delay: 3000, retaliation: true },
    { from: ["WASHINGTON DC", "FRANKFURT", "LONDON"], fromSubs: ["us", "uk", "france"], to: ["MOSCOW", "LENINGRAD", "SVERDLOVSK", "MINSK"], delay: 7000 },
    { from: ["MOSCOW", "LENINGRAD", "SVERDLOVSK"], fromSubs: ["ussr"], to: ["WASHINGTON DC", "NEW YORK", "LONDON", "FRANKFURT"], delay: 11000, retaliation: true }
  ],
  defcon: 1
};

SCENARIOS_1983["MIDDLE EAST OFFENSIVE"] = {
  narrative: "Coordinated Soviet-sponsored offensive sweeps from Levant to Gulf. US and Israeli forces initiate full nuclear response.",
  waves: [
    { from: ["MOSCOW", "DAMASCUS", "TEHRAN"], to: ["TEL AVIV", "RIYADH", "KUWAIT CITY", "CAIRO"], delay: 0 },
    { from: ["TEL AVIV", "RIYADH", "CAIRO"], to: ["DAMASCUS", "TEHRAN", "BAGHDAD", "MOSCOW"], delay: 4000, retaliation: true },
    { from: ["WASHINGTON DC", "LONDON", "DIEGO GARCIA"], fromSubs: ["us", "uk"], to: ["MOSCOW", "TEHRAN", "DAMASCUS"], delay: 8000 }
  ],
  defcon: 2
};

SCENARIOS_1983["DENMARK MASSIVE"] = {
  narrative: "Soviet Northern Fleet strikes Danish straits to sever NATO Baltic access. Danish and Norwegian assets respond with full theater salvo.",
  waves: [
    { from: ["MOSCOW", "LENINGRAD", "MURMANSK"], fromSubs: ["ussr"], to: ["COPENHAGEN", "OSLO", "HAMBURG"], delay: 0 },
    { from: ["COPENHAGEN", "OSLO", "HAMBURG"], fromSubs: ["us", "uk"], to: ["LENINGRAD", "MURMANSK", "RIGA"], delay: 4000, retaliation: true },
    { from: ["MOSCOW", "MINSK"], to: ["STOCKHOLM", "AMSTERDAM", "BRUSSELS"], delay: 8000 }
  ],
  defcon: 2
};

SCENARIOS_1983["CHILE CONFRONTATION"] = {
  narrative: "Santiago initiates coastal defense following disputed waters incident in Strait of Magellan. Argentine naval forces respond.",
  waves: [
    { from: ["SANTIAGO"], to: ["BUENOS AIRES", "CORDOBA"], delay: 0 },
    { from: ["BUENOS AIRES"], to: ["SANTIAGO"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["S.AFRICAN SUBVERSION"] = {
  narrative: "Pretoria authorizes covert destabilization operations against frontline states following border incursions.",
  waves: [
    { from: ["PRETORIA", "JOHANNESBURG"], to: ["KINSHASA", "NAIROBI", "KAMPALA"], delay: 0 },
    { from: ["NAIROBI", "KINSHASA"], to: ["JOHANNESBURG", "CAPE TOWN"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["USSR ALERT"] = {
  narrative: "Soviet strategic forces elevated to launch-ready following anomalous radar returns over Arctic. NORAD confirms false alarm too late.",
  waves: [
    { from: ["MOSCOW", "SVERDLOVSK", "NOVOSIBIRSK"], to: ["WASHINGTON DC", "NEW YORK", "CHICAGO"], delay: 0 },
    { from: ["OMAHA", "COLORADO SPRINGS"], to: ["MOSCOW", "LENINGRAD"], delay: 3000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["NICARAGUAN THRUST"] = {
  narrative: "Managua-based Soviet proxy forces conduct cross-border offensive into Honduras. Havana activates in solidarity.",
  waves: [
    { from: ["MANAGUA", "HAVANA"], to: ["TEGUCIGALPA", "SAN SALVADOR", "GUATEMALA CITY"], delay: 0 },
    { from: ["WASHINGTON DC", "MIAMI"], fromSubs: ["us"], to: ["MANAGUA", "HAVANA"], delay: 3000, retaliation: true },
    { from: ["MOSCOW"], fromSubs: ["ussr"], to: ["WASHINGTON DC", "MIAMI"], delay: 7000, retaliation: true },
    { fromSubs: ["us"], to: ["MURMANSK", "LENINGRAD"], delay: 10000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["GREENLAND DOMESTIC"] = {
  narrative: "Internal unrest at Thule Air Base triggers emergency evacuation. NORAD monitors for Soviet exploitation.",
  waves: [
    { from: ["THULE AB"], to: ["NUUK"], delay: 0 }
  ],
  defcon: 5
};

SCENARIOS_1983["ICELAND HEAVY"] = {
  narrative: "Reykjavik authorizes NATO pre-positioning strike against Soviet submarine pens. Northern Fleet retaliates with full theater salvo.",
  waves: [
    { from: ["REYKJAVIK"], to: ["MURMANSK", "ARCHANGELSK"], delay: 0 },
    { fromSubs: ["ussr"], to: ["REYKJAVIK", "OSLO", "GLASGOW"], delay: 2000 },
    { from: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], to: ["REYKJAVIK", "OSLO", "GLASGOW"], delay: 4000, retaliation: true },
    { from: ["OSLO", "GLASGOW", "EDINBURGH"], fromSubs: ["uk"], to: ["LENINGRAD", "MURMANSK"], delay: 7000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["KENYA OPTION"] = {
  narrative: "Nairobi requests US rapid deployment following Soviet-backed Ethiopian military movements on northern border.",
  waves: [
    { from: ["NAIROBI"], to: ["ADDIS ABABA", "KHARTOUM"], delay: 0 },
    { from: ["ADDIS ABABA"], to: ["NAIROBI", "KAMPALA"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["PACIFIC DEFENSE"] = {
  narrative: "US Pacific Command establishes defensive perimeter following North Korean ballistic missile test over Japanese waters.",
  waves: [
    { from: ["PYONGYANG"], to: ["SEOUL", "TOKYO"], delay: 0 },
    { from: ["HONOLULU", "GUAM"], fromSubs: ["us"], to: ["PYONGYANG", "VLADIVOSTOK"], delay: 4000, retaliation: true },
    { from: ["MOSCOW", "VLADIVOSTOK"], to: ["GUAM", "HONOLULU"], delay: 7000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["UGANDA MAXIMUM"] = {
  narrative: "Kampala offensive against Tanzanian border positions triggers regional escalation. Soviet advisors authorize full commitment.",
  waves: [
    { from: ["KAMPALA"], to: ["DAR ES SALAAM", "NAIROBI", "ADDIS ABABA"], delay: 0 },
    { from: ["NAIROBI", "DAR ES SALAAM"], to: ["KAMPALA", "KINSHASA"], delay: 3000, retaliation: true },
    { from: ["MOSCOW"], to: ["PRETORIA", "JOHANNESBURG", "NAIROBI"], delay: 7000 }
  ],
  defcon: 2
};

SCENARIOS_1983["THAI SUBVERSION"] = {
  narrative: "Vietnamese-backed insurgency reaches Bangkok suburbs. Thai forces request covert US assets; Hanoi denies involvement.",
  waves: [
    { from: ["HANOI", "HO CHI MINH CITY"], to: ["BANGKOK", "CHIANG MAI"], delay: 0 },
    { from: ["BANGKOK"], to: ["HANOI", "DA NANG"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["ROMANIAN STRIKE"] = {
  narrative: "Bucharest executes breakaway preemptive strike against Pact logistics hubs. Moscow responds immediately.",
  waves: [
    { from: ["BUCHAREST"], to: ["WARSAW", "BUDAPEST", "SOFIA"], delay: 0 },
    { from: ["MOSCOW", "KIEV", "MINSK"], to: ["BUCHAREST"], delay: 3000, retaliation: true },
    { from: ["WARSAW", "BUDAPEST"], to: ["BUCHAREST", "BELGRADE"], delay: 6000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["PAKISTAN SOVEREIGNTY"] = {
  narrative: "Islamabad authorizes tactical nuclear options following Indian armor breakthrough across Punjab.",
  waves: [
    { from: ["NEW DELHI", "MUMBAI", "CALCUTTA"], to: ["LAHORE", "ISLAMABAD", "KARACHI"], delay: 0 },
    { from: ["ISLAMABAD", "LAHORE"], to: ["NEW DELHI", "MUMBAI", "CALCUTTA"], delay: 3000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["AFGHAN MISDIRECTION"] = {
  narrative: "Soviet forces in Kabul conduct feint toward Khyber Pass while main column advances on Kandahar. Pakistani ISI responds.",
  waves: [
    { from: ["KABUL"], to: ["ISLAMABAD", "KARACHI"], delay: 0 },
    { from: ["ISLAMABAD"], to: ["KABUL", "TEHRAN"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["ETHIOPIAN LOCAL"] = {
  narrative: "Addis Ababa authorizes ground offensive against Somali-backed separatists in Ogaden. Cuban forces provide air cover.",
  waves: [
    { from: ["ADDIS ABABA", "HAVANA"], to: ["MOGADISHU"], delay: 0 },
    { from: ["MOGADISHU"], to: ["ADDIS ABABA"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["ITALIAN TAKEOVER"] = {
  narrative: "Warsaw Pact forces pre-position along Austrian border as Italian Communist Party nears electoral control. NATO activates Article 5.",
  waves: [
    { from: ["EAST BERLIN", "BUDAPEST", "BELGRADE"], to: ["ROME", "MILAN", "NAPLES"], delay: 0 },
    { from: ["ROME", "MILAN"], to: ["EAST BERLIN", "WARSAW", "BUDAPEST"], delay: 3000, retaliation: true },
    { from: ["MOSCOW", "KIEV"], to: ["PARIS", "LONDON", "FRANKFURT"], delay: 7000 },
    { fromSubs: ["ussr"], to: ["LONDON", "NORFOLK", "NEW YORK"], delay: 5000 },
    { fromSubs: ["us", "uk", "france"], to: ["MOSCOW", "LENINGRAD", "MURMANSK"], delay: 10000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["VIETNAMESE INCIDENT"] = {
  narrative: "Hanoi naval vessel fires on US destroyer in Gulf of Tonkin. Congress authorizes retaliatory strikes within the hour.",
  waves: [
    { from: ["HANOI"], to: ["GUAM"], delay: 0 },
    { from: ["GUAM", "HONOLULU"], fromSubs: ["us"], to: ["HANOI", "HO CHI MINH CITY", "DA NANG"], delay: 3000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["ENGLISH PREEMPTIVE"] = {
  narrative: "London authorizes Polaris preemptive launch against Soviet Northern Fleet after confirmed SSBN deployment to Irish Sea.",
  waves: [
    { from: ["LONDON", "GLASGOW", "EDINBURGH"], fromSubs: ["uk"], to: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], delay: 0 },
    { fromSubs: ["ussr"], to: ["LONDON", "GLASGOW", "EDINBURGH"], delay: 2000 },
    { from: ["MOSCOW", "MURMANSK", "LENINGRAD"], to: ["LONDON", "MANCHESTER", "BIRMINGHAM"], delay: 4000, retaliation: true },
    { from: ["GLASGOW", "EDINBURGH"], fromSubs: ["uk"], to: ["MOSCOW", "MINSK"], delay: 7000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["DENMARK ALTERNATE"] = {
  narrative: "NATO alternate plan routes Baltic reinforcements through Jutland following primary corridor interdiction.",
  waves: [
    { from: ["HAMBURG", "OSLO"], to: ["RIGA", "LENINGRAD"], delay: 0 },
    { from: ["LENINGRAD", "MURMANSK"], to: ["OSLO", "COPENHAGEN"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["THAI CONFRONTATION"] = {
  narrative: "Thai and Vietnamese forces exchange fire across the Mekong. SEATO obligations trigger US naval response from Subic Bay.",
  waves: [
    { from: ["BANGKOK"], to: ["HANOI", "DA NANG", "HO CHI MINH CITY"], delay: 0 },
    { from: ["HANOI", "HO CHI MINH CITY"], to: ["BANGKOK", "PHNOM PENH"], delay: 3000, retaliation: true },
    { from: ["SUBIC BAY", "GUAM"], fromSubs: ["us"], to: ["HANOI", "HO CHI MINH CITY"], delay: 6000 }
  ],
  defcon: 4
};

SCENARIOS_1983["TAIWAN SURPRISE"] = {
  narrative: "Beijing launches coordinated amphibious and missile strike against Taiwan following failed reunification ultimatum.",
  waves: [
    { from: ["BEIJING", "SHANGHAI", "GUANGZHOU"], to: ["TAIPEI", "KAOHSIUNG"], delay: 0 },
    { from: ["TAIPEI", "KAOHSIUNG"], to: ["BEIJING", "SHANGHAI", "GUANGZHOU"], delay: 3000, retaliation: true },
    { from: ["BEIJING", "NANJING", "WUHAN"], to: ["TOKYO", "SEOUL", "GUAM"], delay: 7000 }
  ],
  defcon: 2
};

SCENARIOS_1983["BRAZILIAN STRIKE"] = {
  narrative: "Brasilia activates contingency strike following Argentine forward deployment along disputed Parana basin.",
  waves: [
    { from: ["SAO PAULO", "RIO DE JANEIRO", "BRASILIA"], to: ["BUENOS AIRES", "CORDOBA"], delay: 0 },
    { from: ["BUENOS AIRES"], to: ["SAO PAULO", "RIO DE JANEIRO"], delay: 4000, retaliation: true },
    { from: ["BRASILIA", "SAO PAULO"], to: ["SANTIAGO", "CARACAS"], delay: 8000 }
  ],
  defcon: 2
};

SCENARIOS_1983["VENEZUELA SUDDEN"] = {
  narrative: "Caracas executes sudden strike against Colombian oil infrastructure following nationalization dispute.",
  waves: [
    { from: ["CARACAS", "MARACAIBO"], to: ["BOGOTA", "LIMA"], delay: 0 },
    { from: ["BOGOTA", "LIMA"], to: ["CARACAS", "MARACAIBO"], delay: 4000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["MALAYSIAN ALERT"] = {
  narrative: "Kuala Lumpur elevates maritime forces following Vietnamese naval incursion into disputed Spratly waters.",
  waves: [
    { from: ["HANOI", "HO CHI MINH CITY"], to: ["KUALA LUMPUR", "SINGAPORE"], delay: 0 },
    { from: ["KUALA LUMPUR"], to: ["HANOI", "HO CHI MINH CITY"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["ISRAEL DISCRETIONARY"] = {
  narrative: "Jerusalem authorizes discretionary nuclear alert following Syrian armor concentration on Golan Heights.",
  waves: [
    { from: ["DAMASCUS", "ALEPPO"], to: ["TEL AVIV", "JERUSALEM"], delay: 0 },
    { from: ["TEL AVIV", "JERUSALEM"], to: ["DAMASCUS", "ALEPPO", "BEIRUT"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["LIBYAN ACTION"] = {
  narrative: "Tripoli strikes US naval assets in Gulf of Sidra. Sixth Fleet retaliates with carrier strikes; regional forces mobilize.",
  waves: [
    { from: ["TRIPOLI", "BENGHAZI"], to: ["NAPLES", "SIGONELLA NAS"], delay: 0 },
    { fromSubs: ["us"], to: ["TRIPOLI", "BENGHAZI"], delay: 2000, retaliation: true },
    { from: ["CAIRO", "ALGIERS"], to: ["TRIPOLI", "BENGHAZI"], delay: 5000 }
  ],
  defcon: 3
};

SCENARIOS_1983["PALESTINIAN TACTICAL"] = {
  narrative: "Palestinian tactical forces execute coordinated cross-border strikes from Lebanon. IDF mounts immediate punitive response.",
  waves: [
    { from: ["BEIRUT", "DAMASCUS"], to: ["TEL AVIV", "JERUSALEM"], delay: 0 },
    { from: ["TEL AVIV", "JERUSALEM"], to: ["BEIRUT", "DAMASCUS", "ALEPPO"], delay: 3000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["NATO ALTERNATE"] = {
  narrative: "NATO alternate command activated following primary HQ destruction. Dispersed nodes execute pre-delegated strike authority.",
  waves: [
    { from: ["MOSCOW", "MINSK", "WARSAW"], to: ["BRUSSELS", "LONDON", "PARIS", "FRANKFURT"], delay: 0 },
    { from: ["LONDON", "PARIS", "FRANKFURT"], to: ["MOSCOW", "MINSK", "WARSAW"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["CYPRUS MANEUVER"] = {
  narrative: "Nicosia becomes flashpoint as Greek and Turkish Cypriot forces exchange fire near the Green Line.",
  waves: [
    { from: ["NICOSIA"], to: ["ANKARA", "ISTANBUL"], delay: 0 },
    { from: ["ANKARA", "ISTANBUL"], to: ["NICOSIA", "ATHENS"], delay: 3000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["EGYPT MISDIRECTION"] = {
  narrative: "Cairo executes feint against Libyan positions while repositioning armor toward Suez. Israeli intelligence detects the misdirection.",
  waves: [
    { from: ["CAIRO", "ALEXANDRIA"], to: ["TRIPOLI", "BENGHAZI"], delay: 0 },
    { from: ["TRIPOLI"], to: ["CAIRO", "ALEXANDRIA"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["BANGLADESH THRUST"] = {
  narrative: "Dhaka authorizes cross-border thrust following Burmese harassment of Bengali refugees. Indian forces mobilize in support.",
  waves: [
    { from: ["DHAKA", "CHITTAGONG"], to: ["RANGOON", "MANDALAY"], delay: 0 },
    { from: ["RANGOON"], to: ["DHAKA", "CALCUTTA"], delay: 3000, retaliation: true },
    { from: ["NEW DELHI", "CALCUTTA"], to: ["RANGOON", "MANDALAY"], delay: 6000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["KENYA DEFENSE"] = {
  narrative: "Nairobi activates defensive posture following Ugandan armor crossing at Malaba. British forces requested from Mombasa.",
  waves: [
    { from: ["KAMPALA"], to: ["NAIROBI", "MOMBASA"], delay: 0 },
    { from: ["NAIROBI", "MOMBASA"], fromSubs: ["uk"], to: ["KAMPALA"], delay: 3000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["BANGLADESH CONTAINMENT"] = {
  narrative: "Indian strategic command initiates containment after Dhaka requests Chinese military advisors. Pakistan exploits the distraction.",
  waves: [
    { from: ["NEW DELHI", "CALCUTTA"], to: ["DHAKA", "CHITTAGONG"], delay: 0 },
    { from: ["DHAKA"], to: ["CALCUTTA", "CHENNAI"], delay: 4000, retaliation: true },
    { from: ["ISLAMABAD", "LAHORE"], to: ["NEW DELHI", "MUMBAI"], delay: 6000 }
  ],
  defcon: 4
};

SCENARIOS_1983["VIETNAMESE STRIKE"] = {
  narrative: "Hanoi launches coordinated strike against Chinese border installations. Beijing retaliates with artillery and SRBM barrage.",
  waves: [
    { from: ["HANOI", "DA NANG", "HO CHI MINH CITY"], to: ["GUANGZHOU", "KUNMING", "NANJING"], delay: 0 },
    { from: ["BEIJING", "GUANGZHOU", "KUNMING"], to: ["HANOI", "DA NANG", "HO CHI MINH CITY"], delay: 3000, retaliation: true },
    { from: ["HANOI"], to: ["CHENGDU", "CHONGQING", "WUHAN"], delay: 7000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["ALBANIAN CONTAINMENT"] = {
  narrative: "NATO southern flank executes containment of Albanian provocations along Greek border. Belgrade monitors nervously.",
  waves: [
    { from: ["ATHENS", "ROME"], to: ["TIRANA"], delay: 0 },
    { from: ["TIRANA", "BELGRADE"], to: ["ATHENS", "ROME"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["GABON SURPRISE"] = {
  narrative: "Surprise coup attempt in Libreville catches French intelligence off guard. Soviet transport aircraft detected en route. Paris scrambles intervention force.",
  waves: [
    { from: ["PARIS", "MARSEILLE"], fromSubs: ["france"], to: ["LIBREVILLE", "BRAZZAVILLE"], delay: 0 },
    { from: ["MOSCOW"], to: ["PARIS", "MARSEILLE"], delay: 5000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["IRAQ SOVEREIGNTY"] = {
  narrative: "Baghdad asserts sovereignty over disputed Shatt al-Arab waterway with massed armor. Tehran mobilizes; both sides deploy tactical warheads.",
  waves: [
    { from: ["BAGHDAD", "BASRA"], to: ["TEHRAN", "ISFAHAN", "TABRIZ"], delay: 0 },
    { from: ["TEHRAN", "ISFAHAN"], to: ["BAGHDAD", "BASRA", "MOSUL"], delay: 3000, retaliation: true },
    { from: ["RIYADH", "KUWAIT CITY"], to: ["BAGHDAD", "TEHRAN"], delay: 7000 }
  ],
  defcon: 2
};

SCENARIOS_1983["VIETNAMESE SUDDEN"] = {
  narrative: "Hanoi executes sudden coordinated strike on Chinese positions along the border. PLAN naval forces sortie from Hainan.",
  waves: [
    { from: ["HANOI", "HO CHI MINH CITY"], to: ["GUANGZHOU", "KUNMING"], delay: 0 },
    { from: ["BEIJING", "GUANGZHOU"], fromSubs: ["china"], to: ["HANOI", "HO CHI MINH CITY", "DA NANG"], delay: 3000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["LEBANON INTERDICTION"] = {
  narrative: "US Marines and French paratroopers interdict Syrian resupply corridor through the Bekaa Valley. Damascus retaliates.",
  waves: [
    { from: ["DIEGO GARCIA", "PARIS"], fromSubs: ["us", "france"], to: ["BEIRUT", "DAMASCUS"], delay: 0 },
    { from: ["DAMASCUS", "ALEPPO"], to: ["TEL AVIV", "JERUSALEM", "NAPLES"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["TAIWAN DOMESTIC"] = {
  narrative: "Internal political crisis in Taipei prompts PRC saber-rattling. Limited missile tests bracket the island.",
  waves: [
    { from: ["BEIJING", "SHANGHAI"], to: ["TAIPEI", "KAOHSIUNG"], delay: 0 },
    { from: ["TAIPEI"], to: ["GUANGZHOU", "SHENZHEN"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["ALGERIAN SOVEREIGNTY"] = {
  narrative: "Algiers asserts sovereignty over disputed Saharan border zone. Moroccan and Libyan forces both mobilize in response.",
  waves: [
    { from: ["ALGIERS", "ORAN"], to: ["RABAT", "CASABLANCA", "TRIPOLI"], delay: 0 },
    { from: ["RABAT", "TRIPOLI"], to: ["ALGIERS", "ORAN"], delay: 3000, retaliation: true }
  ],
  defcon: 2
};

SCENARIOS_1983["ARABIAN STRIKE"] = {
  narrative: "Combined Iranian-Iraqi surprise strike targets Saudi oil infrastructure and Gulf shipping. US Fifth Fleet activates.",
  waves: [
    { from: ["TEHRAN", "BAGHDAD"], to: ["RIYADH", "JEDDAH", "KUWAIT CITY", "ABU DHABI"], delay: 0 },
    { from: ["RIYADH", "DIEGO GARCIA"], to: ["TEHRAN", "BAGHDAD", "BASRA"], delay: 3000, retaliation: true },
    { from: ["WASHINGTON DC", "NORFOLK"], fromSubs: ["us"], to: ["TEHRAN", "BAGHDAD", "BASRA"], delay: 7000 }
  ],
  defcon: 2
};

SCENARIOS_1983["ATLANTIC SUDDEN"] = {
  narrative: "Soviet submarine wolf pack surfaces and launches without warning against US East Coast population centers. STRATCOM orders immediate retaliatory strike.",
  waves: [
    { fromSubs: ["ussr"], to: ["NEW YORK", "BOSTON", "NORFOLK", "WASHINGTON DC"], delay: 0 },
    { from: ["WASHINGTON DC", "OMAHA", "NORFOLK"], fromSubs: ["us"], to: ["MOSCOW", "LENINGRAD", "MURMANSK"], delay: 3000, retaliation: true },
    { from: ["LONDON", "PARIS"], fromSubs: ["uk", "france"], to: ["LENINGRAD", "ARCHANGELSK"], delay: 6000 }
  ],
  defcon: 2
};

SCENARIOS_1983["MONGOLIAN THRUST"] = {
  narrative: "Soviet armored divisions thrust through Mongolia toward Beijing. PLA mobilizes northern military regions for defense in depth.",
  waves: [
    { from: ["ULAANBAATAR", "IRKUTSK", "NOVOSIBIRSK"], to: ["BEIJING", "HARBIN", "SHENYANG"], delay: 0 },
    { from: ["BEIJING", "HARBIN", "SHENYANG"], to: ["ULAANBAATAR", "IRKUTSK", "VLADIVOSTOK"], delay: 3000, retaliation: true },
    { from: ["MOSCOW", "SVERDLOVSK"], fromSubs: ["ussr"], to: ["BEIJING", "SHANGHAI", "CHENGDU"], delay: 7000 }
  ],
  defcon: 2
};

SCENARIOS_1983["POLISH DECOY"] = {
  narrative: "Polish military exercises near the Baltic simulate an incursion toward NATO lines. SACEUR assesses as a feint.",
  waves: [
    { from: ["WARSAW", "GDANSK"], to: ["BERLIN", "HAMBURG"], delay: 0 },
    { from: ["BERLIN", "HAMBURG"], to: ["WARSAW", "GDANSK", "POZNAN"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["ALASKAN DISCRETIONARY"] = {
  narrative: "Soviet Bear bombers probe Alaskan ADIZ for the third time this week. NORAD authorizes discretionary intercept.",
  waves: [
    { from: ["PETROPAVLOVSK", "MAGADAN"], to: ["ANCHORAGE"], delay: 0 },
    { from: ["ANCHORAGE", "SEATTLE"], to: ["PETROPAVLOVSK", "VLADIVOSTOK"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["CANADIAN THRUST"] = {
  narrative: "Soviet Arctic forces execute surprise thrust through Canadian Arctic archipelago targeting DEW Line stations and NORAD relay sites.",
  waves: [
    { from: ["MURMANSK", "ARCHANGELSK"], fromSubs: ["ussr"], to: ["OTTAWA", "TORONTO", "MONTREAL", "HALIFAX"], delay: 0 },
    { from: ["OTTAWA", "TORONTO", "VANCOUVER"], to: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], delay: 3000, retaliation: true },
    { from: ["WASHINGTON DC", "OMAHA"], fromSubs: ["us"], to: ["MOSCOW", "SVERDLOVSK", "NOVOSIBIRSK"], delay: 7000 }
  ],
  defcon: 2
};

SCENARIOS_1983["ARABIAN LIGHT"] = {
  narrative: "Limited exchange of fire between Iranian patrol boats and Saudi naval forces in the Persian Gulf. Both sides stand down.",
  waves: [
    { from: ["TEHRAN"], to: ["RIYADH", "KUWAIT CITY"], delay: 0 },
    { from: ["RIYADH"], to: ["TEHRAN"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["S.AFRICAN DOMESTIC"] = {
  narrative: "Internal unrest in South African townships triggers state of emergency. Regional neighbors close borders.",
  waves: [
    { from: ["PRETORIA", "JOHANNESBURG"], to: ["CAPE TOWN", "DURBAN"], delay: 0 }
  ],
  defcon: 5
};

SCENARIOS_1983["TUNISIAN INCIDENT"] = {
  narrative: "Tunis intercepts Libyan special forces at Medenine border. French Jaguar aircraft deploy to Bizerte.",
  waves: [
    { from: ["TRIPOLI", "BENGHAZI"], to: ["TUNIS"], delay: 0 },
    { from: ["TUNIS", "PARIS"], fromSubs: ["france"], to: ["TRIPOLI", "BENGHAZI"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["MALAYSIAN MANEUVER"] = {
  narrative: "Kuala Lumpur conducts naval maneuver through contested South China Sea lanes. Vietnamese boats intercept.",
  waves: [
    { from: ["KUALA LUMPUR"], to: ["HANOI", "DA NANG"], delay: 0 },
    { from: ["HANOI", "HO CHI MINH CITY"], to: ["KUALA LUMPUR", "SINGAPORE"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["JAMAICA DECOY"] = {
  narrative: "Kingston becomes site of Soviet intelligence cutout targeting US Caribbean signals infrastructure.",
  waves: [
    { from: ["KINGSTON"], to: ["MIAMI", "HOUSTON"], delay: 0 },
    { from: ["MIAMI"], to: ["KINGSTON", "HAVANA"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["MALAYSIAN MINIMAL"] = {
  narrative: "Kuala Lumpur executes minimal strike against piracy staging bases in disputed waters. Jakarta lodges protest.",
  waves: [
    { from: ["KUALA LUMPUR"], to: ["JAKARTA", "SINGAPORE"], delay: 0 }
  ],
  defcon: 5
};

SCENARIOS_1983["RUSSIAN SOVEREIGNTY"] = {
  narrative: "Moscow asserts sovereignty over disputed Arctic shelf. NORAD detects full ICBM silo flush; TACAMO aircraft go airborne.",
  waves: [
    { from: ["MOSCOW", "MURMANSK", "ARCHANGELSK"], fromSubs: ["ussr"], to: ["WASHINGTON DC", "NEW YORK", "OMAHA"], delay: 0 },
    { from: ["OMAHA", "COLORADO SPRINGS", "NORFOLK"], fromSubs: ["us", "uk"], to: ["MOSCOW", "LENINGRAD", "SVERDLOVSK"], delay: 3000, retaliation: true },
    { from: ["LENINGRAD", "KIEV", "MINSK"], fromSubs: ["ussr"], to: ["LONDON", "FRANKFURT", "PARIS"], delay: 7000 }
  ],
  defcon: 2
};

SCENARIOS_1983["CHAD OPTION"] = {
  narrative: "Ndjamena executes strike against Libyan-held Aouzou Strip following UN resolution failure. French forces provide air cover.",
  waves: [
    { from: ["NDJAMENA", "PARIS"], fromSubs: ["france"], to: ["TRIPOLI", "BENGHAZI"], delay: 0 },
    { from: ["TRIPOLI"], to: ["NDJAMENA", "KHARTOUM"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["BANGLADESH WAR"] = {
  narrative: "Dhaka requests Chinese military advisors, triggering three-front crisis. India mobilizes, Pakistan exploits; regional nuclear threshold breached.",
  waves: [
    { from: ["DHAKA", "CHITTAGONG"], to: ["CALCUTTA", "NEW DELHI", "RANGOON"], delay: 0 },
    { from: ["NEW DELHI", "CALCUTTA", "MUMBAI"], to: ["DHAKA", "CHITTAGONG", "ISLAMABAD"], delay: 3000, retaliation: true },
    { from: ["ISLAMABAD", "LAHORE", "KARACHI"], to: ["NEW DELHI", "MUMBAI", "CALCUTTA"], delay: 6000 }
  ],
  defcon: 1
};

SCENARIOS_1983["BURMESE CONTAINMENT"] = {
  narrative: "Rangoon containment targets Karen insurgent supply routes crossing Thai border. Bangkok protests.",
  waves: [
    { from: ["RANGOON", "MANDALAY"], to: ["BANGKOK", "CHIANG MAI"], delay: 0 },
    { from: ["BANGKOK"], to: ["RANGOON", "MANDALAY"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["ASIAN THEATERWIDE"] = {
  narrative: "Simultaneous Sino-Soviet deterioration and Korean escalation triggers full Pacific theater activation.",
  waves: [
    { from: ["BEIJING", "SHENYANG", "HARBIN"], to: ["MOSCOW", "IRKUTSK", "VLADIVOSTOK"], delay: 0 },
    { from: ["MOSCOW", "VLADIVOSTOK", "IRKUTSK"], to: ["BEIJING", "SHENYANG", "HARBIN"], delay: 3000, retaliation: true },
    { from: ["PYONGYANG", "SEOUL", "TOKYO"], to: ["BEIJING", "VLADIVOSTOK", "SHANGHAI"], delay: 6000 },
    { from: ["WASHINGTON DC", "GUAM", "HONOLULU"], fromSubs: ["us"], to: ["MOSCOW", "BEIJING", "VLADIVOSTOK"], delay: 8000 }
  ],
  defcon: 2
};

SCENARIOS_1983["BULGARIAN CLANDESTINE"] = {
  narrative: "Sofia runs clandestine destabilization network through Turkish dissident channels. Ankara discovers the operation.",
  waves: [
    { from: ["SOFIA"], to: ["ISTANBUL", "ANKARA"], delay: 0 },
    { from: ["ANKARA", "ISTANBUL"], to: ["SOFIA", "BELGRADE"], delay: 4000, retaliation: true }
  ],
  defcon: 5
};

SCENARIOS_1983["GREENLAND INCURSION"] = {
  narrative: "Soviet airborne forces seize Thule Air Base communications relay. NORAD declares Arctic ADIZ breached.",
  waves: [
    { from: ["MURMANSK", "ARCHANGELSK"], fromSubs: ["ussr"], to: ["THULE AB", "NUUK"], delay: 0 },
    { from: ["NUUK", "OTTAWA"], to: ["MURMANSK", "ARCHANGELSK"], delay: 4000, retaliation: true },
    { fromSubs: ["us"], to: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], delay: 7000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["EGYPT SURGICAL"] = {
  narrative: "Cairo executes surgical strike against Libyan armor staging in Cyrenaica. Alexandria naval base sorties to establish exclusion zone.",
  waves: [
    { from: ["CAIRO", "ALEXANDRIA"], to: ["TRIPOLI", "BENGHAZI"], delay: 0 },
    { from: ["TRIPOLI", "BENGHAZI"], to: ["CAIRO", "ALEXANDRIA"], delay: 4000, retaliation: true }
  ],
  defcon: 3
};

SCENARIOS_1983["CZECH HEAVY"] = {
  narrative: "Prague reformist government expels Soviet garrison. Moscow launches heavy strike to restore Pact discipline. NATO intervenes on Czechoslovak behalf.",
  waves: [
    { from: ["MOSCOW", "MINSK", "KIEV"], to: ["PRAGUE", "BRATISLAVA", "BRNO"], delay: 0 },
    { from: ["WARSAW", "BUDAPEST", "EAST BERLIN"], to: ["PRAGUE", "BRATISLAVA"], delay: 3000 },
    { from: ["PRAGUE", "BRATISLAVA", "VIENNA"], to: ["MOSCOW", "WARSAW", "BUDAPEST"], delay: 6000, retaliation: true },
    { from: ["FRANKFURT", "LONDON", "PARIS"], fromSubs: ["us", "uk"], to: ["MOSCOW", "MINSK", "KIEV"], delay: 9000 }
  ],
  defcon: 2
};

SCENARIOS_1983["TAIWAN CONFRONTATION"] = {
  narrative: "Beijing conducts live-fire exercise bisecting Taiwan Strait shipping. Taipei elevates alert; US 7th Fleet repositions.",
  waves: [
    { from: ["BEIJING", "SHANGHAI"], to: ["TAIPEI", "KAOHSIUNG"], delay: 0 },
    { from: ["TAIPEI", "KAOHSIUNG"], to: ["BEIJING", "GUANGZHOU", "NANJING"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};

SCENARIOS_1983["GREENLAND MAXIMUM"] = {
  narrative: "Soviet occupation of Greenland triggers full NATO Article 5 response. Denmark invokes nuclear release authority.",
  waves: [
    { from: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], fromSubs: ["ussr"], to: ["THULE AB", "NUUK", "REYKJAVIK"], delay: 0 },
    { from: ["NUUK", "REYKJAVIK", "OSLO"], to: ["MURMANSK", "ARCHANGELSK", "LENINGRAD"], delay: 3000, retaliation: true },
    { from: ["MOSCOW", "MINSK"], to: ["COPENHAGEN", "OSLO", "LONDON", "OTTAWA"], delay: 6000 },
    { from: ["WASHINGTON DC", "OMAHA"], fromSubs: ["us", "uk"], to: ["MOSCOW", "MURMANSK", "SVERDLOVSK"], delay: 8000 }
  ],
  defcon: 2
};

SCENARIOS_1983["UGANDA OFFENSIVE"] = {
  narrative: "Kampala offensive sweeps across Tanzanian border with Soviet-supplied armor. Nairobi activates mutual defense pact.",
  waves: [
    { from: ["KAMPALA"], to: ["DAR ES SALAAM", "NAIROBI"], delay: 0 },
    { from: ["NAIROBI", "DAR ES SALAAM"], to: ["KAMPALA"], delay: 3000, retaliation: true },
    { from: ["KINSHASA", "KHARTOUM"], to: ["KAMPALA"], delay: 7000 }
  ],
  defcon: 2
};

SCENARIOS_1983["CASPIAN DEFENSE"] = {
  narrative: "Baku petroleum infrastructure targeted by Iranian Revolutionary Guard following Caspian drilling rights dispute.",
  waves: [
    { from: ["TEHRAN", "TABRIZ"], to: ["BAKU", "TBILISI"], delay: 0 },
    { from: ["BAKU", "TBILISI"], to: ["TEHRAN", "TABRIZ", "ISFAHAN"], delay: 4000, retaliation: true }
  ],
  defcon: 4
};
