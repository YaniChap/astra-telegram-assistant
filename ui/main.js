
// SPDX-License-Identifier: MPL-2.0

const container = document.getElementById('app');
let messageHistoryRefreshTimer = null;
let dialogPreviewRefreshTimer = null;
let historyRefreshInFlight = false;

try {
  const ui = await astra.loadUi({ apiVersion: 1 });

  const state = {
    activeTab: 'home',
    connection: 'connecting',
    authStep: 'phone',
    phone: '',
    code: '',
    password: '',
    hint: '',
    message: '',
    busy: false,
qrSvg: '',
qrExpiresAt: 0,
qrRemaining: 0,
qrPolling: false,
appSettingsLoaded: false,
    messageAssistantEnabled: false,
    replyMode: 'automatic',
    replyStyle: 'natural',
    scheduleEnabled: false,
    scheduleDays: [1,2,3,4,5,6,7],
    scheduleStart: '09:00',
    scheduleEnd: '21:00',
    voiceTestText: 'Привет! Это проверка голосового модуля Astra.',
    voiceTestAudio: null,
    chatMemories: {},
    chatReplyStyles: {},
    chatMemoryDraft: '',
    autoReplyChatIds: [],
    automationChats: [],
    automationChatsLoaded: false,
    incomingPrompt: null,
    replyDraft: '',
    notificationStatus: '',
    voiceAudio: null,
    voiceLoadingId: null,
    botConfig: { enabled:false, voice_replies:false, owner_id:'', username:'', has_token:false, allowed_users:{}, pending_users:{}, known_users:{}, bot_memories:{}, bot_styles:{}, last_error:'' },
    botStatusLoaded: false,
    voiceTranscribingId: null,
    voiceTranscriptByMessage: {},
    voiceProvider: { base_url: 'https://api.openai.com/v1', stt_model: 'whisper-1', tts_model: 'gpt-4o-mini-tts', tts_voice: 'alloy', language: '', has_api_key: false },
    confirmDisconnect: false,
    chats: [],
    selectedChatId: '',
    chatMessages: [],
    chatDraft: '',
    messageSearch: '',
    chatsBusy: false,
    chatBusy: false,
    messagesNotice: ''
  };

  let root;
let qrPollTimer = null;
let qrCountdownTimer = null;
let qrPollInFlight = false;
let notificationPollTimer = null;
let notificationPollInFlight = false;
let connectionPollTimer = null;
let connectionPollInFlight = false;

function stopQrPolling() {
  if (qrPollTimer) {
    clearInterval(qrPollTimer);
    qrPollTimer = null;
  }

  if (qrCountdownTimer) {
    clearInterval(qrCountdownTimer);
    qrCountdownTimer = null;
  }

  state.qrPolling = false;
  qrPollInFlight = false;
}

  const styles = `
    :root {
      color-scheme: dark;
      --bg: #090b16;
      --panel: #111629;
      --panel2: #171d32;
      --border: #29314d;
      --text: #f3f4ff;
      --muted: #929bb8;
      --cyan: #43eee0;
      --purple: #a879ff;
      --danger: #ff718e;
      font-family: Inter, "Segoe UI", sans-serif;
    }

.qr-card {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #090e1d;
  text-align: center;
}

.qr-image {
  width: min(100%, 300px);
  margin: 16px auto;
  padding: 12px;
  border-radius: 12px;
  background: #fff;
}

.qr-image svg {
  display: block;
  width: 100%;
  height: auto;
}

.qr-time {
  color: var(--cyan);
  font-size: 13px;
  font-weight: 700;
  margin: 12px 0;
}

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
    }

    button, input, textarea, select { font: inherit; }

    /* Unified dark form controls: prevent host/browser light defaults and overflow. */
    input:not([type="checkbox"]):not([type="radio"]),
    textarea,
    select {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 11px 13px;
      border: 1px solid #303a59;
      border-radius: 10px;
      outline: none;
      background-color: #090e1d;
      color: #f3f4ff;
      color-scheme: dark;
      font: inherit;
      line-height: 1.45;
      transition: border-color .18s ease, box-shadow .18s ease;
    }
    input:not([type="checkbox"]):not([type="radio"]):focus,
    textarea:focus,
    select:focus {
      border-color: var(--cyan);
      box-shadow: 0 0 0 3px #43eee018;
    }
    input::placeholder, textarea::placeholder { color: #77819f; opacity: 1; }
    textarea { resize: vertical; overflow-wrap: anywhere; }
    select option { background: #111629; color: #f3f4ff; }
    input[type="checkbox"], input[type="radio"] {
      accent-color: #43eee0;
      width: 16px;
      height: 16px;
      vertical-align: middle;
    }
    .panel, .notice, .form-grid, .form-grid > label { min-width: 0; }
    .form-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)) !important; }
    .form-grid > label { display: block; overflow-wrap: anywhere; }
    .form-grid > label > input,
    .form-grid > label > textarea,
    .form-grid > label > select { margin-top: 6px; }

    .astra {
      min-height: 100vh;
      padding: 20px;
      background:
        radial-gradient(ellipse at 5% 0%, #183b5038, transparent 40%),
        radial-gradient(ellipse at 100% 20%, #542c7730, transparent 38%),
        var(--bg);
    }

    .shell {
      max-width: 1180px;
      margin: auto;
      display: grid;
      grid-template-columns: 230px minmax(0, 1fr);
      gap: 20px;
    }

    .sidebar, .panel {
      background: #101426eF;
      border: 1px solid var(--border);
      border-radius: 20px;
      box-shadow: 0 12px 50px #0005;
    }

    .sidebar {
      padding: 20px 14px;
      min-height: 680px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 8px 24px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 22px;
    }

    .logo {
      width: 46px;
      height: 46px;
      filter: drop-shadow(0 0 9px #43eee080);
    }

    .brand-name {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 3px;
    }

    .brand-sub {
      color: var(--cyan);
      font-size: 9px;
      letter-spacing: 1.7px;
      margin-top: 3px;
    }

    .nav-label {
      color: #65708f;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.7px;
      padding: 0 12px;
      margin: 20px 0 9px;
    }

    .nav {
      width: 100%;
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted);
      text-align: left;
      padding: 12px;
      border-radius: 11px;
      margin: 3px 0;
      cursor: pointer;
      transition: .2s;
    }

    .nav:hover {
      background: #1a2037;
      color: var(--text);
    }

    .nav.active {
      color: var(--cyan);
      background: linear-gradient(100deg, #1c4950a0, #28204490);
      border-color: #3b8e8c70;
      box-shadow: inset 3px 0 var(--cyan), 0 0 20px #43eee014;
    }

    .side-footer {
      margin-top: 30px;
      padding: 13px;
      border-radius: 12px;
      background: #171d32;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.6;
    }

    .main { min-width: 0; }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin: 4px 2px 22px;
    }

    .eyebrow {
      color: var(--cyan);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 7px;
    }

    h1 {
      font-size: clamp(23px, 4vw, 31px);
      margin: 0;
      letter-spacing: -.7px;
    }

    .top-status {
      border: 1px solid var(--border);
      background: #141a2c;
      border-radius: 30px;
      color: var(--muted);
      padding: 9px 13px;
      font-size: 11px;
      white-space: nowrap;
    }

    .dot {
      display: inline-block;
      width: 7px;
      height: 7px;
      background: #eab308;
      border-radius: 50%;
      margin-right: 7px;
      box-shadow: 0 0 9px rgba(234,179,8,.65);
    }

    .dot.connected {
      background: #3b82f6;
      box-shadow: 0 0 10px rgba(59,130,246,.9);
    }

    .dot.checking {
      background: #eab308;
      box-shadow: 0 0 9px rgba(234,179,8,.65);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .panel { padding: 20px; }

    .messenger-layout { display:grid; grid-template-columns:minmax(220px, 0.8fr) minmax(0, 1.7fr); gap:14px; min-height:520px; }
    .chat-list { display:flex; flex-direction:column; gap:7px; max-height:620px; overflow:auto; }
    .chat-item { width:100%; text-align:left; border:1px solid var(--border); border-radius:12px; padding:12px; color:var(--text); background:#0c1222; cursor:pointer; }
    .chat-item.active { border-color:#43eee0a0; background:#17303a; }
    .chat-title { font-weight:700; font-size:13px; margin-bottom:5px; }
    .chat-preview { color:var(--muted); font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .conversation { display:flex; flex-direction:column; min-height:500px; }
    .message-list { display:flex; flex-direction:column; gap:9px; flex:1; min-height:380px; max-height:560px; overflow:auto; padding:12px; border:1px solid var(--border); border-radius:13px; background:#090e1d; }
    .message-bubble { max-width:85%; align-self:flex-start; white-space:pre-wrap; overflow-wrap:anywhere; padding:10px 12px; border-radius:12px 12px 12px 3px; background:#1b2540; color:var(--text); font-size:13px; line-height:1.5; }
    .message-bubble.outgoing { align-self:flex-end; background:#16413f; border-radius:12px 12px 3px 12px; }
    .message-actions { display:flex; justify-content:flex-end; gap:6px; margin-top:7px; opacity:.72; }
    .message-actions button { border:0; background:transparent; color:#b9c5dd; font-size:10px; padding:3px 5px; cursor:pointer; }
    .message-toolbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:8px 0; }
    .message-toolbar input { flex:1; min-width:130px; border:1px solid var(--border); border-radius:9px; padding:9px 11px; color:var(--text); background:#090e1d; }
    .message-list-wrap { position:relative; min-height:380px; }
    .jump-latest { position:absolute; right:20px; bottom:16px; z-index:2; border:1px solid #43eee0aa; border-radius:20px; padding:8px 12px; background:#16343b; color:#eaffff; cursor:pointer; box-shadow:0 6px 20px #0008; }
    .compose { display:flex; gap:8px; margin-top:10px; align-items:flex-end; }
    .compose textarea { flex:1; min-width:0; min-height:44px; max-height:140px; resize:vertical; border:1px solid #303a59; border-radius:11px; padding:12px; color:var(--text); background:#090e1d; font:inherit; }
    .compose .btn { width:auto; min-width:105px; }
    .small-btn { border:1px solid var(--border); background:#202943; color:var(--text); border-radius:9px; padding:9px 12px; cursor:pointer; }
    @media (max-width:760px) { .messenger-layout { grid-template-columns:1fr; } .chat-list { max-height:220px; } .message-list { min-height:300px; } }


    .hero {
      grid-column: 1 / -1;
      padding: 25px;
      background:
        radial-gradient(ellipse at 90% 10%, #693e9a40, transparent 43%),
        linear-gradient(120deg, #121c30, #17152b);
    }

    .hero h2 {
      font-size: 23px;
      margin: 0 0 9px;
    }

    .muted {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.65;
    }

    .hero-mark {
      color: var(--cyan);
      font-size: 12px;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
    }

    .tile {
      min-height: 130px;
      cursor: pointer;
      transition: .2s;
    }

    .tile:hover {
      border-color: #43eee080;
      transform: translateY(-2px);
      box-shadow: 0 0 24px #43eee010;
    }

    .tile-icon {
      font-size: 22px;
      margin-bottom: 17px;
    }

    .tile-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 5px;
    }

    .tile-desc {
      color: var(--muted);
      font-size: 11px;
    }

    .section-title {
      font-size: 17px;
      margin: 0 0 7px;
    }

    .field { margin: 17px 0; }

    .field label {
      display: block;
      color: var(--muted);
      font-size: 10px;
      letter-spacing: 1.4px;
      font-weight: 700;
      margin-bottom: 9px;
    }


    .btn {
      width: 100%;
      border: 0;
      border-radius: 11px;
      padding: 13px 16px;
      color: #07151a;
      font-weight: 800;
      cursor: pointer;
      background: linear-gradient(100deg, #43eee0, #75cafa);
      box-shadow: 0 0 20px #43eee025;
      transition: .2s;
    }

    .btn:hover { filter: brightness(1.08); }
    .btn:disabled { opacity: .5; cursor: wait; }

    .btn-secondary {
      color: var(--text);
      background: #202943;
      border: 1px solid var(--border);
      box-shadow: none;
      margin-top: 9px;
    }

.btn-danger {
  color: #fff0f3;
  background: linear-gradient(100deg, #a83255, #70243f);
  border: 1px solid #b84b6b;
  box-shadow: 0 0 20px #ff718e20;
  margin-top: 12px;
}

.btn-danger:hover {
  filter: brightness(1.12);
}
    .notice {
      margin-top: 14px;
      padding: 12px 14px;
      border: 1px solid #3c5360;
      border-radius: 10px;
      background: #142631;
      color: #a9f8ed;
      font-size: 12px;
      line-height: 1.5;
    }

    .notice.error {
      color: #ffb0bd;
      border-color: #71394b;
      background: #2a1724;
    }

    .notice:empty { display: none; }

    .status-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
    }

    .status-pill {
      color: #f6d28b;
      background: #493a203d;
      border: 1px solid #79613b;
      border-radius: 30px;
      padding: 6px 10px;
      font-size: 10px;
      white-space: nowrap;
    }

    .status-pill.good {
      color: var(--cyan);
      border-color: #337d78;
      background: #173d3b55;
    }

    .option-list {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 16px;
    }
    .option-card {
      display: grid;
      gap: 8px;
      text-align: left;
      padding: 14px;
      color: var(--text);
      background: #090e1d;
      border: 1px solid var(--border);
      border-radius: 12px;
      cursor: pointer;
    }
    .option-card.active { border-color: var(--cyan); background: #123039; }
    .option-card span { color: var(--muted); font-size: 11px; line-height: 1.45; }
    .option-status { color: var(--cyan); font-size: 11px; margin-top: 12px; }
    @media (max-width: 760px) { .option-list { grid-template-columns: 1fr; } }

    .back {
      color: var(--cyan);
      border: 0;
      background: none;
      padding: 0;
      cursor: pointer;
      font-size: 12px;
      margin-bottom: 20px;
    }

    .footer {
      color: #65708d;
      font-size: 10px;
      text-align: center;
      padding: 20px 0 5px;
    }


    @media (max-width: 760px) {
      .astra { padding: 10px; }
      .shell { grid-template-columns: 1fr; gap: 12px; }
      .sidebar { min-height: 0; padding: 12px; }
      .brand { padding-bottom: 12px; margin-bottom: 10px; }
      .nav-label, .side-footer { display: none; }
      .nav-list {
        display: flex;
        gap: 5px;
        overflow-x: auto;
      }
      .nav {
        width: auto;
        white-space: nowrap;
        padding: 10px;
        font-size: 11px;
      }
      .grid { grid-template-columns: 1fr; }
      .hero { grid-column: auto; }
      .topbar { margin: 8px 2px 14px; }
    }
  `;

  const logo = `
    <svg class="logo" viewBox="0 0 64 64" fill="none"
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="astra-gradient" x1="5" y1="5" x2="59" y2="59">
          <stop stop-color="#43EEE0"/>
          <stop offset="1" stop-color="#A879FF"/>
        </linearGradient>
      </defs>
      <path d="M32 4L40 24L60 32L40 40L32 60L24 40L4 32L24 24L32 4Z"
            stroke="url(#astra-gradient)" stroke-width="2.7"
            stroke-linejoin="round"/>
      <circle cx="32" cy="32" r="5" fill="#43EEE0"/>
      <circle cx="32" cy="32" r="10" stroke="#43EEE0"
              stroke-opacity=".35"/>
    </svg>
  `;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function parseResponse(value) {
    if (typeof value === 'string') {
      try { return JSON.parse(value); }
      catch { return { status: 'unknown', message: value }; }
    }
    return value || {};
  }


async function backend(method, args = {}) {
  console.log('[Astra backend] method:', method);

  try {
    const result = await astra.callBackend(method, JSON.stringify(args));
    return parseResponse(result);
  } catch (error) {
    console.error('[Astra backend] call failed:', {
      method,
      message: error?.message
    });

    throw error;
  }
}


  function setMessage(message, isError = false) {
    state.message = message || '';
    state.messageError = isError;
  }


async function loadSpeechProviderStatus() {
  try {
    const result = await backend('telegram_voice_provider_status', {});
    if (result.status === 'ok') {
      state.voiceProvider = { ...state.voiceProvider, ...result };
      if (state.activeTab === 'voice') render();
    }
  } catch (error) { console.warn('Voice provider status:', error?.message); }
}

async function loadAppSettings() {
  if (state.appSettingsLoaded) return;

  try {
    const result = await backend('telegram_get_voice_settings', {});

    if (result.status !== 'ok') {
      throw new Error(result.message || 'Не удалось загрузить настройки.');
    }

    state.messageAssistantEnabled = result.message_assistant_enabled === true;
    state.replyMode = ['confirm', 'automatic', 'hybrid'].includes(result.reply_mode) ? result.reply_mode : 'automatic';
    state.autoReplyChatIds = Array.isArray(result.auto_reply_chat_ids) ? result.auto_reply_chat_ids : [];
    state.replyStyle = ['natural','friendly','formal','concise','warm'].includes(result.reply_style) ? result.reply_style : 'natural';
    state.scheduleEnabled = result.schedule_enabled === true;
    state.scheduleDays = Array.isArray(result.schedule_days) ? result.schedule_days : [1,2,3,4,5,6,7];
    state.scheduleStart = result.schedule_start || '09:00';
    state.scheduleEnd = result.schedule_end || '21:00';
    state.chatMemories = result.chat_memories && typeof result.chat_memories === 'object' ? result.chat_memories : {};
    state.chatReplyStyles = result.chat_reply_styles && typeof result.chat_reply_styles === 'object' ? result.chat_reply_styles : {};

    state.appSettingsLoaded = true;
    startNotificationPolling();
    if (state.activeTab === 'automation' && state.replyMode === 'hybrid') {
      void loadAutomationChats();
    }
  } catch (error) {
    setMessage(
      error.message || 'Не удалось загрузить настройки.',
      true
    );
  }

  render();
}


  async function loadBotStatus() {
    try {
      const result = await backend('telegram_bot_status', {});
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось получить статус бота.');
      state.botConfig = {
        enabled: result.enabled === true,
        voice_replies: result.voice_replies === true,
                owner_username: result.owner_username || '',
        username: result.username || '',
        has_token: result.has_token === true,
        allowed_users: result.allowed_users || {},
        pending_users: result.pending_users || {},
        known_users: result.known_users || {},
        bot_memories: result.bot_memories || {},
        bot_styles: result.bot_styles || {},
        last_error: result.last_error || ''
      };
      state.botStatusLoaded = true;
    } catch (error) { setMessage(error.message || 'Ошибка статуса бота.', true); }
    render();
  }

  function botUserLabel(id, user) {
    const name = user?.name || 'Пользователь';
    const username = user?.username ? ` (@${user.username})` : '';
    return `${name}${username}`;
  }

  function botContent() {
    const b = state.botConfig;
    const allowed = Object.entries(b.allowed_users || {});
    const pending = Object.entries(b.pending_users || {});
    const known = Object.entries(b.known_users || {});
    return `
      <section class="panel">
        <div class="eyebrow">TELEGRAM BOT API</div>
        <h2 class="section-title">Удалённое общение с Astra</h2>
        <p class="muted">Отдельный бот BotFather. Он работает независимо от входа в личный Telegram через MTProto и позволяет общаться с Astra с телефона.</p>
        <div class="notice" style="margin:12px 0">
          <strong>Как создать бота</strong>
          <ol style="padding-left:20px;line-height:1.65">
            <li>Открой в Telegram <b>@BotFather</b> и отправь <code>/newbot</code>.</li>
            <li>Задай имя и username, который заканчивается на <b>bot</b>.</li>
            <li>Скопируй токен, вставь его ниже и сохрани настройки, пока бот выключен.</li>
            <li>Открой созданного бота на телефоне, нажми <b>Start</b> и отправь <code>/start</code>.</li>
            <li>Укажи ниже свой публичный Telegram username в формате <b>@username</b>. Astra свяжет его с аккаунтом после первого сообщения боту.</li>
          </ol>
          Токен даёт полный контроль над ботом. Не отправляй его другим людям и не публикуй.
        </div>
        <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          <label>Токен BotFather<input id="bot-token" type="password" autocomplete="new-password" placeholder="${b.has_token ? 'Токен сохранён; оставь пустым, чтобы не менять' : 'Вставь токен от BotFather'}"></label>
          <label>Username владельца<input id="bot-owner-username" value="${escapeHtml(b.owner_username ? `@${b.owner_username.replace(/^@/, '')}` : '')}" placeholder="@username"></label>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:12px">
          <label><input id="bot-enabled" type="checkbox" ${b.enabled ? 'checked' : ''}> Включить бота</label>
          <label><input id="bot-voice-replies" type="checkbox" ${b.voice_replies ? 'checked' : ''}> Отвечать голосовыми сообщениями</label>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
          <button class="btn" id="save-bot-config">Сохранить настройки бота</button>
          <button class="small-btn" id="refresh-bot-status">↻ Обновить статус</button>
        </div>
        <div class="notice" style="margin-top:12px">
          <b>Статус:</b> ${b.enabled ? 'включён' : 'выключен (доступны только /start и /id для настройки)'} · ${b.has_token ? 'токен сохранён' : 'токен не задан'} ${b.username ? `· @${escapeHtml(b.username)}` : ''}<br>
          ${b.has_token && b.username ? `Ссылка для телефона и приглашения пользователей: <a href="https://t.me/${encodeURIComponent(b.username)}" target="_blank" rel="noreferrer">https://t.me/${escapeHtml(b.username)}</a>` : 'После сохранения токена плагин проверит его через getMe и покажет username.'}
        </div>
        ${b.last_error ? `<div class="notice error" style="margin-top:10px">Ошибка Bot API: ${escapeHtml(b.last_error)}</div>` : ''}
      </section>
      <section class="panel" style="margin-top:16px">
        <div class="eyebrow">ACCESS CONTROL</div>
        <h2 class="section-title">Разрешённые пользователи</h2>
        <p class="muted">Пользователь должен хотя бы один раз открыть бота и нажать Start. До одобрения Astra не будет вести с ним диалог.</p>
        <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
          <label>Username пользователя<input id="bot-user-id" placeholder="@username"></label>
          <label>Уровень доступа<select id="bot-user-role"><option value="trusted">Доверенный — общение и запросы на отправку с подтверждением владельца</option><option value="limited">Ограниченный — только общение с Astra</option></select></label>
        </div>
        <button class="btn" id="add-bot-user" style="margin-top:10px">Добавить пользователя</button>
        <h3 style="margin:18px 0 8px">Ожидают одобрения (${pending.length})</h3>
        ${pending.length ? pending.map(([id,user])=>`<div class="notice" style="display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap;margin:8px 0"><span>${escapeHtml(botUserLabel(id,user))}</span><span><button class="small-btn" data-bot-approve="${escapeHtml(id)}" data-role="trusted">Доверенный</button> <button class="small-btn" data-bot-approve="${escapeHtml(id)}" data-role="limited">Только чат</button> <button class="small-btn" data-bot-reject="${escapeHtml(id)}">Отклонить</button></span></div>`).join('') : '<div class="muted">Заявок пока нет.</div>'}
        <h3 style="margin:18px 0 8px">Доступ выдан (${allowed.length})</h3>
        ${allowed.length ? allowed.map(([id,role])=>`<div class="notice" style="display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap;margin:8px 0"><span>${escapeHtml(botUserLabel(id,b.known_users?.[id]))} · ${role === 'owner' ? 'Владелец' : role === 'trusted' ? 'Доверенный' : 'Ограниченный'}</span>${role !== 'owner' ? `<button class="small-btn" data-bot-remove="${escapeHtml(id)}">Удалить доступ</button>` : '<span class="muted">Главный владелец</span>'}</div>`).join('') : '<div class="muted">Пока никому не выдан доступ.</div>'}
        <h3 style="margin:18px 0 8px">Известные пользователи (${known.length})</h3>
        <div class="muted" style="font-size:12px">Только пользователи, которые уже запускали бота. Astra может отправлять им сообщения лишь после отдельного подтверждения владельца.</div>
        ${known.length ? known.map(([id,user])=>`<div class="notice" style="margin:8px 0"><div><b>${escapeHtml(botUserLabel(id,user))}</b></div><label style="display:block;margin-top:8px">Память этого диалога<textarea data-bot-memory="${escapeHtml(id)}" rows="2" maxlength="4000" placeholder="Заметки, предпочтения и контекст…">${escapeHtml(b.bot_memories?.[id] || '')}</textarea></label><label style="display:block;margin-top:8px">Стиль общения<select data-bot-style="${escapeHtml(id)}"><option value="default" ${(b.bot_styles?.[id] || 'default')==='default'?'selected':''}>Общий стиль</option><option value="natural" ${b.bot_styles?.[id]==='natural'?'selected':''}>Естественный</option><option value="friendly" ${b.bot_styles?.[id]==='friendly'?'selected':''}>Дружелюбный</option><option value="formal" ${b.bot_styles?.[id]==='formal'?'selected':''}>Деловой</option><option value="concise" ${b.bot_styles?.[id]==='concise'?'selected':''}>Краткий</option><option value="warm" ${b.bot_styles?.[id]==='warm'?'selected':''}>Тёплый</option></select></label><button class="small-btn" style="margin-top:8px" data-save-bot-context="${escapeHtml(id)}">Сохранить контекст</button></div>`).join('') : '<div class="muted">Список пока пуст.</div>'}
        <div class="notice" style="margin-top:14px"><b>Отправка сообщений:</b> <code>/send @username | текст</code> отправляет от имени бота пользователю, который нажал Start. <code>/send-account @username | текст</code> отправляет от твоего личного аккаунта в существующий диалог. В обоих случаях владелец подтверждает отправку кнопкой. Bot API не может первым начать личный диалог с человеком.</div>
      </section>
      <div class="notice" style="margin-top:12px" role="status">${escapeHtml(state.message)}</div>
    `;
  }

  function navigation() {
    const items = [
      ['home', '⌂', 'Главная'],
      ['messages', '◈', 'Сообщения'],
      ['automation', '⟳', 'Автоматизация'],
      ['voice', '♫', 'Голос Astra'],
      ['bot', '✧', 'Telegram-бот'],
      ['settings', '⚙', 'Настройки']
    ];

    return items.map(([id, icon, title]) => `
      <button class="nav ${state.activeTab === id ? 'active' : ''}"
              data-tab="${id}">
        ${icon}&nbsp;&nbsp; ${title}
      </button>
    `).join('');
  }

function authContent() {
    if (state.connection === 'authorized') {
      return `
        <section class="panel">
          <button class="back" id="back-home">← На главную</button>
          <div class="eyebrow">TELEGRAM ACCOUNT</div>
          <h2 class="section-title">Аккаунт подключён</h2>
          <div class="status-line">
            <span>Статус авторизации</span>
            <span class="status-pill good">Авторизован</span>
          </div>
          <p class="muted">
            Личный Telegram подключён к Astra. Сессия защищена Windows DPAPI.
          </p>
${state.confirmDisconnect ? `
  <div class="notice">
    Ты действительно хочешь отключить Telegram?
  </div>
  <button class="btn btn-danger" id="confirm-disconnect">
    Да, отключить Telegram
  </button>
  <button class="btn btn-secondary" id="cancel-disconnect">
    Отмена
  </button>
` : `
  <button class="btn btn-danger" id="disconnect-account"
          ${state.busy ? 'disabled' : ''}>
    Отключить Telegram
  </button>
`}
          <div class="notice ${state.messageError ? 'error' : ''}"
               role="status" aria-live="polite">${escapeHtml(state.message)}</div>
        </section>
      `;
    }

    let fields = '';

    if (state.authStep === 'phone') {
      fields = `
        <div class="field">
          <label for="phone">НОМЕР ТЕЛЕФОНА</label>
          <input id="phone" type="tel" autocomplete="tel"
                 placeholder="+7 000 000-00-00"
                 value="${escapeHtml(state.phone)}">
        </div>
        <button class="btn" id="request-code" ${state.busy ? 'disabled' : ''}>
          ${state.busy ? 'Подключаемся…' : 'Подключить и запросить код'}
        </button>
	<button class="btn btn-secondary" id="start-qr">
  	Войти по QR-коду
	</button>
      `;
} else if (state.authStep === 'qr') {
  fields = `
    <div class="qr-card">
      <p class="muted">
        Открой Telegram на телефоне, перейди в
        Настройки → Устройства → Подключить устройство
        и отсканируй этот QR-код.
      </p>

      ${state.qrSvg ? `
        <div class="qr-image">
          ${state.qrSvg}
        </div>
      ` : `
        <p class="muted">Создаём QR-код…</p>
      `}

      <div class="qr-time">
        ${state.qrRemaining > 0
          ? `Код действителен ещё ${state.qrRemaining} сек.`
          : 'Обновляем QR-код…'}
      </div>
    </div>

    <button class="btn" id="refresh-qr" ${state.busy ? 'disabled' : ''}>
      Обновить QR-код
    </button>

    <button class="btn btn-secondary" id="back-phone">
      Вернуться к входу по телефону
    </button>
  `;
    } else if (state.authStep === 'code') {
      fields = `
        <div class="field">
          <label for="code">КОД ПОДТВЕРЖДЕНИЯ TELEGRAM</label>
          <input id="code" inputmode="numeric" autocomplete="one-time-code"
                 placeholder="Введи код из Telegram"
                 value="${escapeHtml(state.code)}">
        </div>
        <button class="btn" id="submit-code" ${state.busy ? 'disabled' : ''}>
          Проверить код
        </button>
        <button class="btn btn-secondary" id="back-phone">Изменить номер</button>
      `;
    } else {
      fields = `
        <div class="field">
          <label for="password">ПАРОЛЬ ДВУХЭТАПНОЙ ЗАЩИТЫ</label>
          <input id="password" type="password"
                 autocomplete="current-password"
                 placeholder="Пароль 2FA"
                 value="">
        </div>
        ${state.hint ? `<p class="muted">Подсказка Telegram: ${escapeHtml(state.hint)}</p>` : ''}
        <button class="btn" id="submit-password" ${state.busy ? 'disabled' : ''}>
          Подтвердить пароль
        </button>
        <button class="btn btn-secondary" id="back-phone">Начать заново</button>
      `;
    }

    return `
      <section class="panel">
        <button class="back" id="back-home">← На главную</button>
        <div class="eyebrow">TELEGRAM ACCOUNT</div>
        <h2 class="section-title">Подключение аккаунта</h2>
        <p class="muted">
          Подключи личный Telegram-аккаунт, чтобы Astra могла работать
          с выбранными чатами и голосовыми сообщениями.
        </p>
        <div class="status-line">
          <span>Защищённое соединение</span>
<span class="status-pill ${state.connection === 'authorized' ? 'good' : ''}">
${state.connection === 'authorized' ? 'Авторизован' :
  state.connection === 'connecting' ? 'Подключение…' :
  state.connection === 'connected' ? 'Код отправлен' : 'Ожидание'}
</span>
        </div>
        ${fields}
        <div class="notice ${state.messageError ? 'error' : ''}"
             role="status" aria-live="polite">${escapeHtml(state.message)}</div>
        <p class="muted">
          Сессия хранится локально и защищается Windows DPAPI.
          Не передавай коды и пароль 2FA другим людям.
        </p>
      </section>
    `;
  }

  function homeContent() {
    return `
      <div class="grid">
        <section class="panel hero">
          <div class="hero-mark">✦ YOUR PERSONAL AI ASSISTANT</div>
          <h2>Твой Telegram. Твоя Astra.</h2>
          <p class="muted">
            Управляй перепиской, контактами и автоматизацией Telegram
            в одном пространстве.
          </p>
          <button class="btn" id="open-connection" style="max-width:260px;margin-top:12px">
            Подключить Telegram
          </button>
        </section>

        <section class="panel tile" data-tab="messages">
          <div class="tile-icon" style="color:#43eee0">◈</div>
          <div class="tile-title">Сообщения</div>
          <div class="tile-desc">Чаты, контакты и переписка</div>
        </section>

        <section class="panel tile" data-tab="automation">
          <div class="tile-icon" style="color:#43eee0">⟳</div>
          <div class="tile-title">Автоматизация</div>
          <div class="tile-desc">Правила и автоответчик</div>
        </section>

        <section class="panel tile" data-tab="bot">
          <div class="tile-icon" style="color:#b38aff">✧</div>
          <div class="tile-title">Telegram-бот</div>
          <div class="tile-desc">Управление Astra из Telegram</div>
        </section>

        <section class="panel" style="grid-column:1/-1">
          <div class="eyebrow">SYSTEM STATUS</div>
          <h3 class="section-title">Состояние системы</h3>
          <div class="status-line">
            <span>Интерфейс Astra</span>
            <span class="status-pill good">Готов</span>
          </div>
          <div class="status-line">
            <span>Telegram аккаунт</span>
            <span class="status-pill">${state.connection === 'authorized' ? 'Подключён' : 'Не подключён'}</span>
          </div>
        </section>
      </div>
    `;
  }

function settingsContent() {
  return `
    <div class="grid">
      <section class="panel" style="grid-column:1/-1">
        <div class="eyebrow">MESSAGE ASSISTANT</div>
        <h2 class="section-title">Мониторинг и стиль общения</h2>
        <p class="muted">Astra проверяет входящие личные сообщения, учитывает сохранённую память каждого чата и выбранный стиль ответа.</p>
        <label style="display:block;margin:16px 0 8px">Стиль общения</label>
        <select id="reply-style" style="width:100%;max-width:420px;padding:11px;border-radius:10px;background:#090e1d;color:var(--text);border:1px solid var(--border)">
          ${[['natural','Естественный'],['friendly','Дружелюбный'],['formal','Деловой'],['concise','Краткий'],['warm','Тёплый и поддерживающий']].map(([v,t])=>`<option value="${v}" ${state.replyStyle===v?'selected':''}>${t}</option>`).join('')}
        </select>
        <button class="small-btn" id="save-reply-style" style="margin-top:9px">Сохранить стиль</button>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:16px">
          <button class="btn ${state.messageAssistantEnabled ? '' : 'secondary'}" id="toggle-message-assistant" ${state.busy ? 'disabled' : ''}>${state.messageAssistantEnabled ? 'Мониторинг включён' : 'Включить мониторинг'}</button>
          <span class="status-pill ${state.messageAssistantEnabled ? 'good' : ''}">${state.messageAssistantEnabled ? 'Активен' : 'Отключён'}</span>
        </div>
        ${state.notificationStatus ? `<div class="notice error" style="margin-top:12px">${escapeHtml(state.notificationStatus)}</div>` : ''}
        <div class="notice ${state.messageError ? 'error' : ''}" style="margin-top:12px" role="status" aria-live="polite">${escapeHtml(state.message)}</div>
      </section>
      ${authContent()}
    </div>
  `;
}

  function messagesContent() {
    const selected = state.chats.find(chat => chat.id === state.selectedChatId);
    const query = (state.messageSearch || '').trim().toLocaleLowerCase();
    const visibleMessages = query
      ? state.chatMessages.filter(message => (message.text || message.media_label || '').toLocaleLowerCase().includes(query))
      : state.chatMessages;
    return `
      <section class="panel">
        <div class="eyebrow">TELEGRAM MESSENGER</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <div><h2 class="section-title">Чаты и переписка</h2><p class="muted">История, быстрый поиск и действия с сообщениями.</p></div>
          <button class="small-btn" id="refresh-chats" ${state.chatsBusy ? 'disabled' : ''}>${state.chatsBusy ? 'Обновление…' : '↻ Обновить чаты'}</button>
        </div>
        ${state.messagesNotice ? `<div class="notice">${escapeHtml(state.messagesNotice)}</div>` : ''}
        <div class="messenger-layout" style="margin-top:14px">
          <div class="chat-list">
            ${state.chats.length ? state.chats.map(chat => `
              <button class="chat-item ${chat.id === state.selectedChatId ? 'active' : ''}" data-chat-id="${escapeHtml(chat.id)}">
                <div class="chat-title">${escapeHtml(chat.title)}</div>
                <div class="chat-preview">${escapeHtml(chat.last_message || 'Нет текстового сообщения')}</div>
              </button>
            `).join('') : `<div class="muted">${state.chatsBusy ? 'Получаем список диалогов…' : 'Чаты пока не загружены. Нажми «Обновить чаты».'}</div>`}
          </div>
          <div class="conversation">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:10px">
              <strong>${selected ? escapeHtml(selected.title) : 'Выбери чат слева'}</strong>
              ${selected ? `<button class="small-btn" id="refresh-history" ${state.chatBusy ? 'disabled' : ''}>↻ Обновить</button>` : ''}
            </div>
            ${selected ? `<div class="message-toolbar"><input id="message-search" value="${escapeHtml(state.messageSearch)}" placeholder="Поиск в загруженной истории…"><span class="muted" style="font-size:11px">${visibleMessages.length} / ${state.chatMessages.length}</span><button class="small-btn" id="clear-message-search">Сброс</button></div>` : ''}
            <div class="message-list-wrap">
              <div class="message-list" id="message-list" data-chat-id="${escapeHtml(state.selectedChatId)}">
                ${selected ? (visibleMessages.length ? visibleMessages.map(message => `
                  <div class="message-bubble ${message.outgoing ? 'outgoing' : ''}">
                    <div>${escapeHtml(message.text || (message.is_voice ? 'Голосовое сообщение' : (message.media_label || 'Медиа-сообщение без текста')))}</div>
                    ${message.is_voice ? `
                      <div style="margin-top:9px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                        <button class="small-btn" data-play-voice="${message.id}" ${state.voiceLoadingId === message.id ? 'disabled' : ''}>${state.voiceLoadingId === message.id ? 'Загружаю…' : '▶ Прослушать'}</button>
                        <button class="small-btn" data-transcribe-voice="${message.id}" ${state.voiceTranscribingId === message.id ? 'disabled' : ''}>${state.voiceTranscribingId === message.id ? 'Расшифровываю…' : 'Распознавание недоступно'}</button>
                        ${state.voiceAudio?.messageId === message.id ? `<audio controls preload="metadata" style="width:min(100%,360px)" src="data:audio/ogg;base64,${state.voiceAudio.data}"></audio>` : ''}
                        ${state.voiceTranscriptByMessage[message.id] ? `<div class="notice" style="width:100%;white-space:pre-wrap">${escapeHtml(state.voiceTranscriptByMessage[message.id])}</div>` : ''}
                      </div>` : ''}
                    ${message.text ? `<div class="message-actions"><button data-copy-message="${escapeHtml(message.text)}">Копировать</button><button data-reply-message="${escapeHtml(message.text)}">Ответить</button></div>` : ''}
                  </div>
                `).join('') : `<div class="muted">${query ? 'По этому запросу ничего не найдено.' : (state.chatBusy ? 'Загружаем историю…' : 'Сообщений нет или история ещё не загружена.')}</div>`) : `<div class="muted">Открой диалог, чтобы увидеть историю сообщений.</div>`}
              </div>
              ${selected ? `<button class="jump-latest" id="jump-latest" style="display:none">↓ К последним</button>` : ''}
            </div>
            ${selected ? `<div style="margin:10px 0 8px"><label class="muted" for="chat-memory" style="display:block;margin-bottom:5px">Память этого чата (заметки для контекста Astra)</label><textarea id="chat-memory" rows="2" maxlength="4000" placeholder="Например: предпочитает короткие ответы; работает над проектом…">${escapeHtml(state.chatMemories[state.selectedChatId] || '')}</textarea><button class="small-btn" id="save-chat-memory" style="margin-top:6px">Сохранить память чата</button><label style="display:block;margin-top:12px">Стиль именно для этого чата</label><select id="chat-reply-style" style="width:100%;max-width:360px;padding:9px;border-radius:9px;background:#090e1d;color:var(--text);border:1px solid var(--border)">${[['default','Как в общих настройках'],['natural','Естественный'],['friendly','Дружелюбный'],['formal','Деловой'],['concise','Краткий'],['warm','Тёплый']].map(([v,t])=>`<option value="${v}" ${(state.chatReplyStyles[state.selectedChatId] || 'default')===v?'selected':''}>${t}</option>`).join('')}</select><button class="small-btn" id="save-chat-style" style="margin-top:6px">Сохранить стиль чата</button></div>` : ''}
            <div class="compose">
              <textarea id="chat-draft" rows="1" placeholder="Написать сообщение… (Enter — отправить, Shift+Enter — новая строка)" ${selected ? '' : 'disabled'}>${escapeHtml(state.chatDraft)}</textarea>
              <button class="btn" id="send-chat-message" ${!selected || state.chatBusy ? 'disabled' : ''}>${state.chatBusy ? 'Отправка…' : 'Отправить'}</button>
              <button class="small-btn" id="send-chat-voice" ${!selected || state.chatBusy ? 'disabled' : ''}>♫ Озвучить в Astra</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async function loadAutomationChats(force = false) {
    if (state.automationChatsLoaded && !force) return;
    try {
      const result = await backend('telegram_list_dialogs', {});
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось загрузить чаты Telegram.');
      state.automationChats = Array.isArray(result.chats) ? result.chats : [];
      state.automationChatsLoaded = true;
    } catch (error) {
      state.notificationStatus = error.message || 'Не удалось загрузить список чатов.';
    }
    render();
  }

  function automationContent() {
    const modes = [
      ['confirm', '◈ С подтверждением', 'Astra показывает входящее сообщение и готовит черновик. Отправка — только после твоего нажатия.'],
      ['automatic', '✦ Полностью автоматически', 'Astra генерирует ответ через PluginHostService и отправляет его в Telegram без подтверждения.'],
      ['hybrid', '⟳ Гибридный режим', 'Выбранные ниже чаты будут получать автоответы Astra, остальные — готовые черновики для проверки.']
    ];
    return `
      <div class="grid">
        <section class="panel" style="grid-column:1/-1">
          <div class="eyebrow">AUTOMATION RULES</div>
          <h2 class="section-title">Режим обработки входящих сообщений</h2>
          <p class="muted">Выбери общий сценарий работы Telegram-помощника. Настройка сохраняется локально на этом компьютере.</p>
          <div class="option-list">
            ${modes.map(([id, title, description]) => `
              <button class="option-card ${state.replyMode === id ? 'active' : ''}" data-reply-mode="${id}" ${state.busy ? 'disabled' : ''}>
                <strong>${title}</strong><span>${description}</span>
              </button>
            `).join('')}
          </div>
          <div class="option-status">Выбран режим: ${({confirm:'С подтверждением',automatic:'Полностью автоматически',hybrid:'Гибридный'})[state.replyMode]}</div>
          ${state.replyMode === 'hybrid' ? `
            <div style="margin-top:20px">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
                <div><strong>Чаты с автоматическими ответами</strong><p class="muted" style="margin:5px 0 0">Отметь контакты, для которых разрешён автоматический режим.</p></div>
                <button class="small-btn" id="refresh-automation-chats">↻ Обновить чаты</button>
              </div>
              <div style="margin-top:12px;display:grid;gap:8px">
                ${state.automationChats.length ? state.automationChats.map(chat => `
                  <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:#090e1d">
                    <input type="checkbox" data-auto-chat-id="${escapeHtml(chat.id)}" ${state.autoReplyChatIds.includes(chat.id) ? 'checked' : ''}>
                    <span style="min-width:0"><strong>${escapeHtml(chat.title || 'Telegram чат')}</strong><small class="muted" style="display:block;overflow:hidden;text-overflow:ellipsis">${escapeHtml(chat.last_message || 'Нет последнего сообщения')}</small></span>
                  </label>
                `).join('') : `<div class="notice">Список чатов пока не загружен. Нажми «Обновить чаты».</div>`}
              </div>
            </div>
          ` : ''}
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:20px">
            <button class="btn" id="save-automation-settings" ${state.busy ? 'disabled' : ''}>Сохранить настройки</button>
            <button class="small-btn" id="toggle-message-assistant" ${state.busy ? 'disabled' : ''}>${state.messageAssistantEnabled ? 'Отключить мониторинг' : 'Включить мониторинг'}</button>
          </div>
          <div style="margin-top:18px;padding:14px;border:1px solid var(--border);border-radius:12px">
            <strong>Расписание автоматических ответов</strong>
            <p class="muted">Расписание действует по локальному времени Windows. Вне выбранного окна новые автоматические ответы не отправляются; остаются черновики.</p>
            <label style="display:flex;gap:9px;align-items:center;margin:10px 0"><input id="schedule-enabled" type="checkbox" ${state.scheduleEnabled ? 'checked' : ''}> Ограничить автоответы расписанием</label>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <label>С <input id="schedule-start" type="time" value="${escapeHtml(state.scheduleStart)}"></label>
              <label>До <input id="schedule-end" type="time" value="${escapeHtml(state.scheduleEnd)}"></label>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">${[['1','Пн'],['2','Вт'],['3','Ср'],['4','Чт'],['5','Пт'],['6','Сб'],['7','Вс']].map(([v,t])=>`<label><input type="checkbox" data-schedule-day="${v}" ${state.scheduleDays.includes(Number(v)) ? 'checked' : ''}> ${t}</label>`).join('')}</div>
          </div>
          <div class="notice" style="margin-top:14px">
            <strong>Генерация ответов подключена через Astra PluginHostService.</strong><br>
            В режиме подтверждения Astra создаёт черновик, который можно отредактировать. В автоматическом режиме ответ отправляется самостоятельно. В гибридном режиме это определяется отдельно для каждого чата. Если генерация или отправка завершается ошибкой, сообщение возвращается в ручную очередь — пустые и фиктивные ответы не отправляются.
            <div style="margin-top:8px;font-size:11px">Для генерации Astra получает текст нового сообщения и до 12 последних текстовых сообщений выбранного диалога. Входящий текст рассматривается как недоверенные данные.</div>
          </div>
          ${state.notificationStatus ? `<div class="notice error" style="margin-top:10px">${escapeHtml(state.notificationStatus)}</div>` : ''}
          <div class="notice ${state.messageError ? 'error' : ''}" style="margin-top:10px" role="status" aria-live="polite">${escapeHtml(state.message)}</div>
        </section>
      </div>
    `;
  }

  function voiceContent() {
    return `
      <section class="panel">
        <div class="eyebrow">ASTRA VOICE</div>
        <h2 class="section-title">Голос Astra</h2>
        <p class="muted">Внешний Speech API и отдельный API-ключ больше не используются. Ответы Telegram отправляются текстом, а Astra параллельно произносит их выбранным штатным голосом на этом компьютере.</p>
        <div class="notice" style="margin-top:12px">Для входящих сообщений отправляй текст. Распознавание Telegram voice notes штатными средствами Astra пока недоступно через API плагина.</div>
        <div class="notice" style="margin-top:12px">Идентификатор штатного голоса задаётся в настройках голоса Astra. Если он не задан, используется голос по умолчанию.</div>
        <div class="notice ${state.messageError ? 'error' : ''}" style="margin-top:10px" role="status" aria-live="polite">${escapeHtml(state.message)}</div>
      </section>`;
  }

  function placeholderContent() {
    const pages = {
      messages: ['Сообщения', 'Здесь появятся список Telegram-чатов, контакты и окно переписки.'],
      bot: ['Telegram-бот', 'Отдельный BotFather-бот, доступ пользователей и удалённое общение с Astra.'],
      settings: ['Настройки', 'Здесь будут прокси, безопасность, подключение и параметры поведения Astra.']
    };

    const [title, description] = pages[state.activeTab] || pages.settings;

    return `
      <section class="panel">
        <div class="eyebrow">ASTRA TELEGRAM VOICE</div>
        <h2 class="section-title">${title}</h2>
        <p class="muted">${description}</p>
        <div class="notice">Раздел подготовлен. Подключим его на следующих этапах разработки.</div>
      </section>
    `;
  }

  function startMessageRefreshPolling() {
    if (messageHistoryRefreshTimer) clearInterval(messageHistoryRefreshTimer);
    if (dialogPreviewRefreshTimer) clearInterval(dialogPreviewRefreshTimer);
    messageHistoryRefreshTimer = null;
    dialogPreviewRefreshTimer = null;
    if (state.activeTab !== 'messages') return;
    messageHistoryRefreshTimer = setInterval(async () => {
      if (document.hidden || state.activeTab !== 'messages' || !state.selectedChatId || state.chatBusy || historyRefreshInFlight) return;
      historyRefreshInFlight = true;
      const chatId = state.selectedChatId;
      try {
        const result = await backend('telegram_get_messages', { chat_id: chatId });
        if (result.status === 'ok' && state.selectedChatId === chatId && state.activeTab === 'messages') {
          state.chatMessages = Array.isArray(result.messages) ? result.messages : state.chatMessages;
          if (!document.hidden) render();
        }
      } catch (error) {
        console.warn('Automatic Telegram history refresh failed:', error);
      } finally {
        historyRefreshInFlight = false;
      }
    }, 7000);
    dialogPreviewRefreshTimer = setInterval(async () => {
      if (document.hidden || state.activeTab !== 'messages' || state.chatsBusy) return;
      try {
        const result = await backend('telegram_list_dialogs', {});
        if (result.status === 'ok') {
          state.chats = Array.isArray(result.chats) ? result.chats : state.chats;
          render();
        }
      } catch (error) {
        console.warn('Automatic Telegram dialog refresh failed:', error);
      }
    }, 30000);
  }

  function stopMessageRefreshPolling() {
    if (messageHistoryRefreshTimer) clearInterval(messageHistoryRefreshTimer);
    if (dialogPreviewRefreshTimer) clearInterval(dialogPreviewRefreshTimer);
    messageHistoryRefreshTimer = null;
    dialogPreviewRefreshTimer = null;
  }

  async function loadDialogs() {
    state.chatsBusy = true;
    state.messagesNotice = '';
    render();
    try {
      const result = await backend('telegram_list_dialogs', {});
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось загрузить чаты.');
      state.chats = Array.isArray(result.chats) ? result.chats : [];
      if (!state.chats.some(chat => chat.id === state.selectedChatId)) {
        state.selectedChatId = state.chats[0]?.id || '';
      }
      if (state.selectedChatId) await loadChatHistory(false);
    } catch (error) {
      state.messagesNotice = error.message || 'Ошибка загрузки диалогов.';
    } finally {
      state.chatsBusy = false;
      render();
    }
  }

  async function loadChatHistory(shouldRender = true) {
    if (!state.selectedChatId || state.chatBusy) return;
    state.chatBusy = true;
    if (shouldRender) render();
    try {
      const result = await backend('telegram_get_messages', { chat_id: state.selectedChatId });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось загрузить историю.');
      state.chatMessages = Array.isArray(result.messages) ? result.messages : [];
    } catch (error) {
      state.messagesNotice = error.message || 'Ошибка загрузки истории.';
    } finally {
      state.chatBusy = false;
      if (shouldRender) render();
    }
  }

  async function sendChatMessage() {
    const text = state.chatDraft.trim();
    if (!state.selectedChatId || !text || state.chatBusy) return;
    state.chatBusy = true;
    render();
    try {
      const result = await backend('telegram_send_text', { chat_id: state.selectedChatId, text });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось отправить сообщение.');
      state.chatDraft = '';
      await loadChatHistory(false);
      state.messagesNotice = 'Сообщение отправлено.';
    } catch (error) {
      state.messagesNotice = error.message || 'Ошибка отправки сообщения.';
    } finally {
      state.chatBusy = false;
      render();
    }
  }

  function incomingPromptContent() {
    if (!state.incomingPrompt) return '';
    const item = state.incomingPrompt;
    return `
      <section class="panel" style="margin-bottom:16px;border:1px solid rgba(67,238,224,.45)">
        <div class="eyebrow">НОВОЕ СООБЩЕНИЕ TELEGRAM</div>
        <strong>${escapeHtml(item.sender || 'Неизвестный отправитель')}</strong>
        <p style="white-space:pre-wrap;line-height:1.5;margin:9px 0">${escapeHtml(item.text || (item.is_voice ? 'Входящее голосовое сообщение' : 'Пришло сообщение без текста или медиа-вложение.'))}</p>
        ${item.is_voice ? `<div class="notice" style="margin:8px 0">${item.transcribed ? 'Голосовое сообщение автоматически расшифровано; ниже показан распознанный текст.' : 'Это голосовое сообщение. Без успешной расшифровки Astra не будет создавать ответ.'}</div>` : ''}
        <label class="muted" for="reply-draft">Как ответить?</label>
        <textarea id="reply-draft" rows="3" style="width:100%;margin-top:7px" placeholder="Напиши ответ…">${escapeHtml(state.replyDraft)}</textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <button class="btn" id="confirm-send-reply" ${!state.replyDraft.trim() ? 'disabled' : ''}>Отправить ответ</button>
          <button class="small-btn" id="dismiss-incoming">Позже</button>
        </div>
        ${item.draft_error ? `<div class="notice error" style="margin-top:9px">${escapeHtml(item.draft_error)}</div>` : ''}
        <div class="muted" style="font-size:11px;margin-top:8px">Astra подготовила черновик. Проверь его, при необходимости отредактируй и отправь.</div>
      </section>`;
  }

  async function playVoiceMessage(messageId) {
    if (!state.selectedChatId || state.voiceLoadingId !== null) return;
    const numericMessageId = Number(messageId);
    if (!Number.isSafeInteger(numericMessageId) || numericMessageId <= 0) return;
    state.voiceLoadingId = numericMessageId;
    state.messagesNotice = '';
    render();
    try {
      const result = await backend('telegram_download_voice', {
        chat_id: state.selectedChatId,
        message_id: numericMessageId
      });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось загрузить голосовое.');
      state.voiceAudio = { messageId: numericMessageId, data: result.data_base64 };
      state.messagesNotice = `Голосовое загружено (${Math.round((result.size || 0) / 1024)} КБ). Нажми ▶ в плеере.`;
    } catch (error) {
      state.messagesNotice = error.message || 'Ошибка загрузки голосового.';
    } finally {
      state.voiceLoadingId = null;
      render();
    }
  }

  async function pollIncomingNotifications() {
    if (!state.messageAssistantEnabled || notificationPollInFlight || state.incomingPrompt) return;
    notificationPollInFlight = true;
    try {
      const result = await backend('telegram_poll_notifications', {});
      if (result.status === 'ok') {
        state.notificationStatus = '';
        if (result.auto_sent) {
          setMessage(result.message || 'Ответ Astra отправлен автоматически.');
          render();
        }
        if (Array.isArray(result.notifications) && result.notifications.length) {
          const item = result.notifications[0];
          state.incomingPrompt = item;
          state.replyDraft = item.draft || '';
          if (item.draft_error) state.notificationStatus = `Черновик не создан: ${item.draft_error}`;
          render();
          // Голосом уведомляем владельца о новом сообщении и спрашиваем,
          // какой ответ отправить. Сам Telegram-бот остаётся текстовым.
          const sender = String(item.sender || 'Неизвестный отправитель').trim();
          const incoming = String(item.text || (item.is_voice ? 'Голосовое сообщение без распознанного текста.' : 'Сообщение без текста.')).trim();
          const announcement = `Новое сообщение от ${sender}. ${incoming.slice(0, 900)}. Что ответить?`;
          try {
            const speech = await backend('telegram_speak_astra', { text: announcement });
            if (speech.status !== 'ok') {
              state.notificationStatus = speech.message || 'Не удалось озвучить новое сообщение через Astra.';
              render();
            }
          } catch (speechError) {
            state.notificationStatus = speechError.message || 'Не удалось озвучить новое сообщение через Astra.';
            render();
          }
        }
      } else if (result.status === 'not_authorized') {
        state.notificationStatus = 'Telegram не авторизован. Переподключи аккаунт в разделе подключения.';
        render();
      } else if (result.status === 'error' || result.status === 'not_connected') {
        state.notificationStatus = result.message || 'Нет соединения с Telegram. Проверь подключение аккаунта.';
        render();
      }
    } catch (error) {
      console.warn('Telegram notification polling failed:', error);
    } finally {
      notificationPollInFlight = false;
    }
  }

  function startNotificationPolling() {
    if (notificationPollTimer) clearInterval(notificationPollTimer);
    notificationPollTimer = null;
    if (!state.messageAssistantEnabled) return;
    pollIncomingNotifications();
    notificationPollTimer = setInterval(pollIncomingNotifications, 3500);
  }

  async function saveAutomationSettings() {
    state.busy = true;
    render();
    try {
      const result = await backend('telegram_set_automation_settings', {
        reply_mode: state.replyMode,
        auto_reply_chat_ids: state.autoReplyChatIds,
        schedule_enabled: state.scheduleEnabled,
        schedule_start: state.scheduleStart,
        schedule_end: state.scheduleEnd,
        schedule_days: state.scheduleDays
      });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось сохранить автоматизацию.');
      state.replyMode = result.reply_mode || state.replyMode;
      state.scheduleEnabled = result.schedule_enabled === true;
      state.scheduleDays = Array.isArray(result.schedule_days) ? result.schedule_days : state.scheduleDays;
      state.scheduleStart = result.schedule_start || state.scheduleStart;
      state.scheduleEnd = result.schedule_end || state.scheduleEnd;
      state.autoReplyChatIds = Array.isArray(result.auto_reply_chat_ids) ? result.auto_reply_chat_ids : [];
      setMessage('Настройки автоматизации сохранены.');
    } catch (error) {
      setMessage(error.message || 'Ошибка сохранения автоматизации.', true);
    } finally {
      state.busy = false;
      render();
    }
  }

  async function setMessageAssistantEnabled(enabled) {
    state.busy = true;
    render();
    try {
      const result = await backend('telegram_set_message_assistant', { enabled });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось изменить настройку.');
      state.messageAssistantEnabled = result.enabled === true;
      if (!state.messageAssistantEnabled) {
        state.incomingPrompt = null;
        state.replyDraft = '';
        state.notificationStatus = '';
      }
      setMessage(state.messageAssistantEnabled ? 'Мониторинг входящих сообщений включён.' : 'Мониторинг входящих сообщений выключен.');
      startNotificationPolling();
    } catch (error) {
      setMessage(error.message || 'Не удалось сохранить настройку.', true);
    } finally {
      state.busy = false;
      render();
    }
  }

  async function confirmSendReply() {
    const item = state.incomingPrompt;
    const text = state.replyDraft.trim();
    if (!item || !text) return;
    try {
      const result = await backend('telegram_send_text', { chat_id: item.chat_id, text });
      if (result.status !== 'ok') throw new Error(result.message || 'Telegram не отправил ответ.');
      state.incomingPrompt = null;
      state.replyDraft = '';
      setMessage('Ответ отправлен в Telegram.');
      render();
    } catch (error) {
      setMessage(error.message || 'Не удалось отправить ответ.', true);
      render();
    }
  }


async function refreshTelegramConnection() {
  if (connectionPollInFlight) return;
  connectionPollInFlight = true;
  try {
    const result = await backend('telegram_connect', {});
    state.connection = result.status === 'authorized' ? 'authorized' : (result.status === 'ready' ? 'idle' : 'idle');
  } catch (error) {
    state.connection = 'idle';
    console.warn('Telegram connection status check failed:', error);
  } finally {
    connectionPollInFlight = false;
  }
  render();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopMessageRefreshPolling();
  else if (state.activeTab === 'messages') startMessageRefreshPolling();
});

function startConnectionStatusPolling() {
  if (connectionPollTimer) clearInterval(connectionPollTimer);
  void refreshTelegramConnection();
  connectionPollTimer = setInterval(() => {
    if (!document.hidden) void refreshTelegramConnection();
  }, 20000);
}

  function render() {
    const previousMessageList = container.querySelector('#message-list');
    const previousChatId = previousMessageList?.dataset.chatId || '';
    const previousScrollTop = previousMessageList ? previousMessageList.scrollTop : 0;
    const wasNearBottom = previousMessageList
      ? previousMessageList.scrollHeight - previousMessageList.scrollTop - previousMessageList.clientHeight < 90
      : false;
    container.innerHTML = `
      <style>${styles}</style>
      <div class="astra">
        <div class="shell">
          <aside class="sidebar">
            <div class="brand">
              ${logo}
              <div>
                <div class="brand-name">ASTRA</div>
                <div class="brand-sub">TELEGRAM ASSISTANT</div>
              </div>
            </div>
            <div class="nav-label">WORKSPACE</div>
            <div class="nav-list">${navigation()}</div>
            <div class="side-footer">
              <span style="color:#43eee0">✦ ASTRA CORE</span><br>
              Управление Telegram и автоматизацией.
            </div>
          </aside>

          <main class="main">
            <header class="topbar">
              <div>
                <div class="eyebrow">ASTRA CONTROL CENTER</div>
                <h1>${state.activeTab === 'home' ? 'Панель управления' : 'Astra / ' + ({
                  messages:'Сообщения',
                  automation:'Автоматизация',
                  voice:'Голос Astra',
                  bot:'Telegram-бот',
                  settings:'Настройки'
                }[state.activeTab] || '')}</h1>
              </div>
              <div class="top-status" title="Состояние подключения Telegram">
                <span class="dot ${state.connection === 'authorized' ? 'connected' : state.connection === 'connecting' ? 'checking' : ''}"></span>${state.connection === 'authorized' ? 'Telegram подключён' : state.connection === 'connecting' ? 'Подключение Telegram…' : 'Telegram не подключён'}
              </div>
            </header>

${incomingPromptContent()}

${state.activeTab === 'home'
  ? homeContent()
  : state.activeTab === 'settings'
    ? settingsContent()
    : state.activeTab === 'messages'
      ? messagesContent()
      : state.activeTab === 'automation'
          ? automationContent()
          : state.activeTab === 'voice'
            ? voiceContent()
            : state.activeTab === 'bot'
              ? botContent()
              : placeholderContent()}

            <div class="footer">ASTRA TELEGRAM · PRIVATE CONTROL CENTER</div>
          </main>
        </div>
      </div>
    `;

    bindEvents();
    const nextMessageList = container.querySelector('#message-list');
    if (nextMessageList && previousMessageList && previousChatId === state.selectedChatId) {
      nextMessageList.scrollTop = wasNearBottom ? nextMessageList.scrollHeight : previousScrollTop;
    } else if (nextMessageList && state.activeTab === 'messages') {
      nextMessageList.scrollTop = nextMessageList.scrollHeight;
    }
    updateJumpLatestButton();
  }

function updateJumpLatestButton() {
  const list = container.querySelector('#message-list');
  const button = container.querySelector('#jump-latest');
  if (!list || !button) return;
  const away = list.scrollHeight - list.scrollTop - list.clientHeight > 100;
  button.style.display = away ? 'block' : 'none';
}

function bindEvents() {
  // Навигация
  container.querySelectorAll('[data-tab]').forEach(element => {
    element.addEventListener('click', () => {
      if (element.dataset.tab !== 'settings' && state.authStep === 'qr') {
        stopQrPolling();
        state.authStep = 'phone';
        state.qrSvg = '';
        state.qrExpiresAt = 0;
        state.qrRemaining = 0;
      }

state.activeTab = element.dataset.tab;
if (state.activeTab === 'messages') startMessageRefreshPolling(); else stopMessageRefreshPolling();
render();

if (state.activeTab === 'settings') {
  loadAppSettings();
} else if (state.activeTab === 'messages') {
  loadDialogs();
} else if (state.activeTab === 'automation') {
  loadAppSettings();
  if (state.replyMode === 'hybrid') loadAutomationChats();
} else if (state.activeTab === 'bot') {
  loadBotStatus();
}
    });
  });

  const saveBotConfig = container.querySelector('#save-bot-config');
  if (saveBotConfig) saveBotConfig.addEventListener('click', async () => {
    const tokenInput = container.querySelector('#bot-token');
    const ownerInput = container.querySelector('#bot-owner-username');
    const enabledInput = container.querySelector('#bot-enabled');
    const voiceInput = container.querySelector('#bot-voice-replies');
    const enabled = enabledInput?.checked === true;
    const ownerUsername = ownerInput?.value.trim() || '';
    if (enabled && !/^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(ownerUsername)) {
      setMessage('Чтобы включить бота, укажи username владельца в формате @username.', true);
      ownerInput?.focus();
      return;
    }
    const originalLabel = saveBotConfig.textContent;
    saveBotConfig.disabled = true;
    saveBotConfig.textContent = 'Сохранение…';
    try {
      const result = await backend('telegram_bot_save_config', {
        token: tokenInput?.value.trim() || '',
        owner_username: ownerUsername.replace(/^@/, ''),
        enabled,
        voice_replies: voiceInput?.checked === true
      });
      if (result.status !== 'ok') throw new Error(result.message || `Не удалось сохранить настройки бота (${result.status || 'ошибка'}).`);
      setMessage('Настройки бота сохранены. Проверка Bot API выполняется в фоне.');
      await loadBotStatus();
    } catch (error) {
      setMessage(error.message || 'Ошибка настройки бота.', true);
      render();
    } finally {
      if (saveBotConfig.isConnected) {
        saveBotConfig.disabled = false;
        saveBotConfig.textContent = originalLabel;
      }
    }
  });
  const refreshBotStatus = container.querySelector('#refresh-bot-status');
  if (refreshBotStatus) refreshBotStatus.addEventListener('click', loadBotStatus);
  const addBotUser = container.querySelector('#add-bot-user');
  if (addBotUser) addBotUser.addEventListener('click', async () => {
    const userId = container.querySelector('#bot-user-id')?.value.trim().replace(/^@/, '') || '';
    const role = container.querySelector('#bot-user-role')?.value || 'trusted';
    try {
      const result = await backend('telegram_bot_manage_user', { action:'allow', user_id:userId, role });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось добавить пользователя.');
      setMessage('Доступ пользователю выдан.');
      await loadBotStatus();
    } catch (error) { setMessage(error.message || 'Ошибка добавления пользователя.', true); render(); }
  });
  container.querySelectorAll('[data-save-bot-context]').forEach(button => button.addEventListener('click', async () => {
    const id = button.dataset.saveBotContext;
    const memory = container.querySelector(`[data-bot-memory="${id}"]`)?.value || '';
    const style = container.querySelector(`[data-bot-style="${id}"]`)?.value || 'default';
    try {
      const memoryResult = await backend('telegram_set_chat_memory', { chat_id:`bot:${id}`, memory });
      if (memoryResult.status !== 'ok') throw new Error(memoryResult.message || 'Не удалось сохранить память диалога.');
      const styleResult = await backend('telegram_set_chat_style', { chat_id:`bot:${id}`, reply_style:style });
      if (styleResult.status !== 'ok') throw new Error(styleResult.message || 'Не удалось сохранить стиль диалога.');
      setMessage('Память и стиль Telegram-бота сохранены.'); await loadBotStatus();
    } catch (error) { setMessage(error.message || 'Ошибка сохранения контекста.', true); render(); }
  }));
  container.querySelectorAll('[data-bot-approve]').forEach(button => button.addEventListener('click', async () => {
    try {
      const result = await backend('telegram_bot_manage_user', { action:'allow', user_id:button.dataset.botApprove, role:button.dataset.role || 'trusted' });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось одобрить пользователя.');
      setMessage('Пользователь получил доступ.'); await loadBotStatus();
    } catch (error) { setMessage(error.message || 'Ошибка одобрения.', true); render(); }
  }));
  container.querySelectorAll('[data-bot-reject], [data-bot-remove]').forEach(button => button.addEventListener('click', async () => {
    const id = button.dataset.botReject || button.dataset.botRemove;
    try {
      const result = await backend('telegram_bot_manage_user', { action:'remove', user_id:id, role:'limited' });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось удалить доступ.');
      setMessage('Доступ пользователя удалён.'); await loadBotStatus();
    } catch (error) { setMessage(error.message || 'Ошибка удаления доступа.', true); render(); }
  }));

  const styleSelect = container.querySelector('#reply-style');
  const saveStyle = container.querySelector('#save-reply-style');
  if (saveStyle && styleSelect) saveStyle.addEventListener('click', async () => {
    try {
      const result = await backend('telegram_set_reply_style', { reply_style: styleSelect.value });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось сохранить стиль.');
      state.replyStyle = result.reply_style || styleSelect.value;
      setMessage('Стиль общения сохранён.');
    } catch (error) { setMessage(error.message || 'Ошибка сохранения стиля.', true); }
    render();
  });
  const chatStyle = container.querySelector('#chat-reply-style');
  const saveChatStyle = container.querySelector('#save-chat-style');
  if (saveChatStyle && chatStyle && state.selectedChatId) saveChatStyle.addEventListener('click', async () => {
    try {
      const result = await backend('telegram_set_chat_style', { chat_id: state.selectedChatId, reply_style: chatStyle.value });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось сохранить стиль чата.');
      if (chatStyle.value === 'default') delete state.chatReplyStyles[state.selectedChatId];
      else state.chatReplyStyles[state.selectedChatId] = chatStyle.value;
      setMessage('Индивидуальный стиль чата сохранён.');
    } catch (error) { setMessage(error.message || 'Ошибка сохранения стиля чата.', true); }
    render();
  });
  const memoryInput = container.querySelector('#chat-memory');
  const saveMemory = container.querySelector('#save-chat-memory');
  if (memoryInput) memoryInput.addEventListener('input', () => { state.chatMemoryDraft = memoryInput.value; });
  if (saveMemory && memoryInput) saveMemory.addEventListener('click', async () => {
    try {
      const result = await backend('telegram_set_chat_memory', { chat_id: state.selectedChatId, memory: memoryInput.value });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось сохранить память чата.');
      if (memoryInput.value.trim()) state.chatMemories[state.selectedChatId] = memoryInput.value.trim();
      else delete state.chatMemories[state.selectedChatId];
      setMessage('Память выбранного чата сохранена.');
    } catch (error) { setMessage(error.message || 'Ошибка сохранения памяти.', true); }
    render();
  });

  // Голосовой помощник входящих сообщений.
  const toggleAssistant = container.querySelector('#toggle-message-assistant');
  if (toggleAssistant) toggleAssistant.addEventListener('click', () => setMessageAssistantEnabled(!state.messageAssistantEnabled));
  container.querySelectorAll('[data-reply-mode]').forEach(button => {
    button.addEventListener('click', async () => {
      const mode = button.dataset.replyMode;
      if (!['confirm', 'automatic', 'hybrid'].includes(mode) || state.busy) return;
      state.replyMode = mode;
      render();
      if (mode === 'hybrid') await loadAutomationChats();
    });
  });
  container.querySelectorAll('[data-auto-chat-id]').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.dataset.autoChatId;
      if (input.checked && !state.autoReplyChatIds.includes(id)) state.autoReplyChatIds.push(id);
      if (!input.checked) state.autoReplyChatIds = state.autoReplyChatIds.filter(value => value !== id);
    });
  });
  const refreshAutomationChats = container.querySelector('#refresh-automation-chats');
  if (refreshAutomationChats) refreshAutomationChats.addEventListener('click', () => loadAutomationChats(true));
  const scheduleEnabled = container.querySelector('#schedule-enabled');
  if (scheduleEnabled) scheduleEnabled.addEventListener('change', () => { state.scheduleEnabled = scheduleEnabled.checked; });
  const scheduleStart = container.querySelector('#schedule-start');
  const scheduleEnd = container.querySelector('#schedule-end');
  if (scheduleStart) scheduleStart.addEventListener('change', () => { state.scheduleStart = scheduleStart.value; });
  if (scheduleEnd) scheduleEnd.addEventListener('change', () => { state.scheduleEnd = scheduleEnd.value; });
  container.querySelectorAll('[data-schedule-day]').forEach(input => input.addEventListener('change', () => {
    state.scheduleDays = [...container.querySelectorAll('[data-schedule-day]:checked')].map(el => Number(el.dataset.scheduleDay));
  }));
  const saveSpeechProvider = container.querySelector('#save-speech-provider');
  if (saveSpeechProvider) saveSpeechProvider.addEventListener('click', async () => {
    const get = id => container.querySelector(id)?.value || '';
    try {
      const result = await backend('telegram_voice_save_provider', {
        base_url: get('#speech-base-url'), stt_model: get('#speech-stt-model'),
        tts_model: get('#speech-tts-model'), tts_voice: get('#speech-tts-voice'),
        language: get('#speech-language'), api_key: get('#speech-api-key')
      });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось сохранить настройки STT/TTS.');
      state.voiceProvider = { ...state.voiceProvider, ...result };
      setMessage('Настройки голосового провайдера сохранены.');
    } catch (error) { setMessage(error.message || 'Ошибка сохранения провайдера.', true); }
    render();
  });
  const refreshSpeechProvider = container.querySelector('#refresh-speech-provider');
  if (refreshSpeechProvider) refreshSpeechProvider.addEventListener('click', loadSpeechProviderStatus);
  const testSpeechProvider = container.querySelector('#test-speech-provider');
  if (testSpeechProvider) testSpeechProvider.addEventListener('click', async () => {
    const text = container.querySelector('#voice-test-text')?.value || '';
    state.voiceTestText = text;
    try {
      const result = await backend('telegram_voice_test_tts', { text });
      if (result.status !== 'ok') throw new Error(result.message || 'Не удалось проверить TTS.');
      state.voiceTestAudio = result.audio_base64 || null;
      setMessage(`TTS сгенерировал OGG/Opus: ${result.size} байт, около ${result.duration} сек.${result.preview_available ? ' Прослушай тест ниже.' : ' Файл слишком велик для предпросмотра в интерфейсе.'}`);
    } catch (error) { setMessage(error.message || 'Ошибка TTS.', true); }
    render();
  });
  const voiceTest = container.querySelector('#voice-test');
  if (voiceTest) voiceTest.addEventListener('click', async () => {
    const text = container.querySelector('#voice-test-text')?.value || '';
    state.voiceTestText = text;
    try {
      const result = await backend('telegram_speak_astra', { text });
      if (result.status !== 'ok') throw new Error(result.message || 'Голосовой движок Astra недоступен.');
      setMessage(result.message || 'Запрос передан голосовому движку Astra.');
    } catch (error) { setMessage(error.message || 'Ошибка голосового движка.', true); }
    render();
  });
  const voiceStop = container.querySelector('#voice-stop');
  if (voiceStop) voiceStop.addEventListener('click', async () => {
    try { const result = await backend('telegram_stop_astra_speech', {}); if (result.status !== 'ok') throw new Error(result.message || 'Не удалось остановить голос.'); setMessage('Озвучивание остановлено.'); }
    catch (error) { setMessage(error.message || 'Ошибка остановки голоса.', true); }
    render();
  });
  const saveAutomation = container.querySelector('#save-automation-settings');
  if (saveAutomation) saveAutomation.addEventListener('click', saveAutomationSettings);
  const replyDraft = container.querySelector('#reply-draft');
  if (replyDraft) replyDraft.addEventListener('input', event => { state.replyDraft = event.target.value; });
  const sendReplyButton = container.querySelector('#confirm-send-reply');
  if (sendReplyButton) sendReplyButton.addEventListener('click', confirmSendReply);
  const dismissIncoming = container.querySelector('#dismiss-incoming');
  if (dismissIncoming) dismissIncoming.addEventListener('click', () => { state.incomingPrompt = null; state.replyDraft = ''; render(); });

  container.querySelectorAll('[data-play-voice]').forEach(button => {
    button.addEventListener('click', () => playVoiceMessage(button.dataset.playVoice));
  });
  container.querySelectorAll('[data-transcribe-voice]').forEach(button => {
    button.addEventListener('click', async () => {
      const messageId = Number(button.dataset.transcribeVoice);
      if (!state.selectedChatId || !messageId || state.voiceTranscribingId !== null) return;
      state.voiceTranscribingId = messageId; render();
      try {
        setMessage('Распознавание голосовых штатным API Astra пока недоступно. Отправь текстовое сообщение.', true);
      } finally { state.voiceTranscribingId = null; render(); }
    });
  });

  // Telegram: список диалогов, история и отправка текста.
  const refreshChats = container.querySelector('#refresh-chats');
  if (refreshChats) refreshChats.addEventListener('click', loadDialogs);

  container.querySelectorAll('[data-chat-id]').forEach(button => {
    button.addEventListener('click', async () => {
      state.selectedChatId = button.dataset.chatId;
      state.voiceAudio = null;
      state.chatMessages = [];
      state.chatDraft = '';
      state.messageSearch = '';
      render();
      await loadChatHistory();
    });
  });

  const refreshHistory = container.querySelector('#refresh-history');
  if (refreshHistory) refreshHistory.addEventListener('click', loadChatHistory);

  const messageList = container.querySelector('#message-list');
  if (messageList) messageList.addEventListener('scroll', updateJumpLatestButton, { passive: true });
  const jumpLatest = container.querySelector('#jump-latest');
  if (jumpLatest) jumpLatest.addEventListener('click', () => {
    const list = container.querySelector('#message-list');
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  });
  const messageSearch = container.querySelector('#message-search');
  if (messageSearch) messageSearch.addEventListener('input', event => {
    state.messageSearch = event.target.value;
    const caret = event.target.selectionStart || state.messageSearch.length;
    const position = container.querySelector('#message-list')?.scrollTop || 0;
    render();
    const list = container.querySelector('#message-list');
    if (list) list.scrollTop = position;
    const nextSearch = container.querySelector('#message-search');
    if (nextSearch) { nextSearch.focus(); nextSearch.setSelectionRange(caret, caret); }
  });
  const clearMessageSearch = container.querySelector('#clear-message-search');
  if (clearMessageSearch) clearMessageSearch.addEventListener('click', () => { state.messageSearch = ''; render(); });
  container.querySelectorAll('[data-copy-message]').forEach(button => button.addEventListener('click', async () => {
    const text = button.dataset.copyMessage || '';
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Текст сообщения скопирован.');
    } catch (_) {
      const field = document.createElement('textarea');
      field.value = text;
      container.appendChild(field);
      field.select();
      try { document.execCommand('copy'); setMessage('Текст сообщения скопирован.'); }
      catch (_) { setMessage('Не удалось скопировать текст.', true); }
      field.remove();
    }
    render();
  }));
  container.querySelectorAll('[data-reply-message]').forEach(button => button.addEventListener('click', () => {
    const quote = (button.dataset.replyMessage || '').split('\n').map(line => `> ${line}`).join('\n');
    state.chatDraft = `${quote}\n\n`;
    render();
    container.querySelector('#chat-draft')?.focus();
  }));

  const draftInput = container.querySelector('#chat-draft');
  if (draftInput) draftInput.addEventListener('input', event => { state.chatDraft = event.target.value; });

  const sendButton = container.querySelector('#send-chat-message');
  if (sendButton) sendButton.addEventListener('click', sendChatMessage);
  const sendVoiceButton = container.querySelector('#send-chat-voice');
  if (sendVoiceButton) sendVoiceButton.addEventListener('click', async () => {
    const text = container.querySelector('#chat-draft')?.value || state.chatDraft;
    if (!state.selectedChatId || !text.trim() || state.chatBusy) return;
    state.chatBusy = true; setMessage('Передаём текст штатному голосу Astra…'); render();
    try {
      const result = await backend('telegram_speak_astra', { text });
      if (result.status !== 'ok') throw new Error(result.message || 'Голосовой движок Astra недоступен.');
      setMessage('Текст озвучивается штатным голосом Astra на этом компьютере. В Telegram голосовой файл не отправляется.');
    } catch (error) { setMessage(error.message || 'Ошибка голосового движка.', true); }
    finally { state.chatBusy = false; render(); }
  });
  if (draftInput) draftInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendChatMessage(); }
  });

  const openConnection = container.querySelector('#open-connection');
  if (openConnection) {
    openConnection.addEventListener('click', () => {
      stopQrPolling();
      state.activeTab = 'settings';
      state.authStep = 'phone';
      setMessage('');
      render();
	loadAppSettings();
    });
  }

  const backHome = container.querySelector('#back-home');
  if (backHome) {
    backHome.addEventListener('click', () => {
      stopQrPolling();
      state.activeTab = 'home';
      render();
    });
  }

  const backPhone = container.querySelector('#back-phone');
  if (backPhone) {
    backPhone.addEventListener('click', () => {
      stopQrPolling();
      state.authStep = 'phone';
      state.qrSvg = '';
      state.qrExpiresAt = 0;
      state.qrRemaining = 0;
      state.code = '';
      state.password = '';
      state.hint = '';
      setMessage('');
      render();
    });
  }

  const phoneInput = container.querySelector('#phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', event => {
      state.phone = event.target.value;
    });
  }

  const codeInput = container.querySelector('#code');
  if (codeInput) {
    codeInput.addEventListener('input', event => {
      state.code = event.target.value;
    });
  }

  const requestButton = container.querySelector('#request-code');
  if (requestButton) {
    requestButton.addEventListener('click', requestCode);
  }

  const startQrButton = container.querySelector('#start-qr');
  if (startQrButton) {
    startQrButton.addEventListener('click', startQrLogin);
  }

  const refreshQrButton = container.querySelector('#refresh-qr');
  if (refreshQrButton) {
    refreshQrButton.addEventListener('click', startQrLogin);
  }

  const codeButton = container.querySelector('#submit-code');
  if (codeButton) {
    codeButton.addEventListener('click', submitCode);
  }

  const passwordInput = container.querySelector('#password');
  if (passwordInput) {
    passwordInput.addEventListener('input', event => {
      state.password = event.target.value;
    });
  }

  const passwordButton = container.querySelector('#submit-password');
  if (passwordButton) {
    passwordButton.addEventListener('click', submitPassword);
  }

  const disconnectButton = container.querySelector('#disconnect-account');
  if (disconnectButton) {
    disconnectButton.addEventListener('click', () => {
      state.confirmDisconnect = true;
      render();
    });
  }

  const confirmDisconnectButton =
    container.querySelector('#confirm-disconnect');

  if (confirmDisconnectButton) {
    confirmDisconnectButton.addEventListener('click', disconnectAccount);
  }

  const cancelDisconnectButton =
    container.querySelector('#cancel-disconnect');

  if (cancelDisconnectButton) {
    cancelDisconnectButton.addEventListener('click', () => {
      state.confirmDisconnect = false;
      render();
    });
  }
}



async function startQrLogin() {
  stopQrPolling();

  state.authStep = 'qr';
  state.qrSvg = '';
  state.qrExpiresAt = 0;
  state.qrRemaining = 0;
  state.busy = true;

  setMessage('Создаём QR-код Telegram…');
  render();

  try {
    const result = await backend('telegram_qr_start', {});

    if (result.status === 'authorized') {
      state.connection = 'authorized';
      state.activeTab = 'home';
      setMessage(result.message || 'Telegram подключён.');
      return;
    }

    if (result.status !== 'qr_ready' || !result.qr_svg) {
      throw new Error(result.message || 'Не удалось создать QR-код.');
    }

    state.qrSvg = result.qr_svg;
    state.qrExpiresAt = Date.now() + (Number(result.expires_in) || 0) * 1000;
    state.qrRemaining = Math.max(
      0,
      Math.ceil((state.qrExpiresAt - Date.now()) / 1000)
    );

    state.connection = 'connecting';
    state.qrPolling = true;
    setMessage('Отсканируй QR-код в приложении Telegram.');

    qrCountdownTimer = setInterval(() => {
      if (!state.qrPolling) return;

      state.qrRemaining = Math.max(
        0,
        Math.ceil((state.qrExpiresAt - Date.now()) / 1000)
      );

      render();
    }, 1000);

    qrPollTimer = setInterval(pollQrLogin, 2000);
  } catch (error) {
    stopQrPolling();
    setMessage(error.message || 'Ошибка создания QR-кода.', true);
  } finally {
    state.busy = false;
    render();
  }
}

async function pollQrLogin() {
  if (qrPollInFlight || !state.qrPolling) return;

  qrPollInFlight = true;

  try {
    const result = await backend('telegram_qr_poll', {});

    if (result.status === 'authorized') {
      stopQrPolling();

      state.connection = 'authorized';
      state.activeTab = 'home';
      state.authStep = 'phone';
      state.qrSvg = '';
      state.qrRemaining = 0;

      setMessage(result.message || 'Telegram успешно подключён.');
      render();
      return;
    }

    if (result.status === 'qr_ready' && result.qr_svg) {
      if (result.qr_svg !== state.qrSvg) {
        state.qrSvg = result.qr_svg;
      }

      if (Number(result.expires_in) > 0) {
        state.qrExpiresAt =
          Date.now() + Number(result.expires_in) * 1000;
      }
    }

if (result.status === 'expired') {
  stopQrPolling();
  state.qrSvg = '';
  state.qrExpiresAt = 0;
  state.qrRemaining = 0;
  setMessage('QR-код истёк. Создаём новый…');
  render();
  await startQrLogin();
  return;
}

    state.qrRemaining = Math.max(
      0,
      Math.ceil((state.qrExpiresAt - Date.now()) / 1000)
    );
  } catch (error) {
    setMessage(
      error.message || 'Не удалось проверить состояние QR-входа.',
      true
    );
  } finally {
    qrPollInFlight = false;
    if (state.qrPolling) render();
  }
}
 
  async function requestCode() {
    if (!state.phone.trim()) {
      setMessage('Введи номер телефона в международном формате.', true);
      render();
      return;
    }

    state.busy = true;
    state.connection = 'connecting';
    setMessage('Подготавливаем соединение с Telegram…');
    render();

    try {
      const connection = await backend('telegram_connect', {});

      if (!['ready', 'authorized'].includes(connection.status)) {
        throw new Error(connection.message || 'Не удалось подключиться.');
      }

      if (connection.status === 'authorized') {
        state.connection = 'authorized';
        state.activeTab = 'home';
        setMessage(connection.message);
        render();
        return;
      }

      setMessage('Запрашиваем код Telegram…');
      render();

      const result = await backend('telegram_request_code', {
        phone: state.phone.trim()
      });

      if (result.status === 'code_sent') {
        state.connection = 'connected';
        state.authStep = 'code';
        setMessage(result.message);
      } else if (result.status === 'authorized') {
        state.connection = 'authorized';
        state.activeTab = 'home';
        setMessage(result.message);
      } else {
        setMessage(result.message || 'Не удалось запросить код.', true);
      }
    } catch (error) {
      state.connection = 'idle';
      setMessage(error.message || 'Ошибка подключения.', true);
    } finally {
      state.busy = false;
      render();
    }
  }


  async function submitCode() {
    if (!state.code.trim()) {
      setMessage('Введи код подтверждения.', true);
      render();
      return;
    }

    state.busy = true;
    setMessage('Проверяем код…');
    render();

    try {
      const result = await backend('telegram_sign_in', {
        code: state.code.trim()
      });

      if (result.status === 'authorized') {
        state.connection = 'authorized';
        state.activeTab = 'home';
        setMessage(result.message);
      } else if (result.status === 'password_required') {
        state.authStep = 'password';
        state.hint = result.hint || '';
        state.password = '';
        setMessage(result.message);
      } else {
        setMessage(result.message || 'Не удалось проверить код.', true);
      }
    } catch (error) {
      setMessage(error.message || 'Ошибка проверки кода.', true);
    } finally {
      state.busy = false;
      render();
    }
  }

  async function submitPassword() {
    const password = state.password;

    if (!password) {
      setMessage('Введи пароль двухэтапной защиты.', true);
      render();
      return;
    }

    state.busy = true;
    setMessage('Проверяем пароль 2FA…');
    render();

    try {
      const result = await backend('telegram_check_password', { password });

      // Убираем пароль из состояния сразу после ответа сервера.
      state.password = '';

      if (result.status === 'authorized') {
        state.connection = 'authorized';
        state.activeTab = 'home';
        setMessage(result.message);
      } else {
        setMessage(result.message || 'Не удалось проверить пароль.', true);
      }
    } catch (error) {
      state.password = '';
      setMessage(error.message || 'Ошибка проверки пароля.', true);
    } finally {
      state.busy = false;
      render();
    }
  }

  async function disconnectAccount() {
    state.busy = true;
    setMessage('Завершаем сеанс Telegram…');
    render();

    try {
      const result = await backend('telegram_disconnect', {});

      if (result.status === 'disconnected') {
        state.confirmDisconnect = false;
        state.connection = 'idle';
        state.authStep = 'phone';
        state.phone = '';
        state.code = '';
        state.password = '';
        state.hint = '';
        setMessage(result.message);
      } else {
        setMessage(
          result.message || 'Не удалось отключить Telegram.',
          true
        );
      }
    } catch (error) {
      setMessage(error.message || 'Ошибка отключения Telegram.', true);
    } finally {
      state.busy = false;
      render();
    }
  }

  render();
  loadAppSettings();
  loadSpeechProviderStatus();
  startConnectionStatusPolling();

window.addEventListener('pagehide', () => {
  stopQrPolling();
  if (notificationPollTimer) clearInterval(notificationPollTimer);
  if (connectionPollTimer) clearInterval(connectionPollTimer);

  if (root) root.unmount();
}, { once: true });

} catch (error) {
  container.textContent =
    'Не удалось загрузить интерфейс Astra. ' + error.message;
}
