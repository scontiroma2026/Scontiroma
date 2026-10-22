# Crediti e controlli delle foto del sito

Le foto della home sono copiate sul nostro sito (cartella `frontend/public/foto/`): il browser dei visitatori non contatta più Unsplash, quindi Unsplash non riceve il loro indirizzo IP. Un test (`e2e/tests/locale/31-foto-home-locali.spec.js`) fallisce se ricompare un'immagine esterna.

## Foto della home

Dal 22/10 la home **non usa più monumenti** (prima: Colosseo e Piazza San Pietro, possibile autorizzazione per i beni culturali, art. 108 Codice dei beni culturali). Ora due scorci di vicoli di Roma, scelti dal titolare.

| Uso | File (versioni) | Origine | Autore | Licenza |
|---|---|---|---|---|
| Sfondo in alto (vicolo di Trastevere di sera, tavolini e edera) | `roma-scorcio-640/1280/1920.webp` | Unsplash, foto `1708628934823-a37e3fe0bb4e` ([pagina](https://unsplash.com/photos/eS5Rn4hE-h0)) | Mariano Alvarez (verificato il 22/10) | Licenza Unsplash, «Free to use under the Unsplash License» (verificato sulla pagina il 22/10) |
| Riquadro «Roma, zona per zona» (vicolo di giorno con edera, ritagliato 4:5) | `roma-vicolo-480/640.webp` | Unsplash, foto `1569416078500-3857b00616f8` ([pagina](https://unsplash.com/photos/8pKrkO2cx1A)) | Fineas Anton (verificato il 22/10) | Licenza Unsplash (verificato sulla pagina il 22/10) |

Lavorazione: scaricate da images.unsplash.com, ritagliate (sfondo 1920x1400, riquadro 640x800), ridimensionate (sfondo 640/1280/1920 px di larghezza, riquadro 480x600 e 640x800), convertite in WebP (qualità 58 lo sfondo, che è mostrato velato, 70 il riquadro), senza metadati. Peso: circa 100 KB (sfondo 1280) + 120 KB (riquadro 640).

Controllo visivo (22/10): nessun monumento riconoscibile; nessun volto (nello sfondo una persona minuscola, lontana e di spalle); nessun marchio leggibile (nello sfondo una saracinesca con scritte spray generiche; nel riquadro l'insegna di un negozio resta fuori dal ritaglio).

I vecchi file `roma-colosseo-*` e `roma-piazza-*` sono stati tolti dal sito.

## Controllo dei limiti della Licenza Unsplash

Testo ufficiale su unsplash.com/license e unsplash.com/terms: **da verificare** (sito non raggiungibile dall'ambiente di lavoro, 14/10). Dalla conoscenza generale la licenza permette uso gratuito, anche commerciale, senza attribuzione obbligatoria, ma NON dà diritti su marchi, loghi, persone riconoscibili e opere protette presenti nella foto, e vieta di rivendere le foto così come sono.

Controllo visivo (14/10), sulle foto ingrandite:

| Foto | Volti riconoscibili | Loghi / insegne leggibili | Opere d'arte protette |
|---|---|---|---|
| Colosseo | No | No (solo una targa epigrafica storica e cartelli piccoli illeggibili; un'auto lontana) | No (monumento antico) |
| Piazza San Pietro | No (persone minuscole, viste dall'alto) | No | Statue e colonnato storici, molto antichi |

(Tabella storica del 14/10: foto non più usate dal 22/10.)

Esito: nessun elemento che la licenza Unsplash escluda. **Da decidere col consulente** (superato il 22/10: monumenti tolti dalla home): per i monumenti italiani (Colosseo, Vaticano) la normativa sui beni culturali può richiedere autorizzazione per usi commerciali delle immagini; il Colosseo è un bene statale, San Pietro è in Città del Vaticano. Se il consulente lo ritiene un rischio, alternative: foto scattate da noi, immagini generate, o scorci di quartieri senza monumenti riconoscibili.

## Foto di esempio per le offerte (cartella `esempi/`)

Vedi `frontend/public/esempi/LICENZA.txt` (già copiate sul sito, nome file = identificativo Unsplash). Controllo volti/marchi fatto il 15/10 sulle miniature: tolte 104 foto (40 con volti o marchi, 2 in entrambe le liste, più 64 dubbie, per scelta del titolare). Autori delle foto più vecchie: **da verificare**. Le 125 foto aggiunte il 22/10 sono elencate qui sotto.

## Foto aggiunte alla libreria il 22/10 (125)

Scelte dal titolare tra le candidate (fogli di anteprima numerati). Prese da Unsplash, solo foto «Free to use under the Unsplash License» (niente Unsplash+), dopo un controllo visivo una per una: niente volti riconoscibili, niente marchi o scritte leggibili, niente monumenti riconoscibili, niente cartellini con prezzi. Stesso formato delle altre: 800x450 e miniatura 400x225, JPEG qualità 72, senza metadati, nome file = identificativo Unsplash.

Autori: letti dai risultati di ricerca di Unsplash. Controllati uno per uno sulla pagina della foto (12 su 125, tutti corrispondenti, tutti con licenza Unsplash gratuita): segnati «verificato»; gli altri sono **da verificare** (l'autore è quello mostrato da Unsplash nella ricerca, non ancora riaperto sulla pagina della foto). L'attribuzione non è obbligatoria per la licenza Unsplash, è un elenco per correttezza.

| Categoria | File (`esempi/`) | Autore | Pagina | Controllo |
|---|---|---|---|---|
| Meccanici e Gommisti | `1775590766345-c117265f0c1b.jpg` | Sasun Bughdaryan | [unsplash](https://unsplash.com/photos/mechanic-using-a-wrench-on-a-car-engine-9gB7APNSquE) | **da verificare** |
| Meccanici e Gommisti | `1517026575980-3e1e2dedeab4.jpg` | Chris Liverani | [unsplash](https://unsplash.com/photos/white-and-blue-analog-tachometer-gauge-HUJDz6CJEaM) | verificato 22/10 |
| Meccanici e Gommisti | `1613206485381-b028e578e791.jpg` | Dmitriy Demidov | [unsplash](https://unsplash.com/photos/iuuJC_pjLU0) | verificato 22/10 |
| Meccanici e Gommisti | `1761074342668-c38fc2e62e67.jpg` | Marine Le Gac | [unsplash](https://unsplash.com/photos/rKwUlkH3Kd8) | **da verificare** |
| Meccanici e Gommisti | `1637640125496-31852f042a60.jpg` | Isabela Kronemberger | [unsplash](https://unsplash.com/photos/OegFhZfw6Ok) | **da verificare** |
| Meccanici e Gommisti | `1671040690726-b78261eff126.jpg` | Anton Savinov | [unsplash](https://unsplash.com/photos/2Qlj2Gaft7w) | **da verificare** |
| Meccanici e Gommisti | `1731694411560-050e5b91e943.jpg` | Anton Savinov | [unsplash](https://unsplash.com/photos/lDwKKjlHL2Y) | **da verificare** |
| Meccanici e Gommisti | `1571335746824-742511d49bce.jpg` | Shadrach Warid | [unsplash](https://unsplash.com/photos/four-vehicle-tires--gqb3xbGa5Y) | **da verificare** |
| Meccanici e Gommisti | `1764699186616-8f707281e4f3.jpg` | Tuccera LLC | [unsplash](https://unsplash.com/photos/stack-of-tires-outside-a-garage-pi7Jlnh5nuY) | **da verificare** |
| Meccanici e Gommisti | `1578844251758-2f71da64c96f.jpg` | Robert Laursoo | [unsplash](https://unsplash.com/photos/piles-of-car-tires-WHPOFFzY9gU) | **da verificare** |
| Meccanici e Gommisti | `1599082267768-4815b2ea6bd2.jpg` | Enis Yavuz | [unsplash](https://unsplash.com/photos/person-holding-black-and-gray-metal-tool-CsYaNzll_rA) | **da verificare** |
| Meccanici e Gommisti | `1657307913178-97cb5a4d0cd7.jpg` | Yvette S | [unsplash](https://unsplash.com/photos/a-close-up-of-a-tire-tLEUi4OaQmQ) | **da verificare** |
| Meccanici e Gommisti | `1477823986828-5aff156284aa.jpg` | Imthaz Ahamed | [unsplash](https://unsplash.com/photos/bunch-of-tires-vVLrfAzmWYw) | **da verificare** |
| Meccanici e Gommisti | `1781751420178-1d8467d81ff4.jpg` | BHARAT VISHAWAKARMA | [unsplash](https://unsplash.com/photos/a-detailed-view-of-a-modern-car-engine-bay-15rs3j7w7PE) | **da verificare** |
| Meccanici e Gommisti | `1779263569870-e7a0fbc25686.jpg` | Назарій Ковальов | [unsplash](https://unsplash.com/photos/complex-car-engine-with-various-mechanical-parts-and-hoses-xCLneDUHt4Q) | **da verificare** |
| Meccanici e Gommisti | `1599256630445-67b5772b1204.jpg` | Nina Mercado | [unsplash](https://unsplash.com/photos/brown-and-gray-metal-tools-e9YFrEBWit8) | **da verificare** |
| Meccanici e Gommisti | `1763798816055-9a03df62bd65.jpg` | あま あわれ | [unsplash](https://unsplash.com/photos/a-cluttered-workshop-shelf-with-tools-and-supplies-4Zv0IW3aMbg) | **da verificare** |
| Meccanici e Gommisti | `1635108198395-82a67cd5eaec.jpg` | Point3D Commercial Imaging Ltd. | [unsplash](https://unsplash.com/photos/a-garage-filled-with-lots-of-clutter-and-tools-3uqyjfdWBfE) | **da verificare** |
| Meccanici e Gommisti | `1702146713882-2579afb0bfba.jpg` | Tahamie Farooqui | [unsplash](https://unsplash.com/photos/a-bunch-of-engine-parts-sitting-on-top-of-a-shelf-wbTSsGuz2Q8) | **da verificare** |
| Meccanici e Gommisti | `1781901702560-31f9ff762d37.jpg` | Barry A | [unsplash](https://unsplash.com/photos/6Hkw3_C80gI) | **da verificare** |
| Meccanici e Gommisti | `1781901702566-ad5409ad1cc9.jpg` | Barry A | [unsplash](https://unsplash.com/photos/_REbQm1Y6A8) | **da verificare** |
| Meccanici e Gommisti | `1643730169397-a4bf0b10db5d.jpg` | Robert Ruggiero | [unsplash](https://unsplash.com/photos/wdfQR7FQk6g) | **da verificare** |
| Campi da Padel | `1759819599208-0b79a7f3f347.jpg` | Tahamie Farooqui | [unsplash](https://unsplash.com/photos/LwxVG0VQ3RY) | verificato 22/10 |
| Campi da Padel | `1670898839060-8b0a8902ee1e.jpg` | Marcin Skalij | [unsplash](https://unsplash.com/photos/X_e1pVtB1JU) | **da verificare** |
| Campi da Padel | `1777996626025-eacb340191cc.jpg` | Caroline Badran | [unsplash](https://unsplash.com/photos/hI1yw2OCrWM) | **da verificare** |
| Campi da Padel | `1766675083720-4e0ebfd05019.jpg` | Lutfan Yazid | [unsplash](https://unsplash.com/photos/Fvi8pTLXPfU) | **da verificare** |
| Campi da Padel | `1586016008569-4e1d76657ede.jpg` | Glen Carrie | [unsplash](https://unsplash.com/photos/3jz8SsGXBvk) | **da verificare** |
| Campi da Padel | `1510697963685-53101e615777.jpg` | Ben Hershey | [unsplash](https://unsplash.com/photos/VEW78A1YZ6I) | **da verificare** |
| Campi da Padel | `1761156896762-2ef13f932004.jpg` | Naveen Ketterer | [unsplash](https://unsplash.com/photos/a1RmtGY9GCg) | **da verificare** |
| Campi da Padel | `1541744573515-478c959628a0.jpg` | Mario Gogh | [unsplash](https://unsplash.com/photos/8xaMOOkKNsw) | **da verificare** |
| Campi da Padel | `1689942963385-f5bd03f3b270.jpg` | José Alejandro Cuffia | [unsplash](https://unsplash.com/photos/NtiZoP2CKOs) | **da verificare** |
| Campi da Padel | `1709587824637-2126d83d3216.jpg` | Bruno Vaccaro Vercellino | [unsplash](https://unsplash.com/photos/QhjhEnQxC60) | **da verificare** |
| Campi da Padel | `1709587825175-65de1201ab29.jpg` | Bruno Vaccaro Vercellino | [unsplash](https://unsplash.com/photos/d22xkdewTnQ) | **da verificare** |
| Campi da Padel | `1709587824674-78db9795ecf7.jpg` | Bruno Vaccaro Vercellino | [unsplash](https://unsplash.com/photos/sbjPmjwCtQo) | **da verificare** |
| Campi da Padel | `1709587825152-d4ce1b2224a3.jpg` | Bruno Vaccaro Vercellino | [unsplash](https://unsplash.com/photos/_Zb77JbHeE0) | **da verificare** |
| Campi da Padel | `1673266893744-17a8cc6518fa.jpg` | P-squared Padel | [unsplash](https://unsplash.com/photos/80x1QOgqHeE) | **da verificare** |
| Campi da Padel | `1699117686612-ece525e4f91a.jpg` | C Cai | [unsplash](https://unsplash.com/photos/mwoRv-RSPHw) | **da verificare** |
| Campi da Padel | `1692288720754-743fbd1f2155.jpg` | Alex Viau | [unsplash](https://unsplash.com/photos/5mMXcMWjZ4k) | **da verificare** |
| Campi da Padel | `1622669253059-e345500cf0e9.jpg` | Parsoa Khorsand | [unsplash](https://unsplash.com/photos/Br1xuldqYcM) | **da verificare** |
| Campi da Padel | `1622668460389-f92e9ed21616.jpg` | Parsoa Khorsand | [unsplash](https://unsplash.com/photos/NGRJVEIkYzo) | **da verificare** |
| Campi da Padel | `1671750651143-b7d7265c9654.jpg` | Mario Gogh | [unsplash](https://unsplash.com/photos/qyPGgxKuXws) | **da verificare** |
| Campi da Padel | `1520992048127-03c7e5176a4e.jpg` | Ben Hershey | [unsplash](https://unsplash.com/photos/QE_arygnPUM) | **da verificare** |
| Campi da Calcetto | `1660926655155-8b1f8f9079f5.jpg` | Carlos Felipe Ramírez Mesa | [unsplash](https://unsplash.com/photos/OCH9nlz0BY4) | verificato 22/10 |
| Campi da Calcetto | `1769356636430-e04718f78ee8.jpg` | Noa GENOUD | [unsplash](https://unsplash.com/photos/dHZAiGK0KYg) | **da verificare** |
| Campi da Calcetto | `1761053275879-2805cd54353a.jpg` | Yingjie Wang | [unsplash](https://unsplash.com/photos/n7y6I9s7r7E) | **da verificare** |
| Campi da Calcetto | `1660926655800-3d11219f390d.jpg` | Carlos Felipe Ramírez Mesa | [unsplash](https://unsplash.com/photos/XnNkkw9H9Jc) | **da verificare** |
| Campi da Calcetto | `1759210720456-c9814f721479.jpg` | Tahamie Farooqui | [unsplash](https://unsplash.com/photos/BTmakFfGSAw) | **da verificare** |
| Campi da Calcetto | `1779288440792-f47b71179e21.jpg` | Arpit Sharma | [unsplash](https://unsplash.com/photos/W8XwIYFDh2I) | verificato 22/10 |
| Campi da Calcetto | `1778175164609-da1605875224.jpg` | nika tchokhonelidze | [unsplash](https://unsplash.com/photos/7vXmaVbcpgg) | **da verificare** |
| Campi da Calcetto | `1590145081676-616176e24471.jpg` | Jerome | [unsplash](https://unsplash.com/photos/nDHp2Z4rCHw) | **da verificare** |
| Campi da Calcetto | `1725030971668-684f1e8ca8ee.jpg` | Brianna Lengacher | [unsplash](https://unsplash.com/photos/maFOyIkw6P4) | **da verificare** |
| Campi da Calcetto | `1612607696387-f139f76bdd6c.jpg` | Michal Balog | [unsplash](https://unsplash.com/photos/YERcZ48CyVc) | **da verificare** |
| Campi da Calcetto | `1785003897037-d7f67231b232.jpg` | Paul Lora | [unsplash](https://unsplash.com/photos/5bG4UI5SaiM) | **da verificare** |
| Campi da Calcetto | `1778500386897-30149f22a39f.jpg` | Marmi Sica | [unsplash](https://unsplash.com/photos/ZJNzfSCFvtg) | **da verificare** |
| Campi da Calcetto | `1772707715064-63ff704dfcf8.jpg` | Riccardo Bernucci | [unsplash](https://unsplash.com/photos/GQpbLTe6us4) | **da verificare** |
| Campi da Calcetto | `1784212022990-c27bff622c88.jpg` | Jonathan Adams | [unsplash](https://unsplash.com/photos/YPhivPVz0Bk) | **da verificare** |
| Campi da Calcetto | `1556056504-5c7696c4c28d.jpg` | Bence Balla-Schottner | [unsplash](https://unsplash.com/photos/deGn9vSwXIM) | **da verificare** |
| Campi da Calcetto | `1565308674684-1d8c0b4433d2.jpg` | travis jones | [unsplash](https://unsplash.com/photos/bJp_wwRmF1I) | **da verificare** |
| Campi da Calcetto | `1704633785114-52104ce3d626.jpg` | Kyle Hinkson | [unsplash](https://unsplash.com/photos/dxcVW0W_q_o) | **da verificare** |
| Campi da Calcetto | `1546717003-caee5f93a9db.jpg` | Victor | [unsplash](https://unsplash.com/photos/raesgfwU7iM) | **da verificare** |
| Campi da Calcetto | `1641029185333-7ed62a19d5f0.jpg` | Shio Yang | [unsplash](https://unsplash.com/photos/YeUuqWxifk0) | **da verificare** |
| Palestre e Fitness | `1775993699105-4d18bcac7e54.jpg` | Palak Pitroda | [unsplash](https://unsplash.com/photos/8MCy6GeU490) | verificato 22/10 |
| Palestre e Fitness | `1638536534984-0d98ccdb6af5.jpg` | VD Photography | [unsplash](https://unsplash.com/photos/v9QOeuh6qog) | **da verificare** |
| Palestre e Fitness | `1770493895453-4f758c40d11d.jpg` | ajiss | [unsplash](https://unsplash.com/photos/xc_uXmo7qBs) | **da verificare** |
| Palestre e Fitness | `1703668984128-b506579acdd2.jpg` | Blend Archive | [unsplash](https://unsplash.com/photos/vDkKAbY__v4) | **da verificare** |
| Palestre e Fitness | `1760291503363-a656fc9cb979.jpg` | Rethanyaa Prabakar | [unsplash](https://unsplash.com/photos/fbjUP8seTfM) | **da verificare** |
| Palestre e Fitness | `1623874228601-f4193c7b1818.jpg` | Samuel Girven | [unsplash](https://unsplash.com/photos/BBR_zigEmyQ) | **da verificare** |
| Palestre e Fitness | `1725289767222-3444016c70ce.jpg` | Kedibone Isaac Makhumisane | [unsplash](https://unsplash.com/photos/SArGwhwGTI0) | **da verificare** |
| Palestre e Fitness | `1784798228092-659924b1a15b.jpg` | Mirko Meister | [unsplash](https://unsplash.com/photos/j4T5z94b8ns) | **da verificare** |
| Palestre e Fitness | `1623874514711-0f321325f318.jpg` | Samuel Girven | [unsplash](https://unsplash.com/photos/fqMu99l8sqo) | **da verificare** |
| Palestre e Fitness | `1771586791190-97ed536c54af.jpg` | Rahul Singh | [unsplash](https://unsplash.com/photos/R_cN3dJLcK8) | **da verificare** |
| Palestre e Fitness | `1728486145245-d4cb0c9c3470.jpg` | Ambitious Studio* - Rick Barrett | [unsplash](https://unsplash.com/photos/w7jYaN7GqyA) | **da verificare** |
| Palestre e Fitness | `1623874106686-5be2b325c8f1.jpg` | Samuel Girven | [unsplash](https://unsplash.com/photos/2e4lbLTqPIo) | **da verificare** |
| Palestre e Fitness | `1632077804406-188472f1a810.jpg` | Heidi Erickson | [unsplash](https://unsplash.com/photos/CPSjcuuV8E8) | **da verificare** |
| Palestre e Fitness | `1653647358769-c0465db60293.jpg` | With Mahdy | [unsplash](https://unsplash.com/photos/Xx1Mddhazmo) | **da verificare** |
| Palestre e Fitness | `1562771241-2e852edfce63.jpg` | Alora Griffiths | [unsplash](https://unsplash.com/photos/vfXc3kgW9q4) | **da verificare** |
| Palestre e Fitness | `1659331150328-e6c822ae77b2.jpg` | Labib Jaffar | [unsplash](https://unsplash.com/photos/CtqoeOJlImQ) | **da verificare** |
| Parrucchieri ed Estetiste | `1781450090585-1a511b7066d9.jpg` | Barney Goodman | [unsplash](https://unsplash.com/photos/_Fy7Kq0w6OI) | verificato 22/10 |
| Parrucchieri ed Estetiste | `1560869713-7d0a29430803.jpg` | Baylee Gramling | [unsplash](https://unsplash.com/photos/MMz03PyCOZg) | **da verificare** |
| Parrucchieri ed Estetiste | `1595475884562-073c30d45670.jpg` | Adam Winger | [unsplash](https://unsplash.com/photos/KVVjmb3IIL8) | **da verificare** |
| Parrucchieri ed Estetiste | `1773904215697-e6c21fc27ac2.jpg` | T | [unsplash](https://unsplash.com/photos/fa0DqQ91dWU) | **da verificare** |
| Parrucchieri ed Estetiste | `1633681926022-84c23e8cb2d6.jpg` | Benyamin Bohlouli | [unsplash](https://unsplash.com/photos/LGXN4OSQSa4) | **da verificare** |
| Parrucchieri ed Estetiste | `1761931403807-f33fc582b1f5.jpg` | Josh Marty | [unsplash](https://unsplash.com/photos/ciMmm8_xKYo) | **da verificare** |
| Parrucchieri ed Estetiste | `1759526997116-c8f4f2431869.jpg` | Maria Lupan | [unsplash](https://unsplash.com/photos/STW4T8mL9eE) | **da verificare** |
| Parrucchieri ed Estetiste | `1610992015762-45dca7fa3a85.jpg` | Chelson Tamares | [unsplash](https://unsplash.com/photos/vtQHwU4F13s) | **da verificare** |
| Parrucchieri ed Estetiste | `1619607146034-5a05296c8f9a.jpg` | H&CO | [unsplash](https://unsplash.com/photos/OpjlRo-31SI) | **da verificare** |
| Parrucchieri ed Estetiste | `1612887390768-fb02affea7a6.jpg` | Jodene Isakowitz | [unsplash](https://unsplash.com/photos/hvqHtZqNMeI) | **da verificare** |
| Parrucchieri ed Estetiste | `1630843599725-32ead7671867.jpg` | Ellie Eshaghi | [unsplash](https://unsplash.com/photos/DtoWpHt2_d8) | **da verificare** |
| Parrucchieri ed Estetiste | `1611313151697-d626e818dddf.jpg` | Caio Coelho | [unsplash](https://unsplash.com/photos/OOKPHqAICKA) | **da verificare** |
| Negozi di Abbigliamento | `1769981281734-4d8cf9fe7b75.jpg` | Kamilla Isalieva | [unsplash](https://unsplash.com/photos/zFTSUkodDlU) | verificato 22/10 |
| Negozi di Abbigliamento | `1786118791511-0252f7c4f156.jpg` | Jana Belonina | [unsplash](https://unsplash.com/photos/1DYk9YughgM) | **da verificare** |
| Negozi di Abbigliamento | `1532453288672-3a27e9be9efd.jpg` | Marcus Loke | [unsplash](https://unsplash.com/photos/xXJ6utyoSw0) | **da verificare** |
| Negozi di Abbigliamento | `1540221652346-e5dd6b50f3e7.jpg` | Fujiphilm | [unsplash](https://unsplash.com/photos/ojZ4wJNUM5w) | **da verificare** |
| Negozi di Abbigliamento | `1777307224150-2d8535401a53.jpg` | Sou Jest | [unsplash](https://unsplash.com/photos/kEbuLsP6hVE) | **da verificare** |
| Negozi di Abbigliamento | `1767968037382-8eb9c564339f.jpg` | Polina Kuzovkova | [unsplash](https://unsplash.com/photos/pt3EBzQcxP0) | **da verificare** |
| Negozi di Abbigliamento | `1603400521630-9f2de124b33b.jpg` | Thom Bradley | [unsplash](https://unsplash.com/photos/mwa_nzFpnJw) | **da verificare** |
| Negozi di Abbigliamento | `1582719188393-bb71ca45dbb9.jpg` | Markus Winkler | [unsplash](https://unsplash.com/photos/PQmXUxmfR44) | **da verificare** |
| Negozi di Abbigliamento | `1517502166878-35c93a0072f0.jpg` | Andrej Lišakov | [unsplash](https://unsplash.com/photos/Yy4sN6QzboU) | **da verificare** |
| Negozi di Abbigliamento | `1777628530456-bb93d3a03faf.jpg` | Bayu Syaits | [unsplash](https://unsplash.com/photos/y5vzB7nisbk) | **da verificare** |
| Negozi di Abbigliamento | `1766934587214-86e21b3ae093.jpg` | Gaku Suyama | [unsplash](https://unsplash.com/photos/ZfjXu2U4yMQ) | **da verificare** |
| Negozi di Abbigliamento | `1760013531865-89ff324f83a6.jpg` | Katya Azimova | [unsplash](https://unsplash.com/photos/05O5v_aBkO0) | **da verificare** |
| Negozi di Abbigliamento | `1760013529817-f50db943ffe2.jpg` | Katya Azimova | [unsplash](https://unsplash.com/photos/oh1VbM3Gb6Q) | **da verificare** |
| Negozi di Abbigliamento | `1641642231157-0849081598a2.jpg` | Storiès | [unsplash](https://unsplash.com/photos/jrQv0161nNM) | **da verificare** |
| Ristoranti | `1498579150354-977475b7ea0b.jpg` | Jakub Kapusnak | [unsplash](https://unsplash.com/photos/tEVisOXz26Y) | verificato 22/10 |
| Ristoranti | `1600803907087-f56d462fd26b.jpg` | Emanuel Ekström | [unsplash](https://unsplash.com/photos/KJOUnsGXq58) | **da verificare** |
| Ristoranti | `1532117472055-4d0734b51f31.jpg` | Liubov Ilchuk | [unsplash](https://unsplash.com/photos/_qZOwG2oaj4) | **da verificare** |
| Ristoranti | `1767510533461-d221a41d5fe4.jpg` | Madeline Liu | [unsplash](https://unsplash.com/photos/MlapR9xJsQE) | **da verificare** |
| Ristoranti | `1506280754576-f6fa8a873550.jpg` | Calum Lewis | [unsplash](https://unsplash.com/photos/rPkgYDh2bmo) | **da verificare** |
| Bar e Caffetterie | `1762402519375-a29d7971a761.jpg` | Panchanok Juntanarach | [unsplash](https://unsplash.com/photos/GT5klubwZhI) | verificato 22/10 |
| Bar e Caffetterie | `1772134141698-c47b78663c55.jpg` | Scott K | [unsplash](https://unsplash.com/photos/UTy23CZhR-M) | **da verificare** |
| Bar e Caffetterie | `1769437059619-506b0f703649.jpg` | Bozhin Karaivanov | [unsplash](https://unsplash.com/photos/xDl0of-N32o) | **da verificare** |
| Bar e Caffetterie | `1776548736734-0654a4d8b7ec.jpg` | Scott K | [unsplash](https://unsplash.com/photos/YkS-mhaOjLI) | **da verificare** |
| Bar e Caffetterie | `1542372147193-a7aca54189cd.jpg` | Rizky Subagja | [unsplash](https://unsplash.com/photos/1k7TnX5GAww) | **da verificare** |
| Pizzerie e Forni | `1559811814-e2c57b5e69df.jpg` | Victoria Shes | [unsplash](https://unsplash.com/photos/IUk1S6n2s0o) | verificato 22/10 |
| Pizzerie e Forni | `1549413468-cd78edb7e75c.jpg` | Maria Orlova | [unsplash](https://unsplash.com/photos/kU7TkW9FIJY) | **da verificare** |
| Pizzerie e Forni | `1566698629409-787a68fc5724.jpg` | Mae Mu | [unsplash](https://unsplash.com/photos/Emhz3miT6mo) | **da verificare** |
| Pizzerie e Forni | `1763647836753-e06fe1f8707b.jpg` | Christopher Chung | [unsplash](https://unsplash.com/photos/uzWpbXFNU6c) | **da verificare** |
| Pizzerie e Forni | `1776136737181-84d03571f69c.jpg` | krzhck | [unsplash](https://unsplash.com/photos/Bb44L-2h2Qo) | **da verificare** |
| Pizzerie e Forni | `1724734333243-17c38ef0cdfd.jpg` | Tadahiro Higuchi | [unsplash](https://unsplash.com/photos/b_jrhey7-HY) | **da verificare** |
| Alimentari e Fruttivendoli | `1758184449358-ac6f5dcd8e04.jpg` | Aleksandr Galichkin | [unsplash](https://unsplash.com/photos/XUrP-NrGIfA) | verificato 22/10 |
| Alimentari e Fruttivendoli | `1579113800032-c38bd7635818.jpg` | Marisol Benitez | [unsplash](https://unsplash.com/photos/QvkAQTNj4zk) | **da verificare** |
| Alimentari e Fruttivendoli | `1624668430039-0175a0fbf006.jpg` | Zoe Richardson | [unsplash](https://unsplash.com/photos/hmoDcZnB7uw) | **da verificare** |
| Alimentari e Fruttivendoli | `1635341083777-5f93a755e916.jpg` | Skön Communication | [unsplash](https://unsplash.com/photos/OqXXSSPs4zw) | **da verificare** |
| Alimentari e Fruttivendoli | `1760329894129-1d398f3b6866.jpg` | dylan yedinak | [unsplash](https://unsplash.com/photos/Qx8Pj_x9Z20) | **da verificare** |
| Alimentari e Fruttivendoli | `1635450370155-d6a650322fa5.jpg` | Nick Fewings | [unsplash](https://unsplash.com/photos/yrf7EwzaSDU) | **da verificare** |

## Altro servizio di terzi rimasto

I riquadri della mappa usano OpenStreetMap (`tile.openstreetmap.org`) solo come ripiego quando manca il file `roma.pmtiles` del sito: regola a parte, vedi `docs/` sulle mappe.
