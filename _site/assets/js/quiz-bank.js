/* Purpose: Quiz bank - Descriptive comment added for clarity */
window.POLY_QUIZ_BANK={
subjects:{
1001:'English for Technical Communication',
1002:'Fundamentals of Engineering Mathematics',
'2002B':'Engineering Physics for Applied Electrical Technology and Computing',
'2003A':'Chemistry for Engineering Practices',
2005:'Environmental Sustainability and Ethics',
3001:'Essence of Indian Constitution',
3011:'Advanced Surveying',
3012:'Concrete Technology',
6012:'Environmental Engineering',
'6024A':'Computer Aided Design and Manufacturing'
},
questions:{
1001:[
{id:'1001-01',topic:'Technical Communication',en:'Which of the following is a key characteristic of technical communication?',ml:'ടെക്നിക്കൽ കമ്മ്യൂണിക്കേഷന്റെ പ്രധാന സവിശേഷത ഏത്?',options:['Clarity and precision','Poetic language','Fictional storytelling','Informal slang'],answer:0},
{id:'1001-02',topic:'Active/Passive Voice',en:'Identify the passive voice: The code was debugged by the programmer.',ml:'Passive voice ഏതെന്ന് കണ്ടെത്തുക: The code was debugged by the programmer.',options:['The code was debugged by the programmer.','The programmer debugged the code.','The programmer is debugging.','Debug the code.'],answer:0},
{id:'1001-03',topic:'Concord',en:'Choose the correct verb: Neither the printer nor the computers ___ working.',ml:'ശരിയായ verb തിരഞ്ഞെടുക്കുക: Neither the printer nor the computers ___ working.',options:['are','is','was','has'],answer:0},
{id:'1001-04',topic:'Technical Reading',en:'What is the primary purpose of scanning a technical document?',ml:'ഒരു ടെക്നിക്കൽ ഡോക്യുമെന്റ് സ്കാൻ ചെയ്യുന്നതിന്റെ പ്രധാന ഉദ്ദേശ്യം എന്താണ്?',options:['To locate specific information','To read every word slowly','To write a summary','To find spelling errors only'],answer:0},
{id:'1001-05',topic:'Business Correspondence',en:'Which is the most appropriate salutation for a formal business letter?',ml:'ഫോർമൽ ബിസിനസ്സ് കത്തുകൾക്ക് ഏറ്റവും അനുയോജ്യമായ അഭിസംബോധന ഏത്?',options:['Dear Sir/Madam,','Hey friend,','Hi guys,','What\'s up,'],answer:0},
{id:'1001-06',topic:'Vocabulary',en:'What is the synonym of the technical term \'obsolete\'?',ml:'\'Obsolete\' എന്ന വാക്കിന്റെ സമാനാർത്ഥം ഏത്?',options:['Outdated','Modern','Efficient','Expensive'],answer:0},
{id:'1001-07',topic:'Vocabulary',en:'Choose the correct spelling for the communication device.',ml:'ശരിയായ സ്പെല്ലിങ് തിരഞ്ഞെടുക്കുക.',options:['Transceiver','Tranceiver','Transiever','Transeiver'],answer:0},
{id:'1001-08',topic:'Email Writing',en:'In email writing, BCC stands for _____.',ml:'ഇമെയിലിൽ BCC എന്നത് എന്തിനെ സൂചിപ്പിക്കുന്നു?',options:['Blind Carbon Copy','Brief Carbon Copy','Basic Communication Code','Business Content Copy'],answer:0},
{id:'1001-09',topic:'Presentation Skills',en:'Which of the following helps to make slides readable?',ml:'സ്ലൈഡുകൾ എളുപ്പത്തിൽ വായിക്കാൻ സഹായിക്കുന്നത് ഏത്?',options:['Bullet points and ample white space','Long text paragraphs','Bright decorative animations','Small font sizes'],answer:0},
{id:'1001-10',topic:'Reports',en:'A recommendation section in a lab report should state _____.',ml:'ഒരു ലാബ് റിപ്പോർട്ടിലെ recommendation ഭാഗം എന്താണ് പറയേണ്ടത്?',options:['suggested future actions','unrelated opinions','personal anecdotes','raw measurements only'],answer:0}
],
1002:[
{id:'1002-01',topic:'Algebra',en:'If log (x) to base 2 = 5, then x is _____.',ml:'log (x) to base 2 = 5 ആണെങ്കിൽ x എത്ര?',options:['32','10','25','2.5'],answer:0},
{id:'1002-02',topic:'Trigonometry',en:'The value of sin²(θ) + cos²(θ) is _____.',ml:'sin²(θ) + cos²(θ) യുടെ വില എത്ര?',options:['1','0','-1','2'],answer:0},
{id:'1002-03',topic:'Matrices',en:'A square matrix A is symmetric if _____.',ml:'ഒരു സ്ക്വയർ മാട്രിക്സ് A സിമെട്രിക് ആകുന്നത് എപ്പോഴാണ്?',options:['Aᵀ = A','Aᵀ = -A','Det(A) = 0','A⁻¹ = A'],answer:0},
{id:'1002-04',topic:'Complex Numbers',en:'What is the amplitude of 1 + i?',ml:'1 + i യുടെ ആംപ്ലിറ്റ്യൂഡ് എത്ര?',options:['π/4','π/2','π/3','π/6'],answer:0},
{id:'1002-05',topic:'Limits',en:'Evaluate the limit: lim (x→3) (x² - 9) / (x - 3)',ml:'വില കാണുക: lim (x→3) (x² - 9) / (x - 3)',options:['6','0','3','Does not exist'],answer:0},
{id:'1002-06',topic:'Calculus',en:'What is the derivative of sin(x) with respect to x?',ml:'sin(x) ന്റെ ഡെറിവേറ്റീവ് എത്ര?',options:['cos(x)','-cos(x)','sec²(x)','tan(x)'],answer:0},
{id:'1002-07',topic:'Complex Numbers',en:'What is the conjugate of the complex number 2 - 3i?',ml:'2 - 3i എന്ന കോംപ്ലക്സ് നമ്പറിന്റെ കോഞ്ചുഗേറ്റ് ഏത്?',options:['2 + 3i','-2 + 3i','-2 - 3i','3 - 2i'],answer:0},
{id:'1002-08',topic:'Straight Lines',en:'Find the slope of a line perpendicular to y = 2x + 1.',ml:'y = 2x + 1 എന്ന വരയ്ക്ക് ലംബമായ രേഖയുടെ സ്ലോപ്പ് കണ്ടെത്തുക.',options:['-1/2','2','-2','1/2'],answer:0},
{id:'1002-09',topic:'Integration',en:'The integral of e^x with respect to x is _____.',ml:'e^x ന്റെ ഇന്റഗ്രൽ എത്ര?',options:['e^x + C','e^-x + C','xe^(x-1) + C','1/e^x + C'],answer:0},
{id:'1002-10',topic:'Cramer\'s Rule',en:'Cramer\'s rule is used to solve systems of _____.',ml:'ക്രാമേഴ്സ് റൂൾ ഏത് തരം സമവാക്യങ്ങൾ നിർദ്ധാരണം ചെയ്യാൻ ഉപയോഗിക്കുന്നു?',options:['linear equations','quadratic equations','differential equations','integral equations'],answer:0}
],
'2002B':[
{id:'2002B-01',topic:'Wave Motion',en:'The distance between two consecutive crests of a wave is called _____.',ml:'ഒരു തരംഗത്തിലെ രണ്ട് അടുത്തടുത്ത ശൃംഗങ്ങൾ തമ്മിലുള്ള ദൂരം എന്ത് വിളിക്കുന്നു?',options:['wavelength','frequency','amplitude','time period'],answer:0},
{id:'2002B-02',topic:'Electrostatics',en:'The SI unit of electric charge is _____.',ml:'ചാർജ്ജിന്റെ SI യൂണിറ്റ് ഏത്?',options:['coulomb','ampere','volt','farad'],answer:0},
{id:'2002B-03',topic:'Semiconductor',en:'Which of the following is an intrinsic semiconductor?',ml:'താഴെ പറയുന്നവയിൽ ഇൻട്രിൻസിക് സെമികണ്ടക്ടർ ഏതാണ്?',options:['Pure Silicon','Germanium doped with Arsenic','Silicon doped with Boron','Copper'],answer:0},
{id:'2002B-04',topic:'Electric Current',en:'According to Ohm\'s law, the relationship between V and I is _____.',ml:'ഓംസ് നിയമപ്രകാരം V യും I യും തമ്മിലുള്ള ബന്ധം എന്താണ്?',options:['V = IR','V = I/R','I = VR','P = VI'],answer:0},
{id:'2002B-05',topic:'Laser',en:'What does the \'S\' in LASER stand for?',ml:'LASER എന്ന വാക്കിലെ \'S\' എന്തിനെ സൂചിപ്പിക്കുന്നു?',options:['Stimulated','Spontaneous','System','Signal'],answer:0},
{id:'2002B-06',topic:'Electromagnetic Induction',en:'The law governing electromagnetic induction is formulated by _____.',ml:'വൈദ്യുതകാന്തിക പ്രേരണയുടെ നിയമം ആവിഷ്കരിച്ചത് ആര്?',options:['Faraday','Newton','Coulomb','Ohm'],answer:0},
{id:'2002B-07',topic:'Magnetic Fields',en:'The SI unit of magnetic flux density is _____.',ml:'കാന്തിക ഫ്ലക്സ് ഡെൻസിറ്റിയുടെ SI യൂണിറ്റ് ഏത്?',options:['tesla','weber','henry','lumen'],answer:0},
{id:'2002B-08',topic:'Superconductivity',en:'Superconductivity is the complete disappearance of electrical _____.',ml:'സൂപ്പർകണ്ടക്റ്റിവിറ്റിയിൽ എന്തിന്റെ പൂർണ്ണമായ അപ്രത്യക്ഷമാകലാണ് നടക്കുന്നത്?',options:['resistance','capacitance','voltage','inductance'],answer:0},
{id:'2002B-09',topic:'Optoelectronics',en:'Optical fiber works on the principle of _____.',ml:'ഒപ്റ്റിക്കൽ ഫൈബർ പ്രവർത്തിക്കുന്നത് ഏത് തത്വത്തിന്റെ അടിസ്ഥാനത്തിലാണ്?',options:['total internal reflection','diffraction','interference','dispersion'],answer:0},
{id:'2002B-10',topic:'Nanotechnology',en:'One nanometer is equal to _____ meters.',ml:'ഒരു നാനോമീറ്റർ എത്ര മീറ്ററിന് തുല്യമാണ്?',options:['10^-9','10^-6','10^-12','10^-3'],answer:0}
],
'2003A':[
{id:'2003A-01',topic:'Atomic Structure',en:'The fundamental particle with positive charge is _____.',ml:'പോസിറ്റീവ് ചാർജ്ജുള്ള അടിസ്ഥാന കണം ഏത്?',options:['Proton','Electron','Neutron','Positron'],answer:0},
{id:'2003A-02',topic:'Electrochemistry',en:'During electrolysis, oxidation occurs at the _____.',ml:'ഇലക്ട്രോലിസിസ് നടക്കുമ്പോൾ ഓക്സിഡേഷൻ നടക്കുന്നത് എവിടെയാണ്?',options:['anode','cathode','electrolyte','salt bridge'],answer:0},
{id:'2003A-03',topic:'pH Value',en:'A solution with pH 12 is highly _____.',ml:'pH 12 ഉള്ള ഒരു ലായനി എന്താണ്?',options:['alkaline','acidic','neutral','amphoteric'],answer:0},
{id:'2003A-04',topic:'Corrosion',en:'Rusting of iron requires moisture and _____.',ml:'ഇരുമ്പ് തുരുമ്പെടുക്കാൻ ഈർപ്പവും ഒപ്പം എന്തിന്റെയും സാന്നിധ്യം വേണം?',options:['oxygen','nitrogen','carbon dioxide','hydrogen'],answer:0},
{id:'2003A-05',topic:'Water Technology',en:'The temporary hardness of water is caused by salts of _____.',ml:'വെള്ളത്തിന്റെ താൽക്കാലിക കാഠിന്യത്തിന് കാരണമാകുന്നത് ഏത് ലവണങ്ങളാണ്?',options:['calcium and magnesium bicarbonates','calcium and magnesium chlorides','sodium and potassium sulfates','sodium chloride'],answer:0},
{id:'2003A-06',topic:'Polymer Chemistry',en:'Which of the following is a natural polymer?',ml:'താഴെ പറയുന്നവയിൽ സ്വാഭാവിക പോളിമർ ഏതാണ്?',options:['Natural Rubber','Nylon','PVC','Polyester'],answer:0},
{id:'2003A-07',topic:'Fuel Technology',en:'The main constituent of natural gas is _____.',ml:'പ്രകൃതിദത്ത വാതകത്തിന്റെ പ്രധാന ഘടകം ഏതാണ്?',options:['Methane','Butane','Propane','Ethane'],answer:0},
{id:'2003A-08',topic:'Chemical Bonding',en:'A bond formed by the sharing of electron pairs is called _____.',ml:'ഇലക്ട്രോൺ ജോടികൾ പങ്കുവെക്കുന്നതിലൂടെ രൂപപ്പെടുന്ന രാസബന്ധനം ഏത്?',options:['covalent bond','ionic bond','metallic bond','hydrogen bond'],answer:0},
{id:'2003A-09',topic:'Lubricants',en:'The property of a lubricant to resist flow is called _____.',ml:'ലൂബ്രിക്കന്റ് ഒഴുകുന്നതിനെ പ്രതിരോധിക്കാനുള്ള ശേഷിയെ എന്ത് വിളിക്കുന്നു?',options:['viscosity','volatility','flash point','fire point'],answer:0},
{id:'2003A-10',topic:'Environmental Chemistry',en:'Which gas is mainly responsible for acid rain?',ml:'അമ്ലമഴയ്ക്ക് പ്രധാനമായും കാരണമാകുന്ന വാതകം ഏത്?',options:['Sulfur dioxide','Nitrogen gas','Carbon monoxide','Argon'],answer:0}
],
2005:[
{id:'2005-01',topic:'Ecosystem',en:'The functional unit of environment is called _____.',ml:'പരിസ്ഥിതിയുടെ പ്രവർത്തന യൂണിറ്റിനെ എന്ത് വിളിക്കുന്നു?',options:['Ecosystem','Atmosphere','Lithosphere','Biosphere'],answer:0},
{id:'2005-02',topic:'Greenhouse Effect',en:'The gas that contributes most to the greenhouse effect is _____.',ml:'ഹരിതഗൃഹ പ്രഭാവത്തിന് ഏറ്റവും കൂടുതൽ കാരണമാകുന്ന വാതകം ഏത്?',options:['Carbon dioxide','Oxygen','Nitrogen','Argon'],answer:0},
{id:'2005-03',topic:'Renewable Energy',en:'Which of the following is a renewable energy source?',ml:'താഴെ പറയുന്നവയിൽ പുനരുപയോഗിക്കാവുന്ന ഊർജ്ജസ്രോതസ്സ് ഏതാണ്?',options:['Solar energy','Coal','Petroleum','Natural Gas'],answer:0},
{id:'2005-04',topic:'Pollution',en:'High biological oxygen demand (BOD) in water indicates _____.',ml:'വെള്ളത്തിലെ ഉയർന്ന BOD എന്തിനെ സൂചിപ്പിക്കുന്നു?',options:['high organic pollution','pure water','absence of bacteria','abundance of dissolved oxygen'],answer:0},
{id:'2005-05',topic:'Solid Waste',en:'The best first step in waste management is _____.',ml:'മാലിന്യ സംസ്കരണത്തിലെ ഏറ്റവും മികച്ച ആദ്യ ഘട്ടം ഏതാണ്?',options:['Reduction','Landfilling','Incineration','Dumping'],answer:0},
{id:'2005-06',topic:'Air Pollution',en:'The major indoor air pollutant in rural households is _____.',ml:'ഗ്രാമീണ വീടുകളിൽ കാണുന്ന പ്രധാന വായുമലിനീകരണ ഉപാധി ഏതാണ്?',options:['Biomass smoke','Carbon monoxide','Asbestos','Ozone'],answer:0},
{id:'2005-07',topic:'Ozone Depletion',en:'The ozone layer is primarily depleted by gases called _____.',ml:'ഓസോൺ പാളി പ്രധാനമായും നശിപ്പിക്കുന്നത് ഏത് വാതകങ്ങളാണ്?',options:['Chlorofluorocarbons (CFCs)','Carbon dioxide','Sulfur dioxide','Helium'],answer:0},
{id:'2005-08',topic:'Environmental Ethics',en:'The principle that humans are part of nature, not its masters, is called _____.',ml:'മനുഷ്യൻ പ്രകൃതിയുടെ യജമാനനല്ല, മറിച്ച് പ്രകൃതിയുടെ ഭാഗമാണെന്ന തത്വം ഏതാണ്?',options:['Ecological ethics','Anthropocentrism','Technocentrism','Utilitarianism'],answer:0},
{id:'2005-09',topic:'Sustainable Development',en:'Sustainable development meets the needs of the present without compromising the ability of _____.',ml:'സുസ്ഥിര വികസനം എന്നത് എന്തിനെ തടസ്സപ്പെടുത്താതെ ഇന്നത്തെ ആവശ്യങ്ങൾ നിറവേറ്റുന്നതാണ്?',options:['future generations','past industries','rich nations','corporate profit'],answer:0},
{id:'2005-10',topic:'Environmental Protection',en:'ISO 14001 certification is awarded for standard _____.',ml:'ISO 14001 സർട്ടിഫിക്കേഷൻ നൽകുന്നത് എന്തിനാണ്?',options:['Environmental Management System','Quality Management System','Food Safety System','Information Security'],answer:0}
],
3001:[
{id:'3001-01',topic:'Constitution',en:'Who is known as the Father of the Indian Constitution?',ml:'ഇന്ത്യൻ ഭരണഘടനയുടെ പിതാവ് എന്നറിയപ്പെടുന്നത് ആര്?',options:['Dr. B. R. Ambedkar','Mahatma Gandhi','Jawaharlal Nehru','Dr. Rajendra Prasad'],answer:0},
{id:'3001-02',topic:'Preamble',en:'The Preamble of the Indian Constitution declares India as a sovereign, _____, secular, democratic republic.',ml:'ഭരണഘടനയുടെ ആമുഖത്തിൽ ഇന്ത്യയെ പരമാധികാര, _____, മതേതര, ജനാധിപത്യ റിപ്പബ്ലിക് ആയി പ്രഖ്യാപിക്കുന്നു.',options:['socialist','capitalist','monarchical','federal only'],answer:0},
{id:'3001-03',topic:'Fundamental Rights',en:'Right to Equality is guaranteed under which Article range of the Constitution?',ml:'തുല്യതയ്ക്കുള്ള അവകാശം ഭരണഘടനയിലെ ഏത് ആർട്ടിക്കിളുകൾ പ്രകാരമാണ് ഉറപ്പുനൽകുന്നത്?',options:['Articles 14 to 18','Articles 19 to 22','Articles 25 to 28','Articles 32 to 35'],answer:0},
{id:'3001-04',topic:'Directive Principles',en:'Directive Principles of State Policy are borrowed from the constitution of _____.',ml:'നിർദ്ദേശക തത്വങ്ങൾ ഏത് രാജ്യത്തിന്റെ ഭരണഘടനയിൽ നിന്നാണ് കടമെടുത്തത്?',options:['Ireland','USA','UK','USSR'],answer:0},
{id:'3001-05',topic:'Fundamental Duties',en:'Fundamental Duties were added to the Constitution by which amendment?',ml:'ഭരണഘടനയിൽ മൗലിക കർത്തവ്യങ്ങൾ കൂട്ടിച്ചേർത്തത് ഏത് ഭേദഗതിയിലൂടെയാണ്?',options:['42nd Amendment','44th Amendment','86th Amendment','1st Amendment'],answer:0},
{id:'3001-06',topic:'Parliament',en:'The upper house of the Indian Parliament is called _____.',ml:'ഇന്ത്യൻ പാർലമെന്റിന്റെ ഉപരിസഭ ഏതാണ്?',options:['Rajya Sabha','Lok Sabha','Legislative Assembly','President\'s Council'],answer:0},
{id:'3001-07',topic:'President',en:'The constitutional head of the Union of India is _____.',ml:'ഇന്ത്യയുടെ ഭരണഘടനാ തലവൻ ആരാണ്?',options:['The President','The Prime Minister','The Chief Justice','The Vice President'],answer:0},
{id:'3001-08',topic:'Judiciary',en:'The highest court of appeal in India is the _____.',ml:'ഇന്ത്യയിലെ ഏറ്റവും ഉയർന്ന അപ്പീൽ കോടതി ഏതാണ്?',options:['Supreme Court','High Court','District Court','Subordinate Court'],answer:0},
{id:'3001-09',topic:'Local Self Government',en:'Which amendment added the Panchayati Raj system to the Constitution?',ml:'പഞ്ചായത്തീരാജ് സംവിധാനം ഭരണഘടനയിൽ കൂട്ടിച്ചേർത്ത ഭേദഗതി ഏത്?',options:['73rd Amendment','74th Amendment','42nd Amendment','52nd Amendment'],answer:0},
{id:'3001-10',topic:'Election Commission',en:'Elections in India are conducted by which constitutional body?',ml:'ഇന്ത്യയിൽ തെരഞ്ഞെടുപ്പുകൾ നടത്തുന്നത് ഏത് ഭരണഘടനാ സ്ഥാപനമാണ്?',options:['Election Commission of India','UPSC','NITI Aayog','Finance Commission'],answer:0}
	],
3011:[
{id:'3011-01',topic:'Theodolite',en:'The process of turning the telescope about its vertical axis in a horizontal plane is called _____.',ml:'ടെലിസ്കോപ്പിനെ അതിന്റെ വെർട്ടിക്കൽ ആക്സിസിൽ ഹൊറിസോണ്ടൽ പ്ലെയിനിൽ തിരിക്കുന്ന പ്രക്രിയയെ എന്ത് വിളിക്കുന്നു?',options:['Swinging','Transiting','Plunging','Reversing'],answer:0},
{id:'3011-02',topic:'Curves',en:'The degree of a curve is defined as the angle subtended at its centre by an arc of length _____.',ml:'ഒരു കർവിന്റെ ഡിഗ്രി എന്നത് എത്ര നീളമുള്ള ആർക്ക് അതിന്റെ കേന്ദ്രത്തിൽ ഉണ്ടാക്കുന്ന കോണാണ്?',options:['30 m','20 m','10 m','100 m'],answer:0}
],
3012:[
{id:'3012-01',topic:'Concrete',en:'The process of hardening of concrete in the presence of water is called _____.',ml:'വെള്ളത്തിന്റെ സാന്നിധ്യത്തിൽ കോൺക്രീറ്റ് കഠിനമാകുന്ന പ്രക്രിയയെ എന്ത് വിളിക്കുന്നു?',options:['Curing','Setting','Hardening','Hydration'],answer:0},
{id:'3012-02',topic:'Workability',en:'Slump test is used to determine the _____ of concrete.',ml:'സ്ലംപ് ടെസ്റ്റ് കോൺക്രീറ്റിന്റെ എന്ത് അളക്കാനാണ് ഉപയോഗിക്കുന്നത്?',options:['Workability','Strength','Durability','Density'],answer:0}
],
6012:[
{id:'6012-01',topic:'Wastewater Characteristics',en:'Biochemical oxygen demand (BOD) is primarily an indicator of _____.',ml:'ബയോകെമിക്കൽ ഓക്സിജൻ ഡിമാൻഡ് (BOD) പ്രധാനമായും എന്തിന്റെ സൂചകമാണ്?',options:['biodegradable organic pollution','water hardness only','dissolved salt content','pipe corrosion'],answer:0},
{id:'6012-02',topic:'Water Treatment',en:'The purpose of sedimentation in a water-treatment plant is to remove _____.',ml:'വാട്ടർ ട്രീറ്റ്മെന്റ് പ്ലാന്റിലെ സെഡിമെന്റേഷന്റെ ഉദ്ദേശ്യം എന്ത് നീക്കുക എന്നതാണ്?',options:['settleable suspended solids','all dissolved salts','pathogens only','odour only'],answer:0},
{id:'6012-03',topic:'Disinfection',en:'Which process is commonly used to disinfect treated drinking water?',ml:'ശുദ്ധീകരിച്ച കുടിവെള്ളം അണുവിമുക്തമാക്കാൻ സാധാരണ ഉപയോഗിക്കുന്ന പ്രക്രിയ ഏതാണ്?',options:['Chlorination','Aeration','Screening','Grit removal'],answer:0},
{id:'6012-04',topic:'Sewage Treatment',en:'The activated-sludge process depends mainly on _____.',ml:'ആക്ടിവേറ്റഡ് സ്ലഡ്ജ് പ്രക്രിയ പ്രധാനമായും എന്തിനെ ആശ്രയിക്കുന്നു?',options:['aerobic microorganisms','high-pressure filtration','chemical softening','manual screening'],answer:0},
{id:'6012-05',topic:'Sewerage',en:'A water seal in a sanitary trap prevents _____.',ml:'സാനിറ്ററി ട്രാപ്പിലെ വാട്ടർ സീൽ എന്താണ് തടയുന്നത്?',options:['foul gases entering the building','water from entering the drain','solids entering the sewer','rainwater runoff'],answer:0},
{id:'6012-06',topic:'Air Pollution',en:'The standard unit used to express environmental noise level is _____.',ml:'പരിസ്ഥിതി ശബ്ദനില പ്രകടിപ്പിക്കാൻ ഉപയോഗിക്കുന്ന സ്റ്റാൻഡേർഡ് യൂണിറ്റ് ഏതാണ്?',options:['decibel (dB)','pascal (Pa)','neper (Np)','hertz (Hz)'],answer:0},
{id:'6012-07',topic:'Solid Waste',en:'Which option follows the preferred first step in the waste-management hierarchy?',ml:'മാലിന്യ സംസ്കരണ ക്രമത്തിലെ ഏറ്റവും മുൻഗണനയുള്ള ആദ്യ ഘട്ടം ഏതാണ്?',options:['Source reduction','Open dumping','Landfilling','Incineration without recovery'],answer:0},
{id:'6012-08',topic:'Water Quality',en:'Dissolved oxygen (DO) is important because it supports _____.',ml:'ഡിസോൾവ്ഡ് ഓക്സിജൻ (DO) പ്രധാനമാണ്, കാരണം അത് എന്തിനെ പിന്തുണയ്ക്കുന്നു?',options:['aquatic life','water hardness','pipe thickness','soil compaction'],answer:0},
{id:'6012-09',topic:'Sludge Management',en:'A sludge-drying bed is used mainly to _____.',ml:'സ്ലഡ്ജ് ഡ്രൈയിംഗ് ബെഡ് പ്രധാനമായും ഉപയോഗിക്കുന്നത് എന്തിനാണ്?',options:['reduce moisture in sludge','increase chlorine residual','measure turbidity','separate grit'],answer:0},
{id:'6012-10',topic:'Sanitation',en:'A separate system of sewerage carries sanitary sewage and storm water through _____.',ml:'സെപ്പറേറ്റ് സെവർേജ് സിസ്റ്റത്തിൽ സാനിറ്ററി മലിനജലവും മഴവെള്ളവും എങ്ങനെ കൊണ്ടുപോകുന്നു?',options:['different sewers','one combined sewer','open channels only','the same house drain'],answer:0}
],
'6024A':[
{id:'6024A-01',topic:'CAD',en:'CAD is primarily used to create and modify _____.',ml:'CAD പ്രധാനമായും എന്ത് സൃഷ്ടിക്കാനും മാറ്റം വരുത്താനും ഉപയോഗിക്കുന്നു?',options:['engineering drawings and models','only spreadsheets','only text documents','only photographs'],answer:0},
{id:'6024A-02',topic:'CAM',en:'Computer-aided manufacturing (CAM) is used to help plan and control _____.',ml:'കമ്പ്യൂട്ടർ എയ്ഡഡ് മാനുഫാക്ചറിംഗ് (CAM) എന്തിന്റെ പ്ലാനിംഗിനും നിയന്ത്രണത്തിനും സഹായിക്കുന്നു?',options:['manufacturing operations','library records','water treatment plants','building occupancy'],answer:0},
{id:'6024A-03',topic:'Parametric Modelling',en:'In parametric modelling, a change to a controlling dimension will _____.',ml:'പാരാമെട്രിക് മോഡലിംഗിൽ ഒരു കൺട്രോളിംഗ് ഡൈമെൻഷൻ മാറ്റുമ്പോൾ എന്ത് സംഭവിക്കും?',options:['update related geometry','delete the model permanently','change only the screen colour','remove all constraints'],answer:0},
{id:'6024A-04',topic:'CNC',en:'In a CNC program, G-codes generally specify _____.',ml:'ഒരു CNC പ്രോഗ്രാമിൽ G-codes സാധാരണയായി എന്താണ് നിർദ്ദേശിക്കുന്നത്?',options:['machine motion and machining functions','operator attendance','material purchase cost','workshop lighting'],answer:0},
{id:'6024A-05',topic:'3D Modelling',en:'A solid model differs from a wireframe model because it represents _____.',ml:'ഒരു സോളിഡ് മോഡൽ വയർഫ്രെയിം മോഡലിൽ നിന്ന് വ്യത്യസ്തമാകുന്നത് അത് എന്തിനെ പ്രതിനിധീകരിക്കുന്നതിനാലാണ്?',options:['volume and mass properties','only edge lines','only text labels','a 2D drawing sheet'],answer:0},
{id:'6024A-06',topic:'CAE',en:'Finite element analysis (FEA) is commonly used to study _____.',ml:'ഫിനൈറ്റ് എലമെന്റ് അനാലിസിസ് (FEA) സാധാരണയായി എന്ത് പഠിക്കാൻ ഉപയോഗിക്കുന്നു?',options:['stress, deformation and related response','ink colour in drawings','attendance records','inventory labels'],answer:0},
{id:'6024A-07',topic:'Additive Manufacturing',en:'Which file format is widely used to transfer 3D geometry to many 3D-printing workflows?',ml:'പല 3D പ്രിന്റിംഗ് വർക്ക്‌ഫ്ലോകളിലേക്കും 3D ജ്യാമിതി കൈമാറാൻ വ്യാപകമായി ഉപയോഗിക്കുന്ന ഫയൽ ഫോർമാറ്റ് ഏതാണ്?',options:['STL','TXT','CSV','MP3'],answer:0},
{id:'6024A-08',topic:'Drawing Standards',en:'A CAD layer is useful for _____.',ml:'ഒരു CAD ലെയർ എന്തിനാണ് ഉപയോഗപ്രദം?',options:['organising related drawing entities','increasing material hardness','measuring surface roughness','calculating BOD'],answer:0},
{id:'6024A-09',topic:'Manufacturing Integration',en:'The main benefit of CAD/CAM integration is a more direct flow from _____.',ml:'CAD/CAM ഇന്റഗ്രേഷന്റെ പ്രധാന ഗുണം ഏതിൽ നിന്ന് ഏതിലേക്കുള്ള കൂടുതൽ നേരിട്ടുള്ള പ്രവാഹമാണ്?',options:['design data to manufacturing instructions','attendance to examination marks','water supply to drainage','purchase order to payroll'],answer:0},
{id:'6024A-10',topic:'Quality',en:'Computer-aided inspection can compare a manufactured part with _____.',ml:'കമ്പ്യൂട്ടർ എയ്ഡഡ് ഇൻസ്പെക്ഷൻ നിർമ്മിച്ച ഭാഗത്തെ എന്തുമായി താരതമ്യം ചെയ്യാൻ കഴിയും?',options:['the nominal CAD model or specification','a random photograph','the operator name','the workshop timetable'],answer:0}
]
	}
	};

window.POLY_QUIZ_BANK_CURRICULUM = {
  common: [
    { code: "6012", name: "Environmental Engineering (REV2026)", sem: "S6", type: "Theory" },
    { code: "6024A", name: "Computer Aided Design and Manufacturing (REV2026)", sem: "S6", type: "Theory" },
    { code: "3011", name: "Advanced Surveying (REV2021)", sem: "S3", type: "Theory" },
    { code: "3012", name: "Concrete Technology (REV2021)", sem: "S3", type: "Theory" },
    { code: "1001", name: "English for Technical Communication", sem: "S1", type: "Course" },
    { code: "1002", name: "Fundamentals of Engineering Mathematics", sem: "S1", type: "Theory" },
    { code: "1003", name: "Engineering Graphics", sem: "S1", type: "Drawing" },
    { code: "1004", name: "Engineering Drawing with CAD", sem: "S1", type: "Lab" },
    { code: "1008", name: "Foundational IT Skills", sem: "S1", type: "Lab" },
    { code: "1009", name: "Health and Physical Education", sem: "S1", type: "Lab" },
    { code: "1011", name: "Fundamentals of Civil Engineering", sem: "S1", type: "Course" },
    { code: "1021", name: "Basic Mechanical Engineering", sem: "S1", type: "Course" },
    { code: "1031", name: "Basic Electrical and Electronics Engineering", sem: "S1", type: "Course" },
    { code: "1041", name: "Elementary Concepts of Electronics", sem: "S1", type: "Course" },
    { code: "1131", name: "Problem Solving and Python Programming", sem: "S1", type: "Practicum" },
    { code: "1181", name: "Architectural Graphics", sem: "S1", type: "Drawing" },
    { code: "1182", name: "Fundamentals of Architecture", sem: "S1", type: "Practicum" },
    { code: "2002A", name: "Applied Physics for Mechanical, Structural and Industrial Applications", sem: "S1/S2", type: "Course" },
    { code: "2003A", name: "Chemistry for Engineering Practices", sem: "S1/S2", type: "Course" },
    { code: "2003B", name: "Chemistry for Technical Practices", sem: "S1/S2", type: "Practicum" },
    { code: "2001A", name: "Mathematics for Industrial Engineering", sem: "S2", type: "Theory" },
    { code: "2001B", name: "Mathematics for Electrical Sciences", sem: "S2", type: "Theory" },
    { code: "2001C", name: "Mathematics for Computer Technology", sem: "S2", type: "Theory" },
    { code: "2001D", name: "Mathematics for Applied Engineering", sem: "S2", type: "Theory" },
    { code: "2002B", name: "Engineering Physics for Applied Electrical Technology and Computing", sem: "S2", type: "Practicum" },
    { code: "2005", name: "Environmental Sustainability and Ethics", sem: "S2", type: "Theory" },
    { code: "2009A", name: "General Engineering Workshop", sem: "S2", type: "Lab" },
    { code: "2009B", name: "Engineering Workshop Practice", sem: "S2", type: "Lab" },
    { code: "2011", name: "Building Materials & Construction Techniques", sem: "S2", type: "Theory" },
    { code: "2012", name: "Basic Surveying", sem: "S2", type: "Theory" },
    { code: "2018", name: "Construction Materials Lab", sem: "S2", type: "Lab" },
    { code: "2019", name: "Basic Surveying Lab", sem: "S2", type: "Lab" },
    { code: "2031", name: "Elementary Concepts of Electrical & Electronics Engineering", sem: "S2", type: "Theory" },
    { code: "2032", name: "Electric Circuits and Systems", sem: "S2", type: "Theory" },
    { code: "2038", name: "Electrical and Electronics Practice Lab", sem: "S2", type: "Lab" },
    { code: "2039", name: "Fundamentals of Electrical Engineering Lab", sem: "S2", type: "Lab" },
    { code: "2041", name: "Elements of Electrical & Electronics Engineering", sem: "S2", type: "Theory" },
    { code: "2042", name: "Electronic Devices and Applications", sem: "S2", type: "Theory" },
    { code: "2048", name: "Elements of Electrical & Electronics Engineering Lab", sem: "S2", type: "Lab" },
    { code: "2049", name: "Electronic Devices and Applications Lab", sem: "S2", type: "Lab" },
    { code: "2131", name: "Fundamentals of Electrical and Electronics Engineering", sem: "S2", type: "Theory" },
    { code: "2132", name: "Programming in C", sem: "S2", type: "Theory" },
    { code: "2138", name: "Fundamentals of Electrical and Electronics Engineering Lab", sem: "S2", type: "Lab" },
    { code: "2139", name: "Programming in C Lab", sem: "S2", type: "Lab" },
    { code: "2182", name: "Building Materials & Technology", sem: "S2", type: "Theory" },
    { code: "2187", name: "Masonry & Service Lab", sem: "S2", type: "Lab" },
    { code: "3009", name: "Digital 101", sem: "S2", type: "Course" }
  ],
  departments: {
    "AR": { name: "Architecture", subjects: [
      { code: "2183", name: "History of Architecture - I", sem: "S2", type: "Theory" },
      { code: "2188", name: "Architectural Design & Drafting I", sem: "S2", type: "Studio" }
    ]},
    "AI": { name: "Artificial Intelligence", subjects: [] },
    "AM": { name: "Artificial Intelligence & Machine Learning", subjects: [] },
    "RA": { name: "Automation and Robotics", subjects: [
      { code: "2331", name: "Foundations of Robotics", sem: "S2", type: "Theory" },
      { code: "2339", name: "Foundations of Robotics Lab", sem: "S2", type: "Lab" }
    ]},
    "AU": { name: "Automobile Engineering", subjects: [
      { code: "1051", name: "Basic Automobile Engineering", sem: "S1", type: "Practicum" },
      { code: "2051", name: "Basic Electrical and Electronics Engineering", sem: "S2", type: "Theory" },
      { code: "2052", name: "Fundamentals of Internal Combustion Engines", sem: "S2", type: "Theory" },
      { code: "2058", name: "Basic Electrical and Electronics Lab", sem: "S2", type: "Lab" },
      { code: "2059", name: "Automobile Service Lab", sem: "S2", type: "Lab" }
    ]},
    "BM": { name: "Biomedical Engineering", subjects: [] },
    "CH": { name: "Chemical Engineering", subjects: [
      { code: "2071", name: "Fundamentals of Engineering Chemistry", sem: "S2", type: "Practicum" },
      { code: "2072", name: "Fundamentals of Chemical Engineering", sem: "S2", type: "Theory" },
      { code: "2073", name: "Industrial Safety - Principles and Practices", sem: "S2", type: "Theory" },
      { code: "2078", name: "Industrial Safety Lab", sem: "S2", type: "Lab" },
      { code: "2079", name: "CAD Lab", sem: "S2", type: "Lab" }
    ]},
    "CV": { name: "Civil & Environmental Engineering", subjects: [] },
    "CR": { name: "Civil & Rural Engineering", subjects: [] },
    "CE": { name: "Civil Engineering", subjects: [] },
    "CL": { name: "Civil Engineering & Planning", subjects: [] },
    "CO": { name: "Civil Engineering (Construction Technology)", subjects: [] },
    "CP": { name: "Commercial Practice", subjects: [
      { code: "1141", name: "Fundamentals of Business", sem: "S1", type: "Theory" },
      { code: "1142", name: "Financial Accounting with Tally I", sem: "S1", type: "Practicum" },
      { code: "1143", name: "Managerial Economics", sem: "S1", type: "Practicum" },
      { code: "1144", name: "Shorthand English Theory I", sem: "S1", type: "Practicum" },
      { code: "1149", name: "Visual Design and Smart Publishing", sem: "S1", type: "Lab" },
      { code: "2141", name: "Business Regulatory Framework", sem: "S2", type: "Theory" },
      { code: "2142", name: "Financial Accounting with Tally II", sem: "S2", type: "Practicum" },
      { code: "2143", name: "Co-operative Theory and Practice", sem: "S2", type: "Theory" },
      { code: "2144", name: "Shorthand English Theory II", sem: "S2", type: "Practicum" },
      { code: "2147", name: "Digital Marketing and AI Tools for Business", sem: "S2", type: "Lab" },
      { code: "2148", name: "Data Entry Operations and Applications", sem: "S2", type: "Lab" },
      { code: "2149", name: "Typewriting and Word Processing", sem: "S2", type: "Lab" }
    ]},
    "CB": { name: "Computer Application & Business Management", subjects: [
      { code: "1251", name: "Basic Accounting", sem: "S1", type: "Theory" },
      { code: "1252", name: "Business Economics", sem: "S1", type: "Theory" },
      { code: "1253", name: "Business Studies", sem: "S1", type: "Theory" },
      { code: "1254", name: "Computer Applications in Management", sem: "S1", type: "Practicum" },
      { code: "1259", name: "Introduction to Python Lab", sem: "S1", type: "Lab" },
      { code: "2001E", name: "Business Mathematics", sem: "S2", type: "Theory" },
      { code: "2251", name: "AI for Business", sem: "S2", type: "Practicum" },
      { code: "2252", name: "Management Concepts and Organisational Behavior", sem: "S2", type: "Theory" },
      { code: "2253", name: "Cost Accounting", sem: "S2", type: "Theory" },
      { code: "2257", name: "Computerised Accounting Lab", sem: "S2", type: "Lab" },
      { code: "2258", name: "C Programming Lab", sem: "S2", type: "Lab" },
      { code: "2259", name: "Office Automation Software Lab", sem: "S2", type: "Lab" }
    ]},
    "CT": { name: "Computer Engineering", subjects: [] },
    "CS": { name: "Computer Science & Engineering", subjects: [] },
    "CZ": { name: "Computer Science & Engineering (AI & ML)", subjects: [] },
    "CG": { name: "Computer Science and Technology", subjects: [] },
    "CF": { name: "Cyber Forensics and Information Security", subjects: [] },
    "EE": { name: "Electrical & Electronics Engineering", subjects: [] },
    "EG": { name: "Electrical Engineering", subjects: [] },
    "EV": { name: "Electrical Engineering & Electric Vehicles Technology", subjects: [] },
    "EL": { name: "Electronics Engineering", subjects: [] },
    "EC": { name: "Electronics and Communication", subjects: [] },
    "ET": { name: "Electronics and Computer Engineering", subjects: [] },
    "ES": { name: "Electronics Engineering (Embedded Systems)", subjects: [] },
    "FS": { name: "Fire Technology and Safety", subjects: [
      { code: "2461", name: "Principles of Safety Management", sem: "S2", type: "Theory" },
      { code: "2469", name: "Computer Applications in Fire Technology & Safety", sem: "S2", type: "Lab" }
    ]},
    "FT": { name: "Food Processing Technology", subjects: [
      { code: "1421", name: "Fundamentals of Food Processing Technology", sem: "S1", type: "Practicum" },
      { code: "2421", name: "Food Processing Technology", sem: "S2", type: "Theory" },
      { code: "2429", name: "Food Processing Technology lab", sem: "S2", type: "Lab" }
    ]},
    "IF": { name: "Information Technology", subjects: [] },
    "IE": { name: "Instrumentation Engineering", subjects: [
      { code: "2081", name: "Basics of Instrumentation and Transducers", sem: "S2", type: "Theory" },
      { code: "2089", name: "Basic Instrumentation Lab", sem: "S2", type: "Lab" }
    ]},
    "IC": { name: "Integrated Circuit Design & Fabrication", subjects: [] },
    "ID": { name: "Interior Design", subjects: [
      { code: "2532", name: "History of Interior Design - I", sem: "S2", type: "Theory" },
      { code: "2539", name: "Interior Design & Drafting I", sem: "S2", type: "Studio" }
    ]},
    "ME": { name: "Mechanical Engineering", subjects: [
      { code: "2021", name: "Engineering Materials and Measurements", sem: "S2", type: "Theory" },
      { code: "2022", name: "Engineering Mechanics and Design Thinking", sem: "S2", type: "Theory" },
      { code: "2028", name: "Materials and Measurements Laboratory", sem: "S2", type: "Lab" },
      { code: "2029", name: "Engineering Mechanics Lab", sem: "S2", type: "Lab" }
    ]},
    "MA": { name: "Mechanical Engineering (Automobile Engineering)", subjects: [] },
    "MC": { name: "Mechatronics", subjects: [
      { code: "2432", name: "Fundamentals of Computer Programming", sem: "S2", type: "Theory" },
      { code: "2439", name: "Computer Programming Lab", sem: "S2", type: "Lab" }
    ]},
    "MI": { name: "Micro Electronics", subjects: [] },
    "PL": { name: "Polymer Technology", subjects: [
      { code: "1091", name: "Introduction to Polymer Science", sem: "S1", type: "Course" },
      { code: "2091", name: "Polymer Science", sem: "S2", type: "Theory" },
      { code: "2099", name: "Polymer Science Lab", sem: "S2", type: "Lab" }
    ]},
    "PT": { name: "Printing Technology", subjects: [
      { code: "1101", name: "Introduction to Printing Technology", sem: "S1", type: "Practicum" },
      { code: "2101", name: "Fundamentals of Printing Science", sem: "S2", type: "Theory" },
      { code: "2109", name: "Digital Office Systems and Documentation", sem: "S2", type: "Lab" }
    ]},
    "RP": { name: "Robotic Process Automation", subjects: [] },
    "TT": { name: "Textile Technology", subjects: [
      { code: "1061", name: "Fibre Science", sem: "S1", type: "Practicum" },
      { code: "2061", name: "Technology of Manmade Fibres", sem: "S2", type: "Theory" },
      { code: "2069", name: "Fundamentals of Textile Mechanics Lab", sem: "S2", type: "Lab" }
    ]},
    "TD": { name: "Tool & Die Engineering", subjects: [
      { code: "2111", name: "Fundamentals of Manufacturing and Tool Engineering", sem: "S2", type: "Theory" },
      { code: "2119", name: "Basic CAD Lab", sem: "S2", type: "Lab" }
    ]},
    "WP": { name: "Wood and Paper Technology", subjects: [
      { code: "2121", name: "Botany and Anatomical Structure", sem: "S2", type: "Theory" },
      { code: "2129", name: "Botany Lab", sem: "S2", type: "Lab" }
    ]}
  }
};
