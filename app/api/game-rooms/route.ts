import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

async function ensureRooms() {
  const db=getDb();
  await db.execute(sql`CREATE TABLE IF NOT EXISTS game_rooms (
    id text PRIMARY KEY,
    game_key text NOT NULL,
    host_user_id text NOT NULL,
    guest_user_id text,
    spectator_user_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
    state jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'OPEN',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS spectator_user_ids text[] NOT NULL DEFAULT ARRAY[]::text[]`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS game_rooms_game_status_idx ON game_rooms(game_key,status,created_at DESC)`);
}

export async function POST(request:Request){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  try{
    await ensureRooms();
    const body=await request.json();
    const action=String(body.action||"").toLowerCase();
    const gameKey=String(body.gameKey||"").trim().slice(0,80);
    const roomId=String(body.roomId||"").trim().slice(0,100);
    const db=getDb();

    if(action==="create"){
      if(!gameKey)return NextResponse.json({error:"Game is required."},{status:400});
      const id=crypto.randomUUID();
      await db.execute(sql`INSERT INTO game_rooms(id,game_key,host_user_id,state) VALUES(${id},${gameKey},${current.user.id},'{}'::jsonb)`);
      return NextResponse.json({room:{id,gameKey,status:"OPEN",role:"HOST",state:{}}});
    }

    if(action==="join"){
      if(!roomId)return NextResponse.json({error:"Room is required."},{status:400});
      const spectator=body.role==="SPECTATOR";
      const rows=await db.execute(sql`SELECT id,game_key,host_user_id,guest_user_id,spectator_user_ids,state,status FROM game_rooms WHERE id=${roomId} LIMIT 1`);
      const room=(rows as any).rows?.[0];
      if(!room)return NextResponse.json({error:"Room not found."},{status:404});
      if(room.host_user_id===current.user.id)return NextResponse.json({room:{...room,role:"HOST"}});
      const spectators=Array.isArray(room.spectator_user_ids)?room.spectator_user_ids:[];
      if(spectator){
        if(!spectators.includes(current.user.id)) await db.execute(sql`UPDATE game_rooms SET spectator_user_ids=array_append(spectator_user_ids,${current.user.id}),updated_at=now() WHERE id=${roomId}`);
        return NextResponse.json({room:{id:room.id,gameKey:room.game_key,status:room.status,role:"SPECTATOR",state:room.state||{}}});
      }
      if(room.guest_user_id && room.guest_user_id!==current.user.id)return NextResponse.json({error:"Room is full."},{status:409});
      const joined=await db.execute(sql`UPDATE game_rooms SET guest_user_id=${current.user.id},status='ACTIVE',updated_at=now() WHERE id=${roomId} AND guest_user_id IS NULL AND status='OPEN'`);
      const joinedCount=Number((joined as any).rowCount||0);
      if(!joinedCount){
        const latest=await db.execute(sql`SELECT guest_user_id,status,state,game_key FROM game_rooms WHERE id=${roomId} LIMIT 1`);
        const currentRoom=(latest as any).rows?.[0];
        if(currentRoom?.guest_user_id===current.user.id)return NextResponse.json({room:{id:roomId,gameKey:currentRoom.game_key,status:currentRoom.status,role:"GUEST",state:currentRoom.state||{}}});
        return NextResponse.json({error:"Room is no longer available."},{status:409});
      }
      return NextResponse.json({room:{id:room.id,gameKey:room.game_key,status:"ACTIVE",role:"GUEST",state:room.state||{}}});
    }

    if(action==="state"){
      if(!roomId)return NextResponse.json({error:"Room is required."},{status:400});
      const rows=await db.execute(sql`SELECT id,game_key,host_user_id,guest_user_id,spectator_user_ids,state,status,updated_at FROM game_rooms WHERE id=${roomId} AND (host_user_id=${current.user.id} OR guest_user_id=${current.user.id} OR ${current.user.id}=ANY(spectator_user_ids)) LIMIT 1`);
      const room=(rows as any).rows?.[0];
      if(!room)return NextResponse.json({error:"Room not found."},{status:404});
      return NextResponse.json({room});
    }

    if(action==="update"){
      if(!roomId)return NextResponse.json({error:"Room is required."},{status:400});
      const rows=await db.execute(sql`SELECT id FROM game_rooms WHERE id=${roomId} AND (host_user_id=${current.user.id} OR guest_user_id=${current.user.id}) LIMIT 1`);
      if(!((rows as any).rows?.length))return NextResponse.json({error:"Room not found."},{status:404});
      const nextState=body.state && typeof body.state==="object" ? body.state : {};
      await db.execute(sql`UPDATE game_rooms SET state=${JSON.stringify(nextState)}::jsonb,updated_at=now(),status=CASE WHEN guest_user_id IS NULL THEN status ELSE 'ACTIVE' END WHERE id=${roomId}`);
      return NextResponse.json({ok:true});
    }

    if(action==="leave"){
      if(!roomId)return NextResponse.json({error:"Room is required."},{status:400});
      await db.execute(sql`UPDATE game_rooms SET status='CLOSED',updated_at=now() WHERE id=${roomId} AND (host_user_id=${current.user.id} OR guest_user_id=${current.user.id})`);
      return NextResponse.json({ok:true});
    }

    return NextResponse.json({error:"Unsupported action."},{status:400});
  }catch(e){console.error(e);return NextResponse.json({error:"Room operation failed."},{status:500});}
}

export async function GET(request:Request){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  try{
    await ensureRooms();
    const game=String(new URL(request.url).searchParams.get("game")||"").trim();
    const db=getDb();
    const rows=game
      ? await db.execute(sql`SELECT id,game_key,status,created_at FROM game_rooms WHERE game_key=${game} AND status IN ('OPEN','ACTIVE') AND (host_user_id<>${current.user.id} OR guest_user_id IS NULL) ORDER BY created_at DESC LIMIT 20`)
      : await db.execute(sql`SELECT id,game_key,status,created_at FROM game_rooms WHERE status IN ('OPEN','ACTIVE') AND (host_user_id=${current.user.id} OR guest_user_id=${current.user.id}) ORDER BY created_at DESC LIMIT 20`);
    return NextResponse.json({rooms:(rows as any).rows||[]});
  }catch(e){console.error(e);return NextResponse.json({error:"Could not load rooms."},{status:500});}
}