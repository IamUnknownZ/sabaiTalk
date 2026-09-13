#!/usr/bin/env python3
from pathlib import Path
import subprocess, html

ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / ".tmp-assets" / "generated"
TMP.mkdir(parents=True, exist_ok=True)

C={"blue":"#2D8CFF","blue2":"#78B7EE","sky":"#A9D7F7","mint":"#5EE2B8","green":"#7EDB89","green2":"#9BCB9A","bg":"#F5FAFD","white":"#FFFFFF","navy":"#173A6B","ink":"#253A55","coral":"#FF7A8A","yellow":"#FFD166","purple":"#8A7CFF","softblue":"#DDF1FF","softmint":"#DFF8EC","line":"#B9DDF6"}
FONT="Noto Sans Display"

DEFS=f"""<defs>
<linearGradient id="gMix" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{C['blue']}"/><stop offset=".52" stop-color="#43B7F7"/><stop offset="1" stop-color="{C['mint']}"/></linearGradient>
<filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#2B72A8" flood-opacity=".16"/></filter>
<filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#173A6B" flood-opacity=".12"/></filter>
</defs>"""

def wrap(w,h,body,bg=None):
    base=f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{DEFS}{base}{body}</svg>'

def render(folder,name,w,h,body,bg=None):
    out=(ROOT/"assets"/folder); out.mkdir(parents=True,exist_ok=True)
    svg=TMP/name.replace(".png",".svg"); png=out/name
    svg.write_text(wrap(w,h,body,bg),encoding="utf-8")
    subprocess.run(["convert","-background","none",str(svg),"-strip",str(png)],check=True)
    return png

def text(x,y,s,size,fill=None,weight=700,anchor="middle"):
    return f'<text x="{x}" y="{y}" font-family="{FONT},sans-serif" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" fill="{fill or C["navy"]}">{html.escape(s)}</text>'

def spark(x,y,color=None,s=1):
    col=color or C["yellow"]
    pts=[(x,y-16*s),(x+5*s,y-5*s),(x+16*s,y),(x+5*s,y+5*s),(x,y+16*s),(x-5*s,y+5*s),(x-16*s,y),(x-5*s,y-5*s)]
    return '<polygon points="'+' '.join(f"{a},{b}" for a,b in pts)+f'" fill="{col}"/>'

def pin(x,y,s=1,fill="url(#gMix)",face=False):
    d=f'M {x} {y+92*s} C {x-62*s} {y+28*s},{x-62*s} {y-34*s},{x} {y-66*s} C {x+62*s} {y-34*s},{x+62*s} {y+28*s},{x} {y+92*s} Z'
    z=f'<path d="{d}" fill="{fill}" stroke="{C["white"]}" stroke-width="{10*s}" stroke-linejoin="round" filter="url(#softShadow)"/><circle cx="{x}" cy="{y-10*s}" r="{26*s}" fill="{C["white"]}"/>'
    if face:
        z+=f'<circle cx="{x-10*s}" cy="{y-14*s}" r="{4*s}" fill="{C["navy"]}"/><path d="M{x+4*s} {y-13*s} q {10*s} {8*s} {18*s} 0" fill="none" stroke="{C["navy"]}" stroke-width="{4*s}" stroke-linecap="round"/><path d="M{x-12*s} {y+8*s} q {12*s} {12*s} {24*s} 0" fill="none" stroke="{C["coral"]}" stroke-width="{4*s}" stroke-linecap="round"/>'
    return z

def chat(x,y,w=120,h=72,fill=None):
    f=fill or C["mint"]
    return f'<g filter="url(#softShadow)"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="{f}" stroke="{C["white"]}" stroke-width="6"/><path d="M{x+w*.26} {y+h-4} L{x+w*.18} {y+h+20} L{x+w*.45} {y+h-3} Z" fill="{f}"/><circle cx="{x+w*.36}" cy="{y+h*.5}" r="5" fill="white"/><circle cx="{x+w*.5}" cy="{y+h*.5}" r="5" fill="white"/><circle cx="{x+w*.64}" cy="{y+h*.5}" r="5" fill="white"/></g>'

def person(cx,cy,s=1,skin="#F2BF9D",hair="#2E2934",shirt=None,acc=None):
    shirt=shirt or C["blue"]; r=34*s; by=cy+40*s
    z=f'<g filter="url(#softShadow)"><path d="M{cx-58*s} {by+62*s} Q{cx} {by-8*s} {cx+58*s} {by+62*s}Z" fill="{shirt}"/><circle cx="{cx}" cy="{cy}" r="{r}" fill="{skin}" stroke="white" stroke-width="{5*s}"/><path d="M{cx-32*s} {cy-8*s} Q{cx-12*s} {cy-48*s} {cx+27*s} {cy-25*s} Q{cx+37*s} {cy-8*s} {cx+28*s} {cy+2*s} Q{cx+10*s} {cy-18*s} {cx-32*s} {cy-8*s}Z" fill="{hair}"/><circle cx="{cx-11*s}" cy="{cy+4*s}" r="{3.5*s}" fill="{C["navy"]}"/><circle cx="{cx+11*s}" cy="{cy+4*s}" r="{3.5*s}" fill="{C["navy"]}"/><path d="M{cx-8*s} {cy+18*s} q{8*s} {8*s} {16*s} 0" fill="none" stroke="{C["coral"]}" stroke-width="{3*s}" stroke-linecap="round"/>'
    if acc=="cap":
        z+=f'<path d="M{cx-36*s} {cy-20*s} q{34*s} {-28*s} {70*s} 0" fill="{C["green"]}" stroke="white" stroke-width="{4*s}"/><rect x="{cx+18*s}" y="{cy-24*s}" width="{30*s}" height="{7*s}" rx="{3*s}" fill="{C["blue"]}"/>'
    elif acc=="glasses":
        z+=f'<circle cx="{cx-12*s}" cy="{cy+3*s}" r="{11*s}" fill="none" stroke="{C["navy"]}" stroke-width="{3*s}"/><circle cx="{cx+12*s}" cy="{cy+3*s}" r="{11*s}" fill="none" stroke="{C["navy"]}" stroke-width="{3*s}"/>'
    elif acc=="headphones":
        z+=f'<path d="M{cx-32*s} {cy} A{32*s} {32*s} 0 0 1 {cx+32*s} {cy}" fill="none" stroke="{C["navy"]}" stroke-width="{7*s}"/><rect x="{cx-40*s}" y="{cy-2*s}" width="{12*s}" height="{26*s}" rx="{6*s}" fill="{C["blue"]}"/><rect x="{cx+28*s}" y="{cy-2*s}" width="{12*s}" height="{26*s}" rx="{6*s}" fill="{C["green"]}"/>'
    return z+'</g>'

def soft_bg(w,h):
    return f'<circle cx="{w*.12}" cy="{h*.16}" r="{w*.20}" fill="{C["softblue"]}"/><circle cx="{w*.88}" cy="{h*.78}" r="{w*.25}" fill="{C["softmint"]}"/>'

def map_panel(x,y,w,h):
    return f'<g filter="url(#softShadow)"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{w*.09}" fill="#EEF8FF" stroke="white" stroke-width="8"/><path d="M{x+w*.08} {y+h*.25} C{x+w*.32} {y+h*.10},{x+w*.46} {y+h*.38},{x+w*.68} {y+h*.18} S{x+w*.95} {y+h*.20},{x+w*.95} {y+h*.20}" fill="none" stroke="{C["line"]}" stroke-width="10"/><path d="M{x+w*.18} {y+h*.92} C{x+w*.20} {y+h*.62},{x+w*.48} {y+h*.70},{x+w*.50} {y+h*.40} S{x+w*.82} {y+h*.42},{x+w*.86} {y+h*.12}" fill="none" stroke="{C["line"]}" stroke-width="10"/></g>'

def title(w,a,b):
    return text(w/2,105,a,56,C["navy"],800)+text(w/2,160,b,28,C["ink"],500)

def make_branding():
    b=soft_bg(1024,1024)+f'<rect x="72" y="72" width="880" height="880" rx="220" fill="white" filter="url(#shadow)"/>'+pin(512,400,2.45,face=True)+chat(630,328,210,120)+spark(225,270,C["yellow"],2.1)+spark(815,215,C["coral"],1.3)+text(512,800,"SabaiTalk",112,C["navy"],800)+text(512,868,"MEET • CHAT • GO OUT",30,C["blue"],600)
    render("branding","app-icon.png",1024,1024,b,C["bg"])
    render("branding","adaptive-icon.png",1024,1024,pin(512,490,3,face=True)+chat(650,392,210,116)+spark(275,290,C["yellow"],1.8),None)
    render("branding","logo-mark.png",512,512,pin(256,250,1.75,face=True)+chat(335,192,130,76)+spark(140,125,C["yellow"],1),None)
    b=pin(210,245,1.38,face=True)+chat(280,185,110,66)+text(430,278,"Sabai",132,C["navy"],800,"start")+text(820,278,"Talk",132,C["green"],800,"start")+f'<path d="M430 320 Q760 355 1180 314" fill="none" stroke="{C["blue2"]}" stroke-width="12" stroke-linecap="round"/>'+spark(1275,150,C["yellow"],1.25)
    render("branding","logo-horizontal.png",1600,500,b,None)
    b=soft_bg(1200,1200)+pin(600,470,2.1,face=True)+chat(720,380,170,96)+text(600,840,"SabaiTalk",120,C["navy"],800)+text(600,915,"same vibe • closer people",34,C["blue"],600)+spark(300,250,C["yellow"],1.5)
    render("branding","splash-logo.png",1200,1200,b,None)

def make_illustrations():
    w=h=1080
    b=soft_bg(w,1350)+title(w,"Find your people","Nearby, shared interests, zero pressure")+person(350,560,2,shirt=C["blue"],acc="headphones")+person(730,580,2,shirt=C["green"],acc="cap")+pin(540,865,1.6,face=True)+chat(610,790,185,104)+text(540,1190,"Meet • Chat • Do more together",34,C["navy"],700)
    render("illustrations","welcome.png",1080,1350,b,C["bg"])
    b=soft_bg(w,h)+title(w,"People around you","Distance without exposing exact locations")+map_panel(160,250,760,620)+pin(540,560,1.6,face=True)
    for x,y,c,a in [(330,380,C["blue"],"glasses"),(770,390,C["green"],"cap"),(315,750,C["purple"],"headphones"),(775,735,C["coral"],None)]:
        b+=f'<circle cx="{x}" cy="{y}" r="76" fill="white" stroke="{c}" stroke-width="8"/>'+person(x,y-10,.62,shirt=c,acc=a)
    render("illustrations","nearby.png",w,h,b,C["bg"])
    b=soft_bg(w,h)+title(w,"Same vibe","Interests + distance + activity")+f'<circle cx="330" cy="520" r="150" fill="{C["softblue"]}"/>'+person(330,480,1.35,shirt=C["blue"],acc="headphones")+f'<circle cx="750" cy="520" r="150" fill="{C["softmint"]}"/>'+person(750,480,1.35,shirt=C["green"],acc="glasses")
    for i,(lab,col) in enumerate([("Gaming",C["purple"]),("Music",C["blue"]),("Cafe",C["green"])]):
        x=295+i*245; b+=f'<rect x="{x}" y="760" width="190" height="72" rx="36" fill="{col}"/>'+text(x+95,807,lab,28,"white",700)
    b+=text(540,930,"86% MATCH",72,C["navy"],800)
    render("illustrations","matching.png",w,h,b,C["bg"])
    b=soft_bg(w,h)+title(w,"Meet somewhere fun","Public places that work for both")+person(260,650,1.35,shirt=C["blue"],acc="headphones")+person(820,650,1.35,shirt=C["green"],acc="cap")+pin(540,570,1.75,face=True)+f'<rect x="360" y="800" width="360" height="140" rx="55" fill="white" filter="url(#softShadow)"/>'+text(540,860,"Cafe halfway",34,C["navy"],800)+text(540,910,"14 min • 16 min",28,C["blue"],600)
    render("illustrations","meeting.png",w,h,b,C["bg"])
    b=soft_bg(w,h)+title(w,"Fair for both","Compare travel time, not just a midpoint")+f'<rect x="145" y="300" width="790" height="520" rx="70" fill="white" filter="url(#shadow)"/>'+pin(540,480,1.55,face=True)+person(280,500,.95,shirt=C["blue"])+person(800,500,.95,shirt=C["green"])+f'<line x1="260" y1="770" x2="820" y2="770" stroke="{C["line"]}" stroke-width="18" stroke-linecap="round"/><circle cx="520" cy="770" r="22" fill="{C["blue"]}" stroke="white" stroke-width="6"/>'+text(270,860,"14 min",34,C["blue"],800)+text(810,860,"16 min",34,C["green"],800)+text(540,930,"94% FAIR",52,C["navy"],800)
    render("illustrations","fair-meeting.png",w,h,b,C["bg"])
    states=[("location-permission.png","Share your area","Only approximate distance is shown","ok"),("location-denied.png","Location is off","Turn it on to discover nearby people","deny"),("empty-nearby.png","No one nearby yet","Try a wider search radius","nearby"),("empty-matches.png","No matches yet","Keep exploring your area","match"),("empty-chat.png","Start a conversation","Your matched chats will appear here","chat"),("no-place-found.png","No place found","Try another category or area","place")]
    for fn,ti,sub,kind in states:
        b=soft_bg(900,900)+title(900,ti,sub)
        if kind=="ok": b+=pin(450,440,1.7,face=True)+f'<circle cx="600" cy="350" r="62" fill="{C["green"]}" stroke="white" stroke-width="8"/><path d="M570 350 l20 22 l42 -50" fill="none" stroke="white" stroke-width="14" stroke-linecap="round"/>'
        elif kind=="deny": b+=pin(450,440,1.7,fill="#96A9BE")+f'<circle cx="600" cy="350" r="62" fill="{C["coral"]}" stroke="white" stroke-width="8"/><path d="M570 320 L630 380 M630 320 L570 380" stroke="white" stroke-width="14" stroke-linecap="round"/>'
        elif kind=="nearby": b+=map_panel(215,300,470,370)+f'<circle cx="450" cy="500" r="88" fill="white" stroke="{C["blue2"]}" stroke-width="8"/>'+pin(450,505,.65,face=True)
        elif kind=="match": b+=f'<circle cx="360" cy="480" r="105" fill="{C["softblue"]}"/><circle cx="540" cy="480" r="105" fill="{C["softmint"]}"/>'+person(360,450,.85,shirt=C["blue"])+person(540,450,.85,shirt=C["green"])+f'<path d="M450 665 C415 625 360 665 450 745 C540 665 485 625 450 665Z" fill="none" stroke="{C["line"]}" stroke-width="10" stroke-dasharray="14 12"/>'
        elif kind=="chat": b+=chat(265,350,370,210,C["blue2"])+chat(350,560,285,160,C["mint"])
        else: b+=map_panel(205,320,490,390)+f'<circle cx="560" cy="560" r="115" fill="white" stroke="{C["line"]}" stroke-width="12"/><line x1="640" y1="645" x2="715" y2="720" stroke="{C["navy"]}" stroke-width="22" stroke-linecap="round"/><path d="M515 515 L605 605 M605 515 L515 605" stroke="{C["coral"]}" stroke-width="18" stroke-linecap="round"/>'
        render("illustrations",fn,900,900,b,C["bg"])

def make_avatars():
    skins=["#F5C7A9","#E8B08D","#D9976C","#B97858","#F1C2A2","#C88661","#F6D0B5","#E3A37E","#9B634C","#F0BA95","#C47C5F","#E8BFA1"]
    hairs=["#272434","#4A2B2A","#1F273A","#6A4439","#B77A45","#3A2C2A","#1D2537","#81513C","#2A2025","#C48A54","#34283D","#57382E"]
    shirts=[C["blue"],C["green"],C["purple"],C["coral"],"#28B8C9",C["yellow"],"#5476FF","#50C878","#FF8FA3","#8A7CFF","#2D8CFF","#62D8AB"]
    acc=[None,"headphones","cap","glasses","cap","headphones","glasses",None,"headphones","cap","glasses",None]
    for i in range(12):
        b=f'<circle cx="256" cy="256" r="238" fill="white" stroke="{shirts[i]}" stroke-width="12"/><circle cx="256" cy="256" r="205" fill="{C["softblue"] if i%2==0 else C["softmint"]}"/>'+person(256,225,1.9,skins[i],hairs[i],shirts[i],acc[i])+spark(120,120,C["yellow"] if i%3==0 else C["coral"],.7)
        render("avatars",f"avatar-{i+1:02d}.png",512,512,b,None)

def place_shell(label,inner):
    return soft_bg(512,512)+f'<rect x="52" y="64" width="408" height="360" rx="92" fill="white" filter="url(#shadow)"/>'+inner+text(256,468,label,38,C["navy"],800)

def make_places():
    render("places","cafe.png",512,512,place_shell("Cafe",f'<path d="M145 220 h185 v95 q0 58 -92 58 q-93 0 -93 -58Z" fill="{C["blue2"]}"/><path d="M330 242 q82 -4 82 55 q0 55 -82 45" fill="none" stroke="{C["navy"]}" stroke-width="18"/><path d="M200 170 q-22 -46 18 -72 M260 170 q-22 -46 18 -72" fill="none" stroke="{C["mint"]}" stroke-width="14" stroke-linecap="round"/>'),C["bg"])
    render("places","food.png",512,512,place_shell("Food",f'<circle cx="256" cy="275" r="112" fill="{C["mint"]}"/><path d="M185 270 q70 -90 142 0" fill="none" stroke="white" stroke-width="38" stroke-linecap="round"/><line x1="135" y1="160" x2="135" y2="360" stroke="{C["navy"]}" stroke-width="18"/><line x1="377" y1="160" x2="377" y2="360" stroke="{C["navy"]}" stroke-width="18"/>'),C["bg"])
    render("places","park.png",512,512,place_shell("Park",f'<rect x="140" y="314" width="235" height="34" rx="12" fill="#C89B72"/><rect x="160" y="348" width="24" height="62" fill="{C["navy"]}"/><rect x="332" y="348" width="24" height="62" fill="{C["navy"]}"/><rect x="250" y="190" width="36" height="150" rx="14" fill="#9A6D4A"/><circle cx="268" cy="180" r="92" fill="{C["green"]}"/><circle cx="208" cy="200" r="55" fill="{C["mint"]}"/><circle cx="325" cy="205" r="55" fill="{C["green2"]}"/>'),C["bg"])
    render("places","mall.png",512,512,place_shell("Mall",f'<rect x="125" y="190" width="262" height="190" rx="30" fill="{C["softblue"]}" stroke="{C["blue"]}" stroke-width="12"/><rect x="165" y="225" width="182" height="42" rx="20" fill="{C["blue"]}"/>'+text(256,255,"MALL",28,"white",800)+f'<rect x="215" y="300" width="82" height="80" fill="white" stroke="{C["line"]}" stroke-width="8"/>'),C["bg"])
    render("places","cinema.png",512,512,place_shell("Cinema",f'<rect x="130" y="210" width="252" height="155" rx="34" fill="{C["navy"]}"/><polygon points="235,245 235,330 315,287" fill="white"/><rect x="170" y="150" width="190" height="70" rx="18" fill="{C["coral"]}"/><path d="M185 150 l35 70 M250 150 l35 70 M315 150 l35 70" stroke="white" stroke-width="14"/>'),C["bg"])
    render("places","study.png",512,512,place_shell("Study",f'<rect x="150" y="290" width="210" height="92" rx="18" fill="{C["blue"]}"/><rect x="175" y="245" width="210" height="78" rx="18" fill="{C["green"]}"/><rect x="135" y="200" width="210" height="72" rx="18" fill="{C["yellow"]}"/><path d="M180 200 v72 M220 245 v78 M195 290 v92" stroke="white" stroke-width="8"/>'),C["bg"])

def make_decorations():
    render("decorations","clouds.png",860,520,f'<g fill="white" stroke="{C["line"]}" stroke-width="6"><circle cx="270" cy="250" r="115"/><circle cx="420" cy="220" r="145"/><circle cx="590" cy="265" r="120"/><rect x="180" y="250" width="500" height="175" rx="85"/></g>',None)
    b=f'<rect x="80" y="330" width="800" height="160" rx="45" fill="{C["softmint"]}"/><rect x="145" y="215" width="100" height="275" rx="16" fill="{C["blue2"]}"/><rect x="285" y="150" width="130" height="340" rx="16" fill="{C["mint"]}"/><rect x="455" y="245" width="112" height="245" rx="16" fill="{C["purple"]}"/><rect x="610" y="110" width="150" height="380" rx="16" fill="{C["blue"]}"/><rect x="790" y="280" width="80" height="210" rx="16" fill="{C["green"]}"/>'
    render("decorations","city.png",960,560,b,None)
    render("decorations","trees.png",980,620,f'<rect x="455" y="300" width="70" height="260" rx="20" fill="#9A6D4A"/><circle cx="490" cy="240" r="160" fill="{C["green"]}"/><circle cx="350" cy="300" r="110" fill="{C["mint"]}"/><circle cx="625" cy="300" r="105" fill="{C["green2"]}"/><circle cx="500" cy="120" r="100" fill="{C["mint"]}"/>',None)
    b=f'<path d="M80 360 C180 40 400 560 520 180 S770 460 900 120" fill="none" stroke="{C["blue2"]}" stroke-width="24" stroke-linecap="round"/><path d="M140 460 C300 280 340 570 510 430 S770 590 890 360" fill="none" stroke="{C["mint"]}" stroke-width="20" stroke-linecap="round"/>'+spark(150,120,C["yellow"],2)+spark(760,190,C["coral"],1.6)+spark(500,80,C["purple"],1.2)
    render("decorations","scribbles.png",980,620,b,None)
    b=''.join(spark(x,y,c,s) for x,y,c,s in [(150,190,C["yellow"],2.2),(360,100,C["blue"],1.4),(520,280,C["coral"],1.8),(760,150,C["mint"],2),(830,380,C["purple"],1.3),(270,420,C["green"],1.4)])
    render("decorations","sparkles.png",980,560,b,None)

def manifest():
    files=sorted((ROOT/"assets").rglob("*.png"))
    lines=["# SabaiTalk Asset Manifest","","Generated production assets. Every item is an individual PNG, not a sprite sheet.",""]
    lines += [f"- `{p.relative_to(ROOT)}`" for p in files]
    (ROOT/"ASSETS.md").write_text("\n".join(lines)+"\n",encoding="utf-8")

if __name__=="__main__":
    make_branding()
    make_illustrations()
    make_avatars()
    make_places()
    make_decorations()
    manifest()
    print("Generated",len(list((ROOT/"assets").rglob("*.png"))),"PNG assets")
