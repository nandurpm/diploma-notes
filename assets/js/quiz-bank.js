/* Purpose: Quiz bank - Descriptive comment added for clarity */
window.POLY_QUIZ_BANK={
subjects:{
1001:'English for Technical Communication',
1002:'Fundamentals of Engineering Mathematics',
'2002B':'Engineering Physics for Applied Electrical Technology and Computing',
'2003A':'Chemistry for Engineering Practices',
2005:'Environmental Sustainability and Ethics',
3001:'Essence of Indian Constitution'
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
]
}
};
