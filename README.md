# Cuddl

Cuddl is an activity-first social dating experience designed around **Meet through what you love** rather than a swipe-first loop.

## Product loop
Activity → Participate → Interact → Explore profile → Chemistry → Spark → Match → Real-world activity/date

## Core areas
- Discover, Daily Spark, Serendipity and compatibility
- Social Lounge with Games, Music and Activities
- Games: Ludo, Chess, Snake, Tic-Tac-Toe, quizzes, Truth & Dare and more
- Music: Karaoke, Open Mic, Duet, Listen Together, performance Cheers
- Activities: cooking, dance, trekking, photography, gardening, travel, city exploration, books, art, fitness and more
- Optional live camera/mic with avatar-only participation
- Spectator mode and participant profile circles
- Activity matching and Find someone who discovery
- Relationship Compass, Chemistry Missions, Memory Match, Connection Passport and Date Studio
- Safety Center, Trusted Circle, verification and privacy controls

## Privacy principle
Camera and microphone are opt-in. Exact live location is not exposed through public room naming; city-level profile context is used for city discovery. Native mobile builds should use platform screenshot/screen-recording protections where supported. A web browser cannot guarantee screenshot prevention.

## Current implementation
The current branch contains the interactive prototype in index.html. Demo state is local/session based; multiplayer, persistent accounts, realtime rooms, media transport, moderation and database persistence require production services.

## Production architecture target
- Next.js App Router frontend
- PostgreSQL for users, profiles, activities, rooms, matches, games and connection history
- Auth provider for email/phone/social login and verification
- Realtime transport for game state, presence, chat and room events
- WebRTC/media service for live audio/video
- Object storage for profile/media assets
- Moderation/reporting pipeline and audit logs
- Notification service for room, match and safety events

## Important product distinction
**Cheer = appreciation. Spark = romantic interest.** A Cheer must never silently create a dating signal.


## Next.js migration
The app now has a Next.js App Router foundation in `app/`, while the original interactive prototype is preserved at `public/prototype.html` for reference. The current UI is intentionally service-free: real authentication, PostgreSQL persistence, realtime presence/game state, WebRTC media, notifications and moderation require provisioned production services and environment variables.

