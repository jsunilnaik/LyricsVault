// ============================================
// SAMPLE DATA MODULE
// Pre-populated data for new users
// ============================================

const SampleData = {
    /**
     * Check if sample data should be loaded
     */
    async shouldLoadSampleData() {
        const songs = await Database.getAll(Database.STORES.SONGS);
        return songs.length === 0;
    },

    /**
     * Load sample data
     */
    async loadSampleData() {
        const shouldLoad = await this.shouldLoadSampleData();
        if (!shouldLoad) return;

        console.log('Loading sample data...');

        // Create sample folders
        for (const folder of this.folders) {
            await Database.put(Database.STORES.FOLDERS, {
                ...folder,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }

        // Create sample playlists
        for (const playlist of this.playlists) {
            await Database.put(Database.STORES.PLAYLISTS, {
                ...playlist,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }

        // Create sample songs
        for (const song of this.songs) {
            await Database.put(Database.STORES.SONGS, {
                ...song,
                id: Utils.generateUUID(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                view_count: 0
            });
        }

        console.log('Sample data loaded successfully');
    },

    // Sample folders
    folders: [
        {
            id: 'folder-favorites',
            name: 'My Favorites',
            color: '#EC4899',
            icon: 'heart',
            parent_id: null
        },
        {
            id: 'folder-learning',
            name: 'Learning',
            color: '#10B981',
            icon: 'book',
            parent_id: null
        },
        {
            id: 'folder-originals',
            name: 'My Originals',
            color: '#6366F1',
            icon: 'star',
            parent_id: null
        }
    ],

    // Sample playlists
    playlists: [
        {
            id: 'playlist-chill',
            name: 'Chill Vibes',
            description: 'Relaxing songs for peaceful moments',
            song_ids: [],
            cover_url: null,
            is_public: false
        },
        {
            id: 'playlist-workout',
            name: 'Workout Mix',
            description: 'High energy songs to keep you moving',
            song_ids: [],
            cover_url: null,
            is_public: false
        }
    ],

    // Sample songs
    songs: [
        {
            title: "Imagine",
            artist: "John Lennon",
            album: "Imagine",
            year: 1971,
            genre: ["Pop", "Rock"],
            mood: ["Peaceful", "Hopeful"],
            language: "English",
            duration: "3:03",
            is_favorite: true,
            folder_id: 'folder-favorites',
            lyrics: `Imagine there's no heaven
It's easy if you try
No hell below us
Above us, only sky

Imagine all the people
Living for today
Ah

[Chorus]
Imagine there's no countries
It isn't hard to do
Nothing to kill or die for
And no religion, too

Imagine all the people
Living life in peace
You

[Bridge]
You may say I'm a dreamer
But I'm not the only one
I hope someday you'll join us
And the world will be as one

[Verse 3]
Imagine no possessions
I wonder if you can
No need for greed or hunger
A brotherhood of man

Imagine all the people
Sharing all the world
You

[Chorus]
You may say I'm a dreamer
But I'm not the only one
I hope someday you'll join us
And the world will live as one`,
            notes: "One of the most iconic songs about peace and unity.",
            chords: "C - Cmaj7 - F - C - Cmaj7 - F"
        },
        {
            title: "Bohemian Rhapsody",
            artist: "Queen",
            album: "A Night at the Opera",
            year: 1975,
            genre: ["Rock", "Progressive Rock"],
            mood: ["Epic", "Dramatic"],
            language: "English",
            duration: "5:55",
            is_favorite: true,
            folder_id: 'folder-favorites',
            lyrics: `[Intro]
Is this the real life?
Is this just fantasy?
Caught in a landslide
No escape from reality

Open your eyes
Look up to the skies and see
I'm just a poor boy, I need no sympathy
Because I'm easy come, easy go
Little high, little low
Any way the wind blows
Doesn't really matter to me, to me

[Verse 1]
Mama, just killed a man
Put a gun against his head
Pulled my trigger, now he's dead
Mama, life had just begun
But now I've gone and thrown it all away

Mama, ooh
Didn't mean to make you cry
If I'm not back again this time tomorrow
Carry on, carry on as if nothing really matters

[Verse 2]
Too late, my time has come
Sends shivers down my spine
Body's aching all the time
Goodbye, everybody, I've got to go
Gotta leave you all behind and face the truth

Mama, ooh (Any way the wind blows)
I don't wanna die
I sometimes wish I'd never been born at all

[Guitar Solo]

[Opera Section]
I see a little silhouetto of a man
Scaramouche, Scaramouche, will you do the Fandango?
Thunderbolt and lightning, very, very frightening me
(Galileo) Galileo, (Galileo) Galileo, Galileo Figaro magnifico

I'm just a poor boy, nobody loves me
He's just a poor boy from a poor family
Spare him his life from this monstrosity

Easy come, easy go, will you let me go?
Bismillah! No, we will not let you go
(Let him go!) Bismillah! We will not let you go
(Let him go!) Bismillah! We will not let you go
(Let me go) Will not let you go
(Let me go) Will not let you go
(Never, never, never, never let me go)
No, no, no, no, no, no, no
(Oh, mamma mia, mamma mia) Mamma mia, let me go
Beelzebub has a devil put aside for me, for me, for me!

[Rock Section]
So you think you can stone me and spit in my eye?
So you think you can love me and leave me to die?
Oh, baby, can't do this to me, baby!
Just gotta get out, just gotta get right outta here!

[Outro]
Nothing really matters
Anyone can see
Nothing really matters
Nothing really matters to me

Any way the wind blows...`,
            notes: "A masterpiece of rock music combining multiple genres and styles.",
            chords: "Bb6 - C7 - Bb6 - C7 - F7 - Bb - Gm"
        },
        {
            title: "What a Wonderful World",
            artist: "Louis Armstrong",
            album: "What a Wonderful World",
            year: 1967,
            genre: ["Jazz", "Pop"],
            mood: ["Happy", "Peaceful"],
            language: "English",
            duration: "2:21",
            is_favorite: false,
            folder_id: null,
            lyrics: `[Verse 1]
I see trees of green
Red roses too
I see them bloom
For me and you
And I think to myself
What a wonderful world

[Verse 2]
I see skies of blue
And clouds of white
The bright blessed day
The dark sacred night
And I think to myself
What a wonderful world

[Bridge]
The colors of the rainbow
So pretty in the sky
Are also on the faces
Of people going by
I see friends shaking hands
Saying, "How do you do?"
They're really saying
"I love you"

[Verse 3]
I hear babies cry
I watch them grow
They'll learn much more
Than I'll ever know
And I think to myself
What a wonderful world

[Outro]
Yes, I think to myself
What a wonderful world
Oh yeah`,
            notes: "A timeless classic celebrating the beauty of life.",
            chords: "F - Am - Bb - Am - Gm - F - A7 - Dm"
        },
        {
            title: "Hotel California",
            artist: "Eagles",
            album: "Hotel California",
            year: 1977,
            genre: ["Rock", "Soft Rock"],
            mood: ["Dark", "Mysterious"],
            language: "English",
            duration: "6:30",
            is_favorite: true,
            folder_id: 'folder-favorites',
            lyrics: `[Verse 1]
On a dark desert highway
Cool wind in my hair
Warm smell of colitas
Rising up through the air
Up ahead in the distance
I saw a shimmering light
My head grew heavy and my sight grew dim
I had to stop for the night

[Verse 2]
There she stood in the doorway
I heard the mission bell
And I was thinkin' to myself
This could be heaven or this could be hell
Then she lit up a candle
And she showed me the way
There were voices down the corridor
I thought I heard them say

[Chorus]
Welcome to the Hotel California
Such a lovely place (such a lovely place)
Such a lovely face
Plenty of room at the Hotel California
Any time of year (any time of year)
You can find it here

[Verse 3]
Her mind is Tiffany-twisted
She got the Mercedes bends
She got a lot of pretty, pretty boys
That she calls friends
How they dance in the courtyard
Sweet summer sweat
Some dance to remember
Some dance to forget

[Verse 4]
So I called up the Captain
"Please bring me my wine"
He said, "We haven't had that spirit here
Since nineteen sixty-nine"
And still those voices are calling from far away
Wake you up in the middle of the night
Just to hear them say

[Chorus]
Welcome to the Hotel California
Such a lovely place (such a lovely place)
Such a lovely face
They're livin' it up at the Hotel California
What a nice surprise (what a nice surprise)
Bring your alibis

[Verse 5]
Mirrors on the ceiling
The pink champagne on ice
And she said, "We are all just prisoners here
Of our own device"
And in the master's chambers
They gathered for the feast
They stab it with their steely knives
But they just can't kill the beast

[Verse 6]
Last thing I remember
I was running for the door
I had to find the passage back
To the place I was before
"Relax," said the night man
"We are programmed to receive
You can check out any time you like
But you can never leave!"

[Guitar Solo Outro]`,
            notes: "One of the greatest rock songs ever written, with an iconic guitar solo.",
            chords: "Bm - F#7 - A - E7 - G - D - Em - F#7"
        },
        {
            title: "Hallelujah",
            artist: "Leonard Cohen",
            album: "Various Positions",
            year: 1984,
            genre: ["Folk", "Rock"],
            mood: ["Sad", "Spiritual"],
            language: "English",
            duration: "4:38",
            is_favorite: false,
            folder_id: 'folder-learning',
            lyrics: `[Verse 1]
Now I've heard there was a secret chord
That David played, and it pleased the Lord
But you don't really care for music, do ya?
It goes like this, the fourth, the fifth
The minor fall, the major lift
The baffled king composing Hallelujah

[Chorus]
Hallelujah, Hallelujah
Hallelujah, Hallelujah

[Verse 2]
Your faith was strong but you needed proof
You saw her bathing on the roof
Her beauty and the moonlight overthrew ya
She tied you to a kitchen chair
She broke your throne, and she cut your hair
And from your lips she drew the Hallelujah

[Chorus]
Hallelujah, Hallelujah
Hallelujah, Hallelujah

[Verse 3]
Maybe I have been here before
I know this room, I've walked this floor
I used to live alone before I knew ya
I've seen your flag on the marble arch
Love is not a victory march
It's a cold and it's a broken Hallelujah

[Chorus]
Hallelujah, Hallelujah
Hallelujah, Hallelujah

[Verse 4]
There was a time you let me know
What's really going on below
But now you never show it to me, do ya?
And remember when I moved in you
The holy dark was moving too
And every breath we drew was Hallelujah

[Chorus]
Hallelujah, Hallelujah
Hallelujah, Hallelujah

[Verse 5]
Maybe there's a God above
And all I ever learned from love
Was how to shoot at someone who outdrew ya
And it's not a cry you can hear at night
It's not somebody who's seen the light
It's a cold and it's a broken Hallelujah

[Chorus]
Hallelujah, Hallelujah
Hallelujah, Hallelujah
Hallelujah, Hallelujah`,
            notes: "A deeply spiritual and emotional song, covered by many artists.",
            chords: "C - Am - F - G - C - G"
        }
    ]
};