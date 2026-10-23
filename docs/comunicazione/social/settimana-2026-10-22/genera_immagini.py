import json,subprocess,sys
D=sys.argv[1]
P=json.loads(subprocess.check_output(['node','-e',"const s=require('/tmp/claude-0/-home-user-Scontiroma/c300e2e7-6bb9-535b-a090-ad9c17d8d722/scratchpad/si/node_modules/simple-icons');console.log(JSON.stringify([s.siWhatsapp.path,s.siInstagram.path,s.siFacebook.path]))"]))
def ic(c,p,s): return f'<span class="ic {c}" style="width:{s}px;height:{s}px"><svg viewBox="0 0 24 24" style="width:{int(s*.58)}px;height:{int(s*.58)}px"><path fill="#fff" d="{p}"/></svg></span>'
CSS="""@font-face{font-family:M;font-weight:200 800;src:url('/home/user/Scontiroma/frontend/public/fonts/manrope-latin-wght-normal.woff2')}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:M;color:#1A1530;position:relative;overflow:hidden}
.ic{border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex:none}.wa{background:#25D366}.fb{background:#0866FF}.ig{background:radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285AEB 90%)}
.br{display:flex;align-items:center;gap:16px}.br img{width:70px;height:70px}.br b{font-size:38px;font-weight:800}.br span{display:block;font-size:14px;letter-spacing:4px;font-weight:800;color:#00798C}
em{font-style:normal;color:#D81B72}.pill{display:flex;align-items:center;gap:12px;background:#fff;border-radius:60px;padding:10px 26px 10px 10px;box-shadow:0 4px 18px #0001}.pill small{display:block;font-size:20px;font-weight:700;color:#5E5875}.pill b{font-size:28px;font-weight:800}
.f{position:absolute;left:0;right:0;bottom:0;height:86px;background:linear-gradient(90deg,#D81B72,#6D4AFF);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 80px;font-size:26px;font-weight:700}"""
BR='<div class="br"><img src="/home/user/Scontiroma/frontend/public/icon-512.svg"><div><b>Sconti Roma</b><span>ROMA È TUA</span></div></div>'
def soc(s=58):
  return f'<div style="display:flex;justify-content:center;gap:30px">\
<div class="pill">{ic("wa",P[0],s)}<div><small>WhatsApp</small><b>352 247 3526</b></div></div>\
<div class="pill">{ic("ig",P[1],s)}{ic("fb",P[2],s)}<div><small>Seguici</small><b>Sconti Roma</b></div></div></div>'
F='<div class="f"><span>Gratuita nella fase di lancio</span><span>18+ · scontiroma.it</span></div>'
pages={
'post1_come_funziona':(1080,1080,f"""<div style="position:absolute;inset:0;background:linear-gradient(180deg,#EEE9FF,#fff 70%)"></div><div style="position:relative;padding:70px 80px">{BR}
<h1 style="font-size:84px;line-height:1.02;font-weight:800;letter-spacing:-2px;margin-top:50px">Come funziona<br><em>Sconti Roma</em></h1>
<div style="margin-top:44px;display:flex;flex-direction:column;gap:22px;font-size:38px;font-weight:700">
<div style="display:flex;gap:22px;align-items:center"><span style="flex:none;width:66px;height:66px;border-radius:50%;background:#D81B72;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800">1</span>Scegli la tua zona</div>
<div style="display:flex;gap:22px;align-items:center"><span style="flex:none;width:66px;height:66px;border-radius:50%;background:#6D4AFF;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800">2</span>Guarda l'offerta del mese</div>
<div style="display:flex;gap:22px;align-items:center"><span style="flex:none;width:66px;height:66px;border-radius:50%;background:#00798C;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800">3</span>Mostra il QR alla cassa</div></div></div>
<div style="position:absolute;left:0;right:0;bottom:116px">{soc()}</div>{F}"""),
'post2_hai_un_negozio':(1080,1080,f"""<div style="position:absolute;inset:0;background:linear-gradient(180deg,#CDF1F6,#E3F7F2 60%,#fff)"></div><div style="position:relative;padding:70px 80px">{BR}
<h1 style="font-size:110px;line-height:1;font-weight:800;letter-spacing:-3px;margin-top:60px">Hai un<br><em>negozio?</em></h1>
<p style="margin-top:36px;font-size:40px;line-height:1.3;font-weight:600;color:#3a3358;max-width:880px">Pubblica un'offerta al mese su Sconti Roma: i clienti di Roma e dintorni la trovano nell'app e te la mostrano alla cassa.</p>
<p style="margin-top:24px;font-size:34px;font-weight:800;color:#00798C">Iscrizione gratuita nella fase di lancio</p></div>
<div style="position:absolute;left:0;right:0;bottom:116px">{soc()}</div><div class="f"><span>Scrivici su WhatsApp</span><span>scontiroma.it/per-i-commercianti</span></div>"""),
'storia1_stiamo_arrivando':(1080,1920,f"""<div style="position:absolute;inset:0;background:linear-gradient(180deg,#FDE9F3,#EEE9FF 60%,#fff)"></div><div style="position:relative;padding:150px 80px">{BR}
<h1 style="font-size:150px;line-height:.98;font-weight:800;letter-spacing:-4px;margin-top:220px">Stiamo<br><em>arrivando</em></h1>
<p style="margin-top:50px;font-size:50px;line-height:1.3;font-weight:600;color:#3a3358">Le offerte dei negozi di Roma e dintorni, in un'app.</p>
<div style="margin-top:110px;border:4px dashed #c9bff0;border-radius:30px;height:300px;display:flex;align-items:center;justify-content:center;color:#9a90bf;font-size:34px;font-weight:700">qui il sondaggio dall'app</div></div>
<div style="position:absolute;left:0;right:0;bottom:240px">{soc(66)}</div>{F}"""),
'storia2_che_negozi':(1080,1920,f"""<div style="position:absolute;inset:0;background:linear-gradient(180deg,#EEE9FF,#fff)"></div><div style="position:relative;padding:150px 80px">{BR}
<h1 style="font-size:120px;line-height:1.02;font-weight:800;letter-spacing:-3px;margin-top:220px">Quale negozio<br>vorresti<br><em>su Sconti Roma?</em></h1>
<p style="margin-top:44px;font-size:46px;line-height:1.3;font-weight:600;color:#3a3358">Bar, pizzeria, parrucchiere, palestra… scrivicelo qui sotto 👇</p>
<div style="margin-top:90px;border:4px dashed #c9bff0;border-radius:30px;height:340px;display:flex;align-items:center;justify-content:center;color:#9a90bf;font-size:34px;font-weight:700">qui il riquadro «Domanda» dall'app</div></div>{F}"""),
'storia3_negozi_whatsapp':(1080,1920,f"""<div style="position:absolute;inset:0;background:linear-gradient(180deg,#CDF1F6,#fff)"></div><div style="position:relative;padding:150px 80px">{BR}
<h1 style="font-size:140px;line-height:1;font-weight:800;letter-spacing:-4px;margin-top:240px">Hai un<br><em>negozio?</em></h1>
<p style="margin-top:50px;font-size:50px;line-height:1.3;font-weight:600;color:#3a3358">Un'offerta al mese, i clienti vicini ti trovano nell'app. Iscrizione gratuita nella fase di lancio.</p>
<p style="margin-top:70px;font-size:56px;font-weight:800">Scrivici su WhatsApp 👇</p></div>
<div style="position:absolute;left:0;right:0;bottom:240px">{soc(66)}</div><div class="f"><span>Sconti Roma</span><span>scontiroma.it</span></div>"""),
}
for n,(w,h,body) in pages.items():
  open(f'{D}/{n}.html','w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}body{{width:{w}px;height:{h}px}}</style></head><body>{body}</body></html>')
print(json.dumps({n:[w,h] for n,(w,h,_) in pages.items()}))
