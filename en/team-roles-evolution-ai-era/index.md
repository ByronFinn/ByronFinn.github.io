# Rethinking Team Division of Labor


> **The conclusion first, so you don't waste your read**
>
> We used to split teams by craft: frontend, backend, product design.
> Now we split teams by stage:
> **Prototyper** — grabs the first idea and fails fast
> **Builder** — turns the prototype into a product you can take to market
> **Maintainer** — holds the fort once the software reaches scale
> **Scaler** — takes a proven product and scales it 10x, 100x
> **Finisher** — polishes the product and the code, sands off the burrs
> As for why we're only splitting this way now — the answer involves AI. Read on.

<!-- more -->

## Two Ways to Divide the Work

We used to split teams into frontend, backend, and product design. That split carries a hidden premise: software is a house — some people lay bricks, some install windows, some draw the blueprints — each tends their own patch, the house gets built, and the job is done.

Comparing software to a house is a programmer's self-consolation. A finished house can be lived in; finished software is only the beginning. If you've ever owned a dog, you know: buying the dog isn't the achievement. The hard part is walking it every day after that, feeding it, cleaning up its mess, and resisting the urge to stew it when it chews up the couch. Software is that dog, and the day you bring it home is the calmest day of its life.

So the old question "which part are you responsible for" is obsolete. The more honest question is: which stage of its life are you responsible for?

Frontend, backend, product design — that's dividing by "what you touch". It's the anatomy approach: this is cardiology, this is orthopedics, this is dentistry. The five roles divide by "when you touch it". That's the animal husbandry approach: breeding, delivering, fattening, slaughtering. Anatomy describes corpses; animal husbandry describes life. I'm not saying frontend, backend, and product design don't matter. I'm saying they are disciplines for the dead, and software is alive.

Why is it only now that the old split has started to look obsolete? Because writing code has become cheap.

Writing code used to be a craft, like carpentry, blacksmithing, or castrating pigs — ten years to hone one sword. Your master trained you three years before letting you touch production. Now large language models are here, writing code is as easy as writing a leave request, and one intern with AI can do the work of what used to be a whole team. The barrier to the craft collapsed, and the territories carved up along the craft collapsed with it. This is nobody's fault; the times flipped the table.

What's scarce has shifted from "writing" to "judgment": which direction to try, what to promise, what must not be touched, where things will collapse, where things aren't good enough yet. These five judgments are precisely those five roles.

What teams actually differentiate into is five roles.

## The Life of a Piece of Software

A team's differentiation isn't planned. When the first idea sprouts, there's always one person who starts building immediately — everyone else is still in a meeting discussing feasibility, and the page is already up on their screen. Once they tire of it, someone else tidies it into something presentable that other people can use. Later it starts running, and someone starts keeping watch at night. More and more people use it, and someone starts rethinking the architecture. And at the very end, there's always one person looking where nobody else looks — the misplaced pixel, the error-message wording that reads like an insult, the button that does nothing when clicked.

For a thing to stay alive, all five pairs of hands must reach out. But five pairs of hands are not five departments; they are five stages of the same thing. Most teams only understand this after plenty of shouting matches and a few slammed doors. Some teams never get it — that's fine too; they just bring in a new batch of people and start the shouting over.

## The Prototyper: The One Who Starts First

The prototyper grabs the first idea and fails fast. Their output isn't code; it's answers: is this direction right, is it worth going further? Put more academically: they are buying, at minimum cost, the intelligence that "this road leads nowhere".

The prototyper's most important skill is being willing to throw things away. The best prototype is the one that gets thrown away, just as the best experiment is the failed one — it completed its mission, and its mission was to be falsified and tossed onto history's junk heap. If a prototyper discovers their code has survived a month, they feel it isn't theirs anymore — someone else picked it up and raised it. Their files are usually named `data_final_true_final_v3`, because they never intended it to live long in the first place. Putting makeup on a corpse is unethical behavior, and the prototyper knows this well — which is why they can't even be bothered to give files decent names.

The prototyper hates everything that slows things down: documentation, standards, naming reviews, writing unit tests. Others think they're sloppy. They're not sloppy — they're honest. Just as a surgeon doesn't embroider a temporary incision on the operating table, they don't write comments for code that is destined to die.

What the prototyper fears most isn't failure; it's other people treating their prototype as a product. A thing that should have been thrown away, now earnestly maintained, earnestly promised to users — that is the real disaster. A wrong direction can be swapped out; being held hostage by a wrong direction cannot. This happens every day, and the mechanism is simple: throwing things away takes courage, and courage is exactly what teams lack the most. They would rather drown together clutching a wrong direction than admit they boarded the wrong ship.

## The Builder: Turning It Into a Promise

The builder turns the prototype into something that can go to market. The difference between a prototype and a product, stripped to its core, is one word: promise.

A prototype is a pile of coincidences that happen to run. A product is a promise — to users, a promise about what it can do; to the team, a promise that it ships today; to the next person who takes it over, a promise that it can be understood. Translated into plain speech, "it runs on my machine" means "nobody but me can use it". The builder's job is to turn that nonsense into a true statement.

Everything the builder does is unglamorous: error handling, empty states, what happens offline, what happens when loading fails, what happens when users click wildly. Do you know what the page should show when the connection drops? Nobody remembers who decided that, but users all over the world have seen it. The builder is the person who, in places nobody notices, makes decisions on behalf of all humanity — and when they decide well, nobody thanks them.

Builders and prototypers are naturally at odds. The prototyper thinks the builder made a good thing ugly; the builder thinks the prototyper's blueprint forgot to draw the foundation. Neither is wrong — they just stand at two different stages of the same building, one raising the roof beam, one pouring the foundation, and in exactly reversed order, so each privately concludes the other is out of their mind.

## The Maintainer: Making Sure Nothing Happens

Once the software is running, the real costs begin. There's a saying in the industry: the overwhelming majority of code is maintenance code; new features are just a small slice of it. Translate that: most people spend their entire careers cleaning up after their predecessors. Harsh words, but the data backs them.

The maintainer's success criterion is: nothing happened today. The system is fine, users notice nothing — and users noticing nothing is precisely their work. Think of the night watchman: the watchman's greatest success is a quiet night, but nobody gives them a commendation for it, because nothing happened. Yet if something does happen that night, all the blame lands on them. Call it a negative-expected-value game — mathematically, night watchman is the worst-value job in the world. The 2 a.m. alert is their alarm clock; the messes others leave behind are their daily routine; those comments in the code nobody can explain, the decisions made by three people who have already left — the maintainer is the one who remembers them. Others resign, and their memories live on in the maintainer's head, without overtime pay.

The maintainer is conservative — not because they are fussy, but because what they face every day is risk. Every line they change could be the straw that crushes the system, so they have learned to say "no". This makes them unpopular. Everyone who wants to change something sees them as an obstacle; only when the system goes down does everyone remember them — and then holds the post-mortem in their name.

The maintainer's reward is invisible: the system did not die on their watch. Nobody writes this into a thank-you note, but it happens every day, like air. The living don't thank the air, but take away the air and in five minutes there's no person left. The maintainer is the air of the software industry.

## The Scaler: Changing the Order of Magnitude

Take a proven product and scale it tenfold, a hundredfold. Some say it's a matter of effort. Let me tell you: it's a matter of species. Scale a chicken up tenfold and it's still a chicken — a big rooster at best. But when a system supporting a hundred people scales to a hundred thousand, it is no longer the same system; it has become another creature, like a tadpole becoming a frog — and it has to swallow its own tail to become something that can croak.

The scaler doesn't look at features; they look at bottlenecks: the SQL that was perfectly fine at 100 rows, the old server nobody ever replaced, the architecture that never imagined a second instance. They are willing to tear apart something that is currently working — because working now doesn't mean working later. Flip that sentence around: they take the system apart before it dies, to keep it from dying. From the outside, this is indistinguishable from sabotage, which is why the scaler is usually the most hated person on the team.

The conflict between the scaler and the maintainer is structural and cannot be harmonized: one guards, one dismantles. The guardian spends years stabilizing the system; the dismantler spends months reassembling it; once reassembled, the guardian has to nurse it stable all over again. Ask me which of the two is right, and I'll say both — but you must pick one, and be ready to own the consequences. The price of never dismantling: the product succeeds, and is then crushed to death by its own success. This is not remotely rare. History books call it "the peak before the fall"; product people call it "we never expected this many users".

## The Finisher: Sanding Off the Burrs

The finisher polishes the product and the code, sanding off the burrs. They look where nobody else can: the typo in the footer, the flicker during loading, the button that doesn't respond, the cold "Are you sure?" on exit. Everyone here builds products, so you know exactly what I'm talking about. Say these things out loud and everyone calls them trivial — but they flash before users' eyes every single day, like a grain of rice stuck on the bridge of your nose: you can't see it, the whole world can.

The finisher often gets dismissed as nitpicky — "it's just a detail". But details are precisely the product as the user touches it. Users can't tell "feature-complete" from "product-complete"; the only thing they can feel is whether the thing is smooth or awkward to use. That awkwardness is the pit the finisher fills — and while they fill it, the whole world doesn't even know a pit existed.

The finisher is the last person to touch the work, and they inherit everyone's shortcuts. Every shortcut someone took to hit a deadline, the finisher wipes up in the end. When they say "it's still a little off", that's not politeness — it really is a little off, and only they can see it. Call them obsessive-compulsive if you like, but understand: a product's final dignity is held up by exactly this kind of person.

## AI Won't Replace These Five Pairs of Hands

At this point someone will ask: if AI writes all the code, do these five roles survive?

They do — clearer than ever, in fact — because these five roles were never about writing code. They're about judgment. AI takes over the hands; what stays on the human side is all judgment:

- **Prototyper**: AI makes trial and error a hundred times cheaper, but "which one to try" is still a human call. Bad ideas can now die faster — and so can good ones. Fair enough.
- **Builder**: implementation can be handed to AI, but "what do we promise, what's the bar" must be set by humans. AI won't take responsibility to your users for you, and when things blow up, it won't take the blame for you either.
- **Maintainer**: AI can write tests and fix bugs, but "what must not be touched" must be decided by humans. The most expensive knowledge in a system isn't how to write — it's what must never be poked. AI can't learn that knowledge, because it was paid for in the blood of everyone who left.
- **Scaler**: the bottleneck is no longer writing efficient code; it's reading the system. AI can read syntax but not a company's architectural history — it can read the history books, but not why your company has seventeen versions of the user table.
- **Finisher**: AI output is average. Average is now the floor; taste is the ceiling. Everyone can use AI to make something "close enough". The gap that remains — that's the finisher.

So what AI amplifies isn't the roles; it's throughput. The judgments stay the same judgments — it's just that the bigger the throughput, the faster a wrong judgment kills you. Plenty of teams use AI to great fanfare while their products go nowhere. This is usually why: code output doubled, and the five judgments didn't keep up. It's like handing you a sports car but keeping the old steering wheel — no wait, the steering wheel is gone too, and the old one was crank-operated anyway.

## Relay Races Die at the Handoff

These five people are not five positions on a team; they are five states of the same thing. One person can wear different gloves at different times, and a five-person team might well be five prototypers — in which case they'll fight over the fifth prototype, because everyone wants to try their own direction and everyone thinks the others' directions are wrong.

Relay races are lost at the handoff more than anywhere else. Four people each run a hundred meters, and the result hinges on that one moment of passing the baton. I've seen the fastest team lose to the slowest one next door because the baton hit the ground. Software, likewise, mostly doesn't die of competition; it dies of changing hands:

- The prototyper can't let go. The idea is their baby; someone else taking over feels like kidnapping their child. They come back to tinker again and again, and the product stays a prototype forever. It's the same as parents who spoil a child — the kid is thirty and still being raised as an infant.
- The builder can't hand it off. Their architecture never imagined a hundred thousand users, and by the time scaling comes due, it means ripping out the foundation and rebuilding. They built a bungalow back then; now it needs to be a tower; and they insist the bungalow is just fine.
- The maintainer can't receive it. Before the system breaks, everyone thinks the maintainer is optional; after it breaks, everyone blames them. Damned either way, so they've wised up and learned to dodge blame — you can't fault them for it; the system trained them that way.
- The saddest kind: nobody takes the baton at all. The prototype is finished and abandoned; the demo lives forever in a screen recording. That is software dying in the cradle — drowning, no less: not because nobody would save it, but because all the lifeguards are in a meeting, discussing who to send.

## Who's Missing Determines Where It Dies

Missing any one role, the thing dies — just differently:

- **Without a prototyper**: the team lovingly polishes something nobody has validated. It reminds me of a joke: a group spends ten years building a beautiful building — on quicksand. When it collapses, nobody regrets the location; they regret that the building wasn't beautiful enough. A team without a prototyper builds on quicksand — and builds it with great care.
- **Without a builder**: forever demoing. Everything is a proof of concept; nothing is a product. It's like someone who goes on dates forever and never marries — sparks every time, nothing ever comes of it, and eventually they're out of the game and can't even be bothered to meet anyone.
- **Without a maintainer**: death at 2 a.m. All systems love to die at 2 a.m., as if they bore some grudge against the small hours in life. One person leaves, and the secrets of the code leave with them; nobody understands that pile of gnarly old stuff. Only then does everyone realize the maintainer wasn't optional — they were the system's sole executor of the will. And the will was never written.
- **Without a scaler**: the product gets loved, and dies of being loved. The most ironic death of all: a restaurant so popular the dining room collapses the kitchen. On his deathbed the owner is still wondering: what did we do wrong? You did one thing wrong — you never imagined this many people would come.
- **Without a finisher**: nothing is broken, but nothing is right. Users can't say exactly what's wrong; it just feels awkward. This is the most insidious deficiency of all, because the autopsy can't find a cause of death, so everyone just suspects the product manager's suggestions.

## The Rewards Run Backwards

These five roles' reputations inside a company are exactly inverse to their importance. The prototyper and the scaler get the glory — one stands for innovation, the other for growth, both slide-deck material. The builder does all right. The maintainer and the finisher have the least presence — their excellence is "the absence of bad things", and absence makes no news. No news, nothing to report; nothing to report, no performance review; no performance review, no year-end bonus. A complete causal chain, every link snug — a pity the place the chain leads is not where they belong.

Organizational incentives push people toward the two visible ends, in perfect accordance with economics' rational-agent assumption: people only do what pays, and pay only goes to visible merit. Hence the spectacle: a system in dire need of maintainers finds no one willing to stand guard, because guarding well is invisible anyway; a product in dire need of a finisher has the finishing person reassigned to new features, because new features can go into a report.

Most software doesn't die of competition; it dies of nobody being willing to do the invisible work. That sentence bears repeating — repetition changes nothing, but at least it can make whoever reads it skip a beat. After the skipped beat, the invisible stays invisible.

## Ask Yourself Two Questions

So don't ask "which role matters most". Missing any one of the five, the thing dies at some stage — just of different causes. People who ask that question are like people asking "which matters more, the lungs or the heart" — the answer is both matter, but if you force me to pick one, I pick running.

The questions to ask are two different ones.

**First: whose hands is this thing in right now?** Half of a team's arguments are arguments about "which stage's work should we be doing now" — the prototyper wants to validate once more, the builder wants to ship, the maintainer wants everything to stop changing. All three are right; they just don't realize they're talking about different stages. It's three people arguing over whether to fry the chicken, stew the chicken, or keep it for eggs — except there's only one chicken, all three are hungry, and the chicken is still alive.

**Second: which pair of hands am I?** The answer hides in which work makes you lose track of time. Note: not which work you're good at — goodness groomed by praise doesn't count; the boss praises you to make you work more. The answer is what you keep doing over and over even when nobody's watching. The prototyper works through new ideas in the shower; the maintainer can't help fixing that one thing that has always been off; the finisher nudges those two pixels one more time before shutting the laptop. Nobody can tell the difference those two pixels make — but once they're nudged, they sleep soundly.

A person forced to spend years in a role that doesn't match their hands develops an illness with no name: nothing is wrong, exactly — things just don't flow. It's not fragility; it's hands and work out of alignment. Like setting a butcher to embroider: he can do it, it's just that every flower he embroiders carries a faint menace, and he knows it himself — that's not a flower, that's a knife-skills demonstration.

## Finally

Let me close with something untimely. These five pairs of hands are also a software practitioner's own career. Young, you're mostly a prototyper — you want to try everything, the world seems vast; delivery grinds you into a builder, and you learn to write comments and handle edge cases; after that, you either guard one thing until retirement or move to a bigger stage and become a scaler; and the finisher's taste only appreciates with age — the older you get, the less you can stand a burr. I've met plenty of people in their forties who were firebrands in their youth, and whose greatest joy now is fixing a bug nobody else cares about, or moving a button two pixels to the left late at night. Ask them if it's worth it, and they say yes. Don't laugh at them. To be able to sand off a single burr, willingly, where nobody sees — that is a great fortune.

Stay in this trade long enough and you understand: life is a slow process of being hammered. If, after the hammering, you still recognize who you are, still know what your hands are for, still want to do the work in your hands well — then this life's hammering wasn't wasted. But if after the hammering you've even forgotten what you love doing — that's the real loss.

The best team is one where all five pairs of hands know who they are, and know whose turn it is now. More important still: all of them are willing to let go of the baton at the handoff. Letting go is much harder than receiving. We spend our whole lives learning how to grip tight; almost nobody teaches us how to open our hand. But think about it — with the baton clenched in your fist and refused to the next runner, the team doesn't get far.

