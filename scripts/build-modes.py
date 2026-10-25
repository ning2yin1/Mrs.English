"""Build explicit per-question mode settings from reviewed grammar targets.
No runtime random vocabulary substitution. Output is versioned and audited.
"""
import json,re
qs=json.load(open('data/questions-600.json'))
# Each row lists the tested grammar-bearing word in the ten source sentences.
rows='''
am is is are are is is is are are
not not not not not not not not not not
Are Is Are Is Is Are Is Are Is Are
play study live speak drink watch walk love know need
plays studies likes goes cooks rises watches has does teaches
do does do does do does do does do does
Do Does Do Does Do Does Do Does Do Does
What Who Where What Who Where What Who Where What
When Why How When Why How When Why How When
Open sit touch Listen Be Turn wait forget Keep Enjoy
can can Can cannot can Can can can Can cannot
reading cooking playing sleeping listening waiting crying dancing raining doing
was was were were Was was were were Were was
watched visited played cleaned studied walked opened enjoyed carried started
went ate saw bought came found wrote took gave made
Did did Did did did did Did did did did
is are Is is are is Are are is are
me him mine them hers us her his theirs you
brothers boxes dresses children mice tomatoes watches women potatoes feet
on in at under near on above in between through
will will will will Will will will will will Will
going going going going going going going going going going
must must must must must must must must must must
have has have have have have have have have has
should should should should Should should should should should should
to to To to to to to to to to
to to to to to to to to to to
to to to to to to to to to to
reading cooking Swimming cleaning speaking helping learning talking playing taking
heavier more colder faster easier smaller more taller cheaper harder
tallest most fastest hottest funniest easiest best most youngest worst
as as as as as as as as as as
because so because so because so because so because so
when If when If when If when If when If
that that that that that that that that that that
watching studying playing sleeping listening eating raining waiting doing laughing
spoken made cleaned loved locked sold visited delivered played washed
built stolen made canceled taken written broken sold found released
me us me her us me me sister him me
tired interesting soft delicious sweet happy great cold wonderful strange
have has Have have has have Has have have has
for since for since have since been since for for
finished left eaten decided lost arrived cleaned started broken finished
been been been been been been been been been been
who who who who who who who who who who
which which which which which which which which which which
that that that that that that that that that that
watched made lent met bought heard took chose cooked sent
singing standing sleeping waiting wearing playing dancing leaving looking running
written made taken published broken sent parked played grown told
lives wants starts left met felt is take opens put
to to to to to to to to to to
too too too too too too too too too too
enough enough enough enough enough enough enough enough enough enough
cry stay laugh leave smile use wake borrow dance travel
to to to to to to to to to to
had were knew had were were spoke had were knew
could had were were could knew lived had were could
Feeling Walking Looking Hearing knowing Opening Sitting Seeing Being Listening
had rains that been had made could reading who to
'''.strip().splitlines()
assert len(rows)==60
# Inflection paradigms: incorrect forms target the same lexeme, not unrelated words.
paradigms='''
play plays played playing
study studies studied studying
live lives lived living
speak speaks spoke speaking spoken
drink drinks drank drinking drunk
watch watches watched watching
walk walks walked walking
love loves loved loving
know knows knew knowing known
need needs needed needing
like likes liked liking
go goes went going gone
cook cooks cooked cooking
rise rises rose rising risen
have has had having
do does did doing done
teach teaches taught teaching
open opens opened opening
sit sits sat sitting
touch touches touched touching
listen listens listened listening
turn turns turned turning
wait waits waited waiting
forget forgets forgot forgetting forgotten
keep keeps kept keeping
enjoy enjoys enjoyed enjoying
read reads reading
sleep sleeps slept sleeping
cry cries cried crying
dance dances danced dancing
rain rains rained raining
visit visits visited visiting
clean cleans cleaned cleaning
carry carries carried carrying
start starts started starting
eat eats ate eating eaten
see sees saw seeing seen
buy buys bought buying bought
come comes came coming
find finds found finding
write writes wrote writing written
take takes took taking taken
give gives gave giving given
make makes made making
understand understands understood understanding
finish finishes finished finishing
help helps helped helping
learn learns learned learning
swim swims swam swimming swum
talk talks talked talking
practice practices practiced practicing
speak speaks spoke speaking spoken
love loves loved loving
lock locks locked locking
sell sells sold selling
wash washes washed washing
deliver delivers delivered delivering
build builds built building
steal steals stole stealing stolen
cancel cancels canceled canceling
break breaks broke breaking broken
release releases released releasing
lend lends lent lending
tell tells told telling
leave leaves left leaving
lose loses lost losing
arrive arrives arrived arriving
decide decides decided deciding
meet meets met meeting
hear hears heard hearing
choose chooses chose choosing chosen
send sends sent sending
sing sings sang singing sung
stand stands stood standing
wear wears wore wearing worn
look looks looked looking
run runs ran running run
publish publishes published publishing
park parks parked parking
grow grows grew growing grown
want wants wanted wanting
feel feels felt feeling
put puts putting
stay stays stayed staying
laugh laughs laughed laughing
smile smiles smiled smiling
use uses used using
wake wakes woke waking woken
borrow borrows borrowed borrowing
travel travels traveled traveling
be is was being been
'''
forms={}
for line in paradigms.strip().splitlines():
 p=list(dict.fromkeys(line.split()))
 for w in p:forms[w]=[x for x in p if x!=w]
special={
'am':['is','are','be'],'is':['am','are','be'],'are':['am','is','be'],'was':['were','be','been'],'were':['was','be','been'],
'not':['no','none','nothing'], 'can':['cans','canning','canned'],'cannot':['cannots','cannot to','not can'],
'what':['who','where','when'],'who':['what','where','when'],'where':['who','what','when'],'when':['why','how','where'],'why':['when','where','how'],'how':['when','why','where'],
'will':['wills','willing','will to'],'must':['musts','must to','musting'],'should':['shoulds','should to','shoulding'],
'me':['I','my','mine'],'him':['he','his','himself'],'mine':['me','my','I'],'them':['they','their','theirs'],'hers':['her','she','herself'],'us':['we','our','ours'],'her':['she','hers','herself'],'his':['he','him','himself'],'theirs':['they','them','their'],'you':['your','yours','yourself'],
'brothers':['brother','brotheres','brotheries'],'boxes':['box','boxs','boxies'],'dresses':['dress','dresss','dressies'],'children':['child','childs','childes'],'mice':['mouse','mouses','mices'],'tomatoes':['tomato','tomatos','tomatoies'],'watches':['watch','watchs','watchies'],'women':['woman','womans','womens'],'potatoes':['potato','potatos','potatoies'],'feet':['foot','foots','feets'],
'on':['in','at','of'],'in':['on','at','of'],'at':['on','in','of'],'under':['above','beside','behind'],'near':['under','inside','above'],'above':['under','beside','behind'],'between':['among','through','under'],'through':['around','behind','toward'],
'going':['go','goes','gone'],'to':['for','of','with'],'more':['most','much','many'],
'heavier':['heavy','heaviest','heavily'],'colder':['cold','coldest','coldly'],'faster':['fast','fastest','fastly'],'easier':['easy','easiest','easily'],'smaller':['small','smallest','smallly'],'taller':['tall','tallest','tallly'],'cheaper':['cheap','cheapest','cheaply'],'harder':['hard','hardest','hardly'],
'tallest':['tall','taller','tallly'],'most':['more','much','many'],'fastest':['fast','faster','fastly'],'hottest':['hot','hotter','hotly'],'funniest':['funny','funnier','funnily'],'easiest':['easy','easier','easily'],'best':['good','better','well'],'youngest':['young','younger','youngly'],'worst':['bad','worse','badly'],
'as':['than','more','to'],'because':['so','but','or'],'so':['because','but','or'],'if':['though','unless','because'],'that':['what','whose','whom'],
'sister':['she','her','hers'],
'tired':['tire','tiringly','tiredly'],'interesting':['interest','interestingly','interests'],'soft':['softly','softness','soften'],'delicious':['deliciously','deliciousness','delicacy'],'sweet':['sweetly','sweetness','sweeten'],'happy':['happily','happiness','happierly'],'great':['greatly','greatness','greats'],'cold':['coldly','coldness','colds'],'wonderful':['wonderfully','wonder','wonders'],'strange':['strangely','strangeness','strangers'],
'for':['since','during','from'],'since':['for','during','from'],'been':['be','being','was'],'which':['who','whose','what'],'too':['very','so','much'],'enough':['too','very','many'],'could':['can','cans','could to']}
# Family distractors for have/do avoid valid tense alternatives by Japanese prompt;
# explicit fixed choices remain inspectable in mode-overrides.json.
out={}
vocabulary={t['text'].lower() for item in qs for t in item['tokens']}
for q in qs:
 n=int(q['topicId'][1:]); k=int(q['id'][-2:])-1; target=rows[n-1].split()[k]
 matches=list(re.finditer(r'(?<![A-Za-z])'+re.escape(target)+r'(?![A-Za-z])',q['english']))
 if not matches:raise Exception((q['id'],target,q['english']))
 m=matches[0]
 if n==48: # Test zero relative pronoun through the object-relative clause's verb inflection.
  pass
 choices=special.get(target.lower(),forms.get(target.lower()))
 if not choices:raise Exception(('Missing paradigm',q['id'],target))
 choices=list(dict.fromkeys(choices))
 # Unambiguous morphology for the short read/put paradigms.
 if target.lower() in ['read','reading']: choices={'read':['reads','readed','readen'],'reading':['read','reads','readed']}[target.lower()]
 if target=='put':choices=['puts','putted','putting']
 if len(choices)<3:raise Exception(('Too few choices',q['id'],target,choices))
 choices=choices[:3]
 if q['id']=='G51Q06':choices=['feels','feeling','to feel']
 if q['id']=='G60Q05':choices=['has','having','was']
 if n in [57,58] and target=='were':choices=['is','are','been']
 if target[0].isupper():choices=[c[0].upper()+c[1:] for c in choices]
 hard=[]
 words={t['text'].lower() for t in q['tokens']}
 for c in choices+['does','being','had','to','were','has']:
  if ' ' not in c and c.lower() in vocabulary and c.lower() not in words and c.lower() not in [h.lower() for h in hard]:hard.append(c)
  if len(hard)==3:break
 out[q['id']]={'easy':{'start':m.start(),'length':len(target),'answer':target,'distractors':choices},'hardDistractors':hard}
json.dump(out,open('data/mode-overrides.json','w'),ensure_ascii=False,indent=2)
print('Wrote',len(out),'explicit mode settings')
