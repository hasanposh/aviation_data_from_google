const REGION = "Belgium, Europe";

const AIRPORTS = [
  // Aerodromes
  { "name": "Amougies Airfield", "code": "" },
  { "name": "Antwerp International Airport", "code": "ANR" },
  { "name": "Arlon-Sterpenich Aerodrome", "code": "" },
  { "name": "Maillen Airfield", "code": "" },
  { "name": "Ath/Isières Airfield", "code": "" },
  { "name": "Balen-Keiheuvel Aerodrome", "code": "" },
  { "name": "Beauvechain Air Base", "code": "" },
  { "name": "Jehonville Air Base", "code": "" },
  { "name": "Brasschaat Airfield", "code": "" },
  { "name": "Ostend–Bruges International Airport", "code": "OST" },
  { "name": "Brussels International Airport", "code": "BRU" },
  { "name": "Melsbroek Air Base", "code": "" },
  { "name": "Sint-Truiden / Brustem Airfield", "code": "" },
  { "name": "Büllingen Airfield", "code": "" },
  { "name": "Cerfontaine Airfield", "code": "" },
  { "name": "Brussels South Charleroi Airport", "code": "CRL" },
  { "name": "Chièvres Air Base", "code": "" },
  { "name": "Doische Airfield", "code": "" },
  { "name": "Liernu Airfield", "code": "" },
  { "name": "Elsenborn-Butgenbach Air Base", "code": "" },
  { "name": "Florennes Air Base", "code": "" },
  { "name": "Baisy-Thy Airfield", "code": "" },
  { "name": "Zwartberg Airfield", "code": "" },
  { "name": "Overboelare Airfield", "code": "" },
  { "name": "Goetsenhoven Airfield", "code": "" },
  { "name": "Grimbergen Airfield", "code": "" },
  { "name": "Avernas-le-Bauduin Airfield", "code": "" },
  { "name": "Kiewit Airfield", "code": "" },
  { "name": "Hoevenen Airfield", "code": "" },
  { "name": "Kleine Brogel Air Base", "code": "" },
  { "name": "Koksijde Air Base", "code": "" },
  { "name": "Flanders International Airport", "code": "KJK" },
  { "name": "Leopoldsburg/Beverlo Airfield", "code": "" },
  { "name": "Liège Airport", "code": "LGG" },
  { "name": "Moorsele Airfield", "code": "" },
  { "name": "Namur-Suarlée Airfield", "code": "" },
  { "name": "Neerpelt Airfield", "code": "" },
  { "name": "Saint-Ghislain Airfield", "code": "" },
  { "name": "Saint-Hubert Air Base", "code": "" },
  { "name": "Saint-Hubert Airfield", "code": "" },
  { "name": "Schaffen Air Base", "code": "" },
  { "name": "Spa-La Sauvenière Airfield", "code": "" },
  { "name": "Verviers-Theux Airfield", "code": "" },
  { "name": "Tournai-Maubray Airfield", "code": "" },
  { "name": "Ursel Air Base", "code": "" },
  { "name": "Orchimont Aerodrome", "code": "" },
  { "name": "Weelde Air Base", "code": "" },
  { "name": "Oostmalle Airfield", "code": "" },
  { "name": "Zuienkerke Airfield", "code": "" },
  { "name": "Zutendaal Air Base", "code": "" },

  // Heliports
  { "name": "Aalst Hospital Heliport", "code": "" },
  { "name": "Erasmus Hospital Heliport", "code": "" },
  { "name": "Antwerp/Commandant Fourcault Heliport", "code": "" },
  { "name": "Antwerp/Kiel Heliport", "code": "" },
  { "name": "Antwerp/Middelheim Hospital Heliport", "code": "" },
  { "name": "Brecht/Keysers Heliport", "code": "" },
  { "name": "Brecht/Luyckx Heliport", "code": "" },
  { "name": "Brecht/Vochten Heliport", "code": "" },
  { "name": "AZ Sint-Jan Heliport", "code": "" },
  { "name": "Sint-Lucas Hospital Heliport", "code": "" },
  { "name": "Diksmuide Heliport", "code": "" },
  { "name": "Dilsen-Stokkem/Lanklaar Heliport", "code": "" },
  { "name": "Baudour Heliport", "code": "" },
  { "name": "Universitair Ziekenhuis Antwerpen Hospital Heliport", "code": "" },
  { "name": "Evergem/Belzele Heliport", "code": "" },
  { "name": "Francorchamps Heliport", "code": "" },
  { "name": "Ghent/Industry Zone Heliport", "code": "" },
  { "name": "Halen Heliport", "code": "" },
  { "name": "Ham Heliport", "code": "" },
  { "name": "Hasselt/Maasland Heliport", "code": "" },
  { "name": "Holsbeek Heliport", "code": "" },
  { "name": "Houthalen Heliport", "code": "" },
  { "name": "Tielen/Kasterlee Heliport", "code": "" },
  { "name": "Knokke-Heist/Westkapelle Heliport", "code": "" },
  { "name": "Kruishoutem/Sons Heliport", "code": "" },
  { "name": "Nokere/Suys Heliport", "code": "" },
  { "name": "Kuurne Heliport", "code": "" },
  { "name": "Shape Pad Heliport", "code": "" },
  { "name": "UZ Leuven Hospital Heliport", "code": "" },
  { "name": "CHR de La Citadelle Hospital Heliport", "code": "" },
  { "name": "Centre Hospitalier Heliport", "code": "" },
  { "name": "Centre Médical Héliporté ASBL (CMH) Heliport", "code": "" },
  { "name": "Lint Heliport", "code": "" },
  { "name": "Zaffelare Heliport", "code": "" },
  { "name": "Grand Hôpital de Charleroi (GHDC Asbl) Heliport", "code": "" },
  { "name": "Lummen Heliport", "code": "" },
  { "name": "Meerbeek Heliport", "code": "" },
  { "name": "Meise/Wolvertem Heliport", "code": "" },
  { "name": "Meulebeke Heliport", "code": "" },
  { "name": "Brakel/Michelbeke Heliport", "code": "" },
  { "name": "Centre Hospitalier Universitaire A. Vésale Heliport", "code": "" },
  { "name": "Clinique Saint-Luc Bouge Heliport", "code": "" },
  { "name": "Neerpelt/Tilburgs Heliport", "code": "" },
  { "name": "Oostende Heliport", "code": "" },
  { "name": "Oud-Heverlee/Blanden Heliport", "code": "" },
  { "name": "Pecq/Warcoing Heliport", "code": "" },
  { "name": "Buzet Airfield", "code": "" },
  { "name": "Ranst/Engels Heliport", "code": "" },
  { "name": "Ranst/Lymar Heliport", "code": "" },
  { "name": "Ranst/Van Den Bosch Heliport", "code": "" },
  { "name": "Reninge Heliport", "code": "" },
  { "name": "Rotselaar Heliport", "code": "" },
  { "name": "Roeselare/Rumbeke Heliport", "code": "" },
  { "name": "Schilde/'s-Gravenwezel Heliport", "code": "" },
  { "name": "Sint-Pieters-Leeuw Heliport", "code": "" },
  { "name": "Veurne/Sint-Augustinus Heliport", "code": "" },
  { "name": "Oeren Heliport", "code": "" },
  { "name": "Waasmunster Heliport", "code": "" },
  { "name": "Wingene Heliport", "code": "" },
  { "name": "Wingene/Zwevezele Heliport", "code": "" },
  { "name": "Cliniques Universitaires Saint-Luc Hospital Heliport", "code": "" },
  { "name": "Regionaal Ziekenhuis Jan Yperman VZW Hospital Heliport", "code": "" },
  { "name": "Zonnebeke/Zandvoorde Heliport", "code": "" },
  { "name": "Zingem Heliport", "code": "" },
  { "name": "Zomergem Heliport", "code": "" },
  { "name": "Oostdijckbank Heliport", "code": "" }
];

const KEYWORDS = [
  // =============================================
  // 1. CORE OPERATORS (Airlines & Charter - Fixed Wing)
  // =============================================
  "air charter Belgium",
  "private jet charter Belgium",
  "executive aviation Belgium",
  "corporate aviation Belgium",
  "AOC operator Belgium",
  "air taxi Belgium",
  "air ambulance Belgium",
  "cargo airline Belgium",
  "air freight Belgium",
  "aircraft management Belgium",
  "company aircraft Belgium",
  "on-demand charter Belgium",

  // Specific Belgian AOC / Charter Operators
  "ASL Group", // AOC holder, large fleet of Citation/Embraer/Learjet aircraft
  "Flyinggroup", // Belgian AOC, operates Falcon, PC-24, Global, HondaJet
  "Luxaviation Belgium", // Formerly Abelag, AOC B-3002, Falcon/Citation fleet
  "Air Belgium", // Scheduled/charter airline holding Belgian AOC
  "FlyEurop", // AOC B-3060, Diamond DA-62 operations
  "Toran Helicopters", // Acquired AOC, commercial helicopter operations
  "Air Charters Europe", // Part of ASL Group, operates ERJ135

  // =============================================
  // 2. HELICOPTER OPERATORS
  // =============================================
  "helicopter tours Belgium",
  "helicopter charter Belgium",
  "helicopter maintenance Belgium",
  "helicopter operator Belgium",
  "Bell helicopter Belgium",
  "Airbus helicopter Belgium",
  "helicopter EMS Belgium",
  "VIP helicopter Belgium",
  "helicopter tour Belgium",

  // Specific Belgian Helicopter Operators
  "Heli & Co", // AOC B-3049, operates AS355 and H125
  "Heli Service Belgium", // Operates AS355 and Bell 206 fleet
  "Helimo", // Operates AS355, A109S, H120
  "NHV Group", // Noordzee Helikopters Vlaanderen, ~30 helicopter fleet, offshore/HEMS/SAR
  "Skytech Helicopters", // Heavy-lift helicopter operator (historical, Mi-26)
  "Heliventure FTO", // Helicopter operator and FTO
  "Brussels Heli Air", // Heliport operator, Brussels
  "Heli Business", // Helicopter operations

  // =============================================
  // 3. AIR AMBULANCE / HEMS OPERATORS
  // =============================================
  "air ambulance Belgium helicopter",
  "HEMS operator Belgium",
  "Centre Médical Héliporté", // CMH, HEMS service in Bra-sur-Lienne
  "NHV Group", // Provides HEMS with Airbus H175 and other types
  "SAF Helicopters", // Contracted for H145 HEMS operations
  "MedicAssistance", // Medevac and air ambulance services

  // =============================================
  // 4. SPECIAL OPERATIONS (Survey, Firefighting, Photography)
  // =============================================
  "aerial surveying Belgium",
  "aerial photography Belgium",
  "aerial mapping Belgium",
  "aerial firefighting Belgium",
  "aerial application Belgium",
  "agricultural aviation Belgium",
  "aerial tours Belgium",

  // Specific Special Operations Entities
  "Aquarius Aerial Firefighting", // Cargolux subsidiary, operates Fire Boss aircraft from Zwartberg
  "Flying-Cam", // Aerial cinematography and photography operator
  "Skytech Helicopters", // Heavy-lift operations for firefighting and construction
  "Europilot Center", // Includes aerial work and survey operations

  // =============================================
  // 5. FLIGHT SCHOOLS & INSTRUCTION
  // =============================================
  "flight school Belgium",
  "pilot training Belgium",
  "Part 141 flight school Belgium",
  "helicopter flight training Belgium",
  "commercial pilot training Belgium",
  "aviation college Belgium",
  "flight instruction Belgium",

  // Specific Belgian ATOs / Flight Schools
  "Ostend Air College", // BE/ATO-001, integrated ATPL and type ratings
  "New CAG Air Academy", // BE/ATO-005, based at Charleroi, PPL to ATPL
  "Ben Air Flight Academy", // BE/ATO-006, PPL and ATPL training
  "Bluetail Flight School", // EASA ATO
  "Skywings", // Flight training
  "CAE Brussels", // Global training organisation with Brussels location
  "Alfako Flight Academy", // Modular ATO
  "Elite Pilot Training Center", // EPTC, EASA ATO

  // =============================================
  // 6. AIRCRAFT TYPE SPECIFIC
  // =============================================
  "Falcon operator Belgium",
  "Citation operator Belgium",
  "Global Express operator Belgium",
  "Pilatus PC-24 operator Belgium",
  "Embraer Legacy operator Belgium",
  "HondaJet operator Belgium",
  "Diamond DA-62 operator Belgium",
  "Bell 206 operator Belgium",
  "Airbus AS355 operator Belgium",
  "Airbus H125 operator Belgium",
  "Agusta A109 operator Belgium",
  "Airbus H145 operator Belgium",

  // =============================================
  // 7. CITY-SPECIFIC TARGETING
  // =============================================
  "aviation Brussels",
  "aviation Antwerp",
  "aviation Charleroi",
  "aviation Liège",
  "aviation Ostend",
  "aviation Kortrijk",
  "aviation Wevelgem",
  "aviation Sint-Truiden",
  "aviation Genk",
  "aviation Zaventem",
  "aviation Deurne",
  "aviation Gosselies",
  "aviation Grimbergen",
  "aviation Spa",
  "aviation Namur",

  // French / Dutch language city terms
  "aviation Bruxelles",
  "hélicoptère Anvers",
  "vol charter Charleroi",
  "luchtvaart Antwerpen",
  "helikopter Oostende",

  // =============================================
  // 8. AIRPORT-BASED TARGETING
  // =============================================
  // Brussels Airport (BRU/EBBR)
  "BRU FBO",
  "Brussels Airport FBO",
  "EBBR aviation services",
  "Zaventem aviation operator",

  // Antwerp International Airport (ANR/EBAW)
  "ANR FBO",
  "Antwerp Airport FBO",
  "EBAW aviation services",

  // Brussels South Charleroi Airport (CRL/EBCI)
  "CRL FBO",
  "Charleroi Airport FBO",
  "EBCI aviation services",

  // Liège Airport (LGG/EBLG)
  "LGG FBO",
  "Liège Airport FBO",
  "EBLG aviation services",

  // Ostend–Bruges International Airport (OST/EBOS)
  "OST FBO",
  "Ostend Airport FBO",
  "EBOS aviation services",

  // Kortrijk-Wevelgem / Flanders International (KJK/EBKT)
  "KJK FBO",
  "Kortrijk Airport FBO",
  "EBKT aviation services",

  // Other Airports / Airfields
  "Sint-Truiden Airfield FBO",
  "Zwartberg Airfield FBO",
  "Grimbergen Airfield FBO",
  "Spa Airfield FBO",
  "Namur Airfield FBO",

  // =============================================
  // 9. MILITARY & GOVERNMENT AVIATION
  // =============================================
  "military aviation contractor Belgium",
  "defense aerospace Belgium",
  "Belgian Air Component",
  "Belgian Armed Forces aviation",
  "Luchtcomponent",
  "police aviation unit Belgium",
  "Federal Police aviation Belgium",
  "Belgian Civil Aviation Authority",

  // =============================================
  // 10. SECONDARY (MRO / FBO) - Direct parts buyers, not resellers
  // =============================================
  // Note: These entities maintain or handle aircraft but do not sell parts to other companies.
  "aircraft maintenance Belgium",
  "aircraft repair station Belgium",
  "MRO Belgium",
  "Part 145 repair station Belgium",
  "EASA Part 145 Belgium",
  "jet engine overhaul Belgium",
  "turbine engine repair Belgium",
  "avionics repair Belgium",
  "helicopter maintenance Belgium",
  "airframe maintenance Belgium",
  "AOG support Belgium",
  "line maintenance Belgium",

  // Specific Belgian MROs / FBOs
  "ExecuJet MRO Services Belgium", // EASA Part 145 (BE.145.26), Bombardier/Cessna/Dassault
  "Safran Aircraft Engine Services Brussels", // Engine MRO, FAA Part 145
  "ASL Maintenance", // EASA Part 145, part of ASL Aviation Holding
  "Jet Aviation Belgium", // MRO and FBO services (where applicable)
  "Agusta Aerospace Services", // Helicopter maintenance at Liège
  "Heli Service Belgium", // Also offers helicopter maintenance
  "NHV Group", // Part 145 and Part 147 maintenance capabilities
  "Sabena Technics Brussels", // MRO provider
];

module.exports = { REGION, AIRPORTS, KEYWORDS };
