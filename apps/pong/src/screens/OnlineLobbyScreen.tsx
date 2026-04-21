import { useState, useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { sb } from '@/lib/supabase';
import type { PaddleSkin } from '@/App';
import { isValidPassword, defaultRoomTitle, randomCode, randomId } from '@/online/onlineUtils';

interface Room {
  code: string;
  title: string;
  password: string | null;
  guest_id: string | null;
  host_skin: string;
  status: string;
}

export interface OnlineSession {
  code: string;
  myId: string;
  isHost: boolean;
  mySkin: string;
  opponentSkin: string;
  winScore: number;
}

interface WaitingInfo { code: string; title: string; ch: RealtimeChannel; }
interface LobbyInfo  { code: string; title: string; myId: string; isHost: boolean; opponentSkin: string; }

interface Props {
  skinP1: PaddleSkin;
  onStart: (session: OnlineSession) => void;
  onBack:  () => void;
}

const SKIN_EMOJI: Record<string, string> = {
  flame: '🔥', ice: '❄️', electric: '⚡', grass: '🌿',
};
const SKIN_COLOR: Record<string, string> = {
  flame: '#ff3300', ice: '#00aaff', electric: '#ffdd00', grass: '#44cc00',
};

export default function OnlineLobbyScreen({ skinP1, onStart, onBack }: Props) {
  const [rooms, setRooms]       = useState<Room[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pwDialog, setPwDialog]     = useState<Room | null>(null);
  const [waitingInfo, setWaitingInfo] = useState<WaitingInfo | null>(null);
  const [lobbyInfo, setLobbyInfo]     = useState<LobbyInfo | null>(null);
  const [lobbyWinScore, setLobbyWinScore] = useState(7);

  // Use refs to safely manage lobby subscriptions (avoids React stale closure / batching issues)
  const lobbyChRef   = useRef<RealtimeChannel | null>(null);
  const lobbyPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lobbyDoneRef = useRef(false);

  useEffect(() => {
    loadRooms();
    const ch: RealtimeChannel = sb.channel('lobby_web')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pong_rooms' }, () => loadRooms())
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, []);

  async function loadRooms() {
    try {
      const { data, error: err } = await sb.from('pong_rooms').select('*').eq('status', 'waiting').order('updated_at', { ascending: false });
      if (err) throw err;
      setRooms(data as Room[]);
      setError(null);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function createRoom(title: string, password: string | null) {
    setLoading(true); setError(null);
    try {
      const code  = randomCode();
      const myId  = randomId();
      const { error: err } = await sb.from('pong_rooms').insert({
        code, title, password, host_id: myId,
        host_skin: skinP1, status: 'waiting',
      });
      if (err) throw err;
      setShowCreate(false);
      setLoading(false);
      waitForGuest(code, myId, title);
    } catch (e: unknown) {
      setError(String(e)); setLoading(false);
    }
  }

  function waitForGuest(code: string, myId: string, title: string) {
    let done = false;

    function enterLobby(guestSkin: string) {
      if (done) return;
      done = true;
      ch.unsubscribe();
      clearInterval(pollId);
      setWaitingInfo(null);
      setLobbyInfo({ code, title, myId, isHost: true, opponentSkin: guestSkin });
    }

    const ch = sb.channel(`wait_${code}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'pong_rooms',
        filter: `code=eq.${code}`,
      }, (payload: { new: Record<string, unknown> }) => {
        const d = payload.new;
        if (d['status'] === 'lobby' && d['guest_id']) {
          enterLobby(String(d['guest_skin'] ?? 'ice'));
        }
      })
      .subscribe();

    const pollId = setInterval(async () => {
      if (done) { clearInterval(pollId); return; }
      const { data } = await sb.from('pong_rooms').select('status,guest_id,guest_skin').eq('code', code).maybeSingle();
      if (data?.status === 'lobby' && data?.guest_id) {
        enterLobby(String(data.guest_skin ?? 'ice'));
      }
    }, 1500);

    setWaitingInfo({ code, title, ch });
  }

  async function cancelWaiting() {
    if (!waitingInfo) return;
    waitingInfo.ch.unsubscribe();
    await sb.from('pong_rooms').delete().eq('code', waitingInfo.code);
    setWaitingInfo(null);
    loadRooms();
  }

  // ── Lobby (game settings before start) ───────────────────

  function startGuestGame(code: string, myId: string, opponentSkin: string, winScore: number) {
    if (lobbyDoneRef.current) return;
    lobbyDoneRef.current = true;
    lobbyChRef.current?.unsubscribe();
    if (lobbyPollRef.current) clearInterval(lobbyPollRef.current);
    lobbyChRef.current = null;
    lobbyPollRef.current = null;
    setLobbyInfo(null);
    onStart({ code, myId, isHost: false, mySkin: skinP1, opponentSkin, winScore });
  }

  function setupGuestLobbySubscription(code: string, myId: string, opponentSkin: string, initialWinScore: number) {
    lobbyDoneRef.current = false;

    const ch = sb.channel(`lobby_web_${code}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'pong_rooms',
        filter: `code=eq.${code}`,
      }, (payload: { new: Record<string, unknown> }) => {
        const d = payload.new;
        const ws = typeof d['win_score'] === 'number' ? d['win_score'] : initialWinScore;
        setLobbyWinScore(ws);
        if (d['status'] === 'playing') startGuestGame(code, myId, opponentSkin, ws);
      })
      .subscribe();
    lobbyChRef.current = ch;

    const pollId = setInterval(async () => {
      if (lobbyDoneRef.current) { clearInterval(pollId); return; }
      try {
        const { data } = await sb.from('pong_rooms').select('status,win_score').eq('code', code).maybeSingle();
        if (data) {
          const ws = (data.win_score as number) ?? initialWinScore;
          if (data.status !== 'playing') setLobbyWinScore(ws);
          if (data.status === 'playing') startGuestGame(code, myId, opponentSkin, ws);
        }
      } catch (_) { /* keep polling */ }
    }, 500);
    lobbyPollRef.current = pollId;
  }

  async function joinRoom(room: Room) {
    const hasPassword = room.password != null && room.password !== '';
    if (hasPassword) { setPwDialog(room); return; }
    await doJoin(room, null);
  }

  async function doJoin(room: Room, enteredPw: string | null) {
    if (room.password && enteredPw !== room.password) {
      setError('비밀번호가 틀렸어'); return;
    }
    setLoading(true); setError(null);
    try {
      const { data: fresh, error: e1 } = await sb.from('pong_rooms').select('*').eq('code', room.code).maybeSingle();
      if (e1) throw e1;
      if (!fresh || fresh.status !== 'waiting' || fresh.guest_id) {
        setError('입장할 수 없어'); setLoading(false); return;
      }
      const myId = randomId();
      const { error: e2 } = await sb.from('pong_rooms').update({
        guest_id: myId, guest_skin: skinP1, status: 'lobby',
      }).eq('code', room.code);
      if (e2) throw e2;
      setPwDialog(null);
      setLoading(false);
      const opponentSkin = String(fresh.host_skin ?? 'flame');
      const initialWinScore = (fresh.win_score as number) ?? 7;
      setLobbyWinScore(initialWinScore);
      setLobbyInfo({ code: room.code, title: room.title ?? '퐁 배틀방', myId, isHost: false, opponentSkin });
      setupGuestLobbySubscription(room.code, myId, opponentSkin, initialWinScore);
    } catch (e: unknown) {
      setError(String(e)); setLoading(false);
    }
  }

  async function hostStartGame(winScore: number) {
    if (!lobbyInfo) return;
    const { code, myId, opponentSkin } = lobbyInfo;
    await sb.from('pong_rooms').update({ status: 'playing', win_score: winScore }).eq('code', code);
    setLobbyInfo(null);
    onStart({ code, myId, isHost: true, mySkin: skinP1, opponentSkin, winScore });
  }

  async function cancelLobby() {
    if (!lobbyInfo) return;
    // Clean up guest subscription if any
    lobbyDoneRef.current = true;
    lobbyChRef.current?.unsubscribe();
    if (lobbyPollRef.current) clearInterval(lobbyPollRef.current);
    lobbyChRef.current = null;
    lobbyPollRef.current = null;
    if (lobbyInfo.isHost) {
      await sb.from('pong_rooms').delete().eq('code', lobbyInfo.code);
    } else {
      await sb.from('pong_rooms').update({ guest_id: null, guest_skin: null, status: 'waiting' }).eq('code', lobbyInfo.code);
    }
    setLobbyInfo(null);
    setLobbyWinScore(7);
    loadRooms();
  }

  async function updateWinScore(score: number) {
    if (!lobbyInfo) return;
    setLobbyWinScore(score);
    await sb.from('pong_rooms').update({ win_score: score }).eq('code', lobbyInfo.code);
  }

  const base: React.CSSProperties = {
    width: '100%', height: '100dvh', background: '#000',
    display: 'flex', flexDirection: 'column',
    color: '#fff', fontFamily: 'monospace',
  };

  // ── Game Lobby ────────────────────────────────────────────
  if (lobbyInfo) {
    const p1Skin = lobbyInfo.isHost ? skinP1 : lobbyInfo.opponentSkin;
    const p2Skin = lobbyInfo.isHost ? lobbyInfo.opponentSkin : skinP1;
    return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'space-between', padding: '0 0 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '12px 16px', borderBottom: '1px solid #1a1a1a' }}>
          <button onClick={cancelLobby} style={btnBase('#0001', '#fff5')}>←</button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 14, letterSpacing: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 8px' }}>
            {lobbyInfo.title}
          </span>
          <div style={{ width: 36 }} />
        </div>

        {/* Players */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, padding: '40px 24px 0' }}>
          <PlayerCard skin={p1Skin} label="P1 (호스트)" isMe={lobbyInfo.isHost} />
          <span style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>VS</span>
          <PlayerCard skin={p2Skin} label="P2 (게스트)" isMe={!lobbyInfo.isHost} />
        </div>

        {/* Win score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 11, color: '#555', letterSpacing: 2 }}>승점</span>
          <div style={{ display: 'flex', gap: 12 }}>
            {[3, 5, 7].map(s => {
              const sel = lobbyWinScore === s;
              return (
                <button
                  key={s}
                  onClick={lobbyInfo.isHost ? () => updateWinScore(s) : undefined}
                  style={{
                    width: 64, height: 64, fontSize: 22, fontWeight: 700, fontFamily: 'monospace',
                    background: sel ? '#1a1a1a' : 'transparent',
                    border: `${sel ? 2 : 1}px solid ${sel ? '#fff' : '#2a2a2a'}`,
                    borderRadius: 10, color: sel ? '#fff' : '#3a3a3a',
                    cursor: lobbyInfo.isHost ? 'pointer' : 'default',
                  }}
                >{s}</button>
              );
            })}
          </div>
        </div>

        {/* Action */}
        <div style={{ width: '100%', padding: '0 24px' }}>
          {lobbyInfo.isHost ? (
            <OutlineBtn label="시작하기" onClick={() => hostStartGame(lobbyWinScore)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, height: 28, border: '3px solid #ffffff11', borderTop: '3px solid #fff4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <span style={{ fontSize: 11, color: '#444' }}>호스트 대기 중...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Waiting ───────────────────────────────────────────────
  if (waitingInfo) {
    return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, textAlign: 'center' }}>{waitingInfo.title}</div>
        <div style={{ width: 36, height: 36, border: '3px solid #ffffff22', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: 11, color: '#333' }}>상대 입장 대기 중...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <button onClick={cancelWaiting} style={{ ...btnBase('transparent', '#444'), padding: '8px 24px', marginTop: 24, color: '#444' }}>
          취소
        </button>
      </div>
    );
  }

  // ── Room List ─────────────────────────────────────────────
  return (
    <div style={base}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #1a1a1a' }}>
        <button onClick={onBack} style={btnBase('#0001', '#fff5')}>←</button>
        <span style={{ flex: 1, textAlign: 'center', letterSpacing: 4, fontSize: 16 }}>ONLINE</span>
        <button onClick={() => { setLoading(true); loadRooms(); }} style={btnBase('#0001', '#fff5')}>↺</button>
      </div>

      {error && <div style={{ padding: '10px 20px', color: '#ff4444', fontSize: 11 }}>{error}</div>}

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#333', marginTop: 60 }}>로딩 중...</div>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#333', marginTop: 60, lineHeight: 1.8, fontSize: 13 }}>
            열린 방이 없어<br />아래 버튼으로 방을 만들어봐
          </div>
        ) : (
          rooms.map(room => (
            <RoomTile key={room.code} room={room} onJoin={() => joinRoom(room)} />
          ))
        )}
      </div>

      <div style={{ padding: 16 }}>
        <OutlineBtn label="방 만들기" onClick={() => setShowCreate(true)} />
      </div>

      {showCreate && <CreateDialog onCancel={() => setShowCreate(false)} onCreate={createRoom} />}
      {pwDialog && <PasswordDialog onCancel={() => setPwDialog(null)} onSubmit={(pw) => doJoin(pwDialog, pw)} />}
    </div>
  );
}

// ── Player Card ───────────────────────────────────────────
function PlayerCard({ skin, label, isMe }: { skin: string; label: string; isMe: boolean }) {
  const emoji = SKIN_EMOJI[skin] ?? '🔥';
  const color = SKIN_COLOR[skin] ?? '#ff3300';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 9, color: isMe ? '#ffffff88' : '#444', letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 40 }}>{emoji}</span>
      <div style={{
        width: 72, height: 8, borderRadius: 4,
        background: isMe ? color : `${color}55`,
        boxShadow: isMe ? `0 0 10px ${color}88` : 'none',
      }} />
      <span style={{ fontSize: 9, color: isMe ? '#ffffff88' : '#444', letterSpacing: 1 }}>{skin.toUpperCase()}</span>
    </div>
  );
}

// ── Room Tile ─────────────────────────────────────────────
function RoomTile({ room, onJoin }: { room: Room; onJoin: () => void }) {
  const locked = room.password != null && room.password !== '';
  const full   = room.guest_id != null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', marginBottom: 10,
      border: `1.5px solid ${full ? '#222' : '#444'}`,
      borderRadius: 8, color: full ? '#333' : '#fff',
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
        {locked && <span style={{ fontSize: 12 }}>🔒</span>}
        <span style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.title}</span>
      </div>
      <span style={{ fontSize: 11, color: full ? '#333' : '#888', flexShrink: 0 }}>{full ? '2/2' : '1/2'}</span>
      <button
        disabled={full} onClick={onJoin}
        style={{ ...btnBase(full ? '#0a0a0a' : 'transparent', full ? '#222' : '#fff'),
          fontSize: 11, fontWeight: 700, padding: '5px 10px', flexShrink: 0,
          color: full ? '#333' : '#fff', cursor: full ? 'default' : 'pointer' }}
      >{full ? '꽉참' : '입장'}</button>
    </div>
  );
}

// ── Create Dialog ─────────────────────────────────────────
function CreateDialog({ onCancel, onCreate }: { onCancel: () => void; onCreate: (title: string, pw: string | null) => void }) {
  const [title, setTitle] = useState(defaultRoomTitle());
  const [usePw, setUsePw] = useState(false);
  const [pw, setPw]       = useState('');
  const [pwErr, setPwErr] = useState('');

  function submit() {
    if (usePw && !isValidPassword(pw)) { setPwErr('4자리 숫자로 입력해줘'); return; }
    onCreate(title.trim() || defaultRoomTitle(), usePw ? pw : null);
  }

  return (
    <Overlay>
      <DialogBox>
        <h3 style={{ margin: '0 0 20px', letterSpacing: 2, fontSize: 16 }}>방 만들기</h3>
        <label style={{ fontSize: 10, color: '#555', letterSpacing: 1 }}>방 제목</label>
        <input value={title} onChange={e => setTitle(e.target.value)} maxLength={20} style={inputStyle} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <input type="checkbox" checked={usePw} onChange={e => setUsePw(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
          <span style={{ fontSize: 11, color: '#777' }}>비밀번호 설정 (4자리 숫자)</span>
        </div>
        {usePw && (
          <>
            <input type="password" inputMode="numeric" maxLength={4}
              value={pw} onChange={e => { setPw(e.target.value.replace(/\D/g, '')); setPwErr(''); }}
              style={{ ...inputStyle, letterSpacing: 8, textAlign: 'center', fontSize: 20, marginTop: 10 }} placeholder="••••" />
            {pwErr && <div style={{ color: '#ff4444', fontSize: 10, marginTop: 4 }}>{pwErr}</div>}
          </>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <button onClick={onCancel} style={{ ...btnBase('transparent', '#555'), flex: 1, padding: '12px 0' }}>취소</button>
          <button onClick={submit}   style={{ ...btnBase('#fff', '#fff'), flex: 1, padding: '12px 0', color: '#000', fontWeight: 700 }}>만들기</button>
        </div>
      </DialogBox>
    </Overlay>
  );
}

// ── Password Dialog ───────────────────────────────────────
function PasswordDialog({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (pw: string) => void }) {
  const [pw, setPw]   = useState('');
  const [err, setErr] = useState('');
  function submit() {
    if (!isValidPassword(pw)) { setErr('4자리 숫자로 입력해줘'); return; }
    onSubmit(pw);
  }
  return (
    <Overlay>
      <DialogBox>
        <h3 style={{ margin: '0 0 20px', letterSpacing: 2, fontSize: 16 }}>비밀번호 입력</h3>
        <input type="password" inputMode="numeric" maxLength={4} autoFocus
          value={pw} onChange={e => { setPw(e.target.value.replace(/\D/g, '')); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ ...inputStyle, letterSpacing: 12, textAlign: 'center', fontSize: 24 }} placeholder="••••" />
        {err && <div style={{ color: '#ff4444', fontSize: 10, marginTop: 4 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <button onClick={onCancel} style={{ ...btnBase('transparent', '#555'), flex: 1, padding: '12px 0' }}>취소</button>
          <button onClick={submit}   style={{ ...btnBase('#fff', '#fff'), flex: 1, padding: '12px 0', color: '#000', fontWeight: 700 }}>입장</button>
        </div>
      </DialogBox>
    </Overlay>
  );
}

// ── Primitives ────────────────────────────────────────────
function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      {children}
    </div>
  );
}
function DialogBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#0e0e0e', border: '1px solid #333', borderRadius: 12, padding: 24, width: '85%', maxWidth: 360, fontFamily: 'monospace', color: '#fff' }}>
      {children}
    </div>
  );
}
function OutlineBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ ...btnBase('transparent', '#fff'), width: '100%', padding: '18px 0', fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
      {label}
    </button>
  );
}
const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
  background: 'transparent', border: '1px solid #333', borderRadius: 4,
  color: '#fff', fontFamily: 'monospace', fontSize: 14, boxSizing: 'border-box',
};
function btnBase(bg: string, borderColor: string): React.CSSProperties {
  return { background: bg, border: `1.5px solid ${borderColor}`, borderRadius: 6, color: '#fff', fontFamily: 'monospace', cursor: 'pointer', fontSize: 14 };
}
