//Madame Chappell's fortunes. All original lines (no song lyrics), written to fit on the lace card.
//Add, cut or rewrite freely: one string per fortune, roughly 130 characters max.

const FORTUNES = [
  // ---- love, crushes and situationships ----
  "The orb sees a situationship in your future. The orb also sees you calling it \"a vibe\" for eight months.",
  "Someone is thinking about you right now. Unfortunately it is your ex, and they are thinking \"lol.\"",
  "You will fall for a straight girl again. The spirits have stopped asking why.",
  "A woman with a carabiner and an undercut will change your life. Or at least your Spotify.",
  "Your next date will say \"I don't really listen to music.\" Run, babe. The orb is begging you.",
  "The one who left you on read will watch your story within the hour. Post the good angle.",
  "Love is coming. It is wearing a cowboy hat and it is twenty minutes late.",
  "You will text \"we should hang out sometime\" and the spirits will scream into a pillow for you.",
  "The orb sees a U-Haul. The orb sees it on the second date. The orb is not judging.",
  "You are not \"too much.\" They were simply not enough. The orb has spoken, put your lashes back on.",
  "Your crush has a playlist with your name on it. It is called \"don't.\" Proceed anyway, the orb loves drama.",
  "A stranger at the merch line will become your soulmate, your roommate, or your reason for a group chat.",
  "You will kiss someone under a disco ball and immediately tell the group chat. As is tradition.",
  "Stop checking their horoscope. The orb checked. They're a mess.",
  "Your soulmate also cried in a car in a Midwest parking lot. You will find each other.",
  "Somebody's girlfriend is going to look at you a little too long tonight. The orb says: stay iconic, stay out of it.",

  // ---- glitter, outfits, drag ----
  "Your outfit is not too much. Add more. The orb demands at least one more rhinestone.",
  "Next week you will be asked \"what's the occasion?\" The answer is: you are the occasion.",
  "The spirits see a themed outfit in your future. They also see you finishing it with a glue gun at 4 a.m.",
  "A drag queen will compliment your eyeliner and you will think about it for the rest of your natural life.",
  "Glitter you wore three years ago is still on you somewhere. It is your lucky charm. Do not wash it off.",
  "You will find the perfect pink cowboy hat. It will be forty dollars. You will buy two.",
  "The orb sees body paint, a wig and no plan. The orb sees a great night.",
  "Someone will ask if you're dressed as a clown. You will say \"yes, and?\" and win the whole day.",
  "Your eyeshadow will be so loud this week that a man will turn down his car stereo.",
  "Wear the outfit. The orb has already seen the photos and you look like a Renaissance painting with Wi-Fi.",
  "You will spend more on a costume than on rent. The spirits approve. Rent is temporary, looks are forever.",

  // ---- hometown, family, the Midwest ----
  "Your mom will ask if you're \"still doing the music thing\" over dinner. Smile. The orb is on your side.",
  "You will go back to your hometown and the Applebee's will feel smaller. That's called growth.",
  "Somebody from high school will like a photo from 2019. The orb says: let them stew.",
  "Your aunt will call your outfit \"brave.\" Take it as the highest compliment.",
  "The cornfields are proud of you. The orb checked in with them personally.",
  "Grandma knows. Grandma has always known. Grandma thinks your girlfriend is very polite.",
  "A small town gave you big feelings. The orb says: take them to a big city and make them louder.",
  "You will leave the group chat from high school this year. The orb will light a candle in its memory.",
  "The church van that drove past you in 2014 is about to see you on a billboard. Patience.",

  // ---- concerts, dancing, fandom ----
  "You will learn a whole dance in the bathroom line and perform it perfectly for zero people.",
  "Your concert outfit will make a security guard say \"okay!\" out loud. Destiny.",
  "The orb sees you spelling something with your arms in a crowd of thousands. It is the most normal you will ever feel.",
  "You will lose your voice screaming this weekend. It will come back gayer.",
  "A friendship bracelet trade will lead to a friendship. The friendship will lead to a group trip. Pack sequins.",
  "You will hear your favorite song at the grocery store and do a little shimmy in frozen foods. Someone will join in.",
  "Your neighbors heard you singing in the shower. They have chosen to become fans.",
  "The orb sees you camping out for barricade with a folding chair and absolutely no regrets.",
  "Next time you're in a crowd, look left. That person will become your favorite stranger of the year.",
  "You will dance in a pink-lit room with your whole chest. Bring water, the spirits worry.",

  // ---- self-worth and big dreams ----
  "The thing you're scared to start is the thing you'll be famous for. Locally. Fabulously.",
  "You will quit something boring this year and the spirits will throw you a small, glittery party.",
  "Stop apologizing for being dramatic. Drama is a renewable energy source.",
  "That job does not deserve you. The orb has seen your eyeliner and you are wasted on spreadsheets.",
  "You are the main character. Unfortunately you are also the comic relief. Lean into it.",
  "You will say \"no\" to something this week and feel so powerful you have to sit down.",
  "Your big break is coming. The orb cannot say when. The orb is a ball, not a calendar.",
  "Be delusional about your dreams. The orb has watched delusion become a career many times.",
  "Somebody once said you'd never make it. They are now asking you for tickets.",
  "Your inner child is screaming for a wig. Give her the wig.",
  "The orb sees a bold new haircut in your future. The orb also sees you crying about it for one day. Then thriving.",
  "This is the year you finally say what you want out loud. The spirits have the confetti ready.",

  // ---- the truly mystical ----
  "Mercury is in retrograde, but honestly so are you. Give yourself a break, babe.",
  "The spirits are telling me... hold on... they are telling me to drink some water. And text your best friend.",
  "Your rising sign is \"chaotic\" and your moon is in \"group chat.\" The orb sees no way to fix this.",
  "The orb sees a mysterious figure in your future. It is a cat. It will choose you.",
  "Three of Wands, Queen of Cups, and a crumpled receipt. The orb says: you're going on a trip. Bring snacks.",
  "A great change is coming. The orb is ninety percent sure it's your hair color.",
  "You will find a dollar on the ground. Do not spend it. It is a sign. It is also a dollar.",
  "The ancestors are watching. They have opinions about your browser tabs.",
  "The orb sees fog. The orb is cleaning itself. Ask again after it finishes its skincare routine.",
  "The spirits have reviewed your energy and rated it five stars. One spirit said \"a bit loud.\" We've blocked that spirit.",
  "A pigeon will make eye contact with you this week. Respect it. It knows things.",
  "Your lucky number is 7. Your lucky color is hot pink. Your unlucky thing is replying \"lol\" to a long message.",
  "The universe is sending you a message. It's in your spam folder. Check it.",
  "Something you lost will come back to you this month. It's a hair clip. It was in your other bag.",
  "The orb sees a road trip, a gas station snack haul and one dramatic karaoke moment. Prepare your ballad.",

  // ---- one-liners ----
  "Yes. Next question.",
  "The orb says: girl, obviously.",
  "Absolutely not. And the orb is never wrong. Except once. In 1997.",
  "The answer is in your heart. The other answer is in your drafts. Send neither.",
  "The orb is buffering. It says: be gayer and try again.",
  "Hydrate, moisturize, and stop texting them. The orb has spoken.",
  "Your future is bright. Like, unflattering-lighting bright. Wear sunglasses.",
  "The orb sees nothing but sequins. That is either a vision or a reflection of me.",
];

//The rare golden ones: about 1 in 25 readings
const RARE_FORTUNES = [
  "The orb has gone gold. That means you are legally required to be the gayest person in every room for one full week.",
  "Golden prophecy: everything you manifested in the shower this year is on its way. Including the one you said as a joke.",
  "The spirits have crowned you Prom Queen of the Astral Plane. Your sash and tiara are in the mail.",
  "Golden orb! The next person to compliment you will be someone you admire deeply. Act casual. You will not act casual.",
];

const WELCOME = "Cross my palm with glitter, babe. The spirits are fashionably late, but they're here.";
